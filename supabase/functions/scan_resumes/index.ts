import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Constants ──────────────────────────────────────────────────────────────────
const BATCH_SIZE = 1;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 15000;
const PROMPT_VERSION = "2.0.0"; // Increment on every prompt change for auditability

// ─── AI Providers ───────────────────────────────────────────────────────────────
const MERCURY_API_KEY = Deno.env.get("MERCURY_API_KEY");
const MERCURY_BASE_URL = "https://api.inceptionlabs.ai/v1";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

let mercuryClient: OpenAI | null = null;
let mistralClient: OpenAI | null = null;

function getAIClient(modelType: string = 'MERCURY_2') {
    if (modelType === 'MISTRAL') {
        if (mistralClient) return { client: mistralClient, model: "mistral-small-2506" };
        if (!MISTRAL_API_KEY) {
            console.warn("[scan_resumes] MISTRAL_API_KEY not found, falling back to Mercury");
            return getAIClient('MERCURY_2');
        }
        console.log("[scan_resumes] Initializing Mistral Client (mistral-small-2506)...");
        mistralClient = new OpenAI({
            apiKey: MISTRAL_API_KEY,
            baseURL: MISTRAL_BASE_URL,
        });
        return { client: mistralClient, model: "mistral-small-2506" };
    }

    if (mercuryClient) return { client: mercuryClient, model: "mercury-2" };
    if (!MERCURY_API_KEY) throw new Error("Missing MERCURY_API_KEY environment variable");

    console.log("[scan_resumes] Initializing Mercury 2 (Inception) Client...");
    mercuryClient = new OpenAI({
        apiKey: MERCURY_API_KEY,
        baseURL: MERCURY_BASE_URL,
    });

    return { client: mercuryClient, model: "mercury-2" };
}

// ─── Structured Output Schema (v2 — AI Act compliant) ──────────────────────────
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
                        score: { type: "number", description: "Score total pondéré de 0 à 100" },
                        score_breakdown: {
                            type: "object",
                            description: "Décomposition du score par dimension (somme = score total)",
                            properties: {
                                technical_skills: { type: "number", description: "Compétences techniques requises (0-40)" },
                                experience: { type: "number", description: "Expérience: années + pertinence sectorielle (0-30)" },
                                education: { type: "number", description: "Formation et certifications (0-15)" },
                                soft_skills: { type: "number", description: "Soft skills inférés du texte uniquement (0-15)" }
                            },
                            required: ["technical_skills", "experience", "education", "soft_skills"],
                            additionalProperties: false
                        },
                        red_flags: {
                            type: "array",
                            items: { type: "string" },
                            description: "Uniquement des lacunes objectives vérifiables dans le CV par rapport à la fiche de poste"
                        },
                        matching_points: {
                            type: "array",
                            items: { type: "string" },
                            description: "Correspondances directes entre le CV et les critères de la fiche de poste"
                        },
                        missing_points: {
                            type: "array",
                            items: { type: "string" },
                            description: "Critères de la fiche de poste absents du CV"
                        },
                        soft_skills: { type: "string", description: "Soft skills identifiés dans le texte du CV uniquement, sans inférence" },
                        summary: {
                            type: "string",
                            description: "Format obligatoire: 'Profil [type] avec [X] ans sur [domaine]. Point fort pour ce poste : [Y]. Limite identifiée : [Z].' — NE PAS résumer le CV, se concentrer sur la pertinence pour le poste."
                        },
                        career_trajectory: {
                            type: "string",
                            description: "Direction de carrière EN LIEN avec le poste visé. Max 5 mots avec emoji. Ex: '🚀 Évolution vers leadership technique'"
                        },
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
                        "years_of_experience", "score", "score_breakdown", "red_flags",
                        "matching_points", "missing_points", "soft_skills", "summary",
                        "career_trajectory", "social_links"
                    ],
                    additionalProperties: false
                }
            }
        },
        required: ["candidates"],
        additionalProperties: false
    }
};

// ─── Prompt Helpers ─────────────────────────────────────────────────────────────
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

