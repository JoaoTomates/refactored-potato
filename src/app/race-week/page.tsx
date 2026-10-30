"use client";

import React from 'react';
import Link from 'next/link';
import RaceWeekSchedule from '@/components/race-week-schedule';

export default function RaceWeekPage() {
    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden pb-24">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#fbaa19]/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[140px]" />
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 flex flex-col gap-6">
                
                {/* Header de Navegação Superior */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#fbaa19]">
                            PROTOCOLO OFICIAL BAEFF1 // RACE WEEK ARCHITECTURE
                        </span>
                    </div>
                    <Link 
                        href="/"
                        className="text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-white/20 hover:border-[#fbaa19] hover:text-[#fbaa19] px-3.5 py-1.5 transition-all rounded-xs"
                    >
                        « VOLTAR AO PITWALL
                    </Link>
                </div>

                {/* Componente Genérico Dinâmico de Race Week */}
                <RaceWeekSchedule compact={false} showNavigationLink={false} />

                {/* Rodapé Informativo */}
                <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/40">
                    <span>BAEFF1 RACE CONTROL // MOTORSPORT OPERATIONAL TIMETABLE</span>
                    <span className="text-white/60">AUTOMAÇÃO DE DISPAROS DE PRE-SEASON & GRAND PRIX</span>
                </div>
            </div>
        </main>
    );
}
