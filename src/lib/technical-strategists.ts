/**
 * BAEFF1 // TECHNICAL STRATEGISTS & ENGINEERING POOL
 * 
 * Engenheiros de dados e telemetria analítica alocados às escuderias.
 * Distribuição demográfica rigorosa:
 * - 60% Homens, 40% Mulheres
 * - 15% Negros, Latinos ou Asiáticos
 * - 30% Norte-americanos ou Canadenses
 * - 55% Europeus (Reino Unido, Itália, França, Alemanha, etc.)
 * 
 * Regra de Ouro (Golden Rule): Nomes no padrão "A.CHEN84", "K.VANDERBILT92".
 * 
 * Rotatividade: Quando demitido pelo usuário (resposta [NÃO] ao Superior na Terça-Feira),
 * o engenheiro é transferido internamente entre escuderias da mesma Aliança de Motores.
 */

export type AllianceCode = 'A' | 'B' | 'C';

export interface TechnicalStrategist {
    id: string;
    code: string;                 // Padrão Golden Rule: "E.DUBOIS91"
    fullName: string;             // "Elena Dubois"
    gender: 'M' | 'F';
    origin: 'EUR' | 'NA' | 'LATAM_AFR_ASIA';
    nationality: string;
    alliance: AllianceCode;       // Aliança técnica de motor
    currentTeam: string;          // Código da equipe atual (ex: "FER", "MER", "RBR")
    role: string;                 // "Engenheira Chefe de Telemetria e Simulação"
    specialty: string;            // ex: "Degradação Térmica de Pneus & Monte Carlo"
    confidenceScore: number;      // 0 a 100% (Pressão da Diretoria)
    careerGPS: number;            // GPs atuados
    accuracyRate: number;         // % de assertividade em projeções
    telemetryBriefing: {
        poletimeDeltaMs: number;    // Delta em ms sugerido em relação ao Sênior
        poletimeTarget: string;     // Tempo exato projetado (ex: "1:12.195")
        reasoning: string;          // Justificativa baseada em dados
        top10Picks: string[];       // Pilotos recomendados para o Top 10
        top10Reasoning: string;     // Justificativa de ritmo de corrida
        riskEvaluation: string;     // Projeção matemática de Safety Car e undercut
    };
    avatarColor: string;
}

