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
    divider: string;
}

const TEAM_BLOCK_PALETTE: Record<string, BlockPalette> = {
    FER: { bg: '#E8002D', text: '#FFFFFF', divider: 'rgba(255,255,255,0.2)' },
    RBR: { bg: '#0600EF', text: '#FFFFFF', divider: 'rgba(255,255,255,0.2)' },
    MCL: { bg: '#FF8000', text: '#080A0D', divider: 'rgba(8,10,13,0.18)' },
    MER: { bg: '#00D2BE', text: '#080A0D', divider: 'rgba(8,10,13,0.18)' },
    WIL: { bg: '#FFFFFF', text: '#080A0D', divider: 'rgba(8,10,13,0.14)' },
    AST: { bg: '#007A33', text: '#FFFFFF', divider: 'rgba(255,255,255,0.2)' },
    ALP: { bg: '#0090FF', text: '#FFFFFF', divider: 'rgba(255,255,255,0.2)' },
    RBA: { bg: '#162E52', text: '#7CC4FF', divider: 'rgba(124,196,255,0.2)' },
    HAA: { bg: '#F3F4F6', text: '#D90429', divider: 'rgba(217,4,41,0.18)' },
    AUD: { bg: '#262A30', text: '#FF3B30', divider: 'rgba(255,59,48,0.22)' },
    CAD: { bg: '#0B0D10', text: '#FFE600', divider: 'rgba(255,230,0,0.2)' },
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
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 min-h-screen flex items-center">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-4 sm:gap-y-5">
                    {orderedTeams.map((team: TeamData) => {
                        const palette = TEAM_BLOCK_PALETTE[team.logo] || {
                            bg: team.color,
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
                                className={`w-full overflow-hidden border transition-transform duration-150 ${
                                    isUsersTeam
                                        ? 'border-[#fbaa19] ring-2 ring-[#fbaa19]/60 shadow-[0_0_24px_rgba(251,170,25,0.35)]'
                                        : 'border-black/80 shadow-[0_8px_22px_rgba(0,0,0,0.65)]'
                                }`}
                                style={{
                                    backgroundColor: palette.bg,
                                    color: palette.text,
                                }}
                            >
                                {/* ROW 1: Nome da Equipe (destaque) | Piloto 1 (ex: LEC) | Estrategista Principal (Usuário) */}
                                <div
                                    className="grid grid-cols-[1.45fr_0.45fr_1.1fr] items-center px-4 sm:px-5 py-3 sm:py-3.5 border-b"
                                    style={{ borderBottomColor: palette.divider }}
                                >
                                    <span
                                        className="text-left text-base sm:text-lg lg:text-xl font-black uppercase tracking-tight leading-none truncate pr-2"
                                        style={{ fontFamily: 'var(--font-montserrat)' }}
                                    >
                                        {team.name}
                                    </span>
                                    <span className="text-center text-sm sm:text-base font-black tracking-[0.18em] uppercase">
                                        {driver1.code}
                                    </span>
                                    <span className="text-right text-xs sm:text-sm font-black tracking-wider uppercase truncate pl-2">
                                        {primarySlug ? (
                                            <Link href={`/${primarySlug}`} className="hover:underline">
                                                {primaryName}
                                            </Link>
                                        ) : (
                                            <span className={primaryContract ? '' : 'opacity-60'}>
                                                {primaryName}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* ROW 2: (vazio) | Piloto 2 (ex: HAM) | Colega de Box */}
                                <div className="grid grid-cols-[1.45fr_0.45fr_1.1fr] items-center px-4 sm:px-5 py-3 sm:py-3.5">
                                    <span aria-hidden="true" />
                                    <span className="text-center text-sm sm:text-base font-black tracking-[0.18em] uppercase">
                                        {driver2.code}
                                    </span>
                                    <span className="text-right text-xs sm:text-sm font-black tracking-wider uppercase truncate pl-2">
                                        {teammateSlug ? (
                                            <Link href={`/${teammateSlug}`} className="hover:underline">
                                                {teammateName}
                                            </Link>
                                        ) : (
                                            <span className={teammateContract ? '' : 'opacity-60'}>
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
