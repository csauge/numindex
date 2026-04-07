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
});

