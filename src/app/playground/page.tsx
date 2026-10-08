"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';
import { PilotAvatar, AvatarVariant } from '@/components/pilot-avatar';

/* ============================================================
 * PLAYGROUND — Terminal do Estrategista Multi-Painel
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
const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    const team = F1_TEAMS.find(t => t.id === teamId) || F1_TEAMS[hashString(id) % F1_TEAMS.length];
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
    const idx = hover ?? data.length - 1;

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setHover(Math.round(rel * (data.length - 1)));
    };

    return (
        <div className="relative w-full h-[200px] md:h-[240px] select-none touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="vgArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(g => (
                    <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={area} fill="url(#vgArea)" />
                <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={x(idx)} x2={x(idx)} y1="0" y2={H} stroke="rgba(255,255,255,0.18)" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Marcador */}
            <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-black pointer-events-none" style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(data[idx]) / H) * 100}%`, background: stroke, boxShadow: `0 0 12px ${stroke}` }} />

            <div className="absolute top-2 pointer-events-none text-[10px] font-bold tracking-widest bg-black/80 border px-2 py-1 rounded" style={{ left: `clamp(0px, calc(${(x(idx) / W) * 100}% - 48px), calc(100% - 96px))`, borderColor: `${stroke}40` }}>
                <span className="text-white/50">R{startRound + idx}</span> <span className="text-white">{fmt(data[idx])}</span>
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
    const last = me.series[me.series.length - 1];

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

                <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-4 flex items-end justify-between bg-gradient-to-t from-black via-black/85 to-transparent z-20">
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
 * Página Principal
 * ============================================================ */
