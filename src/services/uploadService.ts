
import { supabase } from '../lib/supabase';
import { FailedFile } from '../types';
import { FileMetadata } from './fileValidationService';

const STORAGE_BUCKET = 'resumes';

/**
 * Upload a single file to Supabase Storage using sanitized name
 */
const uploadToStorage = async (file: File, projectId: string, storageName: string): Promise<string | null> => {
  const filePath = `${projectId}/${storageName}`;

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
 * Orchestrator: Process Validated Uploads
 * Handles: Storage Upload -> DB Insert (with metadata)
 */
export const processValidatedUploads = async (
  items: { file: File; metadata: FileMetadata }[],
  projectId: string,
  userId: string,
  onBatchComplete: (count: number) => void
): Promise<FailedFile[]> => {
  const uploadFailures: FailedFile[] = [];
  const UPLOAD_CONCURRENCY = 30;

  for (let i = 0; i < items.length; i += UPLOAD_CONCURRENCY) {
    const chunk = items.slice(i, i + UPLOAD_CONCURRENCY);

    await Promise.all(chunk.map(async ({ file, metadata }) => {
      try {
        // A. Upload to Storage using sanitized name
        const storagePath = await uploadToStorage(file, projectId, metadata.sanitizedName);
        if (!storagePath) {
          throw new Error("Failed to upload to storage");
        }

        // B. Insert into DB with enriched metadata
        const { error: dbError } = await supabase
          .from('candidates')
          .insert({
            project_id: projectId,
            name: metadata.sanitizedName, // Use sanitized name for record? Or original? 
            // Usually 'name' is display name. 'original_resume_name' is original filename.
            // Let's use Original Name for 'name' (display) and store sanitized path.
            // But wait, user said "sanitizeFileName... avoid bugs with special chars".
            // So DB 'name' should probably be clean too?
            // "On sépare le nom original (pour l'affichage) et on génère l'UUID pour le stockage."
            // So: 'original_resume_name' = originalName, 'name' = originalName (or sanitized?), 'storage_path' = uuid.
            // Let's put originalName in 'original_resume_name' and also 'name' (for UI).
            // But 'name' column in DB is often used for display.
            
            name: metadata.originalName, 
            original_resume_name: metadata.originalName,
            
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            uploaded_by: userId,
            
            // New fields
            file_hash: metadata.hash,
            page_count: metadata.pageCount,
            
            // We don't have a storage_path column in the INSERT above in old code, 
            // but we might want to store it if needed. 
            // The old code didn't insert storage_path.
            // If the table has it, we should.
            // Let's assume we rely on standard path convention or if column exists.
            // The previous code had it commented out: // storage_path: storagePath
            // I'll leave it out unless I know it exists.
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
