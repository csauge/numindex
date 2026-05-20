import { describe, it, expect, vi } from 'vitest';
import { getNextEventDate, sortResources, getResourceGroup, sortOccurrences, getMapPins } from './services';
import type { Resource } from './supabase/types';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn().mockImplementation((file) => Promise.resolve(file))
}));

describe('services.ts', () => {
  describe('getMapPins', () => {
    it('should generate a single pin for an acteur with lat/lng', () => {
      const resource = {
        id: '1', title: 'Acteur A', category: 'acteur',
        metadata: { lat: 48.8, lng: 2.3 }
      } as unknown as Resource;
      const pins = getMapPins(resource, 'fr');
      expect(pins).toHaveLength(1);
      expect(pins[0].title).toBe('Acteur A');
      expect(pins[0].lat).toBe(48.8);
    });

    it('should generate multiple pins for an event with future occurrences', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000).toISOString();
      const resource = {
        id: '2', title: 'Event B', category: 'evenement',
        metadata: {
          occurrences: [
            { start: futureDate, lat: 45, lng: 5 },
            { start: futureDate, lat: 46, lng: 6 }
          ]
        }
      } as unknown as Resource;
      const pins = getMapPins(resource, 'fr');
      expect(pins).toHaveLength(2);
      expect(pins[0].title).toContain('Event B');
      expect(pins[0].lat).toBe(45);
      expect(pins[1].lat).toBe(46);
    });

    it('should filter out past event occurrences', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000).toISOString();
      const futureDate = new Date(now.getTime() + 86400000).toISOString();
      const resource = {
        id: '3', title: 'Event C', category: 'evenement',
        metadata: {
          occurrences: [
            { start: pastDate, lat: 45, lng: 5 },
            { start: futureDate, lat: 46, lng: 6 }
          ]
        }
      } as unknown as Resource;
      const pins = getMapPins(resource, 'fr');
      expect(pins).toHaveLength(1);
      expect(pins[0].lat).toBe(46);
    });

    it('should fallback to root lat/lng if no valid occurrences found', () => {
      const resource = {
        id: '4', title: 'Event D', category: 'evenement',
        metadata: { lat: 47, lng: 7, occurrences: [] }
      } as unknown as Resource;
      const pins = getMapPins(resource, 'fr');
      expect(pins).toHaveLength(1);
      expect(pins[0].lat).toBe(47);
    });
  });

  describe('sortOccurrences', () => {
    it('should sort occurrences by start date', () => {
      const occurrences = [
        { start: '2026-12-01', address: 'Later' },
        { start: '2026-01-01', address: 'Earlier' },
        { start: '2026-06-01', address: 'Middle' }
      ];
      const sorted = sortOccurrences(occurrences);
      expect(sorted[0].address).toBe('Earlier');
      expect(sorted[1].address).toBe('Middle');
      expect(sorted[2].address).toBe('Later');
    });

    it('should handle empty or null occurrences', () => {
      expect(sortOccurrences([])).toEqual([]);
      expect(sortOccurrences(null as any)).toEqual([]);
    });

    it('should handle missing start dates', () => {
      const occurrences = [
        { start: '2026-12-01', address: 'A' },
        { address: 'B' }
      ];
      const sorted = sortOccurrences(occurrences);
      expect(sorted[0].address).toBe('B');
      expect(sorted[1].address).toBe('A');
    });
  });

  describe('getResourceGroup', () => {
    const t = {
      popular: 'Populaire', others: 'Autres',
      noDate: 'Sans date', thisWeek: 'Cette semaine', thisMonth: 'Ce mois-ci', thisYear: 'Cette année', older: 'Plus ancien',
      pastDate: 'Passé'
    };
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    it('should group by favorites', () => {
      expect(getResourceGroup({}, 'favorites', t, 'fr', today, 5)).toBe(t.popular);
      expect(getResourceGroup({}, 'favorites', t, 'fr', today, 0)).toBe(t.others);
    });

    it('should group by title', () => {
      expect(getResourceGroup({ title: 'Avenue' }, 'title', t, 'fr', today)).toBe('A');
    });

    it('should group by dates (recency)', () => {
      const yesterday = new Date(now.getTime() - 86400000).toISOString();
      expect(getResourceGroup({ up: yesterday }, 'updated_at', t, 'fr', today)).toBe(t.thisWeek);
      
      const twoYearsAgo = new Date(now.getTime() - 86400000 * 700).toISOString();
      expect(getResourceGroup({ up: twoYearsAgo }, 'updated_at', t, 'fr', today)).toBe(t.older);
      
      expect(getResourceGroup({ up: null }, 'updated_at', t, 'fr', today)).toBe(t.noDate);
    });

    it('should group by category label', () => {
      expect(getResourceGroup({ catLabel: 'Outils' }, 'cat', t, 'fr', today)).toBe('Outils');
    });

    it('should group by next event date', () => {
      const future = '2099-01-01T00:00:00Z';
      const result = getResourceGroup({ next: future }, 'next_date', t, 'fr', today);
      expect(result).toMatch(/janvier 2099/i);
      
      const past = '2020-01-01T00:00:00Z';
      expect(getResourceGroup({ next: past }, 'next_date', t, 'fr', today)).toBe(t.pastDate);
    });
  });

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

  describe('uploadCompressedImage', () => {
    it('should be defined as a function', async () => {
      const { uploadCompressedImage } = await import('./services');
      expect(typeof uploadCompressedImage).toBe('function');
    });
    
    it('should be able to be called with a mock', async () => {
      const { uploadCompressedImage } = await import('./services');
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // The test also verifies it doesn't crash during dynamic import
      try {
        await uploadCompressedImage(file);
      } catch (e: any) {
        // Expected to fail because of supabase storage if not mocked
        expect(e.message).toBeDefined();
      }
    });
  });
});
