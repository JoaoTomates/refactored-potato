/**
 * TS1 Intelligence System // Senior Paddock Strategists & Race Directors
 * 
 * Lendas do paddock que correram entre os anos 1950 e 1980:
 * Todos pontuaram ou conquistaram pódios na F1, mas NUNCA venceram um GP.
 * 
 * A primeira letra é alterada aleatoriamente seguindo a Golden Rule (ex: "M.AMON").
 * Eles são "A Voz do Briefing" — conselheiros calejados que entregam os parâmetros
 * exatos de Poletime, Top 3, alertas de Escalada (EVO) e duelos H2H.
 */

export interface StrategistEvaluation {
    upvotes: number;
    downvotes: number;
    communityRating: number; // ex: 4.8
    totalEvaluations: number;
    accuracyRate: number;    // % histórica de assertividade (ex: 88.5%)
}

export interface SeniorStrategist {
    id: string;
    code: string;               // Padrão TS1: "M.AMON"
    displayName: string;        // "M. Amon"
    firstNameModified: string;  // Nome fictício alterado (ex: "Marcus")
    originalDriver: string;     // Piloto real (ex: "Chris Amon")
    decade: '1950s' | '1960s' | '1970s' | '1980s';
    careerStat: string;         // Histórico real: GPs, pódios, poles, 0 vitórias
    nationality: string;
    countryCode: string;
    title: string;              // Cargo de prestígio no paddock
    specialty: string;          // Especialidade técnica
    signatureQuote: string;     // Frase de impacto no briefing
    evaluation: StrategistEvaluation;
    
    // Dicas do Briefing Tático para o Usuário
    briefingTips: {
        poletimeTarget: string;       // Intervalo sugerido (ex: "1:31.950 – 1:32.300")
        poletimeReasoning: string;    // Por que esse tempo
        predictedTop3: string[];      // Pilotos sugeridos para o pódio
        top3Reasoning: string;        // Justificativa tática
        evoTargetDriver: string;      // Piloto para apostar no EVO (cumprindo punição ou com ritmo de recuperação)
        evoReasoning: string;         // Por que apostar nele no EVO
        dominantH2HDrivers: string[]; // Companheiros que dominam seus duelos internos neste traçado
        h2hReasoning: string;         // Análise do duelo
        miscRiskAlert: string;        // Probabilidade de Safety Car / chuva / quebra
    };
    
    biography: string;
}

