"use client";

const STORAGE_KEY = 'ts1_device_signal_id';
const LEGACY_STORAGE_KEY = 'baeff1_device_signal_id';

async function sha256Hex(input: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoded = new TextEncoder().encode(input);
        const digest = await window.crypto.subtle.digest('SHA-256', encoded);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    // Fallback determinístico simples caso SubtleCrypto não esteja disponível
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return `fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Gera um identificador de dispositivo estável combinando persistência local e características
 * leves do navegador/hardware, permitindo detecção de múltiplas contas mesmo após limpar cache.
 */
export async function getDeviceSignalHash(): Promise<string> {
    if (typeof window === 'undefined') return 'server';

    let deviceId = '';
    try {
        deviceId = localStorage.getItem(STORAGE_KEY) || '';
        if (!deviceId) {
            const legacyId = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyId) {
                deviceId = legacyId;
                localStorage.setItem(STORAGE_KEY, legacyId);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
        }
        if (!deviceId) {
            deviceId = window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(STORAGE_KEY, deviceId);
        }
    } catch {
        deviceId = 'no-storage';
    }

    const traits = [
        navigator.platform || '',
        navigator.language || '',
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`,
        String(navigator.hardwareConcurrency || 0),
    ].join('|');

    const traitHash = await sha256Hex(traits);
    const tokenHash = await sha256Hex(deviceId);
    return `${traitHash.slice(0, 32)}:${tokenHash.slice(0, 16)}`;
}
