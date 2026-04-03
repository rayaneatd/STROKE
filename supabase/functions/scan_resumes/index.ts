import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_RETRIES = 3;
const PROMPT_VERSION = "3.2.1"; // 🚨 Fix for missing gem reasons and false positives

let mercuryClient: OpenAI | null = null;
let mistralClient: OpenAI | null = null;

function getAIClient(modelType: string = 'MERCURY_2') {
    const MERCURY_API_KEY = Deno.env.get("MERCURY_API_KEY");
    const MERCURY_BASE_URL = "https://api.inceptionlabs.ai/v1";
    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

    if (modelType === 'MISTRAL') {
        if (mistralClient) return { client: mistralClient, model: "mistral-small-latest" };
        if (!MISTRAL_API_KEY) throw new Error("Missing MISTRAL_API_KEY");
        mistralClient = new OpenAI({ apiKey: MISTRAL_API_KEY, baseURL: MISTRAL_BASE_URL });
        return { client: mistralClient, model: "mistral-small-latest" };
    }

    if (mercuryClient) return { client: mercuryClient, model: "mercury-2" };
    if (!MERCURY_API_KEY) {
        console.warn("MERCURY_API_KEY not found, trying Mistral...");
        if (Deno.env.get("MISTRAL_API_KEY")) return getAIClient('MISTRAL');
        throw new Error("Missing MERCURY_API_KEY AND MISTRAL_API_KEY");
    }
    mercuryClient = new OpenAI({ apiKey: MERCURY_API_KEY, baseURL: MERCURY_BASE_URL });
    return { client: mercuryClient, model: "mercury-2" };
}

// ─── System Prompt Builder
const buildSystemPrompt = (weights: { technical_skills: number; experience: number; education: number; soft_skills: number }) => {
    const w = {
        tech: weights.technical_skills ?? 40,
        exp: weights.experience ?? 30,
        edu: weights.education ?? 15,
        soft: weights.soft_skills ?? 15
    };
    const total = w.tech + w.exp + w.edu + w.soft;

    return `Tu es un expert RH senior spécialisé en analyse de CV. Tu dois analyser le CV fourni en le comparant rigoureusement à la fiche de poste. Tu dois répondre UNIQUEMENT en FRANÇAIS, même si le CV est en anglais.

## RÈGLE ABSOLUE : LANGUE
Tous les champs textuels doivent être rédigés en FRANÇAIS.

## RÈGLE ABSOLUE : SCORING RÉALISTE ET STRICT
Le match_score final est la SOMME EXACTE des 4 sous-scores.
- technical_skills : 0 à ${w.tech}
- experience : 0 à ${w.exp}
- education : 0 à ${w.edu}
- soft_skills : 0 à ${w.soft}
- match_score = technical_skills + experience + education + soft_skills.

## DÉTECTION HIDDEN GEM (PÉPITE CACHÉE)
C'est un point CRITIQUE. 
Un 'Hidden Gem' (is_hidden_gem: true) est un candidat dont le parcours n'est PAS conventionnel (score souvent < 75%) mais qui présente un potentiel exceptionnel :
- Profil atypique : Reconversion réussie, autodidacte éclairé, parcours non-linéaire.
- Expertise Niche : Maîtrise d'une technologie rare ou projets personnels massifs (ex: contributeur Open Source majeur).
- Sur-performance relative : Très junior officiellement mais avec un niveau technique de senior.

ÉVITE LE FAUX POSITIF : Un profil classique avec de bonnes études (Master CS) et une expérience en grande entreprise (General Motors, etc.) n'est JAMAIS un 'Hidden Gem', c'est juste un candidat standard (très bon ou non).

SI is_hidden_gem est TRUE, tu DOIS obligatoirement fournir une raison détaillée dans hidden_gem_reason (1-2 phrases). Sinon, mets false et null.

## FORMAT DE SORTIE
Schéma JSON attendu (UNIQUEMENT DU JSON VALIDE) :
{
  "candidate_name": "string",
  "email": "string | null",
  "phone": "string | null",
  "location": "string | null",
  "years_of_experience": number,
  "current_position": "string | null",
  "match_score": number,
  "score_breakdown": {
    "technical_skills": number,
    "experience": number,
    "education": number,
    "soft_skills": number
  },
  "executive_summary": "Résumé en FRANÇAIS expliquant le match.",
  "key_skills": ["string", ...],
  "missing_skills": ["string", ...],
  "red_flags": ["string", ...],
  "soft_skills_analysis": "string en FRANÇAIS",
  "is_hidden_gem": boolean,
  "hidden_gem_reason": "string en FRANÇAIS obligatoire si gem=true | null",
  "career_trajectory": "string"
}`;
};

