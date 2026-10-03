const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

c = c.replace(
    'if (dialogIndex < 3) {\n                            setDialogIndex(prev => prev + 1);\n                        }',
    'if (dialogIndex < 3) {\n                            setDialogIndex(prev => prev + 1);\n                        } else {\n                            setStep("GROUP_SELECT");\n                        }'
);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Click handler updated safely');
