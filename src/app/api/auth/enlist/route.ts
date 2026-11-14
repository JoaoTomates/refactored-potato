import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { SENIOR_STRATEGISTS } from '@/lib/race-directors';
import {
    canonicalizeEmail,
    extractClientIp,
    hashSignal,
    isAuthTestMode,
    isDisposableEmail,
    verifyTurnstileIfConfigured,
} from '@/lib/auth-anti-sybil';

interface EnlistBody {
    fullName?: string;
    email?: string;
    password?: string;
    allianceId?: 'A' | 'B' | 'C' | null;
    deviceSignal?: string;
    turnstileToken?: string;
}

const VALID_NAME_PART = /^[\p{L}'-]+$/u;

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
            const missing: string[] = [];
            if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
            if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
            if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

            return NextResponse.json(
                { error: `Configuração de autenticação incompleta no servidor (Faltando na Vercel: ${missing.join(', ')}).` },
                { status: 500 }
            );
        }

        const body = (await request.json()) as EnlistBody;
        const rawFullName = (body.fullName || '').trim();
        const rawEmail = (body.email || '').trim();
        const rawPassword = (body.password || '').trim();
        const allianceId = body.allianceId && ['A', 'B', 'C'].includes(body.allianceId) ? body.allianceId : 'B';
        const rawDeviceSignal = (body.deviceSignal || '').trim();

        const nameParts = rawFullName.split(/\s+/).filter(Boolean);
        if (nameParts.length < 2) {
            return NextResponse.json(
                { error: 'A SUPERLICENÇA EXIGE PELO MENOS DOIS NOMES (NOME E SOBRENOME).' },
                { status: 400 }
            );
        }

        const invalidPart = nameParts.some((p) => p.length < 2 || !VALID_NAME_PART.test(p));
        if (invalidPart) {
            return NextResponse.json(
                { error: 'NOMES INVÁLIDOS: CADA NOME DEVE CONTER NO MÍNIMO 2 LETRAS (SEM NÚMEROS).' },
                { status: 400 }
            );
        }

        const testMode = isAuthTestMode();

        let emailToUse = rawEmail.toLowerCase();
        if (!emailToUse.includes('@')) {
            if (testMode) {
                emailToUse = `${emailToUse.replace(/[^0-9a-z]/g, '')}@baeff1.com`;
            } else {
                return NextResponse.json(
                    { error: 'Informe um endereço de e-mail válido para emissão da Superlicença.' },
                    { status: 400 }
                );
            }
        }

        const clientIp = extractClientIp(request);
        const turnstileCheck = await verifyTurnstileIfConfigured(body.turnstileToken, clientIp);
        if (!turnstileCheck.ok) {
            return NextResponse.json({ error: turnstileCheck.error }, { status: 400 });
        }

        const canonicalEmail = canonicalizeEmail(emailToUse);
        const emailHash = hashSignal(canonicalEmail);
        const ipHash = hashSignal(clientIp);
        const deviceHash = hashSignal(rawDeviceSignal || `ua:${request.headers.get('user-agent') || 'unknown'}`);

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        let eligibleInitialBonus = true;
        let riskClusterId: string | null = null;
        let trustLevel = 'standard';

        if (!testMode) {
            // 1. Bloqueia domínios de e-mail descartáveis/temporários
            if (isDisposableEmail(emailToUse)) {
                return NextResponse.json(
                    { error: 'Provedores de e-mail temporário não são aceitos para emissão da Superlicença.' },
                    { status: 400 }
                );
            }

            // 2. Garante unicidade pelo e-mail canônico (bloqueia +alias e variações com pontos no Gmail)
            const { data: existingCanonical } = await adminClient
                .from('profiles')
                .select('id')
                .eq('canonical_email', canonicalEmail)
                .maybeSingle();

            if (existingCanonical) {
                return NextResponse.json(
                    { error: 'Já existe uma Superlicença registrada para este e-mail. Acesse o Pit Board para entrar.' },
                    { status: 409 }
                );
            }

            // 3. Verifica quarentena pós-exclusão (LGPD: apenas hashes)
            const nowIso = new Date().toISOString();
            const { data: cooldownRows } = await adminClient
                .from('deleted_identity_hashes')
                .select('id, cooldown_until, season_year')
                .or(
                    `and(identity_type.eq.email,identity_hash.eq.${emailHash}),and(identity_type.eq.device,identity_hash.eq.${deviceHash})`
                )
                .order('created_at', { ascending: false })
                .limit(5);

            if (cooldownRows && cooldownRows.length > 0) {
                const activeCooldown = cooldownRows.find((r) => r.cooldown_until > nowIso);
                if (activeCooldown) {
                    return NextResponse.json(
                        {
                            error: 'Esta credencial está em quarentena regulamentar após exclusão recente de conta. Aguarde o prazo ou recupere seu acesso.',
                        },
                        { status: 429 }
                    );
                }

                const sameSeasonDeletion = cooldownRows.some((r) => r.season_year === 2026);
                if (sameSeasonDeletion) {
                    eligibleInitialBonus = false;
                }
            }

            // 4. Verifica se o mesmo deviceHash já tem conta ativa recente (últimos 30 dias)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: deviceSignals } = await adminClient
                .from('account_signals')
                .select('user_id')
                .eq('device_hash', deviceHash)
                .gte('created_at', thirtyDaysAgo)
                .limit(5);

            const deviceUserIds = Array.from(new Set((deviceSignals || []).map((s) => s.user_id)));
            if (deviceUserIds.length > 0) {
                const { data: activeDeviceProfiles } = await adminClient
                    .from('profiles')
                    .select('id')
                    .in('id', deviceUserIds)
                    .limit(1);

                if (activeDeviceProfiles && activeDeviceProfiles.length > 0) {
                    return NextResponse.json(
                        {
                            error: 'Já existe uma Superlicença ativa vinculada a este dispositivo. Entre pelo Pit Board com sua conta existente.',
                        },
                        { status: 403 }
                    );
                }
            }

            // 5. Verifica se o mesmo ipHash possui outra conta ativa (rede compartilhada -> isola em cluster)
            if (clientIp !== 'unknown') {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: ipSignals } = await adminClient
                    .from('account_signals')
                    .select('user_id')
                    .eq('ip_hash', ipHash)
                    .gte('created_at', sevenDaysAgo)
                    .limit(5);

                const ipUserIds = Array.from(new Set((ipSignals || []).map((s) => s.user_id)));
                if (ipUserIds.length > 0) {
                    const { data: clusterProfiles } = await adminClient
                        .from('profiles')
                        .select('id, risk_cluster_id')
                        .in('id', ipUserIds);

                    if (clusterProfiles && clusterProfiles.length > 0) {
                        const existingCluster = clusterProfiles.find((p) => p.risk_cluster_id)?.risk_cluster_id;
                        riskClusterId = existingCluster || crypto.randomUUID();
                        trustLevel = 'flagged_cluster';

                        // Garante que as contas anteriores da mesma rede também fiquem vinculadas ao mesmo cluster
                        if (!existingCluster) {
                            await adminClient
                                .from('profiles')
                                .update({ risk_cluster_id: riskClusterId, trust_level: 'flagged_cluster' })
                                .in('id', clusterProfiles.map((p) => p.id));
                        }
                    }
                }
            }
        }

        // Em produção ou quando campo ficar vazio, gera senha aleatória forte;
        // quando o usuário informar senha no campo opcional, respeita a senha escolhida.
        const chosenPassword = rawPassword || `Volt${crypto.randomBytes(6).toString('hex')}!`;

        const rawFirst = nameParts[0];
        const rawLast = nameParts.slice(1).join(' ');
        const cleanFirstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
        const cleanLastName = rawLast.toUpperCase();
        const generatedNumber = Math.floor(Math.random() * 99) + 1;

        const initial = cleanFirstName.charAt(0).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const lastNameSlug = cleanLastName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const slug = `${initial}.${lastNameSlug}${generatedNumber}`.toLowerCase();

        const origin = request.headers.get('origin') || new URL(request.url).origin;
        const redirectUrl = `${origin}/headquarters`;

        const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: authData, error: authError } = await anonClient.auth.signUp({
            email: emailToUse,
            password: chosenPassword,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    alliance_id: allianceId,
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    full_name: `${cleanFirstName} ${cleanLastName}`,
                },
            },
        });

        if (authError) {
            return NextResponse.json(
                { error: authError.message || 'ERRO NA TRANSMISSÃO DA SUPERLICENÇA' },
                { status: 400 }
            );
        }

        const randomStrategist = SENIOR_STRATEGISTS[Math.floor(Math.random() * SENIOR_STRATEGISTS.length)];

        if (authData.user) {
            let canonicalToStore: string | null = canonicalEmail;
            if (testMode) {
                const { data: taken } = await adminClient
                    .from('profiles')
                    .select('id')
                    .eq('canonical_email', canonicalEmail)
                    .maybeSingle();
                if (taken) canonicalToStore = null;
            }

            await adminClient.from('profiles').upsert({
                id: authData.user.id,
                email: emailToUse,
                canonical_email: canonicalToStore,
                auth_provider: 'email',
                trust_level: trustLevel,
                risk_cluster_id: riskClusterId,
                eligible_initial_bonus: eligibleInitialBonus,
                first_name: cleanFirstName,
                last_name: cleanLastName,
                nationality: null,
                org_color: '#000000',
                setup_completed: false,
                slug,
                senior_strategist_id: randomStrategist.id,
                mls_balance: eligibleInitialBonus ? 100 : 0,
            });

            await adminClient.from('account_signals').insert({
                user_id: authData.user.id,
                device_hash: deviceHash,
                ip_hash: ipHash,
                event_type: 'enlist',
            });
        }

        return NextResponse.json({
            ok: true,
            email: emailToUse,
            slug,
            seniorStrategistId: randomStrategist.id,
            eligibleInitialBonus,
            testMode,
            session: authData.session
                ? {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                }
                : null,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'ERRO NA TRANSMISSÃO DA SUPERLICENÇA';
        console.error('Erro em POST /api/auth/enlist:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
