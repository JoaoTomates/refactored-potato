"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, ALLIANCE_KEYS, FactionData } from '@/utils/alliance-data';
import { SENIOR_STRATEGISTS, SeniorStrategist } from '@/lib/race-directors';
import { INVITE_V2_DIALOGS } from '@/data/dialogues';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug } from '@/lib/slug';
import { DialogueBox, TypewriterLine, retroSound } from '@/components/dialogue-box';
import { getSystemBoxStyle } from '@/components/system-modal';
import { getDeviceSignalHash } from '@/lib/device-signal';

export { retroSound, TypewriterLine };

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
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                    clearCachedStrategistSession();
                    await supabase.auth.signOut();
                    setPhase('INTRO');
                    return;
                }

                const normalizedSlug = normalizeAtSlug(data.slug);
                if (data.setup_completed && normalizedSlug) {
                    if (typeof window !== 'undefined') localStorage.setItem('vg_user_slug', normalizedSlug);
                    window.location.replace(getDashboardPath(normalizedSlug));
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
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
            const rawFirst = nameParts[0];
            const rawLast = nameParts.slice(1).join(' ');
            const cleanFirstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
            const cleanLastName = rawLast.toUpperCase();

            const deviceSignal = await getDeviceSignalHash();

            const response = await fetch('/api/auth/enlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password.trim() || undefined,
                    allianceId: selectedGroup,
                    deviceSignal,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result?.ok) {
                throw new Error(result?.error || 'ERRO NA TRANSMISSÃO DA SUPERLICENÇA');
            }

            clearCachedStrategistSession();
            if (result.session?.access_token && result.session?.refresh_token) {
                await supabase.auth.setSession({
                    access_token: result.session.access_token,
                    refresh_token: result.session.refresh_token,
                });
            }

            localStorage.setItem('draft_name', `${cleanFirstName} ${cleanLastName}`);
            localStorage.setItem('draft_email', result.email || email.trim());
            if (selectedGroup) {
                localStorage.setItem('draft_alliance', selectedGroup);
            }

            if (result.seniorStrategistId) {
                const matched = SENIOR_STRATEGISTS.find((s) => s.id === result.seniorStrategistId) || SENIOR_STRATEGISTS[0];
                setAssignedStrategist(matched);
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
        <main className="w-full min-h-dvh relative bg-[#050401] overflow-x-clip select-none flex flex-col font-mono items-center">

            {/* Background Viewport Estável e Fixo - imune a scrollbars e crescimento dos textos */}
            <div
                className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden"
                style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
            >
                {/* Background 1: Momento anterior (Homem caminhando para o Motorhome na fase INTRO) */}
                <img
                    src="/pixel_invite_walk.jpg"
                    alt=""
                    className={`w-full h-full object-cover object-center transition-opacity duration-700 ${phase === 'INTRO' ? 'opacity-65 md:opacity-85' : 'opacity-0'
                        }`}
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Background 2: Interior do Motorhome com telas de telemetria (demais mensagens da imersão) */}
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${phase !== 'INTRO' ? 'opacity-60 md:opacity-80' : 'opacity-0'
                        }`}
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* FASE INTRO: Puxe uma cadeira e feche a porta */}
            {phase === 'INTRO' && (
                <div className="absolute bottom-[20%] md:bottom-[25%] w-full max-w-3xl px-4 left-1/2 -translate-x-1/2 z-10">
                    <DialogueBox
                        speaker="DIRETOR"
                        speakerRole="DIRETOR DE OPERAÇÕES"
                        avatarUrl={DIRECTOR_AVATAR_URL}
                        accentColor="#fbaa19"
                        text={customDialogs[0]}
                        startDelay={150}
                        onReadyForNext={() => setIntroReady(true)}
                        onClick={startAutoDialog}
                        footerHint="[ Continuar ] »"
                    />
                </div>
            )}

            {phase === 'AUTO_DIALOG' && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* PÁGINA 1: Reconhecimento, Mérito e Telemetria (Boxes 1, 2 e 3) */}
                    {dialogPage === 1 && (
                        <>
                            {pageStep >= 1 && (
                                <DialogueBox
                                    speaker="DIRETOR"
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    text={customDialogs[1]}
                                    startDelay={150}
                                    onReadyForNext={() => {
                                        setTimeout(() => setPageStep(2), 300);
                                    }}
                                    onClick={() => setPageStep(2)}
                                    title="Clique para avançar para a próxima fala"
                                />
                            )}

                            {pageStep >= 2 && (
                                <DialogueBox
                                    speaker="DIRETOR"
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    text={customDialogs[2]}
                                    startDelay={150}
                                    onReadyForNext={() => {
                                        setTimeout(() => setPageStep(3), 300);
                                    }}
                                    onClick={() => setPageStep(3)}
                                    title="Clique para avançar para a próxima fala"
                                />
                            )}

                            {pageStep >= 3 && (
                                <DialogueBox
                                    speaker="DIRETOR"
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    text={customDialogs[3]}
                                    startDelay={150}
                                    onReadyForNext={() => {
                                        // Pausa de 10 segundos antes de mudar automaticamente
                                        start10SecondAutoAdvance(2);
                                    }}
                                    onClick={() => changeToPage(2)}
                                    title="Clique para avançar imediatamente para a próxima página"
                                />
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

                    {/* PÁGINA 2: O Novo Regulamento e o Chamado (Boxes 4 e 5) */}
                    {dialogPage === 2 && (
                        <>
                            {pageStep >= 1 && (
                                <DialogueBox
                                    speaker="DIRETOR"
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    text={customDialogs[4]}
                                    startDelay={150}
                                    onReadyForNext={() => {
                                        setTimeout(() => setPageStep(2), 300);
                                    }}
                                    onClick={() => setPageStep(2)}
                                    title="Clique para avançar para a próxima fala"
                                />
                            )}

                            {pageStep >= 2 && (
                                <DialogueBox
                                    speaker="DIRETOR"
                                    avatarUrl={DIRECTOR_AVATAR_URL}
                                    accentColor="#fbaa19"
                                    text={customDialogs[5]}
                                    startDelay={150}
                                    onReadyForNext={() => {
                                        // Pausa de 10 segundos antes de mudar automaticamente para as alianças
                                        start10SecondAutoAdvance(3);
                                    }}
                                    onClick={() => changeToPage(3)}
                                    title="Clique para avançar imediatamente para as propostas"
                                />
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
                                const dossierLines = [
                                    g.sub,
                                    `EQUIPES: ${g.teamsString}`,
                                    `SPEC: ${g.engineSpec}`,
                                    g.fantasyPerk ? `PERK: ${g.fantasyPerk}` : null,
                                ].filter(Boolean).join('\n');

                                return (
                                    <DialogueBox
                                        key={g.id}
                                        hideAvatar
                                        inlinePortrait={{
                                            avatarUrl: chief.avatarUrl,
                                            name: chief.chiefName,
                                        }}
                                        badgeTitle={`[${g.badge}] ${g.title}`}
                                        categoryTag={chief.chiefRole}
                                        accentColor={chief.accentColor}
                                        prefix={null}
                                        minHeightClass="min-h-[80px]"
                                        text={dossierLines}
                                        startDelay={150}
                                        onReadyForNext={() => {
                                            if (stepNeeded < 3) {
                                                setTimeout(() => setPageStep(stepNeeded + 1), 400);
                                            }
                                        }}
                                        onClick={() => handleSelectAlliance(groupId)}
                                        title={`Escolher ${g.badge}`}
                                        footerHint={`[ ESCOLHER ${g.badge} ] »`}
                                    />
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
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 font-mono transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* Box do mesmo Diretor do início comentando a escolha da aliança */}
                    <DialogueBox
                        speaker="DIRETOR"
                        avatarUrl={DIRECTOR_AVATAR_URL}
                        accentColor="#fbaa19"
                        italic
                        prefix={null}
                        text={ENGINE_FACTIONS[selectedGroup].directorResponse}
                        startDelay={200}
                        onReadyForNext={() => setTypingComplete(true)}
                    />

                    {(typingComplete || phase === 'SUBMITTING_ENLIST') && (
                        <div
                            className="w-full p-6 md:p-8 border border-[#000000] rounded-[3px] animate-fade-in flex flex-col gap-6"
                            style={getSystemBoxStyle('#fbaa19')}
                        >
                            {/* Formulário de Emissão da Superlicença */}
                            <form
                                onSubmit={handleEnlistSubmit}
                                className="flex flex-col gap-6 w-full"
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
                                                    className={`w-full bg-[#030303] border text-white p-4 font-bold uppercase tracking-widest focus:outline-none transition-all rounded-[3px] placeholder-white/30 text-[calc(0.875rem+0.5px)] ${fullName.trim()
                                                            ? (fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p)))
                                                                ? "border-emerald-500/50 focus:border-emerald-500"
                                                                : "border-amber-500/60 focus:border-amber-500"
                                                            : "border-[#000000] focus:border-[#fbaa19]"
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
                                                    className="w-full bg-[#030303] border border-[#000000] text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded-[3px] placeholder-white/30 text-[calc(0.875rem+0.5px)]"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative w-full">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="SENHA DE ACESSO (OPCIONAL — DEIXE EM BRANCO PARA AUTOMÁTICA)"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                spellCheck={false}
                                                className="w-full bg-[#030303] border border-[#000000] text-white p-4 pr-24 font-mono font-bold tracking-wider focus:outline-none focus:border-[#fbaa19] transition-all rounded-[3px] placeholder-white/30 text-[calc(0.75rem+0.5px)] sm:text-[calc(0.875rem+0.5px)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50 hover:text-[#fbaa19] font-mono tracking-widest uppercase transition-colors px-1.5 py-1 cursor-pointer"
                                                title={showPassword ? "Ocultar senha" : "Ver senha em texto"}
                                            >
                                                {showPassword ? '[OCULTAR]' : '[VER]'}
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded-[3px] border border-[#000000] shadow-[0_0_15px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm"
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
                    )}
                </div>
            )}

            {/* FASE EMAIL_SENT: Confirmação de Envio do E-mail e Próximos Passos */}
            {phase === 'EMAIL_SENT' && selectedGroup && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 font-mono transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    <div
                        className="w-full p-6 md:p-8 border border-[#000000] rounded-[3px] animate-fade-in flex flex-col gap-6"
                        style={getSystemBoxStyle('#fbaa19')}
                    >

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
