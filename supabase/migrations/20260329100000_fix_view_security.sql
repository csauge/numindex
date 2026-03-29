-- Fix view security to satisfy Supabase Advisor
-- By default, we want views to respect the querying user's RLS policies (SECURITY INVOKER)
-- The resource_favorite_counts view uses public.favorites which already has a SELECT policy allowing everyone to read.

DROP VIEW IF EXISTS public.resource_favorite_counts;

CREATE VIEW public.resource_favorite_counts 
WITH (security_invoker = true)
AS
SELECT 
    resource_id,
    COUNT(*) as total_favorites
FROM public.favorites
GROUP BY resource_id;
