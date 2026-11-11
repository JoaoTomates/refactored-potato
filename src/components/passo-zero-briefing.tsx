"use client";

import React, { useState } from 'react';
import { 
    SeniorStrategist, 
    getSeniorStrategistForRound, 
    getStrategistVoice, 
    AllianceBlock 
} from '@/lib/race-directors';
import { CircuitTelemetryIntel, getCircuitIntel } from '@/lib/circuits-intel';
import { getTeamPrincipal } from '@/lib/paddock-crew';
import { F1_DRIVERS, F1_MATCHUPS } from '@/api/f1-data';
import { 
    Radio, 
    Zap, 
    Sparkles, 
    ChevronDown, 
    ChevronUp, 
    Check, 
    ShieldAlert, 
    Timer, 
    Flag, 
    Award, 
    Flame,
    Users,
    SlidersHorizontal,
    Volume2
} from 'lucide-react';

interface PilotProfile {
    name: string;
    slug: string | null;
    driverNumber: string | null;
    teamName: string | null;
    teamColor: string | null;
    avatarUrl: string | null;
}

interface PassoZeroBriefingProps {
    roundNumber?: number;
    circuitIdentifier?: string;
    pilot: PilotProfile | null;
    allianceBlock?: 'A' | 'B' | 'C';
    activeTab: string;
    onApplyPoletime: (digits: number[]) => void;
    onApplyTop10: (picks: string[]) => void;
    onApplyEvo: (drivers: string[]) => void;
    onApplyH2H: (picks: Record<string, string>) => void;
    onApplyAll: (data: {
        poletime: number[];
        top10: string[];
        evo: string[];
        h2h: Record<string, string>;
    }) => void;
}

export function parseTimeToDigits(timeStr: string): number[] {
    const clean = timeStr.trim();
    const match = clean.match(/(\d):(\d{2})[.:](\d{3})/);
    if (match) {
        return [
            parseInt(match[1], 10),
            parseInt(match[2][0], 10),
            parseInt(match[2][1], 10),
            parseInt(match[3][0], 10),
            parseInt(match[3][1], 10),
            parseInt(match[3][2], 10)
        ];
    }
    return [1, 3, 2, 1, 5, 0];
}

export function resolveTop10(predictedTop3: string[]): string[] {
    const picks: string[] = [];
    const used = new Set<string>();

    predictedTop3.forEach(d => {
        const clean = d.trim().toUpperCase();
        if (F1_DRIVERS.includes(clean) && !used.has(clean)) {
            picks.push(clean);
            used.add(clean);
        }
    });

    const standardPriority = [
        'L.NORRIS', 'M.VERSTAPPEN', 'C.LECLERC', 'L.HAMILTON', 
        'G.RUSSELL', 'O.PIASTRI', 'C.SAINZ', 'F.ALONSO', 
        'K.ANTONELLI', 'P.GASLY', 'A.ALBON', 'E.OCON'
    ];

    standardPriority.forEach(d => {
        if (picks.length < 10 && !used.has(d)) {
            picks.push(d);
            used.add(d);
        }
    });

    F1_DRIVERS.forEach(d => {
        if (picks.length < 10 && !used.has(d)) {
            picks.push(d);
            used.add(d);
        }
    });

    return picks.slice(0, 10);
}

export function resolveEvo(evoDriverRaw: string): string[] {
    const picks: string[] = [];
    const used = new Set<string>();

    const match = evoDriverRaw.match(/([A-Z]\.[A-Z]+)/);
    if (match && F1_DRIVERS.includes(match[1])) {
        picks.push(match[1]);
        used.add(match[1]);
    }

    const recoveryDrivers = ['F.ALONSO', 'C.SAINZ', 'L.HAMILTON', 'A.ALBON', 'P.GASLY', 'N.HULKENBERG', 'G.BORTOLETO'];
    recoveryDrivers.forEach(d => {
        if (picks.length < 5 && !used.has(d)) {
            picks.push(d);
            used.add(d);
        }
    });

    F1_DRIVERS.forEach(d => {
        if (picks.length < 5 && !used.has(d)) {
            picks.push(d);
            used.add(d);
        }
    });

    return picks.slice(0, 5);
}

