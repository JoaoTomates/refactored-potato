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

function InviteFlow3() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [lang, setLang] = useState<Locale>('en');
    const [step, setStep] = useState<Step>('LOADING');
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typingComplete, setTypingComplete] = useState(false);
    const [waitingForClick, setWaitingForClick] = useState(false);
    const [showBigScreen, setShowBigScreen] = useState(false);
    const phase1TimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [introVisible, setIntroVisible] = useState(true);
    const [showCards, setShowCards] = useState(false);
    const [revealedCards, setRevealedCards] = useState(0);
    const [showQuestion, setShowQuestion] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (showCards) {
            setTimeout(() => setRevealedCards(1), 800);
            setTimeout(() => setRevealedCards(2), 1600);
            setTimeout(() => setRevealedCards(3), 2400);
            setTimeout(() => setShowQuestion(true), 3800);
        }
    }, [showCards]);
    
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
    proposals_intro: "E o novo regulamento de motores está virando o jogo de ponta-cabeça. E voce precisa escolher seu lado nessa guerra.",
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
        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-end pb-8 md:pb-16">
            
            {/* Pixel Art Background (Fixed Jitter) */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>

            {/* Phase 1: First Box (dialogIndex === 0) */}
            {step === 'DIALOG' && !showBigScreen && (
                <div className="relative z-20 w-full max-w-xl mx-auto px-4 flex flex-col justify-end pb-12 mb-auto mt-auto">
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                            [ INCOMING SECURE TRANSMISSION ]
                        </p>
                        <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                            {dialogIndex === 0 && (
                                <TypewriterLine 
                                    text={dict.dialog[0]} 
                                    startDelay={500} 
                                    onReadyForNext={() => {
                                        setWaitingForClick(true);
                                        // Auto-advance after 4 seconds if no click
                                        if (!phase1TimeoutRef.current) {
                                            phase1TimeoutRef.current = setTimeout(() => {
                                                setShowBigScreen(true);
                                                setDialogIndex(1);
                                            }, 4000);
                                        }
                                    }} 
                                />
                            )}
                        </div>
                        {waitingForClick && (
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={() => {
                                        if (phase1TimeoutRef.current) clearTimeout(phase1TimeoutRef.current);
                                        setShowBigScreen(true);
                                        setDialogIndex(1);
                                    }}
                                    className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                >
                                    [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Phase 2: Widescreen terminal box */}
            {showBigScreen && (
                <div 
                    className="relative z-10 w-[85%] md:w-[75%] max-w-6xl aspect-video bg-[rgba(0,0,0,0.97)] shadow-[0_50px_100px_rgba(0,0,0,1),0_80px_160px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111] animate-zoom-in flex flex-col p-6 md:px-32 md:py-24"
                    onClick={() => {
                        if (step === 'DIALOG') {
                            if (dialogIndex < 3) {
                                setDialogIndex(prev => prev + 1);
                            } else {
                                setStep("GROUP_SELECT");
                            }
                        }
                    }}
                    style={{ cursor: step === 'DIALOG' ? 'pointer' : 'default' }}
                >
                    <div className="w-full flex-grow flex flex-col overflow-y-auto font-mono text-white uppercase">
                        
                        {step === 'DIALOG' && (() => {
                            const startIndex = 1;
                            const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                            
                            return visibleDialogs.map((text, idx) => {
                                const i = startIndex + idx;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <div key={i} className="mb-6">
                                        <div className="text-base md:text-xl font-bold tracking-widest leading-relaxed">
                                            <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                            {isCurrent ? (
                                                <TypewriterLine 
                                                    text={text} 
                                                    startDelay={300} 
                                                    onReadyForNext={() => {
                                                        if (i < 3) {
                                                            const pause = i === 2 ? 4500 : 2500;
                                                            setTimeout(() => {
                                                                setDialogIndex(prev => {
                                                                    if (prev === i) return prev + 1;
                                                                    return prev;
                                                                });
                                                            }, pause); 
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="opacity-90">{text}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        
                        {step === 'DIALOG' && dialogIndex === 3 && (
                            <div className="mt-8 animate-fade-in opacity-50 text-sm text-[#fbaa19]">
                                [ TOQUE NA TELA PARA CONTINUAR ]
                            </div>
                        )}

                        {step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 text-white text-left uppercase">
                                <p className="opacity-80 text-[#fbaa19] mb-4 text-sm md:text-base font-bold tracking-[0.2em]">&gt;_ CONEXÃO ESTABELECIDA. SELECIONE A SUA ALIANÇA:</p>
                                <div className="flex flex-col gap-6 w-full">
                                    {dict.groups.map((g: any, idx: number) => (
                                        <div 
                                            key={g.id} 
                                            className="border-l-[3px] border-white/20 pl-6 py-4 hover:bg-white/5 hover:border-[#fbaa19] cursor-pointer transition-all duration-300 group" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectGroup(idx + 1);
                                            }}
                                        >
                                            <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-[#fbaa19] transition-colors">{g.title}</h3>
                                            <div className="flex gap-3 mt-4">
                                                {g.teams.map((tCode: string) => (
                                                    <span key={tCode} className="px-3 py-1.5 bg-black border border-white/20 text-[10px] md:text-xs font-black shadow-inner" style={{color: TEAM_COLORS[tCode]}}>{tCode}</span>
                                                ))}
                                            </div>
                                            <p className="text-xs md:text-sm mt-4 opacity-70 tracking-widest leading-relaxed">{g.hint}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {step === 'LOADING' && (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-[#fbaa19] animate-pulse font-bold tracking-widest uppercase">&gt;_ PROCESSANDO...</div>
                            </div>
                        )}

                        {step === 'TEAM_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 text-white text-left uppercase">
                                <p className="opacity-80 text-[#fbaa19] mb-4 text-sm md:text-base font-bold tracking-[0.2em]">&gt;_ SELECIONE O SEU CONTRATO:</p>
                                <div className="flex flex-col gap-6 w-full">
                                    {teams.map((t: any) => (
                                        <div 
                                            key={t.id} 
                                            className="border-l-[3px] border-white/20 pl-6 py-4 hover:bg-white/5 hover:border-[#fbaa19] cursor-pointer transition-all duration-300 group" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectTeam(t.id);
                                            }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <LogoBadge code={t.code} />
                                                <div>
                                                    <h3 className="text-xl md:text-3xl font-black" style={{color: TEAM_COLORS[t.code]}}>{t.name}</h3>
                                                    <p className="text-[10px] md:text-xs opacity-70 tracking-[0.2em] mt-2 group-hover:text-white transition-colors">[{t.code}] ASSINAR ACORDO</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rendering AUTH inside Terminal */}
                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6 w-full relative z-10 animate-fade-in text-white uppercase">
                                <div className="mb-4">
                                    <p className="text-[#fbaa19] text-lg md:text-xl font-bold tracking-widest leading-relaxed">
                                        <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                        <TypewriterLine text={dict.contact_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.email_placeholder}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="password" 
                                            required
                                            placeholder={dict.password_placeholder}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="group relative w-full border-2 border-white/30 text-white font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:text-black hover:border-white transition-colors overflow-hidden mt-6">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_continue} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 w-full relative z-10 animate-fade-in text-white uppercase">
                                <div className="mb-4">
                                    <p className="text-[#fbaa19] text-lg md:text-xl font-bold tracking-widest leading-relaxed">
                                        <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                        <TypewriterLine text={dict.profile_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="relative w-1/2">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.first_name_placeholder}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative w-1/2">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.last_name_placeholder}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                    <input 
                                        type="number" 
                                        required
                                        min="0" max="99"
                                        placeholder={dict.number_placeholder}
                                        value={raceNumber}
                                        onChange={e => setRaceNumber(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                    />
                                </div>
                                <button type="submit" className="group relative w-full bg-[#fbaa19] border-2 border-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:border-white transition-colors overflow-hidden mt-6">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_sign} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROCESSING' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
                                <div className="w-16 h-16 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[#fbaa19] font-bold tracking-widest uppercase">&gt;_ INICIALIZANDO SUPERLICENÇA...</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4 w-full" />
                    </div>
                </div>
            )}
        </main>
    );
}
export default function Invite3PageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow3 />
        </Suspense>
    );
}
