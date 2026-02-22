-- ============================================================
-- MIGRATION 00021: POSTGREST SCHEMA RELOAD
--
-- Supabase/PostgREST keeps a schema cache that can lag behind when migrations
-- are applied via non-standard paths. This migration forces a schema + config
-- reload so newly created tables/functions appear in the REST/OpenAPI surface.
--
-- Safe to run multiple times.
-- ============================================================

do $$
begin
  perform pg_notify('pgrst', 'reload schema');
  perform pg_notify('pgrst', 'reload config');
end;
$$;
