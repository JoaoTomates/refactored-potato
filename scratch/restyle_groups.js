const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8').replace(/\r\n/g, '\n');

const oldGroups = `{showGroups && (
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
                        )}`;

const newGroups = `{showGroups && (
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
                            </div>
                        )}`;

if (content.includes(oldGroups)) {
    content = content.replace(oldGroups, newGroups);
    fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
    console.log('Groups replaced successfully.');
} else {
    console.log('Could not find oldGroups block to replace.');
}
