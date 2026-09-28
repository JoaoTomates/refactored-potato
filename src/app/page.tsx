"use client";
import React from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Logo from "@/components/logo";

export default function Home() {
    const { user, isLoading } = useSupabaseAuth();

    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[#fbaa19] animate-spin mb-4"></div>
            </div>
        );
    }

    const buttonLink = user ? `/${user.user_metadata?.slug || user.id}` : "/superlicense";
    const buttonText = user ? "BOX / GARAGE" : "SUPER LICENSE";

    const scrollToAbout = () => {
        const el = document.getElementById('about');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <main className="w-full min-h-screen bg-black text-white overflow-x-hidden">
            {/* HERO SECTION */}
            <section className="relative w-full h-screen overflow-hidden">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 z-0 opacity-50 mix-blend-screen scale-105"
                    style={{ 
                        backgroundImage: 'url("/f1_hero_banner.jpg")', 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center' 
                    }}
                />
                {/* Gradients */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 to-transparent" />

                {/* Content Container */}
                <div className="relative z-20 w-full h-full flex flex-col p-6 md:p-12 lg:p-20">
                    
                    {/* Header (Logo + Brand) */}
                    <div className="flex items-center gap-4">
                        <Logo isOnDarkBackground={true} />
                        <span className="font-display text-2xl md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-lg">VOLTGRID</span>
                    </div>

                    {/* Main Hero Text (Middle) */}
                    <div className="flex-1 flex flex-col justify-center max-w-5xl gap-6">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-widest font-display leading-[0.85] drop-shadow-2xl">
                            ENTER THE <br/> <span className="text-[#fbaa19]">PITWALL</span>
                        </h1>
                        <p className="text-gray-300 max-w-2xl text-base md:text-lg lg:text-xl font-bold uppercase tracking-widest leading-relaxed border-l-4 border-[#fbaa19] pl-6 backdrop-blur-sm bg-black/10 py-2">
                            A new era of F1 predictions. Build your legacy, manage your resources, and dominate the global leaderboards. The grid awaits.
                        </p>
                        
                        {/* New Explore Button */}
                        <div className="mt-4">
                            <button 
                                onClick={scrollToAbout}
                                className="group max-w-[220px] w-full bg-transparent text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black border-[3px] border-[#fbaa19] rounded-[3px] px-4 py-3 flex items-center justify-between transition-colors shadow-lg"
                            >
                                <span className="font-bold uppercase tracking-widest text-[10px] sm:text-xs truncate mr-2">Explore Competition</span>
                                <svg className="w-4 h-4 shrink-0 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Right Main Action Button */}
                    <div className="absolute bottom-10 right-6 md:bottom-20 md:right-20 flex justify-end">
                        <Link 
                            href={buttonLink}
                            className="group flex items-center gap-4 bg-[#fbaa19] text-black px-8 py-5 md:px-12 md:py-6 font-black uppercase tracking-[0.2em] text-sm md:text-xl border-4 border-transparent hover:border-white transition-all shadow-[0_0_40px_rgba(251,170,25,0.4)] hover:scale-105 hover:bg-white hover:text-black overflow-hidden relative rounded-sm"
                        >
                            <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                            <span className="relative z-10">{buttonText}</span>
                            <svg className="w-6 h-6 md:w-8 md:h-8 transform group-hover:translate-x-3 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </Link>
                    </div>

                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="w-full min-h-screen bg-[#050505] p-6 md:p-20 relative flex flex-col justify-center">
                {/* Background Element */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-white" preserveAspectRatio="none">
                        <polygon points="100,0 100,100 0,100" />
                    </svg>
                </div>

                <div className="max-w-6xl mx-auto w-full z-10 flex flex-col gap-16 py-20">
                    
                    <div className="flex flex-col gap-4">
                        <span className="text-[#fbaa19] font-bold uppercase tracking-[0.3em] text-sm border-l-4 border-[#fbaa19] pl-4">The Origin</span>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest font-display text-white">More than a <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">Fantasy Game</span></h2>
                        <p className="text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl mt-4 font-medium">
                            VoltGrid was born from the passion of hardcore Formula 1 fans who wanted a prediction market that truly reflected the adrenaline of the paddock. It's not just about picking a winner—it's about managing resources, making split-second decisions before Q1, and signing contracts with constructors.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 hover:border-[#fbaa19] transition-colors shadow-2xl group flex flex-col rounded-sm">
                            <div className="w-12 h-12 bg-[#1a1a1a] flex items-center justify-center rounded-sm mb-6 group-hover:bg-[#fbaa19] transition-colors">
                                <span className="text-white group-hover:text-black font-bold text-xl">01</span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-4">The Constructors</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Join a team on the grid. Your choice of constructor will define your garage identity, your dashboard colors, and which faction you represent on the global leaderboard.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 hover:border-[#fbaa19] transition-colors shadow-2xl group flex flex-col rounded-sm">
                            <div className="w-12 h-12 bg-[#1a1a1a] flex items-center justify-center rounded-sm mb-6 group-hover:bg-[#fbaa19] transition-colors">
                                <span className="text-white group-hover:text-black font-bold text-xl">02</span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-4">The Predictions</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                From guessing the exact Pole Position time down to the millisecond (Poletime), to hitting the Top 10 finish order and managing your Milesimus stakes on weekend props.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 hover:border-[#fbaa19] transition-colors shadow-2xl group flex flex-col rounded-sm">
                            <div className="w-12 h-12 bg-[#1a1a1a] flex items-center justify-center rounded-sm mb-6 group-hover:bg-[#fbaa19] transition-colors">
                                <span className="text-white group-hover:text-black font-bold text-xl">03</span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-4">Global Ranking</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Compete in micro-championships of 22 players. Your points are tallied against your grid, and only the best advance to conquer the absolute Milesimus global leaderboard.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center mt-8 p-12 bg-[#111] border border-[#222] rounded-sm text-center">
                        <h3 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-white mb-6">Ready to secure your seat?</h3>
                        <Link 
                            href="/superlicense"
                            className="bg-[#fbaa19] text-black px-10 py-4 font-black uppercase tracking-[0.2em] text-sm border-2 border-[#fbaa19] hover:bg-black hover:text-[#fbaa19] transition-colors shadow-lg rounded-[3px]"
                        >
                            Get Super License
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}
