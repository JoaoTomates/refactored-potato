/**
 * TS1 // REAL F1 PILOT INITIALS & CAR ALLOCATION
 * 
 * Mapeia os pilotos reais da F1 (3 letras oficiais, número e nome) para cada escuderia:
 * - Carro 1 (ex: Ferrari 1 = LEC, Mercedes 1 = RUS, Cadillac 1 = PER)
 * - Carro 2 (ex: Ferrari 2 = HAM, Mercedes 2 = ANT, Cadillac 2 = BOT)
 */

export interface RealF1Driver {
    code: string;       // 3 letras oficiais TS1 (ex: "LEC", "HAM", "PER")
    number: string;     // Número oficial (ex: "16", "44", "11")
    name: string;       // "C.LECLERC", "L.HAMILTON"
    seat: 1 | 2;
    teamName: string;
}

export const REAL_F1_GRID: Record<string, { car1: RealF1Driver; car2: RealF1Driver }> = {
    ferrari: {
        car1: { code: 'LEC', number: '16', name: 'C.LECLERC', seat: 1, teamName: 'Ferrari' },
        car2: { code: 'HAM', number: '44', name: 'L.HAMILTON', seat: 2, teamName: 'Ferrari' },
    },
    mclaren: {
        car1: { code: 'NOR', number: '04', name: 'L.NORRIS', seat: 1, teamName: 'McLaren' },
        car2: { code: 'PIA', number: '81', name: 'O.PIASTRI', seat: 2, teamName: 'McLaren' },
    },
    mercedes: {
        car1: { code: 'RUS', number: '63', name: 'G.RUSSELL', seat: 1, teamName: 'Mercedes' },
        car2: { code: 'ANT', number: '12', name: 'K.ANTONELLI', seat: 2, teamName: 'Mercedes' },
    },
    redbull: {
        car1: { code: 'VER', number: '01', name: 'M.VERSTAPPEN', seat: 1, teamName: 'Red Bull Racing' },
        car2: { code: 'HAD', number: '06', name: 'I.HADJAR', seat: 2, teamName: 'Red Bull Racing' },
    },
    astonmartin: {
        car1: { code: 'ALO', number: '14', name: 'F.ALONSO', seat: 1, teamName: 'Aston Martin' },
        car2: { code: 'STR', number: '18', name: 'L.STROLL', seat: 2, teamName: 'Aston Martin' },
    },
    alpine: {
        car1: { code: 'COL', number: '43', name: 'F.COLAPINTO', seat: 1, teamName: 'Alpine' },
        car2: { code: 'GAS', number: '10', name: 'P.GASLY', seat: 2, teamName: 'Alpine' },
    },
    haas: {
        car1: { code: 'OCO', number: '31', name: 'E.OCON', seat: 1, teamName: 'Haas' },
        car2: { code: 'BEA', number: '87', name: 'O.BEARMAN', seat: 2, teamName: 'Haas' },
    },
    racingbulls: {
        car1: { code: 'LAW', number: '30', name: 'L.LAWSON', seat: 1, teamName: 'Racing Bulls' },
        car2: { code: 'LIN', number: '41', name: 'A.LINDBLAD', seat: 2, teamName: 'Racing Bulls' },
    },
    cadillac: {
        car1: { code: 'PER', number: '11', name: 'S.PEREZ', seat: 1, teamName: 'Cadillac' },
        car2: { code: 'BOT', number: '77', name: 'V.BOTTAS', seat: 2, teamName: 'Cadillac' },
    },
    williams: {
        car1: { code: 'ALB', number: '23', name: 'A.ALBON', seat: 1, teamName: 'Williams' },
        car2: { code: 'SAI', number: '55', name: 'C.SAINZ', seat: 2, teamName: 'Williams' },
    },
    audi: {
        car1: { code: 'HUL', number: '27', name: 'N.HULKENBERG', seat: 1, teamName: 'Audi' },
        car2: { code: 'BOR', number: '05', name: 'G.BORTOLETO', seat: 2, teamName: 'Audi' },
    },
};

/**
 * Normaliza o nome ou código da equipe para chave de busca
 */
function normalizeTeamKey(raw: string): string {
    const clean = (raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes('ferrari') || clean === 'fer') return 'ferrari';
    if (clean.includes('mclaren') || clean === 'mcl') return 'mclaren';
    if (clean.includes('mercedes') || clean === 'mer') return 'mercedes';
    if (clean.includes('redbull') || clean === 'rbr') return 'redbull';
    if (clean.includes('aston') || clean === 'ast') return 'astonmartin';
    if (clean.includes('alpine') || clean === 'alp') return 'alpine';
    if (clean.includes('haas') || clean === 'haa') return 'haas';
    if (clean.includes('cadillac') || clean === 'cad') return 'cadillac';
    if (clean.includes('williams') || clean === 'wil') return 'williams';
    if (clean.includes('audi') || clean.includes('sauber') || clean === 'aud') return 'audi';
    if (clean.includes('bulls') || clean === 'rb' || clean === 'rba') return 'racingbulls';
    return 'ferrari';
}

/**
 * Retorna as informações do piloto real da F1 que representa o carro
 * (ex: Ferrari Carro 1 = LEC, Mercedes Carro 2 = ANT, Cadillac Carro 1 = PER)
 */
export function getRealF1Driver(teamNameOrCode: string, seat: 1 | 2 = 1): RealF1Driver {
    const key = normalizeTeamKey(teamNameOrCode);
    const entry = REAL_F1_GRID[key] || REAL_F1_GRID.ferrari;
    return seat === 2 ? entry.car2 : entry.car1;
}

