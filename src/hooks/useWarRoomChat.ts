"use client";

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { pitWallSound } from '@/components/dialogue-box';

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskStrategistOptions {
  characterType: 'senior' | 'technical';
  characterId: string;
  topic?: string;
  circuitId?: string;
  driverCode?: string;
  message: string;
  fallbackText: string;
}

export function useWarRoomChat() {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<'senior' | 'technical' | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<ChatHistoryItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const askStrategist = useCallback(async (opts: AskStrategistOptions) => {
    setIsTransmitting(true);
    setActiveSpeaker(opts.characterType);
    setStreamingText('');
    setError(null);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Obtém sessão do Supabase (para Bearer Token)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 2. Dispara requisição para o Route Handler seguro
      const response = await fetch('/api/war-room/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          characterType: opts.characterType,
          characterId: opts.characterId,
          circuitId: opts.circuitId,
          topic: opts.topic,
          driverCode: opts.driverCode,
          message: opts.message,
          history: historyRef.current.slice(-4),
        }),
        signal: controller.signal,
      });

      // Se falhar (ex: 401, 429, 503), faz fallback silencioso para o diálogo roteirizado
      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => null);
        console.warn('[WarRoom Chat] Fallback para roteiro estático:', errJson?.error || response.statusText);
        setStreamingText(opts.fallbackText);
        setError(errJson?.error || 'Rádio instável');
        setIsTransmitting(false);
        return;
      }

      const remainingHeader = response.headers.get('X-RateLimit-Remaining');
      if (remainingHeader !== null) {
        setRemainingToday(parseInt(remainingHeader, 10));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);

        // Som mecânico de teletipo para os caracteres recebidos
        const lastChar = chunk.slice(-1);
        if (lastChar && lastChar !== ' ') {
          pitWallSound.playKeyClick(lastChar);
        }
      }

      // Atualiza histórico na memória da conversa
      historyRef.current.push({ role: 'user', content: opts.message });
      historyRef.current.push({ role: 'assistant', content: fullText });
      if (historyRef.current.length > 8) {
        historyRef.current = historyRef.current.slice(-8);
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      console.warn('[WarRoom Chat] Falha no streaming. Aplicando fallback silencioso:', (err as Error)?.message);
      // Fallback gracioso: usuário nunca vê erro técnico
      setStreamingText(opts.fallbackText);
      setError((err as Error)?.message || 'Erro de conexão');
    } finally {
      setIsTransmitting(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsTransmitting(false);
    setStreamingText(null);
    setActiveSpeaker(null);
    setError(null);
  }, []);

  return {
    isTransmitting,
    streamingText,
    activeSpeaker,
    remainingToday,
    error,
    askStrategist,
    resetChat,
  };
}
