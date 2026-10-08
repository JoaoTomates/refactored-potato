"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import NasdaqTicker from './nasdaq-ticker';
import Footer from './footer';
import MobileBottomDock from './mobile-bottom-dock';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHiddenRoute = pathname === '/' || pathname === '/invite' || pathname === '/academy' || pathname === '/headquarters' || pathname === '/superlicense';

    return (
        <div className="flex flex-col min-h-screen w-full relative">
            {/* Único Ticker Oficial do Sistema */}
            {!isHiddenRoute && <NasdaqTicker />}
            
            {/* Conteúdo Principal com navegação orgânica contextual interna */}
            <main className="flex-grow flex flex-col w-full">
                {children}
            </main>
        </div>
    );
}