export function resolveH2HPicks(dominantDrivers: string[]): Record<string, string> {
    const picks: Record<string, string> = {};
    F1_MATCHUPS.forEach(m => {
        picks[m.id] = m.defaultPick;
    });

    dominantDrivers.forEach(dom => {
        const upper = dom.toUpperCase();
        F1_MATCHUPS.forEach(m => {
            if (upper.includes(m.d1.name)) {
                picks[m.id] = m.d1.num;
            } else if (upper.includes(m.d2.name)) {
                picks[m.id] = m.d2.num;
            }
        });
    });

    return picks;
}

export default function PassoZeroBriefing({
    roundNumber = 19,
    circuitIdentifier,
    pilot,
    allianceBlock = 'A',
    activeTab,
    onApplyPoletime,
    onApplyTop10,
    onApplyEvo,
    onApplyH2H,
    onApplyAll
}: PassoZeroBriefingProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

    // Carrega o estrategista sênior do round
    const strategist: SeniorStrategist = getSeniorStrategistForRound(roundNumber);
    // Carrega a telemetria canônica do circuito
    const circuit: CircuitTelemetryIntel = getCircuitIntel(circuitIdentifier);
    // Chefe de equipe associado ao piloto
    const principal = getTeamPrincipal(pilot?.teamName || 'FER');

    // Transmissão de rádio com modulação de voz da Aliança
    const voice = getStrategistVoice(strategist, allianceBlock, 'BR', pilot?.name || 'PILOTO');

    // Executa a aplicação integral dos parâmetros do conselheiro
    const handleApplyAll = () => {
        // Poletime: prioriza circuit.lastPoleTime.time se disponível, senão midpoint de strategist.briefingTips.poletimeTarget
        const poleTargetStr = circuit.lastPoleTime?.time || strategist.briefingTips.poletimeTarget.split('–')[0];
        const poletimeDigits = parseTimeToDigits(poleTargetStr);
        const top10Picks = resolveTop10(strategist.briefingTips.predictedTop3);
        const evoPicks = resolveEvo(strategist.briefingTips.evoTargetDriver);
        const h2hPicks = resolveH2HPicks(strategist.briefingTips.dominantH2HDrivers);

        onApplyAll({
            poletime: poletimeDigits,
            top10: top10Picks,
            evo: evoPicks,
            h2h: h2hPicks
        });

        setAppliedStatus(`ORDENS DE ${strategist.code} SINCRONIZADAS COM SUCESSO!`);
        setTimeout(() => setAppliedStatus(null), 3500);
    };

    // Aplicação individual contextual
    const handleApplyCurrentTab = () => {
        if (activeTab === 'poletime') {
            const poleTargetStr = circuit.lastPoleTime?.time || strategist.briefingTips.poletimeTarget.split('–')[0];
            onApplyPoletime(parseTimeToDigits(poleTargetStr));
            setAppliedStatus(`POLETIME SINCRONIZADO COM O BENCHMARK DE ${strategist.code}!`);
        } else if (activeTab === 'master') {
            onApplyTop10(resolveTop10(strategist.briefingTips.predictedTop3));
            setAppliedStatus(`TOP 10 INICIAL CARREGADO COM DICAS DE ${strategist.code}!`);
        } else if (activeTab === 'evo') {
            onApplyEvo(resolveEvo(strategist.briefingTips.evoTargetDriver));
            setAppliedStatus(`ALVO DE ESCALADA AJUSTADO CONFORME ${strategist.code}!`);
        } else if (activeTab === 'h2h') {
            onApplyH2H(resolveH2HPicks(strategist.briefingTips.dominantH2HDrivers));
            setAppliedStatus(`DUELOS INTERNOS CARREGADOS SEGUNDO ${strategist.code}!`);
        } else {
            handleApplyAll();
            return;
        }
        setTimeout(() => setAppliedStatus(null), 3500);
    };

    return (
        <section 
            aria-label="Passo Zero - Sala de Estratégia"
            className="w-full bg-[#0a0c0f] border border-[#fbaa19]/40 rounded-xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all"
        >
            {/* Linha decorativa superior de telemetria */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-[#fbaa19] to-emerald-500 opacity-80" />

            {/* Cabeçalho do Passo Zero com status do Conselheiro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/90 border border-[#fbaa19]/60 flex items-center justify-center shrink-0 shadow-inner">
                        <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-[#fbaa19] animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono tracking-widest text-[#fbaa19] font-black uppercase px-2 py-0.5 rounded bg-[#fbaa19]/15 border border-[#fbaa19]/30">
                                PASSO 00 // PITWALL BRIEFING
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                {voice.accentBadge}
                            </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-white tracking-wide mt-1 flex items-center gap-2">
                            <span>SALA DE ESTRATÉGIA // {strategist.code}</span>
                            <span className="text-xs text-white/40 font-normal">({strategist.title})</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/15 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        title={isCollapsed ? 'Expandir Briefing' : 'Recolher Briefing'}
                    >
                        {isCollapsed ? (
                            <>
                                <span>EXPANDIR BRIEFING</span>
                                <ChevronDown className="w-3.5 h-3.5 text-[#fbaa19]" />
                            </>
                        ) : (
                            <>
                                <span>RECOLHER</span>
                                <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Conteúdo Expansível do Passo Zero */}
            {!isCollapsed && (
                <div className="mt-5 flex flex-col gap-5">
                    {/* 1. Balão de Rádio do Conselheiro falado diretamente ao Piloto */}
                    <div className="bg-black/95 border-l-4 border-[#fbaa19] border-y border-r border-white/10 rounded-r-lg p-4 shadow-xl relative">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mb-2">
                            <span className="text-[#fbaa19] font-black tracking-wider flex items-center gap-1.5">
                                <Volume2 className="w-3.5 h-3.5" />
                                {voice.callsign}
                            </span>
                            <span className="text-white/40">
                                AUDIÇÃO PRIVADA DE {pilot?.name || 'ESTRATEGISTA'} · ASSERTIVIDADE: {strategist.evaluation.accuracyRate}%
                            </span>
                        </div>

                        <blockquote className="text-sm md:text-base text-gray-100 font-medium italic leading-relaxed">
                            {voice.radioTransmission}
                        </blockquote>

                        <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                            <span className="text-white/60">
                                <strong className="text-[#fbaa19]">DIRETRIZ TÁTICA:</strong> {voice.tacticalOrder}
                            </span>
                            <span className="text-white/40 italic">
                                Chefe de Equipe: <span className="text-white font-bold">{principal.code} ({principal.fullName})</span>
                            </span>
                        </div>
                    </div>

                    {/* 2. Radar de Telemetria Canônica do Circuito Atual */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div className="bg-black/60 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
                                <span className="flex items-center gap-1">
                                    <Timer className="w-3.5 h-3.5 text-[#fbaa19]" />
                                    POLE DE REFERÊNCIA
                                </span>
                                <span className="text-[#fbaa19] font-bold">{circuit.lastPoleTime?.year || '2024'}</span>
                            </div>
                            <div className="text-xl font-black text-white font-mono mt-1">
                                {circuit.lastPoleTime?.time || '1:32.331'}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono truncate">
                                Cravada por {circuit.lastPoleTime?.driver || 'L.NORRIS'}
                            </div>
                        </div>

                        <div className="bg-black/60 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
                                <span className="flex items-center gap-1">
                                    <Flag className="w-3.5 h-3.5 text-blue-400" />
                                    RECORDE DE CORRIDA
                                </span>
                                <span className="text-blue-400 font-bold">{circuit.lapRecord?.year || '2019'}</span>
                            </div>
                            <div className="text-xl font-black text-white font-mono mt-1">
                                {circuit.lapRecord?.time || '1:36.169'}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono truncate">
                                Detido por {circuit.lapRecord?.driver || 'C.LECLERC'}
                            </div>
                        </div>

                        <div className="bg-black/60 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
                                <span className="flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                    RISCO DE SAFETY CAR
                                </span>
                                <span className="text-amber-400 font-bold">{circuit.scProbability}%</span>
                            </div>
                            <div className="text-xl font-black text-amber-300 font-mono mt-1">
                                {circuit.t1IncidentRisk}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono">
                                Incidência na Curva 1 / Largada
                            </div>
                        </div>

                        <div className="bg-black/60 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
                                <span className="flex items-center gap-1">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                                    ESTRATÉGIA DE PARADA
                                </span>
                                <span className="text-emerald-400 font-bold">PITWALL</span>
                            </div>
                            <div className="text-sm font-black text-white font-mono mt-1 leading-snug">
                                {circuit.optimalStrategy || '2 Paradas (M > D > D)'}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono">
                                Perda no Pit Lane: ~{circuit.pitLaneTimeLossSec}s
                            </div>
                        </div>
                    </div>

                    {/* 3. Recomendações Táticas do Conselheiro para cada aba */}
                    <div className="bg-[#0e1015] border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-[#fbaa19] uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                DOSSIÊ DO ESTRATEGISTA // PARÂMETROS SUGERIDOS
                            </span>
                            <span className="text-[10px] font-mono text-white/40">
                                BASEADO NO CIRCUITO: {circuit.circuitName.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
                                <div className="text-[10px] font-mono text-white/50 uppercase">⏱️ POLETIME IDEAL</div>
                                <div className="text-sm font-bold text-white font-mono mt-0.5">
                                    {strategist.briefingTips.poletimeTarget}
                                </div>
                                <div className="text-[11px] text-white/60 mt-1 italic">
                                    "{strategist.briefingTips.poletimeReasoning}"
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
                                <div className="text-[10px] font-mono text-white/50 uppercase">🏆 TOP 3 PROJETADO</div>
                                <div className="text-sm font-bold text-[#fbaa19] font-mono mt-0.5">
                                    {strategist.briefingTips.predictedTop3.join('  ·  ')}
                                </div>
                                <div className="text-[11px] text-white/60 mt-1 italic">
                                    "{strategist.briefingTips.top3Reasoning}"
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
                                <div className="text-[10px] font-mono text-white/50 uppercase">🚀 ALVO DE ESCALADA (EVO)</div>
                                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                                    {strategist.briefingTips.evoTargetDriver}
                                </div>
                                <div className="text-[11px] text-white/60 mt-1 italic">
                                    "{strategist.briefingTips.evoReasoning}"
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
                                <div className="text-[10px] font-mono text-white/50 uppercase">⚔️ DUELOS H2H RECOMENDADOS</div>
                                <div className="text-sm font-bold text-blue-400 font-mono mt-0.5 truncate">
                                    {strategist.briefingTips.dominantH2HDrivers.slice(0, 2).join(' · ')}
                                </div>
                                <div className="text-[11px] text-white/60 mt-1 italic">
                                    "{strategist.briefingTips.h2hReasoning}"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Ações Táticas Rápidas (Padrão de Ouro de UX) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] font-mono text-white/60 flex items-center gap-1.5">
                            {appliedStatus ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                                    <Check className="w-4 h-4" />
                                    {appliedStatus}
                                </span>
                            ) : (
                                <span>
                                    💡 <strong className="text-white">Passo Zero:</strong> Você pode aplicar a sugestão do mentor como ponto de partida e refiná-la nos formulários abaixo.
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {activeTab !== 'all' && (
                                <button
                                    type="button"
                                    onClick={handleApplyCurrentTab}
                                    className="px-3.5 py-2 text-[11px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-[#fbaa19]" />
                                    <span>APLICAR NA ABA [{activeTab.toUpperCase()}]</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleApplyAll}
                                className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#fbaa19] hover:bg-[#e09815] text-black border border-[#fbaa19] rounded shadow-lg hover:shadow-[#fbaa19]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-black" />
                                <span>APLICAR ESTRATÉGIA COMPLETA DE {strategist.code}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
