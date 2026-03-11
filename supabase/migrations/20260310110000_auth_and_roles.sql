-- 1. Create Role Type
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    role public.user_role DEFAULT 'user' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Update Resources Table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 4. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Trigger for New User Profile
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

-- 7. Update RLS Policies for Resources (Stricter)
DROP POLICY IF EXISTS "Anyone can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can update resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can delete resources" ON public.resources;

CREATE POLICY "Only admins can insert resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update resources" ON public.resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete resources" ON public.resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 8. Update RLS Policies for Suggestions (Stricter)
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Anyone can update suggestions" ON public.suggestions;

CREATE POLICY "Authenticated users can submit suggestions" ON public.suggestions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own pending suggestions" ON public.suggestions
    FOR UPDATE USING (
        (auth.uid() = submitted_by AND status = 'pending')
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can see all suggestions" ON public.suggestions
    FOR SELECT USING (
        (auth.uid() = submitted_by)
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
        OR
        (status = 'approved') -- Maybe public can see approved? Actually approved are moved to resources.
    );

-- Redefine "Anyone can select suggestions" to be more specific if needed.
-- For now, let's keep it simple: Anyone can read approved, but only admins/owners can read pending.
DROP POLICY IF EXISTS "Anyone can select suggestions" ON public.suggestions;
CREATE POLICY "Public can see approved suggestions" ON public.suggestions
    FOR SELECT USING (status = 'approved');
    
CREATE POLICY "Admins and Owners can see all" ON public.suggestions
    FOR SELECT USING (
        auth.uid() = submitted_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
