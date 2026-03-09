-- Mise à jour de la contrainte pour la table resources
ALTER TABLE public.resources DROP CONSTRAINT resources_category_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'index'::text, 'autre'::text]));

-- Mise à jour de la contrainte pour la table suggestions
ALTER TABLE public.suggestions DROP CONSTRAINT suggestions_category_check;
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'index'::text, 'autre'::text]));
