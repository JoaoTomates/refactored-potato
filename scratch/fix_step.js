const fs = require('fs');
let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');
c = c.replace(/type Step = [^;]+;/, "type Step = 'LOADING' | 'DIALOG' | 'GROUP_SELECT' | 'TEAM_SELECT' | 'AUTH' | 'PROFILE' | 'ENLIST' | 'PROCESSING';");
fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Fixed Step type');
