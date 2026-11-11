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

interface ThemeState {
    theme: FontTheme;
    mode: ThemeMode;
    dashboardStyle: DashboardStyle;
    setTheme: (theme: FontTheme) => void;
    toggleMode: () => void;
    setDashboardStyle: (style: DashboardStyle) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'pitwall', // default font theme
            mode: 'dark', // default visual mode
            dashboardStyle: 'team', // 'team' = identidade da equipe completa | 'standard' = equipe só à esquerda, centro/direita preto+branco+cinza+amarelo
            setTheme: (theme) => set({ theme }),
            toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
            setDashboardStyle: (dashboardStyle) => set({ dashboardStyle }),
        }),
        {
            name: 'baeff1-theme-storage',
        }
    )
);
