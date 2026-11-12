"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug } from '@/lib/slug';
import { getSystemBoxStyle } from '@/components/system-modal';

type AuthMode = 'MAGIC_LINK' | 'PASSWORD';

function SuperlicenseAuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading } = useSupabaseAuth();

    const [mode, setMode] = useState<AuthMode>(() => {
        return searchParams?.get('mode') === 'magic' ? 'MAGIC_LINK' : 'PASSWORD';
    });
    const [loadingAction, setLoadingAction] = useState(false);
    
    // Form fields: aceita e-mail, @slug ou código do piloto (ex: L.GUSTAVO88)
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const rawRedirect = searchParams?.get('redirect');
    const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/superlicense')
        ? rawRedirect
        : null;
    const isTransmitRedirect = searchParams?.get('reason') === 'transmit';

    // UI states
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (searchParams?.get('account_deleted')) {
            setSuccessMsg('SUPERLICENÇA REVOGADA E CONTA EXCLUÍDA COM SUCESSO DO GRID.');
        }
    }, [searchParams]);

    useEffect(() => {
        const forceLogin = searchParams?.get('force') === 'login' || searchParams?.get('logout') === 'true';
        if (forceLogin) {
            clearCachedStrategistSession();
            supabase.auth.signOut().then(() => {});
            return;
        }

        // Se usuário autenticado com setup COMPLETO, redireciona para destino solicitado ou pitwall
        const checkExistingSession = async () => {
            if (isLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).maybeSingle();
                const normalizedSlug = normalizeAtSlug(data?.slug);
                if (typeof window !== 'undefined') {
                    if (normalizedSlug) {
                        localStorage.setItem('vg_user_slug', normalizedSlug);
                    } else {
                        localStorage.removeItem('vg_user_slug');
                    }
                }
                if (normalizedSlug && data?.setup_completed === true) {
                    if (safeRedirect) {
                        window.location.replace(safeRedirect);
                        return;
                    }
                    window.location.replace(getDashboardPath(normalizedSlug));
                }
            }
        };
        checkExistingSession();
    }, [user, isLoading, searchParams, safeRedirect]);

    // Resolução resiliente do e-mail oficial a partir de E-mail, @slug, slug ou formato L.GUSTAVO88
    const resolveLoginEmail = async (rawInput: string): Promise<string> => {
        const raw = (rawInput || '').trim();
        if (!raw) return '';
        if (raw.includes('@') && raw.includes('.')) {
            return raw.toLowerCase();
        }
        const clean = raw.replace(/^@/, '').toLowerCase();

        // 1. Tenta buscar pelo slug (@clean ou clean)
        const { data: pSlug } = await supabase
            .from('profiles')
            .select('email')
            .or(`slug.eq.@${clean},slug.eq.${clean},slug.ilike.@${clean},slug.ilike.${clean}`)
            .maybeSingle();

        if (pSlug?.email) return pSlug.email.toLowerCase();

        // 2. Tenta buscar pelo formato padrão de piloto (ex: L.GUSTAVO88 ou L.GUSTAVO)
        const match = raw.match(/^([a-zA-Z])\s*\.?\s*([a-zA-Z]+)\s*(\d*)$/);
        if (match) {
            const [, initial, lastName, num] = match;
            let query = supabase
                .from('profiles')
                .select('email')
                .ilike('first_name', `${initial}%`)
                .ilike('last_name', lastName);
            if (num) {
                query = query.eq('driver_number', parseInt(num, 10));
            }
            const { data: pPilot } = await query.maybeSingle();
            if (pPilot?.email) return pPilot.email.toLowerCase();
        }

        // 3. Tenta buscar pelo prefixo do e-mail
        const { data: pPref } = await supabase
            .from('profiles')
            .select('email')
            .ilike('email', `${clean}@%`)
            .maybeSingle();

        if (pPref?.email) return pPref.email.toLowerCase();

        return raw.toLowerCase();
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const resolvedEmail = await resolveLoginEmail(identifier);
            if (!resolvedEmail || !resolvedEmail.includes('@')) {
                throw new Error('Não foi possível identificar o e-mail correspondente para este estrategista/slug.');
            }
            const { error } = await supabase.auth.signInWithOtp({
                email: resolvedEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/superlicense${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`
                }
            });
            if (error) throw error;
            setSuccessMsg(`LINK DE ACESSO ENVIADO PARA ${resolvedEmail.toUpperCase()}. VERIFIQUE SUA CAIXA DE ENTRADA.`);
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao enviar link mágico.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        setErrorMsg('');

        try {
            const resolvedEmail = await resolveLoginEmail(identifier);
            if (!resolvedEmail) {
                throw new Error('Informe seu e-mail, slug ou código de piloto.');
            }

            // Tenta variações comuns de senha (ex: original, sem espaços, 1a maiúscula, maiúscula ou minúscula)
            const rawPass = password;
            const trimmedPass = rawPass.trim();
            const capitalizedPass = trimmedPass.charAt(0).toUpperCase() + trimmedPass.slice(1).toLowerCase();
            const candidates = Array.from(new Set([
                rawPass,
                trimmedPass,
                capitalizedPass,
                trimmedPass.toLowerCase(),
                trimmedPass.toUpperCase()
            ]));

            let authData = null;
            let authError = null;

            for (const candidate of candidates) {
                const res = await supabase.auth.signInWithPassword({ 
                    email: resolvedEmail, 
                    password: candidate 
                });
                if (res.data?.user) {
                    authData = res.data;
                    authError = null;
                    break;
                }
                authError = res.error;
            }

            if (authError || !authData?.user) {
                throw authError || new Error('Credenciais inválidas.');
            }

            if (authData?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('slug, setup_completed')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                const normalizedSlug = normalizeAtSlug(profile?.slug);
                if (typeof window !== 'undefined') {
                    if (normalizedSlug) {
                        localStorage.setItem('vg_user_slug', normalizedSlug);
                    } else {
                        localStorage.removeItem('vg_user_slug');
                    }
                }

                if (safeRedirect) {
                    window.location.href = safeRedirect;
                    return;
                }

                if (normalizedSlug && profile?.setup_completed === true) {
                    window.location.href = getDashboardPath(normalizedSlug);
                    return;
                } else {
                    window.location.href = '/headquarters';
                    return;
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Credenciais inválidas.');
            setLoadingAction(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">VERIFICANDO CREDENCIAIS...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[420px] mx-auto p-4 sm:p-6 relative z-10 font-mono">
            {/* Alças superiores de fixação do Pit Board */}
            <div className="flex justify-between items-end px-10 -mb-px relative z-0">
                <div
                    className="w-5 h-5 border border-[#000000] rounded-t-[3px] flex items-center justify-center"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fbaa19]/80" />
                </div>
                <div
                    className="w-5 h-5 border border-[#000000] rounded-t-[3px] flex items-center justify-center"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fbaa19]/80" />
                </div>
            </div>

            {/* Chassi do Pit Board (#030303 -> #000000, border #000000, radius <= 3px, sombra spread) */}
            <div
                className="border border-[#000000] px-6 py-8 sm:px-8 sm:py-9 rounded-[3px] relative"
                style={getSystemBoxStyle('#fbaa19')}
            >
                {/* Header das Abas: LOGIN ativo e PRIMEIRO DIA » redirecionando para a jornada do invite */}
                <div className="flex relative border-b border-white/10 mb-8">
                    <div className="flex-1 pb-3 text-center relative">
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#fbaa19]">
                            LOGIN
                        </span>
                        <div className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-[#fbaa19]" />
                    </div>
                    <Link 
                        href="/invite"
                        className="flex-1 pb-3 text-center text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
                        title="Iniciar jornada do primeiro dia no recrutamento"
                    >
                        PRIMEIRO DIA »
                    </Link>
                </div>

                {user && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-[#000000] rounded-[3px] flex flex-col gap-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                                ● SESSÃO ATIVA DETECTADA
                            </span>
                            <span className="text-[10px] text-gray-300 font-mono truncate max-w-[180px]">
                                {user.email}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (safeRedirect) {
                                        window.location.href = safeRedirect;
                                        return;
                                    }
                                    const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).maybeSingle();
                                    const normalizedSlug = normalizeAtSlug(data?.slug);
                                    if (typeof window !== 'undefined') {
                                        if (normalizedSlug) localStorage.setItem('vg_user_slug', normalizedSlug);
                                        else localStorage.removeItem('vg_user_slug');
                                    }
                                    if (normalizedSlug && data?.setup_completed) {
                                        window.location.href = getDashboardPath(normalizedSlug);
                                    } else {
                                        window.location.href = '/headquarters';
                                    }
                                }}
                                className="flex-1 bg-[#fbaa19] text-black font-black text-[10px] uppercase py-2 tracking-widest hover:bg-white transition-colors cursor-pointer text-center rounded-[3px] border border-[#000000]"
                            >
                                Entrar no Painel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    clearCachedStrategistSession();
                                    await supabase.auth.signOut();
                                    window.location.href = '/superlicense?force=login';
                                }}
                                className="flex-1 bg-red-950/70 border border-[#000000] text-red-300 font-bold text-[10px] uppercase py-2 tracking-widest hover:bg-red-800 transition-colors cursor-pointer text-center rounded-[3px]"
                            >
                                Sair / Trocar Conta
                            </button>
                        </div>
                    </div>
                )}

                {isTransmitRedirect && !user && (
                    <div className="mb-6 p-3.5 bg-[#fbaa19]/10 border border-[#000000] rounded-[3px] text-[#fbaa19] text-[10px] font-bold uppercase tracking-widest text-center">
                        ● AUTENTIQUE SUA SUPERLICENÇA PARA CONCLUIR A TRANSMISSÃO DAS POSIÇÕES (SEUS PALPITES ESTÃO SALVOS).
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 p-3.5 bg-red-900/30 border border-[#000000] rounded-[3px] text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
                        [ERRO] {errorMsg}
                    </div>
                )}
                
                {successMsg && (
                    <div className="mb-6 p-3.5 bg-green-900/30 border border-[#000000] rounded-[3px] text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">
                        [SISTEMA] {successMsg}
                    </div>
                )}

                {/* CONTEÚDO PRINCIPAL: PITBOARD */}
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-white text-2xl sm:text-3xl font-black uppercase tracking-[0.22em]">
                            PITBOARD
                        </h2>
                    </div>

                    <form onSubmit={mode === 'MAGIC_LINK' ? handleMagicLink : handlePasswordLogin} className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            required
                            placeholder="email | @slug | username"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            className="w-full bg-[#030303] border border-[#000000] text-white placeholder-white/35 px-4 py-3.5 font-mono text-[calc(0.75rem+0.5px)] normal-case tracking-wider focus:outline-none focus:ring-1 focus:ring-[#fbaa19] transition-all rounded-[3px]"
                        />
                        
                        {mode === 'PASSWORD' && (
                            <div className="relative w-full">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="w-full bg-[#030303] border border-[#000000] text-white placeholder-white/35 px-4 py-3.5 pr-20 font-mono text-[calc(0.75rem+0.5px)] normal-case tracking-wider focus:outline-none focus:ring-1 focus:ring-[#fbaa19] transition-all rounded-[3px]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50 hover:text-[#fbaa19] font-mono tracking-widest uppercase transition-colors px-1 py-1 cursor-pointer"
                                    title={showPassword ? "Ocultar senha" : "Ver senha em texto"}
                                >
                                    {showPassword ? '[OCULTAR]' : '[VER]'}
                                </button>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loadingAction}
                            className="w-full bg-[#fbaa19] hover:bg-[#e59914] text-black font-black uppercase tracking-widest py-3.5 px-4 mt-2 transition-colors disabled:opacity-50 text-[calc(0.75rem+0.5px)] sm:text-[calc(0.875rem+0.5px)] cursor-pointer shadow-md rounded-[3px] border border-[#000000]"
                        >
                            {loadingAction 
                                ? 'PROCESSANDO...' 
                                : (mode === 'MAGIC_LINK' ? 'ENVIAR LINK MÁGICO' : 'Acessar')}
                        </button>
                    </form>

                    <div className="flex justify-center mt-2">
                        <button 
                            type="button"
                            onClick={() => setMode(mode === 'MAGIC_LINK' ? 'PASSWORD' : 'MAGIC_LINK')}
                            className="text-[10px] sm:text-[11px] font-mono tracking-widest text-white/50 hover:text-[#fbaa19] uppercase transition-colors cursor-pointer text-center"
                        >
                            {mode === 'MAGIC_LINK' 
                                ? '» PREFIRO USAR MINHA SENHA' 
                                : '» ESQUECI MINHA SENHA / ACESSO POR LINK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SuperlicenseView() {
    return (
        <main className="w-full min-h-dvh bg-[#050401] relative flex flex-col font-mono items-center justify-center py-12 px-4 overflow-x-clip">
            {/* Background Viewport Estável e Fixo (Noir Yellow & Black) */}
            <div 
                className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden"
                style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
            >
                <img 
                    src="/pixel_pitboard_bg.png"
                    alt=""
                    className="w-full h-full object-cover object-center opacity-90 md:opacity-95"
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Noir Vignette & Telemetry Atmosphere */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_#050401_92%)] opacity-85" />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fbaa19_0%,_transparent_65%)]" />
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }} />
            </div>

            <Suspense fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <SuperlicenseAuthContent />
            </Suspense>
        </main>
    );
}
