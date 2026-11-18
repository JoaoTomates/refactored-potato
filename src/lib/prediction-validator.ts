/**
 * TS1 // PREDICTION VALIDATOR (Servidor & Cliente)
 * 
 * Validador estrito de saída da IA para sugestões de palpites estruturados.
 * Garante compatibilidade 100% com o usePredictionStore e useSubmitPrediction,
 * blindando o banco de dados contra JSON malformado ou alucinações.
 */

import { F1_MATCHUPS, DRIVER_CODE_MAP } from '@/api/f1-data';
import { MISC_QUESTIONS } from '@/lib/misc-questions';

export interface ValidatedPrediction {
  poletime: number[];            // [1, 3, 2, 3, 2, 9]
  formattedPoletime: string;     // "1:32.329"
  top10: string[];               // 10 códigos únicos
  evo: string[];                 // 5 códigos únicos
  h2h: Record<string, string>;   // { m1: "04", ... }
  misc: Record<string, string>;  // { q1: "SIM", ... }
  reasoning?: string;
}

const VALID_DRIVER_CODES = new Set(Object.keys(DRIVER_CODE_MAP));

// Normaliza qualquer formato de piloto para código de 3 letras
function normalizeDriverCode(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (VALID_DRIVER_CODES.has(clean)) return clean;

  // Busca reversa no DRIVER_CODE_MAP por nome (ex: "C.LECLERC" -> "LEC")
  for (const [code, fullName] of Object.entries(DRIVER_CODE_MAP)) {
    const cleanFullName = fullName.replace(/[^A-Z]/g, '');
    if (cleanFullName.includes(clean) || clean.includes(cleanFullName)) {
      return code;
    }
  }

  // Se tem 3 letras válidas, aceita
  if (clean.length === 3) return clean;
  return null;
}

/**
 * Converte tempo "1:32.329" em array de 6 dígitos [1, 3, 2, 3, 2, 9]
 */
export function parsePoletimeStringToDigits(timeStr: string): number[] | null {
  const match = timeStr.trim().match(/^(\d):(\d)(\d)\.(\d)(\d)(\d)$/);
  if (!match) return null;
  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    parseInt(match[4], 10),
    parseInt(match[5], 10),
    parseInt(match[6], 10),
  ];
}

export function validateSuggestedPrediction(raw: unknown): {
  valid: boolean;
  data?: ValidatedPrediction;
  errors: string[];
} {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Payload de palpite não é um objeto JSON válido.'] };
  }

  const obj = raw as Record<string, any>;

  // 1. Validação de Poletime
  let poletimeDigits: number[] | null = null;
  let formattedPoletime = '1:32.000';

  if (Array.isArray(obj.poletime) && obj.poletime.length === 6) {
    const allNums = obj.poletime.every(
      (n: any) => typeof n === 'number' && n >= 0 && n <= 9
    );
    if (allNums) {
      poletimeDigits = obj.poletime;
      formattedPoletime = `${poletimeDigits[0]}:${poletimeDigits[1]}${poletimeDigits[2]}.${poletimeDigits[3]}${poletimeDigits[4]}${poletimeDigits[5]}`;
    }
  } else if (typeof obj.poletime === 'string') {
    poletimeDigits = parsePoletimeStringToDigits(obj.poletime);
    if (poletimeDigits) {
      formattedPoletime = obj.poletime.trim();
    }
  }

  if (!poletimeDigits) {
    errors.push('Poletime inválido. Esperado string "M:SS.mmm" ou array de 6 dígitos.');
  }

  // 2. Validação do Top 10
  const top10: string[] = [];
  if (Array.isArray(obj.top10) && obj.top10.length === 10) {
    const seen = new Set<string>();
    for (const item of obj.top10) {
      const code = typeof item === 'string' ? normalizeDriverCode(item) : null;
      if (!code || seen.has(code)) {
        errors.push(`Piloto do Top 10 inválido ou duplicado: "${item}".`);
        break;
      }
      seen.add(code);
      top10.push(code);
    }
  } else {
    errors.push('Top 10 deve conter exatamente 10 pilotos.');
  }

  // 3. Validação do EVO (Escalada)
  const evo: string[] = [];
  if (Array.isArray(obj.evo) && obj.evo.length === 5) {
    const seen = new Set<string>();
    for (const item of obj.evo) {
      const code = typeof item === 'string' ? normalizeDriverCode(item) : null;
      if (!code || seen.has(code)) {
        errors.push(`Piloto de EVO inválido ou duplicado: "${item}".`);
        break;
      }
      seen.add(code);
      evo.push(code);
    }
  } else {
    errors.push('EVO deve conter exatamente 5 pilotos.');
  }

  // 4. Validação de H2H (Duelos)
  const h2h: Record<string, string> = {};
  if (obj.h2h && typeof obj.h2h === 'object') {
    for (const m of F1_MATCHUPS) {
      const pick = obj.h2h[m.id];
      if (pick === m.d1.num || pick === m.d2.num) {
        h2h[m.id] = pick;
      } else {
        // Fallback para o default do matchup se a IA errou o número
        h2h[m.id] = m.defaultPick;
      }
    }
  } else {
    for (const m of F1_MATCHUPS) {
      h2h[m.id] = m.defaultPick;
    }
  }

  // 5. Validação de MISC
  const misc: Record<string, string> = {};
  const validMiscIds = new Set(MISC_QUESTIONS.map((q) => q.id));

  if (obj.misc && typeof obj.misc === 'object') {
    for (const [key, val] of Object.entries(obj.misc)) {
      if (validMiscIds.has(key)) {
        const normalizedVal = String(val).toUpperCase().trim();
        misc[key] = normalizedVal === 'SIM' ? 'SIM' : 'NÃO';
      }
    }
  }

  // Garante ao menos q1, q2, q3 preenchidos
  ['q1', 'q2', 'q3'].forEach((qId) => {
    if (!misc[qId]) misc[qId] = 'NÃO';
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      poletime: poletimeDigits!,
      formattedPoletime,
      top10,
      evo,
      h2h,
      misc,
      reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : undefined,
    },
    errors: [],
  };
}
