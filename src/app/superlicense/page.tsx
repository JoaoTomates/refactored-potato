"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';

export default function SuperlicensePage() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);

    // Modes
    const [mode, setMode] = useState<"setup" | "login">("setup");

    // Setup Form State
    const [initial, setInitial] = useState("");
    const [surname, setSurname] = useState("");
    const [nationality, setNationality] = useState("");
    const [ocr, setOcr] = useState("#fbaa19");
    const [contact, setContact] = useState(""); // Email ou celular
    const [password, setPassword] = useState("");

    // Login Form State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // UI State
    const [errorMsg, setErrorMsg] = useState("");
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        async function routeUser() {
            if (authLoading) return;
            
            if (user) {
                // If user is already logged in, check their slug and redirect
                const { data } = await supabase
                    .from('profiles')
                    .select('slug')
                    .eq('id', user.id)
                    .single();
                
                if (data?.slug) {
                    router.replace(`/${data.slug}`);
                } else {
                    router.replace(`/${user.id}`);
                }
            } else {
                setVerifying(false);
            }
        }
        routeUser();
    }, [user, authLoading, router]);

    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoadingAction(true);

        try {
            // Tratamento básico para aceitar celular como "email falso" no Supabase por enquanto,
            // já que "futuramente será necessário confirmar email ou celular".
            let emailToUse = contact.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; // fallback para números
            }

            // 1. Criar conta no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password 
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Montar o slug e atualizar o Profile
                const cleanInitial = initial.charAt(0).toUpperCase();
                const cleanSurname = surname.trim().toUpperCase();
                const slug = `@${cleanInitial.toLowerCase()}${cleanSurname.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanInitial,
                    last_name: cleanSurname,
                    nationality: nationality.toUpperCase(),
                    org_color: ocr,
                    setup_completed: true,
                    slug: slug
                }).eq('id', authData.user.id);

                // O trigger do Supabase às vezes leva milissegundos para criar a linha em 'profiles' após o signUp.
                // Se der erro de 'row not found', fazemos um upsert.
                if (profileError) {
                    console.error("Profile update error:", profileError);
                    // Tentativa de upsert forçado
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanInitial,
                        last_name: cleanSurname,
                        nationality: nationality.toUpperCase(),
                        org_color: ocr,
                        setup_completed: true,
                        slug: slug
                    });
                }

                // 3. Redirecionar para o Dashboard
                router.push(`/${slug}`);
            }

        } catch (err: any) {
            console.error("Setup error:", err);
            setErrorMsg(err.message || "An error occurred during setup.");
            setLoadingAction(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoadingAction(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (error) throw error;
            window.location.reload();
        } catch (err: any) {
            setErrorMsg(err.message || "Login failed.");
            setLoadingAction(false);
        }
    };

    if (verifying || authLoading) {
        return (
            <div className="w-full min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
            
            {/* Header Text */}
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                    DRIVER <span className="text-[#fbaa19]">SETUP</span>
                </h1>
                <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mt-2">
                    {mode === 'setup' ? 'Acquire your Super License' : 'Access your Garage'}
                </p>
            </div>

            <div className="w-full max-w-md bg-black border border-[#1a1a1a] shadow-2xl p-6 md:p-8">
                
                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                        {errorMsg}
                    </div>
                )}

                {mode === 'setup' ? (
                    <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
                        
                        {/* Avatar Image (Capacete) - Retangular, bg-black */}
                        <div className="w-full flex justify-center mb-2">
                            <div className="w-32 h-32 bg-black border-2 border-[#1a1a1a] flex items-center justify-center overflow-hidden shadow-inner group relative">
                                <div className="absolute inset-0 bg-[#fbaa19]/5 group-hover:bg-[#fbaa19]/10 transition-colors"></div>
                                {/* SVG Capacete Placeholder */}
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-gray-700 group-hover:text-[#fbaa19] transition-colors relative z-10">
                                    <path d="M12 2C6.48 2 2 6.48 2 12v7h20v-7c0-5.52-4.48-10-10-10zm0 2c4.41 0 8 3.59 8 8v1h-3v-2c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H4v-1c0-4.41 3.59-8 8-8z"/>
                                </svg>
                                <div className="absolute bottom-2 w-full text-center z-10">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Avatar</span>
                                </div>
                            </div>
                        </div>

                        {/* Driver Name (2 inputs: Left small, Right normal) */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Name</label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    maxLength={1}
                                    placeholder="J"
                                    required
                                    value={initial}
                                    onChange={(e) => setInitial(e.target.value)}
                                    className="w-16 bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase text-center focus:outline-none focus:border-[#fbaa19] transition-colors"
                                />
                                <input 
                                    type="text" 
                                    placeholder="SURNAME"
                                    required
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    className="flex-1 bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Nationality */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nationality</label>
                            <input 
                                type="text" 
                                placeholder="BRAZILIAN"
                                required
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                            />
                        </div>

                        {/* OCR (Organization Color Reference) */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center justify-between">
                                <span>Organization Color (OCR)</span>
                                <span className="text-[#fbaa19]">{ocr.toUpperCase()}</span>
                            </label>
                            <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] p-2 focus-within:border-[#fbaa19] transition-colors">
                                <input 
                                    type="color" 
                                    value={ocr}
                                    onChange={(e) => setOcr(e.target.value)}
                                    className="w-10 h-10 cursor-pointer bg-transparent border-none outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={ocr.toUpperCase()}
                                    onChange={(e) => setOcr(e.target.value)}
                                    className="flex-1 bg-transparent text-white font-mono text-sm uppercase focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Email or Phone */}
                        <div className="flex flex-col gap-2 mt-2 pt-6 border-t border-[#1a1a1a]">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fbaa19]">Contact & Security</label>
                            <input 
                                type="text" 
                                placeholder="EMAIL OR CELLPHONE"
                                required
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase text-sm focus:outline-none focus:border-[#fbaa19] transition-colors"
                            />
                            {/* Password input so Supabase auth works */}
                            <input 
                                type="password" 
                                placeholder="SECRET PASSWORD"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase text-sm focus:outline-none focus:border-[#fbaa19] transition-colors"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loadingAction}
                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 mt-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAction ? 'SAVING...' : 'SAVE & ENTER'}
                        </button>

                        <button 
                            type="button"
                            onClick={() => setMode('login')}
                            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors text-center mt-2"
                        >
                            ALREADY HAVE A LICENSE? LOGIN
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                            <input 
                                type="email" 
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold text-sm focus:outline-none focus:border-[#fbaa19] transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                            <input 
                                type="password" 
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold text-sm focus:outline-none focus:border-[#fbaa19] transition-colors"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loadingAction}
                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 mt-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAction ? 'AUTHENTICATING...' : 'LOGIN'}
                        </button>

                        <button 
                            type="button"
                            onClick={() => setMode('setup')}
                            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors text-center mt-2"
                        >
                            NEED A SUPER LICENSE? SETUP
                        </button>
                    </form>
                )}

            </div>
        </main>
    );
}
