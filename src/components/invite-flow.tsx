"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, ALLIANCE_KEYS, FactionData } from '@/utils/alliance-data';
import { SENIOR_STRATEGISTS, SeniorStrategist } from '@/lib/race-directors';
import { INVITE_V2_DIALOGS } from '@/data/dialogues';

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

const customDialogs = INVITE_V2_DIALOGS;

const DIRECTOR_AVATAR_URL = 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_1.jpg';

const ALLIANCE_CHIEFS_AVATARS: Record<'A' | 'B' | 'C', { avatarUrl: string; chiefName: string; chiefRole: string; accentColor: string }> = {
    A: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_a.jpg',
        chiefName: 'D. CHADWICK',
        chiefRole: 'Engenheiro-Chefe de Calibração Térmica',
        accentColor: '#00d2be'
    },
    B: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_a.jpg',
        chiefName: 'M. BELLINI',
        chiefRole: 'Mestre de Metalurgia & Resistência',
        accentColor: '#e8002d'
    },
    C: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_a.jpg',
        chiefName: 'S. ZIMMERMANN',
        chiefRole: 'Analista de Lubrificação & Refrigeração',
        accentColor: '#38bdf8'
    }
};

interface InviteBoxCardProps {
    avatarUrl: string;
    badgeTitle?: string;
    accentColor?: string;
    onClick?: () => void;
    title?: string;
    footerHint?: string;
    direction?: 'left' | 'right';
    children: React.ReactNode;
}

