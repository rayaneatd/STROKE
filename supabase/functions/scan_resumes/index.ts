import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BATCH_SIZE = 1; // Un seul candidat à la fois pour éviter les dépassements de limite de tokens Mercury
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 15000;

// Mercury 2 (Inception) Configuration
const MERCURY_API_KEY = Deno.env.get("MERCURY_API_KEY");
const MERCURY_BASE_URL = "https://api.inceptionlabs.ai/v1";

// Global client variable
let mercuryClient: OpenAI | null = null;

function initMercuryClient() {
    if (mercuryClient) return mercuryClient;

    if (!MERCURY_API_KEY) {
        throw new Error("Missing MERCURY_API_KEY environment variable");
    }

    console.log("[scan_resumes] Initializing Mercury 2 (Inception) Client...");
    mercuryClient = new OpenAI({
        apiKey: MERCURY_API_KEY,
        baseURL: MERCURY_BASE_URL,
    });

    return mercuryClient;
}

// Structured output schema adapted for OpenAI/Mercury format
const candidateSchema = {
    name: "candidate_analysis",
    strict: true,
    schema: {
        type: "object",
        properties: {
            candidates: {
                type: "array",
                description: "Liste de candidats analysés",
                items: {
                    type: "object",
                    properties: {
                        hash: { type: "string", description: "Le hash unique du fichier CV fourni" },
                        name: { type: "string" },
                        email: { type: "string", nullable: true },
                        phone: { type: "string", nullable: true },
                        location: { type: "string", nullable: true },
                        current_position: { type: "string", nullable: true },
                        years_of_experience: { type: "number", nullable: true },
                        score: { type: "number", description: "Score de 0 à 100 de correspondance avec le poste" },
                        red_flags: { type: "array", items: { type: "string" } },
                        matching_points: { type: "array", items: { type: "string" } },
                        missing_points: { type: "array", items: { type: "string" } },
                        soft_skills: { type: "string" },
                        summary: { type: "string" },
                        career_trajectory: { type: "string", description: "Ultra-court avec emoji (max 4-5 mots), ex: 🧭 Transition vers Data" },
                        social_links: {
                            type: "object",
                            properties: {
                                linkedin: { type: "string", nullable: true },
                                github: { type: "string", nullable: true },
                                portfolio: { type: "string", nullable: true }
                            },
                            required: ["linkedin", "github", "portfolio"],
                            additionalProperties: false
                        }
                    },
                    required: [
                        "hash", "name", "email", "phone", "location", "current_position",
                        "years_of_experience", "score", "red_flags", "matching_points",
                        "missing_points", "soft_skills", "summary", "career_trajectory", "social_links"
                    ],
                    additionalProperties: false
                }
            }
        },
        required: ["candidates"],
        additionalProperties: false
    }
};

const getToneInstruction = (tone: string, language: string) => {
    const isFr = language.toLowerCase().includes('fr') || language.toLowerCase() === 'français';
    switch (tone) {
        case 'PROFESSIONAL': return isFr ? "Ton hautement professionnel." : "Highly professional tone.";
        case 'CASUAL': return isFr ? "Ton détendu et amical." : "Relaxed and friendly tone.";
        case 'DIRECT': return isFr ? "Ton direct et percutant." : "Direct and punchy tone.";
        default: return isFr ? "Ton professionnel standard." : "Standard professional tone.";
    }
};

const getStrictnessInstruction = (strictness: string, language: string) => {
    const isFr = language.toLowerCase().includes('fr') || language.toLowerCase() === 'français';
    switch (strictness) {
        case 'HIGH': return isFr ? "Évaluation EXTRÊMEMENT STRICTE." : "EXTREMELY STRICT evaluation.";
        case 'LOW': return isFr ? "Évaluation INDULGENTE." : "LENIENT evaluation.";
        default: return isFr ? "Évaluation ÉQUILIBRÉE et JUSTE." : "BALANCED and FAIR evaluation.";
    }
};

