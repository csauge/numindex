-- Modifie la contrainte de clé étrangère sur suggestions pour éviter les erreurs de suppression
ALTER TABLE "public"."suggestions" 
  DROP CONSTRAINT IF EXISTS "suggestions_submitted_by_fkey";

ALTER TABLE "public"."suggestions" 
  ADD CONSTRAINT "suggestions_submitted_by_fkey" 
  FOREIGN KEY ("submitted_by") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

-- Fonction pour permettre à un utilisateur de supprimer son propre compte
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uid uuid;
BEGIN
    user_uid := auth.uid();
    
    IF user_uid IS NULL THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    -- Les tables avec ON DELETE CASCADE (profiles, favorites) seront automatiquement nettoyées.
    -- Les suggestions verront leur submitted_by mis à NULL (historique conservé).
    
    DELETE FROM auth.users WHERE id = user_uid;
END;
$$;

-- Accorder l'accès à la fonction au rôle authentifié
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
