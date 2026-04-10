module.exports = {
  ci: {
    collect: {
      url: [
        'https://numindex.org/fr',
        'https://numindex.org/fr/about',
        'https://numindex.org/fr/guide'
      ],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        plugins: ['lighthouse-plugin-ecoindex'],
        skipAudits: ['uses-http2'] // Cloudflare handle this but LH locally might complain
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'ecoindex': ['error', { minScore: 50 }] // C grade is roughly > 50
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
