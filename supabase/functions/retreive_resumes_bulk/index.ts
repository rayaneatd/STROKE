import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BATCH_SIZE = 9;
const PAGE_SIZE = 1000;

Deno.serve(async (req: Request) => {
    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        // Always use Service Role to read storage & candidates without RLS restrictions
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const body = await req.json();
        const { project_id, files: filesProvided, warm_up } = body;

        if (warm_up) {
            console.log("[retreive_resumes_bulk] Warm-up signal received.");
            return new Response(JSON.stringify({ success: true, message: "Warmed up" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!project_id) {
            return new Response(JSON.stringify({ error: "project_id manquant" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Extract auth header from the incoming request to forward it to parse_resumes
        const authHeader = req.headers.get('Authorization');
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        console.log(`🚀 Dispatcher démarré pour le projet: ${project_id}`);

        let allFilesToProcess: any[] = [];

        if (filesProvided && Array.isArray(filesProvided) && filesProvided.length > 0) {
            console.log(`📦 Utilisation de la liste de ${filesProvided.length} fichiers fournie par le client.`);
            allFilesToProcess = filesProvided;
        } else {
            console.log("🔍 Aucun fichier fourni, listing du bucket...");
            // --- ÉTAPE A : Pagination pour lister TOUT le bucket ---
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const { data: files, error } = await supabase.storage
                    .from('resumes')
                    .list(project_id, {
                        limit: PAGE_SIZE,
                        offset: offset,
                        sortBy: { column: 'name', order: 'asc' }
                    });

                if (error) throw error;

                if (!files || files.length === 0) {
                    hasMore = false;
                } else {
                    const validBatch = files
                        .filter(f => f.name !== '.emptyFolderPlaceholder' && f.id)
                        .map(f => {
                            // Supabase list() returns eTag wrapped in quotes like '"hash"'
                            const cleanETag = f.metadata?.eTag ? f.metadata.eTag.replace(/"/g, '') : null;
                            return {
                                path: `${project_id}/${f.name}`,
                                name: f.name,
                                size: f.metadata?.size || 0,
                                // Use eTag if custom file_hash metadata is not returned by list()
                                hash: f.metadata?.file_hash || cleanETag || f.id,
                                original_name: f.metadata?.original_name || f.name,
                                scanned_by: f.metadata?.scanned_by || null
                            };
                        });

                    allFilesToProcess = [...allFilesToProcess, ...validBatch];
                    console.log(`Chargé ${allFilesToProcess.length} fichiers depuis le bucket...`);

                    if (files.length < PAGE_SIZE) hasMore = false;
                    else offset += PAGE_SIZE;
                }
            }
        }

        if (allFilesToProcess.length === 0) {
            return new Response(JSON.stringify({ message: "Bucket vide pour ce projet" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- ÉTAPE B : Double Check Anti-Duplication via resume_path ---
        const { data: existing, error: existingError } = await supabase
            .from('candidates')
            .select('resume_path')
            .eq('project_id', project_id)
            .not('resume_path', 'is', null);

        if (existingError) {
            console.warn("Impossible de vérifier les doublons:", existingError.message);
        }

        const existingSet = new Set(existing?.map(c => c.resume_path) ?? []);
        const newFiles = allFilesToProcess.filter(f => !existingSet.has(f.path));

        console.log(`Total bucket: ${allFilesToProcess.length} | Déjà traités: ${existingSet.size} | Nouveaux: ${newFiles.length}`);

        if (newFiles.length === 0) {
            return new Response(JSON.stringify({
                message: "Tous les fichiers ont déjà été traités",
                total: allFilesToProcess.length,
                skipped: existingSet.size
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- ÉTAPE C : Dispatch vers parse_resumes par batches via EdgeRuntime.waitUntil ---
        const batches: any[][] = [];
        for (let i = 0; i < newFiles.length; i += BATCH_SIZE) {
            batches.push(newFiles.slice(i, i + BATCH_SIZE));
        }

        console.log(`Dispatching ${batches.length} batches de ${BATCH_SIZE} vers parse_resumes...`);

        // waitUntil permet aux invocations de se terminer APRÈS que la réponse HTTP est envoyée
        const dispatchAll = async () => {
            console.log(`🚀 Parallel dispatch of ${batches.length} batches...`);
            await Promise.all(batches.map(async (batch) => {
                try {
                    const invokeHeaders: Record<string, string> = {};
                    if (authHeader) invokeHeaders['Authorization'] = authHeader;
                    if (anonKey) invokeHeaders['apikey'] = anonKey;

                    const { error: invokeErr } = await supabase.functions.invoke('parse_resumes', {
                        body: { project_id, files: batch },
                        headers: invokeHeaders
                    });
                    if (invokeErr) {
                        console.error(`Erreur dispatch batch:`, invokeErr.message);
                    }
                } catch (e: any) {
                    console.error(`Exception dispatch batch:`, e.message);
                }
            }));
            console.log(`✅ Tous les ${batches.length} batches dispatched.`);
        };

        // @ts-ignore - EdgeRuntime est disponible dans le runtime Supabase
        EdgeRuntime.waitUntil(dispatchAll());

        // --- ÉTAPE D : Réponse immédiate au client ---
        return new Response(JSON.stringify({
            success: true,
            message: "Dispatch lancé en arrière-plan",
            total_bucket: allFilesToProcess.length,
            already_processed: existingSet.size,
            new_files: newFiles.length,
            batches_dispatched: batches.length,
            status: "RUNNING_ASYNC"
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Erreur critique dispatcher:", error.message, error.stack);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
