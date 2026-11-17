import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, User } from '@supabase/supabase-js';

// Cache em memória para contenção de burst / DoS por minuto
const minuteRateLimitCache = new Map<string, { count: number; expiresAt: number }>();

// Cache de fallback diário em memória (caso a tabela ainda não tenha sido aplicada no Supabase)
const dailyMemoryFallbackCache = new Map<string, { count: number; date: string }>();

const MAX_PER_MINUTE = 6;
const MAX_PER_DAY = 30;

export interface AuthLimitResult {
  ok: boolean;
  status?: number;
  error?: string;
  user?: User;
  remainingToday?: number;
}

/**
 * Valida a sessão do usuário via Bearer token (Header) ou via Cookies de sessão do Supabase.
 */
export async function validateUserSession(request: Request): Promise<{ user: User | null; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || (!anonKey && !serviceRoleKey)) {
    return { user: null, error: 'Configuração do Supabase ausente no servidor.' };
  }

  // 1. Tenta validar via Authorization Bearer Token
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const client = createClient(supabaseUrl, anonKey || serviceRoleKey!);
      const { data: { user }, error } = await client.auth.getUser(token);
      if (user && !error) {
        return { user };
      }
    }
  }

  // 2. Tenta validar via Cookies de sessão (Next.js SSR)
  try {
    const cookieStore = await cookies();
    const serverClient = createServerClient(supabaseUrl, anonKey || serviceRoleKey!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Em Route Handlers de leitura, ignoramos erros de mutação de cookie
          }
        },
      },
    });

    const { data: { user }, error } = await serverClient.auth.getUser();
    if (user && !error) {
      return { user };
    }
  } catch (err: unknown) {
    // Falha silenciosa na leitura de cookies
  }

  return { user: null, error: 'Sessão inválida ou não autenticada no Supabase.' };
}

/**
 * Valida o limite de requisições por minuto (burst) e por dia (cota) para o usuário autenticado.
 */
export async function checkRateLimitAndUsage(user: User): Promise<AuthLimitResult> {
  const userId = user.id;
  const now = Date.now();

  // 1. Proteção por Minuto (In-memory token bucket)
  const minuteEntry = minuteRateLimitCache.get(userId);
  if (minuteEntry && minuteEntry.expiresAt > now) {
    if (minuteEntry.count >= MAX_PER_MINUTE) {
      return {
        ok: false,
        status: 429,
        error: 'Muitas mensagens em sequência. O rádio do pit wall precisa de um instante para desobstruir a frequência.',
      };
    }
    minuteEntry.count += 1;
  } else {
    minuteRateLimitCache.set(userId, { count: 1, expiresAt: now + 60 * 1000 });
  }

  // Limpeza de cache expirado a cada 100 inserções
  if (minuteRateLimitCache.size > 200) {
    for (const [key, val] of minuteRateLimitCache.entries()) {
      if (val.expiresAt <= now) minuteRateLimitCache.delete(key);
    }
  }

  // 2. Proteção por Dia (Cota do banco de dados Supabase)
  const todayStr = new Date().toISOString().slice(0, 10);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Tenta consultar/incrementar na tabela ai_usage
      const { data, error } = await dbClient
        .from('ai_usage')
        .select('request_count')
        .eq('user_id', userId)
        .eq('usage_date', todayStr)
        .maybeSingle();

      if (!error) {
        const currentCount = data?.request_count ?? 0;
        if (currentCount >= MAX_PER_DAY) {
          return {
            ok: false,
            status: 429,
            error: 'Cota diária de transmissões com o estrategista esgotada para hoje.',
            remainingToday: 0,
          };
        }

        // Incrementa ou insere
        if (data) {
          await dbClient
            .from('ai_usage')
            .update({ request_count: currentCount + 1, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('usage_date', todayStr);
        } else {
          await dbClient
            .from('ai_usage')
            .insert({ user_id: userId, usage_date: todayStr, request_count: 1 });
        }

        return {
          ok: true,
          user,
          remainingToday: Math.max(0, MAX_PER_DAY - (currentCount + 1)),
        };
      }
    } catch {
      // Falha ao acessar tabela remota - usa fallback em memória abaixo
    }
  }

  // Fallback em memória (caso a tabela ai_usage ainda não esteja aplicada)
  const memEntry = dailyMemoryFallbackCache.get(userId);
  if (memEntry && memEntry.date === todayStr) {
    if (memEntry.count >= MAX_PER_DAY) {
      return {
        ok: false,
        status: 429,
        error: 'Cota diária de transmissões esgotada.',
        remainingToday: 0,
      };
    }
    memEntry.count += 1;
    return { ok: true, user, remainingToday: MAX_PER_DAY - memEntry.count };
  } else {
    dailyMemoryFallbackCache.set(userId, { count: 1, date: todayStr });
    return { ok: true, user, remainingToday: MAX_PER_DAY - 1 };
  }
}
