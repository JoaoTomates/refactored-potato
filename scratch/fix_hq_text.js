const fs = require('fs');
const filePath = 'src/app/headquarters/page.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// The problematic text includes replacement chars.
// We can just use a regex to replace the entire <p> block containing "DIRETRIZ:"
const regex = /<p className="text-\[#fbaa19\] text-xs uppercase tracking-widest font-bold">[\s\S]*?<\/p>/;

const newBlock = `<p className="text-[#fbaa19] text-xs uppercase tracking-widest font-bold">
                            &gt; DIRETRIZ: Preenchimento prioritário do Grupo 1 (Giuseppe Farina). A relação estratégica não é atrelada diretamente aos pilotos, mas sim de ordem estrutural: cada vaga oficial nas garagens reais (Assento 1 e 2) possui uma correlação direta 1:1 com a alocação de estrategistas nos Grupos Fantasy. Analise as {teams.length} propostas abaixo e assuma o pitwall.
                        </p>`;

content = content.replace(regex, newBlock);

fs.writeFileSync(filePath, content);
console.log('Fixed encoding and replaced text block.');