export const SENIOR_STRATEGISTS: SeniorStrategist[] = [
    {
        id: 'strat-01',
        code: 'M.AMON',
        displayName: 'M. Amon',
        firstNameModified: 'Marcus',
        originalDriver: 'Chris Amon (1963–1976)',
        decade: '1960s',
        careerStat: '96 GPs • 11 Pódios • 5 Poles • 83 pts • 0 Vitórias',
        nationality: 'Neozelandês',
        countryCode: 'NZL',
        title: 'ESTRATEGISTA SÊNIOR // ESPECIALISTA EM TELEMETRIA DE VOLTA ÚNICA',
        specialty: 'Extração máxima de aderência em voltas de classificação e controle de pressão de óleo',
        signatureQuote: '“Eu liderei Grandes Prêmios com 30 segundos de vantagem até o motor explodir a três voltas do fim. Conheço cada armadilha invisível deste asfalto. Ouça a telemetria antes de apostar.”',
        evaluation: {
            upvotes: 1420,
            downvotes: 68,
            communityRating: 4.9,
            totalEvaluations: 1488,
            accuracyRate: 91.4
        },
        briefingTips: {
            poletimeTarget: '1:31.900 – 1:32.300',
            poletimeReasoning: 'A evolução de aderência no Q3 emborracha o Setor 3. Não subestime o vácuo na reta oposta de 1.200m.',
            predictedTop3: ['L.NORRIS', 'M.VERSTAPPEN', 'C.LECLERC'],
            top3Reasoning: 'McLaren possui a melhor sustentação aerodinâmica lateral no Setor 1; Verstappen compensará no ritmo de corrida.',
            evoTargetDriver: 'F.ALONSO (ou piloto punido no grid por troca de PU)',
            evoReasoning: 'Se algum piloto de ponta largar além de P12 por troca de motor, a reta com DRS triplo permite cortar pelo menos 6 carros.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'M.VERSTAPPEN (sobre Hadjar)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'A freada da Curva 1 exige sensibilidade extrema de pedal esquerdo. Pilotos experientes ganham 0.15s por volta.',
            miscRiskAlert: 'Safety Car com 67% de probabilidade. O funil da Curva 1 na largada é a zona de maior incidência de toque do ano.'
        },
        biography: 'Reconhecido como um dos pilotos mais rápidos e desafortunados da história. Sua leitura de desgaste de pneus no limite da quebra é considerada lendária no paddock.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_1.jpg'
    },
    {
        id: 'strat-02',
        code: 'T.WARWICK',
        displayName: 'T. Warwick',
        firstNameModified: 'Tobias',
        originalDriver: 'Derek Warwick (1981–1993)',
        decade: '1980s',
        careerStat: '146 GPs • 4 Pódios • 2 Voltas Rápidas • 71 pts • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'DIRETOR SÊNIOR DE COMBATE EM PELOTÃO INTERMEDIÁRIO',
        specialty: 'Gestão de combustível, resistência mecânica e emboscadas de pit stop',
        signatureQuote: '“Bati roda contra os maiores campeões da era turbo com carros que quebravam todo domingo. Sei exatamente quem vai arriscar ultrapassagem quando os pneus começarem a escorregar.”',
        evaluation: {
            upvotes: 1210,
            downvotes: 74,
            communityRating: 4.8,
            totalEvaluations: 1284,
            accuracyRate: 88.7
        },
        briefingTips: {
            poletimeTarget: '1:32.050 – 1:32.450',
            poletimeReasoning: 'A temperatura do asfalto acima de 42°C vai cozinhar o pneu dianteiro esquerdo nas curvas 3 e 4 se forçar demais na volta de saída.',
            predictedTop3: ['C.LECLERC', 'L.NORRIS', 'O.PIASTRI'],
            top3Reasoning: 'A Ferrari tem tração superior nas saídas de curva lenta do Setor 3. Se Leclerc largar na pole, o ritmo de defesa é sólido.',
            evoTargetDriver: 'C.SAINZ (largando com pneus duros para stint longo)',
            evoReasoning: 'Estratégia reversa de pneus (Duro -> Médio) costuma render salto de até +5 posições no pelotão intermediário.',
            dominantH2HDrivers: ['C.SAINZ (sobre Albon)', 'N.HULKENBERG (sobre Bortoleto)'],
            h2hReasoning: 'A gestão da janela de pit stop favorece quem conserva a borracha nos primeiros 10 giros.',
            miscRiskAlert: 'Virtual Safety Car quase certo entre as voltas 15 e 28 com abandono mecânico por superaquecimento.'
        },
        biography: 'Símbolo da era turbo dos anos 80, Warwick sobreviveu a acidentes brutais e acumulou um conhecimento enciclopédico de telemetria de corrida.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_2.jpg'
    },
    {
        id: 'strat-03',
        code: 'L.DECESARIS',
        displayName: 'L. De Cesaris',
        firstNameModified: 'Lorenzo',
        originalDriver: 'Andrea de Cesaris (1980–1994)',
        decade: '1980s',
        careerStat: '208 GPs • 5 Pódios • 1 Pole • 59 pts • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        specialty: 'Agressividade de largada, pilotagem sob pressão extrema e apostas de alto risco',
        title: 'CONSULTOR DE CENÁRIOS DE CAOS & AGRESSIVIDADE NO GRID',
        signatureQuote: '“Corri mais de duzentos GPs no fio da navalha. Se você quer ganhar pontos altos no TS1, não aposte no óbvio: aposte onde o asfalto vai quebrar os fracos.”',
        evaluation: {
            upvotes: 1530,
            downvotes: 110,
            communityRating: 4.7,
            totalEvaluations: 1640,
            accuracyRate: 86.9
        },
        briefingTips: {
            poletimeTarget: '1:31.850 – 1:32.200',
            poletimeReasoning: 'Condições de vento calmo favorecem ataque total nas zebras da curva 9. Tempo pode cair para a casa de 1:31 alto.',
            predictedTop3: ['M.VERSTAPPEN', 'L.HAMILTON', 'G.RUSSELL'],
            top3Reasoning: 'Se a corrida virar um festival de Safety Cars, Verstappen e Hamilton possuem o instinto predador para vencer no caos.',
            evoTargetDriver: 'E.OCON ou L.STROLL',
            evoReasoning: 'Especialistas em largadas caóticas e primeiros giros agressivos. Potencial de escalar 4 posições na primeira volta.',
            dominantH2HDrivers: ['M.VERSTAPPEN (sobre Hadjar)', 'C.LECLERC (sobre Hamilton)'],
            h2hReasoning: 'Na classificação pura, Leclerc arrisca mais na última tentativa do Q3.',
            miscRiskAlert: 'Bandeira vermelha com chance de 35%. Toques na Curva 1 costumam deixar detritos espalhados no asfalto.'
        },
        biography: 'O recordista de largadas na F1 sem vitória. Conhecido pela coragem insana e reflexos de piloto puro-sangue nas primeiras voltas.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_3.jpg'
    },
    {
        id: 'strat-04',
        code: 'A.BRUNDLE',
        displayName: 'A. Brundle',
        firstNameModified: 'Arthur',
        originalDriver: 'Martin Brundle (1984–1996)',
        decade: '1980s',
        careerStat: '158 GPs • 9 Pódios • 98 pts • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'ANALISTA CHEFE DE TELEMETRIA & LEITURA TÁTICA DE PROVA',
        specialty: 'Decomposição setor por setor, deltas de ultrapassagem e dinâmicas de ar turbulento',
        signatureQuote: '“Dividi a pista com Senna, Prost e Schumacher. O cronômetro nunca mente, mas a pressão psicológica destrói qualquer plano de pit stop. Mantenha a cabeça fria.”',
        evaluation: {
            upvotes: 1680,
            downvotes: 45,
            communityRating: 5.0,
            totalEvaluations: 1725,
            accuracyRate: 93.8
        },
        briefingTips: {
            poletimeTarget: '1:32.100 – 1:32.400',
            poletimeReasoning: 'A aderência no Setor 1 vai ditar a pole: quem perder 0.05s nos Esses não recupera na reta dos boxes.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'Ritmo dos stints longos com tanque cheio coloca Norris em vantagem marginal de 0.1s por volta.',
            evoTargetDriver: 'A.ALBON (Williams)',
            evoReasoning: 'A velocidade máxima de reta da Williams no speed trap permite ultrapassagens fáceis se largar atrás.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'Experiência em gerenciar a degradação térmica do composto C3 amarelo.',
            miscRiskAlert: 'Safety Car confirmado na janela entre voltas 20 e 35. Marque "SIM" em Event Props.'
        },
        biography: 'Ex-piloto de McLaren, Williams e Benetton, Brundle tornou-se a voz mais respeitada do jornalismo técnico e da análise de pitwall mundial.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_4.jpg'
    },
    {
        id: 'strat-05',
        code: 'D.JOHANSSON',
        displayName: 'D. Johansson',
        firstNameModified: 'Daniel',
        originalDriver: 'Stefan Johansson (1980–1991)',
        decade: '1980s',
        careerStat: '79 GPs • 12 Pódios • 88 pts • 0 Vitórias',
        nationality: 'Sueco',
        countryCode: 'SWE',
        title: 'CONSELHEIRO DE RESISTÊNCIA & REGULARIDADE DE CORRIDA',
        specialty: 'Constância cirúrgica, conservação de freios e pilotagem em ar limpo',
        signatureQuote: '“Subi 12 vezes ao pódio guiando por Ferrari e McLaren sem nunca cruzar em primeiro. O segredo da pontuação alta é a regularidade silenciosa enquanto os favoritos quebram.”',
        evaluation: {
            upvotes: 1140,
            downvotes: 52,
            communityRating: 4.8,
            totalEvaluations: 1192,
            accuracyRate: 89.2
        },
        briefingTips: {
            poletimeTarget: '1:32.000 – 1:32.350',
            poletimeReasoning: 'A temperatura de pista ao entardecer resfria 4°C, gerando mais downforce na reta principal.',
            predictedTop3: ['O.PIASTRI', 'L.NORRIS', 'C.SAINZ'],
            top3Reasoning: 'Piastri é um dos pilotos mais frios sob pressão em traçados ondulados e com alta exigência de tração.',
            evoTargetDriver: 'G.BORTOLETO (Audi)',
            evoReasoning: 'Excelente gestão de desgaste de pneus nos simuladores; chance de avançar até a zona de pontos se houver abandonos.',
            dominantH2HDrivers: ['C.SAINZ (sobre Albon)', 'F.ALONSO (sobre Stroll)'],
            h2hReasoning: 'Alonso tem ritmo de corrida 0.3s mais rápido que Stroll com pneus usados.',
            miscRiskAlert: 'Pouca probabilidade de bandeira vermelha, mas alta chance de Safety Car Virtual.'
        },
        biography: 'O sueco que pilotou para Enzo Ferrari e Ron Dennis. Mestre da paciência tática e sobrevivência em corridas de alta quebra mecânica.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_5.jpg'
    },
    {
        id: 'strat-06',
        code: 'S.CHEEVER',
        displayName: 'S. Cheever',
        firstNameModified: 'Stephen',
        originalDriver: 'Eddie Cheever (1978–1989)',
        decade: '1980s',
        careerStat: '132 GPs • 9 Pódios • 70 pts • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        title: 'ESTRATEGISTA CHEFE PARA CIRCUITOS DE ALTA VELOCIDADE & RETAS',
        specialty: 'Velocidade de ponta, frenagens no limite absoluto e duelos roda a roda',
        signatureQuote: '“Pilotei na Europa e na América do Norte. Se você não tem coragem de frear 20 metros depois na Curva 1, você não pertence ao pelotão da frente.”',
        evaluation: {
            upvotes: 1310,
            downvotes: 82,
            communityRating: 4.7,
            totalEvaluations: 1392,
            accuracyRate: 87.5
        },
        briefingTips: {
            poletimeTarget: '1:31.950 – 1:32.250',
            poletimeReasoning: 'O asfalto de Austin tem alta abrasividade que premia pilotos que atacam o ápice com mínima rotação de volante.',
            predictedTop3: ['M.VERSTAPPEN', 'L.NORRIS', 'G.RUSSELL'],
            top3Reasoning: 'A Red Bull volta a ser perigosa nas longas retas se acertar o mapa do diferencial traseiro.',
            evoTargetDriver: 'L.LAWSON (Racing Bulls)',
            evoReasoning: 'Piloto destemido nas frenagens; se largar no fundo, ganha 4 posições nas primeiras voltas.',
            dominantH2HDrivers: ['M.VERSTAPPEN (sobre Hadjar)', 'F.ALONSO (sobre Stroll)'],
            h2hReasoning: 'Alonso não dá margem interna para Stroll nos treinos classificatórios.',
            miscRiskAlert: 'Perda de tempo no pitlane de 21.4s torna a estratégia de 2 paradas a mais veloz no tempo total de corrida.'
        },
        biography: 'O norte-americano com mais largadas na história da Fórmula 1. Um duelista lendário que mais tarde venceu as 500 Milhas de Indianápolis.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_6.jpg'
    },
    {
        id: 'strat-07',
        code: 'C.JARIER',
        displayName: 'C. Jarier',
        firstNameModified: 'Claude',
        originalDriver: 'Jean-Pierre Jarier (1971–1983)',
        decade: '1970s',
        careerStat: '134 GPs • 3 Pódios • 3 Poles • 31.5 pts • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        title: 'ESPECIALISTA EM VELOCIDADE PURA & VOLTA LANÇADA',
        specialty: 'Aquecimento de compostos macios (C4/C5) e ataque no primeiro setor',
        signatureQuote: '“Eu cravava poles por mais de meio segundo e o carro quebrava na volta de apresentação. A velocidade você tem ou não tem. Não tenha medo de mirar o Poletime baixo.”',
        evaluation: {
            upvotes: 980,
            downvotes: 61,
            communityRating: 4.6,
            totalEvaluations: 1041,
            accuracyRate: 85.3
        },
        briefingTips: {
            poletimeTarget: '1:31.880 – 1:32.180',
            poletimeReasoning: 'Os compostos macios da Pirelli oferecem aderência pico por apenas 1 volta rápida. A janela no Q3 será curta.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'O.PIASTRI'],
            top3Reasoning: 'Primeira fila dominada por McLaren ou Ferrari; a disputa pela vitória será decidida no undercut da volta 16.',
            evoTargetDriver: 'P.GASLY (Alpine)',
            evoReasoning: 'Alpine ajustada para corrida com baixa pressão nas asas traseiras. Bom ritmo de ultrapassagem com DRS.',
            dominantH2HDrivers: ['C.LECLERC (sobre Hamilton)', 'L.NORRIS (sobre Piastri)'],
            h2hReasoning: 'Leclerc é o piloto mais explosivo do grid em volta de classificação.',
            miscRiskAlert: 'Risco de Safety Car nos primeiros 10 minutos após contatos na Curva 1 ou Curva 11.'
        },
        biography: 'Famoso pelo apelido "Jumper", era considerado um dos pilotos mais rápidos do mundo nos anos 70, com poles históricas pela Shadow e Lotus.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_7.jpg'
    },
    {
        id: 'strat-08',
        code: 'B.MARTINI',
        displayName: 'B. Martini',
        firstNameModified: 'Bruno',
        originalDriver: 'Pierluigi Martini (1984–1995)',
        decade: '1980s',
        careerStat: '119 GPs • 1 Primeira Fila • Liderou GP • 18 pts • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        title: 'MESTRE DE RESISTÊNCIA & CAÇADOR DE ZEBRAS NO GRID',
        specialty: 'Exploração de oportunidades em equipes modestas e leitura de pista emborrachada',
        signatureQuote: '“Coloquei uma Minardi na primeira fila do grid em Estoril e liderei corridas contra Williams e McLaren. Sei como o azarão pensa e onde ele vai atacar.”',
        evaluation: {
            upvotes: 1190,
            downvotes: 43,
            communityRating: 4.9,
            totalEvaluations: 1233,
            accuracyRate: 90.1
        },
        briefingTips: {
            poletimeTarget: '1:32.120 – 1:32.420',
            poletimeReasoning: 'Pista suja no início do Q1; a evolução dramática até o Q3 premiará quem sair na pista no último minuto.',
            predictedTop3: ['C.LECLERC', 'L.NORRIS', 'M.VERSTAPPEN'],
            top3Reasoning: 'Ferrari forte nas retas e excelente controle de temperatura nos pneus intermediários.',
            evoTargetDriver: 'N.HULKENBERG (Audi)',
            evoReasoning: 'Hülkenberg é mestre em extrair pontos quando os carros da frente se envolvem em toques.',
            dominantH2HDrivers: ['N.HULKENBERG (sobre Bortoleto)', 'F.ALONSO (sobre Stroll)'],
            h2hReasoning: 'A experiência de veterano faz a diferença na gestão de pneus nas curvas 16 a 18.',
            miscRiskAlert: 'Média de 2.1 abandonos mecânicos por corrida nesta etapa. Fique atento para opções de DNF.'
        },
        biography: 'O coração da lendária escuderia Minardi. Piloto técnico e cirúrgico que extraía milagres de carros com orçamentos modestos.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_8.jpg'
    },
    {
        id: 'strat-09',
        code: 'R.FABI',
        displayName: 'R. Fabi',
        firstNameModified: 'Renato',
        originalDriver: 'Teo Fabi (1982–1987)',
        decade: '1980s',
        careerStat: '64 GPs • 2 Pódios • 3 Poles • 23 pts • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        title: 'ESTRATEGISTA DE POLE POSITION & PRESSÃO AERODINÂMICA',
        specialty: 'Configuração de asa móvel, equilíbrio de freios e aerodinâmica de alta pressão',
        signatureQuote: '“Fiz a pole em Monza a mais de 250 km/h de média com o motor BMW de mil cavalos. O Poletime é uma questão de confiança cega na entrada da curva rápida.”',
        evaluation: {
            upvotes: 1050,
            downvotes: 55,
            communityRating: 4.8,
            totalEvaluations: 1105,
            accuracyRate: 88.2
        },
        briefingTips: {
            poletimeTarget: '1:31.920 – 1:32.220',
            poletimeReasoning: 'A asa traseira de média-alta carga será crucial nas curvas de raio duplo do Setor 3.',
            predictedTop3: ['L.NORRIS', 'M.VERSTAPPEN', 'G.RUSSELL'],
            top3Reasoning: 'Mercedes-AMG com novo difusor ganha estabilidade preciosa em mudanças rápidas de direção.',
            evoTargetDriver: 'K.ANTONELLI (Mercedes)',
            evoReasoning: 'Jovem talento com carro de ponta; se qualificar mal por erro de volta rápida, escala com facilidade.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'M.VERSTAPPEN (sobre Hadjar)'],
            h2hReasoning: 'Verstappen não cede espaço nos treinos livres e dita o acerto de chassi.',
            miscRiskAlert: 'Chance de Safety Car elevada devido à ausência de grandes áreas de escape na saída da curva 19.'
        },
        biography: 'Engenheiro aeronáutico de formação e piloto de F1 com três poles no currículo. Conhecido pelo intelecto refinado na telemetria.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_9.jpg'
    },
    {
        id: 'strat-10',
        code: 'K.STUCK',
        displayName: 'K. Stuck',
        firstNameModified: 'Klaus',
        originalDriver: 'Hans-Joachim Stuck (1974–1979)',
        decade: '1970s',
        careerStat: '74 GPs • 2 Pódios • 29 pts • 0 Vitórias',
        nationality: 'Alemão',
        countryCode: 'GER',
        title: 'ESPECIALISTA EM PISTA MOLHADA & CONTROLE DE TRAÇÃO',
        specialty: 'Leitura de nuvens de chuva, drenagem de asfalto e pilotagem no molhado',
        signatureQuote: '“Corri em Nürburgring debaixo de tempestades com carros sem nenhuma eletrônica. Se a chuva vier, os pilotos de simulador entram em pânico e a nossa estratégia vence.”',
        evaluation: {
            upvotes: 1390,
            downvotes: 50,
            communityRating: 4.9,
            totalEvaluations: 1440,
            accuracyRate: 92.1
        },
        briefingTips: {
            poletimeTarget: '1:32.150 – 1:32.480',
            poletimeReasoning: 'Vento cruzado no Setor 1 desestabiliza a dianteira do carro nas curvas 3 e 4. Tempos sobem ligeiramente.',
            predictedTop3: ['M.VERSTAPPEN', 'L.HAMILTON', 'F.ALONSO'],
            top3Reasoning: 'Se a meteorologia indicar chuva repentina (mesmo 20% de risco), aposte nos três maiores mestres da pista molhada.',
            evoTargetDriver: 'F.COLAPINTO (Alpine)',
            evoReasoning: 'Estilo agressivo que se destaca em condições mutáveis de asfalto seco e úmido.',
            dominantH2HDrivers: ['F.ALONSO (sobre Stroll)', 'M.VERSTAPPEN (sobre Hadjar)'],
            h2hReasoning: 'Alonso tem vantagem monstruosa em pistas técnicas.',
            miscRiskAlert: 'Se chover durante a prova, acionamento do Safety Car é 100% certo.'
        },
        biography: 'O gigante alemão apelidado de "Regenkönig" (Rei da Chuva). Bicampeão das 24 Horas de Le Mans e mestre da pilotagem em condições adversas.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_10.jpg'
    },
    {
        id: 'strat-11',
        code: 'G.HAILWOOD',
        displayName: 'G. Hailwood',
        firstNameModified: 'Graham',
        originalDriver: 'Mike Hailwood (1963–1974)',
        decade: '1960s',
        careerStat: '50 GPs • 2 Pódios • 29 pts • 9 Títulos Mundiais de Motovelocidade • 0 Vitórias F1',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'CONSELHEIRO DE CORAGEM TÁTICA & TRAÇADO NO LIMITE',
        specialty: 'Transição de zebras, linhas de tangência ousadas e determinação sob pressão',
        signatureQuote: '“Venci nove títulos mundiais nas motos antes de pilotar na F1. A coragem de colocar o carro onde ninguém coloca é o que separa um pontuador de um campeão.”',
        evaluation: {
            upvotes: 1250,
            downvotes: 60,
            communityRating: 4.8,
            totalEvaluations: 1310,
            accuracyRate: 89.6
        },
        briefingTips: {
            poletimeTarget: '1:32.000 – 1:32.300',
            poletimeReasoning: 'O ponto de tangência na curva 19 exige passar a 2 centímetros da linha limite para não perder 0.1s na reta final.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'Norris vem com acerto aerodinâmico perfeito para suportar as ondulações de Austin.',
            evoTargetDriver: 'C.SAINZ (Williams)',
            evoReasoning: 'Ritmo sólido em corrida; larga bem e protege posição com habilidade rara.',
            dominantH2HDrivers: ['C.SAINZ (sobre Albon)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'Russell impõe autoridade interna nos treinos classificatórios.',
            miscRiskAlert: 'Atenção aos toques na Curva 1: quem não aliviar na freada vai direto para a caixa de brita.'
        },
        biography: 'Conhecido como "Mike the Bike", uma das figuras mais amadas e heróicas da história do automobilismo, condecorado pela bravura ao salvar Clay Regazzoni das chamas.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_11.jpg'
    },
    {
        id: 'strat-12',
        code: 'F.MERZARIO',
        displayName: 'F. Merzario',
        firstNameModified: 'Franco',
        originalDriver: 'Arturo Merzario (1972–1979)',
        decade: '1970s',
        careerStat: '85 GPs • 11 pts pela Ferrari e Williams • 0 Vitórias',
        nationality: 'Italiano',
        countryCode: 'ITA',
        title: 'OFICIAL DE RESGATE TÁTICO & SOBREVIVÊNCIA DE MOTOR',
        specialty: 'Confiabilidade térmica, temperatura de baterias híbridas e largadas limpas',
        signatureQuote: '“Tirei Niki Lauda do fogo em Nürburgring porque nas pistas a vida e a estratégia não aceitam hesitação de um segundo sequer. Seja rápido nas suas decisões.”',
        evaluation: {
            upvotes: 1480,
            downvotes: 40,
            communityRating: 5.0,
            totalEvaluations: 1520,
            accuracyRate: 94.2
        },
        briefingTips: {
            poletimeTarget: '1:32.080 – 1:32.380',
            poletimeReasoning: 'O vento de cauda na subida da Curva 1 reduz o arrasto na frenagem. Carros vão travar rodas se frearem no ponto habitual.',
            predictedTop3: ['C.LECLERC', 'M.VERSTAPPEN', 'L.HAMILTON'],
            top3Reasoning: 'A Ferrari tem pacote híbrido com excelente recuperação de energia no Setor 2.',
            evoTargetDriver: 'L.STROLL (Aston Martin)',
            evoReasoning: 'Aston Martin com novo assoalho tem boa velocidade de cruzeiro para avançar no pelotão intermediário.',
            dominantH2HDrivers: ['F.ALONSO (sobre Stroll)', 'C.LECLERC (sobre Hamilton)'],
            h2hReasoning: 'Alonso dita o ritmo da Aston Martin em 100% dos Grandes Prêmios.',
            miscRiskAlert: 'Safety Car virtual altamente provável nas voltas 10 a 20 para retirada de carros quebrados.'
        },
        biography: 'O homem do chapéu de caubói que pilotou pela Scuderia Ferrari e entrou para a história mundial pelo heroísmo em Nürburgring 1976.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_12.jpg'
    },
    {
        id: 'strat-13',
        code: 'N.SURER',
        displayName: 'N. Surer',
        firstNameModified: 'Niklaus',
        originalDriver: 'Marc Surer (1979–1986)',
        decade: '1980s',
        careerStat: '82 GPs • 1 Volta Mais Rápida • 17 pts • 0 Vitórias',
        nationality: 'Suíço',
        countryCode: 'SUI',
        title: 'ANALISTA DE RITMO DE CORRIDA & TELEMETRIA DINÂMICA',
        specialty: 'Curvas de aceleração lateral, volta mais rápida e pressão de pneus Pirelli',
        signatureQuote: '“Fiz a volta mais rápida em Brands Hatch com um Brabham-BMW turbo quando ninguém esperava. A volta mais rápida sempre cai no colo de quem para no fim com pneus novos.”',
        evaluation: {
            upvotes: 1120,
            downvotes: 62,
            communityRating: 4.7,
            totalEvaluations: 1182,
            accuracyRate: 87.8
        },
        briefingTips: {
            poletimeTarget: '1:31.980 – 1:32.280',
            poletimeReasoning: 'A aderência melhora 0.2s por tentativa na classificação conforme a borracha se deposita no asfalto texano.',
            predictedTop3: ['L.NORRIS', 'O.PIASTRI', 'M.VERSTAPPEN'],
            top3Reasoning: 'Dobradinha da McLaren no pódio é um cenário muito viável com a consistência de Woking.',
            evoTargetDriver: 'E.OCON (Haas)',
            evoReasoning: 'A Haas é veloz em linha reta e Ocon é difícil de ultrapassar quando ganha posições no undercut.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'Piastri é rápido, mas Norris é mais agressivo na curva 1.',
            miscRiskAlert: 'Volta mais rápida conquistada por piloto do Top 5 parando na volta 52 com compostos macios novos.'
        },
        biography: 'Piloto suíço de grande precisão e atual comentarista técnico internacional, reverenciado pela sobriedade nas análises de telemetria.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_13.jpg'
    },
    {
        id: 'strat-14',
        code: 'P.GANLEY',
        displayName: 'P. Ganley',
        firstNameModified: 'Philip',
        originalDriver: 'Howden Ganley (1971–1974)',
        decade: '1970s',
        careerStat: '41 GPs • 10 pts pela BRM • 0 Vitórias',
        nationality: 'Neozelandês',
        countryCode: 'NZL',
        title: 'AUDITOR DE CONFORMIDADE MECÂNICA & CRONOMETRAGEM',
        specialty: 'Conformidade de assoalho, mapas de motor e tolerância de componentes',
        signatureQuote: '“Fui um dos fundadores da Tiga Race Cars e piloto de fábrica da BRM. As corridas não são vencidas no discurso, são vencidas na prancheta antes do primeiro treino.”',
        evaluation: {
            upvotes: 950,
            downvotes: 48,
            communityRating: 4.7,
            totalEvaluations: 998,
            accuracyRate: 86.4
        },
        briefingTips: {
            poletimeTarget: '1:32.100 – 1:32.400',
            poletimeReasoning: 'Cuidado com os limites de pista na saída da Curva 19: tempos deletados pelo TS1 vão bagunçar a ordem de largada.',
            predictedTop3: ['M.VERSTAPPEN', 'L.NORRIS', 'C.LECLERC'],
            top3Reasoning: 'Equilíbrio máximo entre os três líderes do campeonato; decisão por menos de 2 segundos de margem na bandeirada.',
            evoTargetDriver: 'A.ALBON (Williams)',
            evoReasoning: 'Albon costuma pontuar quando a estratégia opta por pneus duros e stint de 30 voltas.',
            dominantH2HDrivers: ['M.VERSTAPPEN (sobre Hadjar)', 'C.SAINZ (sobre Albon)'],
            h2hReasoning: 'Verstappen mantém vantagem constante de 0.4s sobre seu parceiro de equipe.',
            miscRiskAlert: 'Desgaste da prancha de madeira sob o chassi nas ondulações do Setor 1: risco de desclassificação pós-corrida.'
        },
        biography: 'Membro de honra do BRDC e construtor lendário, Ganley é uma enciclopédia viva de engenharia de chassi e mecânica de competição.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_14.jpg'
    },
    {
        id: 'strat-15',
        code: 'E.DONOHUE',
        displayName: 'E. Donohue',
        firstNameModified: 'Edward',
        originalDriver: 'Mark Donohue (1971–1975)',
        decade: '1970s',
        careerStat: '14 GPs • 1 Pódio • 8 pts • Campeão Indy 500 • 0 Vitórias F1',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        title: 'DIRETOR DE ENGENHARIA DE SUSPENSÃO & PRESSÃO DE PNEU',
        specialty: 'Distribuição de peso, rigidez de amortecedores e velocidade em curvas de raio longo',
        signatureQuote: '“Eles chamavam minha busca por velocidade de \'The Unfair Advantage\'. Se você quer vencer no TS1, use a inteligência para encontrar a brecha que os outros não viram.”',
        evaluation: {
            upvotes: 1410,
            downvotes: 52,
            communityRating: 4.9,
            totalEvaluations: 1462,
            accuracyRate: 91.8
        },
        briefingTips: {
            poletimeTarget: '1:31.910 – 1:32.210',
            poletimeReasoning: 'A rigidez da suspensão dianteira no Setor 1 permite carregar 5 km/h a mais de velocidade de ápice nas curvas 5 e 6.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'McLaren com acerto voltado para curvas rápidas; Ferrari com velocidade pura de reta.',
            evoTargetDriver: 'F.ALONSO (Aston Martin)',
            evoReasoning: 'Mestre em economizar pneus no ar turbulento para atacar nas voltas finais.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'F.ALONSO (sobre Stroll)'],
            h2hReasoning: 'Alonso sempre extrai 100% do carro em circuitos exigentes.',
            miscRiskAlert: 'Perda média de 21.4s no pitlane favorece estratégia agressiva de duas paradas.'
        },
        biography: 'Lenda do automobilismo americano, formado em engenharia mecânica pela Universidade de Brown. Um dos pilotos mais científicos de todos os tempos.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_15.jpg'
    },
    {
        id: 'strat-16',
        code: 'V.SCHENKEN',
        displayName: 'V. Schenken',
        firstNameModified: 'Victor',
        originalDriver: 'Tim Schenken (1970–1974)',
        decade: '1970s',
        careerStat: '36 GPs • 1 Pódio • 7 pts pela Brabham • 0 Vitórias',
        nationality: 'Australiano',
        countryCode: 'AUS',
        title: 'COORDENADOR DE SINALIZAÇÃO & PROCEDIMENTOS DE LARGADA',
        specialty: 'Tempo de reação na luz vermelha, controle de embreagem e temperatura de freio',
        signatureQuote: '“Subi ao pódio com a Brabham em Zeltweg e depois passei décadas como diretor de provas internacional. A corrida se ganha na concentração dos primeiros 300 metros.”',
        evaluation: {
            upvotes: 990,
            downvotes: 51,
            communityRating: 4.7,
            totalEvaluations: 1041,
            accuracyRate: 87.2
        },
        briefingTips: {
            poletimeTarget: '1:32.090 – 1:32.390',
            poletimeReasoning: 'Pista fria nas primeiras voltas da qualificação; a volta de desaceleração para recarregar a bateria deve ser cirúrgica.',
            predictedTop3: ['M.VERSTAPPEN', 'L.NORRIS', 'C.LECLERC'],
            top3Reasoning: 'Três pilotos com consistência matemática em todas as simulações.',
            evoTargetDriver: 'L.LAWSON (Racing Bulls)',
            evoReasoning: 'Excelente aproveitamento de relargadas sob Safety Car.',
            dominantH2HDrivers: ['M.VERSTAPPEN (sobre Hadjar)', 'C.SAINZ (sobre Albon)'],
            h2hReasoning: 'Sainz tem ritmo de adaptação rápida em pistas norte-americanas.',
            miscRiskAlert: 'Atenção aos toques na Curva 1: o risco de asa dianteira quebrada é crítico.'
        },
        biography: 'Piloto oficial de Brabham e Surtees nos anos 70, Schenken tornou-se posteriormente um dos diretores de prova mais respeitados do TS1 em todo o mundo.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_16.jpg'
    },
    {
        id: 'strat-17',
        code: 'O.KLING',
        displayName: 'O. Kling',
        firstNameModified: 'Otto',
        originalDriver: 'Karl Kling (1954–1955)',
        decade: '1950s',
        careerStat: '11 GPs • 2 Pódios • 17 pts pela Mercedes-Benz • 0 Vitórias',
        nationality: 'Alemão',
        countryCode: 'GER',
        title: 'ESTRATEGISTA PATRIARCA // PROTOCOLOS DE ENGENHARIA METÓDICA',
        specialty: 'Confiabilidade extrema, tolerância de componentes e disciplina germânica',
        signatureQuote: '“Dividi a equipe com Juan Manuel Fangio na lendária frota da Mercedes dos anos 50. A vitória não é fruto do acaso; é a consequência inevitável da preparação sem falhas.”',
        evaluation: {
            upvotes: 1280,
            downvotes: 42,
            communityRating: 4.9,
            totalEvaluations: 1322,
            accuracyRate: 91.5
        },
        briefingTips: {
            poletimeTarget: '1:31.940 – 1:32.240',
            poletimeReasoning: 'Aceleração limpa na saída da Curva 20 projeta velocidade máxima no retão de largada. Não erre o ponto de tangência.',
            predictedTop3: ['L.NORRIS', 'G.RUSSELL', 'M.VERSTAPPEN'],
            top3Reasoning: 'Motores Mercedes com excelente eficiência térmica no ar quente do Texas.',
            evoTargetDriver: 'K.ANTONELLI (Mercedes)',
            evoReasoning: 'Carro veloz nas mãos de um piloto ávido por recuperação de terreno.',
            dominantH2HDrivers: ['G.RUSSELL (sobre Antonelli)', 'L.NORRIS (sobre Piastri)'],
            h2hReasoning: 'Russell é metódico no gerenciamento de combustível e freios.',
            miscRiskAlert: 'Degradação térmica alta nos compostos macios C4: evitar stints com mais de 14 voltas.'
        },
        biography: 'Braço direito de Alfred Neubauer na lendária equipe Mercedes-Benz das Flechas de Prata nos anos 1950. Vencedor da Carrera Panamericana.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_17.jpg'
    },
    {
        id: 'strat-18',
        code: 'J.SCHELL',
        displayName: 'J. Schell',
        firstNameModified: 'Jean',
        originalDriver: 'Harry Schell (1950–1960)',
        decade: '1950s',
        careerStat: '56 GPs • 2 Pódios • 32 pts por Maserati e BRM • 0 Vitórias',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        title: 'CONSULTOR DE COMBATE EM TRAÇADOS NORTE-AMERICANOS',
        specialty: 'Adaptação a ondulações, derrapagens controladas e corridas de desgaste',
        signatureQuote: '“Fui o primeiro americano a largar em um GP oficial de F1 em Mônaco 1950. Sei como a pista fala com o piloto quando o asfalto está quente.”',
        evaluation: {
            upvotes: 940,
            downvotes: 56,
            communityRating: 4.6,
            totalEvaluations: 996,
            accuracyRate: 85.9
        },
        briefingTips: {
            poletimeTarget: '1:32.100 – 1:32.400',
            poletimeReasoning: 'O asfalto de Austin recompensa quem deixa o carro fluir sem lutar contra o volante nas curvas lentas.',
            predictedTop3: ['C.LECLERC', 'L.NORRIS', 'M.VERSTAPPEN'],
            top3Reasoning: 'Ferrari com excelente tração mecânica no complexo do estádio.',
            evoTargetDriver: 'C.SAINZ (Williams)',
            evoReasoning: 'Sainz sabe manter o ritmo quando os pneus dos adversários começam a esfarelar.',
            dominantH2HDrivers: ['C.LECLERC (sobre Hamilton)', 'F.ALONSO (sobre Stroll)'],
            h2hReasoning: 'Leclerc é mais rápido em voltas limpas.',
            miscRiskAlert: 'Probabilidade de Safety Car de 67%: ótima oportunidade para trocas gratuitas de pneus.'
        },
        biography: 'Pioneiro norte-americano na Europa dos anos 50, famoso pelo estilo arrojado, carisma gigante e pódios memoráveis pela Maserati e BRM.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_18.jpg'
    },
    {
        id: 'strat-19',
        code: 'H.LEWISEVANS',
        displayName: 'H. Lewis-Evans',
        firstNameModified: 'Hugh',
        originalDriver: 'Stuart Lewis-Evans (1957–1958)',
        decade: '1950s',
        careerStat: '14 GPs • 2 Pódios • 2 Poles • 16 pts pela Vanwall • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'MESTRE DE QUALIFICAÇÃO DA PRIMEIRA GERAÇÃO',
        specialty: 'Traçado de linha perfeita, tempo ao milésimo e precisão milimétrica',
        signatureQuote: '“Cravar a pole com Stirling Moss e Tony Brooks como companheiros de equipe na Vanwall me ensinou que o milésimo mora na respiração do piloto.”',
        evaluation: {
            upvotes: 1180,
            downvotes: 45,
            communityRating: 4.8,
            totalEvaluations: 1225,
            accuracyRate: 89.4
        },
        briefingTips: {
            poletimeTarget: '1:31.930 – 1:32.230',
            poletimeReasoning: 'Cada curva do Setor 1 alimenta a seguinte: se errar a entrada na Curva 3, você perde tempo até a Curva 7.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'Norris tem a melhor precisão de tangência no Setor 1.',
            evoTargetDriver: 'A.ALBON (Williams)',
            evoReasoning: 'Williams com asas de baixo arrasto tem vantagem nas ultrapassagens da reta oposta.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'A experiência de qualificação pesa nos minutos finais do Q3.',
            miscRiskAlert: 'Bandeira amarela provável nos primeiros 5 minutos de qualificação.'
        },
        biography: 'Pupilo de Bernie Ecclestone nos anos 50 e gênio da qualificação na lendária equipe britânica Vanwall que conquistou o primeiro título de construtores da F1.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_19.jpg'
    },
    {
        id: 'strat-20',
        code: 'R.GODIA',
        displayName: 'R. Godia',
        firstNameModified: 'Rodrigo',
        originalDriver: 'Paco Godia (1951–1958)',
        decade: '1950s',
        careerStat: '14 GPs • 6 pts pela Maserati • Primeiro piloto espanhol a pontuar na F1 • 0 Vitórias',
        nationality: 'Espanhol',
        countryCode: 'ESP',
        title: 'CONSULTOR DE RESISTÊNCIA & REGULARIDADE IBÉRICA',
        specialty: 'Gestão de freios, conservação de caixa de câmbio e finais de corrida',
        signatureQuote: '“Fui o primeiro espanhol a pontuar na história da F1 quando os freios eram tambores de metal que derretiam no calor. Sei exatamente quando poupar e quando atacar.”',
        evaluation: {
            upvotes: 910,
            downvotes: 42,
            communityRating: 4.7,
            totalEvaluations: 952,
            accuracyRate: 86.8
        },
        briefingTips: {
            poletimeTarget: '1:32.120 – 1:32.420',
            poletimeReasoning: 'O calor de 44°C no asfalto vai exigir cautela na tração da curva 11 para não superaquecer os pneus traseiros.',
            predictedTop3: ['F.ALONSO', 'C.SAINZ', 'L.NORRIS'],
            top3Reasoning: 'A escola espanhola tem sensibilidade especial para pistas de alta abrasividade como Austin.',
            evoTargetDriver: 'F.ALONSO (Aston Martin)',
            evoReasoning: 'Alonso sempre ganha terreno na segunda metade da corrida quando os freios dos adversários entram em fadiga.',
            dominantH2HDrivers: ['F.ALONSO (sobre Stroll)', 'C.SAINZ (sobre Albon)'],
            h2hReasoning: 'Alonso não erra pontos de frenagem.',
            miscRiskAlert: 'Média de 2 carros quebrando por superaquecimento no terço final.'
        },
        biography: 'Pioneiro do automobilismo espanhol, pontuou nos anos 50 ao lado de lendas como Fangio e Moss pela Maserati oficial de fábrica.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_20.jpg'
    },
    {
        id: 'strat-21',
        code: 'K.BIRA',
        displayName: 'K. Bira',
        firstNameModified: 'Kasem',
        originalDriver: 'Prince Bira (1950–1954)',
        decade: '1950s',
        careerStat: '19 GPs • 8 pts • Liderou GPs pela Maserati • 0 Vitórias',
        nationality: 'Tailandês',
        countryCode: 'THA',
        title: 'ESTRATEGISTA DE FLUXO & FINESSE DE PILOTAGEM',
        specialty: 'Movimentos suaves de volante, conservação de pneus e leitura de fluxo de ar',
        signatureQuote: '“A velocidade verdadeira não vem da violência sobre o acelerador, vem da harmonia entre o fluxo aerodinâmico e o peso do chassi.”',
        evaluation: {
            upvotes: 1100,
            downvotes: 49,
            communityRating: 4.8,
            totalEvaluations: 1149,
            accuracyRate: 88.9
        },
        briefingTips: {
            poletimeTarget: '1:32.020 – 1:32.320',
            poletimeReasoning: 'A Curva 19 é a mais técnica: quem derrapar perde toda a velocidade de lançamento para a linha de chegada.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'Norris tem o estilo de pilotagem mais fluido da atualidade, perfeito para o Setor 1 de Austin.',
            evoTargetDriver: 'A.ALBON (Williams)',
            evoReasoning: 'Albon pilota sob a bandeira tailandesa com enorme garra nas disputas de pelotão intermediário.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'C.SAINZ (sobre Albon)'],
            h2hReasoning: 'Norris mantém vantagem em voltas consecutivas sem tráfego.',
            miscRiskAlert: 'Safety Car provável nas primeiras 15 voltas por detritos na Curva 1.'
        },
        biography: 'Príncipe Birabongse Bhanudej da Tailândia, uma das figuras mais aristocráticas e lendárias dos primórdios do automobilismo europeu de Grandes Prêmios.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_21.jpg'
    },
    {
        id: 'strat-22',
        code: 'W.ALLISON',
        displayName: 'W. Allison',
        firstNameModified: 'Walter',
        originalDriver: 'Cliff Allison (1958–1961)',
        decade: '1950s',
        careerStat: '16 GPs • 1 Pódio • 11 pts pela Ferrari • 0 Vitórias',
        nationality: 'Britânico',
        countryCode: 'GBR',
        title: 'ESPECIALISTA EM ENGENHARIA DE MOTORES CLÁSSICOS & PRESSÃO',
        specialty: 'Equilíbrio térmico de motor, relações de marcha e pilotagem defensiva',
        signatureQuote: '“Guiar uma Ferrari oficial nos anos 50 me ensinou que o peso da fábrica está sobre o estrategista em cada volta. Um erro de pit stop custa o campeonato.”',
        evaluation: {
            upvotes: 930,
            downvotes: 41,
            communityRating: 4.7,
            totalEvaluations: 971,
            accuracyRate: 86.7
        },
        briefingTips: {
            poletimeTarget: '1:32.060 – 1:32.360',
            poletimeReasoning: 'A subida íngreme da Curva 1 rouba torque se a marcha não for reduzida no momento milimétrico.',
            predictedTop3: ['C.LECLERC', 'L.NORRIS', 'M.VERSTAPPEN'],
            top3Reasoning: 'Ferrari com excelente pacote de potência na saída de curva lenta.',
            evoTargetDriver: 'C.SAINZ (Williams)',
            evoReasoning: 'Sainz sabe manter a posição com maestria defensiva.',
            dominantH2HDrivers: ['C.LECLERC (sobre Hamilton)', 'M.VERSTAPPEN (sobre Hadjar)'],
            h2hReasoning: 'Leclerc é mais agressivo na tomada de tempo da qualificação.',
            miscRiskAlert: 'Risco de superaquecimento de freios na longa freada da Curva 12 após a reta oposta.'
        },
        biography: 'Piloto oficial de fábrica da Scuderia Ferrari e Lotus, conquistou pódio memorável no GP da Argentina de 1960.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_22.jpg'
    },
    {
        id: 'strat-23',
        code: 'Z.GREGORY',
        displayName: 'Z. Gregory',
        firstNameModified: 'Zachary',
        originalDriver: 'Masten Gregory (1957–1965)',
        decade: '1950s',
        careerStat: '43 GPs • 3 Pódios • 21 pts por Maserati e Cooper • 0 Vitórias F1',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        title: 'MESTRE DE LARGADAS FULMINANTES & ATAQUE DESENFREADO',
        specialty: 'Largadas sem hesitação, ultrapassagens por fora e pilotagem de óculos grossos',
        signatureQuote: '“Chamavam-me de \'The Kansas City Flash\'. Se havia um espaço do tamanho de um pneu na entrada da curva, eu enfiava o carro. É assim que se ganha no EVO.”',
        evaluation: {
            upvotes: 1190,
            downvotes: 65,
            communityRating: 4.8,
            totalEvaluations: 1255,
            accuracyRate: 88.4
        },
        briefingTips: {
            poletimeTarget: '1:31.960 – 1:32.260',
            poletimeReasoning: 'O asfalto de Austin recompensa a agressividade nas curvas rápidas do Setor 1.',
            predictedTop3: ['M.VERSTAPPEN', 'L.NORRIS', 'G.RUSSELL'],
            top3Reasoning: 'Verstappen e Norris têm o estilo mais incisivo na entrada de curva.',
            evoTargetDriver: 'L.LAWSON (Racing Bulls)',
            evoReasoning: 'Lawson tem a mesma garra de atacar em qualquer espaço mínimo na primeira volta.',
            dominantH2HDrivers: ['M.VERSTAPPEN (sobre Hadjar)', 'L.NORRIS (sobre Piastri)'],
            h2hReasoning: 'Verstappen não comete erros sob pressão.',
            miscRiskAlert: 'Acionamento do Safety Car é quase certeza após disputas na Curva 1.'
        },
        biography: 'Piloto norte-americano lendário e míope, que corria com óculos grossos e venceu as 24 Horas de Le Mans de 1965 com Jochen Rindt em uma Ferrari NART.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_23.jpg'
    },
    {
        id: 'strat-24',
        code: 'T.STREIFF',
        displayName: 'T. Streiff',
        firstNameModified: 'Thierry',
        originalDriver: 'Philippe Streiff (1984–1988)',
        decade: '1980s',
        careerStat: '53 GPs • 1 Pódio • 11 pts por Ligier e Tyrrell • 0 Vitórias',
        nationality: 'Francês',
        countryCode: 'FRA',
        title: 'DEFENSOR DE DETERMINAÇÃO & ANÁLISE DE SEGURANÇA',
        specialty: 'Determinação sob condições adversas e consistência de ritmo em circuitos técnicos',
        signatureQuote: '“A Fórmula 1 exige respeito absoluto aos limites da física. Quando você analisa a telemetria, não veja apenas números: veja a vida do piloto e o destino da equipe.”',
        evaluation: {
            upvotes: 1220,
            downvotes: 38,
            communityRating: 4.9,
            totalEvaluations: 1258,
            accuracyRate: 91.2
        },
        briefingTips: {
            poletimeTarget: '1:32.040 – 1:32.340',
            poletimeReasoning: 'O desgaste no pneu dianteiro esquerdo dita o ritmo de todo o fim de semana.',
            predictedTop3: ['L.NORRIS', 'C.LECLERC', 'M.VERSTAPPEN'],
            top3Reasoning: 'Os três líderes têm carros equilibrados para todos os tipos de curva de Austin.',
            evoTargetDriver: 'P.GASLY (Alpine)',
            evoReasoning: 'Gasly é consistente e sabe aproveitar os abandonos mecânicos dos carros à frente.',
            dominantH2HDrivers: ['L.NORRIS (sobre Piastri)', 'G.RUSSELL (sobre Antonelli)'],
            h2hReasoning: 'Russell é implacável na regularidade de volta rápida.',
            miscRiskAlert: 'Média histórica de DNF em Austin é de 2.1 carros: posicione suas escolhas de pontuação com cautela.'
        },
        biography: 'Piloto francês heroico que conquistou pódio memorável no GP da Austrália de 1985 pela Ligier, admirado mundialmente pela coragem e dedicação ao automobilismo.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_24.jpg'
    },
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
        biography: 'Ícone da March Leyton House de Adrian Newey e ex-piloto de Maranello, mestre em compreender a sensibilidade aerodinâmica de carros no limite.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_30.jpg'
    }
];

