"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { fetchNextEvent, F1Event, F1_MATCHUPS, getDriverDetails } from '@/api/f1-data';
import { PilotAvatar } from '@/components/pilot-avatar';
import MasterRankingsTable from '@/components/master-rankings-table';

interface UserTeam {
    name: string;
    code: string;
    color: string;
    groupId?: number;
}

interface ProfileData {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    slug?: string | null;
    driver_number?: number | string | null;
    avatar_url?: string | null;
    team?: UserTeam | null;
}

interface PredictionData {
    id: string;
    user_id: string;
    round: string;
    poletime: string;
    top10: string[];
    evo: string[];
    h2h: Record<string, string>;
    misc: Record<string, string>;
    created_at: string;
    profile?: ProfileData | null;
}

const QUESTIONS = [
    { id: 'q1', text: 'Safety car during the race?' },
    { id: 'q2', text: 'Red flag during the race?' },
    { id: 'q3', text: 'Will L.SARGEANT DNF?' },
    { id: 'q4', text: 'Will both Ferraris finish in top 5?' },
    { id: 'q5', text: 'M.VERSTAPPEN fastest lap?' },
];

const getTeamColor = (team: string) => {
    switch (team) {
        case 'McLaren': return '#FF8000';
        case 'Ferrari': return '#E8002D';
        case 'Mercedes': return '#27F4D2';
        case 'Red Bull':
        case 'Red Bull Racing': return '#3671C6';
        case 'Aston Martin': return '#229971';
        case 'Alpine': return '#0093cc';
        case 'Haas': return '#B6BABD';
        case 'Racing Bulls':
        case 'RB': return '#6692FF';
        case 'Cadillac': return '#FFB800';
        case 'Williams': return '#64C4FF';
        case 'Audi':
        case 'Audi/Sauber':
        case 'Sauber': return '#52e252';
        default: return '#777777';
    }
};

// Resolves driver pick by either driver name (e.g. 'O.PIASTRI') or driver number (e.g. '81')
const resolveDriverInfo = (rawPick: string) => {
    if (!rawPick || rawPick === 'TBD' || rawPick === '') {
        return { short: '-', color: '#555', fullName: '' };
    }

    // 1. Match by driver number in matchups (common in H2H)
    for (const match of F1_MATCHUPS) {
        if (match.d1.num === rawPick) {
            const parts = match.d1.name.split('.');
            const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : match.d1.name.substring(0, 3).toUpperCase();
            return { short, color: getTeamColor(match.team), fullName: `${match.d1.name} (#${match.d1.num})` };
        }
        if (match.d2.num === rawPick) {
            const parts = match.d2.name.split('.');
            const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : match.d2.name.substring(0, 3).toUpperCase();
            return { short, color: getTeamColor(match.team), fullName: `${match.d2.name} (#${match.d2.num})` };
        }
    }

    // 2. Match by driver name in matchups
    for (const match of F1_MATCHUPS) {
        if (match.d1.name === rawPick) {
            const parts = match.d1.name.split('.');
            const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : match.d1.name.substring(0, 3).toUpperCase();
            return { short, color: getTeamColor(match.team), fullName: match.d1.name };
        }
        if (match.d2.name === rawPick) {
            const parts = match.d2.name.split('.');
            const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : match.d2.name.substring(0, 3).toUpperCase();
            return { short, color: getTeamColor(match.team), fullName: match.d2.name };
        }
    }

    // 3. Fallback to standard driver details
    const details = getDriverDetails(rawPick);
    const color = details.team ? getTeamColor(details.team) : '#777';
    const parts = rawPick.split('.');
    const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : rawPick.substring(0, 3).toUpperCase();
    return { short, color, fullName: rawPick };
};

const getDisplayName = (prof?: ProfileData | null, fallbackUserId?: string) => {
    if (!prof) {
        return fallbackUserId ? `Pilot #${fallbackUserId.substring(0, 6)}` : 'UNKNOWN';
    }
    const first = (prof.first_name || '').trim();
    const last = (prof.last_name || '').trim();
    if (first && last) {
        return `${first.charAt(0)}. ${last}`;
    }
    if (first) return first;
    if (last) return last;
    if (prof.username) return prof.username;
    if (prof.slug) return prof.slug.replace(/^@/, '');
    return `Pilot #${prof.id.substring(0, 6)}`;
};

