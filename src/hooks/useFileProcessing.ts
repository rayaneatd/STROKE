import React, { useState, useCallback } from 'react';
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

    // UI Loading State
    const [isUploading, setIsUploading] = useState(false);

    const addFiles = useCallback(async (rawFiles: File[]) => {
        setIsUploading(true);

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
            setIsUploading(false);
            return;
        }

        // 2. Process Uploads (Storage -> DB)
        const processingFailures = await processUploads(
            valid,
            projectId,
            currentUser.id,
            (count) => {
                console.log(`[UI Sync] Batch of ${count} processed successfully`);
            }
        );

        // 3. Handle Results
        if (processingFailures.length > 0) {
            const newFailureFiles: ProjectFile[] = processingFailures.map(pf => ({
                id: `fail-${Date.now()}-${Math.random()}` as FileId,
                projectId: projectId as any,
                name: pf.file.name,
                size: `${(pf.file.size / 1024 / 1024).toFixed(2)} MB`,
                status: 'FAILED',
                uploadedAt: new Date().toISOString(),
                uploadedByUserId: currentUser.id,
                failureReasons: [pf.errorMessage || pf.reason]
            }));
            setFiles(prev => [...newFailureFiles, ...prev]);
        }

        setIsUploading(false);
    }, [projectId, currentUser.id]);

    const removeFile = useCallback(async (fileId: string) => {
        // Optimistic removal
        setFiles(prev => prev.filter(f => f.id !== fileId));

        // Real removal from DB if not a local-only fail
        if (!fileId.startsWith('fail-')) {
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
        // For local-only failures, user needs to re-upload.
        // For DB records in 'FAILED' status, we reset them.
        if (fileId.startsWith('fail-')) return;

        setFiles(prev => prev.map(f => {
            if (f.id === fileId) {
                return { ...f, status: 'PENDING', failureReasons: [] };
            }
            return f;
        }));

        const { error } = await supabase
            .from('candidates')
            .update({ status: 'PENDING', failure_reasons: [] } as any)
            .eq('id', fileId);

        if (error) {
            console.error("Failed to retry candidate:", error);
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'FAILED' } : f));
        }
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
        removeFile,
        retryFile,
        queueFilesForProcessing
    };
};