const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// 1. Font and main bg
c = c.replace(/font-rajdhani/g, 'font-mono text-[#fbaa19] bg-black');

// 2. Remove the background image completely
c = c.replace(/<img[^>]*src="\/pixel_invite_bg_v2\.jpg"[^>]*\/>/, '');

// 3. Strip box styles to make it look like raw terminal output
// Replace all occurrences of bg-[#0a0a0a]/95 and borders
c = c.replace(/bg-\[#0a0a0a\]\/95/g, 'bg-transparent');
c = c.replace(/border-2/g, 'border-none');
c = c.replace(/border-\[#fbaa19\]/g, 'border-none');
c = c.replace(/shadow-\[0_0_40px_rgba\(251,170,25,0\.15\)\]/g, 'shadow-none');
c = c.replace(/p-6 md:p-8/g, 'p-2');
c = c.replace(/p-6/g, 'p-2');

// 4. Remove the top gradient line in boxes
c = c.replace(/<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-\[#fbaa19\]\/0 via-\[#fbaa19\] to-\[#fbaa19\]\/0"><\/div>/g, '');

// 5. Text colors: replace text-white with text-[#fbaa19] so it's all monochrome terminal
c = c.replace(/text-white/g, 'text-[#fbaa19]');
c = c.replace(/text-gray-300/g, 'text-[#fbaa19]/80'); // dimmer amber for hints

// 6. Change specific terminal prompt strings
c = c.replace(/\[ SECURE TRANSMISSION \]/g, '>_ INCOMING SECURE TRANSMISSION...');
c = c.replace(/\[ AWAITING DECISION \]/g, '>_ AWAITING USER INPUT...');
c = c.replace(/\[ CLICK TO CONTINUE \]/g, 'Press ANY KEY to continue');

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Terminal UX applied!');
