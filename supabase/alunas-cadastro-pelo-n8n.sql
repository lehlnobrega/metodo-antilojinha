-- =====================================================================
-- DEIXA O N8N CADASTRAR A ALUNA DIRETO NA TABELA alunas (igual ao Guia)
-- Rode inteiro no SQL Editor do Supabase do Método. Pode rodar de novo.
--
-- Antes: a aluna só podia entrar na tabela depois de ter login.
-- Agora: o n8n cadastra pelo e-mail. Quando ela cria a senha no
-- primeiro acesso, o login é ligado sozinho ao cadastro dela.
-- Também cria a situação "expirada" (fim do ano de acesso na Lastlink).
-- Nada das alunas é apagado.
-- =====================================================================

-- 1. Cadastro sem login: id gerado sozinho
alter table public.alunas drop constraint if exists alunas_id_fkey;
alter table public.alunas alter column id set default gen_random_uuid();

-- 2. Situação "expirada"
alter table public.alunas drop constraint if exists alunas_status_check;
alter table public.alunas add constraint alunas_status_check
  check (status in ('ativa', 'pausada', 'expirada', 'reembolsada', 'cancelada'));

-- 3. Quando o login é criado, liga ao cadastro que tem o mesmo e-mail
create or replace function public.ligar_login_a_aluna()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.alunas
     set id = new.id
   where lower(email) = lower(new.email)
     and id <> new.id
     and not exists (select 1 from public.alunas x where x.id = new.id);
  return new;
end
$$;

drop trigger if exists trg_ligar_login_a_aluna on auth.users;
create trigger trg_ligar_login_a_aluna
  after insert on auth.users
  for each row execute function public.ligar_login_a_aluna();

-- 4. Conferência
select count(*) as alunas from public.alunas;
