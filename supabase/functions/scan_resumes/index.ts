import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const { files, project_id } = await req.json();

        console.log(`[scan_resumes STUB] Reçu ${files?.length ?? 0} fichiers pour le projet: ${project_id}`);

        if (files && files.length > 0) {
            files.forEach((f: any, i: number) => {
                console.log(`  [${i + 1}] name=${f.name} | hash=${f.hash ?? 'N/A'} | path=${f.path}`);
            });
        }

        // TODO: Implémenter l'appel Gemini ici une fois la GEMINI_API_KEY configurée
        // Pour l'instant, cette fonction confirme juste que le pipeline fonctionne
        // jusqu'à cette étape.

        return new Response(JSON.stringify({
            success: true,
            stub: true,
            message: "scan_resumes (STUB) - pipeline fonctionnel, Gemini non encore configuré",
            project_id,
            files_received: files?.length ?? 0,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[scan_resumes STUB] Erreur:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
