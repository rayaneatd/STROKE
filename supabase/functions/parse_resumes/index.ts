import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { extractText, getDocumentProxy } from "npm:unpdf@1.0.0";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CONCURRENCY_LIMIT = 5;

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Nettoyage agressif des hallucinations IA sur du Mistral OCR
function cleanOcrGarbage(text: string): string {
    let clean = text;
    // Supprime les suites du type "000000" ou "11111"
    clean = clean.replace(/(?:Over\s*)?(?:1\d*|0)(?:[,. \n]*0)+\b/gi, (match) => {
        if (match.length > 20) return '';
        return match;
    });
    clean = clean.replace(/0{10,}/g, '');
    clean = clean.replace(/(?:1\.000|100,000,000)/g, '');
    // Nettoie les lignes vides
    clean = clean.split('\n').filter((line: string) => line.trim().length > 0).join('\n');
    return clean;
}

/**
 * Segmentation des PDFs "trop longs" (images d'une seule page super haute)
 * Découpe la page en sections format A4 pour éviter que Mistral Vision n'hallucine !
 */
async function formatPdfForOcr(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pages = pdfDoc.getPages();
    let hasModifications = false;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const ratio = height / width;

        if (ratio > 1.8) {
            hasModifications = true;
            const TARGET_RATIO = 1.41; // Standard A4 ratio
            const h = width * TARGET_RATIO;
            const OVERLAP = 100; // Overlap en points pour ne pas couper le texte

            let y_top = height;

            while (y_top > 0) {
                let y_bottom = y_top - h;
                if (y_bottom < 0) {
                    y_bottom = 0;
                }

                // Embed la grande page comme image
                const embeddedPage = await newPdf.embedPage(page);

                // Crée une page au bon ratio (hauteur standard max)
                const newPage = newPdf.addPage([width, h]);

                // Dessine uniquement une "fenêtre" de la grande page
                newPage.drawPage(embeddedPage, {
                    x: 0,
                    y: -y_bottom,
                    width: width,
                    height: height,
                });

                y_top = y_bottom + OVERLAP;
                if (y_bottom <= 0) break;
            }
        } else {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
        }
    }

    if (!hasModifications) return arrayBuffer; // Renvoie tel quel si pas de pages bizarres

    return await newPdf.save();
}

/**
 * Fallback AI OCR (Mistral)
 */
