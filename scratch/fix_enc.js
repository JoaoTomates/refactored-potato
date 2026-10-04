const fs = require('fs');
let c = fs.readFileSync('src/app/headquarters/page.tsx', 'utf8');

c = c.replace(/Preenchimento prioritǭrio/g, 'Preenchimento prioritário');
c = c.replace(/relaǜo/g, 'relação');
c = c.replace(/estratǸgica/g, 'estratégica');
c = c.replace(/nǜo Ǹ/g, 'não é');
c = c.replace(/correlaǜo/g, 'correlação');
c = c.replace(/alocaǜo/g, 'alocação');
c = c.replace(/Nvel/g, 'Nível');
c = c.replace(/Integraǜo/g, 'Integração');

fs.writeFileSync('src/app/headquarters/page.tsx', c);
console.log('Fixed encodings!');
