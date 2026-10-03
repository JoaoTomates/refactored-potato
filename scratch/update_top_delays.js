const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

// 1. Container Wrapper
const oldWrapper = "<div className={`relative z-10 w-full ${step === 'GROUP_SELECT' || step === 'TEAM_SELECT' ? 'max-w-5xl' : 'max-w-xl'} mx-auto px-4 flex flex-col justify-end h-full mb-12 flex-1`}>";
const newWrapper = "<div className={`relative z-10 w-full ${step === 'GROUP_SELECT' || step === 'TEAM_SELECT' ? 'max-w-5xl' : 'max-w-xl'} mx-auto px-4 flex flex-col ${step === 'GROUP_SELECT' ? 'justify-start pt-8' : 'justify-end'} h-full mb-12 flex-1`}>";
c = c.replace(oldWrapper, newWrapper);

// 2. Adjust Delays
const oldDelayCard = "style={{ animationDelay: `${idx * 300}ms`, animationFillMode: 'both' }}";
const newDelayCard = "style={{ animationDelay: `${idx * 400 + 1000}ms`, animationFillMode: 'both' }}";
c = c.replace(oldDelayCard, newDelayCard);

const oldDelayBox = "style={{ animationDelay: '900ms', animationFillMode: 'both' }}";
const newDelayBox = "style={{ animationDelay: '3000ms', animationFillMode: 'both' }}";
c = c.replace(oldDelayBox, newDelayBox);

const oldDelayTypewriter = "<TypewriterLine text=\"E ai, onde voce irá colocar sua ficha ?\" startDelay={1100} />";
const newDelayTypewriter = "<TypewriterLine text=\"E ai, onde voce irá colocar sua ficha ?\" startDelay={3200} />";
c = c.replace(oldDelayTypewriter, newDelayTypewriter);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('UI updated: Top alignment and sequential delays added.');
