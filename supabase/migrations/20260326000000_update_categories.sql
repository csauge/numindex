-- Migration to update categories to new structure: 'acteur', 'evenement', 'contenu', 'outil'
-- Date: 2026-03-26

-- 1. Drop old constraints
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_category_check;
ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_category_check;

-- 2. Update existing data (Resources)
-- Acteur
UPDATE public.resources SET tags = array_append(tags, 'Entreprise'), category = 'acteur' WHERE category = 'entreprise';
UPDATE public.resources SET tags = array_append(tags, 'Association'), category = 'acteur' WHERE category = 'association';
UPDATE public.resources SET tags = array_append(tags, 'Coopérative'), category = 'acteur' WHERE category = 'cooperative';
UPDATE public.resources SET tags = array_append(tags, 'Institution'), category = 'acteur' WHERE category = 'public';
UPDATE public.resources SET tags = array_append(tags, 'Personne'), category = 'acteur' WHERE category = 'personne';

-- Événement
UPDATE public.resources SET tags = array_append(tags, 'Conférence'), category = 'evenement' WHERE category = 'evenement';

-- Contenu
UPDATE public.resources SET tags = array_append(tags, 'Article'), category = 'contenu' WHERE category = 'article';
UPDATE public.resources SET tags = array_append(tags, 'Livre'), category = 'contenu' WHERE category = 'livre';
UPDATE public.resources SET tags = array_append(tags, 'Podcast'), category = 'contenu' WHERE category = 'podcast';
UPDATE public.resources SET tags = array_append(tags, 'Vidéo'), category = 'contenu' WHERE category = 'video';
UPDATE public.resources SET tags = array_append(tags, 'Infographie'), category = 'contenu' WHERE category = 'infographie';
UPDATE public.resources SET tags = array_append(tags, 'Article'), category = 'contenu' WHERE category = 'index';

-- Outil
UPDATE public.resources SET tags = array_append(tags, 'Référentiel'), category = 'outil' WHERE category = 'referentiel';
UPDATE public.resources SET tags = array_append(tags, 'Loi'), category = 'outil' WHERE category = 'loi';
UPDATE public.resources SET tags = array_append(tags, 'Programme'), category = 'outil' WHERE category = 'programme';
UPDATE public.resources SET tags = array_append(tags, 'Logiciel'), category = 'outil' WHERE category = 'logiciel';
UPDATE public.resources SET tags = array_append(tags, 'Jeu'), category = 'outil' WHERE category = 'jeu';
UPDATE public.resources SET tags = array_append(tags, 'Formation'), category = 'outil' WHERE category = 'formation';

-- Fallback for 'autre'
UPDATE public.resources SET category = 'outil' WHERE category = 'autre' OR category NOT IN ('acteur', 'evenement', 'contenu', 'outil');

-- 3. Update existing data (Suggestions) - Same mapping
UPDATE public.suggestions SET tags = array_append(tags, 'Entreprise'), category = 'acteur' WHERE category = 'entreprise';
UPDATE public.suggestions SET tags = array_append(tags, 'Association'), category = 'acteur' WHERE category = 'association';
UPDATE public.suggestions SET tags = array_append(tags, 'Coopérative'), category = 'acteur' WHERE category = 'cooperative';
UPDATE public.suggestions SET tags = array_append(tags, 'Institution'), category = 'acteur' WHERE category = 'public';
UPDATE public.suggestions SET tags = array_append(tags, 'Personne'), category = 'acteur' WHERE category = 'personne';
UPDATE public.suggestions SET tags = array_append(tags, 'Conférence'), category = 'evenement' WHERE category = 'evenement';
UPDATE public.suggestions SET tags = array_append(tags, 'Article'), category = 'contenu' WHERE category IN ('article', 'index', 'livre', 'podcast', 'video', 'infographie');
UPDATE public.suggestions SET tags = array_append(tags, 'Logiciel'), category = 'outil' WHERE category IN ('referentiel', 'loi', 'programme', 'logiciel', 'jeu', 'formation');
UPDATE public.suggestions SET category = 'outil' WHERE category NOT IN ('acteur', 'evenement', 'contenu', 'outil');

-- 4. Re-add new constraints
ALTER TABLE public.resources ADD CONSTRAINT resources_category_check CHECK (category = ANY (ARRAY['acteur'::text, 'evenement'::text, 'contenu'::text, 'outil'::text]));
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_category_check CHECK (category = ANY (ARRAY['acteur'::text, 'evenement'::text, 'contenu'::text, 'outil'::text]));
