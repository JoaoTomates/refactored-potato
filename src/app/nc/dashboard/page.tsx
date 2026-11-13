"use client";

import React, { useEffect, useId, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';
import SetupForm from "@/components/setup-form";
import Calendar from "@/components/calendar";
import ReportForm from "@/components/report-form";
import { StewardAlertBanner, StewardVotingModal, useStewardVoting } from "@/components/steward-voting-panel";
import SillySeason from "@/components/silly-season";
import RaceWeekSchedule from "@/components/race-week-schedule";
import PaddockRadioPlayer from "@/components/paddock-radio-player";
import NasdaqTicker from "@/components/nasdaq-ticker";
import CompetitionRankingsScreen, { CompetitionKey } from "@/components/competition-rankings-screen";
import { getSystemBoxStyle } from "@/components/system-modal";
import TelemetryView from "@/components/views/telemetry-view";
import PitwallView from "@/components/views/pitwall-view";
import RaceControlView from "@/components/views/race-control-view";
import { nextRaceStart, isRaceWeek } from '@/lib/race';
import { formatMls, formatTimeAgo } from '@/lib/mls';
import { getCountryFlag } from '@/lib/country-flags';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug, slugAlphanumericKey } from '@/lib/slug';
import { TeamworkSquad, getStrategistSquad } from '@/lib/teamwork';
import {
    SeniorStrategist,
    getSeniorStrategistById,
    getSeniorStrategistForRound,
    getStrategistVoice,
    AllianceBlock
} from '@/lib/race-directors';
import { getGroupTechnicalEngineer } from '@/lib/group-engineers';
import { getRealF1Driver, RealF1Driver, getTeamCarColor, getContrastingTextColor } from '@/lib/real-f1-drivers';
import { getTeamPrincipal } from '@/lib/paddock-crew';
import { useThemeStore, STANDARD_ACCENT_OPTIONS } from '@/store/useThemeStore';

/* ============================================================
 * BAEFF1 // DASHBOARD DO ESTRATEGISTA - ARQUITETURA COCKPIT 100VH
 * Viewport fixo sem scroll externo, grid de 3 colunas,
 * 6 abas principais e rankings unificados em abas.
 * ============================================================ */

const ALLIANCES = {
    A: { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'ESTRELA', codes: ['MER', 'MCL', 'ALP', 'WIL'] },
    B: { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'MARANELLO', codes: ['FER', 'HAA', 'CAD'] },
    C: { id: 'C', name: 'A VANGUARDA', short: 'VANGUARDA', codes: ['RBR', 'RBA', 'AST', 'AUD'] },
} as const;
type AllianceId = keyof typeof ALLIANCES;

const allianceForCode = (code?: string): AllianceId =>
    (Object.keys(ALLIANCES) as AllianceId[]).find(k => (ALLIANCES[k].codes as readonly string[]).includes(code || '')) || 'A';

function hashString(s: string) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

const fmt = (v: number | undefined | null) => {
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
        return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0,00';
};

const ratingFor = (v: number) => (v >= 160 ? 'AAA' : v >= 130 ? 'AA' : v >= 105 ? 'A' : v >= 85 ? 'BBB' : v >= 65 ? 'BB' : 'B');

interface Strategist {
    id: string;
    slug: string | null;
    name: string;
    teamCode: string;
    teamName: string;
    teamColor: string;
    groupId: number;
    series: number[];
    isDemo?: boolean;
    mlsBalance?: number;
}

type MainTab = 'raceweek' | 'quotes' | 'telemetry' | 'grid' | 'stewards' | 'paddock';
type RankingTab = 'master' | 'milesimus' | 'poletime';
type OperationalModalView = 'none' | 'setup' | 'calendar' | 'silly_season' | 'telemetry' | 'pitwall' | 'race_control' | 'report';

function makeStrategist(id: string, name: string, slug: string | null, teamId: string | undefined, groupId: number, isDemo = false, mlsBalance: number = 100): Strategist {
    const team = F1_TEAMS.find(t => t.id === teamId || t.logo === teamId) || F1_TEAMS[hashString(id) % F1_TEAMS.length];
    const baseVal = typeof mlsBalance === 'number' ? mlsBalance : 100;
    const realSeries = Array(24).fill(baseVal);
    return {
        id, slug, name, isDemo, groupId, mlsBalance: baseVal,
        teamCode: team.logo, teamName: team.name, teamColor: team.color,
        series: realSeries,
    };
}

type PerformanceColor = 'green' | 'yellow' | 'red';

const PERFORMANCE_THEMES = {
    green: {
        key: 'green',
        name: 'Top 1/3 (Verde)',
        text: 'text-emerald-400',
        textColor: '#34d399',
        border: 'rgba(16, 185, 129, 0.55)',
        borderActive: '#10b981',
        ring: 'ring-emerald-500/50',
        bg: 'linear-gradient(160deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 46, 22, 0.35) 45%, #06090d 100%)',
        bgActive: 'linear-gradient(160deg, rgba(16, 185, 129, 0.32) 0%, rgba(5, 46, 22, 0.50) 45%, #06090d 100%)',
        shadow: '0 0 16px rgba(16, 185, 129, 0.25)',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
        tag: 'TOP 1/3',
    },
    yellow: {
        key: 'yellow',
        name: 'Meio do Grid (Amarela)',
        text: 'text-amber-400',
        textColor: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.55)',
        borderActive: '#f59e0b',
        ring: 'ring-amber-500/50',
        bg: 'linear-gradient(160deg, rgba(245, 158, 11, 0.20) 0%, rgba(69, 26, 3, 0.35) 45%, #06090d 100%)',
        bgActive: 'linear-gradient(160deg, rgba(245, 158, 11, 0.30) 0%, rgba(69, 26, 3, 0.50) 45%, #06090d 100%)',
        shadow: '0 0 16px rgba(245, 158, 11, 0.25)',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
        tag: 'MEIO DO GRID',
    },
    red: {
        key: 'red',
        name: '1/3 Inferior (Vermelha)',
        text: 'text-red-400',
        textColor: '#f87171',
        border: 'rgba(239, 68, 68, 0.55)',
        borderActive: '#ef4444',
        ring: 'ring-red-500/50',
        bg: 'linear-gradient(160deg, rgba(239, 68, 68, 0.20) 0%, rgba(69, 10, 10, 0.35) 45%, #06090d 100%)',
        bgActive: 'linear-gradient(160deg, rgba(239, 68, 68, 0.30) 0%, rgba(69, 10, 10, 0.50) 45%, #06090d 100%)',
        shadow: '0 0 16px rgba(239, 68, 68, 0.25)',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        dot: 'bg-red-400',
        tag: '1/3 INFERIOR',
    }
} as const;

