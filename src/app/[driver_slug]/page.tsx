"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';
import { PilotAvatar, AvatarVariant } from '@/components/pilot-avatar';
import Settings from "@/components/settings";
import SetupForm from "@/components/setup-form";
import Calendar from "@/components/calendar";
import ReportForm from "@/components/report-form";
import SillySeason from "@/components/silly-season";
import RaceWeekSchedule from "@/components/race-week-schedule";
import PaddockRadioPlayer from "@/components/paddock-radio-player";
import { usePathname } from 'next/navigation';
import { nextRaceStart, isRaceWeek } from '@/lib/race';
import { formatMls, formatTimeAgo } from '@/lib/mls';
import { getCountryFlag } from '@/lib/country-flags';
import { TeamworkSquad, getStrategistSquad, createTeamworkSquad, joinTeamworkSquad, leaveTeamworkSquad } from '@/lib/teamwork';
import {
    SeniorStrategist, 
    getSeniorStrategistById, 
    getSeniorStrategistForRound, 
    getStrategistVoice, 
    AllianceBlock 
} from '@/lib/race-directors';


/* ============================================================
 * BAEFF1 // DASHBOARD OFICIAL DO ESTRATEGISTA (PÁGINA DO ARROBA)
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
    children, 
    className = '', 
    bodyClass = 'p-4',
    accentColor = '#fbaa19',
    collapsible = false,
    defaultOpen = true,
}: { 
    title: string; 
    tag?: React.ReactNode; 
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
            className={`relative bg-black/75 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden animate-fade-in transition-all duration-300 ${className}`}
            style={{ borderColor: `${accentColor}30` }}
        >
            <div 
                onClick={collapsible ? () => setIsOpen(prev => !prev) : undefined}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b transition-colors ${collapsible ? 'cursor-pointer select-none hover:bg-white/[0.04]' : ''}`}
                style={{ 
                    borderBottomColor: (!collapsible || isOpen) ? `${accentColor}20` : 'transparent',
                    background: `linear-gradient(90deg, ${accentColor}0a, transparent)`
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
    nationality
}: { 
    me: Strategist; 
    number: string; 
    allianceId: AllianceId; 
    mentor?: SeniorStrategist | null;
    nationality?: string | null;
}) {
    const last = me.series.length > 0 ? me.series[me.series.length - 1] : 100;
    const rating = ratingFor(last);
    const flag = getCountryFlag(nationality);

    return (
        <Panel title="Credencial" tag="SUPERLICENÇA 2026" bodyClass="p-0" className="!bg-black bg-black" accentColor={me.teamColor}>
            <div className="relative aspect-[4/3] md:aspect-[5/4] overflow-hidden bg-black flex items-center justify-center p-2">
                {/* Capacete Oficial F1 Expandido sobre Fundo 100% Preto */}
                <div className="w-full h-full max-h-[260px] md:max-h-[280px] flex items-center justify-center relative scale-110 md:scale-120 transition-transform">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            alt="Capacete Oficial F1" 
                            className="w-full h-full object-contain select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)]" 
                            src="/avatar-overlay.svg" 
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

                {/* Bloco Compacto Sobreposto: [Bandeira Circular] USERNAME NÚMERO // EQUIPE // GRUPO */}
                <div className="absolute inset-x-0 bottom-2 pt-12 pb-2 px-3 flex flex-col items-center justify-end bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none">
                    <div className="flex flex-col items-center text-center gap-1 max-w-full">
                        {/* Linha 1: [Bandeira Circular Opcional] NOME NÚMERO */}
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {flag && (
                                <span 
                                    className="w-4 h-4 rounded-full overflow-hidden border border-white/30 inline-flex items-center justify-center shrink-0 shadow bg-black/60"
                                    title={nationality || flag.code.toUpperCase()}
                                >
                                    <img 
                                        src={flag.flagUrl} 
                                        alt={flag.code} 
                                        className="w-full h-full object-cover rounded-full" 
                                    />
                                </span>
                            )}
                            <h2 className="text-base md:text-lg font-black tracking-wider leading-none text-white drop-shadow-md truncate">
                                {me.name}
                            </h2>
                            <span className="text-base md:text-lg font-black font-mono tracking-wider leading-none text-[#fbaa19] drop-shadow-md">
                                {number}
                            </span>
                        </div>

                        {/* Linha 2: • EQUIPE */}
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/90">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: me.teamColor }} />
                            <span className="truncate">{me.teamName}</span>
                        </div>

                        {/* Linha 3: GRUPO */}
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 truncate">
                            {getChampionGroupName(me.groupId)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 2 colunas: Aliança e Rating */}
            <div className="grid grid-cols-2 text-[10px] tracking-widest border-t border-white/10 bg-black">
                <div className="px-4 py-3 border-r border-white/10">
                    <p className="text-white/40 mb-1">ALIANÇA</p>
                    <div className="text-white font-bold uppercase truncate">
                        {ALLIANCES[allianceId].short}
                    </div>
                </div>
                <div className="px-4 py-3">
                    <p className="text-[9px] tracking-[0.3em] text-white/50 font-bold mb-1">RATING</p>
                    <p className="text-xl font-black leading-none" style={{ color: me.teamColor }}>
                        {rating}
                    </p>
                </div>
            </div>

            {/* Conselheiro Sênior Vinculado */}
            {mentor && (
                <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[10px] font-mono">
                    <div>
                        <span className="text-white/40 block text-[8px] uppercase tracking-widest">CONSELHEIRO SÊNIOR</span>
                        <span className="font-bold text-[#fbaa19] tracking-wider">{mentor.code}</span>
                    </div>
                    <span className="text-[9px] text-white/60 border border-white/10 px-2 py-0.5 rounded bg-black/40">
                        {mentor.displayName} ({mentor.decade})
                    </span>
                </div>
            )}
        </Panel>
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
    const decodedSlug = rawSlug ? decodeURIComponent(rawSlug) : '';
    const targetSlug = decodedSlug.startsWith('@') ? decodedSlug : (decodedSlug ? `@${decodedSlug}` : '');

    const [loading, setLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<any>(null);
    const [me, setMe] = useState<Strategist | null>(null);
    const [userPrediction, setUserPrediction] = useState<any>(null);
    const [teamPartner, setTeamPartner] = useState<{ id: string; name: string; slug: string | null } | null>(null);
    const [activeContract, setActiveContract] = useState<any>(null);
    const [squad, setSquad] = useState<TeamworkSquad | null>(null);
    const [squadNameInput, setSquadNameInput] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [squadActionLoading, setSquadActionLoading] = useState(false);
    const [squadActionMsg, setSquadActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [field, setField] = useState<Strategist[]>([]);
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [feedIdx, setFeedIdx] = useState(0);
    const [assignedMentor, setAssignedMentor] = useState<SeniorStrategist | null>(null);

    // Estado da Tab ativa no Painel Central Multifuncional
    const [activeTab, setActiveTab] = useState<MainTab>('quotes');

    // Subtelas operacionais (Setup, Settings, Calendar, Report, Silly Season)
    const [activeView, setActiveView] = useState<"menu" | "settings" | "setup" | "calendar" | "report" | "silly_season">("menu");

    useEffect(() => {
        if (authLoading) return;

        const loadDashboard = async () => {
            try {
                // 1. Busca perfil pelo slug da URL de forma resiliente
                let profileData: any = null;
                if (targetSlug) {
                    const clean = targetSlug.replace('@', '');
                    const { data: pBySlug } = await supabase
                        .from('profiles')
                        .select('*')
                        .or(`slug.eq.${targetSlug},slug.eq.${clean},slug.ilike.${targetSlug},slug.ilike.${clean}`)
                        .maybeSingle();

                    if (pBySlug) {
                        profileData = pBySlug;
                    }
                }

                // 2. Se não encontrou por slug e o usuário está autenticado, usa o perfil logado
                if (!profileData && user) {
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
                    .select('user_id, group_id, team_id, created_at, profiles(slug, first_name, last_name, driver_number, mls_balance)');

                const realStrategists: Strategist[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const name = p.first_name 
                        ? `${p.first_name.charAt(0).toUpperCase()}.${(p.last_name || '').trim().toUpperCase()}` 
                        : 'ESTRATEGISTA';
                    return makeStrategist(c.user_id, name, p.slug || null, c.team_id, c.group_id || 1, false, p.mls_balance ?? 100);
                });

                // 3.1. Busca direta e resiliente do contrato do usuário autenticado
                let directContract = null;
                if (user) {
                    const { data: myContract } = await supabase
                        .from('contracts')
                        .select('id, user_id, team_id, group_id')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    directContract = myContract;
                }

                // Verifica se o usuário atual já possui contrato assinado
                const userContract = directContract || (contracts || []).find((c: any) => c.user_id === (profileData?.id || user?.id));
                setActiveContract(userContract || null);

                // 4. Se o usuário atual está sem contrato assinado E não completou setup, vai para headquarters
                if (user && profileData && user.id === profileData.id) {
                    if (!userContract && profileData.setup_completed === false) {
                        const redirectKey = 'redirect_slug_guard';
                        const count = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
                        if (count > 2) {
                            console.warn('[BAEFF1 Guard] Loop detectado em driver_slug. Redirecionamento interrompido.');
                            sessionStorage.removeItem(redirectKey);
                        } else {
                            sessionStorage.setItem(redirectKey, String(count + 1));
                            window.location.replace('/headquarters');
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
                        profileData.slug || targetSlug,
                        userContract?.team_id || profileData.team_id,
                        userContract?.group_id || 1,
                        false,
                        profileData.mls_balance ?? 100
                    );
                } else if (user) {
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
                            slug: p.slug || null
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
    const teamColor = me?.teamColor || '#fbaa19';
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

    const groupRanking = useMemo(() => {
        if (!me) return [];
        const pool = field.filter(s => s.groupId === me.groupId && s.id !== me.id);
        return [...pool, me]
            .map(s => {
                const bal = s.mlsBalance ?? 100;
                return { s, v: bal, c: 0 };
            })
            .sort((a, b) => b.v - a.v);
    }, [field, me]);

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
            `Grid BAEFF1 oficial: ${field.length} estrategistas confirmados com contratos ativos.`,
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
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden">
            <style>{`
                @keyframes vg-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .vg-marquee { animation: vg-marquee 45s linear infinite; }
                .vg-marquee:hover { animation-play-state: paused; }
            `}</style>

            {/* Fundo com aura personalizada da equipe */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.14] transition-all duration-700" style={{ background: `radial-gradient(circle at 50% 0%, ${teamColor} 0%, transparent 60%)` }} />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(${teamColor} 1px, transparent 1px), linear-gradient(90deg, ${teamColor} 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
            </div>

            <div className="relative z-10">
                {/* Barra superior com acabamento da equipe */}
                <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b bg-black/80 backdrop-blur" style={{ borderBottomColor: `${teamColor}25` }}>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-lg md:text-xl font-black tracking-widest hover:opacity-80 transition-opacity">
                            BAEFF<span style={{ color: teamColor }}>1</span>
                        </Link>
                        <span className="hidden md:inline text-[10px] tracking-[0.3em] text-white/40">// TERMINAL DO ESTRATEGISTA</span>
                        <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest hidden sm:inline border" style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}10` }}>
                            {me.teamName}
                        </span>
                        {me.slug && (
                            <span className="text-[10px] font-bold text-white/60 tracking-wider">
                                {me.slug}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 text-[10px] tracking-widest">
                        <Link 
                            href="/positions"
                            className={`flex items-center gap-1.5 font-bold transition-all hover:opacity-80 ${raceWeek ? 'text-[#fbaa19]' : 'text-emerald-400'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${raceWeek ? 'bg-[#fbaa19]' : 'bg-emerald-400'}`} />
                            <span>{raceWeek ? 'PITLANE OPEN // PISTA DISPONÍVEL' : 'PITLANE OPEN'}</span>
                        </Link>
                        <span className="text-white/50">PRÓXIMO GP <span className="font-bold tabular-nums" style={{ color: raceWeek ? '#fbaa19' : teamColor }}>T-{countdown}</span></span>
                        <span className="hidden sm:inline text-white/70 tabular-nums">{now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                        
                        <PaddockRadioPlayer teamColor={teamColor} />
                        {isOwner ? (
                            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors uppercase cursor-pointer">[ SAIR ]</button>
                        ) : user ? (
                            <Link href={`/${user.user_metadata?.slug || 'superlicense'}`} className="hover:text-white transition-colors" style={{ color: teamColor }}>
                                [ MEU TERMINAL ]
                            </Link>
                        ) : (
                            <Link href="/superlicense" className="hover:text-white transition-colors" style={{ color: teamColor }}>
                                [ ENTRAR ]
                            </Link>
                        )}
                    </div>
                </header>


                {isDemo && (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 pt-4">
                        <div className="border bg-black/40 rounded px-4 py-2.5 text-[10px] md:text-[11px] tracking-widest flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${teamColor}40`, color: teamColor }}>
                            <span>[SISTEMA] VISUALIZANDO MODO PÚBLICO / DEMONSTRAÇÃO DO ESTRATEGISTA.</span>
                            <Link href="/superlicense" className="font-bold hover:text-white transition-colors">ACESSAR MINHA CONTA »</Link>
                        </div>
                    </div>
                )}

                {/* SUB-TELA OPERACIONAL (SETUP, REPORT, SILLY SEASON, CALENDAR, SETTINGS) */}
                {activeView !== "menu" ? (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-6 animate-fade-in flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <button
                                onClick={() => setActiveView("menu")}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <span style={{ color: teamColor }}>«</span> [ VOLTAR AO TERMINAL DO ESTRATEGISTA ]
                            </button>
                            <span 
                                className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded border"
                                style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}10` }}
                            >
                                MÓDULO OPERACIONAL // {activeView.toUpperCase()}
                            </span>
                        </div>

                        <div className="w-full">
                            {activeView === "setup" && <SetupForm />}
                            {activeView === "settings" && <Settings />}
                            {activeView === "calendar" && <Calendar />}
                            {activeView === "report" && <ReportForm />}
                            {activeView === "silly_season" && <SillySeason />}
                        </div>
                    </div>
                ) : (
                    /* GRID PRINCIPAL DO DASHBOARD */
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

                        {/* COLUNA ESQUERDA: Credencial + Briefing Oficial */}
                        <section className="lg:col-span-3 flex flex-col gap-4 md:gap-5">
                            <CredentialCard 
                                me={me} 
                                number={String(targetProfile?.driver_number || '00')} 
                                allianceId={allianceId} 
                                mentor={assignedMentor}
                                nationality={targetProfile?.nationality}
                            />

                            {/* Card do Conselheiro Sênior de Paddock */}
                            {assignedMentor && mentorVoice && (
                                <Panel 
                                    title="Conselheiro de Paddock" 
                                    tag={mentorVoice.accentBadge} 
                                    accentColor={teamColor}
                                    collapsible={true}
                                    defaultOpen={false}
                                >
                                    <div className="flex flex-col gap-2.5 font-mono text-xs">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <div>
                                                <span className="font-black text-white text-sm tracking-wider block">
                                                    {assignedMentor.code}
                                                </span>
                                                <span className="text-[9px] text-white/40 uppercase">
                                                    {assignedMentor.displayName} ({assignedMentor.decade})
                                                </span>
                                            </div>
                                            <span 
                                                className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border"
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

                            {/* Card Briefing de Garagem */}
                            <Panel 
                                title="Briefing do Paddock" 
                                tag="TRANSMISSÃO" 
                                accentColor={teamColor}
                                collapsible={true}
                                defaultOpen={false}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="text-xs leading-relaxed text-white/90 border-l-2 pl-3" style={{ borderLeftColor: teamColor }}>
                                        <TypewriterText key={feedIdx} text={feed[feedIdx]} />
                                    </div>
                                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50">
                                        <span>CANAL: {me.teamCode}-SECURE</span>
                                        <span className="text-emerald-400 font-bold">CRIPTOGRAFADO</span>
                                    </div>
                                </div>
                            </Panel>

                            {/* Atalhos Rápidos */}
                            <Panel 
                                title="Acesso Direto" 
                                accentColor={teamColor}
                                collapsible={true}
                                defaultOpen={false}
                            >
                                <div className="flex flex-col gap-2">
                                    <Link 
                                        href="/pitwall"
                                        className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                    >
                                        <span>PITWALL GLOBAL</span>
                                        <span style={{ color: teamColor }}>GRID »</span>
                                    </Link>
                                    <Link 
                                        href="/positions"
                                        className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                    >
                                        <span>MERCADO DE POSIÇÕES</span>
                                        <span style={{ color: teamColor }}>ORDENS »</span>
                                    </Link>
                                    <Link 
                                        href="/headquarters"
                                        className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                    >
                                        <span>HEADQUARTERS</span>
                                        <span style={{ color: teamColor }}>ALIANÇA »</span>
                                    </Link>
                                </div>
                            </Panel>
                        </section>

                        {/* COLUNA CENTRAL: 4 Competições no Topo + Painel Multifuncional + Botões Operacionais */}
                        <section className="lg:col-span-6 flex flex-col gap-4 md:gap-5">
                            
                            {/* BANNER / BOTÃO OPERACIONAL DE TOMADA DE POSIÇÕES (MOVIDO PARA O TOPO ACIMA DAS COMPETIÇÕES) */}
                            <Link
                                href="/positions"
                                className="w-full py-3 px-4 rounded-lg border font-black uppercase tracking-widest text-xs flex items-center justify-between transition-all hover:brightness-110 shadow-lg cursor-pointer"
                                style={{ 
                                    borderColor: raceWeek ? '#fbaa19' : `${teamColor}60`, 
                                    backgroundColor: raceWeek ? 'rgba(251, 170, 25, 0.15)' : `${teamColor}18`, 
                                    color: raceWeek ? '#fbaa19' : teamColor 
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full animate-ping inline-block ${raceWeek ? 'bg-[#fbaa19]' : 'bg-emerald-400'}`} />
                                    <span>&gt;_ TOMADA DE POSIÇÕES // {raceWeek ? 'PISTA DISPONÍVEL (PITLANE OPEN)' : 'PITLANE OPEN'}</span>
                                    <span className="hidden sm:inline-block text-[10px] opacity-80 font-mono">
                                        [PRAZO: {countdown}]
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 border flex items-center gap-1 ${raceWeek ? 'border-[#fbaa19]/40 text-[#fbaa19]' : 'border-white/10 text-white'}`}>
                                    <span>TOMAR POSIÇÕES</span>
                                    <span>»</span>
                                </span>
                            </Link>

                            {/* 1. OS 4 CARDS DE COMPETIÇÃO (Clicáveis) - Logo abaixo do botão Tomar Posições */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* POLETIME */}
                                <button 
                                    onClick={() => setActiveTab('book')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'book' ? 'ring-2 ring-emerald-500/50 scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{ 
                                        borderColor: activeTab === 'book' ? 'rgba(16, 185, 129, 0.75)' : 'rgba(34, 197, 94, 0.40)',
                                        backgroundColor: activeTab === 'book' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.12)',
                                        boxShadow: activeTab === 'book' ? '0 0 16px rgba(16, 185, 129, 0.25)' : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Poletime</span>
                                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${compStats?.poletime.hasSubmitted ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' : 'bg-black/50 text-white/50 border border-white/10'}`}>
                                            {compStats?.poletime.hasSubmitted ? 'HOMOLOGADO' : 'QUALIFY'}
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
                                        <div className="flex items-center justify-between text-[8px] text-emerald-400/80 mt-1 uppercase font-bold">
                                            <span>{compStats?.poletime.rank} GRID</span>
                                            <span>{compStats?.poletime.accuracy}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MASTER */}
                                <button 
                                    onClick={() => setActiveTab('quotes')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'quotes' ? 'ring-2 ring-blue-500/50 scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{ 
                                        borderColor: activeTab === 'quotes' ? 'rgba(59, 130, 246, 0.75)' : 'rgba(59, 130, 246, 0.40)',
                                        backgroundColor: activeTab === 'quotes' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.12)',
                                        boxShadow: activeTab === 'quotes' ? '0 0 16px rgba(59, 130, 246, 0.25)' : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Master</span>
                                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${compStats?.master.hasSubmitted ? 'bg-blue-500/25 text-blue-300 border border-blue-500/30' : 'bg-black/50 text-blue-300 border border-blue-500/20'}`}>
                                            {compStats?.master.hasSubmitted ? '10 PILOTOS' : 'RACE'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                                            {compStats?.master.hasSubmitted ? `${compStats.master.picksCount}/10` : '--'}{' '}
                                            <span className="text-[10px] text-white/40">{compStats?.master.hasSubmitted ? 'PILOTOS' : 'PTS'}</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] text-blue-400/80 mt-1 uppercase font-bold">
                                            <span>{compStats?.master.hasSubmitted ? 'HOMOLOGADO' : 'GRID ABERTO'}</span>
                                            <span>{compStats?.master.status}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MILESIMUS */}
                                <button 
                                    onClick={() => setActiveTab('history')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'history' ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{ 
                                        borderColor: activeTab === 'history' ? `${teamColor}` : `${teamColor}50`,
                                        backgroundColor: activeTab === 'history' ? `${teamColor}26` : `${teamColor}14`,
                                        boxShadow: activeTab === 'history' ? `0 0 16px ${teamColor}35` : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: teamColor }}>Milesimus</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded font-bold border" style={{ backgroundColor: `${teamColor}20`, borderColor: `${teamColor}40`, color: teamColor }}>CURRENCY</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight font-mono" style={{ color: teamColor }}>
                                            {compStats?.milesimus.formatted || '000.100'} <span className="text-[9px] opacity-75">mls</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold text-white/50">
                                            <span>BÔNUS INICIAL ATIVO</span>
                                            <span>{compStats?.milesimus.tier}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* TEAMWORK */}
                                <button 
                                    onClick={() => setActiveTab('teamwork')}
                                    className={`text-left border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm ${activeTab === 'teamwork' ? 'ring-2 ring-[#fbaa19]/50 scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-110'}`}
                                    style={{ 
                                        borderColor: activeTab === 'teamwork' ? 'rgba(251, 170, 25, 0.80)' : 'rgba(251, 170, 25, 0.40)',
                                        backgroundColor: activeTab === 'teamwork' ? 'rgba(251, 170, 25, 0.22)' : 'rgba(251, 170, 25, 0.12)',
                                        boxShadow: activeTab === 'teamwork' ? '0 0 16px rgba(251, 170, 25, 0.25)' : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#fbaa19]">Teamwork</span>
                                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold border ${compStats?.teamwork.hasSquad ? 'bg-[#fbaa19]/25 text-[#fbaa19] border-[#fbaa19]/40' : 'bg-black/50 text-white/50 border-white/10'}`}>
                                            {compStats?.teamwork.hasSquad ? `${compStats.teamwork.memberCount}/20 MEMBROS` : 'SOLO [ 1/1 ]'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight font-mono text-white">
                                            {compStats?.teamwork.averageMls} <span className="text-[10px] text-white/40">mls</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] text-[#fbaa19]/80 mt-1 uppercase font-bold truncate">
                                            <span>MÉDIA COLETIVA</span>
                                            <span className="truncate max-w-[90px]">{compStats?.teamwork.squadName}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* CRONOGRAMA OFICIAL DE RACE WEEK (RENDERIZADO EM SEMANA DE CORRIDA) */}
                            {raceWeek && (
                                <RaceWeekSchedule compact={true} teamCode={me?.teamCode || "FER"} accentColor={teamColor} />
                            )}

                            {/* 2. PAINEL MULTIFUNCIONAL */}
                            <div 
                                className="relative bg-black/80 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden animate-fade-in transition-all duration-300"
                                style={{ borderColor: `${teamColor}35` }}
                            >
                                {/* Navegador de Abas */}
                                <div 
                                    className="flex items-center justify-between gap-1 px-2 py-2 border-b overflow-x-auto scrollbar-none"
                                    style={{ 
                                        borderBottomColor: `${teamColor}20`,
                                        background: `linear-gradient(90deg, ${teamColor}0c, transparent)`
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setActiveTab('quotes')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'quotes' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'quotes' ? teamColor : undefined }}
                                        >
                                            <span>📈</span> COTAÇÃO
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('book')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'book' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'book' ? teamColor : undefined }}
                                        >
                                            <span>📊</span> BOOK DE PREVISÕES
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('radio')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'radio' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'radio' ? teamColor : undefined }}
                                        >
                                            <span>📻</span> RÁDIO
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('history')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'history' ? teamColor : undefined }}
                                        >
                                            <span>⏱️</span> TELEMETRIA
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('teamwork')}
                                            className={`px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'teamwork' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}
                                            style={{ color: activeTab === 'teamwork' ? teamColor : undefined }}
                                        >
                                            <span>👥</span> TEAMWORK
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
                                                        <span className="text-xs text-emerald-400 font-bold">● BÔNUS INICIAL</span>
                                                    </div>
                                                    <p className="text-[10px] tracking-widest text-white/40 mt-0.5">SALDO DISPONÍVEL NO MERCADO MILESIMUS</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] tracking-widest">
                                                    <div><span className="text-white/40">MÁX:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.max(...series) : (me.mlsBalance ?? 100))}</span></div>
                                                    <div><span className="text-white/40">MÍN:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.min(...series) : (me.mlsBalance ?? 100))}</span></div>
                                                    <div><span className="text-white/40">STATUS:</span> <span className="font-bold text-emerald-400">ABERTURA (0,00%)</span></div>
                                                </div>
                                            </div>

                                            <PriceChart data={series} startRound={25 - series.length} teamColor={teamColor} />
                                        </div>
                                    )}

                                    {/* ABA 2: BOOK DE PREVISÕES */}
                                    {activeTab === 'book' && (
                                        <div className="flex flex-col gap-4">
                                            {userPrediction ? (
                                                <div className="flex flex-col gap-4 animate-fade-in">
                                                    {/* Painel Poletime Real */}
                                                    <div className="p-3.5 rounded-lg border bg-emerald-950/20 border-emerald-500/30 flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">POLETIME REGISTRADO</span>
                                                            <p className="text-2xl font-black text-white font-mono mt-0.5">{userPrediction.poletime}</p>
                                                            <p className="text-[9px] text-white/40 mt-1">TELEMETRIA OFICIAL SINCRONIZADA</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
                                                                <span style={{ color: teamColor }}>{userPrediction.top10.length}/10 REGISTRADOS</span>
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
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">CONFRONTOS H2H</span>
                                                                <p className="text-xs font-bold text-white mt-1">
                                                                    {userPrediction.h2h ? Object.keys(userPrediction.h2h).length : 0} DUELOS HOMOLOGADOS
                                                                </p>
                                                            </div>
                                                            <p className="text-[9px] text-white/40 mt-1">APOSTAS DE CONFRONTO REGISTRADAS</p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href="/positions"
                                                        className="mt-1 w-full py-2.5 px-3 rounded text-center text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer shadow-md"
                                                        style={{ borderColor: `${teamColor}60`, backgroundColor: `${teamColor}15`, color: teamColor }}
                                                    >
                                                        <span>&gt;_ EDITAR / AJUSTAR POSIÇÕES NO TERMINAL</span>
                                                        <span>»</span>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center gap-2 py-6">
                                                        <span className="text-xl">⚠️</span>
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-amber-300">
                                                            NENHUMA PREVISÃO REGISTRADA NA ETAPA ATUAL
                                                        </h4>
                                                        <p className="text-[10px] text-white/50 max-w-md">
                                                            Suas ordens para Poletime, Top 10, Evo e Confrontos Diretos ainda não foram homologadas no Pitwall.
                                                        </p>
                                                        <Link
                                                            href="/positions"
                                                            className="mt-2 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all hover:brightness-110"
                                                            style={{ borderColor: teamColor, backgroundColor: teamColor, color: '#000' }}
                                                        >
                                                            [ TOMAR POSIÇÕES AGORA » ]
                                                        </Link>
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
                                                                <span className="font-bold tabular-nums text-emerald-400">{m.status}</span>
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
                                                    style={{ borderColor: teamColor }}
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                                                            <span className="font-black tracking-wider text-[11px]" style={{ color: teamColor }}>
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
                                                        <p className="text-white/95 text-xs sm:text-sm leading-relaxed italic border-l-2 pl-3 py-1 bg-white/[0.02] rounded-r" style={{ borderLeftColor: teamColor }}>
                                                            {mentorVoice.radioTransmission}
                                                        </p>
                                                    </div>

                                                    <div className="p-3 rounded bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                                        <div>
                                                            <span className="text-white/40 uppercase block text-[9px]">DIRETRIZ DE COMBATE:</span>
                                                            <span className="font-black text-emerald-400">{mentorVoice.tacticalOrder}</span>
                                                        </div>
                                                        <span className="text-[9px] text-[#fbaa19] uppercase font-bold shrink-0">
                                                            POLETIME: {assignedMentor.briefingTips.poletimeTarget}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40 uppercase pt-2 border-t border-white/5">
                                                        <span>HISTÓRICO REAL: {assignedMentor.careerStat}</span>
                                                        <span className="text-emerald-400 font-bold">{assignedMentor.evaluation.accuracyRate}% ASSERTIVIDADE HOMOLOGADA</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comunicado da Aliança */}
                                            <div className="p-3 rounded bg-white/5 border border-white/10 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40 border-b border-white/5 pb-1">
                                                    <span className="font-bold text-[#fbaa19]">[COMUNICADO DA ALIANÇA // {ALLIANCES[allianceId].name}]</span>
                                                    <span>HOMOLOGADO PELA FIA</span>
                                                </div>
                                                <p className="text-white/80 text-[11px]">
                                                    "Atenção a todos os estrategistas do bloco: atualização de mapa de motor homologada pela FIA. O multiplicador de construtores está ativo para o próximo Grande Prêmio."
                                                </p>
                                            </div>

                                            {/* Despacho Técnico da Garagem */}
                                            <div className="p-3 rounded bg-white/5 border border-white/5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40">
                                                    <span className="font-bold" style={{ color: teamColor }}>[DIRETOR TÉCNICO // {me.teamName.toUpperCase()}]</span>
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
                                                    <div className="p-4 rounded-lg border bg-black/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: `${teamColor}50` }}>
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
                                                                CAPACIDADE: ATÉ 20 PILOTOS
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
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
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
                                                                    style={{ borderColor: teamColor, backgroundColor: teamColor, color: '#000' }}
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
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
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
                                                                        className="mt-2 w-full bg-black/80 border border-white/20 p-2.5 rounded text-white text-xs font-mono uppercase focus:border-blue-400 outline-none"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="submit"
                                                                    disabled={squadActionLoading || !inviteCodeInput.trim()}
                                                                    className="w-full py-2.5 rounded font-black uppercase tracking-wider text-xs border border-blue-400 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all cursor-pointer disabled:opacity-40"
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

                            {/* 3. BARRA DE COMANDOS / OPERAÇÕES DO DASHBOARD */}
                            <div 
                                className="bg-black/75 border rounded-lg p-3 md:p-4 shadow-xl"
                                style={{ borderColor: `${teamColor}25` }}
                            >
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 flex items-center gap-1.5">
                                        <span style={{ color: teamColor }}>⚡</span> AÇÕES & FERRAMENTAS DO ESTRATEGISTA
                                    </span>
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest">SISTEMA BAEFF1</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-[10px] tracking-widest uppercase font-bold">
                                    <button 
                                        onClick={() => setActiveView('setup')}
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                    >
                                        Setup
                                    </button>
                                    <button 
                                        onClick={() => setActiveView('report')}
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                    >
                                        Report
                                    </button>
                                    <button 
                                        onClick={() => setActiveView('silly_season')}
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                    >
                                        Silly Season
                                    </button>
                                    <button 
                                        onClick={() => setActiveView('calendar')}
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                    >
                                        F1 Calendar
                                    </button>
                                    <button 
                                        onClick={() => setActiveView('settings')}
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                    >
                                        Settings
                                    </button>
                                    <Link 
                                        href="/telemetry"
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                    >
                                        Telemetry
                                    </Link>
                                    <Link 
                                        href="/pitwall"
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                    >
                                        Pitwall
                                    </Link>
                                    <Link 
                                        href="/race-control"
                                        className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                    >
                                        Race Control
                                    </Link>
                                    <Link 
                                        href="/superlicense"
                                        className="p-2.5 rounded text-center transition-all border font-black text-black"
                                        style={{ backgroundColor: teamColor, borderColor: teamColor }}
                                    >
                                        Licença
                                    </Link>
                                    {isOwner && (
                                        <button 
                                            onClick={handleLogout}
                                            className="p-2.5 rounded text-center transition-all border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/40 cursor-pointer"
                                        >
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </div>

                        </section>

                        {/* COLUNA DIREITA: Índices das Alianças + Ranking do Grupo */}
                        <section className="lg:col-span-3 flex flex-col gap-4 md:gap-5">
                            <Panel title="Índices das Alianças" bodyClass="p-0" accentColor={teamColor}>
                                {allianceIdx.map(a => (
                                    <div key={a.k} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${a.k === allianceId ? 'border-l-2' : ''}`} style={{ backgroundColor: a.k === allianceId ? `${teamColor}12` : undefined, borderLeftColor: a.k === allianceId ? teamColor : undefined }}>
                                        <div className="min-w-0">
                                            <p className="text-[10px] tracking-widest text-white/40">IDX.{a.k}</p>
                                            <p className="text-[11px] font-bold tracking-widest truncate">{ALLIANCES[a.k].short}</p>
                                        </div>
                                        <Sparkline data={a.s.slice(-12)} width={70} strokeColor={a.k === allianceId ? teamColor : undefined} />
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold tabular-nums">{fmt(a.v)}</p>
                                            <Delta value={a.c} className="text-[9px]" />
                                        </div>
                                    </div>
                                ))}
                            </Panel>

                            <Panel title={`Ranking · ${getChampionGroupName(me.groupId)}`} tag={`${groupRanking.length}/22 PILOTOS`} bodyClass="p-0" accentColor={teamColor}>
                                <div className="max-h-[420px] overflow-y-auto">
                                    {groupRanking.map((r, i) => {
                                        const isMe = r.s.id === me.id;
                                        const row = (
                                            <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-[11px] tracking-widest transition-colors ${isMe ? 'border-l-2' : 'hover:bg-white/5'}`} style={{ backgroundColor: isMe ? `${teamColor}15` : undefined, borderLeftColor: isMe ? teamColor : undefined }}>
                                                <span className={`w-5 text-right tabular-nums ${i < 3 ? 'font-black' : 'text-white/40'}`} style={{ color: i < 3 ? teamColor : undefined }}>{i + 1}</span>
                                                <span className="w-1 h-6 rounded-sm shrink-0" style={{ background: r.s.teamColor }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold truncate`} style={{ color: isMe ? teamColor : undefined }}>{r.s.name}{isMe && ' (ESTRATEGISTA)'}</p>
                                                    <p className="text-[9px] text-white/40">{r.s.teamCode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold tabular-nums font-mono">{formatMls(r.s.mlsBalance ?? 100)}</p>
                                                    <span className="text-[9px] text-white/40">MLS</span>
                                                </div>
                                            </div>
                                        );
                                        return r.s.slug && !isMe
                                            ? <Link key={r.s.id} href={`/${r.s.slug}`}>{row}</Link>
                                            : <div key={r.s.id}>{row}</div>;
                                    })}
                                </div>
                            </Panel>
                        </section>
                    </div>
                )}

                <footer className="max-w-[1500px] mx-auto px-3 md:px-6 pb-8 flex flex-wrap justify-between gap-2 text-[9px] tracking-[0.3em] text-white/25">
                    <span>SINAL: ESTÁVEL · CANAL CRIPTOGRAFADO</span>
                    <span>BAEFF1 TERMINAL // PAINEL OFICIAL DO ESTRATEGISTA {targetSlug.toUpperCase()}</span>
                </footer>
            </div>
        </main>
    );
}
