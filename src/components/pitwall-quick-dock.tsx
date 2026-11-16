"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchNextEvent, F1Event } from '@/api/f1-data';
import { getCircuitIntel } from '@/lib/circuits-intel';
import { getSystemBoxStyle } from '@/components/system-modal';
import {
    MapPin,
    SlidersHorizontal,
    Users,
    Flag,
    ShieldAlert,
    Trophy,
    Wrench,
    Newspaper,
    X,
    ArrowUpRight,
    Calendar,
    Radio,
    Gamepad2,
} from 'lucide-react';

export type DashboardSubView =
    | 'menu'
    | 'settings'
    | 'setup'
    | 'calendar'
    | 'report'
    | 'silly_season'
    | 'f1'
    | 'classification'
    | 'rankings'
    | 'crew'
    | 'news'
    | 'telemetry'
    | 'pitwall'
    | 'race_control'
    | 'next_race'
    | 'positions';

type InlineDrawer = 'track_intel' | 'open_orders' | null;

export interface PitwallQuickDockProps {
    userPrediction: any;
    pendingStewardCount: number;
    teamColor: string;
    isOwner?: boolean;
    activeView?: DashboardSubView;
    isRaceWeekActive?: boolean;
    onToggleRaceWeek?: () => void;
    isRaceWeekOpen?: boolean;
    onJumpToTeam?: () => void;
    onSelectView?: (view: DashboardSubView) => void;
    onOpenVoting: () => void;
    onJumpToBookTab: () => void;
}

