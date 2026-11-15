/**
 * BAEFF1 Paddock Crew & Relationship Engine
 * 
 * Estrutura profissional de paddock:
 * 1. Chefe de Equipe (Team Principal) - Liderança executiva, hospitalidade e cobrança de metas.
 * 2. Estrategista Sênior (Mentor / Ex-Piloto) - Condução do briefing e suporte nos formulários.
 * 3. Monitor de Relações & Reações - Variação de diálogos conforme o histórico de resultados.
 */

import { TEAM_PRINCIPAL_WELCOMES, TEAM_PRINCIPAL_REACTIONS } from '@/data/dialogues';

export interface TeamPrincipal {
    code: string;               // Padrão BAEFF1: "T.WULFF", "C.HORNE", "F.VASSEUX"
    fullName: string;
    teamCode: string;           // "MER", "FER", "MCL", etc.
    teamName: string;
    title: string;              // "CHEFE DE EQUIPE // TEAM PRINCIPAL"
    personality: string;        // Traço marcante da liderança
    avatarUrl?: string;
    hospitalityWelcome: string; // Fala inaugural de boas-vindas no Hospitality
    briefingFocus: string;      // O que ele mais cobra do estrategista
    leadChiefStrategist: {
        code: string;
        fullName: string;
        role: string;
    };
    fridayMiscBriefing: string;  // Orientação conservadora para a reunião de Sexta sobre o formulário MISC
    reactions: {
        victory: string;        // Reação a vitória / pódio / cravada de poletime
        average: string;        // Reação a desempenho mediano / dentro da meta
        poor: string;           // Reação a resultado abaixo da meta / erro estratégico
    };
}

export interface CrewRelationshipState {
    teamPrincipalMorale: number;     // 0 a 100
    seniorStrategistTrust: number;   // 0 a 100
    boardConfidence: 'BAIXA' | 'ESTÁVEL' | 'ALTA' | 'INABALÁVEL';
    statusTag: string;               // ex: "PRESTÍGIO EM ALTA // COBRANÇA CONTROLADA"
    recentPerformanceTrend: 'UP' | 'STABLE' | 'DOWN';
    lastFeedbackSpeaker: string;
    lastFeedbackMessage: string;
}

