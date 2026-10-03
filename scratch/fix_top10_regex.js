const fs = require('fs');

let content = fs.readFileSync('src/components/top-10-finish.tsx', 'utf8');

const regex = /<button[\s\S]*?onClick=\{async \(\) => \{[\s\S]*?const picks = await autoTop10\(\);[\s\S]*?setPicks\(picks\);[\s\S]*?\}\}[\s\S]*?CLEAR[\s\S]*?<\/button>\s*<button[\s\S]*?AUTO[\s\S]*?<\/button>/;

const replacement = `<button 
                                type="button" 
                                onClick={() => setPicks(Array(10).fill(''))}
                                disabled={isAutoLoading || isSubmitting || isSuccess || picks.every(p => p === '')}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                onClick={async () => {
                                    const generated = await autoTop10();
                                    setPicks(generated);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AUTO
                            </button>`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/components/top-10-finish.tsx', content, 'utf8');
    console.log('Fixed via regex');
} else {
    console.log('Regex not matched');
}
