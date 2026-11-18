/**
 * TS1 // MEMORY SCORING ENGINE (100% CÓDIGO DETERMINÍSTICO - ZERO LLM)
 * 
 * Avalia com precisão matemática os palpites do usuário contra os resultados
 * oficiais da corrida, atualizando a memória tática (accuracyRate, totalPredictions,
 * recentPicksSummary) sem inventar números nem depender de chamadas à IA.
 */

import { parseLapTimeToMs } from '@/lib/f1-dossier';
import { updateUserStrategistMemory } from '@/lib/strategist-memory';

export interface UserPredictionPayload {
  poletime?: string | null;
  top10?: string[] | null;
  evo?: string[] | null;
  h2h?: Record<string, string> | null;
  misc?: Record<string, string> | null;
}

export interface OfficialRoundResult {
  round: string;
  circuitName: string;
  poleTime: string;          // Ex: "1:32.329"
  top10Finishers: string[];  // 10 códigos exatos em ordem de chegada
  evoTopGainers?: string[];  // 5 pilotos com maior ganho de posições
  h2hWinners?: Record<string, string>; // { m1: "04", ... }
  miscAnswers?: Record<string, string>; // { q1: "SIM", ... }
}

export interface RoundScoreEvaluation {
  accuracyRate: number;        // 0 a 100 (%)
  poleDeltaMs: number | null;
  top10ExactMatches: number;
  top10PresenceMatches: number;
  h2hMatches: number;
  summaryLine: string;
}

/**
 * Avalia o desempenho tático da rodada sem nenhuma alucinação ou texto de IA.
 */
export function evaluatePredictionAccuracy(
  prediction: UserPredictionPayload,
  official: OfficialRoundResult
): RoundScoreEvaluation {
  let earnedScore = 0;
  let maxPossibleScore = 0;

  // 1. POLETIME (Máximo 20 pontos de assertividade)
  maxPossibleScore += 20;
  let poleDeltaMs: number | null = null;
  if (prediction.poletime && official.poleTime) {
    const userMs = parseLapTimeToMs(prediction.poletime);
    const actualMs = parseLapTimeToMs(official.poleTime);
    if (userMs && actualMs) {
      poleDeltaMs = Math.abs(userMs - actualMs);
      if (poleDeltaMs <= 200) {
        earnedScore += 20; // Cravou dentro de 0.2s
      } else if (poleDeltaMs <= 600) {
        earnedScore += 14;
      } else if (poleDeltaMs <= 1500) {
        earnedScore += 8;
      } else if (poleDeltaMs <= 3000) {
        earnedScore += 3;
      }
    }
  }

  // 2. TOP 10 (Máximo 50 pontos: 5 pts por posição exata, 2 pts por presença)
  maxPossibleScore += 50;
  let top10Exact = 0;
  let top10Presence = 0;
  const userTop10 = Array.isArray(prediction.top10) ? prediction.top10 : [];
  const officialSet = new Set(official.top10Finishers.map((c) => c.toUpperCase()));

  userTop10.forEach((driver, idx) => {
    const clean = String(driver || '').trim().toUpperCase();
    if (!clean) return;
    const targetDriver = official.top10Finishers[idx]?.toUpperCase();
    if (clean === targetDriver) {
      top10Exact++;
      earnedScore += 5;
    } else if (officialSet.has(clean)) {
      top10Presence++;
      earnedScore += 2;
    }
  });

  // 3. DUELOS H2H (Máximo 30 pontos)
  let h2hMatches = 0;
  if (prediction.h2h && official.h2hWinners) {
    const totalMatchups = Object.keys(official.h2hWinners).length;
    if (totalMatchups > 0) {
      maxPossibleScore += 30;
      const ptsPerMatchup = 30 / totalMatchups;
      for (const [matchId, winnerNum] of Object.entries(official.h2hWinners)) {
        if (prediction.h2h[matchId] === winnerNum) {
          h2hMatches++;
          earnedScore += ptsPerMatchup;
        }
      }
    }
  }

  const accuracyRate = maxPossibleScore > 0
    ? Math.round((earnedScore / maxPossibleScore) * 1000) / 10
    : 0;

  // Montagem do template conciso sem IA
  const poleSummary = poleDeltaMs !== null
    ? `pole a ${(poleDeltaMs / 1000).toFixed(3)}s`
    : 'pole não registrada';

  const summaryLine = `${official.circuitName}: ${top10Exact}/10 exatos no Top 10, ${h2hMatches} duelos vencidos e ${poleSummary}.`;

  return {
    accuracyRate,
    poleDeltaMs,
    top10ExactMatches: top10Exact,
    top10PresenceMatches: top10Presence,
    h2hMatches,
    summaryLine,
  };
}

/**
 * Processa e consolida o histórico de memória do usuário no banco / memória
 */
export async function processAndSaveUserMemory(
  userId: string,
  prediction: UserPredictionPayload,
  official: OfficialRoundResult,
  previousGpsCount: number = 0,
  previousAccuracy: number | null = null
): Promise<RoundScoreEvaluation> {
  const result = evaluatePredictionAccuracy(prediction, official);

  // Média ponderada acumulada na temporada
  let finalAccuracy = result.accuracyRate;
  if (previousAccuracy !== null && previousGpsCount > 0) {
    finalAccuracy = Math.round(
      ((previousAccuracy * previousGpsCount + result.accuracyRate) / (previousGpsCount + 1)) * 10
    ) / 10;
  }

  await updateUserStrategistMemory(userId, {
    accuracyRate: finalAccuracy,
    totalPredictions: previousGpsCount + 1,
    recentPicksSummary: result.summaryLine,
  });

  return result;
}
