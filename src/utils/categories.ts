export type CategoryKey = 'acteur' | 'evenement' | 'contenu' | 'outil';

export interface CategoryInfo {
  fr: string;
  en: string;
  icon: string;
  mandatoryTags: string[];
  optionalTags: string[];
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  acteur: {
    fr: 'Acteur',
    en: 'Actor',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    mandatoryTags: ['Entreprise', 'Association', 'Institution', 'Coopérative', 'Personne'],
    optionalTags: ['Local', 'ESS', 'B-Corp', 'Label NR']
  },
  evenement: {
    fr: 'Événement',
    en: 'Event',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    mandatoryTags: ['Conférence', 'Atelier', 'Webinaire', 'Meetup', 'Salon'],
    optionalTags: ['Gratuit', 'Payant']
  },
  contenu: {
    fr: 'Contenu',
    en: 'Content',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4m-9 4h6m-6 4h6',
    mandatoryTags: ['Article', 'Livre', 'Rapport', 'Podcast', 'Vidéo', 'Infographie'],
    optionalTags: ['Débutant', 'Expert']
  },
  outil: {
    fr: 'Outil',
    en: 'Tool',
    icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.7a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.7z',
    mandatoryTags: ['Logiciel', 'Référentiel', 'Guide', 'Jeu', 'Formation', 'Atelier', 'Loi'],
    optionalTags: ['Open Source', 'Gratuit', 'Payant', 'Libre']
  }
};

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
  return category ? category.icon : 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
};

export const getCategoryMandatoryTags = (key: string) => {
  return CATEGORIES[key as CategoryKey]?.mandatoryTags || [];
};

export const getCategoryOptionalTags = (key: string) => {
  return CATEGORIES[key as CategoryKey]?.optionalTags || [];
};

export const getCategoryType = (key: string): 'entity' | 'resource' => {
  return key === 'acteur' ? 'entity' : 'resource';
};
