"use client";
import React, { useState, useEffect } from 'react';
import F1BetRemoteControl from './f1-bet-remote-control';
import HeadToHead from './head-to-head';
import Top10Finish from './top-10-finish';
import Poletime from './poletime';
import Evo from './evo';
import Misc from './misc';
import Link from 'next/link';
import { PilotAvatar } from './pilot-avatar';

import { usePredictionStore } from '@/store/usePredictionStore';
import { useSwipe } from '@/hooks/useSwipe';
import { useRouter } from 'next/navigation';
import { useSubmitPrediction } from '@/hooks/useSubmitPrediction';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const TABS_ORDER = ['all-forms', 'poletime', 'master', 'evo', 'head-to-head', 'misc'];

interface PilotProfile {
    name: string;
    slug: string | null;
    driverNumber: string | null;
    teamName: string | null;
    teamColor: string | null;
    avatarUrl: string | null;
}

const PredictionTabs = () => {
    const [activeId, setActiveId] = useState('all-forms');
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useSupabaseAuth();
    const [pilot, setPilot] = useState<PilotProfile | null>(null);
    const [hasSyncedFromDb, setHasSyncedFromDb] = useState(false);

    // Global validation for ALL forms
    const { top10, evo, h2h, misc, poletime, setPoletime, setTop10, setEvo, setH2H, setMisc } = usePredictionStore();
    const { submit: handleSubmitAll, isSubmitting, isSuccess } = useSubmitPrediction();

    // 1. Fetch pilot profile and official team contract
    useEffect(() => {
        if (!user) {
            setPilot(null);
            return;
        }

        let isSubscribed = true;
        const fetchPilotDetails = async () => {
            try {
                const [profRes, contractRes] = await Promise.all([
                    supabase.from('profiles').select('first_name, last_name, username, slug, driver_number, avatar_url').eq('id', user.id).maybeSingle(),
                    supabase.from('contracts').select('group_id, teams(name, color)').eq('user_id', user.id).maybeSingle()
                ]);

                if (!isSubscribed) return;

                const prof = profRes.data;
                const contract = contractRes.data;
                const teamInfo = contract?.teams ? (Array.isArray(contract.teams) ? contract.teams[0] : contract.teams) : null;

                const displayName = prof?.first_name && prof?.last_name 
                    ? `${prof.first_name.trim().charAt(0).toUpperCase()}.${prof.last_name.trim().toUpperCase().replace(/\s+/g, '')}`
                    : (prof?.username?.toUpperCase() || prof?.slug?.replace('@', '').toUpperCase() || 'PILOTO');

                setPilot({
                    name: displayName,
                    slug: prof?.slug || null,
                    driverNumber: prof?.driver_number ? String(prof.driver_number) : null,
                    teamName: teamInfo?.name || null,
                    teamColor: teamInfo?.color || '#fbaa19',
                    avatarUrl: prof?.avatar_url || null
                });
            } catch (err) {
                console.error("Erro ao obter dados do piloto:", err);
            }
        };

        fetchPilotDetails();
        return () => { isSubscribed = false; };
    }, [user]);

    // 2. Fetch and restore predictions saved in Supabase
    useEffect(() => {
        if (!user) return;

        let isSubscribed = true;
        const loadSavedPredictions = async () => {
            try {
                const { data, error } = await supabase
                    .from('predictions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('round', 'current')
                    .maybeSingle();

                if (!error && data && isSubscribed) {
                    if (data.poletime && typeof data.poletime === 'string') {
                        const digits = data.poletime.replace(/[^0-9]/g, '');
                        if (digits.length === 6) {
                            setPoletime(digits.split('').map((d: string) => parseInt(d, 10)));
                        }
                    }
                    if (Array.isArray(data.top10) && data.top10.length === 10) {
                        setTop10(data.top10);
                    }
                    if (Array.isArray(data.evo) && data.evo.length === 5) {
                        setEvo(data.evo);
                    }
                    if (data.h2h && typeof data.h2h === 'object') {
                        setH2H(data.h2h);
                    }
                    if (data.misc && typeof data.misc === 'object') {
                        setMisc(data.misc);
                    }
                    setHasSyncedFromDb(true);
                }
            } catch (err) {
                console.error("Erro ao restaurar palpites:", err);
            }
        };

        loadSavedPredictions();
        return () => { isSubscribed = false; };
    }, [user, setPoletime, setTop10, setEvo, setH2H, setMisc]);

    const isTop10Valid = top10.every(p => p !== '');
    const isEvoValid = evo.every(p => p !== '');
    const isH2HValid = Object.keys(h2h).length === 11; // F1_MATCHUPS.length
    const isMiscValid = Object.keys(misc).some(k => k !== 'stake'); // QUESTIONS.length
    
    const isAllValid = isTop10Valid && isEvoValid && isH2HValid && isMiscValid;

    const { onTouchStart, onTouchEnd } = useSwipe({
        onSwipeLeft: () => {
            const currentIndex = TABS_ORDER.indexOf(activeId);
            if (currentIndex < TABS_ORDER.length - 1) setActiveId(TABS_ORDER[currentIndex + 1]);
        },
        onSwipeRight: () => {
            const currentIndex = TABS_ORDER.indexOf(activeId);
            if (currentIndex > 0) setActiveId(TABS_ORDER[currentIndex - 1]);
        }
    });

    useEffect(() => {
        const t = setTimeout(() => setIsMounted(true), 0);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab) {
                const t2 = setTimeout(() => setActiveId(tab), 0);
            }
        }
        return () => clearTimeout(t);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-96 flex items-center justify-center text-[#fbaa19] font-bold">LOADING PREDICTIONS...</div>;
    }

    const isAllMode = activeId === 'all-forms';

    const headerData: Record<string, { title: string, desc: string }> = {
        'poletime': { title: 'Poletime', desc: 'Predict the exact pole position lap time.' },
        'master': { title: 'Top 10', desc: 'Select the drivers you predict will finish in the top 10 positions.' },
        'evo': { title: 'Evo', desc: 'Select the 5 drivers you predict will gain the most positions.' },
        'head-to-head': { title: 'Head to Head', desc: 'Choose the driver you expect to finish ahead in each matchup.' },
        'misc': { title: 'Misc', desc: 'Answer the following event props. Choose one outcome per question.' },
        'all-forms': { title: 'FULL BET', desc: 'Review and complete all your predictions before the lights go out.' },
    };

    const currentHeader = headerData[activeId];

    return (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="w-full">
            <F1BetRemoteControl activeId={activeId} setActiveId={setActiveId} />
            
            {/* USER SUPERLICENSE BADGE / GRID STATUS */}
            <div className="mt-6 mb-4 p-4 rounded-xl border border-white/10 bg-[#0a0a0a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                {user ? (
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-black shadow-lg relative"
                        >
                            {pilot?.avatarUrl ? (
                                <img src={pilot.avatarUrl} alt="Avatar" className="w-full h-full object-cover border-2 rounded-full" style={{ borderColor: pilot?.teamColor || '#fbaa19' }} />
                            ) : (
                                <PilotAvatar
                                    teamColor={pilot?.teamColor || '#fbaa19'}
                                    driverNumber={pilot?.driverNumber}
                                    variant="team"
                                    size="custom"
                                    showHUD={true}
                                    showBadge={false}
                                    className="w-full h-full"
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-white text-sm md:text-base uppercase tracking-wider">
                                    {pilot?.name || 'ESTRATEGISTA TITULAR'}
                                </span>
                                {pilot?.driverNumber && (
                                    <span className="bg-[#fbaa19] text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                                        #{pilot.driverNumber}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <span 
                                    className="font-bold uppercase tracking-wider"
                                    style={{ color: pilot?.teamColor || '#fbaa19' }}
                                >
                                    {pilot?.teamName || 'EQUIPE INDEPENDENTE'}
                                </span>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono font-medium">
                                    {hasSyncedFromDb ? '● SINCRONIZADO COM O GRID' : '● PRONTO PARA SALVAR'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm font-bold">
                            !
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-xs md:text-sm uppercase tracking-wider">
                                Modo Convidado
                            </span>
                            <span className="text-xs text-gray-400">
                                Faça login com sua Superlicença para vincular suas apostas à sua equipe oficial.
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    <Link
                        href="/telemetry"
                        className="text-xs uppercase tracking-wider font-bold px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/10 transition-colors flex items-center gap-1.5"
                    >
                        <span>Ver Telemetria Geral</span>
                        <span>&rarr;</span>
                    </Link>
                </div>
            </div>

            <header className="mt-4 mb-8 md:mb-12 border-b-4 border-[#fbaa19] pb-6 md:pb-8 flex flex-col gap-4">
                <p className="text-[#fbaa19] text-sm md:text-base font-bold uppercase tracking-[0.2em] font-display">F1 // PREDICTIONS</p>
                <h1 className="text-black dark:text-white text-5xl md:text-7xl font-black uppercase tracking-widest font-display mb-2">{currentHeader.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl">
                    {currentHeader.desc}
                </p>
            </header>
            
            <section
                aria-label="Head to head predictions"
                className="f1-predictions-stage flex flex-col gap-16 mt-4 max-w-3xl w-full mx-auto"
            >
                {(activeId === 'poletime' || isAllMode) && (
                    <Poletime hideSubmit={isAllMode} hideHeader={!isAllMode} />
                )}

                {(activeId === 'master' || isAllMode) && (
                    <Top10Finish hideSubmit={isAllMode} hideHeader={!isAllMode} />
                )}

                {(activeId === 'evo' || isAllMode) && (
                    <Evo hideSubmit={isAllMode} hideHeader={!isAllMode} />
                )}

                {(activeId === 'head-to-head' || isAllMode) && (
                    <HeadToHead hideSubmit={isAllMode} hideHeader={!isAllMode} rootClassName="head-to-head-root-class-name" />
                )}

                {(activeId === 'misc' || isAllMode) && (
                    <Misc hideSubmit={isAllMode} hideHeader={!isAllMode} />
                )}

                {isAllMode && (
                    <footer className="w-full p-8 bg-[#fbaa19] border-t-4 border-black text-center shadow-2xl flex flex-col items-center justify-center gap-4 sticky bottom-0 z-50">
                        <h3 className="text-black font-black uppercase text-xl md:text-2xl tracking-widest font-display">
                            {isAllValid ? 'ALL SELECTIONS COMPLETE' : 'INCOMPLETE SELECTIONS'}
                        </h3>
                        <button onClick={() => handleSubmitAll(true)} disabled={!isAllValid || isSubmitting || isSuccess} className="bg-black text-[#fbaa19] border-2 border-black font-black uppercase tracking-widest px-12 py-4 text-lg md:text-xl transition-all hover:bg-white hover:text-black hover:border-white disabled:opacity-30 disabled:cursor-not-allowed">{isSubmitting ? 'ENVIANDO...' : isSuccess ? '✔ SALVO' : 'SUBMIT ALL PREDICTIONS'}</button>
                    </footer>
                )}
            </section>
        </div>
    );
};

export default PredictionTabs;
