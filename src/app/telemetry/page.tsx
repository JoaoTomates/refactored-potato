"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { fetchNextEvent, F1Event, F1_MATCHUPS, getDriverDetails } from '@/api/f1-data';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  driver_number: string;
  team: string;
  avatar_url: string;
}

interface PredictionData {
  id: string;
  user_id: string;
  round: string;
  poletime: string;
  top10: string[];
  evo: string[];
  h2h: Record<string, string>;
  misc: Record<string, string>;
  created_at: string;
  profile?: ProfileData;
}

const QUESTIONS = [
    { id: 'q1', text: 'Safety car during the race?' },
    { id: 'q2', text: 'Red flag during the race?' },
    { id: 'q3', text: 'Will L.SARGEANT DNF?' },
    { id: 'q4', text: 'Will both Ferraris finish in top 5?' },
    { id: 'q5', text: 'M.VERSTAPPEN fastest lap?' },
];

const getTeamColor = (team: string) => {
    switch(team) {
        case 'McLaren': return '#FF8000';
        case 'Ferrari': return '#E8002D';
        case 'Mercedes': return '#27F4D2';
        case 'Red Bull': return '#3671C6';
        case 'Aston Martin': return '#229971';
        case 'Alpine': return '#0093cc';
        case 'Haas': return '#B6BABD';
        case 'Racing Bulls': return '#6692FF';
        case 'Cadillac': return '#FFB800';
        case 'Williams': return '#64C4FF';
        case 'Audi/Sauber': return '#52e252';
        default: return '#777777';
    }
};

const getDriverInfo = (fullName: string) => {
    if (!fullName || fullName === 'TBD' || fullName === '') return { short: '-', color: '#555' };
    const details = getDriverDetails(fullName);
    const color = details.team ? getTeamColor(details.team) : '#777';
    const parts = fullName.split('.');
    const short = parts.length > 1 ? parts[1].substring(0, 3).toUpperCase() : fullName.substring(0, 3).toUpperCase();
    return { short, color };
};

