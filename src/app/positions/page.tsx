"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useSubmitPrediction } from '@/hooks/useSubmitPrediction';
import { useTeamworkAuto } from '@/hooks/useTeamworkAuto';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import { F1_MATCHUPS, F1_DRIVERS, getDriverDetails, fetchNextEvent, F1Event } from '@/api/f1-data';
import { nextRaceStart, isRaceWeek } from '@/lib/race';
import PassoZeroBriefing from '@/components/passo-zero-briefing';
import { getSeniorStrategistForRound } from '@/lib/race-directors';
import { getCircuitIntel } from '@/lib/circuits-intel';


// --- Paleta Oficial de Equipes (Conforme NARRATIVE_STYLE_GUIDE.md) ---
const TEAM_COLORS: Record<string, string> = {
    'Mercedes': '#00D2BE',
    'Mercedes-AMG': '#00D2BE',
    'Ferrari': '#DC0000',
    'Scuderia Ferrari': '#DC0000',
    'McLaren': '#FF8000',
    'Red Bull': '#3671C6',
    'Red Bull Racing': '#3671C6',
    'Aston Martin': '#229971',
    'Williams': '#005AFF',
    'Williams Racing': '#005AFF',
    'Alpine': '#FD4BC7',
    'Haas': '#E6002B',
    'Haas F1 Team': '#E6002B',
    'Racing Bulls': '#6692FF',
    'Audi/Sauber': '#F50537',
    'Audi': '#F50537',
    'Cadillac': '#FFC80C',
};

function getTeamColor(teamName: string): string {
    return TEAM_COLORS[teamName] || '#fbaa19';
}

// Formatação rigorosa de nomes no padrão de ouro do sistema: "L.GUSTAVO"
function formatPilotName(firstName?: string | null, lastName?: string | null, driverNumber?: string | null, fallback?: string | null): string {
    if (firstName && lastName) {
        const initial = firstName.trim().charAt(0).toUpperCase();
        const cleanLast = lastName.trim().toUpperCase().replace(/\s+/g, '');
        const num = driverNumber ? driverNumber.replace(/\D/g, '') : '';
        return `${initial}.${cleanLast}${num}`;
    }
    if (firstName && !lastName) {
        const num = driverNumber ? driverNumber.replace(/\D/g, '') : '';
        return `${firstName.trim().toUpperCase()}${num}`;
    }
    if (fallback) {
        const clean = fallback.replace(/^@/, '').trim().toUpperCase();
        return clean;
    }
    return 'PILOTO';
}


const QUESTIONS = [
    { id: 'q1', text: 'Safety car durante o Grande Prêmio?', options: ['SIM', 'NÃO'] },
    { id: 'q2', text: 'Bandeira vermelha acionada na corrida?', options: ['SIM', 'NÃO'] },
    { id: 'q3', text: 'Algum carro da primeira fila sofrerá DNF?', options: ['SIM', 'NÃO'] },
    { id: 'q4', text: 'Ambas as Ferraris terminarão no TOP 5?', options: ['SIM', 'NÃO'] },
    { id: 'q5', text: 'Volta mais rápida conquistada por M. VERSTAPPEN?', options: ['SIM', 'NÃO'] },
];

const TABS = [
    { id: 'all', label: 'TODAS AS POSIÇÕES', code: 'ALL', desc: 'Protocolo consolidado com todas as tomadas de posição do GP.' },
    { id: 'poletime', label: 'POLETIME', code: 'POLE', desc: 'Previsão de volta mais rápida da classificação até os milésimos.' },
    { id: 'master', label: 'TOP 10 FINISH', code: 'TOP10', desc: 'Posições exatas de chegada dos dez primeiros colocados.' },
    { id: 'evo', label: 'EVO / ESCALADA', code: 'EVO', desc: 'Os 5 pilotos que mais ganharão posições em relação ao grid de largada.' },
    { id: 'h2h', label: 'DUELOS TÁTICOS', code: 'H2H', desc: 'Confrontos diretos internos entre os companheiros de equipe.' },
    { id: 'misc', label: 'EVENT PROPS', code: 'MISC', desc: 'Probabilidade de eventos de pista e telemetria extra.' },
];

interface PilotProfile {
    name: string;
    slug: string | null;
    driverNumber: string | null;
    teamName: string | null;
    teamColor: string | null;
    avatarUrl: string | null;
}

export type BlockTier = 'RED' | 'YELLOW' | 'GREEN';

export interface BlockCalibration {
    tier: BlockTier;
    count: number;
    blockName: string;
    blockShort: string;
}

function getBlockInfo(teamName?: string | null) {
    if (!teamName) {
        return { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'BLOCO ESTRELA', teamNames: ['McLaren', 'Mercedes', 'Williams', 'Aston Martin', 'Alpine'] };
    }
    const clean = teamName.toLowerCase();
    if (clean.includes('ferrari') || clean.includes('haas') || clean.includes('audi') || clean.includes('cadillac') || clean.includes('sauber')) {
        return { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'BLOCO MARANELLO', teamNames: ['Ferrari', 'Haas', 'Audi', 'Cadillac', 'Sauber'] };
    }
    if (clean.includes('red bull') || clean.includes('racing bulls') || clean.includes('rb') || clean.includes('bulls')) {
        return { id: 'C', name: 'A VANGUARDA', short: 'BLOCO VANGUARDA', teamNames: ['Red Bull Racing', 'Red Bull', 'Racing Bulls', 'RB'] };
    }
    return { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'BLOCO ESTRELA', teamNames: ['McLaren', 'Mercedes', 'Williams', 'Aston Martin', 'Alpine'] };
}

