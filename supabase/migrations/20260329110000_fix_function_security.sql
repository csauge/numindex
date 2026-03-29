-- Fix security warnings and consolidate moderation logic 🌿

-- 1. Fix public.handle_new_user
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

-- 2. Fix public.is_admin
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

-- 3. Approve Suggestion (Atomic moderation logic)
CREATE OR REPLACE FUNCTION public.approve_suggestion(suggestion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    s public.suggestions%ROWTYPE;
BEGIN
    -- 1. Get the suggestion
    SELECT * INTO s FROM public.suggestions WHERE id = suggestion_id AND status = 'pending';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Suggestion not found or already processed';
    END IF;

    -- 2. Process based on action
    IF s.action = 'create' THEN
        INSERT INTO public.resources (
            title, description, link, category, image_url, tags, related_ids, metadata, created_by, updated_by
        ) VALUES (
            s.title, s.description, s.link, s.category, s.image_url, s.tags, s.related_ids, s.metadata, s.submitted_by, s.submitted_by
        );
    ELSIF s.action = 'update' THEN
        IF s.resource_id IS NULL THEN
            RAISE EXCEPTION 'Resource ID is required for update action';
        END IF;
        UPDATE public.resources SET
            title = s.title,
            description = s.description,
            link = s.link,
            category = s.category,
            image_url = s.image_url,
            tags = s.tags,
            related_ids = s.related_ids,
            metadata = s.metadata,
            updated_by = s.submitted_by
        WHERE id = s.resource_id;
    ELSIF s.action = 'delete' THEN
        IF s.resource_id IS NULL THEN
            RAISE EXCEPTION 'Resource ID is required for delete action';
        END IF;
        DELETE FROM public.resources WHERE id = s.resource_id;
    END IF;

    -- 3. Mark suggestion as approved
    UPDATE public.suggestions SET status = 'approved' WHERE id = suggestion_id;
END;
$$;
