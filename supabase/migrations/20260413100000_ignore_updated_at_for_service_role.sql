-- Modification de la fonction de trigger pour ignorer la mise à jour automatique de updated_at
-- uniquement pour la table resources lorsqu'on utilise la SERVICE_ROLE_KEY (GitHub Actions)

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Ne pas mettre à jour "updated_at" si l'opération cible la table resources 
    -- et est faite par le script d'arrière-plan (via SUPABASE_SERVICE_ROLE_KEY)
    IF TG_TABLE_NAME = 'resources' AND current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
        RETURN NEW;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
