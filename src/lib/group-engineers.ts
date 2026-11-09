/**
 * BAEFF1 // GROUP TECHNICAL ENGINEER ALLOCATION SYSTEM
 * 
 * Sorteio e atribuição de avatares de Engenheiro Técnico por Grupo:
 * - Cada grupo tem até 22 pilotos/usuários (as 22 vagas do grid oficial da F1).
 * - O banco possui 30 avatares técnicos no Supabase Storage: avatar_1.jpg a avatar_30.jpg.
 * - Sorteio determinístico (seeded PRNG por group_id) garantindo:
 *   1. Zero repetição de avatar dentro do mesmo grupo (30 avatares para 22 pilotos).
 *   2. Re-embaralhamento independente entre grupos diferentes (Grupo 1 Farina, Grupo 2 Fangio, etc.).
 *   3. Nomes de engenheiros sem numeração (Regra: engenheiros NÃO usam números, ex: "T.VANCE", "C.DUPONT").
 */

export interface GroupTechnicalEngineer {
    avatarIndex: number;
    avatarUrl: string;
    code: string;           // "T.VANCE", "C.DUPONT" (SEM NUMERAÇÃO)
    fullName: string;       // "Tyler Vance"
    role: string;           // "Engenheiro de Telemetria & Software"
    specialty: string;
    nationality: string;
    age: number;
}

const SUPABASE_AVATARS_BASE = 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/eng';

