import { describe, it, expect } from 'vitest';
import { generateBookmarksHTML } from './export-utils';
import type { Resource } from './index-client';

describe('export-utils', () => {
  it('should generate valid NETSCAPE-Bookmark-file-1 HTML', () => {
    const resources: Resource[] = [
      {
        id: '1',
        title: 'Test Resource & More',
        desc: 'Description with <tags>',
        cat: 'outil',
        catLabel: 'Outils',
        imgUrl: null,
        link: 'https://example.com?a=1&b=2',
        up: '2023-01-01',
        pub: '',
        next: '',
        tags: ['Logiciel'],
        kw: ''
      }
    ];
    const taxonomy = {
      outil: ['Logiciel']
    };

    const html = generateBookmarksHTML(resources, taxonomy);
    
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('<H3 ADD_DATE=');
    expect(html).toContain('Outils');
    expect(html).toContain('Logiciel');
    expect(html).toContain('HREF="https://example.com?a=1&amp;b=2"');
    expect(html).toContain('Test Resource &amp; More');
    expect(html).toContain('Description with &lt;tags&gt;');
  });

  it('should group by category and subcategory', () => {
    const resources: Resource[] = [
      { id: '1', title: 'R1', desc: '', cat: 'cat1', catLabel: 'Cat 1', imgUrl: null, link: '', up: '', pub: '', next: '', tags: ['Sub 1'], kw: '' },
      { id: '2', title: 'R2', desc: '', cat: 'cat1', catLabel: 'Cat 1', imgUrl: null, link: '', up: '', pub: '', next: '', tags: ['Sub 2'], kw: '' }
    ];
    const taxonomy = {
      cat1: ['Sub 1', 'Sub 2']
    };

    const html = generateBookmarksHTML(resources, taxonomy);
    
    // Check for Cat 1 folder
    expect(html).toContain('<H3 ADD_DATE="');
    expect(html).toContain('>Cat 1</H3>');
    
    // Check for Sub folders
    expect(html).toContain('>Sub 1</H3>');
    expect(html).toContain('>Sub 2</H3>');
  });
});
