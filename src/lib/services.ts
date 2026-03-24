import { supabase } from './supabase/client';
import type { Resource, Suggestion, Profile } from './supabase/types';

/**
 * Get current session
 */
export async function getCurrentSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user profile
 */
export async function getProfile(userId: string) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as Profile;
}

/**
 * Get all profiles for mapping IDs to names
 */
export async function fetchAllProfiles() {
  if (!supabase) return [];
  const { data } = await supabase.from('profiles').select('id, full_name');
  return (data || []) as Profile[];
}

/**
 * Recherche d'adresses ou de lieux via l'API Photon
 */
export async function searchAddresses(query: string, lang: string) {
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=${lang}`);
    const data = await response.json();
    if (!data.features) return [];

    return data.features
      .map((f: any) => {
        const p = f.properties;
        const name = [p.housenumber, p.street, p.name].filter(Boolean).join(' ');
        const sub = [p.postcode, p.city || p.town || p.village, p.state, p.country].filter(Boolean).join(', ');
        
        return {
          name,
          sub,
          label: `${name}, ${sub}`.replace(/^, /, '')
        };
      })
      .slice(0, 5);
  } catch (err) {
    console.error('Photon API Error:', err);
    return [];
  }
}

/**
 * Compression et Upload d'image vers Supabase
 */
export async function uploadCompressedImage(file: File) {
  const imageCompression = (await import('browser-image-compression')).default;
  const options = {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.8
  };
  
  const compressedFile = await imageCompression(file, options);
  const fileName = `${Date.now()}-${file.name.split('.')[0]}.webp`;
  const { data, error } = await supabase.storage.from('suggestions').upload(fileName, compressedFile);
  
  if (error) throw error;
  return data?.path;
}

/**
 * Récupère les entités liées possibles
 */
export async function fetchEntities() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('id, title, category')
    .in('category', ['entreprise', 'association', 'personne'])
    .order('title');
  return (data || []) as Resource[];
}

/**
 * Récupère toutes les ressources pour l'index
 */
export async function fetchAllResources() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('*')
    .order('updated_at', { ascending: false });
  return (data || []) as Resource[];
}

/**
 * Récupère tous les événements (passés et futurs)
 */
export async function fetchAllEvents() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('*')
    // Correct way to check for null in JSONB field via PostgREST
    .not('metadata->next_date', 'is', null)
    .order('metadata->next_date', { ascending: false })
    .limit(500);
    
  return (data || []) as Resource[];
}

/**
 * Récupère le nombre de suggestions en attente de modération
 */
export async function fetchPendingSuggestionsCount() {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
    
  if (error) {
    console.error('Error fetching suggestions count:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Récupère une ressource par son ID
 */
export async function fetchResourceById(id: string) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching resource:', error);
    return null;
  }
  return data as Resource;
}

/**
 * Récupère une suggestion par son ID
 */
export async function fetchSuggestionById(id: string) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching suggestion:', error);
    return null;
  }
  return data as Suggestion;
}

/**
 * Récupère les entités pour le mapping des noms
 */
export async function fetchEntitiesForMapping() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('id, title')
    .in('category', ['entreprise', 'association', 'personne']);
  return (data || []) as Resource[];
}
