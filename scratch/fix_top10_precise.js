const fs = require('fs');

let content = fs.readFileSync('src/components/top-10-finish.tsx', 'utf8');

const target = `onClick={async () => {
                                    const picks = await autoTop10();
                                    setPicks(picks);
                                }}`;

const replacement = `onClick={() => setPicks(Array(10).fill(''))}`;

content = content.replace(target, replacement);

const target2 = `disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AUTO`;
                                
const replacement2 = `onClick={async () => {
                                    const picks = await autoTop10();
                                    setPicks(picks);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AUTO`;

content = content.replace(target2, replacement2);
fs.writeFileSync('src/components/top-10-finish.tsx', content, 'utf8');
