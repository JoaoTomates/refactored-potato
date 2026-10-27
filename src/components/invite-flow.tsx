"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, ALLIANCE_KEYS, FactionData } from '@/utils/alliance-data';
import { SENIOR_STRATEGISTS, SeniorStrategist } from '@/lib/race-directors';

// --- PitWall Sound Engine ---
class PitWallSoundEngine {
    ctx: AudioContext | null = null;
    enabled: boolean = true;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playKeyClick(char = 'a') {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const code = char.charCodeAt(0) || 65;
            const freq = 380 + (code % 28) * 14;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.028);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch (_) { }
    }
}

export const retroSound = new PitWallSoundEngine();

export function TypewriterLine({ 
    text, 
    onComplete, 
    onReadyForNext, 
    startDelay = 150 
}: { 
    text: string, 
    onComplete?: () => void, 
    onReadyForNext?: () => void, 
    startDelay?: number 
}) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);

    const finishImmediately = useRef(() => {
        setIsTyping(false);
        setDisplayed(text);
        if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
        if (callbacksRef.current.onComplete) callbacksRef.current.onComplete();
    });

    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;

        finishImmediately.current = () => {
            if (isCancelled) return;
            isCancelled = true;
            clearTimeout(timeoutId);
            setIsTyping(false);
            setDisplayed(text);
            if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
            if (callbacksRef.current.onComplete) callbacksRef.current.onComplete();
        };

        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);

                if (char !== ' ' && char !== '\n') {
                    retroSound.playKeyClick(char);
                }

                i++;

                let delay = (35 + Math.random() * 25);
                if (char === '.' || char === '!' || char === '?') delay = 350;
                else if (char === ',' || char === '\n' || char === ':') delay = 180;

                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 800);
                }
            }
        };

        timeoutId = setTimeout(typeNext, startDelay);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay]);

    return (
        <span 
            onClick={() => {
                if (isTyping) finishImmediately.current();
            }}
            className="opacity-90 leading-relaxed relative whitespace-pre-wrap cursor-pointer"
            title={isTyping ? "Clique para exibir o texto completo imediatamente" : undefined}
        >
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

type Phase = 'LOADING' | 'INTRO' | 'AUTO_DIALOG' | 'ENLIST' | 'EMAIL_SENT' | 'SUBMITTING_ENLIST';

const customDialogs = [
    "Entre e feche a porta.",
    "O mercado não procura apostadores de sorte. Ele quer estrategistas capazes de cravar o Poletime dentro da margem de 5 segundos, prever a linha de chegada, identificar os maiores escaladores do grid e antecipar quem domina os duelos internos.",
    "Diga-me com franqueza: você tem frieza para apostar, em 'SIM ou NÃO', até 50% do seu orçamento sobre se M.VERSTAPPEN fará a volta mais rápida da corrida?",
    "Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid e exigem lealdade absoluta.",
    "Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações."
];

export function InviteFlow() {
    const { user, isLoading: authLoading } = useSupabaseAuth();

    const [phase, setPhase] = useState<Phase>('LOADING');
    const [introReady, setIntroReady] = useState(false);

    // Paginação de diálogos com limpeza de tela:
    // dialogPage: 1 (Boxes 1 e 2), 2 (Boxes 3 e 4), 3 (Ofertas de Alianças: Bloco A, B, C)
    const [dialogPage, setDialogPage] = useState<1 | 2 | 3>(1);
    const [pageStep, setPageStep] = useState<number>(1);
    const [isPageClearing, setIsPageClearing] = useState(false);
    const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState<number | null>(null);
    const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [typingComplete, setTypingComplete] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'C' | null>(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [assignedStrategist, setAssignedStrategist] = useState<SeniorStrategist | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialCheckDone = useRef(false);

    const clearAllTimers = () => {
        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        advanceTimeoutRef.current = null;
        intervalRef.current = null;
        setAutoAdvanceRemaining(null);
    };

    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, []);

    useEffect(() => {
        if (authLoading || initialCheckDone.current) return;
        initialCheckDone.current = true;

        const checkUserStatus = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('slug, setup_completed')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error || !data) {
                    await supabase.auth.signOut();
                    setPhase('INTRO');
                    return;
                }

                if (data.setup_completed && data.slug) {
                    window.location.replace(`/${data.slug}`);
                    return;
                }

                // Usuário autenticado sem setup_completed concluído -> direciona para /headquarters
                window.location.replace('/headquarters');
                return;
            }
            setPhase('INTRO');
        };

        checkUserStatus();
    }, [authLoading, user]);

    // Previne tela preta se deslogar
    useEffect(() => {
        if (!authLoading && !user && phase === 'LOADING') {
            setPhase('INTRO');
        }
    }, [authLoading, user, phase]);

    useEffect(() => {
        if (messagesEndRef.current && phase === 'AUTO_DIALOG') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogPage, pageStep, phase]);

    // Inicia a contagem de 10 segundos antes da transição automática
    const start10SecondAutoAdvance = (targetPage: 1 | 2 | 3) => {
        clearAllTimers();
        setAutoAdvanceRemaining(10);

        let secondsLeft = 10;
        intervalRef.current = setInterval(() => {
            secondsLeft -= 1;
            if (secondsLeft <= 0) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setAutoAdvanceRemaining(null);
            } else {
                setAutoAdvanceRemaining(secondsLeft);
            }
        }, 1000);

        advanceTimeoutRef.current = setTimeout(() => {
            clearAllTimers();
            changeToPage(targetPage);
        }, 10000); // Exatos 10 segundos de pausa
    };

    const changeToPage = (nextPage: 1 | 2 | 3) => {
        clearAllTimers();
        setIsPageClearing(true);
        setTimeout(() => {
            setDialogPage(nextPage);
            setPageStep(1);
            setIsPageClearing(false);
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 350);
    };

    const startAutoDialog = () => {
        clearAllTimers();
        retroSound.init();
        setPhase('AUTO_DIALOG');
        setDialogPage(1);
        setPageStep(1);
        setIsPageClearing(false);
    };

    // Ao clicar em voltar para selecionar uma nova aliança, limpa a tela e recomeça o diálogo
    const handleBackAndRestartDialogue = () => {
        clearAllTimers();
        retroSound.init();
        setSelectedGroup(null);
        setTypingComplete(false);
        setIsPageClearing(true);

        setTimeout(() => {
            setPhase('AUTO_DIALOG');
            setDialogPage(1);
            setPageStep(1);
            setIsPageClearing(false);
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 350);
    };

    // 1. Ao escolher a aliança, recebe a mensagem do Diretor e abre o formulário
    const handleSelectAlliance = (groupId: 'A' | 'B' | 'C') => {
        clearAllTimers();
        retroSound.init();
        setSelectedGroup(groupId);
        setErrorMsg("");
        setTypingComplete(false);
        localStorage.setItem('draft_alliance', groupId);

        setIsPageClearing(true);
        setTimeout(() => {
            setPhase('ENLIST');
            setIsPageClearing(false);
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 350);
    };

    const isValidNamePart = (val: string) => {
        const trimmed = val.trim();
        return trimmed.length >= 2 && /^[\p{L}'-]+$/u.test(trimmed);
    };

    const handleEnlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
        if (nameParts.length < 2) {
            setErrorMsg("A SUPERLICENÇA EXIGE PELO MENOS DOIS NOMES (NOME E SOBRENOME).");
            return;
        }

        if (!nameParts.every(isValidNamePart)) {
            setErrorMsg("NOMES INVÁLIDOS: CADA NOME DEVE CONTER NO MÍNIMO 2 LETRAS (SEM NÚMEROS).");
            return;
        }

        retroSound.init();
        setPhase('SUBMITTING_ENLIST');

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@baeff1.com`;
            }

            const autoPassword = 'Volt' + Math.random().toString(36).slice(-6) + '!';

            const rawFirst = nameParts[0];
            const rawLast = nameParts.slice(1).join(' ');

            const cleanFirstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
            const cleanLastName = rawLast.toUpperCase();
            const generatedNumber = Math.floor(Math.random() * 99) + 1;
            const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${generatedNumber}`;

            localStorage.setItem('draft_name', `${cleanFirstName} ${cleanLastName}`);
            localStorage.setItem('draft_email', emailToUse);
            if (selectedGroup) {
                localStorage.setItem('draft_alliance', selectedGroup);
            }

            // Desloga qualquer sessão prévia limpa antes de registrar
            try {
                await supabase.auth.signOut();
            } catch (_) { }

            // Cadastro oficial via Supabase Auth com redirect para /headquarters
            const redirectUrl = `${window.location.origin}/headquarters`;
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: emailToUse,
                password: autoPassword,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        alliance_id: selectedGroup,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        full_name: `${cleanFirstName} ${cleanLastName}`
                    }
                }
            });

            if (authError) throw authError;

            // Se o usuário foi criado, inicializa o perfil básico com um Estrategista Sênior sorteado
            if (authData.user) {
                // Sorteia aleatoriamente um dos 24 Estrategistas Sêniores para acompanhar o novo usuário
                const randomStrategist = SENIOR_STRATEGISTS[Math.floor(Math.random() * SENIOR_STRATEGISTS.length)];
                setAssignedStrategist(randomStrategist);

                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: emailToUse,
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: false,
                    slug: slug,
                    senior_strategist_id: randomStrategist.id,
                    mls_balance: 100
                });
            }

            // Transição para tela de aviso de e-mail enviado
            setIsPageClearing(true);
            setTimeout(() => {
                setPhase('EMAIL_SENT');
                setIsPageClearing(false);
                if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 350);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO NA TRANSMISSÃO DA SUPERLICENÇA");
            setPhase('ENLIST');
        }
    };

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center">

            {/* Background 1: Momento anterior (Homem caminhando para o Motorhome na fase INTRO) */}
            <img
                src="/pixel_invite_walk.jpg"
                alt=""
                className={`fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none transition-opacity duration-700 ${
                    phase === 'INTRO' ? 'opacity-65 md:opacity-85' : 'opacity-0'
                }`}
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* Background 2: Interior do Motorhome com telas de telemetria (demais mensagens da imersão) */}
            <img
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className={`fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none transition-opacity duration-700 ${
                    phase !== 'INTRO' ? 'opacity-60 md:opacity-80' : 'opacity-0'
                }`}
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* FASE INTRO: Puxe uma cadeira e feche a porta */}
            {phase === 'INTRO' && (
                <div className="absolute bottom-[25%] md:bottom-[30%] w-full max-w-3xl px-4 left-1/2 -translate-x-1/2 z-10">
                    <div 
                        onClick={startAutoDialog}
                        className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest cursor-pointer group"
                    >
                        <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                        <TypewriterLine text={customDialogs[0]} startDelay={150} onReadyForNext={() => setIntroReady(true)} />

                        {/* Botão de avanço imediato sempre disponível */}
                        <div className="mt-5 flex justify-end animate-fade-in">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startAutoDialog();
                                }}
                                className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse p-1"
                            >
                                [ CONTINUAR ] »
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {phase === 'AUTO_DIALOG' && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* PÁGINA 1: Mérito e Telemetria (Boxes 1 e 2) */}
                    {dialogPage === 1 && (
                        <>
                            {pageStep >= 1 && (
                                <div 
                                    onClick={() => setPageStep(2)}
                                    className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest cursor-pointer group hover:border-[#fbaa19]/60 transition-colors"
                                    title="Clique para avançar para a próxima fala"
                                >
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[1]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 300);
                                        }}
                                    />
                                </div>
                            )}

                            {pageStep >= 2 && (
                                <div 
                                    onClick={() => changeToPage(2)}
                                    className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest cursor-pointer group hover:border-[#fbaa19]/60 transition-colors"
                                    title="Clique para avançar imediatamente para a próxima página"
                                >
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[2]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            // Pausa de 10 segundos antes de mudar automaticamente
                                            start10SecondAutoAdvance(2);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Botão de avanço imediato sempre acessível */}
                            <div className="flex items-center justify-between animate-fade-in pt-1">
                                {autoAdvanceRemaining !== null && autoAdvanceRemaining > 0 ? (
                                    <span className="text-[11px] text-white/40 font-mono tracking-widest">
                                        Transição automática em <strong className="text-[#fbaa19]">{autoAdvanceRemaining}s</strong>...
                                    </span>
                                ) : (
                                    <span />
                                )}

                                <button
                                    onClick={() => changeToPage(2)}
                                    className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse p-2 rounded cursor-pointer ml-auto"
                                    title="Avançar imediatamente sem aguardar"
                                >
                                    [ AVANÇAR ] »
                                </button>
                            </div>
                        </>
                    )}

                    {/* PÁGINA 2: O Novo Regulamento e o Chamado (Boxes 3 e 4) */}
                    {dialogPage === 2 && (
                        <>
                            {pageStep >= 1 && (
                                <div 
                                    onClick={() => setPageStep(2)}
                                    className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest cursor-pointer group hover:border-[#fbaa19]/60 transition-colors"
                                    title="Clique para avançar para a próxima fala"
                                >
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[3]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 300);
                                        }}
                                    />
                                </div>
                            )}

                            {pageStep >= 2 && (
                                <div 
                                    onClick={() => changeToPage(3)}
                                    className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest cursor-pointer group hover:border-[#fbaa19]/60 transition-colors"
                                    title="Clique para avançar imediatamente para as propostas"
                                >
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[4]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            // Pausa de 10 segundos antes de mudar automaticamente para as alianças
                                            start10SecondAutoAdvance(3);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Botão de avanço imediato sempre acessível */}
                            <div className="flex items-center justify-between animate-fade-in pt-1">
                                {autoAdvanceRemaining !== null && autoAdvanceRemaining > 0 ? (
                                    <span className="text-[11px] text-white/40 font-mono tracking-widest">
                                        Transição automática em <strong className="text-[#fbaa19]">{autoAdvanceRemaining}s</strong>...
                                    </span>
                                ) : (
                                    <span />
                                )}

                                <button
                                    onClick={() => changeToPage(3)}
                                    className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse p-2 rounded cursor-pointer ml-auto"
                                    title="Ver propostas de alianças imediatamente"
                                >
                                    [ VER ALIANÇAS ] »
                                </button>
                            </div>
                        </>
                    )}

                    {/* PÁGINA 3: Propostas das Alianças (Transcritas de cima para baixo) */}
                    {dialogPage === 3 && (
                        <>
                            {ALLIANCE_KEYS.map((groupId, aIdx) => {
                                const stepNeeded = aIdx + 1;
                                if (pageStep < stepNeeded) return null;

                                const g = ENGINE_FACTIONS[groupId];

                                return (
                                    <div
                                        key={g.id}
                                        className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl hover:border-[#fbaa19] transition-all cursor-pointer animate-fade-in text-white text-sm md:text-base font-bold tracking-widest group"
                                        onClick={() => handleSelectAlliance(groupId)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="opacity-50 text-[#fbaa19]">&gt;_</span>
                                            <span className="text-[#fbaa19]">[{g.badge}]</span>
                                            <span className="text-white font-black">{g.title}</span>
                                        </div>

                                        <div className="mt-2 text-white/80 text-xs md:text-sm font-normal leading-relaxed">
                                            <TypewriterLine
                                                text={`${g.sub}\nEQUIPES: ${g.teamsString}\nSPEC: ${g.engineSpec}\nPERK: ${g.fantasyPerk}`}
                                                startDelay={150}
                                                onReadyForNext={() => {
                                                    if (stepNeeded < 3) {
                                                        setTimeout(() => setPageStep(stepNeeded + 1), 400);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                                            <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors animate-pulse">
                                                [ ESCOLHER {g.badge} ] »
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {errorMsg && (
                        <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded animate-fade-in">
                            [ERRO] {errorMsg}
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-6 w-full" />
                </div>
            )}

            {/* FASE ENLIST: Resposta do Diretor ("Sangue quente...") + Formulário de Cadastro */}
            {(phase === 'ENLIST' || phase === 'SUBMITTING_ENLIST') && selectedGroup && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 font-mono transition-all duration-300 ${
                    isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}>
                    <div className="w-full bg-black/85 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-6">
                        
                        {/* Topo do Briefing: Identificação da Aliança */}
                        <div className="border-b border-white/10 pb-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[#fbaa19] text-xs font-bold tracking-[0.2em] uppercase">
                                    DESPACHO CONFIDENCIAL DO DIRETOR // RECRUTAMENTO DE OFICIAIS
                                </span>
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border border-[#fbaa19]/40 bg-[#fbaa19]/10 text-[#fbaa19]">
                                    [{ENGINE_FACTIONS[selectedGroup].badge}] {ENGINE_FACTIONS[selectedGroup].title}
                                </span>
                            </div>

                            {/* Resposta Narrativa do Diretor (ex: "Sangue quente...") */}
                            <div className="text-white text-base md:text-lg font-bold tracking-widest leading-relaxed border-l-2 border-[#fbaa19] pl-4 py-1 italic">
                                <TypewriterLine 
                                    text={ENGINE_FACTIONS[selectedGroup].directorResponse} 
                                    startDelay={200} 
                                    onReadyForNext={() => setTypingComplete(true)} 
                                />
                            </div>
                        </div>

                        {/* Formulário de Emissão da Superlicença */}
                        <form onSubmit={handleEnlistSubmit} className={`flex flex-col gap-6 w-full transition-opacity duration-700 ${typingComplete ? 'opacity-100' : 'opacity-85'}`}>
                            
                            <div className="border-b border-white/5 pb-2">
                                <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                    &gt; - PROTOCOLO DE REGISTRO // EMISSÃO DA SUPERLICENÇA
                                </span>
                                <p className="text-gray-400 text-xs mt-1">
                                    Insira suas credenciais oficiais. Seus dados serão transmitidos para a central da FIA e o canal de telemetria será criptografado.
                                </p>
                            </div>

                            {errorMsg && (
                                <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded">
                                    [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                                </div>
                            )}

                            {phase === 'SUBMITTING_ENLIST' ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-8">
                                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">
                                        &gt;_ TRANSMITINDO CREDENCIAIS & DISPARANDO LINK DE HOMOLOGAÇÃO...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="flex flex-col w-full">
                                            <input
                                                type="text"
                                                required
                                                placeholder="NOME E SOBRENOME DO PILOTO"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className={`w-full bg-black/50 border text-white p-4 font-bold uppercase tracking-widest focus:outline-none transition-all rounded placeholder-white/30 text-sm ${
                                                    fullName.trim()
                                                        ? (fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p)))
                                                            ? "border-emerald-500/50 focus:border-emerald-500"
                                                            : "border-amber-500/60 focus:border-amber-500"
                                                        : "border-white/20 focus:border-[#fbaa19]"
                                                }`}
                                            />
                                            {fullName.trim() && !(fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p))) && (
                                                <span className="text-[10px] text-amber-400 font-mono mt-1.5 flex items-center gap-1">
                                                    <span>⚠</span> A Superlicença exige pelo menos dois nomes (Nome e Sobrenome válidos).
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <input
                                                type="email"
                                                required
                                                placeholder="CANAL DE TELEMETRIA (E-MAIL)"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded placeholder-white/30 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm"
                                    >
                                        [ TRANSMITIR CREDENCIAIS & EMITIR SUPERLICENÇA ] »
                                    </button>

                                    {/* Botão VOLTAR: Limpa a tela e recomeça o diálogo de cima para baixo */}
                                    <div className="flex justify-between items-center pt-2">
                                        <button
                                            type="button"
                                            onClick={handleBackAndRestartDialogue}
                                            className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                                            title="Zerar tela e recomeçar o diálogo"
                                        >
                                            « [ VOLTAR E REINICIAR DIÁLOGO ]
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* FASE EMAIL_SENT: Confirmação de Envio do E-mail e Próximos Passos */}
            {phase === 'EMAIL_SENT' && selectedGroup && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 font-mono transition-all duration-300 ${
                    isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}>
                    <div className="w-full bg-black/85 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-6">
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <span className="text-[#fbaa19] text-xs font-bold tracking-[0.2em] uppercase">
                                &gt;_ DESPACHO OPERACIONAL // CONFIRMAÇÃO DE TELEMETRIA
                            </span>
                            <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30 px-2.5 py-0.5 rounded bg-emerald-950/30">
                                ● DESPACHADO COM SUCESSO
                            </span>
                        </div>

                        <div className="border-l-2 border-[#fbaa19] pl-4 py-1 flex flex-col gap-2">
                            <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-wider">
                                VERIFIQUE SEU CANAL DE TELEMETRIA
                            </h2>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                <TypewriterLine 
                                    text={`Um link de homologação seguro foi transmitido para ${email}.\nAbra o seu e-mail e clique no link de confirmação para validar sua Superlicença e desbloquear as duas vagas de equipe no pitwall.`}
                                    startDelay={200}
                                />
                            </p>
                        </div>

                        {/* Estrategista Sênior Sorteado para Acompanhar o Novo Estrategista */}
                        {assignedStrategist && (
                            <div className="border border-[#fbaa19]/40 bg-[#fbaa19]/10 p-4 sm:p-5 rounded-lg flex flex-col gap-3 shadow-[0_0_20px_rgba(251,170,25,0.1)]">
                                <div className="flex items-center justify-between text-[10px] text-[#fbaa19] font-bold uppercase tracking-widest border-b border-[#fbaa19]/20 pb-2">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-ping inline-block"></span>
                                        <span>CONSELHEIRO SÊNIOR DESIGNADO AO SEU PITWALL</span>
                                    </span>
                                    <span className="border border-[#fbaa19]/40 px-2 py-0.5 rounded bg-black/60 font-mono text-white">
                                        {assignedStrategist.code}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                                        {assignedStrategist.displayName}
                                        <span className="text-white/40 text-xs font-normal ml-2">({assignedStrategist.originalDriver})</span>
                                    </h3>
                                    <span className="text-[10px] text-[#fbaa19] uppercase tracking-wider font-bold">
                                        ERA: {assignedStrategist.decade} // {assignedStrategist.nationality}
                                    </span>
                                </div>
                                <p className="text-xs text-white/90 leading-relaxed italic font-mono bg-black/40 p-3 rounded border border-white/5">
                                    {assignedStrategist.signatureQuote}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/50 uppercase pt-2 border-t border-white/10">
                                    <span>HISTÓRICO: {assignedStrategist.careerStat}</span>
                                    <span className="text-emerald-400 font-bold">{assignedStrategist.evaluation.accuracyRate}% Assertividade Homologada</span>
                                </div>
                            </div>
                        )}

                        {/* Tabela Bloomberg de Status da Convocação */}
                        <div className="border border-white/10 rounded overflow-hidden text-xs font-mono bg-black/40">
                            <div className="flex justify-between items-center p-3 bg-white/[0.03] border-b border-white/5">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px]">CANAL INFORMADO</span>
                                <span className="text-white font-bold tracking-widest text-[11px]">{email}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 border-b border-white/5">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px]">ALIANÇA ESCOLHIDA</span>
                                <span className="text-[#fbaa19] font-bold text-[11px]">
                                    [{ENGINE_FACTIONS[selectedGroup].badge}] {ENGINE_FACTIONS[selectedGroup].title}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 border-b border-white/5">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px]">BÔNUS INICIAL (MILESIMUS)</span>
                                <span className="text-emerald-400 font-bold tracking-widest text-[11px] font-mono">
                                    +000.100 mls (creditados)
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 border-b border-white/5">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px]">ESTADO DO PROTOCOLO</span>
                                <span className="text-amber-400 font-bold tracking-widest text-[11px] animate-pulse">
                                    AGUARDANDO CLIQUE NO LINK DO E-MAIL
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px]">PRÓXIMA ETAPA</span>
                                <span className="text-emerald-400 font-bold tracking-widest text-[11px]">
                                    CENTRAL DE OPERAÇÕES // ESCOLHA DE EQUIPE
                                </span>
                            </div>
                        </div>

                        {/* Botão de continuação caso o usuário já tenha verificado ou esteja em modo de auto-login */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => {
                                    window.location.href = '/headquarters';
                                }}
                                className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm text-center"
                            >
                                [ JÁ CONFIRMEI O LINK / AVANÇAR PARA A ESCOLHA DE EQUIPE ] »
                            </button>

                            <button
                                type="button"
                                onClick={handleBackAndRestartDialogue}
                                className="text-gray-500 hover:text-gray-300 text-[11px] uppercase tracking-widest transition-colors text-center cursor-pointer"
                            >
                                « Deseja escolher outra aliança? Clique aqui para reiniciar o diálogo
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
