const fs = require('fs');

const replacement = `    return (
        <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono pt-12 md:pt-20 items-center justify-center">
            
            {/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>
            
            <div className="relative z-10 w-[85%] md:max-w-4xl aspect-video bg-black border border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                {/* Widescreen terminal box */}
            </div>
        </main>
    );
}`;

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// Use regex to replace the entire return statement
const returnRegex = /return \([\s\S]*?\);\n\}/;
c = c.replace(returnRegex, replacement);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Done!');
