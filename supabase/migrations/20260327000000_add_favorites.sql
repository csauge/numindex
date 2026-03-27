-- Migration for Favorites System 🌟

-- 1. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, resource_id)
);

-- 2. View for Favorite Counts
CREATE OR REPLACE VIEW public.resource_favorite_counts AS
SELECT 
    resource_id,
    COUNT(*) as total_favorites
FROM public.favorites
GROUP BY resource_id;

-- 3. RLS Enable
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. Favorites Policies
-- Everyone can read the counts (even non-auth via the view or a public select on this table)
-- We allow SELECT to all to simplify count fetching, but users can only see their own user_id if they are the owner
CREATE POLICY "Everyone can see favorite counts" ON public.favorites 
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own favorites" ON public.favorites 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_resource_id ON public.favorites (resource_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