export default function PitwallQuickDock({
    userPrediction,
    pendingStewardCount,
    teamColor,
    isOwner = true,
    activeView = 'menu',
    isRaceWeekActive = false,
    onToggleRaceWeek,
    isRaceWeekOpen = false,
    onJumpToTeam,
    onSelectView,
    onOpenVoting,
    onJumpToBookTab,
}: PitwallQuickDockProps) {
    const [activeDrawer, setActiveDrawer] = useState<InlineDrawer>(null);
    const [nextEvent, setNextEvent] = useState<F1Event | null>(null);

    useEffect(() => {
        fetchNextEvent().then((ev) => {
            if (ev) setNextEvent(ev);
        });
    }, []);

    const circuitIntel = useMemo(() => {
        return getCircuitIntel(nextEvent?.circuit || nextEvent?.round || 'americas');
    }, [nextEvent]);

    const poletimeStr = userPrediction?.poletime || null;
    const top10List: string[] = Array.isArray(userPrediction?.top10) ? userPrediction.top10.filter(Boolean) : [];
    const evoList: string[] = Array.isArray(userPrediction?.evo) ? userPrediction.evo.filter(Boolean) : [];
    const h2hCount = userPrediction?.h2h ? Object.keys(userPrediction.h2h).length : 0;

    const btnBase =
        'px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-[3px] transition-all cursor-pointer flex items-center justify-between gap-2 border';
    const btnInactive =
        'bg-[#030303] text-white/75 border-white/10 hover:bg-white/10 hover:border-white/25 hover:text-white';
    const btnActive =
        'bg-white text-black border-white font-black shadow-md';

    const renderNavButton = (
        view: DashboardSubView,
        fallbackHref: string,
        label: string,
        Icon: React.ComponentType<{ className?: string }>
    ) => {
        const isActive = activeView === view;
        if (onSelectView) {
            return (
                <button
                    type="button"
                    onClick={() => onSelectView(view)}
                    className={`${btnBase} ${isActive ? btnActive : btnInactive}`}
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{label}</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </button>
            );
        }

        return (
            <Link href={fallbackHref} className={`${btnBase} ${btnInactive}`}>
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
            </Link>
        );
    };

    return (
        <div className="w-full flex flex-col gap-2.5 font-mono">
            {/* 10 BOTÕES TÁTICOS PITWALL (RACE WEEK + 8 TÁTICOS + TEAM) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* 1. RACE WEEK (Primeira posição, ativo se for semana de corrida) */}
                <button
                    type="button"
                    onClick={onToggleRaceWeek}
                    disabled={!isRaceWeekActive}
                    title={isRaceWeekActive ? (isRaceWeekOpen ? 'Ocultar Race Week' : 'Exibir Race Week') : 'Race Week inativo (fora de semana de GP)'}
                    className={`${btnBase} ${
                        isRaceWeekActive
                            ? isRaceWeekOpen
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] font-black shadow-[0_0_12px_rgba(251,170,25,0.35)]'
                                : 'bg-[#030303] text-amber-400 border-amber-500/40 hover:bg-amber-500/10 hover:border-amber-400'
                            : 'opacity-40 cursor-not-allowed bg-black/40 text-white/40 border-white/5'
                    }`}
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Calendar className={`w-3.5 h-3.5 shrink-0 ${isRaceWeekActive ? 'text-inherit' : 'text-white/40'}`} />
                        <span className="truncate">RACE WEEK</span>
                    </span>
                    {isRaceWeekActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
                </button>

                {/* 2. TRACK INTEL */}
                <button
                    type="button"
                    onClick={() =>
                        setActiveDrawer((prev) => (prev === 'track_intel' ? null : 'track_intel'))
                    }
                    className={`${btnBase} ${activeDrawer === 'track_intel' ? btnActive : btnInactive}`}
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">TRACK INTEL</span>
                    </span>
                    <span className="text-[8px] opacity-60 shrink-0">
                        {activeDrawer === 'track_intel' ? '▾' : '▸'}
                    </span>
                </button>

                {/* 3. OPEN ORDERS */}
                <button
                    type="button"
                    onClick={() =>
                        setActiveDrawer((prev) => (prev === 'open_orders' ? null : 'open_orders'))
                    }
                    className={`${btnBase} ${activeDrawer === 'open_orders' ? btnActive : btnInactive}`}
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">OPEN ORDERS</span>
                    </span>
                    <span className="text-[8px] opacity-60 shrink-0">
                        {activeDrawer === 'open_orders' ? '▾' : '▸'}
                    </span>
                </button>

                {/* 4. F1 GRID */}
                {renderNavButton('f1', '/f1', 'F1 GRID', Users)}

                {/* 5. CLASSIFICATION */}
                {renderNavButton('classification', '/f1-results/01', 'CLASSIFICATION', Flag)}

                {/* 6. STEWARDS (Modal de Voting Inline) */}
                <button
                    type="button"
                    onClick={onOpenVoting}
                    className={`${btnBase} ${btnInactive}`}
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <ShieldAlert
                            className={`w-3.5 h-3.5 shrink-0 ${
                                pendingStewardCount > 0 ? 'text-[#fbaa19]' : ''
                            }`}
                        />
                        <span className="truncate">STEWARDS</span>
                    </span>
                    {pendingStewardCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-[2px] bg-[#fbaa19] text-black font-black text-[9px] shrink-0">
                            {pendingStewardCount}
                        </span>
                    ) : (
                        <span className="text-[8px] opacity-45 shrink-0">VOTE</span>
                    )}
                </button>

                {/* 7. FANTASY GAME */}
                <Link
                    href="/fantasy"
                    className={`${btnBase} ${btnInactive} hover:border-amber-400/50 hover:text-amber-400`}
                    title="Acessar o Fantasy Game BAEFF1 Oficial"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Gamepad2 className="w-3.5 h-3.5 text-[#fbaa19] shrink-0" />
                        <span className="truncate">FANTASY</span>
                    </span>
                    <span className="text-[7.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 shrink-0">
                        GAME
                    </span>
                </Link>

                {/* 8. GARAGE CREW */}
                {renderNavButton('crew', '/crew', 'GARAGE CREW', Wrench)}

                {/* 9. PADDOCK WIRE */}
                {renderNavButton('news', '/news', 'PADDOCK WIRE', Newspaper)}

                {/* 10. SOCIAL FEED */}
                <Link
                    href="/socialmedia"
                    className={`${btnBase} ${btnInactive} hover:border-[#00e5ff]/50 hover:text-[#00e5ff]`}
                    title="Acessar Paddock Social & Comunicação de Pilotos"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Radio className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                        <span className="truncate">SOCIAL FEED</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </Link>
            </div>

            {/* DRAWER INLINE: TRACK INTEL */}
            {activeDrawer === 'track_intel' && (
                <div
                    className="border border-[#000000] rounded-[3px] p-4 flex flex-col gap-3 animate-fade-in"
                    style={getSystemBoxStyle(teamColor || '#fbaa19')}
                >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-[#fbaa19] shrink-0" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-white truncate">
                                TRACK INTEL // {nextEvent?.name || circuitIntel.officialTitle}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveDrawer(null)}
                            aria-label="Fechar Track Intel"
                            className="text-white/40 hover:text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">EXTENSÃO / VOLTAS</span>
                            <span className="font-black text-white">
                                {circuitIntel.circuitLengthKm} KM · {circuitIntel.laps} LAPS
                            </span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">SAFETY CAR / CHUVA</span>
                            <span className="font-black text-[#fbaa19]">
                                SC {circuitIntel.scProbability}% · RAIN {circuitIntel.weather.rainRiskPercent}%
                            </span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">DOWNFORCE / PNEU</span>
                            <span className="font-black text-white">
                                {circuitIntel.downforceLevel} · {circuitIntel.tireDegradation}
                            </span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">POLE REFERÊNCIA</span>
                            <span className="font-black text-emerald-400">
                                {circuitIntel.lastPoleTime.time} ({circuitIntel.lastPoleTime.driver})
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-white/55">
                            Estratégia ótima: <strong className="text-white">{circuitIntel.optimalStrategy}</strong>
                        </span>
                        {onSelectView ? (
                            <button
                                type="button"
                                onClick={() => onSelectView('next_race')}
                                className="px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-black transition-colors cursor-pointer"
                                style={{ backgroundColor: teamColor || '#fbaa19' }}
                            >
                                OPEN FULL DOSSIER »
                            </button>
                        ) : (
                            <Link
                                href="/next-race"
                                className="px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-black transition-colors"
                                style={{ backgroundColor: teamColor || '#fbaa19' }}
                            >
                                OPEN FULL DOSSIER »
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* DRAWER INLINE: OPEN ORDERS */}
            {activeDrawer === 'open_orders' && (
                <div
                    className="border border-[#000000] rounded-[3px] p-4 flex flex-col gap-3 animate-fade-in"
                    style={getSystemBoxStyle(teamColor || '#fbaa19')}
                >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#fbaa19] shrink-0" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-white truncate">
                                OPEN ORDERS // POSIÇÕES TRANSMITIDAS
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveDrawer(null)}
                            aria-label="Fechar Open Orders"
                            className="text-white/40 hover:text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">POLETIME</span>
                            <span className="font-black text-[#fbaa19]">
                                {poletimeStr || 'NÃO ENVIADO'}
                            </span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">TOP 10 FINISH</span>
                            <span className="font-black text-white">{top10List.length}/10 PILOTOS</span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">EVO / ESCALADA</span>
                            <span className="font-black text-white">{evoList.length}/5 PILOTOS</span>
                        </div>
                        <div className="p-2 bg-white/[0.03] border border-white/10 rounded-[3px]">
                            <span className="text-white/40 block uppercase">DUELOS H2H</span>
                            <span className="font-black text-white">{h2hCount}/11 CONFRONTOS</span>
                        </div>
                    </div>

                    {top10List.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="text-white/45 uppercase mr-1">PÓDIO:</span>
                            {top10List.slice(0, 3).map((d, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-[3px] bg-white/10 border border-white/15 text-white font-bold"
                                >
                                    P{i + 1}: {d}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                onJumpToBookTab();
                                setActiveDrawer(null);
                            }}
                            className="px-3 py-1.5 rounded-[3px] border border-white/20 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                            VER NO BOOK DE PREVISÕES
                        </button>
                        {isOwner && (
                            onSelectView ? (
                                <button
                                    type="button"
                                    onClick={() => onSelectView('positions')}
                                    className="px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-black transition-colors cursor-pointer"
                                    style={{ backgroundColor: teamColor || '#fbaa19' }}
                                >
                                    EDIT IN POSITIONS »
                                </button>
                            ) : (
                                <Link
                                    href="/positions"
                                    className="px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-black transition-colors"
                                    style={{ backgroundColor: teamColor || '#fbaa19' }}
                                >
                                    EDIT IN POSITIONS »
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
