const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Update dict
const oldDict = `const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem",
        "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar sua ficha.",
        "Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista."
    ],`;
const newDict = `const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem",
        "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar sua ficha."
    ],
    proposals_intro: "Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista.",`;

c = c.replace(oldDict, newDict);

// 2. Remove showGroups
c = c.replace(/const \[showGroups, setShowGroups\] = useState\(false\);\n/, '');
c = c.replace(/showGroups/g, "step === 'GROUP_SELECT'");

// 3. Update Typewriter logic
c = c.replace(/if \(i === 0\) {/g, 'if (i === 3) {');

// 4. Change continue button action and position
const oldContinueBtn = `                                    {/* Inline Click to Continue for the first box */}
                                    {i === 0 && waitingForClick && (
                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    setWaitingForClick(false);
                                                    setDialogIndex(prev => prev + 1);
                                                }}
                                                className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                            >
                                                [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                            </button>
                                        </div>
                                    )}`;
const newContinueBtn = `                                    {/* Inline Click to Continue for the fourth box */}
                                    {i === 3 && waitingForClick && (
                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    setWaitingForClick(false);
                                                    setStep('GROUP_SELECT');
                                                }}
                                                className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                            >
                                                [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                            </button>
                                        </div>
                                    )}`;
c = c.replace(oldContinueBtn, newContinueBtn);

// 5. Update GROUP_SELECT UI 
// The user wants:
// - Update page by hiding all dialog boxes -> `step === 'DIALOG'` hides when we do `setStep('GROUP_SELECT')` (already true!).
// - Present 3 cards horizontally.
// - At the end, "onde você vai assinar" with options A, B, C to click.

const oldGroupSelect = `{step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 mt-2">
                                <div className="flex flex-col gap-6 w-full">
                                    {dict.groups.map((g: any, idx: number) => (
                                        <button
                                            key={g.id}
                                            onClick={() => handleSelectGroup(g.id)}
                                            className="group w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden animate-slide-up"
                                            style={{ animationDelay: \`\${idx * 600}ms\`, animationFillMode: 'both' }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0 group-hover:opacity-100 opacity-70 transition-opacity"></div>
                                            
                                            <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                [ OPTION {idx + 1} : {g.title.split(' ')[0]} ]
                                            </p>
                                            
                                            <div className="flex flex-col gap-2 relative z-10 w-full">
                                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-[#fbaa19] transition-colors">
                                                    {g.title}
                                                </h3>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {g.teams.map((tCode: string) => (
                                                        <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-black/50 border border-[#fbaa19]/30" style={{ color: TEAM_COLORS[tCode] }}>
                                                            {tCode}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed group-hover:text-white transition-colors mb-2">
                                                    {g.hint}
                                                </p>
                                                
                                                <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                        [ SELECT ]
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-2" style={{ animationDelay: \`\${dict.groups.length * 600}ms\`, animationFillMode: 'both' }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ AWAITING DECISION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center">
                                        <TypewriterLine text="Onde você vai assinar?" startDelay={dict.groups.length * 600 + 500} />
                                    </div>
                                </div>
                            </div>
                        )}`;

const newGroupSelect = `{step === 'GROUP_SELECT' && (
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
                                            className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left relative overflow-hidden animate-slide-up"
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
                            </div>
                        )}`;

c = c.replace(oldGroupSelect, newGroupSelect);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Update finished.');
