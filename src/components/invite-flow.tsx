"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, ALLIANCE_KEYS, FactionData } from '@/utils/alliance-data';
import { SENIOR_STRATEGISTS, SeniorStrategist } from '@/lib/race-directors';
import { INVITE_V2_DIALOGS } from '@/data/dialogues';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug } from '@/lib/slug';
import {
    DialogueBox,
    DIALOGUE_BOX_GRADIENT,
    TypewriterLine,
    getAvatarBlackShadow,
    getDialogueShadow,
    retroSound,
} from '@/components/dialogue-box';
import { getSystemBoxStyle } from '@/components/system-modal';
import { getDeviceSignalHash } from '@/lib/device-signal';
import {
    CrewRolesConfig,
    DEFAULT_CREW_ROLES_CONFIG,
    fetchCrewRolesConfig,
    resolveCrewCharacterById,
} from '@/lib/crew-config';

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
    const router = useRouter();
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
    const [enlistFormVisible, setEnlistFormVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'C' | null>(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const fullNameInputRef = useRef<HTMLInputElement>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [assignedStrategist, setAssignedStrategist] = useState<SeniorStrategist | null>(null);
    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialCheckDone = useRef(false);

    useEffect(() => {
        fetchCrewRolesConfig().then((cfg) => setCrewConfig(cfg));
    }, []);

    const shouldRestoreAlliances = () => {
        if (typeof window === 'undefined') return false;
        try {
            const params = new URLSearchParams(window.location.search);
            const hasParam = params.get('step') === 'alliances';
            const hasStorage = sessionStorage.getItem('vg_invite_dialog_page') === '3';
            return hasParam || hasStorage;
        } catch {
            return false;
        }
    };

    // Foco automático suave no campo Nome e Sobrenome ao abrir o formulário
    useEffect(() => {
        if (enlistFormVisible || phase === 'ENLIST') {
            const timer = setTimeout(() => {
                fullNameInputRef.current?.focus();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [enlistFormVisible, phase]);

    // Sincroniza estado de retorno para a escolha das alianças
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            if (phase === 'AUTO_DIALOG' && dialogPage === 3) {
                sessionStorage.setItem('vg_invite_dialog_page', '3');
                const url = new URL(window.location.href);
                if (url.searchParams.get('step') !== 'alliances') {
                    url.searchParams.set('step', 'alliances');
                    window.history.replaceState(null, '', url.toString());
                }
            } else if (phase === 'INTRO' || (phase === 'AUTO_DIALOG' && dialogPage === 1)) {
                sessionStorage.removeItem('vg_invite_dialog_page');
                const url = new URL(window.location.href);
                if (url.searchParams.has('step')) {
                    url.searchParams.delete('step');
                    window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
                }
            }
        } catch {}
    }, [phase, dialogPage]);

    const resolvedDirector = resolveCrewCharacterById(crewConfig.slots.inviteDirectorId, crewConfig);
    const directorAvatarUrl = resolvedDirector?.avatarUrl || DIRECTOR_AVATAR_URL;
    const directorSpeaker = resolvedDirector?.code || 'DIRETOR';
    const directorRole = resolvedDirector?.role || 'DIRETOR DE OPERAÇÕES';

    const resolvedAllianceChiefs: Record<'A' | 'B' | 'C', { avatarUrl: string; chiefName: string; chiefRole: string; accentColor: string }> = {
        A: (() => {
            const c = resolveCrewCharacterById(crewConfig.slots.allianceChiefAId, crewConfig);
            return c
                ? { avatarUrl: c.avatarUrl, chiefName: c.code, chiefRole: c.role, accentColor: '#00d2be' }
                : ALLIANCE_CHIEFS_AVATARS.A;
        })(),
        B: (() => {
            const c = resolveCrewCharacterById(crewConfig.slots.allianceChiefBId, crewConfig);
            return c
                ? { avatarUrl: c.avatarUrl, chiefName: c.code, chiefRole: c.role, accentColor: '#e8002d' }
                : ALLIANCE_CHIEFS_AVATARS.B;
        })(),
        C: (() => {
            const c = resolveCrewCharacterById(crewConfig.slots.allianceChiefCId, crewConfig);
            return c
                ? { avatarUrl: c.avatarUrl, chiefName: c.code, chiefRole: c.role, accentColor: '#38bdf8' }
                : ALLIANCE_CHIEFS_AVATARS.C;
        })(),
    };

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
                    if (shouldRestoreAlliances()) {
                        setDialogPage(3);
                        setPhase('AUTO_DIALOG');
                        setPageStep(1);
                        setIsPageClearing(false);
                    } else {
                        setPhase('INTRO');
                    }
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

            if (shouldRestoreAlliances()) {
                setDialogPage(3);
                setPhase('AUTO_DIALOG');
                setPageStep(1);
                setIsPageClearing(false);
            } else {
                setPhase('INTRO');
            }
        };

        checkUserStatus();
    }, [authLoading, user]);

    // Previne tela preta se deslogar
    useEffect(() => {
        if (!authLoading && !user && phase === 'LOADING') {
            if (shouldRestoreAlliances()) {
                setDialogPage(3);
                setPhase('AUTO_DIALOG');
                setPageStep(1);
                setIsPageClearing(false);
            } else {
                setPhase('INTRO');
            }
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
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.removeItem('vg_invite_dialog_page');
                const url = new URL(window.location.href);
                url.searchParams.delete('step');
                window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
            } catch {}
        }

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

    // Navega para a ficha do chefe da aliança preservando o ponto de retorno na escolha de alianças
    const handleOpenChiefProfile = (chiefName: string) => {
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('vg_invite_dialog_page', '3');
                const url = new URL(window.location.href);
                url.searchParams.set('step', 'alliances');
                window.history.replaceState(null, '', url.toString());
            } catch {}
        }
        router.push(`/crew/${encodeURIComponent(chiefName.toLowerCase())}`);
    };

    // 1. Ao escolher a aliança, recebe a mensagem do Diretor e abre o formulário
    const handleSelectAlliance = (groupId: 'A' | 'B' | 'C') => {
        clearAllTimers();
        retroSound.init();
        setSelectedGroup(groupId);
        setErrorMsg("");
        setTypingComplete(false);
        setEnlistFormVisible(false);
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

    const resolvedStrategistChar = assignedStrategist
        ? resolveCrewCharacterById(assignedStrategist.id, crewConfig)
        : undefined;
    const assignedStrategistAvatar =
        resolvedStrategistChar?.avatarUrl ||
        (assignedStrategist as (SeniorStrategist & { avatarUrl?: string }) | null)?.avatarUrl ||
        directorAvatarUrl;

    return (
        <main className="w-full min-h-dvh relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center">

            {/* Background Viewport Estável e Fixo - cobre 100% da viewport sem h-lvh/transform que causam corte embaixo */}
            <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050401]">
                {/* Background 1: Momento anterior (Homem caminhando para o Motorhome na fase INTRO) */}
                <img
                    src="/pixel_invite_walk.jpg"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${phase === 'INTRO' ? 'opacity-65 md:opacity-85' : 'opacity-0'
                        }`}
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Background 2: Interior do Motorhome com telas de telemetria (demais mensagens da imersão) */}
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${phase !== 'INTRO' ? 'opacity-55 md:opacity-75' : 'opacity-0'
                        }`}
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Gradiente sutil de profundidade para contraste dos cards sem revelar bordas */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-[#050401]/80" />
            </div>

            {/* FASE INTRO: Puxe uma cadeira e feche a porta */}
            {phase === 'INTRO' && (
                <div className="absolute bottom-[20%] md:bottom-[25%] w-full max-w-3xl px-4 left-1/2 -translate-x-1/2 z-10">
                    <DialogueBox
                        speaker={directorSpeaker}
                        avatarUrl={directorAvatarUrl}
                        disableAvatarClick
                        accentColor="#fbaa19"
                        text={customDialogs[0]}
                        startDelay={150}
                        onReadyForNext={() => setIntroReady(true)}
                        onClick={startAutoDialog}
                        title="Clique para entrar e fechar a porta"
                    />
                </div>
            )}

            {phase === 'AUTO_DIALOG' && (
                <div className={`relative z-10 w-full ${dialogPage === 3 ? 'max-w-5xl' : 'max-w-3xl'} flex flex-col gap-3.5 my-auto py-5 sm:py-8 px-4 transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* PÁGINA 1: Reconhecimento, Mérito e Telemetria (Boxes 1, 2 e 3) */}
                    {dialogPage === 1 && (
                        <>
                            {pageStep >= 1 && (
                                <DialogueBox
                                    speaker={directorSpeaker}
                                    avatarUrl={directorAvatarUrl}
                                    disableAvatarClick
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
                                    speaker={directorSpeaker}
                                    avatarUrl={directorAvatarUrl}
                                    disableAvatarClick
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
                                    speaker={directorSpeaker}
                                    avatarUrl={directorAvatarUrl}
                                    disableAvatarClick
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
                                    speaker={directorSpeaker}
                                    avatarUrl={directorAvatarUrl}
                                    disableAvatarClick
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
                                    speaker={directorSpeaker}
                                    avatarUrl={directorAvatarUrl}
                                    disableAvatarClick
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

                    {/* PÁGINA 3: Propostas das Alianças em Grid Horizontal Moderno (zero estouro vertical no desktop) */}
                    {dialogPage === 3 && (
                        <div className="flex flex-col gap-4 w-full">
                            <DialogueBox
                                speaker={directorSpeaker}
                                speakerRole={directorRole}
                                disableAvatarClick
                                badgeTitle="CONVOCAÇÃO OFICIAL // ESCOLHA DE ALIANÇA"
                                categoryTag="3 CONSÓRCIOS DISPONÍVEIS"
                                avatarUrl={directorAvatarUrl}
                                accentColor="#fbaa19"
                                compact
                                typewriter={false}
                                text="Analise as três alianças técnicas do campeonato mundial de motores e selecione qual bloco você vai defender nesta temporada."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full items-stretch">
                                {ALLIANCE_KEYS.map((groupId, aIdx) => {
                                    const g = ENGINE_FACTIONS[groupId];
                                    const chief = resolvedAllianceChiefs[groupId];
                                    const cardShadow = getDialogueShadow('left', chief.accentColor);
                                    const portraitShadow = getAvatarBlackShadow('right');

                                    return (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => handleSelectAlliance(groupId)}
                                            title={`Escolher ${g.badge} — ${g.title}`}
                                            style={{
                                                background: DIALOGUE_BOX_GRADIENT,
                                                boxShadow: cardShadow,
                                                animationDelay: `${aIdx * 90}ms`,
                                            }}
                                            className="group text-left w-full border border-[#000000] rounded-[3px] p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 cursor-pointer relative overflow-hidden animate-fade-in"
                                        >
                                            {/* Faixa superior na cor da aliança */}
                                            <div
                                                className="absolute top-0 inset-x-0 h-[2px]"
                                                style={{ backgroundColor: chief.accentColor }}
                                            />

                                            <div className="flex flex-col gap-2.5">
                                                {/* Cabeçalho do Bloco */}
                                                <div className="flex items-start justify-between gap-2.5 border-b border-white/10 pb-2.5">
                                                    <div className="flex flex-col min-w-0">
                                                        <span
                                                            className="text-[10px] font-black uppercase tracking-[0.2em]"
                                                            style={{ color: chief.accentColor }}
                                                        >
                                                            [{g.badge}]
                                                        </span>
                                                        <h3 className="text-sm font-black uppercase tracking-wider text-white leading-snug mt-0.5">
                                                            {g.title}
                                                        </h3>
                                                        <span className="text-[9px] text-white/45 uppercase tracking-wider mt-1 line-clamp-2">
                                                            {chief.chiefRole}
                                                        </span>
                                                    </div>

                                                    {/* Retrato do Chefe da Aliança */}
                                                    <div className="flex flex-col items-center shrink-0">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenChiefProfile(chief.chiefName);
                                                            }}
                                                            title={`${chief.chiefName} — ${chief.chiefRole} [Clique para abrir Ficha de Funcionário]`}
                                                            className="w-12 h-12 rounded-[3px] overflow-hidden border border-[#000000] p-0.5 bg-[#030303] group-hover:scale-105 transition-transform cursor-pointer hover:ring-1 hover:ring-[#fbaa19]"
                                                            style={{ boxShadow: portraitShadow }}
                                                        >
                                                            <img
                                                                src={chief.avatarUrl}
                                                                alt={chief.chiefName}
                                                                className="w-full h-full object-cover rounded-[2px]"
                                                            />
                                                        </div>
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenChiefProfile(chief.chiefName);
                                                            }}
                                                            title={`${chief.chiefName} — ${chief.chiefRole} [Clique para abrir Ficha de Funcionário]`}
                                                            className="text-[9px] font-mono font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-[2px] border border-[#000000] bg-[#030303] cursor-pointer hover:text-white transition-colors"
                                                            style={{ color: chief.accentColor }}
                                                        >
                                                            [{chief.chiefName}]
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Lema da Aliança */}
                                                <p
                                                    className="text-[calc(0.75rem+0.5px)] text-white/85 italic border-l-2 pl-2.5 leading-snug"
                                                    style={{ borderColor: chief.accentColor }}
                                                >
                                                    {g.sub}
                                                </p>

                                                {/* Equipes do Bloco em tags compactas */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {g.teamDetails.map((t) => (
                                                        <span
                                                            key={t.code}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#030303] border border-white/10 text-[10px] font-bold text-white/90"
                                                        >
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: t.color }}
                                                            />
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Especificação de Motor */}
                                                <div className="text-[10px] text-white/55 font-mono leading-snug bg-black/50 border border-white/5 rounded-[3px] px-2.5 py-1.5">
                                                    <span className="text-white/35 uppercase block text-[9px] tracking-widest">UNIDADE DE POTÊNCIA</span>
                                                    <span className="text-white/85 font-bold">{g.engineSpec}</span>
                                                </div>
                                            </div>

                                            {/* Rodapé CTA */}
                                            <div
                                                className="w-full py-2 px-3 rounded-[3px] border border-[#000000] text-[10px] font-black uppercase tracking-[0.18em] flex items-center justify-between transition-all mt-1 group-hover:brightness-125"
                                                style={{
                                                    backgroundColor: `${chief.accentColor}18`,
                                                    color: chief.accentColor,
                                                }}
                                            >
                                                <span>[ ESCOLHER {g.badge} ]</span>
                                                <span className="group-hover:translate-x-0.5 transition-transform">»</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
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
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 my-auto py-5 sm:py-8 px-4 font-mono transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* Box do mesmo Diretor do início comentando a escolha da aliança */}
                    <DialogueBox
                        speaker={directorSpeaker}
                        speakerRole={directorRole}
                        disableAvatarClick
                        badgeTitle={`ALIANÇA SELECIONADA // ${ENGINE_FACTIONS[selectedGroup].title.toUpperCase()}`}
                        categoryTag={`[${ENGINE_FACTIONS[selectedGroup].badge}]`}
                        avatarUrl={directorAvatarUrl}
                        accentColor="#fbaa19"
                        italic
                        compact
                        prefix={null}
                        text={ENGINE_FACTIONS[selectedGroup].directorResponse}
                        startDelay={200}
                        onReadyForNext={() => {
                            setTypingComplete(true);
                            setTimeout(() => setEnlistFormVisible(true), 350);
                        }}
                        onClick={() => {
                            setTypingComplete(true);
                            setEnlistFormVisible(true);
                        }}
                    />

                    {/* Formulário com entrada suave, alinhamento visual ao balão de diálogo e cabeçalho tático */}
                    <div
                        className={`w-full flex flex-col sm:pl-[68px] md:pl-[72px] transition-all duration-500 ease-out ${
                            enlistFormVisible || phase === 'SUBMITTING_ENLIST'
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-3 pointer-events-none'
                        }`}
                    >
                        <div
                            className="w-full p-5 sm:p-6 border border-[#000000] rounded-[3px] flex flex-col gap-5"
                            style={{
                                background: DIALOGUE_BOX_GRADIENT,
                                boxShadow: getDialogueShadow('left', '#fbaa19'),
                            }}
                        >
                            {/* Cabeçalho do Terminal de Alistamento */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#fbaa19]">
                                        PROTOCOLO DE ALISTAMENTO // EMISSÃO DE SUPERLICENÇA
                                    </span>
                                </div>
                                <span
                                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-[2px] border border-[#000000] font-black"
                                    style={{
                                        backgroundColor: `${resolvedAllianceChiefs[selectedGroup].accentColor}20`,
                                        color: resolvedAllianceChiefs[selectedGroup].accentColor,
                                        borderColor: resolvedAllianceChiefs[selectedGroup].accentColor,
                                    }}
                                >
                                    [{ENGINE_FACTIONS[selectedGroup].badge}]
                                </span>
                            </div>

                            {/* Formulário de Emissão da Superlicença */}
                            <form
                                onSubmit={handleEnlistSubmit}
                                className="flex flex-col gap-5 w-full"
                            >
                                {errorMsg && (
                                    <div className="text-red-500 font-bold uppercase tracking-widest text-xs bg-red-900/20 border border-red-500/50 p-3 rounded">
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
                                        <div className="flex flex-col md:flex-row gap-3.5 items-start">
                                            <div className="flex flex-col w-full relative">
                                                <div className="relative w-full flex items-center">
                                                    <input
                                                        ref={fullNameInputRef}
                                                        autoFocus
                                                        type="text"
                                                        required
                                                        placeholder="NOME E SOBRENOME"
                                                        value={fullName}
                                                        onFocus={() => setIsNameFocused(true)}
                                                        onBlur={() => setIsNameFocused(false)}
                                                        onChange={e => setFullName(e.target.value)}
                                                        style={{ caretColor: '#fbaa19' }}
                                                        className={`w-full bg-[#030303] border text-white p-3.5 font-bold uppercase tracking-widest focus:outline-none transition-all rounded-[3px] placeholder-white/30 text-[calc(0.8125rem+0.5px)] sm:text-[calc(0.875rem+0.5px)] caret-[#fbaa19] ${fullName.trim()
                                                                ? (fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p)))
                                                                    ? "border-emerald-500/50 focus:border-emerald-500"
                                                                    : "border-amber-500/60 focus:border-amber-500"
                                                                : "border-[#000000] focus:border-[#fbaa19]"
                                                            }`}
                                                    />
                                                    {/* Cursor piscando tático no campo Nome e Sobrenome caso esteja vazio e sem foco ativo */}
                                                    {!isNameFocused && !fullName && (
                                                        <span
                                                            onClick={() => fullNameInputRef.current?.focus()}
                                                            className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#fbaa19] font-black text-sm pointer-events-none animate-pulse select-none"
                                                        >
                                                            |
                                                        </span>
                                                    )}
                                                </div>
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
                                                    className="w-full bg-[#030303] border border-[#000000] text-white p-3.5 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded-[3px] placeholder-white/30 text-[calc(0.8125rem+0.5px)] sm:text-[calc(0.875rem+0.5px)]"
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
                                                className="w-full bg-[#030303] border border-[#000000] text-white p-3.5 pr-24 font-mono font-bold tracking-wider focus:outline-none focus:border-[#fbaa19] transition-all rounded-[3px] placeholder-white/30 text-[calc(0.75rem+0.5px)] sm:text-[calc(0.8125rem+0.5px)]"
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
                                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-all rounded-[3px] border border-[#000000] shadow-[0_0_15px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm hover:scale-[1.01]"
                                        >
                                            [ TRANSMITIR CREDENCIAIS & EMITIR SUPERLICENÇA ] »
                                        </button>

                                        {/* Botão VOLTAR: Limpa a tela e recomeça o diálogo de cima para baixo */}
                                        <div className="flex justify-between items-center pt-1">
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
                </div>
            )}

            {/* FASE EMAIL_SENT: Confirmação de Envio do E-mail com DialogueBox + Cards Modernos (compacto, zero estouro) */}
            {phase === 'EMAIL_SENT' && selectedGroup && (
                <div className={`relative z-10 w-full max-w-4xl flex flex-col gap-3.5 my-auto py-4 sm:py-6 px-4 font-mono transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                    {/* 1. DialogueBox Oficial do Diretor: Confirmação do Disparo de Telemetria */}
                    <DialogueBox
                        speaker={directorSpeaker}
                        speakerRole={directorRole}
                        disableAvatarClick
                        characterId={crewConfig.slots.inviteDirectorId}
                        badgeTitle="VERIFIQUE SEU CANAL DE TELEMETRIA"
                        categoryTag="HOMOLOGAÇÃO ENVIADA"
                        avatarUrl={directorAvatarUrl}
                        accentColor="#fbaa19"
                        direction="left"
                        compact
                        animateEntrance
                        startDelay={100}
                        speed={18}
                        text={`Link de homologação transmitido para ${email}. Confirme seu e-mail para validar sua Superlicença e desbloquear as garagens da sua aliança no pitwall.`}
                    />

                    {/* 2. Grade Moderna 2 Colunas: Conselheiro Sênior Sorteado + Dossiê Bloomberg da Convocação */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                        {/* Coluna Esquerda: Conselheiro Sênior em DialogueBox com Retrato Oficial */}
                        {assignedStrategist && (
                            <div className="lg:col-span-7 flex">
                                <DialogueBox
                                    speaker={assignedStrategist.code}
                                    characterId={assignedStrategist.id}
                                    badgeTitle={`CONSELHEIRO DESIGNADO // ${assignedStrategist.displayName}`}
                                    categoryTag={`${assignedStrategist.decade} • ${assignedStrategist.nationality}`}
                                    avatarUrl={assignedStrategistAvatar}
                                    accentColor="#fbaa19"
                                    direction="left"
                                    compact
                                    italic
                                    typewriter={false}
                                    animateEntrance
                                    prefix={null}
                                    text={assignedStrategist.signatureQuote}
                                    footerNote={
                                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                                            <span className="text-white/55">{assignedStrategist.careerStat}</span>
                                            <span className="text-emerald-400 font-bold">
                                                • {assignedStrategist.evaluation.accuracyRate}% Assertividade
                                            </span>
                                        </span>
                                    }
                                    className="!py-0 h-full"
                                />
                            </div>
                        )}

                        {/* Coluna Direita: Card Moderno de Status do Protocolo */}
                        <div
                            className={`${assignedStrategist ? 'lg:col-span-5' : 'lg:col-span-12'} p-4 border border-[#000000] rounded-[3px] flex flex-col justify-between gap-2.5 animate-fade-in`}
                            style={getSystemBoxStyle('#10b981')}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    DOSSIÊ DA CONVOCAÇÃO
                                </span>
                                <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest animate-pulse">
                                    PENDENTE
                                </span>
                            </div>

                            <div className="flex flex-col divide-y divide-white/5 text-[11px]">
                                <div className="flex justify-between items-center py-1.5 gap-2">
                                    <span className="text-white/45 uppercase tracking-wider text-[10px] shrink-0">CANAL</span>
                                    <span className="text-white font-bold truncate">{email}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 gap-2">
                                    <span className="text-white/45 uppercase tracking-wider text-[10px] shrink-0">ALIANÇA</span>
                                    <span className="text-[#fbaa19] font-bold truncate text-right">
                                        [{ENGINE_FACTIONS[selectedGroup].badge}] {ENGINE_FACTIONS[selectedGroup].title}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 gap-2">
                                    <span className="text-white/45 uppercase tracking-wider text-[10px] shrink-0">BÔNUS INICIAL</span>
                                    <span className="text-emerald-400 font-bold">+000.100 mls</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 gap-2">
                                    <span className="text-white/45 uppercase tracking-wider text-[10px] shrink-0">PRÓXIMA ETAPA</span>
                                    <span className="text-emerald-400 font-bold uppercase text-[10px]">HEADQUARTERS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Barra de Ação Centralizada (alinhada ao modelo padronizado) */}
                    <div
                        className="w-full p-4 border border-[#000000] rounded-[3px] flex flex-col items-center justify-center gap-2.5 animate-fade-in"
                        style={getSystemBoxStyle('#fbaa19')}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                router.push('/headquarters');
                            }}
                            className="w-full sm:max-w-xl bg-[#fbaa19] text-black font-black uppercase tracking-[0.16em] py-3.5 px-6 hover:bg-white transition-all rounded-[3px] border border-[#000000] shadow-[0_0_15px_rgba(251,170,25,0.35)] cursor-pointer text-xs text-center hover:scale-[1.01]"
                        >
                            [ JÁ CONFIRMEI O LINK / AVANÇAR PARA A ESCOLHA DE EQUIPE ] »
                        </button>

                        <button
                            type="button"
                            onClick={handleBackAndRestartDialogue}
                            className="text-white/45 hover:text-white text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer text-center py-1 hover:underline underline-offset-4"
                            title="Voltar e escolher outro consórcio de motores"
                        >
                            « Deseja escolher outra aliança? Clique aqui para reiniciar o diálogo
                        </button>
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
