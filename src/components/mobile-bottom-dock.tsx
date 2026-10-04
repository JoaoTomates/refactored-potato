"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface NavItem {
    href: string;
    label: string;
    badge?: string;
    icon: (isActive: boolean) => React.ReactNode;
}

export const MobileBottomDock: React.FC = () => {
    const pathname = usePathname();
    const { isVisible } = useSmartScroll({ threshold: 20 });
    const { user } = useSupabaseAuth();

    // Do not show on onboarding / immersion screens
    if (pathname === "/" || pathname === "/invite" || pathname === "/invite4" || pathname === "/academy") {
        return null;
    }

    const navItems: NavItem[] = [
        {
            href: "/f1",
            label: "F1 HUB",
            icon: (isActive) => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
            ),
        },
        {
            href: "/bet",
            label: "APOSTAS",
            badge: "LIVE",
            icon: (isActive) => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            href: "/telemetry",
            label: "TELEMETRIA",
            icon: (isActive) => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            href: "/pitwall",
            label: "PIT WALL",
            icon: (isActive) => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            href: "/playground",
            label: "COCKPIT",
            icon: (isActive) => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

    return (
        <nav
            aria-label="Navegação mobile rápida"
            className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#07090c]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.8)] ${
                isVisible ? "translate-y-0" : "translate-y-full"
            }`}
        >
            <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all relative group ${
                                isActive ? "text-[#fbaa19]" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {/* Active Indicator Top Pill */}
                            {isActive && (
                                <span className="absolute -top-1 w-6 h-0.5 bg-[#fbaa19] rounded-full shadow-[0_0_8px_#fbaa19]"></span>
                            )}

                            {/* Badge */}
                            {item.badge && (
                                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"></span>
                            )}

                            <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                                {item.icon(isActive)}
                            </div>

                            <span
                                className={`text-[8px] font-mono tracking-wider uppercase mt-1 leading-tight font-black ${
                                    isActive ? "text-[#fbaa19]" : "text-gray-400"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomDock;