// ─── SERVER
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

        const payload = await req.json();
        const { files, project_id, warm_up } = payload;

        if (warm_up || !files || files.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "Warmed up" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('description, scoring_config, title, owner_id')
            .eq('id', project_id)
            .single();

        if (projectError) throw new Error(`Project fetch error`);

        const weights = {
            technical_skills: project.scoring_config?.weights?.technical_skills ?? 40,
            experience: project.scoring_config?.weights?.experience ?? 30,
            education: project.scoring_config?.weights?.education ?? 15,
            soft_skills: project.scoring_config?.weights?.soft_skills ?? 15,
        };
        const jobDescription = project.description || project.title || "React Developer";

        let ai;
        try { ai = getAIClient('MERCURY_2'); } catch { ai = getAIClient('MISTRAL'); }
        const { client, model } = ai;

        const processFile = async (file: any) => {
            const uploadedBy = file.scanned_by || project.owner_id;
            const originalName = file.original_name || file.name;

            try {
                const { data: textData } = await supabase.from('resume_texts').select('raw_text').eq('file_hash', file.hash).single();
                if (!textData?.raw_text) throw new Error("No text found");

                const systemPrompt = buildSystemPrompt(weights);
                const userPrompt = `Compare ce CV à la fiche de poste suivante :\n${jobDescription}\n---\nCV Texte :\n${textData.raw_text}\n---\nRéponds en JSON uniquement.`;

                const completion = await client.chat.completions.create({
                    model: model,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                    temperature: 0.1,
                });
                const aiText = completion.choices[0]?.message?.content || "";
                let jsonStr = aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1);
                const parsed = JSON.parse(jsonStr);

                const is_gem = parsed.is_hidden_gem === true || String(parsed.is_hidden_gem) === 'true';

                // Sanitize and ensure reason exists if gem=true
                let reason = is_gem ? (parsed.hidden_gem_reason || "Potentiel atypique détecté") : null;

                const { error: insErr } = await supabase.from('candidates').upsert({
                    project_id,
                    uploaded_by: uploadedBy,
                    original_resume_name: originalName,
                    file_hash: file.hash,
                    resume_path: file.path,
                    status: 'completed',
                    ai_model_used: model,
                    ai_analysis_version: PROMPT_VERSION,
                    scanned_at: new Date().toISOString(),
                    candidate_name: parsed.candidate_name || originalName,
                    match_score: Number(parsed.match_score) || 0,
                    is_hidden_gem: is_gem,
                    hidden_gem_reason: reason,
                    executive_summary: parsed.executive_summary,
                    email: parsed.email,
                    phone: parsed.phone,
                    location: parsed.location,
                    current_position: parsed.current_position,
                    years_of_experience: Number(parsed.years_of_experience) || 0,
                    score_breakdown: parsed.score_breakdown,
                    key_skills: parsed.key_skills,
                    missing_skills: parsed.missing_skills,
                    red_flags: parsed.red_flags,
                    soft_skills_analysis: parsed.soft_skills_analysis,
                    career_trajectory: parsed.career_trajectory,
                }, {
                    onConflict: 'project_id,file_hash',
                    ignoreDuplicates: false
                });

                if (insErr) throw insErr;
                return { success: true, file: originalName };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        };

        const results = await Promise.all(files.map(processFile));
        return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
});