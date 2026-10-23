-- =====================================================================
-- FORMATOS VIRAIS: os mesmos 6 formatos do Guia do Conteúdo Que Converte,
-- com o vídeo do Panda embutido e o crédito de cada referência.
-- Rode inteiro no SQL Editor do Supabase do Método.
-- Não duplica: se já existir um formato com o mesmo nome, ele só é atualizado.
-- Se você já rodou a versão anterior, pode rodar esta por cima (entra o vídeo da Dancinha).
-- =====================================================================

alter table public.formatos_virais add column if not exists credito text;

drop table if exists pg_temp.novos_formatos;
create temp table novos_formatos (ordem int, nome text, o_que_e text, por_que text, como_adaptar text, link text, credito text);
insert into novos_formatos values
  (1, $q$Vlog fazendo o produto$q$, $q$É o método Maira Cardi de fazer vídeo: estilo vlog, falado direto pra câmera enquanto você produz. Não é um vídeo narrado por cima de takes: você fala olhando pra câmera, como se estivesse conversando. Ex: "vamos fazer 230 incensos comigo?". Enquanto fala do produto e de por que ele é bom, você coloca notas na tela, como comentários, completando o que está dizendo.$q$, $q$Junta desejo e conexão no mesmo vídeo. O desejo vem do produto, porque você fala dele enquanto ele é feito. A conexão vem do bastidor, porque a pessoa vê quem faz e quanto trabalho dá. Por ser real, não parece anúncio, e as pessoas assistem até o fim. É um formato que quase sempre viraliza e vende bastante.$q$, $q$Funciona com qualquer produto que você produz ou monta: "vamos fazer 50 velas comigo?", "vamos montar 20 kits comigo?". Abre com um número, fala do produto enquanto faz e fecha com o CTA. O importante é mostrar o bastidor enquanto vende. As notas na tela: são como balõezinhos de comentário, frases curtas que aparecem enquanto você fala, completando o que você está fazendo. Funcionam como uma headline que vai mudando ao longo do vídeo.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=9316d0a3-1189-43d3-80ac-e6df36e9b620$q$, $q$soluna.mistica$q$),
  (2, $q$Respondendo hater$q$, $q$Você pega um comentário negativo e responde em vídeo, mostrando com fatos por que o seu produto é bom. E você não precisa ter hater: pode dar o hate em você mesma.$q$, $q$É quebra de objeção em sua pura essência. A pessoa está falando em voz alta a dúvida que muita gente tem e não tem coragem de falar. Quando você responde com prova, quebra a objeção de todo mundo que pensou a mesma coisa. E gera muito comentário, o que o algoritmo ama.$q$, $q$Funciona em qualquer nicho. Ex: "essas joias escurecem fácil". Não escurecem, e você mostra: molha, passa perfume, vai pra academia. Print do comentário na tela, sua reação, a resposta com prova e o CTA. Nunca briga e nunca expõe a pessoa.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=1ab57f3c-b6c9-4dc9-b11d-8b6cf0126b1d$q$, $q$soluna.mistica$q$),
  (3, $q$Respondendo comentário com pergunta$q$, $q$Alguém fez uma pergunta nos comentários e você responde em vídeo, enquanto faz ou mostra o produto. Ex: "morro de dor de cabeça com incenso de varetinha, será que o natural resolve?".$q$, $q$Responde uma dúvida real, o que quebra objeção, e ao mesmo tempo gera conexão, porque mostra que você escuta as clientes e mostra o bastidor.$q$, $q$Escolhe perguntas que muita gente tem. Coloca o print do comentário na tela, responde enquanto faz o produto e indica o produto certo no CTA.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=74e02065-2048-42a8-93c7-a8643e345814$q$, $q$soluna.mistica$q$),
  (4, $q$Chocada com o pedido da cliente$q$, $q$Você embala ou faz o pedido de uma cliente mostrando que ficou chocada com o que ela pediu ou comprou. Ex: "gente, olha o que essa cliente pediu".$q$, $q$A pessoa se vê no lugar da cliente. E o fato de você estar chocada gera curiosidade: ela fica no vídeo pra entender o porquê, ouve a história e se interessa pelo produto também.$q$, $q$Funciona com pedido grande, pedido inusitado ou combinação diferente de produtos. Abre com a reação, conta a história do pedido e mostra cada produto.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=2243e027-5023-4f3d-b6cb-f6af9f916354$q$, $q$parafiness$q$),
  (5, $q$Dancinha com música em alta$q$, $q$Uma dança com uma música que está em alta, usando a roupa da loja. Ideal pra loja de roupa.$q$, $q$Música em alta ajuda o vídeo a chegar em mais gente. E a roupa chamativa faz a pessoa parar.$q$, $q$A roupa tem que ser bem chamativa e bonita. E quem dança precisa saber dançar, ou dançar mal de propósito, que também chama atenção.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=d8d6f08e-281b-424f-9b76-c64b31d33ee1$q$, $q$alice.cantuaria$q$),
  (6, $q$Falando pra câmera estilo influenciadora$q$, $q$Você fala direto pra câmera, como uma influenciadora, sobre o que aquele produto faz de tão bom, e mostra o produto. Funciona muito pra sex shop e loja esotérica.$q$, $q$Gera aproximação. Você traz o storytelling e a pessoalidade, e quem assiste sente que está recebendo uma indicação de amiga, não um anúncio.$q$, $q$Fala como se estivesse contando um segredo: o que o produto faz, como você usa, pra quem é. Mostra o produto de perto e fecha com o CTA.$q$, $q$https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=88caff91-9605-4edb-9fe1-429790374326$q$, $q$a.sensus$q$);

-- Atualiza os que já existem (mesmo nome)
update public.formatos_virais f
   set o_que_e = n.o_que_e, por_que = n.por_que, como_adaptar = n.como_adaptar,
       link = n.link, credito = n.credito, ordem = n.ordem
  from novos_formatos n
 where lower(trim(f.nome)) = lower(trim(n.nome));

-- Cria os novos
insert into public.formatos_virais (ordem, nome, o_que_e, por_que, como_adaptar, link, credito, publicado)
select n.ordem, n.nome, n.o_que_e, n.por_que, n.como_adaptar, n.link, n.credito, true
  from novos_formatos n
 where not exists (select 1 from public.formatos_virais f where lower(trim(f.nome)) = lower(trim(n.nome)));

select ordem, nome, case when link is null then 'sem vídeo ainda' else 'com vídeo' end as video, credito
  from public.formatos_virais order by ordem, id;
