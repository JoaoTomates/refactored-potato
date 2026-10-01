"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

// Helper to pick 2 random teams from an array
function pickTwoRandom(arr: any[]) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
}

export default function GuestDashboardPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeams = async () => {
            const groupId = localStorage.getItem('voltgrid_guest_group');
            if (!groupId) {
                router.replace('/invite');
                return;
            }

            try {
                // Fetch onboarding data using RPC (simulating what <Onboarding> does)
                const { data, error } = await supabase.rpc('get_onboarding_data');
                // The RPC might return only the data for the authenticated user, wait!
                // If it's a guest, get_onboarding_data WILL FAIL or return empty because the guest has no auth.users row!
                // Workaround: we can just fetch from `teams` table directly.
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*');
                
                if (teamsData) {
                    let groupTeamCodes: string[] = [];
                    if (groupId === '1') groupTeamCodes = ['MCL', 'MER', 'WIL', 'AST', 'ALP'];
                    else if (groupId === '2') groupTeamCodes = ['FER', 'HAA', 'AUD', 'CAD'];
                    else if (groupId === '3') groupTeamCodes = ['RBR', 'RBA'];

                    const groupTeams = teamsData.filter(t => groupTeamCodes.includes(t.code));
                    setTeams(pickTwoRandom(groupTeams));
                }
            } catch (err) {
                console.error("Error loading teams:", err);
            } finally {
                setLoading(false);
            }
        };
        loadTeams();
    }, [router]);

    const handleAcceptContract = (teamId: string) => {
        // Redireciona para o form de setup carregando o ID do time escolhido
        router.push(`/superlicense?mode=setup&team=${teamId}`);
    };

    return (
        <main className="w-full h-screen bg-[#0a0a0a] overflow-hidden relative font-rajdhani flex items-center justify-center p-4">
            
            {/* Fake Dashboard Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 relative z-10 opacity-30 pointer-events-none filter blur-[2px]">
                {/* Skeleton UI for empty dashboard */}
                <div className="w-full md:w-80 h-[500px] bg-[#111] border border-[#333] rounded-xl"></div>
                <div className="flex-1 flex flex-col gap-6">
                    <div className="w-full h-40 bg-[#111] border border-[#333] rounded-xl"></div>
                    <div className="w-full h-64 bg-[#111] border border-[#333] rounded-xl"></div>
                </div>
            </div>

            {/* Mail Modal Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="w-full max-w-md bg-[#0a0a0a] border-2 border-[#fbaa19] shadow-[0_0_50px_rgba(251,170,25,0.2)] flex flex-col relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="bg-[#fbaa19] text-black p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <span className="font-black uppercase tracking-widest text-sm">INBOX: 1 NEW OFFER</span>
                        </div>
                        <span className="text-xs font-bold opacity-70 uppercase">Priority: HIGH</span>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        <p className="text-white text-sm md:text-base font-bold uppercase tracking-wider leading-relaxed">
                            Following your selection, the following teams have expressed immediate interest in acquiring your strategic services.
                        </p>
                        
                        {loading ? (
                            <div className="w-full py-8 flex justify-center">
                                <div className="w-8 h-8 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {teams.map((team, idx) => (
                                    <button 
                                        key={team.id}
                                        onClick={() => handleAcceptContract(team.id)}
                                        className="w-full border-2 border-[#333] hover:border-[#fbaa19] bg-[#111] p-4 flex flex-col items-center gap-2 group transition-all"
                                        style={{ borderLeftColor: team.color, borderLeftWidth: '4px' }}
                                    >
                                        <span className="text-white font-black text-xl uppercase tracking-widest group-hover:text-[#fbaa19] transition-colors">{team.name}</span>
                                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Accept & Register</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </main>
    );
}
