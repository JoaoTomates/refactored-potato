const fs = require('fs');
const path = require('path');

const srcPath = 'src/app/invite/page.tsx';
const destDir = 'src/app/invite2';
const destPath = path.join(destDir, 'page.tsx');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

let content = fs.readFileSync(srcPath, 'utf8');

// Replace DIALOG texts
const dictRegex = /const dict = \{[\s\S]*?\};/;
const newDict = `const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta.",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem.",
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
    processing: "PROCESSING UPLOAD..."
};`;

content = content.replace(dictRegex, newDict);

// Add waitingForClick state
const stateOld = `    const [typingComplete, setTypingComplete] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);`;
    
const stateNew = `    const [typingComplete, setTypingComplete] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const [waitingForClick, setWaitingForClick] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);`;
content = content.replace(stateOld, stateNew);

// Update TypewriterLine rendering
const dialogOld = `{isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                startDelay={i === 0 ? 1500 : 500} 
                                                onReadyForNext={() => {
                                                    if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 2500); 
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setShowGroups(true) : undefined}
                                            />
                                        ) : (`;

const dialogNew = `{isCurrent ? (
                                            <TypewriterLine 
                                                text={text} 
                                                startDelay={i === 0 ? 1500 : 500} 
                                                onReadyForNext={() => {
                                                    if (i === 0) {
                                                        setWaitingForClick(true);
                                                    } else if (!isLastInSequence) {
                                                        setTimeout(() => {
                                                            setDialogIndex(prev => prev + 1);
                                                        }, 2500); 
                                                    }
                                                }}
                                                onComplete={isLastInSequence ? () => setShowGroups(true) : undefined}
                                            />
                                        ) : (`;
content = content.replace(dialogOld, dialogNew);

// Add click listener to the outer div, or render a click button
const messagesEndRefOld = `<div ref={messagesEndRef} className="h-2 w-full" />`;
const messagesEndRefNew = `
                        {waitingForClick && (
                            <div className="w-full flex justify-center mt-4 mb-4">
                                <button 
                                    onClick={() => {
                                        setWaitingForClick(false);
                                        setDialogIndex(prev => prev + 1);
                                    }}
                                    className="bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black uppercase tracking-[0.3em] px-8 py-3 animate-pulse hover:bg-[#fbaa19] hover:text-black transition-colors shadow-[0_0_20px_rgba(251,170,25,0.4)]"
                                >
                                    [ CLICK TO CONTINUE ]
                                </button>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-2 w-full" />`;

content = content.replace(messagesEndRefOld, messagesEndRefNew);

// Rename component exports
content = content.replace(/InviteFlow/g, 'InviteFlow2');
content = content.replace(/InvitePageWrapper/g, 'Invite2PageWrapper');

fs.writeFileSync(destPath, content, 'utf8');
console.log('Created invite2/page.tsx successfully.');