export const TEAM_PRINCIPALS: Record<string, TeamPrincipal> = {
    MER: {
        code: 'T.WULFF',
        fullName: 'Torger "Toto" Wulff',
        teamCode: 'MER',
        teamName: 'Mercedes-AMG F1',
        title: 'CHEFE DE EQUIPE & DIRETOR EXECUTIVO',
        personality: 'Cirúrgico, calculista e intransigente com falhas operacionais.',
        hospitalityWelcome: '“Bem-vindo à nossa garagem. Aqui em Brackley nós não toleramos desculpas, toleramos dados. Se a sua telemetria for precisa, você terá o pit wall mais respeitado do grid.”',
        briefingFocus: 'Máxima precisão de ritmo de corrida e consistência matemática de paradas.',
        leadChiefStrategist: {
            code: 'R.MEADOWS',
            fullName: 'Ron Meadows-Lowe',
            role: 'Diretor Esportivo & Estrategista-Chefe'
        },
        fridayMiscBriefing: '“Atenção estrategista: para o formulário MISC deste fim de semana, nossa diretoria exige contenção de danos. A opção conservadora para Safety Car e incidentes no primeiro terço de prova é [NÃO / PROBABILIDADE BAIXA]. Não queime nosso orçamento de construtores. O MISC é a única decisão exclusivamente sua — assuma o risco por sua conta.”',
        reactions: {
            victory: '“Brilhante leitura de corrida! Seus números nos deram a vantagem exata que precisávamos. O consórcio da estrela reconhece seu valor.”',
            average: '“Pontos importantes para o campeonato, mas deixamos tempo valioso no segundo stint. Quero ver os dados de degradação térmica antes do debriefing.”',
            poor: '“Inaceitável. Nossa aliança técnica não constrói um motor deste calibre para perdermos posições por hesitação tática. Espero uma reação imediata no próximo GP.”'
        }
    },
    FER: {
        code: 'F.VASSEUX',
        fullName: 'Frédéric "Fred" Vasseux',
        teamCode: 'FER',
        teamName: 'Scuderia Ferrari',
        title: 'DIRETOR GERAL & CHEFE DE EQUIPE',
        personality: 'Pragmático, direto e com nervos de aço sob a pressão histórica de Maranello.',
        hospitalityWelcome: '“Benvenuto a Maranello. Você agora representa a paixão de milhões de tifosi. Não procure inventar estratégias mirabolantes: faça o simples com perfeição cirúrgica.”',
        briefingFocus: 'Evitar armadilhas de tráfego e acertar o momento exato do pit stop.',
        leadChiefStrategist: {
            code: 'D.CLEAR',
            fullName: 'Diego Clear-Rueda',
            role: 'Estrategista-Chefe de Pista'
        },
        fridayMiscBriefing: '“Olhe nos meus olhos: em Maranello não jogamos roleta russa. No formulário MISC, recomendo a opção segura [SAFETY CAR VIRTUAL / STAKE 10% A 20%]. A diretoria vai cobrar cada milésimo gasto. A decisão final é toda sua, então pense duas vezes antes de apostar tudo em bandeira vermelha.”',
        reactions: {
            victory: '“Mamma mia! Essa é a Ferrari que o mundo quer ver! A mureta dos boxes esteve impecável hoje. Desfrute do pódio, você mereceu.”',
            average: '“Um resultado razoável, mas a diretoria em Maranello quer troféus, não apenas estatísticas seguras. Vamos analisar as janelas de undercut perdidas.”',
            poor: '“A pressão dos tifosi vai ser impiedosa esta semana, e com razão. Nós erramos na leitura da pista. Não há espaço para outra corrida assim.”'
        }
    },
    MCL: {
        code: 'A.STELLAR',
        fullName: 'Andrea Stellar',
        teamCode: 'MCL',
        teamName: 'McLaren F1 Team',
        title: 'CHEFE DE EQUIPE & LÍDER TÉCNICO',
        personality: 'Científico, humilde, focado na cultura de evolução contínua e velocidade bruta.',
        hospitalityWelcome: '“Seja bem-vindo a Woking. Nosso monoposto é rápido, mas quem transforma aerodinâmica em troféu é o estrategista no pit wall. Confie na telemetria.”',
        briefingFocus: 'Gestão agressiva de pneus macios e extração da volta mais rápida.',
        leadChiefStrategist: {
            code: 'R.RANDELL',
            fullName: 'Rory Randell',
            role: 'Estrategista Sênior de Operações'
        },
        fridayMiscBriefing: '“Nossa modelagem preditiva em Woking indica estabilidade nos primeiros stints. Para o formulário MISC, sugiro adotar a previsão conservadora nos props de pista. A responsabilidade da alocação de risco pertence ao seu cockpit.”',
        reactions: {
            victory: '“Ritmo espetacular! A correlação entre os seus cálculos e a pista foi perfeita. Essa vitória é sua tanto quanto dos nossos pilotos.”',
            average: '“Coletamos bons dados, mas nossa telemetria indicava que o segundo lugar era possível. Vamos revisar a tomada de decisão no rádio.”',
            poor: '“Ficamos presos no tráfego e queimamos borracha sem necessidade. Precisamos de respostas claras para a próxima rodada.”'
        }
    },
    RBR: {
        code: 'C.HORNE',
        fullName: 'Christopher "Chris" Horne',
        teamCode: 'RBR',
        teamName: 'Red Bull Racing',
        title: 'CHIEF EXECUTIVE & TEAM PRINCIPAL',
        personality: 'Combativo, agressivo nas apostas de pit stop e obstinado pela liderança mundial.',
        hospitalityWelcome: '“Você está na garagem que não teme arriscar. Se tivermos que fazer três paradas para vencer, faremos. Seja ousado na mureta.”',
        briefingFocus: 'Under-cuts rápidos e domínio absoluto dos duelos roda a roda.',
        leadChiefStrategist: {
            code: 'W.COURTENAY',
            fullName: 'Will Courtenay-Hannah',
            role: 'Chefe de Estratégia de Corrida'
        },
        fridayMiscBriefing: '“Atenção mureta do piloto: embora a Red Bull seja agressiva, no formulário MISC meu conselho de cúpula é proteger a pontuação com opções seguras. Deixo a escolha do percentual e a alocação de risco exclusivamente com você. Prove que sabe a hora de arriscar.”',
        reactions: {
            victory: '“Simplesmente implacável! Você leu a janela de Safety Car com maestria. A Vanguarda está no topo onde pertence!”',
            average: '“Não entramos na F1 para ser figurantes no pelotão intermediário. Ajuste os cálculos de desgaste para a próxima etapa.”',
            poor: '“Um desastre estratégico. A diretoria austríaca já está pedindo explicações. Recupere esses pontos no próximo final de semana.”'
        }
    },
    WIL: {
        code: 'J.VOWLESON',
        fullName: 'James Vowleson',
        teamCode: 'WIL',
        teamName: 'Williams Racing',
        title: 'CHEFE DE EQUIPE & ESTRATEGISTA EXECUTIVO',
        personality: 'Estrategista nato, pedagógico e mestre em extrair resultados heróicos com orçamentos enxutos.',
        hospitalityWelcome: '“A Williams tem alma e história. Cada ponto conquistado aqui vale o dobro. Analise os gaps de pista com frieza e colheremos os frutos.”',
        briefingFocus: 'Apostas inteligentes de azarão e aproveitamento de falhas dos gigantes.',
        leadChiefStrategist: {
            code: 'S.BEAM',
            fullName: 'Sarah Beamish',
            role: 'Estrategista-Chefe de Engenharia'
        },
        fridayMiscBriefing: '“Como estrategista, meu conselho é proteger nosso capital no MISC. Opte pelo evento mais provável e mantenha a alocação de risco entre 10% e 20%. A decisão é estritamente sua.”',
        reactions: {
            victory: '“Histórico! Contra todas as probabilidades, seus cálculos nos colocaram entre os gigantes. Essa garagem orgulha Frank Williams hoje.”',
            average: '“Dentro do plano projetado pela engenharia. Ganhamos posições no desgaste e consolidamos nossa aliança.”',
            poor: '“Dói perder pontos que estavam nas nossas mãos por erro de timing de parada. Vamos aprender com os dados e voltar mais fortes.”'
        }
    },
    AST: {
        code: 'M.KRAKE',
        fullName: 'Michael "Mike" Krake',
        teamCode: 'AST',
        teamName: 'Aston Martin F1',
        title: 'TEAM PRINCIPAL',
        personality: 'Metódico, sereno e pressionado por resultados imediatos da diretoria verde.',
        hospitalityWelcome: '“Nossa infraestrutura em Silverstone é de ponta. Esperamos de você uma leitura refinada de corrida para honrar esse investimento.”',
        briefingFocus: 'Equilíbrio térmico e ultrapassagens estratégicas no pelotão intermediário.',
        leadChiefStrategist: {
            code: 'B.STEVENSON',
            fullName: 'Bernie Stevenson',
            role: 'Diretor de Estratégia de Paddock'
        },
        fridayMiscBriefing: '“A diretoria verde exige cautela. No MISC, recomendo a resposta de menor volatilidade. Você tem autoridade para decidir o percentual final.”',
        reactions: {
            victory: '“Excelente! Mostramos que a engenharia verde é capaz de disputar o topo quando a tática não comete erros.”',
            average: '“Um resultado sólido, mas precisamos de mais ambição nas janelas de pit stop para superar nossos rivais diretos.”',
            poor: '“A diretoria assistiu à corrida do motorhome e não ficou satisfeita. Precisamos reverter essa imagem imediatamente.”'
        }
    },
    ALP: {
        code: 'O.OAKESBY',
        fullName: 'Oliver Oakesby',
        teamCode: 'ALP',
        teamName: 'Alpine F1 Team',
        title: 'TEAM PRINCIPAL',
        personality: 'Jovem, direto, avesso a desculpas corporativas e exigente com resultados rápidos.',
        hospitalityWelcome: '“Esqueça a política, foque na pista. Quero ver você comandando a mureta com atitude e decisões firmes no rádio.”',
        briefingFocus: 'Over-cuts oportunos e agressividade em pistas de alta aderência.',
        leadChiefStrategist: {
            code: 'M.PERMANE',
            fullName: 'Matthieu Permane',
            role: 'Estrategista-Chefe de Operações'
        },
        fridayMiscBriefing: '“Sem firulas na mureta: minha orientação para o MISC é a linha conservadora. A escolha das respostas e o tamanho do risco são por sua conta.”',
        reactions: {
            victory: '“Assim que se faz! Atitude na mureta e execução impecável no pit stop. Mostramos o peso da nossa garagem!”',
            average: '“Terminamos na zona de pontuação, mas sem brilho. Exijo mais arrojo na chamada dos pilotos.”',
            poor: '“Ficamos completamente perdidos na leitura do asfalto. Reunião de emergência na garagem em 20 minutos.”'
        }
    },
    HAA: {
        code: 'A.KOMATSU',
        fullName: 'Ayao Komatsubara',
        teamCode: 'HAA',
        teamName: 'Haas F1 Team',
        title: 'TEAM PRINCIPAL',
        personality: 'Engenheiro puro-sangue, avesso a politicagem e focado em ritmo puro sem drama.',
        hospitalityWelcome: '“Sem dramas aqui. Menos conversa e mais telemetria limpa. Se os números fizerem sentido, você terá todo o meu apoio.”',
        briefingFocus: 'Sobrevivência de pneus e aproveitar qualquer incidente na pista.',
        leadChiefStrategist: {
            code: 'M.AYAO',
            fullName: 'Mark Crous-Ayao',
            role: 'Engenheiro de Estratégia de Box'
        },
        fridayMiscBriefing: '“Telemetria pura: não temos peças de reposição sobrando para brincar no MISC. Recomendo a opção de menor probabilidade de quebra. Você decide o risco.”',
        reactions: {
            victory: '“Grande trabalho! Trabalho duro, sem firulas e com foco total na telemetria. É assim que a Haas conquista pontos.”',
            average: '“Fizemos o que o carro permitia. Agora é analisar os freios e preparar a próxima rodada.”',
            poor: '“Cometemos erros básicos na janela de tráfego. Não temos margem para desperdiçar finais de semana assim.”'
        }
    },
    AUD: {
        code: 'M.BINOTTO',
        fullName: 'Mattia Binotti',
        teamCode: 'AUD',
        teamName: 'Audi F1 Project',
        title: 'CHIEF OPERATING & CHIEF TECHNICAL OFFICER',
        personality: 'Engenheiro cerebral, focado em processos alemães e precisão estrutural de longo prazo.',
        hospitalityWelcome: '“Bem-vindo ao projeto mais ambicioso do automobilismo. A Audi exige padrões de precisão absoluta em cada setor.”',
        briefingFocus: 'Telemetria de trem de força e consistência volta a volta.',
        leadChiefStrategist: {
            code: 'I.INAKI',
            fullName: 'Iñaki Rueda-Schmidt',
            role: 'Diretor de Estratégia Esportiva'
        },
        fridayMiscBriefing: '“A metodologia Audi baseia-se em margens seguras. Sugiro a opção estatística mais robusta no formulário MISC. O fator de risco final está em suas mãos.”',
        reactions: {
            victory: '“Uma demonstração magnífica do método Audi. Parabéns pela precisão cirúrgica de cada parada.”',
            average: '“Progresso mensurável, mas nossos parâmetros mostram que há 3 décimos por volta a serem destravados.”',
            poor: '“A metodologia falhou na aplicação prática. Vamos auditar todos os canais de telemetria da mureta.”'
        }
    },
    CAD: {
        code: 'M.ANDRETTO',
        fullName: 'Michael Andretto',
        teamCode: 'CAD',
        teamName: 'Cadillac F1 Team',
        title: 'TEAM PRINCIPAL & RACING ICON',
        personality: 'Voz icônica de corridas americanas, sangue nos olhos e vontade imensa de vencer na F1.',
        hospitalityWelcome: '“Entramos nessa categoria para brigar com os melhores do planeta. Mostre que o nosso pit wall tem coragem de vencer.”',
        briefingFocus: 'Agressividade na relargada e arrojo nas paradas com pneus novos.',
        leadChiefStrategist: {
            code: 'C.CHEVY',
            fullName: 'Cole Sullivan',
            role: 'Chefe de Estratégia de Motorsport'
        },
        fridayMiscBriefing: '“Gostamos de velocidade, mas no MISC a prudência institucional fala primeiro. Sugiro a aposta conservadora. A decisão do stake é sua.”',
        reactions: {
            victory: '“Isso é o que eu chamo de corrida de verdade! Colocamos a bandeira americana no topo com atitude de campeão!”',
            average: '“Batalhamos forte, mas faltou aquele veneno no stint final. Vamos levantar a cabeça para a próxima.”',
            poor: '“Não viemos até aqui para aceitar esse tipo de erro tático. Quero ver garra e recuperação no próximo circuito.”'
        }
    },
    RBA: {
        code: 'L.MEKIEZ',
        fullName: 'Laurent Mekiez',
        teamCode: 'RBA',
        teamName: 'Racing Bulls (RB)',
        title: 'TEAM PRINCIPAL',
        personality: 'Ágil, comunicativo e focado em formar e testar talentos no limite do grid.',
        hospitalityWelcome: '“Nossa equipe é dinâmica e não tem medo de testar novidades. Se você tiver uma leitura diferente do pelotão, fale no rádio.”',
        briefingFocus: 'Velocidade de reação a bandeiras amarelas e duelos com equipes de ponta.',
        leadChiefStrategist: {
            code: 'G.CARPENTER',
            fullName: 'Guillaume Rocquelin-Bulls',
            role: 'Estrategista-Chefe de Desenvolvimento'
        },
        fridayMiscBriefing: '“Para o MISC, recomendo a postura conservadora de pista para garantir pontos na tabela. A escolha final da alocação de risco é de sua alçada.”',
        reactions: {
            victory: '“Incrível! Batemos de frente contra as escuderias gigantes e saímos com troféu! Que leitura espetacular!”',
            average: '“Bons dados coletados e pilotos consistentes. Seguimos no caminho certo de evolução.”',
            poor: '“Perdemos o momento exato de entrar nos boxes e fomos punidos pelo pelotão. Precisamos de mais agilidade.”'
        }
    }
};