// ─── System Prompt Builder (v2 — Production-ready) ──────────────────────────────
const buildSystemPrompt = (targetLanguage: string, tone: string, strictness: string) => {
    const isFr = targetLanguage.toLowerCase().includes('fr') || targetLanguage.toLowerCase() === 'français';

    if (isFr) {
        return `### RÔLE
Tu es un assistant de recrutement. Tu analyses des CVs et les classes au regard d'une fiche de poste.
Ton rôle est d'AIDER le recruteur humain à prioriser son temps, PAS de décider à sa place.

### RÈGLES FONDAMENTALES
1. TRIER, JAMAIS FILTRER. Même un score faible se présente avec neutralité et ses points positifs.
2. NE JAMAIS inventer une information absente du CV. Utilise null pour tout champ manquant.
3. NE JAMAIS inférer ni mentionner : âge, genre, origine ethnique, nationalité, état de santé, situation familiale, religion, handicap. Si ces informations apparaissent dans le CV, les ignorer complètement.
4. TOUJOURS ancrer ton analyse à la fiche de poste fournie. Chaque matching_point, missing_point et red_flag doit référencer un critère concret de la fiche.
5. Ne jamais utiliser de langage définitif ("à rejeter", "non qualifié", "inadapté"). Utilise : "profil moins aligné avec les critères de ce poste".
6. Si le texte du CV est insuffisant pour une analyse fiable (< 100 mots utiles), retourne score: 0 et explique-le dans summary.
7. ${getLanguageInstruction(targetLanguage)}
8. ${getToneInstruction(tone, targetLanguage)}
9. ${getStrictnessInstruction(strictness, targetLanguage)}

### SCORING (0–100) — PONDÉRATION OBLIGATOIRE
Le score DOIT être la somme exacte des 4 dimensions suivantes :
- technical_skills (0-40) : Compétences techniques requises dans la fiche de poste, présentes dans le CV.
- experience (0-30) : Années d'expérience ET pertinence sectorielle par rapport au poste.
- education (0-15) : Formation, diplômes et certifications pertinents pour le poste.
- soft_skills (0-15) : Soft skills identifiés explicitement dans le texte du CV uniquement.
Référence : 50 = alignement partiel | 75+ = bon alignement | 90+ = profil fort.
score = technical_skills + experience + education + soft_skills.

### executive_summary — FORMAT OBLIGATOIRE
"Profil [type de profil] avec [X] ans sur [domaine principal]. Point fort pour ce poste : [compétence/expérience clé qui matche]. Limite identifiée : [critère requis le plus manquant]."
NE PAS résumer le CV. Se concentrer UNIQUEMENT sur la pertinence pour CE poste précis.

### red_flags — RÈGLES STRICTES
Uniquement des lacunes OBJECTIVES et VÉRIFIABLES dans le CV par rapport à la fiche de poste.
Format : "[Critère de la fiche de poste] : absent/insuffisant dans le CV"
INTERDIT : Jugements de valeur, inférences sur des données personnelles protégées, suppositions sur la motivation.

### matching_points et missing_points
Chaque élément DOIT référencer un critère spécifique de la fiche de poste.
Format : "[Critère] : [preuve dans le CV]" ou "[Critère] : absent du CV"

### career_trajectory
Décrire la direction de carrière EN LIEN avec le poste visé.
Format : [emoji] [direction en max 5 mots]
Exemples : "🚀 Évolution vers leadership technique", "🔄 Reconversion Data vers Dev"

### CONTRAINTE DE FORMAT
JSON uniquement. Max 4000 tokens de sortie. Sois concis dans tous les champs texte (max 2 phrases par champ).`;
    }

    // English version
    return `### ROLE
You are a recruitment assistant. You analyze resumes and rank them against a job description.
Your role is to HELP the human recruiter prioritize their time, NOT to decide for them.

### FUNDAMENTAL RULES
1. RANK, NEVER FILTER. Even a low-scoring candidate must be presented neutrally with their positive points.
2. NEVER invent information absent from the resume. Use null for any missing field.
3. NEVER infer or mention: age, gender, ethnic origin, nationality, health status, family situation, religion, disability. If such information appears in the resume, ignore it completely.
4. ALWAYS anchor your analysis to the provided job description. Each matching_point, missing_point and red_flag must reference a concrete criterion from the job description.
5. Never use definitive language ("to reject", "unqualified", "unsuitable"). Use: "profile less aligned with this position's criteria".
6. If the resume text is insufficient for reliable analysis (< 100 useful words), return score: 0 and explain in summary.
7. ${getLanguageInstruction(targetLanguage)}
8. ${getToneInstruction(tone, targetLanguage)}
9. ${getStrictnessInstruction(strictness, targetLanguage)}

### SCORING (0–100) — MANDATORY WEIGHTING
The score MUST be the exact sum of these 4 dimensions:
- technical_skills (0-40): Required technical skills from job description, present in resume.
- experience (0-30): Years of experience AND sector relevance to the position.
- education (0-15): Relevant degrees, diplomas and certifications for the position.
- soft_skills (0-15): Soft skills explicitly identified in the resume text only.
Reference: 50 = partial alignment | 75+ = good alignment | 90+ = strong profile.
score = technical_skills + experience + education + soft_skills.

### executive_summary — MANDATORY FORMAT
"[Profile type] with [X] years in [main domain]. Key strength for this role: [matching skill/experience]. Identified limitation: [most missing required criterion]."
DO NOT summarize the resume. Focus ONLY on relevance for THIS specific position.

### red_flags — STRICT RULES
Only OBJECTIVE and VERIFIABLE gaps in the resume relative to the job description.
Format: "[Job criterion]: absent/insufficient in resume"
FORBIDDEN: Value judgments, inferences about protected personal data, assumptions about motivation.

### matching_points and missing_points
Each item MUST reference a specific criterion from the job description.
Format: "[Criterion]: [evidence in resume]" or "[Criterion]: absent from resume"

### career_trajectory
Describe career direction IN RELATION to the target position.
Format: [emoji] [direction in max 5 words]
Examples: "🚀 Moving toward tech leadership", "🔄 Data-to-Dev transition"

### FORMAT CONSTRAINT
JSON only. Max 4000 output tokens. Be concise in all text fields (max 2 sentences per field).`;
};

