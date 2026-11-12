// Hardcoded mock data for the F1 predictions

export const F1_MATCHUPS = [
  { id: 'm1', team: 'McLaren', d1: { num: '04', name: 'L.NORRIS' }, d2: { num: '81', name: 'O.PIASTRI' }, defaultPick: '04' },
  { id: 'm2', team: 'Ferrari', d1: { num: '16', name: 'C.LECLERC' }, d2: { num: '44', name: 'L.HAMILTON' }, defaultPick: '44' },
  { id: 'm3', team: 'Mercedes', d1: { num: '63', name: 'G.RUSSELL' }, d2: { num: '12', name: 'K.ANTONELLI' }, defaultPick: '63' },
  { id: 'm4', team: 'Red Bull', d1: { num: '01', name: 'M.VERSTAPPEN' }, d2: { num: '06', name: 'I.HADJAR' }, defaultPick: '06' },
  { id: 'm5', team: 'Aston Martin', d1: { num: '14', name: 'F.ALONSO' }, d2: { num: '18', name: 'L.STROLL' }, defaultPick: '14' },
  { id: 'm6', team: 'Alpine', d1: { num: '43', name: 'F.COLAPINTO' }, d2: { num: '10', name: 'P.GASLY' }, defaultPick: '10' },
  { id: 'm7', team: 'Haas', d1: { num: '31', name: 'E.OCON' }, d2: { num: '87', name: 'O.BEARMAN' }, defaultPick: '31' },
  { id: 'm8', team: 'Racing Bulls', d1: { num: '30', name: 'L.LAWSON' }, d2: { num: '41', name: 'A.LINDBLAD' }, defaultPick: '41' },
  { id: 'm9', team: 'Cadillac', d1: { num: '11', name: 'S.PEREZ' }, d2: { num: '77', name: 'V.BOTTAS' }, defaultPick: '11' },
  { id: 'm10', team: 'Williams', d1: { num: '23', name: 'A.ALBON' }, d2: { num: '55', name: 'C.SAINZ' }, defaultPick: '55' },
  { id: 'm11', team: 'Audi/Sauber', d1: { num: '27', name: 'N.HULKENBERG' }, d2: { num: '05', name: 'G.BORTOLETO' }, defaultPick: '27' },
];

export const F1_DRIVERS = [
  'L.NORRIS',
  'O.PIASTRI',
  'C.LECLERC',
  'L.HAMILTON',
  'G.RUSSELL',
  'K.ANTONELLI',
  'M.VERSTAPPEN',
  'I.HADJAR',
  'F.ALONSO',
  'L.STROLL',
  'F.COLAPINTO',
  'P.GASLY',
  'E.OCON',
  'O.BEARMAN',
  'L.LAWSON',
  'A.LINDBLAD',
  'S.PEREZ',
  'V.BOTTAS',
  'A.ALBON',
  'C.SAINZ',
  'N.HULKENBERG',
  'G.BORTOLETO'
];

export const DRIVER_CODE_MAP: Record<string, string> = {
  NOR: 'L.NORRIS',
  PIA: 'O.PIASTRI',
  LEC: 'C.LECLERC',
  HAM: 'L.HAMILTON',
  RUS: 'G.RUSSELL',
  ANT: 'K.ANTONELLI',
  VER: 'M.VERSTAPPEN',
  HAD: 'I.HADJAR',
  ALO: 'F.ALONSO',
  STR: 'L.STROLL',
  COL: 'F.COLAPINTO',
  GAS: 'P.GASLY',
  OCO: 'E.OCON',
  BEA: 'O.BEARMAN',
  LAW: 'L.LAWSON',
  LIN: 'A.LINDBLAD',
  PER: 'S.PEREZ',
  BOT: 'V.BOTTAS',
  ALB: 'A.ALBON',
  SAI: 'C.SAINZ',
  HUL: 'N.HULKENBERG',
  BOR: 'G.BORTOLETO',
  // Fallbacks históricos de temporadas/bases anteriores
  TSU: 'A.LINDBLAD',
  MAG: 'O.BEARMAN',
  SAR: 'C.SAINZ',
  ZHO: 'N.HULKENBERG',
  RIC: 'L.LAWSON',
};

export function normalizeDriverName(driverInput: string): string {
  if (!driverInput) return '';
  const clean = driverInput.trim().toUpperCase();
  if (!clean) return '';

  if (F1_DRIVERS.includes(clean)) return clean;
  if (DRIVER_CODE_MAP[clean]) return DRIVER_CODE_MAP[clean];

  // Caso venha número (ex: "16", "04", "1")
  const padded = clean.padStart(2, '0');
  for (const match of F1_MATCHUPS) {
    if (match.d1.num === clean || match.d1.num === padded) return match.d1.name;
    if (match.d2.num === clean || match.d2.num === padded) return match.d2.name;
  }

  // Caso venha apenas o sobrenome (ex: "LECLERC" ou "VERSTAPPEN")
  const byLastName = F1_DRIVERS.find((d) => d.split('.')[1] === clean);
  if (byLastName) return byLastName;

  return clean;
}