/**
 * Retorna o estrategista sênior pelo código canônico (ex: "M.AMON")
 */
export function getSeniorStrategistByCode(code: string): SeniorStrategist | undefined {
    const clean = code.toUpperCase().trim();
    return SENIOR_STRATEGISTS.find(st => st.code === clean);
}

/**
 * Retorna o estrategista sênior pelo ID
 */
export function getSeniorStrategistById(id: string): SeniorStrategist | undefined {
    return SENIOR_STRATEGISTS.find(st => st.id === id);
}

/**
 * Retorna o estrategista sênior responsável pelo briefing de uma determinada rodada
 */
export function getSeniorStrategistForRound(roundNumber: number): SeniorStrategist {
    const idx = (roundNumber - 1) % SENIOR_STRATEGISTS.length;
    return SENIOR_STRATEGISTS[idx];
}

export type AllianceBlock = 'A' | 'B' | 'C';

export interface StrategistVoiceMessage {
    callsign: string;
    toneTitle: string;
    radioTransmission: string;
    tacticalOrder: string;
    accentBadge: string;
}

/**
 * Matriz de Personalidade e Tom do Estrategista Sênior:
 * Modula a transmissão de rádio conforme o Bloco/Aliança (A, B ou C),
 * a nacionalidade do piloto e o histórico do veterano.
 */
