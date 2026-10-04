const fs = require('fs');

const p = 'src/components/AppLayoutWrapper.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("pathname === '/invite2' || pathname === '/invite3' || ", '')
     .replace("pathname === '/headquarters'", "pathname === '/headquarters' || pathname === '/playground'");
fs.writeFileSync(p, c);
console.log(c.match(/isHiddenRoute = .*/)[0]);

// Bug fix: a tabela contracts usa user_id (não profile_id)
const h = 'src/app/headquarters/page.tsx';
let d = fs.readFileSync(h, 'utf8');
d = d.replace(".eq('profile_id', user.id)", ".eq('user_id', user.id)");
fs.writeFileSync(h, d);
console.log('HQ fixed:', d.includes(".eq('user_id', user.id)"));
