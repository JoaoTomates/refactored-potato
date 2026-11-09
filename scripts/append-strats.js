const fs = require('fs');
const path = require('path');

const rdPath = path.join(__dirname, '..', 'src', 'lib', 'race-directors.ts');
let rdContent = fs.readFileSync(rdPath, 'utf-8');

const newItemsTs = [
    {
        id: 'strat-25',
        code: 'J.BEHRA',
        displayName: 'J. Behra',
        firstNameModified: 'Jean',
        originalDriver: 'Jean Behra (1952–1959)',
        decade: '1950s',
        careerStat: '53 GPs • 9 Pódios • 1 Pole • 51.1 pts por Maserati, Gordini e Ferrari • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        title: 'MESTRE DE ARROJO & PILOTAGEM DESTEMIDA NO LIMITE',
        specialty: 'Ataque implacável em curvas cegas e recuperação de posições em asfalto ondulado',
        signatureQuote: '“Corri com capacete de pano e óculos de couro em pistas onde um erro custava a vida. Se o carro estiver balanceado, não tire o pé na freada.”',
        biography: 'Um dos pilotos mais rápidos e corajosos da história dos anos 50. Famoso por liderar corridas contra Fangio e Moss com bravura e orgulho lendário.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_25.jpg'
    },
    {
        id: 'strat-26',
        code: 'R.SPENCE',
        displayName: 'R. Spence',
        firstNameModified: 'Robert',
        originalDriver: 'Mike Spence (1963–1968)',
        decade: '1960s',
        careerStat: '36 GPs • 1 Pódio no México • 27 pts pela Lotus e BRM • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'CONSULTOR DE EFICIÊNCIA AERODINÂMICA & CHASSI CLÁSSICO',
        specialty: 'Finesse de volante, suavidade de transição e precisão milimétrica em retas longas',
        signatureQuote: '“Na Lotus de Chapman aprendi que leveza e precisão superam força bruta. Observe a tração na saída das curvas de média.”',
        biography: 'Piloto brilhante e discreto da Lotus e BRM nos anos 60, mestre em acerto fino de suspensão e preservação de mecânica sob calor extremo.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_26.jpg'
    },
    {
        id: 'strat-27',
        code: 'J.CECOTTO',
        displayName: 'J. Cecotto',
        firstNameModified: 'Julian',
        originalDriver: 'Johnny Cecotto (1983–1984)',
        decade: '1980s',
        careerStat: '23 GPs • 1 Ponto nos EUA • Bicampeão Mundial de Motociclismo • 0 Vitórias',
        nationality: 'Venezuelano',
        countryCode: 'VEN',
        title: 'ESTRATEGISTA DE INCLINAÇÃO & TRAJETÓRIAS DINÂMICAS',
        specialty: 'Domínio de tangência em curvas de alta e transição veloz em zebras úmidas',
        signatureQuote: '“Quem domina duas rodas enxerga a física do asfalto antes de qualquer sensor. O segredo da volta perfeita está na confiança do primeiro toque no freio.”',
        biography: 'Fenômeno venezuelano bicampeão mundial de motovelocidade que migrou para a F1 ao lado de Ayrton Senna na Toleman, famoso pelo controle visceral do carro.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_27.jpg'
    },
    {
        id: 'strat-28',
        code: 'D.BLUNDELL',
        displayName: 'D. Blundell',
        firstNameModified: 'David',
        originalDriver: 'Mark Blundell (1991–1995)',
        decade: '1980s',
        careerStat: '61 GPs • 3 Pódios • 32 pts por Brabham, Tyrrell, Ligier e McLaren • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'DIRETOR DE DISPUTAS CORPO A CORPO & RESISTÊNCIA DE PITWALL',
        specialty: 'Ritmo consistente em trechos de tráfego pesado e defesa de posição sob ataque de DRS',
        signatureQuote: '“Não existe ultrapassagem de graça na F1. Se deixar a porta aberta meio palmo na freada, você perde o stint inteiro.”',
        biography: 'Piloto combatente da era de ouro dos anos 90, subiu ao pódio com Tyrrell e McLaren e cravou pole histórica em Le Mans com 1.100 cv.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_28.jpg'
    },
    {
        id: 'strat-29',
        code: 'M.SALO',
        displayName: 'M. Salo',
        firstNameModified: 'Matti',
        originalDriver: 'Mika Salo (1994–2002)',
        decade: '1980s',
        careerStat: '111 GPs • 2 Pódios por Ferrari e Sauber • 33 pts • 0 Vitórias',
        nationality: 'Finlandês',
        countryCode: 'FIN',
        title: 'ESTRATEGISTA DE SACRIFÍCIO TÁTICO & COMPORTAMENTO DE ESCUDERIA',
        specialty: 'Defesa cirúrgica de liderança para o companheiro e gestão fria de pneus degradados',
        signatureQuote: '“Em Hockenheim 1999 eu entreguei a vitória na mão de Irvine pela equipe. Eu sei quando uma ordem de equipe vale um campeonato inteiro.”',
        biography: 'Veterano finlandês respeitado no paddock que substituiu Schumacher na Ferrari em 1999, protagonizando um dos maiores gestos de lealdade da F1.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_29.jpg'
    },
    {
        id: 'strat-30',
        code: 'I.CAPELLI',
        displayName: 'I. Capelli',
        firstNameModified: 'Italo',
        originalDriver: 'Ivan Capelli (1985–1993)',
        decade: '1980s',
        careerStat: '98 GPs • 3 Pódios • 31 pts por March, Leyton House e Ferrari • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        title: 'MESTRE DE EFEITO SOLO & PROJETOS AERODINÂMICOS VISIONÁRIOS',
        specialty: 'Aproveitamento máximo do difusor e equilíbrio de downforce em circuitos de curvas rápidas',
        signatureQuote: '“Com o March desenhado por Newey em Paul Ricard 1990, liderei até quase o fim contra os motores V12 da Ferrari. Sei ler quando um chassi pode bater os gigantes.”',
        biography: 'Ícone da March Leyton House de Adrian Newey e ex-piloto de Maranello, mestre em compreender a sensibilidade aerodinâmica de carros no limite.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_30.jpg'
    }
];

