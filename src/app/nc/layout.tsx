"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export default function NewConceptLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Calcula a rota original correspondente removendo o prefixo /nc
    const originalPath = pathname.replace(/^\/nc/, '') || '/';

    return (
        <div className="relative min-h-screen bg-[#050401] text-white font-mono selection:bg-[#fbaa19] selection:text-black">
            
            {/* FLOATING COMPARE PILL // ALTERNADOR DE COMPARAÇÃO EM 1 CLIQUE */}
            <aside 
                aria-label="New Concept Comparator"
                className="fixed top-3 right-3 sm:right-6 z-[9999] flex items-center gap-2 bg-black/90 backdrop-blur-md border border-[#fbaa19]/60 px-3 py-1.5 rounded-full shadow-[0_0_25px_rgba(251,170,25,0.35)] text-xs font-mono animate-fade-in"
            >
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse"></span>
                    <span className="text-[10px] font-black tracking-widest text-[#fbaa19] uppercase">
                        LAB [NC]
                    </span>
                </div>

                <span className="text-white/30 text-xs">|</span>

                <Link
                    href={originalPath}
                    className="flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white transition-colors uppercase tracking-wider"
                    title="Alternar para a versão original/canônica em produção"
                >
                    <ArrowRightLeft className="w-3 h-3 text-[#fbaa19]" />
                    <span className="hidden sm:inline">Ver Versão</span>
                    <span>Original</span>
                </Link>
            </aside>

            {/* CONTEÚDO DA PÁGINA REFEITA */}
            {children}
        </div>
    );
}
