const fs = require('fs');

function replaceTop10() {
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
                                disabled={isAutoLoading || isSubmitting || isSuccess}
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
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/top-10-finish.tsx', content, 'utf8');
}

function replacePoletime() {
    let content = fs.readFileSync('src/components/poletime.tsx', 'utf8');
    const target = `<button 
                                type="button" 
                                onClick={async () => {
                                    const picks = await autoPoletime();
                                    setDigits(picks);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess || digits.every(d => d === 0)}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
                            
    const replacement = `<button 
                                type="button" 
                                onClick={() => setDigits([0,0,0,0,0,0])}
                                disabled={isAutoLoading || isSubmitting || isSuccess || digits.every(d => d === 0)}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                onClick={async () => {
                                    const generated = await autoPoletime();
                                    setDigits(generated);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/poletime.tsx', content, 'utf8');
}

function replaceH2H() {
    let content = fs.readFileSync('src/components/head-to-head.tsx', 'utf8');
    const target = `<button 
                                type="button" 
                                onClick={async () => {
                                    const picks = await autoH2H();
                                    setPicks(picks);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess || countPicks === 0}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
                            
    const replacement = `<button 
                                type="button" 
                                onClick={() => setPicks({})}
                                disabled={isAutoLoading || isSubmitting || isSuccess || countPicks === 0}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                onClick={async () => {
                                    const generated = await autoH2H();
                                    setPicks(generated);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/head-to-head.tsx', content, 'utf8');
}

function replaceEvo() {
    let content = fs.readFileSync('src/components/evo.tsx', 'utf8');
    const target = `<button 
                                type="button" 
                                onClick={async () => {
                                    const picks = await autoEvo();
                                    setPicks(picks);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess || picks.every(p => p === '')}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
                            
    const replacement = `<button 
                                type="button" 
                                onClick={() => setPicks(Array(5).fill(''))}
                                disabled={isAutoLoading || isSubmitting || isSuccess || picks.every(p => p === '')}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10 md:border-transparent p-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR
                            </button>
                            <button 
                                type="button" 
                                onClick={async () => {
                                    const generated = await autoEvo();
                                    setPicks(generated);
                                }}
                                disabled={isAutoLoading || isSubmitting || isSuccess}
                                className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] hover:bg-[#fbaa19] hover:text-black transition-colors border border-[#fbaa19] p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >`;
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/evo.tsx', content, 'utf8');
}

try {
    replaceTop10();
    replacePoletime();
    replaceH2H();
    replaceEvo();
} catch (e) {
    console.error(e);
}
