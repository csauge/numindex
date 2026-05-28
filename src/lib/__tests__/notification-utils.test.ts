import { describe, it, expect } from 'vitest';
import { formatSuggestionForEmail } from '../notification-utils';
import type { Suggestion } from '../../supabase/types';

describe('notification-utils.ts', () => {
  describe('formatSuggestionForEmail', () => {
    it('should format a basic suggestion correctly', () => {
      const suggestion: Partial<Suggestion> = {
        title: 'Test Resource',
        category: 'acteur',
        action: 'create',
        created_at: '2026-05-23T10:00:00Z'
      };

      const result = formatSuggestionForEmail(suggestion);
      expect(result.title).toBe('Test Resource');
      expect(result.catLabel).toBe('Acteur');
      expect(result.actionLabel).toBe('Création');
      expect(result.actionLabelDetailed).toBe('de création');
      expect(result.successMessage).toBe('Elle est désormais visible sur le site !');
      expect(result.dateStr).toBe('23/05/2026');
      expect(result.summary).toBe('Acteur • Création • Envoyé le 23/05/2026');
    });

    it('should handle missing fields with fallbacks', () => {
      const suggestion: Partial<Suggestion> = {};

      const result = formatSuggestionForEmail(suggestion);
      expect(result.title).toBe('Sans titre');
      expect(result.catLabel).toBe('Inconnu');
      expect(result.actionLabel).toBe('Inconnu');
      expect(result.actionLabelDetailed).toBe('Inconnu');
      expect(result.successMessage).toBe('');
      expect(result.dateStr).toBe('Inconnue');
    });

    it('should handle unknown category and action', () => {
      const suggestion: Partial<Suggestion> = {
        category: 'something-new',
        action: 'mystery' as any
      };

      const result = formatSuggestionForEmail(suggestion);
      expect(result.catLabel).toBe('something-new');
      expect(result.actionLabel).toBe('mystery');
      expect(result.actionLabelDetailed).toBe('mystery');
    });
  });
});
