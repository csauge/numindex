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
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'lighthouse-plugin-ecoindex'],
        plugins: ['lighthouse-plugin-ecoindex'],
        skipAudits: ['uses-http2'] 
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
