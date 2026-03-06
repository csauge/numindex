drop trigger if exists "rebuild_on_resource_change" on "public"."resources";

alter table "public"."resources" drop constraint "resources_language_check";

alter table "public"."resources" drop column "language";

alter table "public"."suggestions" drop column "language";


