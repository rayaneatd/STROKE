
import React, { useState, useCallback, useRef } from 'react';
import { ProjectFile, Project, User, FileId, FailedFile } from '../types';
import { processValidatedUploads } from '../services/uploadService';
import { checkConstraints, processFilePipeline, FileMetadata } from '../services/fileValidationService';
import { supabase } from '../lib/supabase';

export const useFileProcessing = (
    projectId: string,
    currentUser: User,
    project: Project | undefined,
    setProject: React.Dispatch<React.SetStateAction<Project | undefined>>
) => {
    // Current Files State (Initially empty, populated by useProjectDetail via setFiles)
    const [files, setFiles] = useState<ProjectFile[]>([]);
    
    // Store File objects locally for upload
    const pendingUploadsRef = useRef<{ file: File; id: FileId; metadata: FileMetadata }[]>([]);

    // UI Loading State
    const [isUploading, setIsUploading] = useState(false);

    const addFiles = useCallback(async (rawFiles: File[]) => {
        // 1. Instant Validation (Sync)
        const validForScan: File[] = [];
        const immediateFailures: ProjectFile[] = [];

        const logFailure = async (file: File, reason: string) => {
            try {
                await supabase.from('analytics_events').insert({
                    project_id: projectId,
                    user_id: currentUser.id,
                    event_type: 'FAIL',
                    metadata: {
                        reason,
                        fileName: file.name,
                        size: file.size,
                        type: file.type
                    }
                });
            } catch (err) {
                console.error('Failed to log failure event:', err);
            }
        };

        rawFiles.forEach(file => {
            const constraintError = checkConstraints(file);
            if (constraintError) {
                const reason = constraintError.errorMessage || constraintError.reason;
                logFailure(file, reason);
                immediateFailures.push({
                    id: `fail-${Date.now()}-${Math.random()}` as FileId,
                    projectId: projectId as any,
                    name: file.name,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    status: 'FAILED',
                    uploadedAt: new Date().toISOString(),
                    uploadedByUserId: currentUser.id,
                    failureReasons: [reason]
                });
            } else {
                validForScan.push(file);
            }
        });

        // Add immediate failures to state
        if (immediateFailures.length > 0) {
            setFiles(prev => [...immediateFailures, ...prev]);
        }

        if (validForScan.length === 0) return;

        // 2. Prepare "Scanning" placeholders
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
        const CONCURRENCY_LIMIT = 30;
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
                            logFailure(item.file, reason);
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
                        logFailure(item.file, reason);
                        pendingUpdates.push({
                            id: item.id,
                            status: 'FAILED',
                            failureReasons: [reason]
                        });
                    }
                } catch (error) {
                     const reason = 'Unexpected processing error';
                     logFailure(item.file, reason);
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

    }, [projectId, currentUser.id]);

    const uploadPendingFiles = useCallback(async () => {
        const pendingFiles = [...pendingUploadsRef.current];
        if (pendingFiles.length === 0) return;

        setIsUploading(true);

        // 2. Process Uploads (Storage -> DB)
        const processingFailures = await processValidatedUploads(
            pendingFiles,
            projectId,
            currentUser.id,
            (count) => {
                console.log(`[UI Sync] Batch of ${count} processed successfully`);
            }
        );

        // 3. Handle Results
        if (processingFailures.length > 0) {
            const idByFile = new Map<File, FileId>(pendingFiles.map(entry => [entry.file, entry.id]));
            const failureReasonById = new Map<FileId, string>();

            processingFailures.forEach(pf => {
                const pendingId = idByFile.get(pf.file);
                if (pendingId) {
                    const reason = pf.errorMessage || pf.reason;
                    failureReasonById.set(pendingId, reason);

                    // Log failure event
                    supabase.from('analytics_events').insert({
                        project_id: projectId,
                        user_id: currentUser.id,
                        event_type: 'FAIL',
                        metadata: {
                            reason,
                            fileName: pf.file.name,
                            size: pf.file.size,
                            type: pf.file.type
                        }
                    }).then(({ error }) => {
                        if (error) console.error('Failed to log upload failure:', error);
                    });
                }
            });

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
        }
        
        // Remove processed files from pending ref (preserving any newly added ones)
        const processedIds = new Set(pendingFiles.map(p => p.id));
        pendingUploadsRef.current = pendingUploadsRef.current.filter(p => !processedIds.has(p.id));
        
        setIsUploading(false);
    }, [projectId, currentUser.id]);

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
