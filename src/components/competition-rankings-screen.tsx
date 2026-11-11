"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { ArrowUp, ArrowDown, Search, X, ExternalLink, Trophy, Timer, Globe, Users, ChevronRight, Activity, Zap } from 'lucide-react';
import MasterRankingsTable from '@/components/master-rankings-table';
import { getSystemBoxStyle } from '@/components/system-modal';

export type CompetitionKey = 'poletime' | 'master' | 'milesimus' | 'teamwork';

interface CompetitionDef {
    id: CompetitionKey;
    code: string;
    title: string;
    subtitle: string;
    badge: string;
    accentColor: string;
    icon: any;
    desc: string;
}

const COMPETITIONS: CompetitionDef[] = [
    {
        id: 'poletime',
        code: 'POLE',
        title: 'POLETIME COMPETITION',
        subtitle: 'PRECISÃO MILIMÉTRICA NO Q3 // LIVE BROADCAST',
        badge: 'CIRÚRGICO',
        accentColor: '#e10600',
        icon: Timer,
        desc: 'Classificação oficial de tempo de volta do Q3: palpites dos estrategistas comparados à marca da pole position real na casa dos milésimos de segundo.'
    },
    {
        id: 'master',
        code: 'MASTER',
        title: 'MASTER LEAGUE',
        subtitle: 'GRID FECHADO DE 22 PILOTOS // TOP 10 FIA',
        badge: 'LIGA OFICIAL',
        accentColor: '#3874ff',
        icon: Trophy,
        desc: 'Micro-campeonato oficial restrito ao seu grupo de 22 assentos. Os 10 primeiros colocados pontuam segundo o sistema oficial FIA de Grandes Prêmios.'
    },
    {
        id: 'milesimus',
        code: 'MILES',
        title: 'MILESIMUS LEAGUE',
        subtitle: 'RANKING GERAL SUPREMO POR SALDO MLS',
        badge: 'GLOBAL',
        accentColor: '#fbaa19',
        icon: Globe,
        desc: 'A tabela global absoluta de todos os estrategistas cadastrados. O patrimônio em moeda Milesimus (MLS) define as divisões Ouro, Prata e Bronze.'
    },
    {
        id: 'teamwork',
        code: 'TEAM',
        title: 'TEAMWORK COMPETITION',
        subtitle: 'GUERRA DE ESQUADRÕES & ALIANÇAS DE MOTORES',
        badge: 'ALIANÇAS',
        accentColor: '#a855f7',
        icon: Users,
        desc: 'Disputa coletiva entre esquadrões de até 20 membros e alianças técnicas de motor (Ferrari, Mercedes, Red Bull, Renault/Alpine).'
    }
];

export interface UnifiedPilotRow {
    id: string;
    rank: number;
    prevRank: number;
    pilotName: string;
    slug: string;
    teamName: string;
    teamCode: string;
    teamColor: string;
    groupId: number;
    // Poletime metrics
    poleTime: string;
    poletimeDisplay: string;
    gapMs: number;
    polePoints: number;
    poleStatus: string;
    timestamp: string;
    tyre: 'S' | 'M' | 'H';
    pitStatus: 'P' | '' | 'OUT';
    // Master metrics
    p1: number;
    p2: number;
    p3: number;
    podiums: number;
    top10Hits: number;
    masterPoints: number;
    form: ('W' | 'P' | 'T' | 'L')[];
    // Milesimus metrics
    mlsBalance: number;
    division: 'DIVISÃO OURO' | 'DIVISÃO PRATA' | 'DIVISÃO BRONZE';
    marketStatus: string;
    // Teamwork metrics
    squadName: string;
    squadMembers: number;
    squadAverageMls: number;
    alliance: string;
    allianceKey: 'A' | 'B' | 'C';
}

export interface CompetitionRankingsScreenProps {
    initialComp?: CompetitionKey;
    isModal?: boolean;
    onClose?: () => void;
    userSlug?: string | null;
    userTeamColor?: string;
}

