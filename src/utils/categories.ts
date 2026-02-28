export const CATEGORIES = {
  entreprise: { fr: 'Entreprise', en: 'Company' },
  association: { fr: 'Association', en: 'Association' },
  article: { fr: 'Article', en: 'Article' },
  podcast: { fr: 'Podcast', en: 'Podcast' },
  outil: { fr: 'Outil', en: 'Tool' },
  livre: { fr: 'Livre', en: 'Book' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const getCategoryLabel = (key: string, lang: 'fr' | 'en') => {
  const category = CATEGORIES[key as CategoryKey];
  return category ? category[lang] : key;
};
