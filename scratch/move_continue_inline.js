const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

const oldDialogEnd = `                                        ) : (
                                            <span className="opacity-70">{text}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}`;

const newDialogEnd = `                                        ) : (
                                            <span className="opacity-70">{text}</span>
                                        )}
                                    </div>
                                    
                                    {/* Inline Click to Continue for the first box */}
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
                                    )}
                                </div>
                            );
                        })}`;

const oldStandaloneButton = `                        {waitingForClick && (
                            <div className="w-full flex justify-center mt-4 mb-4">
                                <button 
                                    onClick={() => {
                                        setWaitingForClick(false);
                                        setDialogIndex(prev => prev + 1);
                                    }}
                                    className="bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black uppercase tracking-[0.3em] px-8 py-3 animate-pulse hover:bg-[#fbaa19] hover:text-black transition-colors shadow-[0_0_20px_rgba(251,170,25,0.4)]"
                                >
                                    [ CLICK TO CONTINUE ]
                                </button>
                            </div>
                        )}`;

c = c.replace(oldDialogEnd, newDialogEnd);
c = c.replace(oldStandaloneButton, '');

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Invite2 updated with inline link button');
