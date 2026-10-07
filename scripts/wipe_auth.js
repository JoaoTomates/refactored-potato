import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fivzbbqzgvvwgtlhietx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdnpiYnF6Z3Z2d2d0bGhpZXR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjczMjE0MiwiZXhwIjoyMDk4MzA4MTQyfQ.9qN4j9vkaI6kz2kyptG7QSdCLcQgpiFO6GwqasvNTQE',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function wipeDatabase() {
    console.log("Iniciando limpeza completa do banco de dados...");

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
