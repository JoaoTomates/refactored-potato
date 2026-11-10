"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import NasdaqTicker from './nasdaq-ticker';

/**
 * Helper que determina se a rota atual é exclusivamente o Dashboard do Estrategista:
 * - /[driver_slug] (ex: /L.GUSTAVO88, /pitwall)
 * - /nc/[driver_slug] ou /nc/new-concept/dashboard
 */
export function isDashboardRoute(pathname: string | null): boolean {
    if (!pathname || pathname === '/') return false;

    // Rotas estáticas que explicitamente NÃO são o Dashboard
    const nonDashboardRoutes = new Set([
        '/crew',
        '/f1',
        '/fantasy',
        '/fantasy2',
        '/fantasy3',
        '/headquarters',
        '/invite',
        '/lore',
        '/news',
        '/next-race',
        '/playground',
        '/poletime',
        '/positions',
        '/race-control',
        '/race-week',
        '/rankings',
        '/socialmedia',
        '/superlicense',
        '/telemetry',
        '/terms-conditions',
        '/war-room',
        '/academy'
    ]);

    // Ignora rotas de API, resultados e sub-rotas NC não-dashboard
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/f1-results') ||
        pathname === '/nc/positions' ||
        pathname === '/nc/invite' ||
        pathname === '/nc/headquarters' ||
        pathname === '/nc/headquartes'
    ) {
        return false;
    }

    if (nonDashboardRoutes.has(pathname)) {
        return false;
    }

    // Dashboard NC explícito
    if (pathname === '/nc/new-concept/dashboard') {
        return true;
    }

    // Dashboard NC dinâmico: /nc/[driver_slug]
    if (pathname.startsWith('/nc/')) {
        const ncParts = pathname.split('/').filter(Boolean);
        return ncParts.length === 2;
    }

    // Dashboard principal dinâmico: /[driver_slug] ou /pitwall
    // Qualquer rota de primeiro nível que não seja uma rota estática reservada
    const parts = pathname.split('/').filter(Boolean);
    return parts.length === 1;
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = isDashboardRoute(pathname);

    return (
        <div className="flex flex-col min-h-screen w-full relative">
            {/* Componente Nasdaq exibido EXCLUSIVAMENTE na página de Dashboard */}
            {isDashboard && <NasdaqTicker />}
            
            {/* Conteúdo Principal com navegação orgânica contextual interna */}
            <main className="flex-grow flex flex-col w-full">
                {children}
            </main>
        </div>
    );
}
