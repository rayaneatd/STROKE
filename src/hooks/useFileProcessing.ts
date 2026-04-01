
import React, { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectFile, Project, User, FileId, FailedFile } from '../types';
import { processValidatedUploads } from '../services/uploadService';
import { checkConstraints, processFilePipeline, FileMetadata } from '../services/fileValidationService';
import { supabase, SUPABASE_ANON_KEY } from '../lib/supabase';

export const useFileProcessing = (
    projectId: string,
    currentUser: User,
    project: Project | undefined,
    setProject: React.Dispatch<React.SetStateAction<Project | undefined>>
) => {
    const queryClient = useQueryClient();

    // Current Files State (Initially empty, populated by useProjectDetail via setFiles)
    const [files, setFiles] = useState<ProjectFile[]>([]);

    // Store File objects locally for upload
    const pendingUploadsRef = useRef<{ file: File; id: FileId; metadata: FileMetadata }[]>([]);

    // UI Loading State
    const [isUploading, setIsUploading] = useState(false);

    const logFailure = useCallback(async (file: File, reason: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || currentUser.id;

            if (!userId) {
                console.error('No user ID found for logging failure');
                return false;
            }

            // Use robust RPC function instead of direct insert
            const { data, error } = await supabase.rpc('log_failure_event', {
                p_project_id: projectId,
                p_user_id: userId,
                p_reason: reason,
                p_file_name: file.name,
                p_file_size: file.size,
                p_file_type: file.type
            });

            if (error) {
                console.error('Supabase error logging failure via RPC:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('Failed to log failure event:', err);
            return false;
        }
    }, [projectId, currentUser.id]);

    const addFiles = useCallback(async (rawFiles: File[]) => {
        setIsUploading(true);
        // Warm up edge functions to avoid cold starts during processing
        warmUpFunctions();
        let shouldInvalidate = false;

        // Helper for concurrency
        const CONCURRENCY_LIMIT = 30;
        const validForScan: File[] = [];
        const newFailures: ProjectFile[] = [];

        // We process in chunks to allow UI updates and avoid overwhelming the DB/Browser
        const processChunk = async (filesChunk: File[]) => {
            const promises = filesChunk.map(async (file) => {
                // 1. Check constraints
                const constraintError = checkConstraints(file);

                if (constraintError) {
                    const reason = constraintError.errorMessage || constraintError.reason;

                    // 2. Log to DB (Awaited!)
                    await logFailure(file, reason);
                    shouldInvalidate = true;

                    // 3. Prepare for UI
                    return {
                        type: 'FAILURE',
                        data: {
                            id: `fail-${Date.now()}-${Math.random()}` as FileId,
                            projectId: projectId as any,
                            name: file.name,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            status: 'FAILED',
                            uploadedAt: new Date().toISOString(),
                            uploadedByUserId: currentUser.id,
                            failureReasons: [reason],
                            candidateName: file.name.split('.')[0],
                            summary: '',
                            keySkills: [],
                            matchScore: 0
                        } as unknown as ProjectFile
                    };
                } else {
                    return { type: 'VALID', file };
                }
            });

            return Promise.all(promises);
        };

        // Split into chunks of 50
        for (let i = 0; i < rawFiles.length; i += CONCURRENCY_LIMIT) {
            const chunk = rawFiles.slice(i, i + CONCURRENCY_LIMIT);
            const results = await processChunk(chunk);

            const chunkFailures: ProjectFile[] = [];

            results.forEach(res => {
                if (res.type === 'FAILURE' && res.data) {
                    chunkFailures.push(res.data);
                } else if (res.type === 'VALID' && res.file) {
                    validForScan.push(res.file);
                }
            });

            // Progressive Update: Add failures to state immediately
            if (chunkFailures.length > 0) {
                setFiles(prev => [...chunkFailures, ...prev]);
                // Force a query invalidation periodically so the graph updates live?
                // Maybe too aggressive to do it every chunk. Let's do it at the end.
            }
        }

        if (shouldInvalidate) {
            queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
        }

        if (validForScan.length === 0) {
            setIsUploading(false);
            return;
        }

        // 2. Prepare "Scanning" placeholders for valid files
        const scanningFiles = validForScan.map((file, index) => ({
            file,
            id: `local-${Date.now()}-${index}-${Math.random()}` as FileId,
            projectId: projectId as any,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            status: 'SCANNING' as const, // Show spinner/progress
            uploadedAt: new Date().toISOString(),
            uploadedByUserId: currentUser.id
        }));

        // Add scanning files to UI
        setFiles(prev => [...scanningFiles, ...prev]);

        // 3. Async Pipeline (Hash, Sanitize, PDF Analysis) - Aggressive Concurrency
        // Use a concurrency pool of 30 workers to maximize throughput
        const CONCURRENCY_LIMIT_WORKERS = 30;
        const newPending: { file: File; id: FileId; metadata: FileMetadata }[] = [];

        // Initialize known hashes with currently pending files to prevent duplicates
        const knownHashes = new Set(pendingUploadsRef.current.map(p => p.metadata.hash));

        // Processing Queue State
        let currentIndex = 0;
        const totalFiles = scanningFiles.length;
        const pendingUpdates: { id: FileId; status: ProjectFile['status']; failureReasons?: string[] }[] = [];

        // Throttled UI Updater
        const flushUpdates = () => {
            if (pendingUpdates.length === 0) return;

            const batch = [...pendingUpdates];
            pendingUpdates.length = 0; // Clear queue

            setFiles(prev => {
                const next = [...prev];
                // Use Map for O(1) lookups during update
                const updatesMap = new Map(batch.map(u => [u.id, u]));

                for (let i = 0; i < next.length; i++) {
                    const update = updatesMap.get(next[i].id);
                    if (update) {
                        next[i] = { ...next[i], status: update.status, failureReasons: update.failureReasons };
                    }
                }
                return next;
            });
        };

        // Start Throttler Interval (every 500ms)
        const uiInterval = setInterval(flushUpdates, 500);

        // Worker Function
        const worker = async () => {
            while (currentIndex < totalFiles) {
                // Atomic index increment
                const index = currentIndex++;
                if (index >= totalFiles) break;

                const item = scanningFiles[index];

                try {
                    const result = await processFilePipeline(item.file, projectId);

                    if (result.isValid && result.metadata) {
                        // Check for local duplicates
                        // Note: Sets are not perfectly thread-safe in JS async loop if strict order matters,
                        // but here we just want to catch duplicates. Race condition is rare and acceptable.
                        if (knownHashes.has(result.metadata.hash)) {
                            const reason = 'DUPLICATE_FILE: Ce fichier est déjà dans la liste d\'attente ou a été ajouté en double.';
                            const logged = await logFailure(item.file, reason);
                            if (logged) shouldInvalidate = true;
                            pendingUpdates.push({
                                id: item.id,
                                status: 'FAILED',
                                failureReasons: [reason]
                            });
                        } else {
                            knownHashes.add(result.metadata.hash);
                            newPending.push({
                                file: item.file,
                                id: item.id,
                                metadata: result.metadata
                            });
                            pendingUpdates.push({ id: item.id, status: 'PENDING' });
                        }
                    } else {
                        const reason = result.failure?.errorMessage || result.failure?.reason || 'Validation failed';
                        const logged = await logFailure(item.file, reason);
                        if (logged) shouldInvalidate = true;
                        pendingUpdates.push({
                            id: item.id,
                            status: 'FAILED',
                            failureReasons: [reason]
                        });
                    }
                } catch (error) {
                    const reason = 'Unexpected processing error';
                    const logged = await logFailure(item.file, reason);
                    if (logged) shouldInvalidate = true;
                    pendingUpdates.push({
                        id: item.id,
                        status: 'FAILED',
                        failureReasons: [reason]
                    });
                }
            }
        };

        // Launch Workers
        const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, totalFiles) }, () => worker());

        // Wait for all to finish
        await Promise.all(workers);

        // Final Flush
        clearInterval(uiInterval);
        flushUpdates();

        // 4. Finalize
        // Add all valid files to the pending upload queue
        pendingUploadsRef.current = [...pendingUploadsRef.current, ...newPending];

        if (shouldInvalidate) {
            queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
        }

        setIsUploading(false);

    }, [projectId, currentUser.id, logFailure, queryClient]);

    const triggerBulkProcessing = useCallback(async (filesList?: any[]) => {
        try {
            console.log(`[Edge Function] Triggering retreive_resumes_bulk for project: ${projectId} with ${filesList?.length || 'all'} files`);

            const { data: { session } } = await supabase.auth.getSession();
            const userJwt = session?.access_token;
            const anonKey = SUPABASE_ANON_KEY;

            const { data, error } = await supabase.functions.invoke('retreive_resumes_bulk', {
                body: { project_id: projectId, files: filesList },
                headers: {
                    'apikey': anonKey,
                    ...(userJwt ? { 'Authorization': `Bearer ${userJwt}` } : {})
                }
            });

            if (error) {
                console.error('Failed to trigger bulk processing:', error);
                return false;
            }

            console.log('[Edge Function] Bulk processing triggered successfully:', data);
            return true;
        } catch (err) {
            console.error('Error triggering bulk processing:', err);
            return false;
        }
    }, [projectId]);

    const warmUpFunctions = useCallback(async () => {
        try {
            // Ping functions with an empty request to trigger cold starts early
            console.log('[Warm-up] Warming up edge functions...');
            Promise.all([
                supabase.functions.invoke('parse_resumes', { body: { warm_up: true } }),
                supabase.functions.invoke('scan_resumes', { body: { warm_up: true } }),
                supabase.functions.invoke('retreive_resumes_bulk', { body: { warm_up: true } })
            ]).catch(err => console.debug('Warm-up failed (ignore if OPTIONS fails):', err));
        } catch (e) {
            // Silently fail warm-up
        }
    }, []);

    const uploadPendingFiles = useCallback(async () => {
        const pendingFiles = [...pendingUploadsRef.current];
        if (pendingFiles.length === 0) return;

        setIsUploading(true);
        let successCounter = 0;

        // 2. Process Uploads (Storage -> DB) with Progressive Credit Deduction
        let currentBatch: any[] = [];
        const processingFailures = await processValidatedUploads(
            pendingFiles, // pendingFiles already contains { file, id, metadata }
            projectId,
            currentUser.id,
            (count) => {
                console.log(`[UI Sync] Batch of ${count} processed successfully`);
            },
            // Callback for credit deduction per chunk
            async (count) => {
                try {
                    // Use the new project-aware deduction RPC
                    const { data, error } = await supabase.rpc('deduct_scan_credits' as any, {
                        p_project_id: projectId,
                        p_user_id: currentUser.id,
                        p_cost: count
                    });

                    if (error) {
                        console.error('Failed to deduct credits:', error);
                        return false;
                    }

                    const result = data as unknown as { success: boolean; error?: string };
                    if (!result.success) {
                        console.error('Credit deduction denied:', result.error);
                        return false;
                    }

                    return true;
                } catch (err) {
                    console.error('Error executing credit deduction:', err);
                    return false;
                }
            },
            // Callback for individual file success to track and batch for bulk trigger
            (fileInfo) => {
                successCounter++;
                currentBatch.push(fileInfo);

                // --- PROGRESSIVE UI UPDATE ---
                // Do not remove it. Instead, keep it in the UI tracking as 'PROCESSING'
                // so the user knows the AI is still working on it.
                setFiles(prev => prev.map(f => f.id === fileInfo.id ? { ...f, status: 'PROCESSING' } : f));

                // Trigger dispatcher every 9 files to align with 3x3 parallel scanning ratio
                // This avoids spawning "near-empty" instances (prevents the 3+3+3+1 problem)
                if (successCounter % 9 === 0) {
                    triggerBulkProcessing([...currentBatch]);
                    currentBatch = [];
                }
            }
        );

        // 3. Final trigger for any remaining files
        if (currentBatch.length > 0) {
            triggerBulkProcessing(currentBatch);
        }

        // 3. Handle Results
        if (processingFailures.length > 0) {
            const idByFile = new Map<File, FileId>(pendingFiles.map(entry => [entry.file, entry.id]));
            const failureReasonById = new Map<FileId, string>();
            let shouldInvalidate = false;

            for (const pf of processingFailures) {
                const pendingId = idByFile.get(pf.file);
                if (pendingId) {
                    const reason = pf.errorMessage || pf.reason;
                    failureReasonById.set(pendingId, reason);

                    const logged = await logFailure(pf.file, reason);
                    if (logged) shouldInvalidate = true;
                }
            }

            if (failureReasonById.size > 0) {
                setFiles(prev => prev.map(f => {
                    const reason = failureReasonById.get(f.id as FileId);
                    if (!reason) return f;
                    return {
                        ...f,
                        status: 'FAILED',
                        failureReasons: [reason]
                    };
                }));
            }

            if (shouldInvalidate) {
                queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
            }
        }

        // Remove processed files from pending ref (preserving any newly added ones)
        const processedIds = new Set(pendingFiles.map(p => p.id));
        pendingUploadsRef.current = pendingUploadsRef.current.filter(p => !processedIds.has(p.id));

        setIsUploading(false);
    }, [projectId, currentUser.id, logFailure, queryClient]);

    const removeFile = useCallback(async (fileId: string) => {
        // Optimistic removal
        setFiles(prev => prev.filter(f => f.id !== fileId));

        // Remove from pending ref if it's there
        pendingUploadsRef.current = pendingUploadsRef.current.filter(p => p.id !== fileId);

        // Real removal from DB if not a local-only fail
        if (!fileId.startsWith('fail-') && !fileId.startsWith('local-')) {
            const { error } = await supabase
                .from('candidates')
                .delete()
                .eq('id', fileId);

            if (error) {
                console.error("Failed to delete candidate:", error);
                // Rollback if needed (though real-time usually handles this)
            }
        }
    }, []);

    const retryFile = useCallback(async (fileId: string) => {
        if (fileId.startsWith('fail-') || fileId.startsWith('local-')) return;
    }, []);

    const queueFilesForProcessing = useCallback((targetFiles: ProjectFile[]) => {
        // In a real system, this might trigger an edge function or worker.
        console.log(`Queuing ${targetFiles.length} files for AI processing...`);
    }, []);

    return {
        files,
        setFiles,
        isUploading,
        addFiles,
        uploadPendingFiles, // Exported new function
        removeFile,
        retryFile,
        queueFilesForProcessing
    };
};
