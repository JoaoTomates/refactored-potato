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

/* ============================================================
 * VOLTGRID // DASHBOARD OFICIAL DO ESTRATEGISTA (PÁGINA DO ARROBA)
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
}

type MainTab = 'quotes' | 'book' | 'radio' | 'history' | 'teamwork';

const DEMO_NAMES = ['M. KOVAC', 'J. TANAKA', 'R. SILVA', 'A. BERG', 'L. MOREAU', 'D. OKAFOR', 'I. PETROVA', 'C. VEGA', 'T. NAKAMURA', 'H. LINDQVIST'];

function makeStrategist(id: string, name: string, slug: string | null, teamId: string | undefined, groupId: number, isDemo = false): Strategist {
    const team = F1_TEAMS.find(t => t.id === teamId || t.logo === teamId) || F1_TEAMS[hashString(id) % F1_TEAMS.length];
    return {
        id, slug, name, isDemo, groupId,
        teamCode: team.logo, teamName: team.name, teamColor: team.color,
        series: buildSeries(id),
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

function nextRaceStart(from: Date) {
    const d = new Date(from);
    d.setHours(14, 0, 0, 0);
    const add = (7 - d.getDay()) % 7;
    d.setDate(d.getDate() + add);
    if (d <= from) d.setDate(d.getDate() + 7);
    return d;
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
    accentColor = '#fbaa19'
}: { 
    title: string; 
    tag?: React.ReactNode; 
    children: React.ReactNode; 
    className?: string; 
    bodyClass?: string;
    accentColor?: string;
}) {
    return (
        <div 
            className={`relative bg-black/75 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden animate-fade-in transition-all duration-300 ${className}`}
            style={{ borderColor: `${accentColor}30` }}
        >
            <div 
                className="flex items-center justify-between gap-2 px-4 py-2.5 border-b"
                style={{ 
                    borderBottomColor: `${accentColor}20`,
                    background: `linear-gradient(90deg, ${accentColor}0a, transparent)`
                }}
            >
                <span 
                    className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase truncate flex items-center gap-1.5"
                    style={{ color: accentColor }}
                >
                    <span className="opacity-60">&gt;_</span> {title}
                </span>
                {tag && <span className="text-[9px] tracking-widest text-white/40 uppercase shrink-0">{tag}</span>}
            </div>
            <div className={bodyClass}>{children}</div>
        </div>
    );
}

function Delta({ value, className = '' }: { value: number; className?: string }) {
    const up = value >= 0;
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
    const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / r) * height}`).join(' ');
    const up = data[data.length - 1] >= data[0];
    const color = strokeColor || (up ? '#34d399' : '#f87171');
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
    const pad = (max - min) * 0.12 || 1;
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

            <div className="absolute top-2 pointer-events-none text-[10px] font-bold tracking-widest bg-black/80 border px-2 py-1 rounded" style={{ left: `clamp(0px, calc(${(x(idx) / W) * 100}% - 48px), calc(100% - 96px))`, borderColor: `${stroke}40` }}>
                <span className="text-white/50">R{startRound + idx}</span> <span className="text-white">{fmt(activeVal)}</span>
            </div>

            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between py-1 text-[9px] text-white/30 tabular-nums pointer-events-none">
                <span>{fmt(hi)}</span>
                <span>{fmt(lo)}</span>
            </div>
        </div>
    );
}

/* ---------- Credencial / Capacete ---------- */
function CredentialCard({ me, number, allianceId }: { me: Strategist; number: string; allianceId: AllianceId }) {
    const last = me.series.length > 0 ? me.series[me.series.length - 1] : 100;

    return (
        <Panel title="Credencial" tag="SUPERLICENÇA 2026" bodyClass="p-0" className="!bg-black bg-black" accentColor={me.teamColor}>
            <div className="relative aspect-[5/4] overflow-hidden bg-black flex items-center justify-center p-4">
                {/* Imagem SVG do capacete escondida com background 100% preto */}
                <div className="hidden" aria-hidden="true">
                    <img 
                        alt="Capacete Oficial F1" 
                        src="/avatar-overlay.svg" 
                    />
                </div>

                <div className="absolute inset-x-0 bottom-0 pt-8 pb-3 px-4 flex items-end justify-between bg-black z-20">
                    <div>
                        <p className="text-[9px] tracking-[0.3em] text-white/50 font-bold">ESTRATEGISTA</p>
                        <h2 className="text-xl md:text-2xl font-black tracking-widest leading-none text-white drop-shadow-md">{me.name}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] tracking-[0.3em] text-white/50 font-bold">RATING</p>
                        <p className="text-xl font-black leading-none" style={{ color: me.teamColor }}>{ratingFor(last)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 text-[10px] tracking-widest border-t border-white/10 bg-black">
                {[
                    ['EQUIPE', <span key="t" className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: me.teamColor }} />{me.teamName}</span>],
                    ['GRUPO', getChampionGroupName(me.groupId)],
                    ['ALIANÇA', ALLIANCES[allianceId].short],
                    ['TICKER', `$${(me.slug || me.name).replace(/[@.\s]/g, '').toUpperCase()}`],
                ].map(([k, v], i) => (
                    <div key={i} className={`px-4 py-3 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} border-white/5`}>
                        <p className="text-white/40 mb-1">{k}</p>
                        <div className="text-white font-bold uppercase truncate">{v}</div>
                    </div>
                ))}
            </div>
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
    const now = useNow();

    const rawSlug = (params?.driver_slug as string) || '';
    const decodedSlug = rawSlug ? decodeURIComponent(rawSlug) : '';
    const targetSlug = decodedSlug.startsWith('@') ? decodedSlug : (decodedSlug ? `@${decodedSlug}` : '');

    const [loading, setLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<any>(null);
    const [me, setMe] = useState<Strategist | null>(null);
    const [field, setField] = useState<Strategist[]>([]);
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [feedIdx, setFeedIdx] = useState(0);

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

                // 3. Busca todos os contratos ativos no grid
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, team_id, profiles(slug, first_name, last_name, driver_number)');

                const realStrategists: Strategist[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const name = p.first_name 
                        ? `${p.first_name.charAt(0).toUpperCase()}.${(p.last_name || '').trim().toUpperCase()}` 
                        : 'ESTRATEGISTA';
                    return makeStrategist(c.user_id, name, p.slug || null, c.team_id, c.group_id || 1);
                });

                // Verifica se o usuário atual já possui contrato assinado
                const userContract = (contracts || []).find((c: any) => c.user_id === (profileData?.id || user?.id));

                // 4. Se o usuário atual está sem contrato assinado E não completou setup, vai para headquarters
                if (user && profileData && user.id === profileData.id) {
                    if (!userContract && profileData.setup_completed === false) {
                        window.location.replace('/headquarters');
                        return;
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
                        false
                    );
                } else if (user) {
                    currentStrategist = realStrategists.find(s => s.id === user.id) || null;
                }

                const demos = DEMO_NAMES.map((n, i) => makeStrategist(`demo-${i}`, n, null, F1_TEAMS[i % F1_TEAMS.length].id, 1, true));
                if (!currentStrategist) {
                    currentStrategist = makeStrategist(
                        'demo-visitor', 
                        targetSlug ? targetSlug.replace('@', '').toUpperCase() : 'VISITANTE', 
                        targetSlug || null, 
                        F1_TEAMS[1].id, 
                        1, 
                        true
                    );
                }

                setMe(currentStrategist);
                setField(realStrategists.length >= 4 ? realStrategists : [...realStrategists, ...demos]);

            } catch (err) {
                console.error("Erro ao inicializar dashboard do estrategista:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [authLoading, user, targetSlug]);

    const isOwner = Boolean(user && targetProfile && user.id === targetProfile.id);
    const allianceId = allianceForCode(me?.teamCode);
    const teamColor = me?.teamColor || '#fbaa19';
    const series = me ? me.series.slice(-range) : [];
    const last = series.length > 0 ? series[series.length - 1] ?? 0 : 0;
    const prev = me && me.series.length >= 2 ? me.series[me.series.length - 2] ?? last : last;
    const isDemo = !targetProfile && (!user || !!me?.isDemo);

    // Métricas das 4 competições baseadas no ID do usuário
    const compStats = useMemo(() => {
        if (!me) return null;
        const seedVal = hashString(me.id);
        const rnd = seeded(seedVal);
        
        return {
            poletime: {
                points: Math.floor(180 + rnd() * 640),
                rank: `P${Math.floor(1 + rnd() * 12)}`,
                accuracy: (91.2 + rnd() * 7.5).toFixed(1),
            },
            master: {
                points: Math.floor(450 + rnd() * 1150),
                rank: `P${Math.floor(1 + rnd() * 8)}`,
                podiums: Math.floor(2 + rnd() * 7),
            },
            milesimus: {
                points: Math.floor(125000 + rnd() * 650000),
                currency: 'mls',
                tier: rnd() > 0.4 ? 'DIVISÃO OURO' : 'DIVISÃO PRATA',
            },
            teamwork: {
                duoRank: `P${Math.floor(1 + rnd() * 11)}`,
                teamScore: Math.floor(1200 + rnd() * 2400),
                partner: me.isDemo ? 'TELEMETRIA IA' : 'ASSENTO #2 DISPONÍVEL',
                synergy: Math.floor(75 + rnd() * 23),
            }
        };
    }, [me]);

    // Histórico de atividades / telemetria de ordens
    const activityHistory = useMemo(() => {
        if (!me) return [];
        return [
            {
                time: '18m atrás',
                title: 'Ordem de Pit Stop Sincronizada',
                desc: `Telemetria enviada para a garagem ${me.teamName}.`,
                badge: 'PITWALL',
                color: teamColor
            },
            {
                time: '2h atrás',
                title: 'Previsão Registrada em Poletime',
                desc: 'Janela Q3 fechada: 1:28.412 alvo.',
                badge: 'POLETIME',
                color: '#22c55e'
            },
            {
                time: 'Ontem',
                title: 'Contrato Master Atualizado',
                desc: `Rating ${ratingFor(last)} atribuído no ${getChampionGroupName(me.groupId)}.`,
                badge: 'MASTER',
                color: '#3b82f6'
            },
            {
                time: '2 dias atrás',
                title: 'Recompensa de Milésimos Creditada',
                desc: '+45.000 mls por consistência de voltas rápidas.',
                badge: 'MILESIMUS',
                color: '#fbaa19'
            },
            {
                time: '4 dias atrás',
                title: 'Aliança Confirmada no Bloco',
                desc: `Entrada autorizada na ${ALLIANCES[allianceId].name}.`,
                badge: 'ALIANÇA',
                color: teamColor
            }
        ];
    }, [me, teamColor, last, allianceId]);

    const tickerItems = useMemo(() => {
        const list = field.length ? field : [];
        return list.map(s => ({
            sym: `$${(s.slug || s.name).replace(/[@.\s]/g, '').toUpperCase()}`,
            price: s.series.length > 0 ? s.series[s.series.length - 1] : 100,
            chg: s.series.length >= 2 ? pct(s.series[s.series.length - 1], s.series[s.series.length - 2]) : 0,
        }));
    }, [field]);

    const groupRanking = useMemo(() => {
        if (!me) return [];
        const pool = field.filter(s => s.groupId === me.groupId && s.id !== me.id);
        return [...pool, me]
            .map(s => {
                const sLast = s.series.length > 0 ? s.series[s.series.length - 1] : 100;
                const sPrev = s.series.length >= 2 ? s.series[s.series.length - 2] : sLast;
                return { s, v: sLast, c: pct(sLast, sPrev) };
            })
            .sort((a, b) => b.v - a.v);
    }, [field, me]);

    const allianceIdx = useMemo(() => (Object.keys(ALLIANCES) as AllianceId[]).map(k => {
        const s = buildSeries(`alliance-${k}`, 24, 1200, 0.05);
        return { k, s, v: s[s.length - 1], c: pct(s[s.length - 1], s[s.length - 2]) };
    }), []);

    const positions = useMemo(() => {
        if (!me) return [];
        const rnd = seeded(hashString(`pos-${me.id}`));
        const markets = ['POLE POSITION (POLETIME)', 'VENCEDOR (MASTER)', 'PÓDIO DUPLO', 'VOLTA MAIS RÁPIDA (MLS)', 'SAFETY CAR'];
        return markets.map(m => {
            const team = F1_TEAMS[Math.floor(rnd() * F1_TEAMS.length)];
            const seat = rnd() > 0.5 ? 1 : 2;
            return {
                market: m,
                pick: m === 'SAFETY CAR' ? (rnd() > 0.5 ? 'SIM' : 'NÃO') : `${team.logo} · CARRO ${seat}`,
                color: m === 'SAFETY CAR' ? '#fbaa19' : team.color,
                odd: (1.4 + rnd() * 6).toFixed(2),
                conf: Math.round(35 + rnd() * 60),
                pl: (rnd() - 0.4) * 30,
            };
        });
    }, [me]);

    const feed = useMemo(() => {
        if (!me) return [''];
        const chg = pct(last, prev);
        return [
            `Bom dia, ${me.name}. Sua cotação ${chg >= 0 ? 'subiu' : 'recuou'} ${Math.abs(chg).toFixed(2)}% desde o último GP.`,
            `O ${ALLIANCES[allianceId].name} acompanha seus relatórios. Mantenha o rating ${ratingFor(last)} no Master.`,
            `Competições ativas: Poletime, Master, Milesimus e Teamwork com inscrições sincronizadas.`,
            `O ${getChampionGroupName(me.groupId)} ainda tem assentos abertos. A concorrência no grid vai aumentar.`,
            `Lembre-se: quem prevê o caos, fatura o campeonato. Abra suas posições antes do fechamento do mercado.`,
        ];
    }, [me, allianceId, last, prev]);

    const feedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        feedTimer.current = setInterval(() => setFeedIdx(i => (i + 1) % feed.length), 9000);
        return () => { if (feedTimer.current) clearInterval(feedTimer.current); };
    }, [feed.length]);

    // Countdown
    let countdown = '--D --:--:--';
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
                            VOLT<span style={{ color: teamColor }}>GRID</span>
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
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />MERCADO ABERTO</span>
                        <span className="text-white/50">PRÓXIMO GP <span className="font-bold tabular-nums" style={{ color: teamColor }}>T-{countdown}</span></span>
                        <span className="hidden sm:inline text-white/70 tabular-nums">{now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                        
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

                {/* Fita de cotações contínua */}
                <div className="overflow-hidden border-b border-white/5 bg-black/60">
                    <div className="vg-marquee flex w-max whitespace-nowrap py-2">
                        {[...tickerItems, ...tickerItems].map((t, i) => (
                            <span key={i} className="flex items-center gap-2 px-5 text-[11px] tracking-widest border-r border-white/5">
                                <span className="text-white/80 font-bold">{t.sym}</span>
                                <span className="text-white/50 tabular-nums">{fmt(t.price)}</span>
                                <Delta value={t.chg} className="text-[10px]" />
                            </span>
                        ))}
                    </div>
                </div>

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
                            <CredentialCard me={me} number={String(targetProfile?.driver_number || '00')} allianceId={allianceId} />

                            {/* Card Briefing de Garagem */}
                            <Panel title="Briefing do Paddock" tag="TRANSMISSÃO" accentColor={teamColor}>
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
                            <Panel title="Acesso Direto" accentColor={teamColor}>
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
                            
                            {/* 1. OS 4 CARDS DE COMPETIÇÃO NO TOPO (Clicáveis) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* POLETIME */}
                                <button 
                                    onClick={() => setActiveTab('book')}
                                    className={`text-left bg-black/75 border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer ${activeTab === 'book' ? 'ring-2 ring-emerald-500/50 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                                    style={{ borderColor: 'rgba(34, 197, 94, 0.45)' }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Poletime</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-bold">QUALIFY</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">{compStats?.poletime.points} <span className="text-[10px] text-white/40">PTS</span></span>
                                        <div className="flex items-center justify-between text-[8px] text-emerald-400/80 mt-1 uppercase font-bold">
                                            <span>{compStats?.poletime.rank} GRID</span>
                                            <span>{compStats?.poletime.accuracy}% ACC</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MASTER */}
                                <button 
                                    onClick={() => setActiveTab('quotes')}
                                    className={`text-left bg-black/75 border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer ${activeTab === 'quotes' ? 'ring-2 ring-blue-500/50 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                                    style={{ borderColor: 'rgba(59, 130, 246, 0.45)' }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Master</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-300 font-bold">RACE</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">{compStats?.master.points} <span className="text-[10px] text-white/40">PTS</span></span>
                                        <div className="flex items-center justify-between text-[8px] text-blue-400/80 mt-1 uppercase font-bold">
                                            <span>{compStats?.master.rank} GERAL</span>
                                            <span>{compStats?.master.podiums} PÓDIOS</span>
                                        </div>
                                    </div>
                                </button>

                                {/* MILESIMUS */}
                                <button 
                                    onClick={() => setActiveTab('history')}
                                    className={`text-left bg-black/75 border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer ${activeTab === 'history' ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                                    style={{ borderColor: `${teamColor}60` }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: teamColor }}>Milesimus</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded font-bold" style={{ backgroundColor: `${teamColor}15`, color: teamColor }}>CURRENCY</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight" style={{ color: teamColor }}>
                                            {(compStats?.milesimus.points || 0).toLocaleString()} <span className="text-[9px] opacity-75">mls</span>
                                        </span>
                                        <div className="flex items-center justify-between text-[8px] mt-1 uppercase font-bold text-white/50">
                                            <span>{compStats?.milesimus.tier}</span>
                                        </div>
                                    </div>
                                </button>

                                {/* TEAMWORK */}
                                <button 
                                    onClick={() => setActiveTab('teamwork')}
                                    className={`text-left bg-black/75 border p-3 rounded-lg flex flex-col justify-between transition-all cursor-pointer ${activeTab === 'teamwork' ? 'ring-2 ring-[#fbaa19]/50 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                                    style={{ borderColor: 'rgba(251, 170, 25, 0.45)' }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#fbaa19]">Teamwork</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-[#fbaa19]/10 text-[#fbaa19] font-bold">DUPLA</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl md:text-2xl font-black tracking-tight text-white">{compStats?.teamwork.duoRank} <span className="text-[10px] text-white/40">PAIR</span></span>
                                        <div className="flex items-center justify-between text-[8px] text-[#fbaa19]/80 mt-1 uppercase font-bold truncate">
                                            <span>{compStats?.teamwork.synergy}% SINC</span>
                                            <span className="truncate max-w-[50px]">{me.teamCode}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* BANNER / BOTÃO OPERACIONAL DE TOMADA DE POSIÇÕES */}
                            <Link
                                href="/positions"
                                className="w-full py-3 px-4 rounded-lg border font-black uppercase tracking-widest text-xs flex items-center justify-between transition-all hover:brightness-110 shadow-lg cursor-pointer"
                                style={{ 
                                    borderColor: `${teamColor}60`, 
                                    backgroundColor: `${teamColor}18`, 
                                    color: teamColor 
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                    <span>&gt;_ TOMADA DE POSIÇÕES DE GP // MERCADO ABERTO</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 border border-white/10 text-white flex items-center gap-1">
                                    <span>ENVIAR ORDENS</span>
                                    <span>»</span>
                                </span>
                            </Link>

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
                                                        <span className="text-2xl md:text-3xl font-black tabular-nums">{fmt(last)}</span>
                                                        <span className="text-xs text-white/40">MLS</span>
                                                        <Delta value={pct(last, prev)} className="text-xs" />
                                                    </div>
                                                    <p className="text-[10px] tracking-widest text-white/40 mt-0.5">VARIAÇÃO ÚLTIMO GP · SPREAD 0.08</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] tracking-widest">
                                                    <div><span className="text-white/40">MÁX:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.max(...series) : 0)}</span></div>
                                                    <div><span className="text-white/40">MÍN:</span> <span className="font-bold">{fmt(series.length > 0 ? Math.min(...series) : 0)}</span></div>
                                                    <div><span className="text-white/40">VOL:</span> <span className="font-bold">{series.length * 12}K</span></div>
                                                </div>
                                            </div>

                                            <PriceChart data={series} startRound={25 - series.length} teamColor={teamColor} />
                                        </div>
                                    )}

                                    {/* ABA 2: BOOK DE PREVISÕES */}
                                    {activeTab === 'book' && (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[9px] tracking-widest uppercase text-white/40">
                                                <span>MERCADO / ALVO</span>
                                                <span>ESCOLHA / ODD</span>
                                                <span className="text-right">CONFIANÇA</span>
                                            </div>
                                            {positions.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0 text-[11px] tracking-widest">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white truncate">{p.market}</p>
                                                        <p className="text-[9px] text-white/40">FECHAMENTO T-24H</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                                                            {p.pick}
                                                        </span>
                                                        <p className="text-[9px] text-white/50 mt-0.5 tabular-nums">@{p.odd}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold tabular-nums text-emerald-400">{p.conf}%</span>
                                                        <p className="text-[9px] text-white/40">MATCH</p>
                                                    </div>
                                                </div>
                                            ))}

                                            <Link
                                                href="/positions"
                                                className="mt-3 w-full py-2.5 px-3 rounded text-center text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer shadow-md"
                                                style={{ borderColor: `${teamColor}60`, backgroundColor: `${teamColor}15`, color: teamColor }}
                                            >
                                                <span>&gt;_ ABRIR TERMINAL // CONSOLIDAR POSIÇÕES DE GP</span>
                                                <span>»</span>
                                            </Link>
                                        </div>
                                    )}

                                    {/* ABA 3: RÁDIO DO DIRETOR */}
                                    {activeTab === 'radio' && (
                                        <div className="flex flex-col gap-3 text-xs leading-relaxed">
                                            <div className="p-3 rounded bg-white/5 border border-white/5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40">
                                                    <span className="font-bold" style={{ color: teamColor }}>[DIRETOR TÉCNICO // {me.teamName.toUpperCase()}]</span>
                                                    <span>AO VIVO</span>
                                                </div>
                                                <p className="text-white/90 italic">
                                                    "{me.name}, mantivemos telemetria limpa na asa móvel. Sua janela de parada no GP anterior foi cirúrgica. Para a próxima corrida, precisamos que você maximize as apostas de Poletime."
                                                </p>
                                            </div>
                                            <div className="p-3 rounded bg-white/5 border border-white/5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[9px] text-white/40">
                                                    <span className="font-bold text-amber-400">[COMUNICADO DA ALIANÇA // {ALLIANCES[allianceId].name}]</span>
                                                    <span>1H ATRÁS</span>
                                                </div>
                                                <p className="text-white/80">
                                                    "Atenção a todos os estrategistas do bloco: atualização de mapa de motor homologada pela FIA. O multiplicador de construtores está ativo."
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

                                    {/* ABA 5: GESTÃO DE TEAMWORK */}
                                    {activeTab === 'teamwork' && (
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="p-3 rounded bg-white/5 border border-white/10 flex flex-col gap-1">
                                                    <span className="text-[9px] text-white/40 uppercase">Assento #1 (Titular)</span>
                                                    <span className="text-sm font-bold text-white">{me.name}</span>
                                                    <span className="text-[10px] font-bold" style={{ color: teamColor }}>PILOTO DESIGNADO</span>
                                                </div>
                                                <div className="p-3 rounded bg-white/5 border border-white/10 flex flex-col gap-1">
                                                    <span className="text-[9px] text-white/40 uppercase">Assento #2 (Companheiro)</span>
                                                    <span className="text-sm font-bold text-white">{compStats?.teamwork.partner}</span>
                                                    <span className="text-[10px] text-amber-400 font-bold">SINCRONIA: {compStats?.teamwork.synergy}%</span>
                                                </div>
                                            </div>
                                            <div className="p-3 rounded bg-black/60 border border-white/5 flex flex-col gap-2 text-xs">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-white/60">DESEMPENHO DA DUPLA NO GRUPO</span>
                                                    <span style={{ color: teamColor }}>{compStats?.teamwork.duoRank} / 11 DUPLAS</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${compStats?.teamwork.synergy || 0}%`, backgroundColor: teamColor }} />
                                                </div>
                                            </div>
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
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest">SISTEMA VOLTGRID</span>
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

                            <Panel title={`Ranking · ${getChampionGroupName(me.groupId)}`} tag={`${groupRanking.filter(r => !r.s.isDemo).length}/22`} bodyClass="p-0" accentColor={teamColor}>
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
                                                    <p className="font-bold tabular-nums">{fmt(r.v)}</p>
                                                    <Delta value={r.c} className="text-[9px]" />
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
                    <span>VOLTGRID TERMINAL // PAINEL OFICIAL DO ESTRATEGISTA {targetSlug.toUpperCase()}</span>
                </footer>
            </div>
        </main>
    );
}
