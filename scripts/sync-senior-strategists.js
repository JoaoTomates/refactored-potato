const fs = require('fs');
const path = require('path');

// Dados dos 30 Estrategistas Sêniores (24 existentes + 6 novos)
const STRATEGISTS_DATA = [
    {
        num: 1,
        id: 'strat-01',
        code: 'M.AMON',
        displayName: 'M. Amon',
        firstNameModified: 'Marcus',
        originalDriver: 'Chris Amon (1963–1976)',
        decade: '1960s',
        careerStat: '96 GPs • 11 Pódios • 5 Poles • 83 pts • 0 Vitórias',
        nationality: 'Neozelandês',
        countryCode: 'NZL',
        age: '68 anos',
        title: 'ESTRATEGISTA SÊNIOR // ESPECIALISTA EM TELEMETRIA DE VOLTA ÚNICA',
        specialty: 'Extração máxima de aderência em voltas de classificação e controle de pressão de óleo',
        signatureQuote: '“Eu liderei Grandes Prêmios com 30 segundos de vantagem até o motor explodir a três voltas do fim. Conheço cada armadilha invisível deste asfalto. Ouça a telemetria antes de apostar.”',
        biography: 'Reconhecido como um dos pilotos mais rápidos e desafortunados da história. Sua leitura de desgaste de pneus no limite da quebra é considerada lendária no paddock.'
    },
    {
        num: 2,
        id: 'strat-02',
        code: 'T.WARWICK',
        displayName: 'T. Warwick',
        firstNameModified: 'Tobias',
        originalDriver: 'Derek Warwick (1981–1993)',
        decade: '1980s',
        careerStat: '146 GPs • 4 Pódios • 2 Voltas Rápidas • 71 pts • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '65 anos',
        title: 'DIRETOR SÊNIOR DE COMBATE EM PELOTÃO INTERMEDIÁRIO',
        specialty: 'Gestão de combustível, resistência mecânica e emboscadas de pit stop',
        signatureQuote: '“Bati roda contra os maiores campeões da era turbo com carros que quebravam todo domingo. Sei exatamente quem vai arriscar ultrapassagem quando os pneus começarem a escorregar.”',
        biography: 'Símbolo da era turbo dos anos 80, Warwick sobreviveu a acidentes brutais e acumulou um conhecimento enciclopédico de telemetria de corrida.'
    },
    {
        num: 3,
        id: 'strat-03',
        code: 'L.DECESARIS',
        displayName: 'L. De Cesaris',
        firstNameModified: 'Lorenzo',
        originalDriver: 'Andrea de Cesaris (1980–1994)',
        decade: '1980s',
        careerStat: '208 GPs • 5 Pódios • 1 Pole • 59 pts por 10 escuderias • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        age: '60 anos',
        title: 'MESTRE DE APOSTAS DE ALTO RISCO & LARGADAS CAÓTICAS',
        specialty: 'Agressividade de largada, pilotagem sob pressão extrema e apostas de alto risco',
        signatureQuote: '“Se você não estiver disposto a colocar duas rodas na grama na Curva 1, você não quer vencer de verdade. Mas quem aposta em mim sabe: ou é pódio heroico ou muro na volta 3.”',
        biography: 'Recordista absoluto de largadas na F1 sem vitória. Conhecido pelo arrojo desenfreado e intuição incomparável para prever safety cars e toques na largada.'
    },
    {
        num: 4,
        id: 'strat-04',
        code: 'A.BRUNDLE',
        displayName: 'A. Brundle',
        firstNameModified: 'Anthony',
        originalDriver: 'Martin Brundle (1984–1996)',
        decade: '1980s',
        careerStat: '158 GPs • 9 Pódios • 98 pts • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '64 anos',
        title: 'ANALISTA CHEFE DE TELEMETRIA & LEITURA TÁTICA DE PROVA',
        specialty: 'Leitura tática de prova, nuances de desgaste de composto e análise comparativa de telemetria',
        signatureQuote: '“Dividi a pista roda a roda contra Senna e Schumacher. Um décimo de segundo não se ganha na reta: se ganha na paciência de esperar a zebra cuspir o carro.”',
        biography: 'A voz mais respeitada e analítica das transmissões mundiais de F1. Domina a psicologia dos pilotos e a microfísica de cada freada do traçado.'
    },
    {
        num: 5,
        id: 'strat-05',
        code: 'D.JOHANSSON',
        displayName: 'D. Johansson',
        firstNameModified: 'Daniel',
        originalDriver: 'Stefan Johansson (1980–1991)',
        decade: '1980s',
        careerStat: '79 GPs • 12 Pódios • 88 pts por Ferrari e McLaren • 0 Vitórias',
        nationality: 'Sueco',
        countryCode: 'SWE',
        age: '67 anos',
        title: 'CONSELHEIRO DE RESISTÊNCIA & REGULARIDADE DE CORRIDA',
        specialty: 'Economia e preservação de pneus em stints longos sem perder ritmo de ponta',
        signatureQuote: '“Fui ao pódio de Ferrari e McLaren sem nunca ter o motor do primeiro piloto. Quando o pelotão da frente começar a se degladiar, é a nossa hora de pontuar silenciosamente.”',
        biography: 'Mestre da regularidade fria escandinava nos anos 80. Conselheiro sênior para estratégias de conservação de pneus macios em alta temperatura.'
    },
    {
        num: 6,
        id: 'strat-06',
        code: 'S.CHEEVER',
        displayName: 'S. Cheever',
        firstNameModified: 'Samuel',
        originalDriver: 'Eddie Cheever (1978–1989)',
        decade: '1980s',
        careerStat: '132 GPs • 9 Pódios • 70 pts por Renault e Arrows • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        age: '66 anos',
        title: 'ESTRATEGISTA CHEFE PARA CIRCUITOS DE ALTA VELOCIDADE & RETAS',
        specialty: 'Ataque em retas longas, eficiência de DRS e ultrapassagens tardias no fim de reta',
        signatureQuote: '“O automobilismo americano me ensinou a não tirar o pé a 350 km/h. Na reta dos boxes, se você hesitar um piscar de olhos, três carros passam você por fora.”',
        biography: 'O piloto norte-americano com mais largadas na história da Fórmula 1. Especialista nato em circuitos de altíssima velocidade e motores turbo de alta potência.'
    },
    {
        num: 7,
        id: 'strat-07',
        code: 'C.JARIER',
        displayName: 'C. Jarier',
        firstNameModified: 'Claude',
        originalDriver: 'Jean-Pierre Jarier (1971–1983)',
        decade: '1970s',
        careerStat: '134 GPs • 3 Pódios • 3 Poles • 31.5 pts • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        age: '71 anos',
        title: 'ESPECIALISTA EM VELOCIDADE PURA & VOLTA LANÇADA',
        specialty: 'Extração instantânea de tempo na primeira volta de pneu novo no Q3',
        signatureQuote: '“Em 1975 liderei Grandes Prêmios inteiros com a Shadow até a fiação elétrica derreter. Velocidade pura nunca foi meu problema — a sorte mecânica é que nunca veio.”',
        biography: 'Conhecido nos anos 70 como "Godasse de Plomb" (Pé de Chumbo). Sua audácia para buscar poles improváveis com equipes médias desafiava a lógica da categoria.'
    },
    {
        num: 8,
        id: 'strat-08',
        code: 'B.MARTINI',
        displayName: 'B. Martini',
        firstNameModified: 'Bruno',
        originalDriver: 'Pierluigi Martini (1984–1995)',
        decade: '1980s',
        careerStat: '118 GPs • 1 Primeira Fila • 18 pts pela Minardi • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        age: '63 anos',
        title: 'MESTRE DE RESISTÊNCIA & CAÇADOR DE ZEBRAS NO GRID',
        specialty: 'Estratégia alternativa de paradas em janelas curtas para equipes menores',
        signatureQuote: '“Coloquei a Minardi na primeira fila do grid e liderei uma volta com motor aspirado contra monstros turbo. A grandeza estratégica nasce quando você aprende a vencer com menos recursos.”',
        biography: 'O maior herói da história da lendária Minardi. Sua habilidade em extrair pontos heroicos em corridas caóticas tornou-se referência absoluta em estratégia de sobrevivência.'
    },
    {
        num: 9,
        id: 'strat-09',
        code: 'R.FABI',
        displayName: 'R. Fabi',
        firstNameModified: 'Renato',
        originalDriver: 'Teo Fabi (1982–1987)',
        decade: '1980s',
        careerStat: '64 GPs • 2 Pódios • 3 Poles • 23 pts por Benetton e Brabham • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        age: '70 anos',
        title: 'ESTRATEGISTA DE POLE POSITION & PRESSÃO AERODINÂMICA',
        specialty: 'Equilíbrio aerodinâmico milimétrico em pistas de alta aderência para voltas voadoras',
        signatureQuote: '“Poles consecutivas com a Benetton BMW de 1.400 cavalos. Na classificação não se pensa: mira-se o ponto de tangência e deixa-se a telemetria fazer a mágica.”',
        biography: 'Piloto acadêmico e calculista dos anos 80. Famoso por sua precisão cirúrgica em treinos oficiais e poles históricas no templo de Monza e na Áustria.'
    },
    {
        num: 10,
        id: 'strat-10',
        code: 'K.STUCK',
        displayName: 'K. Stuck',
        firstNameModified: 'Klaus',
        originalDriver: 'Hans-Joachim Stuck (1974–1979)',
        decade: '1970s',
        careerStat: '74 GPs • 2 Pódios • 29 pts por Brabham e March • 0 Vitórias',
        nationality: 'Alemão',
        countryCode: 'GER',
        age: '73 anos',
        title: 'MESTRE DE PISTA MOLHADA & PILOTAGEM SOB BAIXA ADERÊNCIA',
        specialty: 'Antecipação de janelas climáticas, aquecimento de pneu intermediário e controle de aquaplanagem',
        signatureQuote: '“Quando o céu escurece e os pilotos jovens começam a tremer no rádio, é quando eu sorrio. A chuva é o grande equalizador de motores na Fórmula 1.”',
        biography: 'O mestre incontestável da pilotagem sob chuva torrencial em Nürburgring Nordschleife. Conselheiro supremo para corridas com pista mista e transição meteorológica.'
    },
    {
        num: 11,
        id: 'strat-11',
        code: 'G.HAILWOOD',
        displayName: 'G. Hailwood',
        firstNameModified: 'Geoffrey',
        originalDriver: 'Mike Hailwood (1963–1974)',
        decade: '1970s',
        careerStat: '50 GPs • 2 Pódios • 1 Volta Rápida • 29 pts • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '74 anos',
        title: 'CONSELHEIRO DE BRAVURA TÁTICA & RESGATE EM PISTA',
        specialty: 'Manobras de ultrapassagem em alta velocidade e pilotagem instintiva sem telemetria',
        signatureQuote: '“Fui nove vezes campeão do mundo em duas rodas na Ilha de Man antes de sentar num F1. Se você tem coragem de frear depois da placa de 100 metros, a posição é sua.”',
        biography: 'Lenda absoluta do automobilismo mundial condecorada com a medalha George Cross por bravura ao salvar um companheiro de carro em chamas. Símbolo de coragem pura.'
    },
    {
        num: 12,
        id: 'strat-12',
        code: 'F.MERZARIO',
        displayName: 'F. Merzario',
        firstNameModified: 'Franco',
        originalDriver: 'Arturo Merzario (1972–1979)',
        decade: '1970s',
        careerStat: '57 GPs • 11 pts pela Ferrari e Williams • Herói de Nürburgring • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        age: '75 anos',
        title: 'COMANDANTE DE INSTINTO DE COMBATE & DEFESA DE POSIÇÃO',
        specialty: 'Combate defensivo agressivo e leitura imediata de incidentes graves de pista',
        signatureQuote: '“Corri de Ferrari nos anos de ouro e tirei Niki Lauda do fogo em Nürburgring com as próprias mãos. Não venha me falar de pressão psicológica de simulador.”',
        biography: 'O icônico piloto italiano de chapéu de caubói que defendeu a Ferrari nos anos 70. Respeitado mundialmente por sua determinação implacável e coração indomável.'
    },
    {
        num: 13,
        id: 'strat-13',
        code: 'N.SURER',
        displayName: 'N. Surer',
        firstNameModified: 'Niklaus',
        originalDriver: 'Marc Surer (1979–1986)',
        decade: '1980s',
        careerStat: '82 GPs • 1 Volta Rápida • 17 pts por Brabham e Arrows • 0 Vitórias',
        nationality: 'Suíço',
        countryCode: 'SUI',
        age: '69 anos',
        title: 'DIRETOR DE ANÁLISE METÓDICA & DESGASTE DE FREIOS',
        specialty: 'Sensibilidade de pedal de freio, balanceamento de barras estabilizadoras e cálculo de consumo',
        signatureQuote: '“A precisão suíça não falha na telemetria. Se você gastar 2% a mais de combustível no primeiro stint, vai perder três posições nas últimas cinco voltas.”',
        biography: 'Piloto e engenheiro analítico que brilhou na Brabham BMW turbo nos anos 80. Conhecido por sua inteligência tática afiada e visão cirúrgica de ritmo de prova.'
    },
    {
        num: 14,
        id: 'strat-14',
        code: 'P.GANLEY',
        displayName: 'P. Ganley',
        firstNameModified: 'Patrick',
        originalDriver: 'Howden Ganley (1971–1974)',
        decade: '1970s',
        careerStat: '35 GPs • 10 pts por BRM e Iso-Marlboro • 0 Vitórias',
        nationality: 'Neozelandês',
        countryCode: 'NZL',
        age: '72 anos',
        title: 'CONSULTOR DE CONSTRUÇÃO DE CHASSI & CONFIABILIDADE DE MOTOR',
        specialty: 'Diagnóstico de fadiga de materiais e comportamento de suspensão sob forte zebra',
        signatureQuote: '“Construí meus próprios carros de corrida depois de pilotar para a BRM. Sei exatamente qual parafuso vai soltar se o piloto continuar abusando das zebras altas.”',
        biography: 'Neozelandês pragmático da escola de Bruce McLaren. Fundador da construtora Tiga Race Cars, combina experiência de cockpit com engenharia mecânica de elite.'
    },
    {
        num: 15,
        id: 'strat-15',
        code: 'E.DONOHUE',
        displayName: 'E. Donohue',
        firstNameModified: 'Edward',
        originalDriver: 'Mark Donohue (1971–1975)',
        decade: '1970s',
        careerStat: '14 GPs • 1 Pódio na estreia • 8 pts pela Penske • Campeão Indy • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        age: '65 anos',
        title: 'DIRETOR DE ENGENHARIA DE SUSPENSÃO & PRESSÃO DE PNEU',
        specialty: 'Ajuste fino de cambagem, caster e pressões dinâmicas de pneu para curvas de alta',
        signatureQuote: '“Se você conseguir acelerar 10 metros antes do rival na saída da curva mais lenta, você será campeão do mundo. O cronômetro não aceita desculpas de engenheiro.”',
        biography: 'O "Capitão Agradável" da lendária parceria com Roger Penske. Engenheiro formado pela Brown University que redefiniu o método científico no acerto de carros de corrida.'
    },
    {
        num: 16,
        id: 'strat-16',
        code: 'V.SCHENKEN',
        displayName: 'V. Schenken',
        firstNameModified: 'Victor',
        originalDriver: 'Tim Schenken (1970–1974)',
        decade: '1970s',
        careerStat: '34 GPs • 1 Pódio na Áustria • 7 pts por Brabham e Surtees • 0 Vitórias',
        nationality: 'Australiano',
        countryCode: 'AUS',
        age: '71 anos',
        title: 'COORDENADOR DE SINALIZAÇÃO & PROCEDIMENTOS DE LARGADA',
        specialty: 'Tempo de reação em apagada de luzes de largada e posicionamento defensivo de pitlane',
        signatureQuote: '“Coloquei a Brabham no pódio em Österreichring no meio dos V12 italianos. Corrida de grid compacto se ganha nos primeiros 300 metros após a largada.”',
        biography: 'Australiano cerebral que se tornou diretor de provas internacional de prestígio global. Domina como ninguém as regras esportivas e a psicologia de largada de GP.'
    },
    {
        num: 17,
        id: 'strat-17',
        code: 'O.KLING',
        displayName: 'O. Kling',
        firstNameModified: 'Otto',
        originalDriver: 'Karl Kling (1954–1955)',
        decade: '1950s',
        careerStat: '11 GPs • 2 Pódios pela Mercedes-Benz • 17 pts • 0 Vitórias',
        nationality: 'Alemão',
        countryCode: 'GER',
        age: '78 anos',
        title: 'ESTRATEGISTA PATRIARCA // PROTOCOLOS DE ENGENHARIA METÓDICA',
        specialty: 'Gestão matemática de corrida, confiabilidade germânica e estratégia de ritmo sincronizado',
        signatureQuote: '“Quando a Mercedes voltou às pistas em 1954 com os Silver Arrows W196, dividi o pódio com Fangio. Disciplina teutônica vence talento destemperado todo domingo.”',
        biography: 'Pilar histórico da Mercedes-Benz na lendária era dos Flechas de Prata nos anos 50. Seu método analítico influenciou gerações de chefes de equipe alemães.'
    },
    {
        num: 18,
        id: 'strat-18',
        code: 'J.SCHELL',
        displayName: 'J. Schell',
        firstNameModified: 'Julian',
        originalDriver: 'Harry Schell (1950–1960)',
        decade: '1950s',
        careerStat: '56 GPs • 2 Pódios • 32 pts por Maserati e BRM • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        age: '76 anos',
        title: 'CONSULTOR DE COMBATE EM TRAÇADOS NORTE-AMERICANOS',
        specialty: 'Leitura de ondulações de asfalto tradicional e frenagens em descida íngreme',
        signatureQuote: '“Fui o primeiro piloto americano a largar num GP de Fórmula 1 em 1950. Corri de Maserati e Vanwall contra lendas. Sei como o asfalto americano come pneus.”',
        biography: 'Pioneiro absoluto das pistas nos anos 50, carismático e rápido. Pódio histórico no GP da Holanda de 1958 pela BRM contra as potências de fábrica.'
    },
    {
        num: 19,
        id: 'strat-19',
        code: 'H.LEWISEVANS',
        displayName: 'H. Lewis-Evans',
        firstNameModified: 'Harold',
        originalDriver: 'Stuart Lewis-Evans (1957–1958)',
        decade: '1950s',
        careerStat: '14 GPs • 2 Pódios • 2 Poles • 16 pts pela Vanwall • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '73 anos',
        title: 'MESTRE DE QUALIFICAÇÃO DA PRIMEIRA GERAÇÃO',
        specialty: 'Condução no limite do equilíbrio dinâmico e pole positions de precisão milimétrica',
        signatureQuote: '“Conquistei poles históricas pela Vanwall quando Stirling Moss era meu companheiro de equipe. Na volta rápida, quem pensa perde dois décimos antes da primeira curva.”',
        biography: 'O jovem prodígio apadrinhado por Bernie Ecclestone nos anos 50. Autor de poles antológicas pela Vanwall na consagração do primeiro título de construtores da história.'
    },
    {
        num: 20,
        id: 'strat-20',
        code: 'R.GODIA',
        displayName: 'R. Godia',
        firstNameModified: 'Rodrigo',
        originalDriver: 'Paco Godia (1951–1958)',
        decade: '1950s',
        careerStat: '13 GPs • 6 pts pela Maserati de fábrica • 0 Vitórias',
        nationality: 'Espanhol',
        countryCode: 'ESP',
        age: '77 anos',
        title: 'CONSULTOR DE RESISTÊNCIA & REGULARIDADE IBÉRICA',
        specialty: 'Controle de temperatura de óleo em circuitos de asfalto abrasivo e calor extremo',
        signatureQuote: '“Fui o primeiro piloto espanhol a pontuar na Fórmula 1 de Maserati oficial nos anos 50. Em pistas quentes, a corrida só começa de verdade após a metade da prova.”',
        biography: 'Aristocrata catalão e pioneiro do automobilismo espanhol na F1. Finalizou em 4º lugar histórico nos GPs da Alemanha e Itália de 1956 pela Maserati.'
    },
    {
        num: 21,
        id: 'strat-21',
        code: 'K.BIRA',
        displayName: 'K. Bira',
        firstNameModified: 'Kasem',
        originalDriver: 'Prince Bira (1950–1954)',
        decade: '1950s',
        careerStat: '19 GPs • 1 Pole em Silverstone • 8 pts por Maserati e Gordini • 0 Vitórias',
        nationality: 'Tailandês',
        countryCode: 'THA',
        age: '79 anos',
        title: 'ESTRATEGISTA DE FLUXO & FINESSE DE PILOTAGEM',
        specialty: 'Fluidez de volante, suavidade de transição de peso e conservação mecânica clássica',
        signatureQuote: '“O azul e amarelo do Sião cruzaram a linha de chegada na primeira corrida oficial da F1 em 1950. A elegância de um traçado limpo ganha corridas silenciosamente.”',
        biography: 'Príncipe Birabongse Bhanudej da Tailândia. O piloto asiático pioneiro que encantou a Europa com velocidade pura e cavalheirismo lendário nos primórdios do esporte.'
    },
    {
        num: 22,
        id: 'strat-22',
        code: 'W.ALLISON',
        displayName: 'W. Allison',
        firstNameModified: 'William',
        originalDriver: 'Cliff Allison (1958–1961)',
        decade: '1950s',
        careerStat: '16 GPs • 1 Pódio na Argentina • 11 pts por Ferrari e Lotus • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '72 anos',
        title: 'ESPECIALISTA EM ENGENHARIA DE MOTORES CLÁSSICOS & PRESSÃO',
        specialty: 'Tração em subidas, controle de torque e frenagem em relevo ondulado acentuado',
        signatureQuote: '“Enzo Ferrari me colocou no carro dele porque eu sabia ouvir o chassi sem quebrar o motor. Em traçados ondulados, respeite a zebra antes que ela quebre sua suspensão.”',
        biography: 'Britânico veloz da Lotus clássica de Colin Chapman e piloto oficial da Scuderia Ferrari no fim dos anos 50, com pódio memorável em Buenos Aires.'
    },
    {
        num: 23,
        id: 'strat-23',
        code: 'Z.GREGORY',
        displayName: 'Z. Gregory',
        firstNameModified: 'Zachary',
        originalDriver: 'Masten Gregory (1957–1965)',
        decade: '1950s',
        careerStat: '38 GPs • 3 Pódios • 21 pts • Campeão de Le Mans com Rindt • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        age: '74 anos',
        title: 'MESTRE DE LARGADAS FULMINANTES & ATAQUE DESENFREADO',
        specialty: 'Largadas fulminantes, ultrapassagens arrojadas por fora e agressividade no primeiro stint',
        signatureQuote: '“O ‘Kansas City Flash’ nunca esperou a segunda volta para atacar. Se você vê um espaço na freada e não mergulha, você já perdeu a corrida no pitwall.”',
        biography: 'Lenda destemida dos Estados Unidos de óculos grossos de miopia. Venceu Le Mans de Ferrari ao lado de Jochen Rindt e subiu ao pódio em Mônaco nos anos 50.'
    },
    {
        num: 24,
        id: 'strat-24',
        code: 'T.STREIFF',
        displayName: 'T. Streiff',
        firstNameModified: 'Thierry',
        originalDriver: 'Philippe Streiff (1984–1988)',
        decade: '1980s',
        careerStat: '53 GPs • 1 Pódio • 11 pts por Ligier e Tyrrell • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        age: '68 anos',
        title: 'DEFENSOR DE DETERMINAÇÃO & ANÁLISE DE SEGURANÇA',
        specialty: 'Determinação sob condições adversas e consistência de ritmo em circuitos técnicos',
        signatureQuote: '“A Fórmula 1 exige respeito absoluto aos limites da física. Quando você analisa a telemetria, não veja apenas números: veja a vida do piloto e o destino da equipe.”',
        biography: 'Piloto francês heroico que conquistou pódio memorável no GP da Austrália de 1985 pela Ligier, admirado mundialmente pela coragem e dedicação ao automobilismo.'
    },
    {
        num: 25,
        id: 'strat-25',
        code: 'J.BEHRA',
        displayName: 'J. Behra',
        firstNameModified: 'Jean',
        originalDriver: 'Jean Behra (1952–1959)',
        decade: '1950s',
        careerStat: '53 GPs • 9 Pódios • 1 Pole • 51.1 pts por Maserati, Gordini e Ferrari • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        age: '72 anos',
        title: 'MESTRE DE ARROJO & PILOTAGEM DESTEMIDA NO LIMITE',
        specialty: 'Ataque implacável em curvas cegas e recuperação de posições em asfalto ondulado',
        signatureQuote: '“Corri com capacete de pano e óculos de couro em pistas onde um erro custava a vida. Se o carro estiver balanceado, não tire o pé na freada.”',
        biography: 'Um dos pilotos mais rápidos e corajosos da história dos anos 50. Famoso por liderar corridas contra Fangio e Moss com bravura e orgulho lendário.'
    },
    {
        num: 26,
        id: 'strat-26',
        code: 'R.SPENCE',
        displayName: 'R. Spence',
        firstNameModified: 'Robert',
        originalDriver: 'Mike Spence (1963–1968)',
        decade: '1960s',
        careerStat: '36 GPs • 1 Pódio no México • 27 pts pela Lotus e BRM • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '66 anos',
        title: 'CONSULTOR DE EFICIÊNCIA AERODINÂMICA & CHASSI CLÁSSICO',
        specialty: 'Finesse de volante, suavidade de transição e precisão milimétrica em retas longas',
        signatureQuote: '“Na Lotus de Chapman aprendi que leveza e precisão superam força bruta. Observe a tração na saída das curvas de média.”',
        biography: 'Piloto brilhante e discreto da Lotus e BRM nos anos 60, mestre em acerto fino de suspensão e preservação de mecânica sob calor extremo.'
    },
    {
        num: 27,
        id: 'strat-27',
        code: 'J.CECOTTO',
        displayName: 'J. Cecotto',
        firstNameModified: 'Julian',
        originalDriver: 'Johnny Cecotto (1983–1984)',
        decade: '1980s',
        careerStat: '23 GPs • 1 Ponto nos EUA • Bicampeão Mundial de Motociclismo • 0 Vitórias',
        nationality: 'Venezuelano',
        countryCode: 'VEN',
        age: '68 anos',
        title: 'ESTRATEGISTA DE INCLINAÇÃO & TRAJETÓRIAS DINÂMICAS',
        specialty: 'Domínio de tangência em curvas de alta e transição veloz em zebras úmidas',
        signatureQuote: '“Quem domina duas rodas enxerga a física do asfalto antes de qualquer sensor. O segredo da volta perfeita está na confiança do primeiro toque no freio.”',
        biography: 'Fenômeno venezuelano bicampeão mundial de motovelocidade que migrou para a F1 ao lado de Ayrton Senna na Toleman, famoso pelo controle visceral do carro.'
    },
    {
        num: 28,
        id: 'strat-28',
        code: 'D.BLUNDELL',
        displayName: 'D. Blundell',
        firstNameModified: 'David',
        originalDriver: 'Mark Blundell (1991–1995)',
        decade: '1980s',
        careerStat: '61 GPs • 3 Pódios • 32 pts por Brabham, Tyrrell, Ligier e McLaren • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        age: '58 anos',
        title: 'DIRETOR DE DISPUTAS CORPO A CORPO & RESISTÊNCIA DE PITWALL',
        specialty: 'Ritmo consistente em trechos de tráfego pesado e defesa de posição sob ataque de DRS',
        signatureQuote: '“Não existe ultrapassagem de graça na F1. Se deixar a porta aberta meio palmo na freada, você perde o stint inteiro.”',
        biography: 'Piloto combatente da era de ouro dos anos 90, subiu ao pódio com Tyrrell e McLaren e cravou pole histórica em Le Mans com 1.100 cv.'
    },
    {
        num: 29,
        id: 'strat-29',
        code: 'M.SALO',
        displayName: 'M. Salo',
        firstNameModified: 'Matti',
        originalDriver: 'Mika Salo (1994–2002)',
        decade: '1980s',
        careerStat: '111 GPs • 2 Pódios por Ferrari e Sauber • 33 pts • 0 Vitórias',
        nationality: 'Finlandês',
        countryCode: 'FIN',
        age: '57 anos',
        title: 'ESTRATEGISTA DE SACRIFÍCIO TÁTICO & COMPORTAMENTO DE ESCUDERIA',
        specialty: 'Defesa cirúrgica de liderança para o companheiro e gestão fria de pneus degradados',
        signatureQuote: '“Em Hockenheim 1999 eu entreguei a vitória na mão de Irvine pela equipe. Eu sei quando uma ordem de equipe vale um campeonato inteiro.”',
        biography: 'Veterano finlandês respeitado no paddock que substituiu Schumacher na Ferrari em 1999, protagonizando um dos maiores gestos de lealdade da F1.'
    },
    {
        num: 30,
        id: 'strat-30',
        code: 'I.CAPELLI',
        displayName: 'I. Capelli',
        firstNameModified: 'Italo',
        originalDriver: 'Ivan Capelli (1985–1993)',
        decade: '1980s',
        careerStat: '98 GPs • 3 Pódios • 31 pts por March, Leyton House e Ferrari • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        age: '61 anos',
        title: 'MESTRE DE EFEITO SOLO & PROJETOS AERODINÂMICOS VISIONÁRIOS',
        specialty: 'Aproveitamento máximo do difusor e equilíbrio de downforce em circuitos de curvas rápidas',
        signatureQuote: '“Com o March desenhado por Newey em Paul Ricard 1990, liderei até quase o fim contra os motores V12 da Ferrari. Sei ler quando um chassi pode bater os gigantes.”',
        biography: 'Ícone da March Leyton House de Adrian Newey e ex-piloto de Maranello, mestre em compreender a sensibilidade aerodinâmica de carros no limite.'
    }
];