const getLanguageInstruction = (language: string) => `Réponds IMPÉRATIVEMENT en ${language}.`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchMercuryWithRetry = async (promptContent: string, systemInstruction: string, identifier: string = "CV", retries = 0): Promise<{ candidates: any[], usage: any }> => {
    try {
        const client = initMercuryClient();

        console.log(`[scan_resumes] Calling Mercury 2 for ${identifier}...`);
        const response = await client.chat.completions.create({
            model: "mercury-2",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: promptContent }
            ],
            response_format: {
                type: "json_schema",
                json_schema: candidateSchema
            },
            max_completion_tokens: 4000,
            temperature: 0.2
        });

        const text = response.choices[0]?.message?.content;
        const usage = response.usage;

        if (usage) {
            console.log(`[scan_resumes] Usage for ${identifier}: ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion (${usage.total_tokens} total tokens)`);
        }

        if (!text) throw new Error("Empty response from Mercury 2");

        const parsed = JSON.parse(text);
        return {
            candidates: parsed.candidates || [],
            usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    } catch (error: any) {
        // Handle rate limits or temporary errors
        if ((error.status === 429 || error.status === 422 || error.status === 500 || error.status === 503) && retries < MAX_RETRIES) {
            // Full Jitter: wait = random_between(0, min(cap, base * 2^attempt))
            const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries);
            const delay = Math.floor(Math.random() * Math.min(MAX_RETRY_DELAY_MS, base));

            console.log(`[scan_resumes] Mercury error ${error.status} for ${identifier}. Retrying in ${delay}ms... (Attempt ${retries + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return fetchMercuryWithRetry(promptContent, systemInstruction, identifier, retries + 1);
        }
        throw error;
    }
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders, status: 200 });

    try {
        const supabase = createSupabaseClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { files, project_id, warm_up } = await req.json();

        if (warm_up) return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        if (!files?.length) return new Response(JSON.stringify({ success: true, scan_completed: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        console.log(`[scan_resumes] Processing ${files.length} files (Project: ${project_id})`);
        if (files.length > 5) {
            console.log(`[scan_resumes] ADVICE: For true horizontal scaling, split large batches into multiple HTTP requests.`);
        }

        // Fetch project and config
        const { data: project } = await supabase.from('projects').select('description, owner_id').eq('id', project_id).single();
        if (!project) throw new Error("Project not found");

        const { data: userRecord } = await supabase.from('users').select('preferences').eq('id', project.owner_id).single();
        const aiConfig = userRecord?.preferences?.aiConfig || {};
        const targetLanguage = "Français";

        const systemPrompt = `
### ROLE: Expert en recrutement technique.
### INSTRUCTIONS: Extraire des données structurées et comparer à la fiche de poste.
1. Match Score (0-100).
2. Format JSON uniquement. Soyez concis dans les champs texte (max 2-3 phrases par champ).
3. career_trajectory: DOIT être ultra-court (max 4-5 mots) avec un emoji au début (ex: "🧭 Transition vers Data").
4. RÈGLE CRITIQUE: NE PAS RECOPIER le texte brut du CV. Résumer intelligemment.
5. Langue: ${getLanguageInstruction(targetLanguage)}
${getToneInstruction(aiConfig.tone || 'PROFESSIONAL', targetLanguage)}
${getStrictnessInstruction(aiConfig.strictness || 'MEDIUM', targetLanguage)}
### CONTRINTE: Ne pas dépasser 4000 tokens de sortie.
`;

        const jobDescriptionText = `\n--- JOB DESCRIPTION ---\n${project.description}\n\n`;

        // Fetch texts
        const hashes = files.map((f: any) => f.hash);
        const { data: resumeTexts } = await supabase.from('resume_texts').select('file_hash, raw_text').in('file_hash', hashes);
        const textMap = new Map(resumeTexts?.map(r => [r.file_hash, r.raw_text]) || []);

        const batches = files.map((f: any) => [f]); // BATCH_SIZE = 1 internally


        const CONCURRENCY_LIMIT = 3;
        const finalFailedHashes: string[] = [];
        let totalInserted = 0;
        let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Real sliding window concurrency worker pool
        let currentIndex = 0;
        const worker = async () => {
            while (currentIndex < batches.length) {
                const myIndex = currentIndex++;
                if (myIndex >= batches.length) break; // Ensure we don't go out of bounds if currentIndex increments too fast

                const batch = batches[myIndex];
                const file = batch[0];
                const identifier = file.original_name || file.hash;

                const text = textMap.get(file.hash);
                if (!text || text.trim().length <= 50) {
                    finalFailedHashes.push(file.hash);
                    continue;
                }

                const sanitizedText = (text as string)
                    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
                    .replace(/\u0000/g, "")
                    .substring(0, 8000)
                    .trim();

                const cvBlocksText = `\n[CV HASH=${file.hash}]\n${sanitizedText}\n`;

                try {
                    const result = await fetchMercuryWithRetry(`${jobDescriptionText}CVs:\n${cvBlocksText}`, systemPrompt, identifier);
                    const aiData = result.candidates[0];
                    const usage = result.usage;

                    if (aiData) {
                        const { error: insErr } = await supabase.from('candidates').insert({
                            id: crypto.randomUUID(),
                            project_id,
                            candidate_name: aiData.name || file.original_name || 'Unknown',
                            email: aiData.email,
                            phone: aiData.phone,
                            location: aiData.location,
                            current_position: aiData.current_position,
                            years_of_experience: aiData.years_of_experience,
                            match_score: aiData.score,
                            red_flags: aiData.red_flags || [],
                            key_skills: aiData.matching_points || [],
                            missing_skills: aiData.missing_points || [],
                            soft_skills_analysis: aiData.soft_skills,
                            executive_summary: aiData.summary,
                            career_trajectory: aiData.career_trajectory,
                            social_links: aiData.social_links || {},
                            file_hash: file.hash,
                            size: file.size ? `${Math.round(file.size / 1024)} KB` : null,
                            resume_path: file.path,
                            original_resume_name: file.original_name,
                            uploaded_by: String(file.scanned_by || project.owner_id),
                            status: 'new'
                        });

                        if (!insErr) totalInserted++;
                        else console.error("[scan_resumes] Insert Error:", insErr.message);
                    } else {
                        finalFailedHashes.push(file.hash);
                    }

                    if (usage) {
                        totalUsage.prompt_tokens += usage.prompt_tokens;
                        totalUsage.completion_tokens += usage.completion_tokens;
                        totalUsage.total_tokens += usage.total_tokens;
                    }
                } catch (e: any) {
                    console.error(`[scan_resumes] Worker failure for ${identifier}:`, e.message);
                    finalFailedHashes.push(file.hash);
                }
            }
        };

        // Start workers
        const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, batches.length) }, () => worker());
        await Promise.all(workers);

        console.log(`[scan_resumes] TOTAL Request Usage: ${totalUsage.prompt_tokens} prompt, ${totalUsage.completion_tokens} completion (${totalUsage.total_tokens} total tokens)`);

        return new Response(JSON.stringify({
            success: true,
            scan_completed: totalInserted,
            failed_count: [...new Set(finalFailedHashes)].length
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[scan_resumes] Critical Error:", error.message);
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
