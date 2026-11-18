import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { F1_MATCHUPS } from '@/api/f1-data';

interface PredictionState {
    // State
    poletime: number[];
    top10: string[];
    evo: string[];
    h2h: Record<string, string>;
    misc: Record<string, string>;
    
    // Actions
    setPoletime: (digits: number[] | ((prev: number[]) => number[])) => void;
    setTop10: (picks: string[] | ((prev: string[]) => string[])) => void;
    setEvo: (drivers: string[] | ((prev: string[]) => string[])) => void;
    setH2H: (picks: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    setMisc: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

// Migração automática de chave legada do localStorage
if (typeof window !== 'undefined') {
    try {
        const legacyPredictions = localStorage.getItem('baeff1-predictions-storage');
        if (legacyPredictions && !localStorage.getItem('ts1-predictions-storage')) {
            localStorage.setItem('ts1-predictions-storage', legacyPredictions);
            localStorage.removeItem('baeff1-predictions-storage');
        }
    } catch {
        // Ignora erros de storage
    }
}

// Initial defaults
const initialH2H = F1_MATCHUPS.reduce((acc, m) => {
    acc[m.id] = m.defaultPick;
    return acc;
}, {} as Record<string, string>);

export const usePredictionStore = create<PredictionState>()(
    persist(
        (set) => ({
            poletime: [0, 0, 0, 0, 0, 0],
            top10: Array(10).fill(''),
            evo: Array(5).fill(''),
            h2h: initialH2H,
            misc: {},
            
            setPoletime: (updater) => set((state) => ({ 
                poletime: typeof updater === 'function' ? updater(state.poletime) : updater 
            })),
            setTop10: (updater) => set((state) => ({ 
                top10: typeof updater === 'function' ? updater(state.top10) : updater 
            })),
            setEvo: (updater) => set((state) => ({ 
                evo: typeof updater === 'function' ? updater(state.evo) : updater 
            })),
            setH2H: (updater) => set((state) => ({ 
                h2h: typeof updater === 'function' ? updater(state.h2h) : updater 
            })),
            setMisc: (updater) => set((state) => ({ 
                misc: typeof updater === 'function' ? updater(state.misc) : updater 
            })),
        }),
        {
            name: 'ts1-predictions-storage', // key in localStorage
            version: 1, // bump version to clear old cached data (like the 1:25.000 poletime)
        }
    )
);
