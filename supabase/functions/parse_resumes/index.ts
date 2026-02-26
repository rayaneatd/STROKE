import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs";
import "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs";


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CONCURRENCY_LIMIT = 3; // Reduced from 30 to 3 to prevent memory exhaustion (503 error) with pdf-parse

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json();
        const { files, project_id } = payload;

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ message: "Aucun fichier reçu" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`📥 parse_resumes: ${files.length} fichiers reçus pour projet ${project_id}`);

        // --- ÉTAPE 1 : Filtrage Anti-Doublon via resume_texts (hash) ---
        const hashes = files.map((f: any) => f.hash).filter(Boolean);
        let existingHashesSet = new Set<string>();

        if (hashes.length > 0) {
            const { data: existingTexts, error: dbCheckError } = await supabase
                .from('resume_texts')
                .select('file_hash')
                .in('file_hash', hashes);

            if (dbCheckError) {
                console.warn("Impossible de vérifier les hashes:", dbCheckError.message);
            } else {
                existingHashesSet = new Set(existingTexts?.map(t => t.file_hash) ?? []);
            }
        }

        const filesToParse = files.filter((f: any) => f.hash && !existingHashesSet.has(f.hash));
        console.log(`Déjà parsés: ${existingHashesSet.size} | À parser: ${filesToParse.length}`);

        // Passer directement à scan_resumes si tout est déjà parsé
        if (filesToParse.length === 0) {
            console.log("Tout déjà parsé → dispatch direct vers scan_resumes");
            const { error: scanErr } = await supabase.functions.invoke('scan_resumes', {
                body: { project_id, files }
            });
            if (scanErr) console.error("Erreur invocation scan_resumes:", scanErr.message);
            return new Response(JSON.stringify({ message: "Déjà parsés, dispatch vers Gemini OK", skipped: existingHashesSet.size }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- ÉTAPE 2 : Parsing PDF avec concurrence ---
        const results: any[] = [];
        // Lancement des workers en parallèle via p-limit or manual chunks
        // But since Deno edge functions have strict CPU/Memory limits (e.g. 150MB, small CPU slice),
        // we process the files sequentially in smaller chunks.

        for (const file of filesToParse) {
            try {
                // Téléchargement depuis le bucket
                const { data: blob, error: dlError } = await supabase.storage
                    .from('resumes')
                    .download(file.path);
                if (dlError) throw dlError;

                // Conversion Buffer + parsing PDF avec pdfjs-dist
                const arrayBuffer = await blob.arrayBuffer();
                const pdfData = new Uint8Array(arrayBuffer);

                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdfDocument = await loadingTask.promise;

                let fullText = "";
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    const page = await pdfDocument.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    fullText += pageText + "\n";
                }

                const cleanText = fullText.replace(/\0/g, '').trim();

                results.push({
                    file_hash: file.hash,
                    raw_text: cleanText || null,
                    status: cleanText ? 'PENDING' : 'FAILED'
                });

                console.log(`✅ Parsé: ${file.name} (${cleanText.length} chars)`);

            } catch (err: any) {
                console.error(`❌ Échec parsing ${file.name}:`, err.message);
                results.push({
                    file_hash: file.hash,
                    raw_text: null,
                    status: 'FAILED'
                });
            }
        }

        // --- ÉTAPE 3 : Upsert dans resume_texts ---
        if (results.length > 0) {
            const { error: insertError } = await supabase
                .from('resume_texts')
                .upsert(results, { onConflict: 'file_hash' });

            if (insertError) {
                console.error("Erreur insertion resume_texts:", insertError.message);
                // Ne pas throw, continuer quand même vers scan_resumes
            } else {
                console.log(`💾 ${results.length} textes insérés dans resume_texts`);
            }
        }

        // --- ÉTAPE 4 : Dispatch vers scan_resumes avec tous les fichiers du batch ---
        console.log("Dispatch vers scan_resumes...");
        const { error: scanErr } = await supabase.functions.invoke('scan_resumes', {
            body: { project_id, files }
        });
        if (scanErr) {
            console.error("Erreur invocation scan_resumes:", scanErr.message);
        }

        return new Response(JSON.stringify({
            success: true,
            parsed: results.length,
            skipped: existingHashesSet.size,
            failed: results.filter(r => r.status === 'FAILED').length
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Erreur critique parse_resumes:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
