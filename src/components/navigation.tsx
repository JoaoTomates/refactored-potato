"use client";

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './logo';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { PilotAvatar } from './pilot-avatar';
import { supabase } from '@/utils/supabase';

interface UserNavProfile {
    name: string;
    teamColor: string;
    driverNumber: string | null;
    slug: string | null;
}

const Navigation = () => {
    const pathname = usePathname();
    const { isVisible, isScrolled } = useSmartScroll({ threshold: 20 });
    const { user } = useSupabaseAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<UserNavProfile | null>(null);

    // Hide navbar on onboarding pages
    if (pathname === '/' || pathname === '/academy' || pathname === '/invite' || pathname === '/invite4') {
        return null;
    }

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Fetch user details for pilot badge in navbar
    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            return;
        }

        let isSubscribed = true;
        const fetchNavUser = async () => {
            try {
                const [profRes, contractRes] = await Promise.all([
                    supabase.from('profiles').select('first_name, last_name, username, slug, driver_number').eq('id', user.id).maybeSingle(),
                    supabase.from('contracts').select('teams(color)').eq('user_id', user.id).maybeSingle()
                ]);

                if (!isSubscribed) return;

                const prof = profRes.data;
                const teamData = contractRes.data?.teams;
                const teamColor = teamData ? (Array.isArray(teamData) ? teamData[0]?.color : (teamData as any)?.color) : '#fbaa19';

                const displayName = prof?.first_name 
                    ? `${prof.first_name.charAt(0)}. ${prof.last_name || ''}`.trim()
                    : (prof?.username || prof?.slug || user.email?.split('@')[0] || 'PILOTO');

                setUserProfile({
                    name: displayName,
                    teamColor: teamColor || '#fbaa19',
                    driverNumber: prof?.driver_number ? String(prof.driver_number) : null,
                    slug: prof?.slug || null
                });
            } catch (err) {
                console.error("Erro ao carregar dados do piloto na navbar:", err);
            }
        };

        fetchNavUser();
        return () => { isSubscribed = false; };
    }, [user]);

    const navLinks = [
        { href: '/f1', label: 'F1 HUB' },
        { href: '/bet', label: 'APOSTAS', highlight: true },
        { href: '/telemetry', label: 'TELEMETRIA' },
        { href: '/pitwall', label: 'PIT WALL' },
        { href: '/playground', label: 'COCKPIT' },
    ];

    return (
        <>
            {/* Top Desktop & Tablet Navigation with Smart Hide on Scroll */}
            <header
                className={`fixed top-0 inset-x-0 z-50 w-full transition-transform duration-300 ease-out ${
                    isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
            >
                <nav
                    className={`w-full bg-[#07090c]/90 backdrop-blur-md border-b transition-colors duration-300 ${
                        isScrolled ? 'border-white/10 shadow-2xl' : 'border-white/5'
                    }`}
                >
                    <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 md:px-8 h-12 md:h-14">
                        
                        {/* LEFT: Logo & Brand */}
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
                                <div className="scale-90 md:scale-100 origin-left">
                                    <Logo isOnDarkBackground={true} />
                                </div>
                            </Link>

                            {/* DESKTOP NAV LINKS */}
                            <div className="hidden lg:flex items-center gap-1 font-mono text-[11px] tracking-widest font-bold">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`px-3 py-1.5 rounded transition-colors relative flex items-center gap-1.5 ${
                                                isActive
                                                    ? 'text-[#fbaa19] bg-white/5'
                                                    : link.highlight
                                                    ? 'text-white hover:text-[#fbaa19] hover:bg-white/5'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {link.highlight && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            )}
                                            <span>{link.label}</span>
                                            {isActive && (
                                                <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#fbaa19] shadow-[0_0_6px_#fbaa19]"></span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: User Pilot Card / Superlicense & Menu Trigger */}
                        <div className="flex items-center gap-3">
                            {user && userProfile ? (
                                <Link
                                    href={userProfile.slug ? `/${userProfile.slug.startsWith('@') ? userProfile.slug : `@${userProfile.slug}`}` : '/playground'}
                                    className="flex items-center gap-2.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                                    title="Ir para o Dashboard do Piloto"
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                                        <PilotAvatar
                                            teamColor={userProfile.teamColor}
                                            driverNumber={userProfile.driverNumber}
                                            variant="team"
                                            size="custom"
                                            showHUD={false}
                                            showBadge={false}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-200 group-hover:text-white uppercase tracking-wider hidden sm:inline">
                                        {userProfile.name}
                                    </span>
                                    {userProfile.driverNumber && (
                                        <span
                                            className="text-[9px] font-black px-1 rounded text-black font-display"
                                            style={{ backgroundColor: userProfile.teamColor || '#fbaa19' }}
                                        >
                                            #{userProfile.driverNumber}
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/bet"
                                        className="hidden sm:inline-flex bg-[#fbaa19] text-black font-black uppercase tracking-wider px-3.5 py-1 text-xs rounded hover:bg-white transition-colors"
                                    >
                                        Apostar
                                    </Link>
                                    <Link
                                        href="/superlicense"
                                        className="bg-transparent text-gray-300 hover:text-white border border-white/20 hover:border-[#fbaa19] px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                                    >
                                        Superlicença
                                    </Link>
                                </div>
                            )}

                            {/* Hamburger Menu Toggle (More Options) */}
                            <button
                                aria-label="Abrir menu de opções"
                                className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-white/5 transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                                    <line x1="4" x2="20" y1="6" />
                                    <line x1="4" x2="20" y1="12" />
                                    <line x1="4" x2="20" y1="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Spacer for fixed navbar to prevent layout shift */}
            <div className="h-12 md:h-14 w-full shrink-0" aria-hidden="true" />

            {/* FULLSCREEN OVERLAY MENU (Secondary Links & Operations) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#07090c]/98 backdrop-blur-2xl z-[9999] p-6 md:p-12 flex flex-col overflow-y-auto animate-fade-in">
                    
                    <div className="flex items-center justify-between mb-10 max-w-5xl mx-auto w-full border-b border-white/10 pb-4">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            <Logo isOnDarkBackground={true} />
                        </Link>
                        <button
                            aria-label="Fechar menu"
                            className="text-gray-400 hover:text-white p-2 transition-colors rounded-full hover:bg-white/10"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" x2="6" y1="6" />
                                <line x1="6" x2="18" y1="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-col flex-grow max-w-5xl mx-auto w-full gap-6">
                        
                        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#fbaa19]">
                            // CENTRO DE OPERAÇÕES & GRID
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { href: '/f1', label: 'F1 Hub', desc: 'Classificação, corridas e calendário oficial' },
                                { href: '/bet', label: 'Apostas & Mercados', desc: 'Poletime, Top 10, Evo, H2H e Props' },
                                { href: '/telemetry', label: 'Grid de Telemetria', desc: 'Previsões oficiais de todos os pilotos' },
                                { href: '/pitwall', label: 'Pit Wall dos Grupos', desc: 'Vagas ocupadas e campeões mundiais' },
                                { href: '/playground', label: 'Terminal do Estrategista', desc: 'Bolsa de valores, cotação e rádio' },
                                { href: '/fantasy', label: 'Regras do Fantasy', desc: 'Pontuação, alianças e construtores' },
                                { href: '/news', label: 'Notícias & Relatórios', desc: 'Updates do paddock e paddock pass' },
                                { href: '/socialmedia', label: 'Transmissões & Redes', desc: 'Mídia e comunicados de imprensa' },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.07] hover:border-[#fbaa19]/50 transition-all flex flex-col group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-black uppercase tracking-wider text-white group-hover:text-[#fbaa19] transition-colors">
                                            {item.label}
                                        </span>
                                        <span className="text-gray-500 group-hover:text-[#fbaa19] transition-colors">&rarr;</span>
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {item.desc}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full text-xs text-gray-500 font-mono">
                        <span>VOLTGRID TELEMETRY SYSTEM © 2026</span>
                        <div className="flex items-center gap-4">
                            <Link href="/terms-conditions" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white">Termos & Condições</Link>
                            <Link href="/superlicense" onClick={() => setIsMobileMenuOpen(false)} className="text-[#fbaa19] hover:underline font-bold">Minha Superlicença</Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
