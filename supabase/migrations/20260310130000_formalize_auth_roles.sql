-- Formalize Auth Roles for numindex.org 🌿

-- 1. Suggestions RLS: Authenticated users can INSERT (Propose)
DROP POLICY IF EXISTS "Authenticated users can submit suggestions" ON public.suggestions;
CREATE POLICY "Users and Admins can submit suggestions" ON public.suggestions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'user' OR profiles.role = 'admin')
        )
    );

-- 2. Resources RLS: Only Admins can modify directly
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

-- 3. Public can see everything in Resources
DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
CREATE POLICY "Public can read resources" ON public.resources
    FOR SELECT USING (true);
