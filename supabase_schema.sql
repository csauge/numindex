-- SQL Schema for numindex.org 🌿 (Synchronized with migrations up to 20260327000000)

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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    );
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
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- 4. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, resource_id)
);

-- 5. View for Favorite Counts
CREATE OR REPLACE VIEW public.resource_favorite_counts 
WITH (security_invoker = true)
AS
SELECT 
    resource_id,
    COUNT(*) as total_favorites
FROM public.favorites
GROUP BY resource_id;

-- 5.5 Moderation RPCs
CREATE OR REPLACE FUNCTION public.approve_suggestion(suggestion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    sug public.suggestions;
BEGIN
    SELECT * INTO sug FROM public.suggestions WHERE id = suggestion_id;
    IF sug.status != 'pending' THEN
        RAISE EXCEPTION 'Suggestion is not pending';
    END IF;

    IF sug.action = 'create' THEN
        INSERT INTO public.resources (title, description, link, category, image_url, metadata, tags, related_ids, created_by)
        VALUES (sug.title, sug.description, sug.link, sug.category, sug.image_url, sug.metadata, sug.tags, sug.related_ids, sug.submitted_by);
    ELSIF sug.action = 'update' THEN
        UPDATE public.resources SET 
            title = sug.title,
            description = sug.description,
            link = sug.link,
            category = sug.category,
            image_url = sug.image_url,
            metadata = sug.metadata,
            tags = sug.tags,
            related_ids = sug.related_ids,
            updated_by = sug.submitted_by
        WHERE id = sug.resource_id;
    ELSIF sug.action = 'delete' THEN
        DELETE FROM public.resources WHERE id = sug.resource_id;
    END IF;

    UPDATE public.suggestions SET status = 'approved' WHERE id = suggestion_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_suggestion(suggestion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.suggestions WHERE id = suggestion_id AND status = 'pending') THEN
        RAISE EXCEPTION 'Suggestion not found or already processed';
    END IF;
    UPDATE public.suggestions SET status = 'rejected' WHERE id = suggestion_id;
END;
$$;

-- 6. Triggers for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
    RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Triggers for Updated At
CREATE OR REPLACE TRIGGER update_resources_updated_at 
BEFORE UPDATE ON public.resources 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_resources_related_ids ON public.resources USING gin (related_ids);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions (status);
CREATE INDEX IF NOT EXISTS idx_favorites_resource_id ON public.favorites (resource_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);

-- 9. RLS Enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 10. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 11. Resources Policies
CREATE POLICY "Public can read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Only admins can insert resources" ON public.resources FOR INSERT WITH CHECK (
    public.is_admin()
);
CREATE POLICY "Only admins can update resources" ON public.resources FOR UPDATE USING (
    public.is_admin()
);
CREATE POLICY "Only admins can delete resources" ON public.resources FOR DELETE USING (
    public.is_admin()
);

-- 12. Suggestions Policies
CREATE POLICY "Users and Admins can submit suggestions" ON public.suggestions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins and Owners can see all" ON public.suggestions FOR SELECT USING (
    auth.uid() = submitted_by OR public.is_admin()
);
CREATE POLICY "Public can see approved suggestions" ON public.suggestions FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can update their own pending suggestions" ON public.suggestions FOR UPDATE USING (
    (auth.uid() = submitted_by AND status = 'pending') OR public.is_admin()
);

-- 13. Favorites Policies
CREATE POLICY "Everyone can see favorite counts" ON public.favorites 
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own favorites" ON public.favorites 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. Storage Policies (for 'suggestions' bucket)
CREATE POLICY "Public Upload" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (bucket_id = 'suggestions'::text);
CREATE POLICY "Public View" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (bucket_id = 'suggestions'::text);
