"use client";
import React, { useState, useEffect } from 'react';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useSubmitPrediction } from '@/hooks/useSubmitPrediction';
import { supabase } from '@/utils/supabase';

const QUESTIONS = [
    { id: 'q1', text: 'Safety car during the race?', options: ['Yes', 'No'] },
    { id: 'q2', text: 'Red flag during the race?', options: ['Yes', 'No'] },
    { id: 'q3', text: 'Will L.SARGEANT DNF?', options: ['Yes', 'No'] },
    { id: 'q4', text: 'Will both Ferraris finish in top 5?', options: ['Yes', 'No'] },
    { id: 'q5', text: 'M.VERSTAPPEN fastest lap?', options: ['Yes', 'No'] },
];

const Misc = ({ hideSubmit, hideHeader }: { hideSubmit?: boolean, hideHeader?: boolean }) => {
    const answers = usePredictionStore(state => state.misc);
    const setAnswers = usePredictionStore(state => state.setMisc);
    const { submit: handleSubmit, isSubmitting, isSuccess } = useSubmitPrediction();
    
    const [activeQuestionId, setActiveQuestionId] = useState<string>('q1');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActive = async () => {
            const { data } = await supabase.from('global_settings').select('value').eq('id', 'active_misc').single();
            if (data && data.value && data.value.question_id) {
                setActiveQuestionId(data.value.question_id);
            }
            setLoading(false);
        };
        fetchActive();
    }, []);

    const activeQuestion = QUESTIONS.find(q => q.id === activeQuestionId) || QUESTIONS[0];

    const currentStake = answers.stake || '10';
    const currentAnswer = answers[activeQuestionId];

    const handleSelect = (option: string) => {
        setAnswers(prev => ({
            ...prev,
            [activeQuestionId]: option,
            stake: prev.stake || '10'
        }));
    };

    const handleStakeSelect = (pct: string) => {
        setAnswers(prev => ({
            ...prev,
            stake: pct
        }));
    };

    const isAnswered = !!currentAnswer;

    if (loading) return <div className="p-12 text-center text-[#fbaa19] animate-pulse">Loading Misc...</div>;

    return (
        <div className="w-full flex flex-col gap-8 mt-8">
            {!hideHeader && (
                <header className="f1-predictions-header border border-black/20 dark:border-[#ffffff3d] p-6 bg-white dark:bg-[#1a1a1a] border-b-2 border-b-[#fbaa19] shadow-md">
                    <p className="text-[#fbaa19] text-xs font-medium uppercase tracking-[0.14em] mb-2">F1 PREDICTION MARKET</p>
                    <h2 className="text-black dark:text-white text-2xl md:text-3xl font-display font-bold uppercase tracking-wider mb-2">MISC (PROPS)</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                        Answer the selected event prop and choose how much of your Milesimus points to stake.
                    </p>
                </header>
            )}

            <div className="flex flex-col gap-4">
                {/* Active Question */}
                <div className="bg-white dark:bg-black border border-black/20 dark:border-[#ffffff3d] p-6 flex flex-col gap-6 hover:border-[#fbaa19] transition-colors shadow-lg">
                    <h3 className="text-black dark:text-white uppercase font-bold tracking-wider text-lg md:text-xl text-center">
                        {activeQuestion.text}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-4">
                        {activeQuestion.options.map(opt => {
                            const isSelected = currentAnswer === opt;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`flex-1 py-4 px-6 border-2 font-black uppercase tracking-widest transition-all md:text-lg ${
                                        isSelected 
                                        ? 'border-[#fbaa19] bg-[#fbaa19] text-black scale-105 shadow-xl' 
                                        : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:border-[#fbaa19] hover:text-[#fbaa19]'
                                    }`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stake Section */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-black/20 dark:border-white/20 p-6 flex flex-col gap-4 mt-2">
                    <h4 className="text-center text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500">
                        Select your Milesimus Stake
                    </h4>
                    <div className="flex items-center justify-center gap-2 md:gap-4">
                        {['10', '30', '50'].map(pct => {
                            const isSelected = currentStake === pct;
                            return (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleStakeSelect(pct)}
                                    className={`flex-1 py-3 px-4 border-2 font-black uppercase tracking-widest transition-all text-sm md:text-base ${
                                        isSelected 
                                        ? 'border-[#fbaa19] text-[#fbaa19] bg-[#fbaa19]/10' 
                                        : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {pct}%
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <footer className="f1-predictions-summary flex flex-col md:flex-row items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] border border-black/20 dark:border-[#ffffff3d] gap-4">
                <p className="f1-summary-copy text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium tracking-wide w-full md:w-auto text-center md:text-left uppercase">
                    {isAnswered ? (
                        <span className="text-[#fbaa19]">Selected: {currentAnswer} (Stake: {currentStake}%)</span>
                    ) : (
                        "AWAITING SELECTION"
                    )}
                </p>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3 md:items-center">
                    <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto order-2 md:order-1">
                        <button 
                            type="button" 
                            onClick={() => setAnswers({})}
                            disabled={isSubmitting || isSuccess || !isAnswered}
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            CLEAR
                        </button>
                    </div>
                    {!hideSubmit && (
                        <button 
                            type="button" 
                            onClick={() => handleSubmit(false)}
                            disabled={!isAnswered || isSubmitting || isSuccess}
                            className="w-full md:w-auto order-1 md:order-2 f1-submit-picks bg-[#fbaa19] text-black border-2 border-[#fbaa19] px-6 py-3 font-bold uppercase tracking-widest text-xs md:text-sm transition-colors hover:bg-gray-200 dark:hover:bg-black hover:text-[#fbaa19] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fbaa19] disabled:hover:text-black flex-1 md:flex-none"
                        >
                            {isSubmitting ? 'SUBMITTING...' : isSuccess ? '✔ SAVED' : 'SUBMIT PREDICTION'}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default Misc;
