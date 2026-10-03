const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

const oldGroups = `{showGroups && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 mt-2">
                                {dict.groups.map((g: any, idx: number) => (
                                    <button
                                        key={g.id}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className="group w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden"
                                        style={{ animationDelay: \`\${idx * 150}ms\` }}
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
                                            <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed group-hover:text-white transition-colors">
                                                {g.hint}
                                            </p>
                                        </div>
                                        
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                [ SELECT ]
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-2" style={{ animationDelay: \`\${dict.groups.length * 150}ms\` }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ AWAITING DECISION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest">
                                        <TypewriterLine text="Onde você vai assinar?" startDelay={1000} />
                                    </div>
                                </div>
                            </div>
                        )}`;

const newGroups = `{showGroups && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 mt-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                    {dict.groups.map((g: any, idx: number) => (
                                        <button
                                            key={g.id}
                                            onClick={() => handleSelectGroup(g.id)}
                                            className="group w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden"
                                            style={{ animationDelay: \`\${idx * 150}ms\` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0 group-hover:opacity-100 opacity-70 transition-opacity"></div>
                                            
                                            <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                                [ OPTION {idx + 1} : {g.title.split(' ')[0]} ]
                                            </p>
                                            
                                            <div className="flex flex-col gap-2 relative z-10 w-full h-full">
                                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-[#fbaa19] transition-colors min-h-[64px]">
                                                    <TypewriterLine text={g.title} startDelay={idx * 300 + 500} />
                                                </h3>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {g.teams.map((tCode: string) => (
                                                        <span key={tCode} className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded-sm bg-black/50 border border-[#fbaa19]/30" style={{ color: TEAM_COLORS[tCode] }}>
                                                            {tCode}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest leading-relaxed group-hover:text-white transition-colors mb-6">
                                                    <TypewriterLine text={g.hint} startDelay={idx * 300 + 1500} />
                                                </p>
                                                
                                                <div className="mt-auto pt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                        [ SELECT ]
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up mt-2" style={{ animationDelay: \`\${dict.groups.length * 150}ms\` }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                                    <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                        [ AWAITING DECISION ]
                                    </p>
                                    <div className="text-white text-lg md:text-xl font-bold uppercase tracking-widest text-center">
                                        <TypewriterLine text="Onde você vai assinar?" startDelay={2500} />
                                    </div>
                                </div>
                            </div>
                        )}`;

if (c.includes(oldGroups)) {
    c = c.replace(oldGroups, newGroups);
    fs.writeFileSync('src/app/invite2/page.tsx', c);
    console.log("Replaced groups layout successfully.");
} else {
    console.log("Could not find the group container block to replace.");
}
