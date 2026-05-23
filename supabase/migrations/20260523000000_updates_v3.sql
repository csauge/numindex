-- 1. Updates to approve_suggestion to prevent self-moderation
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

    -- 2. Prevent self-moderation
    IF s.submitted_by = auth.uid() THEN
        RAISE EXCEPTION 'An admin cannot approve their own suggestion';
    END IF;

    -- 3. Process based on action
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

    -- 4. Mark suggestion as approved
    UPDATE public.suggestions SET status = 'approved' WHERE id = suggestion_id;
END;
$$;

-- 2. Updates to reject_suggestion to prevent self-moderation
CREATE OR REPLACE FUNCTION public.reject_suggestion(suggestion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    s_submitted_by uuid;
BEGIN
    -- Get submitted_by and check if suggestion exists and is pending
    SELECT submitted_by INTO s_submitted_by FROM public.suggestions WHERE id = suggestion_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Suggestion not found or already processed';
    END IF;

    -- Check if the user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reject suggestions';
    END IF;

    -- Prevent self-moderation
    IF s_submitted_by = auth.uid() THEN
        RAISE EXCEPTION 'An admin cannot reject their own suggestion';
    END IF;

    UPDATE public.suggestions SET status = 'rejected' WHERE id = suggestion_id;
END;
$$;
