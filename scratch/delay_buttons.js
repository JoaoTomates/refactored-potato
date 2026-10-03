const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Add showActionButtons state
const oldStates = `    const [showQuestion, setShowQuestion] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);`;
const newStates = `    const [showQuestion, setShowQuestion] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);`;

c = c.replace(oldStates, newStates);

// 2. Add onComplete to TypewriterLine
const oldTypewriter = '<TypewriterLine text="E ai, onde voce irá colocar sua ficha ?" startDelay={300} />';
const newTypewriter = '<TypewriterLine text="E ai, onde voce irá colocar sua ficha ?" startDelay={300} onComplete={() => setShowActionButtons(true)} />';
c = c.replace(oldTypewriter, newTypewriter);

// 3. Wrap buttons in showActionButtons
const oldButtonsContainer = `<div className="flex justify-center gap-4">
                                                    {dict.groups.map((g: any, idx: number) => {
                                                        const letters = ['A', 'B', 'C'];
                                                        return (
                                                            <button
                                                                key={\`btn-\${g.id}\`}
                                                                onClick={() => handleSelectGroup(g.id)}
                                                                className="w-16 h-16 md:w-20 md:h-20 bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black text-2xl md:text-3xl uppercase hover:bg-[#fbaa19] hover:text-black transition-all shadow-[0_0_20px_rgba(251,170,25,0.2)] hover:shadow-[0_0_30px_rgba(251,170,25,0.6)] flex items-center justify-center animate-pulse"
                                                            >
                                                                {letters[idx]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>`;

const newButtonsContainer = `{showActionButtons && (
                                                    <div className="flex justify-center gap-4 animate-fade-in">
                                                        {dict.groups.map((g: any, idx: number) => {
                                                            const letters = ['A', 'B', 'C'];
                                                            return (
                                                                <button
                                                                    key={\`btn-\${g.id}\`}
                                                                    onClick={() => handleSelectGroup(g.id)}
                                                                    className="w-16 h-16 md:w-20 md:h-20 bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black text-2xl md:text-3xl uppercase hover:bg-[#fbaa19] hover:text-black transition-all shadow-[0_0_20px_rgba(251,170,25,0.2)] hover:shadow-[0_0_30px_rgba(251,170,25,0.6)] flex items-center justify-center animate-pulse"
                                                                >
                                                                    {letters[idx]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}`;
c = c.replace(oldButtonsContainer, newButtonsContainer);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Successfully delayed action buttons.');
