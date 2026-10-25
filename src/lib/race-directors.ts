/**
 * VoltGrid Intelligence System // Race Directors (Diretores de Corrida)
 * 
 * Lista canônica de Diretores de Corrida fictícios inspirados nas lendas
 * das décadas iniciais da Fórmula 1 (1950s, 1960s, 1970s), com o primeiro nome
 * modificado no padrão oficial de nomenclatura de pilotos do VoltGrid (ex: "J.BANDINI").
 */

export interface RaceDirector {
    id: string;
    code: string;            // Padrão rigoroso VoltGrid: "J.BANDINI"
    displayName: string;     // Formato de exibição: "J. Bandini"
    firstNameModified: string; // Nome fictício alterado (ex: "Jonathan")
    originalInspiration: string; // Piloto clássico original
    decade: '1950s' | '1960s' | '1970s';
    nationality: string;
    countryCode: string;
    experienceYears: number;
    stewardRole: string;
    biography: string;
}

export const RACE_DIRECTORS: RaceDirector[] = [
    {
        id: 'rd-01',
        code: 'J.BANDINI',
        displayName: 'J. Bandini',
        firstNameModified: 'Julio',
        originalInspiration: 'Lorenzo Bandini (1960s)',
        decade: '1960s',
        nationality: 'Italiano',
        countryCode: 'ITA',
        experienceYears: 18,
        stewardRole: 'DIRETOR DE PROVA PRINCIPAL (CHIEF RACE DIRECTOR)',
        biography: 'Veterano do asfalto italiano, intransigente com infrações de bandeira amarela e limites de pista.'
    },
    {
        id: 'rd-02',
        code: 'E.FARINA',
        displayName: 'E. Farina',
        firstNameModified: 'Enzo',
        originalInspiration: 'Giuseppe Farina (1950s)',
        decade: '1950s',
        nationality: 'Italiano',
        countryCode: 'ITA',
        experienceYears: 24,
        stewardRole: 'COMISSÁRIO SÊNIOR DE GRID',
        biography: 'Mestre da velha escola de Turim, focado na integridade mecânica e procedimentos de largada limpos.'
    },
    {
        id: 'rd-03',
        code: 'A.FANGIO',
        displayName: 'A. Fangio',
        firstNameModified: 'Alejandro',
        originalInspiration: 'Juan Manuel Fangio (1950s)',
        decade: '1950s',
        nationality: 'Argentino',
        countryCode: 'ARG',
        experienceYears: 22,
        stewardRole: 'DIRETOR TÉCNICO DE SEGURANÇA DE PISTA',
        biography: 'Estrategista meticuloso com visão cirúrgica para leitura de aderência e condições de pista sob chuva.'
    },
    {
        id: 'rd-04',
        code: 'M.ASCARI',
        displayName: 'M. Ascari',
        firstNameModified: 'Matteo',
        originalInspiration: 'Alberto Ascari (1950s)',
        decade: '1950s',
        nationality: 'Italiano',
        countryCode: 'ITA',
        experienceYears: 20,
        stewardRole: 'DELEGADO DE TELEMETRIA E HOMOLOGAÇÃO',
        biography: 'Especialista em cronometragem precisa até o milésimo e controle de fluxo do pitlane.'
    },
    {
        id: 'rd-05',
        code: 'D.HAWTHORN',
        displayName: 'D. Hawthorn',
        firstNameModified: 'Derek',
        originalInspiration: 'Mike Hawthorn (1950s)',
        decade: '1950s',
        nationality: 'Britânico',
        countryCode: 'GBR',
        experienceYears: 17,
        stewardRole: 'COMISSÁRIO DE DUELOS RODA A RODA',
        biography: 'Focado em disputas leais nas freadas mais duras e punições imediatas por bloqueios perigosos.'
    },
    {
        id: 'rd-06',
        code: 'K.MOSS',
        displayName: 'K. Moss',
        firstNameModified: 'Kenneth',
        originalInspiration: 'Stirling Moss (1950s)',
        decade: '1950s',
        nationality: 'Britânico',
        countryCode: 'GBR',
        experienceYears: 25,
        stewardRole: 'DIRETOR DE CONTROLE DE SESSÃO & BANDEIRAS',
        biography: 'Autoridade máxima em cavalheirismo e precisão na aplicação do código desportivo internacional.'
    },
    {
        id: 'rd-07',
        code: 'H.COLLINS',
        displayName: 'H. Collins',
        firstNameModified: 'Henry',
        originalInspiration: 'Peter Collins (1950s)',
        decade: '1950s',
        nationality: 'Britânico',
        countryCode: 'GBR',
        experienceYears: 16,
        stewardRole: 'COORDENADOR DE SAFETY CAR & VSC',
        biography: 'Responsável pelo acionamento instantâneo de veículos de intervenção e zonas de neutralização.'
    },
    {
        id: 'rd-08',
        code: 'T.MUSSO',
        displayName: 'T. Musso',
        firstNameModified: 'Tommaso',
        originalInspiration: 'Luigi Musso (1950s)',
        decade: '1950s',
        nationality: 'Italiano',
        countryCode: 'ITA',
        experienceYears: 15,
        stewardRole: 'AUDITOR DE PROTOCOLO DE PESAGEM',
        biography: 'Exigência implacável no cumprimento do peso mínimo dos monopostos e conformidade do fundo plano.'
    },
    {
        id: 'rd-09',
        code: 'C.GONZALEZ',
        displayName: 'C. Gonzalez',
        firstNameModified: 'Camilo',
        originalInspiration: 'José Froilán González (1950s)',
        decade: '1950s',
        nationality: 'Argentino',
        countryCode: 'ARG',
        experienceYears: 19,
        stewardRole: 'INSPETOR DE SAÍDAS DE BOX E PITLANE',
        biography: 'Famoso por não perdoar liberações perigosas (unsafe release) durante os pit stops sob tensão.'
    },
    {
        id: 'rd-10',
        code: 'R.FAGIOLI',
        displayName: 'R. Fagioli',
        firstNameModified: 'Rinaldo',
        originalInspiration: 'Luigi Fagioli (1950s)',
        decade: '1950s',
        nationality: 'Italiano',
        countryCode: 'ITA',
        experienceYears: 23,
        stewardRole: 'SUPERVISOR DE CONSELHO DE PILOTOS',
        biography: 'Experiência diplomática de bastidores para gerenciar conflitos inflamados entre chefes de equipe.'
    },
    {
        id: 'rd-11',
        code: 'K.VONTRIPS',
        displayName: 'K. Von Trips',
        firstNameModified: 'Klaus',
        originalInspiration: 'Wolfgang von Trips (1960s)',
        decade: '1960s',
        nationality: 'Alemão',
        countryCode: 'GER',
        experienceYears: 19,
        stewardRole: 'DIRETOR DE BARREIRAS & SEGURANÇA ESTRUTURAL',
        biography: 'Especialista em absorção de impacto, drenagem de asfalto e inspeção de zebras nos circuitos.'
    },
    {
        id: 'rd-12',
        code: 'C.HILL',
        displayName: 'C. Hill',
        firstNameModified: 'Charles',
        originalInspiration: 'Phil Hill (1960s)',
        decade: '1960s',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        experienceYears: 21,
        stewardRole: 'DELEGADO FIA PARA CIRCUITOS URBANOS',
        biography: 'Conhecedor profundo dos riscos milimétricos em circuitos cercados por muros de concreto.'
    },
    {
        id: 'rd-13',
        code: 'P.GURNEY',
        displayName: 'P. Gurney',
        firstNameModified: 'Preston',
        originalInspiration: 'Dan Gurney (1960s)',
        decade: '1960s',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        experienceYears: 18,
        stewardRole: 'INSPETOR DE INOVAÇÕES AERODINÂMICAS',
        biography: 'Engenheiro pioneiro, vigilante sobre a flexibilidade de asas e vácuo gerado pelos difusores.'
    },
    {
        id: 'rd-14',
        code: 'R.MCLAREN',
        displayName: 'R. McLaren',
        firstNameModified: 'Ross',
        originalInspiration: 'Bruce McLaren (1960s)',
        decade: '1960s',
        nationality: 'Neozelandês',
        countryCode: 'NZL',
        experienceYears: 22,
        stewardRole: 'DIRETOR DE OPERAÇÕES DE RESGATE & MÉDICO',
        biography: 'Liderança firme em evacuações rápidas de pista e coordenação com a equipe médica de resgate.'
    },
    {
        id: 'rd-15',
        code: 'F.SURTEES',
        displayName: 'F. Surtees',
        firstNameModified: 'Felix',
        originalInspiration: 'John Surtees (1960s)',
        decade: '1960s',
        nationality: 'Britânico',
        countryCode: 'GBR',
        experienceYears: 24,
        stewardRole: 'COORDENADOR DE SANCÕES & DRIVE-THROUGH',
        biography: 'Postura metódica e austera, aplica penalidades de tempo com frieza britânica e precisão cirúrgica.'
    },
    {
        id: 'rd-16',
        code: 'B.CLARK',
        displayName: 'B. Clark',
        firstNameModified: 'Brendan',
        originalInspiration: 'Jim Clark (1960s)',
        decade: '1960s',
        nationality: 'Escocês',
        countryCode: 'GBR',
        experienceYears: 20,
        stewardRole: 'AUDITOR DE PROCEDIMENTO DE QUALIFICAÇÃO',
        biography: 'Vigilante na fiscalização de voltas lentas no tráfego durante o Q1, Q2 e Q3.'
    },
    {
        id: 'rd-17',
        code: 'A.HILL',
        displayName: 'A. Hill',
        firstNameModified: 'Arthur',
        originalInspiration: 'Graham Hill (1960s)',
        decade: '1960s',
        nationality: 'Britânico',
        countryCode: 'GBR',
        experienceYears: 23,
        stewardRole: 'COORDENADOR DE CERIMÔNIA & PÓDIO',
        biography: 'Garante o protocolo solene de pesagem dos três primeiros colocados e cumprimento do parque fechado.'
    },
    {
        id: 'rd-18',
        code: 'V.GINTHER',
        displayName: 'V. Ginther',
        firstNameModified: 'Victor',
        originalInspiration: 'Richie Ginther (1960s)',
        decade: '1960s',
        nationality: 'Norte-Americano',
        countryCode: 'USA',
        experienceYears: 17,
        stewardRole: 'DELEGADO DE MOTORES & LIMITADORES ELETRÔNICOS',
        biography: 'Focado na verificação de sensores de fluxo de combustível e potência dos sistemas híbridos.'
    },
    {
        id: 'rd-19',
        code: 'S.RINDT',
        displayName: 'S. Rindt',
        firstNameModified: 'Stefan',
        originalInspiration: 'Jochen Rindt (1970s)',
        decade: '1970s',
        nationality: 'Austríaco',
        countryCode: 'AUT',
        experienceYears: 16,
        stewardRole: 'DIRETOR DE RELARGADAS & GRID STANDING',
        biography: 'Especialista em procedimentos de relargada parada e controle de velocidade do Safety Car.'
    },
    {
        id: 'rd-20',
        code: 'G.ICKX',
        displayName: 'G. Ickx',
        firstNameModified: 'Gaston',
        originalInspiration: 'Jacky Ickx (1970s)',
        decade: '1970s',
        nationality: 'Belga',
        countryCode: 'BEL',
        experienceYears: 21,
        stewardRole: 'OFICIAL SÊNIOR DE CONDIÇÕES CLIMÁTICAS EXTREMAS',
        biography: 'Autoridade em drenabilidade de pista e decisão de suspensão temporária por bandeira vermelha em tempestades.'
    },
    {
        id: 'rd-21',
        code: 'N.REGAZZONI',
        displayName: 'N. Regazzoni',
        firstNameModified: 'Nico',
        originalInspiration: 'Clay Regazzoni (1970s)',
        decade: '1970s',
        nationality: 'Suíço',
        countryCode: 'SUI',
        experienceYears: 18,
        stewardRole: 'COMISSÁRIO DE CONTROLE DE ZEBRAS & LIMITES',
        biography: 'Monitora os sensores piezoelétricos de corte de curva nas chicanes mais rápidas do calendário.'
    },
    {
        id: 'rd-22',
        code: 'L.CEVERT',
        displayName: 'L. Cevert',
        firstNameModified: 'Laurent',
        originalInspiration: 'François Cevert (1970s)',
        decade: '1970s',
        nationality: 'Francês',
        countryCode: 'FRA',
        experienceYears: 15,
        stewardRole: 'DELEGADO DE COMUNICAÇÕES DE RÁDIO COM O BOX',
        biography: 'Monitora o canal de comunicação entre equipes e pilotos para impedir instruções ilegais de coaching.'
    },
    {
        id: 'rd-23',
        code: 'T.PETERSON',
        displayName: 'T. Peterson',
        firstNameModified: 'Tobias',
        originalInspiration: 'Ronnie Peterson (1970s)',
        decade: '1970s',
        nationality: 'Sueco',
        countryCode: 'SWE',
        experienceYears: 19,
        stewardRole: 'INSPETOR DE VELOCIDADE NO PITLANE',
        biography: 'Intolerante com excessos na linha de entrada dos boxes e calibrador dos radares de pitstop.'
    },
    {
        id: 'rd-24',
        code: 'E.REUTEMANN',
        displayName: 'E. Reutemann',
        firstNameModified: 'Esteban',
        originalInspiration: 'Carlos Reutemann (1970s)',
        decade: '1970s',
        nationality: 'Argentino',
        countryCode: 'ARG',
        experienceYears: 20,
        stewardRole: 'SUPERVISOR DE CONDIÇÕES DE LARGADA EM DECLIVE',
        biography: 'Focado no alinhamento das posições no grid e detecção de queimadas de largada por sensores de solo.'
    }
];

/**
 * Retorna o diretor de corrida pelo código canônico (ex: "J.BANDINI")
 */
export function getRaceDirectorByCode(code: string): RaceDirector | undefined {
    const clean = code.toUpperCase().trim();
    return RACE_DIRECTORS.find(rd => rd.code === clean);
}

/**
 * Retorna o diretor de corrida pelo ID
 */
export function getRaceDirectorById(id: string): RaceDirector | undefined {
    return RACE_DIRECTORS.find(rd => rd.id === id);
}

/**
 * Sorteia ou seleciona deterministicamente um diretor de corrida para uma rodada
 */
export function getRaceDirectorForRound(roundNumber: number): RaceDirector {
    const idx = (roundNumber - 1) % RACE_DIRECTORS.length;
    return RACE_DIRECTORS[idx];
}
