/**
 * TS1 Intelligence System - Circuit & Telemetry Database
 * Dados canônicos dos circuitos da F1 2026 para análise pré-corrida e embasamento de prognósticos.
 * Envelopado sob a perspectiva confidencial da Diretoria Técnica dos Blocos de Motores.
 */

export interface DirectorMemo {
    directorTitle: string;
    headquarters: string;
    codeWord: string;
    confidentialityLevel: string;
    memo: string;
    tacticalDirectives: string[];
    secretWarning: string;
}

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
    // Memorandos Confidenciais da Diretoria Técnica por Bloco
    directorMemos: {
        A: DirectorMemo;
        B: DirectorMemo;
        C: DirectorMemo;
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
        directorMemos: {
            A: {
                directorTitle: "Dr. Helmut Von Klausen // Diretor Geral de Engenharia de Brackley",
                headquarters: "Brackley & Brixworth Operations Hub // Reino Unido",
                codeWord: "PROTOCOLO SILBER-TEXAS // CLASSIFICAÇÃO NÍVEL 5",
                confidentialityLevel: "ULTRA-CONFIDENCIAL // APENAS ESTRATEGISTAS DA ESTRELA",
                memo: "Puxe uma cadeira e tranque a porta do motorhome. Nossas simulações em túnel de vento rodaram 14.800 iterações para Austin. Nossos dados provam que o Setor 1 é nosso feudo sagrado: a rigidez do nosso assoalho nas curvas 3, 4 e 5 garante 0.28s de vantagem pura sobre a concorrência. Porém, não se iluda com o cronômetro de volta única: o calor do asfalto texano destrói o pneu dianteiro esquerdo. Se você calibrar nossas tomadas de posição com excesso de agressividade precoce, nossos carros entram em degradação terminal antes da volta 16. Exijo disciplina matemática nos prognósticos.",
                tacticalDirectives: [
                    "No Poletime, calcule o vácuo na reta oposta: a pole cairá abaixo de 1:32.100 se a pista emborrachar no Q3.",
                    "No Top 10, posicione as escuderias Mercedes e McLaren entre os 4 primeiros sem hesitar.",
                    "No H2H, aposte no piloto que gerenciar melhor as zebras agressivas da curva 9."
                ],
                secretWarning: "ALERTA DO TS1: Sensores de limite de pista nas curvas 19 e 20 serão intolerantes. Não confie em tempos de volta que beirem a linha branca."
            },
            B: {
                directorTitle: "Ing. Lorenzo Casali // Diretor de Operações de Pista de Maranello",
                headquarters: "Gestione Sportiva Reparto Corse // Maranello & Detroit",
                codeWord: "ORDINE DEL CAVALLINO // OPERAÇÃO CORSA ROSSA",
                confidentialityLevel: "CONFIDENCIAL TÁTICO // ACESSO RESTRITO GESTIONE CORSE",
                memo: "Feche as persianas da sala de telemetria. Não tolerarei nada menos que o topo da tabela em Austin. A nossa unidade de potência 067/3 foi ajustada no dinamômetro para descarregar o pico do E-Turbo exatamente na saída da curva 11 rumo à reta de 1.200 metros. Nós temos 8 km/h a mais de velocidade final que o Bloco A no final do Setor 2. Na subida da Curva 1, o nosso piloto vai frear mais tarde que qualquer outro ser humano na pista. Seus prognósticos devem refletir essa agressividade. Se errar a chamada da primeira volta, o peso da fábrica cairá sobre seu pitwall.",
                tacticalDirectives: [
                    "Poletime é prioridade absoluta: coloque a Ferrari na disputa direta com tempo de 1:32.050 a 1:32.300.",
                    "No Top 10, confie no poder do undercut: antecipar a primeira parada para a volta 14 renderá posições de pódio.",
                    "Em Event Props, aposte forte na ativação do Safety Car: a primeira perna do grampo da T1 é puro caos."
                ],
                secretWarning: "RISCO TÉRMICO: As temperaturas de óleo sobem criticamente no ar turbulento. Nossos carros precisam de ar limpo no primeiro stint."
            },
            C: {
                directorTitle: "Viktor Vance // Diretor de Estratégias Secretas da Vanguarda",
                headquarters: "Milton Keynes Skunkworks & Ingolstadt Prototype Lab",
                codeWord: "CHAOS THEORY 26 // DESPACHO SHADOW LABS",
                confidentialityLevel: "SIGILOSO // DESTRUIÇÃO AUTOMÁTICA PÓS-GP",
                memo: "Esqueça o manual burocrático que o TS1 distribui. Austin é uma armadilha perfeita para quem aposta em linearidade. O asfalto ondulado de COTA e o vento traiçoeiro na curva 1 foram feitos sob medida para a nossa filosofia de caos planejado. Nossos pilotos não vão brigar por milésimos no Q1; nosso mapa de motor foi configurado para matar a corrida na segunda metade, quando os pneus dos outros blocos estiverem em bolhas. Use seus prognósticos para pescar as zebras: o pelotão intermediário vai quebrar e nós estaremos no pódio.",
                tacticalDirectives: [
                    "Na Escalada (EVO), selecione nosso segundo carro: largando do pelotão médio, ele passará pelo menos 5 carros na reta oposta.",
                    "Em Duelos H2H, a agressividade em disputas roda a roda nas curvas 12 a 15 definirá o vencedor.",
                    "Em Misc, aposta imperativa em Safety Car e chances reais de bandeira vermelha no Setor 1."
                ],
                secretWarning: "INSTABILIDADE AERODINÂMICA: Rajadas de vento de cauda na curva 1 podem provocar saídas de traseira violentas na largada."
            }
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
        directorMemos: {
            A: {
                directorTitle: "Dr. Helmut Von Klausen // Diretor Geral de Engenharia de Brackley",
                headquarters: "Brackley Operations // Divisão de Turbocompressores",
                codeWord: "ALTITUDE-OXIGÊNIO // PROTOCOLO SILBER-MEX",
                confidentialityLevel: "ULTRA-CONFIDENCIAL",
                memo: "A física nesta altitude não aceita concessões. O ar rarefeito força nossos compressores a girarem a 105.000 RPM para compensar a densidade. Nossos radiadores foram alargados para evitar superaquecimento de bateria. Seus prognósticos no Master devem levar em conta a confiabilidade: o carro que gerenciar as temperaturas de freio na curva 1 chegará inteiro ao Foro Sol.",
                tacticalDirectives: [
                    "Poletime de referência: 1:15.800 a 1:16.100 no asfalto liso.",
                    "Previsão de Top 10 com ênfase em motores consistentes.",
                    "No H2H, atenção à disciplina no tráfego de retardatários."
                ],
                secretWarning: "TEMPERATURA DE FREIOS: Ponto de ebulição fluido nas curvas 1 e 4 após a longa reta de 1.2km."
            },
            B: {
                directorTitle: "Ing. Lorenzo Casali // Diretor de Operações de Maranello",
                headquarters: "Reparto Corse Gestione Sportiva // Maranello",
                codeWord: "FORO SOL IMPERIUM // PROTOCOLO MEX-CORSE",
                confidentialityLevel: "CONFIDENCIAL TÁTICO",
                memo: "Esta pista é uma catedral para a nossa arrancada. São 890 metros da largada até a Curva 1. Se o nosso piloto largar em 2º ou 3º, o vácuo vai engolir o líder antes da placa de 150 metros. Exijo que seus prognósticos posicionem nossa escuderia na liderança logo na primeira volta. No Foro Sol, a torcida vai empurrar o carro.",
                tacticalDirectives: [
                    "Aposte em liderança imediata na volta 1.",
                    "Poletime ultra-agressivo com pneus C5 Macios.",
                    "Previsão de vitória com estratégia de parada única."
                ],
                secretWarning: "TRAVAMENTO DE RODA: Asfalto de baixíssima aderência gera flat spots irreparáveis na primeira freada."
            },
            C: {
                directorTitle: "Viktor Vance // Diretor de Estratégias Secretas da Vanguarda",
                headquarters: "Milton Keynes Advanced Research Lab",
                codeWord: "VORTEX-HIGH-ALTITUDE // SKUNKWORKS",
                confidentialityLevel: "SIGILOSO",
                memo: "As outras equipes entram em pânico com o ar rarefeito; nós prosperamos nele. Nossa asa traseira tem o arrasto mais eficiente do grid. Chegaremos a 355 km/h no speed trap sem esforço. Se houver bandeira amarela na T1 — e haverá —, a nossa estratégia alternativa de box vai nos colocar na frente.",
                tacticalDirectives: [
                    "Top speed líder absoluto em telemetria.",
                    "Aposte em ganho de posições massivo na largada (EVO).",
                    "Safety Car confirmado na primeira volta em Event Props."
                ],
                secretWarning: "TURBULÊNCIA NO FORO SOL: Baixa pressão faz o carro escorregar na saída para a curva Peraltada."
            }
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
        directorMemos: {
            A: {
                directorTitle: "Dr. Helmut Von Klausen // Diretor Geral de Engenharia de Brackley",
                headquarters: "Brackley Operations // UK",
                codeWord: "TEMPESTADE-PAULISTA // PROTOCOLO SILBER-BRA",
                confidentialityLevel: "ULTRA-CONFIDENCIAL",
                memo: "Interlagos pune a hesitação. O traçado anti-horário massacra o pescoço do piloto e o ombro direito dos pneus. No S do Senna, nossa geometria dianteira garante entrada cirúrgica. Se a chuva cair — e a probabilidade de 65% indica que sim —, acione imediatamente o mapa de conservação de pneus intermediários. Quem parar no momento exato da garoa vence a rodada.",
                tacticalDirectives: [
                    "Poletime ultracurto: cravar entre 1:09.600 e 1:10.100.",
                    "Monitore o radar minuto a minuto: undercut em pista molhada vale 4 segundos.",
                    "Top 10 aberto para reviravoltas dramáticas no terço final."
                ],
                secretWarning: "COMPRESSÃO NA JUNÇÃO: A força G vertical esmaga o fundo do carro. Risco de desgaste na prancha de madeira sob o chassi."
            },
            B: {
                directorTitle: "Ing. Lorenzo Casali // Diretor de Operações de Maranello",
                headquarters: "Reparto Corse Gestione Sportiva // Maranello",
                codeWord: "PASSIONE SENNA // OPERAÇÃO INTERLAGOS",
                confidentialityLevel: "CONFIDENCIAL TÁTICO",
                memo: "Em Interlagos se corre com a alma e o motor no talo. A subida dos boxes é onde nosso motor Ferrari vai empurrar tudo o que tem na bateria. Se nosso piloto contornar a Junção colado no adversário, a ultrapassagem no fim da reta principal é inevitável. Prepare seus palpites para uma batalha de gladiadores.",
                tacticalDirectives: [
                    "Aposte em duelos ferozes na freada do S do Senna.",
                    "Safety Car com probabilidade máxima de 80%: marque 'SIM'.",
                    "Top 10 com pódio duplo dos nossos motores se a corrida for seca."
                ],
                secretWarning: "AQUAPLANAGEM NA CURVA DO SOL: Se chover, a água escorre transversalmente na pista criando um rio invisível."
            },
            C: {
                directorTitle: "Viktor Vance // Diretor de Estratégias Secretas da Vanguarda",
                headquarters: "Milton Keynes Skunkworks Labs",
                codeWord: "SENNA-RAIN-PROTOCOL // VANGUARD BLACK",
                confidentialityLevel: "SIGILOSO",
                memo: "Nenhuma pista do mundo recompensa tanto o instinto predatório quanto São Paulo. O S do Senna e a Descida do Lago são nossos campos de caça. Nossos estrategistas foram treinados para acionar paradas sob Virtual Safety Car antes de qualquer outro box. Calibre seus prognósticos sabendo que em Interlagos tudo pode acontecer.",
                tacticalDirectives: [
                    "Maior índice de ultrapassagens e escalada EVO do campeonato.",
                    "Volta mais rápida disputada até a última volta com pneus macios.",
                    "Aposte em surpresas no Top 5 final."
                ],
                secretWarning: "ZEBRAS DO BICO DE PATO: Evite cortes excessivos na zebra interna para não danificar suspensão dianteira."
            }
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
        directorMemos: {
            A: {
                directorTitle: "Dr. Helmut Von Klausen // Diretor Geral de Engenharia de Brackley",
                headquarters: "Brackley Operations // UK",
                codeWord: "SAKHIR-OPENING // PROTOCOLO SILBER-BHR",
                confidentialityLevel: "ULTRA-CONFIDENCIAL",
                memo: "O deserto não perdoa erros de termodinâmica. O asfalto de granito de Sakhir vai mastigar qualquer pneu traseiro mal gerenciado. A nossa prioridade absoluta é garantir estabilidade de frenagem na curva 10 e tração na saída da curva 4. Estrategista, mantenha a calma e calibre os palpites com precisão de laboratório.",
                tacticalDirectives: [
                    "Poletime de abertura na faixa de 1:29.100.",
                    "Dois pitstops obrigatórios no plano de prova.",
                    "Previsão de consistência para pontuar dobrado na Superlicença."
                ],
                secretWarning: "AREIA NA PISTA: Quedas bruscas de temperatura aumentam a granulação (graining) dos pneus dianteiros."
            },
            B: {
                directorTitle: "Ing. Lorenzo Casali // Diretor de Operações de Maranello",
                headquarters: "Reparto Corse Gestione Sportiva // Maranello",
                codeWord: "DESERT HAWK // OPERAÇÃO SAKHIR",
                confidentialityLevel: "CONFIDENCIAL TÁTICO",
                memo: "Primeira corrida do ano, primeiro teste de fogo para a nossa aliança. As 4 retas de Sakhir foram feitas para a potência do nosso V6 e a fúria dos nossos pilotos. Quero a pole position carimbada no sábado para ditar o ritmo no domingo. Nenhum recuo.",
                tacticalDirectives: [
                    "Poletime agressivo com quebra de marca histórica.",
                    "Ataque total na primeira curva após as luzes se apagarem.",
                    "Aposte em Top 10 dominante dos motores Ferrari."
                ],
                secretWarning: "FREADA DA CURVA 10: Roda dianteira esquerda sem peso no declive, risco de travamento grave."
            },
            C: {
                directorTitle: "Viktor Vance // Diretor de Estratégias Secretas da Vanguarda",
                headquarters: "Milton Keynes Skunkworks Labs",
                codeWord: "DUNES OF CHAOS // SHADOW SAKHIR",
                confidentialityLevel: "SIGILOSO",
                memo: "Enquanto eles se preocupam com o desgaste dos pneus, nós ajustamos o diferencial para engolir as saídas de curva lenta. Sakhir premia quem sabe atacar nas zonas DRS 2 e 3. Nossos carros estão leves, rápidos e com sede de vitória.",
                tacticalDirectives: [
                    "Estratégia de undercut agressivo na volta 13.",
                    "Ganho de posições nas relargadas de Safety Car.",
                    "Volta mais rápida confirmada na janela final com tanque vazio."
                ],
                secretWarning: "RAJADAS DE VENTO CRUZADO: Curvas 1 e 4 vulneráveis a ventos do norte desestabilizando a asa dianteira."
            }
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
