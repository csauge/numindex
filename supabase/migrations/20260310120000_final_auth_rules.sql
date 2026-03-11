-- Final RLS Policies for numindex.org 🌿

-- 1. Ensure Resources tracking columns exist
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 2. Resources RLS (Strict Admin for modifications)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
CREATE POLICY "Anyone can read resources" ON public.resources
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert resources" ON public.resources;
CREATE POLICY "Only admins can insert resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can update resources" ON public.resources;
CREATE POLICY "Only admins can update resources" ON public.resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can delete resources" ON public.resources;
CREATE POLICY "Only admins can delete resources" ON public.resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Suggestions RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can submit suggestions" ON public.suggestions;
CREATE POLICY "Authenticated users can submit suggestions" ON public.suggestions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins and Owners can see suggestions" ON public.suggestions;
CREATE POLICY "Admins and Owners can see suggestions" ON public.suggestions
    FOR SELECT USING (
        auth.uid() = submitted_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins and Owners can update suggestions" ON public.suggestions;
CREATE POLICY "Admins and Owners can update suggestions" ON public.suggestions
    FOR UPDATE USING (
        (auth.uid() = submitted_by AND status = 'pending')
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins and Owners can delete suggestions" ON public.suggestions;
CREATE POLICY "Admins and Owners can delete suggestions" ON public.suggestions
    FOR DELETE USING (
        auth.uid() = submitted_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Helper function to check if user is admin (optional, for readability)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
