import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs";
import "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CONCURRENCY_LIMIT = 5;

// Helper to convert ArrayBuffer to Base64 safely in Deno
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

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
                existingHashesSet = new Set(existingTexts?.map(t => (t as any).file_hash) ?? []);
            }
        }

        const filesToParse = files.filter((f: any) => f.hash && !existingHashesSet.has(f.hash));
        console.log(`Déjà parsés: ${existingHashesSet.size} | À parser: ${filesToParse.length}`);

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

        // --- ÉTAPE 2 : Parsing PDF avec fallback Mistral OCR (Promise.all) ---
        const results: any[] = [];
        const mistralKey = Deno.env.get("MISTRAL_API_KEY");

        for (let i = 0; i < filesToParse.length; i += CONCURRENCY_LIMIT) {
            const chunk = filesToParse.slice(i, i + CONCURRENCY_LIMIT);

            const chunkResults = await Promise.all(chunk.map(async (file: any) => {
                let cleanText = "";
                let arrayBuffer: ArrayBuffer | null = null;
                let parseStatus: 'PENDING' | 'FAILED' = 'FAILED';

                try {
                    // 1. Download file
                    const { data: blob, error: dlError } = await supabase.storage
                        .from('resumes')
                        .download(file.path);

                    if (dlError) throw dlError;

                    arrayBuffer = await blob.arrayBuffer();
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("Empty file");

                    // 2. Try PDF.js Extraction
                    try {
                        const pdfData = new Uint8Array(arrayBuffer);
                        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                        const pdfDocument = await loadingTask.promise;

                        let fullText = "";
                        for (let p = 1; p <= pdfDocument.numPages; p++) {
                            const page = await pdfDocument.getPage(p);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
                            fullText += pageText + "\n";
                        }
                        cleanText = fullText.replace(/\0/g, '').trim();
                    } catch (pdfErr: any) {
                        console.warn(`[PDF.js] ${file.name} failed: ${pdfErr.message}`);
                    }

                    // 3. Fallback: Mistral OCR
                    if (cleanText.length < 100 && mistralKey && arrayBuffer) {
                        console.log(`🌀 [MISTRAL OCR] ${file.name} - Processing scanné...`);

                        try {
                            const base64 = arrayBufferToBase64(arrayBuffer);

                            const mistralResp = await fetch("https://api.mistral.ai/v1/ocr", {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${mistralKey}`
                                },
                                body: JSON.stringify({
                                    model: "mistral-ocr-latest",
                                    document: {
                                        type: "document_url",
                                        document_url: `data:application/pdf;base64,${base64}`
                                    }
                                })
                            });

                            if (!mistralResp.ok) {
                                const errBody = await mistralResp.text();
                                throw new Error(`Mistral API error ${mistralResp.status}: ${errBody}`);
                            }

                            const mistralData = await mistralResp.json();
                            // Handle Mistral OCR response structure (pages -> markdown content)
                            const fullOcrText = mistralData.pages?.map((p: any) => p.markdown || "").join("\n");

                            if (fullOcrText) {
                                console.log(`✅ [OCR SUCCESS] ${file.name}: ${fullOcrText.length} characters`);
                                cleanText = fullOcrText.trim();
                            } else {
                                console.warn(`⚠️ [OCR EMPTY] Mistral returned no text for ${file.name}`);
                            }
                        } catch (ocrErr: any) {
                            console.error(`❌ [MISTRAL ERROR] ${file.name}:`, ocrErr.message);
                        }
                    }

                    if (cleanText.trim().length > 20) {
                        parseStatus = 'PENDING';
                    } else {
                        console.warn(`⚠️ [PARSE FAILED] ${file.name}: Text too short.`);
                    }

                } catch (err: any) {
                    console.error(`❌ [GLOBAL ERROR] ${file.name}:`, err.message);
                }

                return {
                    file_hash: file.hash,
                    raw_text: cleanText || null,
                    status: parseStatus
                };
            }));

            results.push(...chunkResults);
        }

        // --- ÉTAPE 3 : Upsert ---
        if (results.length > 0) {
            await supabase.from('resume_texts').upsert(results, { onConflict: 'file_hash' });
            console.log(`💾 ${results.length} textes synchronisés.`);
        }

        // --- ÉTAPE 4 : Dispatch Parallèle vers scan_resumes (1 instance par 3 CV) ---
        // On découpe la liste totale des fichiers reçus (même ceux déjà parsés) par paquets de 3
        // pour forcer Supabase à ouvrir plusieurs instances de scanneur en parallèle.
        const scanBatches: any[][] = [];
        const SCAN_BATCH_SIZE = 3;
        for (let i = 0; i < files.length; i += SCAN_BATCH_SIZE) {
            scanBatches.push(files.slice(i, i + SCAN_BATCH_SIZE));
        }

        console.log(`🚀 Dispatching ${scanBatches.length} parallel scan instances (3 CVs each)...`);

        const triggerScans = async () => {
            await Promise.all(scanBatches.map(async (batch) => {
                try {
                    const { error: scanErr } = await supabase.functions.invoke('scan_resumes', {
                        body: { project_id, files: batch }
                    });
                    if (scanErr) console.error(`[parse_resumes] Error triggering scan batch:`, scanErr.message);
                } catch (e: any) {
                    console.error(`[parse_resumes] Exception triggering scan batch:`, e.message);
                }
            }));
        };

        // @ts-ignore
        if (typeof EdgeRuntime !== 'undefined') {
            // @ts-ignore
            EdgeRuntime.waitUntil(triggerScans());
        } else {
            // Fallback for local dev or environments without EdgeRuntime
            triggerScans();
        }

        return new Response(JSON.stringify({ success: true, parsed: results.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
