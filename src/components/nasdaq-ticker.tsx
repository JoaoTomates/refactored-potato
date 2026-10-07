"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { F1_TEAMS } from '@/lib/teams';

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
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
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

interface Strategist {
    id: string;
    slug: string | null;
    name: string;
    series: number[];
}

const DEMO_NAMES = [
    'M. KOVAC', 'J. TANAKA', 'R. SILVA', 'A. BERG', 'L. MOREAU',
    'D. OKAFOR', 'I. PETROVA', 'C. VEGA', 'T. NAKAMURA', 'H. LINDQVIST'
];

function makeStrategist(id: string, name: string, slug: string | null): Strategist {
    return {
        id,
        slug,
        name,
        series: buildSeries(id),
    };
}

function Delta({ value, className = '' }: { value: number; className?: string }) {
    const up = value >= 0;
    return (
        <span className={`${up ? 'text-emerald-400' : 'text-red-400'} font-bold tabular-nums ${className}`}>
            {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
        </span>
    );
}

export default function NasdaqTicker() {
    const pathname = usePathname();

    const [field, setField] = useState<Strategist[]>([]);

    useEffect(() => {
        let isMounted = true;
        const loadStrategists = async () => {
            try {
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, profiles(slug, first_name, last_name)');

                if (!isMounted) return;

                const real: Strategist[] = (contracts || []).map((c: any) => {
                    const p = c.profiles || {};
                    const name = p.first_name ? `${p.first_name.charAt(0)}. ${p.last_name || ''}`.trim() : 'ESTRATEGISTA';
                    return makeStrategist(c.user_id, name.toUpperCase(), p.slug || null);
                });

                const demos = DEMO_NAMES.map((n, i) => makeStrategist(`demo-${i}`, n, null));
                setField(real.length >= 4 ? real : [...real, ...demos]);
            } catch (err) {
                console.error("Erro ao carregar cotações do Ticker:", err);
                const demos = DEMO_NAMES.map((n, i) => makeStrategist(`demo-${i}`, n, null));
                if (isMounted) setField(demos);
            }
        };

        loadStrategists();
        return () => { isMounted = false; };
    }, []);

    const tickerItems = useMemo(() => {
        const list = field.length ? field : DEMO_NAMES.map((n, i) => makeStrategist(`demo-${i}`, n, null));
        return list.map(s => ({
            sym: `$${(s.slug || s.name).replace(/[@.\s]/g, '').toUpperCase()}`,
            price: s.series[s.series.length - 1],
            chg: pct(s.series[s.series.length - 1], s.series[s.series.length - 2]),
            slug: s.slug,
        }));
    }, [field]);

    // Do not show on onboarding or inside playground (called AFTER all hooks to adhere to Rules of Hooks)
    if (
        pathname === '/' ||
        pathname === '/superlicense' ||
        pathname === '/invite' ||
        pathname === '/invite4' ||
        pathname === '/playground' ||
        pathname === '/academy'
    ) {
        return null;
    }

    return (
        <div className="w-full overflow-hidden border-b border-white/5 bg-black/60 font-mono relative z-30 select-none">
            <style>{`
                @keyframes vg-marquee-global {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .vg-marquee-global {
                    animation: vg-marquee-global 45s linear infinite;
                }
                .vg-marquee-global:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="vg-marquee-global flex w-max whitespace-nowrap py-2 cursor-pointer">
                {[...tickerItems, ...tickerItems].map((t, i) => (
                    <Link
                        key={i}
                        href={t.slug ? `/${t.slug.startsWith('@') ? t.slug : `@${t.slug}`}` : '/playground'}
                        className="flex items-center gap-2 px-5 text-[11px] tracking-widest border-r border-white/5 hover:bg-white/5 transition-colors"
                        title={`Ver cotação de ${t.sym}`}
                    >
                        <span className="text-white/80 font-bold">{t.sym}</span>
                        <span className="text-white/50 tabular-nums">{fmt(t.price)}</span>
                        <Delta value={t.chg} className="text-[10px]" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
