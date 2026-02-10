import React, { useState, useCallback } from 'react';
import { ProjectFile, Project, User, FileId, FailedFile } from '../types';
import { MOCK_FILES } from '../services/mockData';
import { validateFiles, processUploads } from '../services/uploadService';

export const useFileProcessing = (
    projectId: string,
    currentUser: User,
    project: Project | undefined,
    setProject: React.Dispatch<React.SetStateAction<Project | undefined>>
) => {
    // Current Files State (Mock + Newly Added)
    const [files, setFiles] = useState<ProjectFile[]>(
        MOCK_FILES.filter(f => f.projectId === projectId)
    );
    
    // UI Loading State
    const [isUploading, setIsUploading] = useState(false);
    
    // Tracking failed uploads separately or integrating into the main list
    // The previous implementation mapped failed files to ProjectFile. 
    // We will continue this pattern for UI consistency.

    const addFiles = useCallback(async (rawFiles: File[]) => {
        setIsUploading(true);

        // 1. Validation
        const { valid, failed } = validateFiles(rawFiles);

        // Immediately add failed files to list so user sees them
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

        setFiles(prev => [...failedProjectFiles, ...prev]);

        if (valid.length === 0) {
            setIsUploading(false);
            return;
        }

        // 2. Process Uploads (Storage -> Webhook)
        const processingFailures = await processUploads(
            valid,
            projectId,
            currentUser.id,
            (count) => {
                // On Batch Complete (Optimistic UI Update)
                // In a real app, we might wait for a websocket/subscription update
                // Here we create "Pending" files to show progress
                console.log(`[UI Sync] Batch of ${count} processed successfully`);
            }
        );

        // 3. Handle Results
        
        // Identify which valid files actually succeeded (weren't returned in failures)
        const successfulFiles = valid.filter(v => 
            !processingFailures.find(pf => pf.file.name === v.name)
        );

        // Create ProjectFile objects for successes
        const newSuccessFiles: ProjectFile[] = successfulFiles.map(file => ({
            id: `new-${Date.now()}-${Math.random()}` as FileId,
            projectId: projectId as any,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            status: 'PENDING', // Initial state for candidates table
            uploadedAt: new Date().toISOString(),
            uploadedByUserId: currentUser.id,
            candidateName: 'Processing...', // Placeholder until AI runs
            viewedBy: [],
            exportedBy: []
        }));

        // Create ProjectFile objects for network/storage failures
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

        setFiles(prev => [...newSuccessFiles, ...newFailureFiles, ...prev]);
        setIsUploading(false);

    }, [projectId, currentUser.id]);

    const removeFile = useCallback((fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

    const retryFile = useCallback((fileId: string) => {
        // In a real file-based retry, we'd need the original File object.
        // For this architecture, we usually remove and re-upload via the input.
        // However, we can simulate a retry of the backend processing if it was a webhook failure.
        
        setFiles(prev => prev.map(f => {
            if (f.id === fileId && f.status === 'FAILED') {
                return { ...f, status: 'PENDING', failureReasons: [] };
            }
            return f;
        }));
        
        // Simulating the async retry effect
        setTimeout(() => {
            setFiles(prev => prev.map(f => {
                if (f.id === fileId && f.status === 'PENDING') {
                    // Random success for simulation
                    return Math.random() > 0.5 
                        ? { ...f, status: 'COMPLETED', score: 75, candidateName: 'Retried Candidate' } 
                        : { ...f, status: 'FAILED', failureReasons: ['Retry Failed'] };
                }
                return f;
            }));
        }, 1500);

    }, []);

    // Queue method kept for compatibility with existing components
    const queueFilesForProcessing = useCallback((targetFiles: ProjectFile[]) => {
        // Logic to re-queue existing ProjectFiles if needed
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