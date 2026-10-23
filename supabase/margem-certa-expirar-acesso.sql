-- =====================================================================
-- RODAR NO SUPABASE DO MARGEM CERTA (não no do Método)
-- Todo dia às 3h (horário de Brasília), quem passou da data de acesso
-- (expires_at) fica como "expired" e não entra mais no Margem Certa.
-- Dá 3 dias de folga pra renovação chegar antes de bloquear.
-- Admin nunca é bloqueada. Pode rodar de novo sem problema.
-- =====================================================================
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'expirar-acessos';

select cron.schedule(
  'expirar-acessos',
  '0 6 * * *',
  $$update public.users
       set status = 'expired'
     where status = 'active'
       and is_admin is not true
       and expires_at is not null
       and expires_at < now() - interval '3 days'$$
);

select jobname, schedule from cron.job where jobname = 'expirar-acessos';
