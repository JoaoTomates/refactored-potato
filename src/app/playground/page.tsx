"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';

/* ============================================================
 * PLAYGROUND — Terminal do Estrategista
 * Mistura a imersão "system box" do /invite com uma leitura de
 * mercado (bolsa de valores): cada estrategista é um ativo.
 * As cotações são SIMULADAS (determinísticas por usuário) até
 * existir o motor real de pontuação.
 * ============================================================ */

const ALLIANCES = {
    A: { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'ESTRELA', codes: ['MER', 'MCL', 'ALP', 'WIL'] },
    B: { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'MARANELLO', codes: ['FER', 'HAA', 'CAD'] },
    C: { id: 'C', name: 'OS DESAFIANTES', short: 'DESAFIANTES', codes: ['RBR', 'RBA', 'AST', 'AUD'] },
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
    // Placeholder: próximo domingo às 14:00 (horário local)
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

function Panel({ title, tag, children, className = '', bodyClass = 'p-4' }: { title: string; tag?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string }) {
    return (
        <div className={`relative bg-black/75 backdrop-blur-sm border border-[#fbaa19]/25 rounded-lg shadow-2xl overflow-hidden animate-fade-in ${className}`}>
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[#fbaa19]/15 bg-[#fbaa19]/[0.04]">
                <span className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-[#fbaa19] uppercase truncate">&gt;_ {title}</span>
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

function Sparkline({ data, width = 90, height = 26 }: { data: number[]; width?: number; height?: number }) {
    const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / r) * height}`).join(' ');
    const up = data[data.length - 1] >= data[0];
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function TypewriterText({ text, speed = 28 }: { text: string; speed?: number }) {
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
function PriceChart({ data, startRound }: { data: number[]; startRound: number }) {
    const [hover, setHover] = useState<number | null>(null);
    const W = 600, H = 220;
    const min = Math.min(...data), max = Math.max(...data);
    const pad = (max - min) * 0.12 || 1;
    const lo = min - pad, hi = max + pad;
    const x = (i: number) => (i / (data.length - 1)) * W;
    const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    const up = data[data.length - 1] >= data[0];
    const stroke = up ? '#34d399' : '#f87171';
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
                    <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(251,170,25,0.08)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={area} fill="url(#vgArea)" />
                <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={x(idx)} x2={x(idx)} y1="0" y2={H} stroke="rgba(255,255,255,0.18)" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Marcador (HTML para não distorcer com preserveAspectRatio) */}
            <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-black pointer-events-none" style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(data[idx]) / H) * 100}%`, background: stroke, boxShadow: `0 0 12px ${stroke}` }} />

            <div className="absolute top-2 pointer-events-none text-[10px] font-bold tracking-widest bg-black/80 border border-[#fbaa19]/30 px-2 py-1 rounded" style={{ left: `clamp(0px, calc(${(x(idx) / W) * 100}% - 48px), calc(100% - 96px))` }}>
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
    const maskStyle: React.CSSProperties = {
        WebkitMaskImage: 'url(/avatar-overlay.png)', maskImage: 'url(/avatar-overlay.png)',
        WebkitMaskSize: 'contain', maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
    };

    return (
        <Panel title="Credencial" tag="SUPERLICENÇA 2026" bodyClass="p-0">
            <div className="relative aspect-[5/4] overflow-hidden bg-[#070604]">
                {/* Glow da equipe */}
                <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 60%, ${me.teamColor} 0%, transparent 65%)` }} />
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fbaa19 1px, transparent 1px), linear-gradient(90deg, #fbaa19 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

                {/* Capacete: imagem + tinta da equipe recortada pela própria imagem */}
                <div className="absolute inset-[8%] top-[12%]">
                    <img src="/avatar-overlay.png" alt="Capacete" className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" />
                    <div className="absolute inset-0 mix-blend-multiply" style={{ ...maskStyle, background: me.teamColor }} />
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />

                <div className="absolute top-3 left-3 min-w-10 h-10 px-2 bg-white text-black flex items-center justify-center font-black text-xl rounded-sm shadow-lg">{number}</div>
                <div className="absolute top-3 right-3 text-[9px] font-bold tracking-widest border border-[#fbaa19]/50 text-[#fbaa19] bg-black/70 px-2 py-1 rounded-sm">BLOCO {allianceId}</div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                        <p className="text-[9px] tracking-[0.3em] text-white/50">ESTRATEGISTA</p>
                        <h2 className="text-xl md:text-2xl font-black tracking-widest leading-none">{me.name}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] tracking-[0.3em] text-white/50">RATING</p>
                        <p className="text-xl font-black text-[#fbaa19] leading-none">{ratingFor(last)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 text-[10px] tracking-widest border-t border-[#fbaa19]/15">
                {[
                    ['EQUIPE', <span key="t" className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: me.teamColor }} />{me.teamName}</span>],
                    ['GRUPO', getChampionGroupName(me.groupId)],
                    ['ALIANÇA', ALLIANCES[allianceId].short],
                    ['TICKER', `$${(me.slug || me.name).replace(/[@.\s]/g, '').toUpperCase()}`],
                ].map(([k, v], i) => (
                    <div key={i} className={`px-4 py-3 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} border-[#fbaa19]/10`}>
                        <p className="text-white/40 mb-1">{k}</p>
                        <div className="text-white font-bold uppercase truncate">{v}</div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

/* ============================================================
 * Página
 * ============================================================ */
export default function PlaygroundPage() {
    const { user, isLoading } = useSupabaseAuth();
    const now = useNow();

    const [loading, setLoading] = useState(true);
    const [meProfile, setMeProfile] = useState<any>(null);
    const [me, setMe] = useState<Strategist | null>(null);
    const [field, setField] = useState<Strategist[]>([]);
    const [range, setRange] = useState<5 | 10 | 24>(10);
    const [feedIdx, setFeedIdx] = useState(0);

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
                    mine = real.find(s => s.id === user.id) || null;
                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                    setMeProfile(prof);
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
    const series = me ? me.series.slice(-range) : [];
    const last = series[series.length - 1] ?? 0;
    const prev = me ? me.series[me.series.length - 2] : 0;
    const open = series[0] ?? 0;
    const isDemo = !user || !!me?.isDemo;

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
        const markets = ['POLE POSITION', 'VENCEDOR', 'PÓDIO', 'VOLTA MAIS RÁPIDA', 'SAFETY CAR'];
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
            `O ${ALLIANCES[allianceId].name} acompanha seus relatórios. Mantenha o rating ${ratingFor(me.series[me.series.length - 1])} ou melhore.`,
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

    if (isLoading || loading || !me) {
        return (
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono gap-4">
                <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#fbaa19] text-xs font-bold tracking-widest animate-pulse">&gt;_ CONECTANDO AO PITWALL...</p>
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

            {/* Fundo */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.12]" style={{ background: 'radial-gradient(circle at 50% 0%, #fbaa19 0%, transparent 55%)' }} />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fbaa19 1px, transparent 1px), linear-gradient(90deg, #fbaa19 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
            </div>

            <div className="relative z-10">
                {/* Barra superior */}
                <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-[#fbaa19]/20 bg-black/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <span className="text-lg md:text-xl font-black tracking-widest">VOLT<span className="text-[#fbaa19]">GRID</span></span>
                        <span className="hidden md:inline text-[10px] tracking-[0.3em] text-white/40">// TERMINAL DO ESTRATEGISTA</span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 text-[10px] tracking-widest">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />MERCADO ABERTO</span>
                        <span className="text-white/50">PRÓXIMO GP <span className="text-[#fbaa19] font-bold tabular-nums">T-{countdown}</span></span>
                        <span className="hidden sm:inline text-white/70 tabular-nums">{now ? now.toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                        <Link href="/" className="text-white/40 hover:text-[#fbaa19] transition-colors">[ SAIR ]</Link>
                    </div>
                </header>

                {/* Fita de cotações */}
                <div className="overflow-hidden border-b border-[#fbaa19]/15 bg-black/60">
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
                        <div className="border border-[#fbaa19]/40 bg-[#fbaa19]/10 rounded px-4 py-2.5 text-[10px] md:text-[11px] tracking-widest text-[#fbaa19] flex flex-wrap items-center justify-between gap-2">
                            <span>[SISTEMA] MODO DEMONSTRAÇÃO — DADOS FICTÍCIOS.</span>
                            <Link href="/superlicense" className="font-bold hover:text-white transition-colors">ACESSAR MINHA CONTA »</Link>
                        </div>
                    </div>
                )}

                <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

                    {/* COLUNA ESQUERDA */}
                    <section className="lg:col-span-3 flex flex-col gap-4 md:gap-5">
                        <CredentialCard me={me} number={String(meProfile?.driver_number || '00')} allianceId={allianceId} />

                        <Panel title="Rádio do Diretor" tag={<span className="text-[#fbaa19]/70">● AO VIVO</span>}>
                            <div className="text-xs md:text-[13px] leading-relaxed text-white/90 min-h-[96px] border-l-2 border-[#fbaa19] pl-3">
                                <TypewriterText key={feedIdx} text={feed[feedIdx]} />
                            </div>
                        </Panel>
                    </section>

                    {/* COLUNA CENTRAL */}
                    <section className="lg:col-span-6 flex flex-col gap-4 md:gap-5">
                        <Panel title="Cotação do Estrategista" tag="SIMULADA · VGC">
                            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
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
                                            className={`text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-sm border transition-colors ${range === r ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'}`}
                                        >
                                            {r === 24 ? 'TEMP' : `${r}R`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <PriceChart key={range} data={series} startRound={24 - range + 1} />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-4 bg-[#fbaa19]/10 border border-[#fbaa19]/10 rounded overflow-hidden text-[10px] tracking-widest">
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
                        </Panel>

                        <Panel title="Book de Previsões" tag="PRÓXIMO GP">
                            <div className="overflow-x-auto -mx-4 px-4">
                                <table className="w-full min-w-[520px] text-[10px] md:text-[11px] tracking-widest">
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
                                            <tr key={i} className="border-b border-white/5 hover:bg-[#fbaa19]/5 transition-colors">
                                                <td className="py-2.5 text-white/70">{p.market}</td>
                                                <td className="py-2.5 font-bold">
                                                    <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-3 rounded-sm" style={{ background: p.color }} />{p.pick}</span>
                                                </td>
                                                <td className="py-2.5 text-right tabular-nums text-[#fbaa19]">{p.odd}x</td>
                                                <td className="py-2.5 pl-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#fbaa19]" style={{ width: `${p.conf}%` }} />
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
                            <div className="flex justify-end mt-4">
                                <Link href="/bet" className="text-[10px] md:text-xs font-bold tracking-widest text-[#fbaa19] hover:text-white transition-colors animate-pulse">
                                    [ ABRIR NOVA POSIÇÃO ] »
                                </Link>
                            </div>
                        </Panel>
                    </section>

                    {/* COLUNA DIREITA */}
                    <section className="lg:col-span-3 flex flex-col gap-4 md:gap-5">
                        <Panel title="Índices das Alianças" bodyClass="p-0">
                            {allianceIdx.map(a => (
                                <div key={a.k} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${a.k === allianceId ? 'bg-[#fbaa19]/[0.07] border-l-2 border-l-[#fbaa19]' : ''}`}>
                                    <div className="min-w-0">
                                        <p className="text-[10px] tracking-widest text-white/40">IDX.{a.k}</p>
                                        <p className="text-[11px] font-bold tracking-widest truncate">{ALLIANCES[a.k].short}</p>
                                    </div>
                                    <Sparkline data={a.s.slice(-12)} width={70} />
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold tabular-nums">{fmt(a.v)}</p>
                                        <Delta value={a.c} className="text-[9px]" />
                                    </div>
                                </div>
                            ))}
                        </Panel>

                        <Panel title={`Ranking · ${getChampionGroupName(me.groupId)}`} tag={`${groupRanking.filter(r => !r.s.isDemo).length}/22`} bodyClass="p-0">
                            <div className="max-h-[420px] overflow-y-auto">
                                {groupRanking.map((r, i) => {
                                    const isMe = r.s.id === me.id;
                                    const row = (
                                        <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-[11px] tracking-widest transition-colors ${isMe ? 'bg-[#fbaa19]/10' : 'hover:bg-white/5'}`}>
                                            <span className={`w-5 text-right tabular-nums ${i < 3 ? 'text-[#fbaa19] font-black' : 'text-white/40'}`}>{i + 1}</span>
                                            <span className="w-1 h-6 rounded-sm shrink-0" style={{ background: r.s.teamColor }} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold truncate ${isMe ? 'text-[#fbaa19]' : ''}`}>{r.s.name}{isMe && ' (VOCÊ)'}</p>
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
                    <span>VOLTGRID PLAYGROUND · BUILD EXPERIMENTAL</span>
                </footer>
            </div>
        </main>
    );
}
