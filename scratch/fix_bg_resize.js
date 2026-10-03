const fs = require('fs');

function fixBackground(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    // 1. Change absolute to fixed
    c = c.replace(
        'className="absolute inset-0 z-0 bg-cover bg-center',
        'className="fixed inset-0 z-0 bg-cover bg-center'
    );
    c = c.replace(
        'className="absolute inset-0 z-0 pointer-events-none opacity-30',
        'className="fixed inset-0 z-0 pointer-events-none opacity-30'
    );
    c = c.replace(
        'className="absolute inset-0 z-0 pointer-events-none opacity-20',
        'className="fixed inset-0 z-0 pointer-events-none opacity-20'
    );
    c = c.replace(
        'className="absolute inset-0 z-0 pointer-events-none bg-radial-gradient',
        'className="fixed inset-0 z-0 pointer-events-none bg-radial-gradient'
    );

    // 2. Remove transition-all duration-[10s] ease-out scale-100
    c = c.replace('transition-all duration-[10s] ease-out scale-100 ', '');
    c = c.replace('transition-all duration-[20s] scale-110 ', '');

    fs.writeFileSync(filePath, c);
}

fixBackground('src/app/invite/page.tsx');
fixBackground('src/app/invite2/page.tsx');
console.log('Fixed background resizing issue in both files.');
