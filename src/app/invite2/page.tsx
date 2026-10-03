"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
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

const TEAM_COLORS: Record<string, string> = {
    MCL: '#FF8000', MER: '#00D2BE', WIL: '#005AFF', ALP: '#FD4BC7',
    FER: '#DC0000', HAA: '#FFFFFF', CAD: '#C8A2C8',
    RBR: '#0600EF', RBA: '#2B4562', AST: '#229971', AUD: '#F50537'
};

const LogoBadge = ({ code }: { code: string }) => (
    <div className="bg-white rounded-md p-2 h-12 flex items-center justify-center shrink-0 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
        <img src={LOGOS[code]} alt={code} className="max-w-full max-h-full object-contain" />
    </div>
);

function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);
    
    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;
        
        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);
                i++;
                
                // organic typing speed (slower)
                let delay = 50 + Math.random() * 30; // 50-80ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 600;
                else if (char === ',') delay = 300;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 1500); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, startDelay); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay]);
    
    return (
        <span className="opacity-90 leading-relaxed relative">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

function InviteFlow2() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [lang, setLang] = useState<Locale>('en');
    const [step, setStep] = useState<Step>('LOADING');
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typingComplete, setTypingComplete] = useState(false);
        const [waitingForClick, setWaitingForClick] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (step === 'DIALOG' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step, step === 'GROUP_SELECT']);
    
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [raceNumber, setRaceNumber] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const urlLang = searchParams.get('lang') as Locale;
        if (urlLang === 'pt' || urlLang === 'en') {
            setLang(urlLang);
        } else {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('pt')) setLang('pt');
        }
        
        const checkUserStatus = async () => {
            if (authLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).single();
                if (data?.setup_completed && data?.slug) {
                    window.location.replace(`/${data.slug}`);
                    return;
                }
            }
            setStep('DIALOG');
        };
        
        checkUserStatus();
    }, [searchParams, authLoading, user]);

    const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem",
        "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar sua ficha."
    ],
    proposals_intro: "Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista.",
    career_prompt: "CHOOSE YOUR PATH",
    groups: [
        { 
            id: 1, 
            title: "ALIANÇA DA ESTRELA", 
            teams: ['MER', 'MCL', 'ALP', 'WIL'], 
            hint: "A maior frota do grid. Domínio de engenharia e confiabilidade estabelecida." 
        },
        { 
            id: 2, 
            title: "O IMPÉRIO DE MARANELLO", 
            teams: ['FER', 'HAA', 'CAD'], 
            hint: "A fúria e o prestígio italiano unidos à nova força americana no grid." 
        },
        { 
            id: 3, 
            title: "VANGUARDA TECNOLÓGICA", 
            teams: ['RBR', 'RBA', 'AST', 'AUD'], 
            hint: "Motores inéditos, alto risco e a ousadia dos novos projetos de fábrica." 
        }
    ],
    team_prompt: "SELECT YOUR GARAGE",
    contact_prompt: "ENTER COMM LINK ID",
    profile_prompt: "REGISTER PILOT ID",
    email_placeholder: "EMAIL PROTOCOL",
    password_placeholder: "ENCRYPTION KEY",
    first_name_placeholder: "FIRST NAME",
    last_name_placeholder: "LAST NAME",
    number_placeholder: "RACE NUMBER",
    btn_continue: "SECURE CONNECTION",
    btn_sign: "SIGN CONTRACT",
    processing: "PROCESSING UPLOAD...",
    error_fallback: "TRANSMISSION ERROR"
};

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
            if (groupId === 1) codes = ['MCL', 'MER', 'WIL', 'ALP'];
            else if (groupId === 2) codes = ['FER', 'HAA', 'CAD'];
            else if (groupId === 3) codes = ['RBR', 'RBA', 'AST', 'AUD'];

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
            
            if (slug) {
                window.location.href = `/${slug}`;
            } else {
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
        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-rajdhani pt-12 md:pt-20">
            {/* Pixel Art Background V2 (VoltGrid Mature) */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center opacity-60 md:opacity-80"
                style={{ 
                    backgroundImage: 'url("/pixel_invite_bg_v2.jpg")',
                    imageRendering: 'pixelated'
                }}
            ></div>

            {/* CRT Overlay Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="fixed inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90"></div>
            
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
                    <div className="w-full flex flex-col gap-6 relative">
                        {dict.dialog.slice(0, dialogIndex + 1).map((text, i) => {
                            const isLastInSequence = i === dict.dialog.length - 1;
                            const isCurrent = i === dialogIndex;
                            return (
                                <div key={i} className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        {isCurrent ? "INCOMING TRANSMISSION..." : "TRANSMISSION SECURED."}
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        {isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                startDelay={i === 0 ? 1500 : 500} 
                                                onReadyForNext={() => {
                                                    if (i === 0 || i === 3) {
                                                        setWaitingForClick(true);
                                                    } else if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 2500); 
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setShowGroups(true) : undefined}
                                            />
                                        ) : (
                                            <span className="opacity-70">{text}</span>
                                        )}
                                    </div>
                                    
                                    {/* Inline Click to Continue for the first and fourth box */}
                                    {(i === 0 || i === 3) && waitingForClick && (
                                        <div className="mt-2 flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    setWaitingForClick(false);
                                                    if (i === 0) setDialogIndex(prev => prev + 1);
                                                    if (i === 3) setStep('GROUP_SELECT');
                                                }}
                                                className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                            >
                                                [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}

                {step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ SECURE TRANSMISSION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        <TypewriterLine text={dict.proposals_intro} startDelay={300} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
                                    {dict.groups.map((g: any, idx: number) => {
                                        const letters = ['A', 'B', 'C'];
                                        return (
                                        <div
                                            key={g.id}
                                            className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left relative overflow-hidden animate-slide-up"
                                            style={{ animationDelay: `${idx * 300 + 1500}ms`, animationFillMode: 'both' }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-70"></div>
                                            
                                            <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                [ OPTION ${letters[idx]} ]
                                            </p>
                                            
                                            <div className="flex flex-col gap-2 relative z-10 w-full h-full">
                                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 transition-colors min-h-[64px]">
                                                    {g.title}
                                                </h3>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {g.teams.map((tCode: string) => (
                                                        <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-black/50 border border-white/20" style={{ color: TEAM_COLORS[tCode] }}>
                                                            {tCode}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-6">
                                                    {g.hint}
                                                </p>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                                
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-4" style={{ animationDelay: '2800ms', animationFillMode: 'both' }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ AWAITING DECISION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center mb-6">
                                        <TypewriterLine text="Onde você vai assinar?" startDelay={3000} />
                                    </div>
                                    
                                    <div className="flex justify-center gap-4">
                                        {dict.groups.map((g: any, idx: number) => {
                                            const letters = ['A', 'B', 'C'];
                                            return (
                                                <button
                                                    key={`btn-${g.id}`}
                                                    onClick={() => handleSelectGroup(g.id)}
                                                    className="w-16 h-16 md:w-20 md:h-20 bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black text-2xl md:text-3xl uppercase hover:bg-[#fbaa19] hover:text-black transition-all shadow-[0_0_20px_rgba(251,170,25,0.2)] hover:shadow-[0_0_30px_rgba(251,170,25,0.6)] flex items-center justify-center animate-pulse"
                                                >
                                                    {letters[idx]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                {step === 'TEAM_SELECT' && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            [ AWAITING INPUT : {dict.team_prompt} ]
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map((team, idx) => (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team.id)}
                                    className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden animate-slide-up"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start mb-4 w-full relative z-10">
                                        <LogoBadge code={team.code} />
                                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: team.color }}></div>
                                    </div>
                                    
                                    <div className="relative z-10 w-full flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19] transition-colors">{team.name}</h3>
                                        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: TEAM_COLORS[team.code] || '#999' }}>{team.code}</p>
                                        
                                        <div className="mt-auto flex justify-between items-end w-full">
                                            <span className={`text-xs font-bold uppercase tracking-widest ${team.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                                {team.is_available ? `${2 - team.spots_taken} VAGAS LIVRES` : 'CONTRATO FECHADO'}
                                            </span>
                                        </div>
                                    </div>

                                    {team.is_available && (
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                [ SELECT ]
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(step === 'AUTH' || step === 'PROFILE') && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            [ CREDENTIALS REQUIRED : {step === 'AUTH' ? 'SECURE CHANNEL' : 'PILOT REGISTRATION'} ]
                        </p>
                        
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 flex items-center">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest w-full">
                                    ERR: {errorMsg}
                                </span>
                            </div>
                        )}

                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="mb-2">
                                    <p className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                                        <TypewriterLine text={dict.contact_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.email_placeholder}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="password" 
                                            required
                                            placeholder={dict.password_placeholder}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="group relative w-full bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black uppercase tracking-[0.3em] p-5 hover:bg-[#fbaa19] hover:text-black transition-colors overflow-hidden mt-2">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_continue} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="mb-2">
                                    <p className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                                        <TypewriterLine text={dict.profile_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative w-1/2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.first_name_placeholder}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative w-1/2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.last_name_placeholder}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                    <input 
                                        type="number" 
                                        required
                                        min="0" max="99"
                                        placeholder={dict.number_placeholder}
                                        value={raceNumber}
                                        onChange={e => setRaceNumber(e.target.value)}
                                        className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                    />
                                </div>
                                <button type="submit" className="group relative w-full bg-[#fbaa19] border-2 border-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:border-white transition-colors overflow-hidden mt-2">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_sign} ]
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function Invite2PageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow2 />
        </Suspense>
    );
}