export const F1_TEAM_COLORS: Record<string, string> = {
  'Mercedes': '#00D2BE',
  'Mercedes-AMG': '#00D2BE',
  'Ferrari': '#DC0000',
  'Scuderia Ferrari': '#DC0000',
  'McLaren': '#FF8000',
  'Red Bull': '#3671C6',
  'Red Bull Racing': '#3671C6',
  'Aston Martin': '#229971',
  'Williams': '#005AFF',
  'Williams Racing': '#005AFF',
  'Alpine': '#FD4BC7',
  'Haas': '#E6002B',
  'Haas F1 Team': '#E6002B',
  'Racing Bulls': '#6692FF',
  'Audi/Sauber': '#F50537',
  'Audi': '#F50537',
  'Cadillac': '#FFC80C',
};

export function getF1TeamColor(teamName: string): string {
  return F1_TEAM_COLORS[teamName] || '#fbaa19';
}

export const DRIVER_AVATAR_CODE_MAP: Record<string, string> = {
  'L.NORRIS': 'NOR',
  'O.PIASTRI': 'PIA',
  'C.LECLERC': 'LEC',
  'L.HAMILTON': 'HAM',
  'G.RUSSELL': 'RUS',
  'K.ANTONELLI': 'ANT',
  'M.VERSTAPPEN': 'VER',
  'I.HADJAR': 'HAD',
  'F.ALONSO': 'ALO',
  'L.STROLL': 'STR',
  'F.COLAPINTO': 'COL',
  'P.GASLY': 'GAS',
  'E.OCON': 'OCO',
  'O.BEARMAN': 'BEA',
  'L.LAWSON': 'LAW',
  'A.LINDBLAD': 'LIN',
  'S.PEREZ': 'PER',
  'V.BOTTAS': 'BOT',
  'A.ALBON': 'ALB',
  'C.SAINZ': 'SAI',
  'N.HULKENBERG': 'HUL',
  'G.BORTOLETO': 'BOR',
};

export const F1_AVATAR_PATH_MAP: Record<string, string> = {
  NOR: '/avatar/f1/NOR.jpg',
  PIA: '/avatar/f1/PIA.jfif',
  LEC: '/avatar/f1/LEC.jpg',
  HAM: '/avatar/f1/HAM.jpg',
  RUS: '/avatar/f1/RUS.jpg',
  ANT: '/avatar/f1/ANT.jfif',
  VER: '/avatar/f1/VER.jpg',
  HAD: '/avatar/f1/HAD.jfif',
  ALO: '/avatar/f1/ALO.jpg',
  STR: '/avatar/f1/STR.jfif',
  COL: '/avatar/f1/COL.jfif',
  GAS: '/avatar/f1/GAS.jfif',
  OCO: '/avatar/f1/OCO.jpg',
  BEA: '/avatar/f1/BEA.jpg',
  LAW: '/avatar/f1/LAW.jfif',
  LIN: '/avatar/f1/LIN.jfif',
  PER: '/avatar/f1/PER.jpg',
  BOT: '/avatar/f1/BOT.jfif',
  ALB: '/avatar/f1/ALB.jfif',
  SAI: '/avatar/f1/SAI.jfif',
  HUL: '/avatar/f1/HUL.jfif',
  BOR: '/avatar/f1/BOR.jpg',
  CAM: '/avatar/f1/CAM.jfif',
};

export const AVAILABLE_F1_PIXEL_CODES = new Set<string>(Object.keys(F1_AVATAR_PATH_MAP));

export const RESERVE_DRIVER_AVATARS = [
  { code: 'CAM', label: 'CAM (Novo Piloto / Reserva)', avatarUrl: '/avatar/f1/CAM.jfif' },
];

export function getDriverAvatarUrl(driverName: string): string | null {
  const clean = (driverName || '').trim().toUpperCase();
  if (F1_AVATAR_PATH_MAP[clean]) return F1_AVATAR_PATH_MAP[clean];
  const normalized = normalizeDriverName(driverName);
  const code = DRIVER_AVATAR_CODE_MAP[normalized];
  if (code && F1_AVATAR_PATH_MAP[code]) return F1_AVATAR_PATH_MAP[code];
  // Se vier um nome novo contendo CAM (ex: R.CAMARA), aponta para CAM.jfif
  if (clean.includes('CAM')) return F1_AVATAR_PATH_MAP.CAM;
  return null;
}