async function callMistralOcrWithRetry(base64: string, mistralKey: string, fileName: string): Promise<string> {
    let attempt = 0;
    while (true) {
        attempt++;
        const resp = await fetch("https://api.mistral.ai/v1/ocr", {
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

        if (resp.status === 429) {
            console.warn(`⏳ [RATE LIMIT OCR] ${fileName} (tentative ${attempt}) — attente 1.1s...`);
            await new Promise(resolve => setTimeout(resolve, 1100));
            continue;
        }

        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error(`Mistral OCR erreur ${resp.status}: ${errBody.substring(0, 300)}`);
        }

        const data = await resp.json();
        return data.pages?.map((p: any) => p.markdown || "").join("\n") ?? "";
    }
}

/**
 * Extraction NATIVE ultra-fiable et instantanée via unpdf
 * Conçu spécifiquement pour les Edge Functions
 */
async function extractTextNatively(arrayBuffer: ArrayBuffer, fileName: string): Promise<string> {
    try {
        const buffer = new Uint8Array(arrayBuffer);
        const pdf = await getDocumentProxy(buffer);
        const { text } = await extractText(pdf, { mergePages: true });
        return text || "";
    } catch (e: any) {
        throw new Error(`Extraction native unpdf échouée: ${e.message}`);
    }
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
        const authHeader = req.headers.get('Authorization');

        if (warm_up || !files || files.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "Warmed up / No files" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`📥 parse_resumes: ${files.length} fichiers (HYBRID MODE + SPLIT OVERSIGHT)`);

        const hashes = files.map((f: any) => f.hash).filter(Boolean);
        let existingHashesSet = new Set<string>();

        if (hashes.length > 0) {
            const { data, error } = await supabase.from('resume_texts').select('file_hash').in('file_hash', hashes);
            if (!error) existingHashesSet = new Set(data?.map((t: any) => t.file_hash) ?? []);
        }

        const filesToParse = files.filter((f: any) => f.hash && !existingHashesSet.has(f.hash));

        if (filesToParse.length === 0) {
            await supabase.functions.invoke('scan_resumes', {
                body: { project_id, files },
                headers: authHeader ? { Authorization: authHeader } : undefined
            });
            return new Response(JSON.stringify({ message: "Déjà parsés" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const mistralKey = Deno.env.get("MISTRAL_API_KEY");
        const results: any[] = [];

        for (let i = 0; i < filesToParse.length; i += CONCURRENCY_LIMIT) {
            const chunk = filesToParse.slice(i, i + CONCURRENCY_LIMIT);

            const chunkResults = await Promise.all(chunk.map(async (file: any) => {
                let cleanText = "";
                let parseStatus: 'PENDING' | 'FAILED' = 'FAILED';

                try {
                    const { data: blob, error: dlError } = await supabase.storage.from('resumes').download(file.path);
                    if (dlError) throw new Error(`Download échoué: ${dlError.message}`);

                    const arrayBuffer = await blob.arrayBuffer();
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("Fichier vide");

                    let isNativeSuccess = false;

                    // --- STRATÉGIE 1 : Extraction Native avec unpdf ---
                    try {
                        console.log(`🔍 [1. NATIVE EXTRACT] ${file.name}...`);
                        const textData = await extractTextNatively(arrayBuffer, file.name);

                        // Si le texte fait plus de 200 caractères, on valide l'extraction
                        if (textData.trim().length > 200) {
                            cleanText = textData.trim();
                            isNativeSuccess = true;
                            parseStatus = 'PENDING';
                            console.log(`✅ [NATIVE SUCCESS] ${file.name}: ${cleanText.length} chars. (Pas besoin d'IA)`);
                        } else {
                            console.log(`⚠️ [NATIVE INCOMPLET] Texte trop court (${textData.length} chars). Passage à l'OCR Mistral...`);
                        }
                    } catch (nativeErr: any) {
                        console.error(`⚠️ [NATIVE ERROR] pour ${file.name}: ${nativeErr.message}`);
                    }

                    // --- STRATÉGIE 2 : Fallback IA Mistral OCR avec Splitter pour les PDFs immenses ---
                    if (!isNativeSuccess) {
                        if (!mistralKey) throw new Error("MISTRAL_API_KEY manquante pour le fallback OCR");
                        console.log(`🤖 [2. OCR FALLBACK] Formatage et Envoi à Mistral OCR pour ${file.name}...`);

                        // 1. Reformater le PDF si c'est une très longue tapisserie
                        const formattedPdfBuffer = await formatPdfForOcr(arrayBuffer);

                        // 2. Base64
                        const base64 = arrayBufferToBase64(formattedPdfBuffer);

                        // 3. OCR avec retry infini
                        let extractedText = await callMistralOcrWithRetry(base64, mistralKey, file.name);
                        extractedText = cleanOcrGarbage(extractedText);

                        if (extractedText.length > 50) {
                            console.log(`✅ [OCR SUCCESS] ${file.name}: ${extractedText.length} chars extraits avec succès.`);
                            cleanText = extractedText.trim();
                            parseStatus = 'PENDING';
                        } else {
                            throw new Error("L'OCR a retourné un texte vide ou corrompu malgré le formatage.");
                        }
                    }

                } catch (err: any) {
                    console.error(`❌ [ERREUR GLOBALE] ${file.name}:`, err.message);
                }

                return { file_hash: file.hash, raw_text: cleanText || null, status: parseStatus };
            }));

            results.push(...chunkResults);
        }

        if (results.length > 0) {
            await supabase.from('resume_texts').upsert(results, { onConflict: 'file_hash' });
        }

        const scanBatches: any[][] = [];
        for (let i = 0; i < files.length; i += 3) scanBatches.push(files.slice(i, i + 3));

        const triggerScans = async () => {
            await Promise.all(scanBatches.map(async (batch) => {
                await supabase.functions.invoke('scan_resumes', {
                    body: { project_id, files: batch },
                    headers: authHeader ? { Authorization: authHeader } : undefined
                }).catch(e => console.error("Erreur invoke scan_resumes", e.message));
            }));
        };

        // @ts-ignore
        if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(triggerScans());
        else triggerScans();

        return new Response(JSON.stringify({ success: true, parsed: results.length }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Erreur globale:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});