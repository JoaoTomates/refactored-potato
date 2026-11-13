import { supabase } from '@/utils/supabase';
import { SENIOR_STRATEGISTS } from '@/lib/race-directors';
import { CANONICAL_ENGINEERS_METADATA } from '@/lib/group-engineers';
import { TEAM_PRINCIPALS } from '@/lib/paddock-crew';

export type CrewCategory = 'senior' | 'tech' | 'chief';

export interface AllianceChiefMeta {
    id: string;
    code: string;
    fullName: string;
    role: string;
    subtitle: string;
    age: string;
    nationality: string;
    profile: string;
    keyAttribute: string;
    avatarUrl: string;
    fallbackUrl: string;
    accentColor: string;
}

export const ALLIANCE_CHIEFS_META: AllianceChiefMeta[] = [
    {
        id: 'chief-chadwick',
        code: 'D.CHADWICK',
        fullName: 'Daniel Chadwick',
        role: 'Engenheiro-Chefe de Calibração Térmica e Mapeamento de Potência',
        subtitle: 'CONSÓRCIO DA ESTRELA // BLOCO A',
        age: '48 anos',
        nationality: 'Britânico',
        profile: 'Formado na clássica escola de motorsport de Northamptonshire. Especialista em balancear curvas de entrega de potência e mapas de ignição agressivos sem ultrapassar as janelas de temperatura de câmara.',
        keyAttribute: 'Otimização de tempo em voltas de qualificação (Quali Mode).',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_a.jpg',
        fallbackUrl: '/avatar/others/alianca_1_a.jpg',
        accentColor: '#00d2be',
    },
    {
        id: 'chief-schweiger',
        code: 'K.SCHWEIGER',
        fullName: 'Klaus Schweiger',
        role: 'Especialista em Dinâmica de Turbocompressores & Fluxo de Gases',
        subtitle: 'CONSÓRCIO DA ESTRELA // BLOCO A',
        age: '54 anos',
        nationality: 'Alemão',
        profile: 'Engenharia de precisão com vasta experiência em bancos de teste de Stuttgart. Focado na eficiência termodinâmica da turbina e no aproveitamento máximo do fluxo de escape para eliminar o atraso de turbo.',
        keyAttribute: 'Confiabilidade do compressor e resposta linear de aceleração.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_b.jpg',
        fallbackUrl: '/avatar/others/alianca_1_b.jpg',
        accentColor: '#00d2be',
    },
    {
        id: 'chief-bellini',
        code: 'M.BELLINI',
        fullName: 'Matteo Bellini',
        role: 'Engenheiro-Chefe & Mestre de Metalurgia e Resistência',
        subtitle: 'DINASTIA DE MARANELLO // BLOCO B',
        age: '61 anos',
        nationality: 'Italiano',
        profile: 'Veterano forjado nos bastidores de Maranello. Especialista em ligas ultraleves para pistões, bielas forjadas e válvulas de titânio preparadas para suportar regimes extremos de rotação contínua.',
        keyAttribute: 'Redução de desgaste mecânico e fadiga de material em alta quilometragem.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_a.jpg',
        fallbackUrl: '/avatar/others/alianca_2_a.jpg',
        accentColor: '#e8002d',
    },
    {
        id: 'chief-crawford',
        code: 'A.CRAWFORD',
        fullName: 'Alistair Crawford',
        role: 'Engenheiro de Sistemas de Combustível & Injeção Direta',
        subtitle: 'DINASTIA DE MARANELLO // BLOCO B',
        age: '41 anos',
        nationality: 'Britânico',
        profile: 'Focado nas altas pressões das bombas de combustível e na atomização do spray nos cilindros. Trabalha no limite dos fluxômetros para extrair máxima queima de cada gota de combustível permitida pelo regulamento.',
        keyAttribute: 'Economia de combustível em ritmo sustentado de corrida (Lift and Coast).',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_b.jpg',
        fallbackUrl: '/avatar/others/alianca_2_b.jpg',
        accentColor: '#e8002d',
    },
    {
        id: 'chief-zimmermann',
        code: 'S.ZIMMERMANN',
        fullName: 'Stefan Zimmermann',
        role: 'Engenheiro-Chefe de Lubrificação, Pressão Hidráulica e Refrigeração',
        subtitle: 'A VANGUARDA // BLOCO C',
        age: '36 anos',
        nationality: 'Alemão',
        profile: 'Metódico e analítico, monitora o circuito de cárter seco, dissipação de calor nos radiadores e viscosidade de óleos sintéticos sob forças centrífugas elevadas em curvas de alta velocidade.',
        keyAttribute: 'Prevenção de quebras críticas por superaquecimento ou perda de pressão de óleo.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_a.jpg',
        fallbackUrl: '/avatar/others/alianca_3_a.jpg',
        accentColor: '#38bdf8',
    },
    {
        id: 'chief-marchetti',
        code: 'G.MARCHETTI',
        fullName: 'Giulio Marchetti',
        role: 'Engenheiro de Integração Dinâmica & Análise Harmônica',
        subtitle: 'A VANGUARDA // BLOCO C',
        age: '49 anos',
        nationality: 'Italiano',
        profile: 'Especialista na interface entre o bloco do motor e o chassi de fibra de carbono. Analisa as frequências vibratórias do virabrequim para mitigar ressonâncias parasitas que afetam suportes estruturais e chicotes elétricos.',
        keyAttribute: 'Estabilidade mecânica da unidade de potência acoplada ao monocoque.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_b.jpg',
        fallbackUrl: '/avatar/others/alianca_3_b.jpg',
        accentColor: '#38bdf8',
    },
];

