const fs = require('fs');

let text = fs.readFileSync('src/app/invite/page.tsx', 'utf8');

const regex = /\{step === 'DIALOG' && \([\s\S]*?onClick=\{\(\) => setStep\('GROUP_SELECT'\)\}[\s\S]*?INCOMING TRANSMISSION\.\.\.<\/p>[\s\S]*?"\{dict\.dialog\[0\]\}"[\s\S]*?\[ CLICK TO CONTINUE \][\s\S]*?<\/div>\s*\)\}/;

const dialog_replacement = `{step === 'DIALOG' && (
                    <div 
                        className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative cursor-pointer hover:bg-black transition-colors"
                        onClick={() => {
                            if (dialogIndex < dict.dialog.length - 1) {
                                setDialogIndex(prev => prev + 1);
                            } else {
                                setStep('GROUP_SELECT');
                            }
                        }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        <p className="text-[#fbaa19] text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-6">INCOMING TRANSMISSION...</p>
                        
                        <div className="flex flex-col gap-4">
                            {dict.dialog.slice(0, dialogIndex + 1).map((text, i) => (
                                <p key={i} className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed animate-fade-in">
                                    "{text}"
                                </p>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
                                [ {dialogIndex < dict.dialog.length - 1 ? dict.btn_continue : 'MAKE YOUR CHOICE >'} ]
                            </span>
                        </div>
                    </div>
                )}`;

text = text.replace(regex, dialog_replacement);

fs.writeFileSync('src/app/invite/page.tsx', text, 'utf8');
