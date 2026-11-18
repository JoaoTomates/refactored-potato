/**
 * Cliente agnóstico para provedores de LLM compatíveis com a API OpenAI /chat/completions.
 * Suporta Google Gemini (via OpenAI compat), Ollama local, OpenAI, Groq, etc.
 * 
 * REGRAS DE SEGURANÇA E IMERSÃO:
 * - Apenas executado no servidor (Route Handlers / Server Actions).
 * - NUNCA expõe mensagens cruas do provedor de IA ao cliente.
 * - Registra logs detalhados e sanitizados exclusivamente no servidor (sem chaves nem PII).
 * - Suporte a modelo de contingência (process.env.LLM_FALLBACK_MODEL) para 404, 410 ou 429.
 * - Fallback transparente e silencioso.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export class LLMError extends Error {
  constructor(
    message: string = 'ai_unavailable',
    public readonly code: 'MISSING_ENV' | 'RATE_LIMIT' | 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR',
    public readonly status?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export interface LLMConfig {
  endpoint: string;
  model: string;
  fallbackModel: string | null;
  apiKey: string;
}

/**
 * Sanitiza qualquer string antes de enviar para o console/log do servidor,
 * removendo tokens, segredos e potenciais dados sensíveis.
 */
function sanitizeForLog(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/[A-Za-z0-9_-]{25,}/g, '[REDACTED]');
}

export function getLLMConfig(): LLMConfig {
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim();
  const fallbackModel = process.env.LLM_FALLBACK_MODEL?.trim() || null;
  const apiKey = process.env.LLM_API_KEY?.trim();

  if (!baseUrl) {
    throw new LLMError(
      'ai_unavailable',
      'MISSING_ENV'
    );
  }

  if (!model) {
    throw new LLMError(
      'ai_unavailable',
      'MISSING_ENV'
    );
  }

  // Ollama local não requer chave obrigatoriamente; provedores em nuvem sim.
  const isLocalOllama = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  if (!apiKey && !isLocalOllama) {
    throw new LLMError(
      'ai_unavailable',
      'MISSING_ENV'
    );
  }

  // Normaliza a URL para garantir terminação em /chat/completions
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const endpoint = normalizedBase.endsWith('/chat/completions')
    ? normalizedBase
    : `${normalizedBase}/chat/completions`;

  return { endpoint, model, fallbackModel, apiKey: apiKey || 'ollama' };
}

/**
 * Executa uma requisição de completude com 1 retry e timeout.
 * Em caso de erro, loga sanitizado no servidor e lança LLMError com código limpo.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  modelName: string,
  timeoutMs = 18000
): Promise<Response> {
  const makeAttempt = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      if (isAbort) {
        console.error(`[LLM_SERVER_TIMEOUT] Timeout após ${timeoutMs / 1000}s para o modelo ${modelName}`);
        throw new LLMError('ai_unavailable', 'TIMEOUT', 504);
      }
      console.error(`[LLM_SERVER_NETWORK] Falha de conexão: ${sanitizeForLog((err as Error)?.message || '')}`);
      throw new LLMError('ai_unavailable', 'NETWORK_ERROR', 503);
    }
  };

  try {
    const response = await makeAttempt();

    if (response.status === 429) {
      const errBody = await response.text().catch(() => '');
      console.error(`[LLM_SERVER_429] Cota excedida no modelo ${modelName}: ${sanitizeForLog(errBody)}`);
      throw new LLMError('ai_unavailable', 'RATE_LIMIT', 429);
    }

    if (response.status >= 500) {
      // 1 tentativa de retry com backoff de 1s para instabilidades temporárias
      await new Promise((r) => setTimeout(r, 1000));
      const retryResponse = await makeAttempt();
      if (!retryResponse.ok) {
        const errBody = await retryResponse.text().catch(() => '');
        console.error(`[LLM_SERVER_5XX] Status ${retryResponse.status} no modelo ${modelName}: ${sanitizeForLog(errBody)}`);
        throw new LLMError('ai_unavailable', 'API_ERROR', retryResponse.status);
      }
      return retryResponse;
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[LLM_SERVER_ERROR] Status ${response.status} no modelo ${modelName}: ${sanitizeForLog(errBody)}`);
      throw new LLMError('ai_unavailable', 'API_ERROR', response.status);
    }

    return response;
  } catch (error) {
    if (error instanceof LLMError && error.code === 'NETWORK_ERROR') {
      await new Promise((r) => setTimeout(r, 800));
      return await makeAttempt();
    }
    throw error;
  }
}

/**
 * Cria o corpo da requisição compatível com OpenAI.
 */