/**
 * Retorna o Chefe de Equipe de acordo com o código da equipe (ex: "FER", "MER").
 * Fallback para Ferrari caso código não seja reconhecido.
 */
export function getTeamPrincipal(teamCode?: string): TeamPrincipal {
    const clean = (teamCode || 'FER').toUpperCase().trim();
    const base = TEAM_PRINCIPALS[clean] || TEAM_PRINCIPALS['FER'];
    const syncedWelcome = TEAM_PRINCIPAL_WELCOMES[base.code];
    const syncedReactions = TEAM_PRINCIPAL_REACTIONS[base.teamCode];

    return {
        ...base,
        hospitalityWelcome: syncedWelcome ? `“${syncedWelcome}”` : base.hospitalityWelcome,
        reactions: syncedReactions
            ? {
                victory: syncedReactions.victory ? `“${syncedReactions.victory}”` : base.reactions.victory,
                average: syncedReactions.average ? `“${syncedReactions.average}”` : base.reactions.average,
                poor: syncedReactions.poor ? `“${syncedReactions.poor}”` : base.reactions.poor,
            }
            : base.reactions,
    };
}

/**
 * Monitor de Relações e Moral do Paddock
 * Simula ou recupera do localStorage o prestígio e moral do jogador perante os profissionais.
 */
