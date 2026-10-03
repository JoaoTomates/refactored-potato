const fs = require('fs');
let c = fs.readFileSync('src/components/AppLayoutWrapper.tsx', 'utf8');
c = c.replace(/isHiddenRoute = \['\/invite', '\/invite2', '\/invite3'\]/, "isHiddenRoute = ['/invite', '/invite2', '/invite3', '/invite4']");
fs.writeFileSync('src/components/AppLayoutWrapper.tsx', c);
console.log('Added invite4 to hidden routes');
