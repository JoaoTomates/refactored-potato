"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { F1_TEAMS } from '@/lib/teams';

export default function PitwallPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Group the teams by their group property
    const groupedTeams = F1_TEAMS.reduce((acc, team) => {
        if (!acc[team.group]) {
            acc[team.group] = [];
        }
        acc[team.group].push(team);
        return acc;
    }, {} as Record<number, typeof F1_TEAMS>);

    const groups = Object.keys(groupedTeams).map(Number).sort((a, b) => a - b);

    const scrollToNextGroup = () => {
        if (containerRef.current) {
            // Scroll down by roughly one box height (e.g., 400px)
            containerRef.current.scrollBy({ top: 400, behavior: 'smooth' });
        }
    };

    return (
        <main className="w-full h-screen bg-[#111] flex flex-col overflow-hidden font-rajdhani">
            {/* Header */}
            <div className="w-full bg-[#0a0a0a] border-b border-white/10 p-4 flex items-center justify-between z-10 shrink-0 shadow-xl">
                <div className="flex items-center gap-4">
                    <Link href="/superlicense" className="text-white hover:text-[#fbaa19] transition-colors p-2">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest text-white">
                            PIT<span className="text-[#fbaa19]">WALL</span>
                        </h1>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Live Aerial Garage Feed</p>
                    </div>
                </div>

                <button 
                    onClick={scrollToNextGroup}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 hover:bg-[#fbaa19] hover:text-black hover:border-[#fbaa19] transition-all text-white text-xs font-bold uppercase tracking-widest group"
                >
                    <span>Next Box</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="group-hover:translate-y-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
            </div>

            {/* Aerial View Container */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto w-full relative bg-[#1a1a1a]"
                style={{ 
                    // Asphalt texture
                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                {/* Pit Lane Path Line */}
                <div className="absolute left-8 md:left-24 top-0 bottom-0 w-2 border-l-4 border-dashed border-[#fbaa19] opacity-50 z-0"></div>

                <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col gap-24 relative z-10">
                    
                    {groups.map((groupId) => {
                        const boxTeams = groupedTeams[groupId];
                        
                        return (
                            <div key={groupId} className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                                
                                {/* Pit Box Indicator */}
                                <div className="w-16 h-16 shrink-0 bg-black border-2 border-white/20 text-white font-black text-2xl flex items-center justify-center transform rotate-45 shadow-lg">
                                    <div className="transform -rotate-45 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Box</span>
                                        <span>{groupId}</span>
                                    </div>
                                </div>

                                {/* Garage / Pit Area */}
                                <div className="flex-1 w-full bg-gradient-to-b from-[#0a0a0a] to-[#111] border border-white/5 shadow-2xl p-6 md:p-12 relative flex gap-4 md:gap-12 justify-center">
                                    
                                    {/* Roof texture overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 8px)' }}></div>
                                    
                                    {boxTeams.map((team, idx) => (
                                        <div key={team.id} className="relative flex flex-col items-center gap-4 w-full max-w-[200px]">
                                            
                                            {/* Pit Stop Markings (The box lines on the floor) */}
                                            <div className="absolute -top-12 w-full h-10 border-x-4 border-t-4 border-yellow-500/30"></div>

                                            {/* Aerial Car/Team Rectangle */}
                                            <div 
                                                className="w-full aspect-[1/2] rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-white/10"
                                                style={{ backgroundColor: team.color }}
                                            >
                                                {/* Carbon Fiber subtle texture */}
                                                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                                
                                                {/* Team Logo / Initial */}
                                                <div className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm z-10 shadow-inner">
                                                    <span className="text-white font-black text-lg tracking-wider">{team.logo}</span>
                                                </div>

                                                <div className="absolute bottom-4 left-0 w-full text-center z-10 bg-black/80 py-2 backdrop-blur-sm">
                                                    <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">{team.name}</span>
                                                </div>
                                            </div>

                                            {/* Garage Door Line */}
                                            <div className="w-[120%] h-2 bg-black border-t border-white/10 mt-4 rounded shadow-lg"></div>
                                        </div>
                                    ))}
                                    
                                </div>
                            </div>
                        );
                    })}

                    {/* End of pitlane marker */}
                    <div className="flex justify-center mt-12 pb-24">
                        <div className="bg-black/50 px-8 py-4 border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest">
                            End of Pitlane
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