export const TEAM_COLORS_MAP: Record<string, { color: string; allianceImg: string }> = {
    MER: { color: '#27F4D2', allianceImg: '/avatar/others/alianca_1_a.jpg' },
    MCL: { color: '#FF8000', allianceImg: '/avatar/others/alianca_1_a.jpg' },
    ALP: { color: '#0093CC', allianceImg: '/avatar/others/alianca_1_b.jpg' },
    WIL: { color: '#64C4FF', allianceImg: '/avatar/others/alianca_1_b.jpg' },
    FER: { color: '#E8002D', allianceImg: '/avatar/others/alianca_2_a.jpg' },
    HAA: { color: '#B6BABD', allianceImg: '/avatar/others/alianca_2_b.jpg' },
    CAD: { color: '#D4AF37', allianceImg: '/avatar/others/alianca_2_a.jpg' },
    RBR: { color: '#3671C6', allianceImg: '/avatar/others/alianca_3_a.jpg' },
    AST: { color: '#229971', allianceImg: '/avatar/others/alianca_3_b.jpg' },
    RBA: { color: '#6692FF', allianceImg: '/avatar/others/alianca_3_a.jpg' },
    AUD: { color: '#52E252', allianceImg: '/avatar/others/alianca_3_b.jpg' },
};

export interface CrewCharacterBase {
    id: string;
    category: CrewCategory;
    subType: 'senior' | 'tech' | 'alliance_chief' | 'team_principal';
    code: string;
    fullName: string;
    role: string;
    subtitle: string;
    specialty: string;
    bioOrQuote: string;
    avatarUrl: string;
    fallbackUrl: string;
    accentColor: string;
    extraCharacteristics: Array<{ label: string; value: string }>;
}

export interface CharacterRoleOverride {
    role?: string;
    subtitle?: string;
    specialty?: string;
    bioOrQuote?: string;
}

export interface SystemSlotAssignments {
    inviteDirectorId: string;
    headquartersAgentId: string;
    raceWeekFallbackMentorId: string;
    allianceChiefAId: string;
    allianceChiefBId: string;
    allianceChiefCId: string;
}

export interface CrewRolesConfig {
    overrides: Record<string, CharacterRoleOverride>;
    slots: SystemSlotAssignments;
    updatedAt?: string;
}

export const CREW_ROLES_SETTINGS_ID = 'crew_roles_config';

export const DEFAULT_CREW_ROLES_CONFIG: CrewRolesConfig = {
    overrides: {},
    slots: {
        inviteDirectorId: 'strat-1',
        headquartersAgentId: 'strat-1',
        raceWeekFallbackMentorId: 'strat-1',
        allianceChiefAId: 'chief-chadwick',
        allianceChiefBId: 'chief-bellini',
        allianceChiefCId: 'chief-zimmermann',
    },
};

