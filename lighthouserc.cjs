module.exports = {
  ci: {
    collect: {
      url: ['https://numindex.org/fr', 'https://numindex.org/fr/about'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        plugins: ['lighthouse-plugin-ecoindex'],
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'ecoindex']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:ecoindex': ['error', { minScore: 50 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
