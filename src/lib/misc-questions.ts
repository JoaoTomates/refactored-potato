export interface MiscQuestion {
    id: string;
    text: string;
    options: ['SIM', 'NÃO'];
}

export const MISC_QUESTIONS: MiscQuestion[] = [
    { id: 'q1', text: 'Safety car durante o Grande Prêmio?', options: ['SIM', 'NÃO'] },
    { id: 'q2', text: 'Bandeira vermelha acionada na corrida?', options: ['SIM', 'NÃO'] },
    { id: 'q3', text: 'Algum carro da primeira fila sofrerá DNF?', options: ['SIM', 'NÃO'] },
    { id: 'q4', text: 'Ambas as Ferraris terminarão no TOP 5?', options: ['SIM', 'NÃO'] },
    { id: 'q5', text: 'Volta mais rápida conquistada por M. VERSTAPPEN?', options: ['SIM', 'NÃO'] },
];

export const DEFAULT_ACTIVE_MISC_IDS = ['q1', 'q2', 'q3'];

/**
 * Resolve exatamente 3 IDs de perguntas MISC ativas a partir do registro em global_settings.
 */
export function resolveActiveMiscIds(value: any): string[] {
    const validIds = new Set(MISC_QUESTIONS.map(q => q.id));

    if (value && Array.isArray(value.question_ids)) {
        const filtered = value.question_ids.filter((id: string) => validIds.has(id));
        if (filtered.length >= 3) {
            return filtered.slice(0, 3);
        }
        const merged = [...filtered];
        for (const fallbackId of DEFAULT_ACTIVE_MISC_IDS) {
            if (merged.length < 3 && !merged.includes(fallbackId)) {
                merged.push(fallbackId);
            }
        }
        return merged;
    }

    if (value && typeof value.question_id === 'string' && validIds.has(value.question_id)) {
        const merged = [value.question_id];
        for (const q of MISC_QUESTIONS) {
            if (merged.length < 3 && !merged.includes(q.id)) {
                merged.push(q.id);
            }
        }
        return merged;
    }

    return DEFAULT_ACTIVE_MISC_IDS;
}
