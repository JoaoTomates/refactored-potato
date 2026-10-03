const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Update container
const oldContainer = '<div className="relative z-10 w-full max-w-xl mx-auto px-4 flex flex-col justify-end h-full mb-12 flex-1">';
const newContainer = '<div className={`relative z-10 w-full ${step === \'GROUP_SELECT\' || step === \'TEAM_SELECT\' ? \'max-w-5xl\' : \'max-w-xl\'} mx-auto px-4 flex flex-col justify-end h-full mb-12 flex-1`}>';
c = c.replace(oldContainer, newContainer);

// 2. Update card wrapper inside GROUP_SELECT
const oldCard = `className="group w-full bg-[#0a0a0a]/95 border-2 border-white/10 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left relative overflow-hidden animate-slide-up"`;
const newCard = `className="group w-full bg-[#0a0a0a]/95 border-[3px] border-white/20 md:border-4 md:border-white/20 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col text-left relative overflow-hidden animate-slide-up min-h-[320px] md:aspect-[5/7]"`;
c = c.replace(oldCard, newCard);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Updated container and card styles.');
