import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { F1_DRIVERS, F1_MATCHUPS } from '@/api/f1-data';
import { usePredictionStore } from '@/store/usePredictionStore';

const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());

export const useTeamworkAuto = () => {
    const activeRound = usePredictionStore(state => state.activeRound);
    const [isAutoLoading, setIsAutoLoading] = useState(false);

    const autoTop10 = async (): Promise<string[]> => {
        setIsAutoLoading(true);
        try {
            const { data } = await supabase.from('predictions').select('top10').eq('round', activeRound);
            let finalPicks: string[] = [];
            
            if (data && data.length > 0) {
                const positionCounts = Array(10).fill(0).map(() => ({} as Record<string, number>));
                data.forEach(row => {
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
                console.log(`[TEAMWORK] Top 10 influenced by ${data.length} friends/users.`);
            } else {
                finalPicks = shuffle(F1_DRIVERS).slice(0, 10);
            }
            return finalPicks;
        } catch (e) {
            return shuffle(F1_DRIVERS).slice(0, 10);
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoEvo = async (): Promise<string[]> => {
        setIsAutoLoading(true);
        try {
            const { data } = await supabase.from('predictions').select('evo').eq('round', activeRound);
            if (data && data.length > 0) {
                const driverCounts: Record<string, number> = {};
                data.forEach(row => {
                    if (row.evo && Array.isArray(row.evo)) {
                        row.evo.forEach((driver: string) => {
                            if (driver) driverCounts[driver] = (driverCounts[driver] || 0) + 1;
                        });
                    }
                });
                
                const sorted = Object.entries(driverCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
                const popular = sorted.slice(0, 5);
                
                if (popular.length < 5) {
                    const remaining = shuffle(F1_DRIVERS.filter(d => !popular.includes(d)));
                    return [...popular, ...remaining.slice(0, 5 - popular.length)];
                }
                return popular;
            }
            return shuffle(F1_DRIVERS).slice(0, 5);
        } catch (e) {
            return shuffle(F1_DRIVERS).slice(0, 5);
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoH2H = async (): Promise<Record<string, string>> => {
        setIsAutoLoading(true);
        try {
            const { data } = await supabase.from('predictions').select('h2h').eq('round', activeRound);
            const finalPicks: Record<string, string> = {};
            
            if (data && data.length > 0) {
                const matchupCounts: Record<string, Record<string, number>> = {};
                data.forEach(row => {
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
            } else {
                F1_MATCHUPS.forEach(match => {
                    finalPicks[match.id] = Math.random() > 0.5 ? match.d1.num : match.d2.num;
                });
            }
            return finalPicks;
        } catch (e) {
            const fallback: Record<string, string> = {};
            F1_MATCHUPS.forEach(match => fallback[match.id] = Math.random() > 0.5 ? match.d1.num : match.d2.num);
            return fallback;
        } finally {
            setIsAutoLoading(false);
        }
    };

    const autoPoletime = async (): Promise<number[]> => {
        setIsAutoLoading(true);
        try {
            const { data } = await supabase.from('predictions').select('poletime').eq('round', activeRound);
            
            const m = 1;
            let s1 = Math.floor(Math.random() * 2) + 2; 
            let s2 = Math.floor(Math.random() * 10);
            let ms1 = Math.floor(Math.random() * 10);
            let ms2 = Math.floor(Math.random() * 10);
            let ms3 = Math.floor(Math.random() * 10);

            if (data && data.length > 0) {
                let totalMs = 0;
                let validCount = 0;
                data.forEach(row => {
                    const timeStr = row.poletime;
                    if (timeStr && typeof timeStr === 'string' && timeStr.includes(':') && timeStr.includes('.')) {
                        const [mins, rest] = timeStr.split(':');
                        const [secs, millis] = rest.split('.');
                        const total = parseInt(mins) * 60000 + parseInt(secs) * 1000 + parseInt(millis);
                        if (!isNaN(total)) {
                            totalMs += total;
                            validCount++;
                        }
                    }
                });

                if (validCount > 0) {
                    const avgMs = Math.floor(totalMs / validCount);
                    const finalMs = avgMs + (Math.floor(Math.random() * 200) - 100); 
                    
                    const date = new Date(finalMs);
                    const formattedMins = date.getUTCMinutes();
                    const formattedSecs = date.getUTCSeconds().toString().padStart(2, '0');
                    const formattedMillis = date.getUTCMilliseconds().toString().padStart(3, '0');

                    return [
                        formattedMins,
                        parseInt(formattedSecs[0]),
                        parseInt(formattedSecs[1]),
                        parseInt(formattedMillis[0]),
                        parseInt(formattedMillis[1]),
                        parseInt(formattedMillis[2])
                    ];
                }
            }
            
            return [m, s1, s2, ms1, ms2, ms3];
        } catch (e) {
            return [1, Math.floor(Math.random() * 2) + 2, Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
        } finally {
            setIsAutoLoading(false);
        }
    };

    return { autoTop10, autoEvo, autoH2H, autoPoletime, isAutoLoading };
};
