import { describe, it, expect } from 'vitest';
import { isValidURL, prepareMetadata, attachTimezoneOffset } from './validation-utils';

describe('validation-utils', () => {
  describe('attachTimezoneOffset', () => {
    it('should attach Europe/Paris offset for summer time (+02:00)', () => {
      expect(attachTimezoneOffset('2026-06-15T18:30', 'Europe/Paris')).toBe('2026-06-15T18:30:00+02:00');
    });

    it('should attach Europe/Paris offset for winter time (+01:00)', () => {
      expect(attachTimezoneOffset('2026-01-15T18:30', 'Europe/Paris')).toBe('2026-01-15T18:30:00+01:00');
    });

    it('should attach America/New_York offset (-04:00 in summer)', () => {
      expect(attachTimezoneOffset('2026-06-15T18:30', 'America/New_York')).toBe('2026-06-15T18:30:00-04:00');
    });

    it('should preserve datetime if offset is already present', () => {
      expect(attachTimezoneOffset('2026-06-15T18:30:00+02:00', 'Europe/Paris')).toBe('2026-06-15T18:30:00+02:00');
    });
  });

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
      expect(result.occurrences[0].start).toBe('2026-01-01T00:00:00+01:00');
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

    it('should prepare metadata for evenement with coordinates in occurrences', () => {
      const result = prepareMetadata('evenement', {
        occurrences: [
          { start: '2026-01-01', end: '2026-01-02', address: 'Paris', lat: 48.8, lng: 2.3 }
        ]
      });
      expect(result.occurrences).toHaveLength(1);
      expect(result.occurrences[0].address).toBe('Paris');
      expect(result.occurrences[0].lat).toBe(48.8);
      expect(result.occurrences[0].lng).toBe(2.3);
    });

    it('should handle evenement with occurrences in different timezones', () => {
      const result = prepareMetadata('evenement', {
        occurrences: [
          { start: '2026-06-15T18:30', end: '2026-06-15T20:30', timezone: 'Europe/Paris' },
          { start: '2026-06-15T18:30', end: '2026-06-15T20:30', timezone: 'America/New_York' }
        ]
      });
      expect(result.occurrences[0].start).toBe('2026-06-15T18:30:00+02:00');
      expect(result.occurrences[0].timezone).toBe('Europe/Paris');
      expect(result.occurrences[1].start).toBe('2026-06-15T18:30:00-04:00');
      expect(result.occurrences[1].timezone).toBe('America/New_York');
    });
  });
});
