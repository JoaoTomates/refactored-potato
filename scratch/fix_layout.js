const fs = require('fs');

let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

// I will just use a generic regex to replace the children of ThemeWrapper
c = c.replace(/<div className="flex flex-col min-h-screen w-full">[\s\S]*?<Footer \/>\s*<Analytics \/>\s*<\/div>/, 
`<AppLayoutWrapper>
              {children}
              <Analytics />
            </AppLayoutWrapper>`);

fs.writeFileSync('src/app/layout.tsx', c);
console.log('Fixed layout wrapper issue');