// 1. Gera o novo arquivo avatar_drivers_data.txt
const txtPath = path.join(__dirname, '..', 'public', 'avatar', 'ex_drivers', 'avatar_drivers_data.txt');
let txtContent = '';

for (const s of STRATEGISTS_DATA) {
    txtContent += `${s.num}. ${s.code}\n`;
    txtContent += `Nacionalidade: ${s.nationality}\n`;
    txtContent += `Idade: ${s.age}\n`;
    txtContent += `Histórico: ${s.originalDriver} • ${s.careerStat}. ${s.title} • ${s.specialty}.\n`;
    txtContent += `Estilo de Conselhos: ${s.signatureQuote}\n\n`;
}

fs.writeFileSync(txtPath, txtContent.trim() + '\n', 'utf-8');
console.log('✓ public/avatar/ex_drivers/avatar_drivers_data.txt gerado com sucesso!');

// 2. Atualiza src/lib/race-directors.ts adicionando avatarUrl e os novos strategists
const raceDirectorsPath = path.join(__dirname, '..', 'src', 'lib', 'race-directors.ts');
let rdContent = fs.readFileSync(raceDirectorsPath, 'utf-8');

// Adiciona avatarUrl na interface SeniorStrategist se não existir
if (!rdContent.includes('avatarUrl?: string;')) {
    rdContent = rdContent.replace(
        'biography: string;\n}',
        'biography: string;\n    avatarUrl?: string;\n}'
    );
}

