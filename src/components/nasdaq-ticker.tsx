"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface StrategistTickerItem {
    id: string;
    slug: string | null;
    name: string;
    sym: string;
    price: number;
    chg: number;
}

function Delta({ value, className = '' }: { value: number; className?: string }) {
    if (value === 0 || !isFinite(value)) {
        return (
            <span className={`text-white/40 font-bold tabular-nums ${className}`}>
                ● 0,00%
            </span>
        );
    }
    const up = value >= 0;
    return (
        <span className={`${up ? 'text-emerald-400' : 'text-red-400'} font-bold tabular-nums ${className}`}>
            {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
        </span>
    );
}

export default function NasdaqTicker() {
    const pathname = usePathname();
    const [tickerList, setTickerList] = useState<StrategistTickerItem[]>([]);

    useEffect(() => {
        let isMounted = true;
        const loadRealStrategists = async () => {
            try {
                // Carrega todos os estrategistas com contrato assinado e perfil real do banco
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, profiles(slug, first_name, last_name, driver_number, mls_balance)');

                if (!isMounted) return;

                const realItems: StrategistTickerItem[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const firstInitial = p.first_name ? p.first_name.trim().charAt(0).toUpperCase() : '';
                    const lastName = (p.last_name || '').trim().toUpperCase().replace(/\s+/g, '');
                    const num = p.driver_number ? String(p.driver_number) : '';
                    const codeName = firstInitial && lastName ? `${firstInitial}.${lastName}${num}` : 'ESTRATEGISTA';
                    const balance = typeof p.mls_balance === 'number' ? p.mls_balance : 100;
                    const cleanSlug = p.slug ? p.slug.replace('@', '') : `${firstInitial.toLowerCase()}${lastName.toLowerCase()}${num}`;
                    const targetSlug = p.slug || (cleanSlug ? `@${cleanSlug}` : null);

                    return {
                        id: c.user_id,
                        slug: targetSlug,
                        name: codeName,
                        sym: `$${cleanSlug.toUpperCase()}`,
                        price: balance,
                        chg: 0, // 0,00% estável (fase de abertura de temporada, 0 GPs homologados)
                    };
                });

                setTickerList(realItems);
            } catch (err) {
                console.error("Erro ao carregar cotações reais do Ticker:", err);
            }
        };

        loadRealStrategists();
        return () => { isMounted = false; };
    }, []);

    // Não exibe em telas de onboarding ou autenticação
    if (
        pathname === '/' ||
        pathname === '/superlicense' ||
        pathname === '/invite' ||
        pathname === '/academy'
    ) {
        return null;
    }

    if (tickerList.length === 0) {
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
                {[...tickerList, ...tickerList].map((t, i) => (
                    <Link
                        key={i}
                        href={t.slug ? `/${t.slug.startsWith('@') ? t.slug : `@${t.slug}`}` : '/'}
                        className="flex items-center gap-2 px-5 text-[11px] tracking-widest border-r border-white/5 hover:bg-white/5 transition-colors"
                        title={`Ver pitwall do estrategista ${t.sym}`}
                    >
                        <span className="text-white/80 font-bold">{t.sym}</span>
                        <span className="text-white/50 tabular-nums">{fmt(t.price)} MLS</span>
                        <Delta value={t.chg} className="text-[10px]" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
