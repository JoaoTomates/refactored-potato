const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

const oldBlock = c.substring(c.indexOf('{/* Phase 2: Widescreen terminal box */}'));

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

                        {/* Rendering AUTH inside Terminal */}
                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6 w-full relative z-10 animate-fade-in text-white uppercase">
                                <div className="mb-4">
                                    <p className="text-[#fbaa19] text-lg md:text-xl font-bold tracking-widest leading-relaxed">
                                        <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                        <TypewriterLine text={dict.contact_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.email_placeholder}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="password" 
                                            required
                                            placeholder={dict.password_placeholder}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="group relative w-full border-2 border-white/30 text-white font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:text-black hover:border-white transition-colors overflow-hidden mt-6">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_continue} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 w-full relative z-10 animate-fade-in text-white uppercase">
                                <div className="mb-4">
                                    <p className="text-[#fbaa19] text-lg md:text-xl font-bold tracking-widest leading-relaxed">
                                        <span className="opacity-50 mr-4 text-[#fbaa19]">&gt;_</span>
                                        <TypewriterLine text={dict.profile_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="relative w-1/2">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.first_name_placeholder}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative w-1/2">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.last_name_placeholder}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                    <input 
                                        type="number" 
                                        required
                                        min="0" max="99"
                                        placeholder={dict.number_placeholder}
                                        value={raceNumber}
                                        onChange={e => setRaceNumber(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                    />
                                </div>
                                <button type="submit" className="group relative w-full bg-[#fbaa19] border-2 border-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:border-white transition-colors overflow-hidden mt-6">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_sign} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROCESSING' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
                                <div className="w-16 h-16 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[#fbaa19] font-bold tracking-widest uppercase">&gt;_ INICIALIZANDO SUPERLICENÇA...</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4 w-full" />
                    </div>
                </div>
            )}
        </main>
    );
}`;

c = c.replace(oldBlock, newPhase2);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Success! Phase 2 fully replaced with padding, white text, and complete flow inside the terminal.');
