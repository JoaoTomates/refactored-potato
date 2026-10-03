const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8');

const targetTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext }: { text: string, onComplete?: () => void, onReadyForNext?: () => void }) {
    const [displayed, setDisplayed] = useState("");
    
    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                if (onReadyForNext) onReadyForNext();
                if (onComplete) {
                    setTimeout(onComplete, 800); // 800ms delay after finishing
                }
            }
        }, 25);
        return () => clearInterval(timer);
    }, [text, onComplete, onReadyForNext]);
    
    return <span>{displayed}</span>;
}`;

const replacementTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext }: { text: string, onComplete?: () => void, onReadyForNext?: () => void }) {
    const [displayed, setDisplayed] = useState("");
    
    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;
        
        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);
                i++;
                
                // organic typing speed
                let delay = 35 + Math.random() * 20; // 35-55ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 400;
                else if (char === ',') delay = 200;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                if (onReadyForNext) onReadyForNext();
                if (onComplete) {
                    setTimeout(onComplete, 1200); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, 200); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, onComplete, onReadyForNext]);
    
    return <span className="opacity-90">{displayed}</span>;
}`;

content = content.replace(targetTypewriter, replacementTypewriter);

const targetDialog = `                {step === 'DIALOG' && (
                    <div 
                        className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative hover:bg-black transition-colors"
                        onClick={() => {
                            if (typingComplete && dialogIndex < dict.dialog.length - 1) {
                                setDialogIndex(prev => prev + 1);
                                setTypingComplete(false);
                            }
                        }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-6">INCOMING TRANSMISSION...</p>
                        
                        <div className="flex flex-col gap-4">
                            {dict.dialog.slice(0, dialogIndex + 1).map((text, i) => {
                                const isLastInSequence = i === dict.dialog.length - 1;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <p key={i} className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                                        {isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                onReadyForNext={() => setTypingComplete(true)}
                                                onComplete={isLastInSequence ? () => setStep('GROUP_SELECT') : undefined}
                                            />
                                        ) : (
                                            <span>{text}</span>
                                        )}
                                    </p>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-end h-6">
                            {typingComplete && dialogIndex < dict.dialog.length - 1 && (
                                <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.3em] animate-pulse cursor-pointer">
                                    [ CLICK TO CONTINUE ]
                                </span>
                            )}
                        </div>
                    </div>
                )}`;

const replacementDialog = `                {step === 'DIALOG' && (
                    <div 
                        className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative transition-colors"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-6">INCOMING TRANSMISSION...</p>
                        
                        <div className="flex flex-col gap-4">
                            {dict.dialog.slice(0, dialogIndex + 1).map((text, i) => {
                                const isLastInSequence = i === dict.dialog.length - 1;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <p key={i} className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed animate-fade-in">
                                        {isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                onReadyForNext={() => {
                                                    if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 1500); // 1.5s pause between sentences
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setStep('GROUP_SELECT') : undefined}
                                            />
                                        ) : (
                                            <span className="opacity-70">{text}</span>
                                        )}
                                    </p>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-end h-6">
                            <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.3em] opacity-50">
                                {dialogIndex < dict.dialog.length - 1 ? 'LISTENING...' : '...'}
                            </span>
                        </div>
                    </div>
                )}`;

content = content.replace(targetDialog, replacementDialog);
fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
