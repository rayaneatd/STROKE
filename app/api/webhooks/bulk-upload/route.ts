
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';
import { WebhookPayload } from '@/types';

// Force dynamic if necessary, though POST is usually dynamic
export const dynamic = 'force-dynamic'; 

export async function POST(req: NextRequest) {
  try {
    const body: WebhookPayload = await req.json();
    const { batchId, projectId, userId, candidates } = body;

    // Basic validation
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ message: 'No candidates provided' }, { status: 400 });
    }

    if (!projectId || !userId) {
        return NextResponse.json({ message: 'Missing context (projectId or userId)' }, { status: 400 });
    }

    // Transform payload for Database Schema
    // Schema assumption: 
    // Table: candidates
    // Columns: id, batch_id, project_id, user_id, file_name, storage_path, file_size, status, created_at
    const dbPayload = candidates.map((candidate) => ({
      batch_id: batchId,
      project_id: projectId,
      user_id: userId,
      file_name: candidate.fileName,
      storage_path: candidate.storagePath,
      file_size: candidate.fileSize,
      status: 'Pending', // Initial status for UI sync
      created_at: new Date().toISOString(),
    }));

    // Perform Bulk Insert using Service Role (Admin)
    const { error } = await supabaseAdmin
      .from('candidates')
      .insert(dbPayload);

    if (error) {
      console.error('Supabase DB Insert Error:', error);
      // Return 500 so the client knows to retry or fail
      return NextResponse.json({ message: 'Database insert failed', details: error.message }, { status: 500 });
    }

    // 4. Return 200 OK immediately
    return NextResponse.json({ 
      success: true, 
      processed: candidates.length, 
      batchId 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Handler Internal Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
