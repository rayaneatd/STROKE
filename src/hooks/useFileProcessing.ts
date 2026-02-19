
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

        // 3. Async Pipeline (Hash, Sanitize, PDF Analysis)
        // Process in parallel
        const results = await Promise.all(
            scanningFiles.map(async (item) => {
                const result = await processFilePipeline(item.file, projectId);
                return { item, result };
            })
        );

        // 4. Handle Results
        const newPending: { file: File; id: FileId; metadata: FileMetadata }[] = [];
        const updates: { id: FileId; status: ProjectFile['status']; failureReasons?: string[] }[] = [];

        results.forEach(({ item, result }) => {
            if (result.isValid && result.metadata) {
                // Success -> Move to PENDING
                newPending.push({
                    file: item.file,
                    id: item.id,
                    metadata: result.metadata
                });
                updates.push({ id: item.id, status: 'PENDING' });
            } else {
                // Failure -> Move to FAILED
                updates.push({
                    id: item.id,
                    status: 'FAILED',
                    failureReasons: [result.failure?.errorMessage || 'Unknown validation error']
                });
            }
        });

        // Update Ref
        pendingUploadsRef.current = [...pendingUploadsRef.current, ...newPending];

        // Update State
        setFiles(prev => prev.map(f => {
            const update = updates.find(u => u.id === f.id);
            if (update) {
                return {
                    ...f,
                    status: update.status,
                    failureReasons: update.failureReasons
                };
            }
            return f;
        }));

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
