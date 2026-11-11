"use client";
import React from 'react';
import { useThemeStore, FontTheme, DashboardStyle, THEME_FONTS } from '@/store/useThemeStore';
import DangerZoneDeleteAccount from '@/components/danger-zone-delete-account';

const DASHBOARD_STYLE_OPTIONS: {
    id: DashboardStyle;
    name: string;
    badge: string;
    desc: string;
}[] = [
    {
        id: 'team',
        name: 'Identidade da Equipe',
        badge: 'TEAM',
        desc: 'As cores oficiais da sua escuderia são aplicadas em todo o dashboard (esquerda, centro e direita).'
    },
    {
        id: 'standard',
        name: 'Standard (Padrão)',
        badge: 'BLACK · GOLD',
        desc: 'Identidade da equipe apenas na coluna esquerda (avatar/credencial). Centro e direita em preto predominante com fontes branca, cinza e amarela.'
    }
];

const THEME_OPTIONS: { id: FontTheme; name: string; desc: string }[] = [
    { id: 'pitwall', name: 'Pitwall Telemetry', desc: 'Rajdhani & Inter. F1 telemetry meets Wall Street.' },
    { id: 'cyber', name: 'Cyber-Market', desc: 'Space Grotesk & JetBrains Mono. Modern crypto exchange vibe.' },
    { id: 'racing', name: 'Pure Racing', desc: 'Titillium Web. Aggressive, aerodynamic motorsport data.' },
    { id: 'wallstreet', name: 'Wall Street', desc: 'Montserrat & IBM Plex. Institutional, serious trading desk.' }
];

