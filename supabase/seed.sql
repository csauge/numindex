-- Seed data for Salvia 🌿
-- This file is used to populate your local database during `npx supabase db reset`

-- 1. Entities (Companies, Associations, etc.)
INSERT INTO public.resources (id, title, description, link, category, language, image_url, tags, metadata)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'Institut du Numérique Responsable (INR)', 
    'Le think tank de référence en France sur le Green IT et le numérique responsable.', 
    'https://institutnr.org', 
    'association', 
    'fr', 
    null, 
    ARRAY['think-tank', 'expert', 'france'], 
    '{"city": "La Rochelle"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002', 
    'Ecinfo', 
    'Groupe de service et d''expertise sur l''impact environnemental du numérique au CNRS.', 
    'https://ecoinfo.cnrs.fr', 
    'public', 
    'fr', 
    null, 
    ARRAY['recherche', 'cnrs', 'expert'], 
    '{"city": "Grenoble"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003', 
    'SustainableIT.org', 
    'A non-profit organization focused on advancing global sustainability through technology.', 
    'https://www.sustainableit.org', 
    'association', 
    'en', 
    null, 
    ARRAY['global', 'non-profit', 'it-leaders'], 
    '{"city": "San Francisco"}'::jsonb
  );

-- 2. Content Resources (Articles, Podcasts, Books)
INSERT INTO public.resources (title, description, link, category, language, tags, related_ids, metadata)
VALUES 
  (
    'RGESN v3', 
    'Référentiel Général d''Écoconception de Services Numériques.', 
    'https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/', 
    'referentiel', 
    'fr', 
    ARRAY['ecoconception', 'norme', 'etat'], 
    ARRAY['00000000-0000-0000-0000-000000000001']::uuid[], 
    '{"published_at": "2024-05-01"}'::jsonb
  ),
  (
    'Digital Sustainability Guide', 
    'Comprehensive guide for organizations to reduce their digital carbon footprint.', 
    'https://example.com/guide', 
    'livre', 
    'en', 
    ARRAY['guide', 'business', 'carbon-footprint'], 
    ARRAY['00000000-0000-0000-0000-000000000003']::uuid[], 
    '{"published_at": "2023-10-12"}'::jsonb
  ),
  (
    'Green IT : Les clés du numérique responsable', 
    'Un livre incontournable de Frédéric Bordage pour comprendre les enjeux du Green IT.', 
    'https://www.greenit.fr/le-livre/', 
    'livre', 
    'fr', 
    ARRAY['green-it', 'sobriete', 'reference'], 
    '{}'::uuid[], 
    '{"published_at": "2021-01-01"}'::jsonb
  );

-- 3. Tools (Software)
INSERT INTO public.resources (title, description, link, category, language, tags, metadata)
VALUES 
  (
    'GreenFrame', 
    'Calculate the carbon footprint of your user journeys.', 
    'https://greenframe.io', 
    'logiciel', 
    'en', 
    ARRAY['monitoring', 'carbon', 'dev-tool'], 
    '{}'::jsonb
  ),
  (
    'EcoIndex', 
    'Extension navigateur et outil en ligne pour mesurer la performance environnementale d''une page.', 
    'https://www.ecoindex.fr', 
    'logiciel', 
    'fr', 
    ARRAY['mesure', 'extension', 'web'], 
    '{}'::jsonb
  );
