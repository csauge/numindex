-- Add reject_suggestion function 🌿
CREATE OR REPLACE FUNCTION public.reject_suggestion(suggestion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- 1. Check if suggestion exists and is pending
    IF NOT EXISTS (SELECT 1 FROM public.suggestions WHERE id = suggestion_id AND status = 'pending') THEN
        RAISE EXCEPTION 'Suggestion not found or already processed';
    END IF;

    -- 2. Mark suggestion as rejected
    UPDATE public.suggestions SET status = 'rejected' WHERE id = suggestion_id;
END;
$$;
