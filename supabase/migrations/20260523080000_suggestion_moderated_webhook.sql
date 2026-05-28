-- Migration to add a trigger for suggestion moderation notifications 🌿
-- This trigger calls the Astro API webhook via net.http_post using a secret from Supabase Vault.

CREATE OR REPLACE FUNCTION public.on_suggestion_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  webhook_url text;
  v_secret_id uuid;
  v_secret text;
BEGIN
  -- Configuration
  webhook_url := 'https://numindex.org/api/webhooks/suggestion-moderated';

  -- REPLACE THIS UUID with the one generated when you create the secret in Supabase Vault (Production)
  -- For local development, you might need to handle this differently (e.g. use a different migration or settings)
  v_secret_id := '25627092-4548-4e76-b4fa-ce1e1cda3029'; 

  -- Retrieve secret from Vault
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE id = v_secret_id;

  -- Only trigger if status changed from 'pending' to 'approved' or 'rejected'
  IF (OLD.status = 'pending' AND (NEW.status = 'approved' OR NEW.status = 'rejected')) THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Secret', v_secret
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_on_suggestion_status_change ON public.suggestions;
CREATE TRIGGER tr_on_suggestion_status_change
  AFTER UPDATE OF status ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_suggestion_status_change();

