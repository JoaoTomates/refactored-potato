"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import DangerZoneDeleteAccount from '@/components/danger-zone-delete-account';
import { SENIOR_STRATEGISTS } from '@/lib/race-directors';
import { useThemeStore, FontTheme, DashboardStyle } from '@/store/useThemeStore';

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

export default function SetupForm() {
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    // Theme store hooks for Settings
    const activeTheme = useThemeStore(state => state.theme);
    const setTheme = useThemeStore(state => state.setTheme);
    const mode = useThemeStore(state => state.mode);
    const toggleMode = useThemeStore(state => state.toggleMode);
    const dashboardStyle = useThemeStore(state => state.dashboardStyle);
    const setDashboardStyle = useThemeStore(state => state.setDashboardStyle);

    // Prevent hydration mismatch for client-only theme storage
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, []);
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        nationality: '',
        org_color: ''
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, nationality, org_color, avatar_url, driver_number, slug')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    setFormData({
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        nationality: data.nationality || '',
                        org_color: data.org_color || '#fbaa19'
                    });
                    if (data.avatar_url) {
                        setAvatarUrl(data.avatar_url);
                    }
                }
            } catch (err) {
                console.error("Error fetching profile for setup:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const isValidNamePart = (val: string) => {
        const trimmed = val.trim();
        return trimmed.length >= 2 && /^[\p{L}'-]+$/u.test(trimmed);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Auto-split if user types full name in first_name
        if (name === 'first_name' && value.includes(' ') && !formData.last_name) {
            const parts = value.trim().split(/\s+/);
            if (parts.length >= 2) {
                setFormData(prev => ({
                    ...prev,
                    first_name: parts[0],
                    last_name: parts.slice(1).join(' ')
                }));
                return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const cleanFirst = formData.first_name.trim();
        const cleanLast = formData.last_name.trim();

        if (!isValidNamePart(cleanFirst)) {
            alert("Nome inválido: O primeiro nome deve conter pelo menos 2 letras (sem números).");
            return;
        }

        if (!isValidNamePart(cleanLast)) {
            alert("Sobrenome obrigatório: Para a Superlicença Oficial, é obrigatório preencher nome e sobrenome válidos (mínimo de 2 letras).");
            return;
        }
        
        setSaving(true);
        setSuccess(false);

        try {
            // Fetch existing profile to check if we already have a slug/number/senior_strategist
            const { data: currentProfile } = await supabase.from('profiles').select('driver_number, slug, senior_strategist_id').eq('id', user.id).single();
            
            let driverNumber = currentProfile?.driver_number;
            let slug = currentProfile?.slug ? currentProfile.slug.toLowerCase() : null;
            let seniorStrategistId = currentProfile?.senior_strategist_id;
            
            if (!driverNumber) {
                // Temporary logic: assign a random number between 23 and 99
                driverNumber = Math.floor(Math.random() * (99 - 23 + 1)) + 23;
            }
            if (!seniorStrategistId) {
                const randomStrategist = SENIOR_STRATEGISTS[Math.floor(Math.random() * SENIOR_STRATEGISTS.length)];
                seniorStrategistId = randomStrategist.id;
            }
            if (!slug && cleanFirst && cleanLast) {
                // Golden Rule (exibição): "L.GUSTAVO88" | Slug (URL/Banco): 100% minúsculo ("l.gustavo88")
                const firstInitial = cleanFirst.charAt(0).toUpperCase().replace(/[^A-Z0-9]/g, '');
                const lastName = cleanLast.toUpperCase().replace(/[^A-Z0-9]/g, '');
                slug = `${firstInitial}.${lastName}${driverNumber}`.toLowerCase();
            }

            const formattedFirstName = cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase();
            const formattedLastName = cleanLast.toUpperCase();

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    first_name: formattedFirstName,
                    last_name: formattedLastName,
                    nationality: formData.nationality,
                    org_color: formData.org_color,
                    driver_number: driverNumber,
                    slug: slug,
                    senior_strategist_id: seniorStrategistId
                })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Trigger AI Generation if fields exist
            if (formData.first_name && formData.nationality) {
                setGeneratingAvatar(true);
                setAiError(null);
                
                try {
                    const res = await fetch('/api/generate-avatar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            firstName: formData.first_name,
                            lastName: formData.last_name,
                            nationality: formData.nationality,
                            orgColorRef: formData.org_color
                        })
                    });
                    
                    const resData = await res.json();
                    
                    if (!res.ok) {
                        throw new Error(resData.error || 'Failed to generate AI avatar');
                    }
                    
                    if (resData.imageUrl) {
                        // First show the generated image immediately
                        setAvatarUrl(resData.imageUrl);
                        
                        try {
                            // 1. Download the image blob from Pollinations
                            const imgRes = await fetch(resData.imageUrl);
                            const imgBlob = await imgRes.blob();
                            
                            // 2. Upload to Supabase Storage
                            const fileName = `${user.id}-${Date.now()}.jpg`;
                            const { error: uploadError } = await supabase.storage
                                .from('avatars')
                                .upload(fileName, imgBlob, {
                                    contentType: 'image/jpeg',
                                    upsert: true
                                });
                                
                            if (uploadError) throw uploadError;
                            
                            // 3. Get the public URL
                            const { data: publicUrlData } = supabase.storage
                                .from('avatars')
                                .getPublicUrl(fileName);
                                
                            const finalAvatarUrl = publicUrlData.publicUrl;
                            
                            // Update local state with the permanent URL
                            setAvatarUrl(finalAvatarUrl);
                            
                            // 4. Save the permanent Supabase URL to the profile
                            const { error: updateError } = await supabase
                                .from('profiles')
                                .update({ avatar_url: finalAvatarUrl })
                                .eq('id', user.id);
                                
                            if (updateError) throw updateError;
                            
                            console.log("Avatar successfully uploaded and saved to Supabase Storage!");
                        } catch (storageErr: any) {
                            console.error("Storage upload error:", storageErr);
                            setAiError("Failed to upload image to Supabase Storage.");
                        }
                    }
                } catch (genErr: any) {
                    console.error('Avatar generation error:', genErr);
                    setAiError(genErr.message);
                } finally {
                    setGeneratingAvatar(false);
                }
            }

        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Error saving your profile details.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-black border border-[#fbaa19]/20 p-8 flex justify-center items-center h-64 animate-fade-in">
                <div className="animate-pulse text-[#fbaa19] font-bold tracking-widest uppercase">
                    LOADING SETUP...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            {/* LADO ESQUERDO: STRATEGIST SETUP FORM */}
            <div className="lg:col-span-6 flex flex-col bg-white dark:bg-black border border-black/20 dark:border-[#ffffff3d] shadow-2xl overflow-hidden rounded-[3px]">
                <header className="bg-black text-[#fbaa19] border-b-4 border-[#fbaa19] p-6">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest font-display">Strategist Setup</h2>
                    <p className="text-sm md:text-base text-gray-400 mt-2 font-medium tracking-wide">
                        Configure your official strategist credentials for your team and assigned F1 driver.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="first_name" className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                <span>First Name *</span>
                                {formData.first_name.trim() && (
                                    <span className={isValidNamePart(formData.first_name) ? "text-emerald-500 text-[10px]" : "text-amber-500 text-[10px]"}>
                                        {isValidNamePart(formData.first_name) ? "✓ Valid" : "Min. 2 letters"}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                className={`bg-black/5 dark:bg-white/5 border p-3 text-black dark:text-white uppercase font-bold tracking-wider focus:outline-none transition-colors ${
                                    formData.first_name.trim()
                                        ? isValidNamePart(formData.first_name) ? "border-emerald-500/50 focus:border-emerald-500" : "border-amber-500/60 focus:border-amber-500"
                                        : "border-black/20 dark:border-white/20 focus:border-[#fbaa19]"
                                }`}
                                placeholder="Ayrton"
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="last_name" className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                <span>Last Name *</span>
                                {formData.last_name.trim() && (
                                    <span className={isValidNamePart(formData.last_name) ? "text-emerald-500 text-[10px]" : "text-amber-500 text-[10px]"}>
                                        {isValidNamePart(formData.last_name) ? "✓ Valid" : "Min. 2 letters"}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                className={`bg-black/5 dark:bg-white/5 border p-3 text-black dark:text-white uppercase font-bold tracking-wider focus:outline-none transition-colors ${
                                    formData.last_name.trim()
                                        ? isValidNamePart(formData.last_name) ? "border-emerald-500/50 focus:border-emerald-500" : "border-amber-500/60 focus:border-amber-500"
                                        : "border-black/20 dark:border-white/20 focus:border-[#fbaa19]"
                                }`}
                                placeholder="Senna"
                            />
                        </div>
                    </div>

                    {(!isValidNamePart(formData.first_name) || !isValidNamePart(formData.last_name)) && (
                        <p className="text-[11px] text-amber-500/90 font-mono flex items-center gap-1.5 -mt-2">
                            <span>⚠</span>
                            <span>Superlicense registration requires two distinct names (Valid First and Last name).</span>
                        </p>
                    )}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="nationality" className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            Nationality
                        </label>
                        <input
                            type="text"
                            id="nationality"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            required
                            className="bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 p-3 text-black dark:text-white uppercase font-bold tracking-wider focus:outline-none focus:border-[#fbaa19] transition-colors"
                            placeholder="Brazilian"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="org_color" className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            Organization Color Reference (Optional)
                        </label>
                        <input
                            type="text"
                            id="org_color"
                            name="org_color"
                            value={formData.org_color}
                            onChange={handleChange}
                            className="bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 p-3 text-black dark:text-white uppercase font-bold tracking-wider focus:outline-none focus:border-[#fbaa19] transition-colors"
                            placeholder="e.g. Fluminense, Ferrari, Cyberpunk"
                        />
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                            Our AI will mix this reference (70%) with your nationality colors (30%) to generate your avatar.
                        </p>
                    </div>

                    {/* AI Avatar Preview */}
                    <div className="mt-2 p-6 border border-dashed border-black/30 dark:border-white/30 flex flex-col items-center justify-center gap-4 relative">
                        <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Driver Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                            
                            <img 
                                src="/avatar-overlay.png" 
                                alt="Avatar Frame Overlay" 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.05]"
                            />

                            {generatingAvatar && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
                                    <div className="w-8 h-8 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                                </div>
                            )}
                        </div>
                        
                        {generatingAvatar ? (
                            <p className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] text-center max-w-sm">
                                AI is generating your avatar...
                            </p>
                        ) : avatarUrl ? (
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 text-center max-w-sm">
                                Your provisional AI Avatar
                            </p>
                        ) : null}
                        
                        {aiError && (
                            <p className="text-xs font-bold uppercase tracking-widest text-red-500 text-center bg-red-500/10 p-2 border border-red-500/30">
                                {aiError}
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={saving}
                        className="mt-4 w-full bg-[#fbaa19] text-black border-2 border-[#fbaa19] px-6 py-4 font-black uppercase tracking-widest text-lg transition-colors hover:bg-black hover:text-[#fbaa19] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {saving ? 'SAVING...' : success ? 'SAVED!' : 'SAVE PROFILE'}
                    </button>
                </form>
            </div>

            {/* LADO DIREITO: SETTINGS (UI CONFIGURATOR, ESTILO DO DASHBOARD, TIPOGRAFIA E EXCLUIR CONTA) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-white dark:bg-black border border-black/20 dark:border-[#ffffff3d] shadow-2xl overflow-hidden rounded-[3px] p-6 md:p-8">
                    <header className="border-b border-black/20 dark:border-[#ffffff3d] pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-1 font-display">System Settings</p>
                            <h2 className="text-black dark:text-white text-2xl md:text-3xl font-black uppercase tracking-wider font-display">UI Configurator</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
                                Customize your BAEFF1 terminal appearance and visual ergonomics.
                            </p>
                        </div>
                        {mounted && (
                            <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] p-2 pr-4 rounded-full border border-black/20 dark:border-[#ffffff3d] shadow-sm shrink-0 self-start">
                                <button 
                                    type="button"
                                    onClick={toggleMode}
                                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${mode === 'dark' ? 'bg-[#fbaa19]' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${mode === 'dark' ? 'left-7' : 'left-1'}`} />
                                </button>
                                <span className="text-black dark:text-white font-bold uppercase tracking-wider text-xs font-display">
                                    {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </span>
                            </div>
                        )}
                    </header>

                    {/* ESTILO VISUAL DO DASHBOARD */}
                    <section className="my-6">
                        <div className="mb-3">
                            <p className="text-[#fbaa19] text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 font-display">
                                Dashboard Visual Mode
                            </p>
                            <h3 className="text-black dark:text-white text-lg font-black uppercase tracking-wider font-display">
                                Estilo do Dashboard
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {DASHBOARD_STYLE_OPTIONS.map((opt) => {
                                const isSelected = mounted && dashboardStyle === opt.id;
                                const isStandard = opt.id === 'standard';

                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setDashboardStyle(opt.id)}
                                        className={`relative text-left cursor-pointer flex flex-col bg-gray-50 dark:bg-[#0a0a0a] border-2 transition-all duration-300 overflow-hidden p-4 gap-3 ${
                                            isSelected
                                                ? 'border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.2)]'
                                                : 'border-black/10 dark:border-[#ffffff1a] hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#fbaa19]/15 text-[#fbaa19] border border-[#fbaa19]/30 mb-1">
                                                    {opt.badge}
                                                </span>
                                                <h4 className="text-base font-black text-black dark:text-white uppercase tracking-wider font-display">
                                                    {opt.name}
                                                </h4>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected ? 'border-[#fbaa19] bg-[#fbaa19]' : 'border-gray-600'
                                                }`}
                                            >
                                                {isSelected && <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                            {opt.desc}
                                        </p>

                                        {/* Mini Layout Preview */}
                                        <div className="grid grid-cols-12 gap-1.5 p-2 rounded bg-black border border-white/10">
                                            <div className="col-span-3 rounded border border-[#DC0000]/60 bg-[#DC0000]/15 p-1.5 flex flex-col gap-1">
                                                <span className="h-1 w-6 rounded bg-[#DC0000]" />
                                                <span className="h-4 w-full rounded bg-black/70 border border-[#DC0000]/40" />
                                            </div>
                                            <div
                                                className={`col-span-6 rounded p-1.5 flex flex-col gap-1 border ${
                                                    isStandard
                                                        ? 'border-white/15 bg-black'
                                                        : 'border-[#DC0000]/50 bg-[#DC0000]/10'
                                                }`}
                                            >
                                                <div className="grid grid-cols-4 gap-1">
                                                    {[0, 1, 2, 3].map((idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`h-2 rounded border ${
                                                                isStandard
                                                                    ? 'bg-black border-white/15'
                                                                    : 'bg-[#DC0000]/20 border-[#DC0000]/40'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span
                                                    className={`h-3 w-full rounded border ${
                                                        isStandard
                                                            ? 'bg-black border-[#fbaa19]/40'
                                                            : 'bg-black/60 border-[#DC0000]/40'
                                                    }`}
                                                />
                                            </div>
                                            <div
                                                className={`col-span-3 rounded p-1.5 flex flex-col gap-1 border ${
                                                    isStandard
                                                        ? 'border-white/15 bg-black'
                                                        : 'border-[#DC0000]/50 bg-[#DC0000]/10'
                                                }`}
                                            >
                                                <span
                                                    className={`h-1 w-6 rounded ${
                                                        isStandard ? 'bg-[#fbaa19]' : 'bg-[#DC0000]'
                                                    }`}
                                                />
                                                <span className="h-4 w-full rounded bg-white/5 border border-white/10" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* TIPOGRAFIA */}
                    <section className="mt-8">
                        <div className="mb-3">
                            <p className="text-[#fbaa19] text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 font-display">
                                Typography Engine
                            </p>
                            <h3 className="text-black dark:text-white text-lg font-black uppercase tracking-wider font-display">
                                Tipografia do Terminal
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isSelected ? 'border-[#fbaa19] bg-[#fbaa19]' : 'border-gray-600'
                                        }`}>
                                            {isSelected && <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />}
                                        </div>

                                        <div className="p-4 border-b border-black/10 dark:border-[#ffffff1a] bg-gray-100 dark:bg-[#111]">
                                            <h4 
                                                className="text-lg font-bold text-black dark:text-white uppercase tracking-wider mb-1 pr-6"
                                                style={{ fontFamily: displayFont }}
                                            >
                                                {themeOption.name}
                                            </h4>
                                            <p 
                                                className="text-gray-600 dark:text-gray-400 text-xs"
                                                style={{ fontFamily: bodyFont }}
                                            >
                                                {themeOption.desc}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-white dark:bg-black relative" style={{ fontFamily: bodyFont }}>
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: displayFont }}>Current Pick</p>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-lg font-black text-black dark:text-white" style={{ fontFamily: displayFont }}>M.VERSTAPPEN</span>
                                                        <span className="text-[#fbaa19] text-xs font-bold" style={{ fontFamily: displayFont }}>#01</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[#00ff88] text-sm font-bold">+2.45%</p>
                                                    <p className="text-gray-500 text-[10px]">VOL 1.2M</p>
                                                </div>
                                            </div>

                                            <div className="w-full border border-black/10 dark:border-[#ffffff1a] rounded-sm overflow-hidden text-xs">
                                                <div className="grid grid-cols-4 bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 uppercase text-[9px] tracking-wider p-1.5 border-b border-black/10 dark:border-[#ffffff1a]" style={{ fontFamily: displayFont }}>
                                                    <div className="col-span-2">Asset</div>
                                                    <div className="text-right">Price</div>
                                                    <div className="text-right">24H</div>
                                                </div>
                                                <div className="grid grid-cols-4 text-black dark:text-white p-1.5 border-b border-black/10 dark:border-[#ffffff1a] items-center text-[10px]">
                                                    <div className="col-span-2 font-medium">L.NORRIS</div>
                                                    <div className="text-right font-mono">145.20</div>
                                                    <div className="text-right text-[#00ff88] font-mono">+1.2%</div>
                                                </div>
                                                <div className="grid grid-cols-4 text-black dark:text-white p-1.5 items-center bg-gray-100 dark:bg-[#111]/30 text-[10px]">
                                                    <div className="col-span-2 font-medium">C.LECLERC</div>
                                                    <div className="text-right font-mono">132.85</div>
                                                    <div className="text-right text-[#ff3333] font-mono">-0.8%</div>
                                                </div>
                                            </div>
                                            
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#fbaa19]/10 to-transparent pointer-events-none" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* ZONA DE RISCO: EXCLUIR CONTA */}
                <DangerZoneDeleteAccount />
            </div>
        </div>
    );
}
