import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
