-- SQL Schema for Salvia 🌿 (Synchronized with remote schema)

-- 0. Helper function for updated_at (Secure search_path)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1. Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    link text,
    category text NOT NULL,
    language text NOT NULL,
    image_url text,
    metadata jsonb DEFAULT '{"tags": []}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tags text[] DEFAULT '{}'::text[],
    related_ids uuid[] DEFAULT '{}'::uuid[],
    CONSTRAINT resources_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'autre'::text])),
    CONSTRAINT resources_language_check CHECK (language = ANY (ARRAY['fr'::text, 'en'::text]))
);

-- 2. Suggestions Table
CREATE TABLE IF NOT EXISTS public.suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    link text,
    category text NOT NULL,
    language text NOT NULL,
    image_url text,
    metadata jsonb DEFAULT '{"tags": []}'::jsonb,
    status text DEFAULT 'pending'::text,
    submitted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
    action text DEFAULT 'create'::text,
    reason text,
    tags text[] DEFAULT '{}'::text[],
    related_ids uuid[] DEFAULT '{}'::uuid[],
    CONSTRAINT suggestions_category_check CHECK (category = ANY (ARRAY['entreprise'::text, 'association'::text, 'cooperative'::text, 'public'::text, 'personne'::text, 'article'::text, 'livre'::text, 'podcast'::text, 'video'::text, 'infographie'::text, 'referentiel'::text, 'logiciel'::text, 'jeu'::text, 'formation'::text, 'evenement'::text, 'autre'::text])),
    CONSTRAINT suggestions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);

-- Indexes
CREATE INDEX idx_resources_related_ids ON public.resources USING gin (related_ids);
CREATE INDEX idx_resources_tags ON public.resources USING gin (tags);
CREATE INDEX idx_suggestions_action ON public.suggestions USING btree (action);
CREATE INDEX idx_suggestions_resource_id ON public.suggestions USING btree (resource_id);

-- Triggers
CREATE TRIGGER update_resources_updated_at 
BEFORE UPDATE ON public.resources 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Webhook for Cloudflare Deploy removed (Using SSR for real-time updates)

-- RLS Enable
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for Resources
CREATE POLICY "Anyone can read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update resources" ON public.resources FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete resources" ON public.resources FOR DELETE USING (true);

-- Policies for Suggestions
CREATE POLICY "Anyone can select suggestions" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "Anyone can submit suggestions" ON public.suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update suggestions" ON public.suggestions FOR UPDATE USING (true);
CREATE POLICY "Users can see their own suggestions" ON public.suggestions FOR SELECT USING (auth.uid() = submitted_by);

-- Storage Policies (for 'suggestions' bucket)
-- Note: Bucket must be created manually or via CLI
CREATE POLICY "Public Upload" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (bucket_id = 'suggestions'::text);
CREATE POLICY "Public View" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (bucket_id = 'suggestions'::text);
