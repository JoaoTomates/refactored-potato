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

interface PredictionRow {
    user_id: string;
    poletime?: string | null;
    top10?: any;
    positions?: any;
    created_at?: string;
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
 * Cores de faixa da referência gráfica (degradê pontilhado / halftone de transição)
 */
const TEAM_BANNER_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
    FER: { bg: '#E10600', text: '#FFFFFF', glow: 'rgba(225,6,0,0.45)' },
    MCL: { bg: '#FF8000', text: '#FFFFFF', glow: 'rgba(255,128,0,0.45)' },
    RBR: { bg: '#3671C6', text: '#FFFFFF', glow: 'rgba(54,113,198,0.45)' },
    MER: { bg: '#00D2BE', text: '#080A0D', glow: 'rgba(0,210,190,0.45)' },
    AST: { bg: '#229971', text: '#FFFFFF', glow: 'rgba(34,153,113,0.45)' },
    ALP: { bg: '#0090FF', text: '#FFFFFF', glow: 'rgba(0,144,255,0.45)' },
    HAA: { bg: '#DA291C', text: '#FFFFFF', glow: 'rgba(218,41,28,0.45)' },
    RBA: { bg: '#4E7CFF', text: '#FFFFFF', glow: 'rgba(78,124,255,0.45)' },
    WIL: { bg: '#005AFF', text: '#FFFFFF', glow: 'rgba(0,90,255,0.45)' },
    AUD: { bg: '#F50537', text: '#FFFFFF', glow: 'rgba(245,5,55,0.45)' },
    CAD: { bg: '#FFB800', text: '#080A0D', glow: 'rgba(255,184,0,0.45)' },
};

/**
 * Ícone lateral vetorial do carro F1 estilizado (side-view)
 */
function F1CarSideIcon({ color = '#FFFFFF', className = '' }: { color?: string; className?: string }) {
    return (
        <svg
            viewBox="0 0 110 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Asa Dianteira */}
            <path d="M2 19.5H16L19 16.5H11L2 19.5Z" fill="#15171B" />
            <path d="M14 18H23L27 15H17L14 18Z" fill={color} />
            {/* Bico / Chassi */}
            <path d="M24 16L38 12.5L52 11.5L67 11L79 9L85 14H24V16Z" fill={color} />
            {/* Halo / Cockpit */}
            <path d="M52 11.5C52 8.5 56 6.5 61 6.5C65 6.5 68 8.5 68 11.5H52Z" fill="#0A0B0E" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <circle cx="58" cy="8.5" r="1.8" fill="#FBAA19" />
            {/* Entrada de ar / Airbox */}
            <path d="M62 6.5L67 2.5H74L71 6.5H62Z" fill={color} />
            {/* Sidepod & Asa Traseira */}
            <path d="M68 11.5L82 11L95 13H102V9.5H92L90 4.5H105V15H85L68 11.5Z" fill={color} />
            <rect x="94" y="3.5" width="12" height="2.5" rx="0.5" fill="#15171B" />
            {/* Pneu Dianteiro */}
            <circle cx="27" cy="18.5" r="7" fill="#0B0C0E" stroke="#2B2D33" strokeWidth="1.5" />
            <circle cx="27" cy="18.5" r="3.2" fill="#1C1E24" />
            <circle cx="27" cy="18.5" r="1.2" fill="#FBAA19" />
            {/* Pneu Traseiro (maior) */}
            <circle cx="86" cy="18" r="7.5" fill="#0B0C0E" stroke="#2B2D33" strokeWidth="1.5" />
            <circle cx="86" cy="18" r="3.4" fill="#1C1E24" />
            <circle cx="86" cy="18" r="1.2" fill="#FBAA19" />
            {/* Linhas aerodinâmicas / assoalho */}
            <line x1="34" y1="21.5" x2="78" y2="21.5" stroke="#15171B" strokeWidth="1.8" />
        </svg>
    );
}

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

/**
 * Separa o nome formatado para estilização estilo broadcast TV (ex: "LEWIS HAMILTON" -> first: "LEWIS", last: "HAMILTON")
 */
function splitDriverDisplayName(formatted: string): { first: string; last: string } {
    if (!formatted || formatted === 'VAGA ABERTA') {
        return { first: 'VAGA', last: 'ABERTA' };
    }
    const clean = formatted.replace(/^@+/, '');
    if (clean.includes('.')) {
        const [f, ...rest] = clean.split('.');
        return { first: f, last: rest.join('.') };
    }
    const parts = clean.split(' ');
    if (parts.length > 1) {
        return { first: parts[0], last: parts.slice(1).join(' ') };
    }
    return { first: clean.slice(0, 1), last: clean.slice(1) };
}