// 30 Engenheiros Canônicos catalogados a partir de public/avatar/eng/Avatar_Data.txt (SEM NÚMEROS)
export const CANONICAL_ENGINEERS_METADATA: Array<{
    code: string;
    fullName: string;
    role: string;
    nationality: string;
    age: number;
    specialty: string;
}> = [
    { code: 'T.VANCE', fullName: 'Tyler Vance', role: 'Engenheiro de Telemetria & Software', nationality: 'Britânico', age: 27, specialty: 'Processamento de telemetria bruta e algoritmos preditivos' },
    { code: 'C.DUPONT', fullName: 'Camille Dupont', role: 'Estrategista-Chefe de Corrida', nationality: 'Francesa', age: 44, specialty: 'Cálculo de janelas de pit stop e previsão meteorológica' },
    { code: 'H.WEBER', fullName: 'Helmut Weber', role: 'Diretor Técnico & Mestre de Powertrain', nationality: 'Alemão', age: 59, specialty: 'Confiabilidade mecânica de motor e dissipação térmica' },
    { code: 'K.MENSAH', fullName: 'Kofi Mensah', role: 'Engenheiro de Pista & Rádio do Piloto', nationality: 'Ganense', age: 36, specialty: 'Comunicação tática em rádio e gestão psicológica' },
    { code: 'M.SATO', fullName: 'Mei Sato', role: 'Especialista em Aerodinâmica & CFD', nationality: 'Japonesa', age: 31, specialty: 'Downforce em alta velocidade e desgaste assimétrico' },
    { code: 'D.CORDEIRO', fullName: 'Danilo Cordeiro', role: 'Mecânico-Chefe de Garagem', nationality: 'Brasileiro', age: 42, specialty: 'Operações de box, trocas de bico e reparo de emergência' },
    { code: 'A.KOVÁCS', fullName: 'Attila Kovács', role: 'Engenheiro de Estrutura & Suspensão', nationality: 'Húngaro', age: 53, specialty: 'Geometria de suspensão e rigidez em zebras agressivas' },
    { code: 'N.ADEBAYO', fullName: 'Nia Adebayo', role: 'Engenheira de Sistemas Elétricos & ERS', nationality: 'Nigeriana', age: 29, specialty: 'Mapas de entrega de potência elétrica e regeneração' },
    { code: 'L.MORETTI', fullName: 'Luca Moretti', role: 'Analista de Pneus & Degradação Térmica', nationality: 'Italiano', age: 24, specialty: 'Monitoramento de temperatura de carcaça e gomas macias' },
    { code: 'R.SILVA', fullName: 'Rafael Silva', role: 'Engenheiro de Performance & Dinâmica', nationality: 'Português', age: 38, specialty: 'Balanço de frenagem e mapa de diferencial em curvas' },
    { code: 'A.CASTRO', fullName: 'Alice Castro', role: 'Engenheira de Dinâmica de Fluidos (CFD)', nationality: 'Brasileira', age: 25, specialty: 'Simulações digitais e arrasto em vácuo' },
    { code: 'J.HUAMAN', fullName: 'Javier Huaman', role: 'Especialista em Transmissão & Câmbio', nationality: 'Peruano', age: 46, specialty: 'Mapeamento de relações de marcha e engrenagens' },
    { code: 'E.LARSEN', fullName: 'Emma Larsen', role: 'Analista de Tráfego de Pista & Undercut', nationality: 'Dinamarquesa', age: 51, specialty: 'Otimização de tráfego e janelas de ar limpo' },
    { code: 'S.AL-FAYED', fullName: 'Samir Al-Fayed', role: 'Engenheiro de Conectividade em Tempo Real', nationality: 'Egípcio', age: 33, specialty: 'Telemetria ao vivo via satélite e sensores IoT' },
    { code: 'O.HIGGINS', fullName: 'Owen Higgins', role: 'Engenheiro-Chefe de Confiabilidade', nationality: 'Irlandês', age: 45, specialty: 'Tolerância a fadiga de materiais e integridade de chassi' },
    { code: 'I.NOVAK', fullName: 'Irena Novak', role: 'Analista de Desempenho e Parciais', nationality: 'Polaca', age: 26, specialty: 'Micro-setores e telemetria comparativa contra rivais' },
    { code: 'M.JOHNSON', fullName: 'Marcus Johnson', role: 'Engenheiro Sênior de Motores Térmicos', nationality: 'Norte-americano', age: 55, specialty: 'Eficiência de combustão e calibração de turbina' },
    { code: 'A.LINDBERG', fullName: 'Anton Lindberg', role: 'Mecânico de Linha de Pit-Stop', nationality: 'Sueco', age: 30, specialty: 'Rapidez de trocas de pneus em paradas sub-2s' },
    { code: 'T.DIALLO', fullName: 'Thierno Diallo', role: 'Especialista em Gestão de Pneus', nationality: 'Senegalês', age: 28, specialty: 'Curvas de histerese e desgaste de compostos duros' },
    { code: 'K.NAIDOO', fullName: 'Kavitha Naidoo', role: 'Técnica de Eletrônica e Chicotes', nationality: 'Sul-africana', age: 37, specialty: 'Diagnóstico de sensores térmicos e fiação veicular' },
    { code: 'N.BRANDÃO', fullName: 'Natália Brandão', role: 'Engenheira de Rádio e Comunicação', nationality: 'Brasileira', age: 27, specialty: 'Clareza em situações críticas de Safety Car' },
    { code: 'R.TORRES', fullName: 'Rodrigo Torres', role: 'Especialista em Transmissão', nationality: 'Mexicano', age: 34, specialty: 'Resposta de trocas rápidas de marchas ascendentes' },
    { code: 'G.MOREAU', fullName: 'Gérard Moreau', role: 'Engenheiro Sênior de Powertrain', nationality: 'Francês', age: 56, specialty: 'Equalização de torque e confiabilidade de escapamento' },
    { code: 'K.AABERG', fullName: 'Kari Aaberg', role: 'Analista de Túnel de Vento', nationality: 'Norueguesa', age: 24, specialty: 'Downforce em curvas médias e equilíbrio de asa' },
    { code: 'M.AL-SAYED', fullName: 'Malik Al-Sayed', role: 'Engenheiro de Pista & Acerto', nationality: 'Emiradense', age: 38, specialty: 'Ajuste de cambagem, convergência e pressão dos amortecedores' },
    { code: 'T.O\'CONNOR', fullName: 'Tiernan O\'Connor', role: 'Engenheiro de Software & Dados', nationality: 'Irlandês', age: 23, specialty: 'Modelagem preditiva em Python e simulação de corrida' },
    { code: 'A.KOVÁCH', fullName: 'Anikó Kovách', role: 'Estrategista de Combustível & Pneus', nationality: 'Húngara', age: 42, specialty: 'Cálculo de lift and coast e consumo volta a volta' },
    { code: 'W.SCHMIDT', fullName: 'Wilhelm Schmidt', role: 'Mecânico-Chefe de Garagem', nationality: 'Alemão', age: 61, specialty: 'Coordenação operacional e montagem de chassi' },
    { code: 'D.ADEBAYO', fullName: 'Dapo Adebayo', role: 'Analista de Desempenho & Telemetria', nationality: 'Nigeriano', age: 31, specialty: 'Ganho em milissegundos nos ápices de curva' },
    { code: 'H.TANAKA', fullName: 'Haruka Tanaka', role: 'Técnica de Componentes Elétricos', nationality: 'Japonesa', age: 29, specialty: 'Baterias de alta voltagem e inversores térmicos' },
];