export function getStrategistVoice(
    strategist: SeniorStrategist,
    alliance: AllianceBlock = 'A',
    userNationality?: string | null,
    userName?: string
): StrategistVoiceMessage {
    const pilotName = userName ? userName.split(' ')[0].toUpperCase() : 'ESTRATEGISTA';
    const nat = (userNationality || '').toLowerCase().trim();

    // 1. Matriz de Tom por Bloco
    let toneTitle = '';
    let blockTone = '';
    let tacticalOrder = '';
    let accentBadge = '';

    if (alliance === 'A') {
        // Bloco A: Frio, cirúrgico, teleimétrico (Consórcio da Estrela)
        toneTitle = 'TELEMETRIA CIRÚRGICA // PROTOCOLO ESTRELA';
        accentBadge = 'CIRÚRGICO // TELEMÉTRICO';
        blockTone = `“${pilotName}, telemetria em parâmetros nominais. No Consórcio da Estrela não apostamos na sorte: calibramos o delta do Q3 com margem milimétrica. Menos pulso acelerado, mais cálculo de eficiência. Mantenha os pneus na janela de 102°C e confie na simulação de túnel de vento.”`;
        tacticalOrder = `Cravar o Poletime dentro da margem de ${strategist.briefingTips.poletimeTarget}. Tolerância zero para hesitação.`;
    } else if (alliance === 'B') {
        // Bloco B: Passional, aristocrático, combativo (Dinastia de Maranello)
        toneTitle = 'ORDEM DE BATALHA // DINASTIA DE MARANELLO';
        accentBadge = 'PASSIONAL // COMBATIVO';
        blockTone = `“${pilotName}! Em Maranello o asfalto sangra respeito. Não admito piloto tirando o pé na freada da Curva 1. O segundo lugar é apenas o primeiro dos perdedores. O motor turbo precisa rugir no limite da temperatura de escape. Sangue frio na estratégia e agressividade voraz no corpo a corpo!”`;
        tacticalOrder = `Atacar no Top 3 (${strategist.briefingTips.predictedTop3.slice(0, 2).join(' e ')}) e defender a honra do cavallino no grid.`;
    } else {
        // Bloco C: Disruptivo, agressivo, cínico (A Vanguarda Tecnológica)
        toneTitle = 'INCURSÃO DISRUPTIVA // A VANGUARDA';
        accentBadge = 'DISRUPTIVO // CÍNICO';
        blockTone = `“${pilotName}, ouça bem: as regras tradicionais são desculpas de quem anda atrás. Na Vanguarda nós antecipamos o caos. Enquanto os burocratas discutem desgaste no pitlane, nós atacamos o undercut e quebramos o ritmo da corrida. Se não estivermos no limite da desclassificação técnica, não estamos tentando o suficiente.”`;
        tacticalOrder = `Executar aposta de risco no EVO com ${strategist.briefingTips.evoTargetDriver}. Surpreenda os burocratas do pelotão.`;
    }

    // 2. Modulação Cultural / Gírias de Paddock por Nacionalidade
    let natFlavor = '';
    if (nat.includes('br') || nat.includes('bra')) {
        natFlavor = ` Da nossa terra, a gente aprendeu a acelerar com pé no porão e acertar o miolo do traçado no braço. Deixe os gringos quebrando a cabeça com telemetria furada.`;
    } else if (nat.includes('it') || nat.includes('ita')) {
        natFlavor = ` Staccata secca alla prima curva! Testa fredda e piede pesante: l'asfalto si rispetta solo col gas a martello.`;
    } else if (nat.includes('gb') || nat.includes('uk') || nat.includes('ing') || nat.includes('brit')) {
        natFlavor = ` Keep your head down, cold tyres, razor-sharp focus. Proper racing manners on entry, ruthless on the exit.`;
    } else if (nat.includes('de') || nat.includes('ale')) {
        natFlavor = ` Volle Konzentration. Keine Fehler im ersten Sektor. Absolute Präzision überwindet jeden Hitzkopf.`;
    } else if (nat.includes('fr')) {
        natFlavor = ` Sang-froid absolu. L'attaque doit être propre et chirurgicale au millième près.`;
    } else if (nat.includes('es') || nat.includes('esp') || nat.includes('arg') || nat.includes('mex')) {
        natFlavor = ` Con garra en cada vértice. No regales ni un milímetro de asfalto en la frenada.`;
    }

    // 3. Toque Histórico do Veterano
    const veteranWisdom = ` Lembra-se: na minha era (${strategist.decade}), ${strategist.specialty.toLowerCase()}.`;

    return {
        callsign: `[${strategist.code} // FREQUÊNCIA PRIVADA DO CONSELHEIRO]`,
        toneTitle,
        radioTransmission: `${blockTone}${natFlavor}${veteranWisdom}`,
        tacticalOrder,
        accentBadge
    };
}
