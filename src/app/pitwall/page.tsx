"use client";
import React from 'react';
import Link from 'next/link';
import { F1_TEAMS } from '@/lib/teams';


export default function PitwallPage() {
    
    // Mock user data for the matrix
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

    return (
        <main className="w-full min-h-screen bg-[#050505] flex flex-col font-sans">
            
            
            {/* Header Title outside grid */}
            <div className="w-full bg-[#0a0a0a] border-b border-white/10 p-4 px-8 flex items-center justify-between z-10 shrink-0 shadow-xl">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white font-display">
                        PIT<span className="text-[#fbaa19]">WALL</span>
                    </h1>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Global Matrix</p>
                </div>
            </div>

            {/* Matrix Container */}
            <div className="flex-1 w-full overflow-x-auto relative custom-scrollbar">
                {/* 6 Columns Grid */}
                <div className="min-w-[1200px] w-full grid grid-cols-6 h-full min-h-[800px] border-b border-[#333]">
                    
                    {/* Coluna 1: Vazia / Asfalto */}
                    <div className="col-span-1 bg-[#0a0a0a] border-r border-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <div className="absolute right-4 top-0 bottom-0 w-1 border-r-2 border-dashed border-[#fbaa19] opacity-30"></div>
                        <span className="transform -rotate-90 text-white/10 font-black text-6xl md:text-8xl tracking-widest uppercase pointer-events-none whitespace-nowrap">
                            PITLANE
                        </span>
                    </div>

                    {/* Coluna 2: A Matriz de Equipes (44 rows ou dinâmico) */}
                    <div className="col-span-2 flex flex-col border-r-4 border-black bg-[#111] shadow-2xl relative z-10">
                        
                        {/* Header da Coluna 2 */}
                        <div className="grid grid-cols-5 bg-black text-white/50 text-[9px] uppercase tracking-widest font-black text-center border-b border-[#222]">
                            <div className="p-2 border-r border-[#222]">ID</div>
                            <div className="p-2 border-r border-[#222]">DRIVER</div>
                            <div className="p-2 border-r border-[#222]">MASTER</div>
                            <div className="p-2 border-r border-[#222]">FORM</div>
                            <div className="p-2">MILESIMUS</div>
                        </div>

                        {/* Corpo: Lista de Equipes e Pilotos */}
                        <div className="flex flex-col">
                            {F1_TEAMS.map((team, idx) => {
                                const driver1 = generateMockDriver(team.name, (idx * 2) + 1, 1);
                                const driver2 = generateMockDriver(team.name, (idx * 2) + 2, 2);

                                return (
                                    <React.Fragment key={team.id}>
                                        {/* Linha 1: Nome da Equipe */}
                                        <div 
                                            className="w-full bg-[#1a1a1a] py-1.5 px-4 border-y border-black text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-between"
                                            style={{ borderLeft: `6px solid ${team.color}` }}
                                        >
                                            <span className="drop-shadow-md">{team.name}</span>
                                            <span className="text-white/20">{team.logo}</span>
                                        </div>

                                        {/* Linha 2: Piloto 1 */}
                                        <div className="grid grid-cols-5 bg-[#0a0a0a] hover:bg-[#151515] transition-colors border-b border-[#1a1a1a] text-white min-h-[44px] items-stretch text-[10px] text-center group cursor-default">
                                            {/* Seq */}
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center font-bold text-gray-600 bg-black/20 group-hover:text-[#fbaa19] transition-colors">{driver1.id}</div>
                                            {/* Driver Name & # */}
                                            <div className="border-r border-[#1a1a1a] flex flex-col items-center justify-center px-1">
                                                <span className="font-black uppercase tracking-wider truncate w-full">{driver1.name}</span>
                                                <span className="text-[#fbaa19] font-bold">#{driver1.number}</span>
                                            </div>
                                            {/* Master Position */}
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center font-black text-gray-300 text-xs">{driver1.masterPos}</div>
                                            {/* Form (5 Dots) */}
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center gap-1 px-2">
                                                {driver1.performance.map((dotColor, i) => (
                                                    <span key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor} shadow-sm`}></span>
                                                ))}
                                            </div>
                                            {/* Milesimus */}
                                            <div className="flex flex-col items-center justify-center bg-black/10">
                                                <span className="text-[#fbaa19] font-black text-xs">{driver1.milesimusPts}</span>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{driver1.milesimusPos}</span>
                                            </div>
                                        </div>

                                        {/* Linha 3: Piloto 2 */}
                                        <div className="grid grid-cols-5 bg-[#0a0a0a] hover:bg-[#151515] transition-colors border-b border-[#222] text-white min-h-[44px] items-stretch text-[10px] text-center group cursor-default">
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center font-bold text-gray-600 bg-black/20 group-hover:text-[#fbaa19] transition-colors">{driver2.id}</div>
                                            <div className="border-r border-[#1a1a1a] flex flex-col items-center justify-center px-1">
                                                <span className="font-black uppercase tracking-wider truncate w-full">{driver2.name}</span>
                                                <span className="text-[#fbaa19] font-bold">#{driver2.number}</span>
                                            </div>
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center font-black text-gray-300 text-xs">{driver2.masterPos}</div>
                                            <div className="border-r border-[#1a1a1a] flex items-center justify-center gap-1 px-2">
                                                {driver2.performance.map((dotColor, i) => (
                                                    <span key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor} shadow-sm`}></span>
                                                ))}
                                            </div>
                                            <div className="flex flex-col items-center justify-center bg-black/10">
                                                <span className="text-[#fbaa19] font-black text-xs">{driver2.milesimusPts}</span>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{driver2.milesimusPos}</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Colunas 3, 4, 5, 6: Vazias com Estilização */}
                    <div className="col-span-3 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-8 relative flex items-center justify-center overflow-hidden border-r border-[#1a1a1a]">
                        {/* Grade de fundo abstrata */}
                        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="text-center relative z-10">
                            <div className="w-32 h-32 md:w-48 md:h-48 border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl relative">
                                <div className="absolute inset-0 border-4 border-dashed border-[#333] rounded-full animate-spin-slow"></div>
                                <svg className="w-12 h-12 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                            </div>
                            <h3 className="text-white/20 font-black text-2xl uppercase tracking-[0.5em] font-display">Awaiting Link</h3>
                            <p className="text-white/10 font-bold uppercase tracking-widest text-xs mt-2 max-w-xs mx-auto">Live Telemetry & Garage Feeds will be projected here.</p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
