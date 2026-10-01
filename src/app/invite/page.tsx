"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DIALOG_LINES = [
    { text: "HELLO. WE HAVE BEEN WATCHING YOU FOR A WHILE... YOUR F1 PREDICTIONS CAUGHT OUR ATTENTION." },
    { text: "BUT GUESSING THE PODIUM FROM THE GRANDSTANDS IS ONE THING. SURVIVING THE PITLANE POLITICS?" },
    { text: "THAT TAKES MORE THAN JUST LUCK. IT REQUIRES COLD, CALCULATED PRECISION." },
    { text: "THE ABILITY TO READ TELEMETRY WHEN EVERYONE ELSE ONLY SEES NOISE." },
    { text: "THE GRID IS SHIFTING. WE ARE LOOKING FOR MINDS THAT CAN OUTSMART THE DATA. STEP OUT OF THE SHADOWS." },
    { text: "IT'S TIME TO PROVE YOUR WORTH AS A GRID STRATEGIST. ARE YOU READY TO MANAGE THE CHAOS?" },
];

export default function InvitePage() {
    const router = useRouter();
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [showButton, setShowButton] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const currentLine = DIALOG_LINES[dialogIndex];

    useEffect(() => {
        if (dialogIndex >= DIALOG_LINES.length) {
            setShowButton(true);
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
        }, 40); // slightly slower for dramatic effect

        return () => clearInterval(interval);
    }, [dialogIndex]);

    const handleNextDialog = () => {
        if (accepted) return;
        
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

    const handleAccept = () => {
        setAccepted(true);
        // Add a slight delay for dramatic effect before redirecting
        setTimeout(() => {
            router.push('/superlicense?mode=setup');
        }, 1000);
    };

    return (
        <main 
            className="w-full h-screen relative bg-black overflow-hidden select-none cursor-pointer flex flex-col justify-end pb-12 md:pb-24" 
            onClick={!showButton ? handleNextDialog : undefined}
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
            {/* Pixel Art Background */}
            <div 
                className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-[10s] ease-out ${accepted ? 'scale-110 opacity-20' : 'scale-100 opacity-60 md:opacity-80'}`}
                style={{ 
                    backgroundImage: 'url("/pixel_invite_bg.jpg")',
                    imageRendering: 'pixelated'
                }}
            ></div>

            {/* CRT Overlay Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient from-transparent via-black/50 to-black/90"></div>
            
            {/* Flash Effect on Accept */}
            <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-1000 ${accepted ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* Dialog Container */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
                {dialogIndex < DIALOG_LINES.length && (
                    <div className="w-full bg-black/90 border-4 border-[#33ff00] p-6 md:p-10 shadow-[0_0_30px_rgba(51,255,0,0.3)] relative">
                        {/* Blinking recording/live dot */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="text-[#33ff00] text-xs font-bold tracking-widest animate-pulse">ENC_CHANNEL_09</span>
                            <div className="w-2 h-2 bg-[#33ff00] rounded-full animate-ping"></div>
                        </div>

                        <p className="text-[#33ff00] text-lg md:text-2xl font-bold tracking-widest leading-relaxed min-h-[100px] md:min-h-[120px] uppercase drop-shadow-[0_0_8px_rgba(51,255,0,0.8)]">
                            {typedText}
                            <span className="inline-block w-3 h-6 bg-[#33ff00] ml-2 animate-pulse align-middle"></span>
                        </p>
                        
                        {!isTyping && (
                            <div className="absolute bottom-3 right-4 text-[#33ff00]/60 text-xs tracking-widest animate-bounce">
                                ▼ CLICK TO CONTINUE
                            </div>
                        )}
                    </div>
                )}

                {/* Call to Action */}
                {showButton && (
                    <div className="w-full flex justify-center animate-fade-in mt-8">
                        <button 
                            onClick={handleAccept}
                            className="bg-black border-4 border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-black hover:shadow-[0_0_50px_rgba(51,255,0,0.8)] transition-all px-12 py-6 text-xl md:text-3xl font-black tracking-[0.2em] uppercase group relative overflow-hidden"
                        >
                            <span className="relative z-10">Accept Invitation</span>
                            <div className="absolute inset-0 bg-[#33ff00]/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
