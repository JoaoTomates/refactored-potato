"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { F1_TEAMS, TeamData } from '@/lib/teams';
import { getRealF1Driver } from '@/lib/real-f1-drivers';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { normalizeAtSlug } from '@/lib/slug';

interface ProfileRow {
    slug?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    driver_number?: number | string | null;
}

interface ContractRow {
    group_id: number | null;
    team_id: string;
    user_id: string;
    profiles: ProfileRow | ProfileRow[] | null;
}

interface BlockPalette {
    from: string;
    to: string;
    text: string;
    divider: string;
}

const TEAM_BLOCK_PALETTE: Record<string, BlockPalette> = {
    MCL: { from: '#FF941A', to: '#E66900', text: '#080A0D', divider: 'rgba(8,10,13,0.22)' },
    FER: { from: '#FF1A3C', to: '#C40020', text: '#FFFFFF', divider: 'rgba(255,255,255,0.26)' },
    RBR: { from: '#1E29FF', to: '#02009E', text: '#FFFFFF', divider: 'rgba(255,255,255,0.26)' },
    MER: { from: '#00F0DA', to: '#00A898', text: '#080A0D', divider: 'rgba(8,10,13,0.22)' },
    AST: { from: '#009944', to: '#005E28', text: '#FFFFFF', divider: 'rgba(255,255,255,0.26)' },
    ALP: { from: '#24A2FF', to: '#0070D1', text: '#FFFFFF', divider: 'rgba(255,255,255,0.26)' },
    HAA: { from: '#FFFFFF', to: '#D8DBE0', text: '#D90429', divider: 'rgba(217,4,41,0.22)' },
    RBA: { from: '#2A4D80', to: '#122340', text: '#7CC4FF', divider: 'rgba(124,196,255,0.26)' },
    WIL: { from: '#FFFFFF', to: '#DDE2EC', text: '#005AFF', divider: 'rgba(0,90,255,0.22)' },
    AUD: { from: '#3D4452', to: '#1E222A', text: '#FF4D4D', divider: 'rgba(255,77,77,0.26)' },
    CAD: { from: '#FFCC24', to: '#E59F00', text: '#080A0D', divider: 'rgba(8,10,13,0.22)' },
};

/**
 * Ordem oficial F1 pelo ranking de Construtores do ano anterior (2024):
 * 1. McLaren, 2. Ferrari, 3. Red Bull Racing, 4. Mercedes, 5. Aston Martin,
 * 6. Alpine, 7. Haas, 8. RB (Racing Bulls), 9. Williams, 10. Audi (Sauber/Kick), 11. Cadillac (Nova entrante)
 */
const F1_OFFICIAL_ORDER: Record<string, number> = {
    MCL: 1,
    FER: 2,
    RBR: 3,
    MER: 4,
    AST: 5,
    ALP: 6,
    HAA: 7,
    RBA: 8,
    WIL: 9,
    AUD: 10,
    CAD: 11,
};

function unwrapProfile(raw: ContractRow['profiles']): ProfileRow | null {
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] || null : raw;
}

/**
 * Formata o nome do estrategista seguindo a Golden Rule: "L.GUSTAVO88"
 */
function formatStrategistName(profile: ProfileRow | null): string {
    if (!profile) return 'VAGA ABERTA';

    const first = (profile.first_name || '').trim();
    const last = (profile.last_name || '').trim();
    const num = profile.driver_number !== null && profile.driver_number !== undefined
        ? String(profile.driver_number).trim()
        : '';

    if (first && last) {
        const cleanLast = last.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const suffix = cleanLast.endsWith(num) ? '' : num;
        return `${first.charAt(0).toUpperCase()}.${cleanLast}${suffix}`;
    }

    if (profile.slug) {
        return profile.slug.replace(/^@+/, '').toUpperCase();
    }

    if (first) {
        return `${first.toUpperCase()}${num}`;
    }

    return 'ESTRATEGISTA';
}

