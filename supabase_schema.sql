-- SQL Schema for numindex.org 🌿 (Synchronized with migrations up to 20260326000000)

-- 0. Types & Helpers
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

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

-- 1. Profiles Table (Linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    role public.user_role DEFAULT 'user' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    link text,
    category text NOT NULL,
    image_url text,
    metadata jsonb DEFAULT '{"tags": []}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tags text[] DEFAULT '{}'::text[],
    related_ids uuid[] DEFAULT '{}'::uuid[],
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT resources_category_check CHECK (category = ANY (ARRAY['acteur'::text, 'evenement'::text, 'contenu'::text, 'outil'::text]))
);

-- 3. Suggestions Table
CREATE TABLE IF NOT EXISTS public.suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    link text,
    category text NOT NULL,
    image_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    submitted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
    action text DEFAULT 'create'::text,
    reason text,
    tags text[] DEFAULT '{}'::text[],
    related_ids uuid[] DEFAULT '{}'::uuid[],
    CONSTRAINT suggestions_category_check CHECK (category = ANY (ARRAY['acteur'::text, 'evenement'::text, 'contenu'::text, 'outil'::text])),
    CONSTRAINT suggestions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);

-- 4. Triggers for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_resources_related_ids ON public.resources USING gin (related_ids);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions (status);

-- 6. Triggers for Updated At
CREATE OR REPLACE TRIGGER update_resources_updated_at 
BEFORE UPDATE ON public.resources 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 7. RLS Enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- 8. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 9. Resources Policies
CREATE POLICY "Public can read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Only admins can insert resources" ON public.resources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update resources" ON public.resources FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can delete resources" ON public.resources FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 10. Suggestions Policies
CREATE POLICY "Users and Admins can submit suggestions" ON public.suggestions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins and Owners can see all" ON public.suggestions FOR SELECT USING (
    auth.uid() = submitted_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Public can see approved suggestions" ON public.suggestions FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can update their own pending suggestions" ON public.suggestions FOR UPDATE USING (
    (auth.uid() = submitted_by AND status = 'pending') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 11. Storage Policies (for 'suggestions' bucket)
-- Assuming 'suggestions' bucket is created
CREATE POLICY "Public Upload" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (bucket_id = 'suggestions'::text);
CREATE POLICY "Public View" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (bucket_id = 'suggestions'::text);
