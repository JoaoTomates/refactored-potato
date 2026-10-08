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

    const [mode, setMode] = useState<AuthMode>('MAGIC_LINK');
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
        <div className="w-full max-w-md mx-auto p-6 relative z-10 font-mono">
            <div className="bg-black/85 backdrop-blur-md border border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.9)] p-6 sm:p-8 rounded-sm">
                {/* Header das Abas: Login ativo e Criar Conta redirecionando para a jornada do invite */}
                <div className="flex border-b border-white/10 mb-8">
                    <button 
                        type="button"
                        onClick={() => setMode('MAGIC_LINK')}
                        className="flex-1 pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors text-[#fbaa19] border-b-2 border-[#fbaa19]"
                    >
                        LOGIN
                    </button>
                    <Link 
                        href="/invite"
                        className="flex-1 pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors text-center text-gray-400 hover:text-[#fbaa19] border-b-2 border-transparent flex items-center justify-center gap-1 group"
                        title="Ir para a jornada de convite e recrutamento"
                    >
                        <span>CRIAR CONTA</span>
                        <span className="text-[10px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">»</span>
                    </Link>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                        [ERRO] {errorMsg}
                    </div>
                )}
                
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 text-green-500 text-[10px] font-bold uppercase tracking-widest text-center">
                        [SISTEMA] {successMsg}
                    </div>
                )}

                {/* MODAL / SEÇÃO: ACESSO AO PITWALL */}
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-[#fbaa19]/10 border border-[#fbaa19]/30 text-[#fbaa19] text-[9px] font-bold tracking-widest uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fbaa19] animate-pulse"></span>
                            CENTRAL DE OPERAÇÕES
                        </div>
                        <h2 className="text-white text-xl font-black uppercase tracking-widest">Acesso ao Pitwall</h2>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
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
                            className="w-full bg-black/60 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                        />
                        
                        {mode === 'PASSWORD' && (
                            <input 
                                type="password" 
                                required
                                placeholder="SUA SENHA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/60 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                            />
                        )}

                        <button 
                            type="submit" 
                            disabled={loadingAction}
                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 mt-1 hover:bg-white transition-colors disabled:opacity-50 text-xs shadow-lg"
                        >
                            {loadingAction ? 'PROCESSANDO...' : (mode === 'MAGIC_LINK' ? 'ENVIAR LINK MÁGICO »' : 'ACESSAR PITWALL »')}
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-4 mt-1">
                        <button 
                            type="button"
                            onClick={() => setMode(mode === 'MAGIC_LINK' ? 'PASSWORD' : 'MAGIC_LINK')}
                            className="text-[10px] font-bold text-gray-400 hover:text-[#fbaa19] uppercase tracking-widest transition-colors"
                        >
                            {mode === 'MAGIC_LINK' ? '» PREFIRO USAR MINHA SENHA' : '» ESQUECI MINHA SENHA / ACESSO MÁGICO'}
                        </button>

                        {/* Redirecionamento explícito do link 'CRIAR CONTA' para a jornada do flow invite */}
                        <div className="pt-4 border-t border-white/10 w-full text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Ainda não possui credencial de estrategista?</p>
                            <Link 
                                href="/invite"
                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white/5 hover:bg-[#fbaa19] text-gray-200 hover:text-black border border-white/15 hover:border-[#fbaa19] transition-all text-[11px] font-black uppercase tracking-widest rounded-sm group"
                            >
                                <span>CRIAR CONTA NA JORNADA INVITE</span>
                                <span className="group-hover:translate-x-1 transition-transform">»</span>
                            </Link>
                        </div>
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
