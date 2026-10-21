-- =====================================================================
-- ATUALIZAÇÃO DO BANCO PARA O APP NOVO (visual novo + ajustes aprovados)
-- Rode inteiro no SQL Editor do Supabase. Só ADICIONA coisas:
-- nenhuma tabela, coluna ou resposta das alunas é apagada.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================


-- =====================================================================
-- 1. ALUNAS: nova situação "pausada"
--    (acesso_ativo() já exige status = 'ativa', então pausar bloqueia o acesso)
-- =====================================================================
alter table public.alunas drop constraint if exists alunas_status_check;
alter table public.alunas add constraint alunas_status_check
  check (status in ('ativa', 'pausada', 'reembolsada', 'cancelada'));


-- =====================================================================
-- 2. PLANO DE NEGÓCIOS: guardar quando foi finalizado e o texto aprimorado,
--    pra mostrar o plano completo em vez das etapas
-- =====================================================================
alter table public.plano_negocios add column if not exists concluido_em timestamptz;
alter table public.plano_negocios add column if not exists textos_aprimorados jsonb;


-- =====================================================================
-- 3. FORMATOS VIRAIS (dentro de Ideias de conteúdo)
-- =====================================================================
create table if not exists public.formatos_virais (
  id          serial primary key,
  ordem       integer not null default 0,
  nome        text not null,
  o_que_e     text,
  por_que     text,
  como_adaptar text,
  link        text,
  publicado   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.formatos_virais enable row level security;

drop policy if exists formatos_virais_select on public.formatos_virais;
create policy formatos_virais_select on public.formatos_virais
  for select using (public.is_admin() or (public.acesso_ativo() and publicado));

drop policy if exists formatos_virais_admin on public.formatos_virais;
create policy formatos_virais_admin on public.formatos_virais
  for all using (public.is_admin()) with check (public.is_admin());

-- O que cada aluna marcou em cada formato (combina / vou adaptar / não é pra mim)
create table if not exists public.decisoes_formatos (
  aluna_id   uuid not null default auth.uid() references public.alunas(id) on delete cascade,
  formato_id integer not null references public.formatos_virais(id) on delete cascade,
  decisao    text not null check (decisao in ('sim', 'adaptar', 'nao')),
  updated_at timestamptz not null default now(),
  primary key (aluna_id, formato_id)
);
alter table public.decisoes_formatos enable row level security;

drop policy if exists decisoes_formatos_propria on public.decisoes_formatos;
create policy decisoes_formatos_propria on public.decisoes_formatos
  for all using (aluna_id = auth.uid() or public.is_admin())
  with check (aluna_id = auth.uid());


-- =====================================================================
-- 4. BÔNUS (cards depois dos módulos) e os ITENS de cada bônus
-- =====================================================================
create table if not exists public.bonus (
  id         serial primary key,
  ordem      integer not null default 0,
  titulo     text not null,
  descricao  text,
  status     text not null default 'em_breve' check (status in ('liberado', 'em_breve', 'escondido')),
  created_at timestamptz not null default now()
);
alter table public.bonus enable row level security;

drop policy if exists bonus_select on public.bonus;
create policy bonus_select on public.bonus
  for select using (public.is_admin() or (public.acesso_ativo() and status <> 'escondido'));

drop policy if exists bonus_admin on public.bonus;
create policy bonus_admin on public.bonus
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.bonus_itens (
  id         serial primary key,
  bonus_id   integer not null references public.bonus(id) on delete cascade,
  ordem      integer not null default 0,
  titulo     text not null,
  descricao  text,
  link       text,
  publicado  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.bonus_itens enable row level security;

drop policy if exists bonus_itens_select on public.bonus_itens;
create policy bonus_itens_select on public.bonus_itens
  for select using (
    public.is_admin()
    or (public.acesso_ativo() and publicado and exists (
      select 1 from public.bonus b where b.id = bonus_id and b.status = 'liberado'
    ))
  );

drop policy if exists bonus_itens_admin on public.bonus_itens;
create policy bonus_itens_admin on public.bonus_itens
  for all using (public.is_admin()) with check (public.is_admin());

-- Primeiro bônus: Skills (vazio, você adiciona os itens pelo admin)
insert into public.bonus (ordem, titulo, descricao, status)
select 1, 'Skills', 'Skills de IA pra analisar a sua loja, os seus vídeos e o seu conteúdo.', 'liberado'
where not exists (select 1 from public.bonus where titulo = 'Skills');


-- =====================================================================
-- 5. CONFERÊNCIA (só leitura): mostra o que foi criado
-- =====================================================================
select 'formatos_virais' as tabela, count(*) from public.formatos_virais
union all select 'bonus', count(*) from public.bonus
union all select 'bonus_itens', count(*) from public.bonus_itens;
