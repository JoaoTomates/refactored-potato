import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token de autorização não fornecido' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Configuração do Supabase incompleta no servidor' }, { status: 500 });
        }

        // 1. Valida o token com o client do Supabase
        const userClient = createClient(supabaseUrl, supabaseAnonKey || serviceRoleKey);
        const { data: { user }, error: authError } = await userClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Usuário não autenticado ou sessão expirada' }, { status: 401 });
        }

        const userId = user.id;

        // 2. Client administrativo com service role para expurgo total
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. Remove dados das tabelas dependentes
        await adminClient.from('predictions').delete().eq('user_id', userId);
        await adminClient.from('contracts').delete().eq('user_id', userId);
        await adminClient.from('profiles').delete().eq('id', userId);

        // 4. Remove a identidade e login em auth.users
        const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteUserError) {
            console.error('Erro ao excluir usuário em auth.users:', deleteUserError);
        }

        return NextResponse.json({ success: true, message: 'Conta e credenciais excluídas com sucesso.' });
    } catch (err: any) {
        console.error('Erro ao processar exclusão de conta:', err);
        return NextResponse.json({ error: err.message || 'Erro interno ao processar exclusão de conta' }, { status: 500 });
    }
}
