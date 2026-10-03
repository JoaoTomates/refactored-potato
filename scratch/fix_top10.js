const fs = require('fs');

let content = fs.readFileSync('src/components/top-10-finish.tsx', 'utf8');

const target = `<button 
                                type="button" 
                                onClick={async () => {
                                    const picks = await autoTop10();
                                    setPicks(picks);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess || picks.every(p => p === '')}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                disabled={isAutoLoading || picks.some(p => p === '') || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
                            
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
                            >`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/top-10-finish.tsx', content, 'utf8');
    console.log('Fixed top-10');
} else {
    console.log('Target not found');
}
