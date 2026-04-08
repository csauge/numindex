import { describe, it, expect } from 'vitest';
import { isValidURL, prepareMetadata } from './validation-utils';

describe('validation-utils', () => {
  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://sub.domain.org/path?q=1')).toBe(true);
    });
    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('www.example.com')).toBe(false); // No protocol
    });
  });

  describe('prepareMetadata', () => {
    it('should handle acteur metadata', () => {
      const result = prepareMetadata('acteur', { address: 'Paris', lat: 48, lng: 2 });
      expect(result).toEqual({ address: 'Paris', lat: 48, lng: 2 });
    });

    it('should handle event metadata', () => {
      const raw = {
        address: 'En ligne / Online',
        occurrences: [{ start: '2026-01-01', end: '2026-01-02', address: '' }]
      };
      const result = prepareMetadata('evenement', raw);
      expect(result.address).toBe('En ligne / Online');
      expect(result.occurrences).toHaveLength(1);
      expect(result.occurrences[0].start).toBe('2026-01-01');
    });

    it('should handle contenu metadata', () => {
      const result = prepareMetadata('contenu', { published_at: '2023' });
      expect(result).toEqual({ published_at: '2023' });
    });

    it('should handle contenu metadata with rss_url', () => {
      const result = prepareMetadata('contenu', { rss_url: 'https://example.com/rss' });
      expect(result).toEqual({ rss_url: 'https://example.com/rss' });
    });

    it('should handle contenu metadata with rss_url and published_at', () => {
      const result = prepareMetadata('contenu', { rss_url: 'https://example.com/rss', published_at: '2023' });
      expect(result).toEqual({ rss_url: 'https://example.com/rss', published_at: '2023' });
    });
  });
});
