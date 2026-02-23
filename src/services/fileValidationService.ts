
import { v4 as uuidv4 } from 'uuid';
// import * as pdfjsLib from 'pdfjs-dist';
// // @ts-ignore
// import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { FailedFile } from '../types';
import { supabase } from '../lib/supabase';

// Configure PDF.js worker
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (User Request for Speed)
const ALLOWED_MIME = 'application/pdf';
// SPEED MODE: Disable full PDF analysis to maximize throughput
const ENABLE_DEEP_ANALYSIS = false;

export interface FileMetadata {
  hash: string;
  pageCount: number;
  textPreview: string;
  sanitizedName: string; // UUID based name for storage
  originalName: string;
  resumeId: string; // Client-side generated UUID
}

export interface ValidationResult {
  file: File;
  isValid: boolean;
  metadata?: FileMetadata;
  failure?: FailedFile;
}

/**
 * 1. Check Constraints (Synchronous & Instant)
 */
export const checkConstraints = (file: File): FailedFile | null => {
  // Strict MIME check
  if (file.type !== ALLOWED_MIME) {
    return {
      file,
      reason: 'INVALID_FORMAT',
      errorMessage: 'Seuls les fichiers PDF sont acceptés (application/pdf).'
    };
  }

  // Size check
  if (file.size > MAX_SIZE_BYTES) {
    return {
      file,
      reason: 'SIZE_LIMIT',
      errorMessage: `Le fichier dépasse la limite de 10MB (${(file.size / 1024 / 1024).toFixed(2)} MB).`
    };
  }

  if (file.size === 0) {
    return {
      file,
      reason: 'CORRUPTION',
      errorMessage: 'Le fichier est vide.'
    };
  }

  return null;
};

/**
 * 2. Generate File Hash (Async - Parallel)
 * Optimized: Only hash the first 4KB (Header) for extreme speed if file is large.
 * Or better: hash the whole file but efficient?
 * User wants SPEED.
 * Full file hash is safest for integrity. 
 * But for 1000 files, reading all bytes is slow.
 * Compromise: SHA-256 is fast. Reading arrayBuffer is the bottleneck for large files.
 * Let's keep full hash for safety, but rely on 5MB limit to keep it fast.
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Check for duplicates in DB using hash
 */
export const checkDuplicate = async (hash: string, projectId: string): Promise<boolean> => {
  // Use a raw count query to avoid deep type instantiation issues with TypeScript
  const { count, error } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true }) // Using 'id' instead of '*' is safer
    .eq('project_id', projectId)
    .eq('file_hash', hash);

  if (error) {
    console.error('Error checking duplicate:', error);
    return false; // Fail safe
  }

  return (count || 0) > 0;
};

/**
 * 3. Sanitize File Name
 */
export const sanitizeFileName = (originalName: string): { originalName: string; storageName: string; resumeId: string } => {
  // Keep original name for display, but clean it slightly if needed (optional)
  // Generate UUID for storage to avoid collision and URL issues
  const extension = originalName.split('.').pop() || 'pdf';
  const resumeId = uuidv4();
  const storageName = `${resumeId}.${extension}`;
  
  return {
    originalName,
    storageName,
    resumeId
  };
};

/**
 * 4. Extract Metadata and Preview (PDF Analysis)
 */
export const extractMetadataAndPreview = async (file: File): Promise<{ pageCount: number; textPreview: string }> => {
  // SPEED MODE: Skip expensive PDF parsing
  // Always return dummy data to avoid loading PDF.js
  return {
    pageCount: 1, // Default dummy value
    textPreview: '' // No preview
  };

  /* 
  // DISABLED FOR SPEED OPTIMIZATION
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // Disable auto-fetch to avoid extra requests
      disableAutoFetch: true,
      disableStream: true
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    // Check page count limit (heuristic: > 50 pages is likely not a resume)
    if (pageCount > 50) {
      throw new Error('TOO_MANY_PAGES');
    }

    // Extract text from first page to check if empty/readable
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str).join(' ');
    
    // Cleanup
    page.cleanup();
    pdf.cleanup();
    pdf.destroy();
    
    if (!textItems || textItems.trim().length === 0) {
       // Try checking if it's a scanned image PDF (not implemented here, but could warn)
       // For now, if strictly empty text, might be an issue, but some PDFs are just images.
       // We'll proceed but maybe flag it? 
       // User asked: "Vérifier que le PDF n'est pas vide".
       // If page count > 0, it's not "empty" in file sense, but maybe "empty content".
       // Let's assume strict requirement: must have some text? 
       // No, scanned PDFs are common. Let's just return empty string preview.
    }

    return {
      pageCount,
      textPreview: textItems.substring(0, 200) // First 200 chars
    };

  } catch (error: any) {
    if (error.name === 'PasswordException') {
      throw new Error('PASSWORD_PROTECTED');
    }
    if (error.message === 'TOO_MANY_PAGES') {
      throw error;
    }
    // Generic corruption or parsing error
    throw new Error('CORRUPTION');
  }
  */
};

/**
 * Orchestrator: Process a single file through the pipeline
 */
export const processFilePipeline = async (
  file: File, 
  projectId: string
): Promise<ValidationResult> => {
  // 1. Constraints
  const constraintError = checkConstraints(file);
  if (constraintError) {
    return { file, isValid: false, failure: constraintError };
  }

  try {
    // 2. Hash & Duplicate Check
    const hash = await generateFileHash(file);
    const isDuplicate = await checkDuplicate(hash, projectId);
    
    if (isDuplicate) {
      return {
        file,
        isValid: false,
        failure: {
          file,
          reason: 'DUPLICATE_FILE',
          errorMessage: 'Ce fichier a déjà été importé dans ce projet.'
        }
      };
    }

    // 3. Sanitize
    const { originalName, storageName, resumeId } = sanitizeFileName(file.name);

    // 4. PDF Analysis
    const { pageCount, textPreview } = await extractMetadataAndPreview(file);

    return {
      file,
      isValid: true,
      metadata: {
        hash,
        pageCount,
        textPreview,
        sanitizedName: storageName,
        originalName,
        resumeId
      }
    };

  } catch (error: any) {
    let reason: FailedFile['reason'] = 'CORRUPTION';
    let errorMessage = 'Erreur lors de l\'analyse du fichier.';

    if (error.message === 'PASSWORD_PROTECTED') {
      reason = 'PASSWORD_PROTECTED';
      errorMessage = 'Le fichier est protégé par un mot de passe.';
    } else if (error.message === 'TOO_MANY_PAGES') {
      reason = 'TOO_MANY_PAGES';
      errorMessage = 'Le fichier contient trop de pages (> 50).';
    } else if (error.message === 'CORRUPTION') {
      reason = 'CORRUPTION';
      errorMessage = 'Le fichier semble corrompu ou illisible.';
    }

    return {
      file,
      isValid: false,
      failure: {
        file,
        reason,
        errorMessage
      }
    };
  }
};