export default function TelemetryPage() {
    const [predictions, setPredictions] = useState<PredictionData[]>([]);
    const [eventData, setEventData] = useState<F1Event | null>(null);
    const [activeMisc, setActiveMisc] = useState('q1');
    const [loading, setLoading] = useState(true);

    const [realResults, setRealResults] = useState<string[]>(Array(10).fill('TBD'));
    const [realPoletime, setRealPoletime] = useState<string>('TBD');

    useEffect(() => {
        let isCancelled = false;

        const loadData = async () => {
            setLoading(true);

            // 1. Fetch Event & Global Settings
            try {
                const [event, { data: settings }] = await Promise.all([
                    fetchNextEvent(),
                    supabase.from('global_settings').select('value').eq('id', 'active_misc').single()
                ]);
                if (!isCancelled) {
                    setEventData(event);
                    if (settings?.value?.question_id) setActiveMisc(settings.value.question_id);
                }
            } catch (e) {
                console.error("Error fetching event/settings", e);
            }

            // 2. Fetch Predictions
            const { data: preds, error } = await supabase
                .from('predictions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao buscar telemetria", error);
                if (!isCancelled) setLoading(false);
                return;
            }

            // 3. Fetch Profiles and Contracts for those predictions
            if (preds && preds.length > 0) {
                const userIds = [...new Set(preds.map(p => p.user_id))];

                const [profilesRes, contractsRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, first_name, last_name, username, slug, driver_number, avatar_url')
                        .in('id', userIds),
                    supabase
                        .from('contracts')
                        .select('user_id, group_id, teams(id, name, code, color)')
                        .in('user_id', userIds)
                ]);

                // Map contracts to users
                const contractsMap = new Map<string, UserTeam>();
                if (contractsRes.data) {
                    contractsRes.data.forEach((c: any) => {
                        const t = Array.isArray(c.teams) ? c.teams[0] : c.teams;
                        if (t) {
                            contractsMap.set(c.user_id, {
                                name: t.name,
                                code: t.code || t.name.substring(0, 3).toUpperCase(),
                                color: t.color || getTeamColor(t.name),
                                groupId: c.group_id
                            });
                        }
                    });
                }

                // Map profiles to users
                const profilesMap = new Map<string, ProfileData>();
                if (profilesRes.data) {
                    profilesRes.data.forEach((p: any) => {
                        const team = contractsMap.get(p.id) || null;
                        profilesMap.set(p.id, {
                            ...p,
                            team
                        });
                    });
                }

                const enrichedPreds: PredictionData[] = preds.map(p => ({
                    ...p,
                    profile: profilesMap.get(p.user_id) || null
                }));

                if (!isCancelled) {
                    setPredictions(enrichedPreds);
                }
            } else {
                if (!isCancelled) {
                    setPredictions([]);
                }
            }

            if (!isCancelled) {
                setLoading(false);
            }
        };

        loadData();

        return () => {
            isCancelled = true;
        };
    }, []);

    const activeQuestionText = QUESTIONS.find(q => q.id === activeMisc)?.text || 'MISC';

    // Summary stats
    const totalUsers = predictions.length;
    const teamsRepresented = new Set(
        predictions.map(p => p.profile?.team?.name).filter(Boolean)
    ).size;

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-0 pb-24 overflow-x-hidden font-sans">

            {/* HERO SECTION */}
            <section className="relative w-full h-[40vh] md:h-[48vh] min-h-[320px] flex items-end pb-8">
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src="/f1_hero_banner.jpg"
                        alt="F1 Telemetry"
                        className="w-full h-full object-cover opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-transparent" />
                </div>

                <div className="relative z-10 w-full px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-[#fbaa19] text-black font-black uppercase px-3 py-1 text-xs md:text-sm tracking-widest">
                            LIVE TELEMETRY
                        </span>
                        {eventData && (
                            <span className="bg-white/10 text-white font-bold uppercase px-3 py-1 text-xs md:text-sm tracking-widest border border-white/20">
                                ROUND {eventData.round}
                            </span>
                        )}
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs uppercase font-mono font-bold tracking-wider">
                            {totalUsers} {totalUsers === 1 ? 'PILOT ON GRID' : 'PILOTS ON GRID'}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-6xl font-black uppercase tracking-widest font-display text-white mt-1 drop-shadow-xl">
                        {eventData ? eventData.name : 'LOADING GRAND PRIX...'}
                    </h1>

                    <div className="flex flex-wrap gap-4 md:gap-8 mt-2 text-gray-400 font-mono text-xs md:text-sm uppercase">
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">CIRCUIT</span>
                            <span className="text-gray-200">{eventData ? eventData.circuit : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">RACE TIME</span>
                            <span className="text-gray-200">{eventData ? `${eventData.date} | ${eventData.time}` : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">DEADLINE (Q1)</span>
                            <span className="text-gray-200">{eventData && eventData.qualiDate && eventData.qualiTime ? (() => { const d = new Date(`${eventData.qualiDate}T${eventData.qualiTime}`); return `${d.toLocaleDateString("en-US", { weekday: "short" })} | ${d.toLocaleDateString("en-US")} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`; })() : "TBD"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">TEAMS ACTIVE</span>
                            <span className="text-emerald-400 font-bold">{teamsRepresented} TEAMS</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* TABELA MASTER & ROUNDS INSPIRADA NA GLOBO.COM (USUÁRIOS FANTASY) */}
            <MasterRankingsTable />

            {/* GRID DE PROGNÓSTICOS NO MESMO PADRÃO ESTÉTICO GLOBO.COM */}
            <section className="w-full px-4 md:px-8 max-w-7xl mx-auto my-8 font-sans selection:bg-[#fbaa19] selection:text-black animate-fade-in">
                <div className="bg-[#0a0c0f] border border-white/10 rounded-md p-5 sm:p-6 shadow-2xl flex flex-col">

                    {/* HEADER: TÍTULO, STATUS E AÇÕES */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-display">
                                GRID DE PROGNÓSTICOS
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30 uppercase font-mono">
                                TELEMETRIA DA ETAPA
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{totalUsers} {totalUsers === 1 ? 'estrategista ativo' : 'estrategistas ativos'}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/positions"
                                className="bg-[#fbaa19] text-black px-4 py-2 font-black uppercase tracking-wider text-xs hover:bg-white transition-colors rounded-xs shadow-md font-sans"
                            >
                                + Lançar / Editar Posições
                            </Link>
                            <Link
                                href="/pitwall"
                                className="border border-white/15 text-gray-300 hover:text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors rounded-xs font-sans"
                            >
                                Pit Wall &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* CONTAINER DA TABELA (SCROLL HORIZONTAL RESPONSIVO) */}
                    <div className="w-full overflow-x-auto relative custom-scrollbar rounded border border-white/5 bg-black/40">
                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full border-3 border-t-transparent border-[#fbaa19] animate-spin mb-3"></div>
                                <p className="font-bold tracking-widest uppercase text-xs text-gray-400 font-mono">SINCRONIZANDO TELEMETRIA DOS ESTRATEGISTAS...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1720px]">
                                {/* THEAD NO PADRÃO GLOBO.COM */}
                                <thead className="bg-[#0e1217] border-b border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-20">
                                    <tr>
                                        {/* Colunas Fixas (Sticky) */}
                                        <th className="py-3 px-3 text-center w-12 sticky left-0 bg-[#0e1217] z-30 border-r border-white/10">POS</th>
                                        <th className="py-3 px-4 min-w-[260px] sticky left-12 bg-[#0e1217] z-30 border-r border-white/10">ESTRATEGISTA / PILOTO</th>

                                        {/* Poletime */}
                                        <th className="py-3 px-3 text-center w-32 border-r border-white/10 bg-white/[0.02]">POLETIME</th>

                                        {/* Top 10 (Master) */}
                                        <th colSpan={10} className="py-3 px-3 text-center border-r border-white/10 bg-white/[0.01]">
                                            TOP 10 FINISH (MASTER)
                                        </th>

                                        {/* Evolution (+Pos) */}
                                        <th colSpan={5} className="py-3 px-3 text-center border-r border-white/10 bg-white/[0.02]">
                                            EVOLUTION (+POS)
                                        </th>

                                        {/* Head-to-Head (11 Duelos) */}
                                        <th colSpan={11} className="py-3 px-3 text-center border-r border-white/10 bg-white/[0.01]">
                                            HEAD-TO-HEAD (DUELOS)
                                        </th>

                                        {/* Misc */}
                                        <th className="py-3 px-4 text-center border-r border-white/10 bg-white/[0.02] max-w-[200px] truncate" title={activeQuestionText}>
                                            MISC ({activeQuestionText})
                                        </th>

                                        {/* Timestamp */}
                                        <th className="py-3 px-4 text-center w-28">ENVIO</th>
                                    </tr>

                                    {/* LINHA DE SUB-HEADER / REFERÊNCIA OFICIAL (PADRÃO GLOBO) */}
                                    <tr className="border-t border-white/10 text-[9px] bg-[#0c1015] text-gray-400 font-mono">
                                        <th className="py-2 px-3 sticky left-0 bg-[#0c1015] z-30 border-r border-white/10 text-center">
                                            <span className="text-[#fbaa19] font-black">★</span>
                                        </th>
                                        <th className="py-2 px-4 sticky left-12 bg-[#0c1015] z-30 border-r border-white/10 text-right pr-4 font-bold text-[#fbaa19] tracking-wider">
                                            RESULTADO OFICIAL &rarr;
                                        </th>

                                        {/* Poletime Real */}
                                        <th className="py-2 px-3 border-r border-white/10 text-center text-emerald-400 font-bold bg-white/[0.02] tabular-nums">
                                            {realPoletime}
                                        </th>

                                        {/* 10 Posições Oficiais */}
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <th key={`real-p${i + 1}`} className="py-2 px-1 border-r border-white/5 text-center text-white/90 font-bold">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] text-gray-500 font-mono">P{i + 1}</span>
                                                    <span>{realResults[i]}</span>
                                                </div>
                                            </th>
                                        ))}

                                        {/* Evo 1..5 Sub-header */}
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <th key={`real-evo-${i + 1}`} className="py-2 px-1 border-r border-white/5 text-center text-gray-500 bg-white/[0.02]">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] text-gray-500 font-mono">E{i + 1}</span>
                                                    <span>TBD</span>
                                                </div>
                                            </th>
                                        ))}

                                        {/* H2H 1..11 Sub-header */}
                                        {Array.from({ length: 11 }).map((_, i) => {
                                            const matchInfo = F1_MATCHUPS[i];
                                            const teamShort = matchInfo ? matchInfo.team.substring(0, 3).toUpperCase() : `M${i + 1}`;
                                            return (
                                                <th key={`real-h2h-${i + 1}`} className="py-2 px-1 border-r border-white/5 text-center text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] text-gray-400 font-mono">{teamShort}</span>
                                                        <span>TBD</span>
                                                    </div>
                                                </th>
                                            );
                                        })}

                                        {/* Misc */}
                                        <th className="py-2 px-3 border-r border-white/10 text-center text-gray-500 bg-white/[0.02]">
                                            TBD
                                        </th>

                                        {/* Data */}
                                        <th className="py-2 px-3 text-center text-gray-500">
                                            -
                                        </th>
                                    </tr>
                                </thead>

                                {/* TBODY NO PADRÃO GLOBO.COM (DIVIDE-Y, LINHAS LIMPAS, HOVER SUAVE) */}
                                <tbody className="divide-y divide-white/5 text-xs font-mono">
                                    {predictions.length === 0 ? (
                                        <tr>
                                            <td colSpan={31} className="py-16 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <span className="text-base font-bold uppercase text-[#fbaa19] tracking-wider font-display">
                                                        Nenhum prognóstico registrado para esta etapa
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-sans max-w-md">
                                                        Seja o primeiro estrategista a lançar previsões de Poletime, Top 10 e duelos internos no grid!
                                                    </span>
                                                    <Link 
                                                        href="/positions" 
                                                        className="mt-3 px-5 py-2 bg-[#fbaa19] text-black font-black uppercase tracking-wider text-xs rounded-xs hover:bg-white transition-colors font-sans"
                                                    >
                                                        Abrir Formulário de Posições &rarr;
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        predictions.map((pred, idx) => {
                                            const prof = pred.profile;
                                            const driverName = getDisplayName(prof, pred.user_id);
                                            const driverNum = prof?.driver_number ? String(prof.driver_number) : null;
                                            const team = prof?.team;
                                            const teamColor = team?.color || '#555555';
                                            const teamName = team?.name || 'Equipe Independente';
                                            const teamGroup = team?.groupId ? `G${team.groupId}` : null;

                                            // Dashboard Link
                                            const dashboardSlug = prof?.slug 
                                                ? (prof.slug.startsWith('@') ? prof.slug : `@${prof.slug}`)
                                                : null;

                                            const miscAns = pred.misc?.[activeMisc] || '-';
                                            const miscStake = pred.misc?.stake || '10';
                                            const displayMisc = miscAns !== '-' ? `${miscAns} [${miscStake}%]` : '-';

                                            const isPodiumZone = idx < 3;
                                            const isTop10 = idx < 10;

                                            return (
                                                <tr key={pred.id} className="hover:bg-white/[0.03] transition-colors group">
                                                    {/* Sticky Col 1: POS (Padrão Globo.com com destaque azul para pódio e ciano para top 10) */}
                                                    <td className="py-2.5 px-3 sticky left-0 bg-[#0a0c0f] group-hover:bg-[#12161c] z-10 border-r border-white/10 text-center">
                                                        <span className={`w-5 inline-block text-center font-black ${
                                                            isPodiumZone ? 'text-[#3874ff] text-sm' : isTop10 ? 'text-cyan-400 font-bold' : 'text-gray-400'
                                                        }`}>
                                                            {idx + 1}
                                                        </span>
                                                    </td>

                                                    {/* Sticky Col 2: ESTRATEGISTA / PILOTO (Tarja de cor + Avatar + Nome no padrão GloboEsporte) */}
                                                    <td className="py-2.5 px-4 sticky left-12 bg-[#0a0c0f] group-hover:bg-[#12161c] z-10 border-r border-white/10">
                                                        <div className="flex items-center gap-3">
                                                            {/* Tarja vertical da Escuderia */}
                                                            <span 
                                                                className="w-1.5 h-6 rounded-full shrink-0" 
                                                                style={{ backgroundColor: teamColor }} 
                                                            />

                                                            {/* Avatar do Piloto */}
                                                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/60 border border-white/15">
                                                                {prof?.avatar_url ? (
                                                                    <img src={prof.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <PilotAvatar
                                                                        teamColor={teamColor}
                                                                        driverNumber={driverNum}
                                                                        variant="team"
                                                                        size="custom"
                                                                        showHUD={false}
                                                                        showBadge={false}
                                                                        className="w-full h-full"
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* Nome e Escuderia */}
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    {dashboardSlug ? (
                                                                        <Link 
                                                                            href={`/nc/${dashboardSlug}`}
                                                                            className="font-bold text-white group-hover:text-[#fbaa19] tracking-wide whitespace-nowrap transition-colors flex items-center gap-1 font-sans text-xs"
                                                                            title={`Visitar cockpit de ${driverName}`}
                                                                        >
                                                                            <span>{driverName}</span>
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="font-bold text-white tracking-wide whitespace-nowrap font-sans text-xs">
                                                                            {driverName}
                                                                        </span>
                                                                    )}

                                                                    {driverNum && (
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">
                                                                            #{driverNum}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-[9px] tracking-wider uppercase">
                                                                    <span className="font-bold truncate max-w-[130px]" style={{ color: teamColor }}>
                                                                        {teamName}
                                                                    </span>
                                                                    {teamGroup && (
                                                                        <span className="text-gray-500 font-mono">
                                                                            ({teamGroup})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* POLETIME (Badge elegante) */}
                                                    <td className="py-2.5 px-3 border-r border-white/10 text-center bg-white/[0.02]">
                                                        <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded tabular-nums">
                                                            {pred.poletime || '--:--.---'}
                                                        </span>
                                                    </td>

                                                    {/* MASTER TOP 10 (Chips coloridos sutis) */}
                                                    {Array.from({ length: 10 }).map((_, i) => {
                                                        const rawPick = pred.top10?.[i] || '';
                                                        const { short, color, fullName } = resolveDriverInfo(rawPick);
                                                        const isLast = i === 9;
                                                        return (
                                                            <td 
                                                                key={`m-${i}`} 
                                                                title={fullName ? `P${i+1}: ${fullName}` : undefined}
                                                                className={`py-2 px-1 text-center font-mono text-[11px] font-bold ${isLast ? 'border-r border-white/10' : 'border-r border-white/5'}`}
                                                            >
                                                                {short !== '-' ? (
                                                                    <span 
                                                                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                                                                        style={{ 
                                                                            backgroundColor: `${color}18`, 
                                                                            color: color,
                                                                            border: `1px solid ${color}35`
                                                                        }}
                                                                    >
                                                                        {short}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* EVO (5) */}
                                                    {Array.from({ length: 5 }).map((_, i) => {
                                                        const rawPick = pred.evo?.[i] || '';
                                                        const { short, color, fullName } = resolveDriverInfo(rawPick);
                                                        const isLast = i === 4;
                                                        return (
                                                            <td 
                                                                key={`e-${i}`} 
                                                                title={fullName ? `Evo #${i+1}: ${fullName}` : undefined}
                                                                className={`py-2 px-1 text-center font-mono text-[11px] font-bold bg-white/[0.01] ${isLast ? 'border-r border-white/10' : 'border-r border-white/5'}`}
                                                            >
                                                                {short !== '-' ? (
                                                                    <span 
                                                                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                                                                        style={{ 
                                                                            backgroundColor: `${color}18`, 
                                                                            color: color,
                                                                            border: `1px solid ${color}35`
                                                                        }}
                                                                    >
                                                                        {short}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* H2H (11) */}
                                                    {Array.from({ length: 11 }).map((_, i) => {
                                                        const matchInfo = F1_MATCHUPS[i];
                                                        const matchTitle = matchInfo ? `${matchInfo.team}: ${matchInfo.d1.name} vs ${matchInfo.d2.name}` : `Matchup ${i + 1}`;
                                                        const matchId = `m${i + 1}`;
                                                        const rawPick = pred.h2h?.[matchId] || '';
                                                        const { short, color, fullName } = resolveDriverInfo(rawPick);
                                                        const isLast = i === 10;
                                                        return (
                                                            <td 
                                                                key={`h-${i}`} 
                                                                title={`${matchTitle}${fullName ? ` → Escolha: ${fullName}` : ''}`} 
                                                                className={`py-2 px-1 text-center font-mono text-[11px] font-bold cursor-help ${isLast ? 'border-r border-white/10' : 'border-r border-white/5'}`}
                                                            >
                                                                {short !== '-' ? (
                                                                    <span 
                                                                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                                                                        style={{ 
                                                                            backgroundColor: `${color}18`, 
                                                                            color: color,
                                                                            border: `1px solid ${color}35`
                                                                        }}
                                                                    >
                                                                        {short}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* MISC */}
                                                    <td className="py-2.5 px-3 border-r border-white/10 text-center bg-white/[0.02]">
                                                        <span className="text-[#fbaa19] font-bold text-[11px] font-mono">
                                                            {displayMisc}
                                                        </span>
                                                    </td>

                                                    {/* TIMESTAMP */}
                                                    <td className="py-2.5 px-3 text-center text-gray-500 text-[10px] whitespace-nowrap group-hover:text-white transition-colors">
                                                        {new Date(pred.created_at).toLocaleString('pt-BR', {
                                                            day: '2-digit', month: '2-digit',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* LEGENDA INFERIOR NO PADRÃO GLOBO.COM */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-[11px] text-gray-400 font-mono mt-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#3874ff]" />
                                <span className="text-white/80">Zona de Pódio (P1-P3)</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                                <span className="text-white/80">Top 10 Pontuável</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#fbaa19]" />
                                <span className="text-white/80">Prognóstico Oficial</span>
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                            BAEFF1 TELEMETRY PROTOCOL // GLOBO MATRIX
                        </span>
                    </div>

                </div>

                {/* NAVEGAÇÃO RÁPIDA INFERIOR */}
                <div className="mt-6 flex justify-end gap-3 flex-wrap">
                    <Link href="/f1" className="border border-white/15 text-gray-300 hover:text-white px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-white/5 transition-colors rounded-xs font-sans">
                        F1 Hub
                    </Link>
                    <Link href="/pitwall" className="border border-white/15 text-gray-300 hover:text-white px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-white/5 transition-colors rounded-xs font-sans">
                        Pit Wall
                    </Link>
                    <Link href="/positions" className="bg-[#fbaa19] text-black px-5 py-2 font-black uppercase tracking-wider text-xs hover:bg-white transition-colors rounded-xs font-sans shadow-md">
                        Lançar / Editar Posições &rarr;
                    </Link>
                </div>
            </section>
        </main>
    );
}
