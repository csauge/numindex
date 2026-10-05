import { describe, it, expect } from 'vitest';
import { CATEGORIES, TAG_TRANSLATIONS, CATEGORY_MAPPING, LOCALIZED_CATEGORY_SLUGS } from '../categories';

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

  it('maps category URLs to valid internal category keys', () => {
    expect(CATEGORY_MAPPING['tools']).toBe('outil');
    expect(CATEGORY_MAPPING['outils']).toBe('outil');
    expect(CATEGORY_MAPPING['acteurs']).toBe('acteur');
    expect(CATEGORY_MAPPING['actors']).toBe('acteur');
  });

  it('provides correct localized canonical slugs', () => {
    expect(LOCALIZED_CATEGORY_SLUGS.fr.outil).toBe('outils');
    expect(LOCALIZED_CATEGORY_SLUGS.en.outil).toBe('tools');
    expect(LOCALIZED_CATEGORY_SLUGS.fr.evenement).toBe('evenements');
    expect(LOCALIZED_CATEGORY_SLUGS.en.evenement).toBe('events');
  });
});

