"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export type RankingCompetition = 'master' | 'milesimus' | 'poletime' | 'teamwork' | 'custom';

export interface RankingColumnDef<T = any> {
    id: string;
    header: string;
    widthClass?: string;
    align?: 'left' | 'center' | 'right';
    isHighlight?: boolean;
    render: (item: T, index: number) => React.ReactNode;
}

export interface GeneralRankingItem {
    id?: string;
    rank: number;
    prevRank?: number;
    pilotName: string;
    slug?: string;
    teamName?: string;
    teamCode?: string;
    teamColor?: string;
    isCurrentUser?: boolean;

    // Master stats (Imagem 2)
    p1?: number;
    p2?: number;
    p3?: number;
    podium?: number;
    top10?: number;
    points?: number;
    form?: ('W' | 'P' | 'T' | 'L' | 'D')[];

    // Poletime stats
    poleTime?: string;
    poletimeDisplay?: string;
    gapMs?: number;
    polePoints?: number;
    poleStatus?: string;
    tyre?: 'S' | 'M' | 'H';
    pitStatus?: 'P' | '' | 'OUT';

    // Milesimus stats
    mlsBalance?: number;
    division?: string;
    marketStatus?: string;
    percentile?: string;

    // Teamwork stats
    squadName?: string;
    squadMembers?: number;
    squadAverageMls?: number;
    allianceName?: string;

    // Extra dynamic data
    [key: string]: any;
}

