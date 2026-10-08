-- ==============================================================================
-- RPC: EXCLUSÃO DEFINITIVA DE CONTA PELO PRÓPRIO USUÁRIO (VOLTGRID)
-- ==============================================================================
-- Esta função permite que um usuário autenticado exclua sua própria conta,
-- removendo previsões, contratos, perfil e registro de autenticação.
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Operação não autorizada: Usuário não autenticado.';
    END IF;

    -- 1. Excluir dados vinculados ao usuário nas tabelas públicas
    DELETE FROM public.predictions WHERE user_id = current_user_id;
    DELETE FROM public.contracts WHERE user_id = current_user_id;
    DELETE FROM public.profiles WHERE id = current_user_id;

    -- 2. Excluir o usuário do sistema de autenticação
    DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Permite a execução da função por qualquer usuário autenticado
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
