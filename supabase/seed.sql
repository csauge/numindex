-- Seed data for numindex.org 🌿
-- This file is used to populate your local database during `npx supabase db reset`

-- 0. Seed Users (for local dev and tests)
-- Password is 'password123'
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@numindex.org', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Admin Test"}', now(), now(), 'authenticated', 'authenticated', '');

INSERT INTO public.profiles (id, full_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Admin Test', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- 0.1 Ensure Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('suggestions', 'suggestions', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Entities (Companies, Associations, etc.)
INSERT INTO public.resources (id, title, description, link, category, image_url, tags, metadata)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'Institut du Numérique Responsable (INR)', 
    'Le think tank de référence en France sur le Green IT et le numérique responsable.', 
    'https://institutnr.org', 
    'association', 
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
    null, 
    ARRAY['global', 'non-profit', 'it-leaders'], 
    '{"city": "San Francisco"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004', 
    'GreenIT.fr', 
    'La communauté des experts du numérique responsable.', 
    'https://www.greenit.fr', 
    'entreprise', 
    null, 
    ARRAY['expert', 'blog', 'community'], 
    '{"city": "Paris"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005', 
    'Green Tech Forum', 
    'Le rendez-vous professionnel du Numérique Responsable.', 
    'https://www.greentech-forum.com', 
    'evenement', 
    null, 
    ARRAY['salon', 'paris', 'pro'], 
    '{"city": "Paris", "next_date": "2030-11-05"}'::jsonb
  );

-- 2. Content Resources (Articles, Podcasts, Books)
INSERT INTO public.resources (title, description, link, category, tags, related_ids, metadata)
VALUES 
  (
    'RGESN v3', 
    'Référentiel Général d''Écoconception de Services Numériques.', 
    'https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/', 
    'referentiel', 
    ARRAY['ecoconception', 'norme', 'etat'], 
    ARRAY['00000000-0000-0000-0000-000000000001']::uuid[], 
    '{"published_at": "2024-05-01"}'::jsonb
  ),
  (
    'Digital Sustainability Guide', 
    'Comprehensive guide for organizations to reduce their digital carbon footprint.', 
    'https://example.com/guide', 
    'livre', 
    ARRAY['guide', 'business', 'carbon-footprint'], 
    ARRAY['00000000-0000-0000-0000-000000000003']::uuid[], 
    '{"published_at": "2023-10-12"}'::jsonb
  ),
  (
    'Green IT : Les clés du numérique responsable', 
    'Un livre incontournable de Frédéric Bordage pour comprendre les enjeux du Green IT.', 
    'https://www.greenit.fr/le-livre/', 
    'livre', 
    ARRAY['green-it', 'sobriete', 'reference'], 
    '{}'::uuid[], 
    '{"published_at": "2021-01-01"}'::jsonb
  );

-- 3. Tools (Software)
INSERT INTO public.resources (title, description, link, category, tags, metadata)
VALUES 
  (
    'GreenFrame', 
    'Calculate the carbon footprint of your user journeys.', 
    'https://greenframe.io', 
    'logiciel', 
    ARRAY['monitoring', 'carbon-footprint', 'devops'], 
    '{}'::jsonb
  ),
  (
    'Website Carbon Calculator', 
    'Quick tool to estimate the emissions of a web page.', 
    'https://www.websitecarbon.com/', 
    'logiciel', 
    ARRAY['tool', 'web', 'emissions'], 
    '{}'::jsonb
  );