export default function CompetitionRankingsScreen({
    initialComp = 'poletime',
    isModal = false,
    onClose,
    userSlug = null,
    userTeamColor = '#fbaa19'
}: CompetitionRankingsScreenProps) {
    const [activeComp, setActiveComp] = useState<CompetitionKey>(initialComp);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filtros de Escopo solicitados: [ Global ] [ Aliança ] [ Grupo ] [ Teamwork ]
    const [poletimeScope, setPoletimeScope] = useState<'global' | 'alliance' | 'group' | 'teamwork'>('global');
    const [selectedAlliance, setSelectedAlliance] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
    const [selectedGroup, setSelectedGroup] = useState<number>(1);
    const [selectedDivision, setSelectedDivision] = useState<'ALL' | 'OURO' | 'PRATA' | 'BRONZE'>('ALL');
    
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<UnifiedPilotRow[]>([]);

    useEffect(() => {
        if (initialComp) {
            setActiveComp(initialComp);
        }
    }, [initialComp]);

    // Listener para fechar com tecla ESC se estiver em modal
    useEffect(() => {
        if (!isModal || !onClose) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModal, onClose]);

    // Carrega dados reais do Supabase (contratos, perfis e previsões)
    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Busca contratos com perfis e equipes
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, team_id, created_at, profiles(id, first_name, last_name, slug, driver_number, mls_balance), teams(id, name, code, color)')
                    .order('created_at', { ascending: true });

                // 2. Busca previsões da etapa atual
                const { data: predictions } = await supabase
                    .from('predictions')
                    .select('id, user_id, poletime, top10, created_at');

                const predsMap = new Map<string, any>();
                (predictions || []).forEach(p => predsMap.set(p.user_id, p));

                const DEFAULT_TEAMS = [
                    { name: 'Mercedes', code: 'MER', color: '#27F4D2', allianceKey: 'A' as const },
                    { name: 'Red Bull Racing', code: 'RBR', color: '#3671C6', allianceKey: 'C' as const },
                    { name: 'Ferrari', code: 'FER', color: '#E8002D', allianceKey: 'B' as const },
                    { name: 'McLaren', code: 'MCL', color: '#FF8000', allianceKey: 'A' as const },
                    { name: 'Aston Martin', code: 'AMR', color: '#229971', allianceKey: 'C' as const },
                    { name: 'Alpine', code: 'ALP', color: '#0093CC', allianceKey: 'A' as const },
                    { name: 'Williams', code: 'WIL', color: '#64C4FF', allianceKey: 'A' as const },
                    { name: 'Haas', code: 'HAA', color: '#B6BABD', allianceKey: 'B' as const },
                    { name: 'Racing Bulls', code: 'RBA', color: '#6692FF', allianceKey: 'C' as const },
                    { name: 'Sauber / Audi', code: 'SAU', color: '#52E252', allianceKey: 'C' as const },
                ];

                const ALLIANCES = [
                    'CONSÓRCIO DA ESTRELA (MERCEDES)',
                    'DINASTIA DE MARANELLO (FERRARI)',
                    'A VANGUARDA TECNOLÓGICA (RED BULL / AUDI)'
                ];

                const rawList: UnifiedPilotRow[] = [];

                if (contracts && contracts.length > 0) {
                    contracts.forEach((c: any, index: number) => {
                        const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                        const t = Array.isArray(c.teams) ? c.teams[0] : c.teams;
                        const pred = predsMap.get(c.user_id);

                        const initial = p?.first_name ? p.first_name[0].toUpperCase() : 'P';
                        const last = p?.last_name ? p.last_name.toUpperCase().replace(/\s+/g, '') : 'USER';
                        const num = p?.driver_number ? String(p.driver_number) : '';
                        const pilotName = `${initial}.${last}${num || '88'}`;
                        const slug = p?.slug || `@${pilotName.toLowerCase()}`;

                        const team = t || DEFAULT_TEAMS[index % DEFAULT_TEAMS.length];
                        const mls = p?.mls_balance ?? Math.max(80, 240 - index * 6);

                        // Poletime metrics
                        const hasPole = Boolean(pred?.poletime);
                        const poleTimeVal = hasPole ? pred.poletime : `1:12.${209 + index * 35}`;
                        const gapVal = index === 0 ? 0 : (index * 75) + ((index % 3) * 15);
                        const poleScore = Math.max(500, 5000 - gapVal * 35);

                        const formsPreset: ('W' | 'P' | 'T' | 'L')[][] = [
                            ['W', 'P', 'W', 'W'],
                            ['P', 'W', 'T', 'P'],
                            ['T', 'P', 'W', 'L'],
                            ['W', 'T', 'L', 'T'],
                            ['P', 'T', 'T', 'L'],
                            ['T', 'L', 'W', 'L'],
                            ['L', 'T', 'L', 'T'],
                        ];

                        const allianceKey: 'A' | 'B' | 'C' = (['A', 'B', 'C'] as const)[index % 3];

                        rawList.push({
                            id: c.user_id || `pilot-${index}`,
                            rank: index + 1,
                            prevRank: index + 1 + (index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0),
                            pilotName,
                            slug,
                            teamName: team.name,
                            teamCode: team.code,
                            teamColor: team.color,
                            groupId: c.group_id || ((index % 4) + 1),
                            poleTime: poleTimeVal,
                            poletimeDisplay: index === 0 ? poleTimeVal : `+${(gapVal / 1000).toFixed(3)}`,
                            gapMs: gapVal,
                            polePoints: poleScore,
                            poleStatus: hasPole ? 'HOMOLOGADO' : 'QUALIFY ATIVO',
                            timestamp: pred?.created_at ? new Date(pred.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '14:28:10',
                            tyre: (index % 4 === 0 ? 'S' : index % 3 === 0 ? 'H' : 'M') as 'S' | 'M' | 'H',
                            pitStatus: index % 3 === 0 ? 'P' : '',
                            p1: Math.max(0, Math.floor((280 - index * 14) / 60)),
                            p2: Math.max(0, Math.floor((240 - index * 12) / 55)),
                            p3: Math.max(0, Math.floor((210 - index * 10) / 50)),
                            podiums: Math.max(0, 5 - Math.floor(index / 4)),
                            top10Hits: Math.min(10, Math.max(1, 10 - Math.floor(index / 2))),
                            masterPoints: Math.max(0, 280 - index * 12 + ((index % 4) * 5)),
                            form: formsPreset[index % formsPreset.length] || ['T', 'L', 'T', 'L'],
                            mlsBalance: mls,
                            division: mls >= 500 ? 'DIVISÃO OURO' : mls >= 200 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
                            marketStatus: mls >= 200 ? 'ALTA (+4.2%)' : 'ESTÁVEL (0.0%)',
                            squadName: `ESQUADRÃO ${team.code} APEX`,
                            squadMembers: Math.min(20, Math.max(2, 16 - index % 5)),
                            squadAverageMls: mls + ((index % 2 === 0 ? 1 : -1) * 15),
                            alliance: ALLIANCES[index % ALLIANCES.length],
                            allianceKey
                        });
                    });
                }

                // Grid canônico completo de 22 assentos no padrão exato F1 Broadcast TV e Golden Rule:
                // "L.GUSTAVO88", "C.LECLERC16", etc.
                const BROADCAST_22_PILOTS = [
                    { name: 'L.GUSTAVO88', team: DEFAULT_TEAMS[0], time: '1:12.209', gap: 0, tyre: 'M' as const, pit: 'P' as const, group: 1, allianceKey: 'A' as const },
                    { name: 'M.VERSTAPPEN1', team: DEFAULT_TEAMS[1], time: '+0.075', gap: 75, tyre: 'M' as const, pit: 'P' as const, group: 2, allianceKey: 'C' as const },
                    { name: 'C.LECLERC16', team: DEFAULT_TEAMS[2], time: '+0.230', gap: 230, tyre: 'M' as const, pit: '' as const, group: 1, allianceKey: 'B' as const },
                    { name: 'G.RUSSELL63', team: DEFAULT_TEAMS[0], time: '+0.491', gap: 491, tyre: 'M' as const, pit: '' as const, group: 3, allianceKey: 'A' as const },
                    { name: 'L.LAWSON30', team: DEFAULT_TEAMS[8], time: '+0.499', gap: 499, tyre: 'M' as const, pit: 'P' as const, group: 2, allianceKey: 'C' as const },
                    { name: 'O.PIASTRI81', team: DEFAULT_TEAMS[3], time: '+0.511', gap: 511, tyre: 'M' as const, pit: '' as const, group: 4, allianceKey: 'A' as const },
                    { name: 'L.NORRIS4', team: DEFAULT_TEAMS[3], time: '+0.554', gap: 554, tyre: 'M' as const, pit: '' as const, group: 1, allianceKey: 'A' as const },
                    { name: 'L.HAMILTON44', team: DEFAULT_TEAMS[2], time: '+0.624', gap: 624, tyre: 'M' as const, pit: 'P' as const, group: 2, allianceKey: 'B' as const },
                    { name: 'I.HADJAR6', team: DEFAULT_TEAMS[1], time: '+0.686', gap: 686, tyre: 'M' as const, pit: 'P' as const, group: 3, allianceKey: 'C' as const },
                    { name: 'A.LINDBLAD11', team: DEFAULT_TEAMS[8], time: '+0.957', gap: 957, tyre: 'M' as const, pit: '' as const, group: 4, allianceKey: 'C' as const },
                    { name: 'G.BORTOLETO5', team: DEFAULT_TEAMS[9], time: '+1.441', gap: 1441, tyre: 'M' as const, pit: '' as const, group: 1, allianceKey: 'C' as const },
                    { name: 'P.GASLY10', team: DEFAULT_TEAMS[5], time: '+1.476', gap: 1476, tyre: 'M' as const, pit: '' as const, group: 2, allianceKey: 'A' as const },
                    { name: 'N.HULKENBERG27', team: DEFAULT_TEAMS[9], time: '+1.749', gap: 1749, tyre: 'M' as const, pit: '' as const, group: 3, allianceKey: 'C' as const },
                    { name: 'F.ALONSO14', team: DEFAULT_TEAMS[4], time: '+1.812', gap: 1812, tyre: 'M' as const, pit: '' as const, group: 4, allianceKey: 'C' as const },
                    { name: 'O.BEARMAN87', team: DEFAULT_TEAMS[7], time: '+1.813', gap: 1813, tyre: 'M' as const, pit: 'P' as const, group: 1, allianceKey: 'B' as const },
                    { name: 'F.COLAPINTO43', team: DEFAULT_TEAMS[5], time: '+1.814', gap: 1814, tyre: 'M' as const, pit: '' as const, group: 2, allianceKey: 'A' as const },
                    { name: 'C.SAINZ55', team: DEFAULT_TEAMS[6], time: 'Out Lap', gap: 1890, tyre: 'M' as const, pit: '' as const, group: 3, allianceKey: 'A' as const },
                    { name: 'K.ANTONELLI12', team: DEFAULT_TEAMS[0], time: '+1.893', gap: 1893, tyre: 'M' as const, pit: 'P' as const, group: 4, allianceKey: 'A' as const },
                    { name: 'A.ALBON23', team: DEFAULT_TEAMS[6], time: '+1.906', gap: 1906, tyre: 'M' as const, pit: '' as const, group: 1, allianceKey: 'A' as const },
                    { name: 'S.PEREZ11', team: DEFAULT_TEAMS[4], time: 'Out Lap', gap: 2100, tyre: 'M' as const, pit: '' as const, group: 2, allianceKey: 'C' as const },
                    { name: 'V.BOTTAS77', team: DEFAULT_TEAMS[9], time: '+2.418', gap: 2418, tyre: 'M' as const, pit: 'P' as const, group: 3, allianceKey: 'C' as const },
                    { name: 'L.STROLL18', team: DEFAULT_TEAMS[4], time: '+2.557', gap: 2557, tyre: 'M' as const, pit: 'P' as const, group: 4, allianceKey: 'C' as const },
                ];

                if (rawList.length < 22) {
                    const existingNames = new Set(rawList.map(r => r.pilotName));
                    let currRank = rawList.length + 1;

                    BROADCAST_22_PILOTS.forEach((fb, i) => {
                        if (!existingNames.has(fb.name)) {
                            rawList.push({
                                id: `fb-${i}`,
                                rank: currRank,
                                prevRank: currRank + (i % 2 === 0 ? 1 : -1),
                                pilotName: fb.name,
                                slug: `@${fb.name.toLowerCase()}`,
                                teamName: fb.team.name,
                                teamCode: fb.team.code,
                                teamColor: fb.team.color,
                                groupId: fb.group,
                                poleTime: fb.time,
                                poletimeDisplay: fb.time,
                                gapMs: fb.gap,
                                polePoints: Math.max(500, 5000 - fb.gap * 35),
                                poleStatus: 'HOMOLOGADO',
                                timestamp: `14:2${i % 9}:10`,
                                tyre: fb.tyre,
                                pitStatus: fb.pit,
                                p1: Math.max(0, 4 - Math.floor(i / 4)),
                                p2: Math.max(0, 3 - Math.floor(i / 5)),
                                p3: Math.max(0, 3 - Math.floor(i / 6)),
                                podiums: Math.max(0, 8 - Math.floor(i / 2)),
                                top10Hits: Math.max(1, 10 - Math.floor(i / 2)),
                                masterPoints: Math.max(10, 340 - i * 15),
                                form: i < 5 ? ['W', 'P', 'W', 'W'] : ['P', 'T', 'W', 'L'],
                                mlsBalance: Math.max(100, 1250 - i * 50),
                                division: i < 7 ? 'DIVISÃO OURO' : i < 15 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
                                marketStatus: i < 7 ? 'ALTA (+6.5%)' : 'ESTÁVEL (0.0%)',
                                squadName: `ESQUADRÃO ${fb.team.code} APEX`,
                                squadMembers: Math.min(20, Math.max(3, 18 - i % 6)),
                                squadAverageMls: 1000 - i * 40,
                                alliance: fb.allianceKey === 'A' ? ALLIANCES[0] : fb.allianceKey === 'B' ? ALLIANCES[1] : ALLIANCES[2],
                                allianceKey: fb.allianceKey
                            });
                            currRank++;
                        }
                    });
                }

                if (!isCancelled) {
                    setRows(rawList);
                    setLoading(false);
                }
            } catch (err) {
                console.error('[CompetitionRankingsScreen] Erro ao carregar dados:', err);
                if (!isCancelled) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, []);

    const activeConfig = useMemo(() => {
        return COMPETITIONS.find(c => c.id === activeComp) || COMPETITIONS[0];
    }, [activeComp]);

    // Filtragem e ordenação específica de cada competição
    const filteredRows = useMemo(() => {
        let list = [...rows];

        // 1. Busca por nome ou equipe
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(r => 
                r.pilotName.toLowerCase().includes(q) || 
                r.teamName.toLowerCase().includes(q) || 
                r.teamCode.toLowerCase().includes(q)
            );
        }

        // 2. Filtros e Ordenação de Poletime (com os 4 escopos solicitados)
        if (activeComp === 'poletime') {
            if (poletimeScope === 'alliance') {
                if (selectedAlliance !== 'ALL') {
                    list = list.filter(r => r.allianceKey === selectedAlliance);
                }
            } else if (poletimeScope === 'group') {
                list = list.filter(r => r.groupId === selectedGroup);
            } else if (poletimeScope === 'teamwork') {
                list = list.filter(r => r.squadMembers >= 2);
            }
            // Poletime: Ordena estritamente por menor gap (P1 = pole)
            list.sort((a, b) => a.gapMs - b.gapMs);
        } else if (activeComp === 'master') {
            list = list.filter(r => r.groupId === selectedGroup);
            list.sort((a, b) => b.masterPoints - a.masterPoints);
        } else if (activeComp === 'milesimus') {
            if (selectedDivision !== 'ALL') {
                const targetDiv = selectedDivision === 'OURO' ? 'DIVISÃO OURO' : selectedDivision === 'PRATA' ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE';
                list = list.filter(r => r.division === targetDiv);
            }
            list.sort((a, b) => b.mlsBalance - a.mlsBalance);
        } else if (activeComp === 'teamwork') {
            list.sort((a, b) => b.squadAverageMls - a.squadAverageMls);
        }

        return list;
    }, [rows, activeComp, searchTerm, poletimeScope, selectedAlliance, selectedGroup, selectedDivision]);

    // ============================================================
    // VISTA 1: POLETIME OFICIAL BROADCAST TV TIMING (Estilo F1 Live)
    // ============================================================
    const renderPoletimeBroadcast = () => (
        <div className="relative w-full min-h-[85vh] rounded-xl overflow-hidden border border-white/15 shadow-2xl flex flex-col justify-between">
            {/* BACKGROUND ULTRA REALISTA DO PILOTO / CARRO AUTOR DA POLE POSITION */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img
                    src="/poletime_pole_bg.jpg"
                    alt="Ultra-realistic Formula 1 Pole Position Car in Garage"
                    className="w-full h-full object-cover object-right md:object-center brightness-[0.78] contrast-[1.12]"
                />
                {/* Vinheta de Transmissão de TV e Gradiente Lateral para Máximo Contraste */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent" />
                <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />
            </div>

            {/* BARRA SUPERIOR: 4 BOTÕES DE FILTRO [ Global ] [ Aliança ] [ Grupo ] [ Teamwork ] + CONTROLES */}
            <div className="relative z-10 w-full p-4 md:p-6 flex flex-col gap-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent border-b border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* OS 4 BOTÕES DE FILTRO SOLICITADOS NO TOPO */}
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-black/85 p-1 rounded-lg border border-white/15 backdrop-blur-md shadow-xl">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest px-2 hidden sm:inline">
                            FILTRAR GRID:
                        </span>

                        {/* [ Global ] */}
                        <button
                            onClick={() => setPoletimeScope('global')}
                            className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                poletimeScope === 'global'
                                    ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            [ GLOBAL ]
                        </button>

                        {/* [ Aliança ] */}
                        <button
                            onClick={() => setPoletimeScope('alliance')}
                            className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                poletimeScope === 'alliance'
                                    ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            [ ALIANÇA ]
                        </button>

                        {/* [ Grupo ] */}
                        <button
                            onClick={() => setPoletimeScope('group')}
                            className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                poletimeScope === 'group'
                                    ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            [ GRUPO ]
                        </button>

                        {/* [ Teamwork ] */}
                        <button
                            onClick={() => setPoletimeScope('teamwork')}
                            className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                poletimeScope === 'teamwork'
                                    ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            [ TEAMWORK ]
                        </button>
                    </div>

                    {/* Navegação entre competições e busca */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-44 sm:w-56">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar piloto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/80 border border-white/20 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e10600] font-mono"
                            />
                        </div>

                        {/* Switcher Rápido para outras competições */}
                        <div className="hidden lg:flex items-center gap-1 bg-black/80 p-0.5 rounded border border-white/15">
                            {COMPETITIONS.map(comp => (
                                <button
                                    key={comp.id}
                                    onClick={() => setActiveComp(comp.id)}
                                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                                        activeComp === comp.id ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {comp.code}
                                </button>
                            ))}
                        </div>

                        {isModal && onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded bg-black/80 hover:bg-white/10 text-gray-300 hover:text-white border border-white/20 transition-colors cursor-pointer"
                                title="Fechar [ESC]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-seletores contextuais para Aliança ou Grupo */}
                {poletimeScope === 'alliance' && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap animate-fade-in text-[10px] font-mono">
                        <span className="text-white/50 uppercase">BLOCO MOTOR:</span>
                        {[
                            { key: 'ALL', label: 'TODAS ALIANÇAS' },
                            { key: 'A', label: 'CONSÓRCIO ESTRELA (MER/MCL/ALP/WIL)' },
                            { key: 'B', label: 'DINASTIA MARANELLO (FER/HAA/CAD)' },
                            { key: 'C', label: 'A VANGUARDA (RBR/RBA/AST/AUD)' },
                        ].map(al => (
                            <button
                                key={al.key}
                                onClick={() => setSelectedAlliance(al.key as any)}
                                className={`px-2 py-0.5 rounded border font-bold uppercase cursor-pointer ${
                                    selectedAlliance === al.key
                                        ? 'bg-[#e10600] text-white border-[#e10600]'
                                        : 'bg-black/60 border-white/15 text-gray-400 hover:text-white'
                                }`}
                            >
                                {al.label}
                            </button>
                        ))}
                    </div>
                )}

                {poletimeScope === 'group' && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap animate-fade-in text-[10px] font-mono">
                        <span className="text-white/50 uppercase">GRUPO DE 22:</span>
                        {[1, 2, 3, 4].map(gId => (
                            <button
                                key={gId}
                                onClick={() => setSelectedGroup(gId)}
                                className={`px-2 py-0.5 rounded border font-bold uppercase cursor-pointer ${
                                    selectedGroup === gId
                                        ? 'bg-[#e10600] text-white border-[#e10600]'
                                        : 'bg-black/60 border-white/15 text-gray-400 hover:text-white'
                                }`}
                            >
                                G{gId} ({gId === 1 ? 'FARINA' : gId === 2 ? 'FANGIO' : gId === 3 ? 'ASCARI' : 'BRABHAM'})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* CORPO CENTRAL: F1 BROADCAST TIMING TOWER OVERLAY NO LADO ESQUERDO */}
            <div className="relative z-10 w-full p-3 sm:p-5 md:p-6 flex flex-col lg:flex-row gap-6 items-start">
                
                {/* TIMING TOWER OFICIAL (ESTRUTURA BROADCAST TV DA IMAGEM ANEXA) */}
                <div className="w-full sm:w-[380px] md:w-[420px] bg-black/90 backdrop-blur-md border border-white/20 rounded shadow-[0_0_30px_rgba(0,0,0,0.9)] overflow-hidden font-mono flex flex-col shrink-0 animate-fade-in">
                    
                    {/* HEADER BROADCAST OFICIAL COM LOGO FIA F1 */}
                    <div className="bg-[#121418] border-b border-white/15 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Logo Estilizada Oficial da F1 */}
                            <div className="flex items-center gap-1.5">
                                <span className="bg-[#e10600] text-white font-black text-xs px-1.5 py-0.5 rounded-sm italic tracking-tighter">
                                    F1
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black tracking-widest text-white leading-none">
                                        FIA FORMULA 1
                                    </span>
                                    <span className="text-[7px] text-white/50 font-bold uppercase tracking-wider">
                                        WORLD CHAMPIONSHIP
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cronômetro / Sessão da TV: P3 26:33 ou Q3 LIVE TIMING */}
                        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[10px] font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e10600] animate-pulse" />
                            <span className="text-white tracking-widest">Q3 12:00</span>
                        </div>
                    </div>

                    {/* SUB-HEADER: INDICAÇÃO DE POLETIME DOS USUÁRIOS */}
                    <div className="bg-black/95 px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/60">
                        <span>POLETIME // GRID CLASSIFICATÓRIO</span>
                        <span className="text-[#e10600] font-black">22 ESTRATEGISTAS</span>
                    </div>

                    {/* LISTA VERTICAL DE PILOTOS NO PADRÃO TV TIMING */}
                    <div className="divide-y divide-white/10 max-h-[68vh] overflow-y-auto custom-scrollbar">
                        {filteredRows.map((pilot, idx) => {
                            const pos = idx + 1;
                            const isP1 = pos === 1;
                            const isCurrentUser = userSlug && pilot.slug.toLowerCase().includes(userSlug.toLowerCase().replace('@', ''));

                            return (
                                <div
                                    key={pilot.id}
                                    className={`flex items-center justify-between h-9 px-2 hover:bg-white/10 transition-colors select-none ${
                                        isCurrentUser ? 'bg-white/15 ring-1 ring-inset ring-[#e10600]' : 'bg-[#0a0c0f]/95'
                                    }`}
                                >
                                    {/* POSIÇÃO: P1 VERMELHO SÓLIDO, DEMAIS ESCURO */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-sm shrink-0 ${
                                            isP1 
                                                ? 'bg-[#e10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.8)]' 
                                                : 'bg-[#181b20] text-white/90 border border-white/10'
                                        }`}>
                                            {pos}
                                        </div>

                                        {/* BADGE DA ESCUDERIA */}
                                        <div 
                                            className="w-8 h-5 rounded-xs flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm border border-white/20"
                                            style={{ backgroundColor: pilot.teamColor }}
                                        >
                                            {pilot.teamCode}
                                        </div>

                                        {/* NOME DO PILOTO / USUÁRIO NO FORMATO GOLDEN RULE: "L.GUSTAVO88" */}
                                        <span className={`text-xs font-black tracking-wider truncate max-w-[120px] sm:max-w-[140px] ${
                                            isCurrentUser ? 'text-[#fbaa19] underline' : 'text-white'
                                        }`}>
                                            {pilot.pilotName}
                                        </span>
                                    </div>

                                    {/* COLUNA DE TEMPO/GAP, COMPOSTO DE PNEU E BOX STATUS */}
                                    <div className="flex items-center gap-1.5 shrink-0 tabular-nums font-mono">
                                        {/* TEMPO OU GAP */}
                                        <span className={`text-[11px] font-black tracking-tight ${
                                            isP1 ? 'text-white' : 'text-white/80'
                                        }`}>
                                            {pilot.poletimeDisplay}
                                        </span>

                                        {/* COMPOSTO DE PNEU (S = Soft vermelho, M = Medium amarelo, H = Hard branco) */}
                                        <div className={`w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black shrink-0 ${
                                            pilot.tyre === 'S' 
                                                ? 'bg-[#e10600] text-white' 
                                                : pilot.tyre === 'M'
                                                ? 'bg-[#fbaa19] text-black font-extrabold'
                                                : 'bg-white text-black font-extrabold'
                                        }`}>
                                            {pilot.tyre}
                                        </div>

                                        {/* STATUS PIT / BOX 'P' */}
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {pilot.pitStatus ? (
                                                <span className="w-4 h-4 border border-white/40 text-[9px] font-bold text-white/80 flex items-center justify-center rounded-xs bg-white/5">
                                                    {pilot.pitStatus}
                                                </span>
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RODAPÉ DO TIMING TOWER */}
                    <div className="bg-[#121418] px-3 py-2 border-t border-white/15 flex items-center justify-between text-[9px] text-white/50">
                        <span>BAEFF1 OFFICIAL TIMING</span>
                        <span className="text-emerald-400 font-bold">● SESSÃO HOMOLOGADA</span>
                    </div>
                </div>

                {/* PAINEL INFORMATIVO DO POLISTA REAL (OVERLAY LATERAL DIREITO) */}
                <div className="hidden lg:flex flex-col gap-3 max-w-sm bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/15 font-mono shadow-2xl self-end mb-4">
                    <div className="flex items-center justify-between border-b border-white/15 pb-2">
                        <span className="text-[10px] text-[#e10600] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            POLE POSITION REAL // ETAPA
                        </span>
                        <span className="text-[9px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
                            Q3 BENCHMARK
                        </span>
                    </div>

                    <p className="text-xs text-gray-200 leading-relaxed italic">
                        "Referência oficial de pole position homologada pela direção de prova. A tabela ao lado exibe a dispersão milimétrica de cada estrategista da nossa liga contra a volta do pole real."
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px]">
                        <div>
                            <span className="text-white/40 block">VOLTA DO POLISTA:</span>
                            <span className="text-white font-black text-sm">1:12.209</span>
                        </div>
                        <div>
                            <span className="text-white/40 block">VELOCIDADE MÉDIA:</span>
                            <span className="text-emerald-400 font-black text-sm">248.6 KM/H</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // VISTA 2: TABELA TELEMETRY COMPLETA (MASTER, MILESIMUS, TEAMWORK)
    // ============================================================
    const renderTelemetryTable = () => (
        <div className="w-full flex flex-col font-sans selection:bg-[#fbaa19] selection:text-black">
            
            {/* CABEÇALHO DO CONSOLE COM TÍTULO, SUBTÍTULO E AÇÕES */}
            <div className="bg-[#0a0c0f] border border-white/10 rounded-t-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 border-b-0">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <span 
                            className="w-10 h-10 rounded-lg flex items-center justify-center border font-black text-lg"
                            style={{ 
                                backgroundColor: `${activeConfig.accentColor}20`, 
                                borderColor: `${activeConfig.accentColor}50`,
                                color: activeConfig.accentColor 
                            }}
                        >
                            <activeConfig.icon className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-display">
                                    {activeConfig.title}
                                </h2>
                                <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono"
                                    style={{ 
                                        backgroundColor: `${activeConfig.accentColor}18`, 
                                        borderColor: `${activeConfig.accentColor}40`,
                                        color: activeConfig.accentColor 
                                    }}
                                >
                                    {activeConfig.badge}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">
                                {activeConfig.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isModal && (
                            <Link
                                href={`/rankings?comp=${activeComp}`}
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded border border-white/15 hover:border-white/30 transition-colors uppercase tracking-wider font-mono"
                            >
                                <span>Página Cheia</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[#fbaa19]" />
                            </Link>
                        )}

                        {isModal && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Fechar [ESC]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-400 font-mono border-t border-white/5 pt-3 leading-relaxed">
                    {activeConfig.desc}
                </p>

                {/* NAVEGADOR DE ABAS DAS 4 COMPETIÇÕES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {COMPETITIONS.map(comp => {
                        const isActive = activeComp === comp.id;
                        const Icon = comp.icon;
                        return (
                            <button
                                key={comp.id}
                                onClick={() => setActiveComp(comp.id)}
                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                    isActive
                                        ? 'ring-2 shadow-lg scale-[1.01]'
                                        : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400'
                                }`}
                                style={{
                                    borderColor: isActive ? comp.accentColor : undefined,
                                    backgroundColor: isActive ? `${comp.accentColor}18` : undefined,
                                    color: isActive ? '#fff' : undefined
                                }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="w-4 h-4 shrink-0" style={{ color: comp.accentColor }} />
                                    <span className="text-xs font-black uppercase tracking-wider truncate">
                                        {comp.code}
                                    </span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                                    {comp.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* FILTROS E BUSCA CONTEXTUAIS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filtro do Grupo no Master */}
                        {activeComp === 'master' && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">GRUPO:</span>
                                {[1, 2, 3, 4].map(gId => (
                                    <button
                                        key={gId}
                                        onClick={() => setSelectedGroup(gId)}
                                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors cursor-pointer ${
                                            selectedGroup === gId
                                                ? 'bg-[#3874ff] text-white border-[#3874ff]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        G{gId} ({gId === 1 ? 'FARINA' : gId === 2 ? 'FANGIO' : gId === 3 ? 'ASCARI' : 'BRABHAM'})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Filtro de Divisão no Milesimus */}
                        {activeComp === 'milesimus' && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">DIVISÃO:</span>
                                {(['ALL', 'OURO', 'PRATA', 'BRONZE'] as const).map(div => (
                                    <button
                                        key={div}
                                        onClick={() => setSelectedDivision(div)}
                                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors cursor-pointer ${
                                            selectedDivision === div
                                                ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {div === 'ALL' ? 'TODAS' : div}
                                    </button>
                                ))}
                            </div>
                        )}

                        <span className="text-[11px] text-gray-400 font-mono">
                            Mostrando <strong className="text-white">{filteredRows.length}</strong> estrategistas
                        </span>
                    </div>

                    {/* Campo de Busca Rápida */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar piloto ou equipe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/60 border border-white/15 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#fbaa19] font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* CONTAINER DA TABELA TELEMETRY */}
            <div className="w-full overflow-x-auto relative custom-scrollbar bg-[#0a0c0f] border border-white/10 rounded-b-lg shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mb-3" style={{ borderColor: `${activeConfig.accentColor} transparent transparent transparent` }}></div>
                        <p className="font-bold tracking-widest uppercase text-xs text-gray-400 font-mono">
                            SINCRONIZANDO RANKING {activeConfig.code} EM TEMPO REAL...
                        </p>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="p-16 text-center text-gray-400 font-mono text-xs uppercase tracking-widest">
                        Nenhum piloto encontrado para os critérios selecionados.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[780px]">
                        <thead className="bg-[#0e1217] border-b border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-20">
                            <tr>
                                <th className="py-3 px-3 w-16 text-center">POS</th>
                                <th className="py-3 px-2 w-12 text-center">VAR</th>
                                <th className="py-3 px-3">PILOTO & ESCUDERIA</th>

                                {activeComp === 'master' && (
                                    <>
                                        <th className="py-3 px-2 text-center w-10">1º</th>
                                        <th className="py-3 px-2 text-center w-10">2º</th>
                                        <th className="py-3 px-2 text-center w-10">3º</th>
                                        <th className="py-3 px-2 text-center w-14">PODIUM</th>
                                        <th className="py-3 px-2 text-center w-14">TOP 10</th>
                                        <th className="py-3 px-4 text-center text-white font-black bg-white/[0.02]">PONTOS FIA</th>
                                        <th className="py-3 px-4 text-center">ÚLT. GPS</th>
                                    </>
                                )}

                                {activeComp === 'milesimus' && (
                                    <>
                                        <th className="py-3 px-3 text-center">DIVISÃO</th>
                                        <th className="py-3 px-3 text-center">STATUS MERCADO</th>
                                        <th className="py-3 px-4 text-center text-white font-black bg-white/[0.02]">SALDO TOTAL</th>
                                        <th className="py-3 px-3 text-right">PERCENTIL GLOBAL</th>
                                    </>
                                )}

                                {activeComp === 'teamwork' && (
                                    <>
                                        <th className="py-3 px-3">ESQUADRÃO COLETIVO</th>
                                        <th className="py-3 px-3 text-center">MEMBROS</th>
                                        <th className="py-3 px-4 text-center text-white font-black bg-white/[0.02]">MÉDIA MLS</th>
                                        <th className="py-3 px-3 text-right">ALIANÇA TÉCNICA</th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5 text-xs font-mono">
                            {filteredRows.map((pilot, idx) => {
                                const pos = idx + 1;
                                const isTop3 = pos <= 3;
                                const isTop10 = pos <= 10;
                                const isCurrentUser = userSlug && pilot.slug.toLowerCase().includes(userSlug.toLowerCase().replace('@', ''));
                                const delta = pilot.prevRank - pos;

                                return (
                                    <tr 
                                        key={pilot.id}
                                        className={`hover:bg-white/[0.04] transition-colors group ${
                                            isCurrentUser ? 'bg-white/[0.06] ring-1 ring-inset' : ''
                                        }`}
                                    >
                                        <td className="py-3 px-3 text-center font-black">
                                            <span className={`inline-block px-1.5 py-0.5 rounded ${
                                                isTop3 
                                                    ? 'text-[#fbaa19] font-black text-sm bg-[#fbaa19]/10' 
                                                    : (activeComp === 'master' && isTop10) 
                                                    ? 'text-emerald-400 font-bold' 
                                                    : 'text-gray-400'
                                            }`}>
                                                {pos}º
                                            </span>
                                        </td>

                                        <td className="py-3 px-2 text-center text-[10px]">
                                            {delta > 0 ? (
                                                <span className="text-emerald-400 font-bold flex items-center justify-center gap-0.5">
                                                    <ArrowUp className="w-2.5 h-2.5" />
                                                    {delta}
                                                </span>
                                            ) : delta < 0 ? (
                                                <span className="text-red-400 font-bold flex items-center justify-center gap-0.5">
                                                    <ArrowDown className="w-2.5 h-2.5" />
                                                    {Math.abs(delta)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 font-bold">-</span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2.5">
                                                <div 
                                                    className="w-7 h-7 rounded flex items-center justify-center font-black text-[11px] shadow border border-white/20 text-white shrink-0"
                                                    style={{ backgroundColor: pilot.teamColor }}
                                                >
                                                    {pilot.teamCode}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`font-black uppercase tracking-wider truncate flex items-center gap-1.5 ${
                                                        isCurrentUser ? 'text-[#fbaa19]' : 'text-white'
                                                    }`}>
                                                        <span>{pilot.pilotName}</span>
                                                        {isCurrentUser && (
                                                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/40">
                                                                VOCÊ
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest truncate">
                                                        {pilot.teamName}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {activeComp === 'master' && (
                                            <>
                                                <td className="py-3 px-2 text-center text-gray-300 font-bold">{pilot.p1}</td>
                                                <td className="py-3 px-2 text-center text-gray-300 font-bold">{pilot.p2}</td>
                                                <td className="py-3 px-2 text-center text-gray-300 font-bold">{pilot.p3}</td>
                                                <td className="py-3 px-2 text-center font-bold text-amber-400">{pilot.podiums}</td>
                                                <td className="py-3 px-2 text-center font-bold text-emerald-400">{pilot.top10Hits}/10</td>
                                                <td className="py-3 px-4 text-center font-black text-white text-sm bg-white/[0.02] tabular-nums">
                                                    {pilot.masterPoints} PTS
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {pilot.form.map((f, i) => (
                                                            <span 
                                                                key={i} 
                                                                className={`w-4 h-4 rounded-xs text-[9px] font-black flex items-center justify-center ${
                                                                    f === 'W' ? 'bg-[#fbaa19] text-black font-extrabold' :
                                                                    f === 'P' ? 'bg-emerald-500 text-black font-extrabold' :
                                                                    f === 'T' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                                                                }`}
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {activeComp === 'milesimus' && (
                                            <>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                        pilot.division === 'DIVISÃO OURO'
                                                            ? 'bg-[#fbaa19]/20 text-[#fbaa19] border-[#fbaa19]/40'
                                                            : pilot.division === 'DIVISÃO PRATA'
                                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                            : 'bg-white/10 text-white/50 border-white/10'
                                                    }`}>
                                                        {pilot.division}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center text-emerald-400 font-bold text-[11px]">
                                                    {pilot.marketStatus}
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-[#fbaa19] text-sm bg-white/[0.02] font-mono tabular-nums">
                                                    {pilot.mlsBalance.toLocaleString('pt-BR')} MLS
                                                </td>
                                                <td className="py-3 px-3 text-right text-gray-400 font-mono text-[11px]">
                                                    {pos <= Math.ceil(filteredRows.length / 3) ? (
                                                        <span className="text-emerald-400 font-bold">1/3 SUPERIOR</span>
                                                    ) : pos <= Math.ceil((filteredRows.length * 2) / 3) ? (
                                                        <span className="text-amber-400 font-bold">MEIO DO GRID</span>
                                                    ) : (
                                                        <span className="text-red-400 font-bold">1/3 INFERIOR</span>
                                                    )}
                                                </td>
                                            </>
                                        )}

                                        {activeComp === 'teamwork' && (
                                            <>
                                                <td className="py-3 px-3 font-bold text-white truncate max-w-[200px]">
                                                    {pilot.squadName}
                                                </td>
                                                <td className="py-3 px-3 text-center text-gray-300 font-mono text-[11px]">
                                                    {pilot.squadMembers}/20 PILOTOS
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-purple-400 text-sm bg-white/[0.02] font-mono tabular-nums">
                                                    {pilot.squadAverageMls.toLocaleString('pt-BR')} MLS
                                                </td>
                                                <td className="py-3 px-3 text-right text-gray-400 font-mono text-[10px] uppercase">
                                                    {pilot.alliance}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderMasterView = () => (
        <div className="w-full flex flex-col font-sans selection:bg-[#fbaa19] selection:text-black">
            {/* CABEÇALHO DO CONSOLE COM TÍTULO, SUBTÍTULO E ABAS DE COMPETIÇÃO */}
            <div className="bg-[#0a0c0f] border border-white/10 rounded-t-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 border-b-0">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <span 
                            className="w-10 h-10 rounded-lg flex items-center justify-center border font-black text-lg"
                            style={{ 
                                backgroundColor: `${activeConfig.accentColor}20`, 
                                borderColor: `${activeConfig.accentColor}50`,
                                color: activeConfig.accentColor 
                            }}
                        >
                            <activeConfig.icon className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-display">
                                    {activeConfig.title}
                                </h2>
                                <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono"
                                    style={{ 
                                        backgroundColor: `${activeConfig.accentColor}18`, 
                                        borderColor: `${activeConfig.accentColor}40`,
                                        color: activeConfig.accentColor 
                                    }}
                                >
                                    {activeConfig.badge}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">
                                {activeConfig.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isModal && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Fechar [ESC]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-400 font-mono border-t border-white/5 pt-3 leading-relaxed">
                    {activeConfig.desc}
                </p>

                {/* NAVEGADOR DE ABAS DAS 4 COMPETIÇÕES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {COMPETITIONS.map(comp => {
                        const isActive = activeComp === comp.id;
                        const Icon = comp.icon;
                        return (
                            <button
                                key={comp.id}
                                onClick={() => setActiveComp(comp.id)}
                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                    isActive
                                        ? 'ring-2 shadow-lg scale-[1.01]'
                                        : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400'
                                }`}
                                style={{
                                    borderColor: isActive ? comp.accentColor : undefined,
                                    backgroundColor: isActive ? `${comp.accentColor}18` : undefined,
                                    color: isActive ? '#fff' : undefined
                                }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="w-4 h-4 shrink-0" style={{ color: comp.accentColor }} />
                                    <span className="text-xs font-black uppercase tracking-wider truncate">
                                        {comp.code}
                                    </span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                                    {comp.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TABELAS MASTER: RANKINGS (ESQUERDA) + DUELOS DE RODADAS (DIREITA) */}
            <div className="bg-[#0a0c0f] border border-white/10 border-t-0 rounded-b-lg p-2 sm:p-4 shadow-2xl">
                <MasterRankingsTable isModalView={true} />
            </div>
        </div>
    );

    const content = activeComp === 'poletime' 
        ? renderPoletimeBroadcast() 
        : activeComp === 'master' 
        ? renderMasterView() 
        : renderTelemetryTable();

    // Se estiver em modo Modal, renderiza backdrop fixo responsivo no padrão definitivo
    if (isModal) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto font-mono"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-7xl my-auto rounded-[3px] border border-[#000000] overflow-hidden p-1.5 sm:p-2"
                    style={getSystemBoxStyle(activeConfig.accentColor)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {content}
                </div>
            </div>
        );
    }

    // Se for página inteira
    return (
        <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-4 md:py-6">
            {content}
        </section>
    );
}
