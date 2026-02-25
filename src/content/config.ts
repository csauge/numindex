import { defineCollection, z } from 'astro:content';

const ressources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string().url(),
    category: z.enum(['Entreprise', 'Association', 'Article', 'Podcast', 'Outil']),
    language: z.enum(['fr', 'en']),
    date: z.coerce.date(),
  }),
});

export const collections = { ressources };
