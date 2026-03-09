export type CategoryGroup = 'ACTEURS' | 'CONTENUS' | 'OUTILS & ACTION' | 'AUTRE';

export interface CategoryInfo {
  fr: string;
  en: string;
  icon: string;
  group: CategoryGroup;
  type: 'entity' | 'resource';
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  // --- ACTEURS ---
  entreprise: { 
    fr: 'Entreprise', en: 'Company', group: 'ACTEURS', type: 'entity',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' 
  },
  association: { 
    fr: 'Association', en: 'Association', group: 'ACTEURS', type: 'entity',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
  },
  cooperative: { 
    fr: 'Coopérative', en: 'Cooperative', group: 'ACTEURS', type: 'entity',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' 
  },
  public: { 
    fr: 'Secteur Public / Institution', en: 'Public Sector', group: 'ACTEURS', type: 'entity',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' 
  },
  personne: { 
    fr: 'Personne', en: 'Person', group: 'ACTEURS', type: 'entity',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
  },

  // --- CONTENUS ---
  article: { 
    fr: 'Publication / Article', en: 'Publication / Article', group: 'CONTENUS', type: 'resource',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4m-9 4h6m-6 4h6' 
  },
  index: { 
    fr: 'Index / Liste', en: 'Index / List', group: 'CONTENUS', type: 'resource',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' 
  },
  livre: { 
    fr: 'Livre', en: 'Book', group: 'CONTENUS', type: 'resource',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' 
  },
  podcast: { 
    fr: 'Podcast', en: 'Podcast', group: 'CONTENUS', type: 'resource',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' 
  },
  video: { 
    fr: 'Vidéo', en: 'Video', group: 'CONTENUS', type: 'resource',
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' 
  },
  infographie: { 
    fr: 'Infographie', en: 'Infographic', group: 'CONTENUS', type: 'resource',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m2 0h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2z' 
  },

  // --- OUTILS & ACTION ---
  referentiel: { 
    fr: 'Guide / Référentiel', en: 'Framework', group: 'OUTILS & ACTION', type: 'resource',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' 
  },
  logiciel: { 
    fr: 'Logiciel / Outil', en: 'Software / Tool', group: 'OUTILS & ACTION', type: 'resource',
    icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.7a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.7z' 
  },
  jeu: { 
    fr: 'Jeu', en: 'Game', group: 'OUTILS & ACTION', type: 'resource',
    icon: 'M15 5V7m0 8v2M7 11H5m14 0h-2M8 5a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2H8z' 
  },
  formation: { 
    fr: 'Formation / Atelier', en: 'Training / Workshop', group: 'OUTILS & ACTION', type: 'resource',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 12.083 0 0012 20.055a11.952 12.083 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' 
  },
  evenement: { 
    fr: 'Événement', en: 'Event', group: 'OUTILS & ACTION', type: 'resource',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
  },

  // --- AUTRE ---
  autre: { 
    fr: 'Autre', en: 'Other', group: 'AUTRE', type: 'resource',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' 
  }
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const ACTION_ICONS = {
  create: 'M12 4v16m8-8H4',
  update: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  moderate: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
} as const;

export const getCategoryLabel = (key: string, lang: 'fr' | 'en') => {
  const category = CATEGORIES[key as CategoryKey];
  return category ? category[lang] : key;
};

export const getCategoryIcon = (key: string) => {
  const category = CATEGORIES[key as CategoryKey];
  return category ? category.icon : CATEGORIES.autre.icon;
};

export const getCategoryType = (key: string): 'entity' | 'resource' => {
  const category = CATEGORIES[key as CategoryKey];
  return category ? category.type : 'resource';
};

export const getCategoryGroup = (key: string): CategoryGroup => {
  const category = CATEGORIES[key as CategoryKey];
  return category ? category.group : 'AUTRE';
};
