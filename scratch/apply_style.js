const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Replace TypewriterLine
const oldTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext }: { text: string, onComplete?: () => void, onReadyForNext?: () => void }) {
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

const newTypewriter = `function TypewriterLine({ text, onComplete, onReadyForNext }: { text: string, onComplete?: () => void, onReadyForNext?: () => void }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    
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
                
                // organic typing speed (slower)
                let delay = 50 + Math.random() * 30; // 50-80ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 600;
                else if (char === ',') delay = 300;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (onReadyForNext) onReadyForNext();
                if (onComplete) {
                    setTimeout(onComplete, 1500); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, 300); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, onComplete, onReadyForNext]);
    
    return (
        <span className="opacity-90 leading-relaxed relative">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}`;

content = content.replace(oldTypewriter, newTypewriter);

// 2. Add ref state to InviteFlow
const oldState = `    const [typingComplete, setTypingComplete] = useState(false);
    
    const [teams, setTeams] = useState<any[]>([]);`;
const newState = `    const [typingComplete, setTypingComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (step === 'DIALOG' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step]);
    
    const [teams, setTeams] = useState<any[]>([]);`;

content = content.replace(oldState, newState);

// 3. Replace DIALOG render block
const oldDialog = `                {step === 'DIALOG' && (
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

const newDialog = `                {step === 'DIALOG' && (
                    <div className="w-full flex flex-col gap-6 relative">
                        {dict.dialog.slice(0, dialogIndex + 1).map((text, i) => {
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
                                                onReadyForNext={() => {
                                                    if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 1500); 
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setStep('GROUP_SELECT') : undefined}
                                            />
                                        ) : (
                                            <span className="opacity-70">{text}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}`;

content = content.replace(oldDialog, newDialog);

// 4. Update the main tag overflow
const oldMain = `<main className="w-full min-h-screen relative bg-black overflow-hidden select-none flex flex-col font-rajdhani pt-12 md:pt-20">`;
const newMain = `<main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-rajdhani pt-12 md:pt-20">`;

content = content.replace(oldMain, newMain);

fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
console.log('Done');