function InviteBoxCard({
    avatarUrl,
    badgeTitle,
    accentColor = '#fbaa19',
    onClick,
    title,
    footerHint,
    direction = 'left',
    children
}: InviteBoxCardProps) {
    const [currentSrc, setCurrentSrc] = useState(avatarUrl);

    useEffect(() => {
        setCurrentSrc(avatarUrl);
    }, [avatarUrl]);

    const handleImgError = () => {
        if (currentSrc.startsWith('http')) {
            const parts = currentSrc.split('/avatars/');
            if (parts[1]) {
                setCurrentSrc(`/avatar/${parts[1]}`);
            }
        }
    };

    const isRight = direction === 'right';

    return (
        <div 
            onClick={onClick}
            title={title}
            className={`w-full flex items-center gap-3 sm:gap-4 transition-all duration-300 py-1.5 cursor-pointer group hover:scale-[1.008] ${
                isRight ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
            {/* 1. CÍRCULO DO AVATAR TOTALMENTE DESACOPLADO E COM TAMANHO FIXO */}
            <div className="flex flex-col items-center shrink-0 select-none">
                <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 flex items-center justify-center shadow-2xl bg-black shrink-0 transition-transform group-hover:scale-105"
                    style={{ 
                        borderColor: accentColor,
                        boxShadow: `0 0 22px ${accentColor}40, inset 0 0 10px rgba(0,0,0,0.8)` 
                    }}
                >
                    <img 
                        src={currentSrc} 
                        alt="Personagem" 
                        onError={handleImgError}
                        className="w-full h-full object-cover rounded-full filter contrast-105 group-hover:contrast-115 transition-all"
                    />
                </div>
            </div>

            {/* 2. RETÂNGULO DO DIÁLOGO TOTALMENTE DESACOPLADO E ESTÁVEL */}
            <div 
                className="flex-1 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-2xl border flex flex-col justify-between min-h-[92px] sm:min-h-[98px] backdrop-blur-md"
                style={{
                    backgroundColor: 'rgba(7, 7, 9, 0.97)',
                    borderColor: `${accentColor}40`,
                    boxShadow: `0 10px 30px -10px ${accentColor}35, 0 0 1px 1px ${accentColor}20`
                }}
            >
                {badgeTitle && (
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-0.5">
                        <span 
                            className="text-xs sm:text-sm font-black uppercase tracking-wider"
                            style={{ color: accentColor }}
                        >
                            {badgeTitle}
                        </span>
                    </div>
                )}

                {/* Texto da fala como num balão/box de HQ com min-height estável */}
                <div className="text-white text-xs sm:text-sm md:text-base font-bold tracking-wide leading-relaxed py-0.5 text-left min-h-[44px] flex items-center">
                    {children}
                </div>

                {/* Rodapé / Dica de Clique quando houver */}
                {footerHint && (
                    <div className="text-[10px] text-white/40 font-mono tracking-widest text-right uppercase pt-0.5">
                        {footerHint}
                    </div>
                )}
            </div>
        </div>
    );
}

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
                    const lowerSlug = data.slug.toLowerCase();
                    window.location.replace(`/${lowerSlug.startsWith('@') ? lowerSlug : `@${lowerSlug}`}`);
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
            // Golden Rule (exibição): "L.GUSTAVO88" | Slug (URL/Banco): 100% minúsculo ("l.gustavo88")
            const initial = cleanFirstName.charAt(0).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const lastName = cleanLastName.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const slug = `${initial}.${lastName}${generatedNumber}`.toLowerCase();

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
        <main className="w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center">

            {/* Background Viewport Estável e Fixo - 100vw e 100vh bloqueados - Imune a expansões de scroll ou digitação */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden" 
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                {/* Background 1: Momento anterior (Homem caminhando para o Motorhome na fase INTRO) */}
                <img
                    src="/pixel_invite_walk.jpg"
                    alt=""
                    className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
                        phase === 'INTRO' ? 'opacity-65 md:opacity-85' : 'opacity-0'
                    }`}
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Background 2: Interior do Motorhome com telas de telemetria (demais mensagens da imersão) */}
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                        phase !== 'INTRO' ? 'opacity-60 md:opacity-80' : 'opacity-0'
                    }`}
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* FASE INTRO: Puxe uma cadeira e feche a porta */}
            {phase === 'INTRO' && (
                <div className="absolute bottom-[20%] md:bottom-[25%] w-full max-w-3xl px-4 left-1/2 -translate-x-1/2 z-10">
                    <InviteBoxCard
                        avatarUrl={DIRECTOR_AVATAR_URL}
                        accentColor="#fbaa19"
                        onClick={startAutoDialog}
                        footerHint="[ Continuar ] »"
                    >
                        <span className="opacity-50 mr-2 text-[#fbaa19]">&gt;_</span>
                        <TypewriterLine text={customDialogs[0]} startDelay={150} onReadyForNext={() => setIntroReady(true)} />
                    </InviteBoxCard>
                </div>
            )}

            {phase === 'AUTO_DIALOG' && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* PÁGINA 1: Mérito e Telemetria (Boxes 1 e 2) */}
                    {dialogPage === 1 && (
                        <>
                            {pageStep >= 1 && (
                                <InviteBoxCard
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    onClick={() => setPageStep(2)}
                                    title="Clique para avançar para a próxima fala"
                                    footerHint="[ Avançar ] »"
                                >
                                    <span className="opacity-50 mr-2 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[1]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 300);
                                        }}
                                    />
                                </InviteBoxCard>
                            )}

                            {pageStep >= 2 && (
                                <InviteBoxCard
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    onClick={() => changeToPage(2)}
                                    title="Clique para avançar imediatamente para a próxima página"
                                    footerHint="[ Próxima Página ] »"
                                >
                                    <span className="opacity-50 mr-2 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[2]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            // Pausa de 10 segundos antes de mudar automaticamente
                                            start10SecondAutoAdvance(2);
                                        }}
                                    />
                                </InviteBoxCard>
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
                                <InviteBoxCard
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    onClick={() => setPageStep(2)}
                                    title="Clique para avançar para a próxima fala"
                                    footerHint="[ Avançar ] »"
                                >
                                    <span className="opacity-50 mr-2 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[3]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 300);
                                        }}
                                    />
                                </InviteBoxCard>
                            )}

                            {pageStep >= 2 && (
                                <InviteBoxCard
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    onClick={() => changeToPage(3)}
                                    title="Clique para avançar imediatamente para as propostas"
                                    footerHint="[ Ver Alianças ] »"
                                >
                                    <span className="opacity-50 mr-2 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine
                                        text={customDialogs[4]}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            // Pausa de 10 segundos antes de mudar automaticamente para as alianças
                                            start10SecondAutoAdvance(3);
                                        }}
                                    />
                                </InviteBoxCard>
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
                                const chief = ALLIANCE_CHIEFS_AVATARS[groupId];

                                return (
                                    <InviteBoxCard
                                        key={g.id}
                                        avatarUrl={chief.avatarUrl}
                                        badgeTitle={`[${g.badge}] ${g.title}`}
                                        accentColor={chief.accentColor}
                                        onClick={() => handleSelectAlliance(groupId)}
                                        title={`Escolher ${g.badge}`}
                                        footerHint={`[ ESCOLHER ${g.badge} ] »`}
                                    >
                                        <div className="text-white/90 text-xs md:text-sm font-normal leading-relaxed min-h-[80px]">
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
                                    </InviteBoxCard>
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
                    {/* Box do Diretor/Chief da Aliança Escolhida com Avatar */}
                    <InviteBoxCard
                        avatarUrl={ALLIANCE_CHIEFS_AVATARS[selectedGroup].avatarUrl}
                        accentColor={ALLIANCE_CHIEFS_AVATARS[selectedGroup].accentColor}
                    >
                        <div className="italic">
                            <TypewriterLine 
                                text={ENGINE_FACTIONS[selectedGroup].directorResponse} 
                                startDelay={200} 
                                onReadyForNext={() => setTypingComplete(true)} 
                            />
                        </div>
                    </InviteBoxCard>

                    <div className="w-full bg-black/85 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-2xl shadow-2xl animate-fade-in flex flex-col gap-6">
                        {/* Formulário de Emissão da Superlicença */}
                        <form 
                            onSubmit={handleEnlistSubmit} 
                            className={`flex flex-col gap-6 w-full transition-all duration-1000 ${
                                typingComplete 
                                    ? 'opacity-100 translate-y-0' 
                                    : 'opacity-0 translate-y-2 pointer-events-none'
                            }`}
                        >
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
                                                placeholder="NOME E SOBRENOME"
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
                                                placeholder="EMAIL"
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
