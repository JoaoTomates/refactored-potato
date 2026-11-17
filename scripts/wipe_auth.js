import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fivzbbqzgvvwgtlhietx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY ausente.');
  console.error('Uso: node --env-file=.env.local scripts/wipe_auth.js');
  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function wipeDatabase() {
    console.log("Iniciando limpeza completa do banco de dados...");

    // 0. Limpa membros e esquadrões de teamwork
    const { error: errTeamMem } = await supabase.from('teamwork_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errTeamMem) console.warn("Aviso ao limpar teamwork_members:", errTeamMem.message);
    else console.log("✓ Tabela 'teamwork_members' limpa com sucesso.");

    const { error: errTeamSq } = await supabase.from('teamwork_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errTeamSq) console.warn("Aviso ao limpar teamwork_squads:", errTeamSq.message);
    else console.log("✓ Tabela 'teamwork_squads' limpa com sucesso.");

    // 1. Limpa apostas / previsões
    const { error: errPred } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errPred) console.warn("Aviso ao limpar predictions:", errPred.message);
    else console.log("✓ Tabela 'predictions' limpa com sucesso.");

    // 2. Limpa contratos
    const { error: errCont } = await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errCont) console.warn("Aviso ao limpar contracts:", errCont.message);
    else console.log("✓ Tabela 'contracts' limpa com sucesso.");

    // 3. Limpa perfis públicos
    const { error: errProf } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errProf) console.warn("Aviso ao limpar profiles:", errProf.message);
    else console.log("✓ Tabela 'profiles' limpa com sucesso.");

    // 4. Limpa todos os usuários cadastrados no Supabase Auth
    const { data: { users }, error: errUsers } = await supabase.auth.admin.listUsers();
    if (errUsers) {
        console.error("Erro ao listar auth.users:", errUsers);
        return;
    }

    console.log(`Encontrados ${users.length} usuários em auth.users para remoção.`);
    for (const u of users) {
        const { error: delError } = await supabase.auth.admin.deleteUser(u.id);
        if (delError) {
            console.log(`Falha ao remover ${u.email}:`, delError.message);
        } else {
            console.log(`✓ Removido auth user: ${u.email}`);
        }
    }

    console.log("\n==========================================");
    console.log("BANCO DE DADOS E AUTH ZERADOS COM SUCESSO!");
    console.log("==========================================\n");
}

wipeDatabase();
