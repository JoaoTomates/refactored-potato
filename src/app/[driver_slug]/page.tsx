"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams, notFound } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';
import { PilotAvatar, AvatarVariant } from '@/components/pilot-avatar';
import Settings from "@/components/settings";
import SetupForm from "@/components/setup-form";
import Calendar from "@/components/calendar";
import ReportForm from "@/components/report-form";
import { StewardAlertBanner, StewardVotingModal, useStewardVoting } from "@/components/steward-voting-panel";
import PitwallQuickDock, { DashboardSubView } from "@/components/pitwall-quick-dock";
import SillySeason from "@/components/silly-season";
import RaceWeekSchedule from "@/components/race-week-schedule";
import PaddockRadioPlayer from "@/components/paddock-radio-player";
import NasdaqTicker from "@/components/nasdaq-ticker";
import CompetitionRankingsScreen, { CompetitionKey } from "@/components/competition-rankings-screen";
import { DIALOGUE_BOX_GRADIENT, getDialogueShadow } from "@/components/dialogue-box";
import { getSystemBoxStyle } from "@/components/system-modal";
import F1HubView from "@/components/views/f1-hub-view";
import F1ClassificationView from "@/components/views/f1-classification-view";
import CrewView from "@/components/views/crew-view";
import NewsFeedView from "@/components/views/news-feed-view";
import TelemetryView from "@/components/views/telemetry-view";
import PitwallView from "@/components/views/pitwall-view";
import RaceControlView from "@/components/views/race-control-view";
import NextRaceView from "@/components/views/next-race-view";
import PositionsView from "@/components/views/positions-view";
import { usePathname } from 'next/navigation';
import { nextRaceStart, isRaceWeek } from '@/lib/race';
import { formatMls, formatTimeAgo } from '@/lib/mls';
import { getCountryFlag } from '@/lib/country-flags';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug, slugAlphanumericKey } from '@/lib/slug';
import { TeamworkSquad, getStrategistSquad, createTeamworkSquad, joinTeamworkSquad, leaveTeamworkSquad } from '@/lib/teamwork';
import {
    SeniorStrategist,
    getSeniorStrategistById,
    getSeniorStrategistForRound,
    getStrategistVoice,
    AllianceBlock
} from '@/lib/race-directors';
import { getGroupTechnicalEngineer, GroupTechnicalEngineer } from '@/lib/group-engineers';
import { getRealF1Driver, RealF1Driver, getTeamCarColor, getTeamPrimaryColor, getContrastingTextColor } from '@/lib/real-f1-drivers';
import { getTeamPrincipal, TeamPrincipal } from '@/lib/paddock-crew';
import { useThemeStore, STANDARD_ACCENT_OPTIONS } from '@/store/useThemeStore';


/* ============================================================
 * TS1 // DASHBOARD OFICIAL DO ESTRATEGISTA (PÁGINA DO ARROBA)
 * Integrado com:
 * 1. Poletime (Qualify & Grid)
 * 2. Master (Previsões de Corrida)
 * 3. Milesimus (MLS Currency)
 * 4. Teamwork (Duplas e Construtores)
 * Painel Central Multifuncional com Tabs dinâmicas:
 *  - Cotação do Estrategista (Gráfico Interativo)
 *  - Book de Previsões (Mercados e Apostas)
 *  - Rádio do Diretor (Live Transmissions)
 *  - Histórico de Telemetria (Log de Atividades)
 *  - Gestão de Teamwork (Pit Crew & Grid 22)
 * Barra de Comandos / Operações (Setup, Report, Calendar, Silly Season,
 * Settings, Telemetry, Pitwall, Superlicense e Logout).
 * ============================================================ */

const ALLIANCES = {
    A: { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'ESTRELA', codes: ['MER', 'MCL', 'ALP', 'WIL'] },
    B: { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'MARANELLO', codes: ['FER', 'HAA', 'CAD'] },
    C: { id: 'C', name: 'A VANGUARDA', short: 'VANGUARDA', codes: ['RBR', 'RBA', 'AST', 'AUD'] },
} as const;
type AllianceId = keyof typeof ALLIANCES;

const ALLIANCE_CHIEFS_DATA: Record<AllianceId, { avatarUrl: string; fallbackUrl: string; chiefName: string; chiefRole: string }> = {
    A: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_a.jpg',
        fallbackUrl: '/avatar/others/alianca_1_a.jpg',
        chiefName: 'D. CHADWICK',
        chiefRole: 'Engenheiro-Chefe de Calibração Térmica'
    },
    B: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_a.jpg',
        fallbackUrl: '/avatar/others/alianca_2_a.jpg',
        chiefName: 'M. BELLINI',
        chiefRole: 'Mestre de Metalurgia & Resistência'
    },
    C: {
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_a.jpg',
        fallbackUrl: '/avatar/others/alianca_3_a.jpg',
        chiefName: 'S. ZIMMERMANN',
        chiefRole: 'Analista de Lubrificação & Refrigeração'
    }
};

const allianceForCode = (code?: string): AllianceId =>
    (Object.keys(ALLIANCES) as AllianceId[]).find(k => (ALLIANCES[k].codes as readonly string[]).includes(code || '')) || 'A';

/* ---------- Pseudo-random determinístico ---------- */
function hashString(s: string) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seeded(seed: number) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function buildSeries(key: string, n = 24, base = 100, vol = 0.12) {
    const rnd = seeded(hashString(key));
    const out: number[] = [];
    let v = base * (0.7 + rnd() * 0.6);
    for (let i = 0; i < n; i++) {
        v = Math.max(15, v * (1 + (rnd() - 0.46) * vol));
        out.push(+v.toFixed(2));
    }
    return out;
}

const pct = (a: number | undefined | null, b: number | undefined | null) => {
    const valA = typeof a === 'number' && isFinite(a) ? a : 0;
    const valB = typeof b === 'number' && isFinite(b) ? b : 0;
    return valB === 0 ? 0 : ((valA - valB) / valB) * 100;
};

const fmt = (v: number | undefined | null) => {
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
        return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0,00';
};

const ratingFor = (v: number) => (v >= 160 ? 'AAA' : v >= 130 ? 'AA' : v >= 105 ? 'A' : v >= 85 ? 'BBB' : v >= 65 ? 'BB' : 'B');

/* ---------- Tipos ---------- */
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

type MainTab = 'quotes' | 'book' | 'radio' | 'history' | 'teamwork';

function makeStrategist(id: string, name: string, slug: string | null, teamId: string | undefined, groupId: number, isDemo = false, mlsBalance: number = 100): Strategist {
    const team = F1_TEAMS.find(t => t.id === teamId || t.logo === teamId) || F1_TEAMS[hashString(id) % F1_TEAMS.length];
    const baseVal = typeof mlsBalance === 'number' ? mlsBalance : 100;
    // Cotação real estável no saldo atual de abertura (100.00 MLS), sem resultados de GP homologados
    const realSeries = Array(24).fill(baseVal);
    return {
        id, slug, name, isDemo, groupId, mlsBalance: baseVal,
        teamCode: team.logo, teamName: team.name, teamColor: team.color,
        series: realSeries,
    };
}

/* ---------- Hooks ---------- */
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
        bg: 'linear-gradient(160deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 46, 22, 0.35) 45%, #000000 100%)',
        bgActive: 'linear-gradient(160deg, rgba(16, 185, 129, 0.32) 0%, rgba(5, 46, 22, 0.50) 45%, #000000 100%)',
        shadow: '0 0 22px rgba(16, 185, 129, 0.30)',
        badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40',
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
        bg: 'linear-gradient(160deg, rgba(245, 158, 11, 0.20) 0%, rgba(69, 26, 3, 0.35) 45%, #000000 100%)',
        bgActive: 'linear-gradient(160deg, rgba(245, 158, 11, 0.30) 0%, rgba(69, 26, 3, 0.50) 45%, #000000 100%)',
        shadow: '0 0 22px rgba(245, 158, 11, 0.30)',
        badge: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
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
        bg: 'linear-gradient(160deg, rgba(239, 68, 68, 0.20) 0%, rgba(69, 10, 10, 0.35) 45%, #000000 100%)',
        bgActive: 'linear-gradient(160deg, rgba(239, 68, 68, 0.30) 0%, rgba(69, 10, 10, 0.50) 45%, #000000 100%)',
        shadow: '0 0 22px rgba(239, 68, 68, 0.30)',
        badge: 'bg-red-500/25 text-red-300 border-red-500/40',
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

/* ============================================================
 * Componentes de UI
 * ============================================================ */

function Panel({
    title,
    tag,
    headerAction,
    children,
    className = '',
    bodyClass = 'p-4',
    accentColor = '#fbaa19',
    collapsible = false,
    defaultOpen = true,
}: {
    title: string;
    tag?: React.ReactNode;
    headerAction?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClass?: string;
    accentColor?: string;
    collapsible?: boolean;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className={`relative border border-[#000000] rounded-[3px] overflow-hidden animate-fade-in transition-all duration-300 ${className}`}
            style={{
                background: DIALOGUE_BOX_GRADIENT,
                boxShadow: getDialogueShadow('left', accentColor),
            }}
        >
            <div
                onClick={collapsible ? () => setIsOpen(prev => !prev) : undefined}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b transition-colors ${collapsible ? 'cursor-pointer select-none hover:bg-white/[0.04]' : ''}`}
                style={{
                    borderBottomColor: (!collapsible || isOpen) ? `${accentColor}25` : 'transparent',
                    background: `linear-gradient(90deg, ${accentColor}0d, transparent)`
                }}
            >
                <span
                    className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase truncate flex items-center gap-1.5"
                    style={{ color: accentColor }}
                >
                    <span className="opacity-60">&gt;_</span> {title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {tag && <span className="text-[9px] tracking-widest text-white/40 uppercase shrink-0">{tag}</span>}
                    {headerAction && <div onClick={(e) => e.stopPropagation()} className="flex items-center">{headerAction}</div>}
                    {collapsible && (
                        <span
                            className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border transition-all"
                            style={{
                                borderColor: `${accentColor}40`,
                                color: accentColor,
                                backgroundColor: `${accentColor}10`
                            }}
                            aria-label={isOpen ? "Recolher painel" : "Expandir painel"}
                        >
                            {isOpen ? '[-]' : '[+]'}
                        </span>
                    )}
                </div>
            </div>
            {(!collapsible || isOpen) && <div className={bodyClass}>{children}</div>}
        </div>
    );
}

function Delta({ value, className = '' }: { value: number; className?: string }) {
    if (value === 0 || !isFinite(value)) {
        return (
            <span className={`text-white/40 font-bold tabular-nums ${className}`}>
                ● 0,00%
            </span>
        );
    }
    const up = value > 0;
    return (
        <span className={`${up ? 'text-emerald-400' : 'text-red-400'} font-bold tabular-nums ${className}`}>
            {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
        </span>
    );
}

/** Arrow-only sidebar toggle bar shared by left and right columns in both collapsed and expanded states. */
function SidebarToggleButton({
    side,
    collapsed,
    accentColor,
    isStandardStyle = false,
    onClick,
}: {
    side: 'left' | 'right';
    collapsed: boolean;
    accentColor: string;
    isStandardStyle?: boolean;
    onClick: () => void;
}) {
    const pointsRight = (side === 'left' && collapsed) || (side === 'right' && !collapsed);
    const label = `${collapsed ? 'Expandir' : 'Retrair'} painel ${side === 'left' ? 'esquerdo' : 'direito'}`;
    const bgClass = isStandardStyle ? 'bg-black' : collapsed ? 'bg-black/85' : 'bg-black/80';
    const borderColor = isStandardStyle
        ? collapsed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'
        : `${accentColor}${collapsed ? '40' : '30'}`;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-lg border ${bgClass} hover:bg-white/[0.06] transition-all flex items-center cursor-pointer group ${
                collapsed
                    ? 'px-3 py-2.5 lg:py-4 lg:px-1.5 justify-center lg:min-h-[120px]'
                    : `px-3 py-1.5 ${side === 'left' ? 'justify-end' : 'justify-start'}`
            }`}
            style={{ borderColor }}
            title={label}
            aria-label={label}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 transition-transform ${
                    pointsRight ? 'group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'
                }`}
                style={{ color: accentColor }}
                aria-hidden="true"
            >
                {pointsRight ? (
                    <>
                        <path d="M6 17l5-5-5-5" />
                        <path d="M13 17l5-5-5-5" />
                    </>
                ) : (
                    <>
                        <path d="M11 17l-5-5 5-5" />
                        <path d="M18 17l-5-5 5-5" />
                    </>
                )}
            </svg>
        </button>
    );
}

function Sparkline({ data, width = 90, height = 26, strokeColor }: { data: number[]; width?: number; height?: number; strokeColor?: string }) {
    if (!data || data.length < 2) {
        return <div style={{ width, height }} />;
    }
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

function TypewriterText({ text, speed = 24 }: { text: string; speed?: number }) {
    const [shown, setShown] = useState('');
    useEffect(() => {
        let i = 0;
        setShown('');
        const t = setInterval(() => {
            i++;
            setShown(text.slice(0, i));
            if (i >= text.length) clearInterval(t);
        }, speed);
        return () => clearInterval(t);
    }, [text, speed]);
    return (
        <span className="whitespace-pre-wrap">
            {shown}
            <span className="text-[#fbaa19] animate-pulse ml-0.5">■</span>
        </span>
    );
}

/* ---------- Gráfico principal ---------- */
function PriceChart({ data, startRound, teamColor }: { data: number[]; startRound: number; teamColor?: string }) {
    if (!data || data.length < 2) {
        return (
            <div className="w-full h-[200px] md:h-[240px] flex items-center justify-center text-xs text-white/30 font-mono">
                &gt;_ CARREGANDO SÉRIE DE COTAÇÃO DO ESTRATEGISTA...
            </div>
        );
    }

    const [hover, setHover] = useState<number | null>(null);
    const W = 600, H = 220;
    const min = Math.min(...data), max = Math.max(...data);
    const isBaseline = min === max;
    const pad = isBaseline ? Math.max(10, min * 0.1) : (max - min) * 0.12 || 1;
    const lo = min - pad, hi = max + pad;
    const x = (i: number) => (i / (data.length - 1)) * W;
    const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    const stroke = teamColor || '#fbaa19';
    const idx = hover !== null && hover >= 0 && hover < data.length ? hover : data.length - 1;
    const activeVal = data[idx] ?? data[data.length - 1] ?? 0;

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setHover(Math.round(rel * (data.length - 1)));
    };

    return (
        <div className="relative w-full h-[200px] md:h-[240px] select-none touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="vgAreaSlug" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(g => (
                    <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={area} fill="url(#vgAreaSlug)" />
                <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={x(idx)} x2={x(idx)} y1="0" y2={H} stroke="rgba(255,255,255,0.18)" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Marcador */}
            <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-black pointer-events-none" style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(activeVal) / H) * 100}%`, background: stroke, boxShadow: `0 0 12px ${stroke}` }} />

            <div className="absolute top-2 pointer-events-none text-[10px] font-bold tracking-widest bg-black/80 border px-2 py-1 rounded flex items-center gap-2" style={{ left: `clamp(0px, calc(${(x(idx) / W) * 100}% - 48px), calc(100% - 170px))`, borderColor: `${stroke}40` }}>
                <span className="text-white/50">R{startRound + idx}</span>
                <span className="text-white">{fmt(activeVal)} MLS</span>
                {isBaseline && <span className="text-emerald-400 text-[9px]">● ESTÁVEL</span>}
            </div>

            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between py-1 text-[9px] text-white/30 tabular-nums pointer-events-none">
                <span>{fmt(hi)}</span>
                <span>{fmt(lo)}</span>
            </div>
        </div>
    );
}

