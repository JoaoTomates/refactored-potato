const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

const replacement = `        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-center">
            
            {/* Pixel Art Background (Fixed Jitter) */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* CRT Overlay Effects */}`;

c = c.replace(/<main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-center">\s*\{\/\* CRT Overlay Effects \*\/\}/, replacement);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Added background back');
