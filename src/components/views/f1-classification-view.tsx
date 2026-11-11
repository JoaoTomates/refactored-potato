"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { mockCalendar } from '@/api/f1-data';
import RaceRemoteControl from '@/components/race-remote-control';
import { getSystemBoxStyle } from '@/components/system-modal';

export interface F1ClassificationViewProps {
    initialRound?: string;
    embedded?: boolean;
    onBackToF1?: () => void;
}

export default function F1ClassificationView({
    initialRound = '01',
    embedded = false,
    onBackToF1,
}: F1ClassificationViewProps) {
    const [selectedRound, setSelectedRound] = useState(initialRound);
    const currentIndex = mockCalendar.findIndex(r => r.round === selectedRound);
    const currentRace = mockCalendar[currentIndex >= 0 ? currentIndex : 0];

    if (!currentRace) {
        return (
            <div className="w-full py-12 flex items-center justify-center font-mono">
                <div
                    className="text-center p-8 rounded-[3px] border border-[#000000] text-white"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    RACE NOT FOUND
                </div>
            </div>
        );
    }

    const content = (
        <div className={embedded ? 'w-full flex flex-col items-center gap-6' : 'w-full max-w-5xl mx-auto p-4 md:p-8 pt-12 pb-24 flex flex-col items-center justify-start min-h-screen'}>
            <div className="w-full">
                <RaceRemoteControl
                    activeRound={currentRace.round}
                    onRoundSelect={embedded ? (round) => setSelectedRound(round) : undefined}
                />
            </div>

            <div className="w-full text-center flex flex-col items-center justify-center">
                <p className="text-[#fbaa19] text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] font-display">
                    OFFICIAL RESULTS
                </p>
                <h1 className="text-white text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-widest font-display mb-1">
                    {currentRace.name}
                </h1>
            </div>

            <div
                className="w-full flex flex-col gap-4 border border-[#000000] rounded-[3px] p-4 md:p-8 font-mono"
                style={getSystemBoxStyle('#fbaa19')}
            >
                <h3 className="font-bold text-lg sm:text-xl uppercase tracking-widest text-white border-b border-white/10 pb-4">
                    RACE CLASSIFICATION
                </h3>
                <div className="overflow-x-auto border border-white/10 rounded-[3px] bg-[#000000]">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-[#030303] text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10">
                            <tr>
                                <th className="py-3 px-4">Pos</th>
                                <th className="py-3 px-4">Driver</th>
                                <th className="py-3 px-4">Team</th>
                                <th className="py-3 px-4">Time/Retired</th>
                                <th className="py-3 px-4">Pts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-3 px-4 font-bold text-white/60">1</td>
                                <td className="py-3 px-4 font-bold text-white">M. VERSTAPPEN</td>
                                <td className="py-3 px-4 text-white/50">Red Bull Racing</td>
                                <td className="py-3 px-4 font-mono text-white/80">1:31:44.742</td>
                                <td className="py-3 px-4 font-bold text-[#fbaa19]">26</td>
                            </tr>
                            <tr className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-3 px-4 font-bold text-white/60">2</td>
                                <td className="py-3 px-4 font-bold text-white">S. PEREZ</td>
                                <td className="py-3 px-4 text-white/50">Red Bull Racing</td>
                                <td className="py-3 px-4 font-mono text-white/80">+22.457s</td>
                                <td className="py-3 px-4 font-bold text-[#fbaa19]">18</td>
                            </tr>
                            <tr className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-3 px-4 font-bold text-white/60">3</td>
                                <td className="py-3 px-4 font-bold text-white">C. SAINZ</td>
                                <td className="py-3 px-4 text-white/50">Ferrari</td>
                                <td className="py-3 px-4 font-mono text-white/80">+25.110s</td>
                                <td className="py-3 px-4 font-bold text-[#fbaa19]">15</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center text-xs text-white/40">
                    {embedded && onBackToF1 ? (
                        <button
                            type="button"
                            onClick={onBackToF1}
                            className="uppercase font-bold tracking-widest hover:text-[#fbaa19] underline cursor-pointer"
                        >
                            Ir para F1 Grid &amp; Rankings
                        </button>
                    ) : (
                        <Link href="/f1" className="uppercase font-bold tracking-widest hover:text-[#fbaa19] underline">
                            Back to F1 Hub
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <main className="w-full min-h-screen bg-[#020202] text-white">
            {content}
        </main>
    );
}
