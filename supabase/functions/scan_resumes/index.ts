import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

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
                        career_trajectory: { type: "string" },
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

const fetchMercuryWithRetry = async (promptContent: string, systemInstruction: string, retries = 0): Promise<any> => {
    try {
        const client = initMercuryClient();

        console.log(`[scan_resumes] Calling Mercury 2 (mercury-2)...`);
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
            temperature: 0.2
        });

        const text = response.choices[0]?.message?.content;
        if (!text) throw new Error("Empty response from Mercury 2");

        const parsed = JSON.parse(text);
        return parsed.candidates; // Return the array of candidates directly to match existing logic
    } catch (error: any) {
        console.error(`[scan_resumes] Mercury Error (Attempt ${retries + 1}):`, error.message);

        // Handle rate limits or temporary errors
        if ((error.status === 429 || error.status === 500 || error.status === 503) && retries < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries) + Math.floor(Math.random() * 500);
            await sleep(delay);
            return fetchMercuryWithRetry(promptContent, systemInstruction, retries + 1);
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

        if (warm_up) {
            console.log("[scan_resumes] Warm-up signal received.");
            return new Response(JSON.stringify({ success: true, message: "Warmed up" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!files?.length) {
            return new Response(JSON.stringify({ success: true, scan_completed: 0 }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[scan_resumes] Processing ${files.length} files (Project: ${project_id})`);

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
2. Format JSON uniquement.
3. Langue: ${getLanguageInstruction(targetLanguage)}
${getToneInstruction(aiConfig.tone || 'PROFESSIONAL', targetLanguage)}
${getStrictnessInstruction(aiConfig.strictness || 'MEDIUM', targetLanguage)}
`;

        const jobDescriptionText = `\n--- JOB DESCRIPTION ---\n${project.description}\n\n`;

        // Fetch texts
        const hashes = files.map((f: any) => f.hash);
        const { data: resumeTexts } = await supabase.from('resume_texts').select('file_hash, raw_text').in('file_hash', hashes);
        const textMap = new Map(resumeTexts?.map(r => [r.file_hash, r.raw_text]) || []);

        const batches = [];
        for (let i = 0; i < files.length; i += BATCH_SIZE) batches.push(files.slice(i, i + BATCH_SIZE));

        let totalInserted = 0;
        let failedHashes: string[] = [];

        for (const batch of batches) {
            let cvBlocksText = "";
            const currentHashes: string[] = [];
            for (const file of batch) {
                const text = textMap.get(file.hash);
                if (text?.trim().length > 50) {
                    cvBlocksText += `\n[CV HASH=${file.hash}]\n${text.substring(0, 15000)}\n`;
                    currentHashes.push(file.hash);
                } else failedHashes.push(file.hash);
            }

            if (cvBlocksText) {
                try {
                    const parsedCandidates = await fetchMercuryWithRetry(`${jobDescriptionText}CVs:\n${cvBlocksText}`, systemPrompt);

                    if (Array.isArray(parsedCandidates) && parsedCandidates.length > 0) {
                        const parsedMap = new Map(parsedCandidates.map(c => [c.hash, c]));
                        const candidatesToInsert = [];

                        for (const file of batch) {
                            const aiData = parsedMap.get(file.hash);
                            if (aiData) {
                                candidatesToInsert.push({
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
                            } else if (textMap.has(file.hash)) {
                                failedHashes.push(file.hash);
                            }
                        }

                        if (candidatesToInsert.length > 0) {
                            console.log(`[scan_resumes] Progress: Inserting batch of ${candidatesToInsert.length} candidates...`);
                            const { error: insErr } = await supabase.from('candidates').insert(candidatesToInsert);
                            if (insErr) {
                                console.error("[scan_resumes] Progressive Insert Error:", insErr.message);
                            } else {
                                totalInserted += candidatesToInsert.length;
                            }
                        }
                    }
                } catch (e) {
                    console.error("[scan_resumes] Batch failed:", e.message);
                    failedHashes.push(...currentHashes);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            scan_completed: totalInserted,
            failed_count: [...new Set(failedHashes)].length
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
