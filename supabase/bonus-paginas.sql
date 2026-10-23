-- =====================================================================
-- BÔNUS COM PÁGINAS (estilo Notion, igual aos materiais de apoio)
-- Rode inteiro no SQL Editor do Supabase do Método. Só ADICIONA coisas.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- Cada bônus escolhe o formato: "itens" (cards com link, ex: skills)
-- ou "paginas" (páginas que você escreve no editor)
alter table public.bonus add column if not exists tipo text not null default 'itens';
alter table public.bonus drop constraint if exists bonus_tipo_check;
alter table public.bonus add constraint bonus_tipo_check check (tipo in ('itens', 'paginas'));

create table if not exists public.bonus_paginas (
  id         serial primary key,
  bonus_id   integer not null references public.bonus(id) on delete cascade,
  ordem      integer not null default 0,
  titulo     text not null default 'Sem título',
  emoji      text,
  conteudo   jsonb,
  publicado  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bonus_paginas enable row level security;

drop policy if exists bonus_paginas_select on public.bonus_paginas;
create policy bonus_paginas_select on public.bonus_paginas
  for select using (
    public.is_admin()
    or (public.acesso_ativo() and publicado and exists (
      select 1 from public.bonus b where b.id = bonus_id and b.status = 'liberado'
    ))
  );

drop policy if exists bonus_paginas_admin on public.bonus_paginas;
create policy bonus_paginas_admin on public.bonus_paginas
  for all using (public.is_admin()) with check (public.is_admin());

select b.titulo, b.tipo, count(p.id) as paginas
  from public.bonus b left join public.bonus_paginas p on p.bonus_id = b.id
 group by b.id, b.titulo, b.tipo order by b.ordem, b.id;