export default function TelemetryPage() {
    const [predictions, setPredictions] = useState<PredictionData[]>([]);
    const [eventData, setEventData] = useState<F1Event | null>(null);
    const [activeMisc, setActiveMisc] = useState('q1');
    const [loading, setLoading] = useState(true);

    const [realResults, setRealResults] = useState<string[]>(Array(10).fill('TBD'));
    const [realPoletime, setRealPoletime] = useState<string>('TBD');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            
            // 1. Fetch Event & Global Settings
            try {
                const [event, { data: settings }] = await Promise.all([
                    fetchNextEvent(),
                    supabase.from('global_settings').select('value').eq('id', 'active_misc').single()
                ]);
                setEventData(event);
                if (settings?.value?.question_id) setActiveMisc(settings.value.question_id);
            } catch (e) {
                console.error("Error fetching event/settings", e);
            }

            // 2. Fetch Predictions
            const { data: preds, error } = await supabase
                .from('predictions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao buscar telemetria", error);
                setLoading(false);
                return;
            }

            // 3. Fetch Profiles for those predictions
            if (preds && preds.length > 0) {
                const userIds = [...new Set(preds.map(p => p.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, driver_number, team, avatar_url')
                    .in('id', userIds);

                const profilesMap = new Map();
                if (profilesData) {
                    profilesData.forEach(p => profilesMap.set(p.id, p));
                }

                const enrichedPreds = preds.map(p => ({
                    ...p,
                    profile: profilesMap.get(p.user_id) || null
                }));

                setPredictions(enrichedPreds);
            } else {
                setPredictions([]);
            }
            
            setLoading(false);
        };

        loadData();
    }, []);

    const activeQuestionText = QUESTIONS.find(q => q.id === activeMisc)?.text || 'MISC';

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-0 pb-24 overflow-x-hidden font-sans">
            
            {/* HERO SECTION */}
            <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] flex items-end pb-8">
                <div className="absolute inset-0 w-full h-full">
                    <img 
                        src="/f1_hero_banner.jpg" 
                        alt="F1 Telemetry" 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                </div>
                
                <div className="relative z-10 w-full px-4 md:px-8 max-w-[1400px] mx-auto flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="bg-[#fbaa19] text-black font-black uppercase px-3 py-1 text-xs md:text-sm tracking-widest">
                            TELEMETRY
                        </span>
                        {eventData && (
                            <span className="bg-white/10 text-white font-bold uppercase px-3 py-1 text-xs md:text-sm tracking-widest border border-white/20">
                                ROUND {eventData.round}
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-widest font-display text-white mt-2 drop-shadow-lg">
                        {eventData ? eventData.name : 'LOADING EVENT...'}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-4 text-gray-400 font-mono text-xs md:text-sm uppercase">
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">CIRCUIT</span>
                            <span>{eventData ? eventData.circuit : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">RACE TIME</span>
                            <span>{eventData ? `${eventData.date} | ${eventData.time}` : 'TBD'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#fbaa19] font-bold">DEADLINE (Q1)</span>
                            <span>{eventData && eventData.qualiDate ? `${eventData.qualiDate} | ${eventData.qualiTime}` : 'TBD'}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* DATA CENTER TABLE */}
            <section className="w-full px-4 md:px-8 max-w-[1800px] mx-auto mt-8">
                
                <div className="w-full overflow-x-auto bg-[#0a0a0a] rounded-sm border border-[#222] shadow-2xl relative custom-scrollbar">
                    {loading ? (
                        <div className="p-24 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[#fbaa19] animate-spin mb-4"></div>
                            <p className="font-bold tracking-widest uppercase text-sm text-[#fbaa19] font-mono">SYNCING TELEMETRY...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1600px]">
                            {/* THEAD */}
                            <thead className="bg-[#111] border-b-2 border-[#fbaa19] text-[10px] uppercase tracking-widest text-gray-400 font-mono sticky top-0 z-20 shadow-md">
                                <tr>
                                    {/* Sticky Headers */}
                                    <th className="p-4 sticky left-0 bg-[#111] z-30 w-16 border-r border-[#333] text-center">POS</th>
                                    <th className="p-4 sticky left-16 bg-[#111] z-30 min-w-[220px] border-r-4 border-r-[#fbaa19]">DRIVER</th>
                                    
                                    <th className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a]">POLETIME</th>
                                    
                                    {/* Master P1-P10 */}
                                    <th colSpan={10} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#151515]">TOP 10</th>
                                    
                                    {/* Evo */}
                                    <th colSpan={5} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a]">EVOLUTION</th>
                                    
                                    {/* H2H (11) */}
                                    <th colSpan={11} className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#151515]">HEAD-TO-HEAD</th>
                                    
                                    {/* Misc */}
                                    <th className="p-4 border-r-4 border-r-[#fbaa19] text-center bg-[#1a1a1a] max-w-[150px] truncate" title={activeQuestionText}>MISC ({activeQuestionText})</th>
                                    
                                    <th className="p-4 text-center bg-[#111]">TIMESTAMP</th>
                                </tr>
                                <tr className="border-t border-[#333] text-[9px] bg-[#0a0a0a]">
                                    <th className="p-2 sticky left-0 bg-[#0a0a0a] z-30 border-r border-[#333]"></th>
                                    <th className="p-2 sticky left-16 bg-[#0a0a0a] z-30 border-r-4 border-r-[#fbaa19] text-right pr-4 text-[#fbaa19] opacity-70 tracking-widest font-bold">REAL RESULTS &rarr;</th>
                                    
                                    <th className="p-2 border-r-4 border-r-[#fbaa19] text-center text-[#00ff00] font-bold">{realPoletime}</th>
                                    
                                    {/* Render 10 slots for Master actuals */}
                                    {Array.from({length: 10}).map((_, i) => (
                                        <th key={`real-p${i+1}`} className="p-2 border-r border-[#333] text-center text-white font-bold bg-[#1a1a1a]">
                                            {realResults[i]}
                                        </th>
                                    ))}
                                    
                                    <th colSpan={5} className="p-2 border-l-2 border-l-[#fbaa19] border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>
                                    <th colSpan={11} className="p-2 border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>
                                    <th className="p-2 border-r-4 border-r-[#fbaa19] text-center text-gray-500 opacity-50">TBD</th>
                                    
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            
                            {/* TBODY */}
                            <tbody className="text-xs font-medium font-mono">
                                {predictions.length === 0 ? (
                                    <tr>
                                        <td colSpan={31} className="p-8 text-center text-gray-500">NO PREDICTIONS FOUND FOR THIS ROUND.</td>
                                    </tr>
                                ) : (
                                    predictions.map((pred, idx) => {
                                        const prof = pred.profile;
                                        const driverName = prof ? `${prof.first_name.charAt(0)}.${prof.last_name}` : 'UNKNOWN';
                                        const driverNum = prof?.driver_number || '99';
                                        const userTeamColor = prof?.team ? getTeamColor(prof.team) : '#555';
                                        
                                        const miscAns = pred.misc?.[activeMisc] || '-';
                                        const miscStake = pred.misc?.stake || '10';
                                        const displayMisc = miscAns !== '-' ? `${miscAns} [${miscStake}%]` : '-';

                                        return (
                                            <tr key={pred.id} className="border-b border-[#222] hover:bg-white/5 transition-colors group">
                                                {/* Sticky Col 1: POS */}
                                                <td className="p-3 sticky left-0 bg-[#0a0a0a] group-hover:bg-[#111] z-10 border-r border-[#333] text-center text-gray-400 font-black">
                                                    {idx + 1}
                                                </td>
                                                
                                                {/* Sticky Col 2: DRIVER */}
                                                <td className="p-3 sticky left-16 bg-[#0a0a0a] group-hover:bg-[#111] z-10 border-r-4 border-r-[#fbaa19]" style={{ borderLeft: `4px solid ${userTeamColor}` }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#333] bg-black shrink-0">
                                                            {prof?.avatar_url ? (
                                                                <img src={prof.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[8px]">N/A</div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white tracking-widest whitespace-nowrap">
                                                                {driverName} <span className="text-[#fbaa19]">#{driverNum}</span>
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 uppercase tracking-widest">{prof?.team || 'No Team'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* POLETIME */}
                                                <td className="p-3 border-r-4 border-r-[#fbaa19] text-center text-[#00ff00] font-bold bg-[#1a1a1a]/50">
                                                    {pred.poletime || '--:--.---'}
                                                </td>

                                                {/* MASTER (10) */}
                                                {Array.from({length: 10}).map((_, i) => {
                                                    const rawPick = pred.top10?.[i] || '';
                                                    const { short, color } = getDriverInfo(rawPick);
                                                    return (
                                                        <td key={`m-${i}`} className={`p-2 border-r border-[#333] text-center font-bold ${i === 9 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} style={{ color }}>
                                                            {short}
                                                        </td>
                                                    );
                                                })}

                                                {/* EVO (5) */}
                                                {Array.from({length: 5}).map((_, i) => {
                                                    const rawPick = pred.evo?.[i] || '';
                                                    const { short, color } = getDriverInfo(rawPick);
                                                    return (
                                                        <td key={`e-${i}`} className={`p-2 border-r border-[#333] text-center font-bold bg-[#1a1a1a]/30 ${i === 4 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} style={{ color }}>
                                                            {short}
                                                        </td>
                                                    );
                                                })}

                                                {/* H2H (11) */}
                                                {Array.from({length: 11}).map((_, i) => {
                                                    const matchInfo = F1_MATCHUPS[i];
                                                    const matchTitle = matchInfo ? `${matchInfo.d1.name} vs ${matchInfo.d2.name}` : `Matchup ${i+1}`;
                                                    const matchId = `m${i+1}`;
                                                    const rawPick = pred.h2h?.[matchId] || '';
                                                    const { short, color } = rawPick ? getDriverInfo(rawPick) : { short: '--', color: '#555' };
                                                    return (
                                                        <td key={`h-${i}`} title={matchTitle} className={`p-2 border-r border-[#333] text-center font-bold cursor-help ${i === 10 ? '!border-r-4 !border-r-[#fbaa19]' : ''}`} style={{ color }}>
                                                            {short}
                                                        </td>
                                                    );
                                                })}

                                                {/* MISC */}
                                                <td className="p-3 border-r-4 border-r-[#fbaa19] text-center text-[#fbaa19] font-bold bg-[#1a1a1a]/50">
                                                    {displayMisc}
                                                </td>

                                                {/* TIMESTAMP */}
                                                <td className="p-3 text-right text-gray-500 text-[10px] whitespace-nowrap group-hover:text-white transition-colors">
                                                    {new Date(pred.created_at).toLocaleString('en-GB', { 
                                                        day: '2-digit', month: '2-digit', year: '2-digit', 
                                                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-4 mb-16">
                    <a href="/f1" className="bg-transparent text-gray-500 border border-gray-700 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">
                        F1 Hub
                    </a>
                    <a href="/bet" className="bg-[#fbaa19] text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors">
                        Edit Predictions
                    </a>
                </div>
            </section>
        </main>
    );
}
