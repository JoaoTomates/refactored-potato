const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Update TypewriterLine component to accept startDelay
const typeWriterOld = `function TypewriterLine({ text, onComplete, onReadyForNext }: { text: string, onComplete?: () => void, onReadyForNext?: () => void }) {
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

const typeWriterNew = `function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
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
        
        timeoutId = setTimeout(typeNext, startDelay); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, onComplete, onReadyForNext, startDelay]);
    
    return (
        <span className="opacity-90 leading-relaxed relative">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}`;

content = content.replace(typeWriterOld, typeWriterNew);

// 2. Add showGroups state & update scroll dependencies
const stateOld = `    const [typingComplete, setTypingComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (step === 'DIALOG' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step]);`;

const stateNew = `    const [typingComplete, setTypingComplete] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (step === 'DIALOG' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step, showGroups]);`;

content = content.replace(stateOld, stateNew);

// 3. Merge Dialog & Group Select
const renderOld = `                {step === 'DIALOG' && (
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
                )}

                {step === 'GROUP_SELECT' && (
                    <div className="w-full animate-fade-in flex flex-col gap-4">
                        <div className="bg-black/80 border border-white/10 p-4 mb-2 text-center">
                            <h2 className="text-[#fbaa19] font-black uppercase tracking-widest text-lg">{dict.career_prompt}</h2>
                        </div>
                        {dict.groups.map((g: any) => (
                            <button
                                key={g.id}
                                onClick={() => handleSelectGroup(g.id)}
                                className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(251,170,25,0.15)] transition-all flex flex-col items-start relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbaa19]/10 rounded-bl-full group-hover:bg-[#fbaa19]/20 transition-colors"></div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19]">{g.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {g.teams.map((tCode: string) => (
                                        <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-white/5 border border-white/10" style={{ color: TEAM_COLORS[tCode] }}>
                                            {tCode}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-300 italic">{g.hint}</p>
                            </button>
                        ))}
                    </div>
                )}`;

const renderNew = `                {step === 'DIALOG' && (
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
                                                startDelay={i === 0 ? 1500 : 500} 
                                                onReadyForNext={() => {
                                                    if (!isLastInSequence) {
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
                                </div>
                            );
                        })}
                        
                        {showGroups && (
                            <div className="w-full animate-fade-in flex flex-col gap-4 mt-4">
                                <div className="bg-[#0a0a0a]/95 border-2 border-white/10 p-4 mb-2 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                    <h2 className="text-[#fbaa19] font-black uppercase tracking-widest text-lg">{dict.career_prompt}</h2>
                                </div>
                                {dict.groups.map((g: any) => (
                                    <button
                                        key={g.id}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(251,170,25,0.15)] transition-all flex flex-col items-start relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbaa19]/10 rounded-bl-full group-hover:bg-[#fbaa19]/20 transition-colors"></div>
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19]">{g.title}</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {g.teams.map((tCode: string) => (
                                                <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-white/5 border border-white/10" style={{ color: TEAM_COLORS[tCode] }}>
                                                    {tCode}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-300 italic">{g.hint}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}`;

content = content.replace(renderOld, renderNew);

fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
console.log('Script done.');
