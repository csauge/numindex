import { describe, it, expect } from 'vitest';
import { generateResourceCardHTML, type Resource } from '../index-client';

describe('generateResourceCardHTML', () => {
  const taxonomy = {
    evenement: ['Atelier'],
    outil: ['Logiciel'],
    acteur: ['Entreprise']
  };
  
  const options = {
    currentLang: 'fr',
    taxonomy,
    today: '2026-04-12',
    translateTag: (tag: string) => tag,
    userFavoriteIds: [],
    totalFavoriteCounts: {}
  };

  const baseResource: Resource = {
    id: 'res-1',
    title: 'Test Resource',
    desc: 'Description',
    cat: 'acteur',
    catLabel: 'Acteur',
    imgUrl: '/img.png',
    link: 'https://example.com',
    up: '2026-01-01',
    pub: '2026-01-01',
    next: '',
    stars: null,
    tags: ['Entreprise'],
    kw: 'test'
  };

  it('renders a basic resource card', () => {
    const html = generateResourceCardHTML(baseResource, options);
    expect(html).toContain('Test Resource');
    expect(html).toContain('Acteur');
    expect(html).toContain('Entreprise');
  });

  it('renders an event with a calendar SVG icon', () => {
    const eventResource: Resource = {
      ...baseResource,
      cat: 'evenement',
      catLabel: 'Événement',
      next: '2026-05-20T10:00:00Z',
      tags: ['Atelier']
    };
    const html = generateResourceCardHTML(eventResource, options);
    // Check for calendar SVG path
    expect(html).toContain('d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"');
    expect(html).toContain('20 mai');
  });

  it('renders a repository with GitHub stars and GitHub SVG icon in the image area', () => {
    const repoResource: Resource = {
      ...baseResource,
      cat: 'outil',
      catLabel: 'Outil',
      stars: 1234,
      tags: ['Logiciel']
    };
    const html = generateResourceCardHTML(repoResource, options);
    // Check for GitHub SVG path (start of it)
    expect(html).toContain('M12 0c-6.626 0-12 5.373-12 12');
    expect(html).toContain('1234');
    // Check that it's in the absolute bottom-2 left-2 container
    expect(html).toContain('absolute bottom-2 left-2 flex items-center gap-1');
  });

  it('highlights favorited state', () => {
    const favOptions = {
      ...options,
      userFavoriteIds: ['res-1'],
      totalFavoriteCounts: { 'res-1': 5 }
    };
    const html = generateResourceCardHTML(baseResource, favOptions);
    expect(html).toContain('text-amber-500 fill-amber-500'); // Star color
    expect(html).toContain('5</span>'); // Fav count
  });
});
