const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

c = c.replace(/>_ INCOMING SECURE TRANSMISSION\.\.\./g, '&gt;_ INCOMING SECURE TRANSMISSION...');
c = c.replace(/>_ AWAITING USER INPUT\.\.\./g, '&gt;_ AWAITING USER INPUT...');

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Fixed jsx escape');
