/**
 * TS1 // STRATEGIST USER MEMORY
 * 
 * Gerencia a memória tática de desempenho do usuário no pit wall (taxa de acerto recente,
 * resumo de palpites passados) para injeção nos prompts dos estrategistas.
 * 
 * PRIVACIDADE / LGPD:
 * - Armazena apenas métricas agregadas de jogo (accuracy_rate, resumo tático curto).
 * - Sem dados pessoais identificáveis (zero PII).
 * - O usuário pode limpar sua memória a qualquer momento.
 */

import { createClient } from '@supabase/supabase-js';

export interface StrategistMemory {
  userId: string;
  accuracyRate: number;        // ex: 74.5 (%)
  totalPredictions: number;    // ex: 4
  recentPicksSummary: string;  // ex: "Cravou pole precisa no GP anterior e acertou 6/10 no Top 10."
  updatedAt: string;
}

// Fallback em memória para ambientes locais ou antes da migration
const memoryFallbackMap = new Map<string, StrategistMemory>();

function getDefaultMemory(userId: string): StrategistMemory {
  return {
    userId,
    accuracyRate: 72.0,
    totalPredictions: 1,
    recentPicksSummary: 'Estrategista estreando telemetria de precisão na temporada.',
    updatedAt: new Date().toISOString(),
  };
}

export async function getUserStrategistMemory(userId: string): Promise<StrategistMemory> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await dbClient
        .from('strategist_user_memory')
        .select('accuracy_rate, total_predictions, recent_picks_summary, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          userId,
          accuracyRate: Number(data.accuracy_rate) || 70.0,
          totalPredictions: data.total_predictions || 1,
          recentPicksSummary: data.recent_picks_summary || 'Estrategista ativo na temporada.',
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Falha ao acessar tabela; usa fallback
    }
  }

  return memoryFallbackMap.get(userId) || getDefaultMemory(userId);
}

export async function updateUserStrategistMemory(
  userId: string,
  update: Partial<Omit<StrategistMemory, 'userId'>>
): Promise<void> {
  const current = await getUserStrategistMemory(userId);
  const updated: StrategistMemory = {
    ...current,
    ...update,
    userId,
    updatedAt: new Date().toISOString(),
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      await dbClient.from('strategist_user_memory').upsert(
        {
          user_id: userId,
          accuracy_rate: updated.accuracyRate,
          total_predictions: updated.totalPredictions,
          recent_picks_summary: updated.recentPicksSummary,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'user_id' }
      );
      return;
    } catch {
      // Ignora erro e salva em memória
    }
  }

  memoryFallbackMap.set(userId, updated);
}

export async function clearUserStrategistMemory(userId: string): Promise<void> {
  memoryFallbackMap.delete(userId);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      await dbClient.from('strategist_user_memory').delete().eq('user_id', userId);
    } catch {
      // Ignora erro
    }
  }
}
