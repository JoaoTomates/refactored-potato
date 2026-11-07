"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import CompetitionRankingsScreen from '@/components/competition-rankings-screen';
import { ChevronLeft } from 'lucide-react';

function PoletimeContent() {
    return (
        <main className="w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-[#e10600] selection:text-white relative overflow-x-hidden">
            {/* BARRA SUPERIOR DE TELEMETRIA */}
            <div className="w-full bg-black/80 border-b border-white/10 px-4 py-2.5 flex items-center justify-between relative z-20 backdrop-blur-md">
                <Link
                    href="/pitwall"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white transition-colors uppercase tracking-wider font-mono bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/15"
                >
                    <ChevronLeft className="w-4 h-4 text-[#e10600]" />
                    <span>Voltar ao Pit Wall</span>
                </Link>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-red-500 font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                        FIA LIVE TIMING
                    </span>
                    <span className="hidden sm:inline text-gray-400 uppercase tracking-widest">
                        // POLETIME HOMOLOGAÇÃO OFICIAL
                    </span>
                </div>
            </div>

            {/* CONSOLE BROADCAST TV COM TABELA DE TRANSMISSÃO */}
            <CompetitionRankingsScreen initialComp="poletime" isModal={false} />
        </main>
    );
}

export default function PoletimePage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-mono">
                <div className="w-10 h-10 rounded-full border-3 border-t-transparent border-[#e10600] animate-spin mb-3"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">CARREGANDO POLETIME BROADCAST TIMING...</p>
            </div>
        }>
            <PoletimeContent />
        </Suspense>
    );
}
