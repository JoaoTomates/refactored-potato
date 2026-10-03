const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

const regex = /return \(\s*<main className="w-full min-h-screen[\s\S]*?\n\}/;

const replacement = `return (
        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-center">
            
            {/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>
            
            {/* Widescreen terminal box */}
            <div className="relative z-10 w-[85%] md:w-[85%] max-w-6xl aspect-video bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111]">
                
            </div>
        </main>
    );
}`;

c = c.replace(regex, replacement);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Done!');
