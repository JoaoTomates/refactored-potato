"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import Logo from '@/components/logo';

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
            // Tratamento bÃ¡sico para aceitar celular como "email falso" no Supabase por enquanto,
            // jÃ¡ que "futuramente serÃ¡ necessÃ¡rio confirmar email ou celular".
            let emailToUse = contact.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; // fallback para nÃºmeros
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

                // O trigger do Supabase Ã s vezes leva milissegundos para criar a linha em 'profiles' apÃ³s o signUp.
                // Se der erro de 'row not found', fazemos um upsert.
                if (profileError) {
                    console.error("Profile update error:", profileError);
                    // Tentativa de upsert forÃ§ado
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
                router.push('/academy');
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
        <main className="w-full min-h-screen bg-black flex flex-col items-center">
            
            {mode === 'setup' ? (
                // --- SETUP MODE ---
                <div className="w-full flex flex-col items-center">
                    
                    {/* EXPANDED AVATAR / HELMET HEADER */}
                    <div className="relative w-full h-[340px] md:h-[480px] bg-black overflow-hidden shadow-2xl flex items-end justify-center pt-12 md:pt-16 pb-4">
                        {/* Background Layer (For future AI generated image) */}
                        {/* If no AI image, it uses a subtle pattern or dark gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-black z-0"></div>
                        
                        {/* Foreground Layer (Helmet PNG with transparent background) */}
                        <img 
                            src="/avatar-overlay.png" 
                            alt="Driver Helmet" 
                            className="relative z-10 w-full h-full object-contain drop-shadow-2xl scale-[1.25] origin-bottom"
                            onError={(e) => {
                                // Fallback se a imagem nÃ£o existir ainda na pasta public
                                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/motorcycle.svg'; 
                                (e.target as HTMLImageElement).className = "relative z-10 w-32 h-32 opacity-20 filter invert object-contain";
                            }}
                        />

                        {/* Logo Top Left */}
                        <div className="absolute top-6 left-6 z-30">
                            <Link href="/">
                                <Logo isOnDarkBackground={true} />
                            </Link>
                        </div>
                    </div>

                    {/* FORM SECTION */}
                    <div className="w-full max-w-md bg-black border-x border-b border-[#1a1a1a] shadow-2xl p-6 md:p-8 -mt-4 relative z-30 rounded-b-xl">
                        
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
                            
                            {/* Driver Name (2 inputs: Left small, Right normal) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Name</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        maxLength={1}
                                        placeholder="A"
                                        required
                                        value={initial}
                                        onChange={(e) => setInitial(e.target.value)}
                                        className="w-16 bg-[#1a1a1a] border border-[#333] text-white p-3 font-bold uppercase text-center focus:outline-none focus:border-[#fbaa19] transition-colors"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="SENNA"
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
                    </div>
                </div>
            ) : (
                // --- LOGIN MODE ---
                <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                            GARAGE <span className="text-[#fbaa19]">ACCESS</span>
                        </h1>
                    </div>
                    
                    <div className="w-full max-w-md bg-black border border-[#1a1a1a] shadow-2xl p-6 md:p-8 rounded-xl">
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                                {errorMsg}
                            </div>
                        )}
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
                    </div>
                </div>
            )}
        </main>
    );
}
