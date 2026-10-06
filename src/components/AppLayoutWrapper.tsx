"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import NasdaqTicker from './nasdaq-ticker';
import Footer from './footer';
import MobileBottomDock from './mobile-bottom-dock';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHiddenRoute = pathname === '/invite' || pathname === '/invite4' || pathname === '/academy' || pathname === '/headquarters' || pathname === '/superlicense';

    return (
        <div className="flex flex-col min-h-screen w-full relative">
            {!isHiddenRoute && <NasdaqTicker />}
            
            {/* Main content with bottom padding for bottom Navigation */}
            <div className={`flex-grow flex flex-col w-full ${!isHiddenRoute ? 'pb-20' : ''}`}>
                {children}
            </div>

            {/* Navbar positioned at the bottom of the page */}
            {!isHiddenRoute && <Navigation />}

            {/* Footer oculto temporariamente conforme solicitado */}
            {/* {!isHiddenRoute && <Footer />} */}
            
            {/* Mobile Thumb Zone Navigation Dock */}
            {!isHiddenRoute && <MobileBottomDock />}
        </div>
    );
}
