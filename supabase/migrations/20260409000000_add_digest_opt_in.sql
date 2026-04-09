-- Migration pour l'ajout de l'opt-in au résumé mensuel
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS digest_opt_in BOOLEAN DEFAULT false NOT NULL;
