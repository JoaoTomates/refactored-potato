const fs = require('fs');

let c = fs.readFileSync('src/app/invite3/page.tsx', 'utf8');

// 1. Add fullName state
if (!c.includes('const [fullName, setFullName]')) {
    c = c.replace(
        'const [email, setEmail] = useState("");',
        'const [fullName, setFullName] = useState("");\n    const [email, setEmail] = useState("");'
    );
}

// 2. Add bossResponses dictionary
if (!c.includes('bossResponses')) {
    const bossDict = `
const bossResponses: Record<number, { name: string, quote: string }> = {
    1: {
        name: "BLOCO A: ALIANÇA DA ESTRELA",
        quote: "“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”"
    },
    2: {
        name: "BLOCO B: O IMPÉRIO DE MARANELLO",
        quote: "“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a imprensa italiana te destrói.”"
    },
    3: {
        name: "BLOCO C: A VANGUARDA TECNOLÓGICA",
        quote: "“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”"
    }
};
`;
    c = c.replace('const LOGOS: Record<string, string> = {', bossDict + '\nconst LOGOS: Record<string, string> = {');
}

// 3. Update handleSelectGroup
const oldHandleSelectGroupRegex = /const handleSelectGroup = async \([\s\S]*?catch \(err\) \{[\s\S]*?setStep\('GROUP_SELECT'\);\n        \}\n    \};/;

const newHandleSelectGroup = `const handleSelectGroup = async (groupId: number) => {
        setSelectedGroup(groupId);
        setStep('LOADING');
        
        try {
            const { data, error } = await supabase.from('teams').select('*').eq('is_available', true);
            if (error) throw error;
            
            let codes: string[] = [];
            if (groupId === 1) codes = ['MCL', 'MER', 'WIL', 'ALP'];
            else if (groupId === 2) codes = ['FER', 'HAA', 'CAD'];
            else if (groupId === 3) codes = ['RBR', 'RBA', 'AST', 'AUD'];

            const groupTeams = data.filter(t => codes.includes(t.code));
            const randomTeam = groupTeams[Math.floor(Math.random() * groupTeams.length)];
            setSelectedTeamId(randomTeam.id);
            setTypingComplete(false);
            setStep('ENLIST');
        } catch (err) {
            console.error(err);
            setErrorMsg(dict.error_fallback);
            setStep('GROUP_SELECT');
        }
    };`;

c = c.replace(oldHandleSelectGroupRegex, newHandleSelectGroup);

// 4. Update handleEnlistSubmit
const oldHandleAuthSubmitRegex = /const handleAuthSubmit = \([\s\S]*?const signInitialContract/m;

const newHandleEnlistSubmit = `const handleEnlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROCESSING');
        setErrorMsg("");

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = \`\${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app\`; 
            }

            const autoPassword = 'Volt' + Math.random().toString(36).slice(-6) + '!';

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password: autoPassword 
            });

            if (authError) throw authError;

            if (authData.user && selectedTeamId) {
                const nameParts = fullName.trim().split(' ');
                const rawFirst = nameParts[0] || 'Rookie';
                const rawLast = nameParts.slice(1).join(' ') || 'Strategist';

                const cleanFirstName = rawFirst.charAt(0).toUpperCase();
                const cleanLastName = rawLast.toUpperCase();
                const generatedNumber = Math.floor(Math.random() * 99) + 1;
                const slug = \`@\${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}\${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}\${generatedNumber}\`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true, 
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: '#000000',
                        setup_completed: true,
                        slug: slug
                    });
                }
                
                await signInitialContract(selectedTeamId, slug);
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || dict.error_fallback);
            setStep('ENLIST');
        }
    };

    const signInitialContract`;

c = c.replace(oldHandleAuthSubmitRegex, newHandleEnlistSubmit);

// 5. Replace UI rendering steps: TEAM_SELECT, AUTH, PROFILE -> ENLIST
const uiRegex = /\{step === 'TEAM_SELECT'[\s\S]*?\{step === 'PROCESSING'/;

const uiEnlist = `{step === 'ENLIST' && selectedGroup && (
                            <div className="w-full animate-fade-in flex flex-col gap-8 text-white text-left uppercase mt-4">
                                <div>
                                    <p className="text-[#fbaa19] font-bold tracking-[0.2em] mb-4 text-sm md:text-base">&gt;_ COMANDANTE: {bossResponses[selectedGroup].name}</p>
                                    <div className="text-base md:text-xl font-bold tracking-widest leading-relaxed border-l-[3px] border-[#fbaa19] pl-6 py-2">
                                        <TypewriterLine text={bossResponses[selectedGroup].quote} startDelay={300} onComplete={() => setTypingComplete(true)} />
                                    </div>
                                </div>
                                
                                <form onSubmit={handleEnlistSubmit} className={\`flex flex-col gap-6 w-full relative z-10 transition-opacity duration-1000 \${typingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="relative w-full md:w-1/2">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="NOME E SOBRENOME"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                            />
                                        </div>
                                        <div className="relative w-full md:w-1/2">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xl font-bold">&gt;_</span>
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="E-MAIL"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-white/20 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all placeholder-white/20"
                                            />
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="group relative w-full bg-[#fbaa19] border-2 border-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:border-white transition-colors overflow-hidden mt-4">
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            [ ASSINAR CONTRATO E ACESSAR PITWALL ]
                                        </span>
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 'PROCESSING'`;

c = c.replace(uiRegex, uiEnlist);

fs.writeFileSync('src/app/invite3/page.tsx', c);
console.log('Update enlist script complete');