export default function PositionsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [pilot, setPilot] = useState<PilotProfile | null>(null);
    const [hasSyncedFromDb, setHasSyncedFromDb] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<{ type: 'top10' | 'evo', index: number } | null>(null);
    const [eventData, setEventData] = useState<F1Event | null>(null);

    const roundNumber = useMemo(() => {
        return parseInt(eventData?.round || '19', 10) || 19;
    }, [eventData]);

    const activeStrategist = useMemo(() => {
        return getSeniorStrategistForRound(roundNumber);
    }, [roundNumber]);

    const circuitIntel = useMemo(() => {
        return getCircuitIntel(eventData?.circuit || eventData?.round || 'americas');
    }, [eventData]);

    useEffect(() => {
        fetchNextEvent().then((ev) => {
            if (ev) setEventData(ev);
        });
    }, []);

    // Estado da calibragem do Bloco do usuário






    const [calibration, setCalibration] = useState<BlockCalibration>({
        tier: 'RED',
        count: 0,
        blockName: 'CONSÓRCIO DA ESTRELA',
        blockShort: 'BLOCO ESTRELA'
    });

    // Tooltip/popover contextual de observação de calibragem posicionado diretamente sobre o botão clicado
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

    // Conexão com a Store oficial de Predições / Posições
    const {
        poletime,
        top10,
        evo,
        h2h,
        misc,
        setPoletime,
        setTop10,
        setEvo,
        setH2H,
        setMisc
    } = usePredictionStore();

    // Hooks oficiais de automação e envio
    const { autoPoletime, autoTop10, autoEvo, autoH2H, isAutoLoading, calibrationSource } = useTeamworkAuto();
    const { submit: handleSubmit, isSubmitting, isSuccess } = useSubmitPrediction();

    // 1. Carrega dados do perfil, contrato e calibragem do bloco do piloto
    useEffect(() => {
        if (!user) {
            setPilot(null);
            return;
        }

        let isSubscribed = true;
        const fetchPilot = async () => {
            try {
                const [profRes, contractRes, predsRes, allContractsRes] = await Promise.all([
                    supabase.from('profiles').select('first_name, last_name, username, slug, driver_number, avatar_url').eq('id', user.id).maybeSingle(),
                    supabase.from('contracts').select('group_id, teams(name, color)').eq('user_id', user.id).maybeSingle(),
                    supabase.from('predictions').select('user_id').eq('round', 'current'),
                    supabase.from('contracts').select('user_id, teams(name)')
                ]);

                if (!isSubscribed) return;

                const prof = profRes.data;
                const contract = contractRes.data;
                const teamInfo = contract?.teams ? (Array.isArray(contract.teams) ? contract.teams[0] : contract.teams) : null;

                const formattedName = formatPilotName(prof?.first_name, prof?.last_name, prof?.username || prof?.slug || user.email?.split('@')[0]);

                setPilot({
                    name: formattedName,
                    slug: prof?.slug || null,
                    driverNumber: prof?.driver_number ? String(prof.driver_number) : null,
                    teamName: teamInfo?.name || null,
                    teamColor: teamInfo?.color || '#fbaa19',
                    avatarUrl: prof?.avatar_url || null
                });

                // Cálculo da Calibragem do Bloco
                const myBlock = getBlockInfo(teamInfo?.name);
                const usersInBlock = new Set<string>();

                (allContractsRes.data || []).forEach((c: any) => {
                    const tName = c.teams ? (Array.isArray(c.teams) ? c.teams[0]?.name : c.teams.name) : '';
                    if (myBlock.teamNames.some(tn => tName && tName.toLowerCase().includes(tn.toLowerCase()))) {
                        usersInBlock.add(c.user_id);
                    }
                });

                const blockPredsCount = (predsRes.data || []).filter((p: any) => usersInBlock.has(p.user_id)).length;
                const calibTier: BlockTier = blockPredsCount < 5 ? 'RED' : blockPredsCount < 10 ? 'YELLOW' : 'GREEN';

                setCalibration({
                    tier: calibTier,
                    count: blockPredsCount,
                    blockName: myBlock.name,
                    blockShort: myBlock.short
                });

            } catch (err) {
                console.error("Erro ao obter dados do piloto e calibragem:", err);
            }
        };

        fetchPilot();
        return () => { isSubscribed = false; };
    }, [user]);

    // 2. Sincroniza dados já salvos no banco
    useEffect(() => {
        if (!user) return;
        let isSubscribed = true;

        const loadSaved = async () => {
            try {
                const { data, error } = await supabase
                    .from('predictions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('round', 'current')
                    .maybeSingle();

                if (!error && data && isSubscribed) {
                    if (data.poletime && typeof data.poletime === 'string') {
                        const digits = data.poletime.replace(/[^0-9]/g, '');
                        if (digits.length === 6) {
                            setPoletime(digits.split('').map((d: string) => parseInt(d, 10)));
                        }
                    }
                    if (Array.isArray(data.top10) && data.top10.length === 10) {
                        setTop10(data.top10);
                    }
                    if (Array.isArray(data.evo) && data.evo.length === 5) {
                        setEvo(data.evo);
                    }
                    if (data.h2h && typeof data.h2h === 'object') {
                        setH2H(data.h2h);
                    }
                    if (data.misc && typeof data.misc === 'object') {
                        setMisc(data.misc);
                    }
                    setHasSyncedFromDb(true);
                }

                // Carrega predições pré-configuradas da War Room se houver
                if (typeof window !== 'undefined') {
                    const warRoomDraftRaw = localStorage.getItem('war_room_draft');
                    if (warRoomDraftRaw) {
                        try {
                            const wrDraft = JSON.parse(warRoomDraftRaw);
                            if (wrDraft?.poletime && typeof wrDraft.poletime === 'string') {
                                const digits = wrDraft.poletime.replace(/[^0-9]/g, '');
                                if (digits.length >= 6) {
                                    setPoletime(digits.slice(0, 6).split('').map((d: string) => parseInt(d, 10)));
                                }
                            }
                            if (Array.isArray(wrDraft?.top10) && wrDraft.top10.length === 10) {
                                setTop10(wrDraft.top10);
                            }
                        } catch (_) {}
                    }
                }
            } catch (e) {
                console.error("Erro ao sincronizar posições:", e);
            }
        };

        loadSaved();
        return () => { isSubscribed = false; };
    }, [user, setPoletime, setTop10, setEvo, setH2H, setMisc]);

    // Helpers de validação e contadores
    const countTop10 = top10.filter(Boolean).length;
    const isTop10Complete = countTop10 === 10;
    const countEvo = evo.filter(Boolean).length;
    const isEvoComplete = countEvo === 5;
    const countH2H = Object.keys(h2h).length;
    const isH2HComplete = countH2H === F1_MATCHUPS.length;
    const isPoletimeSet = poletime.some(d => d > 0);
    const countMisc = Object.keys(misc).filter(k => k !== 'stake').length;
    const isMiscComplete = countMisc >= 1;

    const isAllComplete = isTop10Complete && isEvoComplete && isH2HComplete && isPoletimeSet;

    // Controles de Poletime
    const maxPoletimeValues = [3, 5, 9, 9, 9, 9];
    const incrementPoletimeDigit = (index: number) => {
        setPoletime(prev => {
            const next = [...prev];
            next[index] = next[index] + 1 > maxPoletimeValues[index] ? 0 : next[index] + 1;
            return next;
        });
    };

    // Helper ordinal estilo BET
    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const activeTabMeta = useMemo(() => {
        return TABS.find(t => t.id === activeTab) || TABS[0];
    }, [activeTab]);

    // Estilização minimalista do botão Auto baseada na calibragem em cascata (Amigos -> Mercado Geral -> F1)
    const autoBtnStyle = useMemo(() => {
        const tier = calibrationSource?.tier || calibration.tier;
        switch (tier) {
            case 'RED':
                return {
                    bg: 'bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-black border-red-500/50 shadow-sm',
                    dot: 'bg-red-500 animate-pulse',
                    label: 'RED !',
                    helpBorder: '#ef4444'
                };
            case 'YELLOW':
                return {
                    bg: 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border-amber-500/50 shadow-sm',
                    dot: 'bg-amber-400',
                    label: 'YELLOW',
                    helpBorder: '#f59e0b'
                };
            case 'GREEN':
                return {
                    bg: 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border-emerald-500/50 shadow-sm',
                    dot: 'bg-emerald-400',
                    label: 'VERDE',
                    helpBorder: '#10b981'
                };
        }
    }, [calibrationSource, calibration.tier]);

    // Popover/tooltip contextual de calibragem (hover no desktop ou clique/toque no mobile)
    const renderCalibrationTooltip = (id: string) => {
        const isVisible = activeTooltipId === id;

        return (
            <div 
                className={`absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0a0a0a]/95 backdrop-blur-md border rounded-lg shadow-2xl p-3.5 z-50 font-mono text-white text-left transition-all duration-200 pointer-events-auto ${
                    isVisible ? 'opacity-100 visible' : 'opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible'
                }`}
                style={{ borderColor: autoBtnStyle.helpBorder }}
            >
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${autoBtnStyle.dot}`} />
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-white">
                            CALIBRAGEM // {calibrationSource?.type === 'SQUAD' ? 'ESQUADRÃO (AMIGOS)' : calibrationSource?.type === 'MARKET' ? 'MERCADO GERAL' : 'F1 BENCHMARK'}
                        </span>
                    </div>
                    {isVisible && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltipId(null);
                            }}
                            className="text-white/40 hover:text-white text-[11px] font-bold p-0.5 leading-none transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-1 bg-white/[0.04] p-2.5 rounded border border-white/5 mb-2.5 text-[10px]">
                    <div className="flex items-center justify-between">
                        <span className="text-white/60 uppercase">FONTE:</span>
                        <span className="font-black uppercase tracking-wider text-white" style={{ color: autoBtnStyle.helpBorder }}>
                            {calibrationSource?.label}
                        </span>
                    </div>
                    <p className="text-[9px] text-white/50 leading-tight mt-0.5">
                        {calibrationSource?.description}
                    </p>
                </div>

                <div className="space-y-1.5 text-[10px] leading-snug">
                    <div className={`p-1.5 rounded border flex items-start gap-1.5 ${calibrationSource?.type === 'SQUAD' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-white/[0.02] border-white/5 text-white/40'}`}>
                        <span className="text-emerald-400 font-black shrink-0">1. AMIGOS:</span>
                        <span>Prioridade máxima. Média e tendências do seu esquadrão Teamwork.</span>
                    </div>
                    <div className={`p-1.5 rounded border flex items-start gap-1.5 ${calibrationSource?.type === 'MARKET' ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-white/[0.02] border-white/5 text-white/40'}`}>
                        <span className="text-amber-400 font-black shrink-0">2. MERCADO:</span>
                        <span>Fallback público. Consenso de todas as apostas do grid.</span>
                    </div>
                    <div className={`p-1.5 rounded border flex items-start gap-1.5 ${calibrationSource?.type === 'BASELINE' ? 'bg-red-950/40 border-red-500/50 text-red-200' : 'bg-white/[0.02] border-white/5 text-white/40'}`}>
                        <span className="text-red-400 font-black shrink-0">3. BASE F1:</span>
                        <span>Benchmark de fábrica caso não haja ordens registradas.</span>
                    </div>
                </div>
            </div>
        );
    };

    const handleAutoAll = async () => {
        try {
            const [pPole, pTop10, pEvo, pH2H] = await Promise.all([
                autoPoletime(),
                autoTop10(),
                autoEvo(),
                autoH2H()
            ]);
            setPoletime(pPole);
            setTop10(pTop10);
            setEvo(pEvo);
            setH2H(pH2H);
        } catch (e) {
            console.error("Erro no auto geral:", e);
        }
    };

    const handleClearAll = () => {
        setPoletime([0, 0, 0, 0, 0, 0]);
        setTop10(Array(10).fill(''));
        setEvo(Array(5).fill(''));
        setH2H({});
    };

    return (
        <main className="w-full min-h-screen relative bg-[#050401] text-white font-mono flex flex-col items-center pb-32 select-none overflow-x-hidden">

            {/* Background Pixel Art Imersivo Noir - Viewport Estável sem expansão */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden"
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt="Terminal Background"
                    className="w-full h-full object-cover object-center opacity-60 md:opacity-75"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute inset-0 bg-[#050401]/85 backdrop-blur-[2px]" />
            </div>

            {/* CONTAINER PRINCIPAL */}
            <div className="relative z-10 w-full max-w-5xl px-4 md:px-8 mt-6 flex flex-col gap-6">

                {/* NOVO HEADER // PRÓXIMO EVENTO (LARGURA FIXA DE NO MÁXIMO 50% DO BOX DOS FORMULÁRIOS) */}
                <header className="w-full sm:w-1/2 sm:max-w-[50%] flex flex-col shadow-2xl font-mono overflow-hidden">
                    {/* Título: Black, Background Yellow, Nome do Evento */}
                    <div className="bg-[#fbaa19] text-black px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-tight sm:tracking-wider truncate block">
                            {eventData?.name || 'MEXICO CITY GRAND PRIX'}
                        </span>
                        {eventData?.round && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-black text-[#fbaa19] rounded-xs shrink-0">
                                R{eventData.round}
                            </span>
                        )}
                    </div>

                    {/* Subtítulo: Margin Top 0, Nome do Circuito, Color White, Background Black */}
                    <div className="mt-0 bg-black border-x border-b border-white/20 text-white px-4 py-1.5">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate block text-white/90">
                            {eventData?.circuit || 'AUTÓDROMO HERMANOS RODRÍGUEZ'}
                        </span>
                    </div>

                    {/* Abaixo: Race Date Time e ao lado Deadline Date Time "Q1" */}
                    <div className="mt-0 bg-[#0d0e12] border-x border-b border-white/20 px-4 py-2 flex items-center justify-between gap-3 text-[10px] sm:text-[11px]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[#fbaa19] text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                                RACE DATE TIME
                            </span>
                            <span className="text-gray-200 font-bold truncate">
                                {eventData ? `${eventData.date} · ${eventData.time}` : 'TBA'}
                            </span>
                        </div>

                        <div className="flex flex-col text-right min-w-0">
                            <span className="text-red-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                                DEADLINE DATE TIME "Q1"
                            </span>
                            <span className="text-white font-bold truncate">
                                {eventData && eventData.qualiDate && eventData.qualiTime ? (() => {
                                    const d = new Date(`${eventData.qualiDate}T${eventData.qualiTime}`);
                                    return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                                })() : (eventData?.qualiDate || 'TBD')}
                            </span>
                        </div>
                    </div>
                </header>

                {/* 2. PASSO ZERO: BRIEFING DO CONSELHEIRO & TELEMETRIA CANÔNICA */}
                <PassoZeroBriefing
                    roundNumber={roundNumber}
                    circuitIdentifier={eventData?.circuit || eventData?.round || 'americas'}
                    pilot={pilot}
                    allianceBlock={getBlockInfo(pilot?.teamName).id as 'A' | 'B' | 'C'}
                    activeTab={activeTab}
                    onApplyPoletime={(digits) => setPoletime(digits)}
                    onApplyTop10={(picks) => setTop10(picks)}
                    onApplyEvo={(drivers) => setEvo(drivers)}
                    onApplyH2H={(picks) => setH2H(picks)}
                    onApplyAll={({ poletime, top10, evo, h2h }) => {
                        setPoletime(poletime);
                        setTop10(top10);
                        setEvo(evo);
                        setH2H(h2h);
                    }}
                />

                {/* 3. CONTROLE DE ABAS (PITWALL CONSOLE) */}
                <nav aria-label="Abas de Posições" className="w-full bg-black/80 backdrop-blur-md border border-white/15 rounded-lg p-1.5 flex flex-wrap md:flex-nowrap gap-1.5 shadow-xl">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        let progress = '';
                        if (tab.id === 'poletime') progress = isPoletimeSet ? 'OK' : '0/1';
                        if (tab.id === 'master') progress = `${countTop10}/10`;
                        if (tab.id === 'evo') progress = `${countEvo}/5`;
                        if (tab.id === 'h2h') progress = `${countH2H}/${F1_MATCHUPS.length}`;
                        if (tab.id === 'misc') progress = `${countMisc}/1`;
                        if (tab.id === 'all') progress = isAllComplete ? '✔ COMPLETO' : 'EM ABERTO';

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[130px] p-2.5 rounded flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${isActive
                                    ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-lg font-black'
                                    : 'bg-black/40 text-white/70 border-white/5 hover:border-[#fbaa19]/40 hover:text-white font-bold'
                                    }`}
                            >
                                <span className="text-[11px] md:text-xs uppercase tracking-wider font-mono">
                                    {tab.label}
                                </span>
                                <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                                    }`}>
                                    {progress}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* 4. CONTEÚDO DAS ABAS (ALINHADAS VERTICALMENTE) */}
                <div className="flex flex-col gap-10">

                    {/* --- ABA POLETIME --- */}
                    {(activeTab === 'poletime' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                                        POLETIME
                                    </h2>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0">
                                    <button
                                        type="button"
                                        onClick={() => setPoletime([0, 0, 0, 0, 0, 0])}
                                        disabled={isAutoLoading || isSubmitting || !isPoletimeSet}
                                        className="h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all whitespace-nowrap shrink-0 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <div className="relative group/help flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const generated = await autoPoletime();
                                                setPoletime(generated);
                                            }}
                                            disabled={isAutoLoading || isSubmitting}
                                            className={`h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded border transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${autoBtnStyle.bg}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${autoBtnStyle.dot}`} />
                                            <span>[ AUTO ]</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTooltipId(prev => prev === 'poletime' ? null : 'poletime')}
                                            className={`h-8 w-8 flex items-center justify-center rounded border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                activeTooltipId === 'poletime'
                                                    ? 'border-[#fbaa19] text-[#fbaa19] bg-[#fbaa19]/20'
                                                    : 'border-white/15 group-hover/help:border-white/40 text-white/60 group-hover/help:text-white bg-black/60 group-hover/help:bg-white/10'
                                            }`}
                                            title="Calibragem do Bloco"
                                            aria-label="Informações sobre Calibragem do Bloco"
                                        >
                                            ?
                                        </button>
                                        {renderCalibrationTooltip('poletime')}
                                    </div>
                                </div>
                            </div>

                            {/* Dica de Rádio do Estrategista Sênior */}
                            <div className="bg-[#0e1015] border-l-2 border-[#fbaa19] px-3.5 py-2.5 rounded-r flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-white/80 gap-1.5 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1">
                                        📻 {activeStrategist.code}:
                                    </span>
                                    <span className="italic text-gray-300">"{activeStrategist.briefingTips.poletimeReasoning}"</span>
                                </div>
                                <div className="text-[#fbaa19] font-black shrink-0 sm:ml-3 flex items-center gap-1">
                                    <span className="text-white/40 font-normal">ALVO SUGERIDO:</span>
                                    <span>{activeStrategist.briefingTips.poletimeTarget}</span>
                                </div>
                            </div>

                            {/* Display do Relógio Analógico Digital */}
                            <div className="flex flex-col items-center justify-center py-8 px-4 bg-black/60 border border-[#fbaa19]/20 rounded-lg max-w-3xl w-full mx-auto">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                                    {/* Minutos */}
                                    <button
                                        type="button"
                                        onClick={() => incrementPoletimeDigit(0)}
                                        className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                    >
                                        {poletime[0]}
                                        <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">MIN</span>
                                    </button>

                                    <span className="text-[#fbaa19] text-3xl sm:text-4xl md:text-5xl font-black mx-1 pb-4 animate-pulse">:</span>

                                    {/* Segundos */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => incrementPoletimeDigit(1)}
                                            className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                        >
                                            {poletime[1]}
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">SEG</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => incrementPoletimeDigit(2)}
                                            className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                        >
                                            {poletime[2]}
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">SEG</span>
                                        </button>
                                    </div>

                                    <span className="text-[#fbaa19] text-3xl sm:text-4xl md:text-5xl font-black mx-1 pb-4 animate-pulse">.</span>

                                    {/* Milésimos */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => incrementPoletimeDigit(3)}
                                            className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                        >
                                            {poletime[3]}
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">MS</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => incrementPoletimeDigit(4)}
                                            className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                        >
                                            {poletime[4]}
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">MS</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => incrementPoletimeDigit(5)}
                                            className="w-12 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-black/80 border-2 border-white/20 hover:border-[#fbaa19] rounded flex flex-col items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-white hover:text-[#fbaa19] transition-all cursor-pointer shadow-inner"
                                        >
                                            {poletime[5]}
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">MS</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-widest text-white/60">
                                    <span>TEMPO TRANSMITIDO:</span>
                                    <span className="text-[#fbaa19] font-black text-base">
                                        {poletime[0]}:{poletime[1]}{poletime[2]}.{poletime[3]}{poletime[4]}{poletime[5]}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* --- ABA MASTER (TOP 10 FINISH) - PADRÃO DE CORES BET + ALINHAMENTO VERTICAL --- */}
                    {(activeTab === 'master' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                                        TOP 10 FINISH
                                    </h2>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0">
                                    <button
                                        type="button"
                                        onClick={() => setTop10(Array(10).fill(''))}
                                        disabled={isAutoLoading || isSubmitting || countTop10 === 0}
                                        className="h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all whitespace-nowrap shrink-0 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <div className="relative group/help flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const generated = await autoTop10();
                                                setTop10(generated);
                                            }}
                                            disabled={isAutoLoading || isSubmitting}
                                            className={`h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded border transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${autoBtnStyle.bg}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${autoBtnStyle.dot}`} />
                                            <span>[ AUTO ]</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTooltipId(prev => prev === 'master' ? null : 'master')}
                                            className={`h-8 w-8 flex items-center justify-center rounded border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                activeTooltipId === 'master'
                                                    ? 'border-[#fbaa19] text-[#fbaa19] bg-[#fbaa19]/20'
                                                    : 'border-white/15 group-hover/help:border-white/40 text-white/60 group-hover/help:text-white bg-black/60 group-hover/help:bg-white/10'
                                            }`}
                                            title="Calibragem do Bloco"
                                            aria-label="Informações sobre Calibragem do Bloco"
                                        >
                                            ?
                                        </button>
                                        {renderCalibrationTooltip('master')}
                                    </div>
                                </div>
                            </div>

                            {/* Dica de Rádio do Estrategista Sênior */}
                            <div className="bg-[#0e1015] border-l-2 border-[#fbaa19] px-3.5 py-2.5 rounded-r flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-white/80 gap-1.5 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1">
                                        📻 {activeStrategist.code}:
                                    </span>
                                    <span className="italic text-gray-300">"{activeStrategist.briefingTips.top3Reasoning}"</span>
                                </div>
                                <div className="text-[#fbaa19] font-black shrink-0 sm:ml-3 flex items-center gap-1">
                                    <span className="text-white/40 font-normal">PÓDIO SUGERIDO:</span>
                                    <span>{activeStrategist.briefingTips.predictedTop3.join(' · ')}</span>
                                </div>
                            </div>

                            {/* Lista dos 10 Pilotos ALINHADA VERTICALMENTE */}
                            <div className="flex flex-col gap-3 max-w-3xl w-full mx-auto relative">
                                {top10.map((driverName, idx) => {
                                    const details = driverName ? getDriverDetails(driverName) : null;
                                    const isOpen = openDropdown?.type === 'top10' && openDropdown.index === idx;
                                    const isPicked = !!driverName;

                                    return (
                                        <div key={idx} className="relative w-full">
                                            {/* Container com padrão de cores de BET */}
                                            <div
                                                onClick={() => setOpenDropdown(isOpen ? null : { type: 'top10', index: idx })}
                                                style={{ minHeight: '3.5rem' }}
                                                className={`w-full flex items-stretch border transition-all duration-200 cursor-pointer ${isPicked
                                                    ? 'bg-[#fbaa19] border-[#fbaa19] text-black shadow-lg'
                                                    : 'bg-black/75 border-white/20 text-white hover:border-[#fbaa19]'
                                                    } ${isOpen ? 'z-50 ring-2 ring-[#fbaa19]' : 'z-10'}`}
                                            >
                                                {/* Badge lateral ordinal no padrão de BET */}
                                                <div className={`w-16 flex items-center justify-center font-black uppercase text-base md:text-lg border-r shrink-0 ${isPicked
                                                    ? 'bg-[#e59914] text-black border-[#e59914]'
                                                    : 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                    }`}>
                                                    {getOrdinal(idx + 1)}
                                                </div>

                                                {/* Conteúdo do Piloto */}
                                                <div className="flex-1 flex items-center justify-between px-4 py-2">
                                                    {details ? (
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-base md:text-lg font-black uppercase tracking-widest text-black">
                                                                {details.name} <span className="text-black/70"># {details.num}</span>
                                                            </span>
                                                            <span className="text-xs font-bold uppercase tracking-wider mt-0.5 text-black/70">
                                                                {details.team}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm md:text-base font-black uppercase tracking-widest text-white/40">
                                                            Select Driver
                                                        </span>
                                                    )}

                                                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isPicked ? 'text-black' : 'text-[#fbaa19]'}`}>
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dropdown Menu Noir de Seleção */}
                                            {isOpen && (
                                                <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-[#0a0a0a] border-2 border-[#fbaa19] rounded shadow-2xl max-h-60 overflow-y-auto">
                                                    {F1_DRIVERS.map((dName) => {
                                                        const dInfo = getDriverDetails(dName);
                                                        const dColor = getTeamColor(dInfo.team);
                                                        const isSelected = top10.includes(dName);

                                                        return (
                                                            <button
                                                                key={dName}
                                                                type="button"
                                                                disabled={isSelected && driverName !== dName}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const next = [...top10];
                                                                    next[idx] = dName;
                                                                    setTop10(next);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full p-2.5 px-4 flex items-center justify-between text-left border-b border-white/5 transition-colors cursor-pointer ${isSelected && driverName !== dName
                                                                    ? 'opacity-30 cursor-not-allowed bg-black/40'
                                                                    : 'hover:bg-[#fbaa19] hover:text-black group'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black uppercase group-hover:text-black">{dInfo.name}</span>
                                                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded" style={{ backgroundColor: `${dColor}25`, color: dColor }}>
                                                                        #{dInfo.num}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] uppercase tracking-widest font-bold group-hover:text-black" style={{ color: dColor }}>
                                                                    {dInfo.team}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* --- ABA EVO (ESCALADA DE GRID) - PADRÃO DE CORES BET + ALINHAMENTO VERTICAL --- */}
                    {(activeTab === 'evo' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                                        EVO / ESCALADA
                                    </h2>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0">
                                    <button
                                        type="button"
                                        onClick={() => setEvo(Array(5).fill(''))}
                                        disabled={isAutoLoading || isSubmitting || countEvo === 0}
                                        className="h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all whitespace-nowrap shrink-0 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <div className="relative group/help flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const generated = await autoEvo();
                                                setEvo(generated);
                                            }}
                                            disabled={isAutoLoading || isSubmitting}
                                            className={`h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded border transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${autoBtnStyle.bg}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${autoBtnStyle.dot}`} />
                                            <span>[ AUTO ]</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTooltipId(prev => prev === 'evo' ? null : 'evo')}
                                            className={`h-8 w-8 flex items-center justify-center rounded border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                activeTooltipId === 'evo'
                                                    ? 'border-[#fbaa19] text-[#fbaa19] bg-[#fbaa19]/20'
                                                    : 'border-white/15 group-hover/help:border-white/40 text-white/60 group-hover/help:text-white bg-black/60 group-hover/help:bg-white/10'
                                            }`}
                                            title="Calibragem do Bloco"
                                            aria-label="Informações sobre Calibragem do Bloco"
                                        >
                                            ?
                                        </button>
                                        {renderCalibrationTooltip('evo')}
                                    </div>
                                </div>
                            </div>

                            {/* Dica de Rádio do Estrategista Sênior */}
                            <div className="bg-[#0e1015] border-l-2 border-[#fbaa19] px-3.5 py-2.5 rounded-r flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-white/80 gap-1.5 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1">
                                        📻 {activeStrategist.code}:
                                    </span>
                                    <span className="italic text-gray-300">"{activeStrategist.briefingTips.evoReasoning}"</span>
                                </div>
                                <div className="text-emerald-400 font-black shrink-0 sm:ml-3 flex items-center gap-1">
                                    <span className="text-white/40 font-normal">ALVO EVO:</span>
                                    <span>{activeStrategist.briefingTips.evoTargetDriver}</span>
                                </div>
                            </div>

                            {/* Lista dos 5 Pilotos ALINHADA VERTICALMENTE */}
                            <div className="flex flex-col gap-3 max-w-3xl w-full mx-auto relative">
                                {evo.map((driverName, idx) => {
                                    const details = driverName ? getDriverDetails(driverName) : null;
                                    const isOpen = openDropdown?.type === 'evo' && openDropdown.index === idx;
                                    const isPicked = !!driverName;

                                    return (
                                        <div key={idx} className="relative w-full">
                                            {/* Container com padrão de cores de BET */}
                                            <div
                                                onClick={() => setOpenDropdown(isOpen ? null : { type: 'evo', index: idx })}
                                                style={{ minHeight: '3.5rem' }}
                                                className={`w-full flex items-stretch border transition-all duration-200 cursor-pointer ${isPicked
                                                    ? 'bg-[#fbaa19] border-[#fbaa19] text-black shadow-lg'
                                                    : 'bg-black/75 border-white/20 text-white hover:border-[#fbaa19]'
                                                    } ${isOpen ? 'z-50 ring-2 ring-[#fbaa19]' : 'z-10'}`}
                                            >
                                                {/* Badge lateral no padrão BET */}
                                                <div className={`w-20 flex items-center justify-center font-bold uppercase text-xs border-r shrink-0 ${isPicked
                                                    ? 'bg-[#e59914] text-black border-[#e59914]'
                                                    : 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                    }`}>
                                                    EVO {idx + 1}
                                                </div>

                                                {/* Conteúdo do Piloto */}
                                                <div className="flex-1 flex items-center justify-between px-4 py-2">
                                                    {details ? (
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-base md:text-lg font-black uppercase tracking-widest text-black">
                                                                {details.name} <span className="text-black/70"># {details.num}</span>
                                                            </span>
                                                            <span className="text-xs font-bold uppercase tracking-wider mt-0.5 text-black/70">
                                                                {details.team}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm md:text-base font-black uppercase tracking-widest text-white/40">
                                                            Select Driver
                                                        </span>
                                                    )}

                                                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isPicked ? 'text-black' : 'text-[#fbaa19]'}`}>
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dropdown Menu Noir de Seleção */}
                                            {isOpen && (
                                                <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-[#0a0a0a] border-2 border-[#fbaa19] rounded shadow-2xl max-h-60 overflow-y-auto">
                                                    {F1_DRIVERS.map((dName) => {
                                                        const dInfo = getDriverDetails(dName);
                                                        const dColor = getTeamColor(dInfo.team);
                                                        const isSelected = evo.includes(dName);

                                                        return (
                                                            <button
                                                                key={dName}
                                                                type="button"
                                                                disabled={isSelected && driverName !== dName}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const next = [...evo];
                                                                    next[idx] = dName;
                                                                    setEvo(next);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full p-2.5 px-4 flex items-center justify-between text-left border-b border-white/5 transition-colors cursor-pointer ${isSelected && driverName !== dName
                                                                    ? 'opacity-30 cursor-not-allowed bg-black/40'
                                                                    : 'hover:bg-[#fbaa19] hover:text-black group'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black uppercase group-hover:text-black">{dInfo.name}</span>
                                                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded" style={{ backgroundColor: `${dColor}25`, color: dColor }}>
                                                                        #{dInfo.num}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] uppercase tracking-widest font-bold group-hover:text-black" style={{ color: dColor }}>
                                                                    {dInfo.team}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* --- ABA HEAD TO HEAD (DUELOS TÁTICOS) - PADRÃO DE CORES BET + ALINHAMENTO VERTICAL --- */}
                    {(activeTab === 'h2h' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                                        DUELOS TÁTICOS
                                    </h2>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0">
                                    <button
                                        type="button"
                                        onClick={() => setH2H({})}
                                        disabled={isAutoLoading || isSubmitting || countH2H === 0}
                                        className="h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all whitespace-nowrap shrink-0 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <div className="relative group/help flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const generated = await autoH2H();
                                                setH2H(generated);
                                            }}
                                            disabled={isAutoLoading || isSubmitting}
                                            className={`h-8 px-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded border transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${autoBtnStyle.bg}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${autoBtnStyle.dot}`} />
                                            <span>[ AUTO ]</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTooltipId(prev => prev === 'h2h' ? null : 'h2h')}
                                            className={`h-8 w-8 flex items-center justify-center rounded border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                activeTooltipId === 'h2h'
                                                    ? 'border-[#fbaa19] text-[#fbaa19] bg-[#fbaa19]/20'
                                                    : 'border-white/15 group-hover/help:border-white/40 text-white/60 group-hover/help:text-white bg-black/60 group-hover/help:bg-white/10'
                                            }`}
                                            title="Calibragem do Bloco"
                                            aria-label="Informações sobre Calibragem do Bloco"
                                        >
                                            ?
                                        </button>
                                        {renderCalibrationTooltip('h2h')}
                                    </div>
                                </div>
                            </div>

                            {/* Dica de Rádio do Estrategista Sênior */}
                            <div className="bg-[#0e1015] border-l-2 border-[#fbaa19] px-3.5 py-2.5 rounded-r flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-white/80 gap-1.5 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1">
                                        📻 {activeStrategist.code}:
                                    </span>
                                    <span className="italic text-gray-300">"{activeStrategist.briefingTips.h2hReasoning}"</span>
                                </div>
                                <div className="text-blue-400 font-black shrink-0 sm:ml-3 flex items-center gap-1">
                                    <span className="text-white/40 font-normal">VANTAGEM:</span>
                                    <span>{activeStrategist.briefingTips.dominantH2HDrivers.slice(0, 2).join(' · ')}</span>
                                </div>
                            </div>

                            {/* Lista dos 11 Confrontos ALINHADA VERTICALMENTE */}
                            <div className="flex flex-col gap-4 max-w-3xl w-full mx-auto">
                                {F1_MATCHUPS.map((match) => {
                                    const picked = h2h[match.id];

                                    return (
                                        <article key={match.id} className="bg-black/85 border border-white/20 hover:border-[#fbaa19] rounded flex flex-col transition-colors overflow-hidden shadow-md">
                                            {/* Cabeçalho da Equipe estilo BET */}
                                            <p className="bg-black/90 text-white px-4 py-2 font-bold uppercase tracking-widest text-xs md:text-sm border-b border-white/10 text-center">
                                                {match.team}
                                            </p>

                                            {/* Dois Pilotos com seleção no padrão BET */}
                                            <div className="flex flex-row w-full h-full">
                                                {[match.d1, match.d2].map((driver) => {
                                                    const isPicked = picked === driver.num;

                                                    return (
                                                        <button
                                                            key={driver.num}
                                                            type="button"
                                                            onClick={() => setH2H(prev => ({ ...prev, [match.id]: driver.num }))}
                                                            style={{ minHeight: '3.5rem' }}
                                                            className={`flex-1 flex flex-row items-center justify-between px-4 py-2 transition-all text-left border-r border-white/10 last:border-r-0 cursor-pointer ${isPicked
                                                                ? 'bg-[#fbaa19] text-black font-black'
                                                                : 'bg-black/50 text-white hover:bg-black/90 hover:text-[#fbaa19]'
                                                                }`}
                                                        >
                                                            <span className="text-base md:text-lg font-black uppercase tracking-widest leading-tight">
                                                                {driver.name}{' '}
                                                                <span className={isPicked ? "text-black/70" : "text-[#fbaa19]"}>
                                                                    # {driver.num}
                                                                </span>
                                                            </span>

                                                            {isPicked && (
                                                                <svg className="w-5 h-5 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* --- ABA MISC (EVENT PROPS) --- */}
                    {(activeTab === 'misc' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                                        EVENT PROPS
                                    </h2>
                                </div>
                            </div>

                            {/* Dica de Rádio do Estrategista Sênior */}
                            <div className="bg-[#0e1015] border-l-2 border-[#fbaa19] px-3.5 py-2.5 rounded-r flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-white/80 gap-1.5 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1">
                                        📻 {activeStrategist.code}:
                                    </span>
                                    <span className="italic text-gray-300">"{activeStrategist.briefingTips.miscRiskAlert}"</span>
                                </div>
                                <div className="text-amber-400 font-black shrink-0 sm:ml-3 flex items-center gap-1">
                                    <span className="text-white/40 font-normal">RISCO SC:</span>
                                    <span>{circuitIntel.scProbability}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 max-w-3xl w-full mx-auto">
                                {QUESTIONS.map((q) => {
                                    const picked = misc[q.id];

                                    return (
                                        <div key={q.id} className="bg-black/75 border border-white/15 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-white/50 uppercase tracking-widest font-mono">PROPOSIÇÃO:</span>
                                                <span className="text-sm font-bold text-white uppercase mt-0.5">{q.text}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {q.options.map((opt) => {
                                                    const isSelected = picked === opt;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setMisc(prev => ({ ...prev, [q.id]: opt }))}
                                                            className={`px-6 py-2 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${isSelected
                                                                ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                                : 'bg-black/60 text-white/70 border-white/20 hover:border-[#fbaa19]/50 hover:text-white'
                                                                }`}
                                                        >
                                                            {opt} {isSelected && '✔'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Nível de Confiança / Stake */}
                                <div className="bg-black/60 border border-[#fbaa19]/30 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                                    <div>
                                        <span className="text-xs text-[#fbaa19] font-bold uppercase tracking-widest">ALOCAÇÃO DE RISCO NO PITWALL:</span>
                                        <p className="text-[11px] text-white/50">Nível de segurança na telemetria transmitida nesta rodada.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {['10', '30', '50'].map((val) => {
                                            const activeStake = misc.stake || '10';
                                            const isCurrent = activeStake === val;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setMisc(prev => ({ ...prev, stake: val }))}
                                                    className={`px-3 py-1.5 rounded text-xs font-black tracking-wider transition-all cursor-pointer border ${isCurrent
                                                        ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                        : 'bg-black/40 text-white/60 border-white/15 hover:border-[#fbaa19]'
                                                        }`}
                                                >
                                                    {val}%
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                </div>

            </div>

            {/* BARRA FIXA DE CONFIRMAÇÃO & TRANSMISSÃO (STICKY EXECUTION DOCK) */}
            <footer className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-lg border-t-2 border-[#fbaa19] z-50 p-3 md:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">

                    <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
                        <span className="text-[#fbaa19] font-black hidden sm:inline">&gt;_ ORDENS DE MERCADO:</span>
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            <span className={isPoletimeSet ? "text-emerald-400 font-bold" : "text-white/40"}>
                                POLE: {isPoletimeSet ? 'OK' : '0/1'}
                            </span>
                            <span className="text-white/20">|</span>
                            <span className={isTop10Complete ? "text-emerald-400 font-bold" : "text-white/40"}>
                                TOP10: {countTop10}/10
                            </span>
                            <span className="text-white/20">|</span>
                            <span className={isEvoComplete ? "text-emerald-400 font-bold" : "text-white/40"}>
                                EVO: {countEvo}/5
                            </span>
                            <span className="text-white/20">|</span>
                            <span className={isH2HComplete ? "text-emerald-400 font-bold" : "text-white/40"}>
                                H2H: {countH2H}/{F1_MATCHUPS.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={!isAllComplete || isSubmitting || isSuccess}
                            className={`w-full sm:w-auto px-8 py-3 rounded text-xs md:text-sm font-black uppercase tracking-widest transition-all cursor-pointer border ${isAllComplete
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] hover:bg-white hover:text-black hover:border-white shadow-[0_0_20px_rgba(251,170,25,0.4)]'
                                : 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting
                                ? 'CONSOLIDANDO POSIÇÕES...'
                                : isSuccess
                                    ? '✔ POSIÇÕES AUDITADAS E PROTOCOLADAS!'
                                    : isAllComplete
                                        ? '[ CONSOLIDAR & TRANSMITIR POSIÇÕES AO GRID ]'
                                        : '[ POSIÇÕES PENDENTES DE PREENCHIMENTO ]'}
                        </button>
                    </div>

                </div>
            </footer>



        </main>
    );
}
