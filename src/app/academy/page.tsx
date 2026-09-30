"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const DIALOG_LINES = [
    { speaker: 'AGENT', text: "Welcome to the Paddock. We've been analyzing your recent predictions..." },
    { speaker: 'AGENT', text: "You are a brilliant strategist, but raw talent alone doesn't survive in F1." },
    { speaker: 'AGENT', text: "To gain inside access and exclusive contracts, you must align with a Constructor Alliance." },
    { speaker: 'AGENT', text: "There are 3 major powers on the grid right now. Choose wisely." },
];

export default function AcademyPage() {
    const router = useRouter();
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [saving, setSaving] = useState(false);

    const currentLine = DIALOG_LINES[dialogIndex];

    // Typewriter effect
    useEffect(() => {
        if (dialogIndex >= DIALOG_LINES.length) {
            setShowOptions(true);
            return;
        }

        setIsTyping(true);
        setTypedText('');
        let i = 0;
        
        const fullText = DIALOG_LINES[dialogIndex].text;
        const interval = setInterval(() => {
            setTypedText(fullText.substring(0, i + 1));
            i++;
            if (i === fullText.length) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [dialogIndex]);

    const handleNextDialog = () => {
        if (isTyping) {
            // Skip typing
            setTypedText(currentLine.text);
            setIsTyping(false);
        } else {
            if (dialogIndex < DIALOG_LINES.length) {
                setDialogIndex(prev => prev + 1);
            }
        }
    };

    const handleSelectAcademy = async (groupIndex: number) => {
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Save academy group to user metadata
                await supabase.auth.updateUser({
                    data: { academy_group: groupIndex }
                });
                // Also could update 'profiles' table if needed
            }
            
            // Redirect to dashboard where the draft/contract offer will happen
            // We'll use a generic /dashboard or if they have a slug, we might need to fetch it.
            // For now, redirecting to the root, which handles auth redirect to dashboard.
            
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('slug').eq('id', session.user.id).single();
                const slug = data?.slug || session.user.id;
                window.location.href = `/${slug}`;
            } else {
                window.location.href = '/';
            }

        } catch (error) {
            console.error("Error saving academy:", error);
            setSaving(false);
        }
    };

    return (
        <main className="w-full h-screen relative bg-black overflow-hidden font-rajdhani select-none" onClick={!showOptions ? handleNextDialog : undefined}>
            
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0 opacity-40 md:opacity-60 bg-cover bg-center transition-transform duration-[20s] scale-110"
                style={{ backgroundImage: 'url("/manager_office_bg.jpg")' }}
            ></div>

            {/* Scanlines / CRT Effect for retro vibe */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
            
            {/* Dark Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/90"></div>

            {/* Options UI */}
            {showOptions && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-fade-in">
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Group 1 */}
                        <button 
                            disabled={saving}
                            onClick={() => handleSelectAcademy(1)}
                            className="bg-black/80 border-2 border-white/10 hover:border-[#fbaa19] p-6 text-left flex flex-col gap-4 group transition-all hover:-translate-y-2 backdrop-blur-md relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-[#fbaa19]/0 to-[#fbaa19]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-[#fbaa19] font-black text-2xl uppercase tracking-widest font-display">Alliance 1</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">The British/French Axis</p>
                            <div className="flex flex-col gap-1 mt-4 border-t border-white/10 pt-4 text-white text-sm font-bold uppercase tracking-wider">
                                <span>McLaren</span>
                                <span>Mercedes</span>
                                <span>Williams</span>
                                <span>Aston Martin</span>
                                <span>Alpine</span>
                            </div>
                            <div className="mt-auto pt-6 text-[#fbaa19] text-xs font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                Sign Contract →
                            </div>
                        </button>

                        {/* Group 2 */}
                        <button 
                            disabled={saving}
                            onClick={() => handleSelectAcademy(2)}
                            className="bg-black/80 border-2 border-white/10 hover:border-red-500 p-6 text-left flex flex-col gap-4 group transition-all hover:-translate-y-2 backdrop-blur-md relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-red-500 font-black text-2xl uppercase tracking-widest font-display">Alliance 2</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">The Italo-German Axis</p>
                            <div className="flex flex-col gap-1 mt-4 border-t border-white/10 pt-4 text-white text-sm font-bold uppercase tracking-wider">
                                <span>Ferrari</span>
                                <span>Haas</span>
                                <span>Audi</span>
                                <span>Cadillac</span>
                            </div>
                            <div className="mt-auto pt-6 text-red-500 text-xs font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                Sign Contract →
                            </div>
                        </button>

                        {/* Group 3 */}
                        <button 
                            disabled={saving}
                            onClick={() => handleSelectAcademy(3)}
                            className="bg-black/80 border-2 border-white/10 hover:border-blue-500 p-6 text-left flex flex-col gap-4 group transition-all hover:-translate-y-2 backdrop-blur-md relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-blue-500 font-black text-2xl uppercase tracking-widest font-display">Alliance 3</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">The Energy Empire</p>
                            <div className="flex flex-col gap-1 mt-4 border-t border-white/10 pt-4 text-white text-sm font-bold uppercase tracking-wider">
                                <span>Red Bull Racing</span>
                                <span>RB VCARB</span>
                            </div>
                            <div className="mt-auto pt-6 text-blue-500 text-xs font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                Sign Contract →
                            </div>
                        </button>

                    </div>
                </div>
            )}

            {/* Dialog Box */}
            {!showOptions && dialogIndex < DIALOG_LINES.length && (
                <div className="absolute top-1/2 left-4 right-4 md:left-24 md:right-24 z-10 flex flex-col items-center -translate-y-1/2">
                    <div className="w-full max-w-4xl bg-black/80 border border-white/20 p-6 md:p-8 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#fbaa19]"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#fbaa19]"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#fbaa19]"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#fbaa19]"></div>

                        <h4 className="text-[#fbaa19] font-black text-xs md:text-sm uppercase tracking-[0.3em] mb-4">
                            {currentLine.speaker}
                        </h4>
                        <p className="text-white text-lg md:text-2xl font-bold tracking-wide leading-relaxed min-h-[80px]">
                            {typedText}
                        </p>
                        
                        {!isTyping && (
                            <div className="absolute bottom-4 right-6 text-white/50 text-[10px] uppercase tracking-widest animate-pulse">
                                Click to continue ▼
                            </div>
                        )}
                    </div>
                </div>
            )}

        </main>
    );
}