export interface TeamCarColors {
    car1Color: string; // Cor 1 da equipe (Piloto 1)
    car2Color: string; // Cor 2 da equipe (Piloto 2)
}

/**
 * Cores oficiais da escuderia para Carro 1 (Cor 1) e Carro 2 (Cor 2)
 */
export const TEAM_CAR_COLORS: Record<string, TeamCarColors> = {
    ferrari: {
        car1Color: '#E8002D', // Vermelho Ferrari Scarlatto
        car2Color: '#FFE600', // Amarelo Modena
    },
    mclaren: {
        car1Color: '#FF8000', // Laranja Papaia
        car2Color: '#00E5FF', // Azul Ciano / Antracite
    },
    mercedes: {
        car1Color: '#00D2BE', // Verde Petróleo Petronas
        car2Color: '#D1D5DB', // Prata Flecha de Prata
    },
    redbull: {
        car1Color: '#0600EF', // Azul Escuro Red Bull
        car2Color: '#EA1D2C', // Vermelho Toro
    },
    astonmartin: {
        car1Color: '#229971', // Verde Britânico Racing
        car2Color: '#CEDC00', // Verde Lima Neon
    },
    alpine: {
        car1Color: '#0090FF', // Azul Royal Alpine
        car2Color: '#FD4BC7', // Rosa BWT
    },
    williams: {
        car1Color: '#005AFF', // Azul Escuro Williams
        car2Color: '#64C4FF', // Azul Claro / Laranja Duracell
    },
    haas: {
        car1Color: '#E0E0E0', // Branco Pérola Haas
        car2Color: '#DA291C', // Vermelho Haas
    },
    cadillac: {
        car1Color: '#FFB800', // Dourado Ouro Cadillac
        car2Color: '#1B2021', // Preto Carbono / Prata
    },
    audi: {
        car1Color: '#F50537', // Vermelho Audi Sport
        car2Color: '#00E5A3', // Verde Neon Elétrico
    },
    racingbulls: {
        car1Color: '#6692FF', // Azul Elétrico
        car2Color: '#FFFFFF', // Branco Pérola
    },
};

/**
 * Retorna a Cor 1 ou Cor 2 da equipe dependendo se é piloto 1 ou piloto 2
 */
export function getTeamCarColor(teamNameOrCode: string, seat: 1 | 2 = 1): string {
    const key = normalizeTeamKey(teamNameOrCode);
    const entry = TEAM_CAR_COLORS[key] || TEAM_CAR_COLORS.ferrari;
    return seat === 2 ? entry.car2Color : entry.car1Color;
}

/**
 * Retorna SEMPRE a cor primária oficial da escuderia (independente de ser Piloto 1 ou Piloto 2).
 * Ex: Ferrari -> Vermelho (#E8002D), Red Bull -> Azul (#0600EF), McLaren -> Laranja (#FF8000), Mercedes -> Verde Petronas (#00D2BE)
 */
export function getTeamPrimaryColor(teamNameOrCode: string): string {
    const key = normalizeTeamKey(teamNameOrCode);
    const entry = TEAM_CAR_COLORS[key] || TEAM_CAR_COLORS.ferrari;
    return entry.car1Color;
}

/**
 * Calcula a cor de texto contrastante (Preto ou Branco) baseada na luminância relativa da cor de fundo (WCAG)
 */
export function getContrastingTextColor(bgHex: string): string {
    const hex = (bgHex || '#E8002D').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    // Luminância relativa perceptiva (YIQ)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 135 ? '#000000' : '#FFFFFF';
}

/**
 * Retorna uma cor de alto contraste em relação à escuderia
 * (ex: Ferrari Vermelha -> Ciano Elétrico / Azul Neon, McLaren Laranja -> Azul Cobalto / Ciano,
 * Mercedes Verde Água -> Carmim / Vermelho Neon, Red Bull Azul -> Amarelo Ouro Neon)
 */
export function getContrastingColor(teamNameOrCode: string): string {
    const key = normalizeTeamKey(teamNameOrCode);
    switch (key) {
        case 'ferrari':
            return '#00e5ff'; // Ciano Elétrico vibrante contra o Vermelho Ferrari
        case 'mclaren':
            return '#00b4d8'; // Azul / Ciano contra o Laranja Papaia
        case 'mercedes':
            return '#ff2a5f'; // Carmim / Vermelho Neon contra o Verde Água Petronas
        case 'redbull':
            return '#ffe600'; // Amarelo Neon contra o Azul Escuro Red Bull
        case 'astonmartin':
            return '#ffd700'; // Dourado Neon contra o Verde Racing
        case 'alpine':
            return '#ff5964'; // Coral / Rosa Neon contra o Azul Alpine
        case 'haas':
            return '#e8002d'; // Vermelho vivo contra o Cinza/Preto Haas
        case 'cadillac':
            return '#00e5ff'; // Ciano Elétrico contra o Dourado/Preto Cadillac
        case 'williams':
            return '#ffcc00'; // Amarelo Ouro contra o Azul Williams
        case 'audi':
            return '#00f5d4'; // Verde Menta / Ciano Neon contra o Vermelho Audi
        case 'racingbulls':
            return '#ffd000'; // Amarelo Ouro contra o Azul Racing Bulls
        default:
            return '#ffd700'; // Dourado padrão
    }
}
