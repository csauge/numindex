module.exports = {
  ci: {
    collect: {
      url: ['https://numindex.org/fr'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu'
      },
      lighthouseFlags: '--plugins=lighthouse-plugin-ecoindex --only-categories=performance,accessibility,best-practices,seo,ecoindex'
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:ecoindex': ['error', { minScore: 50 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
