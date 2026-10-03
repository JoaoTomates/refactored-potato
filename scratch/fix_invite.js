const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8');

const buggyString = 'window.location.replace(/);';
const correctString = 'window.location.replace(`/${data.slug}`);';

content = content.replace(buggyString, correctString);
fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
