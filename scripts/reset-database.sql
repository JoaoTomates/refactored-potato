-- ==========================================
-- SCRIPT DE RESET DE BANCO DE DADOS (VOLTGRID)
-- ==========================================
-- AVISO: A execução deste script é IRREVERSÍVEL.
-- Ele irá apagar TODOS os usuários cadastrados, senhas e formulários de apostas.
-- As configurações globais (como próxima corrida) serão mantidas.

-- 1. Apaga todas as apostas (formulários preenchidos)
DELETE FROM public.predictions;

-- 2. Apaga todos os perfis de usuários da tabela pública
DELETE FROM public.profiles;

-- 3. Apaga as identidades e logins do Supabase Auth
-- (Isso impede que usuários antigos tentem logar com as senhas anteriores)
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================
