/**
 * VoltGrid Intelligence System - Circuit & Telemetry Database
 * Dados canônicos dos circuitos da F1 2026 para análise pré-corrida e embasamento de prognósticos.
 */

export interface CircuitTelemetryIntel {
    id: string;
    round: string;
    name: string;
    officialTitle: string;
    circuitName: string;
    locality: string;
    country: string;
    countryCode: string;
    circuitLengthKm: number;
    laps: number;
    raceDistanceKm: number;
    turns: { total: number; left: number; right: number };
    drsZones: number;
    drsDetails: string;
    lapRecord: { time: string; driver: string; year: string };
    lastPoleTime: { time: string; driver: string; year: string };
    poleToWinRate: number; // em %
    scProbability: number; // em %
    vscProbability: number; // em %
    t1IncidentRisk: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
    dnfAverage: number;
    // Pista & Asfalto (Escala 1 a 5)
    asphaltAbrasiveness: number;
    trackGrip: number;
    tireStress: number;
    downforceLevel: 'MÁXIMO' | 'ALTO' | 'MÉDIO-ALTO' | 'MÉDIO' | 'BAIXO';
    brakeSeverity: 'CRÍTICA' | 'ALTA' | 'MODERADA' | 'BAIXA';
    topSpeedKmh: number;
    // Pneus & Box
    tireAllocation: { hard: string; medium: string; soft: string; desc: string };
    tireDegradation: 'EXTREMA' | 'ALTA' | 'MODERADA' | 'BAIXA';
    pitLaneTimeLossSec: number;
    optimalStrategy: string;
    undercutStrength: 'MUITO FORTE' | 'FORTE' | 'MODERADO' | 'FRACO';
    overtakingDeltaSec: number;
    overtakingDifficulty: 'MUITO DIFÍCIL' | 'DIFÍCIL' | 'MODERADO' | 'RELATIVAMENTE FÁCIL';
    // Clima & Microclima
    weather: {
        condition: string;
        ambientTemp: number;
        trackTemp: number;
        rainRiskPercent: number;
        windSpeedKmh: number;
        windDirection: string;
        windImpact: string;
        humidityPercent: number;
        barometerHpa: number;
    };
    // Dossiê Tático
    briefing: {
        circuitOverview: string;
        allianceImpact: {
            estrela: string;
            maranello: string;
            vanguarda: string;
        };
        poletimeTactics: string;
        masterTactics: string;
        evoTactics: string;
        h2hTactics: string;
        miscTactics: string;
    };
    // Horários das sessões
    schedule: {
        fp1: { date: string; timeUtc: string; label: string };
        fp2?: { date: string; timeUtc: string; label: string };
        fp3?: { date: string; timeUtc: string; label: string };
        sprintQuali?: { date: string; timeUtc: string; label: string };
        sprintRace?: { date: string; timeUtc: string; label: string };
        qualifying: { date: string; timeUtc: string; label: string };
        race: { date: string; timeUtc: string; label: string };
    };
}

