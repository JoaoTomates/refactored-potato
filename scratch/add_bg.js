const fs = require('fs');

let c = fs.readFileSync('src/app/invite4/page.tsx', 'utf8');

c = c.replace(
    '<div className="min-h-screen bg-[#050401] text-[#ffb703] flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none">',
    `<div className="min-h-screen bg-[#050401] text-[#ffb703] flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none overflow-hidden relative">
      <img 
          src="/pixel_invite_bg_v2.jpg"
          alt=""
          className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-80 pointer-events-none"
          style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
      />`
);

c = c.replace(
    '{/* Outer 2000s CRT Monitor Chassis */}\n      <div className="w-full max-w-5xl bg-[#19160e] border-4 border-[#332b1a] rounded-2xl p-3 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative">',
    `{/* Outer 2000s CRT Monitor Chassis */}\n      <div className="w-full max-w-5xl bg-[#19160e]/95 border-4 border-[#332b1a] rounded-2xl p-3 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative z-10">`
);

fs.writeFileSync('src/app/invite4/page.tsx', c);
console.log('Background added to invite4');
