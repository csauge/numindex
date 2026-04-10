module.exports = {
  ci: {
    collect: {
      url: ['https://numindex.org/fr'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        plugins: ['lighthouse-plugin-ecoindex'],
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'ecoindex']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.70 }],
        'categories:ecoindex': ['warn', { minScore: 0.01 }] 
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
