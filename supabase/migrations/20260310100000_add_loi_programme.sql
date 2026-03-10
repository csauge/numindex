-- Mise à jour de la contrainte pour la table resources pour inclure 'loi' et 'programme'
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_category_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'loi'::text, 'programme'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'index'::text, 'autre'::text]));

-- Mise à jour de la contrainte pour la table suggestions pour inclure 'loi' et 'programme'
ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_category_check;
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'loi'::text, 'programme'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'index'::text, 'autre'::text]));
