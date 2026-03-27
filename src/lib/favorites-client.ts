import { supabase } from './supabase/client';

/**
 * Toggle favorite status for a resource.
 * Returns true if added, false if removed.
 */
export async function toggleFavorite(resourceId: string): Promise<boolean | null> {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const userId = session.user.id;

  // Check if already favorite
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return false;
  } else {
    // Add
    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, resource_id: resourceId }]);
    
    if (error) throw error;
    return true;
  }
}

/**
 * Fetch all resource IDs favorited by the current user.
 */
export async function fetchUserFavoriteIds(): Promise<string[]> {
  if (!supabase) return [];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('resource_id')
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data.map(f => f.resource_id);
}

/**
 * Fetch favorite counts for all resources.
 */
export async function fetchTotalFavoriteCounts(): Promise<Record<string, number>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('resource_favorite_counts')
    .select('*');

  if (error) {
    console.error('Error fetching favorite counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    counts[row.resource_id] = row.total_favorites;
  });

  return counts;
}