function useNow() {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

/* ---------- Sub-componentes Compactos ---------- */

function Delta({ value, className = '' }: { value: number; className?: string }) {
    if (value === 0 || !isFinite(value)) {
        return <span className={`text-zinc-500 font-bold tabular-nums ${className}`}>● 0,00%</span>;
    }
    const up = value > 0;
    return (
        <span className={`${up ? 'text-emerald-400' : 'text-red-400'} font-bold tabular-nums ${className}`}>
            {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
        </span>
    );
}

function Sparkline({ data, width = 60, height = 20, strokeColor }: { data: number[]; width?: number; height?: number; strokeColor?: string }) {
    if (!data || data.length < 2) return <div style={{ width, height }} />;
    const min = Math.min(...data), max = Math.max(...data);
    const r = max - min;
    const pts = data.map((v, i) => {
        const y = r === 0 ? height / 2 : height - ((v - min) / r) * height;
        return `${(i / (data.length - 1)) * width},${y}`;
    }).join(' ');
    const up = data[data.length - 1] >= data[0];
    const color = strokeColor || (r === 0 ? '#38bdf8' : (up ? '#34d399' : '#f87171'));
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function PriceChart({ data, startRound, teamColor }: { data: number[]; startRound: number; teamColor?: string }) {
    if (!data || data.length < 2) {
        return (
            <div className="w-full h-[180px] flex items-center justify-center text-xs text-zinc-500 font-mono">
                &gt;_ CARREGANDO SÉRIE DE COTAÇÃO DO ESTRATEGISTA...
            </div>
        );
    }

    const [hover, setHover] = useState<number | null>(null);
    const W = 600, H = 180;
    const min = Math.min(...data), max = Math.max(...data);
    const isBaseline = min === max;
    const pad = isBaseline ? Math.max(10, min * 0.1) : (max - min) * 0.12 || 1;
    const lo = min - pad, hi = max + pad;
    const x = (i: number) => (i / (data.length - 1)) * W;
    const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    const stroke = teamColor || '#f59e0b';
    const idx = hover !== null && hover >= 0 && hover < data.length ? hover : data.length - 1;
    const activeVal = data[idx] ?? data[data.length - 1] ?? 0;

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setHover(Math.round(rel * (data.length - 1)));
    };

    return (
        <div className="relative w-full h-[170px] select-none touch-none bg-[#0a0d14]/70 rounded border border-zinc-800/80 p-1" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(g => (
                    <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={area} fill="url(#chartGrad)" />
                <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={x(idx)} x2={x(idx)} y1="0" y2={H} stroke="rgba(255,255,255,0.25)" vectorEffect="non-scaling-stroke" />
            </svg>

            <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-black pointer-events-none" style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(activeVal) / H) * 100}%`, background: stroke, boxShadow: `0 0 10px ${stroke}` }} />

            <div className="absolute top-2 pointer-events-none text-[10px] font-bold tracking-widest bg-black/85 border px-2 py-0.5 rounded flex items-center gap-2" style={{ left: `clamp(0px, calc(${(x(idx) / W) * 100}% - 48px), calc(100% - 150px))`, borderColor: `${stroke}50` }}>
                <span className="text-zinc-400">R{startRound + idx}</span>
                <span className="text-zinc-100">{fmt(activeVal)} MLS</span>
                {isBaseline && <span className="text-emerald-400 text-[9px]">● ESTÁVEL</span>}
            </div>

            <div className="absolute right-2 top-1 bottom-1 flex flex-col justify-between text-[9px] text-zinc-500 tabular-nums pointer-events-none">
                <span>{fmt(hi)}</span>
                <span>{fmt(lo)}</span>
            </div>
        </div>
    );
}

/* ============================================================
 * COMPONENTE PRINCIPAL: COCKPIT VIEWPORT FIXO 100VH
 * ============================================================ */
function DashboardCockpit() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading, logout } = useSupabaseAuth();
    const now = useNow();

    const [loading, setLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<any>(null);
    const [me, setMe] = useState<Strategist | null>(null);
    const [field, setField] = useState<Strategist[]>([]);
    const [allPredictions, setAllPredictions] = useState<Map<string, any>>(new Map());
    const [userPrediction, setUserPrediction] = useState<any>(null);
    const [assignedMentor, setAssignedMentor] = useState<SeniorStrategist | null>(null);
    const [userSeat, setUserSeat] = useState<1 | 2>(1);
    const [teamPartner, setTeamPartner] = useState<{ id: string; name: string; slug: string | null; driverNumber?: string; avatarUrl?: string | null } | null>(null);
    const [activeContract, setActiveContract] = useState<any>(null);
    const [squad, setSquad] = useState<TeamworkSquad | null>(null);

    // Estados de UI e Abas
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('raceweek');
    const [activeRankingTab, setActiveRankingTab] = useState<RankingTab>('master');
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [rankingModalComp, setRankingModalComp] = useState<CompetitionKey | null>(null);
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const [operationalModal, setOperationalModal] = useState<OperationalModalView>('none');

    // Acordeões da coluna esquerda
    const [openAccordion, setOpenAccordion] = useState<string | null>('info');

    const badgeUid = useId().replace(/[^a-zA-Z0-9_-]/g, '_');
    const stewardVoting = useStewardVoting();

    // Carregamento de dados com fallback para perfil real / @lgustavo88
    useEffect(() => {
        if (authLoading) return;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                const querySlug = searchParams.get('driver') || searchParams.get('slug') || '';

                let profileData: any = null;

                // 1. Se veio por query param
                if (querySlug) {
                    const cleanSlug = querySlug.replace(/^@+/, '').toLowerCase();
                    const { data: pBySlug } = await supabase
                        .from('profiles')
                        .select('*')
                        .or(`slug.ilike.@${cleanSlug},slug.ilike.${cleanSlug}`)
                        .limit(1)
                        .maybeSingle();
                    profileData = pBySlug;
                }

                // 2. Se autenticado e sem perfil selecionado
                if (!profileData && user) {
                    const { data: pUser } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();
                    profileData = pUser;
                }

                // 3. Fallback inteligente para demonstração: busca @lgustavo88 ou o primeiro com contrato
                if (!profileData) {
                    const { data: pFallback } = await supabase
                        .from('profiles')
                        .select('*')
                        .or('slug.ilike.@lgustavo88,slug.ilike.lgustavo88')
                        .limit(1)
                        .maybeSingle();
                    if (pFallback) {
                        profileData = pFallback;
                    } else {
                        const { data: firstActive } = await supabase
                            .from('profiles')
                            .select('*')
                            .not('slug', 'is', null)
                            .limit(1)
                            .maybeSingle();
                        profileData = firstActive;
                    }
                }

                setTargetProfile(profileData);

                // Mentor sênior
                if (profileData?.senior_strategist_id) {
                    const m = getSeniorStrategistById(profileData.senior_strategist_id);
                    setAssignedMentor(m || getSeniorStrategistForRound(19));
                } else {
                    setAssignedMentor(getSeniorStrategistForRound(19));
                }

                // Contratos e estrategistas
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, team_id, created_at, profiles(slug, first_name, last_name, driver_number, mls_balance, nationality, avatar_url)');

                const realStrategists: Strategist[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const name = p.first_name
                        ? `${p.first_name.charAt(0).toUpperCase()}.${(p.last_name || '').trim().toUpperCase()}`
                        : 'ESTRATEGISTA';
                    const lowerSlug = p.slug ? String(p.slug).toLowerCase() : null;
                    return makeStrategist(c.user_id, name, lowerSlug, c.team_id, c.group_id || 1, false, p.mls_balance ?? 100);
                });

                // Palpites para rankings
                const { data: predsList } = await supabase
                    .from('predictions')
                    .select('user_id, poletime, top10, created_at')
                    .order('created_at', { ascending: false });

                const pMap = new Map<string, any>();
                (predsList || []).forEach((pr: any) => {
                    if (pr.user_id && !pMap.has(pr.user_id)) {
                        pMap.set(pr.user_id, pr);
                    }
                });
                setAllPredictions(pMap);

                // Contrato do usuário exibido
                const profileContract = (contracts || []).find((c: any) => c.user_id === profileData?.id);
                setActiveContract(profileContract || null);

                // Estrategista em foco
                let currentStrategist: Strategist | null = null;
                if (profileData) {
                    const name = profileData.first_name
                        ? `${profileData.first_name.charAt(0).toUpperCase()}.${(profileData.last_name || '').trim().toUpperCase()}`
                        : (profileData.slug ? profileData.slug.replace('@', '').toUpperCase() : 'L.GUSTAVO88');

                    currentStrategist = makeStrategist(
                        profileData.id,
                        name,
                        profileData.slug || '@lgustavo88',
                        profileContract?.team_id || profileData.team_id || 'haas',
                        profileContract?.group_id || profileData.group_id || 1,
                        false,
                        profileData.mls_balance ?? 100
                    );
                } else {
                    currentStrategist = makeStrategist(
                        'visitor',
                        'L.GUSTAVO88',
                        '@lgustavo88',
                        'haas',
                        1,
                        false,
                        100
                    );
                }

                setMe(currentStrategist);
                setField(realStrategists.length > 0 ? realStrategists : [currentStrategist]);

                // Previsões do usuário atual
                if (currentStrategist && !currentStrategist.isDemo) {
                    const { data: predData } = await supabase
                        .from('predictions')
                        .select('*')
                        .eq('user_id', currentStrategist.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    setUserPrediction(predData || null);

                    const userSquad = await getStrategistSquad(currentStrategist.id);
                    setSquad(userSquad);

                    const myTeamId = profileContract?.team_id || profileData?.team_id;
                    const myGroupId = profileContract?.group_id || profileData?.group_id || 1;

                    const teamContracts = (contracts || [])
                        .filter((c: any) => c.team_id === myTeamId && c.group_id === myGroupId)
                        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    const seatIdx = teamContracts.findIndex((c: any) => c.user_id === currentStrategist.id);
                    setUserSeat(seatIdx === 1 ? 2 : 1);

                    const partnerContract = (contracts || []).find((c: any) =>
                        c.team_id === myTeamId &&
                        c.group_id === myGroupId &&
                        c.user_id !== currentStrategist.id
                    );

                    if (partnerContract) {
                        const p = Array.isArray(partnerContract.profiles) ? partnerContract.profiles[0] || {} : partnerContract.profiles || {};
                        const pName = p.first_name
                            ? `${p.first_name.charAt(0).toUpperCase()}.${(p.last_name || '').trim().toUpperCase()}`
                            : 'COMPANHEIRO';
                        setTeamPartner({
                            id: partnerContract.user_id,
                            name: pName,
                            slug: p.slug ? String(p.slug).toLowerCase() : null,
                            driverNumber: p.driver_number ? String(p.driver_number) : undefined,
                            avatarUrl: p.avatar_url || null
                        });
                    } else {
                        setTeamPartner(null);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar cockpit:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [authLoading, user, searchParams]);

    const isOwner = Boolean(user && targetProfile && user.id === targetProfile.id);
    const allianceId = allianceForCode(me?.teamCode);
    const dashboardStyle = useThemeStore(state => state.dashboardStyle);
    const standardAccent = useThemeStore(state => state.standardAccent);
    const isStandardStyle = dashboardStyle === 'standard';
    const teamColor = me?.teamColor || '#f59e0b';
    const standardAccentHex = (STANDARD_ACCENT_OPTIONS[standardAccent] || STANDARD_ACCENT_OPTIONS.cyan).hex;
    const mainAccent = isStandardStyle ? standardAccentHex : teamColor;

    const series = me ? me.series.slice(-range) : [];
    const raceWeek = isRaceWeek(now || new Date());

    let countdown = '--D --:--:--';
    if (now) {
        const diff = Math.max(0, nextRaceStart(now).getTime() - now.getTime());
        const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
        countdown = `${String(d).padStart(2, '0')}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const mentorVoice = useMemo(() => {
        if (!assignedMentor) return null;
        return getStrategistVoice(
            assignedMentor,
            allianceId as AllianceBlock,
            targetProfile?.nationality,
            me?.name
        );
    }, [assignedMentor, allianceId, targetProfile, me]);

    const assignedEngineer = useMemo(() => {
        if (!me) return null;
        return getGroupTechnicalEngineer(me.groupId || 1, me.id || 0);
    }, [me?.groupId, me?.id]);

    const realDriver = useMemo(() => {
        if (!me) return null;
        return getRealF1Driver(me.teamName, userSeat);
    }, [me?.teamName, userSeat]);

    const teamPrincipal = useMemo(() => {
        return getTeamPrincipal(me?.teamCode);
    }, [me?.teamCode]);

    // Métricas dos 4 KPIs
    const compStats = useMemo(() => {
        if (!me) return null;
        const hasPred = Boolean(userPrediction);
        const poleTimeVal = userPrediction?.poletime || null;
        const top10Count = Array.isArray(userPrediction?.top10) ? userPrediction.top10.length : 0;
        const balance = targetProfile?.mls_balance ?? 100;

        return {
            poletime: {
                hasSubmitted: hasPred,
                poleTime: poleTimeVal,
                points: 0,
                rank: hasPred ? 'HOMOLOGADO' : '--',
                accuracy: hasPred ? 'Q3 ATIVO' : 'PENDENTE',
            },
            master: {
                hasSubmitted: top10Count > 0,
                picksCount: top10Count,
                rank: top10Count > 0 ? `${top10Count}/10` : '--',
                status: top10Count > 0 ? `${top10Count}/10 PILOTOS` : 'PENDENTE',
            },
            milesimus: {
                points: balance,
                formatted: formatMls(balance),
                tier: balance >= 1000 ? 'DIVISÃO OURO' : balance >= 500 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
            },
            teamwork: {
                hasSquad: Boolean(squad),
                squadName: squad ? squad.name : 'SOLO',
                averageMls: squad ? squad.formattedAverage : '000.100',
            }
        };
    }, [me, userPrediction, targetProfile, squad]);

    // Tiers e degradês
    const competitionTiers = useMemo(() => {
        if (!me) {
            return {
                poletime: 'red' as PerformanceColor,
                master: 'red' as PerformanceColor,
                milesimus: 'yellow' as PerformanceColor,
                teamwork: 'yellow' as PerformanceColor,
                meta: { globalRank: 1, totalGlobal: 1, userGroupRank: 1, totalInGroup: 1 }
            };
        }

        const totalGlobal = Math.max(field.length, 1);
        const sortedGlobal = [...field].sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100));
        const myGlobalIdx = sortedGlobal.findIndex(s => s.id === me.id);
        const globalRank = myGlobalIdx >= 0 ? myGlobalIdx + 1 : 1;
        const globalPercentile = globalRank / totalGlobal;

        let milesimusTier: PerformanceColor = 'yellow';
        if (globalRank === 1 || globalPercentile <= 0.334) milesimusTier = 'green';
        else if (globalPercentile <= 0.667) milesimusTier = 'yellow';
        else milesimusTier = 'red';

        const groupUsers = field.filter(s => s.groupId === me.groupId);
        const sortedGroup = groupUsers.length > 0
            ? [...groupUsers].sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100))
            : [me];
        const myGroupIdx = sortedGroup.findIndex(s => s.id === me.id);
        const userGroupRank = myGroupIdx >= 0 ? myGroupIdx + 1 : 1;
        const totalInGroup = sortedGroup.length;

        const hasMasterSubmission = Boolean(userPrediction && Array.isArray(userPrediction.top10) && userPrediction.top10.length > 0);
        const masterTier: PerformanceColor = (userGroupRank <= 10 && hasMasterSubmission) ? 'green' : 'red';

        const hasPoletimeSubmission = Boolean(userPrediction && userPrediction.poletime);
        let poletimeTier: PerformanceColor = 'red';
        if (hasPoletimeSubmission) {
            if (globalRank === 1 || globalPercentile <= 0.334) poletimeTier = 'green';
            else if (globalPercentile <= 0.667) poletimeTier = 'yellow';
            else poletimeTier = 'red';
        }

        let teamworkTier: PerformanceColor = 'yellow';
        const squadAvgNum = squad ? parseFloat(String(squad.averageMls).replace(',', '.')) : (me.mlsBalance ?? 100);
        if (squad && squad.memberCount >= 2 && squadAvgNum > 105) teamworkTier = 'green';
        else if (globalRank === 1 || globalPercentile <= 0.334) teamworkTier = 'green';
        else if (globalPercentile <= 0.667) teamworkTier = 'yellow';
        else teamworkTier = 'red';

        return {
            poletime: poletimeTier,
            master: masterTier,
            milesimus: milesimusTier,
            teamwork: teamworkTier,
            meta: { globalRank, totalGlobal, userGroupRank, totalInGroup }
        };
    }, [me, field, userPrediction, squad]);

    const poleTheme = PERFORMANCE_THEMES[competitionTiers?.poletime || 'red'];
    const masterTheme = PERFORMANCE_THEMES[competitionTiers?.master || 'red'];
    const milesimusTheme = PERFORMANCE_THEMES[competitionTiers?.milesimus || 'yellow'];
    const teamworkTheme = PERFORMANCE_THEMES[competitionTiers?.teamwork || 'yellow'];

    // Histórico de telemetria
    const activityHistory = useMemo(() => {
        if (!me) return [];
        const items = [];
        if (userPrediction) {
            const predTime = formatTimeAgo(userPrediction.created_at);
            const top10Len = Array.isArray(userPrediction.top10) ? userPrediction.top10.length : 0;
            items.push({
                time: predTime,
                title: 'Telemetria de Prognósticos Homologada',
                desc: `Poletime: ${userPrediction.poletime} · ${top10Len}/10 Top 10 registrado.`,
                badge: 'PREVISÃO',
                color: '#22c55e'
            });
        }
        if (activeContract) {
            items.push({
                time: formatTimeAgo(activeContract.created_at),
                title: 'Contrato de Garagem Homologado',
                desc: `Assento oficial confirmado na ${me.teamName} · Grupo ${me.groupId}.`,
                badge: 'CONTRATO',
                color: teamColor
            });
        }
        items.push({
            time: formatTimeAgo(targetProfile?.created_at),
            title: 'Entrada na Aliança Técnica',
            desc: `Telemetria autorizada com o ${ALLIANCES[allianceId].name}.`,
            badge: 'ALIANÇA',
            color: teamColor
        });
        return items;
    }, [me, userPrediction, activeContract, targetProfile, teamColor, allianceId]);

    // Top 10 das 3 competições
    const { masterTop10, milesimusTop10, poletimeTop10 } = useMemo(() => {
        const allPool = field.length > 0 ? field : (me ? [me] : []);

        const milesimusList = [...allPool]
            .sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100))
            .slice(0, 10)
            .map(s => ({ s, value: formatMls(s.mlsBalance ?? 100), sub: 'MLS' }));

        const masterList = [...allPool]
            .map(s => {
                const pred = allPredictions.get(String(s.id));
                const top10Count = Array.isArray(pred?.top10) ? pred.top10.length : 0;
                const pts = Math.round((s.mlsBalance ?? 100) * 1.15) + top10Count * 10;
                return { s, pts, top10Count };
            })
            .sort((a, b) => b.pts - a.pts)
            .slice(0, 10)
            .map(item => ({
                s: item.s,
                value: `${item.pts}`,
                sub: item.top10Count > 0 ? `${item.top10Count}/10` : 'PTS'
            }));

        const poletimeList = [...allPool]
            .map(s => {
                const pred = allPredictions.get(String(s.id));
                const hasPole = Boolean(pred?.poletime);
                const bal = s.mlsBalance ?? 100;
                return { s, hasPole, poleTime: pred?.poletime || null, score: (hasPole ? 10000 : 0) + bal };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => ({
                s: item.s,
                value: item.poleTime || '--:--.---',
                sub: item.hasPole ? 'Q3 ATIVO' : 'PENDENTE'
            }));

        return { masterTop10: masterList, milesimusTop10: milesimusList, poletimeTop10: poletimeList };
    }, [field, me, allPredictions]);

    // Índices de alianças
    const allianceIdx = useMemo(() => (Object.keys(ALLIANCES) as AllianceId[]).map(k => {
        const teamCodes = ALLIANCES[k].codes as readonly string[];
        const members = field.filter(s => teamCodes.includes(s.teamCode));
        const totalMls = members.length > 0 ? members.reduce((acc, s) => acc + (s.mlsBalance ?? 100), 0) : 0;
        const s = Array(12).fill(totalMls);
        return { k, s, v: totalMls, c: 0 };
    }), [field]);

    const handleLogout = async () => {
        clearCachedStrategistSession();
        try {
            if (logout) await logout();
            window.location.href = '/';
        } catch (_) {
            await supabase.auth.signOut();
            window.location.href = '/';
        }
    };

    if (authLoading || loading || !me) {
        return (
            <div className="w-screen h-screen bg-[#06080a] flex flex-col items-center justify-center font-mono gap-4 text-zinc-100">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-amber-500" />
                <p className="text-xs font-bold tracking-widest text-amber-400 animate-pulse">&gt;_ SINCRONIZANDO COCKPIT 100VH DO ESTRATEGISTA...</p>
            </div>
        );
    }

    const carSeat = realDriver?.seat || 1;
    const carBgColor = getTeamCarColor(me.teamCode || me.teamName, carSeat);
    const carTextColor = getContrastingTextColor(carBgColor);
    const cleanNationality = targetProfile?.nationality?.trim() || '';
    const flag = getCountryFlag(cleanNationality);

    return (
        <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#06080a] text-zinc-100 font-mono select-none antialiased relative">
            {/* Linhas CRT e ruído suave de fundo */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${mainAccent} 0%, transparent 70%)` }} />
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px)' }} />
            </div>

            {/* TOPBAR FIXA NO TOPO */}
            <header className="relative z-20 h-11 shrink-0 px-3 md:px-4 bg-[#080b10] border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/" className="font-black tracking-widest text-sm text-zinc-100 hover:text-amber-400 transition-colors shrink-0">
                        BAEFF<span className="text-amber-400">1</span>
                    </Link>
                    <span className="hidden md:inline text-[10px] tracking-[0.25em] text-zinc-400 shrink-0">// TERMINAL DO ESTRATEGISTA</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border border-zinc-800 bg-[#0f141d] text-[9.5px] font-bold tracking-wider text-zinc-300 shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: me.teamColor }} />
                        {me.teamName}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400/90 tracking-wider truncate hidden lg:inline">
                        {me.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-[10px] tracking-wider shrink-0">
                    <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${raceWeek ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className={raceWeek ? 'text-amber-400' : 'text-emerald-400'}>
                            {raceWeek ? 'RACE WEEK // PITLANE OPEN' : 'PITLANE OPEN'}
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-zinc-400">
                        <span>PRÓXIMO GP:</span>
                        <span className="font-bold text-zinc-200 tabular-nums">{countdown}</span>
                    </div>

                    <span className="hidden md:inline text-zinc-400 tabular-nums">
                        {now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}
                    </span>

                    <PaddockRadioPlayer teamColor={mainAccent} />

                    <button
                        type="button"
                        onClick={() => setOperationalModal('setup')}
                        className="px-2 py-1 rounded-[2px] border border-zinc-800 hover:border-amber-500 bg-[#10151c] text-zinc-300 hover:text-amber-400 font-bold uppercase tracking-wider transition-all cursor-pointer text-[9.5px]"
                        title="Configurações do Estrategista"
                    >
                        [ SETUP ]
                    </button>

                    {isOwner ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-red-400 transition-colors uppercase cursor-pointer font-bold text-[9.5px]"
                        >
                            [ SAIR ]
                        </button>
                    ) : user ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-red-400 transition-colors uppercase cursor-pointer font-bold text-[9.5px]"
                        >
                            [ SAIR ]
                        </button>
                    ) : (
                        <Link href="/superlicense" className="text-amber-400 hover:underline uppercase font-bold text-[9.5px]">
                            [ ENTRAR ]
                        </Link>
                    )}
                </div>
            </header>

            {/* TICKER DE MERCADO NASDAQ FIXO */}
            <div className="relative z-10 shrink-0">
                <NasdaqTicker />
            </div>

            {/* CORPO PRINCIPAL EM GRID DE 3 COLUNAS FIXO NO VIEWPORT (100VH) */}
            <div className="relative z-10 flex-1 min-h-0 grid grid-cols-[270px_1fr_290px] gap-2.5 p-2.5 overflow-hidden">

                {/* ======================================================== */}
                {/* COLUNA ESQUERDA: CREDENCIAL COMPACTA, EQUIPE E FERRAMENTAS */}
                {/* ======================================================== */}
                <aside className="h-full flex flex-col gap-2 overflow-hidden bg-[#090c12]/90 border border-zinc-800/80 rounded p-2">
                    
                    {/* CARD DO AVATAR/CAPACETE COMPACTO HORIZONTAL (~68x68px) */}
                    <div className="p-2 rounded bg-black border border-zinc-800 flex flex-col gap-1.5 shrink-0 shadow-inner">
                        <div className="flex items-center gap-2.5">
                            {/* Caixa do capacete 68x68px */}
                            <div
                                className="relative w-[68px] h-[68px] rounded border flex items-center justify-center shrink-0 overflow-hidden bg-black"
                                style={{ borderColor: `${carBgColor}80`, boxShadow: `0 0 12px ${carBgColor}30` }}
                            >
                                <div
                                    className="absolute inset-1 rounded-full flex items-center justify-center pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, ${carBgColor} 0%, ${carBgColor} 75%, rgba(0,0,0,0.95) 95%)`
                                    }}
                                >
                                    <svg viewBox="0 0 100 100" className="w-full h-full select-none pointer-events-none">
                                        <text
                                            x="44"
                                            y="52"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill={carTextColor}
                                            style={{
                                                fontFamily: 'var(--font-montserrat), sans-serif',
                                                fontWeight: 900,
                                                fontSize: '22px',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {realDriver?.code || 'OCO'}
                                        </text>
                                    </svg>
                                </div>
                                <img
                                    alt="Capacete F1"
                                    className="w-full h-full object-contain select-none mix-blend-screen scale-110 relative z-10 pointer-events-none"
                                    src="/avatar-overlay.svg"
                                />
                            </div>

                            {/* Dados do Piloto ao Lado */}
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-zinc-400 truncate">
                                    ESTRATEGISTA TITULAR
                                </span>
                                <h3 className="text-base font-black uppercase tracking-wider text-zinc-100 truncate leading-tight">
                                    {me.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[2px] border text-[8px] font-black uppercase"
                                        style={{ borderColor: `${carBgColor}50`, backgroundColor: `${carBgColor}15`, color: carBgColor }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: carBgColor }} />
                                        {me.teamName}
                                    </span>
                                    <span className="text-[8px] text-zinc-400 border border-zinc-800 px-1 py-0.2 rounded-[2px] bg-white/[0.02] uppercase truncate">
                                        {getChampionGroupName(me.groupId)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Superlicença ativa no bottom */}
                        <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[8px] tracking-widest text-zinc-400">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                SUPERLICENÇA ATIVA
                            </span>
                            <span className="text-zinc-500 font-mono">#{targetProfile?.driver_number || '00'}</span>
                        </div>
                    </div>

                    {/* ACORDEÕES DA EQUIPE COM SCROLL INTERNO */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar text-xs">
                        
                        {/* 1. Informações do Estrategista */}
                        <div className="border border-zinc-800/80 rounded bg-[#0b0f16]">
                            <button
                                type="button"
                                onClick={() => setOpenAccordion(openAccordion === 'info' ? null : 'info')}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left font-bold text-[10px] tracking-wider uppercase text-zinc-300 hover:text-amber-400 cursor-pointer"
                            >
                                <span>&gt;_ Informações do Estrategista</span>
                                <span className="text-[9px] text-zinc-400">{openAccordion === 'info' ? '[-]' : '[+]'}</span>
                            </button>
                            {openAccordion === 'info' && (
                                <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-zinc-800/60 text-[10px]">
                                    {realDriver && (
                                        <div className="p-1.5 rounded bg-black/60 border border-zinc-800 flex items-center justify-between">
                                            <span className="text-zinc-400 text-[8.5px] uppercase">PILOTO DESIGNADO:</span>
                                            <span className="font-bold text-zinc-200">{realDriver.name} ({realDriver.code} #{realDriver.number})</span>
                                        </div>
                                    )}
                                    <div className="p-1.5 rounded bg-black/60 border border-zinc-800 flex items-center justify-between">
                                        <span className="text-zinc-400 text-[8.5px] uppercase">NACIONALIDADE:</span>
                                        <span className="font-bold text-zinc-200 uppercase flex items-center gap-1">
                                            {flag && <img src={flag.flagUrl} alt="" className="w-3.5 h-2.5 object-cover rounded-sm inline" />}
                                            {cleanNationality || 'BRASIL'}
                                        </span>
                                    </div>
                                    <div className="p-1.5 rounded bg-black/60 border border-zinc-800 flex items-center justify-between">
                                        <span className="text-zinc-400 text-[8.5px] uppercase">ALIANÇA TÉCNICA:</span>
                                        <span className="font-bold text-amber-400 uppercase">{ALLIANCES[allianceId].short}</span>
                                    </div>
                                    <div className="p-1.5 rounded bg-black/60 border border-zinc-800 flex items-center justify-between">
                                        <span className="text-zinc-400 text-[8.5px] uppercase">RATING TÁTICO:</span>
                                        <span className="font-black tracking-widest text-emerald-400">{ratingFor(me.mlsBalance ?? 100)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Companheiro de Box */}
                        <div className="border border-zinc-800/80 rounded bg-[#0b0f16]">
                            <button
                                type="button"
                                onClick={() => setOpenAccordion(openAccordion === 'partner' ? null : 'partner')}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left font-bold text-[10px] tracking-wider uppercase text-zinc-300 hover:text-amber-400 cursor-pointer"
                            >
                                <span>&gt;_ Companheiro de Box</span>
                                <span className="text-[9px] text-zinc-400">{openAccordion === 'partner' ? '[-]' : '[+]'}</span>
                            </button>
                            {openAccordion === 'partner' && (
                                <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-zinc-800/60 text-[10px]">
                                    {teamPartner ? (
                                        <div className="p-1.5 rounded bg-black/60 border border-zinc-800 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-zinc-200">{teamPartner.name}</p>
                                                <p className="text-[8px] text-zinc-400">{teamPartner.slug || 'CONFIRMADO'}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/10">CARRO 2</span>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 text-[9px] p-1.5">Vaga aberta para o 2º carro na escuderia.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 3. Engenheiro Técnico */}
                        {assignedEngineer && (
                            <div className="border border-zinc-800/80 rounded bg-[#0b0f16]">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'engineer' ? null : 'engineer')}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-left font-bold text-[10px] tracking-wider uppercase text-zinc-300 hover:text-amber-400 cursor-pointer"
                                >
                                    <span>&gt;_ Engenheiro Técnico</span>
                                    <span className="text-[9px] text-zinc-400">{openAccordion === 'engineer' ? '[-]' : '[+]'}</span>
                                </button>
                                {openAccordion === 'engineer' && (
                                    <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-zinc-800/60 text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded border border-zinc-700 bg-black overflow-hidden shrink-0">
                                                <img
                                                    src={`/avatar/eng/avatar_${assignedEngineer.avatarIndex}.jpg`}
                                                    alt={assignedEngineer.fullName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-zinc-200 truncate">{assignedEngineer.code}</p>
                                                <p className="text-[8.5px] text-zinc-400 truncate">{assignedEngineer.role}</p>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 text-[8.5px] leading-tight p-1 rounded bg-black/40 border border-zinc-800">
                                            {assignedEngineer.specialty}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Conselheiro de Paddock */}
                        {assignedMentor && (
                            <div className="border border-zinc-800/80 rounded bg-[#0b0f16]">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'mentor' ? null : 'mentor')}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-left font-bold text-[10px] tracking-wider uppercase text-zinc-300 hover:text-amber-400 cursor-pointer"
                                >
                                    <span>&gt;_ Conselheiro</span>
                                    <span className="text-[9px] text-zinc-400">{openAccordion === 'mentor' ? '[-]' : '[+]'}</span>
                                </button>
                                {openAccordion === 'mentor' && (
                                    <div className="px-2.5 pb-2.5 pt-1 space-y-1 border-t border-zinc-800/60 text-[10px]">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-amber-400">{assignedMentor.displayName}</span>
                                            <span className="text-[8px] text-zinc-400 border border-zinc-800 px-1 py-0.2 rounded bg-black">{assignedMentor.decade}</span>
                                        </div>
                                        <p className="text-zinc-400 text-[8.5px]">{assignedMentor.nationality} · Aliança {ALLIANCES[allianceId].short}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Chefe de Equipe */}
                        {teamPrincipal && (
                            <div className="border border-zinc-800/80 rounded bg-[#0b0f16]">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'principal' ? null : 'principal')}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-left font-bold text-[10px] tracking-wider uppercase text-zinc-300 hover:text-amber-400 cursor-pointer"
                                >
                                    <span>&gt;_ Chefe de Equipe</span>
                                    <span className="text-[9px] text-zinc-400">{openAccordion === 'principal' ? '[-]' : '[+]'}</span>
                                </button>
                                {openAccordion === 'principal' && (
                                    <div className="px-2.5 pb-2.5 pt-1 space-y-1 border-t border-zinc-800/60 text-[10px]">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-zinc-200">{teamPrincipal.name}</span>
                                            <span className="text-[8px] text-zinc-400">{teamPrincipal.nationality}</span>
                                        </div>
                                        <p className="text-zinc-400 text-[8.5px]">Diretor de Operações {me.teamName}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* GRID COMPACTO 2x3 DE FERRAMENTAS CRT NA BASE DA COLUNA ESQUERDA */}
                    <div className="shrink-0 pt-1 border-t border-zinc-800/80">
                        <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                            AÇÕES & FERRAMENTAS
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setOperationalModal('silly_season')}
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer"
                            >
                                Silly Season
                            </button>
                            <button
                                type="button"
                                onClick={() => setOperationalModal('calendar')}
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer"
                            >
                                Calendário F1
                            </button>
                            <button
                                type="button"
                                onClick={() => setOperationalModal('telemetry')}
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer"
                            >
                                Telemetria
                            </button>
                            <button
                                type="button"
                                onClick={() => setOperationalModal('pitwall')}
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer"
                            >
                                Pitwall
                            </button>
                            <button
                                type="button"
                                onClick={() => setOperationalModal('race_control')}
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer"
                            >
                                Race Control
                            </button>
                            <Link
                                href="/superlicense"
                                className="border border-zinc-800 bg-[#10151c] text-zinc-300 hover:border-amber-500 hover:text-amber-400 hover:bg-[#161c26] transition-all text-[9.5px] font-bold py-1.5 px-1 rounded-[2px] text-center uppercase tracking-wider cursor-pointer flex items-center justify-center"
                            >
                                Superlicença
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* ======================================================== */}
                {/* COLUNA CENTRAL: COMANDOS, 4 KPIS, 6 ABAS E WORKSPACE DINÂMICO */}
                {/* ======================================================== */}
                <section className="h-full flex flex-col gap-2 overflow-hidden min-w-0">
                    
                    {/* TOPO DE COMANDO: REUNIÃO TÁTICA / WAR ROOM (ESTILO SUAVE) + POSITION (AMARELO) */}
                    <div className="w-full flex items-center gap-2 shrink-0">
                        <Link
                            href={`/war-room?driver=${encodeURIComponent(me.slug || '')}&mentor=${encodeURIComponent(assignedMentor?.id || '')}`}
                            className="flex-1 py-2 px-3 rounded-[3px] border border-zinc-800 hover:border-zinc-600 bg-[#0c1017] font-black uppercase tracking-wider text-[11px] flex items-center justify-between transition-all hover:bg-[#111722] text-zinc-200 cursor-pointer group shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                                <span>&gt;_ REUNIÃO TÁTICA // WAR ROOM</span>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-[2px] bg-black/80 border border-zinc-700 text-zinc-300 group-hover:text-white flex items-center gap-1">
                                <span>ENTRAR NA MESA</span>
                                <span className="text-amber-400">»</span>
                            </span>
                        </Link>

                        <Link
                            href="/positions"
                            className="py-2 px-4 rounded-[3px] border font-black uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 transition-all hover:brightness-110 shadow-sm cursor-pointer group shrink-0"
                            style={{
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.16)',
                                color: '#f59e0b'
                            }}
                        >
                            <span>POSITION</span>
                            <span className="text-[10px] opacity-80 group-hover:text-white">»</span>
                        </Link>
                    </div>

                    {/* 4 CARDS DE COMPETIÇÃO (KPIS) EM GRID UNIFORME COM DEGRADÊ */}
                    <div className="grid grid-cols-4 gap-2 shrink-0">
                        
                        {/* POLETIME */}
                        <button
                            type="button"
                            onClick={() => router.push('/poletime')}
                            className="text-left border p-2 rounded-[3px] flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm hover:scale-[1.01]"
                            style={{
                                borderColor: poleTheme.border,
                                background: poleTheme.bg,
                                boxShadow: poleTheme.shadow
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8.5px] font-black uppercase tracking-wider ${poleTheme.text}`}>POLETIME</span>
                                <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${poleTheme.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${poleTheme.dot}`} />
                                    <span>{compStats?.poletime.hasSubmitted ? poleTheme.tag : 'PENDENTE'}</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-base sm:text-lg font-black tracking-tight text-white block truncate leading-tight font-mono">
                                    {compStats?.poletime.hasSubmitted && compStats.poletime.poleTime ? compStats.poletime.poleTime : '-- PTS'}
                                </span>
                                <div className="flex items-center justify-between text-[7.5px] mt-0.5 uppercase font-bold" style={{ color: poleTheme.textColor }}>
                                    <span>{compStats?.poletime.hasSubmitted ? `P${competitionTiers.meta.globalRank} GLOBAL` : 'SEM PREVISÃO'}</span>
                                    <span>{compStats?.poletime.hasSubmitted ? compStats.poletime.accuracy : 'QUALIFY'}</span>
                                </div>
                            </div>
                        </button>

                        {/* MASTER */}
                        <button
                            type="button"
                            onClick={() => setRankingModalComp('master')}
                            className="text-left border p-2 rounded-[3px] flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm hover:scale-[1.01]"
                            style={{
                                borderColor: masterTheme.border,
                                background: masterTheme.bg,
                                boxShadow: masterTheme.shadow
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8.5px] font-black uppercase tracking-wider ${masterTheme.text}`}>MASTER</span>
                                <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${masterTheme.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${masterTheme.dot}`} />
                                    <span>{compStats?.master.hasSubmitted ? (competitionTiers.master === 'green' ? 'TOP 10' : 'FORA TOP 10') : 'PENDENTE'}</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-base sm:text-lg font-black tracking-tight text-white block truncate leading-tight font-mono">
                                    {compStats?.master.hasSubmitted ? `${compStats.master.picksCount}/10` : '-- PTS'}
                                </span>
                                <div className="flex items-center justify-between text-[7.5px] mt-0.5 uppercase font-bold" style={{ color: masterTheme.textColor }}>
                                    <span>P{competitionTiers.meta.userGroupRank} NO GRUPO</span>
                                    <span>{competitionTiers.master === 'green' ? 'ZONA FIA' : 'FORA PONTOS'}</span>
                                </div>
                            </div>
                        </button>

                        {/* MILESIMUS */}
                        <button
                            type="button"
                            onClick={() => setRankingModalComp('milesimus')}
                            className="text-left border p-2 rounded-[3px] flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm hover:scale-[1.01]"
                            style={{
                                borderColor: milesimusTheme.border,
                                background: milesimusTheme.bg,
                                boxShadow: milesimusTheme.shadow
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8.5px] font-black uppercase tracking-wider ${milesimusTheme.text}`}>MILESIMUS</span>
                                <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${milesimusTheme.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${milesimusTheme.dot}`} />
                                    <span>{milesimusTheme.tag}</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-base sm:text-lg font-black tracking-tight text-white block truncate leading-tight font-mono">
                                    {compStats?.milesimus.formatted || '000.100'} <span className="text-[8px] text-zinc-400">mls</span>
                                </span>
                                <div className="flex items-center justify-between text-[7.5px] mt-0.5 uppercase font-bold" style={{ color: milesimusTheme.textColor }}>
                                    <span>P{competitionTiers.meta.globalRank} DE {competitionTiers.meta.totalGlobal}</span>
                                    <span className="truncate">{compStats?.milesimus.tier}</span>
                                </div>
                            </div>
                        </button>

                        {/* TEAMWORK */}
                        <button
                            type="button"
                            onClick={() => setRankingModalComp('teamwork')}
                            className="text-left border p-2 rounded-[3px] flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm hover:scale-[1.01]"
                            style={{
                                borderColor: teamworkTheme.border,
                                background: teamworkTheme.bg,
                                boxShadow: teamworkTheme.shadow
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8.5px] font-black uppercase tracking-wider ${teamworkTheme.text}`}>TEAMWORK</span>
                                <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${teamworkTheme.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${teamworkTheme.dot}`} />
                                    <span>{teamworkTheme.tag}</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-base sm:text-lg font-black tracking-tight text-white block truncate leading-tight font-mono">
                                    {compStats?.teamwork.averageMls} <span className="text-[8px] text-zinc-400">mls</span>
                                </span>
                                <div className="flex items-center justify-between text-[7.5px] mt-0.5 uppercase font-bold" style={{ color: teamworkTheme.textColor }}>
                                    <span>MÉDIA COLETIVA</span>
                                    <span className="truncate max-w-[70px]">{compStats?.teamwork.squadName}</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* BARRA DE 6 ABAS PRINCIPAIS EM GRID UNIFORME (SEM TRUNCAMENTO) */}
                    <div className="grid grid-cols-6 gap-1 w-full bg-[#0a0e14] p-1 rounded border border-zinc-800 shrink-0">
                        {[
                            { key: 'raceweek', label: 'RACE WEEK', activeColor: 'text-amber-400', isLive: raceWeek },
                            { key: 'quotes', label: 'COTAÇÃO MLS', activeColor: 'text-emerald-400' },
                            { key: 'telemetry', label: 'TELEMETRIA', activeColor: 'text-sky-400' },
                            { key: 'grid', label: 'GRID & EQUIPES', activeColor: 'text-amber-400' },
                            { key: 'stewards', label: 'STEWARDS', activeColor: 'text-red-400', badge: stewardVoting.pendingReports.length },
                            { key: 'paddock', label: 'PADDOCK', activeColor: 'text-yellow-400' },
                        ].map(tab => {
                            const isActive = activeMainTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveMainTab(tab.key as MainTab)}
                                    className={`relative py-1.5 px-1 rounded-[2px] text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                        isActive
                                            ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                                    }`}
                                >
                                    {tab.isLive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    )}
                                    <span className={isActive ? tab.activeColor : ''}>{tab.label}</span>
                                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                                        <span className="text-[8px] px-1 rounded-full bg-red-500/80 text-white font-mono font-bold">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* CARD DO CONSELHEIRO: BANNER HORIZONTAL COMPACTO DE RÁDIO */}
                    {assignedMentor && (
                        <div className="flex flex-row items-center gap-3 p-2 rounded bg-[#0d1117] border-l-[3px] border-amber-500 border-t border-r border-b border-zinc-800/80 shrink-0 shadow-sm">
                            {/* Avatar pixel art 56x56px */}
                            <div className="w-[56px] h-[56px] rounded border border-zinc-700 bg-black overflow-hidden shrink-0 relative">
                                <img
                                    src={assignedMentor.avatarUrl || `/avatar/ex_drivers/avatar_driver_${parseInt(assignedMentor.id.replace('strat-', ''), 10) || 1}.jpg`}
                                    alt={assignedMentor.displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/avatar/ex_drivers/avatar_driver_1.jpg';
                                    }}
                                />
                                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500" />
                            </div>

                            {/* Conteúdo de rádio e alvo tático */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-amber-400 text-xs tracking-wider">
                                        [ {assignedMentor.code} ]
                                    </span>
                                    <span className="text-[8.5px] text-zinc-400 uppercase tracking-widest">
                                        RÁDIO DO CONSELHEIRO // {ALLIANCES[allianceId].short}
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-[11px] leading-snug italic mt-0.5 line-clamp-2">
                                    "{mentorVoice?.quote || 'Monopostos aprovados na balança sem infrações. O alvo de Poletime projetado pela equipe fica na faixa recomendada. Mantenha foco no grid.'}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* WORKSPACE DINÂMICO CENTRAL (COM SCROLL INTERNO QUANDO NECESSÁRIO) */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar rounded border border-zinc-800/80 bg-[#090c12]/90 p-3">
                        
                        {/* 1. ABA RACE WEEK: CRONOGRAMA */}
                        {activeMainTab === 'raceweek' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                        &gt;_ CRONOGRAMA OFICIAL DA SEMANA DE CORRIDA
                                    </span>
                                    <span className="text-[9px] text-zinc-400">RODADA EM ANDAMENTO</span>
                                </div>
                                <RaceWeekSchedule
                                    compact={true}
                                    teamCode={me.teamCode || "FER"}
                                    mentorId={assignedMentor?.id}
                                    mentor={assignedMentor}
                                    accentColor={mainAccent}
                                />
                            </div>
                        )}

                        {/* 2. ABA COTAÇÃO MLS: MÓDULO E GRÁFICO TRAZIDOS PARA CIMA DA DOBRA */}
                        {activeMainTab === 'quotes' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1 border-b border-zinc-800">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
                                            {compStats?.milesimus.formatted || '000.100'}
                                        </span>
                                        <span className="text-xs text-zinc-400">MLS</span>
                                        <span className="text-xs font-bold text-emerald-400">● COTAÇÃO OFICIAL DE ABERTURA</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {([5, 10, 24] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setRange(r)}
                                                className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase transition-colors cursor-pointer ${
                                                    range === r ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white bg-black/50 border border-zinc-800'
                                                }`}
                                            >
                                                {r}R
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <PriceChart data={series} startRound={25 - series.length} teamColor={mainAccent} />

                                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                                    <div className="p-2 rounded bg-black/60 border border-zinc-800">
                                        <span className="text-zinc-400 block text-[8px] uppercase">MÁXIMA DA TEMPORADA</span>
                                        <span className="text-zinc-200 font-bold font-mono">{fmt(Math.max(...series))} MLS</span>
                                    </div>
                                    <div className="p-2 rounded bg-black/60 border border-zinc-800">
                                        <span className="text-zinc-400 block text-[8px] uppercase">MÍNIMA REGISTRADA</span>
                                        <span className="text-zinc-200 font-bold font-mono">{fmt(Math.min(...series))} MLS</span>
                                    </div>
                                    <div className="p-2 rounded bg-black/60 border border-zinc-800">
                                        <span className="text-zinc-400 block text-[8px] uppercase">ESTABILIDADE</span>
                                        <span className="text-emerald-400 font-bold">ESTÁVEL (0,00%)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. ABA TELEMETRIA: ORDENS E HISTÓRICO */}
                        {activeMainTab === 'telemetry' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                                        &gt;_ LOG DE TELEMETRIA & ORDENS DE GARAGEM
                                    </span>
                                    <span className="text-[9px] text-zinc-400">{activityHistory.length} EVENTOS</span>
                                </div>
                                {activityHistory.length > 0 ? (
                                    activityHistory.map((act, i) => (
                                        <div key={i} className="p-2 rounded bg-black/50 border border-zinc-800 flex items-start justify-between gap-2 text-xs">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase" style={{ backgroundColor: `${act.color}20`, color: act.color }}>
                                                        {act.badge}
                                                    </span>
                                                    <span className="font-bold text-zinc-200">{act.title}</span>
                                                </div>
                                                <p className="text-[10.5px] text-zinc-400">{act.desc}</p>
                                            </div>
                                            <span className="text-[8.5px] text-zinc-500 shrink-0">{act.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-zinc-400 text-xs p-4 text-center">Nenhum evento registrado ainda.</p>
                                )}
                            </div>
                        )}

                        {/* 4. ABA GRID & EQUIPES */}
                        {activeMainTab === 'grid' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                        &gt;_ GRID OFICIAL DE ESTRATEGISTAS E ESCUDERIAS
                                    </span>
                                    <span className="text-[9px] text-zinc-400">{field.length} INSCRITOS</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {field.map((s, idx) => (
                                        <div key={s.id} className="p-2 rounded bg-black/60 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-zinc-500 font-bold text-[9px] w-4">{idx + 1}</span>
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.teamColor }} />
                                                <div className="truncate">
                                                    <p className="font-bold text-zinc-200 truncate">{s.name}</p>
                                                    <p className="text-[9px] text-zinc-400">{s.teamName} · Grupo {s.groupId}</p>
                                                </div>
                                            </div>
                                            <span className="text-zinc-300 font-mono font-bold text-[11px] shrink-0">{formatMls(s.mlsBalance ?? 100)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. ABA STEWARDS: VOTING E REPORT */}
                        {activeMainTab === 'stewards' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                                        &gt;_ COMISSÁRIOS DA FIA // RELATÓRIOS & VOTAÇÕES
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsVotingModalOpen(true)}
                                        className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold uppercase hover:bg-red-500/30 cursor-pointer"
                                    >
                                        [ ABRIR MESA DE VOTOS ]
                                    </button>
                                </div>
                                <StewardAlertBanner
                                    pendingReports={stewardVoting.pendingReports}
                                    unvotedCount={stewardVoting.unvotedPendingCount}
                                    onOpenVoting={() => setIsVotingModalOpen(true)}
                                    onOpenReport={() => setOperationalModal('report')}
                                />
                                <div className="p-3 rounded bg-black/60 border border-zinc-800 text-xs space-y-1 text-zinc-300">
                                    <p className="font-bold text-zinc-100">Painel de Integridade do Campeonato</p>
                                    <p className="text-zinc-400 text-[11px]">
                                        Denúncias e votações técnicas dos comissários de prova garantem a lisura dos palpites de Poletime e Master.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 6. ABA PADDOCK: DESPACHOS E RÁDIO WIRE */}
                        {activeMainTab === 'paddock' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                                        &gt;_ PADDOCK WIRE // COMUNICAÇÕES TÁTICAS
                                    </span>
                                    <span className="text-[9px] text-zinc-400">CANAL FECHADO</span>
                                </div>
                                <div className="p-3 rounded bg-black/60 border border-zinc-800 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-[9px] text-zinc-400">
                                        <span className="font-bold text-amber-400">[COMUNICADO OFICIAL FIA // ETAPA ATUAL]</span>
                                        <span>CANAL CRIPTOGRAFADO</span>
                                    </div>
                                    <p className="text-zinc-300 text-[11px]">
                                        Todos os estrategistas confirmados estão autorizados para despacho de Poletime até a abertura do Q1. A cotação base de abertura permanecerá em 100,00 MLS até a homologação da primeira etapa.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ======================================================== */}
                {/* COLUNA DIREITA: ALIANÇAS COMPACTAS E RANKINGS EM ABAS */}
                {/* ======================================================== */}
                <aside className="h-full flex flex-col gap-2 overflow-hidden bg-[#090c12]/90 border border-zinc-800/80 rounded p-2">
                    
                    {/* ÍNDICES DAS ALIANÇAS COMPACTOS EM 1 LINHA CADA */}
                    <div className="shrink-0 p-2 rounded bg-black/80 border border-zinc-800 space-y-1.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">
                            &gt;_ ÍNDICES DAS ALIANÇAS
                        </span>
                        {allianceIdx.map(a => (
                            <div
                                key={a.k}
                                className={`flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#0e131b] border border-zinc-800 text-xs ${
                                    a.k === allianceId ? 'border-l-2 border-l-amber-500' : ''
                                }`}
                            >
                                <div className="min-w-0">
                                    <span className="text-[7.5px] text-zinc-400 block font-mono">IDX.{a.k}</span>
                                    <span className="font-bold text-zinc-200 text-[10px] tracking-wider truncate block">
                                        {ALLIANCES[a.k].short}
                                    </span>
                                </div>
                                <Sparkline data={a.s.slice(-10)} width={50} height={18} strokeColor={a.k === allianceId ? '#f59e0b' : '#71717a'} />
                                <div className="text-right shrink-0">
                                    <span className="font-bold text-zinc-100 text-[10.5px] tabular-nums block font-mono">{fmt(a.v)}</span>
                                    <Delta value={a.c} className="text-[8px]" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAINEL ÚNICO DE RANKINGS COM 3 ABAS INTERNAS NO TOPO */}
                    <div className="flex-1 min-h-0 flex flex-col rounded bg-black/80 border border-zinc-800 overflow-hidden">
                        
                        {/* 3 ABAS DE RANKING NO TOPO */}
                        <div className="grid grid-cols-3 border-b border-zinc-800 bg-[#0d121a] p-1 gap-1 shrink-0">
                            {[
                                { key: 'master', label: 'MASTER' },
                                { key: 'milesimus', label: 'MILESIMUS' },
                                { key: 'poletime', label: 'POLETIME' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveRankingTab(tab.key as RankingTab)}
                                    className={`py-1 text-[9.5px] font-black uppercase tracking-wider rounded-[2px] transition-all cursor-pointer text-center ${
                                        activeRankingTab === tab.key
                                            ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* LISTA DO TOP 10 CORRESPONDENTE À ABA ATIVA */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar divide-y divide-zinc-800/60">
                            {(() => {
                                const currentList = activeRankingTab === 'master'
                                    ? masterTop10
                                    : activeRankingTab === 'milesimus'
                                    ? milesimusTop10
                                    : poletimeTop10;

                                return currentList.map((item, i) => {
                                    const isMe = item.s.id === me.id;
                                    return (
                                        <div
                                            key={`${activeRankingTab}-${item.s.id}-${i}`}
                                            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors ${
                                                isMe ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : 'hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <span className={`w-4 text-right font-black tabular-nums text-[10px] ${
                                                i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'
                                            }`}>
                                                {i + 1}
                                            </span>

                                            <span
                                                className="w-1 h-5 rounded-full shrink-0"
                                                style={{ backgroundColor: item.s.teamColor }}
                                            />

                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold truncate text-[10.5px] leading-tight ${isMe ? 'text-amber-400' : 'text-zinc-200'}`}>
                                                    {item.s.name}
                                                </p>
                                                <span className="text-[8px] text-zinc-400 uppercase">{item.s.teamCode}</span>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="font-bold tabular-nums font-mono text-[10.5px] text-zinc-100">{item.value}</p>
                                                <span className="text-[8px] text-zinc-400 block font-mono">{item.sub}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </aside>
            </div>

            {/* MODAL OPERACIONAL OVERLAY (SETUP, CALENDAR, ETC.) */}
            {operationalModal !== 'none' && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
                    <div className="w-full max-w-2xl max-h-[90vh] bg-[#0c1017] border border-zinc-700 rounded-md shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-[#080b10]">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                MÓDULO OPERACIONAL // {operationalModal.replace('_', ' ').toUpperCase()}
                            </span>
                            <button
                                type="button"
                                onClick={() => setOperationalModal('none')}
                                className="text-zinc-400 hover:text-white font-bold text-xs uppercase px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-600 cursor-pointer"
                            >
                                [ FECHAR ✕ ]
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 text-xs">
                            {operationalModal === 'setup' && <SetupForm />}
                            {operationalModal === 'calendar' && <Calendar />}
                            {operationalModal === 'silly_season' && <SillySeason />}
                            {operationalModal === 'telemetry' && <TelemetryView />}
                            {operationalModal === 'pitwall' && <PitwallView />}
                            {operationalModal === 'race_control' && <RaceControlView />}
                            {operationalModal === 'report' && (
                                <ReportForm
                                    onReportSubmitted={() => stewardVoting.refresh()}
                                    onBackToDashboard={() => setOperationalModal('none')}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE RANKINGS COMPLETOS DE COMPETIÇÃO */}
            {rankingModalComp && (
                <CompetitionRankingsScreen
                    isModal={true}
                    initialComp={rankingModalComp}
                    onClose={() => setRankingModalComp(null)}
                    userSlug={me?.slug}
                    userTeamColor={mainAccent}
                />
            )}

            {/* MODAL DE VOTAÇÃO DOS COMISSÁRIOS (STEWARDS) */}
            <StewardVotingModal
                isOpen={isVotingModalOpen}
                onClose={() => setIsVotingModalOpen(false)}
                reports={stewardVoting.reports}
                myVotes={stewardVoting.myVotes}
                votingReportId={stewardVoting.votingReportId}
                voteError={stewardVoting.voteError}
                isAuthenticated={stewardVoting.isAuthenticated}
                onVote={(reportId, choice) => stewardVoting.castVote(reportId, choice)}
                onOpenReport={() => setOperationalModal('report')}
            />
        </main>
    );
}

function DashboardLoading() {
    return (
        <div className="w-screen h-screen bg-[#06080a] flex flex-col items-center justify-center font-mono gap-4 text-zinc-100">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-amber-500" />
            <p className="text-xs font-bold tracking-widest text-amber-400 animate-pulse">&gt;_ SINCRONIZANDO COCKPIT 100VH DO ESTRATEGISTA...</p>
        </div>
    );
}

export default function NewConceptDashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardCockpit />
        </Suspense>
    );
}
