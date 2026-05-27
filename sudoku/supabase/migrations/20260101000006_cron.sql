-- =====================================================================
-- Schedule pg_cron job for daily puzzle generation
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'generate-daily-puzzle',
  '0 23 * * *',
  $$
    SELECT extensions.http_post(
      url := 'https://sqjllqilozhxbzvfjhra.supabase.co/functions/v1/generate-daily-puzzle',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('days', 30)
    );
  $$
);