export function getBaseCrewCatalog(): CrewCharacterBase[] {
    const seniors: CrewCharacterBase[] = SENIOR_STRATEGISTS.map((s) => {
        const num = parseInt(s.id.replace('strat-', ''), 10) || 1;
        const localImg = `/avatar/ex_drivers/avatar_driver_${num}.jpg`;
        return {
            id: s.id,
            category: 'senior',
            subType: 'senior',
            code: s.code,
            fullName: `${s.displayName} (${s.originalDriver})`,
            role: s.title,
            subtitle: `ESTRATEGISTA SÊNIOR // ERA ${s.decade}`,
            specialty: s.specialty,
            bioOrQuote: `${s.signatureQuote} — ${s.biography}`,
            avatarUrl: (s as { avatarUrl?: string }).avatarUrl || localImg,
            fallbackUrl: localImg,
            accentColor: '#fbaa19',
            extraCharacteristics: [
                { label: 'NACIONALIDADE', value: s.nationality },
                { label: 'HISTÓRICO REAL', value: s.careerStat },
                { label: 'ASSERTIVIDADE', value: `${s.evaluation.accuracyRate}% (${s.evaluation.communityRating}/5.0)` },
            ],
        };
    });

    const techs: CrewCharacterBase[] = CANONICAL_ENGINEERS_METADATA.map((t, i) => {
        const idx = i + 1;
        const localFallback = idx === 23 ? '/avatar/eng/avatar_25b.jpg' : `/avatar/eng/avatar_${idx}.jpg`;
        return {
            id: `eng-${idx}`,
            category: 'tech',
            subType: 'tech',
            code: t.code,
            fullName: t.fullName,
            role: t.role,
            subtitle: `ENGENHEIRO TÉCNICO // REGISTRO ENG #${idx}`,
            specialty: t.specialty,
            bioOrQuote: `Operacional de telemetria e análise de garagem focado em ${t.specialty.toLowerCase()}.`,
            avatarUrl: `https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/eng/avatar_${idx}.jpg`,
            fallbackUrl: localFallback,
            accentColor: '#38bdf8',
            extraCharacteristics: [
                { label: 'NACIONALIDADE', value: t.nationality },
                { label: 'IDADE', value: `${t.age} anos` },
            ],
        };
    });

    const allianceChiefs: CrewCharacterBase[] = ALLIANCE_CHIEFS_META.map((c) => ({
        id: c.id,
        category: 'chief',
        subType: 'alliance_chief',
        code: c.code,
        fullName: c.fullName,
        role: c.role,
        subtitle: c.subtitle,
        specialty: c.keyAttribute,
        bioOrQuote: c.profile,
        avatarUrl: c.avatarUrl,
        fallbackUrl: c.fallbackUrl,
        accentColor: c.accentColor,
        extraCharacteristics: [
            { label: 'NACIONALIDADE', value: c.nationality },
            { label: 'IDADE', value: c.age },
            { label: 'PATENTE', value: 'ENGENHEIRO-CHEFE DE ALIANÇA' },
        ],
    }));

    const teamPrincipals: CrewCharacterBase[] = Object.values(TEAM_PRINCIPALS).map((tp) => {
        const meta = TEAM_COLORS_MAP[tp.teamCode] || { color: '#e8002d', allianceImg: '/avatar/others/alianca_1_a.jpg' };
        return {
            id: `tp-${tp.teamCode}`,
            category: 'chief',
            subType: 'team_principal',
            code: tp.code,
            fullName: tp.fullName,
            role: tp.title,
            subtitle: `CHEFE DE EQUIPE // ${tp.teamName.toUpperCase()}`,
            specialty: tp.briefingFocus,
            bioOrQuote: tp.hospitalityWelcome,
            avatarUrl: meta.allianceImg,
            fallbackUrl: meta.allianceImg,
            accentColor: meta.color,
            extraCharacteristics: [
                { label: 'ESCUDERIA', value: `${tp.teamName} (${tp.teamCode})` },
                { label: 'PERFIL DE COMANDO', value: tp.personality },
                { label: 'CARGO', value: 'TEAM PRINCIPAL' },
            ],
        };
    });

    return [...seniors, ...techs, ...allianceChiefs, ...teamPrincipals];
}

export function applyCharacterOverride(
    character: CrewCharacterBase,
    config?: CrewRolesConfig | null
): CrewCharacterBase {
    const ov = config?.overrides?.[character.id];
    if (!ov) return character;
    return {
        ...character,
        role: ov.role?.trim() ? ov.role : character.role,
        subtitle: ov.subtitle?.trim() ? ov.subtitle : character.subtitle,
        specialty: ov.specialty?.trim() ? ov.specialty : character.specialty,
        bioOrQuote: ov.bioOrQuote?.trim() ? ov.bioOrQuote : character.bioOrQuote,
    };
}

