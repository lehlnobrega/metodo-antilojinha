-- =====================================================================
-- INDICAÇÕES: 4 produtos e 3 apps, com imagem
-- Rode inteiro no SQL Editor do Supabase do Método.
-- Não duplica: se o link já estiver cadastrado, a indicação só é atualizada.
-- Se aparecer o aviso de "RLS", pode clicar em "Run without RLS":
-- a tabela novas_indicacoes é só um rascunho temporário.
-- =====================================================================

drop table if exists pg_temp.novas_indicacoes;
create temp table novas_indicacoes (
  ordem int, categoria text, subcategoria text, titulo text, descricao text, url text, imagem_url text
);

insert into novas_indicacoes values
  (1, 'produto', 'Embalagem e envio', 'Impressora térmica',
      'Imprime as etiquetas de envio direto, sem tinta. Agiliza muito o dia de despachar pedidos.',
      'https://s.shopee.com.br/9KgzdaSuyN',
      'https://down-br.img.susercontent.com/file/br-11134207-81zty-ml3j0b4l3ldv0b.webp'),
  (2, 'produto', 'Embalagem e envio', 'Etiqueta térmica para envio',
      'A etiqueta adesiva que vai na impressora térmica, no tamanho certo pras etiquetas dos Correios e transportadoras.',
      'https://s.shopee.com.br/6fgEToJaoV',
      'https://down-br.img.susercontent.com/file/br-11134207-820lc-moiaelogxds0ef.webp'),
  (3, 'produto', 'Embalagem e envio', 'Caixa de papelão',
      'Caixa pra envio dos pedidos, que protege o produto no transporte.',
      'https://s.shopee.com.br/8pkj3iZdag',
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-malmx67k7hmhcc.webp'),
  (4, 'produto', 'Embalagem e envio', 'Papel seda personalizado',
      'Papel seda com a sua marca pra embrulhar o pedido. Deixa a abertura com cara de presente.',
      'https://s.shopee.com.br/9fJq3CtOug',
      'https://down-br.img.susercontent.com/file/br-11134207-81ztx-mkqpp203f3sye9.webp'),
  (1, 'app', 'Gestão da loja', 'Olist',
      'Sistema de gestão pra organizar pedidos, estoque e notas fiscais num lugar só.',
      'https://olist.com/lp/sistema-de-gestao/?parceiro=LETICIA',
      'https://yt3.googleusercontent.com/0mbny6qr4K89L026suOnS1125E0tq-TnYmGjILIrSU3KV6zi2HjSHBIAgPj3jtLIp1uTugfkFZk=s900-c-k-c0x00ffffff-no-rj'),
  (2, 'app', 'Frete', 'SuperFrete',
      'Gera etiquetas de envio com desconto nos Correios e transportadoras, sem mensalidade.',
      'https://lnobrega.com/superfrete/',
      'https://www.wbuy.com.br/arquivos/aplicativos/loja-virtual-completa-wbuy,superfrete-521.png'),
  (3, 'app', 'Divulgação', 'Organic Reach',
      'Plataforma pra ganhar mais alcance orgânico com os seus conteúdos.',
      'https://app.organicreachrewards.com/f/lelnobrega/',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEu5BuOFMCeVQV_FIPeN8h8rER7WHMiavdu-_rSSwLUQ&s');

-- 1. Cria as subcategorias que ainda não existem
insert into public.categorias_indicacoes (tipo, nome, ordem)
select n.categoria, n.subcategoria,
       coalesce((select max(ordem) from public.categorias_indicacoes), 0)
         + row_number() over (order by n.categoria, min(n.ordem))
from novas_indicacoes n
where not exists (
  select 1 from public.categorias_indicacoes c
  where c.tipo = n.categoria and lower(trim(c.nome)) = lower(trim(n.subcategoria))
)
group by n.categoria, n.subcategoria;

-- 2. Atualiza as que já existem (mesmo link)
update public.indicacoes i
   set titulo = n.titulo, descricao = n.descricao, imagem_url = n.imagem_url,
       categoria = n.categoria, subcategoria_id = c.id
  from novas_indicacoes n
  join public.categorias_indicacoes c
    on c.tipo = n.categoria and lower(trim(c.nome)) = lower(trim(n.subcategoria))
 where rtrim(i.url, '/') = rtrim(n.url, '/');

-- 3. Cria as novas, depois das que você já tem
insert into public.indicacoes (categoria, titulo, descricao, url, imagem_url, ordem, ativo, subcategoria_id)
select n.categoria, n.titulo, n.descricao, n.url, n.imagem_url,
       coalesce((select max(x.ordem) from public.indicacoes x where x.categoria = n.categoria), 0) + n.ordem,
       true, c.id
  from novas_indicacoes n
  join public.categorias_indicacoes c
    on c.tipo = n.categoria and lower(trim(c.nome)) = lower(trim(n.subcategoria))
 where not exists (select 1 from public.indicacoes i where rtrim(i.url, '/') = rtrim(n.url, '/'));

-- 4. Conferência
select case i.categoria when 'app' then 'App' else 'Produto' end as tipo, c.nome as subcategoria, i.titulo,
       case when i.imagem_url is null then 'sem imagem' else 'com imagem' end as imagem
  from public.indicacoes i
  left join public.categorias_indicacoes c on c.id = i.subcategoria_id
 order by i.categoria desc, i.ordem;
