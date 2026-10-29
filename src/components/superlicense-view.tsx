"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

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
            supabase.auth.signOut().then(() => {});
            return;
        }

        // Se usuário autenticado com setup COMPLETO, redireciona para o pitwall
        const checkExistingSession = async () => {
            if (isLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).maybeSingle();
                if (data?.slug && data.setup_completed === true) {
                    const target = data.slug.startsWith('@') ? data.slug : `@${data.slug}`;
                    window.location.replace(`/${target}`);
                }
            }
        };
        checkExistingSession();
    }, [user, isLoading, searchParams]);

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
                throw new Error('Não foi possível identificar o e-mail correspondente para este piloto/slug.');
            }
            const { error } = await supabase.auth.signInWithOtp({
                email: resolvedEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/superlicense`
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
                    .select('slug')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                if (profile?.slug) {
                    const target = profile.slug.startsWith('@') ? profile.slug : `@${profile.slug}`;
                    window.location.href = `/${target}`;
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
            <div className="bg-black/95 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.95)] px-6 py-8 sm:px-8 sm:py-9 rounded-sm">
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
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-sm flex flex-col gap-3 animate-fade-in">
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
                                    const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).maybeSingle();
                                    if (data?.slug && data.setup_completed) {
                                        window.location.href = `/${data.slug.startsWith('@') ? data.slug : `@${data.slug}`}`;
                                    } else {
                                        window.location.href = '/headquarters';
                                    }
                                }}
                                className="flex-1 bg-[#fbaa19] text-black font-black text-[10px] uppercase py-2 tracking-widest hover:bg-white transition-colors cursor-pointer text-center"
                            >
                                Entrar no Painel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/superlicense?force=login';
                                }}
                                className="flex-1 bg-red-950/70 border border-red-500/50 text-red-300 font-bold text-[10px] uppercase py-2 tracking-widest hover:bg-red-800 transition-colors cursor-pointer text-center"
                            >
                                Sair / Trocar Conta
                            </button>
                        </div>
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 p-3.5 bg-red-900/30 border border-red-500/50 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
                        [ERRO] {errorMsg}
                    </div>
                )}
                
                {successMsg && (
                    <div className="mb-6 p-3.5 bg-green-900/30 border border-green-500/50 text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">
                        [SISTEMA] {successMsg}
                    </div>
                )}

                {/* CONTEÚDO PRINCIPAL: ACESSO AO PITWALL */}
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-[0.18em]">
                            ACESSO AO PITWALL
                        </h2>
                        <p className="text-white/60 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
                            {mode === 'MAGIC_LINK' 
                                ? "Se você se cadastrou no recrutamento confidencial, use o Link Mágico. Nenhuma senha será exigida." 
                                : "Insira suas credenciais clássicas de acesso à central."}
                        </p>
                    </div>

                    <form onSubmit={mode === 'MAGIC_LINK' ? handleMagicLink : handlePasswordLogin} className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            required
                            placeholder="E-mail, @slug ou piloto (ex: L.GUSTAVO88)"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            className="w-full bg-black border border-white/20 text-white placeholder-white/35 px-4 py-3.5 font-mono text-xs normal-case tracking-wider focus:outline-none focus:border-[#fbaa19] transition-all rounded-none"
                        />
                        
                        {mode === 'PASSWORD' && (
                            <div className="relative w-full">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="Sua senha (ex: Password123!)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="w-full bg-black border border-white/20 text-white placeholder-white/35 px-4 py-3.5 pr-20 font-mono text-xs normal-case tracking-wider focus:outline-none focus:border-[#fbaa19] transition-all rounded-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50 hover:text-[#fbaa19] font-mono tracking-widest uppercase transition-colors px-1 py-1"
                                    title={showPassword ? "Ocultar senha" : "Ver senha em texto"}
                                >
                                    {showPassword ? '[OCULTAR]' : '[VER]'}
                                </button>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loadingAction}
                            className="w-full bg-[#fbaa19] hover:bg-[#e59914] text-black font-black uppercase tracking-widest py-3.5 px-4 mt-2 transition-colors disabled:opacity-50 text-xs sm:text-sm cursor-pointer shadow-md rounded-none"
                        >
                            {loadingAction 
                                ? 'PROCESSANDO...' 
                                : (mode === 'MAGIC_LINK' ? 'ENVIAR LINK MÁGICO »' : 'ACESSAR PITWALL »')}
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
        <main className="w-full min-h-screen bg-[#050401] relative flex flex-col font-mono items-center justify-center py-12 px-4 overflow-x-hidden">
            {/* Background Pitwall Image */}
            <img 
                src="/pixel_setup_bg.png"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none opacity-80"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fbaa19_0%,_transparent_60%)]"></div>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }}></div>
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
