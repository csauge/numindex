-- Update handle_new_user function to include digest_opt_in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, digest_opt_in)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        'user',
        CASE 
          WHEN (new.raw_user_meta_data->>'digest_opt_in') = 'true' THEN true 
          ELSE false 
        END
    );
    RETURN new;
END;
$$;
