"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { F1_DRIVERS, getDriverDetails, fetchNextEvent, F1Event } from '@/api/f1-data';
import { MISC_QUESTIONS, DEFAULT_ACTIVE_MISC_IDS, resolveActiveMiscIds } from '@/lib/misc-questions';
import { getSystemBoxStyle } from '@/components/system-modal';

const getTeamColor = (team: string) => {
    switch (team) {
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
        default: return '#ffffff';
    }
};

const initialDrivers = F1_DRIVERS.map(driverName => {
    const details = getDriverDetails(driverName);
    return {
        id: details.num,
        name: driverName,
        team: details.team,
        color: getTeamColor(details.team)
    };
});

const sessions = [
    "FP1", "FP2", "FP3", "Q1", "Q2", "Q3", "Qualy Sprint", "Sprint Race", "Race"
];

export interface RaceControlViewProps {
    embedded?: boolean;
}

export default function RaceControlView({ embedded = false }: RaceControlViewProps) {
    const [activeView, setActiveView] = useState<'dashboard' | 'resultados' | 'misc'>('dashboard');
    const [selectedSession, setSelectedSession] = useState(sessions[8]);
    const [results, setResults] = useState(initialDrivers);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [currentEvent, setCurrentEvent] = useState<F1Event | null>(null);

    const [activeMiscQuestions, setActiveMiscQuestions] = useState<string[]>(DEFAULT_ACTIVE_MISC_IDS);
    const [savingMisc, setSavingMisc] = useState(false);

    useEffect(() => {
        supabase.from('global_settings').select('value').eq('id', 'active_misc').single().then(({ data }) => {
            if (data?.value) {
                setActiveMiscQuestions(resolveActiveMiscIds(data.value));
            }
        });
    }, []);

    const toggleMiscQuestion = (qid: string) => {
        setActiveMiscQuestions((prev) => {
            if (prev.includes(qid)) {
                return prev.filter((id) => id !== qid);
            }
            if (prev.length >= 3) {
                return prev;
            }
            return [...prev, qid];
        });
    };

    const handleSaveMisc = async () => {
        if (activeMiscQuestions.length !== 3) return;
        setSavingMisc(true);
        await supabase.from('global_settings').upsert({
            id: 'active_misc',
            value: {
                question_ids: activeMiscQuestions,
                question_id: activeMiscQuestions[0]
            }
        });
        setSuccessMsg("MISC ATUALIZADO (3 PERGUNTAS ATIVAS)!");
        setTimeout(() => setSuccessMsg(""), 3000);
        setSavingMisc(false);
    };

    useEffect(() => {
        fetchNextEvent().then(event => setCurrentEvent(event));
    }, []);

    const handleSaveResults = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSuccessMsg("Base de dados sincronizada com sucesso! (MOCK)");
            console.log("Mock DB - Resultados Oficiais da", selectedSession, ":", results.map((d, i) => `P${i + 1}: ${d.id}`));
            setTimeout(() => setSuccessMsg(""), 5000);
        }, 1200);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newResults = [...results];
        const temp = newResults[index - 1];
        newResults[index - 1] = newResults[index];
        newResults[index] = temp;
        setResults(newResults);
    };

    const moveDown = (index: number) => {
        if (index === results.length - 1) return;
        const newResults = [...results];
        const temp = newResults[index + 1];
        newResults[index + 1] = newResults[index];
        newResults[index] = temp;
        setResults(newResults);
    };

    const content = (
        <div className={embedded ? 'w-full flex flex-col gap-6 font-mono' : 'flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 mt-4 flex flex-col gap-8 font-mono'}>
            {!embedded && (
                <header
                    className="w-full p-4 md:p-8 border border-[#000000] border-b-4 border-b-[#fbaa19] rounded-[3px]"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="max-w-5xl mx-auto flex flex-col gap-3">
                        <p className="text-[#fbaa19] text-sm md:text-base font-bold uppercase tracking-[0.2em] font-display">F1 // BAEFF1</p>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white">Race Control</h1>
                        <p className="text-white/60 text-sm md:text-base">Management panel for official data, scoring, and integrity.</p>
                    </div>
                </header>
            )}

            {embedded && (
                <div className="border-l-4 border-[#fbaa19] pl-4">
                    <p className="text-[#fbaa19] text-[10px] font-bold uppercase tracking-[0.25em]">F1 // BAEFF1</p>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white">Race Control</h1>
                </div>
            )}

            <nav className="flex flex-row gap-4 border-b border-white/10 pb-3 overflow-x-auto scrollbar-hide">
                <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className={`text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeView === 'dashboard' ? 'border-[#fbaa19] text-[#fbaa19]' : 'border-transparent text-white/50 hover:text-white'}`}
                >
                    Overview
                </button>
                <button
                    type="button"
                    onClick={() => setActiveView('resultados')}
                    className={`text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeView === 'resultados' ? 'border-[#fbaa19] text-[#fbaa19]' : 'border-transparent text-white/50 hover:text-white'}`}
                >
                    Inserir Resultados
                </button>
                <button
                    type="button"
                    onClick={() => setActiveView('misc')}
                    className={`text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeView === 'misc' ? 'border-[#fbaa19] text-[#fbaa19]' : 'border-transparent text-white/50 hover:text-white'}`}
                >
                    Event Props (Misc)
                </button>
                <Link
                    href="/crew-edit"
                    className="text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 border-b-2 border-transparent text-white/60 hover:text-[#fbaa19] transition-colors shrink-0 ml-auto"
                >
                    Crew Edit (Personagens) »
                </Link>
            </nav>

            {activeView === 'resultados' && (
                <section className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest border-l-4 border-[#fbaa19] pl-4 text-white">Resultados Oficiais</h2>
                        <p className="text-white/60 text-xs sm:text-sm">Update the results of each session. Directly impacts players&apos; scores in Milesimus.</p>
                    </div>

                    <div
                        className="border border-[#000000] p-4 md:p-8 rounded-[3px]"
                        style={getSystemBoxStyle('#fbaa19')}
                    >
                        <div className="mb-8 flex flex-col gap-2">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 border-b border-white/10 pb-2 gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-[#fbaa19]">Session</label>
                                {currentEvent ? (
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                                        ROUND {currentEvent.round} {"//"} {currentEvent.name}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50 animate-pulse">
                                        LOADING EVENT...
                                    </span>
                                )}
                            </div>

                            <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2">
                                {sessions.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSelectedSession(s)}
                                        className={`shrink-0 px-4 py-2.5 border rounded-[3px] font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer ${
                                            selectedSession === s
                                                ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                : 'bg-[#030303] text-white border-white/15 hover:border-[#fbaa19]'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-bold uppercase tracking-widest text-[#fbaa19] mb-2 border-b border-white/10 pb-2">
                                Final Classification (Adjust order)
                            </label>
                            <div className="flex flex-col gap-2">
                                {results.map((driver, i) => (
                                    <div
                                        key={driver.id}
                                        className="flex items-stretch bg-[#030303] border border-white/10 rounded-[3px] overflow-hidden hover:border-white/25 transition-colors"
                                        style={{ borderLeftWidth: '6px', borderLeftColor: driver.color }}
                                    >
                                        <div className="w-12 md:w-16 flex items-center justify-center bg-black border-r border-white/10">
                                            <span className="font-black text-lg text-white/60">P{i + 1}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center px-4 py-2">
                                            <span className="font-bold uppercase tracking-wider text-white leading-tight">
                                                {driver.name} <span className="text-[#fbaa19]">#{driver.id}</span>
                                            </span>
                                            <span className="text-xs uppercase tracking-widest text-white/50">
                                                {driver.team}
                                            </span>
                                        </div>

                                        <div className="flex flex-col border-l border-white/10 w-12 md:w-16">
                                            <button
                                                type="button"
                                                onClick={() => moveUp(i)}
                                                disabled={i === 0}
                                                className="flex-1 flex items-center justify-center bg-[#030303] hover:bg-[#fbaa19] hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-b border-white/10 cursor-pointer"
                                                title="Mover para cima"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveDown(i)}
                                                disabled={i === results.length - 1}
                                                className="flex-1 flex items-center justify-center bg-[#030303] hover:bg-[#fbaa19] hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                title="Mover para baixo"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-4">
                            {successMsg && (
                                <span className="text-emerald-400 font-bold uppercase tracking-widest animate-pulse text-sm">
                                    {successMsg}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleSaveResults}
                                disabled={isSubmitting}
                                className="bg-[#fbaa19] text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-[3px] hover:bg-white transition-colors border border-[#fbaa19] w-full md:w-auto disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                            >
                                {isSubmitting ? "Syncing..." : "Save Official Results"}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {activeView === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <section
                            className="border border-[#000000] p-6 rounded-[3px]"
                            style={getSystemBoxStyle('#fbaa19')}
                        >
                            <h2 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 text-white">League Operations</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveView('resultados')}
                                    className="flex flex-col items-start gap-2 p-4 bg-[#fbaa19]/10 border border-[#fbaa19] rounded-[3px] hover:bg-[#fbaa19] hover:text-black transition-colors group text-white cursor-pointer"
                                >
                                    <svg className="w-6 h-6 text-[#fbaa19] group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="font-black uppercase tracking-widest text-sm">Validar Resultados</span>
                                    <span className="text-xs text-white/70 group-hover:text-black/80 text-left">Input oficial do GP. fp1, fp2, qualy, race.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveView('misc')}
                                    className="flex flex-col items-start gap-2 p-4 bg-[#030303] border border-white/15 rounded-[3px] hover:border-[#fbaa19] transition-colors group cursor-pointer text-white"
                                >
                                    <svg className="w-6 h-6 text-gray-400 group-hover:text-[#fbaa19] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="font-bold uppercase tracking-widest text-sm">Event Props (MISC)</span>
                                    <span className="text-xs text-white/50 text-left">Selecionar as 3 perguntas ativas da rodada.</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-2 p-4 bg-[#030303] border border-white/15 rounded-[3px] hover:border-[#fbaa19] transition-colors group text-white"
                                >
                                    <svg className="w-6 h-6 text-gray-400 group-hover:text-[#fbaa19] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                    <span className="font-bold uppercase tracking-widest text-sm">Gerenciar Teamwork</span>
                                    <span className="text-xs text-white/50 text-left">Resolução de conflitos de ligas.</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-2 p-4 bg-[#030303] border border-white/10 rounded-[3px] opacity-50 cursor-not-allowed text-white"
                                >
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <span className="font-bold uppercase tracking-widest text-sm">Silly Season Admin</span>
                                    <span className="text-xs text-white/50 text-left">Trancado. Abre apenas no fim do ano.</span>
                                </button>
                            </div>
                        </section>

                        <section
                            className="border border-[#000000] p-6 rounded-[3px]"
                            style={getSystemBoxStyle('#fbaa19')}
                        >
                            <h2 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 text-white">Stewards Room</h2>
                            <div className="flex flex-col gap-4">
                                <div className="bg-[#030303] border-l-4 border-l-[#fbaa19] border border-white/10 rounded-[3px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-sm uppercase tracking-wider text-white">Denúncia: Violação de Prazo</span>
                                        <span className="text-xs text-white/50">Usuário @Hamilton44 submitted prediction após Q1.</span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button type="button" className="flex-1 sm:flex-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 rounded-[3px] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-colors cursor-pointer">Absolver</button>
                                        <button type="button" className="flex-1 sm:flex-none bg-red-500/10 text-red-400 border border-red-500/50 rounded-[3px] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Punir -10pts</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-col gap-6">
                        <section
                            className="text-white p-6 rounded-[3px] border border-[#000000]"
                            style={getSystemBoxStyle('#fbaa19', 'right')}
                        >
                            <h2 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Status do Servidor
                            </h2>
                            <ul className="space-y-4 font-mono text-xs">
                                <li className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-white/50">Banco de Dados</span>
                                    <span className="text-emerald-400">ONLINE</span>
                                </li>
                                <li className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-white/50">Motor de Pontos</span>
                                    <span className="text-emerald-400">SINCRONIZADO</span>
                                </li>
                                <li className="flex justify-between pb-2">
                                    <span className="text-white/50">Diretor Ativo</span>
                                    <span className="text-[#fbaa19]">VOCÊ</span>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            )}

            {activeView === 'misc' && (
                <section className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest border-l-4 border-[#fbaa19] pl-4 text-white">Manage Misc (Event Props)</h2>
                            <p className="text-white/60 text-xs sm:text-sm">Selecione exatamente 3 perguntas ativas para a rodada atual.</p>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 border rounded-[3px] shrink-0 ${activeMiscQuestions.length === 3 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/50 bg-amber-500/10 text-amber-400'}`}>
                            {activeMiscQuestions.length}/3 ATIVAS
                        </span>
                    </div>
                    <div
                        className="border border-[#000000] p-4 md:p-8 rounded-[3px]"
                        style={getSystemBoxStyle('#fbaa19')}
                    >
                        <div className="flex flex-col gap-3">
                            {MISC_QUESTIONS.map((q) => {
                                const isSelected = activeMiscQuestions.includes(q.id);
                                const isDisabled = !isSelected && activeMiscQuestions.length >= 3;
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => toggleMiscQuestion(q.id)}
                                        disabled={isDisabled}
                                        className={`p-4 border rounded-[3px] text-left transition-colors flex items-center justify-between gap-4 ${
                                            isSelected
                                                ? 'border-[#fbaa19] bg-[#fbaa19]/10 text-[#fbaa19] cursor-pointer'
                                                : isDisabled
                                                    ? 'border-white/5 bg-[#030303] text-white/30 cursor-not-allowed'
                                                    : 'border-white/15 bg-[#030303] text-white/70 hover:border-white hover:text-white cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{q.id.toUpperCase()}</span>
                                            <span className="font-bold uppercase text-sm">{q.text}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[3px] border shrink-0 ${isSelected ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'border-white/15 text-white/50'}`}>
                                            {isSelected ? 'ATIVA ✔' : 'OCULTA'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-4">
                            {successMsg && (
                                <span className="text-emerald-400 font-bold uppercase tracking-widest animate-pulse text-sm">
                                    {successMsg}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleSaveMisc}
                                disabled={savingMisc || activeMiscQuestions.length !== 3}
                                className="w-full sm:w-auto bg-[#fbaa19] text-black border border-[#fbaa19] rounded-[3px] px-10 py-3.5 font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {savingMisc ? 'Saving...' : 'Save Misc (3 Active)'}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="w-full flex flex-col min-h-screen bg-[#020202] text-white pb-24">
            {content}
        </div>
    );
}
