const fs = require('fs');

let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace(/import Navigation from [^\n]*\n/, '');
c = c.replace(/import NasdaqTicker from [^\n]*\n/, '');
c = c.replace(/import Footer from [^\n]*\n/, '');

c = c.replace('import { Analytics }', 'import AppLayoutWrapper from "../components/AppLayoutWrapper";\nimport { Analytics }');

const oldDiv = `<div className="flex flex-col min-h-screen w-full">
              <Navigation />
              <NasdaqTicker />
              <div className="flex-grow flex flex-col w-full">
                {children}
              </div>
              <Footer />
              <Analytics />
            </div>`;

const newDiv = `<AppLayoutWrapper>
              {children}
              <Analytics />
            </AppLayoutWrapper>`;

c = c.replace(oldDiv, newDiv);
fs.writeFileSync('src/app/layout.tsx', c);
console.log('Layout updated');
