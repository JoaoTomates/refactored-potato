"use client";
import React from 'react';
import { useJolpicaCalendar } from "@/hooks/useJolpica";
import { SystemModal } from "@/components/system-modal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectRound: (round: string) => void;
    currentSelectedRound: string;
}

export default function F1CalendarModal({ isOpen, onClose, onSelectRound, currentSelectedRound }: Props) {
    const { races, isLoading } = useJolpicaCalendar("current");
    
    if (!isOpen) return null;

    const now = new Date();

    const formatDateTime = (dateStr?: string, timeStr?: string) => {
        if (!dateStr) return "TBA";
        const d = new Date(`${dateStr}T${timeStr || "00:00:00Z"}`);
        return d.toLocaleDateString("en-US", { day: '2-digit', month: 'short' }) + " " + (timeStr ? d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) : "");
    };

    return (
        <SystemModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidthClass="max-w-5xl"
            accentColor="#fbaa19"
            title="OFFICIAL CALENDAR"
            subtitle="Season 2026 Master Schedule"
            closeLabel="[ FECHAR ]"
            bodyClassName="p-4 md:p-6 overflow-y-auto max-h-[75vh]"
        >
            {isLoading ? (
                <div className="p-12 text-center animate-pulse flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin mb-4"></div>
                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs">Syncing TS1 Calendar...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {races.map((race) => {
                        const raceDate = new Date(`${race.date}T${race.time || "00:00:00Z"}`);
                        const isPast = raceDate < now;
                        const isSelected = currentSelectedRound === race.round || (currentSelectedRound === "last" && !isPast && races.find(r => new Date(`${r.date}T${r.time || "00:00:00Z"}`) > now)?.round === race.round);

                        return (
                            <div key={race.round} className={`flex flex-col md:flex-row border border-[#000000] border-l-4 rounded-[3px] p-4 gap-4 transition-colors ${isSelected ? 'border-l-[#00ff00] bg-[#00ff00]/5' : 'border-l-[#fbaa19] bg-[#030303] hover:bg-black'}`}>
                                
                                <div className="flex flex-col md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-[#fbaa19] text-black font-black px-2 py-1 text-[10px] uppercase tracking-widest rounded-[3px]">ROUND {race.round}</span>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{formatDateTime(race.date)}</span>
                                    </div>
                                    <h3 className="text-base font-black uppercase tracking-widest text-white">{race.raceName}</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">{race.Circuit.circuitName}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">{race.Circuit.Location.locality}, {race.Circuit.Location.country}</p>
                                </div>

                                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-2 text-[10px] md:text-xs">
                                    <div className="bg-white/5 p-2 flex flex-col rounded-[3px]">
                                        <span className="text-gray-500 font-bold uppercase">FP1</span>
                                        <span className="text-white font-bold">{formatDateTime(race.FirstPractice?.date, race.FirstPractice?.time)}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 flex flex-col rounded-[3px]">
                                        <span className="text-gray-500 font-bold uppercase">FP2</span>
                                        <span className="text-white font-bold">{formatDateTime(race.SecondPractice?.date, race.SecondPractice?.time)}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 flex flex-col rounded-[3px]">
                                        <span className="text-gray-500 font-bold uppercase">{race.Sprint ? 'Sprint Shootout' : 'FP3'}</span>
                                        <span className="text-white font-bold">{formatDateTime(race.ThirdPractice?.date, race.ThirdPractice?.time)}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 flex flex-col rounded-[3px]">
                                        <span className="text-[#fbaa19] font-bold uppercase">Qualifying</span>
                                        <span className="text-white font-bold">{formatDateTime(race.Qualifying?.date, race.Qualifying?.time)}</span>
                                    </div>
                                    {race.Sprint && (
                                        <div className="bg-white/5 p-2 flex flex-col rounded-[3px]">
                                            <span className="text-[#fbaa19] font-bold uppercase">Sprint</span>
                                            <span className="text-white font-bold">{formatDateTime(race.Sprint?.date, race.Sprint?.time)}</span>
                                        </div>
                                    )}
                                    <div className="bg-[#fbaa19]/10 p-2 flex flex-col border border-[#fbaa19]/20 rounded-[3px]">
                                        <span className="text-[#fbaa19] font-black uppercase">Race</span>
                                        <span className="text-white font-bold">{formatDateTime(race.date, race.time)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-end md:w-32">
                                    {isPast ? (
                                        <button 
                                            onClick={() => onSelectRound(race.round)}
                                            className="w-full bg-[#00ff00] text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-[3px] border border-[#000000] hover:bg-white transition-colors cursor-pointer"
                                        >
                                            Resultados
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onSelectRound(race.round)}
                                            className="w-full bg-white/10 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-[3px] border border-[#000000] hover:bg-[#fbaa19] hover:text-black transition-colors cursor-pointer"
                                        >
                                            Visualizar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </SystemModal>
    );
}