export default function PitwallPage() {
    const { user } = useSupabaseAuth();
    const [contracts, setContracts] = useState<ContractRow[]>([]);

    useEffect(() => {
        let active = true;

        const fetchContracts = async () => {
            try {
                const { data, error } = await supabase
                    .from('contracts')
                    .select('group_id, team_id, user_id, profiles(slug, first_name, last_name, driver_number)');

                if (active && !error && data) {
                    setContracts(data as ContractRow[]);
                }
            } catch (err) {
                console.error('Erro ao carregar contratos em /pitwall:', err);
            }
        };

        fetchContracts();
        return () => {
            active = false;
        };
    }, []);

    const userContract = useMemo(() => {
        if (!user) return null;
        return contracts.find(c => c.user_id === user.id) || null;
    }, [contracts, user]);

    const activeGroupId = useMemo(() => {
        if (userContract?.group_id) return Number(userContract.group_id);
        const groups = contracts
            .map(c => Number(c.group_id))
            .filter(g => Number.isFinite(g) && g > 0)
            .sort((a, b) => a - b);
        return groups[0] || 1;
    }, [contracts, userContract]);

    const orderedTeams = useMemo(() => {
        return [...F1_TEAMS].sort((a, b) => {
            const rankA = F1_OFFICIAL_ORDER[a.logo] ?? 99;
            const rankB = F1_OFFICIAL_ORDER[b.logo] ?? 99;
            return rankA - rankB;
        });
    }, []);

    return (
        <main className="relative w-full min-h-screen overflow-x-hidden bg-[#050401] font-mono">
            {/* Background fixo: Pitlane Helicopter 60m Noir */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/pitwall_helicopter_bg.jpg"
                    alt="VoltGrid Pitwall Helicopter View"
                    className="w-full h-full object-cover object-center"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute inset-0 bg-black/55" />
            </div>

            {/* Blocos Coloridos 2 Rows x 3 Columns */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-10 sm:py-14 min-h-screen flex items-center">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-6 sm:gap-y-7">
                    {orderedTeams.map((team: TeamData) => {
                        const palette = TEAM_BLOCK_PALETTE[team.logo] || {
                            from: team.color,
                            to: team.color,
                            text: '#FFFFFF',
                            divider: 'rgba(255,255,255,0.2)',
                        };

                        const driver1 = getRealF1Driver(team.name, 1);
                        const driver2 = getRealF1Driver(team.name, 2);

                        const rawTeamContracts = contracts.filter(
                            c => c.team_id === team.id && Number(c.group_id || 1) === activeGroupId
                        );

                        // Garante o usuário autenticado como estrategista principal na Row 1 e o colega de box na Row 2
                        const orderedContracts = [...rawTeamContracts].sort((a, b) => {
                            if (user && a.user_id === user.id) return -1;
                            if (user && b.user_id === user.id) return 1;
                            return 0;
                        });

                        const primaryContract = orderedContracts[0] || null;
                        const teammateContract = orderedContracts[1] || null;

                        const primaryProfile = unwrapProfile(primaryContract?.profiles || null);
                        const teammateProfile = unwrapProfile(teammateContract?.profiles || null);

                        const primaryName = formatStrategistName(primaryProfile);
                        const teammateName = formatStrategistName(teammateProfile);

                        const primarySlug = normalizeAtSlug(primaryProfile?.slug);
                        const teammateSlug = normalizeAtSlug(teammateProfile?.slug);

                        const isUsersTeam = Boolean(user && primaryContract?.user_id === user.id);

                        return (
                            <div
                                key={team.id}
                                className={`w-full overflow-hidden relative transition-transform duration-150 ${
                                    isUsersTeam ? 'ring-2 ring-[#fbaa19]' : ''
                                }`}
                                style={{
                                    borderRadius: '10px 10px 10px 20px',
                                    border: '2px solid rgba(0, 0, 0, 0.95)',
                                    boxShadow: isUsersTeam
                                        ? '0 12px 28px 4px rgba(0, 0, 0, 0.85), 0 0 22px rgba(251, 170, 25, 0.45)'
                                        : '0 10px 24px 3px rgba(0, 0, 0, 0.75)',
                                    background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
                                    color: palette.text,
                                }}
                            >
                                {/* Brilho espelhado / reflexo de vidro chanfrado */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.2) 100%)',
                                    }}
                                />

                                {/* ROW 1: Nome da Equipe (destaque) | Piloto 1 (ex: LEC) | Estrategista Principal (Usuário) */}
                                <div
                                    className="relative z-10 grid grid-cols-[1.5fr_0.45fr_1.05fr] items-center min-h-[48px] sm:min-h-[52px] px-4 sm:px-5 py-2.5 sm:py-3 border-b"
                                    style={{ borderBottomColor: palette.divider }}
                                >
                                    <span
                                        className="text-left text-lg sm:text-xl lg:text-[22px] font-black uppercase tracking-normal leading-none truncate pr-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                                        style={{
                                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                            fontWeight: 900,
                                        }}
                                    >
                                        {team.name}
                                    </span>
                                    <span className="text-center text-sm sm:text-base font-black tracking-[0.16em] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                                        {driver1.code}
                                    </span>
                                    <span className="text-right text-xs sm:text-sm font-black tracking-wider uppercase truncate pl-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                                        {primarySlug ? (
                                            <Link href={`/${primarySlug}`} className="hover:underline">
                                                {primaryName}
                                            </Link>
                                        ) : (
                                            <span className={primaryContract ? '' : 'opacity-65'}>
                                                {primaryName}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* ROW 2: (vazio) | Piloto 2 (ex: HAM) | Colega de Box */}
                                <div className="relative z-10 grid grid-cols-[1.5fr_0.45fr_1.05fr] items-center min-h-[48px] sm:min-h-[52px] px-4 sm:px-5 py-2.5 sm:py-3">
                                    <span aria-hidden="true" />
                                    <span className="text-center text-sm sm:text-base font-black tracking-[0.16em] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                                        {driver2.code}
                                    </span>
                                    <span className="text-right text-xs sm:text-sm font-black tracking-wider uppercase truncate pl-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                                        {teammateSlug ? (
                                            <Link href={`/${teammateSlug}`} className="hover:underline">
                                                {teammateName}
                                            </Link>
                                        ) : (
                                            <span className={teammateContract ? '' : 'opacity-65'}>
                                                {teammateName}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
