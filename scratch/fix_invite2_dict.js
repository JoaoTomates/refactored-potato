const fs = require('fs');
let content = fs.readFileSync('src/app/invite2/page.tsx', 'utf8');

const oldDictLine = 'const dict = INVITE_LOCALE[lang];';

const newDict = `const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem",
        "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar sua ficha.",
        "Tenho três propostas na mesa para a temporada, e cada garagem exige um tipo de estrategista. Onde você vai assinar?"
    ],
    career_prompt: "CHOOSE YOUR PATH",
    groups: [
        { 
            id: 1, 
            title: "ALIANÇA DA ESTRELA", 
            teams: ['MER', 'MCL', 'ALP', 'WIL'], 
            hint: "A maior frota do grid. Domínio de engenharia e confiabilidade estabelecida." 
        },
        { 
            id: 2, 
            title: "O IMPÉRIO DE MARANELLO", 
            teams: ['FER', 'HAA', 'CAD'], 
            hint: "A fúria e o prestígio italiano unidos à nova força americana no grid." 
        },
        { 
            id: 3, 
            title: "VANGUARDA TECNOLÓGICA", 
            teams: ['RBR', 'RBA', 'AST', 'AUD'], 
            hint: "Motores inéditos, alto risco e a ousadia dos novos projetos de fábrica." 
        }
    ],
    team_prompt: "SELECT YOUR GARAGE",
    contact_prompt: "ENTER COMM LINK ID",
    profile_prompt: "REGISTER PILOT ID",
    email_placeholder: "EMAIL PROTOCOL",
    password_placeholder: "ENCRYPTION KEY",
    first_name_placeholder: "FIRST NAME",
    last_name_placeholder: "LAST NAME",
    number_placeholder: "RACE NUMBER",
    btn_continue: "SECURE CONNECTION",
    btn_sign: "SIGN CONTRACT",
    processing: "PROCESSING UPLOAD...",
    error_fallback: "TRANSMISSION ERROR"
};`;

content = content.replace(oldDictLine, newDict);
fs.writeFileSync('src/app/invite2/page.tsx', content, 'utf8');
console.log('Fixed dict in invite2');
