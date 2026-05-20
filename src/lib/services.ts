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
 * Check if the current user is an admin
 */
export async function isUserAdmin() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return !!data;
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
        const [lng, lat] = f.geometry.coordinates;
        
        return {
          name,
          sub,
          label: `${name}, ${sub}`.replace(/^, /, ''),
          lat,
          lng
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
  const mod = await import('browser-image-compression');
  const imageCompression = mod.default || mod;
  const options = {
    maxSizeMB: 0.02,
    maxWidthOrHeight: 600,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.6
  };
  
  const compressedFile = await imageCompression(file, options);
  const fileName = `${Date.now()}-${file.name.split('.')[0]}.webp`;
  const { data, error } = await supabase.storage.from('suggestions').upload(fileName, compressedFile);
  
  if (error) throw error;
  return data?.path;
}

/**
 * Récupère les entités liées possibles (Acteur)
 */
export async function fetchEntities() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('id, title, category')
    .eq('category', 'acteur')
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
    .select('*');
  return (data || []) as Resource[];
}

/**
 * Récupère les ressources avec coordonnées (lat/lng)
 */
export async function fetchResourcesWithLocation() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('resources')
    .select('*')
    .not('metadata->lat', 'is', null)
    .not('metadata->lng', 'is', null);
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
    .eq('category', 'acteur');
  return (data || []) as Resource[];
}

/**
 * Helper : Trouve la prochaine date d'un événement
 */
export function getNextEventDate(resource: Resource): string | null {
  if (resource.category !== 'evenement' || !resource.metadata?.occurrences) return null;
  const now = new Date();
  const futureDates = sortOccurrences(resource.metadata.occurrences)
    .map((occ: any) => new Date(occ.start))
    .filter((d: Date) => d >= now);
    
  return futureDates.length > 0 ? futureDates[0].toISOString() : null;
}

/**
 * Helper : Trie les occurrences par date de début
 */
export function sortOccurrences(occurrences: any[]) {
  return [...(occurrences || [])].sort((a, b) => {
    const dateA = a.start ? new Date(a.start).getTime() : 0;
    const dateB = b.start ? new Date(b.start).getTime() : 0;
    return dateA - dateB;
  });
}

/**
 * Logique de tri par catégorie
 */
export function sortResources(resources: Resource[], category: string | 'all') {
  return [...resources].sort((a, b) => {
    // Si filtré par catégorie spécifique
    if (category === 'acteur' || category === 'outil') {
      return a.title.localeCompare(b.title);
    }
    
    if (category === 'evenement') {
      const dateA = getNextEventDate(a);
      const dateB = getNextEventDate(b);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    }
    
    if (category === 'contenu') {
      const dateA = a.metadata?.published_at || '0000-00-00';
      const dateB = b.metadata?.published_at || '0000-00-00';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }

    // Par défaut : mise à jour la plus récente
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

/**
 * Logique de groupement pour l'affichage (Dividers)
 */
export function getResourceGroup(resource: any, sortBy: string, t: any, currentLang: string, today: string, favCount: number = 0) {
  if (sortBy === 'favorites') {
    return favCount > 0 ? t.popular : t.others;
  }
  if (sortBy === 'updated_at' || sortBy === 'published_at') {
    const dateStr = sortBy === 'published_at' ? resource.pub : resource.up;
    if (!dateStr) return t.noDate;
    const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 86400000;
    return diff < 7 ? t.thisWeek : diff < 30 ? t.thisMonth : diff < 365 ? t.thisYear : t.older;
  }
  if (sortBy === 'title') return resource.title[0].toUpperCase();
  if (sortBy === 'cat') return resource.catLabel;
  if (sortBy === 'next_date') {
    return !resource.next ? t.noDate : resource.next < today ? t.pastDate : new Date(resource.next).toLocaleDateString(currentLang, { month: 'long', year: 'numeric' });
  }
  return '';
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
 * Helper : Génère les épingles pour la carte à partir d'une ressource
 */
export function getMapPins(resource: Resource, lang: 'fr' | 'en') {
  const pins: any[] = [];
  const now = new Date();

  if (resource.category === 'evenement' && resource.metadata?.occurrences) {
    // Événements : une épingle par occurrence future avec coordonnées
    resource.metadata.occurrences.forEach((occ: any, index: number) => {
      const hasCoords = occ.lat && occ.lng;
      // On considère une occurrence future si sa date de fin (ou de début par défaut) n'est pas passée
      const endDate = occ.end || occ.start;
      const isFuture = !endDate || new Date(endDate) >= now;
      
      if (hasCoords && isFuture) {
        pins.push({
          id: `${resource.id}-${index}`,
          title: `${resource.title} (${new Date(occ.start).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')})`,
          lat: occ.lat,
          lng: occ.lng,
          category: resource.category,
          link: `/${lang}/resource/${resource.id}`
        });
      }
    });

    if (pins.length > 0) return pins;
  }

  // Fallback (Acteur ou Événement sans occurrences spécifiques)
  if (resource.metadata?.lat && resource.metadata?.lng) {
    pins.push({
      id: resource.id,
      title: resource.title,
      lat: resource.metadata.lat,
      lng: resource.metadata.lng,
      category: resource.category,
      link: `/${lang}/resource/${resource.id}`
    });
  }

  return pins;
}
