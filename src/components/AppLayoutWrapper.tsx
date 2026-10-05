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
            {!isHiddenRoute && <Navigation />}
            {!isHiddenRoute && <NasdaqTicker />}
            
            {/* Main content with bottom padding on mobile for MobileBottomDock */}
            <div className={`flex-grow flex flex-col w-full ${!isHiddenRoute ? 'pb-16 md:pb-0' : ''}`}>
                {children}
            </div>

            {!isHiddenRoute && <Footer />}
            
            {/* Mobile Thumb Zone Navigation Dock */}
            {!isHiddenRoute && <MobileBottomDock />}
        </div>
    );
}
