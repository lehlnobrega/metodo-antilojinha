-- =====================================================================
-- IDEIAS SALVAS (o coraçãozinho do banco de ideias)
-- Rode inteiro no SQL Editor do Supabase. Só ADICIONA uma tabela.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================
create table if not exists public.ideias_salvas (
  aluna_id    uuid not null default auth.uid() references public.alunas(id) on delete cascade,
  conteudo_id bigint not null references public.conteudos_acervo(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (aluna_id, conteudo_id)
);
alter table public.ideias_salvas enable row level security;

-- Cada aluna vê e mexe só nas dela
drop policy if exists ideias_salvas_propria on public.ideias_salvas;
create policy ideias_salvas_propria on public.ideias_salvas
  for all using (aluna_id = auth.uid() or public.is_admin())
  with check (aluna_id = auth.uid());

select count(*) as ideias_salvas from public.ideias_salvas;
