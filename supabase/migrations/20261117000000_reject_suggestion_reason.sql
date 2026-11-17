-- Migration to add optional rejection_reason to reject_suggestion 🌿
CREATE OR REPLACE FUNCTION public.reject_suggestion(suggestion_id uuid, rejection_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    s_submitted_by uuid;
    updated_meta jsonb;
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

    IF rejection_reason IS NOT NULL AND trim(rejection_reason) <> '' THEN
        UPDATE public.suggestions 
        SET status = 'rejected',
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rejection_reason', trim(rejection_reason))
        WHERE id = suggestion_id;
    ELSE
        UPDATE public.suggestions SET status = 'rejected' WHERE id = suggestion_id;
    END IF;
END;
$$;