// Pool internacional de nomes adicionais sem números para grupos superiores (Grupo 2, Grupo 3, etc.)
export const GROUP_SURNAME_POOLS: string[][] = [
    // Pool para Grupo 1 (Canonical)
    CANONICAL_ENGINEERS_METADATA.map(e => e.code),
    // Pool para Grupo 2
    ['P.DUBOIS', 'L.BIANCHI', 'S.ALVAREZ', 'K.RAIKKONEN', 'F.WINTER', 'O.LEFEBVRE', 'C.FONTANA', 'N.BAUER', 'J.VILLENEUVE', 'M.ROSSI', 'A.NILSSON', 'H.KOIVISTO', 'E.NAVARRO', 'V.PETROV', 'D.MULLER', 'S.CHOPRA', 'G.MORETTI', 'J.SANTOS', 'T.HOLM', 'R.DIETRICH', 'B.GOMEZ', 'W.CHENG', 'M.LEBLANC', 'C.JENSEN', 'S.OKADA', 'K.O\'SULLIVAN', 'A.VASQUEZ', 'P.KOWALSKI', 'F.COSTA', 'E.LARSSON'],
    // Pool para Grupo 3
    ['M.SCHNEIDER', 'A.RICCI', 'D.FERNANDEZ', 'K.TAKEDA', 'L.SOUSA', 'G.BERG', 'O.DUMONT', 'R.HANSEN', 'T.MARTINS', 'E.VOGEL', 'H.LECLERCQ', 'J.MORALES', 'B.SZABÓ', 'N.DELACROIX', 'F.KLEIN', 'W.ZHAO', 'C.PEREIRA', 'S.ALVES', 'M.NOWICKI', 'A.CAMPOS', 'L.ZIMMERMANN', 'K.ASLAN', 'D.ROCHER', 'R.SVENSSON', 'G.PASTORE', 'T.KIM', 'P.BARBOSA', 'E.GUERRA', 'J.LUND', 'O.NASCIMENTO'],
    // Pool para Grupo 4+
    ['B.MOREL', 'K.JONES', 'S.FISCHER', 'M.CASTILLO', 'D.HERNANDEZ', 'A.ROVELLI', 'T.POPOV', 'N.DE JONG', 'C.OLIVEIRA', 'L.KRAUS', 'E.GIRARD', 'F.FERREIRA', 'W.BEKER', 'R.SERRA', 'J.ALDRIDGE', 'O.MARCHETTI', 'A.SUZUKI', 'G.CARTER', 'M.COLOMBO', 'S.LEHMANN', 'P.ANDRADE', 'H.BENSON', 'K.HAKKINEN', 'V.ROMANO', 'C.CARDOSO', 'D.LEROY', 'T.NOGUEIRA', 'E.MENDES', 'A.FARIA', 'L.VAZQUEZ']
];

/**
 * Embaralha os índices [1..30] de forma determinística com base no group_id.
 * Garante que para o mesmo groupId a ordem é sempre a mesma, mas entre grupos diferentes
 * a ordem é totalmente distinta.
 */
export function getGroupShuffledAvatarIndices(groupId: number): number[] {
    const indices = Array.from({ length: 30 }, (_, i) => i + 1);
    // PRNG Linear Congruential Generator com semente baseada no groupId
    let seed = ((Number(groupId) || 1) * 1664525 + 1013904223) >>> 0;

    for (let i = indices.length - 1; i > 0; i--) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const j = seed % (i + 1);
        const temp = indices[i];
        indices[i] = indices[j];
        indices[j] = temp;
    }

    return indices;
}

/**
 * Retorna o Engenheiro Técnico alocado para um usuário específico dentro de um grupo.
 * 
 * @param groupId ID do grupo (1, 2, 3...)
 * @param seatOrUserIndex Posição do usuário no grid do grupo (0 a 21) ou hash do user_id
 * @returns Engenheiro Técnico com avatar único dentro do grupo e nome sem números.
 */
export function getGroupTechnicalEngineer(
    groupId: number = 1,
    seatOrUserIndex: number | string = 0
): GroupTechnicalEngineer {
    const validGroupId = Math.max(1, Number(groupId) || 1);
    const shuffledAvatarIndices = getGroupShuffledAvatarIndices(validGroupId);

    // Converte seatOrUserIndex para um índice de 0 a 21 (ou até 29)
    let index = 0;
    if (typeof seatOrUserIndex === 'number') {
        index = Math.abs(seatOrUserIndex) % 30;
    } else if (typeof seatOrUserIndex === 'string') {
        // Hash simples de string para mapear determinísticamente o UUID do usuário para uma vaga (0 a 21)
        let hash = 0;
        for (let i = 0; i < seatOrUserIndex.length; i++) {
            hash = (hash << 5) - hash + seatOrUserIndex.charCodeAt(i);
            hash |= 0;
        }
        index = Math.abs(hash) % 22; // 22 vagas por grupo
    }

    // Avatar sorteado sem repetição para este assento no grupo
    const avatarNum = shuffledAvatarIndices[index % shuffledAvatarIndices.length];
    const avatarUrl = `${SUPABASE_AVATARS_BASE}/avatar_${avatarNum}.jpg`;

    // Seleciona o pool de nomes do grupo
    const poolIndex = (validGroupId - 1) % GROUP_SURNAME_POOLS.length;
    const namePool = GROUP_SURNAME_POOLS[poolIndex];
    const assignedCode = namePool[index % namePool.length];

    // Metadados baseados no avatar correspondente
    const baseMeta = CANONICAL_ENGINEERS_METADATA[(avatarNum - 1) % CANONICAL_ENGINEERS_METADATA.length];

    return {
        avatarIndex: avatarNum,
        avatarUrl,
        code: assignedCode, // SEM NÚMEROS (ex: "T.VANCE", "P.DUBOIS")
        fullName: baseMeta.fullName,
        role: baseMeta.role,
        specialty: baseMeta.specialty,
        nationality: baseMeta.nationality,
        age: baseMeta.age
    };
}
