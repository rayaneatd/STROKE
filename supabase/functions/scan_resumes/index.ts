import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { VertexAI } from "npm:@google-cloud/vertexai@1.9.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BATCH_SIZE = 30;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

// Vertex AI Configuration
const SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "{}";
let serviceAccount: any = {};
try {
    serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
} catch (e) {
    console.error("[scan_resumes] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
}

// Global client variable
let vertexAI: any;

function initVertexClient() {
    if (vertexAI) return vertexAI;

    console.log("[scan_resumes] Initializing Vertex AI Client (Deno npm: interface)...");
    const project = serviceAccount.project_id || Deno.env.get("GOOGLE_PROJECT_ID");
    const location = Deno.env.get("GOOGLE_LOCATION") || "europe-west1";

    console.log(`[scan_resumes] Configuring for Project: ${project}, Location: ${location}`);

    try {
        // Cleaning the private key just in case of environment variable escaping issues
        const privateKey = serviceAccount.private_key?.replace(/\\n/g, '\n');

        if (!privateKey || !serviceAccount.client_email) {
            console.error("[scan_resumes] Missing credentials in service account JSON");
        }

        vertexAI = new VertexAI({
            project: project,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: serviceAccount.client_email,
                    private_key: privateKey,
                }
            }
        });
        console.log("[scan_resumes] Vertex AI Client initialized successfully.");
        return vertexAI;
    } catch (err: any) {
        console.error("[scan_resumes] Failed to init Vertex AI:", err.message);
        throw err;
    }
}

// Gemini structured output schema
const candidateSchema = {
    type: "array",
    description: "Liste de candidats analysés",
    items: {
        type: "object",
        properties: {
            hash: { type: "string" },
            name: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            location: { type: "string", nullable: true },
            current_position: { type: "string", nullable: true },
            years_of_experience: { type: "number", nullable: true },
            score: { type: "number" },
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
                }
            }
        },
        required: ["hash", "name", "score", "red_flags", "matching_points", "missing_points", "soft_skills", "summary", "career_trajectory"]
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

const fetchGeminiWithRetry = async (promptTokens: string, systemInstruction: string, retries = 0): Promise<any> => {
    const jitter = Math.floor(Math.random() * 1000);
    await sleep(jitter);

    try {
        const vAI = initVertexClient();
        const model = vAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: candidateSchema,
                temperature: 0.2
            },
            systemInstruction: systemInstruction
        });

        console.log(`[scan_resumes] Calling Vertex AI (gemini-1.5-flash)...`);
        const result = await model.generateContent(promptTokens);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Empty response from Vertex AI");
        return JSON.parse(text);
    } catch (error: any) {
        console.error(`[scan_resumes] Vertex Error (Attempt ${retries + 1}):`, error.message);
        if ((error.status === 429 || error.code === 429 || error.message?.includes('429')) && retries < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries) + Math.floor(Math.random() * 500);
            await sleep(delay);
            return fetchGeminiWithRetry(promptTokens, systemInstruction, retries + 1);
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

        const { files, project_id } = await req.json();
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

        let allParsedCandidates: any[] = [];
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
                    const parsed = await fetchGeminiWithRetry(`${jobDescriptionText}CVs:\n${cvBlocksText}`, systemPrompt);
                    if (Array.isArray(parsed)) allParsedCandidates.push(...parsed);
                } catch (e) {
                    console.error("[scan_resumes] Batch failed:", e.message);
                    failedHashes.push(...currentHashes);
                }
            }
        }

        // Insert candidates
        const candidatesToInsert = [];
        const parsedMap = new Map(allParsedCandidates.map(c => [c.hash, c]));

        for (const file of files) {
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
            } else {
                // If not in parsed map but was in textMap, it truly failed
                if (textMap.has(file.hash)) failedHashes.push(file.hash);
            }
        }

        if (candidatesToInsert.length) {
            console.log(`[scan_resumes] Inserting ${candidatesToInsert.length} candidates into candidates table...`);
            const { error: insErr } = await supabase.from('candidates').insert(candidatesToInsert);
            if (insErr) {
                console.error("[scan_resumes] DB Insert Error:", insErr.message);
                throw insErr;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            scan_completed: candidatesToInsert.length,
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
