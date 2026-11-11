import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canonicalizeEmail, hashSignal } from '@/lib/auth-anti-sybil';

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

        // 2. Client administrativo com service role para expurgo e rescisão contratual
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 2b. Registra hashes irreversíveis para cooldown anti-farming (LGPD compliant, zero PII em texto claro)
        const { data: profileData } = await adminClient
            .from('profiles')
            .select('email, canonical_email, phone_hash')
            .eq('id', userId)
            .maybeSingle();

        const { data: latestSignal } = await adminClient
            .from('account_signals')
            .select('device_hash')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const cooldownUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const hashesToStore: {
            identity_hash: string;
            identity_type: 'email' | 'phone' | 'device';
            season_year: number;
            cooldown_until: string;
        }[] = [];

        const emailToHash = profileData?.canonical_email || (user.email ? canonicalizeEmail(user.email) : '');
        if (emailToHash) {
            hashesToStore.push({
                identity_hash: hashSignal(emailToHash),
                identity_type: 'email',
                season_year: 2026,
                cooldown_until: cooldownUntil,
            });
        }
        if (profileData?.phone_hash) {
            hashesToStore.push({
                identity_hash: profileData.phone_hash,
                identity_type: 'phone',
                season_year: 2026,
                cooldown_until: cooldownUntil,
            });
        }
        if (latestSignal?.device_hash) {
            hashesToStore.push({
                identity_hash: latestSignal.device_hash,
                identity_type: 'device',
                season_year: 2026,
                cooldown_until: cooldownUntil,
            });
        }

        if (hashesToStore.length > 0) {
            await adminClient.from('deleted_identity_hashes').insert(hashesToStore);
        }

        // 3. Rescisão de contrato de equipe: libera o assento imediatamente para novos pilotos no Pitwall
        await adminClient.from('contracts').delete().eq('user_id', userId);

        // 4. Cancelamento de apostas da rodada corrente / em aberto
        await adminClient.from('predictions').delete().eq('user_id', userId).eq('round', 'current');

        // 5. Anonimização estrita do perfil (LGPD / GDPR): descaracterização de dados pessoais
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        await adminClient.from('profiles').update({
            first_name: 'PILOTO',
            last_name: 'DESLIGADO',
            slug: `@desligado_${randomSuffix}`,
            avatar_url: null,
            nationality: null,
            org_color: '#333333',
            setup_completed: false
        }).eq('id', userId);

        // 6. Exclui a conta e credenciais permanentemente de auth.users
        const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteUserError) {
            console.error('Aviso ao excluir em auth.users:', deleteUserError);
            // Fallback caso a FK não tenha cascade: apaga o perfil diretamente
            await adminClient.from('profiles').delete().eq('id', userId);
            await adminClient.auth.admin.deleteUser(userId);
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Superlicença revogada, vaga no grid liberada e credenciais excluídas com sucesso.' 
        });
    } catch (err: any) {
        console.error('Erro ao processar exclusão de conta:', err);
        return NextResponse.json({ error: err.message || 'Erro interno ao processar exclusão de conta' }, { status: 500 });
    }
}
