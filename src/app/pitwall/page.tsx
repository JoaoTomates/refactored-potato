"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
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

const CHAMPION_NAMES: Record<number, string> = {
    1: "G. FARINA",
    2: "J. M. FANGIO",
    3: "A. ASCARI",
    4: "M. HAWTHORN",
    5: "J. BRABHAM",
    6: "P. HILL",
    7: "G. HILL",
    8: "J. CLARK",
    9: "J. SURTEES",
    10: "D. HULME",
};

export default function PitwallPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            const { data, error } = await supabase
                .from('contracts')
                .select('group_id, team_id, profiles(slug, first_name, last_name, driver_number)');
            
            if (!error && data) {
                setContracts(data);
            }
            setLoading(false);
        };
        fetchContracts();
    }, []);

    // Get unique groups
    const groupIds = Array.from(new Set(contracts.map(c => c.group_id))).sort((a, b) => a - b);
    if (groupIds.length === 0 && !loading) {
        groupIds.push(1); // Default group if none exist
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen bg-[#050505] flex flex-col font-sans">
            <div className="w-full bg-[#0a0a0a] border-b border-white/10 p-4 px-8 flex items-center justify-between z-10 shrink-0 shadow-xl">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white font-display">
                        PIT<span className="text-[#fbaa19]">WALL</span>
                    </h1>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Global Teamwork Matrix</p>
                </div>
            </div>

            <div className="flex-1 w-full overflow-x-auto relative custom-scrollbar">
                <div className="min-w-[1400px] w-full flex flex-col border-b border-[#333]">
                    
                    {groupIds.map((gid, lIdx) => {
                        const groupName = CHAMPION_NAMES[gid] || `GRUPO ${gid}`;
                        
                        return (
                        <div key={gid} className="w-full grid grid-cols-6 border-b-4 border-[#111] last:border-0 relative">
                            <div className="col-span-1 bg-[#1a1a1a] flex flex-col items-center justify-center p-6 border-r border-[#333] relative overflow-hidden shadow-2xl z-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <h2 className="text-[#fbaa19] font-black text-4xl md:text-5xl -rotate-90 tracking-widest whitespace-nowrap drop-shadow-lg" style={{textShadow: '0 5px 15px rgba(0,0,0,0.5)'}}>
                                    {groupName}
                                </h2>
                                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">League {gid}</span>
                            </div>

                            <div className="col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-[#0f0f0f] relative overflow-hidden">
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, transparent 70%)' }}></div>
                                
                                {F1_TEAMS.map((team) => {
                                    const textColor = getContrastColor(team.color);
                                    
                                    // Get users for this specific team and group
                                    const teamUsers = contracts.filter(c => c.team_id === team.id && c.group_id === gid);
                                    
                                    // Pad to 2 seats
                                    const seats = [null, null];
                                    if (teamUsers[0]) seats[0] = teamUsers[0].profiles;
                                    if (teamUsers[1]) seats[1] = teamUsers[1].profiles;

                                    return (
                                        <div 
                                            key={team.id} 
                                            className="flex flex-col rounded-xl overflow-hidden border-[6px] border-[#1a1a1a] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5),0_15px_25px_rgba(0,0,0,0.6)] relative transform transition-transform"
                                            style={{ backgroundColor: team.color, color: textColor }}
                                        >
                                            <div className="absolute inset-0 border-[2px] border-white/20 pointer-events-none rounded-lg"></div>
                                            
                                            <div className="flex justify-between items-center px-4 py-3 bg-black/20 border-b border-black/40">
                                                <span className="font-black uppercase tracking-[0.2em] text-xs drop-shadow-md">{team.name}</span>
                                                <span className="opacity-60 text-xl font-black font-display tracking-widest">{team.logo}</span>
                                            </div>

                                            {seats.map((driver, idx) => {
                                                const isOccupied = !!driver;
                                                
                                                const content = (
                                                    <div className={`grid grid-cols-12 items-stretch min-h-[50px] text-[10px] text-center transition-all group ${isOccupied ? 'hover:bg-white/20 active:bg-black/20 cursor-pointer border-b border-black/30' : 'opacity-40 border-b border-black/30'}`}>
                                                        <div className="col-span-2 flex items-center justify-center font-black bg-black/20 border-r border-black/20 text-lg opacity-80 group-hover:text-white group-hover:opacity-100 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="col-span-6 flex flex-col items-center justify-center px-2 border-r border-black/20 text-left">
                                                            <span className="font-black uppercase tracking-wider w-full truncate">
                                                                {isOccupied ? `${driver.first_name} ${driver.last_name}` : 'VACANT SEAT'}
                                                            </span>
                                                            <span className="font-bold opacity-70 w-full">
                                                                {isOccupied ? (driver.driver_number ? `#${driver.driver_number}` : '---') : 'PENDING'}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-4 flex items-center justify-center bg-black/10">
                                                            <span className="font-black text-[9px] uppercase opacity-80">
                                                                {isOccupied ? 'VIEW DASHBOARD' : 'OPEN'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );

                                                if (isOccupied && driver.slug) {
                                                    return <Link key={idx} href={`/${driver.slug}`}>{content}</Link>;
                                                }
                                                return <div key={idx}>{content}</div>;
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="col-span-2 bg-gradient-to-br from-[#0a0a0a] to-[#050505] relative flex flex-col items-center justify-center overflow-hidden shadow-[inset_30px_0_50px_rgba(0,0,0,0.8)] border-l border-[#333]">
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                                
                                {lIdx === 0 ? (
                                    <div className="text-center relative z-10 p-8 border border-white/5 bg-black/40 backdrop-blur-sm rounded-2xl w-3/4">
                                        <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl relative">
                                            <div className="absolute inset-0 border-4 border-dashed border-[#fbaa19] rounded-full animate-spin-slow opacity-50"></div>
                                            <svg className="w-8 h-8 text-[#fbaa19]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                                        </div>
                                        <h3 className="text-white/80 font-black text-lg md:text-xl uppercase tracking-[0.2em] font-display">TELEMETRIA</h3>
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-2 max-w-xs mx-auto">Sincronizando dados dos estrategistas do {groupName}.</p>
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
                    )})}
                    
                </div>
            </div>
        </main>
    );
}
