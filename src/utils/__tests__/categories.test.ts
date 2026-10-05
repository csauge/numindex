import { describe, it, expect } from 'vitest';
import { CATEGORIES, TAG_TRANSLATIONS } from '../categories';

describe('Categories mapping and translation', () => {
  it('has valid categories', () => {
    expect(CATEGORIES.evenement.en).toBe('Event');
  });

  it('has work subcategory in tools', () => {
    expect(CATEGORIES.outil.mandatoryTags).toContain('Travail');
    expect(TAG_TRANSLATIONS['Travail']).toBe('Work');
  });

  it('has publication subcategory in content with translation', () => {
    expect(CATEGORIES.contenu.mandatoryTags).toContain('Publication');
    expect(TAG_TRANSLATIONS['Publication']).toBe('Publication');
  });
});

