import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs";
import "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CONCURRENCY_LIMIT = 3; // Burst size for parallel processing

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
        const { files, project_id, warm_up } = payload;

        if (warm_up) {
            console.log("[parse_resumes] Warm-up signal received.");
            return new Response(JSON.stringify({ success: true, message: "Warmed up" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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

        // --- ÉTAPE 2 : Parsing PDF avec concurrence par burst (Promise.all) ---
        const results: any[] = [];
        const mindeeKey = Deno.env.get("MINDEE_KEY");

        // Processing in chunks of 3 to avoid timeouts and resource exhaustion
        for (let i = 0; i < filesToParse.length; i += CONCURRENCY_LIMIT) {
            const chunk = filesToParse.slice(i, i + CONCURRENCY_LIMIT);
            console.log(`🚀 Burst processing chunk: ${i / CONCURRENCY_LIMIT + 1} (${chunk.length} files)`);

            const chunkResults = await Promise.all(chunk.map(async (file: any) => {
                let fullText = "";
                let arrayBuffer: ArrayBuffer | null = null;

                try {
                    // Téléchargement depuis le bucket
                    const { data: blob, error: dlError } = await supabase.storage
                        .from('resumes')
                        .download(file.path);
                    if (dlError) throw dlError;

                    // Conversion Buffer + parsing PDF avec pdfjs-dist
                    arrayBuffer = await blob.arrayBuffer();
                    if (!arrayBuffer) throw new Error("ArrayBuffer is null");
                    const pdfData = new Uint8Array(arrayBuffer);

                    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                    const pdfDocument = await loadingTask.promise;

                    for (let p = 1; p <= pdfDocument.numPages; p++) {
                        const page = await pdfDocument.getPage(p);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(" ");
                        fullText += pageText + "\n";
                    }

                    let cleanText = fullText.replace(/\0/g, '').trim();

                    // --- FALLBACK MINDEE OCR (si < 200 chars) ---
                    if (cleanText.length < 200 && mindeeKey && arrayBuffer) {
                        console.log(`🕵️ [OCR] ${file.name} is low text (${cleanText.length} chars). Calling Mindee...`);
                        try {
                            const formData = new FormData();
                            const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
                            formData.append('document', pdfBlob, file.name || 'resume.pdf');

                            const mindeeResp = await fetch('https://api.mindee.net/v1/products/mindee/resume/v1/predict', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Token ${mindeeKey}`,
                                    'X-Mindee-Features': JSON.stringify({ "full_text_ocr": { "active": true } })
                                },
                                body: formData
                            });

                            if (mindeeResp.ok) {
                                const mindeeJson = await mindeeResp.json();
                                let ocrText = "";
                                const pages = mindeeJson.document?.inference?.pages || [];
                                for (const page of pages) {
                                    if (page.extras?.full_text_ocr?.content) {
                                        ocrText += page.extras.full_text_ocr.content + "\n";
                                    }
                                }

                                if (ocrText.trim()) {
                                    console.log(`✅ [OCR SUCCESS] ${file.name}: Added ${ocrText.length} chars from Mindee`);
                                    cleanText = (cleanText + "\n" + ocrText).trim();
                                }
                            } else {
                                console.error(`❌ [OCR ERROR] Mindee status ${mindeeResp.status} for ${file.name}`);
                            }
                        } catch (ocrErr: any) {
                            console.error(`❌ [OCR ERROR] ${file.name}:`, ocrErr.message);
                        }
                    }

                    return {
                        file_hash: file.hash,
                        raw_text: cleanText || null,
                        status: cleanText ? 'PENDING' : 'FAILED'
                    };

                } catch (err: any) {
                    console.error(`❌ Échec parsing ${file.name}:`, err.message);
                    return {
                        file_hash: file.hash,
                        raw_text: null,
                        status: 'FAILED'
                    };
                }
            }));

            results.push(...chunkResults);
        }

        // --- ÉTAPE 3 : Upsert dans resume_texts ---
        if (results.length > 0) {
            const { error: insertError } = await supabase
                .from('resume_texts')
                .upsert(results, { onConflict: 'file_hash' });

            if (insertError) {
                console.error("Erreur insertion resume_texts:", insertError.message);
            } else {
                console.log(`💾 ${results.length} textes insérés dans resume_texts`);
            }
        }

        // --- ÉTAPE 4 : Dispatch vers scan_resumes ---
        console.log("Dispatch vers scan_resumes...");
        const { error: scanErr } = await supabase.functions.invoke('scan_resumes', {
            body: { project_id, files }
        });
        if (scanErr) console.error("Erreur invocation scan_resumes:", scanErr.message);

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
