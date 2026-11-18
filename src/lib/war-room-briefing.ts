/**
 * TS1 // WAR ROOM BRIEFING ENGINE
 * 
 * Orquestra o briefing tático unificado da sessão na War Room:
 * - A IA gera propostas estruturadas que alimentam diretamente as falas e os botões ACCEPT
 *   do Sênior e do Técnico.
 * - Elimina a necessidade de botões de "IA" na interface (total imersão no fantasy).
 * - Números validados rigidamente pelo código (poletime dentro da janela da média da pista).
 * - Cache por usuário e rodada para otimizar cota.
 * - Fallback canônico imediato em caso de falha.
 */

import { F1_MATCHUPS, DRIVER_CODE_MAP } from '@/api/f1-data';
import { parseLapTimeToMs } from '@/lib/f1-dossier';

export interface StrategistProposal<T> {
  value: T;
  line: string;
}

export interface WarRoomBriefing {
  poletime: {
    senior: StrategistProposal<string>;
    technical: StrategistProposal<string>;
  };
  top10: {
    senior: StrategistProposal<string[]>;
    technical: StrategistProposal<string[]>;
  };
  evo: {
    senior: StrategistProposal<string[]>;
    technical: StrategistProposal<string[]>;
  };
  h2h: {
    senior: StrategistProposal<Record<string, string>>;
    technical: StrategistProposal<Record<string, string>>;
  };
  memoryHook: string | null;
}

const VALID_DRIVER_CODES = new Set(Object.keys(DRIVER_CODE_MAP));

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (VALID_DRIVER_CODES.has(clean)) return clean;
  for (const [code, fullName] of Object.entries(DRIVER_CODE_MAP)) {
    const cleanFull = fullName.replace(/[^A-Z]/g, '');
    if (cleanFull.includes(clean) || clean.includes(cleanFull)) return code;
  }
  return clean.length === 3 ? clean : null;
}

/**
 * Filtra falas para garantir o tom estrito do NARRATIVE_STYLE_GUIDE.md:
 * - Prefixo ">_ "
 * - Sem emojis
 * - Frases curtas e diretas (máximo 3 frases)
 */
export function sanitizeNoirLine(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  
  let clean = raw
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Emojis
    .replace(/^>_\s*/, '')
    .trim();

  // Limita a no máximo 3 frases
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 3) {
    clean = sentences.slice(0, 3).join(' ');
  }

  if (!clean) return fallback;
  return `>_ ${clean}`;
}

/**
 * Validador de formato de tempo "M:SS.mmm"
 */
function isValidPoletimeFormat(str: string): boolean {
  return /^(\d):(\d{2})\.(\d{3})$/.test(str.trim());
}

/**
 * Validação rigorosa da saída JSON do briefing pela IA
 */
export function validateBriefingPayload(
  raw: any,
  avgPoleMs: number | null
): WarRoomBriefing | null {
  if (!raw || typeof raw !== 'object') return null;

  try {
    // 1. POLETIME
    const sPole = String(raw.poletime?.senior?.value || '').trim();
    const tPole = String(raw.poletime?.technical?.value || '').trim();
    if (!isValidPoletimeFormat(sPole) || !isValidPoletimeFormat(tPole)) return null;

    // Se temos média histórica da pista, o tempo não pode desviar mais de ±2.5 segundos
    if (avgPoleMs && Number.isFinite(avgPoleMs)) {
      const sMs = parseLapTimeToMs(sPole);
      const tMs = parseLapTimeToMs(tPole);
      if (!sMs || Math.abs(sMs - avgPoleMs) > 2500) return null;
      if (!tMs || Math.abs(tMs - avgPoleMs) > 2500) return null;
    }

    // 2. TOP 10 (10 pilotos únicos para cada estrategista)
    const validateTop10List = (list: any): string[] | null => {
      if (!Array.isArray(list) || list.length !== 10) return null;
      const seen = new Set<string>();
      const result: string[] = [];
      for (const item of list) {
        const code = normalizeCode(item);
        if (!code || seen.has(code)) return null;
        seen.add(code);
        result.push(code);
      }
      return result;
    };

    const sTop10 = validateTop10List(raw.top10?.senior?.value);
    const tTop10 = validateTop10List(raw.top10?.technical?.value);
    if (!sTop10 || !tTop10) return null;

    // 3. EVO (5 pilotos únicos)
    const validateEvoList = (list: any): string[] | null => {
      if (!Array.isArray(list) || list.length !== 5) return null;
      const seen = new Set<string>();
      const result: string[] = [];
      for (const item of list) {
        const code = normalizeCode(item);
        if (!code || seen.has(code)) return null;
        seen.add(code);
        result.push(code);
      }
      return result;
    };

    const sEvo = validateEvoList(raw.evo?.senior?.value);
    const tEvo = validateEvoList(raw.evo?.technical?.value);
    if (!sEvo || !tEvo) return null;

    // 4. H2H (11 confrontos validados com números de piloto válidos)
    const validateH2HMap = (map: any): Record<string, string> => {
      const res: Record<string, string> = {};
      const obj = (map && typeof map === 'object') ? map : {};
      for (const m of F1_MATCHUPS) {
        const pick = String(obj[m.id] || '').trim();
        if (pick === m.d1.num || pick === m.d2.num) {
          res[m.id] = pick;
        } else {
          res[m.id] = m.defaultPick;
        }
      }
      return res;
    };

    const sH2H = validateH2HMap(raw.h2h?.senior?.value);
    const tH2H = validateH2HMap(raw.h2h?.technical?.value);

    // 5. Linhas de diálogo com sanitização
    const sPoleLine = sanitizeNoirLine(
      raw.poletime?.senior?.line,
      `>_ Sinto o asfalto sob pressão. A marca para a pole é ${sPole}.`
    );
    const tPoleLine = sanitizeNoirLine(
      raw.poletime?.technical?.line,
      `>_ Telemetria de volta ideal aponta delta térmico em ${tPole}.`
    );

    const sTop10Line = sanitizeNoirLine(
      raw.top10?.senior?.line,
      `>_ Quem larga na ponta sustenta ritmo. Meu pódio está fechado.`
    );
    const tTop10Line = sanitizeNoirLine(
      raw.top10?.technical?.line,
      `>_ Curva de degradação cruzada define o grid de chegada sem margem.`
    );

    const sEvoLine = sanitizeNoirLine(
      raw.evo?.senior?.line,
      `>_ Piloto calejado escala pelotão no vácuo das retas.`
    );
    const tEvoLine = sanitizeNoirLine(
      raw.evo?.technical?.line,
      `>_ Telemetria de ritmo com pneus duros indica escalada consistente.`
    );

    const sH2HLine = sanitizeNoirLine(
      raw.h2h?.senior?.line,
      `>_ Duelo direto entre companheiros é psicológico. O mais frio leva.`
    );
    const tH2HLine = sanitizeNoirLine(
      raw.h2h?.technical?.line,
      `>_ Dados de velocidade final e asa móvel indicam vantagem numérica.`
    );

    const memoryHook = raw.memoryHook && typeof raw.memoryHook === 'string' && raw.memoryHook.trim()
      ? sanitizeNoirLine(raw.memoryHook, '')
      : null;

    return {
      poletime: {
        senior: { value: sPole, line: sPoleLine },
        technical: { value: tPole, line: tPoleLine },
      },
      top10: {
        senior: { value: sTop10, line: sTop10Line },
        technical: { value: tTop10, line: tTop10Line },
      },
      evo: {
        senior: { value: sEvo, line: sEvoLine },
        technical: { value: tEvo, line: tEvoLine },
      },
      h2h: {
        senior: { value: sH2H, line: sH2HLine },
        technical: { value: tH2H, line: tH2HLine },
      },
      memoryHook: memoryHook || null,
    };
  } catch {
    return null;
  }
}