if (!rdContent.includes("id: 'strat-25'")) {
    const formatted = newItemsTs.map(s => `    {
        id: '${s.id}',
        code: '${s.code}',
        displayName: '${s.displayName}',
        firstNameModified: '${s.firstNameModified}',
        originalDriver: '${s.originalDriver}',
        decade: '${s.decade}',
        careerStat: '${s.careerStat}',
        nationality: '${s.nationality}',
        countryCode: '${s.countryCode}',
        title: '${s.title}',
        specialty: '${s.specialty}',
        signatureQuote: '${s.signatureQuote}',
        evaluation: {
            upvotes: 1180,
            downvotes: 42,
            communityRating: 4.8,
            totalEvaluations: 1222,
            accuracyRate: 90.5
        },
        briefingTips: {
            poletimeTarget: '1:32.100 – 1:32.400',
            poletimeReasoning: 'A evolução de aderência no Q3 premia o traçado mais limpo.',
            predictedTop3: ['L.NORRIS', 'M.VERSTAPPEN', 'C.LECLERC'],
            top3Reasoning: 'Ritmo forte em trechos sinuosos compensa a velocidade de reta.',
            evoTargetDriver: 'F.ALONSO',
            evoReasoning: 'Experiência para escalar posições após as primeiras voltas.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'Consistência cirúrgica em curvas de raio longo.',
            miscRiskAlert: 'Média de interrupções por safety car em 58% na primeira perna do stint.'
        },
        biography: '${s.biography}',
        avatarUrl: '${s.avatarUrl}'
    }`).join(',\n');

    const targetMarker = "avatar_driver_24.jpg'";
    const idx = rdContent.indexOf(targetMarker);
    if (idx !== -1) {
        const closeBraceIdx = rdContent.indexOf('}', idx);
        const endArrIdx = rdContent.indexOf('];', closeBraceIdx);
        if (closeBraceIdx !== -1 && endArrIdx !== -1) {
            const before = rdContent.slice(0, closeBraceIdx + 1);
            const after = rdContent.slice(closeBraceIdx + 1);
            rdContent = before + ',\n' + formatted + after;
            fs.writeFileSync(rdPath, rdContent, 'utf-8');
            console.log('✓ Strat-25 a Strat-30 adicionados com sucesso ao SENIOR_STRATEGISTS!');
        }
    }
} else {
    console.log('Strat-25 já existe em race-directors.ts');
}
