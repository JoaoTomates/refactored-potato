const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Change wrapper max-w-5xl to just TEAM_SELECT
c = c.replace(
    "`relative z-10 w-full ${step === 'GROUP_SELECT' || step === 'TEAM_SELECT' ? 'max-w-5xl' : 'max-w-xl'} mx-auto px-4 flex flex-col ${step === 'GROUP_SELECT' ? 'justify-start pt-8' : 'justify-end'} h-full mb-12 flex-1`",
    "`relative z-10 w-full ${step === 'TEAM_SELECT' ? 'max-w-5xl' : 'max-w-xl'} mx-auto px-4 flex flex-col ${step === 'GROUP_SELECT' ? 'justify-start pt-8' : 'justify-end'} h-full mb-12 flex-1`"
);

// 2. Replace the showCards block
const oldGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2 animate-fade-in">
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
                                        </div>`;

const newList = `<div className="flex flex-col gap-6 w-full mt-2 animate-fade-in">
                                            {dict.groups.map((g: any, idx: number) => {
                                                const letters = ['A', 'B', 'C'];
                                                return (
                                                <div
                                                    key={g.id}
                                                    className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up"
                                                    style={{ animationDelay: \`\${idx * 400 + 1000}ms\`, animationFillMode: 'both' }}
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                        [ OPÇÃO \${letters[idx]} ]
                                                    </p>
                                                    
                                                    <div className="flex flex-col gap-4 relative z-10 w-full">
                                                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest transition-colors">
                                                            {g.title}
                                                        </h3>
                                                        
                                                        <div className="flex flex-wrap gap-3">
                                                            {g.teams.map((tCode: string) => (
                                                                <div key={tCode} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded bg-black border border-[#333] shadow-inner">
                                                                    <span className="text-sm md:text-base font-black" style={{ color: TEAM_COLORS[tCode] }}>
                                                                        {tCode}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
                                                            {g.hint}
                                                        </p>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>`;

c = c.replace(oldGrid, newList);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Successfully reverted cards to dialog box style.');
