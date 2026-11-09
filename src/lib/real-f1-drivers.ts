/**
 * BAEFF1 // REAL F1 PILOT INITIALS & CAR ALLOCATION
 * 
 * Mapeia os pilotos reais da F1 (3 letras oficiais, número e nome) para cada escuderia:
 * - Carro 1 (ex: Ferrari 1 = LEC, Mercedes 1 = RUS, Cadillac 1 = PER)
 * - Carro 2 (ex: Ferrari 2 = HAM, Mercedes 2 = ANT, Cadillac 2 = BOT)
 */

export interface RealF1Driver {
    code: string;       // 3 letras oficiais FIA (ex: "LEC", "HAM", "PER")
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