export interface GeneralRankingsTableProps {
    data: GeneralRankingItem[];
    competition?: RankingCompetition;
    columns?: RankingColumnDef<GeneralRankingItem>[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (item: GeneralRankingItem) => void;
}

/**
 * Retorna o estilo de cor para o bloco de posição inspirado na referência esportiva (Imagem 1):
 * - Top 3 (Pódio): Verde esmeralda brilhante
 * - 4º ao 10º (Zona de Pontos BAEF): Verde floresta / zona de classificação
 * - 11º ao 16º: Neutro translúcido
 * - 17º ao 22º (Zona de perigo / rebaixamento): Vermelho carmesim sutil
 */
function getPositionBadgeStyle(rank: number, total: number) {
    if (rank <= 3) {
        return {
            badgeClass: 'bg-[#15803d] text-white font-black shadow-[0_0_8px_rgba(21,128,61,0.45)] border border-emerald-400/50',
            indicatorClass: 'bg-emerald-500',
        };
    }
    if (rank <= 10) {
        return {
            badgeClass: 'bg-[#166534]/90 text-white font-bold border border-emerald-600/40',
            indicatorClass: 'bg-emerald-600',
        };
    }
    if (rank > total - 4 && total >= 16) {
        return {
            badgeClass: 'bg-[#881337] text-white font-bold border border-red-500/40',
            indicatorClass: 'bg-red-500',
        };
    }
    return {
        badgeClass: 'bg-white/10 text-white/90 font-bold border border-white/10',
        indicatorClass: 'bg-gray-500',
    };
}

export default function GeneralRankingsTable({
    data,
    competition = 'master',
    columns,
    loading = false,
    emptyMessage = "Nenhum estrategista registrado.",
    className = '',
    onRowClick,
}: GeneralRankingsTableProps) {
    const totalRows = data.length || 20;

    // Colunas padrão com base na competição ou personalizadas
    const activeColumns: RankingColumnDef<GeneralRankingItem>[] = React.useMemo(() => {
        if (columns && columns.length > 0) return columns;

        if (competition === 'master') {
            // Mantém rigorosamente os títulos das colunas já existentes na imagem 2
            return [
                {
                    id: 'classification',
                    header: 'CLASSIFICAÇÃO',
                    widthClass: 'flex-1 min-w-[210px]',
                    align: 'left',
                    render: (item) => {
                        const delta = (item.prevRank !== undefined) ? item.prevRank - item.rank : 0;
                        const posStyle = getPositionBadgeStyle(item.rank, totalRows);
                        const teamColor = item.teamColor || '#fbaa19';

                        return (
                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* Bloco da Posição no estilo Imagem 1 */}
                                <div
                                    className={`w-6 h-6 rounded-[3px] flex items-center justify-center text-xs shrink-0 ${posStyle.badgeClass}`}
                                >
                                    {item.rank}
                                </div>

                                {/* Variação (↑, ↓ ou 0) */}
                                <div className="w-6 shrink-0 flex items-center justify-center font-mono text-[10px]">
                                    {delta > 0 ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                            <ArrowUp className="w-2.5 h-2.5" />
                                            {delta}
                                        </span>
                                    ) : delta < 0 ? (
                                        <span className="text-red-400 font-bold flex items-center gap-0.5">
                                            <ArrowDown className="w-2.5 h-2.5" />
                                            {Math.abs(delta)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 font-bold flex items-center gap-0.5">
                                            0 <span className="inline-block w-1.5 h-1.5 bg-gray-500 rounded-2xs align-middle" />
                                        </span>
                                    )}
                                </div>

                                {/* Tarja / Badge da Escuderia */}
                                <span
                                    className="w-1.5 h-4 rounded-full shrink-0"
                                    style={{ backgroundColor: teamColor }}
                                    title={item.teamName || item.teamCode}
                                />

                                {/* Nome do Usuário / Piloto (Golden Rule: "L.GUSTAVO88") */}
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    {item.slug ? (
                                        <Link
                                            href={`/nc/${item.slug}`}
                                            className="font-bold text-white hover:text-[#fbaa19] transition-colors truncate font-sans text-xs tracking-wide"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {item.pilotName}
                                        </Link>
                                    ) : (
                                        <span className="font-bold text-white truncate font-sans text-xs tracking-wide">
                                            {item.pilotName}
                                        </span>
                                    )}

                                    {item.teamCode && (
                                        <span className="text-[10px] text-white/60 uppercase font-mono shrink-0">
                                            {item.teamCode}
                                        </span>
                                    )}

                                    {item.isCurrentUser && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/40 font-mono font-bold shrink-0">
                                            VOCÊ
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    },
                },
                {
                    id: 'p1',
                    header: '10',
                    widthClass: 'w-10 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white/90 tabular-nums">{item.p1 ?? 0}</span>,
                },
                {
                    id: 'p2',
                    header: '20',
                    widthClass: 'w-10 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white/90 tabular-nums">{item.p2 ?? 0}</span>,
                },
                {
                    id: 'p3',
                    header: '30',
                    widthClass: 'w-10 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white/90 tabular-nums">{item.p3 ?? 0}</span>,
                },
                {
                    id: 'podium',
                    header: 'PODIUM',
                    widthClass: 'w-14 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white font-semibold tabular-nums">{item.podium ?? 0}</span>,
                },
                {
                    id: 'top10',
                    header: 'TOP 10',
                    widthClass: 'w-14 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white/90 tabular-nums">{item.top10 ?? 0}</span>,
                },
                {
                    id: 'points',
                    header: 'PONTOS',
                    widthClass: 'w-16 text-center shrink-0',
                    align: 'center',
                    isHighlight: true,
                    render: (item) => (
                        <span className="font-black text-white text-sm tabular-nums tracking-wide">
                            {item.points ?? 0}
                        </span>
                    ),
                },
                {
                    id: 'form',
                    header: 'ÚLT. GPS',
                    widthClass: 'w-24 text-center shrink-0',
                    align: 'center',
                    render: (item) => {
                        const formItems = item.form || ['T', 'L', 'T', 'L', 'L'];
                        return (
                            <div className="flex items-center justify-center gap-1">
                                {formItems.map((res, i) => (
                                    <span
                                        key={i}
                                        className={`w-2 h-2 rounded-full inline-block ${
                                            res === 'W' || res === 'P'
                                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                                : res === 'T'
                                                ? 'bg-amber-400'
                                                : res === 'L'
                                                ? 'bg-red-500'
                                                : 'bg-gray-600'
                                        }`}
                                        title={
                                            res === 'W'
                                                ? 'Vitória'
                                                : res === 'P'
                                                ? 'Pódio'
                                                : res === 'T'
                                                ? 'Top 10'
                                                : 'Fora da Pontuação'
                                        }
                                    />
                                ))}
                            </div>
                        );
                    },
                },
            ];
        }

        if (competition === 'poletime') {
            return [
                {
                    id: 'classification',
                    header: 'CLASSIFICAÇÃO',
                    widthClass: 'flex-1 min-w-[210px]',
                    align: 'left',
                    render: (item) => {
                        const posStyle = getPositionBadgeStyle(item.rank, totalRows);
                        const teamColor = item.teamColor || '#e10600';
                        return (
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-[3px] flex items-center justify-center text-xs shrink-0 ${posStyle.badgeClass}`}>
                                    {item.rank}
                                </div>
                                <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    <span className="font-bold text-white truncate font-sans text-xs tracking-wide">
                                        {item.pilotName}
                                    </span>
                                    {item.teamCode && (
                                        <span className="text-[10px] text-white/60 uppercase font-mono shrink-0">
                                            {item.teamCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    },
                },
                {
                    id: 'poleTime',
                    header: 'VOLTA Q3',
                    widthClass: 'w-20 text-center shrink-0',
                    align: 'center',
                    render: (item) => <span className="text-white font-bold tabular-nums">{item.poletimeDisplay || item.poleTime || '-'}</span>,
                },
                {
                    id: 'gap',
                    header: 'GAP',
                    widthClass: 'w-16 text-center shrink-0',
                    align: 'center',
                    render: (item) => (
                        <span className="text-white/80 tabular-nums">
                            {item.gapMs !== undefined ? (item.gapMs === 0 ? 'LEADER' : `+${(item.gapMs / 1000).toFixed(3)}`) : '-'}
                        </span>
                    ),
                },
                {
                    id: 'tyre',
                    header: 'PNEU',
                    widthClass: 'w-12 text-center shrink-0',
                    align: 'center',
                    render: (item) => {
                        const tyre = item.tyre || 'M';
                        const bg = tyre === 'S' ? 'bg-[#e10600] text-white' : tyre === 'M' ? 'bg-[#fbaa19] text-black' : 'bg-white text-black';
                        return (
                            <span className={`w-4 h-4 rounded-xs text-[9px] font-black inline-flex items-center justify-center ${bg}`}>
                                {tyre}
                            </span>
                        );
                    },
                },
                {
                    id: 'status',
                    header: 'STATUS',
                    widthClass: 'w-24 text-center shrink-0',
                    align: 'center',
                    render: (item) => (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">
                            {item.poleStatus || 'HOMOLOGADO'}
                        </span>
                    ),
                },
                {
                    id: 'points',
                    header: 'PONTOS',
                    widthClass: 'w-16 text-center shrink-0',
                    align: 'center',
                    isHighlight: true,
                    render: (item) => (
                        <span className="font-black text-white text-sm tabular-nums">
                            {item.polePoints ?? item.points ?? 0}
                        </span>
                    ),
                },
                {
                    id: 'form',
                    header: 'ÚLT. GPS',
                    widthClass: 'w-20 text-center shrink-0',
                    align: 'center',
                    render: (item) => {
                        const formItems = item.form || ['W', 'P', 'T', 'L'];
                        return (
                            <div className="flex items-center justify-center gap-1">
                                {formItems.map((res, i) => (
                                    <span
                                        key={i}
                                        className={`w-2 h-2 rounded-full inline-block ${
                                            res === 'W' || res === 'P' ? 'bg-emerald-400' : res === 'T' ? 'bg-amber-400' : 'bg-red-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        );
                    },
                },
            ];
        }

        if (competition === 'milesimus') {
            return [
                {
                    id: 'classification',
                    header: 'CLASSIFICAÇÃO',
                    widthClass: 'flex-1 min-w-[210px]',
                    align: 'left',
                    render: (item) => {
                        const posStyle = getPositionBadgeStyle(item.rank, totalRows);
                        const teamColor = item.teamColor || '#fbaa19';
                        return (
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-[3px] flex items-center justify-center text-xs shrink-0 ${posStyle.badgeClass}`}>
                                    {item.rank}
                                </div>
                                <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    <span className="font-bold text-white truncate font-sans text-xs tracking-wide">
                                        {item.pilotName}
                                    </span>
                                    {item.teamCode && (
                                        <span className="text-[10px] text-white/60 uppercase font-mono shrink-0">
                                            {item.teamCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    },
                },
                {
                    id: 'division',
                    header: 'DIVISÃO',
                    widthClass: 'w-28 text-center shrink-0',
                    align: 'center',
                    render: (item) => (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.division === 'DIVISÃO OURO'
                                ? 'bg-[#fbaa19]/20 text-[#fbaa19] border-[#fbaa19]/40'
                                : item.division === 'DIVISÃO PRATA'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-white/10 text-white/70 border-white/10'
                        }`}>
                            {item.division || 'DIVISÃO PRATA'}
                        </span>
                    ),
                },
                {
                    id: 'marketStatus',
                    header: 'MERCADO',
                    widthClass: 'w-28 text-center shrink-0',
                    align: 'center',
                    render: (item) => (
                        <span className="text-[11px] font-bold text-emerald-400">
                            {item.marketStatus || 'ESTÁVEL (0.0%)'}
                        </span>
                    ),
                },
                {
                    id: 'mlsBalance',
                    header: 'SALDO MLS',
                    widthClass: 'w-28 text-center shrink-0',
                    align: 'center',
                    isHighlight: true,
                    render: (item) => (
                        <span className="font-black text-[#fbaa19] text-sm tabular-nums">
                            {(item.mlsBalance ?? item.points ?? 0).toLocaleString('pt-BR')} MLS
                        </span>
                    ),
                },
                {
                    id: 'percentile',
                    header: 'PERCENTIL',
                    widthClass: 'w-28 text-right shrink-0',
                    align: 'right',
                    render: (item) => {
                        const rank = item.rank || 1;
                        const total = totalRows || 20;
                        if (rank <= Math.ceil(total / 3)) {
                            return <span className="text-emerald-400 font-bold text-[10px]">1/3 SUPERIOR</span>;
                        } else if (rank <= Math.ceil((total * 2) / 3)) {
                            return <span className="text-amber-400 font-bold text-[10px]">MEIO DO GRID</span>;
                        }
                        return <span className="text-red-400 font-bold text-[10px]">1/3 INFERIOR</span>;
                    },
                },
                {
                    id: 'form',
                    header: 'ÚLT. GPS',
                    widthClass: 'w-20 text-center shrink-0',
                    align: 'center',
                    render: (item) => {
                        const formItems = item.form || ['W', 'P', 'T', 'L'];
                        return (
                            <div className="flex items-center justify-center gap-1">
                                {formItems.map((res, i) => (
                                    <span
                                        key={i}
                                        className={`w-2 h-2 rounded-full inline-block ${
                                            res === 'W' || res === 'P' ? 'bg-emerald-400' : res === 'T' ? 'bg-amber-400' : 'bg-red-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        );
                    },
                },
            ];
        }

        // Teamwork
        return [
            {
                id: 'classification',
                header: 'CLASSIFICAÇÃO',
                widthClass: 'flex-1 min-w-[210px]',
                align: 'left',
                render: (item) => {
                    const posStyle = getPositionBadgeStyle(item.rank, totalRows);
                    const teamColor = item.teamColor || '#a855f7';
                    return (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-[3px] flex items-center justify-center text-xs shrink-0 ${posStyle.badgeClass}`}>
                                {item.rank}
                            </div>
                            <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="font-bold text-white truncate font-sans text-xs tracking-wide">
                                    {item.pilotName}
                                </span>
                                {item.teamCode && (
                                    <span className="text-[10px] text-white/60 uppercase font-mono shrink-0">
                                        {item.teamCode}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'squad',
                header: 'ESQUADRÃO',
                widthClass: 'w-36 text-left shrink-0',
                align: 'left',
                render: (item) => (
                    <span className="text-white font-bold text-xs truncate block max-w-[140px]">
                        {item.squadName || `ESQUADRÃO ${item.teamCode || 'VOL'}`}
                    </span>
                ),
            },
            {
                id: 'members',
                header: 'MEMBROS',
                widthClass: 'w-20 text-center shrink-0',
                align: 'center',
                render: (item) => <span className="text-white/80 tabular-nums">{item.squadMembers ?? 12}/20</span>,
            },
            {
                id: 'averageMls',
                header: 'MÉDIA MLS',
                widthClass: 'w-24 text-center shrink-0',
                align: 'center',
                isHighlight: true,
                render: (item) => (
                    <span className="font-black text-white text-sm tabular-nums">
                        {(item.squadAverageMls ?? item.points ?? 0).toLocaleString('pt-BR')}
                    </span>
                ),
            },
            {
                id: 'alliance',
                header: 'ALIANÇA TÉCNICA',
                widthClass: 'w-28 text-right shrink-0',
                align: 'right',
                render: (item) => (
                    <span className="text-white/70 text-[10px] font-mono truncate">
                        {item.allianceName || (typeof item.alliance === 'string' ? item.alliance : item.alliance?.name) || 'FERRARI PWR'}
                    </span>
                ),
            },
            {
                id: 'form',
                header: 'ÚLT. GPS',
                widthClass: 'w-20 text-center shrink-0',
                align: 'center',
                render: (item) => {
                    const formItems = item.form || ['W', 'P', 'T', 'L'];
                    return (
                        <div className="flex items-center justify-center gap-1">
                            {formItems.map((res, i) => (
                                <span
                                    key={i}
                                    className={`w-2 h-2 rounded-full inline-block ${
                                        res === 'W' || res === 'P' ? 'bg-emerald-400' : res === 'T' ? 'bg-amber-400' : 'bg-red-500'
                                    }`}
                                />
                            ))}
                        </div>
                    );
                },
            },
        ];
    }, [competition, columns, totalRows]);

    return (
        <div className={`w-full overflow-x-auto rounded-[4px] border border-white/10 bg-[#060608]/92 backdrop-blur-md p-2 sm:p-3 custom-scrollbar ${className}`}>
            <div className="min-w-[620px] flex flex-col gap-1.5 font-mono">
                {/* CABEÇALHO DAS COLUNAS (Diagramação do modelo esportivo) */}
                <div className="flex items-center px-3 py-2 text-[10px] font-bold text-white/70 uppercase tracking-wider border-b border-white/10 mb-0.5">
                    {activeColumns.map((col) => (
                        <div
                            key={col.id}
                            className={`${col.widthClass} ${
                                col.align === 'center'
                                    ? 'text-center'
                                    : col.align === 'right'
                                    ? 'text-right'
                                    : 'text-left'
                            } ${col.isHighlight ? 'text-white font-black' : ''}`}
                        >
                            {col.header}
                        </div>
                    ))}
                </div>

                {/* CORPO DA TABELA: ROWS COMO STRIPS INDIVIDUAIS (Diagramação Imagem 1) */}
                {loading ? (
                    <div className="py-12 text-center text-white/50 uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-white animate-spin" />
                        <span>Carregando telemetria oficial...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-12 text-center text-white/50 uppercase tracking-widest text-xs">
                        {emptyMessage}
                    </div>
                ) : (
                    data.map((item, index) => {
                        const teamColor = item.teamColor || '#fbaa19';

                        // Leve degradê no início e fim da Row com a cor da equipe do usuário (conforme solicitado)
                        const rowGradientStyle: React.CSSProperties = {
                            background: `linear-gradient(90deg, ${teamColor}26 0%, rgba(9, 9, 12, 0.94) 15%, rgba(9, 9, 12, 0.94) 85%, ${teamColor}1a 100%)`,
                        };

                        return (
                            <div
                                key={item.id || item.rank || index}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`relative flex items-center px-3 py-2 rounded-[3px] border border-white/[0.08] hover:border-white/25 hover:brightness-110 transition-all text-xs font-mono group ${
                                    item.isCurrentUser
                                        ? 'ring-1 ring-[#fbaa19]/60 shadow-[0_0_12px_rgba(251,170,25,0.18)]'
                                        : ''
                                } ${onRowClick ? 'cursor-pointer' : ''}`}
                                style={rowGradientStyle}
                            >
                                {/* Pequena linha guia de cor da equipe na ponta esquerda */}
                                <div
                                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r opacity-90"
                                    style={{ backgroundColor: teamColor }}
                                />

                                {activeColumns.map((col) => (
                                    <div
                                        key={col.id}
                                        className={`${col.widthClass} ${
                                            col.align === 'center'
                                                ? 'text-center'
                                                : col.align === 'right'
                                                ? 'text-right'
                                                : 'text-left'
                                        }`}
                                    >
                                        {col.render(item, index)}
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
