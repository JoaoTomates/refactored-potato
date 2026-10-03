const fs = require('fs');
let c = fs.readFileSync('src/components/AppLayoutWrapper.tsx', 'utf8');
c = c.replace("pathname === '/invite3' || pathname === '/academy'", "pathname === '/invite3' || pathname === '/invite4' || pathname === '/academy'");
fs.writeFileSync('src/components/AppLayoutWrapper.tsx', c);
console.log('Updated AppLayoutWrapper');
