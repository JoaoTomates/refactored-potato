"use client";

import React, { useState } from "react";
import RaceEventHero from "@/components/next-race-hero";
import F1CalendarModal from "@/components/f1-calendar-modal";
import { useJolpicaStandings, useJolpicaRaceResults } from "@/hooks/useJolpica";
import { useOpenF1Session } from "@/hooks/useOpenF1";
import { getSystemBoxStyle } from "@/components/system-modal";

function DriverRankingTable() {
    const { drivers, isLoading } = useJolpicaStandings("current");
    if (isLoading) {
        return <div className="p-8 text-center animate-pulse text-[#fbaa19] font-bold font-mono text-xs uppercase tracking-widest">CARREGANDO RANKING...</div>;
    }
    return (
        <div
            className="flex flex-col w-full border border-[#000000] rounded-[3px] overflow-hidden font-mono"
            style={getSystemBoxStyle('#fbaa19')}
        >
            <div className="bg-[#fbaa19] text-black font-black uppercase tracking-widest p-4 text-lg sm:text-xl">
                Campeonato de Drivers (2026)
            </div>
            <div className="flex flex-col divide-y divide-white/5 bg-[#000000]">
                {drivers.map((d) => (
                    <div key={d.Driver.driverId} className="flex items-center p-3 md:p-4 hover:bg-white/[0.03] transition-colors">
                        <div className="w-10 text-xl font-black text-white/40 tabular-nums">{d.position}</div>
                        <div className="flex-1 flex flex-col pl-4 border-l border-white/10">
                            <span className="font-bold uppercase tracking-widest text-white">
                                {d.Driver.givenName} <span className="text-lg sm:text-xl">{d.Driver.familyName}</span>
                            </span>
                            <span className="text-xs text-white/50 uppercase">{d.Constructors[0]?.name || "N/A"}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-[#fbaa19] tabular-nums">{d.points}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">PTS</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ConstructorRankingTable() {
    const { constructors, isLoading } = useJolpicaStandings("current");
    if (isLoading) return null;
    return (
        <div
            className="flex flex-col w-full border border-[#000000] rounded-[3px] overflow-hidden mt-8 font-mono"
            style={getSystemBoxStyle('#fbaa19')}
        >
            <div className="bg-[#030303] text-[#fbaa19] border-b-2 border-[#fbaa19] font-black uppercase tracking-widest p-4 text-lg sm:text-xl">
                Campeonato de Constructors (2026)
            </div>
            <div className="flex flex-col divide-y divide-white/5 bg-[#000000]">
                {constructors.map((c) => (
                    <div key={c.Constructor.constructorId} className="flex items-center p-3 md:p-4 hover:bg-white/[0.03] transition-colors">
                        <div className="w-10 text-xl font-black text-white/40 tabular-nums">{c.position}</div>
                        <div className="flex-1 pl-4 border-l border-white/10">
                            <span className="font-bold uppercase tracking-widest text-white text-lg sm:text-xl">{c.Constructor.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-[#fbaa19] tabular-nums">{c.points}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">PTS</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RaceResultsView({ round, session }: { round: string; session: string }) {
    const isOfficialSession = ['race', 'quali', 'sprint'].includes(session);

    const jolpi = useJolpicaRaceResults("current", round, isOfficialSession ? (session as any) : "race");
    const openf1 = useOpenF1Session(session);

    const jolpiEmpty = !jolpi.isLoading && jolpi.results.length === 0;
    const fallbackToOpenF1 = isOfficialSession && jolpiEmpty && openf1.results.length > 0;
    const effectiveIsOfficial = isOfficialSession && !fallbackToOpenF1;

    const isLoading = effectiveIsOfficial ? jolpi.isLoading : openf1.isLoading;
    const results = effectiveIsOfficial ? jolpi.results : openf1.results;
    const error = effectiveIsOfficial ? null : openf1.error;

    if (isLoading) {
        return (
            <div
                className="p-12 text-center animate-pulse flex flex-col items-center justify-center border border-[#000000] rounded-[3px] font-mono"
                style={getSystemBoxStyle(effectiveIsOfficial ? '#fbaa19' : '#00ff00')}
            >
                <div className={`w-8 h-8 rounded-full border-4 border-t-transparent animate-spin mb-4 ${effectiveIsOfficial ? 'border-[#fbaa19]' : 'border-[#00ff00]'}`} />
                <p className={`font-bold tracking-widest uppercase text-xs ${effectiveIsOfficial ? 'text-[#fbaa19]' : 'text-[#00ff00]'}`}>
                    {effectiveIsOfficial ? 'Buscando Classificacao Oficial (BAEF)...' : 'Sincronizando telemetria (OpenF1)...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="p-12 text-center text-red-400 uppercase tracking-widest border border-[#000000] rounded-[3px] font-mono text-xs"
                style={getSystemBoxStyle('#ef4444')}
            >
                Erro ao carregar telemetria: {error}
            </div>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div
                className="p-12 text-center text-white/50 uppercase tracking-widest border border-[#000000] rounded-[3px] font-mono text-xs"
                style={getSystemBoxStyle('#fbaa19')}
            >
                Results not available for this session yet.
            </div>
        );
    }

    return (
        <div
            className="flex flex-col w-full border border-[#000000] rounded-[3px] overflow-hidden font-mono"
            style={getSystemBoxStyle(effectiveIsOfficial ? '#fbaa19' : '#00ff00')}
        >
            <div className={`border-b font-black uppercase tracking-widest p-4 text-xs md:text-sm flex justify-between items-center ${effectiveIsOfficial ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'bg-[#030303] text-[#00ff00] border-[#00ff00]/30'}`}>
                <span>{effectiveIsOfficial ? `Classificacao Oficial (${session})` : fallbackToOpenF1 ? `Telemetria em Tempo Real (${session} - Aguardando BAEF)` : 'OpenF1 Live Telemetry Engine'}</span>
                {!effectiveIsOfficial && <span className="animate-pulse">● LIVE</span>}
            </div>
            <div className="overflow-x-auto bg-[#000000]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#030303] border-b border-white/10 text-white/50 uppercase tracking-widest text-[10px] md:text-xs">
                            <th className="p-3">Pos</th>
                            <th className="p-3">N</th>
                            <th className="p-3">Piloto</th>
                            <th className="p-3 hidden sm:table-cell">Equipe</th>
                            <th className="p-3 text-right">Tempo/Status</th>
                            <th className="p-3 text-right">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {results.map((r: any, index: number) => (
                            <tr key={r.number || index} className="hover:bg-white/[0.04] transition-colors">
                                <td className="p-3 font-black text-white/50 tabular-nums">{r.position}</td>
                                <td className="p-3 font-bold text-[#fbaa19] tabular-nums">{r.number}</td>
                                <td className="p-3 font-bold text-white uppercase tracking-widest whitespace-nowrap">
                                    {r.Driver.givenName.charAt(0)}. {r.Driver.familyName}
                                </td>
                                <td className="p-3 text-[10px] md:text-xs text-white/50 uppercase hidden sm:table-cell whitespace-nowrap">{r.Constructor?.name || 'Unknown'}</td>
                                <td className="p-3 text-right text-[10px] uppercase text-white/60">
                                    {effectiveIsOfficial ? (r.Time?.time || r.status) : <span className="bg-[#00ff00]/10 text-[#00ff00] px-2 py-1 rounded-[3px] border border-[#00ff00]/20">Validating</span>}
                                </td>
                                <td className="p-3 text-right font-black text-[#fbaa19] text-sm md:text-lg tabular-nums">{effectiveIsOfficial ? r.points : (r.position <= 10 ? '?' : '-')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export interface F1HubViewProps {
    embedded?: boolean;
}

export default function F1HubView({ embedded = false }: F1HubViewProps) {
    const [view, setView] = useState<"results" | "ranking">("results");
    const [sessionTab, setSessionTab] = useState<"fp1" | "fp2" | "fp3" | "quali" | "sprint" | "race">("race");
    const [selectedRound, setSelectedRound] = useState<string>("last");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const sessionTabs = [
        { id: "race", label: "RACE" },
        { id: "sprint", label: "SPRINT" },
        { id: "quali", label: "QUALI" },
        { id: "fp3", label: "FP3" },
        { id: "fp2", label: "FP2" },
        { id: "fp1", label: "FP1" },
    ];

    const handleSelectRound = (round: string) => {
        setSelectedRound(round);
        setIsCalendarOpen(false);
        setView("results");
    };

    const inner = (
        <>
            <F1CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                onSelectRound={handleSelectRound}
                currentSelectedRound={selectedRound}
            />

            <RaceEventHero selectedRound={selectedRound} onOpenCalendar={() => setIsCalendarOpen(true)} />

            <div className={`w-full ${embedded ? 'mt-4' : 'max-w-5xl mx-auto px-4 md:px-8 mt-[-20px] md:mt-[-32px]'} relative z-20`}>
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => setView(view === "results" ? "ranking" : "results")}
                        className="bg-[#030303] text-[#fbaa19] border border-[#fbaa19]/50 hover:bg-[#fbaa19] hover:text-black transition-colors px-5 py-2.5 rounded-[3px] font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2 cursor-pointer font-mono"
                    >
                        {view === "results" ? (
                            <>
                                <span>Ver Rankings Globais</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                                <span>Voltar para Resultados</span>
                            </>
                        )}
                    </button>
                </div>

                {view === "results" ? (
                    <div className="flex flex-col animate-fade-in">
                        <div
                            className="flex overflow-x-auto scrollbar-hide border border-[#000000] rounded-[3px] mb-6 font-mono"
                            style={getSystemBoxStyle('#fbaa19')}
                        >
                            {sessionTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSessionTab(tab.id as any)}
                                    className={`flex-1 min-w-[80px] font-black uppercase tracking-widest transition-all duration-300 py-3.5 px-2 text-[10px] md:text-xs text-center border-b-2 cursor-pointer ${
                                        sessionTab === tab.id
                                            ? "bg-[#fbaa19]/15 text-[#fbaa19] border-[#fbaa19]"
                                            : "text-white/50 hover:bg-white/5 border-transparent hover:text-white"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <RaceResultsView round={selectedRound} session={sessionTab} />
                    </div>
                ) : (
                    <div className="flex flex-col animate-fade-in gap-8">
                        <DriverRankingTable />
                        <ConstructorRankingTable />
                    </div>
                )}
            </div>
        </>
    );

    if (embedded) {
        return <div className="w-full relative">{inner}</div>;
    }

    return (
        <main className="w-full min-h-screen pb-24 bg-[#020202] text-white relative">
            {inner}
        </main>
    );
}
