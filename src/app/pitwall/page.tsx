"use client";
import React from 'react';
import Link from 'next/link';
import { F1_TEAMS } from '@/lib/teams';

// Helper to determine text color based on background hex
const getContrastColor = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

export default function PitwallPage() {
    
    // Mock user data
    const generateMockDriver = (teamName: string, index: number, driverNum: number) => {
        const statuses = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];
        const getDot = () => statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            id: index,
            name: `DRIVER ${driverNum}`,
            number: Math.floor(Math.random() * 99) + 1,
            masterPos: `P${Math.floor(Math.random() * 20) + 1}`,
            performance: [getDot(), getDot(), getDot(), getDot(), getDot()],
            milesimusPts: Math.floor(Math.random() * 2000) + 500,
            milesimusPos: `P${Math.floor(Math.random() * 50) + 1}`,
        };
    };

    // Grouping Teams into Leagues (Teamworks)
    const LEAGUES = [
        {
            name: "G. FARINA",
            teams: F1_TEAMS.slice(0, 4)
        },
        {
            name: "G. FANGIO",
            teams: F1_TEAMS.slice(4, 7)
        },
        {
            name: "G. SENNA",
            teams: F1_TEAMS.slice(7, 10)
        }
    ];

    return (
        <main className="w-full min-h-screen bg-[#050505] flex flex-col font-sans">
            
            {/* Header Title outside grid */}
            <div className="w-full bg-[#0a0a0a] border-b border-white/10 p-4 px-8 flex items-center justify-between z-10 shrink-0 shadow-xl">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white font-display">
                        PIT<span className="text-[#fbaa19]">WALL</span>
                    </h1>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Teamwork Control Panel</p>
                </div>
            </div>

            {/* Matrix Container */}
            <div className="flex-1 w-full overflow-x-auto relative custom-scrollbar">
                
                {/* Global Wrapper for Minimum Desktop Width */}
                <div className="min-w-[1400px] w-full flex flex-col border-b border-[#333]">
                    
                    {LEAGUES.map((league, lIdx) => (
                        <div key={lIdx} className="w-full grid grid-cols-6 border-b-4 border-[#111] last:border-0 relative">
                            
                            {/* Col 1: Pitlane Track / Ground Name */}
                            <div className="col-span-1 bg-[#0a0a0a] border-r-2 border-[#1a1a1a] relative flex items-center justify-center overflow-hidden py-16">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                <div className="absolute right-4 top-0 bottom-0 w-1 border-r-4 border-dashed border-[#fbaa19] opacity-30"></div>
                                
                                <span className="transform -rotate-90 text-white/10 font-black text-6xl tracking-[0.2em] uppercase pointer-events-none whitespace-nowrap">
                                    {league.name}
                                </span>
                            </div>

                            {/* Col 2 & 3: Team Control Panels */}
                            <div className="col-span-2 bg-[#050505] p-6 md:p-10 flex flex-col gap-8 border-r-2 border-[#1a1a1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                                {league.teams.map((team, tIdx) => {
                                    const textColor = getContrastColor(team.color);
                                    const driver1 = generateMockDriver(team.name, (tIdx * 2) + 1, 1);
                                    const driver2 = generateMockDriver(team.name, (tIdx * 2) + 2, 2);

                                    return (
                                        <div 
                                            key={team.id} 
                                            className="flex flex-col rounded-xl overflow-hidden border-[6px] border-[#1a1a1a] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5),0_15px_25px_rgba(0,0,0,0.6)] relative transform transition-transform"
                                            style={{ backgroundColor: team.color, color: textColor }}
                                        >
                                            {/* Inner Bevel effect */}
                                            <div className="absolute inset-0 border-[2px] border-white/20 pointer-events-none rounded-lg"></div>
                                            
                                            {/* Team Branding Header */}
                                            <div className="flex justify-between items-center px-4 py-3 bg-black/20 border-b border-black/40">
                                                <span className="font-black uppercase tracking-[0.2em] text-xs drop-shadow-md">{team.name}</span>
                                                <span className="opacity-60 text-xl font-black font-display tracking-widest">{team.logo}</span>
                                            </div>

                                            {/* Driver 1 Button */}
                                            <div className="grid grid-cols-12 items-stretch min-h-[50px] text-[10px] text-center border-b border-black/30 hover:bg-white/20 active:bg-black/20 active:scale-[0.99] transition-all cursor-pointer group">
                                                <div className="col-span-2 flex items-center justify-center font-black bg-black/20 border-r border-black/20 text-lg opacity-80 group-hover:text-white group-hover:opacity-100 transition-colors">1</div>
                                                <div className="col-span-4 flex flex-col items-center justify-center px-2 border-r border-black/20 text-left">
                                                    <span className="font-black uppercase tracking-wider w-full truncate">{driver1.name}</span>
                                                    <span className="font-bold opacity-70 w-full">#{driver1.number}</span>
                                                </div>
                                                <div className="col-span-2 flex flex-col items-center justify-center border-r border-black/20">
                                                    <span className="font-black text-sm">{driver1.masterPos}</span>
                                                </div>
                                                <div className="col-span-4 flex items-center justify-center gap-1 bg-black/10">
                                                    <span className="font-black text-sm">{driver1.milesimusPts}</span>
                                                    <span className="text-[9px] font-bold uppercase opacity-80">MLS</span>
                                                </div>
                                            </div>
                                            
                                            {/* Driver 2 Button */}
                                            <div className="grid grid-cols-12 items-stretch min-h-[50px] text-[10px] text-center hover:bg-white/20 active:bg-black/20 active:scale-[0.99] transition-all cursor-pointer group">
                                                <div className="col-span-2 flex items-center justify-center font-black bg-black/20 border-r border-black/20 text-lg opacity-80 group-hover:text-white group-hover:opacity-100 transition-colors">2</div>
                                                <div className="col-span-4 flex flex-col items-center justify-center px-2 border-r border-black/20 text-left">
                                                    <span className="font-black uppercase tracking-wider w-full truncate">{driver2.name}</span>
                                                    <span className="font-bold opacity-70 w-full">#{driver2.number}</span>
                                                </div>
                                                <div className="col-span-2 flex flex-col items-center justify-center border-r border-black/20">
                                                    <span className="font-black text-sm">{driver2.masterPos}</span>
                                                </div>
                                                <div className="col-span-4 flex items-center justify-center gap-1 bg-black/10">
                                                    <span className="font-black text-sm">{driver2.milesimusPts}</span>
                                                    <span className="text-[9px] font-bold uppercase opacity-80">MLS</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Col 4, 5, 6: Empty Spaces (Telemetry/Feeds Placeholder) */}
                            <div className="col-span-3 bg-gradient-to-br from-[#0a0a0a] to-[#050505] relative flex items-center justify-center overflow-hidden shadow-[inset_30px_0_50px_rgba(0,0,0,0.8)]">
                                {/* Grade de fundo abstrata */}
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                                
                                {lIdx === 0 ? (
                                    <div className="text-center relative z-10 p-8 border border-white/5 bg-black/40 backdrop-blur-sm rounded-2xl">
                                        <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl relative">
                                            <div className="absolute inset-0 border-4 border-dashed border-[#333] rounded-full animate-spin-slow"></div>
                                            <svg className="w-8 h-8 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                                        </div>
                                        <h3 className="text-white/20 font-black text-xl md:text-2xl uppercase tracking-[0.5em] font-display">Telemetry Feed</h3>
                                        <p className="text-white/10 font-bold uppercase tracking-widest text-xs mt-2 max-w-xs mx-auto">Future integration module for group data & stats.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 opacity-10">
                                        <div className="h-2 w-32 bg-white rounded-full"></div>
                                        <div className="h-2 w-48 bg-white rounded-full"></div>
                                        <div className="h-2 w-24 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            
                        </div>
                    ))}
                    
                </div>
            </div>
        </main>
    );
}
