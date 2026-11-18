"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { getSystemBoxStyle } from '@/components/system-modal';
import GeneralRankingsTable from '@/components/general-rankings-table';

export interface MasterStanding {
    rank: number;
    prevRank: number;
    pilotName: string;
    slug: string;
    teamName: string;
    teamCode: string;
    teamColor: string;
    p1: number;       // 1º lugar
    p2: number;       // 2º lugar
    p3: number;       // 3º lugar
    podium: number;   // Podium total
    top10: number;    // Top 10 finish
    points: number;   // Pontos acumulados na Master
    form: ('W' | 'P' | 'T' | 'L' | 'D')[]; // Últimos GPs
}

export interface RoundDuel {
    id: string;
    venue: string;
    date: string;
    pilot1: {
        name: string;
        teamCode: string;
        teamColor: string;
        slug: string;
        score: number;
    };
    pilot2: {
        name: string;
        teamCode: string;
        teamColor: string;
        slug: string;
        score: number;
    };
    winnerId?: 1 | 2 | 0; // 0 = empate
}

export interface RoundData {
    roundName: string;
    circuit: string;
    date: string;
    duels: RoundDuel[];
}

const ROUNDS_DATA: RoundData[] = [
    {
        roundName: "EUA GRAND PRIX",
        circuit: "Circuito das Américas · Austin, EUA",
        date: "19/10 · Domingo · 16:00",
        duels: [
            {
                id: "d1",
                venue: "Circuito das Américas · Austin, EUA",
                date: "19/10 · Domingo · 16:00",
                pilot1: { name: "L.GUSTAVO88", teamCode: "MCL", teamColor: "#FF8700", slug: "@lgustavo88", score: 88 },
                pilot2: { name: "M.ROSSI46", teamCode: "MER", teamColor: "#00D2BE", slug: "@mrossi46", score: 74 },
                winnerId: 1
            },
            {
                id: "d2",
                venue: "Circuito das Américas · Austin, EUA",
                date: "19/10 · Domingo · 16:00",
                pilot1: { name: "S.WEBER5", teamCode: "MER", teamColor: "#00D2BE", slug: "@sweber5", score: 81 },
                pilot2: { name: "J.HUNTLEY11", teamCode: "MCL", teamColor: "#FF8700", slug: "@jhuntley11", score: 81 },
                winnerId: 0
            },
            {
                id: "d3",
                venue: "Circuito das Américas · Austin, EUA",
                date: "19/10 · Domingo · 16:00",
                pilot1: { name: "A.MILLER2", teamCode: "ALP", teamColor: "#0090FF", slug: "@amiller2", score: 92 },
                pilot2: { name: "M.HERRERA14", teamCode: "FER", teamColor: "#FF2800", slug: "@mherrera14", score: 71 },
                winnerId: 1
            },
            {
                id: "d4",
                venue: "Circuito das Américas · Austin, EUA",
                date: "19/10 · Domingo · 16:00",
                pilot1: { name: "L.VANDIJK33", teamCode: "AST", teamColor: "#229971", slug: "@lvandijk33", score: 79 },
                pilot2: { name: "C.NAVARRO55", teamCode: "WIL", teamColor: "#005AFF", slug: "@cnavarro55", score: 65 },
                winnerId: 1
            },
            {
                id: "d5",
                venue: "Circuito das Américas · Austin, EUA",
                date: "19/10 · Domingo · 16:00",
                pilot1: { name: "J.BRABSON81", teamCode: "HAA", teamColor: "#B6BABD", slug: "@jbrabson81", score: 68 },
                pilot2: { name: "K.SATO22", teamCode: "AST", teamColor: "#229971", slug: "@ksato22", score: 77 },
                winnerId: 2
            }
        ]
    },
    {
        roundName: "SINGAPURA GRAND PRIX",
        circuit: "Marina Bay Street Circuit · Singapura",
        date: "05/10 · Domingo · 09:00",
        duels: [
            {
                id: "s1",
                venue: "Marina Bay Street Circuit · Singapura",
                date: "05/10 · Domingo · 09:00",
                pilot1: { name: "M.ROSSI46", teamCode: "MER", teamColor: "#00D2BE", slug: "@mrossi46", score: 85 },
                pilot2: { name: "A.MILLER2", teamCode: "ALP", teamColor: "#0090FF", slug: "@amiller2", score: 80 },
                winnerId: 1
            },
            {
                id: "s2",
                venue: "Marina Bay Street Circuit · Singapura",
                date: "05/10 · Domingo · 09:00",
                pilot1: { name: "L.GUSTAVO88", teamCode: "MCL", teamColor: "#FF8700", slug: "@lgustavo88", score: 78 },
                pilot2: { name: "S.WEBER5", teamCode: "MER", teamColor: "#00D2BE", slug: "@sweber5", score: 76 },
                winnerId: 1
            },
            {
                id: "s3",
                venue: "Marina Bay Street Circuit · Singapura",
                date: "05/10 · Domingo · 09:00",
                pilot1: { name: "F.FONTANA43", teamCode: "FER", teamColor: "#FF2800", slug: "@ffontana43", score: 62 },
                pilot2: { name: "L.VANDIJK33", teamCode: "AST", teamColor: "#229971", slug: "@lvandijk33", score: 84 },
                winnerId: 2
            }
        ]
    },
    {
        roundName: "SÃO PAULO GRAND PRIX",
        circuit: "Autódromo de Interlagos · Brasil",
        date: "02/11 · Domingo · 14:00",
        duels: [
            {
                id: "b1",
                venue: "Autódromo de Interlagos · Brasil",
                date: "02/11 · Domingo · 14:00",
                pilot1: { name: "L.GUSTAVO88", teamCode: "MCL", teamColor: "#FF8700", slug: "@lgustavo88", score: 0 },
                pilot2: { name: "S.WEBER5", teamCode: "MER", teamColor: "#00D2BE", slug: "@sweber5", score: 0 },
                winnerId: 0
            },
            {
                id: "b2",
                venue: "Autódromo de Interlagos · Brasil",
                date: "02/11 · Domingo · 14:00",
                pilot1: { name: "M.ROSSI46", teamCode: "MER", teamColor: "#00D2BE", slug: "@mrossi46", score: 0 },
                pilot2: { name: "A.MILLER2", teamCode: "ALP", teamColor: "#0090FF", slug: "@amiller2", score: 0 },
                winnerId: 0
            }
        ]
    }
];

