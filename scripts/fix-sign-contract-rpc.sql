-- Fix sign_initial_contract: add mandatory WHERE clauses required by PostgreSQL safeupdate
CREATE OR REPLACE FUNCTION public.sign_initial_contract(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_group_id int;
  v_spots_taken int;
  v_team_color varchar;
  v_next_filling_id int;
BEGIN
  INSERT INTO public.rpc_logs(msg) VALUES ('RPC called with team: ' || p_team_id::text);
  
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    INSERT INTO public.rpc_logs(msg) VALUES ('ERROR: Not authenticated');
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.rpc_logs(msg) VALUES ('User authenticated: ' || v_user_id::text);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND setup_completed = true) THEN
    INSERT INTO public.rpc_logs(msg) VALUES ('ERROR: User has already completed setup');
    RAISE EXCEPTION 'User has already completed setup';
  END IF;

  LOCK TABLE public.contracts IN EXCLUSIVE MODE;

  -- 1. Encontra o grupo ativo atual (ou o primeiro com vagas na equipe)
  SELECT id INTO v_group_id FROM public.groups WHERE is_filling = true AND id > 0 ORDER BY id ASC LIMIT 1;
  
  IF v_group_id IS NULL THEN
    v_group_id := 1;
  END IF;

  -- Verifica se a equipe escolhida ja esta cheia no grupo atual
  SELECT count(*) INTO v_spots_taken FROM public.contracts WHERE group_id = v_group_id AND team_id = p_team_id;
  
  -- Se o grupo atual estiver lotado nesta equipe, avanca para o proximo grupo com vaga
  WHILE v_spots_taken >= 2 LOOP
    v_group_id := v_group_id + 1;
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = v_group_id) THEN
      INSERT INTO public.groups (id, name, tier, is_filling)
      VALUES (v_group_id, 'Group ' || v_group_id, 2, false);
    END IF;
    SELECT count(*) INTO v_spots_taken FROM public.contracts WHERE group_id = v_group_id AND team_id = p_team_id;
  END LOOP;

  -- Insere o contrato no grupo disponivel
  INSERT INTO public.contracts (user_id, group_id, team_id, year)
  VALUES (v_user_id, v_group_id, p_team_id, 2026);

  SELECT color INTO v_team_color FROM public.teams WHERE id = p_team_id;

  UPDATE public.profiles 
  SET setup_completed = true, org_color = v_team_color 
  WHERE id = v_user_id;

  -- Encontra qual grupo deve ser marcado como is_filling = true
  SELECT g.id INTO v_next_filling_id
  FROM public.groups g
  LEFT JOIN (
    SELECT group_id, COUNT(*) as cnt 
    FROM public.contracts 
    GROUP BY group_id
  ) c ON c.group_id = g.id
  WHERE COALESCE(c.cnt, 0) < 22 AND g.id > 0
  ORDER BY g.id ASC
  LIMIT 1;

  IF v_next_filling_id IS NOT NULL THEN
    UPDATE public.groups 
    SET is_filling = false 
    WHERE id > 0 AND id <> v_next_filling_id;

    UPDATE public.groups 
    SET is_filling = true 
    WHERE id = v_next_filling_id;
  END IF;

  INSERT INTO public.rpc_logs(msg) VALUES ('RPC SUCCESS: Team signed into group ' || v_group_id::text);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.rpc_logs(msg) VALUES ('UNHANDLED ERROR: ' || SQLERRM);
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;
