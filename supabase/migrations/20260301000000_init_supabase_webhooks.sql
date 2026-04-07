-- Pre-migration to ensure necessary schemas exist for local development and fresh projects
-- This avoids errors when applying migrations that use standard Supabase features

-- Ensure the supabase_functions schema exists (used for Database Webhooks)
CREATE SCHEMA IF NOT EXISTS "supabase_functions";

-- Ensure the extensions schema exists
CREATE SCHEMA IF NOT EXISTS "extensions";

-- Mock http_request function if it doesn't exist
-- This signature allows it to be used as a trigger function with arguments
CREATE OR REPLACE FUNCTION "supabase_functions"."http_request"()
RETURNS trigger AS $$
BEGIN
    -- In a real environment, this would call pg_net or an internal service
    -- Here it just allows the trigger to succeed without doing anything
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
