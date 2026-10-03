const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Add showCards state
c = c.replace(
    'const [waitingForClick, setWaitingForClick] = useState(false);',
    'const [waitingForClick, setWaitingForClick] = useState(false);\n    const [showCards, setShowCards] = useState(false);'
);

// 2. Update dict.proposals_intro
c = c.replace(
    'proposals_intro: "Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista."',
    'proposals_intro: "E o novo regulamento de motores está virando o jogo de ponta-cabeça. E voce precisa escolher seu lado nessa guerra."'
);

// 3. Update GROUP_SELECT UI
const oldGroupSelect = `{step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ SECURE TRANSMISSION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        <TypewriterLine text={dict.proposals_intro} startDelay={300} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
                                    {dict.groups.map((g: any, idx: number) => {
                                        const letters = ['A', 'B', 'C'];
                                        return (
                                        <div
                                            key={g.id}
                                            className="group w-full bg-[#0a0a0a]/95 border-[3px] border-white/20 md:border-4 md:border-white/20 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col text-left relative overflow-hidden animate-slide-up min-h-[320px] md:aspect-[5/7]"
                                            style={{ animationDelay: \`\${idx * 300 + 1500}ms\`, animationFillMode: 'both' }}
                                        >
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
                                
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-4" style={{ animationDelay: '2800ms', animationFillMode: 'both' }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ AWAITING DECISION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center mb-6">
                                        <TypewriterLine text="Onde você vai assinar?" startDelay={3000} />
                                    </div>
                                    
                                    <div className="flex justify-center gap-4">`;

const newGroupSelect = `{step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ SECURE TRANSMISSION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        <TypewriterLine text={dict.proposals_intro} startDelay={300} onComplete={() => setShowCards(true)} />
                                    </div>
                                </div>

                                {showCards && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
                                            {dict.groups.map((g: any, idx: number) => {
                                                const letters = ['A', 'B', 'C'];
                                                return (
                                                <div
                                                    key={g.id}
                                                    className="group w-full bg-[#0a0a0a]/95 border-[3px] border-white/20 md:border-4 md:border-white/20 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col text-left relative overflow-hidden animate-slide-up min-h-[320px] md:aspect-[5/7]"
                                                    style={{ animationDelay: \`\${idx * 300}ms\`, animationFillMode: 'both' }}
                                                >
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
                                        
                                        <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-4" style={{ animationDelay: '900ms', animationFillMode: 'both' }}>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                            <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                [ AWAITING DECISION ]
                                            </p>
                                            <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center mb-6">
                                                <TypewriterLine text="E ai, onde voce irá colocar sua ficha ?" startDelay={1100} />
                                            </div>
                                            
                                            <div className="flex justify-center gap-4">`;

if (c.includes(oldGroupSelect)) {
    c = c.replace(oldGroupSelect, newGroupSelect);
    // don't forget to close the fragment
    const closingDivs = `                                    </div>
                                </div>
                            </div>
                        )}`;
    
    const newClosingDivs = `                                    </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}`;
    c = c.replace(closingDivs, newClosingDivs);
    fs.writeFileSync('src/app/invite2/page.tsx', c);
    console.log('Successfully updated the flow.');
} else {
    console.log('Failed to find oldGroupSelect');
}
