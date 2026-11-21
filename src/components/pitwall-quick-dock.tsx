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
    Shield,
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
            {/* 10 BOTÕES TÁTICOS DO PITWALL DOCK (2 FILEIRAS DE 5) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* FILEIRA 1 */}
                {/* 1. SCHEDULE */}
                {renderNavButton('calendar', '/next-race', '[Schedule]', Calendar)}

                {/* 2. RESULTS */}
                {renderNavButton('classification', '/f1-results/01', '[Results]', Flag)}

                {/* 3. STANDINGS */}
                {renderNavButton('rankings', '/rankings', '[Standings]', Trophy)}

                {/* 4. STRATEGISTS */}
                {renderNavButton('crew', '/crew', '[Strategists]', Users)}

                {/* 5. TEAMS */}
                {renderNavButton('f1', '/f1', '[Teams]', Shield)}

                {/* FILEIRA 2: STEWARDS + 4 GENÉRICOS */}
                {/* 6. STEWARDS */}
                <button
                    type="button"
                    onClick={onOpenVoting}
                    className={`${btnBase} ${btnInactive} hover:border-[#fbaa19]/50 hover:text-[#fbaa19]`}
                    title="Acessar Votação e Decisões dos Stewards BAEF"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <ShieldAlert
                            className={`w-3.5 h-3.5 shrink-0 ${
                                pendingStewardCount > 0 ? 'text-[#fbaa19]' : ''
                            }`}
                        />
                        <span className="truncate">[Stewards]</span>
                    </span>
                    {pendingStewardCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-[2px] bg-[#fbaa19] text-black font-black text-[9px] shrink-0">
                            {pendingStewardCount}
                        </span>
                    ) : (
                        <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                    )}
                </button>

                {/* 7. GENERIC 02 */}
                <button
                    type="button"
                    className={`${btnBase} ${btnInactive}`}
                    title="Módulo Tático 02"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">[Module 02]</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </button>

                {/* 8. GENERIC 03 */}
                <button
                    type="button"
                    className={`${btnBase} ${btnInactive}`}
                    title="Módulo Tático 03"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Radio className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">[Module 03]</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </button>

                {/* 9. GENERIC 04 */}
                <button
                    type="button"
                    className={`${btnBase} ${btnInactive}`}
                    title="Módulo Tático 04"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Wrench className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">[Module 04]</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </button>

                {/* 10. GENERIC 05 */}
                <button
                    type="button"
                    className={`${btnBase} ${btnInactive}`}
                    title="Módulo Tático 05"
                >
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">[Module 05]</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-45 shrink-0" />
                </button>
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