function buildRequestBody(model: string, opts: LLMRequestOptions, stream: boolean) {
  return JSON.stringify({
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 350,
    stream,
  });
}

/**
 * Retorna uma ReadableStream com os tokens textuais da LLM em streaming.
 * Se o modelo principal retornar 404, 410 ou 429, tenta o fallbackModel antes de falhar.
 */
export async function streamChatCompletion(opts: LLMRequestOptions): Promise<ReadableStream<Uint8Array>> {
  const config = getLLMConfig();
  const encoder = new TextEncoder();

  const executeRequest = async (modelToUse: string): Promise<Response> => {
    return fetchWithRetry(
      config.endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: buildRequestBody(modelToUse, opts, true),
        signal: opts.signal,
      },
      modelToUse
    );
  };

  let response: Response;
  try {
    response = await executeRequest(config.model);
  } catch (primaryErr) {
    const isRecoverableStatus = primaryErr instanceof LLMError && (primaryErr.status === 404 || primaryErr.status === 410 || primaryErr.status === 429);
    if (isRecoverableStatus && config.fallbackModel && config.fallbackModel !== config.model) {
      console.warn(`[LLM_CONTINGENCY] Modelo primário (${config.model}) falhou (status ${primaryErr.status}). Tentando modelo de contingência: ${config.fallbackModel}`);
      try {
        response = await executeRequest(config.fallbackModel);
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    } else {
      throw primaryErr;
    }
  }

  if (!response.body) {
    console.error('[LLM_SERVER_ERROR] Resposta da LLM sem stream body');
    throw new LLMError('ai_unavailable', 'API_ERROR', 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') {
              controller.close();
              return;
            }
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6).trim();
              try {
                const parsed = JSON.parse(jsonStr);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  controller.enqueue(encoder.encode(deltaContent));
                }
              } catch {
                // Fragmento parcial ignorado
              }
            }
          }
        }
        controller.close();
      } catch (err) {
        console.error('[LLM_STREAM_ERROR] Erro na leitura do stream:', sanitizeForLog((err as Error)?.message || ''));
        controller.error(new LLMError('ai_unavailable', 'API_ERROR'));
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Completa a mensagem e retorna o texto completo (não-streaming).
 * Se o modelo principal retornar 404, 410 ou 429, tenta o fallbackModel antes de falhar.
 */
export async function chatCompletion(opts: LLMRequestOptions): Promise<string> {
  const config = getLLMConfig();

  const executeRequest = async (modelToUse: string): Promise<Response> => {
    return fetchWithRetry(
      config.endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: buildRequestBody(modelToUse, opts, false),
        signal: opts.signal,
      },
      modelToUse
    );
  };

  let response: Response;
  try {
    response = await executeRequest(config.model);
  } catch (primaryErr) {
    const isRecoverableStatus = primaryErr instanceof LLMError && (primaryErr.status === 404 || primaryErr.status === 410 || primaryErr.status === 429);
    if (isRecoverableStatus && config.fallbackModel && config.fallbackModel !== config.model) {
      console.warn(`[LLM_CONTINGENCY] Modelo primário (${config.model}) falhou (status ${primaryErr.status}). Tentando modelo de contingência: ${config.fallbackModel}`);
      try {
        response = await executeRequest(config.fallbackModel);
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    } else {
      throw primaryErr;
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    console.error('[LLM_SERVER_ERROR] Falha no parse JSON da resposta da LLM');
    throw new LLMError('ai_unavailable', 'API_ERROR', 502);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error('[LLM_SERVER_ERROR] Resposta sem choices[0].message.content válida:', sanitizeForLog(JSON.stringify(data)));
    throw new LLMError('ai_unavailable', 'API_ERROR', 502);
  }

  return content;
}
