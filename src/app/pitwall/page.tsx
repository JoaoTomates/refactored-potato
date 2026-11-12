"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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

const CHAMPION_NAMES: Record<number, string> = {
    1: "G. FARINA",
    2: "J. M. FANGIO",
    3: "A. ASCARI",
    4: "M. HAWTHORN",
    5: "J. BRABHAM",
    6: "P. HILL",
    7: "G. HILL",
    8: "J. CLARK",
    9: "J. SURTEES",
    10: "D. HULME",
};

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
    const [selectedGroup, setSelectedGroup] = useState<number>(1);

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

    // Grupos disponíveis
    const groupIds = useMemo(() => {
        const ids = Array.from(new Set(contracts.map(c => Number(c.group_id)).filter(g => Number.isFinite(g) && g > 0))).sort((a, b) => a - b);
        return ids.length > 0 ? ids : [1, 2, 3, 4];
    }, [contracts]);

    // Inicializa grupo com o do usuário autenticado (ou 1)
    useEffect(() => {
        if (userContract?.group_id) {
            setSelectedGroup(Number(userContract.group_id));
        } else if (groupIds.length > 0 && !groupIds.includes(selectedGroup)) {
            setSelectedGroup(groupIds[0]);
        }
    }, [userContract, groupIds]);

    const activeGroupId = selectedGroup || 1;
    const activeGroupName = CHAMPION_NAMES[activeGroupId] || `GRUPO ${activeGroupId}`;

    const orderedTeams = useMemo(() => {
        return [...F1_TEAMS].sort((a, b) => {
            const rankA = F1_OFFICIAL_ORDER[a.logo] ?? 99;
            const rankB = F1_OFFICIAL_ORDER[b.logo] ?? 99;
            return rankA - rankB;
        });
    }, []);

    // Estrategistas reais alocados no grupo selecionado para preencher a tabela de 25 linhas
    const groupStrategists = useMemo(() => {
        const list: { name: string; slug: string | null; teamName: string; teamLogo: string; teamColor: string; isUser: boolean }[] = [];
        orderedTeams.forEach(team => {
            const teamContracts = contracts.filter(c => c.team_id === team.id && Number(c.group_id || 1) === activeGroupId);
            teamContracts.forEach(tc => {
                const p = unwrapProfile(tc.profiles);
                list.push({
                    name: formatStrategistName(p),
                    slug: normalizeAtSlug(p?.slug),
                    teamName: team.name,
                    teamLogo: team.logo,
                    teamColor: team.color,
                    isUser: Boolean(user && tc.user_id === user.id),
                });
            });
        });
        return list;
    }, [contracts, orderedTeams, activeGroupId, user]);

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

            {/* BARRA SUPERIOR: BOTÃO VOLTAR (canto superior esquerdo) + [ NOME DO GRUPO ] */}
            <header className="relative z-20 w-full px-6 sm:px-10 pt-4 pb-2 flex items-center justify-between border-b border-white/10 bg-black/75 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white/90 bg-white/5 hover:bg-[#fbaa19] hover:text-black border border-white/20 hover:border-[#fbaa19] rounded transition-all shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>VOLTAR</span>
                    </Link>
                    <span className="hidden sm:inline-block text-[10px] text-white/40 tracking-[0.22em] uppercase font-bold">
                        BAEFF1 // PITWALL GRID MATRIX
                    </span>
                </div>

                {/* [ NOME DO GRUPO ] centralizado / destacado */}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                    <span className="text-xs sm:text-sm md:text-base font-black tracking-[0.25em] text-[#fbaa19] uppercase">
                        [ {activeGroupName} ]
                    </span>
                </div>
            </header>

            {/* ÁREA PRINCIPAL: SELETOR LATERAL ESQUERDO + CONTAINERS DUPLICADOS */}
            <div className="relative z-10 w-full min-h-[calc(100vh-60px)] px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-5 items-start justify-start">
                
                {/* SELETOR DE GRUPO (BARRA LATERAL ESQUERDA) */}
                <aside className="w-full lg:w-[130px] shrink-0 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2 shadow-[0_12px_32px_rgba(0,0,0,0.7)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50 text-center pb-1 border-b border-white/10">
                        GRUPOS
                    </span>
                    <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
                        {groupIds.map(gid => {
                            const isSelected = selectedGroup === gid;
                            const gName = CHAMPION_NAMES[gid] || `G${gid}`;
                            return (
                                <button
                                    key={gid}
                                    type="button"
                                    onClick={() => setSelectedGroup(gid)}
                                    className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded transition-all text-center border ${
                                        isSelected
                                            ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_14px_rgba(251,170,25,0.45)]'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    <span className="block text-[11px] font-black">GRUPO {gid}</span>
                                    <span className="block text-[9px] opacity-80 truncate">{gName}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* WRAPPER COM ZOOM 0.67: CONTAINER 1 (GARAGENS) + CONTAINER 2 DUPLICADO (25 LINHAS ÍMPARES/PARES) */}
                <div
                    className="w-full flex-1 flex flex-col xl:flex-row gap-6 items-start"
                    style={{ zoom: '0.67' }}
                >
                    {/* CONTAINER 1: AS 11 EQUIPES E SEUS RESPECTIVOS ESTRATEGISTAS */}
                    <section className="w-full xl:w-[860px] shrink-0 px-6 sm:px-8 py-6 bg-black/65 backdrop-blur-md border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-2xl flex flex-col">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs font-black tracking-widest uppercase text-white/70">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                MATRIZ DE GARAGENS &amp; ASSENTOS F1
                            </span>
                            <span className="text-[#fbaa19] font-bold">11 EQUIPES // 22 COCKPITS</span>
                        </div>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
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
                                        {/* Brilho espelhado */}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.2) 100%)',
                                            }}
                                        />

                                        {/* ROW 1: Equipe | Piloto 1 (LEC) | Estrategista 1 */}
                                        <div
                                            className="relative z-10 grid grid-cols-[1.45fr_0.5fr_1.1fr] items-center min-h-[50px] sm:min-h-[54px] px-4 sm:px-5 py-2.5 sm:py-3 border-b"
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
                                            <div className="flex justify-center">
                                                <span className="inline-flex items-center justify-center bg-black text-white font-black text-xs sm:text-sm tracking-[0.18em] px-2.5 py-0.5 rounded-[2px] -skew-x-12 shadow-[0_2px_6px_rgba(0,0,0,0.6)] border border-white/20">
                                                    <span className="skew-x-12">{driver1.code}</span>
                                                </span>
                                            </div>
                                            <span className="text-right text-sm sm:text-base lg:text-[17px] font-black tracking-wide uppercase truncate pl-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
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

                                        {/* ROW 2: (vazio) | Piloto 2 (HAM) | Estrategista 2 */}
                                        <div className="relative z-10 grid grid-cols-[1.45fr_0.5fr_1.1fr] items-center min-h-[50px] sm:min-h-[54px] px-4 sm:px-5 py-2.5 sm:py-3">
                                            <span aria-hidden="true" />
                                            <div className="flex justify-center">
                                                <span className="inline-flex items-center justify-center bg-black text-white font-black text-xs sm:text-sm tracking-[0.18em] px-2.5 py-0.5 rounded-[2px] -skew-x-12 shadow-[0_2px_6px_rgba(0,0,0,0.6)] border border-white/20">
                                                    <span className="skew-x-12">{driver2.code}</span>
                                                </span>
                                            </div>
                                            <span className="text-right text-sm sm:text-base lg:text-[17px] font-black tracking-wide uppercase truncate pl-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
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
                    </section>

                    {/* CONTAINER 2 DUPLICADO: 25 LINHAS COM ÍMPARES E PARES ALTERNADOS */}
                    <section className="w-full xl:w-[860px] shrink-0 px-6 sm:px-8 py-6 bg-black/65 backdrop-blur-md border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-2xl flex flex-col">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs font-black tracking-widest uppercase text-white/70">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                                TABELA DE CLASSIFICAÇÃO // ÍMPARES &amp; PARES
                            </span>
                            <span className="text-white/40 font-bold">25 LINHAS OPERACIONAIS</span>
                        </div>

                        {/* Cabeçalho da Tabela de 25 Linhas */}
                        <div className="grid grid-cols-[50px_1fr_120px_90px] items-center px-4 py-2 bg-white/5 border border-white/10 rounded-t-lg text-[11px] font-black tracking-widest uppercase text-white/50">
                            <span className="text-left">POS</span>
                            <span className="text-left">ESTRATEGISTA / PILOTO</span>
                            <span className="text-center">ESCUDERIA</span>
                            <span className="text-right">PTS / STATUS</span>
                        </div>

                        {/* As 25 Linhas alternadas entre Ímpares e Pares */}
                        <div className="flex flex-col border-x border-b border-white/10 rounded-b-lg overflow-hidden divide-y divide-white/5">
                            {Array.from({ length: 25 }, (_, i) => {
                                const pos = i + 1;
                                const isOdd = pos % 2 !== 0;
                                const strategist = groupStrategists[i] || null;
                                const defaultPoints = Math.max(0, 250 - (i * 10));

                                return (
                                    <div
                                        key={pos}
                                        className={`grid grid-cols-[50px_1fr_120px_90px] items-center px-4 py-2 text-xs transition-colors ${
                                            isOdd
                                                ? 'bg-black/40 hover:bg-white/[0.04]'
                                                : 'bg-white/[0.02] hover:bg-white/[0.06]'
                                        } ${strategist?.isUser ? 'border-l-4 border-l-[#fbaa19] bg-[#fbaa19]/10' : ''}`}
                                    >
                                        {/* Posição com badge Ímpar/Par */}
                                        <div className="flex items-center gap-1.5 font-black">
                                            <span
                                                className={`inline-flex items-center justify-center w-6 h-5 rounded text-[11px] font-black ${
                                                    pos <= 3
                                                        ? 'bg-[#fbaa19] text-black font-extrabold shadow-[0_0_8px_rgba(251,170,25,0.4)]'
                                                        : isOdd
                                                        ? 'bg-white/10 text-white'
                                                        : 'bg-white/5 text-white/70'
                                                }`}
                                            >
                                                {pos}
                                            </span>
                                        </div>

                                        {/* Nome do Estrategista */}
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            {strategist ? (
                                                strategist.slug ? (
                                                    <Link href={`/${strategist.slug}`} className="font-black uppercase tracking-wide hover:text-[#fbaa19] truncate">
                                                        {strategist.name}
                                                    </Link>
                                                ) : (
                                                    <span className="font-black uppercase tracking-wide text-white truncate">
                                                        {strategist.name}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="font-semibold uppercase tracking-wider text-white/35 italic">
                                                    {isOdd ? `ESTRATEGISTA #${pos} (ÍMPAR)` : `ESTRATEGISTA #${pos} (PAR)`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Escuderia */}
                                        <div className="flex justify-center items-center">
                                            {strategist ? (
                                                <span
                                                    className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border"
                                                    style={{
                                                        color: strategist.teamColor,
                                                        borderColor: `${strategist.teamColor}55`,
                                                        backgroundColor: `${strategist.teamColor}15`,
                                                    }}
                                                >
                                                    {strategist.teamLogo}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                                                    {isOdd ? 'GRID A' : 'GRID B'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Pontos / Status */}
                                        <div className="text-right font-black font-mono">
                                            {strategist ? (
                                                <span className="text-[#fbaa19] tabular-nums">
                                                    {defaultPoints} PTS
                                                </span>
                                            ) : (
                                                <span className="text-white/30 text-[11px] tabular-nums">
                                                    --
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
