import { supabase } from './supabase/client';
import type { Resource } from './supabase/types';

/**
 * Recherche de villes via l'API Photon
 */
export async function searchCities(query: string, lang: string) {
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=${lang}`);
    const data = await response.json();
    if (!data.features) return [];

    return data.features
      .filter((f: any) => f.properties.osm_key === 'place' && ['city', 'town', 'village', 'hamlet'].includes(f.properties.osm_value))
      .map((f: any) => ({
        name: f.properties.name,
        sub: [f.properties.city || f.properties.state, f.properties.country].filter(Boolean).join(', '),
        label: [f.properties.name, f.properties.country].filter(Boolean).join(', ')
      }))
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
 * Récupère toutes les ressources pour l'annuaire
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
