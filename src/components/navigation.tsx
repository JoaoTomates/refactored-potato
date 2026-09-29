"use client";
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './logo';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const Navigation = () => {
    const pathname = usePathname();
    if (pathname === '/' || pathname === '/superlicense') return null;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const { user } = useSupabaseAuth();

    // Close menu when route changes or component mounts
    useEffect(() => {
        const t = setTimeout(() => setIsMobileMenuOpen(false), 0);
        return () => clearTimeout(t);
    }, []);

    // Detect Scroll for shrink effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav className={`sticky top-0 z-50 w-full bg-[#0a0a0a] transition-all duration-300 ease-in-out border-b ${isScrolled ? 'border-white/10 shadow-lg' : 'border-transparent'}`}>
                {/* Background texture overlay */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://images.pexels.com/photos/6159693/pexels-photo-6159693.jpeg?auto=compress&cs=tinysrgb&h=650&w=940")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                
                {/* Dynamic Height Container */}
                <div className={`relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto px-4 md:px-8 transition-all duration-300 ease-in-out ${isScrolled ? 'h-12 md:h-12' : 'h-16 md:h-20'}`}>
                    
                    {/* LEFT: Logo */}
                    <div className="flex items-center">
                        <Link href="/" className={`flex items-center transition-all duration-300 ease-in-out ${isScrolled ? 'scale-75 origin-left' : 'scale-100 origin-left'}`}>
                            <div className="flex items-center h-full">
                                <Logo isOnDarkBackground={true} />
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT: Buttons & Hamburger Control */}
                    <div className="flex items-center gap-4">
                        {/* Action Buttons */}
                        <div className={`flex items-center transition-all duration-300 gap-2 md:gap-4 ${isScrolled ? 'scale-90 origin-right' : 'scale-100 origin-right'}`}>
                            <Link 
                                href="/bet" 
                                className="hidden sm:flex bg-[#fbaa19] text-black border border-[#fbaa19] px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-yellow-500 transition-colors"
                            >
                                Bet
                            </Link>
                            
                        <Link 
                            href="/superlicense" 
                            className="bg-transparent text-white border border-white/20 px-3 py-1.5 md:px-5 md:py-2 text-[10px] md:text-sm font-bold uppercase tracking-wider rounded-sm hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors truncate max-w-[150px]"
                            >
                                {user ? (user.user_metadata?.first_name ? user.user_metadata.first_name : user.email) : "Superlicense"}
                            </Link>
                        </div>

                        {/* Hamburger Menu Toggle (ALWAYS VISIBLE for testing "navbar colapsado" on desktop) */}
                        <div className="flex items-center ml-2">
                            <button
                                aria-label="Open menu"
                                className={`text-white transition-all duration-300 ${isScrolled ? 'p-1' : 'p-2'} hover:text-[#fbaa19]`}
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <svg fill="none" width={isScrolled ? "24" : "28"} height={isScrolled ? "24" : "28"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" className="transition-all duration-300">
                                    <line x1="4" x2="20" y1="6" y2="6"></line>
                                    <line x1="4" x2="20" y1="12" y2="12"></line>
                                    <line x1="4" x2="20" y1="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* FULLSCREEN OVERLAY MENU (COLLAPSED STATE) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#0a0a0a] z-[9999] p-6 md:p-12 flex flex-col overflow-y-auto animate-fade-in">
                    
                    <div className="flex items-center justify-between mb-12 max-w-5xl mx-auto w-full">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            <Logo isOnDarkBackground={true} />
                        </Link>
                        <button
                            aria-label="Close menu"
                            className="text-white p-2 hover:text-[#fbaa19] transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <svg fill="none" width="32" height="32" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" x2="6" y1="6" y2="18"></line>
                                <line x1="6" x2="18" y1="6" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    

                    <div className="flex flex-col flex-grow max-w-5xl mx-auto w-full gap-8 mt-10">
                        
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

                        {/* OTHER LINKS */}
                        <Link 
                            href="/fantasy"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-white text-3xl md:text-5xl font-black uppercase tracking-widest hover:text-[#fbaa19] transition-colors border-b border-white/10 pb-6 w-full"
                        >
                            Fantasy
                        </Link>
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row gap-4 max-w-5xl mx-auto w-full pb-8">
                        <Link 
                            href="/bet" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-[#fbaa19] text-black w-full md:w-auto text-center px-10 py-5 text-xl font-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors"
                        >
                            Bet
                        </Link>
                        <Link 
                            href="/superlicense" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-transparent text-white border-2 border-white/20 w-full md:w-auto text-center px-10 py-5 text-xl font-black uppercase tracking-wider rounded-sm hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors"
                        >
                            {user ? "Dashboard" : "Superlicense"}
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