export function resolveCrewCharacterById(
    id: string | null | undefined,
    config?: CrewRolesConfig | null
): CrewCharacterBase | undefined {
    if (!id) return undefined;
    const found = getBaseCrewCatalog().find((c) => c.id.toLowerCase() === id.toLowerCase());
    return found ? applyCharacterOverride(found, config) : undefined;
}

export function findCrewCharacter(
    identifier: string | null | undefined,
    config?: CrewRolesConfig | null
): CrewCharacterBase | undefined {
    if (!identifier) return undefined;
    const clean = identifier.replace(/[\[\]]/g, '').trim().toLowerCase();
    const catalog = getBaseCrewCatalog();

    // 1. Casamento direto por ID
    let found = catalog.find((c) => c.id.toLowerCase() === clean);
    if (found) return applyCharacterOverride(found, config);

    // 2. Casamento por Código (ex: "H.LEWISEVANS", "M.SALO", "D.CHADWICK", "M.BELLINI")
    found = catalog.find((c) => c.code.toLowerCase() === clean);
    if (found) return applyCharacterOverride(found, config);

    // 3. Casamento específico do Diretor de Operações
    if (clean === 'diretor' || clean === 'diretor de operações' || clean.includes('diretor')) {
        const directorId = config?.slots?.inviteDirectorId || DEFAULT_CREW_ROLES_CONFIG.slots.inviteDirectorId;
        return resolveCrewCharacterById(directorId, config);
    }

    // 4. Casamento por Nome Completo ou Parcial
    found = catalog.find((c) => c.fullName.toLowerCase().includes(clean));
    if (found) return applyCharacterOverride(found, config);

    // 5. Casamento por URL do Avatar
    found = catalog.find((c) => c.avatarUrl.toLowerCase().includes(clean) || c.fallbackUrl.toLowerCase().includes(clean));
    if (found) return applyCharacterOverride(found, config);

    return undefined;
}

export function normalizeCrewRolesConfig(raw: unknown): CrewRolesConfig {
    if (!raw || typeof raw !== 'object') return DEFAULT_CREW_ROLES_CONFIG;
    const obj = raw as Partial<CrewRolesConfig>;
    return {
        overrides: obj.overrides && typeof obj.overrides === 'object' ? obj.overrides : {},
        slots: {
            inviteDirectorId: obj.slots?.inviteDirectorId || DEFAULT_CREW_ROLES_CONFIG.slots.inviteDirectorId,
            headquartersAgentId: obj.slots?.headquartersAgentId || DEFAULT_CREW_ROLES_CONFIG.slots.headquartersAgentId,
            raceWeekFallbackMentorId:
                obj.slots?.raceWeekFallbackMentorId || DEFAULT_CREW_ROLES_CONFIG.slots.raceWeekFallbackMentorId,
            allianceChiefAId: obj.slots?.allianceChiefAId || DEFAULT_CREW_ROLES_CONFIG.slots.allianceChiefAId,
            allianceChiefBId: obj.slots?.allianceChiefBId || DEFAULT_CREW_ROLES_CONFIG.slots.allianceChiefBId,
            allianceChiefCId: obj.slots?.allianceChiefCId || DEFAULT_CREW_ROLES_CONFIG.slots.allianceChiefCId,
        },
        updatedAt: obj.updatedAt,
    };
}

export async function fetchCrewRolesConfig(): Promise<CrewRolesConfig> {
    try {
        const { data, error } = await supabase
            .from('global_settings')
            .select('value')
            .eq('id', CREW_ROLES_SETTINGS_ID)
            .maybeSingle();

        if (error || !data?.value) return DEFAULT_CREW_ROLES_CONFIG;
        return normalizeCrewRolesConfig(data.value);
    } catch {
        return DEFAULT_CREW_ROLES_CONFIG;
    }
}

export async function saveCrewRolesConfig(config: CrewRolesConfig): Promise<{ ok: boolean; error?: string }> {
    const payload: CrewRolesConfig = {
        ...config,
        updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('global_settings').upsert({
        id: CREW_ROLES_SETTINGS_ID,
        value: payload,
    });

    if (error) {
        return { ok: false, error: error.message };
    }
    return { ok: true };
}
