"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { fetchNextEvent, F1Event, F1_MATCHUPS, getDriverDetails } from '@/api/f1-data';
import { PilotAvatar } from '@/components/pilot-avatar';

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

            {/* DATA CENTER TABLE */}
            <section className="w-full px-4 md:px-8 max-w-7xl mx-auto mt-6">

                {/* HEADER ACTIONS */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-gray-300 font-bold">
                            Grid de Previsões Oficiais dos Usuários
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/positions"
                            className="bg-[#fbaa19] text-black px-4 py-2 font-black uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-sm shadow-md"
                        >
                            + Lançar / Editar Posições
                        </Link>
                        <Link
                            href="/pitwall"
                            className="bg-white/5 border border-white/20 text-gray-300 hover:text-white px-4 py-2 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-sm"
                        >
                            Pit Wall
                        </Link>
                    </div>
                </div>

                <div className="w-full overflow-x-auto bg-[#0a0a0a] rounded-sm border border-[#222] shadow-2xl relative custom-scrollbar">
                    {loading ? (
                        <div className="p-24 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[#fbaa19] animate-spin mb-4"></div>
                            <p className="font-bold tracking-widest uppercase text-sm text-[#fbaa19] font-mono">SINCRONIZANDO TELEMETRIA DOS PILOTOS...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1700px]">
                            {/* THEAD */}
                            <thead className="bg-[#111] border-b-2 border-[#fbaa19] text-[10px] uppercase tracking-widest text-gray-400 font-mono sticky top-0 z-20 shadow-md">
                                <tr>
                                    {/* Sticky Headers */}
                                    <th className="p-4 sticky left-0 bg-[#111] z-30 w-16 border-r border-[#333] text-center">POS</th>
                                    <th className="p-4 sticky left-16 bg-[#111] z-30 min-w-[260px] border-r-4 border-r-[#fbaa19]">ESTRATEGISTA / PILOTO</th>

                                    <th className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a]">POLETIME</th>

                                    {/* Master P1-P10 */}
                                    <th colSpan={10} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#151515]">TOP 10 (MASTER)</th>

                                    {/* Evo */}
                                    <th colSpan={5} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a]">EVOLUTION (+POS)</th>

                                    {/* H2H (11) */}
                                    <th colSpan={11} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#151515]">HEAD-TO-HEAD (DUELOS)</th>

                                    {/* Misc */}
                                    <th className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a] max-w-[180px] truncate" title={activeQuestionText}>MISC ({activeQuestionText})</th>

                                    <th className="p-4 text-center bg-[#111]">TIMESTAMP</th>
                                </tr>
                                <tr className="border-t border-[#333] text-[9px] bg-[#0a0a0a]">
                                    <th className="p-2 sticky left-0 bg-[#0a0a0a] z-30 border-r border-[#333]"></th>
                                    <th className="p-2 sticky left-16 bg-[#0a0a0a] z-30 border-r-4 border-r-[#fbaa19] text-right pr-4 text-[#fbaa19] opacity-70 tracking-widest font-bold">RESULTADO REAL &rarr;</th>

                                    <th className="p-2 border-r-4 border-r-[#fbaa19] text-center text-[#00ff00] font-bold">{realPoletime}</th>

                                    {/* Render 10 slots for Master actuals */}
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <th key={`real-p${i + 1}`} className="p-2 border-r border-[#333] text-center text-white font-bold bg-[#1a1a1a]">
                                            {realResults[i]}
                                        </th>
                                    ))}

                                    <th colSpan={5} className="p-2 border-l-2 border-l-[#fbaa19] border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>
                                    <th colSpan={11} className="p-2 border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>
                                    <th className="p-2 border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>

                                    <th className="p-2"></th>
                                </tr>
                            </thead>

                            {/* TBODY */}
                            <tbody className="text-xs font-medium font-mono">
                                {predictions.length === 0 ? (
                                    <tr>
                                        <td colSpan={31} className="p-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <span className="text-lg font-bold uppercase text-[#fbaa19]">NENHUMA APOSTA ENCONTRADA NESTA ETAPA</span>
                                                <span className="text-sm text-gray-500">Seja o primeiro estrategista a lançar previsões no grid!</span>
                                                <Link href="/positions" className="mt-2 px-6 py-2 bg-[#fbaa19] text-black font-black uppercase tracking-wider text-xs rounded hover:bg-white transition-colors">
                                                    Ir para o protocolo de posições &rarr;
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

                                        return (
                                            <tr key={pred.id} className="border-b border-[#222] hover:bg-white/5 transition-colors group">
                                                {/* Sticky Col 1: POS */}
                                                <td className="p-3 sticky left-0 bg-[#0a0a0a] group-hover:bg-[#111] z-10 border-r border-[#333] text-center text-gray-400 font-black">
                                                    {idx + 1}
                                                </td>

                                                {/* Sticky Col 2: DRIVER */}
                                                <td 
                                                    className="p-3 sticky left-16 bg-[#0a0a0a] group-hover:bg-[#111] z-10 border-r-4 border-r-[#fbaa19]" 
                                                    style={{ borderLeft: `4px solid ${teamColor}` }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar */}
                                                        <div 
                                                            className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-md relative"
                                                        >
                                                            {prof?.avatar_url ? (
                                                                <img src={prof.avatar_url} alt="Avatar" className="w-full h-full object-cover border-2 rounded-full" style={{ borderColor: teamColor }} />
                                                            ) : (
                                                                <PilotAvatar
                                                                    teamColor={teamColor}
                                                                    driverNumber={driverNum}
                                                                    variant="team"
                                                                    size="custom"
                                                                    showHUD={true}
                                                                    showBadge={false}
                                                                    className="w-full h-full"
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Pilot Name and Details */}
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {dashboardSlug ? (
                                                                    <Link 
                                                                        href={`/${dashboardSlug}`}
                                                                        className="font-black text-white hover:text-[#fbaa19] tracking-wider whitespace-nowrap transition-colors flex items-center gap-1 group/link"
                                                                        title={`Visitar dashboard de ${driverName}`}
                                                                    >
                                                                        <span>{driverName}</span>
                                                                        <span className="text-[10px] opacity-0 group-hover/link:opacity-100 transition-opacity text-[#fbaa19]">&rarr;</span>
                                                                    </Link>
                                                                ) : (
                                                                    <span className="font-black text-white tracking-wider whitespace-nowrap">
                                                                        {driverName}
                                                                    </span>
                                                                )}

                                                                {driverNum && (
                                                                    <span className="bg-[#fbaa19] text-black font-black text-[9px] px-1 py-0.2 rounded">
                                                                        #{driverNum}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1.5 text-[9px] tracking-wider uppercase mt-0.5">
                                                                <span 
                                                                    className="font-bold truncate max-w-[140px]" 
                                                                    style={{ color: teamColor }}
                                                                >
                                                                    {teamName}
                                                                </span>
                                                                {teamGroup && (
                                                                    <span className="bg-white/10 px-1 py-0.2 text-[8px] rounded text-gray-300 font-mono">
                                                                        {teamGroup}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* POLETIME */}
                                                <td className="p-3 border-r-4 border-r-[#fbaa19] text-center text-[#00ff00] font-black tracking-widest bg-[#1a1a1a]/50 text-sm">
                                                    {pred.poletime || '--:--.---'}
                                                </td>

                                                {/* MASTER TOP 10 */}
                                                {Array.from({ length: 10 }).map((_, i) => {
                                                    const rawPick = pred.top10?.[i] || '';
                                                    const { short, color, fullName } = resolveDriverInfo(rawPick);
                                                    return (
                                                        <td 
                                                            key={`m-${i}`} 
                                                            title={fullName ? `P${i+1}: ${fullName}` : undefined}
                                                            className={`p-2 border-r border-[#333] text-center font-bold tracking-wider ${i === 9 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} 
                                                            style={{ color }}
                                                        >
                                                            {short}
                                                        </td>
                                                    );
                                                })}

                                                {/* EVO (5) */}
                                                {Array.from({ length: 5 }).map((_, i) => {
                                                    const rawPick = pred.evo?.[i] || '';
                                                    const { short, color, fullName } = resolveDriverInfo(rawPick);
                                                    return (
                                                        <td 
                                                            key={`e-${i}`} 
                                                            title={fullName ? `Evo #${i+1}: ${fullName}` : undefined}
                                                            className={`p-2 border-r border-[#333] text-center font-bold tracking-wider bg-[#1a1a1a]/30 ${i === 4 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} 
                                                            style={{ color }}
                                                        >
                                                            {short}
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
                                                    return (
                                                        <td 
                                                            key={`h-${i}`} 
                                                            title={`${matchTitle}${fullName ? ` → Pick: ${fullName}` : ''}`} 
                                                            className={`p-2 border-r border-[#333] text-center font-bold cursor-help tracking-wider ${i === 10 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} 
                                                            style={{ color }}
                                                        >
                                                            {short}
                                                        </td>
                                                    );
                                                })}

                                                {/* MISC */}
                                                <td className="p-3 border-r-4 border-r-[#fbaa19] text-center text-[#fbaa19] font-bold bg-[#1a1a1a]/50">
                                                    {displayMisc}
                                                </td>

                                                {/* TIMESTAMP */}
                                                <td className="p-3 text-right text-gray-500 text-[10px] whitespace-nowrap group-hover:text-white transition-colors">
                                                    {new Date(pred.created_at).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: '2-digit',
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

                {/* BOTTOM NAVIGATION */}
                <div className="mt-8 flex justify-end gap-4 mb-16 flex-wrap">
                    <Link href="/f1" className="bg-transparent text-gray-400 border border-gray-700 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:text-white hover:border-gray-500 transition-colors">
                        F1 Hub
                    </Link>
                    <Link href="/pitwall" className="bg-transparent text-gray-400 border border-gray-700 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:text-white hover:border-gray-500 transition-colors">
                        Pit Wall
                    </Link>
                    <Link href="/positions" className="bg-[#fbaa19] text-black px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-white transition-colors">
                        Lançar / Editar Posições &rarr;
                    </Link>
                </div>
            </section>
        </main>
    );
}
