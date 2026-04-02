-- Modifie les contraintes de clé étrangère sur resources pour éviter les erreurs de suppression
ALTER TABLE "public"."resources" 
  DROP CONSTRAINT IF EXISTS "resources_created_by_fkey";

ALTER TABLE "public"."resources" 
  ADD CONSTRAINT "resources_created_by_fkey" 
  FOREIGN KEY ("created_by") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

ALTER TABLE "public"."resources" 
  DROP CONSTRAINT IF EXISTS "resources_updated_by_fkey";

ALTER TABLE "public"."resources" 
  ADD CONSTRAINT "resources_updated_by_fkey" 
  FOREIGN KEY ("updated_by") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;