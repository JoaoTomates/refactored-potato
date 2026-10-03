const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// 1. Change main wrapper alignment to push to bottom
c = c.replace(
    'select-none flex flex-col font-mono items-center justify-center',
    'select-none flex flex-col font-mono items-center justify-end pb-8 md:pb-16'
);

// 2. Modify the terminal box
// Old: className="relative z-10 w-[85%] md:w-[85%] max-w-6xl aspect-video bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111]"
// New width: md:w-[75%]
// New bg: bg-black/95
// New shadow: shadow-[0_80px_100px_rgba(0,0,0,1)]
c = c.replace(
    'relative z-10 w-[85%] md:w-[85%] max-w-6xl aspect-video bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111]',
    'relative z-10 w-[85%] md:w-[75%] max-w-6xl aspect-video bg-[#000000]/95 shadow-[0_50px_100px_rgba(0,0,0,1),0_80px_160px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111]'
);

// Note: used bg-[#000000]/95 which equals 5% transparency (very close to 2-3%, tailwind's closest default step).
// Alternatively I can use bg-[rgba(0,0,0,0.97)]
c = c.replace('bg-[#000000]/95', 'bg-[rgba(0,0,0,0.97)]');

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Styles applied!');
