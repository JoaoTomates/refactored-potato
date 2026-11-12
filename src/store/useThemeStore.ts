import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontTheme = 'pitwall' | 'cyber' | 'racing' | 'wallstreet';

export const THEME_FONTS: Record<FontTheme, { display: string, body: string }> = {
    pitwall: { display: 'font-rajdhani', body: 'font-inter' },
    cyber: { display: 'font-space-grotesk', body: 'font-jetbrains' },
    racing: { display: 'font-titillium', body: 'font-titillium' },
    wallstreet: { display: 'font-montserrat', body: 'font-ibm' },
};

export type ThemeMode = 'light' | 'dark';

export type DashboardStyle = 'team' | 'standard';

export type StandardAccentColor = 'cyan' | 'platinum' | 'amber' | 'emerald';

export interface StandardAccentOption {
    id: StandardAccentColor;
    name: string;
    hex: string;
    description: string;
}

export const STANDARD_ACCENT_OPTIONS: Record<StandardAccentColor, StandardAccentOption> = {
    cyan: {
        id: 'cyan',
        name: 'Cyan Elétrico',
        hex: '#00e5ff',
        description: 'Telemetria moderna de F1 e centro de operações de dados.'
    },
    platinum: {
        id: 'platinum',
        name: 'Titânio Platina',
        hex: '#e2e8f0',
        description: 'Monocromático cirúrgico, elegante e foco total na escuderia.'
    },
    amber: {
        id: 'amber',
        name: 'Âmbar Dourado',
        hex: '#fbaa19',
        description: 'Acento clássico de aviso e contraste quente.'
    },
    emerald: {
        id: 'emerald',
        name: 'Verde Menta',
        hex: '#10b981',
        description: 'Estilo terminal HUD operacional e mercado de capitais.'
    }
};

interface ThemeState {
    theme: FontTheme;
    mode: ThemeMode;
    dashboardStyle: DashboardStyle;
    standardAccent: StandardAccentColor;
    setTheme: (theme: FontTheme) => void;
    toggleMode: () => void;
    setDashboardStyle: (style: DashboardStyle) => void;
    setStandardAccent: (accent: StandardAccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'pitwall', // default font theme
            mode: 'dark', // default visual mode
            dashboardStyle: 'team', // 'team' = identidade da equipe completa | 'standard' = equipe só à esquerda, centro/direita preto+branco+cinza+acento standard
            standardAccent: 'cyan', // Padrão recomendado: Cyan Elétrico (#00e5ff)
            setTheme: (theme) => set({ theme }),
            toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
            setDashboardStyle: (dashboardStyle) => set({ dashboardStyle }),
            setStandardAccent: (standardAccent) => set({ standardAccent }),
        }),
        {
            name: 'baeff1-theme-storage',
        }
    )
);
