const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

const oldDialogLoop = `{dict.dialog.slice(0, dialogIndex + 1).map((text, i) => {
                            const isLastInSequence = i === dict.dialog.length - 1;
                            const isCurrent = i === dialogIndex;
                            return (
                                <div key={i} className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        {isCurrent ? "INCOMING TRANSMISSION..." : "TRANSMISSION SECURED."}
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        {isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                startDelay={i === 0 ? 1500 : 500} 
                                                onReadyForNext={() => {
                                                    if (i === 0 || i === 3) {
                                                        setWaitingForClick(true);
                                                    } else if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 2500); 
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setShowGroups(true) : undefined}
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
                                                className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                            >
                                                [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}`;

const newDialogLoop = `
                        {(() => {
                            const startIndex = dialogIndex >= 3 ? 3 : 0;
                            const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                            
                            return visibleDialogs.map((text, idx) => {
                                const i = startIndex + idx;
                                const isLastInSequence = i === dict.dialog.length - 1;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <div key={i} className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                            {isCurrent ? "INCOMING TRANSMISSION..." : "TRANSMISSION SECURED."}
                                        </p>
                                        <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
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
                                                    className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                                >
                                                    [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}`;

if (c.includes(oldDialogLoop)) {
    c = c.replace(oldDialogLoop, newDialogLoop);
    fs.writeFileSync('src/app/invite2/page.tsx', c);
    console.log('Dialog logic updated correctly.');
} else {
    console.log('Could not find old dialog loop to replace!');
}
