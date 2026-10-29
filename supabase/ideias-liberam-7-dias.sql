-- =====================================================================
-- BANCO DE IDEIAS E FORMATOS VIRAIS LIBERAM 7 DIAS DEPOIS DA COMPRA
-- Rode inteiro no SQL Editor do Supabase do Método. Pode rodar de novo.
-- O app já esconde antes dos 7 dias; isto trava também no banco,
-- pra ninguém conseguir puxar as ideias por fora do app.
-- A admin sempre vê tudo. Nada é apagado.
-- =====================================================================

create or replace function public.ideias_liberadas()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.alunas a
         where a.id = auth.uid()
           and a.data_compra is not null
           and a.data_compra <= now() - interval '7 days'
      )
$$;

-- Regra extra (restritiva): soma com as regras que já existem.
-- A aluna só lê se tiver acesso ativo E já tiverem passado os 7 dias.
drop policy if exists conteudos_acervo_7_dias on public.conteudos_acervo;
create policy conteudos_acervo_7_dias on public.conteudos_acervo
  as restrictive for select using (public.ideias_liberadas());

drop policy if exists formatos_virais_7_dias on public.formatos_virais;
create policy formatos_virais_7_dias on public.formatos_virais
  as restrictive for select using (public.ideias_liberadas());

-- Conferência: quantas alunas já têm o banco de ideias liberado
select count(*) filter (where data_compra <= now() - interval '7 days') as ja_liberadas,
       count(*) filter (where data_compra >  now() - interval '7 days') as ainda_nos_7_dias
  from public.alunas where is_admin is not true;
