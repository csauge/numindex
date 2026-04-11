import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavorite, fetchUserFavoriteIds, fetchTotalFavoriteCounts } from './favorites-client';
import { supabase } from './supabase/client';

// Mock Supabase client
vi.mock('./supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('favorites-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleFavorite', () => {
    it('should return null if no session', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
      
      const result = await toggleFavorite('resource-123');
      expect(result).toBeNull();
    });

    it('should add favorite if not already present', async () => {
      const mockUserId = 'user-123';
      const mockResourceId = 'res-123';
      
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      });

      // Mock "maybeSingle" for check
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
      const eqMock2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });

      // Mock "insert"
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'favorites') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
      });

      const result = await toggleFavorite(mockResourceId);
      
      expect(result).toBe(true);
      expect(selectMock).toHaveBeenCalledWith('id');
      expect(insertMock).toHaveBeenCalledWith([{ user_id: mockUserId, resource_id: mockResourceId }]);
    });

    it('should remove favorite if already present', async () => {
      const mockUserId = 'user-123';
      const mockResourceId = 'res-123';
      const mockFavoriteId = 'fav-456';
      
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: mockUserId } } } 
      });

      // Mock check (existing)
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: mockFavoriteId } });
      const eqMock2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });

      // Mock delete
      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'favorites') {
          return {
            select: selectMock,
            delete: deleteMock,
          };
        }
      });

      const result = await toggleFavorite(mockResourceId);
      
      expect(result).toBe(false);
      expect(deleteEqMock).toHaveBeenCalledWith('id', mockFavoriteId);
    });

    it('should throw error if insert fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: 'user-123' } } } 
      });

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
      const eqMock2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });

      const insertMock = vi.fn().mockResolvedValue({ error: new Error('Insert failed') });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'favorites') {
          return { select: selectMock, insert: insertMock };
        }
      });

      await expect(toggleFavorite('res-123')).rejects.toThrow('Insert failed');
    });

    it('should throw error if delete fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: 'user-123' } } } 
      });

      const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: 'fav-123' } });
      const eqMock2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });

      const deleteEqMock = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'favorites') {
          return { select: selectMock, delete: deleteMock };
        }
      });

      await expect(toggleFavorite('res-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('fetchUserFavoriteIds', () => {
    it('should return empty array if no session', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
      const result = await fetchUserFavoriteIds();
      expect(result).toEqual([]);
    });

    it('should return list of resource IDs', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: 'user-123' } } } 
      });

      const eqMock = vi.fn().mockResolvedValue({ 
        data: [{ resource_id: 'res-1' }, { resource_id: 'res-2' }], 
        error: null 
      });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await fetchUserFavoriteIds();
      expect(result).toEqual(['res-1', 'res-2']);
      expect(selectMock).toHaveBeenCalledWith('resource_id');
    });

    it('should return empty array and log error if fetch fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ 
        data: { session: { user: { id: 'user-123' } } } 
      });

      const eqMock = vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await fetchUserFavoriteIds();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching favorites:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('fetchTotalFavoriteCounts', () => {
    it('should return counts mapping', async () => {
      const selectMock = vi.fn().mockResolvedValue({ 
        data: [
          { resource_id: 'res-1', total_favorites: 5 },
          { resource_id: 'res-2', total_favorites: 10 }
        ], 
        error: null 
      });

      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await fetchTotalFavoriteCounts();
      expect(result).toEqual({
        'res-1': 5,
        'res-2': 10
      });
    });

    it('should return empty record and log error if fetch fails', async () => {
      const selectMock = vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch counts failed') });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await fetchTotalFavoriteCounts();
      
      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching favorite counts:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
