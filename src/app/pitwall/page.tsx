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
    bg: string;
    text: string;
    accent: string;
}

const TEAM_BLOCK_PALETTE: Record<string, BlockPalette> = {
    FER: { bg: '#E8002D', text: '#FFFFFF', accent: '#E8002D' },
    RBR: { bg: '#0600EF', text: '#FFFFFF', accent: '#3671C6' },
    MCL: { bg: '#FF8000', text: '#080A0D', accent: '#FF8000' },
    MER: { bg: '#D1D5DB', text: '#005F56', accent: '#00D2BE' },
    WIL: { bg: '#FFFFFF', text: '#080A0D', accent: '#005AFF' },
    AST: { bg: '#007A33', text: '#FFFFFF', accent: '#229971' },
    ALP: { bg: '#0090FF', text: '#FFFFFF', accent: '#0090FF' },
    RBA: { bg: '#162E52', text: '#7CC4FF', accent: '#6692FF' },
    HAA: { bg: '#F3F4F6', text: '#D90429', accent: '#D90429' },
    AUD: { bg: '#262A30', text: '#FF3B30', accent: '#F50537' },
    CAD: { bg: '#0B0D10', text: '#FFE600', accent: '#FBAA19' },
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
        const preferredTeamId = userContract?.team_id || 'e59f0b0a-b8c3-4416-b90c-6f26bf8fc888'; // Ferrari padrão primeiro
        return [...F1_TEAMS].sort((a, b) => {
            if (a.id === preferredTeamId) return -1;
            if (b.id === preferredTeamId) return 1;
            return 0;
        });
    }, [userContract]);

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
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 min-h-screen flex items-center">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {orderedTeams.map((team: TeamData) => {
                        const palette = TEAM_BLOCK_PALETTE[team.logo] || {
                            bg: team.color,
                            text: '#FFFFFF',
                            accent: team.color,
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
                                className={`w-full overflow-hidden border transition-transform duration-150 ${
                                    isUsersTeam
                                        ? 'border-[#fbaa19] shadow-[0_0_18px_rgba(251,170,25,0.3)]'
                                        : 'border-black/90 shadow-[0_6px_18px_rgba(0,0,0,0.65)]'
                                }`}
                            >
                                {/* ROW 1: Nome da Equipe | Piloto 1 (ex: LEC) | Estrategista Principal (Usuário) */}
                                <div
                                    className="grid grid-cols-[1.2fr_0.5fr_1.3fr] items-center bg-[#080a0d]/95 text-white px-3 py-1.5 text-[11px] sm:text-xs font-black tracking-wider uppercase border-l-4"
                                    style={{ borderLeftColor: palette.accent }}
                                >
                                    <span className="text-left truncate pr-2">
                                        {team.name}
                                    </span>
                                    <span className="text-center text-[#fbaa19] tracking-[0.18em]">
                                        {driver1.code}
                                    </span>
                                    <span className="text-right truncate pl-2">
                                        {primarySlug ? (
                                            <Link href={`/${primarySlug}`} className="hover:text-[#fbaa19] transition-colors">
                                                {primaryName}
                                            </Link>
                                        ) : (
                                            <span className={primaryContract ? 'text-white' : 'text-white/40'}>
                                                {primaryName}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* ROW 2: (vazio) | Piloto 2 (ex: HAM) | Colega de Box */}
                                <div
                                    className="grid grid-cols-[1.2fr_0.5fr_1.3fr] items-center px-3 py-1.5 text-[11px] sm:text-xs font-black tracking-wider uppercase border-l-4"
                                    style={{
                                        backgroundColor: palette.bg,
                                        color: palette.text,
                                        borderLeftColor: palette.accent,
                                    }}
                                >
                                    <span aria-hidden="true" />
                                    <span className="text-center tracking-[0.18em]">
                                        {driver2.code}
                                    </span>
                                    <span className="text-right truncate pl-2">
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
