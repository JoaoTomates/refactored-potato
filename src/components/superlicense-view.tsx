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
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // UI states
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (searchParams?.get('account_deleted')) {
            setSuccessMsg('SUPERLICENÇA REVOGADA E CONTA EXCLUÍDA COM SUCESSO DO GRID.');
        }
    }, [searchParams]);

    useEffect(() => {
        // If user is already logged in, redirect them to their dashboard
        const checkExistingSession = async () => {
            if (isLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug').eq('id', user.id).single();
                if (data?.slug) {
                    window.location.replace(`/${data.slug}`);
                }
            }
        };
        checkExistingSession();
    }, [user, isLoading]);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/superlicense`
                }
            });
            if (error) throw error;
            setSuccessMsg('LINK DE ACESSO ENVIADO PARA O SEU E-MAIL. VERIFIQUE SUA CAIXA DE ENTRADA.');
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
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // The useEffect will handle the redirect once user is populated
        } catch (err: any) {
            setErrorMsg(err.message || 'Credenciais inválidas.');
        } finally {
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
                            type="email" 
                            required
                            placeholder="SEU E-MAIL CADASTRADO"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-white/20 text-white placeholder-white/35 px-4 py-3.5 font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded-none"
                        />
                        
                        {mode === 'PASSWORD' && (
                            <input 
                                type="password" 
                                required
                                placeholder="SUA SENHA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-white/20 text-white placeholder-white/35 px-4 py-3.5 font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded-none"
                            />
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
