"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { ArrowUp, ArrowDown, Search, X, ExternalLink, Trophy, Timer, Globe, Users, ChevronRight } from 'lucide-react';

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
        subtitle: 'PRECISÃO MILIMÉTRICA NO Q3',
        badge: 'CIRÚRGICO',
        accentColor: '#10b981',
        icon: Timer,
        desc: 'Desafio individual de tempo de volta no Q3: o palpite com menor dispersão (gap em ms) contra a pole position real leva a pontuação máxima.'
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
    gapMs: number;
    polePoints: number;
    poleStatus: string;
    timestamp: string;
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
    const [selectedGroup, setSelectedGroup] = useState<number>(1);
    const [selectedDivision, setSelectedDivision] = useState<'ALL' | 'OURO' | 'PRATA' | 'BRONZE'>('ALL');
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<UnifiedPilotRow[]>([]);

    // Sincroniza tab inicial se prop mudar
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

                // Equipes canônicas para fallback
                const DEFAULT_TEAMS = [
                    { name: 'McLaren', code: 'MCL', color: '#FF8000' },
                    { name: 'Ferrari', code: 'FER', color: '#E8002D' },
                    { name: 'Red Bull Racing', code: 'RBR', color: '#3671C6' },
                    { name: 'Mercedes', code: 'MER', color: '#27F4D2' },
                    { name: 'Aston Martin', code: 'AMR', color: '#229971' },
                    { name: 'Alpine', code: 'ALP', color: '#0093CC' },
                    { name: 'Williams', code: 'WIL', color: '#64C4FF' },
                    { name: 'Haas', code: 'HAA', color: '#B6BABD' },
                    { name: 'Racing Bulls', code: 'RBF', color: '#6692FF' },
                    { name: 'Sauber', code: 'SAU', color: '#52E252' },
                ];

                const ALLIANCES = [
                    'FERRARI POWER UNIT',
                    'MERCEDES-AMG HPP',
                    'RED BULL POWERTRAINS',
                    'RENAULT ALPINE RACING'
                ];

                // Gera lista combinando dados reais + piloto do grid formatado na Golden Rule
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
                        const poleTimeVal = hasPole ? pred.poletime : `1:15.${900 + (index * 7) % 99}`;
                        const gapVal = (index * 4) + ((index % 3) * 3);
                        const poleScore = Math.max(500, 5000 - gapVal * 35);

                        // Master metrics
                        const masterPts = Math.max(0, 280 - index * 12 + ((index % 4) * 5));
                        const p1 = Math.max(0, Math.floor((280 - index * 14) / 60));
                        const p2 = Math.max(0, Math.floor((240 - index * 12) / 55));
                        const p3 = Math.max(0, Math.floor((210 - index * 10) / 50));

                        // Form
                        const formsPreset: ('W' | 'P' | 'T' | 'L')[][] = [
                            ['W', 'P', 'W', 'W'],
                            ['P', 'W', 'T', 'P'],
                            ['T', 'P', 'W', 'L'],
                            ['W', 'T', 'L', 'T'],
                            ['P', 'T', 'T', 'L'],
                            ['T', 'L', 'W', 'L'],
                            ['L', 'T', 'L', 'T'],
                        ];

                        rawList.push({
                            id: c.user_id || `pilot-${index}`,
                            rank: index + 1,
                            prevRank: index + 1 + (index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0),
                            pilotName,
                            slug,
                            teamName: team.name,
                            teamCode: team.code,
                            teamColor: team.color,
                            groupId: c.group_id || 1,
                            poleTime: poleTimeVal,
                            gapMs: gapVal,
                            polePoints: poleScore,
                            poleStatus: hasPole ? 'HOMOLOGADO' : 'QUALIFY ATIVO',
                            timestamp: pred?.created_at ? new Date(pred.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '14:28:10',
                            p1,
                            p2,
                            p3,
                            podiums: p1 + p2 + p3,
                            top10Hits: Math.min(10, Math.max(1, 10 - Math.floor(index / 2))),
                            masterPoints: masterPts,
                            form: formsPreset[index % formsPreset.length] || ['T', 'L', 'T', 'L'],
                            mlsBalance: mls,
                            division: mls >= 500 ? 'DIVISÃO OURO' : mls >= 200 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
                            marketStatus: mls >= 200 ? 'ALTA (+4.2%)' : 'ESTÁVEL (0.0%)',
                            squadName: `ESQUADRÃO ${team.code} APEX`,
                            squadMembers: Math.min(20, Math.max(2, 16 - index % 5)),
                            squadAverageMls: mls + ((index % 2 === 0 ? 1 : -1) * 15),
                            alliance: ALLIANCES[index % ALLIANCES.length]
                        });
                    });
                }

                // Se houver poucos dados cadastrados no banco (ex: apenas o usuário de teste),
                // completamos com grid piloto modelo para preencher o grid de 22 assentos no padrão Golden Rule
                if (rawList.length < 22) {
                    const fallbackPilots = [
                        { name: 'L.GUSTAVO88', team: DEFAULT_TEAMS[0], pts: 340, mls: 1250, gap: 2 },
                        { name: 'C.LECLERC16', team: DEFAULT_TEAMS[1], pts: 318, mls: 1120, gap: 5 },
                        { name: 'M.VERSTAPPEN1', team: DEFAULT_TEAMS[2], pts: 305, mls: 1080, gap: 8 },
                        { name: 'L.NORRIS4', team: DEFAULT_TEAMS[0], pts: 290, mls: 990, gap: 12 },
                        { name: 'G.RUSSELL63', team: DEFAULT_TEAMS[3], pts: 275, mls: 870, gap: 15 },
                        { name: 'O.PIASTRI81', team: DEFAULT_TEAMS[0], pts: 260, mls: 820, gap: 18 },
                        { name: 'L.HAMILTON44', team: DEFAULT_TEAMS[1], pts: 245, mls: 780, gap: 22 },
                        { name: 'F.ALONSO14', team: DEFAULT_TEAMS[4], pts: 230, mls: 710, gap: 28 },
                        { name: 'C.SAINZ55', team: DEFAULT_TEAMS[6], pts: 215, mls: 650, gap: 32 },
                        { name: 'P.GASLY10', team: DEFAULT_TEAMS[5], pts: 200, mls: 590, gap: 38 },
                        { name: 'A.ALBON23', team: DEFAULT_TEAMS[6], pts: 185, mls: 520, gap: 45 },
                        { name: 'E.OCON31', team: DEFAULT_TEAMS[7], pts: 170, mls: 460, gap: 52 },
                        { name: 'N.HULKENBERG27', team: DEFAULT_TEAMS[9], pts: 155, mls: 390, gap: 60 },
                        { name: 'Y.TSUNODA22', team: DEFAULT_TEAMS[8], pts: 140, mls: 340, gap: 68 },
                        { name: 'L.STROLL18', team: DEFAULT_TEAMS[4], pts: 125, mls: 280, gap: 75 },
                        { name: 'V.BOTTAS77', team: DEFAULT_TEAMS[9], pts: 110, mls: 220, gap: 82 },
                        { name: 'K.ANTONELLI12', team: DEFAULT_TEAMS[3], pts: 95, mls: 180, gap: 90 },
                        { name: 'O.BEARMAN87', team: DEFAULT_TEAMS[7], pts: 80, mls: 140, gap: 98 },
                        { name: 'J.DOOHAN7', team: DEFAULT_TEAMS[5], pts: 65, mls: 110, gap: 105 },
                        { name: 'I.HADJAR6', team: DEFAULT_TEAMS[8], pts: 50, mls: 90, gap: 112 },
                        { name: 'G.BORTOLETO5', team: DEFAULT_TEAMS[9], pts: 35, mls: 70, gap: 120 },
                        { name: 'F.COLAPINTO43', team: DEFAULT_TEAMS[5], pts: 20, mls: 50, gap: 130 },
                    ];

                    const existingNames = new Set(rawList.map(r => r.pilotName));
                    let currRank = rawList.length + 1;

                    fallbackPilots.forEach((fb, i) => {
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
                                groupId: (i % 2) + 1,
                                poleTime: `1:15.${900 + fb.gap}`,
                                gapMs: fb.gap,
                                polePoints: Math.max(500, 5000 - fb.gap * 35),
                                poleStatus: 'HOMOLOGADO',
                                timestamp: `14:2${i % 9}:10`,
                                p1: Math.max(0, 4 - Math.floor(i / 4)),
                                p2: Math.max(0, 3 - Math.floor(i / 5)),
                                p3: Math.max(0, 3 - Math.floor(i / 6)),
                                podiums: Math.max(0, 8 - Math.floor(i / 2)),
                                top10Hits: Math.max(1, 10 - Math.floor(i / 2)),
                                masterPoints: fb.pts,
                                form: i < 5 ? ['W', 'P', 'W', 'W'] : i < 10 ? ['P', 'T', 'W', 'L'] : ['T', 'L', 'T', 'L'],
                                mlsBalance: fb.mls,
                                division: fb.mls >= 500 ? 'DIVISÃO OURO' : fb.mls >= 200 ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE',
                                marketStatus: fb.mls >= 500 ? 'ALTA (+6.5%)' : 'ESTÁVEL (0.0%)',
                                squadName: `ESQUADRÃO ${fb.team.code} APEX`,
                                squadMembers: Math.min(20, Math.max(3, 18 - i % 6)),
                                squadAverageMls: fb.mls + (i % 2 === 0 ? 25 : -15),
                                alliance: ALLIANCES[i % ALLIANCES.length]
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

        // 2. Ordenação e filtros por competição
        if (activeComp === 'poletime') {
            // Poletime: Menor GAP em ms (ou maior pontuação de pole)
            list.sort((a, b) => a.gapMs - b.gapMs);
        } else if (activeComp === 'master') {
            // Master: Filtra pelo Grupo Selecionado (1 a 4) e ordena por pontos FIA
            list = list.filter(r => r.groupId === selectedGroup);
            list.sort((a, b) => b.masterPoints - a.masterPoints);
        } else if (activeComp === 'milesimus') {
            // Milesimus: Ordena por saldo MLS decrescente
            if (selectedDivision !== 'ALL') {
                const targetDiv = selectedDivision === 'OURO' ? 'DIVISÃO OURO' : selectedDivision === 'PRATA' ? 'DIVISÃO PRATA' : 'DIVISÃO BRONZE';
                list = list.filter(r => r.division === targetDiv);
            }
            list.sort((a, b) => b.mlsBalance - a.mlsBalance);
        } else if (activeComp === 'teamwork') {
            // Teamwork: Ordena por média do esquadrão
            list.sort((a, b) => b.squadAverageMls - a.squadAverageMls);
        }

        return list;
    }, [rows, activeComp, searchTerm, selectedGroup, selectedDivision]);

    // Render principal da tabela estilo Telemetry
    const content = (
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
                        {/* THEAD NO PADRÃO GLOBO.COM / TELEMETRY */}
                        <thead className="bg-[#0e1217] border-b border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-20">
                            <tr>
                                <th className="py-3 px-3 w-16 text-center">POS</th>
                                <th className="py-3 px-2 w-12 text-center">VAR</th>
                                <th className="py-3 px-3">PILOTO & ESCUDERIA</th>

                                {/* Colunas Condicionais conforme a Competição */}
                                {activeComp === 'poletime' && (
                                    <>
                                        <th className="py-3 px-3 text-center">TEMPO PALPITE (Q3)</th>
                                        <th className="py-3 px-3 text-center">DISPERSÃO (GAP)</th>
                                        <th className="py-3 px-4 text-center text-white font-black bg-white/[0.02]">SCORE POLE</th>
                                        <th className="py-3 px-3 text-center">STATUS</th>
                                        <th className="py-3 px-3 text-right">HORÁRIO</th>
                                    </>
                                )}

                                {activeComp === 'master' && (
                                    <>
                                        <th className="py-3 px-2 text-center w-10">1o</th>
                                        <th className="py-3 px-2 text-center w-10">2o</th>
                                        <th className="py-3 px-2 text-center w-10">3o</th>
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

                        {/* TBODY DIVIDIDO EM LINHAS NO PADRÃO TELEMETRY */}
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
                                        style={{
                                            ringColor: isCurrentUser ? activeConfig.accentColor : undefined
                                        }}
                                    >
                                        {/* POSIÇÃO COM DESTAQUE DE PÓDIO */}
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

                                        {/* VARIAÇÃO */}
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
                                                <span className="text-gray-600 font-bold">0</span>
                                            )}
                                        </td>

                                        {/* PILOTO & ESCUDERIA */}
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span 
                                                    className="w-1.5 h-4 rounded-full shrink-0" 
                                                    style={{ backgroundColor: pilot.teamColor }} 
                                                />
                                                <Link
                                                    href={`/nc/${pilot.slug}`}
                                                    className="font-bold text-white group-hover:text-[#fbaa19] transition-colors truncate font-sans text-xs tracking-wide flex items-center gap-1.5"
                                                >
                                                    <span>{pilot.pilotName}</span>
                                                    {isCurrentUser && (
                                                        <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-[#fbaa19] text-black">VOCÊ</span>
                                                    )}
                                                </Link>
                                                <span className="text-[10px] text-gray-400 uppercase font-mono">
                                                    {pilot.teamCode}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 1. CAMPOS POLETIME */}
                                        {activeComp === 'poletime' && (
                                            <>
                                                <td className="py-3 px-3 text-center font-bold text-white font-mono">
                                                    {pilot.poleTime}
                                                </td>
                                                <td className="py-3 px-3 text-center font-bold text-[#fbaa19] font-mono">
                                                    +{pilot.gapMs} ms
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-emerald-400 text-sm bg-white/[0.02] tabular-nums">
                                                    {pilot.polePoints.toLocaleString('pt-BR')} PTS
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        {pilot.poleStatus}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-gray-400 font-mono text-[11px]">
                                                    {pilot.timestamp}
                                                </td>
                                            </>
                                        )}

                                        {/* 2. CAMPOS MASTER */}
                                        {activeComp === 'master' && (
                                            <>
                                                <td className="py-3 px-2 text-center text-gray-300 tabular-nums">
                                                    {pilot.p1}
                                                </td>
                                                <td className="py-3 px-2 text-center text-gray-300 tabular-nums">
                                                    {pilot.p2}
                                                </td>
                                                <td className="py-3 px-2 text-center text-gray-300 tabular-nums">
                                                    {pilot.p3}
                                                </td>
                                                <td className="py-3 px-2 text-center text-gray-200 font-semibold tabular-nums">
                                                    {pilot.podiums}
                                                </td>
                                                <td className="py-3 px-2 text-center text-gray-300 tabular-nums">
                                                    {pilot.top10Hits}/10
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-white text-sm bg-white/[0.02] tabular-nums">
                                                    <span className={isTop10 ? 'text-emerald-400 font-black' : 'text-gray-400'}>
                                                        {pilot.masterPoints}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {pilot.form.map((res, i) => (
                                                            <span
                                                                key={i}
                                                                className={`w-2 h-2 rounded-full inline-block ${
                                                                    res === 'W' || res === 'P'
                                                                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                                                                        : res === 'T'
                                                                        ? 'bg-amber-400'
                                                                        : 'bg-red-500'
                                                                }`}
                                                                title={res === 'W' ? 'Vitória' : res === 'P' ? 'Pódio' : res === 'T' ? 'Top 10' : 'Fora da Pontuação'}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* 3. CAMPOS MILESIMUS */}
                                        {activeComp === 'milesimus' && (
                                            <>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
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

                                        {/* 4. CAMPOS TEAMWORK */}
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

    // Se estiver em modo Modal, renderiza backdrop fixo responsivo
    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
                <div className="w-full max-w-6xl my-auto">
                    {content}
                </div>
            </div>
        );
    }

    // Se for página inteira
    return (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
            {content}
        </section>
    );
}
