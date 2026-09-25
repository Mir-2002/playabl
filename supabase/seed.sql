-- Local-only seed data.
--
-- Seeds run on `supabase db reset` (config.toml: [db.seed] enabled = true) but NOT on
-- `supabase db push`, so anything here stays local and never reaches cloud.

-- Vault secrets for the poll-recently-played cron.
--
-- poll_edge_function_url: host.docker.internal resolves to the host machine
--   from inside the Supabase Docker stack, so the pg_net HTTP call reaches
--   `supabase functions serve` on port 54321.
--
-- poll_service_role_key: the standard Supabase local demo service-role JWT.
--   This is a well-known public key for local dev — safe to commit.
--
-- Cloud equivalents are seeded once by hand (never via migrations or push).
-- See CLAUDE.md "Cron / Vault setup" for details.
select vault.create_secret(
  'http://host.docker.internal:54321/functions/v1/poll-recently-played',
  'poll_edge_function_url'
);

select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  'poll_service_role_key'
);
