"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CompetitionRankingsScreen, { CompetitionKey } from '@/components/competition-rankings-screen';
import { ChevronLeft } from 'lucide-react';

function RankingsContent() {
    const searchParams = useSearchParams();
    const rawComp = searchParams.get('comp') as CompetitionKey | null;
    const initialComp = (rawComp && ['poletime', 'master', 'milesimus', 'teamwork'].includes(rawComp))
        ? rawComp
        : 'poletime';

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-6 pb-24 font-sans selection:bg-[#fbaa19] selection:text-black">
            {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mb-4 flex items-center justify-between">
                <Link
                    href="/pitwall"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider font-mono bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/10"
                >
                    <ChevronLeft className="w-4 h-4 text-[#fbaa19]" />
                    <span>Voltar ao Pit Wall</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">
                        TS1 RANKINGS V2 // TELEMETRIA OFICIAL
                    </span>
                </div>
            </div>

            {/* CONSOLE PRINCIPAL COM A TABELA NO PADRÃO /telemetry */}
            <CompetitionRankingsScreen initialComp={initialComp} isModal={false} />
        </main>
    );
}

export default function RankingsPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-mono">
                <div className="w-10 h-10 rounded-full border-3 border-t-transparent border-[#fbaa19] animate-spin mb-3"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">CARREGANDO CENTRAL DE RANKINGS...</p>
            </div>
        }>
            <RankingsContent />
        </Suspense>
    );
}