export const CIRCUITS_INTEL: Record<string, CircuitTelemetryIntel> = {
    // Round 18 / Austin - Circuit of the Americas (Próxima etapa no calendário ao vivo)
    americas: {
        id: 'americas',
        round: '18',
        name: 'UNITED STATES GRAND PRIX',
        officialTitle: 'FORMULA 1 PIRELLI UNITED STATES GRAND PRIX 2026',
        circuitName: 'Circuit of the Americas (COTA)',
        locality: 'Austin, Texas',
        country: 'Estados Unidos',
        countryCode: 'USA',
        circuitLengthKm: 5.513,
        laps: 56,
        raceDistanceKm: 308.405,
        turns: { total: 20, left: 11, right: 9 },
        drsZones: 2,
        drsDetails: 'Zona 1: Reta principal (detecção T19). Zona 2: Reta oposta entre T11 e T12 (detecção T10).',
        lapRecord: { time: '1:36.169', driver: 'C.LECLERC', year: '2019' },
        lastPoleTime: { time: '1:32.329', driver: 'L.NORRIS', year: '2025' },
        poleToWinRate: 58,
        scProbability: 67,
        vscProbability: 50,
        t1IncidentRisk: 'CRÍTICO',
        dnfAverage: 2.1,
        asphaltAbrasiveness: 4,
        trackGrip: 3,
        tireStress: 4,
        downforceLevel: 'ALTO',
        brakeSeverity: 'ALTA',
        topSpeedKmh: 341,
        tireAllocation: {
            hard: 'C2 (Branco)',
            medium: 'C3 (Amarelo)',
            soft: 'C4 (Vermelho)',
            desc: 'Gama intermediária de compostos para absorver as ondulações e cargas laterais brutais do Setor 1.'
        },
        tireDegradation: 'ALTA',
        pitLaneTimeLossSec: 21.4,
        optimalStrategy: '2 Paradas recomendadas (Médio -> Duro -> Duro ou Médio -> Duro -> Médio)',
        undercutStrength: 'MUITO FORTE',
        overtakingDeltaSec: 1.15,
        overtakingDifficulty: 'MODERADO',
        weather: {
            condition: 'Céu aberto com sol intenso e calor no asfalto texano',
            ambientTemp: 29,
            trackTemp: 44,
            rainRiskPercent: 12,
            windSpeedKmh: 18,
            windDirection: 'Sul-Sudeste',
            windImpact: 'Vento de cauda na subida da Curva 1 reduz pressão aerodinâmica no ponto crítico de frenagem.',
            humidityPercent: 42,
            barometerHpa: 1014
        },
        briefing: {
            circuitOverview: 'COTA é uma das pistas mais completas e impiedosas do automobilismo. O Setor 1 replica os Esses de Silverstone (alta velocidade e estresse extremo no pneu dianteiro esquerdo), o Setor 2 traz uma das maiores retas da temporada, e o Setor 3 tem o complexo de baixa velocidade do estádio.',
            allianceImpact: {
                estrela: 'Bloco A (Mercedes/McLaren): Forte favoritismo no Setor 1 graças à eficiência de fluxo e sustentação lateral em curvas de 260 km/h.',
                maranello: 'Bloco B (Ferrari/Haas/Cadillac): Excelência na tração das saídas de curva lenta do Setor 3 e retomada híbrida na reta oposta.',
                vanguarda: 'Bloco C (Red Bull/Audi): Ritmo impecável de corrida e menor degradação dos pneus dianteiros nas longas curvas de raio duplo.'
            },
            poletimeTactics: 'A evolução de pista no Q3 pode baixar até 0.4s. O vento da tarde no Texas pode desestabilizar o carro no Setor 1. Mirar faixa entre 1:31.900 e 1:32.400.',
            masterTactics: 'A Curva 1 em subida íngreme cega é um funil com altíssimo índice de contatos. Os 3 primeiros do grid tendem a disputar a vitória, mas o undercut no box pode inverter até 3 posições.',
            evoTactics: 'A reta oposta de 1.200m com DRS proporciona muitas ultrapassagens. Pilotos punidos no grid têm excelente margem de escalada de até +7 posições.',
            h2hTactics: 'A confiança nas frenagens de T1 e T12 define o duelo interno. Pilotos que freiam mais tarde levam clara vantagem.',
            miscTactics: 'A chance de Safety Car é de 67% e o risco de bandeira amarela nos primeiros 3 setores é quase certo. Atenção para opção "SIM" em Safety Car.'
        },
        schedule: {
            fp1: { date: '23 OUT 2026', timeUtc: '17:30 UTC', label: 'TREINO LIVRE 1' },
            fp2: { date: '23 OUT 2026', timeUtc: '21:00 UTC', label: 'TREINO LIVRE 2' },
            fp3: { date: '24 OUT 2026', timeUtc: '17:30 UTC', label: 'TREINO LIVRE 3' },
            qualifying: { date: '24 OUT 2026', timeUtc: '21:00 UTC', label: 'CLASSIFICAÇÃO (POLETIME)' },
            race: { date: '25 OUT 2026', timeUtc: '20:00 UTC', label: 'GRANDE PRÊMIO (56 VOLTAS)' }
        }
    },

    // Round 19 / México
    rodriguez: {
        id: 'rodriguez',
        round: '19',
        name: 'MEXICO CITY GRAND PRIX',
        officialTitle: 'FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2026',
        circuitName: 'Autódromo Hermanos Rodríguez',
        locality: 'Cidade do México',
        country: 'México',
        countryCode: 'MEX',
        circuitLengthKm: 4.304,
        laps: 71,
        raceDistanceKm: 305.354,
        turns: { total: 17, left: 7, right: 10 },
        drsZones: 3,
        drsDetails: 'Zona 1: Reta principal (detecção T15). Zona 2: Reta entre T3 e T4. Zona 3: Saída da T11.',
        lapRecord: { time: '1:17.774', driver: 'V.BOTTAS', year: '2021' },
        lastPoleTime: { time: '1:15.946', driver: 'C.SAINZ', year: '2025' },
        poleToWinRate: 50,
        scProbability: 75,
        vscProbability: 45,
        t1IncidentRisk: 'CRÍTICO',
        dnfAverage: 2.8,
        asphaltAbrasiveness: 2,
        trackGrip: 2,
        tireStress: 3,
        downforceLevel: 'MÁXIMO',
        brakeSeverity: 'CRÍTICA',
        topSpeedKmh: 355,
        tireAllocation: {
            hard: 'C3 (Branco)',
            medium: 'C4 (Amarelo)',
            soft: 'C5 (Vermelho)',
            desc: 'Gama mais macia da Pirelli devido ao asfalto liso e baixa aderência causada pelo ar rarefeito da altitude.'
        },
        tireDegradation: 'MODERADA',
        pitLaneTimeLossSec: 22.0,
        optimalStrategy: '1 Parada (Médio -> Duro) com possibilidade de 2 paradas em caso de Safety Car.',
        undercutStrength: 'FORTE',
        overtakingDeltaSec: 1.05,
        overtakingDifficulty: 'MODERADO',
        weather: {
            condition: 'Tempo seco na altitude de 2.250m com baixa densidade do ar',
            ambientTemp: 24,
            trackTemp: 47,
            rainRiskPercent: 20,
            windSpeedKmh: 10,
            windDirection: 'Nordeste',
            windImpact: 'Pouco arrasto e ar rarefeito que desafia o resfriamento de freios e unidades de potência.',
            humidityPercent: 35,
            barometerHpa: 780
        },
        briefing: {
            circuitOverview: 'A mais de 2.200 metros acima do nível do mar, o ar é 25% menos denso. As equipes usam asas de carga máxima (Monaco spec), mas os carros produzem menos pressão aerodinâmica do que em Monza.',
            allianceImpact: {
                estrela: 'Bloco A: Necessidade de gestão de refrigeração do turbo e MGU-H na altitude.',
                maranello: 'Bloco B: Tradicionalmente forte em tração mecânica e estabilidade na seção do Foro Sol.',
                vanguarda: 'Bloco C: Pacote de máxima eficiência aerodinâmica e excelente top speed na longa reta de largada.'
            },
            poletimeTactics: 'Pista fria nas manhãs e muito quente à tarde. A aderência mecânica no Setor 3 dita o tempo da pole. Tempo de referência: 1:16.200.',
            masterTactics: 'A largada é uma das mais longas da F1 até a Curva 1 (mais de 800m). O vácuo é avassalador e quem larga em 2º ou 3º frequentemente lidera na T1.',
            evoTactics: 'Zona DRS tripla e vácuo gigante permitem grande recuperação de quem larga fora de posição.',
            h2hTactics: 'Resfriamento de freios é crítico; quem gerenciar melhor a temperatura vence a batalha de final de prova.',
            miscTactics: 'Incidentes na Curva 1 são frequentes. Alta chance de Safety Car na primeira volta.'
        },
        schedule: {
            fp1: { date: '30 OUT 2026', timeUtc: '18:30 UTC', label: 'TREINO LIVRE 1' },
            fp2: { date: '30 OUT 2026', timeUtc: '22:00 UTC', label: 'TREINO LIVRE 2' },
            fp3: { date: '31 OUT 2026', timeUtc: '17:30 UTC', label: 'TREINO LIVRE 3' },
            qualifying: { date: '31 OUT 2026', timeUtc: '21:00 UTC', label: 'CLASSIFICAÇÃO (POLETIME)' },
            race: { date: '01 NOV 2026', timeUtc: '20:00 UTC', label: 'GRANDE PRÊMIO (71 VOLTAS)' }
        }
    },

    // Round 21 / Brasil - Interlagos
    interlagos: {
        id: 'interlagos',
        round: '21',
        name: 'SÃO PAULO GRAND PRIX',
        officialTitle: 'FORMULA 1 LENOVO GRANDE PRÊMIO DE SÃO PAULO 2026',
        circuitName: 'Autódromo José Carlos Pace (Interlagos)',
        locality: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BRA',
        circuitLengthKm: 4.309,
        laps: 71,
        raceDistanceKm: 305.879,
        turns: { total: 15, left: 10, right: 5 },
        drsZones: 2,
        drsDetails: 'Zona 1: Reta dos Boxes até o S do Senna. Zona 2: Reta Oposta até a Descida do Lago.',
        lapRecord: { time: '1:10.540', driver: 'V.BOTTAS', year: '2018' },
        lastPoleTime: { time: '1:09.680', driver: 'L.NORRIS', year: '2025' },
        poleToWinRate: 44,
        scProbability: 80,
        vscProbability: 60,
        t1IncidentRisk: 'ALTO',
        dnfAverage: 2.5,
        asphaltAbrasiveness: 3,
        trackGrip: 4,
        tireStress: 4,
        downforceLevel: 'MÉDIO-ALTO',
        brakeSeverity: 'ALTA',
        topSpeedKmh: 338,
        tireAllocation: {
            hard: 'C2 (Branco)',
            medium: 'C3 (Amarelo)',
            soft: 'C4 (Vermelho)',
            desc: 'Gama média equilibrada para suportar a compressão da Junção e o traçado anti-horário de Interlagos.'
        },
        tireDegradation: 'ALTA',
        pitLaneTimeLossSec: 20.8,
        optimalStrategy: '2 Paradas (Médio -> Duro -> Macio) devido à facilidade de ultrapassagem na Reta Oposta.',
        undercutStrength: 'MUITO FORTE',
        overtakingDeltaSec: 0.95,
        overtakingDifficulty: 'RELATIVAMENTE FÁCIL',
        weather: {
            condition: 'Microclima imprevisível da Serra do Mar com risco constante de pancadas de chuva',
            ambientTemp: 23,
            trackTemp: 38,
            rainRiskPercent: 65,
            windSpeedKmh: 22,
            windDirection: 'Sul',
            windImpact: 'Frente fria subindo pode trazer garoa ou tempestade súbita em minutos.',
            humidityPercent: 78,
            barometerHpa: 930
        },
        briefing: {
            circuitOverview: 'Traçado técnico anti-horário lendário, com variações dramáticas de relevo. O S do Senna, a Curva do Sol, a descida do Lago e a Junção formam um circuito onde o piloto ainda faz enorme diferença.',
            allianceImpact: {
                estrela: 'Bloco A: Excelente equilíbrio no Miolo de Interlagos (Bico de Pato e Pinheirinho).',
                maranello: 'Bloco B: Potência espetacular na subida dos boxes e retomada do Lago.',
                vanguarda: 'Bloco C: Maestria em condições climáticas mistas e carros ágeis nas mudanças de direção.'
            },
            poletimeTactics: 'Volta curta de 1 minuto e 9 segundos. Qualquer erro de milésimo custa 4 posições. Tempo de referência: 1:09.900.',
            masterTactics: 'Interlagos raramente tem corridas processionais. Mesmo largando atrás, o ritmo com pista molhada ou Safety Car pode levar ao pódio.',
            evoTactics: 'O maior potencial de escalada do calendário: ultrapassagens fluidas no S do Senna e na freada da Descida do Lago.',
            h2hTactics: 'Sensibilidade no asfalto molhado e gerenciamento do pneu dianteiro direito definem a vitória no duelo interno.',
            miscTactics: 'Probabilidade de Safety Car e chuva é a mais alta do campeonato (80%). Apostas "SIM" em Safety Car são fortemente indicadas.'
        },
        schedule: {
            fp1: { date: '06 NOV 2026', timeUtc: '14:30 UTC', label: 'TREINO LIVRE 1' },
            sprintQuali: { date: '06 NOV 2026', timeUtc: '18:30 UTC', label: 'CLASSIFICAÇÃO SPRINT' },
            sprintRace: { date: '07 NOV 2026', timeUtc: '14:00 UTC', label: 'CORRIDA SPRINT' },
            qualifying: { date: '07 NOV 2026', timeUtc: '18:00 UTC', label: 'CLASSIFICAÇÃO OFICIAL (POLETIME)' },
            race: { date: '08 NOV 2026', timeUtc: '17:00 UTC', label: 'GRANDE PRÊMIO (71 VOLTAS)' }
        }
    },

    // Round 01 / Bahrein - Padrão de Abertura
    sakhir: {
        id: 'sakhir',
        round: '01',
        name: 'BAHRAIN GRAND PRIX',
        officialTitle: 'FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2026',
        circuitName: 'Bahrain International Circuit',
        locality: 'Sakhir',
        country: 'Bahrein',
        countryCode: 'BHR',
        circuitLengthKm: 5.412,
        laps: 57,
        raceDistanceKm: 308.238,
        turns: { total: 15, left: 6, right: 9 },
        drsZones: 3,
        drsDetails: 'Zona 1: Reta principal. Zona 2: Entre T3 e T4. Zona 3: Reta oposta entre T10 e T11.',
        lapRecord: { time: '1:31.447', driver: 'P.DE LA ROSA', year: '2005' },
        lastPoleTime: { time: '1:29.179', driver: 'M.VERSTAPPEN', year: '2024' },
        poleToWinRate: 52,
        scProbability: 60,
        vscProbability: 40,
        t1IncidentRisk: 'MÉDIO',
        dnfAverage: 2.0,
        asphaltAbrasiveness: 5,
        trackGrip: 3,
        tireStress: 5,
        downforceLevel: 'MÉDIO',
        brakeSeverity: 'CRÍTICA',
        topSpeedKmh: 335,
        tireAllocation: {
            hard: 'C1 (Branco)',
            medium: 'C2 (Amarelo)',
            soft: 'C3 (Vermelho)',
            desc: 'A gama mais dura da Pirelli para suportar o asfalto mais abrasivo do planeta sob calor desértico.'
        },
        tireDegradation: 'EXTREMA',
        pitLaneTimeLossSec: 22.8,
        optimalStrategy: '2 Paradas obrigatórias (Macio -> Duro -> Duro ou Macio -> Médio -> Duro)',
        undercutStrength: 'MUITO FORTE',
        overtakingDeltaSec: 1.10,
        overtakingDifficulty: 'MODERADO',
        weather: {
            condition: 'Noite desértica limpa com queda brusca de temperatura no asfalto',
            ambientTemp: 22,
            trackTemp: 27,
            rainRiskPercent: 1,
            windSpeedKmh: 14,
            windDirection: 'Norte',
            windImpact: 'Vento sopra areia do deserto para a linha de corrida, reduzindo o grip.',
            humidityPercent: 48,
            barometerHpa: 1012
        },
        briefing: {
            circuitOverview: 'Pista de pura aceleração e frenagem (Stop-and-Go). O asfalto feito com granito britânico é altamente abrasivo e tritura os pneus traseiros.',
            allianceImpact: {
                estrela: 'Bloco A: Desafio na tração de baixa velocidade e gestão do desgaste térmico dos pneus traseiros.',
                maranello: 'Bloco B: Excelente poder de frenagem e aceleração máxima nas 4 longas retas.',
                vanguarda: 'Bloco C: Superioridade histórica no gerenciamento de desgaste de corrida em Sakhir.'
            },
            poletimeTactics: 'O Q3 acontece à noite com pista resfriando rapidamente. Mirar tempos na casa de 1:28.900 a 1:29.400.',
            masterTactics: 'O undercut é uma das armas mais letais do ano aqui. Parar 1 volta antes rende até 2.2 segundos de ganho.',
            evoTactics: '3 zonas de DRS tornam a recuperação viável para quem larga de trás.',
            h2hTactics: 'A curva 10 é uma freada cega em apoio onde pilotos costumam travar a roda dianteira esquerda.',
            miscTactics: 'Safety Car geralmente aparece após disputas na curva 1 ou quebras mecânicas térmicas.'
        },
        schedule: {
            fp1: { date: '27 FEV 2026', timeUtc: '11:30 UTC', label: 'TREINO LIVRE 1' },
            fp2: { date: '27 FEV 2026', timeUtc: '15:00 UTC', label: 'TREINO LIVRE 2' },
            fp3: { date: '28 FEV 2026', timeUtc: '12:30 UTC', label: 'TREINO LIVRE 3' },
            qualifying: { date: '28 FEV 2026', timeUtc: '16:00 UTC', label: 'CLASSIFICAÇÃO (POLETIME)' },
            race: { date: '01 MAR 2026', timeUtc: '15:00 UTC', label: 'GRANDE PRÊMIO (57 VOLTAS)' }
        }
    }
};

/**
 * Retorna os dados detalhados do circuito com base no ID ou round,
 * garantindo fallback consistente caso o circuito específico ainda não esteja catalogado.
 */
export function getCircuitIntel(circuitIdOrRound?: string): CircuitTelemetryIntel {
    if (!circuitIdOrRound) return CIRCUITS_INTEL['americas'];

    const clean = circuitIdOrRound.toLowerCase().trim();

    // Busca por ID direto
    if (CIRCUITS_INTEL[clean]) return CIRCUITS_INTEL[clean];

    // Busca por Round
    const byRound = Object.values(CIRCUITS_INTEL).find(c => c.round === clean || c.round.padStart(2, '0') === clean.padStart(2, '0'));
    if (byRound) return byRound;

    // Busca por match aproximado de nome
    const byName = Object.values(CIRCUITS_INTEL).find(c => 
        c.circuitName.toLowerCase().includes(clean) || 
        c.name.toLowerCase().includes(clean) || 
        c.locality.toLowerCase().includes(clean)
    );
    if (byName) return byName;

    // Fallback padrão: COTA / Americas
    return CIRCUITS_INTEL['americas'];
}
