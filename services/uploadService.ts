import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { FailedFile, ProjectId, UserId } from '../types';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // PDF & DOCX
const STORAGE_BUCKET = 'resumes';

/**
 * 1. Validate Files
 * Filters based on size, type, and corruption (0 byte).
 */
export const validateFiles = (files: File[]): { valid: File[]; failed: FailedFile[] } => {
  const valid: File[] = [];
  const failed: FailedFile[] = [];

  files.forEach((file) => {
    if (file.size > MAX_SIZE_BYTES) {
      failed.push({ file, reason: 'SIZE_LIMIT', errorMessage: 'File exceeds 5MB limit' });
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      failed.push({ file, reason: 'INVALID_FORMAT', errorMessage: 'Only PDF and DOCX allowed' });
    } else if (file.size === 0) {
      failed.push({ file, reason: 'CORRUPTION', errorMessage: 'File is empty' });
    } else {
      valid.push(file);
    }
  });

  return { valid, failed };
};

/**
 * Helper: Upload a single file to Supabase Storage
 */
const uploadToStorage = async (file: File, projectId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const uniqueName = `${uuidv4()}.${fileExt}`;
  const filePath = `${projectId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("Storage upload error:", error);
    return null;
  }

  return filePath;
};

/**
 * 2. Orchestrator: Process Uploads
 * Handles the full flow: Validation -> Storage -> DB Insert
 */
export const processUploads = async (
  files: File[],
  projectId: string,
  userId: string,
  onBatchComplete: (count: number) => void
): Promise<FailedFile[]> => {
  const uploadFailures: FailedFile[] = [];
  const UPLOAD_CONCURRENCY = 3;

  for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
    const chunk = files.slice(i, i + UPLOAD_CONCURRENCY);

    await Promise.all(chunk.map(async (file) => {
      try {
        // A. Upload to Storage
        const storagePath = await uploadToStorage(file, projectId);
        if (!storagePath) {
          throw new Error("Failed to upload to storage");
        }

        // B. Insert into DB
        const { error: dbError } = await supabase
          .from('candidates')
          .insert({
            project_id: projectId,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            status: 'PENDING',
            uploaded_by: userId,
            // storage_path: storagePath, // Add this if you want to track the path
          });

        if (dbError) {
          throw dbError;
        }

      } catch (error: any) {
        console.error(`Upload failed for ${file.name}`, error);
        uploadFailures.push({
          file,
          reason: 'STORAGE_UPLOAD_FAILED',
          errorMessage: error.message || 'Error during upload'
        });
      }
    }));

    onBatchComplete(chunk.length - uploadFailures.length);
  }

  return uploadFailures;
};
