"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import NasdaqTicker from './nasdaq-ticker';
import Footer from './footer';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHiddenRoute = pathname === '/invite' || pathname === '/invite2' || pathname === '/invite3' || pathname === '/academy';

    return (
        <div className="flex flex-col min-h-screen w-full">
            {!isHiddenRoute && <Navigation />}
            {!isHiddenRoute && <NasdaqTicker />}
            <div className="flex-grow flex flex-col w-full">
                {children}
            </div>
            {!isHiddenRoute && <Footer />}
        </div>
    );
}