export const TECHNICAL_STRATEGISTS_POOL: TechnicalStrategist[] = [
    // -------------------------------------------------------------
    // ALIANÇA A // CONSÓRCIO DA ESTRELA (Mercedes, McLaren, Alpine, Williams)
    // -------------------------------------------------------------
    {
        id: 'tech-a-01',
        code: 'A.CHEN84',
        fullName: 'Alexander Chen',
        gender: 'M',
        origin: 'LATAM_AFR_ASIA',
        nationality: 'Canadense-Asiático',
        alliance: 'A',
        currentTeam: 'MER',
        role: 'Chefe de Dinâmica Veicular & ERS',
        specialty: 'Eficiência de Regeneração de Bateria e Retas',
        confidenceScore: 92,
        careerGPS: 48,
        accuracyRate: 86.4,
        telemetryBriefing: {
            poletimeDeltaMs: -45,
            poletimeTarget: '1:12.164',
            reasoning: 'Modelos de telemetria apontam ganho de 0.045s no setor intermediário com mapa de potência agressivo no Q3.',
            top10Picks: ['NOR', 'VER', 'LEC', 'RUS', 'PIA', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
            top10Reasoning: 'McLaren e Mercedes sustentam o menor delta de degradação térmica nos stints com composto médio.',
            riskEvaluation: 'Janela de undercut favorável entre as voltas 18 e 21.'
        },
        avatarColor: '#27F4D2'
    },
    {
        id: 'tech-a-02',
        code: 'E.DUBOIS91',
        fullName: 'Elena Dubois',
        gender: 'F',
        origin: 'EUR',
        nationality: 'Francesa',
        alliance: 'A',
        currentTeam: 'ALP',
        role: 'Analista Sênior de Estratégia de Pista',
        specialty: 'Simulações Estocásticas de Safety Car',
        confidenceScore: 88,
        careerGPS: 34,
        accuracyRate: 82.1,
        telemetryBriefing: {
            poletimeDeltaMs: 15,
            poletimeTarget: '1:12.224',
            reasoning: 'Rajadas de vento na curva rápida sugerem cautela com pressão aerodinâmica frontal; gap de 15ms contra a pole bruta.',
            top10Picks: ['VER', 'NOR', 'RUS', 'LEC', 'PIA', 'HAM', 'GAS', 'SAI', 'TSU', 'OCO'],
            top10Reasoning: 'Ritmo sólido em simulação de corrida de tanque cheio; Alpine em condições de pontuar.',
            riskEvaluation: 'Probabilidade de Safety Car estimada em 68% devido a áreas de escape curtas.'
        },
        avatarColor: '#0093CC'
    },
    {
        id: 'tech-a-03',
        code: 'M.MILLER88',
        fullName: 'Marcus Miller',
        gender: 'M',
        origin: 'NA',
        nationality: 'Norte-Americano',
        alliance: 'A',
        currentTeam: 'WIL',
        role: 'Engenheiro de Telemetria de Chassis',
        specialty: 'Telemetria de Velocidade Máxima & Arrasto',
        confidenceScore: 85,
        careerGPS: 26,
        accuracyRate: 79.5,
        telemetryBriefing: {
            poletimeDeltaMs: -12,
            poletimeTarget: '1:12.197',
            reasoning: 'Asa traseira de baixo arrasto gera ganho nas duas zonas de DRS; tempo de pole cravado em 1:12.197.',
            top10Picks: ['NOR', 'PIA', 'VER', 'RUS', 'LEC', 'HAM', 'ALB', 'SAI', 'HUL', 'GAS'],
            top10Reasoning: 'Williams veloz no velocímetro; top 10 plenamente factível em pista de média/alta.',
            riskEvaluation: 'Risco moderado de granulação nos pneus macios nas primeiras 6 voltas.'
        },
        avatarColor: '#64C4FF'
    },
    {
        id: 'tech-a-04',
        code: 'S.VANCE95',
        fullName: 'Sarah Vance',
        gender: 'F',
        origin: 'EUR',
        nationality: 'Britânica',
        alliance: 'A',
        currentTeam: 'MCL',
        role: 'Engenheira de Performance de Pista',
        specialty: 'Gestão de Ritmo de Corrida e Janela de Ar Limpo',
        confidenceScore: 94,
        careerGPS: 52,
        accuracyRate: 89.2,
        telemetryBriefing: {
            poletimeDeltaMs: -30,
            poletimeTarget: '1:12.179',
            reasoning: 'Equilíbrio térmico da McLaren nos setores lentos garante tração limpa na saída das curvas 4 e 12.',
            top10Picks: ['NOR', 'PIA', 'VER', 'LEC', 'RUS', 'HAM', 'SAI', 'ALO', 'ALB', 'HUL'],
            top10Reasoning: 'McLaren com a menor taxa de degradação do grid nos testes de sexta-feira.',
            riskEvaluation: 'Estratégia de 1 única parada é matematicamente a mais rápida se o asfalto não passar de 42°C.'
        },
        avatarColor: '#FF8000'
    },

    // -------------------------------------------------------------
    // ALIANÇA B // DINASTIA DE MARANELLO (Ferrari, Haas, Cadillac)
    // -------------------------------------------------------------
    {
        id: 'tech-b-01',
        code: 'M.MORETTI86',
        fullName: 'Matteo Moretti',
        gender: 'M',
        origin: 'EUR',
        nationality: 'Italiano',
        alliance: 'B',
        currentTeam: 'FER',
        role: 'Diretor de Telemetria e Motores de Maranello',
        specialty: 'Mapeamento de Injeção Térmica & Tração Traseira',
        confidenceScore: 95,
        careerGPS: 64,
        accuracyRate: 87.8,
        telemetryBriefing: {
            poletimeDeltaMs: -55,
            poletimeTarget: '1:12.154',
            reasoning: 'Curva de torque do motor Ferrari Spec-4 entrega saída explosiva nas zebras do setor final.',
            top10Picks: ['LEC', 'VER', 'NOR', 'HAM', 'PIA', 'RUS', 'SAI', 'ALO', 'BEA', 'HUL'],
            top10Reasoning: 'Ritmo cirúrgico de Charles Leclerc em volta única; tração imbatível no primeiro setor.',
            riskEvaluation: 'Cuidado extremo com o desgaste dos freios dianteiros sob temperaturas elevadas.'
        },
        avatarColor: '#E8002D'
    },
    {
        id: 'tech-b-02',
        code: 'C.RODRIGUEZ89',
        fullName: 'Camila Rodriguez',
        gender: 'F',
        origin: 'LATAM_AFR_ASIA',
        nationality: 'Mexicana',
        alliance: 'B',
        currentTeam: 'HAA',
        role: 'Engenheira Chefe de Ritmo e Desgaste',
        specialty: 'Controle Térmico de Borracha Pirelli',
        confidenceScore: 86,
        careerGPS: 31,
        accuracyRate: 81.0,
        telemetryBriefing: {
            poletimeDeltaMs: 20,
            poletimeTarget: '1:12.229',
            reasoning: 'O asfalto está com micro-ondulações no apex; margem de segurança de 20ms necessária no Poletime.',
            top10Picks: ['VER', 'LEC', 'NOR', 'RUS', 'HAM', 'PIA', 'BEA', 'SAI', 'TSU', 'OCO'],
            top10Reasoning: 'Haas apresenta boa recuperação de velocidade reta; Bearman agressivo nas ultrapassagens.',
            riskEvaluation: 'Probabilidade de bandeira amarela de 75% na curva de frenagem pesada.'
        },
        avatarColor: '#B6BABD'
    },
    {
        id: 'tech-b-03',
        code: 'T.JACKSON93',
        fullName: 'Tyler Jackson',
        gender: 'M',
        origin: 'NA',
        nationality: 'Norte-Americano',
        alliance: 'B',
        currentTeam: 'CAD',
        role: 'Especialista em Simulação Computacional CFD',
        specialty: 'Aerodinâmica de Vórtices e Efeito Solo',
        confidenceScore: 89,
        careerGPS: 22,
        accuracyRate: 83.7,
        telemetryBriefing: {
            poletimeDeltaMs: -18,
            poletimeTarget: '1:12.191',
            reasoning: 'Nova configuração de assoalho reduziu o porpoising em 80%; tempo da pole abaixo de 1:12.200.',
            top10Picks: ['LEC', 'NOR', 'VER', 'HAM', 'PIA', 'RUS', 'SAI', 'ALO', 'ALB', 'BEA'],
            top10Reasoning: 'Cadillac estreando com dados consistentes na telemetria de túnel de vento.',
            riskEvaluation: 'Vento lateral na reta oposta pode desestabilizar carros com suspensão rígida.'
        },
        avatarColor: '#C49A45'
    },
    {
        id: 'tech-b-04',
        code: 'G.ROSSI90',
        fullName: 'Giulia Rossi',
        gender: 'F',
        origin: 'EUR',
        nationality: 'Italiana',
        alliance: 'B',
        currentTeam: 'FER',
        role: 'Cientista de Dados Táticos de Paddock',
        specialty: 'Otimização Bayesiana de Janelas de Parada',
        confidenceScore: 91,
        careerGPS: 40,
        accuracyRate: 85.5,
        telemetryBriefing: {
            poletimeDeltaMs: -35,
            poletimeTarget: '1:12.174',
            reasoning: 'Temperaturas de pista caindo no Q3 favorecem composto macio com 2 voltas de preparação.',
            top10Picks: ['LEC', 'VER', 'NOR', 'RUS', 'PIA', 'HAM', 'SAI', 'ALO', 'GAS', 'BEA'],
            top10Reasoning: 'Ferrari com excelente ritmo em pneus duros para o segundo stint da prova.',
            riskEvaluation: 'Parada antecipada (undercut) na volta 15 traz vantagem de até 2.4 segundos no ar limpo.'
        },
        avatarColor: '#E8002D'
    },

    // -------------------------------------------------------------
    // ALIANÇA C // A VANGUARDA TECNOLÓGICA (Red Bull, Racing Bulls, Aston Martin, Audi)
    // -------------------------------------------------------------
    {
        id: 'tech-c-01',
        code: 'H.WEBER85',
        fullName: 'Helmut Weber',
        gender: 'M',
        origin: 'EUR',
        nationality: 'Alemão',
        alliance: 'C',
        currentTeam: 'AUD',
        role: 'Engenheiro Chefe de Arquitetura de Trem de Força',
        specialty: 'Calibração de Turbo-Compressor e MGU-H',
        confidenceScore: 93,
        careerGPS: 58,
        accuracyRate: 88.0,
        telemetryBriefing: {
            poletimeDeltaMs: -40,
            poletimeTarget: '1:12.169',
            reasoning: 'O mapa do motor Audi está entregando resposta linear instantânea na aceleração de curvas lentas.',
            top10Picks: ['VER', 'NOR', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'HUL', 'HAD', 'TSU'],
            top10Reasoning: 'Red Bull e Audi apresentam a telemetria mais limpa em curvas de raio longo.',
            riskEvaluation: 'Atenção com a temperatura do óleo nos giros máximos durante o Q3.'
        },
        avatarColor: '#52E252'
    },
    {
        id: 'tech-c-02',
        code: 'K.VANDERBILT92',
        fullName: 'Kendra Vanderbilt',
        gender: 'F',
        origin: 'NA',
        nationality: 'Canadense',
        alliance: 'C',
        currentTeam: 'AST',
        role: 'Especialista em Telemetria Operacional',
        specialty: 'Análise de Ritmo em Tráfego & Ar Sujo',
        confidenceScore: 87,
        careerGPS: 29,
        accuracyRate: 81.9,
        telemetryBriefing: {
            poletimeDeltaMs: 10,
            poletimeTarget: '1:12.219',
            reasoning: 'Alonso identificou perda de aderência no miolo; o tempo da pole deve estabilizar em 1:12.219.',
            top10Picks: ['VER', 'NOR', 'LEC', 'RUS', 'ALO', 'PIA', 'HAM', 'SAI', 'STR', 'TSU'],
            top10Reasoning: 'Aston Martin muito agressiva na primeira perna de corrida com pneus médios novos.',
            riskEvaluation: 'Probabilidade de safety car virtual estimada em 45% nas primeiras 10 voltas.'
        },
        avatarColor: '#229971'
    },
    {
        id: 'tech-c-03',
        code: 'D.OKONKWO87',
        fullName: 'David Okonkwo',
        gender: 'M',
        origin: 'LATAM_AFR_ASIA',
        nationality: 'Sul-Africano / Britânico',
        alliance: 'C',
        currentTeam: 'RBR',
        role: 'Estrategista Chefe de Telemetria de Paddock',
        specialty: 'Algoritmos Preditivos de Corrida & Degradação',
        confidenceScore: 96,
        careerGPS: 70,
        accuracyRate: 91.3,
        telemetryBriefing: {
            poletimeDeltaMs: -60,
            poletimeTarget: '1:12.149',
            reasoning: 'Max Verstappen no limite com mapa de qualificação liberado: tempo cravado em 1:12.149.',
            top10Picks: ['VER', 'NOR', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'HAD', 'LAW', 'ALO'],
            top10Reasoning: 'Ritmo de corrida da Red Bull é 0.3s mais rápido por volta em stints longos que os rivais.',
            riskEvaluation: 'Estratégia de 2 paradas pode ser devastadora se o ritmo do líder se mantiver abaixo de 1:16.5.'
        },
        avatarColor: '#3671C6'
    },
    {
        id: 'tech-c-04',
        code: 'R.TAKAHASHI94',
        fullName: 'Ren Takahashi',
        gender: 'M',
        origin: 'LATAM_AFR_ASIA',
        nationality: 'Japonês',
        alliance: 'C',
        currentTeam: 'RBA',
        role: 'Engenheiro de Dados de Telemetria Faenza',
        specialty: 'Otimização de Geometria de Suspensão',
        confidenceScore: 88,
        careerGPS: 24,
        accuracyRate: 82.5,
        telemetryBriefing: {
            poletimeDeltaMs: -8,
            poletimeTarget: '1:12.201',
            reasoning: 'Racing Bulls com alta estabilidade nas freadas em linha reta; projeção cravada no limiar de 1:12.200.',
            top10Picks: ['VER', 'NOR', 'LEC', 'RUS', 'PIA', 'LAW', 'HAM', 'HAD', 'SAI', 'TSU'],
            top10Reasoning: 'Liam Lawson e Hadjar consistentes em stints médios; forte disputa pela zona de pontos.',
            riskEvaluation: 'Degradação frontal direita crítica na curva parabólica.'
        },
        avatarColor: '#6692FF'
    }
];

const LOCAL_STORAGE_KEY_PREFIX = 'baeff1_tech_strategist_';

/**
 * Retorna o estrategista técnico ativo do usuário para a equipe e aliança.
 * Se não houver persistido, seleciona o padrão da equipe e salva.
 */
export function getActiveTechnicalStrategist(userId: string, teamCode: string, allianceCode: AllianceCode = 'B'): TechnicalStrategist {
    if (typeof window === 'undefined') {
        return TECHNICAL_STRATEGISTS_POOL.find(t => t.currentTeam === teamCode) 
            || TECHNICAL_STRATEGISTS_POOL.find(t => t.alliance === allianceCode) 
            || TECHNICAL_STRATEGISTS_POOL[0];
    }

    const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}_${allianceCode}`;
    const savedId = localStorage.getItem(storageKey);

    if (savedId) {
        const found = TECHNICAL_STRATEGISTS_POOL.find(t => t.id === savedId);
        if (found) return found;
    }

    // Busca pela equipe atual ou aliança
    const initial = TECHNICAL_STRATEGISTS_POOL.find(t => t.currentTeam === teamCode && t.alliance === allianceCode)
        || TECHNICAL_STRATEGISTS_POOL.find(t => t.alliance === allianceCode)
        || TECHNICAL_STRATEGISTS_POOL[0];

    localStorage.setItem(storageKey, initial.id);
    return initial;
}

/**
 * Executa a avaliação da Terça-Feira:
 * - Se satisfied === true: Confiança do engenheiro sobe (+5 pts, max 100).
 * - Se satisfied === false: Engenheiro é demitido e o sistema faz a rotatividade com outro membro
 *   do pool da MESMA ALIANÇA DE MOTORES, salvando a nova contratação.
 */
export function evaluateTechnicalStrategist(
    userId: string,
    currentTechId: string,
    satisfied: boolean,
    allianceCode: AllianceCode
): { newStrategist: TechnicalStrategist; rotated: boolean; message: string } {
    const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}_${allianceCode}`;
    const pool = TECHNICAL_STRATEGISTS_POOL.filter(t => t.alliance === allianceCode);

    if (satisfied) {
        const current = pool.find(t => t.id === currentTechId) || pool[0];
        current.confidenceScore = Math.min(100, current.confidenceScore + 5);
        return {
            newStrategist: current,
            rotated: false,
            message: `A diretoria homologou a renovação da confiança em ${current.code}. A telemetria continua sob seu comando técnico.`
        };
    }

    // Demissão e rotação interna na Aliança de Motores
    const candidates = pool.filter(t => t.id !== currentTechId);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0] || pool[0];

    if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, chosen.id);
    }

    return {
        newStrategist: chosen,
        rotated: true,
        message: `CONTRATO RESCINDIDO PELA DIRETORIA: A escuderia atendeu seu veto técnico. ${chosen.fullName} (${chosen.code}), transferido(a) de uma garagem parceira da nossa aliança, assume imediatamente a cadeira na War Room.`
    };
}
