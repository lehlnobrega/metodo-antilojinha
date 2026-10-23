-- =====================================================================
-- CADASTRO DAS 37 ALUNAS DO MÉTODO (vendas aprovadas da Lastlink)
-- Rode no SQL Editor do Supabase do Método DEPOIS do
-- alunas-cadastro-pelo-n8n.sql (sem ele este arquivo para e avisa).
--
-- Cada aluna fica com acesso de 1 ano a partir da data da compra.
-- Elas criam a senha em metodo.lnobrega.com/primeiro-acesso
-- Se a aluna já estiver cadastrada (mesmo e-mail), só atualiza.
-- Pode rodar mais de uma vez sem duplicar.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_ligar_login_a_aluna') then
    raise exception 'Rode antes o arquivo alunas-cadastro-pelo-n8n.sql';
  end if;
end $$;

insert into public.alunas (email, nome, telefone, data_compra, pedido_lastlink, status)
select v.email, v.nome, v.telefone, v.data_compra::timestamptz, v.pedido, 'ativa'
from (values
  ('alinedtorres13@gmail.com', 'Aline Torres', '5521980111107', '2026-05-27 23:54:42-03', 'be60b461-eae0-4788-8812-6a68c2c5e4d3'),
  ('musassensatas@gmail.com', 'Geovanna Santa Cruz', '5511989292743', '2026-05-27 23:54:47-03', 'e05144cc-d43d-422b-9c77-1530aa843419'),
  ('acessorioslym@gmail.com', 'Laura Reis', '5534996879278', '2026-05-27 23:55:27-03', 'b88afd68-a920-4d61-a174-ec7519c1423b'),
  ('milenaveronicadasilva15@gmail.com', 'Milena Veronica', '5511995096714', '2026-05-27 23:55:47-03', '7fb59bb1-28f4-4f7e-8ac5-2ac142127bfe'),
  ('daianemachadoacessorios@gmail.com', 'Daiane da Silva Oliveira', '55219783549', '2026-05-27 23:55:59-03', '375240ae-958e-4eca-9d19-ebdcff07d71e'),
  ('liviagobara@terra.com.br', 'Livia Gobara e Faria', '5521974297991', '2026-05-27 23:56:10-03', 'e790f96f-a956-4ecb-9d4b-a4787c8c0c34'),
  ('trindadeelizi@gmail.com', 'Elizi Souza Trindade', '5519993237452', '2026-05-30 19:30:56-03', 'c1d720f4-08e5-4a5a-bdb3-dee8f86e0146'),
  ('stephanyssilva2805@gmail.com', 'Stephany Souza Silva', '5511996882077', '2026-05-31 10:44:18-03', '0f972620-ccd0-48ff-ab8d-b72c3d0238ed'),
  ('eubeatrizassump@gmail.com', 'Beatriz Tripode de Assumpção', '5521986023140', '2026-05-31 16:20:33-03', '4aa8f6d0-c915-458b-8ce7-cdfa3a0c4407'),
  ('greice.nani@gmail.com', 'Greice Nani', '5511997063968', '2026-06-02 01:23:42-03', '17889622-78ba-41ec-8dcd-d9c391b1e82e'),
  ('fernandaalmeidaa25@outlook.com', 'Fernanda Kethley de Almeida', '17743911090', '2026-06-02 05:13:07-03', '9ca1b2a8-2fbf-49f7-a5d6-f6529f35f477'),
  ('rafaelagarbez@gmail.com', 'Rafaela Carvalho Garbez', '5535992442469', '2026-07-11 15:36:15-03', 'fd91a38c-f806-4459-93ee-73bd8897aafa'),
  ('ysi.fernandes.s@gmail.com', 'Yasmin Fernandes Silva', '5511912555352', '2026-07-11 15:39:14-03', 'c31ec886-257f-440c-9847-065c2cfbdea4'),
  ('julianalongo97@hotmail.com', 'Juliana Longo', '5521995921299', '2026-07-11 15:40:29-03', 'e947d08f-aed7-47ad-814f-7b7d7c510b16'),
  ('umpedacinhomeumundo@gmail.com', 'Izabella Alves da Silva Santos', '5513996753084', '2026-07-11 15:41:56-03', 'c9b079ab-7132-44f7-98b9-24fce7495b13'),
  ('praquelthomaz@gmail.com', 'Raquel Teixeira Thomaz', '5521998166989', '2026-07-11 15:41:56-03', '94a6fad1-293a-434a-a10a-91354cfa5a02'),
  ('bazinga2032@gmail.com', 'Anna Samara Bomfim da Silva', '5521982352245', '2026-07-11 15:43:18-03', 'd4c1ed13-9e40-47c8-a9f0-7101089f592f'),
  ('deborah_cacciatore@hotmail.com', 'Deborah Cacciatore', '5511959090516', '2026-07-11 15:44:51-03', '192daf41-dcf7-48e8-ae28-0bae348f4225'),
  ('empresa.marargila@gmail.com', 'Amanda dos Santos Conceição', '557199963487', '2026-07-11 15:45:15-03', 'c67b2b28-bcdf-40ca-b9fe-19da1c3393e5'),
  ('gois_adm@hotmail.com', 'Tatiane Miranda de Gois', '5513991808228', '2026-07-11 15:45:39-03', '2543cff2-7978-4e86-849b-a5efeca04ba4'),
  ('energiadobem.contato@gmail.com', 'Energia do Bem', '5553981227788', '2026-07-11 15:46:17-03', '9808c03c-132b-4102-bc84-edfc4d54b315'),
  ('gabrielalopes240724@gmail.com', 'Gabriela Lopes', '5535998874169', '2026-07-11 16:23:07-03', '2564f733-780e-4a1b-adf6-b13f1de5b7fe'),
  ('lahdomiciano22@gmail.com', 'Lais Domiciano dos Santos', '5511984031624', '2026-07-11 16:33:02-03', 'a1c6b73e-ec0a-492b-8a29-c1874cbab8f3'),
  ('luannatorresg@gmail.com', 'Luanna Torres', '5521974739191', '2026-07-11 17:32:19-03', '817e4223-343c-44f9-8f42-902beba0285c'),
  ('carollsbcarvalhoo91@outlook.com', 'Carolina Sá Barreto Carvalho dos Reis', '5571982020144', '2026-07-11 22:49:34-03', '05a60a06-0d11-4db7-b33b-482774498900'),
  ('lunapapelariacriativaa@gmail.com', 'Heloisa Silva Santos', '5511978300041', '2026-07-15 08:24:41-03', 'cf33fb33-2d67-48d9-9bdb-d953ec056dd2'),
  ('gabriela.bleite@gmail.com', 'Gabriela Baroni Leite', '5516991267424', '2026-08-07 12:06:49-03', '80961d36-e22e-4da8-88fb-21442e4ef83e'),
  ('schuncklaura19@gmail.com', 'Laura Azambuja Schunck', '5551992720690', '2026-08-12 13:37:58-03', '6b3d57b8-94e9-4f34-bdbf-c4105a4d674b'),
  ('juliana.kossling@gmail.com', 'Juliana Dourado', '5511974561787', '2026-09-08 17:14:46-03', '1065a7d7-e312-45ff-9ec7-2e1de0ec7616'),
  ('larilopees_@hotmail.com', 'Larissa Lopes da Silva', '5511981600103', '2026-09-09 15:20:31-03', '3df5552b-f628-4b5a-b3c6-e9ff0bb7754f'),
  ('driandrya@hotmail.com', 'Adriana Amorim Carneiro', '5562992809253', '2026-09-10 08:04:07-03', '0e6b19f5-d9f0-4335-b01b-f4c7306a975e'),
  ('virtue.velas@gmail.com', 'Pâmella de Souza Silva', null, '2026-09-10 09:51:47-03', '2d4a413e-1711-41c4-9537-5f55a88e4304'),
  ('annysoaresm@gmail.com', 'Anny Soares Moreira', '5511996051253', '2026-09-15 17:53:23-03', '00991f7b-649b-41f7-a681-e9c157aff346'),
  ('madytt@hotmail.com', 'Vanessa Fujita Moreira da Rosa', '5512997726113', '2026-09-20 18:05:26-03', 'a062b6b3-d22d-4a28-9185-f0360be0381e'),
  ('patyrovati@hotmail.com', 'Patrícia dos Santos Rovati', '5513991464532', '2026-09-20 18:13:16-03', 'c67efa57-548c-4831-bc2b-7ee14a1b3930'),
  ('leeti.grando@gmail.com', 'Leticia Grando', '5547988082358', '2026-09-21 17:20:54-03', '6cc5949c-67f6-4c4c-bae1-e09cba377edb'),
  ('milenagriebeler44@gmail.com', 'Milena Griebeler', '5521977669082', '2026-10-01 12:51:19-03', '99ec164f-453b-451c-b388-85f530cd9752')
) as v(email, nome, telefone, data_compra, pedido)
on conflict (email) do update set
  nome            = coalesce(public.alunas.nome, excluded.nome),
  telefone        = coalesce(public.alunas.telefone, excluded.telefone),
  data_compra     = excluded.data_compra,
  pedido_lastlink = excluded.pedido_lastlink,
  status          = 'ativa'
where public.alunas.is_admin is not true;

-- Conferência: cada aluna com a data da compra e até quando vai o acesso
select nome, email,
       to_char(data_compra at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as compra,
       to_char(acesso_ate  at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as acesso_ate,
       status
  from public.alunas
 where is_admin is not true
 order by data_compra;
