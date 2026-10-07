"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useSubmitPrediction } from '@/hooks/useSubmitPrediction';
import { useTeamworkAuto } from '@/hooks/useTeamworkAuto';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import { F1_MATCHUPS, F1_DRIVERS, getDriverDetails } from '@/api/f1-data';
import { PilotAvatar } from '@/components/pilot-avatar';

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

const QUESTIONS = [
    { id: 'q1', text: 'Safety car durante o Grande Prêmio?', options: ['SIM', 'NÃO'] },
    { id: 'q2', text: 'Bandeira vermelha acionada na corrida?', options: ['SIM', 'NÃO'] },
    { id: 'q3', text: 'Algum carro da primeira fila sofrerá DNF?', options: ['SIM', 'NÃO'] },
    { id: 'q4', text: 'Ambas as Ferraris terminarão no TOP 5?', options: ['SIM', 'NÃO'] },
    { id: 'q5', text: 'Volta mais rápida conquistada por M. VERSTAPPEN?', options: ['SIM', 'NÃO'] },
];

const TABS = [
    { id: 'all', label: 'FULL PREDICTION', code: 'ALL', desc: 'Protocolo unificado com todas as ordens de corrida.' },
    { id: 'poletime', label: 'POLETIME', code: 'POLE', desc: 'Previsão de volta mais rápida da classificação até os milésimos.' },
    { id: 'master', label: 'TOP 10 FINISH', code: 'TOP10', desc: 'Ordem exata de chegada dos dez primeiros colocados.' },
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

export default function PredictionTerminalPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [pilot, setPilot] = useState<PilotProfile | null>(null);
    const [hasSyncedFromDb, setHasSyncedFromDb] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<{ type: 'top10' | 'evo', index: number } | null>(null);

    // Conexão com a Store oficial de Predições
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
    const { autoPoletime, autoTop10, autoEvo, autoH2H, isAutoLoading } = useTeamworkAuto();
    const { submit: handleSubmit, isSubmitting, isSuccess } = useSubmitPrediction();

    // 1. Carrega dados do perfil e contrato do piloto logado
    useEffect(() => {
        if (!user) {
            setPilot(null);
            return;
        }

        let isSubscribed = true;
        const fetchPilot = async () => {
            try {
                const [profRes, contractRes] = await Promise.all([
                    supabase.from('profiles').select('first_name, last_name, username, slug, driver_number, avatar_url').eq('id', user.id).maybeSingle(),
                    supabase.from('contracts').select('group_id, teams(name, color)').eq('user_id', user.id).maybeSingle()
                ]);

                if (!isSubscribed) return;

                const prof = profRes.data;
                const contract = contractRes.data;
                const teamInfo = contract?.teams ? (Array.isArray(contract.teams) ? contract.teams[0] : contract.teams) : null;

                const displayName = prof?.first_name && prof?.last_name
                    ? `${prof.first_name} ${prof.last_name}`
                    : (prof?.username || prof?.slug || user.email?.split('@')[0] || 'ESTRATEGISTA');

                setPilot({
                    name: displayName,
                    slug: prof?.slug || null,
                    driverNumber: prof?.driver_number ? String(prof.driver_number) : null,
                    teamName: teamInfo?.name || null,
                    teamColor: teamInfo?.color || '#fbaa19',
                    avatarUrl: prof?.avatar_url || null
                });
            } catch (err) {
                console.error("Erro ao obter dados do piloto:", err);
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
            } catch (e) {
                console.error("Erro ao sincronizar predições:", e);
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

    // Helper ordinal
    const getOrdinal = (n: number) => {
        if (n === 1) return 'P01';
        if (n === 2) return 'P02';
        if (n === 3) return 'P03';
        return `P${n.toString().padStart(2, '0')}`;
    };

    const activeTabMeta = useMemo(() => {
        return TABS.find(t => t.id === activeTab) || TABS[0];
    }, [activeTab]);

    return (
        <main className="w-full min-h-screen relative bg-[#050401] text-white font-mono flex flex-col items-center pb-32 select-none overflow-x-hidden">
            
            {/* Background Pixel Art Imersivo Noir */}
            <img
                src="/pixel_invite_bg_v2.jpg"
                alt="Terminal Background"
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-75 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />
            <div className="fixed inset-0 bg-[#050401]/85 backdrop-blur-[2px] z-0 pointer-events-none" />

            {/* TICKER TAPE SUPERIOR ESTILO BOLSA DE VALORES */}
            <header className="relative z-10 w-full border-b border-[#fbaa19]/25 bg-black/90 backdrop-blur-md px-4 py-2.5 overflow-hidden shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[10px] md:text-xs uppercase tracking-widest">
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#fbaa19]/20 text-[#fbaa19] font-black border border-[#fbaa19]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fbaa19] animate-ping" />
                            PREGÃO: ABERTO
                        </span>
                        <span className="hidden sm:inline text-white/50">|</span>
                        <span className="hidden sm:inline text-white/70">SESSÃO: PRE-RACE ORDERS</span>
                    </div>

                    {/* Ticker contínuo */}
                    <div className="hidden lg:flex items-center gap-6 text-white/60 font-medium overflow-hidden">
                        <span>[MCLAREN $38.4M <span className="text-emerald-400 font-bold">▲ +2.1%</span>]</span>
                        <span>[FERRARI $36.8M <span className="text-red-400 font-bold">▼ -0.8%</span>]</span>
                        <span>[MERCEDES $34.2M <span className="text-emerald-400 font-bold">▲ +1.4%</span>]</span>
                        <span>[RED BULL $35.0M <span className="text-white/40 font-bold">▬ 0.0%</span>]</span>
                        <span>[SPREAD: 0.014s]</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/40">AUDITORIA:</span>
                        <span className="text-[#fbaa19] font-bold">FIA // PITWALL V2</span>
                    </div>
                </div>
            </header>

            {/* CONTAINER PRINCIPAL */}
            <div className="relative z-10 w-full max-w-5xl px-4 md:px-8 mt-6 flex flex-col gap-6">

                {/* 1. HUD DA SUPERLICENÇA / STATUS DO PILOTO */}
                <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative border-2" style={{ borderColor: pilot?.teamColor || '#fbaa19' }}>
                            {pilot?.avatarUrl ? (
                                <img src={pilot.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <PilotAvatar
                                    teamColor={pilot?.teamColor || '#fbaa19'}
                                    driverNumber={pilot?.driverNumber}
                                    variant="team"
                                    size="custom"
                                    showHUD={true}
                                    showBadge={false}
                                    className="w-full h-full"
                                />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-black text-sm md:text-base tracking-wider uppercase">
                                    {pilot?.name || 'ESTRATEGISTA NÃO HOMOLOGADO'}
                                </span>
                                {pilot?.driverNumber && (
                                    <span className="bg-[#fbaa19] text-black text-[10px] font-black px-1.5 py-0.2 rounded">
                                        #{pilot.driverNumber}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                                <span className="font-bold uppercase tracking-wider" style={{ color: pilot?.teamColor || '#fbaa19' }}>
                                    {pilot?.teamName || 'EQUIPE INDEPENDENTE'}
                                </span>
                                <span>•</span>
                                <span className={hasSyncedFromDb ? "text-emerald-400 font-bold" : "text-[#fbaa19] font-bold"}>
                                    {hasSyncedFromDb ? '● SINCRONIZADO NO GRID' : '● SESSÃO LOCAL PRONTA'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                        <Link
                            href="/telemetry"
                            className="text-xs uppercase tracking-widest font-bold px-3.5 py-2 bg-white/5 hover:bg-[#fbaa19]/20 text-white/80 hover:text-[#fbaa19] rounded border border-white/15 hover:border-[#fbaa19]/40 transition-all flex items-center gap-1.5"
                        >
                            <span>[ TELEMETRIA GERAL ]</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                </section>

                {/* 2. HEADER OPERACIONAL / DESPACHO DE PREDIÇÕES */}
                <header className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[#fbaa19] text-xs font-black tracking-[0.2em] uppercase">
                                &gt;_ TERMINAL DE PREDIÇÃO DE PITWALL
                            </span>
                            <span className="text-[#fbaa19] animate-pulse">■</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-white/40">
                            ORDENS DE GP // SESSÃO ATIVA
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider text-white">
                        {activeTabMeta.label}
                    </h1>

                    <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-3xl">
                        {activeTabMeta.desc} Todas as previsões registradas no terminal serão auditadas contra os tempos oficiais de telemetria emitidos pela FIA.
                    </p>
                </header>

                {/* 3. CONTROLE DE ABAS (PITWALL CONSOLE) */}
                <nav aria-label="Abas de Predição" className="w-full bg-black/80 backdrop-blur-md border border-white/15 rounded-lg p-1.5 flex flex-wrap md:flex-nowrap gap-1.5 shadow-xl">
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
                                className={`flex-1 min-w-[130px] p-2.5 rounded flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                                    isActive
                                        ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-lg font-black'
                                        : 'bg-black/40 text-white/70 border-white/5 hover:border-[#fbaa19]/40 hover:text-white font-bold'
                                }`}
                            >
                                <span className="text-[11px] md:text-xs uppercase tracking-wider font-mono">
                                    {tab.label}
                                </span>
                                <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded font-mono ${
                                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                                }`}>
                                    {progress}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* 4. CONTEÚDO DAS ABAS */}
                <div className="flex flex-col gap-10">

                    {/* --- ABA POLETIME --- */}
                    {(activeTab === 'poletime' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                            &gt; - MODALIDADE 01 // VOLTA DA POLE POSITION
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mt-1">
                                        POLETIME // MILÉSIMUS
                                    </h2>
                                    <p className="text-xs text-white/60 mt-1">
                                        Defina o tempo exato da pole nos treinos de qualificação. Clique em cada dígito para incrementar o valor.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setPoletime([0, 0, 0, 0, 0, 0])}
                                        disabled={isAutoLoading || isSubmitting || !isPoletimeSet}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const generated = await autoPoletime();
                                            setPoletime(generated);
                                        }}
                                        disabled={isAutoLoading || isSubmitting}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black border border-[#fbaa19]/40 rounded transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span>&gt;_ AUTO TELEMETRIA</span>
                                    </button>
                                </div>
                            </div>

                            {/* Display do Relógio Analógico Digital */}
                            <div className="flex flex-col items-center justify-center py-8 px-4 bg-black/60 border border-[#fbaa19]/20 rounded-lg">
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

                    {/* --- ABA MASTER (TOP 10 FINISH) --- */}
                    {(activeTab === 'master' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                            &gt; - MODALIDADE 02 // LIGA MASTER
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mt-1">
                                        TOP 10 FINISH // ORDEM DE CHEGADA
                                    </h2>
                                    <p className="text-xs text-white/60 mt-1">
                                        Selecione os 10 pilotos na ordem exata em que cruzarão a linha de chegada no domingo.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setTop10(Array(10).fill(''))}
                                        disabled={isAutoLoading || isSubmitting || countTop10 === 0}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const generated = await autoTop10();
                                            setTop10(generated);
                                        }}
                                        disabled={isAutoLoading || isSubmitting}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black border border-[#fbaa19]/40 rounded transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span>&gt;_ AUTO TOP 10</span>
                                    </button>
                                </div>
                            </div>

                            {/* Grid dos 10 Pilotos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                                {top10.map((driverName, idx) => {
                                    const details = driverName ? getDriverDetails(driverName) : null;
                                    const teamColor = details ? getTeamColor(details.team) : '#fbaa19';
                                    const isOpen = openDropdown?.type === 'top10' && openDropdown.index === idx;

                                    return (
                                        <div key={idx} className="relative">
                                            <div
                                                onClick={() => setOpenDropdown(isOpen ? null : { type: 'top10', index: idx })}
                                                className={`w-full min-h-[3.5rem] rounded border p-3 flex items-center justify-between cursor-pointer transition-all ${
                                                    driverName
                                                        ? 'bg-black/90 border-[#fbaa19]/60 hover:border-[#fbaa19]'
                                                        : 'bg-black/50 border-white/15 hover:border-[#fbaa19]/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-12 h-9 rounded bg-[#fbaa19] text-black font-black text-xs flex items-center justify-center shrink-0 tracking-wider">
                                                        {getOrdinal(idx + 1)}
                                                    </span>

                                                    {details ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm md:text-base tracking-wider uppercase text-white">
                                                                    {details.name}
                                                                </span>
                                                                <span className="text-xs font-black px-1.5 py-0.2 rounded" style={{ backgroundColor: `${teamColor}25`, color: teamColor }}>
                                                                    #{details.num}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50" style={{ color: `${teamColor}bb` }}>
                                                                {details.team}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                                                            &gt; SELECIONAR PILOTO
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-[#fbaa19] text-xs font-bold">
                                                    {isOpen ? '▲' : '▼'}
                                                </span>
                                            </div>

                                            {/* Dropdown Menu Noir */}
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
                                                                className={`w-full p-2.5 px-3 flex items-center justify-between text-left border-b border-white/5 transition-colors cursor-pointer ${
                                                                    isSelected && driverName !== dName
                                                                        ? 'opacity-30 cursor-not-allowed bg-black/40'
                                                                        : 'hover:bg-[#fbaa19]/20'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-white uppercase">{dInfo.name}</span>
                                                                    <span className="text-[10px] font-black px-1 py-0.2 rounded" style={{ backgroundColor: `${dColor}25`, color: dColor }}>
                                                                        #{dInfo.num}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] uppercase tracking-widest" style={{ color: dColor }}>
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

                    {/* --- ABA EVO (ESCALADA DE GRID) --- */}
                    {(activeTab === 'evo' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                            &gt; - MODALIDADE 03 // EVOLUÇÃO DE CORRIDA
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mt-1">
                                        EVO // MAIOR GANHO DE POSIÇÕES (TOP 5)
                                    </h2>
                                    <p className="text-xs text-white/60 mt-1">
                                        Indique os 5 pilotos que mais ultrapassarão carros e escalarão o pelotão durante o GP.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setEvo(Array(5).fill(''))}
                                        disabled={isAutoLoading || isSubmitting || countEvo === 0}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const generated = await autoEvo();
                                            setEvo(generated);
                                        }}
                                        disabled={isAutoLoading || isSubmitting}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black border border-[#fbaa19]/40 rounded transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span>&gt;_ AUTO EVO</span>
                                    </button>
                                </div>
                            </div>

                            {/* Grid dos 5 Pilotos de Evo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                                {evo.map((driverName, idx) => {
                                    const details = driverName ? getDriverDetails(driverName) : null;
                                    const teamColor = details ? getTeamColor(details.team) : '#fbaa19';
                                    const isOpen = openDropdown?.type === 'evo' && openDropdown.index === idx;

                                    return (
                                        <div key={idx} className="relative">
                                            <div
                                                onClick={() => setOpenDropdown(isOpen ? null : { type: 'evo', index: idx })}
                                                className={`w-full min-h-[3.5rem] rounded border p-3 flex items-center justify-between cursor-pointer transition-all ${
                                                    driverName
                                                        ? 'bg-black/90 border-[#fbaa19]/60 hover:border-[#fbaa19]'
                                                        : 'bg-black/50 border-white/15 hover:border-[#fbaa19]/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-16 h-9 rounded bg-[#fbaa19] text-black font-black text-xs flex items-center justify-center shrink-0 tracking-wider">
                                                        EVO {idx + 1}
                                                    </span>

                                                    {details ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm md:text-base tracking-wider uppercase text-white">
                                                                    {details.name}
                                                                </span>
                                                                <span className="text-xs font-black px-1.5 py-0.2 rounded" style={{ backgroundColor: `${teamColor}25`, color: teamColor }}>
                                                                    #{details.num}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50" style={{ color: `${teamColor}bb` }}>
                                                                {details.team}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                                                            &gt; SELECIONAR PILOTO
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-[#fbaa19] text-xs font-bold">
                                                    {isOpen ? '▲' : '▼'}
                                                </span>
                                            </div>

                                            {/* Dropdown Menu Noir */}
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
                                                                className={`w-full p-2.5 px-3 flex items-center justify-between text-left border-b border-white/5 transition-colors cursor-pointer ${
                                                                    isSelected && driverName !== dName
                                                                        ? 'opacity-30 cursor-not-allowed bg-black/40'
                                                                        : 'hover:bg-[#fbaa19]/20'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-white uppercase">{dInfo.name}</span>
                                                                    <span className="text-[10px] font-black px-1 py-0.2 rounded" style={{ backgroundColor: `${dColor}25`, color: dColor }}>
                                                                        #{dInfo.num}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] uppercase tracking-widest" style={{ color: dColor }}>
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

                    {/* --- ABA HEAD TO HEAD (DUELOS TÁTICOS) --- */}
                    {(activeTab === 'h2h' || activeTab === 'all') && (
                        <section className="w-full bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                            &gt; - MODALIDADE 04 // DUELOS DE BOX
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mt-1">
                                        HEAD TO HEAD // CONFRONTOS DIRETOS
                                    </h2>
                                    <p className="text-xs text-white/60 mt-1">
                                        Aponte o piloto que cruzará na frente de seu próprio companheiro de escuderia em cada uma das 11 equipes.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setH2H({})}
                                        disabled={isAutoLoading || isSubmitting || countH2H === 0}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 hover:bg-red-950/40 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        [ LIMPAR ]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const generated = await autoH2H();
                                            setH2H(generated);
                                        }}
                                        disabled={isAutoLoading || isSubmitting}
                                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black border border-[#fbaa19]/40 rounded transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span>&gt;_ AUTO DUELOS</span>
                                    </button>
                                </div>
                            </div>

                            {/* Lista dos 11 Confrontos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {F1_MATCHUPS.map((match) => {
                                    const currentPick = h2h[match.id];
                                    const teamColor = getTeamColor(match.team);

                                    return (
                                        <article key={match.id} className="bg-black/80 border border-white/15 rounded overflow-hidden flex flex-col hover:border-[#fbaa19]/40 transition-all">
                                            {/* Cabeçalho da Equipe */}
                                            <div className="px-3 py-1.5 bg-black/90 border-b border-white/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                                                <span style={{ color: teamColor }}>
                                                    &gt; {match.team.toUpperCase()}
                                                </span>
                                                <span className="text-white/40 text-[9px]">
                                                    {currentPick ? 'ORDEM DEFINIDA' : 'PENDENTE'}
                                                </span>
                                            </div>

                                            {/* Dois Pilotos */}
                                            <div className="grid grid-cols-2 divide-x divide-white/10">
                                                {[match.d1, match.d2].map((driver) => {
                                                    const isChosen = currentPick === driver.num;

                                                    return (
                                                        <button
                                                            key={driver.num}
                                                            type="button"
                                                            onClick={() => setH2H(prev => ({ ...prev, [match.id]: driver.num }))}
                                                            className={`p-3 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                                                isChosen
                                                                    ? 'bg-[#fbaa19] text-black font-black'
                                                                    : 'bg-black/40 text-white hover:bg-white/5 font-bold'
                                                            }`}
                                                        >
                                                            <span className="text-xs md:text-sm tracking-wider uppercase">
                                                                {driver.name}
                                                            </span>
                                                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                                                isChosen ? 'bg-black/20 text-black' : 'bg-white/10 text-[#fbaa19]'
                                                            }`}>
                                                                #{driver.num} {isChosen && '✔'}
                                                            </span>
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase">
                                            &gt; - MODALIDADE 05 // EVENT PROPS
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mt-1">
                                        TELEMETRIA ADICIONAL & CONDIÇÕES DE PISTA
                                    </h2>
                                    <p className="text-xs text-white/60 mt-1">
                                        Responda às questões táticas da prova e ajuste sua alocação de confiança de pitwall.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
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
                                                            className={`px-6 py-2 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${
                                                                isSelected
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
                                        {['10', '25', '50', '100'].map((val) => {
                                            const activeStake = misc.stake || '10';
                                            const isCurrent = activeStake === val;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setMisc(prev => ({ ...prev, stake: val }))}
                                                    className={`px-3 py-1.5 rounded text-xs font-black tracking-wider transition-all cursor-pointer border ${
                                                        isCurrent
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
                        <span className="text-[#fbaa19] font-black hidden sm:inline">&gt;_ ORDENS DE GRID:</span>
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
                            className={`w-full sm:w-auto px-8 py-3 rounded text-xs md:text-sm font-black uppercase tracking-widest transition-all cursor-pointer border ${
                                isAllComplete
                                    ? 'bg-[#fbaa19] text-black border-[#fbaa19] hover:bg-white hover:text-black hover:border-white shadow-[0_0_20px_rgba(251,170,25,0.4)]'
                                    : 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting
                                ? 'TRANSMITINDO ORDENS...'
                                : isSuccess
                                ? '✔ ORDENS AUDITADAS E SALVAS!'
                                : isAllComplete
                                ? '[ CONFIRMAR & TRANSMITIR ORDENS AO GRID ]'
                                : '[ ORDENS PENDENTES DE PREENCHIMENTO ]'}
                        </button>
                    </div>

                </div>
            </footer>

        </main>
    );
}