export default function Settings() {
    const activeTheme = useThemeStore(state => state.theme);
    const setTheme = useThemeStore(state => state.setTheme);
    const mode = useThemeStore(state => state.mode);
    const toggleMode = useThemeStore(state => state.toggleMode);
    const dashboardStyle = useThemeStore(state => state.dashboardStyle);
    const setDashboardStyle = useThemeStore(state => state.setDashboardStyle);
    
    // Fix hydration mismatch by rendering safely after mount
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="w-full">
            <header className="mb-12 border-b border-black/20 dark:border-[#ffffff3d] pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <p className="text-[#fbaa19] text-sm font-medium uppercase tracking-[0.2em] mb-2 font-display">System Settings</p>
                    <h1 className="text-black dark:text-white text-4xl md:text-5xl font-black uppercase tracking-wider font-display mb-4">UI Configurator</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl">
                        Customize your BAEFF1 terminal. Select a typography engine that best suits your data analysis style—from high-speed F1 telemetry to institutional stock market dashboards.
                    </p>
                </div>
                {mounted && (
                    <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] p-2 pr-4 rounded-full border border-black/20 dark:border-[#ffffff3d] shadow-sm">
                        <button 
                            onClick={toggleMode}
                            className={`w-12 h-6 rounded-full relative transition-colors ${mode === 'dark' ? 'bg-[#fbaa19]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${mode === 'dark' ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span className="text-black dark:text-white font-bold uppercase tracking-wider text-sm font-display">
                            {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </div>
                )}
            </header>

            {/* ESTILO VISUAL DO DASHBOARD (STANDARD VS IDENTIDADE DA EQUIPE) */}
            <section className="mb-12">
                <div className="mb-4">
                    <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-1 font-display">
                        Dashboard Visual Mode
                    </p>
                    <h2 className="text-black dark:text-white text-2xl font-black uppercase tracking-wider font-display">
                        Estilo do Dashboard
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DASHBOARD_STYLE_OPTIONS.map((opt) => {
                        const isSelected = mounted && dashboardStyle === opt.id;
                        const isStandard = opt.id === 'standard';

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setDashboardStyle(opt.id)}
                                className={`relative text-left cursor-pointer flex flex-col bg-gray-50 dark:bg-[#0a0a0a] border-2 transition-all duration-300 overflow-hidden p-5 gap-4 ${
                                    isSelected
                                        ? 'border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.2)]'
                                        : 'border-black/10 dark:border-[#ffffff1a] hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#fbaa19]/15 text-[#fbaa19] border border-[#fbaa19]/30 mb-2">
                                            {opt.badge}
                                        </span>
                                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-wider font-display">
                                            {opt.name}
                                        </h3>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected ? 'border-[#fbaa19] bg-[#fbaa19]' : 'border-gray-600'
                                        }`}
                                    >
                                        {isSelected && <div className="w-2.5 h-2.5 bg-white dark:bg-black rounded-full" />}
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                                    {opt.desc}
                                </p>

                                {/* Mini Layout Preview (Esquerda | Centro | Direita) */}
                                <div className="grid grid-cols-12 gap-2 p-2.5 rounded bg-black border border-white/10">
                                    <div className="col-span-3 rounded border border-[#DC0000]/60 bg-[#DC0000]/15 p-2 flex flex-col gap-1">
                                        <span className="h-1.5 w-8 rounded bg-[#DC0000]" />
                                        <span className="h-6 w-full rounded bg-black/70 border border-[#DC0000]/40" />
                                    </div>
                                    <div
                                        className={`col-span-6 rounded p-2 flex flex-col gap-1.5 border ${
                                            isStandard
                                                ? 'border-white/15 bg-black'
                                                : 'border-[#DC0000]/50 bg-[#DC0000]/10'
                                        }`}
                                    >
                                        <div className="grid grid-cols-4 gap-1">
                                            {[0, 1, 2, 3].map((idx) => (
                                                <span
                                                    key={idx}
                                                    className={`h-3 rounded border ${
                                                        isStandard
                                                            ? 'bg-black border-white/15'
                                                            : 'bg-[#DC0000]/20 border-[#DC0000]/40'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span
                                            className={`h-4 w-full rounded border ${
                                                isStandard
                                                    ? 'bg-black border-[#fbaa19]/40'
                                                    : 'bg-black/60 border-[#DC0000]/40'
                                            }`}
                                        />
                                    </div>
                                    <div
                                        className={`col-span-3 rounded p-2 flex flex-col gap-1 border ${
                                            isStandard
                                                ? 'border-white/15 bg-black'
                                                : 'border-[#DC0000]/50 bg-[#DC0000]/10'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-8 rounded ${
                                                isStandard ? 'bg-[#fbaa19]' : 'bg-[#DC0000]'
                                            }`}
                                        />
                                        <span className="h-6 w-full rounded bg-white/5 border border-white/10" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="mb-4">
                <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-1 font-display">
                    Typography Engine
                </p>
                <h2 className="text-black dark:text-white text-2xl font-black uppercase tracking-wider font-display">
                    Tipografia do Terminal
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {THEME_OPTIONS.map((themeOption) => {
                    const isSelected = activeTheme === themeOption.id;
                    const displayFont = `var(--font-${themeOption.id === 'pitwall' ? 'rajdhani' : themeOption.id === 'cyber' ? 'space-grotesk' : themeOption.id === 'racing' ? 'titillium' : 'montserrat'})`;
                    const bodyFont = `var(--font-${themeOption.id === 'pitwall' ? 'inter' : themeOption.id === 'cyber' ? 'jetbrains' : themeOption.id === 'racing' ? 'titillium' : 'ibm'})`;

                    return (
                        <div 
                            key={themeOption.id}
                            onClick={() => setTheme(themeOption.id)}
                            className={`relative cursor-pointer flex flex-col bg-gray-50 dark:bg-[#0a0a0a] border-2 transition-all duration-300 group overflow-hidden ${
                                isSelected ? 'border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.2)]' : 'border-black/10 dark:border-[#ffffff1a] hover:border-gray-500'
                            }`}
                        >
                            {/* Selection indicator */}
                            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-[#fbaa19] bg-[#fbaa19]' : 'border-gray-600'
                            }`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-white dark:bg-black rounded-full" />}
                            </div>

                            {/* Theme Details Info */}
                            <div className="p-6 border-b border-black/10 dark:border-[#ffffff1a] bg-gray-100 dark:bg-[#111]">
                                <h2 
                                    className="text-2xl font-bold text-black dark:text-white uppercase tracking-wider mb-2"
                                    style={{ fontFamily: displayFont }}
                                >
                                    {themeOption.name}
                                </h2>
                                <p 
                                    className="text-gray-600 dark:text-gray-400 text-sm"
                                    style={{ fontFamily: bodyFont }}
                                >
                                    {themeOption.desc}
                                </p>
                            </div>

                            {/* Live Preview Window */}
                            <div className="p-6 bg-white dark:bg-black relative" style={{ fontFamily: bodyFont }}>
                                {/* Fake Data Viz */}
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1" style={{ fontFamily: displayFont }}>Current Pick</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-black dark:text-white" style={{ fontFamily: displayFont }}>M.VERSTAPPEN</span>
                                            <span className="text-[#fbaa19] text-xl font-bold" style={{ fontFamily: displayFont }}>#01</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#00ff88] text-lg font-bold">+2.45%</p>
                                        <p className="text-gray-500 text-xs">VOL 1.2M</p>
                                    </div>
                                </div>

                                {/* Fake Table */}
                                <div className="w-full border border-black/10 dark:border-[#ffffff1a] rounded-sm overflow-hidden text-sm">
                                    <div className="grid grid-cols-4 bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wider p-2 border-b border-black/10 dark:border-[#ffffff1a]" style={{ fontFamily: displayFont }}>
                                        <div className="col-span-2">Asset</div>
                                        <div className="text-right">Price</div>
                                        <div className="text-right">24H</div>
                                    </div>
                                    <div className="grid grid-cols-4 text-black dark:text-white p-2 border-b border-black/10 dark:border-[#ffffff1a] items-center">
                                        <div className="col-span-2 font-medium">L.NORRIS</div>
                                        <div className="text-right font-mono">145.20</div>
                                        <div className="text-right text-[#00ff88] font-mono">+1.2%</div>
                                    </div>
                                    <div className="grid grid-cols-4 text-black dark:text-white p-2 items-center bg-gray-100 dark:bg-[#111]/30">
                                        <div className="col-span-2 font-medium">C.LECLERC</div>
                                        <div className="text-right font-mono">132.85</div>
                                        <div className="text-right text-[#ff3333] font-mono">-0.8%</div>
                                    </div>
                                </div>
                                
                                {/* Overlay glow on select */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#fbaa19]/10 to-transparent pointer-events-none" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ZONA DE RISCO: EXCLUIR CONTA */}
            <DangerZoneDeleteAccount />
        </div>
    );
}
