const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Fix onReadyForNext
c = c.replace(
    'if (i === 3) {',
    'if (i === 0 || i === 3) {'
);

// 2. Fix inline continue button
const oldBtn = `{/* Inline Click to Continue for the fourth box */}
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

const newBtn = `{/* Inline Click to Continue for the first and fourth box */}
                                    {(i === 0 || i === 3) && waitingForClick && (
                                        <div className="mt-2 flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    setWaitingForClick(false);
                                                    if (i === 0) setDialogIndex(prev => prev + 1);
                                                    if (i === 3) setStep('GROUP_SELECT');
                                                }}
                                                className="text-[#fbaa19] text-[10px] md:text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse flex items-center gap-2"
                                            >
                                                [ CLICK TO CONTINUE ] <span className="text-lg leading-none">»</span>
                                            </button>
                                        </div>
                                    )}`;

c = c.replace(oldBtn, newBtn);

// 3. Fix component structure

const groupSelectStart = `{step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">`;

const fixedGroupSelectStart = `
                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}

                {step === 'GROUP_SELECT' && (
                            <div className="w-full animate-fade-in flex flex-col gap-6">`;

c = c.replace(groupSelectStart, fixedGroupSelectStart);

// Now remove the old closing tags of DIALOG which were at the bottom of GROUP_SELECT
const oldClosingTags = `                        )}
                        

                        <div ref={messagesEndRef} className="h-2 w-full" />
                    </div>
                )}

                {step === 'TEAM_SELECT' && (`

const newClosingTags = `                        )}

                {step === 'TEAM_SELECT' && (`

c = c.replace(oldClosingTags, newClosingTags);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Fixed dialog layout and missing cards.');
