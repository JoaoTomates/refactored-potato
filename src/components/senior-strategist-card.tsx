"use client";

import React, { useState, useEffect } from 'react';
import { 
    SeniorStrategist, 
    SENIOR_STRATEGISTS,
    getSeniorStrategistForRound 
} from '@/lib/race-directors';
import { 
    ThumbsUp, 
    ThumbsDown, 
    Star, 
    Award, 
    Zap, 
    TrendingUp, 
    Swords, 
    Timer, 
    AlertTriangle, 
    Radio, 
    ChevronDown, 
    Check, 
    ShieldAlert,
    Sparkles,
    Flame
} from 'lucide-react';

interface SeniorStrategistCardProps {
    roundNumber?: number;
    initialStrategistId?: string;
}

export default function SeniorStrategistCard({ 
    roundNumber = 19, 
    initialStrategistId 
}: SeniorStrategistCardProps) {
    // Inicializa com o estrategista da rodada ou o especificado
    const defaultStrategist = initialStrategistId 
        ? (SENIOR_STRATEGISTS.find(s => s.id === initialStrategistId) || getSeniorStrategistForRound(roundNumber))
        : getSeniorStrategistForRound(roundNumber);

    const [selectedStrategist, setSelectedStrategist] = useState<SeniorStrategist>(defaultStrategist);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [evalStats, setEvalStats] = useState({
        upvotes: defaultStrategist.evaluation.upvotes,
        downvotes: defaultStrategist.evaluation.downvotes,
        rating: defaultStrategist.evaluation.communityRating,
        total: defaultStrategist.evaluation.totalEvaluations,
        accuracy: defaultStrategist.evaluation.accuracyRate
    });
    const [showSelector, setShowSelector] = useState(false);

    // Atualiza quando o roundNumber ou initialStrategistId muda
    useEffect(() => {
        if (initialStrategistId) {
            const userStrat = SENIOR_STRATEGISTS.find(s => s.id === initialStrategistId);
            if (userStrat) {
                setSelectedStrategist(userStrat);
                return;
            }
        }
        const strat = getSeniorStrategistForRound(roundNumber);
        setSelectedStrategist(strat);
    }, [roundNumber, initialStrategistId]);

    // Carrega votos salvos do localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storageKey = `voltgrid_vote_${selectedStrategist.id}`;
        const savedVote = localStorage.getItem(storageKey);
        if (savedVote === 'up' || savedVote === 'down') {
            setUserVote(savedVote);
        } else {
            setUserVote(null);
        }

        // Reseta contadores locais baseados no estrategista atual
        setEvalStats({
            upvotes: selectedStrategist.evaluation.upvotes,
            downvotes: selectedStrategist.evaluation.downvotes,
            rating: selectedStrategist.evaluation.communityRating,
            total: selectedStrategist.evaluation.totalEvaluations,
            accuracy: selectedStrategist.evaluation.accuracyRate
        });
    }, [selectedStrategist]);

    const handleVote = (vote: 'up' | 'down') => {
        if (typeof window === 'undefined') return;
        const storageKey = `voltgrid_vote_${selectedStrategist.id}`;

        if (userVote === vote) {
            // Desfazer voto
            localStorage.removeItem(storageKey);
            setUserVote(null);
            setEvalStats(prev => ({
                ...prev,
                upvotes: vote === 'up' ? prev.upvotes - 1 : prev.upvotes,
                downvotes: vote === 'down' ? prev.downvotes - 1 : prev.downvotes,
                total: prev.total - 1
            }));
        } else {
            // Aplicar novo voto
            localStorage.setItem(storageKey, vote);
            setEvalStats(prev => {
                let up = prev.upvotes;
                let down = prev.downvotes;
                if (userVote === 'up') up--;
                if (userVote === 'down') down--;

                if (vote === 'up') up++;
                if (vote === 'down') down++;

                const total = prev.total + (userVote ? 0 : 1);
                const rating = Math.min(5, Math.max(1, +( (up / (up + down || 1)) * 5 ).toFixed(1)));
                return {
                    ...prev,
                    upvotes: up,
                    downvotes: down,
                    rating,
                    total
                };
            });
            setUserVote(vote);
        }
    };

    return (
        <div className="bg-black/95 border-2 border-[#fbaa19]/60 rounded-sm p-6 sm:p-8 shadow-[0_0_35px_rgba(251,170,25,0.12)] relative overflow-hidden font-mono">
            {/* Linha de pulso no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fbaa19] to-transparent"></div>

            {/* Cabeçalho do Estrategista */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {initialStrategistId && selectedStrategist.id === initialStrategistId && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-black font-black text-[10px] tracking-widest uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                ★ SEU CONSELHEIRO PESSOAL
                            </span>
                        )}
                        <span className="px-2 py-0.5 bg-[#fbaa19] text-black font-black text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                            <Radio className="w-3 h-3 animate-pulse" />
                            <span>A VOZ DO BRIEFING // ESTRATEGISTA SÊNIOR</span>
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-white/80 font-bold text-[10px] uppercase">
                            ERA: {selectedStrategist.decade}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[10px] uppercase">
                            {selectedStrategist.nationality} ({selectedStrategist.countryCode})
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wider">
                            {selectedStrategist.code}
                        </h2>
                        <span className="text-xs text-white/40 uppercase">
                            (Inspirado no veterano {selectedStrategist.originalDriver})
                        </span>
                    </div>

                    <p className="text-xs text-[#fbaa19] font-bold uppercase tracking-wider mt-1">
                        {selectedStrategist.title}
                    </p>
                </div>

                {/* Dropdown de Seleção de Estrategistas Veteranos */}
                <div className="relative">
                    <button
                        onClick={() => setShowSelector(!showSelector)}
                        className="bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-2 rounded text-xs text-white/80 flex items-center gap-2 transition-all"
                    >
                        <span className="text-[10px] text-white/40 uppercase">Outro Veterano:</span>
                        <span className="font-bold text-[#fbaa19]">{selectedStrategist.displayName}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    </button>

                    {showSelector && (
                        <div className="absolute right-0 mt-2 w-72 max-h-72 overflow-y-auto bg-black/95 border border-[#fbaa19]/40 rounded shadow-2xl z-50 p-1 divide-y divide-white/5">
                            <div className="p-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                24 Estrategistas de Paddock (1950–1980)
                            </div>
                            {SENIOR_STRATEGISTS.map((st) => (
                                <button
                                    key={st.id}
                                    onClick={() => {
                                        setSelectedStrategist(st);
                                        setShowSelector(false);
                                    }}
                                    className={`w-full text-left p-2.5 text-xs flex items-center justify-between hover:bg-white/10 rounded transition-colors ${
                                        st.id === selectedStrategist.id ? 'bg-[#fbaa19]/20 text-[#fbaa19] font-bold' : 'text-white/80'
                                    }`}
                                >
                                    <div>
                                        <div className="font-mono">{st.code}</div>
                                        <div className="text-[10px] text-white/40 truncate max-w-[190px]">{st.originalDriver}</div>
                                    </div>
                                    <div className="text-[10px] text-white/40 font-mono">
                                        {st.evaluation.accuracyRate}%
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Frase de Impacto Noir do Veterano */}
            <div className="bg-white/[0.03] border-l-2 border-[#fbaa19] p-4 rounded-r sm:p-5 mb-6 relative">
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed italic font-mono">
                    {selectedStrategist.signatureQuote}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5 text-[10px] text-white/40 uppercase">
                    <span>REGISTRO HISTÓRICO: {selectedStrategist.careerStat}</span>
                    <span className="text-amber-400/80 font-bold">ESPECIALIDADE: {selectedStrategist.specialty}</span>
                </div>
            </div>

            {/* AS 5 DICAS DO BRIEFING TÁTICO */}
            <div className="mb-6">
                <div className="text-[11px] text-[#fbaa19] uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>PARÂMETROS OFICIAIS DE PITWALL DO ESTRATEGISTA:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    
                    {/* 1. ALVO DO POLETIME */}
                    <div className="p-3.5 rounded bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-black text-[#fbaa19] flex items-center gap-1.5 mb-1.5">
                                <Timer className="w-3.5 h-3.5" />
                                <span>01. ALVO DE POLETIME</span>
                            </span>
                            <div className="text-lg font-black text-white font-mono mb-1">
                                {selectedStrategist.briefingTips.poletimeTarget}
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                {selectedStrategist.briefingTips.poletimeReasoning}
                            </p>
                        </div>
                        <span className="text-[9px] text-[#fbaa19]/60 uppercase mt-3 pt-1.5 border-t border-white/5">
                            Margem milimétrica de tolerância
                        </span>
                    </div>

                    {/* 2. PÓDIO OU TOP 3 */}
                    <div className="p-3.5 rounded bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-black text-emerald-400 flex items-center gap-1.5 mb-1.5">
                                <Award className="w-3.5 h-3.5" />
                                <span>02. PREVISÃO DE PÓDIO</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {selectedStrategist.briefingTips.predictedTop3.map((driver, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-xs font-bold font-mono">
                                        P{idx + 1}: {driver}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                {selectedStrategist.briefingTips.top3Reasoning}
                            </p>
                        </div>
                        <span className="text-[9px] text-emerald-400/60 uppercase mt-3 pt-1.5 border-t border-white/5">
                            Ritmo puro em simulação de corrida
                        </span>
                    </div>

                    {/* 3. ALERTA DE ESCALADA (EVO) */}
                    <div className="p-3.5 rounded bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-black text-blue-400 flex items-center gap-1.5 mb-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>03. ALERTA EVO (ESCALADA)</span>
                            </span>
                            <div className="text-xs font-black text-blue-300 font-mono mb-1 uppercase bg-blue-500/10 p-1.5 rounded border border-blue-500/20">
                                {selectedStrategist.briefingTips.evoTargetDriver}
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                {selectedStrategist.briefingTips.evoReasoning}
                            </p>
                        </div>
                        <span className="text-[9px] text-blue-400/60 uppercase mt-3 pt-1.5 border-t border-white/5">
                            Pontos bônus por recuperação
                        </span>
                    </div>

                    {/* 4. DUELOS TÁTICOS (H2H) */}
                    <div className="p-3.5 rounded bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-black text-purple-400 flex items-center gap-1.5 mb-1.5">
                                <Swords className="w-3.5 h-3.5" />
                                <span>04. DUELOS DOMINANTES (H2H)</span>
                            </span>
                            <ul className="space-y-1 mb-2">
                                {selectedStrategist.briefingTips.dominantH2HDrivers.map((duel, idx) => (
                                    <li key={idx} className="text-xs text-white/90 font-mono font-bold flex items-center gap-1.5">
                                        <span className="text-purple-400">•</span>
                                        <span>{duel}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                {selectedStrategist.briefingTips.h2hReasoning}
                            </p>
                        </div>
                        <span className="text-[9px] text-purple-400/60 uppercase mt-3 pt-1.5 border-t border-white/5">
                            Confronto direto com mesmo chassi
                        </span>
                    </div>

                    {/* 5. RISCOS & EVENT PROPS */}
                    <div className="p-3.5 rounded bg-black/60 border border-white/10 flex flex-col justify-between md:col-span-2 lg:col-span-2">
                        <div>
                            <span className="text-[10px] uppercase font-black text-rose-400 flex items-center gap-1.5 mb-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>05. RISCO DE SEGURANÇA & EVENT PROPS (MISC)</span>
                            </span>
                            <p className="text-xs text-white/90 leading-relaxed mb-2">
                                {selectedStrategist.briefingTips.miscRiskAlert}
                            </p>
                        </div>
                        <span className="text-[9px] text-rose-400/60 uppercase mt-3 pt-1.5 border-t border-white/5">
                            Probabilidades de Safety Car, DNF e variáveis climáticas
                        </span>
                    </div>
                </div>
            </div>

            {/* SISTEMA DE AVALIAÇÃO PELOS ESTRATEGISTAS DA COMUNIDADE */}
            <div className="bg-gradient-to-r from-white/[0.04] via-black to-white/[0.04] border border-white/10 p-4 rounded sm:flex items-center justify-between gap-4">
                <div className="mb-3 sm:mb-0">
                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#fbaa19]" />
                        <span>REPUTAÇÃO DO ESTRATEGISTA NO PADDOCK</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-[#fbaa19] font-bold">
                            <Star className="w-4 h-4 fill-[#fbaa19]" />
                            <span>{evalStats.rating.toFixed(1)} / 5.0</span>
                        </div>
                        <span className="text-white/20">|</span>
                        <div className="text-emerald-400 font-bold">
                            {evalStats.accuracy}% Assertividade
                        </div>
                        <span className="text-white/20">|</span>
                        <div className="text-white/50">
                            {evalStats.total} avaliações
                        </div>
                    </div>
                </div>

                {/* Botões de Voto do Usuário */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase hidden lg:inline">Avalie esta leitura:</span>
                    <button
                        onClick={() => handleVote('up')}
                        className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                            userVote === 'up'
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-white/5 hover:bg-white/10 text-emerald-400 border-emerald-500/30'
                        }`}
                        title="Votar que a dica é precisa e fundamentada"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>ÚTIL ({evalStats.upvotes})</span>
                    </button>

                    <button
                        onClick={() => handleVote('down')}
                        className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                            userVote === 'down'
                                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                                : 'bg-white/5 hover:bg-white/10 text-rose-400 border-rose-500/30'
                        }`}
                        title="Votar que a dica é arriscada ou inconsistente"
                    >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>FURADA ({evalStats.downvotes})</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
