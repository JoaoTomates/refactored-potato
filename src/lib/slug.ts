/**
 * Utilitários canônicos de normalização de slug de estrategista e limpeza de sessão.
 * Padrão de exibição (Golden Rule): "L.GUSTAVO88"
 * Padrão de URL / chave no cache: "@l.gustavo88" (100% minúsculo)
 */

export function normalizeAtSlug(raw?: string | null): string | null {
    const clean = (raw || '').trim().replace(/^@+/, '').toLowerCase();
    return clean ? `@${clean}` : null;
}

export function getDashboardPath(slug?: string | null, fallback = '/superlicense'): string {
    const normalized = normalizeAtSlug(slug);
    return normalized ? `/${normalized}` : fallback;
}

export function slugAlphanumericKey(raw?: string | null): string {
    return (raw || '').replace(/^@+/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function clearCachedStrategistSession(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('vg_user_slug');
        localStorage.removeItem('war_room_draft');
        localStorage.removeItem('baeff1-predictions-storage');
        sessionStorage.removeItem('redirect_slug_guard');
        sessionStorage.removeItem('redirect_hq_guard');
    } catch {
        // Ignora falhas de storage em contextos restritos
    }
}