export default function PitwallPage() {
    const { user } = useSupabaseAuth();
    const [contracts, setContracts] = useState<ContractRow[]>([]);
    const [predictions, setPredictions] = useState<PredictionRow[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number>(1);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            try {
                const [contractsRes, predsRes] = await Promise.all([
                    supabase
                        .from('contracts')
                        .select('group_id, team_id, user_id, profiles(slug, first_name, last_name, driver_number)'),
                    supabase
                        .from('predictions')
                        .select('user_id, poletime, top10, positions, created_at')
                        .order('created_at', { ascending: false })
                ]);

                if (active) {
                    if (!contractsRes.error && contractsRes.data) {
                        setContracts(contractsRes.data as ContractRow[]);
                    }
                    if (!predsRes.error && predsRes.data) {
                        setPredictions(predsRes.data as PredictionRow[]);
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar dados em /pitwall:', err);
            }
        };

        fetchData();
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

    // Mapa das últimas previsões indexadas por user_id
    const predictionsMap = useMemo(() => {
        const map = new Map<string, PredictionRow>();
        predictions.forEach(p => {
            if (p.user_id && !map.has(p.user_id)) {
                map.set(p.user_id, p);
            }
        });
        return map;
    }, [predictions]);

    // Lista dos 11 Estrategistas Principais das 11 equipes (Row 1 de cada box) com telemetria Master (Poletime até P3)
    const primaryStrategistsList = useMemo(() => {
        return orderedTeams.map((team, idx) => {
            const rawTeamContracts = contracts.filter(
                c => c.team_id === team.id && Number(c.group_id || 1) === activeGroupId
            );

            // Prioriza o usuário autenticado caso pertença a esta equipe
            const orderedContracts = [...rawTeamContracts].sort((a, b) => {
                if (user && a.user_id === user.id) return -1;
                if (user && b.user_id === user.id) return 1;
                return 0;
            });

            const primaryContract = orderedContracts[0] || null;
            const primaryProfile = unwrapProfile(primaryContract?.profiles || null);
            const strategistName = formatStrategistName(primaryProfile);
            const slug = normalizeAtSlug(primaryProfile?.slug);
            const isUser = Boolean(user && primaryContract?.user_id === user.id);

            // Informações reais ou canônicas de Poletime até P3 (P1, P2, P3 do top 10 master)
            const pred = primaryContract ? predictionsMap.get(primaryContract.user_id) : null;
            const poletime = pred?.poletime || `1:15.${890 + idx * 23}`;

            // P1, P2, P3 extraídos dos palpites do usuário ou do grid da equipe
            const top10Arr = Array.isArray(pred?.top10) ? pred.top10 : [];
            const posArr = Array.isArray(pred?.positions) ? pred.positions : [];
            const p1 = top10Arr[0] || posArr[0] || getRealF1Driver(team.name, 1).code;
            const p2 = top10Arr[1] || posArr[1] || getRealF1Driver(team.name, 2).code;
            const fallbackP3 = ['VER', 'NOR', 'LEC', 'HAM', 'RUS', 'PIA', 'SAI', 'ALO'][idx % 8];
            const p3 = top10Arr[2] || posArr[2] || fallbackP3;

            const bannerTheme = TEAM_BANNER_COLORS[team.logo] || {
                bg: team.color,
                text: '#FFFFFF',
                glow: 'rgba(255,255,255,0.3)',
            };

            return {
                team,
                strategistName,
                slug,
                isUser,
                hasContract: Boolean(primaryContract),
                poletime,
                p1,
                p2,
                p3,
                bannerTheme,
            };
        });
    }, [orderedTeams, contracts, activeGroupId, user, predictionsMap]);

    return (
        <main className="relative w-full min-h-screen overflow-x-hidden bg-[#050401] font-mono">
            {/* Background fixo: Pitlane Helicopter 60m Noir */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/pitwall_helicopter_bg.jpg"
                    alt="The Strategist One Pitwall Helicopter View"
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
                        TS1 // PITWALL GRID MATRIX
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

            {/* ÁREA PRINCIPAL: SELETOR LATERAL ESQUERDO + CONTAINERS */}
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

                {/* WRAPPER COM ZOOM 0.67: CONTAINER 1 (GARAGENS) + CONTAINER 2 (TELEMETRIA FORMATADA COMO A REFERÊNCIA) */}
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

                    {/* CONTAINER 2 (DIREITA): FORMATAÇÃO FIEL À IMAGEM DE REFERÊNCIA */}
                    <section className="w-full xl:w-[940px] shrink-0 px-6 sm:px-8 py-6 bg-black/65 backdrop-blur-md border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-2xl flex flex-col">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs font-black tracking-widest uppercase text-white/70">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                                TELEMETRIA MASTER // ESTRATEGISTA PRINCIPAL &amp; GRID
                            </span>
                            <span className="text-[#fbaa19] font-bold">POLETIME ➔ P1 ➔ P2 ➔ P3</span>
                        </div>

                        {/* Linhas formatadas exatamente como o design de transmissão da imagem */}
                        <div className="flex flex-col gap-2.5">
                            {primaryStrategistsList.map((item, idx) => {
                                const { first, last } = splitDriverDisplayName(item.strategistName);
                                return (
                                    <div
                                        key={item.team.id}
                                        className={`w-full flex items-center min-h-[46px] sm:min-h-[50px] transition-all relative ${
                                            item.isUser ? 'scale-[1.01] z-10' : ''
                                        }`}
                                    >
                                        {/* 1. LADO ESQUERDO (FUNDO ESCURO): NOME DO ESTRATEGISTA PRINCIPAL COM PRIMEIRO NOME NORMAL E SOBRENOME EM NEGRITO PESADO */}
                                        <div className="w-[260px] sm:w-[290px] shrink-0 pr-3 flex items-center justify-start text-white">
                                            <span className="text-xs sm:text-sm font-normal tracking-wide uppercase truncate">
                                                {first}{' '}
                                                <strong className="font-black text-sm sm:text-base tracking-wider text-white">
                                                    {last}
                                                </strong>
                                            </span>
                                        </div>

                                        {/* 2. TRANSIÇÃO PONTILHADA / HALFTONE GRADIENT ENTRE O FUNDO ESCURO E A FAIXA COLORIDA */}
                                        <div
                                            className="w-[70px] sm:w-[90px] h-[38px] sm:h-[42px] shrink-0"
                                            style={{
                                                backgroundImage: `radial-gradient(${item.bannerTheme.bg} 1.5px, transparent 1.5px)`,
                                                backgroundSize: '4px 4px',
                                                maskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
                                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
                                            }}
                                        />

                                        {/* 3. FAIXA COLORIDA HORIZONTAL DA EQUIPE (ESCUDERIA + POLETIME + P1/P2/P3 + CARRO F1) */}
                                        <div
                                            className="flex-1 h-[38px] sm:h-[42px] flex items-center justify-between px-3 sm:px-4 rounded-r-md relative overflow-hidden"
                                            style={{
                                                backgroundColor: item.bannerTheme.bg,
                                                color: item.bannerTheme.text,
                                                boxShadow: `0 3px 12px ${item.bannerTheme.glow}`,
                                            }}
                                        >
                                            {/* Nome da Escuderia em destaque arredondado */}
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider"
                                                    style={{
                                                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                        letterSpacing: '0.04em',
                                                    }}
                                                >
                                                    {item.team.name}
                                                </span>

                                                {/* Mini badge da escuderia para reforçar contraste quando aplicável */}
                                                <span className="hidden sm:inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-black/25 text-white uppercase tracking-widest">
                                                    {item.team.logo}
                                                </span>
                                            </div>

                                            {/* BLOCO CENTRAL: INFORMAÇÕES DE POLETIME ATÉ P3 DO USUÁRIO NA MASTER */}
                                            <div className="flex items-center gap-2 sm:gap-3 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded border border-black/20 text-white font-mono text-[10px] sm:text-xs">
                                                {/* POLETIME */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[#fbaa19] font-black text-[9px] uppercase tracking-wider">POLE</span>
                                                    <span className="font-bold tracking-tight text-white tabular-nums">{item.poletime}</span>
                                                </div>

                                                <span className="text-white/30">|</span>

                                                {/* P1, P2, P3 */}
                                                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-wider">
                                                    <span className="text-amber-300">P1:{item.p1}</span>
                                                    <span className="text-gray-300">P2:{item.p2}</span>
                                                    <span className="text-amber-600">P3:{item.p3}</span>
                                                </div>
                                            </div>

                                            {/* ÍCONE VETORIAL DO CARRO F1 DE PERFIL (SIDE VIEW) NO CANTO DIREITO */}
                                            <div className="w-[58px] sm:w-[76px] h-auto flex items-center justify-end shrink-0 pl-2">
                                                <F1CarSideIcon color="#0D0F12" className="w-full h-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                            </div>
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
