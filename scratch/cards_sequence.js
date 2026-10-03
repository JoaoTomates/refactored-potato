const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Add new state hooks and useEffect
const oldStates = `    const [typingComplete, setTypingComplete] = useState(false);
        const [waitingForClick, setWaitingForClick] = useState(false);
    const [showCards, setShowCards] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);`;

const newStates = `    const [typingComplete, setTypingComplete] = useState(false);
    const [waitingForClick, setWaitingForClick] = useState(false);
    const [introVisible, setIntroVisible] = useState(true);
    const [showCards, setShowCards] = useState(false);
    const [revealedCards, setRevealedCards] = useState(0);
    const [showQuestion, setShowQuestion] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (showCards) {
            setTimeout(() => setRevealedCards(1), 800);
            setTimeout(() => setRevealedCards(2), 1600);
            setTimeout(() => setRevealedCards(3), 2400);
            setTimeout(() => setShowQuestion(true), 3800);
        }
    }, [showCards]);`;

c = c.replace(oldStates, newStates);

// 2. Replace GROUP_SELECT block
// I'll use a regex to grab the entire step === 'GROUP_SELECT' block and replace it.
const groupSelectRegex = /\{step === 'GROUP_SELECT' && \([\s\S]*?(?=\{step === 'TEAM_SELECT')/;

const newGroupSelect = `{step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">
                                {introVisible && (
                                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                            [ SECURE TRANSMISSION ]
                                        </p>
                                        <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                            <TypewriterLine text={dict.proposals_intro} startDelay={300} onComplete={() => {
                                                setTimeout(() => {
                                                    setIntroVisible(false);
                                                    setShowCards(true);
                                                }, 2500);
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {showCards && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2 animate-fade-in">
                                            {dict.groups.map((g: any, idx: number) => {
                                                const letters = ['A', 'B', 'C'];
                                                const isRevealed = revealedCards > idx;
                                                return (
                                                <div
                                                    key={g.id}
                                                    className="group w-full bg-[#0a0a0a]/95 border-[3px] border-white/20 md:border-4 md:border-white/20 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col text-left relative overflow-hidden min-h-[320px] md:aspect-[5/7]"
                                                >
                                                    {/* Face Cover (Lead layer) */}
                                                    <div className={\`absolute inset-0 bg-[#1a1a1a] z-20 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out \${isRevealed ? 'opacity-0 scale-110 pointer-events-none blur-sm' : 'opacity-100 scale-100 blur-0'}\`}>
                                                        <div className="w-16 h-16 border-2 border-[#444] rounded-full flex items-center justify-center mb-4">
                                                            <span className="text-[#444] font-bold tracking-widest text-xs">CLASSIFIED</span>
                                                        </div>
                                                        <p className="text-[#444] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                                                            [ OPTION \${letters[idx]} ]
                                                        </p>
                                                    </div>

                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-70"></div>
                                                    
                                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                        [ OPTION \${letters[idx]} ]
                                                    </p>
                                                    
                                                    <div className="flex flex-col gap-2 relative z-10 w-full h-full">
                                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 transition-colors min-h-[64px]">
                                                            {g.title}
                                                        </h3>
                                                        
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {g.teams.map((tCode: string) => (
                                                                <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-black/50 border border-white/20" style={{ color: TEAM_COLORS[tCode] }}>
                                                                    {tCode}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-6">
                                                            {g.hint}
                                                        </p>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                        
                                        {showQuestion && (
                                            <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-4">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                                <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                    [ AWAITING DECISION ]
                                                </p>
                                                <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center mb-6">
                                                    <TypewriterLine text="E ai, onde voce irá colocar sua ficha ?" startDelay={300} />
                                                </div>
                                                
                                                <div className="flex justify-center gap-4">
                                                    {dict.groups.map((g: any, idx: number) => {
                                                        const letters = ['A', 'B', 'C'];
                                                        return (
                                                            <button
                                                                key={\`btn-\${g.id}\`}
                                                                onClick={() => handleSelectGroup(g.id)}
                                                                className="w-16 h-16 md:w-20 md:h-20 bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black text-2xl md:text-3xl uppercase hover:bg-[#fbaa19] hover:text-black transition-all shadow-[0_0_20px_rgba(251,170,25,0.2)] hover:shadow-[0_0_30px_rgba(251,170,25,0.6)] flex items-center justify-center animate-pulse"
                                                            >
                                                                {letters[idx]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                `;

c = c.replace(groupSelectRegex, newGroupSelect);
fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Successfully updated the face-down cards sequence.');
