const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8');
const startIdx = content.indexOf("{step === 'TEAM_SELECT'");
const endIdx = content.indexOf("{(step === 'AUTH' || step === 'PROFILE')");

if(startIdx !== -1 && endIdx !== -1) {
    const oldBlock = content.slice(startIdx, endIdx);
    
    const newBlock = `{step === 'TEAM_SELECT' && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            [ AWAITING INPUT : {dict.team_prompt} ]
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map((team, idx) => (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team.id)}
                                    className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden animate-slide-up"
                                    style={{ animationDelay: \`\${idx * 150}ms\` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start mb-4 w-full relative z-10">
                                        <LogoBadge code={team.code} />
                                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: team.color }}></div>
                                    </div>
                                    
                                    <div className="relative z-10 w-full flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19] transition-colors">{team.name}</h3>
                                        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: TEAM_COLORS[team.code] || '#999' }}>{team.code}</p>
                                        
                                        <div className="mt-auto flex justify-between items-end w-full">
                                            <span className={\`text-xs font-bold uppercase tracking-widest \${team.is_available ? 'text-green-500' : 'text-red-500'}\`}>
                                                {team.is_available ? \`\${2 - team.spots_taken} VAGAS LIVRES\` : 'CONTRATO FECHADO'}
                                            </span>
                                        </div>
                                    </div>

                                    {team.is_available && (
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                [ SELECT ]
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                `;
                
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
    console.log('TEAM_SELECT updated.');
} else {
    console.log('Could not find boundaries.');
}
