export type StewardReportCategory = 'driver_changes' | 'penalties' | 'results' | 'others';
export type StewardReportStatus = 'pending' | 'confirmed' | 'rejected';
export type StewardVoteChoice = 'confirm' | 'reject';

export interface StewardReportPayload {
    // driver_changes
    out_driver?: string;
    in_driver?: string;
    in_code?: string;
    new_team?: string;
    // penalties
    driver?: string;
    penalty_type?: string;
    // results
    top3?: string[];
    pole_time?: string;
}

export interface StewardReport {
    id: string;
    reporter_id: string | null;
    reporter_name: string;
    category: StewardReportCategory;
    session: string | null;
    round_label: string | null;
    title: string;
    payload: StewardReportPayload;
    details: string;
    status: StewardReportStatus;
    confirm_count: number;
    reject_count: number;
    threshold: number;
    created_at: string;
    resolved_at: string | null;
}

export interface StewardReportVote {
    id: string;
    report_id: string;
    voter_id: string;
    voter_name: string;
    vote: StewardVoteChoice;
    created_at: string;
}

export const CATEGORY_META: Record<
    StewardReportCategory,
    { label: string; short: string; color: string; bg: string; border: string }
> = {
    driver_changes: {
        label: 'Mudança de Pilotos',
        short: 'PILOTO',
        color: '#60a5fa',
        bg: 'rgba(59, 130, 246, 0.14)',
        border: 'rgba(59, 130, 246, 0.45)',
    },
    penalties: {
        label: 'Penalidade Pós-Corrida',
        short: 'PENALIDADE',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.14)',
        border: 'rgba(239, 68, 68, 0.45)',
    },
    results: {
        label: 'Resultado Oficial',
        short: 'RESULTADO',
        color: '#34d399',
        bg: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.45)',
    },
    others: {
        label: 'Correção / Outros',
        short: 'OUTROS',
        color: '#fbaa19',
        bg: 'rgba(251, 170, 25, 0.14)',
        border: 'rgba(251, 170, 25, 0.45)',
    },
};

export function formatCanonicalPilotTag(
    firstName?: string | null,
    lastName?: string | null,
    driverNumber?: string | number | null,
    fallback?: string | null
): string {
    if (firstName && lastName) {
        const initial = firstName.trim().charAt(0).toUpperCase();
        const cleanLast = lastName.trim().toUpperCase().replace(/\s+/g, '');
        const num = driverNumber !== undefined && driverNumber !== null ? String(driverNumber).replace(/\D/g, '') : '';
        return `${initial}.${cleanLast}${num}`;
    }
    if (fallback) {
        return fallback.replace(/^@/, '').trim().toUpperCase();
    }
    return 'PILOTO';
}

export function formatRelativeTimePt(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
}
