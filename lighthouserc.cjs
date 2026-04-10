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
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.80 }],
        'categories:best-practices': ['warn', { minScore: 0.80 }],
        'categories:seo': ['warn', { minScore: 0.80 }],
        'categories:ecoindex': ['warn', { minScore: 0.01 }] 
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
