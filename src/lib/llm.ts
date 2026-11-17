/**
 * Cliente agnóstico para provedores de LLM compatíveis com a API OpenAI /chat/completions.
 * Suporta Google Gemini (via OpenAI compat), Ollama local, OpenAI, Groq, etc.
 * 
 * REGRAS DE SEGURANÇA:
 * - Apenas executado no servidor (Route Handlers / Server Actions).
 * - Sem valores de fallback com chaves/segredos.
 * - Tratamento de 429 (quota excedida), timeout e 1 retry com backoff exponencial.
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
    message: string,
    public readonly code: 'MISSING_ENV' | 'RATE_LIMIT' | 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR',
    public readonly status?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

function getLLMConfig() {
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim();
  const apiKey = process.env.LLM_API_KEY?.trim();

  if (!baseUrl) {
    throw new LLMError(
      'Configuração incompleta: LLM_BASE_URL não foi definida no ambiente.',
      'MISSING_ENV'
    );
  }

  if (!model) {
    throw new LLMError(
      'Configuração incompleta: LLM_MODEL não foi definida no ambiente.',
      'MISSING_ENV'
    );
  }

  // Ollama local não requer chave obrigatoriamente; provedores em nuvem sim.
  const isLocalOllama = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  if (!apiKey && !isLocalOllama) {
    throw new LLMError(
      'Configuração incompleta: LLM_API_KEY não foi definida no ambiente.',
      'MISSING_ENV'
    );
  }

  // Normaliza a URL para garantir terminação em /chat/completions
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const endpoint = normalizedBase.endsWith('/chat/completions')
    ? normalizedBase
    : `${normalizedBase}/chat/completions`;

  return { endpoint, model, apiKey: apiKey || 'ollama' };
}

/**
 * Executa uma requisição de completude com 1 retry e timeout.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs = 18000
): Promise<Response> {
  const makeAttempt = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Concatena sinal externo se houver
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
        throw new LLMError(`A requisição à LLM excedeu o tempo limite de ${timeoutMs / 1000}s.`, 'TIMEOUT');
      }
      throw new LLMError(`Falha de rede ao conectar com a LLM: ${(err as Error)?.message}`, 'NETWORK_ERROR');
    }
  };

  try {
    const response = await makeAttempt();
    if (response.status === 429) {
      throw new LLMError('Limite de requisições / cota excedida no provedor de IA (429).', 'RATE_LIMIT', 429);
    }
    if (response.status >= 500) {
      // 1 tentativa de retry com backoff de 1s para instabilidades temporárias do servidor
      await new Promise((r) => setTimeout(r, 1000));
      const retryResponse = await makeAttempt();
      if (!retryResponse.ok) {
        throw new LLMError(`Provedor de LLM retornou erro ${retryResponse.status}: ${retryResponse.statusText}`, 'API_ERROR', retryResponse.status);
      }
      return retryResponse;
    }
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new LLMError(`Provedor de LLM retornou erro ${response.status}: ${errorText || response.statusText}`, 'API_ERROR', response.status);
    }
    return response;
  } catch (error) {
    if (error instanceof LLMError && error.code === 'NETWORK_ERROR') {
      // Tenta mais uma vez em caso de falha de socket/rede
      await new Promise((r) => setTimeout(r, 800));
      return await makeAttempt();
    }
    throw error;
  }
}

/**
 * Retorna uma ReadableStream com os tokens textuais da LLM em streaming.
 */
export async function streamChatCompletion(opts: LLMRequestOptions): Promise<ReadableStream<Uint8Array>> {
  const config = getLLMConfig();
  const encoder = new TextEncoder();

  const response = await fetchWithRetry(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 350,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!response.body) {
    throw new LLMError('Resposta da LLM não possui stream body.', 'API_ERROR');
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
            if (!trimmed || trimmed.startsWith(':')) continue; // Comentários keep-alive do SSE
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
                // Linha de dados incompleta ou parse ignorado
              }
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Completa a mensagem e retorna o texto completo (não-streaming).
 */
export async function chatCompletion(opts: LLMRequestOptions): Promise<string> {
  const config = getLLMConfig();

  const response = await fetchWithRetry(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 350,
      stream: false,
    }),
    signal: opts.signal,
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new LLMError('Formato de resposta inesperado do provedor de LLM.', 'API_ERROR');
  }
  return content;
}
