
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or use a polyfill
import { supabaseClient } from './supabase';
import { CandidateFileMetadata, FailedFile, WebhookPayload, ProjectId, UserId } from '../types';

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
const uploadToStorage = async (file: File, projectId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const uniqueName = `${uuidv4()}.${fileExt}`;
  const filePath = `${projectId}/${uniqueName}`;

  // MOCK MODE: If mock Supabase URL is configured, simulate success
  if ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-supabase-url.co') {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency
      if (Math.random() > 0.98) throw new Error("Simulated Upload Failure");
      return filePath;
  }

  // REAL MODE
  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
    });

  if (error) throw error;
  
  return filePath;
};

/**
 * 2. Webhook Dispatcher
 * Sends metadata batch to Next.js API.
 */
const sendBulkWebhook = async (payload: WebhookPayload): Promise<void> => {
  // MOCK MODE: If mock Supabase URL is configured, simulate API call
  if ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-supabase-url.co') {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (Math.random() > 0.95) throw new Error("Simulated Webhook Failure");
      console.log("[Mock Webhook] Payload sent:", payload);
      return;
  }

  // REAL MODE
  const response = await fetch('/api/webhooks/bulk-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }
};

/**
 * 3. Orchestrator: Process Uploads
 * Handles the full flow: Validation -> Storage -> Batching -> Webhook
 */
export const processUploads = async (
  files: File[],
  projectId: string,
  userId: string,
  onBatchComplete: (count: number) => void
): Promise<FailedFile[]> => {
  const uploadFailures: FailedFile[] = [];
  const validCandidates: CandidateFileMetadata[] = [];

  // A. Upload to Storage first (Parallel execution for velocity)
  // We chunk this slightly to avoid browser connection limits if 100+ files
  const UPLOAD_CONCURRENCY = 5;
  for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
      const chunk = files.slice(i, i + UPLOAD_CONCURRENCY);
      
      await Promise.all(chunk.map(async (file) => {
        try {
            const storagePath = await uploadToStorage(file, projectId);
            validCandidates.push({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storagePath,
            });
        } catch (error: any) {
            console.error(`Storage upload failed for ${file.name}`, error);
            uploadFailures.push({ 
                file, 
                reason: 'STORAGE_UPLOAD_FAILED', 
                errorMessage: error.message || 'Network error during upload' 
            });
        }
      }));
  }

  if (validCandidates.length === 0) return uploadFailures;

  // B. Batching Logic for Webhook (Random 5-10 as requested)
  // We process these sequentially to ensure order and error isolation per batch
  let cursor = 0;
  while (cursor < validCandidates.length) {
      const batchSize = Math.floor(Math.random() * (10 - 5 + 1) + 5);
      const chunk = validCandidates.slice(cursor, cursor + batchSize);
      cursor += batchSize;

      const payload: WebhookPayload = {
          batchId: uuidv4(),
          projectId,
          userId,
          totalInBatch: chunk.length,
          candidates: chunk,
      };

      try {
          // C. Dispatch Webhook
          await sendBulkWebhook(payload);
          onBatchComplete(chunk.length);
      } catch (error: any) {
          console.error('Batch DB insert failed', error);
          // If webhook fails, we mark these specific files as failed (even though they are in storage)
          // In a real system, you'd have a cleanup cron job for orphaned storage files
          chunk.forEach(c => {
              // Create a mock file object reference for the UI error report
              const originalFile = files.find(f => f.name === c.fileName);
              if (originalFile) {
                  uploadFailures.push({ 
                      file: originalFile, 
                      reason: 'WEBHOOK_FAILED',
                      errorMessage: 'Metadata sync failed' 
                  });
              }
          });
      }
  }

  return uploadFailures;
};
