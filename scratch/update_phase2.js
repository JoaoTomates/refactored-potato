const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

const regex = /\{\/\* Phase 2: Widescreen terminal box \*\/\}\s*\{\(step === 'DIALOG' && showBigScreen\) && \([\s\S]*?\}\)\}\s*<\/main>/;

const newPhase2 = `{/* Phase 2: Widescreen terminal box */}
            {showBigScreen && (
                <div 
                    className="relative z-10 w-[85%] md:w-[75%] max-w-6xl aspect-video bg-[rgba(0,0,0,0.97)] shadow-[0_50px_100px_rgba(0,0,0,1),0_80px_160px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111] animate-zoom-in flex flex-col p-6 md:px-32 md:py-24"
                    onClick={() => {
                        if (step === 'DIALOG') {
                            if (dialogIndex < 3) {
                                setDialogIndex(prev => prev + 1);
                            } else {
                                setStep("GROUP_SELECT");
                            }
                        }
                    }}
                    style={{ cursor: step === 'DIALOG' ? 'pointer' : 'default' }}
                >
                    <div className="w-full flex-grow flex flex-col overflow-y-auto font-mono text-white uppercase">
                        
                        {step === 'DIALOG' && (() => {
                            const startIndex = 1;
                            const visibleDialogs = dict.dialog.slice(startIndex, dialogIndex + 1);
                            
                            return visibleDialogs.map((text, idx) => {
                                const i = startIndex + idx;
                                const isCurrent = i === dialogIndex;
                                return (
                                    <div key={i} className="mb-6">
                                        <div className="text-base md:text-xl font-bold tracking-widest leading-relaxed">
                                            <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                            {isCurrent ? (
                                                <TypewriterLine 
                                                    text={text} 
                                                    startDelay={300} 
                                                    onReadyForNext={() => {
                                                        if (i < 3) {
                                                            const pause = i === 2 ? 4500 : 2500;
                                                            setTimeout(() => {
                                                                setDialogIndex(prev => {
                                                                    if (prev === i) return prev + 1;
                                                                    return prev;
                                                                });
                                                            }, pause); 
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="opacity-90">{text}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        
                        {step === 'DIALOG' && dialogIndex === 3 && (
                            <div className="mt-8 animate-fade-in opacity-50 text-sm text-[#fbaa19]">
                                [ TOQUE NA TELA PARA CONTINUAR ]
                            </div>
                        )}

                        {step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 text-white text-left uppercase">
                                <p className="opacity-80 text-[#fbaa19] mb-4 text-sm md:text-base font-bold tracking-[0.2em]">&gt;_ CONEXÃO ESTABELECIDA. SELECIONE A SUA ALIANÇA:</p>
                                <div className="flex flex-col gap-6 w-full">
                                    {dict.groups.map((g: any, idx: number) => (
                                        <div 
                                            key={g.id} 
                                            className="border-l-[3px] border-white/20 pl-6 py-4 hover:bg-white/5 hover:border-[#fbaa19] cursor-pointer transition-all duration-300 group" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectGroup(idx + 1);
                                            }}
                                        >
                                            <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-[#fbaa19] transition-colors">{g.title}</h3>
                                            <div className="flex gap-3 mt-4">
                                                {g.teams.map((tCode: string) => (
                                                    <span key={tCode} className="px-3 py-1.5 bg-black border border-white/20 text-[10px] md:text-xs font-black shadow-inner" style={{color: TEAM_COLORS[tCode]}}>{tCode}</span>
                                                ))}
                                            </div>
                                            <p className="text-xs md:text-sm mt-4 opacity-70 tracking-widest leading-relaxed">{g.hint}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {step === 'LOADING' && (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-[#fbaa19] animate-pulse font-bold tracking-widest uppercase">&gt;_ PROCESSANDO...</div>
                            </div>
                        )}

                        {step === 'TEAM_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6 text-white text-left uppercase">
                                <p className="opacity-80 text-[#fbaa19] mb-4 text-sm md:text-base font-bold tracking-[0.2em]">&gt;_ SELECIONE O SEU CONTRATO:</p>
                                <div className="flex flex-col gap-6 w-full">
                                    {teams.map((t: any) => (
                                        <div 
                                            key={t.id} 
                                            className="border-l-[3px] border-white/20 pl-6 py-4 hover:bg-white/5 hover:border-[#fbaa19] cursor-pointer transition-all duration-300 group" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectTeam(t.id);
                                            }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <LogoBadge code={t.code} />
                                                <div>
                                                    <h3 className="text-xl md:text-3xl font-black" style={{color: TEAM_COLORS[t.code]}}>{t.name}</h3>
                                                    <p className="text-[10px] md:text-xs opacity-70 tracking-[0.2em] mt-2 group-hover:text-white transition-colors">[{t.code}] ASSINAR ACORDO</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4 w-full" />
                    </div>
                </div>
            )}
        </main>`;

if (regex.test(c)) {
    c = c.replace(regex, newPhase2);
    fs.writeFileSync('src/app/invite3/page.tsx', c);
    console.log('Success! Phase 2 updated with desktop padding, white uppercase text, and group selection logic.');
} else {
    console.log('Regex did not match.');
}
