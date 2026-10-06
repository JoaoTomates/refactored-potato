"use client";

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './logo';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { supabase } from '@/utils/supabase';

const Navigation = () => {
    const pathname = usePathname();
    const { isVisible, isScrolled } = useSmartScroll({ threshold: 20 });
    const { user } = useSupabaseAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [dashboardUrl, setDashboardUrl] = useState<string>('/superlicense');

    // Hide navbar on onboarding and studio pages
    if (pathname === '/' || pathname === '/academy' || pathname === '/invite' || pathname === '/invite4' || pathname === '/lore') {
        return null;
    }

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Fetch user dashboard target directly to avoid bouncing through login/superlicense
    useEffect(() => {
        if (!user) {
            setDashboardUrl('/superlicense');
            return;
        }

        let isMounted = true;
        const fetchDashboardTarget = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('slug')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted) return;
                if (data?.slug) {
                    const cleanSlug = data.slug.startsWith('@') ? data.slug : `@${data.slug}`;
                    setDashboardUrl(`/${cleanSlug}`);
                } else {
                    setDashboardUrl('/playground');
                }
            } catch {
                if (isMounted) setDashboardUrl('/playground');
            }
        };

        fetchDashboardTarget();
        return () => { isMounted = false; };
    }, [user]);

    return (
        <>
            {/* Bottom Navigation Bar with Smart Hide on Scroll */}
            <header
                className={`fixed bottom-0 inset-x-0 z-50 w-full transition-transform duration-300 ease-out ${
                    isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <nav
                    className={`w-full bg-[#07090c]/90 backdrop-blur-md border-t transition-colors duration-300 ${
                        isScrolled ? 'border-white/10 shadow-2xl' : 'border-white/5'
                    }`}
                >
                    <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-4 md:px-8 h-14 md:h-16">
                        
                        {/* LEFT: Logo */}
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
                                <Logo isOnDarkBackground={true} />
                            </Link>
                        </div>

                        {/* RIGHT: Action Buttons & Hamburger Menu */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <Link 
                                href="/bet" 
                                className="hidden sm:flex bg-[#fbaa19] text-black border border-[#fbaa19] px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-yellow-500 transition-colors"
                            >
                                Bet
                            </Link>
                            
                            <Link 
                                href={user ? dashboardUrl : "/superlicense"} 
                                className="bg-transparent text-white border border-white/20 px-3 py-1.5 md:px-5 md:py-2 text-[10px] md:text-sm font-bold uppercase tracking-wider rounded-sm hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors truncate max-w-[150px]"
                            >
                                {user ? (user.user_metadata?.first_name ? user.user_metadata.first_name : user.email?.split('@')[0]) : "Superlicense"}
                            </Link>

                            {/* Hamburger Menu Button */}
                            <button
                                aria-label="Open menu"
                                className="text-white p-2 hover:text-[#fbaa19] transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <svg fill="none" width="28" height="28" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                                    <line x1="4" x2="20" y1="6" />
                                    <line x1="4" x2="20" y1="12" />
                                    <line x1="4" x2="20" y1="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* FULLSCREEN OVERLAY MENU (Original Links & Structure) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#07090c]/98 backdrop-blur-2xl z-[9999] p-6 md:p-12 flex flex-col overflow-y-auto animate-fade-in">
                    
                    <div className="flex items-center justify-between mb-12 max-w-5xl mx-auto w-full border-b border-white/10 pb-4">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            <Logo isOnDarkBackground={true} />
                        </Link>
                        <button
                            aria-label="Close menu"
                            className="text-white p-2 hover:text-[#fbaa19] transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <svg fill="none" width="32" height="32" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" x2="6" y1="6" />
                                <line x1="6" x2="18" y1="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-col flex-grow max-w-5xl mx-auto w-full gap-8 mt-4">
                        
                        {/* F1, NEWS AND SOCIAL MEDIA ON THE SAME ROW */}
                        <div className="flex flex-row flex-wrap items-center gap-4 md:gap-8 border-b border-white/10 pb-6 w-full">
                            <Link 
                                href="/f1"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white text-xl md:text-3xl font-black uppercase tracking-widest hover:text-[#fbaa19] transition-colors"
                            >
                                F1
                            </Link>
                            <span className="text-white/20 text-xl hidden sm:block">/</span>
                            <Link 
                                href="/news"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white text-xl md:text-3xl font-black uppercase tracking-widest hover:text-[#fbaa19] transition-colors"
                            >
                                News
                            </Link>
                            <span className="text-white/20 text-xl hidden sm:block">/</span>
                            <Link 
                                href="/socialmedia"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white text-xl md:text-3xl font-black uppercase tracking-widest hover:text-[#fbaa19] transition-colors"
                            >
                                Social Media
                            </Link>
                        </div>

                        {/* FANTASY LINK */}
                        <Link 
                            href="/fantasy"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-white text-3xl md:text-5xl font-black uppercase tracking-widest hover:text-[#fbaa19] transition-colors border-b border-white/10 pb-6 w-full"
                        >
                            Fantasy
                        </Link>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-12 flex flex-col md:flex-row gap-4 max-w-5xl mx-auto w-full pb-8">
                        <Link 
                            href="/bet" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-[#fbaa19] text-black w-full md:w-auto text-center px-10 py-5 text-xl font-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors"
                        >
                            Bet
                        </Link>
                        <Link 
                            href={user ? dashboardUrl : "/superlicense"} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-transparent text-white border-2 border-white/20 w-full md:w-auto text-center px-10 py-5 text-xl font-black uppercase tracking-wider rounded-sm hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors"
                        >
                            {user ? "Dashboard" : "Superlicense"}
                        </Link>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full text-xs text-gray-500 font-mono">
                        <span>VOLTGRID TELEMETRY SYSTEM © 2026</span>
                        <div className="flex items-center gap-4">
                            <Link href="/terms-conditions" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white">Termos & Condições</Link>
                            <Link 
                                href={user ? dashboardUrl : "/superlicense"} 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                className="text-[#fbaa19] hover:underline font-bold"
                            >
                                {user ? "Meu Dashboard" : "Minha Superlicença"}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