export default function PlaygroundPage() {
    const router = useRouter();
    const { user, isLoading, logout } = useSupabaseAuth();
    const now = useNow();

    const [loading, setLoading] = useState(true);
    const [meProfile, setMeProfile] = useState<any>(null);
    const [me, setMe] = useState<Strategist | null>(null);
    const [field, setField] = useState<Strategist[]>([]);
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [feedIdx, setFeedIdx] = useState(0);

    // Estado da Tab ativa no Painel Central Multifuncional
    const [activeTab, setActiveTab] = useState<MainTab>('quotes');

    useEffect(() => {
        if (isLoading) return;
        const load = async () => {
            try {
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, team_id, profiles(slug, first_name, last_name, driver_number)');

                const real: Strategist[] = (contracts || []).map((c: any) => {
                    const p = c.profiles || {};
                    const name = p.first_name ? `${p.first_name.charAt(0)}. ${p.last_name || ''}`.trim() : 'ESTRATEGISTA';
                    return makeStrategist(c.user_id, name.toUpperCase(), p.slug || null, c.team_id, c.group_id || 1);
                });

                let mine: Strategist | null = null;
                if (user) {
                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                    if (prof?.slug) {
                        router.replace(`/${prof.slug}`);
                        return;
                    }
                    setMeProfile(prof);
                    mine = real.find(s => s.id === user.id) || null;
                    if (!mine && prof) {
                        const name = prof.first_name ? `${prof.first_name.charAt(0)}. ${prof.last_name || ''}`.trim().toUpperCase() : 'ESTRATEGISTA';
                        mine = makeStrategist(user.id, name, prof.slug, undefined, 1);
                    }
                }

                const demos = DEMO_NAMES.map((n, i) => makeStrategist(`demo-${i}`, n, null, F1_TEAMS[i % F1_TEAMS.length].id, 1, true));
                if (!mine) mine = makeStrategist('demo-visitor', 'VISITANTE', null, F1_TEAMS[1].id, 1, true);

                setMe(mine);
                setField(real.length >= 4 ? real : [...real, ...demos]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, isLoading]);

    const allianceId = allianceForCode(me?.teamCode);
    const teamColor = me?.teamColor || '#fbaa19';
    const series = me ? me.series.slice(-range) : [];
    const last = series[series.length - 1] ?? 0;
    const prev = me ? me.series[me.series.length - 2] : 0;
    const open = series[0] ?? 0;
    const isDemo = !user || !!me?.isDemo;

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
            price: s.series[s.series.length - 1],
            chg: pct(s.series[s.series.length - 1], s.series[s.series.length - 2]),
        }));
    }, [field]);

    const groupRanking = useMemo(() => {
        if (!me) return [];
        const pool = field.filter(s => s.groupId === me.groupId && s.id !== me.id);
        return [...pool, me]
            .map(s => ({ s, v: s.series[s.series.length - 1], c: pct(s.series[s.series.length - 1], s.series[s.series.length - 2]) }))
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
        const chg = pct(me.series[me.series.length - 1], me.series[me.series.length - 2]);
        return [
            `Bom dia, ${me.name}. Sua cotação ${chg >= 0 ? 'subiu' : 'recuou'} ${Math.abs(chg).toFixed(2)}% desde o último GP.`,
            `O ${ALLIANCES[allianceId].name} acompanha seus relatórios. Mantenha o rating ${ratingFor(me.series[me.series.length - 1])} no Master.`,
            `Competições ativas: Poletime, Master, Milesimus e Teamwork com inscrições sincronizadas.`,
            `O ${getChampionGroupName(me.groupId)} ainda tem assentos abertos. A concorrência no grid vai aumentar.`,
            `Lembre-se: quem prevê o caos, fatura o campeonato. Abra suas posições antes do fechamento do mercado.`,
        ];
    }, [me, allianceId]);

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

    if (isLoading || loading || !me) {
        return (
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono gap-4">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: teamColor, borderTopColor: 'transparent' }} />
                <p className="text-xs font-bold tracking-widest animate-pulse" style={{ color: teamColor }}>&gt;_ CONECTANDO AO PITWALL...</p>
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
                        <span className="text-lg md:text-xl font-black tracking-widest">VOLT<span style={{ color: teamColor }}>GRID</span></span>
                        <span className="hidden md:inline text-[10px] tracking-[0.3em] text-white/40">// TERMINAL DO ESTRATEGISTA</span>
                        <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest hidden sm:inline border" style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}10` }}>
                            {me.teamName}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 text-[10px] tracking-widest">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />MERCADO ABERTO</span>
                        <span className="text-white/50">PRÓXIMO GP <span className="font-bold tabular-nums" style={{ color: teamColor }}>T-{countdown}</span></span>
                        <span className="hidden sm:inline text-white/70 tabular-nums">{now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                        <Link href={`/${meProfile?.slug || ''}`} className="hover:text-white transition-colors" style={{ color: teamColor }}>[ SUPERLICENÇA ]</Link>
                        <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors uppercase cursor-pointer">[ SAIR ]</button>
                    </div>
                </header>


                {isDemo && (
                    <div className="max-w-[1500px] mx-auto px-3 md:px-6 pt-4">
                        <div className="border bg-black/40 rounded px-4 py-2.5 text-[10px] md:text-[11px] tracking-widest flex flex-wrap items-center justify-between gap-2" style={{ borderColor: `${teamColor}40`, color: teamColor }}>
                            <span>[SISTEMA] MODO DEMONSTRAÇÃO — DADOS FICTÍCIOS.</span>
                            <Link href="/superlicense" className="font-bold hover:text-white transition-colors">ACESSAR MINHA CONTA »</Link>
                        </div>
                    </div>
                )}

                {/* Grid Principal */}
                <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

                    {/* COLUNA ESQUERDA: Credencial + Briefing Oficial */}
                    <section className="lg:col-span-3 flex flex-col gap-4 md:gap-5">
                        <CredentialCard me={me} number={String(meProfile?.driver_number || '00')} allianceId={allianceId} />

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

                        {/* Atalhos Rápidos da Superlicença */}
                        <Panel title="Acesso Direto" accentColor={teamColor}>
                            <div className="flex flex-col gap-2">
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                >
                                    <span>SUPERLICENÇA PILOTO</span>
                                    <span style={{ color: teamColor }}>{meProfile?.slug || 'PERFIL'} »</span>
                                </Link>
                                <Link 
                                    href="/pitwall"
                                    className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                >
                                    <span>PITWALL GLOBAL</span>
                                    <span style={{ color: teamColor }}>GRID »</span>
                                </Link>
                                <Link 
                                    href="/bet"
                                    className="flex items-center justify-between p-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold"
                                >
                                    <span>CENTRAL DE APOSTAS</span>
                                    <span style={{ color: teamColor }}>ODDS »</span>
                                </Link>
                            </div>
                        </Panel>
                    </section>

                    {/* COLUNA CENTRAL: 4 Competições no Topo + Painel Multifuncional + Botões Operacionais */}
                    <section className="lg:col-span-6 flex flex-col gap-4 md:gap-5">
                        
                        {/* 1. OS 4 BOTÕES / CARDS DE COMPETIÇÃO MOVIDOS PARA O TOPO (Clicáveis) */}
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

                        {/* 2. PAINEL MULTIFUNCIONAL MULTI-COISAS */}
                        <div 
                            className="relative bg-black/80 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden animate-fade-in transition-all duration-300"
                            style={{ borderColor: `${teamColor}35` }}
                        >
                            {/* Navegador de Abas do Painel Multifuncional */}
                            <div 
                                className="flex items-center justify-between gap-1 px-2 py-2 border-b overflow-x-auto scrollbar-none"
                                style={{ 
                                    borderBottomColor: `${teamColor}20`,
                                    background: `linear-gradient(90deg, ${teamColor}0c, transparent)`
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    {[
                                        { id: 'quotes' as MainTab, label: 'COTAÇÃO', icon: '📈' },
                                        { id: 'book' as MainTab, label: 'PREVISÕES', icon: '🎯' },
                                        { id: 'radio' as MainTab, label: 'RÁDIO DIREÇÃO', icon: '📻' },
                                        { id: 'history' as MainTab, label: 'HISTÓRICO', icon: '⏱' },
                                        { id: 'teamwork' as MainTab, label: 'TEAMWORK', icon: '👥' },
                                    ].map(tab => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold tracking-widest uppercase transition-all whitespace-nowrap cursor-pointer ${
                                                    isActive 
                                                        ? 'text-black shadow-md' 
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                }`}
                                                style={{
                                                    backgroundColor: isActive ? teamColor : 'transparent',
                                                }}
                                            >
                                                <span>{tab.icon}</span>
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <span className="text-[9px] tracking-widest text-white/40 uppercase hidden sm:inline px-2">
                                    TERMINAL MULTI-MODAL
                                </span>
                            </div>

                            {/* Conteúdo Dinâmico da Tab Ativa */}
                            <div className="p-4 md:p-5">
                                
                                {/* ABA 1: COTAÇÃO DO ESTRATEGISTA */}
                                {activeTab === 'quotes' && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="flex flex-wrap items-end justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] tracking-[0.3em] text-white/40 mb-1">${(me.slug || me.name).replace(/[@.\s]/g, '').toUpperCase()}</p>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-3xl md:text-5xl font-black tabular-nums tracking-tight">{fmt(last)}</span>
                                                    <Delta value={pct(last, prev)} className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {([5, 10, 24] as const).map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setRange(r)}
                                                        className={`text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-sm border transition-colors cursor-pointer ${range === r ? 'text-black font-black' : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'}`}
                                                        style={{ 
                                                            backgroundColor: range === r ? teamColor : 'transparent',
                                                            borderColor: range === r ? teamColor : undefined
                                                        }}
                                                    >
                                                        {r === 24 ? 'TEMP' : `${r}R`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <PriceChart key={range} data={series} startRound={24 - range + 1} teamColor={teamColor} />

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-white/5 rounded overflow-hidden text-[10px] tracking-widest" style={{ background: `${teamColor}15` }}>
                                            {[
                                                ['ABERTURA', fmt(open)],
                                                ['MÁXIMA', fmt(Math.max(...series))],
                                                ['MÍNIMA', fmt(Math.min(...series))],
                                                ['NO PERÍODO', <Delta key="d" value={pct(last, open)} />],
                                            ].map(([k, v], i) => (
                                                <div key={i} className="bg-black/80 px-3 py-2.5">
                                                    <p className="text-white/40 mb-1">{k}</p>
                                                    <div className="text-white font-bold tabular-nums">{v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ABA 2: BOOK DE PREVISÕES */}
                                {activeTab === 'book' && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Livro de Apostas & Ordens</h3>
                                                <p className="text-[10px] text-white/40">Mercados abertos para a próxima etapa do campeonato</p>
                                            </div>
                                            <span className="text-[9px] px-2 py-0.5 rounded font-bold border" style={{ color: teamColor, borderColor: `${teamColor}40` }}>
                                                ODDS AO VIVO
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto -mx-2 md:mx-0">
                                            <table className="w-full min-w-[500px] text-[10px] md:text-[11px] tracking-widest">
                                                <thead>
                                                    <tr className="text-white/40 text-left border-b border-white/10">
                                                        <th className="py-2 font-normal">MERCADO</th>
                                                        <th className="py-2 font-normal">POSIÇÃO</th>
                                                        <th className="py-2 font-normal text-right">ODD</th>
                                                        <th className="py-2 font-normal pl-4">CONFIANÇA</th>
                                                        <th className="py-2 font-normal text-right">P/L</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {positions.map((p, i) => (
                                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-2.5 text-white/70">{p.market}</td>
                                                            <td className="py-2.5 font-bold">
                                                                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-3 rounded-sm" style={{ background: p.color }} />{p.pick}</span>
                                                            </td>
                                                            <td className="py-2.5 text-right tabular-nums font-bold" style={{ color: teamColor }}>{p.odd}x</td>
                                                            <td className="py-2.5 pl-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                                                                        <div className="h-full" style={{ width: `${p.conf}%`, backgroundColor: teamColor }} />
                                                                    </div>
                                                                    <span className="text-white/50 tabular-nums">{p.conf}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 text-right"><Delta value={p.pl} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                                            <span className="text-[9px] text-white/40 uppercase">Vinculado a Poletime (Pole) e Master (Corrida)</span>
                                            <Link href="/bet" className="text-[10px] md:text-xs font-bold tracking-widest hover:text-white transition-colors animate-pulse" style={{ color: teamColor }}>
                                                [ ABRIR NOVA POSIÇÃO NO PITWALL ] »
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* ABA 3: RÁDIO DO DIRETOR */}
                                {activeTab === 'radio' && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: teamColor }} />
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Canal Oficial da Equipe</h3>
                                            </div>
                                            <span className="text-[9px] tracking-widest uppercase text-white/40">FREQUÊNCIA PIT-1</span>
                                        </div>

                                        <div className="bg-black/90 p-4 rounded-lg border border-white/10 flex flex-col gap-3 min-h-[140px] justify-center">
                                            <p className="text-xs md:text-sm leading-relaxed text-white/90 border-l-2 pl-3 italic" style={{ borderLeftColor: teamColor }}>
                                                <TypewriterText key={feedIdx} text={feed[feedIdx]} speed={20} />
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                                <span className="text-white/40 block mb-1">CHEFIA TÉCNICA</span>
                                                <span className="font-bold text-white uppercase">{ALLIANCES[allianceId].name}</span>
                                            </div>
                                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                                <span className="text-white/40 block mb-1">STATUS DE CONFIABILIDADE</span>
                                                <span className="font-bold text-emerald-400">NOMINAL (99.4%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ABA 4: HISTÓRICO DE ATIVIDADES / TELEMETRIA */}
                                {activeTab === 'history' && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Histórico de Telemetria e Transações</h3>
                                            <span className="text-[9px] text-white/40 uppercase">LOG OFICIAL</span>
                                        </div>

                                        <div className="flex flex-col gap-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                                            {activityHistory.map((act, i) => (
                                                <div key={i} className="flex items-start gap-3 relative pl-6 text-[10px]">
                                                    <span 
                                                        className="absolute left-0.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center text-[7px] font-black" 
                                                        style={{ backgroundColor: act.color, color: '#000', boxShadow: `0 0 8px ${act.color}88` }} 
                                                    >
                                                        ●
                                                    </span>
                                                    <div className="flex-1 min-w-0 bg-white/[0.03] p-3 rounded border border-white/5">
                                                        <div className="flex items-center justify-between gap-1 mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase" style={{ backgroundColor: `${act.color}25`, color: act.color }}>
                                                                    {act.badge}
                                                                </span>
                                                                <span className="font-bold tracking-widest text-white">{act.title}</span>
                                                            </div>
                                                            <span className="text-[8px] text-white/40">{act.time}</span>
                                                        </div>
                                                        <p className="text-white/70 text-[10px] leading-relaxed">{act.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ABA 5: TEAMWORK MANAGEMENT */}
                                {activeTab === 'teamwork' && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Gestão da Dupla (Teamwork)</h3>
                                                <p className="text-[10px] text-white/40">Sincronização entre os dois carros da garagem da equipe</p>
                                            </div>
                                            <span className="text-[9px] px-2 py-0.5 rounded font-bold border" style={{ borderColor: 'rgba(251, 170, 25, 0.4)', color: '#fbaa19' }}>
                                                GRID 22 DRIVERS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-white/40 uppercase">CARRO #1 (TITULAR)</span>
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                                                </div>
                                                <h4 className="text-lg font-black tracking-widest" style={{ color: teamColor }}>{me.name}</h4>
                                                <span className="text-[10px] text-white/70 font-bold">{me.teamName}</span>
                                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50">
                                                    <span>STATUS: CONTRATO ATIVO</span>
                                                    <span className="text-emerald-400 font-bold">ONLINE</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-white/40 uppercase">CARRO #2 (PARCEIRO)</span>
                                                    <span className="w-2 h-2 rounded-full bg-white/30" />
                                                </div>
                                                <h4 className="text-lg font-black tracking-widest text-white/80">{compStats?.teamwork.partner}</h4>
                                                <span className="text-[10px] text-white/50 font-bold">SINERGIA DE PIT STOP: {compStats?.teamwork.synergy}%</span>
                                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50">
                                                    <span>VAGA CORRESPONDENTE</span>
                                                    <Link href="/pitwall" className="hover:text-white transition-colors" style={{ color: teamColor }}>VER NO PITWALL »</Link>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-[10px]">
                                            <span className="text-white/60">Pontuação conjunta de construtores somada na rodada:</span>
                                            <span className="font-black text-white">{compStats?.teamwork.teamScore} PTS</span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* 3. BARRA DE COMANDOS / OPERAÇÕES DO DASHBOARD (Harmonizada abaixo do painel) */}
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
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Setup
                                </Link>
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Report
                                </Link>
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Silly Season
                                </Link>
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    F1 Calendar
                                </Link>
                                <Link 
                                    href={`/${meProfile?.slug || ''}`}
                                    className="p-2.5 rounded text-center transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Settings
                                </Link>
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
                                <button 
                                    onClick={handleLogout}
                                    className="p-2.5 rounded text-center transition-all border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/40 cursor-pointer"
                                >
                                    Logout
                                </button>
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
                                                <p className={`font-bold truncate`} style={{ color: isMe ? teamColor : undefined }}>{r.s.name}{isMe && ' (VOCÊ)'}</p>
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

                <footer className="max-w-[1500px] mx-auto px-3 md:px-6 pb-8 flex flex-wrap justify-between gap-2 text-[9px] tracking-[0.3em] text-white/25">
                    <span>SINAL: ESTÁVEL · CANAL CRIPTOGRAFADO</span>
                    <span>VOLTGRID PLAYGROUND · TERMINAL MULTI-MODAL COM AÇÕES INTEGRADAS</span>
                </footer>
            </div>
        </main>
    );
}
