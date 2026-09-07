-- Local-only seed data.
--
-- Seeds run on `supabase db reset` (config.toml: [db.seed] enabled = true) but NOT on
-- `supabase db push`, so anything here stays local and never reaches cloud.

-- Vault secrets for the poll-recently-played pg_cron job (see migration
-- 20260906000002). The cron command reads these at runtime; without them the tick
-- would fail. Re-runnable: delete-then-create so a bare `psql -f seed.sql` also works.
--
-- poll_service_role_key is the standard Supabase *local demo* service-role JWT
-- (issuer "supabase-demo") — a public, well-known constant, safe to commit. The real
-- cloud key is never stored here; cloud Vault is seeded by hand (see CLAUDE.md).
delete from vault.secrets where name in ('poll_edge_function_url', 'poll_service_role_key');

select vault.create_secret(
  'http://host.docker.internal:54321/functions/v1/poll-recently-played',
  'poll_edge_function_url'
);

select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  'poll_service_role_key'
);