/**
 * Cria briefing canônico de fallback imediato caso a IA falhe ou não haja rede.
 * Garante que a War Room NUNCA trave ou exiba erro na tela.
 */
export function buildFallbackBriefing(options: {
  seniorPole: string;
  techPole: string;
  seniorTop10: string[];
  techTop10: string[];
  seniorEvoDriver?: string;
  techEvoDriver?: string;
}): WarRoomBriefing {
  const { seniorPole, techPole, seniorTop10, techTop10 } = options;

  const defaultH2HSenior: Record<string, string> = {
    m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
    m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27',
  };
  const defaultH2HTech: Record<string, string> = {
    m1: '81', m2: '44', m3: '12', m4: '01', m5: '14',
    m6: '43', m7: '87', m8: '41', m9: '77', m10: '23', m11: '05',
  };

  const defaultEvoSenior = ['HAM', 'SAI', 'ALO', 'TSU', 'ALB'];
  const defaultEvoTech = ['SAI', 'ALO', 'TSU', 'ALB', 'OCO'];

  return {
    poletime: {
      senior: {
        value: seniorPole,
        line: `>_ Sinto o asfalto sob pressão. A marca de referência para a pole é ${seniorPole}.`,
      },
      technical: {
        value: techPole,
        line: `>_ Telemetria de volta ideal aponta delta térmico em ${techPole}.`,
      },
    },
    top10: {
      senior: {
        value: seniorTop10.slice(0, 10),
        line: `>_ Pelo ritmo dos treinos, quem larga na ponta controla o ar limpo. Minha lista está pronta.`,
      },
      technical: {
        value: techTop10.slice(0, 10),
        line: `>_ Curva de degradação cruzada define o grid de chegada sem margem para intuição.`,
      },
    },
    evo: {
      senior: {
        value: defaultEvoSenior,
        line: `>_ Piloto experiente ganha posições no miolo do pelotão sem quebrar o carro.`,
      },
      technical: {
        value: defaultEvoTech,
        line: `>_ Ritmo com pneus compostos duros projeta escalada calculada no segundo stint.`,
      },
    },
    h2h: {
      senior: {
        value: defaultH2HSenior,
        line: `>_ Duelo de garagem é puramente psicológico. Quem vacila na freada fica para trás.`,
      },
      technical: {
        value: defaultH2HTech,
        line: `>_ Dados de telemetria cruzada apontam vantagem técnica nas zonas de DRS.`,
      },
    },
    memoryHook: null,
  };
}

// Cache em memória do servidor por usuário e rodada
const sessionBriefingCache = new Map<string, { briefing: WarRoomBriefing; expiresAt: number }>();

export function getCachedBriefing(userId: string, round: string): WarRoomBriefing | null {
  const key = `${userId}_${round}`;
  const entry = sessionBriefingCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    sessionBriefingCache.delete(key);
    return null;
  }
  return entry.briefing;
}

export function setCachedBriefing(userId: string, round: string, briefing: WarRoomBriefing, ttlMs = 3600000): void {
  const key = `${userId}_${round}`;
  sessionBriefingCache.set(key, {
    briefing,
    expiresAt: Date.now() + ttlMs,
  });
}
