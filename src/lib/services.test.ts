import { describe, it, expect, vi } from 'vitest';
import { getNextEventDate, sortResources } from './services';
import type { Resource } from './supabase/types';

describe('services.ts', () => {
  describe('getNextEventDate', () => {
    it('should return the next future date from occurrences', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 1000000).toISOString();
      const pastDate = new Date(now.getTime() - 1000000).toISOString();
      
      const resource = {
        category: 'evenement',
        metadata: {
          occurrences: [
            { start: pastDate, end: pastDate },
            { start: futureDate, end: futureDate }
          ]
        }
      } as unknown as Resource;

      expect(getNextEventDate(resource)).toBe(futureDate);
    });

    it('should return null if no future dates', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 1000000).toISOString();
      
      const resource = {
        category: 'evenement',
        metadata: {
          occurrences: [{ start: pastDate, end: pastDate }]
        }
      } as unknown as Resource;

      expect(getNextEventDate(resource)).toBeNull();
    });

    it('should return null for non-event categories', () => {
      const resource = { category: 'outil' } as Resource;
      expect(getNextEventDate(resource)).toBeNull();
    });
  });

  describe('sortResources', () => {
    it('should sort by title for acteurs and outils', () => {
      const resources = [
        { title: 'B', category: 'acteur' },
        { title: 'A', category: 'acteur' }
      ] as Resource[];
      
      const sorted = sortResources(resources, 'acteur');
      expect(sorted[0].title).toBe('A');
      expect(sorted[1].title).toBe('B');
    });

    it('should sort by published_at for contenu', () => {
      const resources = [
        { category: 'contenu', metadata: { published_at: '2023-01-01' } },
        { category: 'contenu', metadata: { published_at: '2023-01-02' } }
      ] as Resource[];
      
      const sorted = sortResources(resources, 'contenu');
      expect(sorted[0].metadata?.published_at).toBe('2023-01-02');
      expect(sorted[1].metadata?.published_at).toBe('2023-01-01');
    });

    it('should sort by updated_at by default', () => {
      const resources = [
        { updated_at: '2023-01-01T10:00:00Z' },
        { updated_at: '2023-01-01T11:00:00Z' }
      ] as Resource[];
      
      const sorted = sortResources(resources, 'all');
      expect(sorted[0].updated_at).toBe('2023-01-01T11:00:00Z');
      expect(sorted[1].updated_at).toBe('2023-01-01T10:00:00Z');
    });
  });
});
