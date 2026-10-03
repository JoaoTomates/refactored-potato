const fs = require('fs');

let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

c = c.replace(
    'className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"',
    'className="fixed inset-0 z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"'
);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Fixed scanlines');