/* ---------- Credencial / Capacete ---------- */
function CredentialCard({
    me,
    number,
    allianceId,
    mentor,
    nationality,
    realDriver,
    isOwner = false,
    onOpenSetup,
    onToggleCollapse,
}: {
    me: Strategist;
    number: string;
    allianceId: AllianceId;
    mentor?: SeniorStrategist | null;
    nationality?: string | null;
    realDriver?: RealF1Driver | null;
    isOwner?: boolean;
    onOpenSetup?: () => void;
    onToggleCollapse?: () => void;
}) {
    const badgeUid = useId().replace(/[^a-zA-Z0-9_-]/g, '_');
    const last = me.series.length > 0 ? me.series[me.series.length - 1] : 100;
    const rating = ratingFor(last);
    const cleanNationality = nationality?.trim() || '';
    const flag = getCountryFlag(cleanNationality);

    // Cor 1 se piloto 1, Cor 2 se piloto 2
    const carSeat = realDriver?.seat || 1;
    const carBgColor = getTeamCarColor(me.teamCode || me.teamName, carSeat);
    const primaryTeamColor = getTeamPrimaryColor(me.teamCode || me.teamName);
    // Regra matemática de contraste WCAG (Preto ou Branco de máxima legibilidade)
    const carTextColor = getContrastingTextColor(carBgColor);

    // Sincronização e delay de 0.5s para renderizar círculo e código do piloto junto com o capacete
    const [helmetReady, setHelmetReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setHelmetReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col gap-4 md:gap-5">
        <Panel
            title="Credencial Oficial"
            tag={me.teamCode}
            headerAction={
                onToggleCollapse ? (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="p-1 rounded border border-white/10 hover:border-white/30 bg-black/60 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-center group"
                        title="Recolher painel esquerdo"
                        aria-label="Recolher painel esquerdo"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
                            style={{ color: me.teamColor }}
                            aria-hidden="true"
                        >
                            <path d="M11 17l-5-5 5-5" />
                            <path d="M18 17l-5-5 5-5" />
                        </svg>
                    </button>
                ) : undefined
            }
            bodyClass="p-0 overflow-hidden"
            className="!bg-black bg-black"
            accentColor={me.teamColor}
        >
            {/* AVATAR BOX TRANSFORMADO EM FORMATO DE CARD AMERICANO RETANGULAR (PROPORÇÃO 2.5 x 3.5 / 5:7) */}
            <div className="p-3 bg-black flex justify-center">
                <div
                    className="relative w-full aspect-[5/7] max-w-[340px] rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all duration-300 shadow-2xl"
                    style={{
                        backgroundColor: '#000000',
                        borderColor: `${carBgColor}70`,
                        boxShadow: `inset 0 0 50px rgba(0,0,0,0.85), 0 12px 35px -8px ${carBgColor}50, 0 0 0 1px rgba(255,255,255,0.12)`
                    }}
                >
                    {/* BORDA VERMELHA COMPLETA QUE DÁ A VOLTA EM TODO O BOX (SEM CORTE) */}
                    <div
                        className="absolute inset-[8px] rounded-xl pointer-events-none border-2 z-30 transition-all duration-300"
                        style={{
                            borderColor: carBgColor,
                            boxShadow: `0 0 16px ${carBgColor}50, inset 0 0 10px ${carBgColor}20`
                        }}
                    />

                    {/* BACKGROUND BI-COLOR COM BORDA PRETA (#000000) AO REDOR DO CAPACETE */}
                    <div
                        className="absolute inset-[8px] rounded-xl overflow-hidden pointer-events-none select-none z-0"
                        style={{
                            background: 'linear-gradient(to bottom, #000000 0%, #000000 66%, #000000 66%, #000000 100%)',
                        }}
                    >
                        {/* Preenchimento colorido restrito à área do capacete (com delay sincronizado) */}
                        <div className={`absolute top-0 left-0 right-0 h-[66%] flex items-center justify-center pointer-events-none pt-3 transition-opacity duration-500 ${helmetReady ? 'opacity-100' : 'opacity-0'}`}>
                            <div
                                className="relative w-[calc(92%-5px)] aspect-square rounded-full flex items-center justify-center"
                                style={{
                                    background: `radial-gradient(circle at 50% 48%, ${carBgColor} 0%, ${carBgColor} 72%, rgba(0,0,0,0.95) 90%, #000000 98%)`,
                                }}
                            >
                                {/* LETRAS DO PILOTO REAL (LEC) CENTRALIZADAS VERTICALMENTE E DESLOCADAS PARA A ESQUERDA, SEM CURVA */}
                                <svg
                                    viewBox="0 0 300 300"
                                    className="w-full h-full select-none pointer-events-none"
                                >
                                    <defs>
                                        <filter id={`driver-code-shadow-${badgeUid}`} x="-30%" y="-30%" width="160%" height="160%">
                                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.65)" />
                                        </filter>
                                    </defs>
                                    <text
                                        x="134"
                                        y="153"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={carTextColor}
                                        filter={carTextColor === '#000000' ? undefined : `url(#driver-code-shadow-${badgeUid})`}
                                        style={{
                                            fontFamily: 'var(--font-montserrat), sans-serif',
                                            fontWeight: 900,
                                            fontSize: '61px',
                                            letterSpacing: '2px',
                                        }}
                                    >
                                        {realDriver?.code || 'LEC'}
                                    </text>
                                </svg>
                            </div>
                        </div>

                        {/* Divisória sutil na transição dos 2/3 para o terço final preto */}
                        <div className="absolute top-[66%] left-0 right-0 h-[1px] bg-white/15" />
                    </div>

                    {/* CAPACETE OFICIAL F1 COM PADDING SUPERIOR EM RELAÇÃO AO TOPO */}
                    <div className={`w-full h-full flex items-start justify-center relative scale-105 pt-5 sm:pt-7 transition-all duration-500 z-10 ${helmetReady ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="relative w-full h-[65%] flex items-center justify-center">
                            <img
                                alt="Capacete Oficial F1"
                                className="w-full h-full object-contain select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] mix-blend-screen"
                                src="/avatar-overlay.svg"
                                onLoad={() => setHelmetReady(true)}
                            />
                            <div
                                className="absolute inset-0 mix-blend-multiply pointer-events-none"
                                style={{
                                    WebkitMaskImage: 'url("/avatar-overlay.svg")',
                                    maskImage: 'url("/avatar-overlay.svg")',
                                    WebkitMaskSize: 'contain',
                                    maskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center center',
                                    maskPosition: 'center center',
                                    backgroundColor: me.teamColor
                                }}
                            />
                            <div
                                className="absolute inset-0 mix-blend-color opacity-85 pointer-events-none"
                                style={{
                                    WebkitMaskImage: 'url("/avatar-overlay.svg")',
                                    maskImage: 'url("/avatar-overlay.svg")',
                                    WebkitMaskSize: 'contain',
                                    maskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center center',
                                    maskPosition: 'center center',
                                    backgroundColor: me.teamColor
                                }}
                            />
                        </div>
                    </div>

                    {/* TERÇO FINAL (PRETO): TÍTULO, NOME CENTRALIZADO, EQUIPE/GRUPO ABAIXO E SUPERLICENÇA NO BOTTOM */}
                    <div className="absolute bottom-0 left-0 right-0 h-[34%] z-20 flex flex-col items-center justify-between px-4 pt-2 pb-3.5 select-none">
                        {/* Título no topo do rodapé com linhas laterais sutis */}
                        <div className="w-full flex items-center gap-2 shrink-0">
                            <span className="h-px flex-1 bg-white/12" />
                            <span className="text-[8px] font-mono font-bold tracking-[0.28em] text-white/60 uppercase whitespace-nowrap">
                                ESTRATEGISTA TITULAR
                            </span>
                            <span className="h-px flex-1 bg-white/12" />
                        </div>

                        {/* Bloco Centralizado: Nome do Estrategista + Equipe e Grupo logo abaixo */}
                        <div className="flex-1 w-full flex flex-col items-center justify-center gap-1.5 min-w-0">
                            <h3
                                className="font-black uppercase tracking-[0.08em] text-center leading-none truncate max-w-full font-mono"
                                style={{
                                    fontFamily: 'var(--font-montserrat), sans-serif',
                                    fontWeight: 900,
                                    color: '#FFFFFF',
                                    fontSize: 'clamp(1.25rem, 4.2vw, 1.85rem)',
                                    textShadow: `0 0 20px ${carBgColor}80, 0 2px 10px rgba(0,0,0,0.9)`
                                }}
                            >
                                {me.name}
                            </h3>

                            <div className="w-full flex items-center justify-center gap-2 min-w-0">
                                <span
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border text-[8.5px] sm:text-[9px] font-mono font-black tracking-[0.18em] uppercase truncate"
                                    style={{
                                        borderColor: `${primaryTeamColor}45`,
                                        backgroundColor: `${primaryTeamColor}14`,
                                        color: primaryTeamColor,
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: primaryTeamColor }}
                                    />
                                    {me.teamName}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] border border-white/15 bg-white/[0.04] text-[8.5px] sm:text-[9px] font-mono font-bold tracking-[0.16em] text-white/80 uppercase truncate">
                                    {getChampionGroupName(me.groupId)}
                                </span>
                            </div>
                        </div>

                        {/* Status da Superlicença no bottom */}
                        <div className="w-full flex items-center justify-center pt-1.5 border-t border-white/10 shrink-0">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/85 border border-white/15 text-[8px] font-mono tracking-widest text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>SUPERLICENÇA ATIVA</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Panel>

        {/* SEÇÃO TÉCNICA HARMONIZADA: DADOS DO ESTRATEGISTA E ESCUDERIA EM SANFONA */}
        <Panel
            title="Informações do Estrategista"
            tag={`#${number}`}
            accentColor={me.teamColor}
            collapsible={true}
            defaultOpen={false}
            bodyClass="p-0 overflow-hidden"
        >
            <div className="p-3.5 bg-gradient-to-b from-[#0a0a0c] to-black flex flex-col gap-2.5">
                {/* Linha 1: Piloto & Número */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {flag && (
                            <span
                                className="w-4 h-4 rounded-full overflow-hidden border border-white/30 inline-flex items-center justify-center shrink-0 shadow bg-black/60"
                                title={nationality || flag.code.toUpperCase()}
                            >
                                <img
                                    src={flag.flagUrl}
                                    alt={flag.code}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </span>
                        )}
                        <div className="min-w-0">
                            <span className="text-[7.5px] text-white/40 uppercase tracking-widest block font-mono">
                                ESTRATEGISTA TITULAR
                            </span>
                            <h2 className="text-base font-black tracking-wider leading-none text-white truncate font-mono">
                                {me.name}
                            </h2>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-widest block font-mono">
                            Nº
                        </span>
                        <span className="text-xl font-black font-mono tracking-tight leading-none" style={{ color: me.teamColor }}>
                            #{number}
                        </span>
                    </div>
                </div>

                {/* Piloto Designado sob comando direto do Estrategista */}
                {realDriver && (
                    <div className="bg-white/[0.03] border border-white/10 rounded p-2 flex items-center justify-between gap-2 font-mono">
                        <div className="min-w-0">
                            <span className="text-[7.5px] text-white/40 uppercase tracking-widest block">
                                PILOTO SOB SEU COMANDO
                            </span>
                            <span className="text-xs font-black text-white uppercase tracking-wider truncate block">
                                {realDriver.name}
                            </span>
                        </div>
                        <span
                            className="text-[10px] font-black px-2 py-0.5 rounded border shrink-0"
                            style={{
                                color: carBgColor,
                                borderColor: `${carBgColor}50`,
                                backgroundColor: `${carBgColor}15`,
                            }}
                        >
                            {realDriver.code} #{realDriver.number}
                        </span>
                    </div>
                )}

                {/* Linha 1.5: Nacionality (Botão -> Setup apenas para o próprio usuário) */}
                {(() => {
                    const nationalityContent = (
                        <>
                            <div className="min-w-0">
                                <span className="text-[7.5px] text-white/40 uppercase tracking-widest block mb-0.5">
                                    NACIONALITY
                                </span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    {flag && (
                                        <span className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white/30 inline-flex items-center justify-center shrink-0 bg-black/60">
                                            <img
                                                src={flag.flagUrl}
                                                alt={flag.code}
                                                className="w-full h-full object-cover rounded-full"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        </span>
                                    )}
                                    <span
                                        className={`text-xs font-bold uppercase truncate ${
                                            cleanNationality ? 'text-white' : 'text-white/50'
                                        }`}
                                    >
                                        {cleanNationality || 'UNDEFINED'}
                                    </span>
                                </div>
                            </div>
                            {isOwner && onOpenSetup && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fbaa19]/70 group-hover:text-[#fbaa19] shrink-0 transition-colors">
                                    SETUP »
                                </span>
                            )}
                        </>
                    );

                    return isOwner && onOpenSetup ? (
                        <button
                            type="button"
                            onClick={onOpenSetup}
                            className="w-full text-left bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-[#fbaa19]/50 rounded p-2 transition-all flex items-center justify-between gap-2 cursor-pointer group font-mono"
                            title="Abrir Setup"
                        >
                            {nationalityContent}
                        </button>
                    ) : (
                        <div className="w-full text-left bg-white/[0.02] border border-white/5 rounded p-2 flex items-center justify-between gap-2 font-mono">
                            {nationalityContent}
                        </div>
                    );
                })()}

                {/* Linha 2: Equipe e Grid/Grupo (Harmonizados em 2 colunas com labels técnicos) */}
                <div className="grid grid-cols-2 gap-2 text-left font-mono">
                    <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-widest block mb-0.5">
                            ESCUDERIA
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: me.teamColor }} />
                            <span className="text-xs font-bold text-white uppercase truncate">
                                {me.teamName}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-widest block mb-0.5">
                            GRID // GRUPO
                        </span>
                        <span className="text-xs font-bold text-white/90 uppercase truncate block">
                            {getChampionGroupName(me.groupId)}
                        </span>
                    </div>
                </div>

                {/* Linha 3: Aliança e Rating */}
                <div className="grid grid-cols-2 gap-2 text-left font-mono">
                    <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-widest block mb-0.5">
                            ALIANÇA TÉCNICA
                        </span>
                        <span className="text-xs font-bold text-[#fbaa19] uppercase truncate block">
                            {ALLIANCES[allianceId].short}
                        </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded p-2">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-widest block mb-0.5">
                            RATING TÁTICO
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest block" style={{ color: me.teamColor }}>
                            {rating}
                        </span>
                    </div>
                </div>
            </div>

            {/* Conselheiro Sênior Vinculado */}
            {mentor && (
                <div className="px-3.5 py-2 border-t border-white/10 bg-black flex items-center justify-between text-[10px] font-mono">
                    <div>
                        <span className="text-white/40 block text-[7px] uppercase tracking-widest">CONSELHEIRO SÊNIOR</span>
                        <span className="font-bold text-[#fbaa19] tracking-wider text-xs">{mentor.code}</span>
                    </div>
                    <span className="text-[8.5px] text-white/60 border border-white/10 px-2 py-0.5 rounded bg-white/[0.03]">
                        {mentor.displayName} ({mentor.decade})
                    </span>
                </div>
            )}
        </Panel>
        </div>
    );
}

