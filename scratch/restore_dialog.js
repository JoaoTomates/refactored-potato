const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// Inject new states
const stateInjection = `const [showBigScreen, setShowBigScreen] = useState(false);
    const phase1TimeoutRef = useRef<NodeJS.Timeout | null>(null);`;

if (!c.includes('showBigScreen')) {
    c = c.replace('const [waitingForClick, setWaitingForClick] = useState(false);', `const [waitingForClick, setWaitingForClick] = useState(false);\n    ${stateInjection}`);
}

// Replace return block
const returnRegex = /return \(\s*<main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-end pb-8 md:pb-16">[\s\S]*?\);\n\}/;

const newReturn = `return (
        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-end pb-8 md:pb-16">
            
            {/* Pixel Art Background (Fixed Jitter) */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>

            {/* Phase 1: First Box (dialogIndex === 0) */}
            {step === 'DIALOG' && !showBigScreen && (
                <div className="relative z-20 w-full max-w-xl mx-auto px-4 flex flex-col justify-end pb-12 mb-auto mt-auto">
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                            [ INCOMING SECURE TRANSMISSION ]
                        </p>
                        <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                            {dialogIndex === 0 && (
                                <TypewriterLine 
                                    text={dict.dialog[0]} 
                                    startDelay={500} 
                                    onReadyForNext={() => {
                                        setWaitingForClick(true);
                                        // Auto-advance after 4 seconds if no click
                                        if (!phase1TimeoutRef.current) {
                                            phase1TimeoutRef.current = setTimeout(() => {
                                                setShowBigScreen(true);
                                                setDialogIndex(1);
                                            }, 4000);
                                        }
                                    }} 
                                />
                            )}
                        </div>
                        {waitingForClick && (
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={() => {
                                        if (phase1TimeoutRef.current) clearTimeout(phase1TimeoutRef.current);
                                        setShowBigScreen(true);
                                        setDialogIndex(1);
                                    }}
                                    className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                >
                                    [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Phase 2: Widescreen terminal box */}
            {(step === 'DIALOG' && showBigScreen) && (
                <div 
                    className="relative z-10 w-[85%] md:w-[75%] max-w-6xl aspect-video bg-[rgba(0,0,0,0.97)] shadow-[0_50px_100px_rgba(0,0,0,1),0_80px_160px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111] cursor-pointer animate-zoom-in flex flex-col p-6 md:p-12"
                    onClick={() => {
                        if (dialogIndex < 3) {
                            setDialogIndex(prev => prev + 1);
                        }
                    }}
                >
                    <div className="w-full flex-grow flex flex-col overflow-y-auto font-mono text-[#fbaa19]">
                        {(() => {
                            const startIndex = 1;
                            const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                            
                            return visibleDialogs.map((text, idx) => {
                                const i = startIndex + idx;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <div key={i} className="mb-4">
                                        <div className="text-base md:text-xl font-bold tracking-widest">
                                            <span className="opacity-50 mr-2">&gt;_</span>
                                            {isCurrent ? (
                                                <TypewriterLine 
                                                    text={text} 
                                                    startDelay={300} 
                                                    onReadyForNext={() => {
                                                        if (i < 3) {
                                                            const pause = i === 2 ? 4500 : 2500;
                                                            setTimeout(() => {
                                                                setDialogIndex(prev => {
                                                                    if (prev === i) return prev + 1;
                                                                    return prev;
                                                                });
                                                            }, pause); 
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="opacity-80">{text}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        <div ref={messagesEndRef} className="h-4 w-full" />
                    </div>
                </div>
            )}
        </main>
    );
}`;

c = c.replace(returnRegex, newReturn);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Restored dialog flow with delayed big screen');