export function getCrewRelationship(teamCode: string = 'FER'): CrewRelationshipState {
    const principal = getTeamPrincipal(teamCode);

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`crew_relationship_${teamCode}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (_) {}
        }
    }

    // Padrão inicial de um estrategista promissor recém-chegado
    return {
        teamPrincipalMorale: 82,
        seniorStrategistTrust: 88,
        boardConfidence: 'ALTA',
        statusTag: 'PRESTÍGIO EM ALTA // CONFIANÇA HOMOLOGADA',
        recentPerformanceTrend: 'UP',
        lastFeedbackSpeaker: principal.code,
        lastFeedbackMessage: principal.hospitalityWelcome
    };
}

/**
 * Atualiza o monitor de relações após a apuração de uma rodada
 */
export function updateCrewRelationship(
    teamCode: string,
    outcome: 'victory' | 'average' | 'poor'
): CrewRelationshipState {
    const current = getCrewRelationship(teamCode);
    const principal = getTeamPrincipal(teamCode);

    let newMorale = current.teamPrincipalMorale;
    let newTrust = current.seniorStrategistTrust;
    let newConfidence = current.boardConfidence;
    let newTrend = current.recentPerformanceTrend;
    let feedbackMsg = principal.reactions.average;

    if (outcome === 'victory') {
        newMorale = Math.min(100, newMorale + 8);
        newTrust = Math.min(100, newTrust + 6);
        newConfidence = newMorale > 85 ? 'INABALÁVEL' : 'ALTA';
        newTrend = 'UP';
        feedbackMsg = principal.reactions.victory;
    } else if (outcome === 'average') {
        newMorale = Math.max(30, Math.min(90, newMorale + 1));
        newTrust = Math.max(40, newTrust + 1);
        newConfidence = 'ESTÁVEL';
        newTrend = 'STABLE';
        feedbackMsg = principal.reactions.average;
    } else {
        newMorale = Math.max(20, newMorale - 12);
        newTrust = Math.max(30, newTrust - 8);
        newConfidence = newMorale < 45 ? 'BAIXA' : 'ESTÁVEL';
        newTrend = 'DOWN';
        feedbackMsg = principal.reactions.poor;
    }

    const updated: CrewRelationshipState = {
        teamPrincipalMorale: newMorale,
        seniorStrategistTrust: newTrust,
        boardConfidence: newConfidence,
        statusTag: newTrend === 'UP' 
            ? 'PRESTÍGIO EM ALTA // COBRANÇA CONTROLADA' 
            : newTrend === 'DOWN' 
            ? 'SOB PRESSÃO DA DIRETORIA // EXIGÊNCIA DE RECUPERAÇÃO' 
            : 'SITUAÇÃO ESTÁVEL // FOCO EM PONTOS',
        recentPerformanceTrend: newTrend,
        lastFeedbackSpeaker: principal.code,
        lastFeedbackMessage: feedbackMsg
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(`crew_relationship_${teamCode}`, JSON.stringify(updated));
    }

    return updated;
}
