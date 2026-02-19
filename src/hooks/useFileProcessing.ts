
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

        rawFiles.forEach(file => {
            const constraintError = checkConstraints(file);
            if (constraintError) {
                immediateFailures.push({
                    id: `fail-${Date.now()}-${Math.random()}` as FileId,
                    projectId: projectId as any,
                    name: file.name,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    status: 'FAILED',
                    uploadedAt: new Date().toISOString(),
                    uploadedByUserId: currentUser.id,
                    failureReasons: [constraintError.errorMessage || constraintError.reason]
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

        // 3. Async Pipeline (Hash, Sanitize, PDF Analysis) - Batched to prevent UI freeze
        // Batch size reduced to 10 to minimize memory usage (File.arrayBuffer) and ensure fluid UI updates
        const BATCH_SIZE = 10;
        const newPending: { file: File; id: FileId; metadata: FileMetadata }[] = [];
        const updates: { id: FileId; status: ProjectFile['status']; failureReasons?: string[] }[] = [];
        
        // Initialize known hashes with currently pending files to prevent duplicates
        // We do this ONCE before the loop so duplicate checks work across batches
        const knownHashes = new Set(pendingUploadsRef.current.map(p => p.metadata.hash));

        for (let i = 0; i < scanningFiles.length; i += BATCH_SIZE) {
            const batch = scanningFiles.slice(i, i + BATCH_SIZE);
            
            // Process batch in parallel
            const batchResults = await Promise.all(
                batch.map(async (item) => {
                    // processFilePipeline is already async (hashing off-main-thread, etc.)
                    const result = await processFilePipeline(item.file, projectId);
                    return { item, result };
                })
            );

            // Handle Batch Results immediately to update UI incrementally
            const batchUpdates: { id: FileId; status: ProjectFile['status']; failureReasons?: string[] }[] = [];

            batchResults.forEach(({ item, result }) => {
                if (result.isValid && result.metadata) {
                    // Check for local duplicates (Pending or Intra-batch)
                    if (knownHashes.has(result.metadata.hash)) {
                        batchUpdates.push({
                            id: item.id,
                            status: 'FAILED',
                            failureReasons: ['DUPLICATE_FILE: Ce fichier est déjà dans la liste d\'attente ou a été ajouté en double.']
                        });
                    } else {
                        // Success -> Move to PENDING
                        knownHashes.add(result.metadata.hash); // Add to known hashes for subsequent items
                        newPending.push({
                            file: item.file,
                            id: item.id,
                            metadata: result.metadata
                        });
                        batchUpdates.push({ id: item.id, status: 'PENDING' });
                    }
                } else {
                    // Failed validation in pipeline (e.g. empty PDF content)
                    batchUpdates.push({
                        id: item.id,
                        status: 'FAILED',
                        failureReasons: result.failure?.reason ? [result.failure.errorMessage || result.failure.reason] : ['Validation failed']
                    });
                }
            });

            // Update local accumulators
            updates.push(...batchUpdates);

            // Update UI State incrementally for this batch
            setFiles(prev => {
                const next = [...prev];
                batchUpdates.forEach(u => {
                    const idx = next.findIndex(f => f.id === u.id);
                    if (idx !== -1) {
                        next[idx] = { ...next[idx], status: u.status, failureReasons: u.failureReasons };
                    }
                });
                return next;
            });

            // Yield to main thread to allow UI to render (prevent freeze)
            await new Promise(resolve => setTimeout(resolve, 0));
        }

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
                    failureReasonById.set(pendingId, pf.errorMessage || pf.reason);
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
