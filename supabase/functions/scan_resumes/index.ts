import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { createClient } from "npm:@google/genai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BATCH_SIZE = 30;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

// Vertex AI / Google GenAI Configuration
const SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "{}";
const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);

// Initialize Unified Client for Vertex AI
const client = createClient({
    vertex: true,
    project: serviceAccount.project_id || Deno.env.get("GOOGLE_PROJECT_ID"),
    location: Deno.env.get("GOOGLE_LOCATION") || "europe-west1",
    credentials: serviceAccount
});

// Gemini structured output schema (using standard JS objects for the new SDK)
const candidateSchema = {
    type: "ARRAY",
    description: "Liste de candidats analysés",
    items: {
        type: "OBJECT",
        properties: {
            hash: { type: "STRING", description: "Le hash exact fourni pour ce CV" },
            name: { type: "STRING", description: "Nom complet du candidat" },
            email: { type: "STRING", description: "Email trouvé", nullable: true },
            phone: { type: "STRING", description: "Numéro de téléphone trouvé", nullable: true },
            location: { type: "STRING", description: "Localisation trouvée", nullable: true },
            current_position: { type: "STRING", description: "Leur poste actuel", nullable: true },
            years_of_experience: { type: "NUMBER", description: "Leur années d'expérience (nombre)", nullable: true },
            score: { type: "NUMBER", description: "Match Score de 0 à 100" },
            red_flags: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des red flags" },
            matching_points: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des points forts/compétences qui matchent" },
            missing_points: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des compétences manquantes" },
            soft_skills: { type: "STRING", description: "Petit texte explicatif sur la personnalité et les soft skills" },
            summary: { type: "STRING", description: "Résumé de 2 phrases sur le profil" },
            career_trajectory: { type: "STRING", description: "Trajectoire de carrière (ex: 🚀 En ascension)" },
            social_links: {
                type: "OBJECT",
                properties: {
                    linkedin: { type: "STRING", nullable: true },
                    github: { type: "STRING", nullable: true },
                    portfolio: { type: "STRING", nullable: true }
                },
                nullable: true
            }
        },
        required: ["hash", "name", "score", "red_flags", "matching_points", "missing_points", "soft_skills", "summary", "career_trajectory"]
    }
};

const getToneInstruction = (tone: string, language: string) => {
    const isFr = language.toLowerCase().includes('fr') || language.toLowerCase() === 'français';
    switch (tone) {
        case 'PROFESSIONAL':
            return isFr ? "Le résumé et les champs textuels doivent adopter un ton hautement professionnel et corporatif." : "The summary and text fields must adopt a highly professional and corporate tone.";
        case 'CASUAL':
            return isFr ? "Le résumé et les champs textuels doivent être écrits sur un ton détendu, amical et direct." : "The summary and text fields should be written in a relaxed, friendly, and direct tone.";
        case 'DIRECT':
            return isFr ? "Le résumé doit aller droit au but, avec des phrases courtes et percutantes, sans fioritures." : "The summary must be straightforward, with short and punchy sentences, avoiding fluff.";
        default:
            return isFr ? "Adoptez un ton professionnel standard." : "Adopt a standard professional tone.";
    }
};

const getStrictnessInstruction = (strictness: string, language: string) => {
    const isFr = language.toLowerCase().includes('fr') || language.toLowerCase() === 'français';
    switch (strictness) {
        case 'HIGH':
            return isFr ? "Soyez EXTRÊMEMENT STRICT dans votre évaluation (Calibrage Élevé). Ne donnez un score positif que si tous les critères de la description de poste sont pleinement satisfaits. Mettez en évidence la moindre lacune." : "Be EXTREMELY STRICT in your evaluation (High Calibration). Only give a positive score if all criteria of the job description are fully met. Highlight any minor gap.";
        case 'LOW':
            return isFr ? "Soyez INDULGENT dans votre évaluation (Calibrage Faible). Concentrez-vous sur le potentiel et les compétences transférables, même si le candidat ne correspond pas exactement à la description de poste." : "Be LENIENT in your evaluation (Low Calibration). Focus on potential and transferable skills even if the candidate doesn't match the job description perfectly.";
        default: // MEDIUM
            return isFr ? "Faites une évaluation ÉQUILIBRÉE et JUSTE (Calibrage Moyen). Pesez les points forts par rapport aux exigences clés sans être trop punitif sur les petits détails." : "Provide a BALANCED and FAIR evaluation (Medium Calibration). Weigh the strengths against the key requirements without being overly punitive on minor details.";
    }
};

