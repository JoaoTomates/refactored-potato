"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { INVITE_LOCALE, Locale } from '@/locales/invite';

type Step = 'LOADING' | 'DIALOG' | 'GROUP_SELECT' | 'TEAM_SELECT' | 'AUTH' | 'PROFILE' | 'PROCESSING';

const LOGOS: Record<string, string> = {
    MCL: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/MCL.png",
    MER: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/MER.png",
    WIL: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/WIL.png",
    AST: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/AST.png",
    ALP: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/ALP.png",
    FER: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/FER.png",
    HAA: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/HAA.png",
    AUD: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/AUD.png",
    CAD: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/CAD.png",
    RBR: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/RBR.png",
    RBA: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/RBA.png"
};

const LogoBadge = ({ code }: { code: string }) => (
    <div className="bg-white rounded-md p-2 h-12 flex items-center justify-center shrink-0 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
        <img src={LOGOS[code]} alt={code} className="max-w-full max-h-full object-contain" />
    </div>
);

function InviteFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [lang, setLang] = useState<Locale>('en');
    const [step, setStep] = useState<Step>('LOADING');
    const [teams, setTeams] = useState<any[]>([]);
    
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [raceNumber, setRaceNumber] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Initialize Language
    useEffect(() => {
        const urlLang = searchParams.get('lang') as Locale;
        if (urlLang === 'pt' || urlLang === 'en') {
            setLang(urlLang);
        } else {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('pt')) setLang('pt');
        }
        
        if (!authLoading) {
            setStep('DIALOG');
        }
    }, [searchParams, authLoading]);

    const dict = INVITE_LOCALE[lang];

    const pickTwoRandom = (arr: any[]) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    };

    const handleSelectGroup = async (groupId: number) => {
        setSelectedGroup(groupId);
        setStep('LOADING');
        
        try {
            const { data, error } = await supabase.from('teams').select('*').eq('is_available', true);
            if (error) throw error;
            
            let codes: string[] = [];
            if (groupId === 1) codes = ['MCL', 'MER', 'WIL'];
            else if (groupId === 2) codes = ['FER', 'HAA', 'AUD', 'CAD'];
            else if (groupId === 3) codes = ['RBR', 'RBA', 'AST', 'ALP'];

            const groupTeams = data.filter(t => codes.includes(t.code));
            setTeams(pickTwoRandom(groupTeams));
            setStep('TEAM_SELECT');
        } catch (err) {
            console.error(err);
            setErrorMsg(dict.error_fallback);
            setStep('GROUP_SELECT');
        }
    };

    const handleSelectTeam = (teamId: string) => {
        setSelectedTeamId(teamId);
        if (user) {
            setStep('PROCESSING');
            signInitialContract(teamId);
        } else {
            setStep('AUTH');
        }
    };

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROFILE');
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROCESSING');
        setErrorMsg("");

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; 
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password 
            });

            if (authError) throw authError;

            if (authData.user && selectedTeamId) {
                const cleanFirstName = firstName.trim().charAt(0).toUpperCase();
                const cleanLastName = lastName.trim().toUpperCase();
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${raceNumber}`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true, 
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
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
                
                await signInitialContract(selectedTeamId, slug);
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || dict.error_fallback);
            setStep('PROFILE');
        }
    };

    const signInitialContract = async (teamId: string, slug?: string) => {
        try {
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamId });
            if (rpcError) throw rpcError;
            
            // Redirect to dashboard
            if (slug) {
                window.location.href = `/${slug}`;
            } else {
                // Se j era logado, busca o slug atual para redirecionar
                const { data } = await supabase.from('profiles').select('slug').eq('id', user!.id).single();
                window.location.href = `/${data?.slug || 'superlicense'}`;
            }
        } catch (err: any) {
            console.error('RPC Error:', err);
            setErrorMsg(dict.error_fallback);
            setStep('TEAM_SELECT');
        }
    };

    return (
        <main className="w-full min-h-screen relative bg-black overflow-hidden select-none flex flex-col font-rajdhani pt-12 md:pt-20">
            {/* Pixel Art Background V2 (VoltGrid Mature) */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[10s] ease-out scale-100 opacity-60 md:opacity-80"
                style={{ 
                    backgroundImage: 'url("/pixel_invite_bg_v2.jpg")',
                    imageRendering: 'pixelated'
                }}
            ></div>

            {/* CRT Overlay Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90"></div>
            
            <div className="relative z-10 w-full max-w-xl mx-auto px-4 flex flex-col justify-end h-full mb-12 flex-1">
                
                {step === 'LOADING' && (
                    <div className="w-full flex items-center justify-center p-12">
                        <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                    </div>
                )}

                {step === 'PROCESSING' && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin mb-4"></div>
                        <p className="text-[#fbaa19] font-black uppercase tracking-widest animate-pulse">{dict.processing}</p>
                    </div>
                )}

                {step === 'DIALOG' && (
                    <div 
                        className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative cursor-pointer hover:bg-black transition-colors"
                        onClick={() => setStep('GROUP_SELECT')}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4">INCOMING TRANSMISSION...</p>
                        <p className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                            "{dict.dialog[0]}"
                        </p>
                        <div className="mt-6 flex justify-end">
                            <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
                                [ CLICK TO CONTINUE ]
                            </span>
                        </div>
                    </div>
                )}

                {step === 'GROUP_SELECT' && (
                    <div className="w-full animate-fade-in flex flex-col gap-4">
                        <div className="bg-black/80 border border-white/10 p-4 mb-2 text-center">
                            <h2 className="text-[#fbaa19] font-black uppercase tracking-widest text-lg">{dict.career_prompt}</h2>
                        </div>
                        {dict.groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => handleSelectGroup(g.id)}
                                className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(251,170,25,0.15)] transition-all flex flex-col items-start relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbaa19]/10 rounded-bl-full group-hover:bg-[#fbaa19]/20 transition-colors"></div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19]">{g.title}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">{g.desc}</p>
                                <p className="text-sm text-gray-300 italic">{g.hint}</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 'TEAM_SELECT' && (
                    <div className="w-full animate-fade-in flex flex-col gap-4">
                        <div className="bg-black/80 border border-[#fbaa19] p-4 mb-2 text-center shadow-[0_0_20px_rgba(251,170,25,0.1)]">
                            <h2 className="text-[#fbaa19] font-black uppercase tracking-widest text-lg">{dict.team_prompt}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team.id)}
                                    className="group bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 shadow-xl hover:shadow-[0_0_40px_rgba(251,170,25,0.2)] transition-all flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <LogoBadge code={team.code} />
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest text-left mb-1">{team.name}</h3>
                                    <p className="text-xs text-gray-500 font-bold tracking-widest text-left uppercase mb-4">{team.code}</p>
                                    
                                    <div className="mt-auto flex justify-between items-end w-full">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${team.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                            {team.is_available ? `${2 - team.spots_taken} Vagas` : 'Lotado'}
                                        </span>
                                        <span className="text-[10px] text-gray-600 group-hover:text-[#fbaa19] uppercase tracking-widest font-black transition-colors">
                                            SELECT
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(step === 'AUTH' || step === 'PROFILE') && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] animate-fade-in relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 flex text-center">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest w-full">
                                    {errorMsg}
                                </span>
                            </div>
                        )}

                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6">
                                <div className="text-center mb-4">
                                    <p className="text-[#fbaa19] text-sm font-bold uppercase tracking-[0.2em]">{dict.contact_prompt}</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.email_placeholder}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                    <input 
                                        type="password" 
                                        required
                                        placeholder={dict.password_placeholder}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white transition-colors">
                                    {dict.btn_continue}
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                                <div className="text-center mb-4">
                                    <p className="text-[#fbaa19] text-sm font-bold uppercase tracking-[0.2em]">{dict.profile_prompt}</p>
                                </div>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.first_name_placeholder}
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className="w-1/2 bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.last_name_placeholder}
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="w-1/2 bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                </div>
                                <input 
                                    type="number" 
                                    required
                                    min="0" max="99"
                                    placeholder={dict.number_placeholder}
                                    value={raceNumber}
                                    onChange={e => setRaceNumber(e.target.value)}
                                    className="w-full bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                />
                                <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-[0.3em] p-5 border-2 border-white hover:bg-transparent hover:text-white transition-colors">
                                    {dict.btn_sign}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function InvitePageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow />
        </Suspense>
    );
}