// ─── AI Request with Retry ──────────────────────────────────────────────────────
const fetchAIWithRetry = async (promptContent: string, systemInstruction: string, modelType: string = 'MERCURY_2', identifier: string = "CV", retries = 0): Promise<{ candidates: any[], usage: any }> => {
    try {
        const { client, model } = getAIClient(modelType);

        const isMistral = modelType === 'MISTRAL';

        let finalSystemInstruction = systemInstruction;
        if (isMistral) {
            finalSystemInstruction += `\n\nIMPÉRATIF: RENVOIE UNIQUEMENT DU JSON VALIDE. Voici l'exact schéma JSON attendu :\n${JSON.stringify(candidateSchema.schema.properties, null, 2)}\n\nNe retourne aucun texte ou markdown en dehors du JSON.`;
        }

        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: finalSystemInstruction },
                { role: "user", content: promptContent }
            ],
            response_format: isMistral ? { type: "json_object" } : {
                type: "json_schema",
                json_schema: candidateSchema
            },
            max_tokens: 4000,
            temperature: 0.2
        });

        const text = response.choices[0]?.message?.content;
        const usage = response.usage;

        if (usage) {
            console.log(`[scan_resumes] Usage for ${identifier}: ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion (${usage.total_tokens} total tokens)`);
        }

        if (!text) throw new Error("Empty response from AI model");

        const parsed = JSON.parse(text);
        return {
            candidates: parsed.candidates || [],
            usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    } catch (error: any) {
        if ((error.status === 429 || error.status === 422 || error.status === 500 || error.status === 503) && retries < MAX_RETRIES) {
            const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries);
            const delay = Math.floor(Math.random() * Math.min(MAX_RETRY_DELAY_MS, base));

            console.log(`[scan_resumes] AI error ${error.status} for ${identifier}. Retrying in ${delay}ms... (Attempt ${retries + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return fetchAIWithRetry(promptContent, systemInstruction, modelType, identifier, retries + 1);
        }
        throw error;
    }
};

// ─── Main Handler ───────────────────────────────────────────────────────────────
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

        // ─── Fetch project and user config ──────────────────────────────────────
        const { data: project } = await supabase.from('projects').select('description, owner_id').eq('id', project_id).single();
        if (!project) throw new Error("Project not found");

        const { data: userRecord } = await supabase.from('profiles').select('preferences, language').eq('id', project.owner_id).single();
        const aiConfig = userRecord?.preferences?.aiConfig || {};
        const selectedModel = aiConfig.aiModel || 'MERCURY_2';

        // ─── Language: configurable, not hardcoded ──────────────────────────────
        const targetLanguage = aiConfig.language
            || (userRecord?.language === 'fr' ? 'Français' : userRecord?.language === 'en' ? 'English' : null)
            || 'Français'; // Fallback

        // ─── Build system prompt (v2 — production-ready) ────────────────────────
        const systemPrompt = buildSystemPrompt(
            targetLanguage,
            aiConfig.tone || 'PROFESSIONAL',
            aiConfig.strictness || 'MEDIUM'
        );

        const jobDescriptionText = `\n--- JOB DESCRIPTION ---\n${project.description}\n\n`;

        // ─── Fetch resume texts ─────────────────────────────────────────────────
        const hashes = files.map((f: any) => f.hash);
        const { data: resumeTexts } = await supabase.from('resume_texts').select('file_hash, raw_text').in('file_hash', hashes);
        const textMap = new Map(resumeTexts?.map(r => [r.file_hash, r.raw_text]) || []);

        const batches = files.map((f: any) => [f]);

        const CONCURRENCY_LIMIT = 3;
        const finalFailedHashes: string[] = [];
        let totalInserted = 0;
        let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // ─── Resolve model name for audit logging ───────────────────────────────
        const { model: resolvedModelName } = getAIClient(selectedModel);

        // ─── Sliding window concurrency worker pool ─────────────────────────────
        let currentIndex = 0;
        const worker = async () => {
            while (currentIndex < batches.length) {
                const myIndex = currentIndex++;
                if (myIndex >= batches.length) break;

                const batch = batches[myIndex];
                const file = batch[0];
                const identifier = file.original_name || file.hash;
                const scanTimestamp = new Date().toISOString();

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
                    const result = await fetchAIWithRetry(`${jobDescriptionText}CVs:\n${cvBlocksText}`, systemPrompt, selectedModel, identifier);
                    const aiData = result.candidates[0];
                    const usage = result.usage;

                    if (aiData) {
                        // Validate score_breakdown consistency
                        const breakdown = aiData.score_breakdown || {};
                        const computedTotal = (breakdown.technical_skills || 0)
                            + (breakdown.experience || 0)
                            + (breakdown.education || 0)
                            + (breakdown.soft_skills || 0);

                        // Use computed total if model's score diverges
                        const finalScore = Math.abs(computedTotal - (aiData.score || 0)) <= 5
                            ? aiData.score
                            : computedTotal;

                        const { error: insErr } = await supabase.from('candidates').insert({
                            id: crypto.randomUUID(),
                            project_id,
                            candidate_name: aiData.name || file.original_name || 'Unknown',
                            email: aiData.email,
                            phone: aiData.phone,
                            location: aiData.location,
                            current_position: aiData.current_position,
                            years_of_experience: aiData.years_of_experience,
                            match_score: finalScore,
                            score_breakdown: breakdown,
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
                            status: 'new',
                            // ─── AI Act compliance fields ───────────────────────
                            ai_model_used: resolvedModelName,
                            scanned_at: scanTimestamp,
                            ai_analysis_version: PROMPT_VERSION,
                            total_tokens_used: usage?.total_tokens || 0
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
