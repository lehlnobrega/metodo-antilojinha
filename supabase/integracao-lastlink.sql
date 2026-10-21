-- =====================================================================
-- INTEGRAÇÃO LASTLINK + N8N + PLANILHA
-- Rode inteiro no SQL Editor do Supabase (projeto Método).
-- Só ADICIONA coisas e pode rodar mais de uma vez sem problema.
-- As funções só podem ser usadas com a chave service_role (o n8n),
-- nunca pelo app das alunas.
-- =====================================================================


-- =====================================================================
-- 1. LIBERAR ACESSO (compra aprovada ou renovação)
--    O n8n primeiro manda o convite (cria o login), depois chama esta função.
--    Devolve: nova | renovada | sem_login
-- =====================================================================
create or replace function public.lastlink_liberar(
  p_email text,
  p_nome text default null,
  p_telefone text default null,
  p_pedido text default null,
  p_data_compra timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_existia boolean;
begin
  select u.id into v_id from auth.users u where lower(u.email) = v_email limit 1;
  if v_id is null then
    return jsonb_build_object('resultado', 'sem_login');
  end if;

  select exists (select 1 from public.alunas a where a.id = v_id) into v_existia;

  -- data_compra nova faz o gatilho set_acesso_ate recalcular: acesso por 1 ano a partir da compra
  insert into public.alunas (id, email, nome, telefone, status, data_compra, pedido_lastlink)
  values (v_id, v_email, nullif(trim(p_nome), ''), nullif(trim(p_telefone), ''), 'ativa',
          coalesce(p_data_compra, now()), nullif(p_pedido, ''))
  on conflict (id) do update set
    status          = 'ativa',
    data_compra     = excluded.data_compra,
    pedido_lastlink = coalesce(excluded.pedido_lastlink, public.alunas.pedido_lastlink),
    nome            = coalesce(public.alunas.nome, excluded.nome),
    telefone        = coalesce(public.alunas.telefone, excluded.telefone);

  return jsonb_build_object('resultado', case when v_existia then 'renovada' else 'nova' end);
end
$$;


-- =====================================================================
-- 2. BLOQUEAR ACESSO (reembolso ou chargeback)
--    Não apaga nada: só muda a situação. O app já fecha o acesso sozinho.
--    Devolve: bloqueada | nao_encontrada
-- =====================================================================
create or replace function public.lastlink_bloquear(p_email text, p_status text default 'reembolsada')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('reembolsada', 'cancelada') then
    raise exception 'status inválido: %', p_status;
  end if;
  update public.alunas
     set status = p_status
   where lower(email) = lower(trim(p_email))
     and is_admin is not true;
  if not found then
    return jsonb_build_object('resultado', 'nao_encontrada');
  end if;
  return jsonb_build_object('resultado', 'bloqueada');
end
$$;

-- Só o n8n (service_role) pode usar essas funções
revoke all on function public.lastlink_liberar(text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.lastlink_bloquear(text, text) from public, anon, authenticated;
grant execute on function public.lastlink_liberar(text, text, text, text, timestamptz) to service_role;
grant execute on function public.lastlink_bloquear(text, text) to service_role;


-- =====================================================================
-- 3. VISÃO PRA PLANILHA: uma linha por aluna, com as respostas da pesquisa
--    Os nomes das colunas são os mesmos da aba "Alunas" da planilha.
-- =====================================================================
create or replace function public.texto_resposta(v jsonb)
returns text
language sql
immutable
as $$
  select case jsonb_typeof(v)
    when 'array' then (select string_agg(x, ', ') from jsonb_array_elements_text(v) x)
    when 'string' then v #>> '{}'
    when 'null' then null
    else v::text
  end
$$;

drop view if exists public.planilha_alunas;
create view public.planilha_alunas
with (security_invoker = true)
as
with ultima as (
  select distinct on (p.aluna_id) p.aluna_id, p.respostas, p.created_at
  from public.pesquisa_inicial p
  order by p.aluna_id, p.created_at desc
)
select
  a.email                                                                         as "E-mail",
  coalesce(a.nome, public.texto_resposta(u.respostas -> 'nome'))                   as "Nome",
  coalesce(a.telefone, public.texto_resposta(u.respostas -> 'whatsapp'))           as "WhatsApp",
  case a.status
    when 'ativa' then case when a.acesso_ate < now() then 'Acesso vencido' else 'Ativa' end
    when 'pausada' then 'Pausada'
    when 'reembolsada' then 'Reembolsada'
    when 'cancelada' then 'Cancelada'
    else coalesce(a.status, '')
  end                                                                             as "Situação",
  to_char(a.data_compra at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')           as "Data da compra",
  to_char(a.acesso_ate at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')            as "Acesso até",
  to_char(a.ultimo_acesso at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as "Último acesso",
  coalesce(a.pedido_lastlink, '')                                                 as "Pedido Lastlink",
  case when u.aluna_id is null then 'Não' else 'Sim' end                          as "Respondeu a pesquisa",
  to_char(u.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')    as "Respondeu em",
  public.texto_resposta(u.respostas -> 'momento_loja')       as "Momento da loja",
  public.texto_resposta(u.respostas -> 'o_que_vende')        as "O que vende",
  public.texto_resposta(u.respostas -> 'onde_vende')         as "Onde vende",
  public.texto_resposta(u.respostas -> 'maior_dificuldade')  as "Maior dificuldade",
  public.texto_resposta(u.respostas -> 'faturamento')        as "Faturamento mensal",
  public.texto_resposta(u.respostas -> 'por_que_agora')      as "Por que entrou agora",
  public.texto_resposta(u.respostas -> 'resultado_esperado') as "Resultado esperado (3 a 6 meses)",
  public.texto_resposta(u.respostas -> 'ja_tentou')          as "Já tentou outros cursos",
  public.texto_resposta(u.respostas -> 'tempo_semanal')      as "Tempo por semana",
  public.texto_resposta(u.respostas -> 'equipe')             as "Sozinha ou com equipe",
  public.texto_resposta(u.respostas -> 'fonte_renda')        as "Fonte de renda",
  public.texto_resposta(u.respostas -> 'instagram')          as "Instagram",
  public.texto_resposta(u.respostas -> 'como_conheceu')      as "Como me conheceu",
  public.texto_resposta(u.respostas -> 'resolver_uma_coisa') as "Uma coisa pra resolver"
from public.alunas a
left join ultima u on u.aluna_id = a.id
where a.is_admin is not true;

-- A visão é só pro n8n: o app das alunas não enxerga
revoke all on public.planilha_alunas from public, anon, authenticated;
grant select on public.planilha_alunas to service_role;


-- =====================================================================
-- 4. CONFERÊNCIA (só leitura)
-- =====================================================================
select count(*) as alunas_na_planilha from public.planilha_alunas;
