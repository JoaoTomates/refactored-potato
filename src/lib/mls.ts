/**
 * TS1 // Utilitários de Milésimos de Segundo (MLS / Pontos)
 * Padrão oficial: 3 dígitos inteiros e 3 decimais, ex: "000.100" mls
 */

export const INITIAL_MLS_BONUS = 100; // 100 milésimos = "000.100"

export function formatMls(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '000.100';
    const num = Number(val);
    if (isNaN(num) || num < 0) return '000.100';
    const totalMs = Math.round(num);
    const sec = Math.floor(totalMs / 1000);
    const ms = totalMs % 1000;
    return `${String(sec).padStart(3, '0')}.${String(ms).padStart(3, '0')}`;
}

export function formatTimeAgo(dateString?: string | null): string {
    if (!dateString) return 'Recente';
    try {
        const diffMs = Date.now() - new Date(dateString).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Ontem';
        return `${diffDays}d atrás`;
    } catch {
        return 'Recente';
    }
}
