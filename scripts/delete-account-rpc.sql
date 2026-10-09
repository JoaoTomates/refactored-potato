-- ==============================================================================
-- RPC: RESCISÃO DE SUPERLICENÇA & EXCLUSÃO DE CONTA (VOLTGRID)
-- ==============================================================================
-- Esta função permite que um usuário autenticado exclua sua própria conta,
-- preservando a integridade das competições e respeitando a LGPD/GDPR:
-- 1. Rescinde o contrato da equipe (liberando a vaga imediatamente no Pitwall).
-- 2. Cancela apostas da rodada corrente em aberto.
-- 3. Anonimiza os dados pessoais de perfil (mantendo pontos históricos de GPs passados).
-- 4. Exclui a identidade e credenciais de login em auth.users.
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    anon_slug text;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Operação não autorizada: Usuário não autenticado.';
    END IF;

    -- 1. Rescindir contrato ativo na equipe (desocupa o assento no Pitwall)
    DELETE FROM public.contracts WHERE user_id = current_user_id;

    -- 2. Cancelar apostas e previsões da rodada em aberto
    DELETE FROM public.predictions WHERE user_id = current_user_id AND round = 'current';

    -- 3. Anonimização estrita de dados pessoais (LGPD / GDPR)
    anon_slug := '@desligado_' || floor(1000 + random() * 9000)::text;
    UPDATE public.profiles
    SET 
        first_name = 'PILOTO',
        last_name = 'DESLIGADO',
        slug = anon_slug,
        avatar_url = NULL,
        nationality = NULL,
        org_color = '#333333',
        setup_completed = false
    WHERE id = current_user_id;

    -- 4. Excluir o usuário do sistema de autenticação (revoga senhas e magic links)
    DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Permite a execução da função por qualquer usuário autenticado
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
