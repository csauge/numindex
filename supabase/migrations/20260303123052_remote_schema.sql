


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Ensure necessary schemas exist for standard Supabase features
CREATE SCHEMA IF NOT EXISTS "supabase_functions";
CREATE SCHEMA IF NOT EXISTS "extensions";

-- Mock http_request function if it doesn't exist
-- This signature allows it to be used as a trigger function with arguments
CREATE OR REPLACE FUNCTION "supabase_functions"."http_request"()
RETURNS trigger AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "link" "text",
    "category" "text" NOT NULL,
    "language" "text" NOT NULL,
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{"tags": []}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "related_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "resources_category_check" CHECK (("category" = ANY (ARRAY['entreprise'::"text", 'association'::"text", 'cooperative'::"text", 'public'::"text", 'personne'::"text", 'article'::"text", 'livre'::"text", 'podcast'::"text", 'video'::"text", 'infographie'::"text", 'referentiel'::"text", 'logiciel'::"text", 'jeu'::"text", 'formation'::"text", 'evenement'::"text", 'autre'::"text"]))),
    CONSTRAINT "resources_language_check" CHECK (("language" = ANY (ARRAY['fr'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "link" "text",
    "category" "text" NOT NULL,
    "language" "text" NOT NULL,
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{"tags": []}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "submitted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resource_id" "uuid",
    "action" "text" DEFAULT 'create'::"text",
    "reason" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "related_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "suggestions_category_check" CHECK (("category" = ANY (ARRAY['entreprise'::"text", 'association'::"text", 'cooperative'::"text", 'public'::"text", 'personne'::"text", 'article'::"text", 'livre'::"text", 'podcast'::"text", 'video'::"text", 'infographie'::"text", 'referentiel'::"text", 'logiciel'::"text", 'jeu'::"text", 'formation'::"text", 'evenement'::"text", 'autre'::"text"]))),
    CONSTRAINT "suggestions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."suggestions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_resources_related_ids" ON "public"."resources" USING "gin" ("related_ids");



CREATE INDEX "idx_resources_tags" ON "public"."resources" USING "gin" ("tags");



CREATE INDEX "idx_suggestions_action" ON "public"."suggestions" USING "btree" ("action");



CREATE INDEX "idx_suggestions_resource_id" ON "public"."suggestions" USING "btree" ("resource_id");



CREATE OR REPLACE TRIGGER "rebuild_on_resource_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/f9335bc5-aaaf-47af-b9c5-ccf75715af4c', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "update_resources_updated_at" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Anyone can delete resources" ON "public"."resources" FOR DELETE USING (true);



CREATE POLICY "Anyone can insert resources" ON "public"."resources" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read resources" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "Anyone can select suggestions" ON "public"."suggestions" FOR SELECT USING (true);



CREATE POLICY "Anyone can submit suggestions" ON "public"."suggestions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can update resources" ON "public"."resources" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can update suggestions" ON "public"."suggestions" FOR UPDATE USING (true);



CREATE POLICY "Users can see their own suggestions" ON "public"."suggestions" FOR SELECT USING (("auth"."uid"() = "submitted_by"));



ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suggestions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."suggestions" TO "anon";
GRANT ALL ON TABLE "public"."suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."suggestions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































  create policy "Public Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'suggestions'::text));



  create policy "Public View"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'suggestions'::text));



