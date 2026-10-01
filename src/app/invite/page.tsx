"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


const LOGOS: Record<string, string> = {
    MCL: "https://upload.wikimedia.org/wikipedia/en/thumb/6/66/McLaren_Racing_logo.svg/320px-McLaren_Racing_logo.svg.png",
    MER: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/320px-Mercedes_AMG_Petronas_F1_Logo.svg.png",
    WIL: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Williams_Racing_2024_logo.svg/320px-Williams_Racing_2024_logo.svg.png",
    AST: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/Aston_Martin_Aramco_Cognizant_F1.svg/320px-Aston_Martin_Aramco_Cognizant_F1.svg.png",
    ALP: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Alpine_F1_Team_Logo.svg/320px-Alpine_F1_Team_Logo.svg.png",
    FER: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Scuderia_Ferrari_Logo.svg/320px-Scuderia_Ferrari_Logo.svg.png",
    HAA: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Haas_F1_Team_logo.svg/320px-Haas_F1_Team_logo.svg.png",
    AUD: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Audi_logo_2016.svg/320px-Audi_logo_2016.svg.png",
    CAD: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Cadillac_logo_2021.svg/320px-Cadillac_logo_2021.svg.png",
    RBR: "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Red_Bull_Racing_logo.svg/320px-Red_Bull_Racing_logo.svg.png",
    RBA: "https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Visa_Cash_App_RB_F1_Team_logo.svg/320px-Visa_Cash_App_RB_F1_Team_logo.svg.png"
};

const LogoBadge = ({ code }: { code: string }) => (
    <div className="bg-white rounded-md p-1.5 w-12 h-8 flex items-center justify-center shrink-0 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
        <img src={LOGOS[code]} alt={code} className="max-w-full max-h-full object-contain" />
    </div>
);

const DIALOG_LINES = [
    { text: "HELLO, OBSERVER. WE HAVE BEEN WATCHING YOU FOR A WHILE. YOUR PREDICTIONS FOR THE GRID HAVE CAUGHT OUR EYE." },
    { text: "BUT GUESSING THE PODIUM IS ONE THING. LUCK ALONE IS NOT ENOUGH TO SUCCEED IN THIS PADDOCK." },
    { text: "YOU HAVE SHOWN A GREAT STRATEGIC MINDSET. BUT TO TRULY CONQUER THE APEX, YOU MUST ALIGN WITH A TEAM." }
];

export default function InvitePage() {
    const router = useRouter();
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const currentLine = DIALOG_LINES[dialogIndex];

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
        }, 40);

        return () => clearInterval(interval);
    }, [dialogIndex]);

    const handleNextDialog = () => {
        if (showOptions) return;
        
        if (isTyping) {
            setTypedText(currentLine.text);
            setIsTyping(false);
        } else {
            if (dialogIndex < DIALOG_LINES.length) {
                setDialogIndex(prev => prev + 1);
            }
        }
    };

    const handleSelectGroup = (groupId: number) => {
        // Armazena o grupo escolhido localmente para o "guest dashboard"
        localStorage.setItem('voltgrid_guest_group', groupId.toString());
        router.push('/invite/dashboard');
    };

    return (
        <main 
            className="w-full h-screen relative bg-black overflow-hidden select-none cursor-pointer flex flex-col justify-end pb-12 md:pb-24 font-rajdhani" 
            onClick={!showOptions ? handleNextDialog : undefined}
        >
            {/* Pixel Art Background V2 (VoltGrid Mature) */}
            <div 
                className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-[10s] ease-out scale-100 opacity-60 md:opacity-80`}
                style={{ 
                    backgroundImage: 'url("/pixel_invite_bg_v2.jpg")',
                    imageRendering: 'pixelated'
                }}
            ></div>

            {/* CRT Overlay Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90"></div>
            
            {/* Main Content Area (Restricted Width) */}
            <div className="relative z-10 w-full max-w-xl mx-auto px-4 flex flex-col justify-end h-full mb-12">
                
                {/* Dialog Box */}
                {dialogIndex < DIALOG_LINES.length && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#fbaa19]"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#fbaa19]"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#fbaa19]"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#fbaa19]"></div>

                        <p className="text-[#fbaa19] text-lg md:text-xl font-bold tracking-widest leading-relaxed min-h-[100px] uppercase">
                            {typedText}
                            <span className="inline-block w-2 h-5 bg-[#fbaa19] ml-2 animate-pulse align-middle"></span>
                        </p>
                        
                        {!isTyping && (
                            <div className="absolute bottom-3 right-4 text-[#fbaa19]/60 text-xs tracking-widest animate-bounce">
                                ▼ CLICK TO CONTINUE
                            </div>
                        )}
                    </div>
                )}

                {/* Options UI - Renders after text */}
                {showOptions && (
                    <div className="w-full flex flex-col gap-4 animate-fade-in mt-4">
                        <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 text-center shadow-[0_0_40px_rgba(251,170,25,0.15)]">
                            <h3 className="text-[#fbaa19] font-black text-xl md:text-2xl uppercase tracking-widest mb-2">CHOOSE YOUR ALLIANCE</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Select a technical partnership group to receive contract offers.</p>
                            
                            <div className="grid grid-cols-1 gap-3">
                                                                <button 
                                    onClick={() => handleSelectGroup(1)}
                                    className="w-full bg-[#111] border border-white/10 hover:border-[#fbaa19] hover:bg-[#fbaa19]/10 text-white p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4 group"
                                >
                                    <span className="uppercase tracking-widest font-bold text-sm md:text-base group-hover:text-[#fbaa19] transition-colors">Alliance 1</span>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <LogoBadge code="MCL" />
                                        <LogoBadge code="MER" />
                                        <LogoBadge code="WIL" />
                                        <LogoBadge code="AST" />
                                        <LogoBadge code="ALP" />
                                    </div>
                                </button>
                                                                <button 
                                    onClick={() => handleSelectGroup(2)}
                                    className="w-full bg-[#111] border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-white p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4 group"
                                >
                                    <span className="uppercase tracking-widest font-bold text-sm md:text-base group-hover:text-red-500 transition-colors">Alliance 2</span>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <LogoBadge code="FER" />
                                        <LogoBadge code="HAA" />
                                        <LogoBadge code="AUD" />
                                        <LogoBadge code="CAD" />
                                    </div>
                                </button>
                                                                <button 
                                    onClick={() => handleSelectGroup(3)}
                                    className="w-full bg-[#111] border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 text-white p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4 group"
                                >
                                    <span className="uppercase tracking-widest font-bold text-sm md:text-base group-hover:text-blue-500 transition-colors">Alliance 3</span>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <LogoBadge code="RBR" />
                                        <LogoBadge code="RBA" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