export function getDriverDetails(driverName: string) {
  const normalized = normalizeDriverName(driverName);
  const code = DRIVER_AVATAR_CODE_MAP[normalized] || (normalized.includes('CAM') ? 'CAM' : '');
  const avatarUrl = (code && F1_AVATAR_PATH_MAP[code]) || getDriverAvatarUrl(driverName);
  for (const match of F1_MATCHUPS) {
    if (match.d1.name === normalized) {
      return { ...match.d1, team: match.team, teamColor: getF1TeamColor(match.team), code, avatarUrl };
    }
    if (match.d2.name === normalized) {
      return { ...match.d2, team: match.team, teamColor: getF1TeamColor(match.team), code, avatarUrl };
    }
  }
  return { name: normalized || driverName, num: '??', team: 'Unknown', teamColor: '#fbaa19', code, avatarUrl };
}
export interface F1Event {
    round: string;
    name: string;
    circuit: string;
    date: string;
    time: string;
    rawDate?: string;
    rawTime?: string;
    qualiDate?: string;
    qualiTime?: string;
    isSprint?: boolean;
    sprintDate?: string;
    sprintTime?: string;
    fp1Date?: string;
    fp1Time?: string;
    fp2Date?: string;
    fp2Time?: string;
    fp3Date?: string;
    fp3Time?: string;
    status: 'OPEN' | 'CLOSED' | 'LIVE';
}

export const fetchNextEvent = async (): Promise<F1Event> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch('https://api.jolpi.ca/ergast/f1/current/next.json', { 
            next: { revalidate: 300 },
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        const races = data.MRData?.RaceTable?.Races;
        if (races && races.length > 0) {
            const nextRace = races[0];
            const dateObj = new Date(`${nextRace.date}T00:00:00Z`);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
            
            return {
                round: nextRace.round.padStart(2, '0'),
                name: nextRace.raceName.toUpperCase(),
                circuit: nextRace.Circuit.circuitName.toUpperCase(),
                date: dateStr,
                time: nextRace.time ? nextRace.time.replace(':00Z', ' UTC') : 'TBA',
                rawDate: nextRace.date,
                rawTime: nextRace.time,
                qualiDate: nextRace.Qualifying ? nextRace.Qualifying.date : undefined,
                qualiTime: nextRace.Qualifying ? nextRace.Qualifying.time : undefined,
                isSprint: !!nextRace.Sprint,
                sprintDate: nextRace.Sprint ? nextRace.Sprint.date : undefined,
                sprintTime: nextRace.Sprint ? nextRace.Sprint.time : undefined,
                fp1Date: nextRace.FirstPractice ? nextRace.FirstPractice.date : undefined,
                fp1Time: nextRace.FirstPractice ? nextRace.FirstPractice.time : undefined,
                fp2Date: nextRace.SecondPractice ? nextRace.SecondPractice.date : undefined,
                fp2Time: nextRace.SecondPractice ? nextRace.SecondPractice.time : undefined,
                fp3Date: nextRace.ThirdPractice ? nextRace.ThirdPractice.date : undefined,
                fp3Time: nextRace.ThirdPractice ? nextRace.ThirdPractice.time : undefined,
                status: 'OPEN'
            };
        }
    } catch (e) {
        console.error("Failed to fetch live F1 data", e);
    }
    
    return {
        round: '00',
        name: 'AWAITING NEXT EVENT',
        circuit: 'TBA',
        date: 'TBA',
        time: 'TBA',
        status: 'CLOSED'
    };
};

export interface RaceEvent {
    id: string;
    round: string;
    name: string;
    circuit: string;
    date: string;
    qualiStart: string;
    raceStart: string;
}

export const mockCalendar: RaceEvent[] = [
    { id: 'r1', round: '01', name: 'BAHRAIN GRAND PRIX', circuit: 'Bahrain International Circuit', date: 'FEB 29 - MAR 02', qualiStart: '01 MAR, 19:00', raceStart: '02 MAR, 18:00' },
    { id: 'r2', round: '02', name: 'SAUDI ARABIAN GRAND PRIX', circuit: 'Jeddah Corniche Circuit', date: 'MAR 07 - MAR 09', qualiStart: '08 MAR, 20:00', raceStart: '09 MAR, 20:00' },
    { id: 'r3', round: '03', name: 'AUSTRALIAN GRAND PRIX', circuit: 'Albert Park Circuit', date: 'MAR 22 - MAR 24', qualiStart: '23 MAR, 16:00', raceStart: '24 MAR, 15:00' },
    { id: 'r4', round: '04', name: 'JAPANESE GRAND PRIX', circuit: 'Suzuka International Racing Course', date: 'APR 05 - APR 07', qualiStart: '06 APR, 15:00', raceStart: '07 APR, 14:00' },
    { id: 'r5', round: '05', name: 'CHINESE GRAND PRIX', circuit: 'Shanghai International Circuit', date: 'APR 19 - APR 21', qualiStart: '20 APR, 15:00', raceStart: '21 APR, 15:00' },
    { id: 'r6', round: '06', name: 'MIAMI GRAND PRIX', circuit: 'Miami International Autodrome', date: 'MAY 03 - MAY 05', qualiStart: '04 MAY, 16:00', raceStart: '05 MAY, 16:00' },
    { id: 'r7', round: '07', name: 'EMILIA ROMAGNA GRAND PRIX', circuit: 'Imola Circuit', date: 'MAY 17 - MAY 19', qualiStart: '18 MAY, 16:00', raceStart: '19 MAY, 15:00' }
];

export const fetchCalendarData = async (): Promise<RaceEvent[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockCalendar);
        }, 800);
    });
};