// Para cada estrategista de 1 a 24, garante vírgula no biography e adiciona avatarUrl
for (let i = 1; i <= 24; i++) {
    const stratId = `strat-${String(i).padStart(2, '0')}`;
    const avatarUrl = `https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_${i}.jpg`;
    
    // Procura o bloco id: 'strat-XX' até a biography
    const blockRegex = new RegExp(`(id:\\s*'${stratId}'[\\s\\S]*?biography:\\s*['"][\\s\\S]*?['"])(,?\\s*\\n\\s*avatarUrl:[^\\n]+)?(\\s*\\n\\s*})`, 'g');
    rdContent = rdContent.replace(blockRegex, (match, p1, p2, p3) => {
        // remove qualquer vírgula final de p1
        const cleanP1 = p1.replace(/,\s*$/, '');
        return `${cleanP1},\n        avatarUrl: '${avatarUrl}'${p3}`;
    });
}

// Injeta os novos 6 estrategistas em SENIOR_STRATEGISTS antes do fechamento `];`
if (!rdContent.includes("id: 'strat-25'")) {
    const newItemsTs = STRATEGISTS_DATA.slice(24).map(s => {
        return `    {
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
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_${s.num}.jpg'
    }`;
    }).join(',\n');

    rdContent = rdContent.replace(
        /(\n\s*id:\s*'strat-24'[\s\S]*?avatarUrl:[^\n]+\n\s*})(\n\s*\];)/,
        `$1,\n${newItemsTs}$2`
    );
}

fs.writeFileSync(raceDirectorsPath, rdContent, 'utf-8');
console.log('✓ src/lib/race-directors.ts sincronizado com os 30 Estrategistas Sêniores e avatarUrl!');
