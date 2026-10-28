"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import DangerZoneDeleteAccount from '@/components/danger-zone-delete-account';
import { SENIOR_STRATEGISTS } from '@/lib/race-directors';

export default function SetupForm() {
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    
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
            let slug = currentProfile?.slug;
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
                // e.g. "Ayrton Senna" -> "a.senna99"
                const firstInitial = cleanFirst.charAt(0).toLowerCase().replace(/[^a-z0-9]/g, '');
                const lastName = cleanLast.toLowerCase().replace(/[^a-z0-9]/g, '');
                slug = `@${firstInitial}${lastName}${driverNumber}`;
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
            <div className="w-full max-w-2xl bg-black dark:bg-[#1a1a1a] border border-[#fbaa19]/20 p-8 flex justify-center items-center h-64 animate-fade-in">
                <div className="animate-pulse text-[#fbaa19] font-bold tracking-widest uppercase">
                    LOADING SETUP...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl bg-white dark:bg-black border border-black/20 dark:border-[#ffffff3d] shadow-2xl animate-fade-in">
            <header className="bg-black text-[#fbaa19] border-b-4 border-[#fbaa19] p-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest font-display">Driver Setup</h2>
                <p className="text-sm md:text-base text-gray-400 mt-2 font-medium tracking-wide">
                    Configure your official driver details. These will be used by our AI to generate your provisional avatar.
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
                <div className="mt-4 p-6 border border-dashed border-black/30 dark:border-white/30 flex flex-col items-center justify-center gap-4 relative">
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
                    className="mt-6 w-full bg-[#fbaa19] text-black border-2 border-[#fbaa19] px-6 py-4 font-black uppercase tracking-widest text-lg transition-colors hover:bg-black hover:text-[#fbaa19] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'SAVING...' : success ? 'SAVED!' : 'SAVE PROFILE'}
                </button>
            </form>

            {/* ZONA DE RISCO: EXCLUIR CONTA */}
            <DangerZoneDeleteAccount />
        </div>
    );
}
