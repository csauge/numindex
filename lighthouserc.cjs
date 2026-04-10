module.exports = {
  ci: {
    collect: {
      url: ['https://numindex.org/fr'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.70 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
