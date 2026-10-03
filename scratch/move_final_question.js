const fs = require('fs');
let content = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

const oldDialogString = `"Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista. Onde você vai assinar?"`;
const newDialogString = `"Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista."`;

content = content.replace(oldDialogString, newDialogString);

const oldGroupsEnd = `                                    </button>
                                ))}
                            </div>
                        )}`;

const newGroupsEnd = `                                    </button>
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

if (content.includes(oldGroupsEnd)) {
    content = content.replace(oldGroupsEnd, newGroupsEnd);
    console.log("Groups end replaced.");
} else {
    console.log("Could not find groups end.");
}

fs.writeFileSync('src/app/invite2/page.tsx', content, 'utf8');
console.log('Script finished.');
