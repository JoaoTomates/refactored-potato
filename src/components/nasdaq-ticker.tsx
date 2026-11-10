"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { F1_TEAMS } from '@/lib/teams';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TEAM_COLORS: Record<string, string> = {
    'Mercedes': '#00D2BE',
    'Mercedes-AMG': '#00D2BE',
    'Ferrari': '#DC0000',
    'Scuderia Ferrari': '#DC0000',
    'McLaren': '#FF8700',
    'Red Bull': '#0600EF',
    'Red Bull Racing': '#0600EF',
    'Aston Martin': '#229971',
    'Williams': '#005AFF',
    'Williams Racing': '#005AFF',
    'Alpine': '#0090FF',
    'Haas': '#B6BABD',
    'Haas F1 Team': '#B6BABD',
    'Racing Bulls': '#6692FF',
    'RB': '#6692FF',
    'Audi/Sauber': '#F50537',
    'Audi': '#F50537',
    'Cadillac': '#FFC80C',
};

interface StrategistTickerItem {
    id: string;
    slug: string | null;
    name: string;
    sym: string;
    teamName: string;
    teamCode: string;
    teamColor: string;
    userColor: string;
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
                // Carrega todos os estrategistas com contrato assinado, equipe e perfil real do banco
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, team_id, teams(id, name, color, code), profiles(slug, first_name, last_name, driver_number, mls_balance, org_color)');

                if (!isMounted) return;

                const realItems: StrategistTickerItem[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const t = c.teams ? (Array.isArray(c.teams) ? c.teams[0] : c.teams) : null;
                    const fallbackTeam = F1_TEAMS.find(f => f.id === c.team_id || f.logo === c.team_id || f.name === c.team_id);

                    const teamName = t?.name || fallbackTeam?.name || 'Equipe';
                    const teamCode = t?.code || fallbackTeam?.logo || t?.name?.slice(0, 3)?.toUpperCase() || 'F1';
                    const teamColor = t?.color || TEAM_COLORS[teamName] || fallbackTeam?.color || '#fbaa19';
                    const userColor = p.org_color || teamColor || '#fbaa19';

                    const firstInitial = p.first_name ? p.first_name.trim().charAt(0).toUpperCase() : '';
                    const lastName = (p.last_name || '').trim().toUpperCase().replace(/\s+/g, '');
                    const num = p.driver_number ? String(p.driver_number) : '';
                    const codeName = firstInitial && lastName ? `${firstInitial}.${lastName}${num}` : 'ESTRATEGISTA';
                    const balance = typeof p.mls_balance === 'number' ? p.mls_balance : 100;
                    const cleanSlug = p.slug ? p.slug.replace('@', '').toLowerCase() : `${firstInitial.toLowerCase()}.${lastName.toLowerCase()}${num}`;
                    const targetSlug = (p.slug ? p.slug.toLowerCase() : (cleanSlug ? `@${cleanSlug}` : null));

                    return {
                        id: c.user_id,
                        slug: targetSlug,
                        name: codeName,
                        sym: `$${cleanSlug.toUpperCase()}`,
                        teamName,
                        teamCode,
                        teamColor,
                        userColor,
                        price: balance,
                        chg: 0, // 0,00% estável (fase de abertura de temporada)
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

    // Garante repetições pares para loop infinito perfeitamente fluido sem salto visual
    const repeatedList = useMemo(() => {
        if (tickerList.length === 0) return [];
        let list: StrategistTickerItem[] = [];
        const repeatCount = Math.max(4, Math.ceil(24 / tickerList.length));
        const evenCount = repeatCount % 2 === 0 ? repeatCount : repeatCount + 1;
        for (let i = 0; i < evenCount; i++) {
            list = list.concat(tickerList);
        }
        return list;
    }, [tickerList]);

    // Exibição EXCLUSIVA na página de Dashboard
    if (
        pathname === '/' ||
        pathname === '/superlicense' ||
        pathname === '/invite' ||
        pathname === '/academy' ||
        pathname === '/war-room' ||
        pathname === '/positions' ||
        pathname === '/poletime' ||
        pathname === '/rankings' ||
        pathname === '/race-week' ||
        pathname === '/race-control' ||
        pathname === '/news' ||
        pathname === '/socialmedia' ||
        pathname === '/telemetry' ||
        pathname === '/headquarters'
    ) {
        return null;
    }

    if (tickerList.length === 0) {
        return null;
    }

    // Duração suave calculada para leitura confortável (ritmo de transmissão F1)
    const animationDuration = Math.max(120, tickerList.length * 6);

    return (
        <aside aria-label="Nasdaq Pitwall MLS Ticker" className="w-full overflow-hidden border-b border-white/10 bg-[#07090c]/90 backdrop-blur-md font-mono relative z-30 select-none">
            {/* Gradientes laterais de fade estilo transmissão de TV */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />

            <style>{`
                @keyframes vg-marquee-global {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .vg-marquee-global {
                    animation: vg-marquee-global ${animationDuration}s linear infinite;
                    will-change: transform;
                }
                .vg-marquee-global:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="vg-marquee-global flex w-max whitespace-nowrap py-1.5 cursor-pointer">
                {repeatedList.map((t, i) => (
                    <Link
                        key={i}
                        href={t.slug ? `/${t.slug.startsWith('@') ? t.slug : `@${t.slug}`}` : '/'}
                        className="flex items-center gap-2.5 px-4 text-[11px] tracking-wider border-r border-white/10 hover:bg-white/5 transition-colors group shrink-0"
                        title={`Ver pitwall de ${t.name} (${t.teamName})`}
                    >
                        {/* Micro-barra vertical da Equipe (Team Color) */}
                        <span 
                            className="w-1 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: t.teamColor }}
                        />

                        {/* Badge da Equipe */}
                        <span 
                            className="text-[9px] font-black px-1.5 py-0.2 rounded border tracking-widest shrink-0"
                            style={{ 
                                color: t.teamColor, 
                                borderColor: `${t.teamColor}55`, 
                                backgroundColor: `${t.teamColor}18` 
                            }}
                        >
                            {t.teamCode}
                        </span>

                        {/* Nome do Piloto / Usuário com dot na cor pessoal */}
                        <span className="flex items-center gap-1.5 font-bold tracking-wider text-white group-hover:text-[#fbaa19] transition-colors">
                            <span 
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.userColor }}
                                title={`Cor do estrategista: ${t.userColor}`}
                            />
                            <span>{t.name}</span>
                        </span>

                        {/* Cotação MLS */}
                        <span className="text-white/60 tabular-nums text-[10px]">
                            {fmt(t.price)} <span className="text-white/40 text-[9px]">MLS</span>
                        </span>

                        {/* Variação Percentual */}
                        <Delta value={t.chg} className="text-[10px]" />
                    </Link>
                ))}
            </div>
        </aside>
    );
}
