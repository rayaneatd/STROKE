
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Client for Frontend (Storage Uploads, Auth)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin Client for Backend (Bulk DB Inserts, Admin Tasks)
// Note: Only initialize on server environments. Avoid exposing service role in client bundles.
let _admin: any = undefined;
if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  _admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
}
export const supabaseAdmin = _admin;