const getLanguageInstruction = (language: string) => {
    return `Toutes tes réponses textuelles (résumé, analyse de soft skills, red flags, points forts/faibles, etc.) doivent IMPÉRATIVEMENT être rédigées dans cette langue : ${language}.`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchGeminiWithRetry = async (promptTokens: string, systemInstruction: string, retries = 0): Promise<any> => {
    const jitter = Math.floor(Math.random() * 1500);
    await sleep(jitter);

    try {
        const response = await client.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: promptTokens }] }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: candidateSchema,
                temperature: 0.2
            }
        });

        return JSON.parse(response.text() || "[]");
    } catch (error: any) {
        console.error(`Gemini Error (Attempt ${retries + 1}):`, error.message);
        if ((error.status === 429 || error.code === 429) && retries < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries) + Math.floor(Math.random() * 1000);
            console.log(`Rate limited (Vertex). Retrying in ${delay}ms...`);
            await sleep(delay);
            return fetchGeminiWithRetry(promptTokens, systemInstruction, retries + 1);
        }
        throw error;
    }
};


Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const supabase = createSupabaseClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { files, project_id } = await req.json();

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ message: "No files provided to scan_resumes" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[scan_resumes] Démarrage analyse pour ${files.length} fichiers (Projet: ${project_id})`);

        // 1. Fetch Job Description
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('description, owner_id')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            throw new Error(`Project not found: ${projectError?.message}`);
        }

        // 2. Fetch User Config
        const { data: userRecord } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', project.owner_id)
            .single();

        const prefs = userRecord?.preferences || {};
        const aiConfig = prefs.aiConfig || {};

        // Target Language: Check project settings, fallback to user pref, fallback to 'French'
        const targetLanguage = "Français";

        const toneInstruction = getToneInstruction(aiConfig.tone || 'PROFESSIONAL', targetLanguage);
        const strictnessInstruction = getStrictnessInstruction(aiConfig.strictness || 'MEDIUM', targetLanguage);
        const langInstruction = getLanguageInstruction(targetLanguage);

        // 3. Fetch Extracted Texts
        const hashes = files.map((f: any) => f.hash).filter(Boolean);
        const { data: resumeTexts } = await supabase
            .from('resume_texts')
            .select('file_hash, raw_text')
            .in('file_hash', hashes);

        const textMap = new Map(resumeTexts?.map(r => [r.file_hash, r.raw_text]) || []);

        const systemPrompt = `
### ROLE
Tu es un expert en recrutement technique de classe mondiale. Ton rôle est d'extraire des données structurées depuis une liste de textes de CV et de les comparer à une fiche de poste (Job Description).

### INSTRUCTIONS STRICTES
1. ANALYSE : Examine chaque CV individuellement, sans faire quelconque lien entre eux. L'analyse doit pas se baser que sur le texte, mais sur une analyse logique et profonde qui peut détecter toute incohérence.
2. MATCHING : Calcule un "Match Score" (0-100) basé sur l'adéquation entre les compétences du CV et la Job Description fournie.
3. FORMAT : Réponds EXCLUSIVEMENT avec un tableau JSON valide respectant le schema prescrit. Pas de texte avant, pas de texte après.
4. LA LANGUE CIBLE : ${langInstruction}

### TONE
${toneInstruction}

### MATCHING STRICTNESS
${strictnessInstruction}
`;

        const jobDescriptionText = `\n--- JOB DESCRIPTION ---\n${project.description}\n-----------------------\n\n`;

        // 4. Batch Processing
        const batches: any[][] = [];
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            batches.push(files.slice(i, i + BATCH_SIZE));
        }

        let allParsedCandidates: any[] = [];
        let failedHashes: string[] = [];

        console.log(`Processing ${files.length} files in ${batches.length} batches...`);

        for (const batch of batches) {
            let cvBlocksText = "";
            const processingHashes: string[] = [];

            for (const file of batch) {
                const rawText = textMap.get(file.hash) as string | undefined;
                if (rawText && rawText.trim().length > 50) {
                    cvBlocksText += `\n[DEBUT CV : HASH=${file.hash}]\n${rawText.substring(0, 15000)}\n[FIN CV : HASH=${file.hash}]\n`;
                    processingHashes.push(file.hash);
                } else {
                    failedHashes.push(file.hash);
                    console.warn(`Texte vide ou trop court pour l'analyse du hash ${file.hash}`);
                }
            }

            if (cvBlocksText.length > 0) {
                const userPrompt = `${jobDescriptionText}Voici les CVs à traiter :\n${cvBlocksText}`;

                try {
                    const parsedBatch = await fetchGeminiWithRetry(userPrompt, systemPrompt);
                    if (Array.isArray(parsedBatch)) {
                        allParsedCandidates.push(...parsedBatch);
                    }
                } catch (e: any) {
                    console.error("Batch completely failed after retries:", e);
                    failedHashes.push(...processingHashes);
                }
            }
        }

        // 5. Data Mapping & Insertion
        const candidatesToInsert = [];
        const parsedMap = new Map(allParsedCandidates.map(c => [c.hash, c]));

        for (const file of files) {
            const aiData = parsedMap.get(file.hash);

            if (aiData) {
                candidatesToInsert.push({
                    id: crypto.randomUUID(),
                    project_id: project_id,
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
                    social_links: aiData.social_links,

                    // Metadata from frontend payload
                    file_hash: file.hash,
                    size: file.size ? `${Math.round(file.size / 1024)} KB` : null,
                    resume_path: file.path,
                    original_resume_name: file.original_name,
                    uploaded_by: String(file.scanned_by || project.owner_id),
                    status: 'new',
                    is_favorite: false
                });
            } else {
                failedHashes.push(file.hash);
            }
        }

        if (candidatesToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('candidates')
                .insert(candidatesToInsert);

            if (insertError) {
                console.error("Database Insert Error:", insertError);
                throw insertError;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            scan_completed: candidatesToInsert.length,
            failed_count: failedHashes.length,
            failed_hashes: failedHashes
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[scan_resumes] Erreur critique:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
