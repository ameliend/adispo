-- Migration : nouveaux champs synopsis, poster_path, lien
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE contents ADD COLUMN IF NOT EXISTS synopsis TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS poster_path TEXT;

ALTER TABLE ad_status ADD COLUMN IF NOT EXISTS lien TEXT;

-- Contrainte unique sur (content_id, platform) pour les upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ad_status_content_platform_unique'
  ) THEN
    ALTER TABLE ad_status ADD CONSTRAINT ad_status_content_platform_unique
      UNIQUE (content_id, platform);
  END IF;
END $$;

-- Politiques RLS manquantes (si pas encore créées)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ad_status' AND policyname = 'ad_status_insert_public'
  ) THEN
    CREATE POLICY "ad_status_insert_public" ON ad_status FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ad_status' AND policyname = 'ad_status_update_public'
  ) THEN
    CREATE POLICY "ad_status_update_public" ON ad_status FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
