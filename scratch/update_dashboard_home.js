const fs = require('fs');

const path = 'src/components/dashboard-home.tsx';
let content = fs.readFileSync(path, 'utf8');

const updatedContent = `"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { F1_TEAMS, type TeamData } from '@/lib/teams';

interface DashboardHomeProps {
    profile: any;
    setActiveView: (view: string) => void;
    logout: () => void;
}

export default function DashboardHome({ profile, setActiveView, logout }: DashboardHomeProps) {
    const driverName = profile?.first_name ? \`\${profile.first_name.charAt(0)}. \${profile.last_name}\` : 'NEW DRIVER';
    const driverNumber = profile?.driver_number || '99';
    const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1541348263662-e06836264be8?q=80&w=200&auto=format&fit=crop';
    const currentTeam = profile?.team_id ? F1_TEAMS.find(t => t.id === profile.team_id) : null;
    
    // Customização elegante de cores da equipe
    const teamColor = currentTeam?.color || '#fbaa19';
    const teamAccent = currentTeam?.color ? \`\${currentTeam.color}33\` : 'rgba(251,170,25,0.2)';
    const teamGlow = currentTeam?.color ? \`0 0 35px \${currentTeam.color}40\` : '0 0 35px rgba(251,170,25,0.25)';

    return (
        <div 
            className="w-full flex flex-col xl:flex-row gap-6 md:gap-8 animate-fade-in mt-4 md:mt-8 relative transition-all duration-500"
            style={{
                // Custom CSS variables injetadas para estilização temática
                ['--team-color' as any]: teamColor,
                ['--team-accent' as any]: teamAccent,
            }}
        >
            {/* Ambient team halo glow */}
            <div 
                className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 pointer-events-none opacity-20 blur-3xl z-0 transition-all duration-700"
                style={{ background: \`radial-gradient(circle, \${teamColor} 0%, transparent 70%)\` }}
            />
            
            {/* LEFT COLUMN: AVATAR, CREDENTIALS, HONORS, HISTORY */}
            <div className="w-full xl:w-[22rem] shrink-0 flex flex-col gap-6 relative z-10">
                
                {/* TRADING CARD (Profile Box) */}
                <div 
                    className="w-full relative rounded-2xl border bg-[#0a0a0a] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col aspect-[2.4/4] max-h-[600px] shrink-0 group transition-all duration-500"
                    style={{ 
                        borderColor: \`\${teamColor}55\`,
                        boxShadow: \`\${teamGlow}, 0 20px 40px rgba(0,0,0,0.8)\`
                    }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                    
                    {/* TOP: Card Header / Artwork */}
                    <div className="relative h-[55%] w-full flex items-end justify-center bg-gradient-to-t from-[#050505] via-[#111] to-[#222] overflow-hidden border-b-2 z-10 transition-colors duration-500"
                        style={{ borderBottomColor: \`\${teamColor}60\` }}
                    >
                        {/* Background IA Image */}
                        <img 
                            src={avatarUrl} 
                            alt="Driver Avatar Background" 
                            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen scale-110 group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Helmet overlay com tintura elegante da equipe */}
                        <div className="relative z-10 w-[95%] h-[95%] flex items-end justify-center">
                            <img 
                                src="/avatar-overlay.png" 
                                alt="Helmet overlay" 
                                className="relative z-10 w-full h-full object-contain drop-shadow-2xl scale-[1.15] origin-bottom group-hover:scale-[1.2] transition-transform duration-500"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {/* Color mask glow behind helmet */}
                            <div 
                                className="absolute inset-[15%] rounded-full opacity-35 blur-xl pointer-events-none transition-all duration-700"
                                style={{ background: teamColor }}
                            />
                        </div>
                        
                        {/* Teamwork "T" Button */}
                        <button 
                            onClick={() => setActiveView("teamworks")} 
                            className="absolute top-4 right-4 w-10 h-10 bg-black border-2 rounded-full flex items-center justify-center font-black font-display text-xl z-20 hover:scale-110 transition-all duration-300"
                            style={{ 
                                borderColor: teamColor, 
                                color: teamColor, 
                                boxShadow: \`0 0 15px \${teamColor}66\` 
                            }}
                            title="Teamwork (Pit Crew)"
                        >
                            T
                        </button>

                        {/* Driver Number Badge */}
                        <div 
                            className="absolute top-4 left-4 min-w-10 h-10 px-2 bg-white text-black border rounded-sm flex items-center justify-center font-black font-display text-xl z-20 shadow-lg"
                            style={{ borderColor: \`\${teamColor}99\` }}
                        >
                            {driverNumber}
                        </div>
                    </div>
                    
                    {/* BOTTOM: Info & Stats Slider */}
                    <div className="relative h-[45%] w-full flex flex-col bg-[#050505] z-10 p-0">
                        
                        {/* Static Header: Name & Basic Info */}
                        <div className="p-4 text-center border-b border-white/5 pb-4 z-20 bg-gradient-to-b from-black to-transparent shadow-sm">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest font-display leading-none text-white drop-shadow-lg">
                                {driverName}
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                {currentTeam ? (
                                    <div 
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm shadow-sm border"
                                        style={{ backgroundColor: '#0d0d0d', borderColor: \`\${teamColor}55\` }}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                                        <img src={\`https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/\${currentTeam.logo}.png\`} alt={currentTeam.logo} className="h-[10px] w-auto object-contain" />
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: teamColor }}>
                                            {currentTeam.name}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-white px-2 py-0.5 rounded-sm truncate max-w-[120px]">
                                        FREE AGENT
                                    </span>
                                )}
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-white/20 px-2 py-0.5 rounded-sm border border-white/10">
                                    {profile?.nationality || 'UNK'}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Stats Slider */}
                        <div className="flex-1 w-full relative overflow-x-auto snap-x snap-mandatory flex scrollbar-width-none [&::-webkit-scrollbar]:hidden">
                            
                            {/* Slide 1: MLS (Milésimos) */}
                            <div className="w-full shrink-0 snap-center flex flex-col items-center justify-center px-4">
                                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-1">VoltGrid Currency</span>
                                <div className="flex items-baseline gap-1" style={{ filter: \`drop-shadow(0 0 10px \${teamColor}50)\` }}>
                                    <span className="text-4xl md:text-5xl font-black font-display tracking-tighter" style={{ color: teamColor }}>000.000</span>
                                    <span className="text-sm font-bold" style={{ color: teamColor }}>mls</span>
                                </div>
                                <div className="mt-3 flex gap-2 text-[8px] md:text-[9px] uppercase font-bold text-gray-400 tracking-widest w-full justify-center">
                                    <span className="bg-white/5 px-2 py-1.5 rounded text-center border border-white/10">Perf: 000.000</span>
                                    <span className="px-2 py-1.5 rounded text-center border" style={{ backgroundColor: \`\${teamColor}15\`, color: teamColor, borderColor: \`\${teamColor}40\` }}>Bonus: 000.000</span>
                                </div>
                            </div>

                            {/* Slide 2: Honors */}
                            <div className="w-full shrink-0 snap-center flex flex-col items-center justify-center px-6">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Driver Honors</span>
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white bg-white/5 p-2 rounded border border-white/5">
                                        <span style={{ color: teamColor }}>🏆</span> NO HONORS YET
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white bg-white/5 p-2 rounded border border-white/5">
                                        <span className="text-gray-400">🥈</span> --
                                    </div>
                                </div>
                            </div>

                            {/* Slide 3: Detailed Stats */}
                            <div className="w-full shrink-0 snap-center flex flex-col items-center justify-center px-6">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-3 block">Performance</span>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <div className="bg-white/5 border border-white/10 p-3 rounded flex flex-col items-center text-center">
                                        <span className="text-xl font-black text-white font-display">42</span>
                                        <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Races</span>
                                    </div>
                                    <div className="border p-3 rounded flex flex-col items-center text-center" style={{ backgroundColor: \`\${teamColor}15\`, borderColor: \`\${teamColor}40\` }}>
                                        <span className="text-xl font-black font-display" style={{ color: teamColor }}>8</span>
                                        <span className="text-[8px] uppercase font-bold tracking-widest" style={{ color: teamColor }}>Podiums</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>

                        {/* Visual Dots for slider */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamColor }}></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                        </div>
                    </div>
                </div>

                {/* HISTORY BOX - com tema da equipe */}
                <div 
                    className="bg-white dark:bg-[#0a0a0a] border p-6 shadow-lg relative rounded-lg transition-all duration-500"
                    style={{ borderColor: \`\${teamColor}40\` }}
                >
                    <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-lg transition-colors duration-500" style={{ backgroundColor: teamColor }}></div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <span>Activity History</span>
                        </h3>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color: teamColor, borderColor: \`\${teamColor}40\`, backgroundColor: \`\${teamColor}10\` }}>
                            TELEMETRIA
                        </span>
                    </div>
                    <div className="flex flex-col gap-0 border-l-2 ml-2 transition-colors duration-500" style={{ borderColor: \`\${teamColor}25\` }}>
                        
                        <div className="relative pl-4 pb-4">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full transition-colors duration-500 shadow-sm" style={{ backgroundColor: teamColor, boxShadow: \`0 0 8px \${teamColor}\` }}></div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">2h ago</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Make Prediction for Austrália GP</p>
                        </div>
                        
                        <div className="relative pl-4 pb-4">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-black dark:bg-white"></div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yesterday</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Confirm Silly Season</p>
                        </div>

                        <div className="relative pl-4 pb-2">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-black dark:bg-white"></div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">3 days ago</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Updated Driver Setup</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: INBOX & STATS */}
            <div className="w-full flex-1 flex flex-col gap-6 relative z-10">
                
                {/* Mailbox / Proposals */}
                <div className="bg-[#111] border p-1 rounded-lg transition-colors duration-500" style={{ borderColor: \`\${teamColor}50\` }}>
                    <div className="bg-black p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between rounded">
                        <div className="flex gap-4 items-center">
                            <div 
                                className="w-12 h-12 flex items-center justify-center shrink-0 rounded font-black shadow-lg"
                                style={{ backgroundColor: teamColor, color: '#000' }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black uppercase tracking-widest font-display" style={{ color: teamColor }}>Contract Proposals</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">You have new offers pending</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-2 text-white rounded">
                                <span className="text-gray-500">No champions yet</span>
                            </div>
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-2 text-white rounded">
                                <span className="text-gray-500">No champions yet</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classic Boxes estilizados com cores da equipe */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div 
                        className="bg-white dark:bg-[#0a0a0a] border p-5 shadow-md flex flex-col justify-between group rounded-lg transition-all cursor-pointer"
                        style={{ borderColor: \`\${teamColor}30\` }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = teamColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = \`\${teamColor}30\`)}
                    >
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors" style={{ color: teamColor }}>Poletime</span>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black uppercase tracking-tighter">-- <span className="text-sm tracking-widest text-gray-400">PTS</span></span>
                            <span className="text-xs font-bold uppercase text-green-500 mt-1">UNRANKED</span>
                        </div>
                    </div>
                    <div 
                        className="bg-white dark:bg-[#0a0a0a] border p-5 shadow-md flex flex-col justify-between group rounded-lg transition-all cursor-pointer"
                        style={{ borderColor: \`\${teamColor}30\` }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = teamColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = \`\${teamColor}30\`)}
                    >
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors" style={{ color: teamColor }}>Master</span>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black uppercase tracking-tighter">-- <span className="text-sm tracking-widest text-gray-400">PTS</span></span>
                            <span className="text-xs font-bold uppercase text-blue-500 mt-1">UNRANKED</span>
                        </div>
                    </div>
                    <div 
                        className="bg-white dark:bg-[#0a0a0a] border p-5 shadow-md flex flex-col justify-between group rounded-lg transition-all cursor-pointer"
                        style={{ borderColor: \`\${teamColor}30\` }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = teamColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = \`\${teamColor}30\`)}
                    >
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors" style={{ color: teamColor }}>Milesimus</span>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black uppercase tracking-tighter">-- <span className="text-sm tracking-widest text-gray-400">PTS</span></span>
                            <span className="text-xs font-bold uppercase mt-1" style={{ color: teamColor }}>UNRANKED</span>
                        </div>
                    </div>
                </div>

                {/* Performance Chart Placeholder com curva iluminada na cor da equipe */}
                <div 
                    className="w-full bg-white dark:bg-[#0a0a0a] border p-6 shadow-md h-48 md:h-64 relative flex flex-col rounded-lg transition-colors duration-500"
                    style={{ borderColor: \`\${teamColor}35\` }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Performance History</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: teamColor, backgroundColor: \`\${teamColor}15\` }}>
                            TELEMETRIA LIVE
                        </span>
                    </div>
                    <div className="flex-1 w-full border-l border-b border-black/20 dark:border-white/20 relative">
                        {/* Mock SVG Chart */}
                        <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <polyline 
                                points="0,90 20,70 40,80 60,30 80,40 100,10" 
                                fill="none" 
                                stroke={teamColor} 
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                            />
                            <circle cx="20" cy="70" r="2" fill="white" stroke={teamColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <circle cx="40" cy="80" r="2" fill="white" stroke={teamColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <circle cx="60" cy="30" r="2" fill="white" stroke={teamColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <circle cx="80" cy="40" r="2" fill="white" stroke={teamColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <circle cx="100" cy="10" r="2" fill="white" stroke={teamColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        </svg>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                    <button onClick={() => setActiveView("setup")} className="bg-black dark:bg-[#1a1a1a] text-white border border-black dark:border-[#1a1a1a] p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black transition-colors text-center rounded">Setup</button>
                    <button onClick={() => setActiveView("report")} className="bg-transparent text-black dark:text-white border border-black/20 dark:border-white/20 p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors text-center rounded">Report</button>
                    <button onClick={() => setActiveView("silly_season")} className="bg-transparent text-black dark:text-white border border-black/20 dark:border-white/20 p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors text-center rounded">Silly Season</button>
                    <button onClick={() => setActiveView("calendar")} className="bg-transparent text-black dark:text-white border border-black/20 dark:border-white/20 p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:border-[#fbaa19] hover:text-[#fbaa19] transition-colors text-center rounded">F1 Calendar</button>
                    <button 
                        onClick={() => setActiveView("settings")} 
                        className="text-black p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] transition-colors text-center rounded shadow-md"
                        style={{ backgroundColor: teamColor }}
                    >
                        Settings
                    </button>
                    <Link href="/playground" className="border p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] transition-colors text-center rounded" style={{ borderColor: teamColor, color: teamColor }}>
                        Playground »
                    </Link>
                    <Link href="/telemetry" className="bg-black dark:bg-[#1a1a1a] text-white border border-black dark:border-[#1a1a1a] p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-[#fbaa19] hover:text-black transition-colors text-center rounded">Telemetry</Link>
                    <Link href="/pitwall" className="bg-black dark:bg-[#1a1a1a] text-white border border-black dark:border-[#1a1a1a] p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-[#fbaa19] hover:text-black transition-colors text-center rounded">Pitwall</Link>
                    <button onClick={() => logout()} className="bg-transparent text-gray-500 border border-transparent p-3 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:text-red-500 hover:border-red-500/30 transition-colors col-span-2 sm:col-span-1 text-center">Logout</button>
                </div>
            </div>

            {/* RIGHT COLUMN: BOOKMARK BANNER com tonalidade da equipe */}
            <div className="w-full xl:w-64 shrink-0 flex flex-col relative z-10">
                <div 
                    className="text-black p-6 h-full min-h-[300px] flex flex-col justify-between shadow-xl relative overflow-hidden rounded-xl transition-all duration-500"
                    style={{ backgroundColor: teamColor }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-black opacity-10 rounded-bl-full transform translate-x-10 -translate-y-10"></div>
                    
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">VoltGrid Paddock</span>
                            <h3 className="text-xl font-black uppercase tracking-widest font-display leading-tight">Daily Briefing</h3>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="bg-black/15 p-4 border-l-4 border-black rounded-r">
                                <p className="text-xs font-bold leading-relaxed">As apostas para a primeira etapa Master já estão abertas. Check your garage.</p>
                            </div>
                            <div className="bg-black/15 p-4 border-l-4 border-black rounded-r">
                                <p className="text-xs font-bold leading-relaxed">Equipe alinhada: <span className="font-extrabold">{currentTeam ? currentTeam.name : 'Piloto Independente'}</span>.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-8">
                        <Link 
                            href="/playground"
                            className="block text-center w-full bg-black text-white p-3 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-colors shadow-2xl rounded"
                        >
                            Ver Terminal Bolsa
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
`;

fs.writeFileSync(path, updatedContent);
console.log('dashboard-home.tsx updated with team color customization!');
