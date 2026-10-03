const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// The regex matches from `{step === 'DIALOG' && (` down to the closing `)}` of the DIALOG block.
// Wait, regex for such a large block might be brittle. I'll use string replacement.

const oldDialogBlock = `{step === 'DIALOG' && (
                    <div className="w-full flex flex-col gap-2 relative">
                        
                        {(() => {
                            const startIndex = dialogIndex >= 3 ? 3 : 0;
                            const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                            
                            return visibleDialogs.map((text, idx) => {
                                const i = startIndex + idx;
                                const isLastInSequence = i === dict.dialog.length - 1;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <div key={i} className="w-full bg-transparent border-none border-none p-2 shadow-none relative animate-slide-up">
                                        
                                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                            {isCurrent ? "INCOMING TRANSMISSION..." : "TRANSMISSION SECURED."}
                                        </p>
                                        <div className="text-[#fbaa19] text-lg md:text-xl font-bold uppercase tracking-widest">
                                            {isCurrent ? (
                                                <TypewriterLine 
                                                    text={text} 
                                                    startDelay={i === 0 ? 1500 : 500} 
                                                    onReadyForNext={() => {
                                                        if (i === 0 || i === 3) {
                                                            setWaitingForClick(true);
                                                        } else if (!isLastInSequence) {
                                                            const pause = i === 2 ? 4500 : 2500;
                                                            setTimeout(() => {
                                                                setDialogIndex(prev => prev + 1);
                                                            }, pause); 
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="opacity-70">{text}</span>
                                            )}
                                        </div>
                                        
                                        {/* Inline Click to Continue for the first and fourth box */}
                                        {(i === 0 || i === 3) && waitingForClick && (
                                            <div className="mt-2 flex justify-end">
                                                <button 
                                                    onClick={() => {
                                                        setWaitingForClick(false);
                                                        if (i === 0) setDialogIndex(prev => prev + 1);
                                                        if (i === 3) setStep('GROUP_SELECT');
                                                    }}
                                                    className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-[#fbaa19] transition-colors animate-pulse flex items-center gap-2"
                                                >
                                                    Press ANY KEY to continue <span className="text-lg leading-none">»</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                        
                        
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}`;

const newDialogBlock = `{step === 'DIALOG' && (
                    <div className="w-full flex flex-col gap-2 relative h-full">
                        
                        {/* BOX 0 (Raw Terminal Text) */}
                        {dialogIndex === 0 && (
                            <div className="w-full bg-transparent p-2 animate-slide-up mt-auto mb-8">
                                <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                    INCOMING TRANSMISSION...
                                </p>
                                <div className="text-[#fbaa19] text-lg md:text-xl font-bold uppercase tracking-widest">
                                    <TypewriterLine 
                                        text={dict.dialog[0]} 
                                        startDelay={1500} 
                                        onReadyForNext={() => setWaitingForClick(true)}
                                    />
                                </div>
                                {waitingForClick && (
                                    <div className="mt-4 flex justify-end">
                                        <button 
                                            onClick={() => {
                                                setWaitingForClick(false);
                                                setDialogIndex(1);
                                            }}
                                            className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                        >
                                            Press ANY KEY to continue <span className="text-lg leading-none">»</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TERMINAL SCREEN UI (dialogIndex >= 1) */}
                        {dialogIndex >= 1 && (
                            <div className="w-full max-w-xl mx-auto mt-auto mb-8 animate-zoom-in flex flex-col items-center drop-shadow-[0_30px_30px_rgba(0,0,0,1)] z-20">
                                {/* Monitor Shell (Beige/Gray plastic) */}
                                <div className="w-full aspect-[4/3] bg-[#d4d4d8] rounded-[32px] p-4 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3),_0_30px_60px_rgba(0,0,0,0.8)] relative flex flex-col justify-center border border-white/50">
                                    
                                    {/* Monitor Inner Frame (Lead Gray "Chumbo") */}
                                    <div className="w-full h-full bg-black rounded-[20px] border-[16px] border-[#3f3f46] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,1)]">
                                        
                                        {/* Screen Glare */}
                                        <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[150%] bg-gradient-to-br from-white/10 via-white/5 to-transparent rotate-[30deg] pointer-events-none"></div>

                                        {/* CRT Screen curve shadow & scanlines */}
                                        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none z-10"></div>
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>

                                        {/* Terminal Content */}
                                        <div className="w-full h-full flex flex-col justify-center text-center relative z-20">
                                            {(() => {
                                                const startIndex = dialogIndex >= 3 ? 3 : 1;
                                                const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                                                
                                                return visibleDialogs.map((text, idx) => {
                                                    const i = startIndex + idx;
                                                    const isLastInSequence = i === dict.dialog.length - 1;
                                                    const isCurrent = i === dialogIndex;
                                                    return (
                                                        <div key={i} className="w-full bg-transparent p-2 animate-slide-up mb-2">
                                                            <div className="text-[#22c55e] text-base md:text-xl font-mono uppercase tracking-widest text-center drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                                                                {isCurrent ? (
                                                                    <TypewriterLine 
                                                                        text={text} 
                                                                        startDelay={500} 
                                                                        onReadyForNext={() => {
                                                                            if (i === 3) {
                                                                                setWaitingForClick(true);
                                                                            } else if (!isLastInSequence) {
                                                                                const pause = i === 2 ? 4500 : 2500;
                                                                                setTimeout(() => {
                                                                                    setDialogIndex(prev => prev + 1);
                                                                                }, pause); 
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span className="opacity-50">{text}</span>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Inline Click to Continue for fourth box */}
                                                            {i === 3 && waitingForClick && (
                                                                <div className="mt-6 flex justify-center">
                                                                    <button 
                                                                        onClick={() => {
                                                                            setWaitingForClick(false);
                                                                            setStep('GROUP_SELECT');
                                                                        }}
                                                                        className="text-[#22c55e] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2 bg-[#22c55e]/10 px-4 py-2 rounded border border-[#22c55e]/30"
                                                                    >
                                                                        [ PRESS ENTER ]
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* Brand / Details on the monitor bezel */}
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                                        <div className="w-6 h-0.5 bg-zinc-400"></div>
                                        <div className="w-6 h-0.5 bg-zinc-400"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}`;

if (c.includes(oldDialogBlock)) {
    c = c.replace(oldDialogBlock, newDialogBlock);
    fs.writeFileSync('src/app/invite3/page.tsx', c);
    console.log('Dialog block updated successfully.');
} else {
    console.log('Could not find old dialog block. Please check string match.');
}
