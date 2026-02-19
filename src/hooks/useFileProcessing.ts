import React, { useState, useCallback, useRef } from 'react';
import { ProjectFile, Project, User, FileId } from '../types';
import { validateFiles, processUploads } from '../services/uploadService';
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
    const pendingUploadsRef = useRef<{ file: File; id: FileId }[]>([]);

    // UI Loading State
    const [isUploading, setIsUploading] = useState(false);

    const addFiles = useCallback((rawFiles: File[]) => {
        // 1. Validation
        const { valid, failed } = validateFiles(rawFiles);

        // Immediately add failed files to list so user sees them (local only)
        const failedProjectFiles: ProjectFile[] = failed.map(f => ({
            id: `fail-${Date.now()}-${Math.random()}` as FileId,
            projectId: projectId as any,
            name: f.file.name,
            size: `${(f.file.size / 1024 / 1024).toFixed(2)} MB`,
            status: 'FAILED',
            uploadedAt: new Date().toISOString(),
            uploadedByUserId: currentUser.id,
            failureReasons: [f.errorMessage || f.reason]
        }));

        if (failedProjectFiles.length > 0) {
            setFiles(prev => [...failedProjectFiles, ...prev]);
        }

        if (valid.length === 0) {
            return;
        }

        // Create pending files with IDs
        const pendingLocalFiles: { file: File; id: FileId }[] = valid.map((file, index) => ({
            file,
            id: `local-${Date.now()}-${index}-${Math.random()}` as FileId
        }));

        // Update Ref with new files
        pendingUploadsRef.current = [...pendingUploadsRef.current, ...pendingLocalFiles];

        const pendingProjectFiles: ProjectFile[] = pendingLocalFiles.map(({ file, id }) => ({
            id,
            projectId: projectId as any,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            status: 'PENDING',
            uploadedAt: new Date().toISOString(),
            uploadedByUserId: currentUser.id
        }));

        setFiles(prev => [...pendingProjectFiles, ...prev]);
        
        // Removed: processUploads call (now manual)
    }, [projectId, currentUser.id]);

    const uploadPendingFiles = useCallback(async () => {
        const pendingFiles = [...pendingUploadsRef.current];
        if (pendingFiles.length === 0) return;

        setIsUploading(true);

        const filesToUpload = pendingFiles.map(p => p.file);

        // 2. Process Uploads (Storage -> DB)
        const processingFailures = await processUploads(
            filesToUpload,
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