export interface MasterRankingsTableProps {
    isModalView?: boolean;
    className?: string;
}

export default function MasterRankingsTable({ isModalView = false, className = '' }: MasterRankingsTableProps = {}) {
    const [standings, setStandings] = useState<MasterStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoundIdx, setSelectedRoundIdx] = useState(0); // 0 = EUA Grand Prix
    const [showAllRows, setShowAllRows] = useState(false);

    useEffect(() => {
        const fetchMasterStandings = async () => {
            try {
                // Busca contratos com dados do perfil e da equipe
                const { data: contracts, error } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, profiles(id, first_name, last_name, slug, driver_number), teams(id, name, code, color)')
                    .order('created_at', { ascending: true });

                if (error) throw error;

                if (contracts && contracts.length > 0) {
                    // Mapeia e gera estatísticas realistas da competição Master para os usuários
                    const mapped: MasterStanding[] = contracts.map((c: any, index: number) => {
                        const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                        const t = Array.isArray(c.teams) ? c.teams[0] : c.teams;
                        
                        const initial = p?.first_name ? p.first_name[0].toUpperCase() : 'P';
                        const last = p?.last_name ? p.last_name.toUpperCase().replace(/\s+/g, '') : 'USER';
                        const num = p?.driver_number || '';
                        const pilotName = `${initial}.${last}${num}`;

                        // Simulação de pontuação decrescente para a tabela Master com base na temporada
                        const basePoints = Math.max(45, 340 - (index * 9) + ((index % 3) * 4));
                        const p1Count = Math.max(0, Math.floor((340 - (index * 11)) / 75));
                        const p2Count = Math.max(0, Math.floor((300 - (index * 10)) / 65));
                        const p3Count = Math.max(0, Math.floor((270 - (index * 9)) / 55));
                        const podiumCount = p1Count + p2Count + p3Count;
                        const top10Count = Math.min(18, Math.max(3, 18 - Math.floor(index / 1.7)));

                        // Histórico dos últimos 5 GPs: W=Vitória, P=Pódio, T=Top 10, L=Fora da Pontuação
                        const formPresets: ('W' | 'P' | 'T' | 'L' | 'D')[][] = [
                            ['W', 'P', 'W', 'W', 'W'], // 1
                            ['P', 'W', 'W', 'T', 'P'], // 2
                            ['W', 'P', 'T', 'W', 'L'], // 3
                            ['T', 'P', 'L', 'W', 'P'], // 4
                            ['P', 'T', 'W', 'L', 'T'], // 5
                            ['L', 'T', 'T', 'W', 'L'], // 6
                            ['T', 'L', 'T', 'L', 'W'], // 7
                            ['L', 'L', 'T', 'T', 'T'], // 8
                            ['W', 'L', 'L', 'T', 'L'], // 9
                            ['L', 'T', 'L', 'L', 'T'], // 10
                        ];

                        const form = formPresets[index % formPresets.length] || ['T', 'L', 'T', 'L', 'L'];
                        
                        // Variação de posições (-1, 0, +1, +2)
                        const variations = [0, 1, 0, -1, 2, -1, 1, 0, -2, 1];
                        const variation = variations[index % variations.length] || 0;
                        const prevRank = index + 1 + variation;

                        return {
                            rank: index + 1,
                            prevRank: prevRank,
                            pilotName: pilotName,
                            slug: p?.slug || `@${pilotName.toLowerCase()}`,
                            teamName: t?.name || 'The Strategist One',
                            teamCode: t?.code || 'VOL',
                            teamColor: t?.color || '#fbaa19',
                            p1: p1Count,
                            p2: p2Count,
                            p3: p3Count,
                            podium: podiumCount,
                            top10: top10Count,
                            points: basePoints,
                            form: form
                        };
                    });

                    // Ordena por pontos decrescentes
                    mapped.sort((a, b) => b.points - a.points);
                    mapped.forEach((item, idx) => {
                        item.rank = idx + 1;
                    });

                    setStandings(mapped);
                }
            } catch (err) {
                console.error("Erro ao carregar ranking Master:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMasterStandings();
    }, []);

    const activeRound = ROUNDS_DATA[selectedRoundIdx] || ROUNDS_DATA[0];

    const handlePrevRound = () => {
        setSelectedRoundIdx((prev) => (prev > 0 ? prev - 1 : ROUNDS_DATA.length - 1));
    };

    const handleNextRound = () => {
        setSelectedRoundIdx((prev) => (prev < ROUNDS_DATA.length - 1 ? prev + 1 : 0));
    };

    const visibleRows = showAllRows ? standings : standings.slice(0, 10);

    return (
        <section className={`w-full ${isModalView ? 'px-0 max-w-full my-0' : 'px-4 md:px-8 max-w-7xl mx-auto my-8'} font-sans selection:bg-[#fbaa19] selection:text-black animate-fade-in ${className}`}>
            
            {/* GRID PRINCIPAL: 2 COLUNAS (RANKINGS à esquerda e ROUNDS à direita) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ============================================================ */}
                {/* COLUNA ESQUERDA (8 COLS): TABELA RANKINGS (MASTER FANTASY)  */}
                {/* ============================================================ */}
                <div
                    className="lg:col-span-8 border border-[#000000] rounded-[3px] p-5 sm:p-6 flex flex-col justify-between font-mono"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    
                    {/* Header: RANKINGS + Link Regulamento */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-display">
                                RANKINGS
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30 uppercase font-mono">
                                MASTER FINISH
                            </span>
                        </div>

                        <Link
                            href="/playground"
                            className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                            <span>Access Simulator</span>
                            <span className="text-[#fbaa19]">&rarr;</span>
                        </Link>
                    </div>

                    {/* Tabela de Ranking Geral no Padrão Diagramado (Imagem 1 & Imagem 2) */}
                    <GeneralRankingsTable
                        data={visibleRows}
                        competition="master"
                        loading={loading}
                        emptyMessage="No strategists registered in Master league."
                    />

                    {/* Botão para ver tabela completa */}
                    {standings.length > 10 && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
                            <button
                                onClick={() => setShowAllRows(!showAllRows)}
                                className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider py-1.5 px-4 rounded hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                {showAllRows ? '[-] Hide Remaining Strategists' : `[+] View Full Standings (${standings.length} Strategists)`}
                            </button>
                        </div>
                    )}
                </div>

                {/* ============================================================ */}
                {/* COLUNA DIREITA (4 COLS): ROUNDS & CONFRONTOS DE USUÁRIOS     */}
                {/* ============================================================ */}
                <div
                    className="lg:col-span-4 border border-[#000000] rounded-[3px] p-5 sm:p-6 flex flex-col justify-between font-mono"
                    style={getSystemBoxStyle('#fbaa19', 'right')}
                >
                    
                    {/* Header: ROUNDS */}
                    <div className="border-b border-white/10 pb-4 mb-4">
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-display">
                            ROUNDS
                        </h2>
                    </div>

                    {/* Carrossel de Rodadas com Navegação (< EUA Grand Prix >) */}
                    <div className="bg-[#030303] border border-white/10 rounded-[3px] p-3 mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handlePrevRound}
                            className="p-1 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                            title="Rodada anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="text-center min-w-0 px-2">
                            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block truncate">
                                {activeRound.roundName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono block truncate">
                                {activeRound.circuit}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextRound}
                            className="p-1 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                            title="Próxima rodada"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cards de Confrontos Diretos no Estilo Globo.com */}
                    <div className="flex flex-col divide-y divide-white/10">
                        {activeRound.duels.map((duel) => {
                            const p1Won = duel.winnerId === 1;
                            const p2Won = duel.winnerId === 2;

                            return (
                                <div key={duel.id} className="py-4 first:pt-1 last:pb-1 flex flex-col gap-2">
                                    {/* Local e Horário */}
                                    <div className="text-center text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                                        {duel.venue} · {duel.date.split('·')[1]?.trim() || 'Fim de Semana'}
                                    </div>

                                    {/* Placar Frente a Frente dos Usuários do Fantasy */}
                                    <div className="flex items-center justify-between gap-2 px-1">
                                        
                                        {/* Piloto 1 */}
                                        <div className="flex-1 flex items-center justify-end gap-2 text-right min-w-0">
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-bold truncate ${p1Won ? 'text-white' : 'text-gray-300'}`}>
                                                    {duel.pilot1.name}
                                                </span>
                                                <span className="text-[9px] text-gray-500 uppercase font-mono">
                                                    {duel.pilot1.teamCode}
                                                </span>
                                            </div>
                                            <div 
                                                className="w-7 h-7 rounded-sm flex items-center justify-center font-black text-[10px] text-white shrink-0 border border-white/10"
                                                style={{ backgroundColor: duel.pilot1.teamColor }}
                                            >
                                                {duel.pilot1.teamCode}
                                            </div>
                                        </div>

                                        {/* Pontuação Master no GP */}
                                        <div className="flex items-center gap-1.5 px-2 shrink-0">
                                            <span className={`text-base sm:text-lg font-black font-mono tabular-nums ${p1Won ? 'text-[#fbaa19]' : 'text-white'}`}>
                                                {duel.pilot1.score}
                                            </span>
                                            <span className="text-xs text-gray-600 font-bold">&times;</span>
                                            <span className={`text-base sm:text-lg font-black font-mono tabular-nums ${p2Won ? 'text-[#fbaa19]' : 'text-white'}`}>
                                                {duel.pilot2.score}
                                            </span>
                                        </div>

                                        {/* Piloto 2 */}
                                        <div className="flex-1 flex items-center justify-start gap-2 text-left min-w-0">
                                            <div 
                                                className="w-7 h-7 rounded-sm flex items-center justify-center font-black text-[10px] text-white shrink-0 border border-white/10"
                                                style={{ backgroundColor: duel.pilot2.teamColor }}
                                            >
                                                {duel.pilot2.teamCode}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-bold truncate ${p2Won ? 'text-white' : 'text-gray-300'}`}>
                                                    {duel.pilot2.name}
                                                </span>
                                                <span className="text-[9px] text-gray-500 uppercase font-mono">
                                                    {duel.pilot2.teamCode}
                                                </span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Link Saiba Como Foi */}
                                    <div className="text-center pt-1">
                                        <Link 
                                            href="/pitwall"
                                            className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-wider hover:underline inline-block transition-colors"
                                        >
                                            RACE RECAP
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Rodapé Informativo */}
                    <div className="mt-4 pt-3 border-t border-white/10 text-center">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">
                            MASTER LEAGUE · TOP 10 FINISH TS1
                        </span>
                    </div>

                </div>

            </div>

        </section>
    );
}
