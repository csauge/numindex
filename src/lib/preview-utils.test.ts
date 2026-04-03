import { describe, it, expect } from 'vitest';
import { renderResourcePreview } from './preview-utils';
import type { Resource, Suggestion } from './supabase/types';

describe('renderResourcePreview', () => {
  const categoriesData = {
    acteur: { fr: 'Acteur', en: 'Actor', mandatoryTags: ['Entreprise'], optionalTags: ['Local'], icon: 'icon-acteur' },
    evenement: { fr: 'Événement', en: 'Event', mandatoryTags: ['Atelier'], optionalTags: ['Gratuit'], icon: 'icon-event' },
    contenu: { fr: 'Contenu', en: 'Content', mandatoryTags: ['Article'], optionalTags: ['Débutant'], icon: 'icon-content' }
  };

  const options: any = {
    lang: 'fr',
    categoriesData,
    allResources: [
      { id: '123', title: 'Related Entity', category: 'acteur' }
    ]
  };

  it('renders a basic actor resource', () => {
    const data: Partial<Resource> = {
      title: 'Mon Acteur',
      description: 'Une description',
      category: 'acteur',
      tags: ['Entreprise'],
      link: 'https://example.com'
    };
    const html = renderResourcePreview(data, options);
    expect(html).toContain('Mon Acteur');
    expect(html).toContain('Entreprise');
    expect(html).toContain('Acteur');
  });

  it('renders an event with occurrences', () => {
    const data: Partial<Resource> = {
      title: 'Mon Événement',
      category: 'evenement',
      metadata: {
        occurrences: [
          { start: '2026-12-31T20:00:00Z', address: 'Paris' }
        ]
      }
    };
    const html = renderResourcePreview(data, options);
    expect(html).toContain('Mon Événement');
    expect(html).toContain('Éditions / Dates');
    expect(html).toContain('Paris');
    expect(html).toContain('31 déc. 2026');
  });

  it('renders a content with publication year', () => {
    const data: Partial<Resource> = {
      title: 'Mon Article',
      category: 'contenu',
      metadata: { published_at: '2025-05-20' }
    };
    const html = renderResourcePreview(data, options);
    expect(html).toContain('Mon Article');
    expect(html).toContain('2025');
  });

  it('renders a tool with version year and calendar icon', () => {
    const data: Partial<Resource> = {
      title: 'Mon Outil',
      category: 'outil',
      metadata: { version_date: '2026-01-15' }
    };
    const html = renderResourcePreview(data, options);
    expect(html).toContain('Mon Outil');
    expect(html).toContain('2026');
    expect(html).not.toContain('v.2026');
    // Check for the calendar icon SVG path part
    expect(html).toContain('d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"');
  });

  it('highlights differences in update action', () => {
    const diffWith: Resource = {
      id: 'res-1',
      title: 'Old Title',
      description: 'Old Desc',
      category: 'acteur',
      link: 'old.com',
      tags: ['Entreprise'],
      related_ids: [],
      metadata: {},
      created_at: '',
      updated_at: ''
    };
    const data: Partial<Suggestion> = {
      action: 'update',
      title: 'New Title',
      description: 'Old Desc',
      category: 'acteur',
      tags: ['Entreprise'],
      link: 'old.com',
      metadata: {}
    };
    const html = renderResourcePreview(data, { ...options, diffWith });
    expect(html).toContain('New Title');
    expect(html).toContain('ring-2 ring-red-500'); // Highlight class
  });

  it('displays target ID and proposer in moderation mode', () => {
    const data: Partial<Suggestion> = {
      id: 'sug-1',
      action: 'create',
      title: 'New Suggestion',
      resource_id: 'res-123',
      submitted_by: 'user-1'
    };
    const profiles = [{ id: 'user-1', full_name: 'John Doe' }];
    const html = renderResourcePreview(data, { ...options, isModeration: true, profiles: profiles as any });
    expect(html).toContain('ID cible :');
    expect(html).toContain('res-123');
    expect(html).toContain('John Doe');
    expect(html).toContain('Approuver');
    expect(html).toContain('Rejeter');
  });

  it('displays related resource titles', () => {
    const data: Partial<Resource> = {
      title: 'Main Resource',
      related_ids: ['123']
    };
    const html = renderResourcePreview(data, options);
    expect(html).toContain('Organisations / Personnes liées');
    expect(html).toContain('Related Entity');
  });
});
