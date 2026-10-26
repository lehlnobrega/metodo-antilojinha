-- =====================================================================
-- TAREFAS DO ANALISADOR DE SITE E DA IA (ferramentas que saíram do app)
-- Rode no SQL Editor do Supabase do Método.
-- Elas deixam de esperar a ferramenta e passam a ser de marcar na mão,
-- então a aluna consegue concluir e avançar de módulo.
-- Nenhuma tarefa é apagada. No fim aparece a lista delas.
-- =====================================================================
update public.tarefas
   set tipo = coalesce(
         (select t.tipo from public.tarefas t
           where t.tipo not in ('auto', 'formulario')
           group by t.tipo order by count(*) desc limit 1),
         'manual'),
       chave_auto = null
 where tipo = 'auto'
   and (chave_auto ilike '%analis%' or chave_auto ilike '%site%' or chave_auto ilike 'ia%'
        or titulo ilike '%analisador%' or titulo ilike '%IA do Método%');

-- Tarefas que ainda falam do analisador ou da IA (pra você me dizer se apago ou troco o texto)
select t.id, m.titulo as modulo, t.titulo, t.descricao, t.tipo
  from public.tarefas t
  left join public.modulos m on m.id = t.modulo_id
 where t.titulo ilike '%analis%' or t.descricao ilike '%analis%'
    or t.titulo ilike '%IA do Método%' or t.descricao ilike '%IA do Método%'
 order by t.modulo_id, t.ordem;