/* ============================================================
 * Página Principal Oficial: /[driver_slug]
 * ============================================================ */
export default function OfficialStrategistDashboard() {
    const router = useRouter();
    const params = useParams();
    const { user, isLoading: authLoading, logout } = useSupabaseAuth();
    const pathname = usePathname();
    const now = useNow();


    const rawSlug = (params?.driver_slug as string) || '';
    if (rawSlug && (/\.(ico|png|jpg|jpeg|gif|svg|webp|txt|xml|json|map|js|css|woff2?|ttf|eot)$/i.test(rawSlug) || rawSlug.startsWith('_'))) {
        notFound();
    }
    const decodedSlug = rawSlug ? decodeURIComponent(rawSlug) : '';
    const targetSlug = decodedSlug.startsWith('@') ? decodedSlug : (decodedSlug ? `@${decodedSlug}` : '');

    const [loading, setLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<any>(null);
    const [mySlug, setMySlug] = useState<string | null>(null);
    const [mySetupCompleted, setMySetupCompleted] = useState<boolean>(false);
    const [me, setMe] = useState<Strategist | null>(null);
    const [userPrediction, setUserPrediction] = useState<any>(null);
    const [teamPartner, setTeamPartner] = useState<{ id: string; name: string; slug: string | null; driverNumber?: string; avatarUrl?: string | null } | null>(null);
    const [userSeat, setUserSeat] = useState<1 | 2>(1);
    const [activeContract, setActiveContract] = useState<any>(null);
    const [squad, setSquad] = useState<TeamworkSquad | null>(null);
    const [squadNameInput, setSquadNameInput] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [squadActionLoading, setSquadActionLoading] = useState(false);
    const [squadActionMsg, setSquadActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [field, setField] = useState<Strategist[]>([]);
    const [allPredictions, setAllPredictions] = useState<Map<string, any>>(new Map());
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [feedIdx, setFeedIdx] = useState(0);
    const [assignedMentor, setAssignedMentor] = useState<SeniorStrategist | null>(null);

    // Estado da Tab ativa no Painel Central Multifuncional
    const [activeTab, setActiveTab] = useState<MainTab>('quotes');

    // Tela / Modal do Ranking de Competições (Estilo Telemetria)
    const [rankingModalComp, setRankingModalComp] = useState<CompetitionKey | null>(null);

    // Subtelas operacionais e páginas embarcadas no Dashboard
    const [activeView, setActiveView] = useState<DashboardSubView>("menu");
    const [isRaceWeekVisible, setIsRaceWeekVisible] = useState(true);
    const openSubView = (view: DashboardSubView) => {
        setActiveView(view);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(true);
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const stewardVoting = useStewardVoting();

    useEffect(() => {
        if (authLoading) return;

        const loadDashboard = async () => {
            try {
                // 1. Busca perfil pelo slug da URL de forma determinística e resiliente
                let profileData: any = null;
                if (targetSlug) {
                    const rawClean = decodedSlug.replace(/^@+/, '').trim();
                    const lowerClean = rawClean.toLowerCase();
                    const withAtLower = `@${lowerClean}`;
                    const cleanAlpha = slugAlphanumericKey(rawClean);

                    // 1a. Busca exata por variações com e sem @ sem depender de maybeSingle()
                    const slugCandidates = Array.from(
                        new Set([
                            decodedSlug,
                            rawClean,
                            lowerClean,
                            withAtLower,
                            `@${rawClean}`,
                            rawClean.toUpperCase(),
                            `@${rawClean.toUpperCase()}`,
                        ].filter(Boolean))
                    );

                    const { data: exactMatches } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('slug', slugCandidates)
                        .limit(5);

                    if (exactMatches && exactMatches.length > 0) {
                        profileData =
                            exactMatches.find((p: any) => String(p.slug || '').replace(/^@+/, '').toLowerCase() === lowerClean) ||
                            exactMatches[0];
                    }

                    // 1b. Busca case-insensitive direta (sem % coringa para evitar colisão)
                    if (!profileData && lowerClean) {
                        const { data: ilikeWithAt } = await supabase
                            .from('profiles')
                            .select('*')
                            .ilike('slug', withAtLower)
                            .limit(2);
                        if (ilikeWithAt && ilikeWithAt.length > 0) {
                            profileData = ilikeWithAt[0];
                        } else {
                            const { data: ilikeNoAt } = await supabase
                                .from('profiles')
                                .select('*')
                                .ilike('slug', lowerClean)
                                .limit(2);
                            if (ilikeNoAt && ilikeNoAt.length > 0) {
                                profileData = ilikeNoAt[0];
                            }
                        }
                    }

                    // 1c. Equivalência alfanumérica exata (ex: c.santiago85 <-> @csantiago85)
                    if (!profileData && cleanAlpha.length >= 3) {
                        const { data: alphaCandidates } = await supabase
                            .from('profiles')
                            .select('*')
                            .or(`slug.ilike.%${cleanAlpha}%,slug.ilike.%${lowerClean}%`)
                            .limit(10);
                        const exactAlpha = (alphaCandidates || []).find(
                            (p: any) => slugAlphanumericKey(p.slug) === cleanAlpha
                        );
                        if (exactAlpha) profileData = exactAlpha;
                    }

                    // 1d. Se o padrão for L.GUSTAVO88 ou L.GUSTAVO (inicial + sobrenome + número opcional)
                    if (!profileData && lowerClean.includes('.')) {
                        const parts = lowerClean.split('.');
                        const firstInitial = parts[0]?.trim();
                        const rawSuffix = parts.slice(1).join('').trim();
                        const numMatch = rawSuffix.match(/(\d+)$/);
                        const lastPart = rawSuffix.replace(/[0-9]/g, '').trim();
                        if (firstInitial && lastPart) {
                            let q = supabase
                                .from('profiles')
                                .select('*')
                                .ilike('first_name', `${firstInitial}%`)
                                .ilike('last_name', lastPart);
                            if (numMatch) {
                                q = q.eq('driver_number', parseInt(numMatch[1], 10));
                            }
                            const { data: nameMatches } = await q.limit(2);
                            if (nameMatches && nameMatches.length === 1) {
                                profileData = nameMatches[0];
                            }
                        }
                    }
                }

                // 2. Fallback para usuário autenticado SOMENTE se não havia slug na URL (ex: rota / ou /pitwall)
                // Se a URL especificava um slug e não foi encontrado, NÃO sobrescrever com outro usuário logado
                if (!profileData && user && (!rawSlug || rawSlug === 'pitwall' || rawSlug === 'dashboard')) {
                    const { data: pUser } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();
                    profileData = pUser;
                }

                setTargetProfile(profileData);

                // Carrega o Estrategista Sênior designado ao perfil
                if (profileData?.senior_strategist_id) {
                    const mentor = getSeniorStrategistById(profileData.senior_strategist_id);
                    if (mentor) {
                        setAssignedMentor(mentor);
                    } else {
                        setAssignedMentor(getSeniorStrategistForRound(19));
                    }
                } else {
                    setAssignedMentor(getSeniorStrategistForRound(19));
                }

                // 3. Busca todos os contratos ativos no grid (com perfis reais e saldos MLS)
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

                // 3.0. Busca palpites gerais para os rankings Top 10 de Master e Poletime
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

                // 3.1. Busca direta do contrato do usuário autenticado e do perfil exibido
                let directContract = null;
                if (user) {
                    const { data: myContract } = await supabase
                        .from('contracts')
                        .select('id, user_id, team_id, group_id')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    directContract = myContract;

                    // Sempre sincroniza slug e status do usuário autenticado (sem confiar em cache antigo de outro usuário)
                    let resolvedMySlug: string | null = null;
                    let resolvedMySetup = false;

                    if (profileData && profileData.id === user.id) {
                        resolvedMySlug = normalizeAtSlug(profileData.slug);
                        resolvedMySetup = Boolean(profileData.setup_completed);
                    } else {
                        const { data: myP } = await supabase
                            .from('profiles')
                            .select('slug, setup_completed')
                            .eq('id', user.id)
                            .maybeSingle();
                        if (myP) {
                            resolvedMySlug = normalizeAtSlug(myP.slug);
                            resolvedMySetup = Boolean(myP.setup_completed);
                        }
                    }

                    setMySlug(resolvedMySlug);
                    setMySetupCompleted(resolvedMySetup);
                    if (typeof window !== 'undefined') {
                        if (resolvedMySlug) {
                            localStorage.setItem('vg_user_slug', resolvedMySlug);
                        } else {
                            localStorage.removeItem('vg_user_slug');
                        }
                    }
                } else {
                    setMySlug(null);
                    setMySetupCompleted(false);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('vg_user_slug');
                    }
                }

                // Contrato do perfil exibido na página (prioriza o perfil alvo)
                const profileContract = (contracts || []).find((c: any) => c.user_id === profileData?.id);
                const userContract = profileContract || (profileData?.id === user?.id ? directContract : null);
                setActiveContract(userContract || null);

                // 4. Se o usuário atual está sem contrato assinado E não completou setup, vai para headquarters
                if (user && profileData && user.id === profileData.id) {
                    if (!userContract && profileData.setup_completed === false) {
                        const redirectKey = 'redirect_slug_guard';
                        const count = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
                        if (count > 2) {
                            console.warn('[TS1 Guard] Loop detectado em driver_slug. Redirecionamento interrompido.');
                        } else {
                            sessionStorage.setItem(redirectKey, String(count + 1));
                            router.replace('/headquarters');
                            return;
                        }
                    } else {
                        sessionStorage.removeItem('redirect_slug_guard');
                    }
                }

                // 5. Determina o estrategista da página atual
                let currentStrategist: Strategist | null = null;
                if (profileData) {
                    const name = profileData.first_name
                        ? `${profileData.first_name.charAt(0).toUpperCase()}.${(profileData.last_name || '').trim().toUpperCase()}`
                        : (profileData.slug ? profileData.slug.replace('@', '').toUpperCase() : 'ESTRATEGISTA');

                    currentStrategist = makeStrategist(
                        profileData.id,
                        name,
                        (profileData.slug || targetSlug || '').toLowerCase() || null,
                        userContract?.team_id || profileData.team_id,
                        userContract?.group_id || 1,
                        false,
                        profileData.mls_balance ?? 100
                    );
                } else if (user && (!rawSlug || rawSlug === 'pitwall')) {
                    currentStrategist = realStrategists.find(s => s.id === user.id) || null;
                }

                if (!currentStrategist) {
                    currentStrategist = makeStrategist(
                        'visitor',
                        targetSlug ? targetSlug.replace('@', '').toUpperCase() : 'VISITANTE',
                        targetSlug || null,
                        F1_TEAMS[1].id,
                        1,
                        false,
                        100
                    );
                }

                setMe(currentStrategist);
                // Exibe estrategistas reais sem dados mockados / bots falsos
                const visibleField = realStrategists.length > 0
                    ? realStrategists
                    : (currentStrategist ? [currentStrategist] : []);
                setField(visibleField);

                // 6. Busca dados reais de previsões do usuário do dashboard
                const activeStrategistId = currentStrategist?.id;
                if (activeStrategistId && !currentStrategist.isDemo) {
                    const { data: predData } = await supabase
                        .from('predictions')
                        .select('*')
                        .eq('user_id', activeStrategistId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (predData) {
                        setUserPrediction(predData);
                    } else {
                        setUserPrediction(null);
                    }

                    // Busca esquadrão Teamwork real (máx 20 membros, independente de bloco)
                    const userSquad = await getStrategistSquad(activeStrategistId);
                    setSquad(userSquad);

                    // 7. Busca companheiro de equipe real (mesma equipe e mesmo grupo, outro usuário)
                    const myTeamId = userContract?.team_id || profileData?.team_id;
                    const myGroupId = userContract?.group_id || profileData?.group_id || 1;

                    // Define se é Carro 1 ou Carro 2 pela ordem de contratação na escuderia
                    const teamContracts = (contracts || [])
                        .filter((c: any) => c.team_id === myTeamId && c.group_id === myGroupId)
                        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    const seatIdx = teamContracts.findIndex((c: any) => c.user_id === activeStrategistId);
                    setUserSeat(seatIdx === 1 ? 2 : 1);

                    const partnerContract = (contracts || []).find((c: any) =>
                        c.team_id === myTeamId &&
                        c.group_id === myGroupId &&
                        c.user_id !== activeStrategistId
                    );

                    if (partnerContract) {
                        const p = Array.isArray(partnerContract.profiles) ? partnerContract.profiles[0] || {} : partnerContract.profiles || {};
                        const pName = p.first_name
                            ? `${p.first_name.charAt(0).toUpperCase()}.${(p.last_name || '').trim().toUpperCase()}`
                            : (p.slug ? p.slug.replace('@', '').toUpperCase() : 'COMPANHEIRO');
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
                } else {
                    setUserPrediction(null);
                    setTeamPartner(null);
                }

            } catch (err) {
                console.error("Erro ao inicializar dashboard do estrategista:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [authLoading, user, targetSlug]);

    const isOwner = Boolean(user && targetProfile && user.id === targetProfile.id);
    const myTerminalHref = user
        ? (mySlug && mySetupCompleted ? getDashboardPath(mySlug) : '/headquarters')
        : '/superlicense';

    useEffect(() => {
        if (!isOwner && (activeView === 'settings' || activeView === 'setup' || activeView === 'report' || activeView === 'silly_season')) {
            setActiveView('menu');
        }
    }, [isOwner, activeView]);

    const handleCreateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSquadActionLoading(true);
        setSquadActionMsg(null);
        const res = await createTeamworkSquad(user.id, squadNameInput);
        setSquadActionLoading(false);
        if (res.success && res.squad) {
            setSquad(res.squad);
            setSquadNameInput('');
            setSquadActionMsg({ type: 'success', text: `Esquadrão ${res.squad.name} fundado! Média inicial de 000.100 mls / 1.` });
        } else {
            setSquadActionMsg({ type: 'error', text: res.error || 'Erro ao fundar esquadrão.' });
        }
    };

    const handleJoinSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSquadActionLoading(true);
        setSquadActionMsg(null);
        const res = await joinTeamworkSquad(user.id, inviteCodeInput);
        setSquadActionLoading(false);
        if (res.success && res.squad) {
            setSquad(res.squad);
            setInviteCodeInput('');
            setSquadActionMsg({ type: 'success', text: `Integrado ao esquadrão ${res.squad.name}! Média atualizada.` });
        } else {
            setSquadActionMsg({ type: 'error', text: res.error || 'Erro ao ingressar no esquadrão.' });
        }
    };

    const handleLeaveSquad = async () => {
        if (!user) return;
        if (!confirm('Deseja realmente sair deste esquadrão Teamwork?')) return;
        setSquadActionLoading(true);
        setSquadActionMsg(null);
        const res = await leaveTeamworkSquad(user.id);
        setSquadActionLoading(false);
        if (res.success) {
            setSquad(null);
            setSquadActionMsg({ type: 'success', text: 'Você se desvinculou do esquadrão.' });
        } else {
            setSquadActionMsg({ type: 'error', text: res.error || 'Erro ao sair do time.' });
        }
    };

    const handleCopyCode = (code: string) => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2500);
        }
    };
    const allianceId = allianceForCode(me?.teamCode);
    const dashboardStyle = useThemeStore(state => state.dashboardStyle);
    const standardAccent = useThemeStore(state => state.standardAccent);
    const isStandardStyle = dashboardStyle === 'standard';
    const teamColor = me?.teamColor || '#fbaa19';
    const standardAccentHex = (STANDARD_ACCENT_OPTIONS[standardAccent] || STANDARD_ACCENT_OPTIONS.cyan).hex;
    const mainAccent = isStandardStyle ? standardAccentHex : teamColor;
    const series = me ? me.series.slice(-range) : [];
    const last = series.length > 0 ? series[series.length - 1] ?? 0 : 0;
    const prev = me && me.series.length >= 2 ? me.series[me.series.length - 2] ?? last : last;
    const isDemo = !targetProfile && (!user || !!me?.isDemo);

    // Voz e transmissão adaptada do Estrategista Sênior (Matriz de Tom: Bloco + Nacionalidade + Veterano)
    const mentorVoice = useMemo(() => {
        if (!assignedMentor) return null;
        return getStrategistVoice(
            assignedMentor,
            allianceId as AllianceBlock,
            targetProfile?.nationality,
            me?.name
        );
    }, [assignedMentor, allianceId, targetProfile, me]);

    // Engenheiro Técnico Oficial Alocado (Determinístico por grupo, sem repetição e sem números)
    const assignedEngineer = useMemo(() => {
        if (!me) return null;
        return getGroupTechnicalEngineer(me.groupId || 1, me.id || 0);
    }, [me?.groupId, me?.id]);

    // Piloto da Vida Real correspondente ao carro (Ferrari 1 = LEC, Mercedes 2 = ANT, Cadillac 1 = PER, etc.)
    const realDriver = useMemo(() => {
        if (!me) return null;
        return getRealF1Driver(me.teamName, userSeat);
    }, [me?.teamName, userSeat]);

    // Chefe de Equipe (Team Principal) oficial da escuderia
    const teamPrincipal = useMemo(() => {
        return getTeamPrincipal(me?.teamCode);
    }, [me?.teamCode]);

    // Métricas das 4 competições baseadas no ID do usuário e dados reais do banco
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
                status: hasPred ? 'HOMOLOGADO' : 'PENDENTE',
            },
            master: {
                hasSubmitted: top10Count > 0,
                picksCount: top10Count,
                points: 0,
                rank: top10Count > 0 ? `${top10Count}/10` : '--',
                podiums: 0,
                status: top10Count > 0 ? `${top10Count}/10 PILOTOS` : 'PENDENTE',
            },
            milesimus: {
                points: balance,
                formatted: formatMls(balance),
                currency: 'mls',
                tier: balance >= 1000 ? 'DIVISÃO OURO' : balance >= 500 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
            },
            teamwork: {
                hasSquad: Boolean(squad),
                squadName: squad ? squad.name : 'SOLO',
                memberCount: squad ? squad.memberCount : 1,
                maxMembers: 20,
                averageMls: squad ? squad.formattedAverage : '000.100',
                inviteCode: squad?.inviteCode || null,
                members: squad?.members || [],
            }
        };
    }, [me, userPrediction, teamPartner, targetProfile, squad]);

    // Classificação de desempenho das 4 competições:
    // Verde = 1/3 superior (ou Top 10 na Master)
    // Amarela = Meio do grid (1/3 intermediário)
    // Vermelha = 1/3 inferior (ou fora do Top 10 na Master)
    const competitionTiers = useMemo(() => {
        if (!me) {
            return {
                poletime: 'red' as PerformanceColor,
                master: 'red' as PerformanceColor,
                milesimus: 'yellow' as PerformanceColor,
                teamwork: 'yellow' as PerformanceColor,
                meta: {
                    globalRank: 1,
                    totalGlobal: 1,
                    userGroupRank: 1,
                    totalInGroup: 1,
                }
            };
        }

        const totalGlobal = Math.max(field.length, 1);

        // 1. MILESIMUS: Ranking global por saldo/pontos MLS
        const sortedGlobal = [...field].sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100));
        const myGlobalIdx = sortedGlobal.findIndex(s => s.id === me.id);
        const globalRank = myGlobalIdx >= 0 ? myGlobalIdx + 1 : 1;
        const globalPercentile = globalRank / totalGlobal;

        let milesimusTier: PerformanceColor = 'yellow';
        if (globalRank === 1 || globalPercentile <= 0.334) {
            milesimusTier = 'green';
        } else if (globalPercentile <= 0.667) {
            milesimusTier = 'yellow';
        } else {
            milesimusTier = 'red';
        }

        // 2. MASTER (Exceção): TOP 10 no grupo fechado do usuário = VERDE, senão = VERMELHO
        const groupUsers = field.filter(s => s.groupId === me.groupId);
        const sortedGroup = groupUsers.length > 0
            ? [...groupUsers].sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100))
            : [me];
        const myGroupIdx = sortedGroup.findIndex(s => s.id === me.id);
        const userGroupRank = myGroupIdx >= 0 ? myGroupIdx + 1 : 1;
        const totalInGroup = sortedGroup.length;

        const hasMasterSubmission = Boolean(userPrediction && Array.isArray(userPrediction.top10) && userPrediction.top10.length > 0);
        // Exceção Master: VERDE se TOP 10 do grupo, Vermelho se não
        const masterTier: PerformanceColor = (userGroupRank <= 10 && hasMasterSubmission) ? 'green' : 'red';

        // 3. POLETIME: Comparação global (1/3 superior = Verde, meio = Amarela, 1/3 inferior = Vermelha)
        const hasPoletimeSubmission = Boolean(userPrediction && userPrediction.poletime);
        let poletimeTier: PerformanceColor = 'red';
        if (!hasPoletimeSubmission) {
            poletimeTier = 'red';
        } else {
            if (globalRank === 1 || globalPercentile <= 0.334) {
                poletimeTier = 'green';
            } else if (globalPercentile <= 0.667) {
                poletimeTier = 'yellow';
            } else {
                poletimeTier = 'red';
            }
        }

        // 4. TEAMWORK: Comparação global (Média do esquadrão / pontuação coletiva)
        let teamworkTier: PerformanceColor = 'yellow';
        const squadAvgNum = squad ? parseFloat(String(squad.averageMls).replace(',', '.')) : (me.mlsBalance ?? 100);
        const gridAvgMls = 100;
        if (squad && squad.memberCount >= 2 && squadAvgNum > gridAvgMls * 1.05) {
            teamworkTier = 'green';
        } else if (globalRank === 1 || globalPercentile <= 0.334) {
            teamworkTier = 'green';
        } else if (globalPercentile <= 0.667) {
            teamworkTier = 'yellow';
        } else {
            teamworkTier = 'red';
        }

        return {
            poletime: poletimeTier,
            master: masterTier,
            milesimus: milesimusTier,
            teamwork: teamworkTier,
            meta: {
                globalRank,
                totalGlobal,
                userGroupRank,
                totalInGroup,
            }
        };
    }, [me, field, userPrediction, squad]);

    const poleTheme = PERFORMANCE_THEMES[competitionTiers?.poletime || 'red'];
    const masterTheme = PERFORMANCE_THEMES[competitionTiers?.master || 'red'];
    const milesimusTheme = PERFORMANCE_THEMES[competitionTiers?.milesimus || 'yellow'];
    const teamworkTheme = PERFORMANCE_THEMES[competitionTiers?.teamwork || 'yellow'];

    // Histórico de atividades / telemetria de ordens baseado 100% em dados reais
    const activityHistory = useMemo(() => {
        if (!me) return [];
        const items = [];

        // 1. Previsão de GP (se enviada)
        if (userPrediction) {
            const predTime = formatTimeAgo(userPrediction.created_at);
            const top10Len = Array.isArray(userPrediction.top10) ? userPrediction.top10.length : 0;
            const evoLen = Array.isArray(userPrediction.evo) ? userPrediction.evo.length : 0;
            const h2hLen = userPrediction.h2h ? Object.keys(userPrediction.h2h).length : 0;

            items.push({
                time: predTime,
                title: 'Telemetria de Prognósticos Homologada',
                desc: `Poletime: ${userPrediction.poletime} · ${top10Len}/10 Top 10 · ${evoLen} Evo · ${h2hLen} Duelos H2H.`,
                badge: 'PREVISÃO',
                color: '#22c55e'
            });

            if (userPrediction.misc?.stake) {
                items.push({
                    time: predTime,
                    title: 'Ordem de Alocação de Risco',
                    desc: `Aposta de ${userPrediction.misc.stake}% de capital em mercado de evento registrada.`,
                    badge: 'MERCADO',
                    color: '#3b82f6'
                });
            }
        }

        // 2. Contrato de equipe
        if (activeContract) {
            items.push({
                time: formatTimeAgo(activeContract.created_at),
                title: 'Contrato de Garagem Homologado',
                desc: `Assento oficial confirmado na ${me.teamName} · Grupo ${me.groupId}.`,
                badge: 'CONTRATO',
                color: teamColor
            });
        }

        // 3. Aliança
        items.push({
            time: formatTimeAgo(targetProfile?.created_at),
            title: 'Entrada Homologada na Aliança',
            desc: `Conexão técnica autorizada com o ${ALLIANCES[allianceId].name}.`,
            badge: 'ALIANÇA',
            color: teamColor
        });

        // 4. Bônus Inicial de Superlicença
        items.push({
            time: formatTimeAgo(targetProfile?.created_at),
            title: 'Superlicença Emitida // Bônus Inicial',
            desc: '+000.100 mls (pontos) creditados no saldo oficial Milesimus.',
            badge: 'BÔNUS',
            color: '#fbaa19'
        });

        return items;
    }, [me, userPrediction, activeContract, targetProfile, teamColor, allianceId]);

    const tickerItems = useMemo(() => {
        const list = field.length ? field : (me ? [me] : []);
        return list.map(s => ({
            sym: `${(s.slug || s.name).replace(/[@.\s]/g, '').toUpperCase()}`,
            price: s.mlsBalance ?? 100,
            chg: 0,
        }));
    }, [field, me]);

    // Top 10 do Ranking Geral por Competição (Master, Milesimus, Poletime)
    const { masterTop10, milesimusTop10, poletimeTop10 } = useMemo(() => {
        const allPool = field.length > 0 ? field : (me ? [me] : []);

        // 1. Milesimus: Ranking geral por saldo MLS
        const milesimusList = [...allPool]
            .sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100))
            .slice(0, 10)
            .map(s => ({ s, value: formatMls(s.mlsBalance ?? 100), sub: 'MLS' }));

        // 2. Master: Pontuação Master (saldo base + palpites homologados Top 10)
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

        // 3. Poletime: Estrategistas ordenados por envio de poletime e desempenho
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

        return {
            masterTop10: masterList,
            milesimusTop10: milesimusList,
            poletimeTop10: poletimeList,
        };
    }, [field, me, allPredictions]);

    const allianceIdx = useMemo(() => (Object.keys(ALLIANCES) as AllianceId[]).map(k => {
        const teamCodes = ALLIANCES[k].codes as readonly string[];
        const allianceMembers = field.filter(s => teamCodes.includes(s.teamCode));
        const totalMls = allianceMembers.length > 0
            ? allianceMembers.reduce((acc, s) => acc + (s.mlsBalance ?? 100), 0)
            : 0;
        const s = Array(12).fill(totalMls);
        return { k, s, v: totalMls, c: 0 };
    }), [field]);

    const availableMarkets = useMemo(() => [
        { market: 'POLE POSITION (POLETIME)', detail: 'Janela Q3 Oficial', status: 'ABERTO' },
        { market: 'TOP 10 FINISH (MASTER)', detail: '10 Vagas na Zona de Pontuação', status: 'ABERTO' },
        { market: 'EVO / ESCALADA', detail: '5 Pilotos em Recuperação de Grid', status: 'ABERTO' },
        { market: 'DUELOS TÁTICOS (H2H)', detail: '11 Confrontos Diretos entre Duplas', status: 'ABERTO' },
        { market: 'VOLTA MAIS RÁPIDA (MLS)', detail: 'Alocação de até 50% de Saldo', status: 'ABERTO' },
    ], []);

    const feed = useMemo(() => {
        if (!me) return [''];
        const currentBalance = me.mlsBalance ?? 100;
        const partnerMsg = teamPartner
            ? `Seu parceiro de equipe na ${me.teamName} é ${teamPartner.name}. Telemetria de Teamwork conectada.`
            : `O ${getChampionGroupName(me.groupId)} conta com vagas abertas para a sua escuderia.`;
        const predMsg = userPrediction
            ? `Previsão ativa: Poletime homologado em ${userPrediction.poletime}. Ordem no grid registrada.`
            : `Janela aberta: envie seus prognósticos de Poletime e Master para a 1ª etapa oficial.`;

        return [
            `Bom dia, ${me.name}. Cotação base de abertura fixada em ${formatMls(currentBalance)} MLS. Nenhum evento homologado no momento.`,
            `Grid TS1 oficial: ${field.length} estrategistas confirmados com contratos ativos.`,
            `O ${ALLIANCES[allianceId].name} acompanha sua telemetria. Rating inicial: AAA.`,
            partnerMsg,
            predMsg,
            `Competições ativas: Poletime, Master, Milesimus e Teamwork com inscrições sincronizadas.`,
        ];
    }, [me, allianceId, teamPartner, userPrediction, field.length]);

    const feedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        feedTimer.current = setInterval(() => setFeedIdx(i => (i + 1) % feed.length), 9000);
        return () => { if (feedTimer.current) clearInterval(feedTimer.current); };
    }, [feed.length]);

    // Countdown
    let countdown = '--D --:--:--';
    const raceWeek = isRaceWeek(now || new Date());
    if (now) {
        const diff = Math.max(0, nextRaceStart(now).getTime() - now.getTime());
        const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
        countdown = `${String(d).padStart(2, '0')}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

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
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono gap-4">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: teamColor, borderTopColor: 'transparent' }} />
                <p className="text-xs font-bold tracking-widest animate-pulse" style={{ color: teamColor }}>&gt;_ CONECTANDO AO PITWALL DO ESTRATEGISTA...</p>
            </div>
        );
    }

    return (
        <main className={`w-full min-h-screen text-white font-mono relative overflow-x-hidden ${isStandardStyle ? 'bg-black' : 'bg-[#020202]'}`}>
            <style>{`
                @keyframes vg-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .vg-marquee { animation: vg-marquee 45s linear infinite; }
                .vg-marquee:hover { animation-play-state: paused; }
            `}</style>

            {/* Fundo com aura personalizada da equipe (ou preto predominante no modo Standard) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className={`absolute inset-0 transition-all duration-700 ${isStandardStyle ? 'opacity-[0.025]' : 'opacity-[0.06]'}`}
                    style={{ background: `radial-gradient(circle at 50% 0%, ${mainAccent} 0%, transparent 60%)` }}
                />
                <div
                    className={`absolute inset-0 ${isStandardStyle ? 'opacity-[0.015]' : 'opacity-[0.02]'}`}
                    style={{
                        backgroundImage: `linear-gradient(${isStandardStyle ? 'rgba(255,255,255,0.25)' : teamColor} 1px, transparent 1px), linear-gradient(90deg, ${isStandardStyle ? 'rgba(255,255,255,0.25)' : teamColor} 1px, transparent 1px)`,
                        backgroundSize: '48px 48px'
                    }}
                />
                <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative z-10">
                {/* Barra superior */}
                <header
                    className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b bg-black/90 backdrop-blur"
                    style={{ borderBottomColor: isStandardStyle ? 'rgba(255,255,255,0.12)' : `${teamColor}25` }}
                >
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-lg md:text-xl font-black tracking-widest hover:opacity-80 transition-opacity">
                            TS<span style={{ color: mainAccent }}>1</span>
                        </Link>
                        <span className="hidden md:inline text-[10px] tracking-[0.3em] text-white/40">// TERMINAL DO ESTRATEGISTA</span>
                        <span
                            className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest hidden sm:inline border"
                            style={{ borderColor: `${mainAccent}40`, color: mainAccent, backgroundColor: `${mainAccent}10` }}
                        >
                            {me.teamName}
                        </span>
                        {me.slug && (
                            <span className="text-[10px] font-bold text-white/60 tracking-wider">
                                {me.slug}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 text-[10px] tracking-widest">
                        {isOwner ? (
                            <Link
                                href="/positions"
                                className={`flex items-center gap-1.5 font-bold transition-all hover:opacity-80 ${raceWeek ? 'text-[#fbaa19]' : isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${raceWeek ? 'bg-[#fbaa19]' : isStandardStyle ? 'bg-[#fbaa19]' : 'bg-emerald-400'}`} />
                                <span>{raceWeek ? 'PITLANE OPEN // PISTA DISPONÍVEL' : 'PITLANE OPEN'}</span>
                            </Link>
                        ) : (
                            <span className={`flex items-center gap-1.5 font-bold ${raceWeek ? 'text-[#fbaa19]' : isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${raceWeek ? 'bg-[#fbaa19]' : isStandardStyle ? 'bg-[#fbaa19]' : 'bg-emerald-400'}`} />
                                <span>{raceWeek ? 'PITLANE OPEN // PISTA DISPONÍVEL' : 'PITLANE OPEN'}</span>
                            </span>
                        )}
                        <span className="text-white/50">PRÓXIMO GP <span className="font-bold tabular-nums" style={{ color: raceWeek ? '#fbaa19' : mainAccent }}>T-{countdown}</span></span>
                        <span className="hidden sm:inline text-white/70 tabular-nums">{now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}</span>

                        <PaddockRadioPlayer teamColor={mainAccent} />
                        {isOwner ? (
                            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors uppercase cursor-pointer">[ SAIR ]</button>
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                <Link href={myTerminalHref} className="hover:text-white transition-colors" style={{ color: mainAccent }}>
                                    [ MEU TERMINAL ]
                                </Link>
                                <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors uppercase cursor-pointer">[ SAIR ]</button>
                            </div>
                        ) : (
                            <Link href="/superlicense" className="hover:text-white transition-colors" style={{ color: mainAccent }}>
                                [ ENTRAR ]
                            </Link>
                        )}
                    </div>
                </header>

                {/* Ticker Nasdaq dentro da página, logo abaixo do menu TS1 // Terminal do Estrategista */}
                <NasdaqTicker />

                {isDemo ? (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 pt-4">
                        <div className="border bg-black/60 rounded px-4 py-2.5 text-[10px] md:text-[11px] tracking-widest flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${mainAccent}40`, color: mainAccent }}>
                            <span>[SISTEMA] VISUALIZANDO MODO PÚBLICO / DEMONSTRAÇÃO DO ESTRATEGISTA.</span>
                            <Link href={user ? myTerminalHref : "/superlicense"} className="font-bold hover:text-white transition-colors">
                                {user ? 'IR PARA MEU TERMINAL »' : 'ACESSAR MINHA CONTA »'}
                            </Link>
                        </div>
                    </div>
                ) : !isOwner && targetProfile ? (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 pt-4">
                        <div className="border bg-black/60 rounded px-4 py-2.5 text-[10px] md:text-[11px] tracking-widest flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${mainAccent}40`, color: mainAccent }}>
                            <span>[VISUALIZAÇÃO PÚBLICA // SOMENTE LEITURA] TERMINAL DE {me.name} ({me.slug || targetSlug}).</span>
                            <Link href={user ? myTerminalHref : "/superlicense"} className="font-bold hover:text-white transition-colors">
                                {user ? 'VOLTAR AO MEU TERMINAL »' : 'ENTRAR NA MINHA CONTA »'}
                            </Link>
                        </div>
                    </div>
                ) : null}

                {isOwner && activeView === "menu" && (
                    <StewardAlertBanner
                        pendingReports={stewardVoting.pendingReports}
                        unvotedCount={stewardVoting.unvotedPendingCount}
                        onOpenVoting={() => setIsVotingModalOpen(true)}
                        onOpenReport={() => openSubView("report")}
                    />
                )}

                {/* SUB-TELA OPERACIONAL EMBARCADA NO DASHBOARD */}
                {activeView !== "menu" ? (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-6 animate-fade-in flex flex-col gap-6">
                        <div
                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-[3px] border border-[#000000]"
                            style={getSystemBoxStyle(mainAccent)}
                        >
                            <button
                                type="button"
                                onClick={() => openSubView("menu")}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer"
                            >
                                <span style={{ color: mainAccent }}>«</span> [ VOLTAR AO TERMINAL DO ESTRATEGISTA ]
                            </button>
                            <span
                                className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-[3px] border"
                                style={{ borderColor: `${mainAccent}40`, color: mainAccent, backgroundColor: `${mainAccent}10` }}
                            >
                                MÓDULO OPERACIONAL // {activeView.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="w-full">
                            {activeView === "setup" && isOwner && <SetupForm />}
                            {activeView === "settings" && isOwner && <Settings />}
                            {activeView === "calendar" && <Calendar onBack={() => openSubView("menu")} accentColor={mainAccent} />}
                            {activeView === "report" && isOwner && (
                                <ReportForm
                                    onReportSubmitted={() => stewardVoting.refresh()}
                                    onBackToDashboard={() => {
                                        openSubView("menu");
                                        setIsVotingModalOpen(true);
                                    }}
                                />
                            )}
                            {activeView === "silly_season" && isOwner && <SillySeason />}
                            {activeView === "f1" && <F1HubView embedded={true} />}
                            {activeView === "classification" && (
                                <F1ClassificationView
                                    embedded={true}
                                    onBackToF1={() => openSubView("f1")}
                                />
                            )}
                            {activeView === "rankings" && (
                                <CompetitionRankingsScreen
                                    initialComp="poletime"
                                    isModal={false}
                                    embedded={true}
                                    userSlug={me?.slug}
                                    userTeamColor={mainAccent}
                                />
                            )}
                            {activeView === "crew" && <CrewView embedded={true} />}
                            {activeView === "news" && <NewsFeedView embedded={true} accentColor={mainAccent} />}
                            {activeView === "telemetry" && (
                                <TelemetryView
                                    embedded={true}
                                    onOpenPositions={() => openSubView("positions")}
                                    onOpenPitwall={() => openSubView("pitwall")}
                                    onOpenF1={() => openSubView("f1")}
                                />
                            )}
                            {activeView === "pitwall" && <PitwallView embedded={true} />}
                            {activeView === "race_control" && <RaceControlView embedded={true} />}
                            {activeView === "next_race" && (
                                <NextRaceView
                                    embedded={true}
                                    onOpenPositions={() => openSubView("positions")}
                                />
                            )}
                            {activeView === "positions" && (
                                <PositionsView
                                    embedded={true}
                                    onSaved={() => openSubView("telemetry")}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    /* GRID PRINCIPAL DO DASHBOARD */
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-4 md:py-6 flex flex-col lg:flex-row items-start gap-4 md:gap-5">

                        {/* COLUNA ESQUERDA: Credencial + Briefing Oficial */}
                        <section
                            className={`flex flex-col gap-4 md:gap-5 transition-all duration-300 ${
                                leftCollapsed
                                    ? 'w-full lg:w-11 shrink-0'
                                    : 'w-full lg:w-[25%] lg:min-w-[270px] shrink-0'
                            }`}
                        >
                            {leftCollapsed ? (
                                <SidebarToggleButton
                                    side="left"
                                    collapsed={true}
                                    accentColor={teamColor}
                                    onClick={() => setLeftCollapsed(false)}
                                />
                            ) : (
                                <>
                            <CredentialCard
                                me={me}
                                number={String(targetProfile?.driver_number || '00')}
                                allianceId={allianceId}
                                mentor={assignedMentor}
                                nationality={targetProfile?.nationality}
                                realDriver={realDriver}
                                isOwner={isOwner}
                                onOpenSetup={() => {
                                    setActiveView('setup');
                                    if (typeof window !== 'undefined') {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                onToggleCollapse={() => setLeftCollapsed(true)}
                            />

                            {/* SANFONA MESTRE: STAFF TÉCNICO // PIT WALL & GARAGEM */}
                            <Panel
                                title="Staff Técnico // Pit Wall & Box"
                                tag="CORPO TÉCNICO"
                                accentColor={teamColor}
                                collapsible={true}
                                defaultOpen={false}
                                bodyClass="p-2.5 flex flex-col gap-2.5 bg-black/40"
                            >
                                {/* 1. COMPANHEIRO DE EQUIPE (BOX) */}
                                <Panel
                                    title="Companheiro de Box"
                                    tag={teamPartner ? (teamPartner.driverNumber ? `#${teamPartner.driverNumber}` : "CONFIRMADO") : "VAGA ABERTA"}
                                    accentColor={teamColor}
                                    collapsible={true}
                                    defaultOpen={false}
                                >
                                    {teamPartner ? (
                                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-2.5">
                                                <div
                                                    className="w-10 h-10 rounded-full border flex items-center justify-center font-black text-xs shrink-0 overflow-hidden bg-black/60"
                                                    style={{ borderColor: `${teamColor}40` }}
                                                >
                                                    {teamPartner.avatarUrl ? (
                                                        <img
                                                            src={teamPartner.avatarUrl}
                                                            alt={teamPartner.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ color: teamColor }}>
                                                            {teamPartner.driverNumber ? `#${teamPartner.driverNumber}` : teamPartner.name.slice(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[7.5px] text-white/40 uppercase tracking-widest block">
                                                        ESTRATEGISTA PARCEIRO DE BOX
                                                    </span>
                                                    <h3 className="font-black text-white text-sm tracking-wider truncate">
                                                        {teamPartner.name}
                                                    </h3>
                                                    <span className="text-[9px] text-white/50 block">
                                                        {me.teamName} · {getChampionGroupName(me.groupId)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-2 rounded bg-white/[0.03] border border-white/5 flex flex-col gap-1 text-[10px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/40 uppercase">TELEMETRIA:</span>
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        COMPARTILHADA
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] text-white/50">
                                                    <span>CANAL DE GARAGEM:</span>
                                                    <span>{me.teamCode}-PIT-2</span>
                                                </div>
                                            </div>

                                            {teamPartner.slug && (
                                                <Link
                                                    href={getDashboardPath(teamPartner.slug)}
                                                    className="mt-1 w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center"
                                                >
                                                    <span>[ VER TELEMETRIA DO COMPANHEIRO ]</span>
                                                    <span style={{ color: teamColor }}>»</span>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                                            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                                                <span className="font-bold block text-[11px] mb-1 uppercase tracking-wider">
                                                    ASSENTO DISPONÍVEL NO BOX
                                                </span>
                                                <p className="text-[10px] text-white/70 leading-relaxed">
                                                    A segunda vaga da <strong className="text-white">{me.teamName}</strong> no grupo <strong>{getChampionGroupName(me.groupId)}</strong> ainda não foi ocupada. Convide outro estrategista para compartilhar telemetria.
                                                </p>
                                            </div>

                                            {isOwner && (
                                                <Link
                                                    href="/invite"
                                                    className="w-full bg-[#fbaa19]/10 hover:bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center"
                                                >
                                                    <span>[ ENVIAR CONVITE DE BOX ]</span>
                                                    <span>»</span>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </Panel>

                                {/* 2. CHEFE DE EQUIPE (TEAM PRINCIPAL) */}
                                {teamPrincipal && (
                                    <Panel
                                        title="Chefe de Equipe"
                                        tag={teamPrincipal.code}
                                        accentColor={teamColor}
                                        collapsible={true}
                                        defaultOpen={false}
                                    >
                                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-2.5">
                                                {/* Avatar do Engenheiro-Chefe da Aliança / Chefe de Equipe */}
                                                <div
                                                    className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden bg-black relative shadow-lg"
                                                    style={{ borderColor: `${teamColor}50` }}
                                                >
                                                    <img
                                                        src={ALLIANCE_CHIEFS_DATA[allianceId]?.avatarUrl || ALLIANCE_CHIEFS_DATA[allianceId]?.fallbackUrl}
                                                        alt={ALLIANCE_CHIEFS_DATA[allianceId]?.chiefName || teamPrincipal.fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = ALLIANCE_CHIEFS_DATA[allianceId]?.fallbackUrl || '/avatar/others/alianca_1_a.jpg';
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute bottom-0 inset-x-0 h-1"
                                                        style={{ backgroundColor: teamColor }}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-sm tracking-wider truncate">
                                                            {teamPrincipal.code}
                                                        </span>
                                                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                                                            CHIEF
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-white/60 block truncate">
                                                        {teamPrincipal.fullName}
                                                    </span>
                                                    <span className="text-[8.5px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: teamColor }}>
                                                        {teamPrincipal.title}
                                                    </span>
                                                </div>

                                                <span
                                                    className="text-[8.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border shrink-0"
                                                    style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}12` }}
                                                >
                                                    TEAM PRINCIPAL
                                                </span>
                                            </div>

                                            <div className="p-2 rounded bg-white/[0.03] border border-white/5 flex flex-col gap-1 text-[10px]">
                                                <span className="text-[7.5px] text-white/40 uppercase tracking-widest block font-bold">
                                                    PERFIL DE COMANDO
                                                </span>
                                                <p className="text-white/80 italic leading-relaxed text-[10.5px]">
                                                    "{teamPrincipal.personality}"
                                                </p>
                                            </div>

                                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col gap-1 text-[10px]">
                                                <span className="text-[7.5px] text-white/40 uppercase tracking-widest block font-bold">
                                                    DIRETRIZ DA MURETA
                                                </span>
                                                <p className="text-white/90 leading-relaxed text-[10.5px]">
                                                    {teamPrincipal.briefingFocus}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-[9px] text-white/40 pt-1 border-t border-white/5">
                                                <span>HOSPITALITY DA ESCUDERIA</span>
                                                <span className="text-emerald-400 font-bold">CANAL ABERTO</span>
                                            </div>
                                        </div>
                                    </Panel>
                                )}

                                {/* 3. ESTRATEGISTA SÊNIOR (CONSELHEIRO DE PADDOCK) */}
                                {assignedMentor && mentorVoice && (
                                    <Panel
                                        title="Estrategista Sênior"
                                        tag={mentorVoice.accentBadge}
                                        accentColor={teamColor}
                                        collapsible={true}
                                        defaultOpen={false}
                                    >
                                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-2.5">
                                                {/* Avatar do Conselheiro Sênior */}
                                                <div
                                                    className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden bg-black relative shadow-lg"
                                                    style={{ borderColor: `${teamColor}50` }}
                                                >
                                                    <img
                                                        src={assignedMentor.avatarUrl || `/avatar/ex_drivers/avatar_driver_${parseInt(assignedMentor.id.replace('strat-', ''), 10)}.jpg`}
                                                        alt={assignedMentor.displayName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const num = parseInt(assignedMentor.id.replace('strat-', ''), 10);
                                                            (e.target as HTMLImageElement).src = `/avatar/ex_drivers/avatar_driver_${num}.jpg`;
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute bottom-0 inset-x-0 h-1"
                                                        style={{ backgroundColor: teamColor }}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-sm tracking-wider truncate">
                                                            {assignedMentor.code}
                                                        </span>
                                                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                                                            {assignedMentor.decade}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-white/60 block truncate">
                                                        {assignedMentor.displayName} ({assignedMentor.nationality})
                                                    </span>
                                                    <span className="text-[8.5px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: teamColor }}>
                                                        CONSELHEIRO SÊNIOR
                                                    </span>
                                                </div>

                                                <span
                                                    className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border shrink-0"
                                                    style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}15` }}
                                                >
                                                    {ALLIANCES[allianceId].short}
                                                </span>
                                            </div>

                                            <p className="text-white/90 text-xs italic leading-relaxed border-l-2 pl-2.5 py-0.5" style={{ borderLeftColor: teamColor }}>
                                                {mentorVoice.radioTransmission}
                                            </p>

                                            <div className="p-2 rounded bg-white/[0.03] border border-white/5 flex flex-col gap-1 text-[10px]">
                                                <span className="text-white/40 uppercase">ORDEM DE PITWALL:</span>
                                                <span className="font-bold text-emerald-400">{mentorVoice.tacticalOrder}</span>
                                            </div>

                                            <button
                                                onClick={() => setActiveTab('radio')}
                                                className="mt-1 w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <span>[ ABRIR FREQUÊNCIA NO RÁDIO ]</span>
                                                <span style={{ color: teamColor }}>»</span>
                                            </button>
                                        </div>
                                    </Panel>
                                )}

                                {/* 4. ENGENHEIRO TÉCNICO ALOCADO */}
                                {assignedEngineer && (
                                    <Panel
                                        title="Engenheiro Técnico"
                                        tag={assignedEngineer.code}
                                        accentColor={teamColor}
                                        collapsible={true}
                                        defaultOpen={false}
                                    >
                                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                                            {/* Header com Avatar do Engenheiro */}
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-2.5">
                                                <div
                                                    className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden bg-black relative shadow-lg"
                                                    style={{ borderColor: `${teamColor}50` }}
                                                >
                                                    <img
                                                        src={assignedEngineer.avatarUrl}
                                                        alt={assignedEngineer.fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = `/avatar/eng/avatar_${assignedEngineer.avatarIndex}.jpg`;
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute bottom-0 inset-x-0 h-1"
                                                        style={{ backgroundColor: teamColor }}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-white text-sm tracking-wider truncate">
                                                            {assignedEngineer.code}
                                                        </span>
                                                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                                                            ENG #{assignedEngineer.avatarIndex}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-white/60 block truncate">
                                                        {assignedEngineer.fullName} ({assignedEngineer.nationality}, {assignedEngineer.age}a)
                                                    </span>
                                                    <span className="text-[8.5px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: teamColor }}>
                                                        {assignedEngineer.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Especialidade Técnica */}
                                            <div className="p-2 rounded bg-white/[0.03] border border-white/5 flex flex-col gap-1 text-[10px]">
                                                <span className="text-white/40 uppercase text-[8px] tracking-widest">ESPECIALIDADE TÁTICA:</span>
                                                <p className="text-white/90 leading-relaxed text-[10.5px]">
                                                    {assignedEngineer.specialty}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-[9px] text-white/40 pt-1 border-t border-white/5">
                                                <span>ALOCAÇÃO: DETERMINÍSTICA</span>
                                                <span className="text-emerald-400 font-bold">DISPONÍVEL NO PITWALL</span>
                                            </div>
                                        </div>
                                    </Panel>
                                )}
                            </Panel>

                            {/* GRID COMPACTO 2x3 DE FERRAMENTAS DO ESTRATEGISTA */}
                            <div className="p-2.5 rounded bg-[#0a0d14] border border-white/10 mt-1 flex flex-col gap-1.5 shadow-inner">
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest block font-mono">
                                    &gt;_ AÇÕES &amp; FERRAMENTAS
                                </span>
                                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold font-mono uppercase">
                                    <button
                                        type="button"
                                        onClick={() => openSubView('silly_season')}
                                        className="p-1.5 rounded-[2px] text-center border border-white/10 bg-[#0e131b] hover:bg-[#151c27] hover:border-amber-500/50 text-white/80 hover:text-white transition-all cursor-pointer truncate"
                                    >
                                        Silly Season
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openSubView('calendar')}
                                        className="p-1.5 rounded-[2px] text-center border border-white/10 bg-[#0e131b] hover:bg-[#151c27] hover:border-amber-500/50 text-white/80 hover:text-white transition-all cursor-pointer truncate"
                                    >
                                        Calendário F1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openSubView('telemetry')}
                                        className="p-1.5 rounded-[2px] text-center border border-white/10 bg-[#0e131b] hover:bg-[#151c27] hover:border-amber-500/50 text-white/80 hover:text-white transition-all cursor-pointer truncate"
                                    >
                                        Telemetria
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openSubView('pitwall')}
                                        className="p-1.5 rounded-[2px] text-center border border-white/10 bg-[#0e131b] hover:bg-[#151c27] hover:border-amber-500/50 text-white/80 hover:text-white transition-all cursor-pointer truncate"
                                    >
                                        Pitwall
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openSubView('race_control')}
                                        className="p-1.5 rounded-[2px] text-center border border-white/10 bg-[#0e131b] hover:bg-[#151c27] hover:border-amber-500/50 text-white/80 hover:text-white transition-all cursor-pointer truncate"
                                    >
                                        Race Control
                                    </button>
                                    <Link
                                        href="/superlicense"
                                        className="p-1.5 rounded-[2px] text-center border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer truncate"
                                    >
                                        Superlicença
                                    </Link>
                                </div>
                            </div>
                                </>
                            )}
                        </section>

                        {/* COLUNA CENTRAL: 4 Competições no Topo + Painel Multifuncional + Botões Operacionais */}
                        <section
                            className={`w-full lg:flex-1 min-w-0 flex flex-col gap-4 md:gap-5 transition-all duration-300 ${
                                leftCollapsed && rightCollapsed ? 'lg:max-w-[768px] lg:mx-auto' : ''
                            }`}
                        >

                            {/* NAVEGAÇÃO DUPLA DE COMANDO: WAR ROOM (REUNIÃO TÁTICA) + POSITION — SOMENTE DONO DO TERMINAL */}
                            {isOwner && (
                                <div className="w-full flex flex-col sm:flex-row gap-2.5">
                                    {/* BOTÃO PRINCIPAL: REUNIÃO TÁTICA // WAR ROOM */}
                                    <Link
                                        href={`/war-room?driver=${encodeURIComponent(me.slug || targetSlug || '')}&mentor=${encodeURIComponent(assignedMentor?.id || '')}`}
                                        className="flex-1 py-3 px-4 rounded-[3px] border font-black uppercase tracking-widest text-xs flex items-center justify-between transition-all hover:brightness-110 shadow-xl cursor-pointer group"
                                        style={{
                                            borderColor: `${mainAccent}55`,
                                            backgroundColor: `${mainAccent}18`,
                                            color: mainAccent
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full animate-ping inline-block"
                                                style={{ backgroundColor: mainAccent }}
                                            />
                                            <span className="group-hover:text-white transition-colors">&gt;_ REUNIÃO TÁTICA // WAR ROOM</span>
                                        </div>
                                        <span
                                            className="text-[10px] font-black px-2 py-0.5 rounded-[3px] bg-black/80 border text-white flex items-center gap-1 transition-all"
                                            style={{
                                                borderColor: `${mainAccent}50`,
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            <span>ENTRAR NA MESA</span>
                                            <span style={{ color: mainAccent }}>»</span>
                                        </span>
                                    </Link>

                                    {/* BOTÃO SECUNDÁRIO: POSITION */}
                                    <Link
                                        href="/positions"
                                        className="sm:w-auto py-3 px-4 rounded-[3px] border font-black uppercase tracking-widest text-xs flex items-center justify-between sm:justify-center gap-2 transition-all hover:brightness-110 shadow-xl cursor-pointer group"
                                        style={{
                                            borderColor: '#fbaa19',
                                            backgroundColor: 'rgba(251, 170, 25, 0.18)',
                                            color: '#fbaa19'
                                        }}
                                        title="Entrada direta no terminal de posições (sem briefing da mesa)"
                                    >
                                        <span className="group-hover:text-white transition-colors">POSITION</span>
                                        <span className="text-[10px] opacity-80 group-hover:text-white transition-colors">»</span>
                                    </Link>
                                </div>
                            )}

                            {/* 1. OS 4 CARDS DE COMPETIÇÃO (Clicáveis) - Cores dinâmicas por desempenho global (Verde / Amarela / Vermelha) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* POLETIME - Direciona para a página oficial de resultados do Poletime */}
                                <button
                                    onClick={() => router.push('/poletime')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'book' ? `${poleTheme.ring} ring-2 scale-[1.02]` : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{
                                        borderColor: activeTab === 'book' ? poleTheme.borderActive : poleTheme.border,
                                        background: activeTab === 'book' ? poleTheme.bgActive : poleTheme.bg,
                                        boxShadow: activeTab === 'book' ? poleTheme.shadow : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${poleTheme.text}`}>Poletime</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${poleTheme.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${poleTheme.dot}`} />
                                            <span>
                                                {compStats?.poletime.hasSubmitted ? poleTheme.tag : 'PENDENTE'}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        {compStats?.poletime.hasSubmitted && compStats.poletime.poleTime ? (
                                            <span className="text-lg md:text-xl font-black tracking-tight text-white font-mono">
                                                {compStats.poletime.poleTime}
                                            </span>
                                        ) : (
                                            <span className="text-xl md:text-2xl font-black tracking-tight text-white">-- <span className="text-[10px] text-white/40">PTS</span></span>
                                        )}
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold" style={{ color: poleTheme.textColor }}>
                                            <span>{compStats?.poletime.hasSubmitted ? `P${competitionTiers.meta.globalRank} GLOBAL` : 'SEM PREVISÃO'}</span>
                                            <span>{compStats?.poletime.hasSubmitted ? compStats.poletime.accuracy : 'QUALIFY'}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MASTER (Exceção: Verde se TOP 10 do grupo, Vermelho se não) */}
                                <button
                                    onClick={() => setRankingModalComp('master')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'quotes' ? `${masterTheme.ring} ring-2 scale-[1.02]` : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{
                                        borderColor: activeTab === 'quotes' ? masterTheme.borderActive : masterTheme.border,
                                        background: activeTab === 'quotes' ? masterTheme.bgActive : masterTheme.bg,
                                        boxShadow: activeTab === 'quotes' ? masterTheme.shadow : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${masterTheme.text}`}>Master</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${masterTheme.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${masterTheme.dot}`} />
                                            <span>
                                                {compStats?.master.hasSubmitted
                                                    ? (competitionTiers.master === 'green' ? 'TOP 10' : 'FORA TOP 10')
                                                    : 'PENDENTE'}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                                            {compStats?.master.hasSubmitted ? `${compStats.master.picksCount}/10` : '--'}{' '}
                                            <span className="text-[10px] text-white/40">{compStats?.master.hasSubmitted ? 'PILOTOS' : 'PTS'}</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold" style={{ color: masterTheme.textColor }}>
                                            <span>P{competitionTiers.meta.userGroupRank} NO GRUPO</span>
                                            <span>{competitionTiers.master === 'green' ? 'ZONA TS1 (P1-P10)' : 'FORA DOS PONTOS'}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MILESIMUS */}
                                <button
                                    onClick={() => setRankingModalComp('milesimus')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'history' ? `${milesimusTheme.ring} ring-2 scale-[1.02]` : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{
                                        borderColor: activeTab === 'history' ? milesimusTheme.borderActive : milesimusTheme.border,
                                        background: activeTab === 'history' ? milesimusTheme.bgActive : milesimusTheme.bg,
                                        boxShadow: activeTab === 'history' ? milesimusTheme.shadow : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${milesimusTheme.text}`}>Milesimus</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${milesimusTheme.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${milesimusTheme.dot}`} />
                                            <span>{milesimusTheme.tag}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight font-mono text-white">
                                            {compStats?.milesimus.formatted || '000.100'} <span className="text-[9px] opacity-75">mls</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold" style={{ color: milesimusTheme.textColor }}>
                                            <span>P{competitionTiers.meta.globalRank} DE {competitionTiers.meta.totalGlobal} ESTRATEGISTAS</span>
                                            <span>{compStats?.milesimus.tier}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* TEAMWORK */}
                                <button
                                    onClick={() => setRankingModalComp('teamwork')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'teamwork' ? `${teamworkTheme.ring} ring-2 scale-[1.02]` : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{
                                        borderColor: activeTab === 'teamwork' ? teamworkTheme.borderActive : teamworkTheme.border,
                                        background: activeTab === 'teamwork' ? teamworkTheme.bgActive : teamworkTheme.bg,
                                        boxShadow: activeTab === 'teamwork' ? teamworkTheme.shadow : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${teamworkTheme.text}`}>Teamwork</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${teamworkTheme.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${teamworkTheme.dot}`} />
                                            <span>{teamworkTheme.tag}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight font-mono text-white">
                                            {compStats?.teamwork.averageMls} <span className="text-[10px] text-white/40">mls</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold truncate" style={{ color: teamworkTheme.textColor }}>
                                            <span>MÉDIA COLETIVA</span>
                                            <span className="truncate max-w-[90px]">{compStats?.teamwork.squadName}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* MODAL / TELA DE RANKING DAS COMPETIÇÕES (ESTILO TELEMETRIA) */}
                            {rankingModalComp && (
                                <CompetitionRankingsScreen
                                    isModal={true}
                                    initialComp={rankingModalComp}
                                    onClose={() => setRankingModalComp(null)}
                                    userSlug={me?.slug}
                                    userTeamColor={mainAccent}
                                />
                            )}

                            {/* BOTÕES TÁTICOS PITWALL (RACE WEEK + 8 TÁTICOS + TEAM) */}
                            <PitwallQuickDock
                                userPrediction={userPrediction}
                                pendingStewardCount={stewardVoting.pendingReports.length}
                                teamColor={mainAccent}
                                isOwner={isOwner}
                                activeView={activeView}
                                isRaceWeekActive={Boolean(raceWeek)}
                                isRaceWeekOpen={Boolean(raceWeek && isRaceWeekVisible)}
                                onToggleRaceWeek={() => setIsRaceWeekVisible(prev => !prev)}
                                onJumpToTeam={() => {
                                    setActiveTab('teamwork');
                                    const panelEl = document.getElementById('multifunctional-panel');
                                    if (panelEl) {
                                        panelEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                onSelectView={openSubView}
                                onOpenVoting={() => setIsVotingModalOpen(true)}
                                onJumpToBookTab={() => setActiveTab('book')}
                            />

                            {/* CRONOGRAMA OFICIAL DE RACE WEEK (RENDERIZADO SE FOR SEMANA DE CORRIDA E ATIVO PELO USUÁRIO) */}
                            {raceWeek && isRaceWeekVisible && (
                                <RaceWeekSchedule
                                    compact={true}
                                    teamCode={me?.teamCode || "FER"}
                                    mentorId={assignedMentor?.id}
                                    mentor={assignedMentor}
                                    accentColor={mainAccent}
                                />
                            )}

                            {/* 2. PAINEL MULTIFUNCIONAL */}
                            <div
                                id="multifunctional-panel"
                                className="relative border border-[#000000] rounded-[3px] overflow-hidden animate-fade-in transition-all duration-300"
                                style={getSystemBoxStyle(isStandardStyle ? '#fbaa19' : teamColor)}
                            >
                                {/* Navegador de Abas */}
                                <div
                                    className="flex items-center justify-between gap-1 px-2 py-2 border-b overflow-x-auto scrollbar-none"
                                    style={{
                                        borderBottomColor: isStandardStyle ? 'rgba(255,255,255,0.12)' : `${teamColor}20`,
                                        background: isStandardStyle ? '#050505' : `linear-gradient(90deg, ${teamColor}0c, transparent)`
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setActiveTab('quotes')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'quotes' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'quotes' ? mainAccent : undefined }}
                                        >
                                            <span>📈</span> COTAÇÃO
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('radio')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'radio' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'radio' ? mainAccent : undefined }}
                                        >
                                            <span>📻</span> RÁDIO
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'history' ? mainAccent : undefined }}
                                        >
                                            <span>⏱️</span> TELEMETRIA
                                        </button>
                                    </div>

                                    {activeTab === 'quotes' && (
                                        <div className="flex items-center gap-1 shrink-0 pr-1">
                                            {([5, 10, 24] as const).map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRange(r)}
                                                    className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-widest transition-colors ${range === r ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    {r}R
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo da Tab Ativa */}
                                <div className="p-4">
                                    {/* ABA 1: COTAÇÃO DO ESTRATEGISTA */}
                                    {activeTab === 'quotes' && (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-wrap items-baseline justify-between gap-3">
                                                <div>
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-2xl md:text-3xl font-black tabular-nums font-mono">
                                                            {compStats?.milesimus.formatted || '000.100'}
                                                        </span>
                                                        <span className="text-xs text-white/40">MLS</span>
                                                        <span className={`text-xs font-bold ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>● BÔNUS INICIAL</span>
                                                    </div>
                                                    <p className="text-[10px] tracking-widest text-white/40 mt-0.5">SALDO DISPONÍVEL NO MERCADO MILESIMUS</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] tracking-widest">
                                                    <div><span className="text-white/40">MÁX:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.max(...series) : (me.mlsBalance ?? 100))}</span></div>
                                                    <div><span className="text-white/40">MÍN:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.min(...series) : (me.mlsBalance ?? 100))}</span></div>
                                                    <div><span className="text-white/40">STATUS:</span> <span className={`font-bold ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>ABERTURA (0,00%)</span></div>
                                                </div>
                                            </div>

                                            <PriceChart data={series} startRound={25 - series.length} teamColor={mainAccent} />
                                        </div>
                                    )}

                                    {/* ABA 2: BOOK DE PREVISÕES */}
                                    {activeTab === 'book' && (
                                        <div className="flex flex-col gap-4">
                                            {userPrediction ? (
                                                <div className="flex flex-col gap-4 animate-fade-in">
                                                    {/* Painel Poletime Real */}
                                                    <div className={`p-3.5 rounded-lg border flex items-center justify-between ${isStandardStyle ? 'bg-black border-white/15' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                                                        <div>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>POLETIME REGISTRADO</span>
                                                            <p className="text-2xl font-black text-white font-mono mt-0.5">{userPrediction.poletime}</p>
                                                            <p className="text-[9px] text-white/40 mt-1">TELEMETRIA OFICIAL SINCRONIZADA</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${isStandardStyle ? 'bg-white/5 text-[#fbaa19] border-[#fbaa19]/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                                                HOMOLOGADO
                                                            </span>
                                                            <p className="text-[9px] text-white/40 mt-1 tabular-nums">
                                                                {userPrediction.created_at ? new Date(userPrediction.created_at).toLocaleDateString('pt-BR') : 'RODADA ATUAL'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Top 10 Pilotos Master Reais */}
                                                    {Array.isArray(userPrediction.top10) && userPrediction.top10.length > 0 && (
                                                        <div className="p-3 rounded-lg border border-white/10 bg-black/60 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-white/60 uppercase">
                                                                <span>TOP 10 PILOTOS // MASTER</span>
                                                                <span style={{ color: mainAccent }}>{userPrediction.top10.length}/10 REGISTRADOS</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                                                                {userPrediction.top10.map((driver: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-white/5 border border-white/5 text-[10px]">
                                                                        <span className="font-bold text-white/40 shrink-0">P{idx + 1}</span>
                                                                        <span className="font-bold text-white truncate">{driver}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Grid de Informações Adicionais: EVO e H2H */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {Array.isArray(userPrediction.evo) && userPrediction.evo.length > 0 && (
                                                            <div className="p-3 rounded-lg border border-white/10 bg-white/5 flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fbaa19]">EVOLUÇÃO (EVO)</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {userPrediction.evo.map((driver: string, idx: number) => (
                                                                        <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white">
                                                                            {driver}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="p-3 rounded-lg border border-white/10 bg-white/5 flex flex-col justify-between">
                                                            <div>
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isStandardStyle ? 'text-[#fbaa19]' : 'text-blue-400'}`}>CONFRONTOS H2H</span>
                                                                <p className="text-xs font-bold text-white mt-1">
                                                                    {userPrediction.h2h ? Object.keys(userPrediction.h2h).length : 0} DUELOS HOMOLOGADOS
                                                                </p>
                                                            </div>
                                                            <p className="text-[9px] text-white/40 mt-1">APOSTAS DE CONFRONTO REGISTRADAS</p>
                                                        </div>
                                                    </div>

                                                    {isOwner && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openSubView('positions')}
                                                            className="mt-1 w-full py-2.5 px-3 rounded-[3px] text-center text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer shadow-md"
                                                            style={{ borderColor: `${mainAccent}60`, backgroundColor: `${mainAccent}15`, color: mainAccent }}
                                                        >
                                                            <span>&gt;_ EDITAR / AJUSTAR POSIÇÕES NO TERMINAL</span>
                                                            <span>»</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <div className={`p-4 rounded-[3px] border flex flex-col items-center justify-center text-center gap-2 py-6 ${isStandardStyle ? 'border-white/15 bg-black' : 'border-amber-500/20 bg-amber-500/5'}`}>
                                                        <span className="text-xl">⚠️</span>
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#fbaa19]">
                                                            NENHUMA PREVISÃO REGISTRADA NA ETAPA ATUAL
                                                        </h4>
                                                        <p className="text-[10px] text-white/50 max-w-md">
                                                            {isOwner
                                                                ? 'Suas ordens para Poletime, Top 10, Evo e Confrontos Diretos ainda não foram homologadas no Pitwall.'
                                                                : 'Este estrategista ainda não registrou previsões para a etapa atual.'}
                                                        </p>
                                                        {isOwner && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openSubView('positions')}
                                                                className="mt-2 px-4 py-2 rounded-[3px] text-[10px] font-black uppercase tracking-widest border transition-all hover:brightness-110 cursor-pointer"
                                                                style={{ borderColor: mainAccent, backgroundColor: mainAccent, color: '#000' }}
                                                            >
                                                                [ TOMAR POSIÇÕES AGORA » ]
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[9px] tracking-widest uppercase text-white/40">
                                                        <span>MERCADOS OFICIAIS</span>
                                                        <span>PARÂMETRO</span>
                                                        <span className="text-right">STATUS</span>
                                                    </div>
                                                    {availableMarkets.slice(0, 3).map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0 text-[11px] tracking-widest">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-white truncate">{m.market}</p>
                                                                <p className="text-[9px] text-white/40">PITLANE ABERTO</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block bg-white/10 text-white">
                                                                    {m.detail}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`font-bold tabular-nums ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>{m.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ABA 3: RÁDIO DO DIRETOR & CONSELHEIRO SÊNIOR */}
                                    {activeTab === 'radio' && (
                                        <div className="flex flex-col gap-3.5 text-xs leading-relaxed font-mono">
                                            {/* Transmissão do Conselheiro Sênior com Tom de Bloco e Nacionalidade */}
                                            {assignedMentor && mentorVoice && (
                                                <div
                                                    className="p-4 rounded-sm bg-black/90 border-2 flex flex-col gap-3 shadow-lg"
                                                    style={{ borderColor: mainAccent }}
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full animate-ping inline-block ${isStandardStyle ? 'bg-[#fbaa19]' : 'bg-emerald-400'}`}></span>
                                                            <span className="font-black tracking-wider text-[11px]" style={{ color: mainAccent }}>
                                                                {mentorVoice.callsign}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest bg-white/10 text-white">
                                                                {mentorVoice.accentBadge}
                                                            </span>
                                                            <span className="text-[9px] text-white/40 uppercase">
                                                                CANAL DIRETO
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                                                            &gt;_ {mentorVoice.toneTitle}:
                                                        </span>
                                                        <p className="text-white/95 text-xs sm:text-sm leading-relaxed italic border-l-2 pl-3 py-1 bg-white/[0.02] rounded-r" style={{ borderLeftColor: mainAccent }}>
                                                            {mentorVoice.radioTransmission}
                                                        </p>
                                                    </div>

                                                    <div className="p-3 rounded bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                                        <div>
                                                            <span className="text-white/40 uppercase block text-[9px]">DIRETRIZ DE COMBATE:</span>
                                                            <span className={`font-black ${isStandardStyle ? 'text-white' : 'text-emerald-400'}`}>{mentorVoice.tacticalOrder}</span>
                                                        </div>
                                                        <span className="text-[9px] text-[#fbaa19] uppercase font-bold shrink-0">
                                                            POLETIME: {assignedMentor.briefingTips.poletimeTarget}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40 uppercase pt-2 border-t border-white/5">
                                                        <span>HISTÓRICO REAL: {assignedMentor.careerStat}</span>
                                                        <span className={`font-bold ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>{assignedMentor.evaluation.accuracyRate}% ASSERTIVIDADE HOMOLOGADA</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comunicado da Aliança */}
                                            <div className="p-3 rounded bg-white/5 border border-white/10 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40 border-b border-white/5 pb-1">
                                                    <span className="font-bold text-[#fbaa19]">[COMUNICADO DA ALIANÇA // {ALLIANCES[allianceId].name}]</span>
                                                    <span>HOMOLOGADO PELO TS1</span>
                                                </div>
                                                <p className="text-white/80 text-[11px]">
                                                    "Atenção a todos os estrategistas do bloco: atualização de mapa de motor homologada pelo TS1. O multiplicador de construtores está ativo para o próximo Grande Prêmio."
                                                </p>
                                            </div>

                                            {/* Despacho Técnico da Garagem */}
                                            <div className="p-3 rounded bg-white/5 border border-white/5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40">
                                                    <span className="font-bold" style={{ color: mainAccent }}>[DIRETOR TÉCNICO // {me.teamName.toUpperCase()}]</span>
                                                    <span>TELEMETRIA DA GARAGEM</span>
                                                </div>
                                                <p className="text-white/80 text-[11px] italic">
                                                    "{me.name}, mantivemos telemetria limpa na asa móvel. Sua janela de parada anterior foi cirúrgica. Siga a orientação do seu Conselheiro Sênior para o Poletime."
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ABA 4: HISTÓRICO DE TELEMETRIA */}
                                    {activeTab === 'history' && (
                                        <div className="flex flex-col gap-2.5">
                                            {activityHistory.map((act, i) => (
                                                <div key={i} className="flex items-start justify-between gap-3 p-2.5 rounded bg-white/[0.03] border border-white/5 text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: `${act.color}20`, color: act.color }}>
                                                                {act.badge}
                                                            </span>
                                                            <span className="font-bold text-white">{act.title}</span>
                                                        </div>
                                                        <span className="text-[11px] text-white/60">{act.desc}</span>
                                                    </div>
                                                    <span className="text-[9px] text-white/30 shrink-0 mt-0.5">{act.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ABA 5: GESTÃO DE TEAMWORK (ESQUADRÃO DE ATÉ 20 MEMBROS · MÉDIA ARITMÉTICA) */}
                                    {activeTab === 'teamwork' && (
                                        <div className="flex flex-col gap-4 font-mono text-xs animate-fade-in">
                                            {/* Notificação de Sucesso/Erro */}
                                            {squadActionMsg && (
                                                <div className={`p-3 rounded border text-xs font-bold ${squadActionMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
                                                    {squadActionMsg.text}
                                                </div>
                                            )}

                                            {squad ? (
                                                /* VISUALIZAÇÃO DO ESQUADRÃO ATIVO */
                                                <div className="flex flex-col gap-4">
                                                    {/* Header do Esquadrão */}
                                                    <div className="p-4 rounded-lg border bg-black/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: `${mainAccent}50` }}>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#fbaa19]">ESQUADRÃO TEAMWORK</span>
                                                                <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-white/10 text-white">
                                                                    {squad.memberCount}/20 MEMBROS
                                                                </span>
                                                            </div>
                                                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                                                                {squad.name}
                                                            </h3>
                                                        </div>

                                                        {/* Painel da Média Oficial */}
                                                        <div className="flex flex-col items-start sm:items-end">
                                                            <span className="text-[9px] uppercase tracking-widest text-white/50">MÉDIA DO ESQUADRÃO (Σ / N)</span>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-2xl md:text-3xl font-black font-mono text-[#fbaa19]">
                                                                    {squad.formattedAverage}
                                                                </span>
                                                                <span className="text-xs text-white/50">mls</span>
                                                            </div>
                                                            <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">
                                                                PONTUAÇÃO COLETIVA VÁLIDA
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Card de Código de Convite */}
                                                    <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                                                CÓDIGO DE CONVOCAÇÃO (COMPARTILHE COM ATÉ 20 AMIGOS)
                                                            </span>
                                                            <p className="text-xs text-white/80">
                                                                Apostadores de qualquer bloco (A, B ou C) podem usar este código para ingressar.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="px-3 py-1.5 rounded bg-black border border-[#fbaa19]/40 font-mono text-sm font-black text-[#fbaa19] tracking-widest">
                                                                {squad.inviteCode}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyCode(squad.inviteCode)}
                                                                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                                            >
                                                                {copiedCode ? '✓ COPIADO!' : '[ COPIAR ]'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Lista de Membros do Esquadrão */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50 px-2">
                                                            <span>INTEGRANTES DO TIME ({squad.memberCount})</span>
                                                            <span>SALDO INDIVIDUAL</span>
                                                        </div>

                                                        <div className="flex flex-col gap-1.5">
                                                            {squad.members.map((mem, idx) => (
                                                                <div
                                                                    key={mem.id}
                                                                    className="p-2.5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 text-xs"
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <span className="font-bold text-white/30 text-[10px] w-4 text-right">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-bold text-white truncate">
                                                                                    {mem.name}
                                                                                </span>
                                                                                {mem.isCaptain && (
                                                                                    <span className="text-[8px] px-1 py-0.2 rounded font-black uppercase bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30">
                                                                                        CAPITÃO
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {mem.slug && (
                                                                                <span className="text-[9px] text-white/40">
                                                                                    {mem.slug}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right shrink-0">
                                                                        <span className="font-mono font-bold text-white text-xs">
                                                                            {formatMls(mem.mlsBalance)}
                                                                        </span>
                                                                        <span className="text-[9px] text-white/40 ml-1">mls</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Botão de Deixar Esquadrão */}
                                                    {isOwner && (
                                                        <div className="pt-2 flex justify-end">
                                                            <button
                                                                type="button"
                                                                disabled={squadActionLoading}
                                                                onClick={handleLeaveSquad}
                                                                className="text-[10px] text-red-400/70 hover:text-red-400 font-bold uppercase tracking-widest transition-colors cursor-pointer"
                                                            >
                                                                [ DEIXAR ESQUADRÃO ]
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* VISUALIZAÇÃO SOLO // FORMULÁRIOS DE CRIAÇÃO E INGRESSO */
                                                <div className="flex flex-col gap-4">
                                                    <div className="p-4 rounded-lg border border-white/10 bg-black/60 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#fbaa19]">
                                                                &gt;_ DIRETRIZ TÁTICA // TEAMWORK LEAGUE
                                                            </span>
                                                            <span className="text-[9px] text-white/40 uppercase">
                                                                CAPACIDADE: ATÉ 20 ESTRATEGISTAS
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/80 leading-relaxed">
                                                            Teamwork é a disputa coletiva onde estrategistas somam forças independentemente do bloco de motor (A, B ou C). A pontuação é calculada pela <strong>média aritmética</strong> dos membros.
                                                        </p>
                                                        <p className="text-[10px] text-white/50 italic">
                                                            Pontuação inicial: seu bônus de 000.100 mls dividido por 1 membro (000.100 / 1).
                                                        </p>
                                                    </div>

                                                    {isOwner ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* OPÇÃO 1: CRIAR NOVO ESQUADRÃO */}
                                                            <form
                                                                onSubmit={handleCreateSquad}
                                                                className="p-4 rounded-lg border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-3"
                                                            >
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isStandardStyle ? 'text-[#fbaa19]' : 'text-emerald-400'}`}>
                                                                        [ OPÇÃO 01 ] FUNDAR ESQUADRÃO
                                                                    </span>
                                                                    <p className="text-[11px] text-white/60">
                                                                        Você se torna Capitão e gera um código exclusivo para recrutar até 19 colegas.
                                                                    </p>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="NOME DO ESQUADRÃO (EX: APEX RACING)"
                                                                        value={squadNameInput}
                                                                        onChange={e => setSquadNameInput(e.target.value)}
                                                                        maxLength={30}
                                                                        className="mt-2 w-full bg-black/80 border border-white/20 p-2.5 rounded text-white text-xs font-mono uppercase focus:border-[#fbaa19] outline-none"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="submit"
                                                                    disabled={squadActionLoading || !squadNameInput.trim()}
                                                                    className="w-full py-2.5 rounded font-black uppercase tracking-wider text-xs border transition-all cursor-pointer disabled:opacity-40"
                                                                    style={{ borderColor: mainAccent, backgroundColor: mainAccent, color: '#000' }}
                                                                >
                                                                    {squadActionLoading ? 'FUNDANDO...' : '[ FUNDAR ESQUADRÃO (MÁX 20) » ]'}
                                                                </button>
                                                            </form>

                                                            {/* OPÇÃO 2: INGRESSAR COM CÓDIGO */}
                                                            <form
                                                                onSubmit={handleJoinSquad}
                                                                className="p-4 rounded-lg border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-3"
                                                            >
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isStandardStyle ? 'text-white/80' : 'text-blue-400'}`}>
                                                                        [ OPÇÃO 02 ] INGRESSAR COM CÓDIGO
                                                                    </span>
                                                                    <p className="text-[11px] text-white/60">
                                                                        Recebeu o código de convite de outro capitão? Cole aqui para entrar no time.
                                                                    </p>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="CÓDIGO (EX: BF-8K21)"
                                                                        value={inviteCodeInput}
                                                                        onChange={e => setInviteCodeInput(e.target.value)}
                                                                        maxLength={12}
                                                                        className={`mt-2 w-full bg-black/80 border border-white/20 p-2.5 rounded text-white text-xs font-mono uppercase outline-none ${isStandardStyle ? 'focus:border-[#fbaa19]' : 'focus:border-blue-400'}`}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="submit"
                                                                    disabled={squadActionLoading || !inviteCodeInput.trim()}
                                                                    className={`w-full py-2.5 rounded font-black uppercase tracking-wider text-xs border transition-all cursor-pointer disabled:opacity-40 ${
                                                                        isStandardStyle
                                                                            ? 'border-white/25 bg-white/10 text-white hover:border-[#fbaa19] hover:text-[#fbaa19]'
                                                                            : 'border-blue-400 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                                                    }`}
                                                                >
                                                                    {squadActionLoading ? 'CONECTANDO...' : '[ ENTRAR NO ESQUADRÃO » ]'}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 rounded-lg border border-white/10 text-center text-xs text-white/40">
                                                            Este estrategista ainda não integra nenhum esquadrão Teamwork.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </section>

                        {/* COLUNA DIREITA: Índices das Alianças + Sanfonas das Competições (Master, Milesimus, Poletime) + Ranking do Grupo */}
                        <section
                            className={`flex flex-col gap-4 md:gap-5 transition-all duration-300 ${
                                rightCollapsed
                                    ? 'w-full lg:w-11 shrink-0'
                                    : 'w-full lg:w-[25%] lg:min-w-[270px] shrink-0'
                            }`}
                        >
                            {rightCollapsed ? (
                                <SidebarToggleButton
                                    side="right"
                                    collapsed={true}
                                    accentColor={mainAccent}
                                    isStandardStyle={isStandardStyle}
                                    onClick={() => setRightCollapsed(false)}
                                />
                            ) : (
                                <>
                            <Panel
                                title="Índices das Alianças"
                                headerAction={
                                    <button
                                        type="button"
                                        onClick={() => setRightCollapsed(true)}
                                        className="p-1 rounded border border-white/10 hover:border-white/30 bg-black/60 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-center group"
                                        title="Recolher painel direito"
                                        aria-label="Recolher painel direito"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                                            style={{ color: mainAccent }}
                                            aria-hidden="true"
                                        >
                                            <path d="M6 17l5-5-5-5" />
                                            <path d="M13 17l5-5-5-5" />
                                        </svg>
                                    </button>
                                }
                                bodyClass="p-0"
                                className={isStandardStyle ? '!bg-black bg-black' : ''}
                                accentColor={mainAccent}
                            >
                                {allianceIdx.map(a => (
                                    <div
                                        key={a.k}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${a.k === allianceId ? 'border-l-2' : ''}`}
                                        style={{
                                            backgroundColor: a.k === allianceId ? `${mainAccent}12` : undefined,
                                            borderLeftColor: a.k === allianceId ? mainAccent : undefined
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] tracking-widest text-white/40">IDX.{a.k}</p>
                                            <p className="text-[11px] font-bold tracking-widest truncate text-white">{ALLIANCES[a.k].short}</p>
                                        </div>
                                        <Sparkline
                                            data={a.s.slice(-12)}
                                            width={70}
                                            strokeColor={a.k === allianceId ? mainAccent : (isStandardStyle ? 'rgba(255,255,255,0.35)' : undefined)}
                                        />
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold tabular-nums text-white">{fmt(a.v)}</p>
                                            <Delta value={a.c} className="text-[9px]" />
                                        </div>
                                    </div>
                                ))}
                                <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                                    <span className="text-[8.5px] text-white/40 uppercase tracking-widest font-mono">QUARTEL-GENERAL</span>
                                    <Link
                                        href="/headquarters"
                                        className="text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border transition-all flex items-center gap-1 cursor-pointer hover:brightness-125"
                                        style={{
                                            color: mainAccent,
                                            borderColor: `${mainAccent}50`,
                                            backgroundColor: `${mainAccent}15`,
                                        }}
                                    >
                                        <span>SEDE DAS ALIANÇAS »</span>
                                    </Link>
                                </div>
                            </Panel>

                            {/* SANFONAS DE RANKING GERAL (TOP 10): MASTER, MILESIMUS E POLETIME */}
                            {[
                                { title: 'Master · Ranking Geral', accent: mainAccent, list: masterTop10, defaultOpen: false },
                                { title: 'Milesimus · Ranking Geral', accent: mainAccent, list: milesimusTop10, defaultOpen: false },
                                { title: 'Poletime · Ranking Geral', accent: mainAccent, list: poletimeTop10, defaultOpen: false },
                            ].map(comp => (
                                <Panel
                                    key={comp.title}
                                    title={comp.title}
                                    tag="TOP 10"
                                    bodyClass="p-0"
                                    className={isStandardStyle ? '!bg-black bg-black' : ''}
                                    accentColor={comp.accent}
                                    collapsible={true}
                                    defaultOpen={comp.defaultOpen}
                                >
                                    <div className="max-h-[380px] overflow-y-auto">
                                        {comp.list.map((item, i) => {
                                            const isMe = item.s.id === me.id;
                                            const row = (
                                                <div
                                                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 text-[11px] tracking-widest transition-colors ${isMe ? 'border-l-2' : 'hover:bg-white/5'}`}
                                                    style={{
                                                        backgroundColor: isMe ? `${comp.accent}15` : undefined,
                                                        borderLeftColor: isMe ? comp.accent : undefined,
                                                    }}
                                                >
                                                    <span
                                                        className={`w-5 text-right tabular-nums ${i < 3 ? 'font-black' : 'text-white/40'}`}
                                                        style={{ color: i < 3 ? comp.accent : undefined }}
                                                    >
                                                        {i + 1}
                                                    </span>
                                                    <span
                                                        className="w-1 h-6 rounded-sm shrink-0"
                                                        style={{ background: isStandardStyle ? (isMe ? '#fbaa19' : 'rgba(255,255,255,0.22)') : item.s.teamColor }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate text-white" style={{ color: isMe ? comp.accent : undefined }}>
                                                            {item.s.name}
                                                        </p>
                                                        <p className="text-[9px] text-white/40">{item.s.teamCode}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold tabular-nums font-mono text-white">{item.value}</p>
                                                        <span className="text-[9px] text-white/40">{item.sub}</span>
                                                    </div>
                                                </div>
                                            );
                                            return item.s.slug && !isMe
                                                ? <Link key={`${comp.title}-${item.s.id}`} href={getDashboardPath(item.s.slug)}>{row}</Link>
                                                : <div key={`${comp.title}-${item.s.id}`}>{row}</div>;
                                        })}
                                    </div>
                                </Panel>
                            ))}
                                </>
                            )}
                        </section>
                    </div>
                )}

                <footer className="max-w-[1500px] mx-auto px-3 md:px-6 pb-8 flex flex-wrap justify-between gap-2 text-[9px] tracking-[0.3em] text-white/25">
                    <span>SINAL: ESTÁVEL · CANAL CRIPTOGRAFADO</span>
                    <span>TS1 TERMINAL // PAINEL OFICIAL DO ESTRATEGISTA {targetSlug.toUpperCase()}</span>
                </footer>
            </div>

            <StewardVotingModal
                isOpen={isVotingModalOpen}
                onClose={() => setIsVotingModalOpen(false)}
                reports={stewardVoting.reports}
                myVotes={stewardVoting.myVotes}
                votingReportId={stewardVoting.votingReportId}
                voteError={stewardVoting.voteError}
                isAuthenticated={stewardVoting.isAuthenticated}
                onVote={(reportId, choice) => stewardVoting.castVote(reportId, choice)}
                onOpenReport={() => openSubView("report")}
            />
        </main>
    );
}
