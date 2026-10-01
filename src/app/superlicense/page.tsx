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
    const [raceNumber, setRaceNumber] = useState("");
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
                    .select('slug, org_color')
                    .eq('id', user.id)
                    .single();
                
                const teamParam = searchParams.get('team');
                
                if (data?.slug) {
                    if (teamParam && data.org_color === '#000000') {
                        const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamParam });
                        if (rpcError) {
                            console.error('RPC Error:', rpcError);
                            setErrorMsg("Contract Error: " + (rpcError.message || JSON.stringify(rpcError)));
                            setVerifying(false);
                            return;
                        }
                    }
                    window.location.href = `/${data.slug}`;
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
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${raceNumber}`;

                const teamParam = searchParams.get('team');
                
                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: !teamParam, // If joining a team, RPC sets this to true
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: '#000000',
                        setup_completed: !teamParam,
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

                if (teamParam) {
                    // Sign initial contract if they came from the guest dashboard
                    const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamParam });
                    if (rpcError) {
                        console.error('RPC Error:', rpcError);
                        setErrorMsg("Contract Error: " + (rpcError.message || JSON.stringify(rpcError)));
                        setLoadingAction(false);
                        return; // DO NOT redirect, let the user see the error!
                    }
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
            <div className="w-full flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            
            {/* Form Container (VoltGrid retro-tech style) */}
            <div className="w-full max-w-lg bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-10 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-fade-in">
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#fbaa19]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#fbaa19]"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#fbaa19]"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#fbaa19]"></div>

                {mode === 'setup' ? (
                    <>
                        <h2 className="text-[#fbaa19] text-2xl font-black uppercase tracking-widest mb-2">Driver Profile</h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Establish your paddock identity</p>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
                            
                            {/* Row 1: Driver Name & Race Number */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-[2] flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Name</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="FIRST NAME"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="flex-1 bg-[#111] border border-white/10 text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="LAST NAME"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="flex-1 bg-[#111] border border-white/10 text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#fbaa19]">Race Number</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="99"
                                        placeholder="EX: 27"
                                        required
                                        value={raceNumber}
                                        onChange={(e) => setRaceNumber(e.target.value)}
                                        className="w-full bg-[#111] border border-[#fbaa19]/30 text-[#fbaa19] p-3 font-black text-center focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Organization Ref */}
                            <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-6">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Organization Ref</label>
                                    <span className="text-[9px] text-[#fbaa19] font-bold uppercase tracking-widest">Optional</span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="@username (Invite Link)"
                                    value={orgRef}
                                    onChange={(e) => setOrgRef(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 text-white p-3 font-bold focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                />
                            </div>

                            {/* Row 3: Contact & Security */}
                            <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#fbaa19]">Contact & Security</label>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="EMAIL OR CELLPHONE"
                                        required
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        className="flex-1 bg-[#111] border border-white/10 text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="SECRET PASSWORD"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex-1 bg-[#111] border border-white/10 text-white p-3 font-bold uppercase focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
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
                                    className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#fbaa19] transition-colors text-center"
                                >
                                    Already have a license? Login
                                </button>
                            </div>

                        </form>
                    </>
                ) : (
                    // --- LOGIN MODE ---
                    <>
                        <h2 className="text-[#fbaa19] text-2xl font-black uppercase tracking-widest mb-2">Paddock Access</h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Enter your credentials</p>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 flex flex-col gap-3 text-center animate-fade-in">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    {errorMsg}
                                </span>
                                {showRegistrationHint && (
                                    <button 
                                        type="button"
                                        onClick={() => { setErrorMsg(""); setShowRegistrationHint(false); setMode("setup"); }}
                                        className="mt-2 bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30 hover:bg-[#fbaa19]/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg"
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
                                    className="w-full bg-[#111] border border-white/10 text-white p-3 font-bold focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 text-white p-3 font-bold focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loadingAction}
                                className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 mt-6 hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {loadingAction ? 'Authenticating...' : 'Login'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMode('setup')}
                                className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#fbaa19] transition-colors text-center mt-4"
                            >
                                Need a Superlicense? Create One
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SuperlicensePage() {
    return (
        <main className="w-full min-h-screen bg-black relative overflow-hidden flex flex-col font-rajdhani pt-16 md:pt-20">
            {/* CRT Overlay Effects matching /invite */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90"></div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-12">
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                    </div>
                }>
                    <SuperlicenseForm />
                </Suspense>
            </div>
        </main>
    );
}