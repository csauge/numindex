import { defineCollection, z } from 'astro:content';

const ressources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string().url(),
    category: z.enum(['société', 'association', 'article', 'podcast']),
    language: z.enum(['fr', 'en']),
    date: z.coerce.date(), // Utilise z.coerce.date() pour une meilleure flexibilité
  }),
});

export const collections = { ressources };
