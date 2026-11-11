"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug } from '@/lib/slug';
import Logo from '@/components/logo';
import { ArrowRight, KeyRound, Mail, Sparkles } from 'lucide-react';

type AuthMode = 'PASSWORD' | 'MAGIC_LINK';

function LandingHomeContent() {
    const searchParams = useSearchParams();
    const { user, isLoading } = useSupabaseAuth();

    const [mode, setMode] = useState<AuthMode>(() => {
        return searchParams?.get('mode') === 'magic' ? 'MAGIC_LINK' : 'PASSWORD';
    });
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const rawRedirect = searchParams?.get('redirect');
    const safeRedirect =
        rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
            ? rawRedirect
            : null;

    useEffect(() => {
        const forceLogin =
            searchParams?.get('force') === 'login' || searchParams?.get('logout') === 'true';
        if (forceLogin) {
            clearCachedStrategistSession();
            supabase.auth.signOut().then(() => {});
            return;
        }

        const checkExistingSession = async () => {
            if (isLoading || !user) return;
            const { data } = await supabase
                .from('profiles')
                .select('slug, setup_completed')
                .eq('id', user.id)
                .maybeSingle();

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
        };

        checkExistingSession();
    }, [user, isLoading, searchParams, safeRedirect]);

    const resolveLoginEmail = async (rawInput: string): Promise<string> => {
        const raw = (rawInput || '').trim();
        if (!raw) return '';
        if (raw.includes('@') && raw.includes('.')) {
            return raw.toLowerCase();
        }
        const clean = raw.replace(/^@/, '').toLowerCase();

        const { data: pSlug } = await supabase
            .from('profiles')
            .select('email')
            .or(`slug.eq.@${clean},slug.eq.${clean},slug.ilike.@${clean},slug.ilike.${clean}`)
            .maybeSingle();

        if (pSlug?.email) return pSlug.email.toLowerCase();

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
                throw new Error('Não foi possível identificar o e-mail para este estrategista/slug.');
            }
            const { error } = await supabase.auth.signInWithOtp({
                email: resolvedEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/superlicense${
                        safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''
                    }`,
                },
            });
            if (error) throw error;
            setSuccessMsg(`LINK ENVIADO PARA ${resolvedEmail.toUpperCase()}. VERIFIQUE SEU E-MAIL.`);
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
        setSuccessMsg('');

        try {
            const resolvedEmail = await resolveLoginEmail(identifier);
            if (!resolvedEmail) {
                throw new Error('Informe seu e-mail, @slug ou código de piloto.');
            }

            const rawPass = password;
            const trimmedPass = rawPass.trim();
            const capitalizedPass =
                trimmedPass.charAt(0).toUpperCase() + trimmedPass.slice(1).toLowerCase();
            const candidates = Array.from(
                new Set([
                    rawPass,
                    trimmedPass,
                    capitalizedPass,
                    trimmedPass.toLowerCase(),
                    trimmedPass.toUpperCase(),
                ])
            );

            let authData = null;
            let authError = null;

            for (const candidate of candidates) {
                const res = await supabase.auth.signInWithPassword({
                    email: resolvedEmail,
                    password: candidate,
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
            }
            window.location.href = '/headquarters';
        } catch (err: any) {
            setErrorMsg(err.message || 'Credenciais inválidas.');
            setLoadingAction(false);
        }
    };

    return (
        <main className="relative w-full min-h-screen overflow-hidden bg-[#050401] text-white font-mono flex flex-col justify-between select-none">
            {/* CENÁRIO PRINCIPAL FULL-BLEED: PADDOCK TERRACE (-2H) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/pixel_opening_bg.jpg"
                    alt="VoltGrid Paddock Terrace"
                    className="w-full h-full object-cover object-center"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Vinheta sutil apenas nas bordas superior e inferior para preservar o cenário */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-72 sm:h-52 bg-gradient-to-t from-black/95 via-black/75 to-transparent" />
            </div>

            {/* BARRA SUPERIOR MINIMALISTA */}
            <header className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-8 pt-5 flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-white/60">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fbaa19] animate-pulse" />
                    <span className="font-bold text-white/80">BAEFF1 // SEASON 2026</span>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                    <span>PADDOCK OBSERVATION DECK</span>
                    <span className="text-[#fbaa19] font-bold">T-02:00:00</span>
                </div>
            </header>

            {/* RODAPÉ NÃO-CONVENCIONAL: LOGO À ESQUERDA + INPUTS SOLTOS À DIREITA */}
            <footer className="relative z-20 w-full border-t border-[#fbaa19]/25 bg-black/70 backdrop-blur-md">
                {/* Toast de feedback acima da linha do footer */}
                {(errorMsg || successMsg) && (
                    <div className="max-w-[1440px] mx-auto px-5 sm:px-8 pt-3">
                        <div
                            className={`px-3.5 py-2 rounded-xs border text-[10px] font-bold uppercase tracking-widest ${
                                errorMsg
                                    ? 'bg-red-950/70 border-red-500/50 text-red-300'
                                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                            }`}
                        >
                            {errorMsg ? `[ERRO] ${errorMsg}` : `[SISTEMA] ${successMsg}`}
                        </div>
                    </div>
                )}

                <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* LADO ESQUERDO: LOGO VOLTGRID (AMARELA E PRETA) */}
                    <div className="flex items-center gap-3.5 shrink-0">
                        <Logo size="lg" />
                        <div className="flex flex-col leading-none">
                            <span
                                style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                className="text-xl sm:text-2xl font-black tracking-[0.18em] text-[#fbaa19] uppercase"
                            >
                                VOLTGRID
                            </span>
                            <span className="text-[9px] tracking-[0.28em] text-white/55 uppercase mt-1">
                                F1 TELEMETRY &amp; STRATEGY
                            </span>
                        </div>
                    </div>

                    {/* LADO DIREITO: INPUTS SOLTOS EM LINHA + PRIMEIRA VEZ */}
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#fbaa19]">
                            <span className="w-3 h-3 border-2 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                            <span>SINCRONIZANDO SUPERLICENÇA...</span>
                        </div>
                    ) : user ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{user.email}</span>
                            </span>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (safeRedirect) {
                                        window.location.href = safeRedirect;
                                        return;
                                    }
                                    const { data } = await supabase
                                        .from('profiles')
                                        .select('slug, setup_completed')
                                        .eq('id', user.id)
                                        .maybeSingle();
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
                                className="px-5 py-2.5 bg-[#fbaa19] hover:bg-white text-black font-black text-xs uppercase tracking-widest rounded-xs transition-colors cursor-pointer flex items-center gap-2"
                            >
                                <span>ENTRAR NO PAINEL</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    clearCachedStrategistSession();
                                    await supabase.auth.signOut();
                                    window.location.href = '/?force=login';
                                }}
                                className="px-3.5 py-2.5 border border-white/20 hover:border-red-400 text-white/60 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                            >
                                TROCAR CONTA
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={mode === 'MAGIC_LINK' ? handleMagicLink : handlePasswordLogin}
                            className="flex flex-col sm:flex-row sm:items-end gap-3 lg:gap-4 flex-1 lg:justify-end"
                        >
                            {/* Input solto: Email / @slug */}
                            <div className="flex flex-col gap-1 sm:w-56">
                                <label className="text-[9px] uppercase tracking-[0.2em] text-white/45 flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5 text-[#fbaa19]" />
                                    <span>EMAIL / @SLUG</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="piloto@voltgrid.f1"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="w-full bg-transparent border-b-2 border-white/25 focus:border-[#fbaa19] text-white placeholder-white/30 px-1 py-2 text-xs font-mono tracking-wider outline-none transition-colors"
                                />
                            </div>

                            {/* Input solto: Senha (ou modo Magic Link) */}
                            {mode === 'PASSWORD' ? (
                                <div className="flex flex-col gap-1 sm:w-44 relative">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] uppercase tracking-[0.2em] text-white/45 flex items-center gap-1">
                                            <KeyRound className="w-2.5 h-2.5 text-[#fbaa19]" />
                                            <span>SENHA</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setMode('MAGIC_LINK')}
                                            className="text-[8px] uppercase tracking-wider text-white/40 hover:text-[#fbaa19] cursor-pointer"
                                        >
                                            link mágico?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            className="w-full bg-transparent border-b-2 border-white/25 focus:border-[#fbaa19] text-white placeholder-white/30 px-1 pr-10 py-2 text-xs font-mono tracking-wider outline-none transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-white/45 hover:text-[#fbaa19] uppercase cursor-pointer px-1"
                                        >
                                            {showPassword ? 'OCULTAR' : 'VER'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-end pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setMode('PASSWORD')}
                                        className="text-[10px] uppercase tracking-widest text-white/55 hover:text-[#fbaa19] underline cursor-pointer whitespace-nowrap"
                                    >
                                        « usar senha
                                    </button>
                                </div>
                            )}

                            {/* Ações: Entrar + Primeira Vez */}
                            <div className="flex items-center gap-2.5 pt-1 sm:pt-0 shrink-0">
                                <button
                                    type="submit"
                                    disabled={loadingAction}
                                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#fbaa19] hover:bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(251,170,25,0.25)]"
                                >
                                    <span>
                                        {loadingAction
                                            ? 'ENTRANDO...'
                                            : mode === 'MAGIC_LINK'
                                                ? 'ENVIAR LINK'
                                                : 'ENTRAR'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                <Link
                                    href="/invite"
                                    className="px-4 py-2.5 border border-[#fbaa19]/50 bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black font-black text-[11px] uppercase tracking-widest rounded-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
                                    title="Iniciar recrutamento no paddock"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>PRIMEIRA VEZ</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </footer>
        </main>
    );
}

export default function LandingHome() {
    return (
        <Suspense
            fallback={
                <div className="w-full min-h-screen bg-[#050401] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[#fbaa19]">
                    CARREGANDO PADDOCK...
                </div>
            }
        >
            <LandingHomeContent />
        </Suspense>
    );
}
