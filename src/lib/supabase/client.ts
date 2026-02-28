import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// If credentials are missing, we don't throw an error during build
// This avoids build failure on Cloudflare if variables are not yet set
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

/**
 * Utility function to get the public URL for an image in the suggestions bucket.
 */
export const getImageUrl = (path: string | null | undefined) => {
  if (!path || !supabase) return null;
  const { data } = supabase.storage.from('suggestions').getPublicUrl(path);
  return data.publicUrl;
};
