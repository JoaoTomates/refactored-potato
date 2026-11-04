import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { F1_DRIVERS, F1_MATCHUPS } from '@/api/f1-data';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getSeniorStrategistForRound } from '@/lib/race-directors';
import { getCircuitIntel } from '@/lib/circuits-intel';
import { resolveTop10, resolveEvo, resolveH2HPicks, parseTimeToDigits } from '@/components/passo-zero-briefing';

export type CalibrationSourceType = 'SQUAD' | 'MARKET' | 'BASELINE';

export interface CalibrationSource {
    type: CalibrationSourceType;
    count: number;
    label: string;
    description: string;
    tier: 'RED' | 'YELLOW' | 'GREEN';
    helpBorder: string;
    dot: string;
}

const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());

export const useTeamworkAuto = () => {
    const activeRound = usePredictionStore(state => state.activeRound);
    const { user } = useSupabaseAuth();
    const [isAutoLoading, setIsAutoLoading] = useState(false);
    
    const [calibrationSource, setCalibrationSource] = useState<CalibrationSource>({
        type: 'BASELINE',
        count: 0,
        label: 'TELEMETRIA OFICIAL F1',
        description: 'Sem histórico de ordens no momento. Calibrado pelo benchmark da FIA.',
        tier: 'RED',
        helpBorder: '#ef4444',
        dot: 'bg-red-500 animate-pulse',
    });

    /**
     * Busca em cascata hierárquica oficial do Estrategista Sênior:
     * 1. Amigos do esquadrão Teamwork do usuário (Prioridade Máxima)
     * 2. Apostas gerais do mercado (Fallback da multidão)
     * 3. Telemetria benchmark oficial da F1 (Base zero)
     */
    const fetchHierarchicalPredictions = useCallback(async (): Promise<{
        predictions: any[];
        source: CalibrationSource;
    }> => {
        try {
            // 1. PRIORIDADE 1: Amigos do mesmo Esquadrão Teamwork
            if (user?.id) {
                const { data: memberRecord } = await supabase
                    .from('teamwork_members')
                    .select('squad_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (memberRecord?.squad_id) {
                    const { data: squadMembers } = await supabase
                        .from('teamwork_members')
                        .select('user_id')
                        .eq('squad_id', memberRecord.squad_id)
                        .neq('user_id', user.id);

                    if (squadMembers && squadMembers.length > 0) {
                        const friendIds = squadMembers.map(m => m.user_id);
                        const { data: squadPreds } = await supabase
                            .from('predictions')
                            .select('*')
                            .eq('round', activeRound || 'current')
                            .in('user_id', friendIds);

                        if (squadPreds && squadPreds.length > 0) {
                            const source: CalibrationSource = {
                                type: 'SQUAD',
                                count: squadPreds.length,
                                label: `ESQUADRÃO (${squadPreds.length} AMIGO${squadPreds.length > 1 ? 'S' : ''})`,
                                description: `Calibrado prioritariamente com a telemetria consensual do seu esquadrão Teamwork.`,
                                tier: squadPreds.length >= 4 ? 'GREEN' : 'YELLOW',
                                helpBorder: squadPreds.length >= 4 ? '#10b981' : '#f59e0b',
                                dot: squadPreds.length >= 4 ? 'bg-emerald-400' : 'bg-amber-400',
                            };
                            setCalibrationSource(source);
                            return { predictions: squadPreds, source };
                        }
                    }
                }
            }

            // 2. PRIORIDADE 2: Mercado Geral (outros usuários do sistema)
            const { data: generalPreds } = await supabase
                .from('predictions')
                .select('*')
                .eq('round', activeRound || 'current');

            const validGeneral = (generalPreds || []).filter(p => !user?.id || p.user_id !== user.id);
            if (validGeneral.length > 0) {
                const tier = validGeneral.length >= 10 ? 'GREEN' : validGeneral.length >= 3 ? 'YELLOW' : 'RED';
                const source: CalibrationSource = {
                    type: 'MARKET',
                    count: validGeneral.length,
                    label: `MERCADO GERAL (${validGeneral.length} APOSTA${validGeneral.length > 1 ? 'S' : ''})`,
                    description: `Nenhum amigo do esquadrão enviou ainda. Calibrado com o consenso global do paddock.`,
                    tier: tier,
                    helpBorder: tier === 'GREEN' ? '#10b981' : tier === 'YELLOW' ? '#f59e0b' : '#ef4444',
                    dot: tier === 'GREEN' ? 'bg-emerald-400' : tier === 'YELLOW' ? 'bg-amber-400' : 'bg-red-500 animate-pulse',
                };
                setCalibrationSource(source);
                return { predictions: validGeneral, source };
            }

            // 3. PRIORIDADE 3: Benchmark da F1 // Estrategista Sênior & Dossiê de Pista
            const source: CalibrationSource = {
                type: 'BASELINE',
                count: 0,
                label: 'ESTRATEGISTA SÊNIOR // DOSSIÊ DE PISTA',
                description: 'Sem ordens suficientes do esquadrão no momento. Calibrado pelo Dossiê Canônico e Conselheiro do Paddock.',
                tier: 'RED',
                helpBorder: '#fbaa19',
                dot: 'bg-[#fbaa19] animate-pulse',
            };
            setCalibrationSource(source);
            return { predictions: [], source };
        } catch (err) {
            console.error('Erro na consulta em cascata de previsões:', err);
            const source: CalibrationSource = {
                type: 'BASELINE',
                count: 0,
                label: 'ESTRATEGISTA SÊNIOR // DOSSIÊ DE PISTA',
                description: 'Telemetria padrão de segurança do Conselheiro.',
                tier: 'RED',
                helpBorder: '#fbaa19',
                dot: 'bg-[#fbaa19] animate-pulse',
            };
            return { predictions: [], source };
        }
    }, [user, activeRound]);

    // Atualiza a fonte de calibragem automaticamente ao carregar
    useEffect(() => {
        fetchHierarchicalPredictions();
    }, [fetchHierarchicalPredictions]);

    const autoTop10 = async (): Promise<string[]> => {
        setIsAutoLoading(true);
        try {
            const { predictions, source } = await fetchHierarchicalPredictions();
            let finalPicks: string[] = [];
            
            if (predictions && predictions.length > 0) {
                const positionCounts = Array(10).fill(0).map(() => ({} as Record<string, number>));
                predictions.forEach(row => {
                    if (row.top10 && Array.isArray(row.top10)) {
                        row.top10.forEach((driver: string, idx: number) => {
                            if (driver) {
                                positionCounts[idx][driver] = (positionCounts[idx][driver] || 0) + 1;
                            }
                        });
                    }
                });
                
                const usedDrivers = new Set<string>();
                for (let i = 0; i < 10; i++) {
                    const counts = positionCounts[i];
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    
                    let picked = false;
                    for (const [driver] of sorted) {
                        if (!usedDrivers.has(driver)) {
                            finalPicks[i] = driver;
                            usedDrivers.add(driver);
                            picked = true;
                            break;
                        }
                    }
                    
                    if (!picked) {
                        const available = F1_DRIVERS.filter(d => !usedDrivers.has(d));
                        const randomDriver = available[Math.floor(Math.random() * available.length)];
                        finalPicks[i] = randomDriver;
                        usedDrivers.add(randomDriver);
                    }
                }
                console.log(`[ESTRATEGISTA SÊNIOR] Top 10 calibrado via ${source.label}`);
            } else {
                const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
                const strat = getSeniorStrategistForRound(roundNum);
                finalPicks = resolveTop10(strat.briefingTips.predictedTop3);
            }
            return finalPicks;
        } catch (e) {
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const strat = getSeniorStrategistForRound(roundNum);
            return resolveTop10(strat.briefingTips.predictedTop3);
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoEvo = async (): Promise<string[]> => {
        setIsAutoLoading(true);
        try {
            const { predictions, source } = await fetchHierarchicalPredictions();
            if (predictions && predictions.length > 0) {
                const driverCounts: Record<string, number> = {};
                predictions.forEach(row => {
                    if (row.evo && Array.isArray(row.evo)) {
                        row.evo.forEach((driver: string) => {
                            if (driver) driverCounts[driver] = (driverCounts[driver] || 0) + 1;
                        });
                    }
                });
                
                const sorted = Object.entries(driverCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
                const popular = sorted.slice(0, 5);
                
                console.log(`[ESTRATEGISTA SÊNIOR] EVO calibrado via ${source.label}`);
                if (popular.length < 5) {
                    const remaining = shuffle(F1_DRIVERS.filter(d => !popular.includes(d)));
                    return [...popular, ...remaining.slice(0, 5 - popular.length)];
                }
                return popular;
            }
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const strat = getSeniorStrategistForRound(roundNum);
            return resolveEvo(strat.briefingTips.evoTargetDriver);
        } catch (e) {
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const strat = getSeniorStrategistForRound(roundNum);
            return resolveEvo(strat.briefingTips.evoTargetDriver);
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoH2H = async (): Promise<Record<string, string>> => {
        setIsAutoLoading(true);
        try {
            const { predictions, source } = await fetchHierarchicalPredictions();
            const finalPicks: Record<string, string> = {};
            
            if (predictions && predictions.length > 0) {
                const matchupCounts: Record<string, Record<string, number>> = {};
                predictions.forEach(row => {
                    if (row.h2h && typeof row.h2h === 'object') {
                        Object.entries(row.h2h).forEach(([matchId, driverNum]) => {
                            if (!matchupCounts[matchId]) matchupCounts[matchId] = {};
                            matchupCounts[matchId][driverNum as string] = (matchupCounts[matchId][driverNum as string] || 0) + 1;
                        });
                    }
                });
                
                F1_MATCHUPS.forEach(match => {
                    const counts = matchupCounts[match.id] || {};
                    const d1Count = counts[match.d1.num] || 0;
                    const d2Count = counts[match.d2.num] || 0;
                    
                    if (d1Count > d2Count) {
                        finalPicks[match.id] = match.d1.num;
                    } else if (d2Count > d1Count) {
                        finalPicks[match.id] = match.d2.num;
                    } else {
                        finalPicks[match.id] = Math.random() > 0.5 ? match.d1.num : match.d2.num;
                    }
                });
                console.log(`[ESTRATEGISTA SÊNIOR] H2H calibrado via ${source.label}`);
            } else {
                const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
                const strat = getSeniorStrategistForRound(roundNum);
                return resolveH2HPicks(strat.briefingTips.dominantH2HDrivers);
            }
            return finalPicks;
        } catch (e) {
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const strat = getSeniorStrategistForRound(roundNum);
            return resolveH2HPicks(strat.briefingTips.dominantH2HDrivers);
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoPoletime = async (): Promise<number[]> => {
        setIsAutoLoading(true);
        try {
            const { predictions, source } = await fetchHierarchicalPredictions();

            if (predictions && predictions.length > 0) {
                let totalMs = 0;
                let validCount = 0;
                predictions.forEach(row => {
                    const timeStr = row.poletime;
                    if (timeStr && typeof timeStr === 'string' && timeStr.includes(':') && timeStr.includes('.')) {
                        const [mins, rest] = timeStr.split(':');
                        const [secs, millis] = rest.split('.');
                        const total = parseInt(mins, 10) * 60000 + parseInt(secs, 10) * 1000 + parseInt(millis, 10);
                        if (!isNaN(total)) {
                            totalMs += total;
                            validCount++;
                        }
                    }
                });

                if (validCount > 0) {
                    const avgMs = Math.floor(totalMs / validCount);
                    // Variação tática sutil de +/- 15 milissegundos para precisão cirúrgica
                    const finalMs = avgMs + (Math.floor(Math.random() * 30) - 15); 
                    
                    const date = new Date(finalMs);
                    const formattedMins = date.getUTCMinutes();
                    const formattedSecs = date.getUTCSeconds().toString().padStart(2, '0');
                    const formattedMillis = date.getUTCMilliseconds().toString().padStart(3, '0');

                    console.log(`[ESTRATEGISTA SÊNIOR] Poletime calibrado via ${source.label}`);
                    return [
                        formattedMins,
                        parseInt(formattedSecs[0], 10),
                        parseInt(formattedSecs[1], 10),
                        parseInt(formattedMillis[0], 10),
                        parseInt(formattedMillis[1], 10),
                        parseInt(formattedMillis[2], 10)
                    ];
                }
            }
            
            // Fallback canônico: Circuito + Estrategista Sênior
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const strat = getSeniorStrategistForRound(roundNum);
            const circuit = getCircuitIntel(String(roundNum));
            const targetTimeStr = circuit.lastPoleTime?.time || strat.briefingTips.poletimeTarget.split('–')[0];
            return parseTimeToDigits(targetTimeStr);
        } catch (e) {
            const roundNum = typeof activeRound === 'number' ? activeRound : parseInt(String(activeRound || '19'), 10) || 19;
            const circuit = getCircuitIntel(String(roundNum));
            return parseTimeToDigits(circuit.lastPoleTime?.time || '1:32.331');
        } finally {
            setIsAutoLoading(false);
        }
    };

    return { 
        autoTop10, 
        autoEvo, 
        autoH2H, 
        autoPoletime, 
        isAutoLoading, 
        calibrationSource,
        refreshCalibration: fetchHierarchicalPredictions
    };
};
