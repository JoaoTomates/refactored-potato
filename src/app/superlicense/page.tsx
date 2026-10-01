"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

function SuperlicenseForm() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const refParam = searchParams.get('ref');

    const [verifying, setVerifying] = useState(true);

    // Modes
    const modeParam = searchParams.get('mode') as "setup" | "login";
    const [mode, setMode] = useState<"setup" | "login">(modeParam === "login" ? "login" : "setup");

    // Setup Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
        const [orgRef, setOrgRef] = useState(refParam || ""); 
    const [contact, setContact] = useState(""); // Email ou celular
    const [password, setPassword] = useState("");

    // Login Form State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // UI State
    const [errorMsg, setErrorMsg] = useState("");
    const [showRegistrationHint, setShowRegistrationHint] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    // Bloqueia redirecionamento automático se estivermos no meio de um submit
    const isSubmitting = React.useRef(false);

    useEffect(() => {
        async function routeUser() {
            if (authLoading || isSubmitting.current) return;
            
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('slug')
                    .eq('id', user.id)
                    .single();
                
                if (data?.slug) {
                    router.replace(`/${data.slug}`);
                } else if (data) {
                    router.replace(`/${user.id}`);
                } else {
                    // Se não existe na tabela profiles, volta para setup
                    setMode("setup");
                    setVerifying(false);
                }
            } else {
                setVerifying(false);
            }
        }
        routeUser();
    }, [user, authLoading, router]);

    const handleSetupSubmit = async (e: React.FormEvent) => {
        isSubmitting.current = true;
        e.preventDefault();
        setErrorMsg("");
        setLoadingAction(true);

        try {
            let emailToUse = contact.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; 
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password 
            });

            if (authError) throw authError;

            if (authData.user) {
                const cleanFirstName = firstName.trim().charAt(0).toUpperCase();
                const cleanLastName = lastName.trim().toUpperCase();
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true,
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    console.error("Profile update error:", profileError);
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: '#000000',
                        setup_completed: true,
                        slug: slug
                    });
                }

                // Check for guest onboarding data
                const groupId = localStorage.getItem('voltgrid_guest_group');
                if (groupId) {
                    await supabase.auth.updateUser({
                        data: { academy_group: parseInt(groupId) }
                    });
                }

                const teamParam = searchParams.get('team');
                if (teamParam) {
                    // Sign initial contract if they came from the guest dashboard
                    await supabase.rpc('sign_initial_contract', { p_team_id: teamParam });
                    window.location.href = `/${slug}`;
                } else {
                    window.location.href = '/academy';
                }
            }

        } catch (err: any) {
            console.error("Setup error:", err);
            setErrorMsg(err.message || "An error occurred during setup.");
            setLoadingAction(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        isSubmitting.current = true;
        e.preventDefault();
        setErrorMsg("");
        setShowRegistrationHint(false);
        setLoadingAction(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (error) throw error;
            window.location.reload();
        } catch (err: any) {
            let msg = err.message || "Login failed.";
            if (msg.toLowerCase().includes("invalid login credentials")) {
                msg = "Piloto não encontrado ou credenciais inválidas.";
                setShowRegistrationHint(true);
            }
            setErrorMsg(msg);
            setLoadingAction(false);
        }
    };

    if (verifying || authLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 bg-black flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            
            {mode === 'setup' ? (
                <>
                    {/* LEFT SIDE: Helmet */}
                    <div className="w-full lg:w-1/2 h-[300px] lg:h-auto flex items-center justify-center relative overflow-hidden bg-black lg:border-r border-[#333]">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-black z-0"></div>
                        <img 
                            src="/avatar-overlay.png" 
                            alt="Driver Helmet" 
                            className="relative z-10 w-[70%] h-[70%] lg:w-[90%] lg:h-[90%] object-contain drop-shadow-2xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/motorcycle.svg'; 
                                (e.target as HTMLImageElement).className = "relative z-10 w-32 h-32 opacity-20 filter invert object-contain";
                            }}
                        />
                    </div>

                    {/* RIGHT SIDE: Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-black relative z-30">
                        <div className="w-full max-w-lg flex flex-col">
                            
                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
                                
                                {/* Row 1: Driver Name & Country */}
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Name</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="FIRST NAME"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="flex-1 bg-black border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="LAST NAME"
                                                required
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="flex-1 bg-black border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nationality</label>
                                        <input 
                                            type="text" 
                                            placeholder="BRAZILIAN"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full bg-black border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Organization Ref */}
                                <div className="flex flex-col gap-2 mt-2 border-t border-white/5 pt-6">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Organization Ref</label>
                                        <span className="text-[9px] text-[#fbaa19] font-bold uppercase tracking-widest">Opcional</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="@username (Invite Link)"
                                        value={orgRef}
                                        onChange={(e) => setOrgRef(e.target.value)}
                                        className="w-full bg-black border border-[#333] text-white p-3 font-bold focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>

                                {/* Row 3: Contact & Security */}
                                <div className="flex flex-col gap-2 mt-2 border-t border-white/5 pt-6">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#fbaa19]">Contact & Security</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="EMAIL OR CELLPHONE"
                                            required
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            className="flex-1 bg-black border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="SECRET PASSWORD"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex-1 bg-black border border-[#333] text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                <div className="flex flex-col gap-4 mt-6">
                                    <button 
                                        type="submit" 
                                        disabled={loadingAction}
                                        className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 hover:bg-white transition-colors disabled:opacity-50"
                                    >
                                        {loadingAction ? 'Processing...' : 'Save & Enter'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setMode('login')}
                                        className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors text-center"
                                    >
                                        Already have a license? Login
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </>
            ) : (
                // --- LOGIN MODE ---
                <div className="w-full flex items-center justify-center p-6 bg-black relative z-30 min-h-[60vh]">
                    <div className="w-full max-w-md border border-[#333] shadow-2xl p-6 md:p-8 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#fbaa19]"></div>
                        
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Paddock Access</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Enter your credentials</p>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 flex flex-col gap-3 text-center animate-fade-in">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    {errorMsg}
                                </span>
                                {showRegistrationHint && (
                                    <button 
                                        type="button"
                                        onClick={() => { setErrorMsg(""); setShowRegistrationHint(false); setMode("setup"); }}
                                        className="mt-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg"
                                    >
                                        Emitir Nova Super Licença
                                    </button>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white p-3 font-bold focus:outline-none focus:border-[#fbaa19] transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white p-3 font-bold focus:outline-none focus:border-[#fbaa19] transition-colors"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loadingAction}
                                className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 mt-4 hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {loadingAction ? 'Authenticating...' : 'Login'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMode('setup')}
                                className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors text-center mt-4"
                            >
                                Need a Superlicense? Create One
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
        </div>
    );
}

export default function SuperlicensePage() {
    return (
        <main className="w-full min-h-screen bg-black flex flex-col font-rajdhani">
            <Suspense fallback={
                <div className="w-full min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                </div>
            }>
                <SuperlicenseForm />
            </Suspense>
        </main>
    );
}
