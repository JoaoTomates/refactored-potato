"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

type AuthMode = 'MAGIC_LINK' | 'PASSWORD' | 'REGISTER';

function SuperlicenseAuth() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading } = useSupabaseAuth();

    const [mode, setMode] = useState<AuthMode>('MAGIC_LINK');
    const [loadingAction, setLoadingAction] = useState(false);
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    
    // UI states
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Name validation helper: minimum 2 characters, only letters, accents, apostrophes, hyphens
    const isValidNamePart = (val: string) => {
        const trimmed = val.trim();
        return trimmed.length >= 2 && /^[\p{L}'-]+$/u.test(trimmed);
    };

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Auto-split if user enters full name with space in the first name field
        if (val.includes(' ') && !lastName) {
            const parts = val.trim().split(/\s+/);
            if (parts.length >= 2) {
                setFirstName(parts[0]);
                setLastName(parts.slice(1).join(' '));
                return;
            }
        }
        setFirstName(val);
    };

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();

        // STRICT VALIDATION: Require two distinct valid names (first name + last name)
        if (!isValidNamePart(cleanFirst)) {
            setErrorMsg('NOME INVÁLIDO: O PRIMEIRO NOME DEVE CONTER NO MÍNIMO 2 LETRAS (SEM NÚMEROS).');
            return;
        }

        if (!isValidNamePart(cleanLast)) {
            setErrorMsg('SOBRENOME OBRIGATÓRIO: A SUPERLICENÇA OFICIAL EXIGE NOME E SOBRENOME (MÍNIMO DE 2 LETRAS NO SOBRENOME).');
            return;
        }

        setLoadingAction(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            if (authData.user) {
                const cleanFirstName = cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase();
                const cleanLastName = cleanLast.toUpperCase();
                const generatedNumber = Math.floor(Math.random() * 99) + 1;
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${generatedNumber}`;

                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true,
                    slug: slug
                });

                if (profileError) throw profileError;

                // After standard register, redirect to invite to pick a team, or just generic dashboard
                window.location.href = '/invite';
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao criar conta.');
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
            <div className="bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] p-8">
                
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 border border-[#fbaa19] flex items-center justify-center rotate-45">
                        <div className="w-8 h-8 bg-[#fbaa19] animate-pulse"></div>
                    </div>
                </div>

                <div className="flex border-b border-white/10 mb-8">
                    <button 
                        onClick={() => setMode('MAGIC_LINK')}
                        className={`flex-1 pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${(mode === 'MAGIC_LINK' || mode === 'PASSWORD') ? 'text-[#fbaa19] border-b-2 border-[#fbaa19]' : 'text-gray-500 hover:text-white'}`}
                    >
                        LOGIN
                    </button>
                    <button 
                        onClick={() => setMode('REGISTER')}
                        className={`flex-1 pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'REGISTER' ? 'text-[#fbaa19] border-b-2 border-[#fbaa19]' : 'text-gray-500 hover:text-white'}`}
                    >
                        CRIAR CONTA
                    </button>
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

                {/* LOGIN MODES */}
                {(mode === 'MAGIC_LINK' || mode === 'PASSWORD') && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <h2 className="text-white text-lg font-black uppercase tracking-widest text-center">Acesso ao Pitwall</h2>
                        <p className="text-gray-400 text-xs text-center leading-relaxed">
                            {mode === 'MAGIC_LINK' 
                                ? "Se você se cadastrou no recrutamento confidencial, use o Link Mágico. Nenhuma senha será exigida." 
                                : "Insira suas credenciais clássicas de acesso."}
                        </p>

                        <form onSubmit={mode === 'MAGIC_LINK' ? handleMagicLink : handlePasswordLogin} className="flex flex-col gap-4">
                            <input 
                                type="email" 
                                required
                                placeholder="SEU E-MAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                            />
                            
                            {mode === 'PASSWORD' && (
                                <input 
                                    type="password" 
                                    required
                                    placeholder="SUA SENHA"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                                />
                            )}

                            <button 
                                type="submit" 
                                disabled={loadingAction}
                                className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 mt-2 hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {loadingAction ? 'PROCESSANDO...' : (mode === 'MAGIC_LINK' ? 'ENVIAR LINK MÁGICO' : 'ACESSAR AGORA')}
                            </button>
                        </form>

                        <div className="flex justify-center mt-2">
                            <button 
                                onClick={() => setMode(mode === 'MAGIC_LINK' ? 'PASSWORD' : 'MAGIC_LINK')}
                                className="text-[10px] font-bold text-gray-500 hover:text-[#fbaa19] uppercase tracking-widest transition-colors"
                            >
                                {mode === 'MAGIC_LINK' ? '» PREFIRO USAR MINHA SENHA' : '» ESQUECI MINHA SENHA / ACESSO MÁGICO'}
                            </button>
                        </div>
                    </div>
                )}

                {/* REGISTER MODE */}
                {mode === 'REGISTER' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <h2 className="text-white text-lg font-black uppercase tracking-widest text-center">Emitir Superlicença</h2>
                        <p className="text-gray-400 text-xs text-center leading-relaxed">
                            Crie sua conta pelo método convencional. Você será direcionado para o draft de equipes logo em seguida.
                        </p>

                        <form onSubmit={handleRegister} className="flex flex-col gap-4">
                            {/* Nome e Sobrenome Obrigatórios (Exige 2 nomes) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
                                        <span>Primeiro Nome *</span>
                                        {firstName.trim() && (
                                            <span className={isValidNamePart(firstName) ? "text-emerald-400 text-[9px]" : "text-amber-400 text-[9px]"}>
                                                {isValidNamePart(firstName) ? "✓ Válido" : "Min. 2 letras"}
                                            </span>
                                        )}
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="EX: AYRTON"
                                        value={firstName}
                                        onChange={handleFirstNameChange}
                                        className={`w-full bg-black/50 border text-white p-3.5 font-bold uppercase tracking-widest focus:outline-none transition-all text-xs rounded-sm ${
                                            firstName.trim() 
                                                ? isValidNamePart(firstName) ? "border-emerald-500/50 focus:border-emerald-500" : "border-amber-500/60 focus:border-amber-500"
                                                : "border-white/20 focus:border-[#fbaa19]"
                                        }`}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
                                        <span>Sobrenome *</span>
                                        {lastName.trim() && (
                                            <span className={isValidNamePart(lastName) ? "text-emerald-400 text-[9px]" : "text-amber-400 text-[9px]"}>
                                                {isValidNamePart(lastName) ? "✓ Válido" : "Min. 2 letras"}
                                            </span>
                                        )}
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="EX: SENNA"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className={`w-full bg-black/50 border text-white p-3.5 font-bold uppercase tracking-widest focus:outline-none transition-all text-xs rounded-sm ${
                                            lastName.trim() 
                                                ? isValidNamePart(lastName) ? "border-emerald-500/50 focus:border-emerald-500" : "border-amber-500/60 focus:border-amber-500"
                                                : "border-white/20 focus:border-[#fbaa19]"
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Validação de Requisito de 2 Nomes */}
                            {(!isValidNamePart(firstName) || !isValidNamePart(lastName)) && (
                                <p className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1.5 -mt-2">
                                    <span>⚠</span>
                                    <span>A Superlicença exige obrigatoriamente 2 nomes (Nome e Sobrenome válidos).</span>
                                </p>
                            )}
                            <input 
                                type="email" 
                                required
                                placeholder="E-MAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                            />
                            <input 
                                type="password" 
                                required
                                placeholder="CRIAR SENHA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all text-xs"
                            />

                            <button 
                                type="submit" 
                                disabled={loadingAction}
                                className="w-full bg-white text-black font-black uppercase tracking-widest p-4 mt-2 hover:bg-[#fbaa19] transition-colors disabled:opacity-50"
                            >
                                {loadingAction ? 'PROCESSANDO...' : 'CRIAR CONTA'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SuperlicensePage() {
    return (
        <main className="w-full min-h-screen bg-[#050401] relative flex flex-col font-mono items-center justify-center pt-16 pb-12 overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fbaa19_0%,_transparent_60%)]"></div>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }}></div>
            </div>

            <Suspense fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <SuperlicenseAuth />
            </Suspense>
        </main>
    );
}
