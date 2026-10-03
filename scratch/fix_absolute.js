const fs = require('fs');
let c = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

c = c.replace(
    'className="absolute inset-0 z-0 bg-cover bg-center',
    'className="fixed inset-0 z-0 bg-cover bg-center'
);

c = c.replace(
    'className="absolute inset-0 z-0 pointer-events-none opacity-20',
    'className="fixed inset-0 z-0 pointer-events-none opacity-20'
);

c = c.replace(
    'className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient',
    'className="fixed inset-0 z-0 pointer-events-none bg-radial-gradient'
);

fs.writeFileSync('src/app/invite2/page.tsx', c);
console.log('Fixed absolute to fixed');
