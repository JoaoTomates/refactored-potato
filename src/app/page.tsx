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
    const buttonText = user ? "BOX / GARAGEM" : "SUPER LICENSE";

    return (
        <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
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
                <div className="flex-1 flex flex-col justify-center max-w-5xl">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-widest font-display leading-[0.85] drop-shadow-2xl">
                        ENTER THE <br/> <span className="text-[#fbaa19]">PITWALL</span>
                    </h1>
                    <p className="mt-8 text-gray-300 max-w-2xl text-base md:text-lg lg:text-xl font-bold uppercase tracking-widest leading-relaxed border-l-4 border-[#fbaa19] pl-6 backdrop-blur-sm bg-black/10 py-2">
                        A new era of F1 predictions. Build your legacy, manage your resources, and dominate the global leaderboards. The grid awaits.
                    </p>
                </div>

                {/* Bottom Right Button */}
                <div className="absolute bottom-10 right-6 md:bottom-20 md:right-20 flex justify-end">
                    <Link 
                        href={buttonLink}
                        className="group flex items-center gap-4 bg-[#fbaa19] text-black px-8 py-5 md:px-12 md:py-6 font-black uppercase tracking-[0.2em] text-sm md:text-xl border-4 border-transparent hover:border-white transition-all shadow-[0_0_40px_rgba(251,170,25,0.4)] hover:scale-105 hover:bg-white hover:text-black overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                        <span className="relative z-10">{buttonText}</span>
                        <svg className="w-6 h-6 md:w-8 md:h-8 transform group-hover:translate-x-3 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </Link>
                </div>

            </div>
        </main>
    );
}
