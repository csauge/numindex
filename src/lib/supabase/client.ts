import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// If credentials are missing, we don't throw an error during build
// This avoids build failure on Cloudflare if variables are not yet set
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'avif' | 'webp' | 'origin';
}

/**
 * Utility function to get the public URL for an image in the suggestions bucket.
 * Supports Supabase Image Transformations if available on the project.
 */
export const getImageUrl = (path: string | null | undefined, options: ImageOptions = {}) => {
  if (!path || !supabase) return null;
  
  const { data } = supabase.storage.from('suggestions').getPublicUrl(path, {
    transform: options.width || options.height ? {
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
      resize: options.resize || 'contain',
      format: options.format || 'avif' // Default to AVIF for maximum sobriety
    } : undefined
  });
  
  return data.publicUrl;
};
