"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    F1_DRIVERS,
    F1_MATCHUPS,
    getDriverDetails,
    getF1TeamColor,
} from '@/api/f1-data';
import { PilotAvatar } from '@/components/pilot-avatar';
import { getSystemBoxStyle } from '@/components/system-modal';
import {
    Search,
    X,
    Check,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    ArrowLeftRight,
    GripVertical,
    RotateCcw,
    Sparkles,
} from 'lucide-react';

const TOP_TEAMS = new Set(['McLaren', 'Ferrari', 'Mercedes', 'Red Bull']);

export function DriverPixelPortrait({
    driverName,
    className = '',
    aspectClass = 'aspect-[3/4]',
    showTeamTrim = true,
}: {
    driverName: string;
    className?: string;
    aspectClass?: string;
    showTeamTrim?: boolean;
}) {
    const details = getDriverDetails(driverName);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [driverName, details.avatarUrl]);

    const hasPhoto = Boolean(details.avatarUrl) && !imgError;

    return (
        <div
            className={`relative overflow-hidden bg-[#120d04] select-none ${aspectClass} ${className}`}
            style={{
                borderColor: showTeamTrim ? `${details.teamColor}90` : undefined,
            }}
        >
            {hasPhoto ? (
                <img
                    src={details.avatarUrl!}
                    alt={details.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-top"
                    style={{ imageRendering: 'pixelated' }}
                />
            ) : (
                /* Fallback pixel-halftone + PilotAvatar para pilotos sem retrato customizado ainda */
                <div
                    className="w-full h-full relative flex flex-col items-center justify-center p-2"
                    style={{
                        backgroundColor: '#1b1407',
                        backgroundImage:
                            'radial-gradient(rgba(251,170,25,0.22) 1px, transparent 1px), linear-gradient(180deg, rgba(251,170,25,0.14) 0%, rgba(8,10,13,0.92) 100%)',
                        backgroundSize: '6px 6px, 100% 100%',
                    }}
                >
                    <span
                        className="absolute bottom-1 right-2 font-black italic leading-none pointer-events-none opacity-15"
                        style={{
                            color: details.teamColor,
                            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                            fontFamily: 'Impact, system-ui, sans-serif',
                        }}
                    >
                        {details.num}
                    </span>

                    <div className="w-[72%] aspect-square flex items-center justify-center">
                        <PilotAvatar
                            teamColor={details.teamColor}
                            driverNumber={details.num}
                            variant="neon"
                            size="custom"
                            showHUD={true}
                            showBadge={false}
                            showStatusBlip={false}
                        />
                    </div>
                </div>
            )}

            {/* Barra sutil da cor da equipe no rodapé da moldura */}
            {showTeamTrim && (
                <div
                    className="absolute bottom-0 inset-x-0 h-[3px]"
                    style={{ backgroundColor: details.teamColor }}
                />
            )}
        </div>
    );
}

export function HybridTop10Row({
    index,
    driverName,
    ordinalLabel,
    onOpenPicker,
    onClear,
}: {
    index: number;
    driverName: string;
    ordinalLabel: string;
    onOpenPicker: () => void;
    onClear: () => void;
}) {
    const isPicked = Boolean(driverName);
    const details = isPicked ? getDriverDetails(driverName) : null;

    const podiumBadgeStyle =
        index === 0
            ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
            : index === 1
                ? 'bg-zinc-200 text-black border-zinc-200'
                : index === 2
                    ? 'bg-amber-700 text-white border-amber-600'
                    : isPicked
                        ? 'bg-[#fbaa19]/90 text-black border-[#fbaa19]'
                        : 'bg-white/5 text-[#fbaa19] border-white/10';

    return (
        <div
            onClick={onOpenPicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenPicker();
                }
            }}
            className={`group w-full flex items-stretch rounded-md border transition-all duration-200 cursor-pointer overflow-hidden ${
                isPicked
                    ? 'bg-[#0b0d12]/95 border-[#fbaa19]/70 hover:border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.08)]'
                    : 'bg-black/70 border-white/15 hover:border-[#fbaa19]/60 hover:bg-black/90'
            }`}
            style={{ minHeight: '4.25rem' }}
        >
            <div
                className={`w-14 sm:w-16 flex items-center justify-center font-black uppercase text-sm sm:text-base border-r shrink-0 transition-colors ${podiumBadgeStyle}`}
            >
                {ordinalLabel}
            </div>

            <div className="flex-1 flex items-center justify-between gap-3 px-3 sm:px-4 py-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                    {details ? (
                        <DriverPixelPortrait
                            driverName={details.name}
                            aspectClass="w-11 h-14 rounded-sm border shrink-0"
                            showTeamTrim={true}
                        />
                    ) : (
                        <div className="w-11 h-14 rounded-sm border border-dashed border-white/25 group-hover:border-[#fbaa19]/70 flex items-center justify-center shrink-0 bg-white/[0.02] transition-colors text-white/30 text-xs font-black">
                            +
                        </div>
                    )}

                    {details ? (
                        <div className="flex flex-col leading-tight min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                    className="text-sm sm:text-base font-black uppercase tracking-wide text-white truncate"
                                >
                                    {details.name}
                                </span>
                                <span
                                    className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                                    style={{
                                        backgroundColor: `${details.teamColor}22`,
                                        color: details.teamColor,
                                        border: `1px solid ${details.teamColor}45`,
                                    }}
                                >
                                    #{details.num}
                                </span>
                            </div>
                            <span
                                className="text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate"
                                style={{ color: details.teamColor }}
                            >
                                {details.team}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col leading-tight">
                            <span
                                style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                className="text-sm font-black uppercase tracking-wider text-white/40 group-hover:text-white/75 transition-colors"
                            >
                                SELECIONAR PILOTO
                            </span>
                            <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
                                Abrir Paddock Picker
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isPicked && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            title="Limpar posição"
                            aria-label={`Limpar ${ordinalLabel}`}
                            className="w-7 h-7 rounded border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 text-white/50 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <div
                        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                            isPicked
                                ? 'text-[#fbaa19] group-hover:bg-[#fbaa19]/15'
                                : 'text-white/35 group-hover:text-[#fbaa19]'
                        }`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HybridTop10Grid({
    top10,
    getOrdinal,
    onOpenPicker,
    onClearSlot,
    onSwapSlots,
}: {
    top10: string[];
    getOrdinal: (n: number) => string;
    onOpenPicker: (index: number) => void;
    onClearSlot: (index: number) => void;
    onSwapSlots: (fromIndex: number, toIndex: number) => void;
}) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);

    useEffect(() => {
        if (swapSourceIndex === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSwapSourceIndex(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [swapSourceIndex]);

    const handleCardClick = (idx: number) => {
        if (swapSourceIndex !== null) {
            if (swapSourceIndex !== idx) {
                onSwapSlots(swapSourceIndex, idx);
            }
            setSwapSourceIndex(null);
            return;
        }
        onOpenPicker(idx);
    };

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Barra de Status / Instrução de Drag & Swap */}
            {swapSourceIndex !== null ? (
                <div className="px-3.5 py-2 rounded border border-[#fbaa19] bg-[#fbaa19]/15 flex items-center justify-between gap-2 text-[11px] font-mono animate-fade-in">
                    <span className="text-[#fbaa19] font-black uppercase tracking-wider flex items-center gap-2">
                        <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse" />
                        <span>
                            SWAP ATIVO: CLIQUE EM OUTRA POSIÇÃO PARA TROCAR COM{' '}
                            {getOrdinal(swapSourceIndex + 1)} ({top10[swapSourceIndex]})
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setSwapSourceIndex(null)}
                        className="px-2 py-0.5 rounded bg-black/70 border border-[#fbaa19]/50 text-white hover:text-[#fbaa19] text-[10px] font-bold uppercase cursor-pointer shrink-0"
                    >
                        CANCELAR
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-wider px-1">
                    <span>GRID DE LARGADA // 2 COLUNAS ESCALONADAS</span>
                    <span className="hidden sm:inline">
                        ARRASTE PARA TROCAR · OU USE ⇄ / ↑ ↓ SEM ABRIR O SELETOR
                    </span>
                </div>
            )}

            {/* Grid Escalonado Estilo Largada F1 (Ímpares à esquerda, Pares deslocados à direita) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 md:pb-8">
                {top10.map((driverName, idx) => {
                    const isPicked = Boolean(driverName);
                    const details = isPicked ? getDriverDetails(driverName) : null;
                    const ordinalLabel = getOrdinal(idx + 1);
                    const isEvenSlot = idx % 2 === 1;
                    const isDraggingThis = dragIndex === idx;
                    const isDragTarget = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
                    const isSwapSource = swapSourceIndex === idx;
                    const isSwapTarget = swapSourceIndex !== null && swapSourceIndex !== idx;

                    const podiumBadgeStyle =
                        idx === 0
                            ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                            : idx === 1
                                ? 'bg-zinc-200 text-black border-zinc-200'
                                : idx === 2
                                    ? 'bg-amber-700 text-white border-amber-600'
                                    : isPicked
                                        ? 'bg-[#fbaa19]/90 text-black border-[#fbaa19]'
                                        : 'bg-white/5 text-[#fbaa19] border-white/10';

                    return (
                        <div
                            key={idx}
                            draggable={isPicked}
                            onDragStart={(e) => {
                                if (!isPicked) return;
                                setDragIndex(idx);
                                setSwapSourceIndex(null);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={(e) => {
                                if (dragIndex === null || dragIndex === idx) return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverIndex !== idx) setDragOverIndex(idx);
                            }}
                            onDragLeave={() => {
                                if (dragOverIndex === idx) setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const fromRaw = e.dataTransfer.getData('text/plain');
                                const fromIdx = dragIndex !== null ? dragIndex : parseInt(fromRaw, 10);
                                if (!Number.isNaN(fromIdx) && fromIdx !== idx) {
                                    onSwapSlots(fromIdx, idx);
                                }
                                setDragIndex(null);
                                setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                                setDragIndex(null);
                                setDragOverIndex(null);
                            }}
                            onClick={() => handleCardClick(idx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCardClick(idx);
                                }
                            }}
                            className={`group relative w-full flex items-stretch rounded-md border transition-all duration-200 cursor-pointer overflow-hidden ${
                                isEvenSlot ? 'md:translate-y-6' : ''
                            } ${
                                isSwapSource
                                    ? 'bg-[#fbaa19]/20 border-[#fbaa19] ring-2 ring-[#fbaa19] shadow-[0_0_24px_rgba(251,170,25,0.3)]'
                                    : isDragTarget
                                        ? 'bg-[#fbaa19]/15 border-dashed border-[#fbaa19] ring-2 ring-[#fbaa19] scale-[1.01]'
                                        : isSwapTarget
                                            ? 'bg-[#0e1118] border-[#fbaa19]/60 hover:border-[#fbaa19] hover:bg-[#fbaa19]/10'
                                            : isPicked
                                                ? 'bg-[#0b0d12]/95 border-[#fbaa19]/70 hover:border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.08)]'
                                                : 'bg-black/70 border-white/15 hover:border-[#fbaa19]/60 hover:bg-black/90'
                            } ${isDraggingThis ? 'opacity-45 scale-[0.98]' : ''}`}
                            style={{ minHeight: '4.5rem' }}
                        >
                            {/* Posição Ordinal (1st..10th) + Grip */}
                            <div
                                className={`w-13 sm:w-15 flex flex-col items-center justify-center font-black uppercase border-r shrink-0 transition-colors select-none ${podiumBadgeStyle}`}
                            >
                                <span className="text-sm sm:text-base leading-none">{ordinalLabel}</span>
                                {isPicked && (
                                    <GripVertical className="w-3 h-3 opacity-45 mt-1 hidden sm:block" />
                                )}
                            </div>

                            {/* Conteúdo do Slot (Retrato Pixel Art + Info + Swap Controls) */}
                            <div className="flex-1 flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 min-w-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {details ? (
                                        <DriverPixelPortrait
                                            driverName={details.name}
                                            aspectClass="w-11 h-14 rounded-sm border shrink-0"
                                            showTeamTrim={true}
                                        />
                                    ) : (
                                        <div className="w-11 h-14 rounded-sm border border-dashed border-white/25 group-hover:border-[#fbaa19]/70 flex items-center justify-center shrink-0 bg-white/[0.02] transition-colors text-white/30 text-sm font-black">
                                            +
                                        </div>
                                    )}

                                    {details ? (
                                        <div className="flex flex-col leading-tight min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                                    className="text-sm sm:text-base font-black uppercase tracking-wide text-white truncate"
                                                >
                                                    {details.name}
                                                </span>
                                                <span
                                                    className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                                                    style={{
                                                        backgroundColor: `${details.teamColor}22`,
                                                        color: details.teamColor,
                                                        border: `1px solid ${details.teamColor}45`,
                                                    }}
                                                >
                                                    #{details.num}
                                                </span>
                                            </div>
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate"
                                                style={{ color: details.teamColor }}
                                            >
                                                {details.team}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col leading-tight">
                                            <span
                                                style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                                className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/40 group-hover:text-white/75 transition-colors"
                                            >
                                                {isSwapTarget ? 'MOVER PARA CÁ' : 'SELECIONAR PILOTO'}
                                            </span>
                                            <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                                                {isSwapTarget ? `Ocupar ${ordinalLabel}` : 'Abrir Paddock Picker'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Ações Rápidas sem precisar abrir o seletor */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {isDragTarget || isSwapTarget ? (
                                        <span className="px-2 py-1 rounded bg-[#fbaa19] text-black font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                                            <ArrowLeftRight className="w-3 h-3" />
                                            <span>{isPicked ? 'TROCAR' : 'MOVER'}</span>
                                        </span>
                                    ) : isPicked ? (
                                        <>
                                            {/* Subir / Descer 1 posição */}
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (idx > 0) onSwapSlots(idx, idx - 1);
                                                    }}
                                                    title={`Subir para ${getOrdinal(idx)}`}
                                                    aria-label={`Subir ${details?.name}`}
                                                    className="w-5 h-4 rounded-xs border border-white/10 bg-white/5 hover:bg-[#fbaa19] hover:text-black text-white/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === top10.length - 1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (idx < top10.length - 1) onSwapSlots(idx, idx + 1);
                                                    }}
                                                    title={`Descer para ${getOrdinal(idx + 2)}`}
                                                    aria-label={`Descer ${details?.name}`}
                                                    className="w-5 h-4 rounded-xs border border-white/10 bg-white/5 hover:bg-[#fbaa19] hover:text-black text-white/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Botão de Swap Direto 1-Clique */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSwapSourceIndex((prev) => (prev === idx ? null : idx));
                                                }}
                                                title="Trocar de posição com outro piloto (Swap)"
                                                aria-label={`Trocar ${details?.name} de posição`}
                                                className={`w-7 h-7 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                                    isSwapSource
                                                        ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                        : 'border-white/15 bg-white/5 hover:border-[#fbaa19] hover:text-[#fbaa19] text-white/65'
                                                }`}
                                            >
                                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Limpar slot */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (swapSourceIndex === idx) setSwapSourceIndex(null);
                                                    onClearSlot(idx);
                                                }}
                                                title="Limpar posição"
                                                aria-label={`Limpar ${ordinalLabel}`}
                                                className="w-6 h-7 rounded border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 text-white/45 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-7 h-7 rounded flex items-center justify-center text-white/35 group-hover:text-[#fbaa19] transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function EvoHybridCardGrid({
    evo,
    onOpenPicker,
    onClearSlot,
}: {
    evo: string[];
    onOpenPicker: (index: number) => void;
    onClearSlot: (index: number) => void;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
            {evo.map((driverName, idx) => {
                const isPicked = Boolean(driverName);
                const details = isPicked ? getDriverDetails(driverName) : null;

                return (
                    <div
                        key={idx}
                        onClick={() => onOpenPicker(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onOpenPicker(idx);
                            }
                        }}
                        className={`group relative flex flex-col rounded-md border overflow-hidden transition-all duration-200 cursor-pointer ${
                            isPicked
                                ? 'bg-[#0b0d12] border-[#fbaa19]/75 hover:border-[#fbaa19] shadow-[0_6px_24px_rgba(0,0,0,0.65)] hover:-translate-y-0.5'
                                : 'bg-black/65 border-dashed border-white/25 hover:border-[#fbaa19] hover:bg-[#fbaa19]/[0.04]'
                        }`}
                    >
                        {/* Topo do card: Badge EVO + Ação limpar */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-black/85 border-b border-white/10">
                            <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                    isPicked ? 'text-[#fbaa19]' : 'text-white/50 group-hover:text-[#fbaa19]'
                                }`}
                            >
                                EVO #{idx + 1}
                            </span>

                            {isPicked && details ? (
                                <div className="flex items-center gap-1">
                                    <span
                                        className="text-[10px] font-black px-1.5 py-0.5 rounded leading-none"
                                        style={{
                                            backgroundColor: `${details.teamColor}25`,
                                            color: details.teamColor,
                                        }}
                                    >
                                        #{details.num}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClearSlot(idx);
                                        }}
                                        title={`Remover EVO ${idx + 1}`}
                                        aria-label={`Remover EVO ${idx + 1}`}
                                        className="w-5 h-5 rounded hover:bg-red-500/25 text-white/40 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[9px] font-mono text-white/30 uppercase">VAZIO</span>
                            )}
                        </div>

                        {/* Corpo: Retrato Pixel Art (ou slot vazio com capacete tracejado) */}
                        {details ? (
                            <div className="relative">
                                <DriverPixelPortrait
                                    driverName={details.name}
                                    aspectClass="aspect-[4/4.4]"
                                />
                                {/* Mini Helmet Overlay badge no canto superior esquerdo da carta */}
                                <div className="absolute top-2 left-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                                    <PilotAvatar
                                        teamColor={details.teamColor}
                                        driverNumber={details.num}
                                        variant="minimal"
                                        size="xs"
                                        showHUD={false}
                                        showBadge={false}
                                        showStatusBlip={false}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[4/4.4] flex flex-col items-center justify-center gap-2 p-4 text-center">
                                <div className="w-16 h-16 rounded-full border border-dashed border-[#fbaa19]/35 group-hover:border-[#fbaa19] flex items-center justify-center bg-black/50 transition-colors">
                                    <img
                                        src="/avatar-overlay.svg"
                                        alt=""
                                        className="w-10 h-10 object-contain opacity-25 group-hover:opacity-65 transition-opacity"
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/45 group-hover:text-[#fbaa19] transition-colors">
                                    + ESCOLHER PILOTO
                                </span>
                            </div>
                        )}

                        {/* Rodapé com Nome Canônico + Equipe */}
                        <div className="px-2.5 py-2 bg-[#080a0e] border-t border-white/10 flex flex-col leading-tight">
                            {details ? (
                                <>
                                    <span
                                        style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                        className="text-xs sm:text-sm font-black uppercase tracking-wide text-white truncate"
                                    >
                                        {details.name}
                                    </span>
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-widest truncate mt-0.5"
                                        style={{ color: details.teamColor }}
                                    >
                                        {details.team}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/30">
                                        ESCALADA +{idx + 1}
                                    </span>
                                    <span className="text-[9px] font-mono text-white/20 uppercase mt-0.5">
                                        Clique para abrir
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function H2HHelmetBattleGrid({
    h2h,
    onSelectDriver,
}: {
    h2h: Record<string, string>;
    onSelectDriver: (matchId: string, driverNum: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
            {F1_MATCHUPS.map((match) => {
                const picked = h2h[match.id];
                const teamColor = getF1TeamColor(match.team);

                return (
                    <article
                        key={match.id}
                        className="bg-[#080a0e]/95 border border-white/15 hover:border-[#fbaa19]/60 rounded-md flex flex-col transition-all overflow-hidden shadow-lg"
                    >
                        {/* Cabeçalho da Equipe */}
                        <div className="bg-black/90 px-3.5 py-2 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: teamColor }}
                                />
                                <span className="font-black uppercase tracking-widest text-[11px] text-white">
                                    {match.team}
                                </span>
                            </div>
                            <span
                                className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                    picked
                                        ? 'bg-[#fbaa19]/15 text-[#fbaa19] border border-[#fbaa19]/40 font-bold'
                                        : 'text-white/35 border border-white/10'
                                }`}
                            >
                                {picked ? 'DEFINIDO' : 'DUELO INTERNO'}
                            </span>
                        </div>

                        {/* Confronto dos 2 Pilotos frente a frente */}
                        <div className="relative grid grid-cols-2 divide-x divide-white/10">
                            {[match.d1, match.d2].map((driver, sideIdx) => {
                                const isPicked = picked === driver.num;
                                const hasOtherPicked = Boolean(picked) && !isPicked;
                                const isRightSide = sideIdx === 1;

                                return (
                                    <button
                                        key={driver.num}
                                        type="button"
                                        onClick={() => onSelectDriver(match.id, driver.num)}
                                        className={`group relative flex flex-col items-center justify-center gap-2.5 px-3 pt-7 pb-3.5 transition-all cursor-pointer ${
                                            isPicked
                                                ? 'bg-[#fbaa19]/15 shadow-[inset_0_0_25px_rgba(251,170,25,0.16)]'
                                                : hasOtherPicked
                                                    ? 'bg-black/40 opacity-55 hover:opacity-100 hover:bg-white/[0.03]'
                                                    : 'bg-black/30 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {/* Faixa ativa superior */}
                                        {isPicked && (
                                            <div className="absolute top-0 inset-x-0 h-[2px] bg-[#fbaa19]" />
                                        )}

                                        {/* Indicador de T-Cam (Preta vs Amarela) */}
                                        <span
                                            className="absolute top-2 left-2 text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10 bg-black/70 text-white/55 flex items-center gap-1"
                                            title={isRightSide ? 'T-Cam Amarela' : 'T-Cam Preta'}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor: isRightSide ? '#fbaa19' : '#52525b',
                                                }}
                                            />
                                            T{sideIdx + 1}
                                        </span>

                                        {isPicked && (
                                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#fbaa19] text-black flex items-center justify-center shadow z-10">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </span>
                                        )}

                                        <div
                                            className={`relative rounded-md overflow-hidden border transition-transform duration-200 ${
                                                isPicked
                                                    ? 'scale-105 border-[#fbaa19] shadow-[0_0_16px_rgba(251,170,25,0.28)]'
                                                    : 'border-white/15 group-hover:scale-105 group-hover:border-[#fbaa19]/60'
                                            }`}
                                        >
                                            <DriverPixelPortrait
                                                driverName={driver.name}
                                                aspectClass="w-20 h-24 sm:w-24 sm:h-28"
                                                showTeamTrim={true}
                                            />
                                        </div>

                                        <div className="flex flex-col items-center leading-tight text-center mt-0.5">
                                            <span
                                                style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                                className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
                                                    isPicked ? 'text-[#fbaa19]' : 'text-white group-hover:text-[#fbaa19]'
                                                }`}
                                            >
                                                {driver.name}
                                            </span>
                                            <span className="text-[10px] font-mono text-white/45 mt-0.5">
                                                CAR #{driver.num}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Badge central VS */}
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#050401] border border-white/25 flex items-center justify-center text-[9px] font-black tracking-wider text-white/75 shadow-lg">
                                VS
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export function PaddockPickerDrawer({
    isOpen,
    mode,
    slotIndex,
    currentList,
    ordinalLabel,
    onSelectDriver,
    onClearSlot,
    onClose,
}: {
    isOpen: boolean;
    mode: 'top10' | 'evo';
    slotIndex: number;
    currentList: string[];
    ordinalLabel: string;
    onSelectDriver: (driverName: string) => void;
    onClearSlot: () => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'available' | 'top' | 'mid'>('all');
    const currentPicked = currentList[slotIndex] || '';
    const [previewDriver, setPreviewDriver] = useState<string>(currentPicked || F1_DRIVERS[0]);

    useEffect(() => {
        if (!isOpen) return;
        const nextPreview =
            currentList[slotIndex] ||
            F1_DRIVERS.find((d) => !currentList.includes(d)) ||
            F1_DRIVERS[0];
        setPreviewDriver(nextPreview);
        setSearch('');
        setFilter('all');
    }, [isOpen, slotIndex, mode, currentList]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const filteredDrivers = useMemo(() => {
        const q = search.trim().toLowerCase();
        return F1_DRIVERS.filter((driverName) => {
            const d = getDriverDetails(driverName);
            const isUsedElsewhere = currentList.includes(driverName) && currentPicked !== driverName;

            if (filter === 'available' && isUsedElsewhere) return false;
            if (filter === 'top' && !TOP_TEAMS.has(d.team)) return false;
            if (filter === 'mid' && TOP_TEAMS.has(d.team)) return false;

            if (!q) return true;
            return (
                d.name.toLowerCase().includes(q) ||
                d.team.toLowerCase().includes(q) ||
                d.num.toLowerCase().includes(q) ||
                d.code.toLowerCase().includes(q)
            );
        });
    }, [search, filter, currentList, currentPicked]);

    if (!isOpen) return null;

    const previewDetails = getDriverDetails(previewDriver);
    const previewUsedIndex = currentList.indexOf(previewDriver);
    const previewIsUsedElsewhere = previewUsedIndex !== -1 && previewUsedIndex !== slotIndex;

    const slotBadgeLabel =
        mode === 'top10' ? `${ordinalLabel} • TOP 10 FINISH` : `EVO #${slotIndex + 1} • ESCALADA`;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in font-mono"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl max-h-[92vh] md:max-h-[86vh] border border-[#000000] rounded-[3px] flex flex-col overflow-hidden text-[calc(0.75rem+0.5px)] sm:text-[calc(0.875rem+0.5px)]"
                style={getSystemBoxStyle('#fbaa19')}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header do Drawer */}
                <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2.5 py-1 rounded-[3px] bg-[#fbaa19] text-black font-black text-xs uppercase tracking-wider shrink-0 border border-[#000000]">
                            {mode === 'top10' ? ordinalLabel : `EVO ${slotIndex + 1}`}
                        </span>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                                PADDOCK PICKER // {slotBadgeLabel}
                            </span>
                            <span className="text-[10px] font-mono text-white/45 uppercase truncate">
                                Selecione um piloto abaixo — o próximo slot vazio abre automaticamente
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {currentPicked && (
                            <button
                                type="button"
                                onClick={onClearSlot}
                                className="px-2.5 py-1.5 rounded-[3px] border border-[#000000] bg-red-950/30 hover:bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">Limpar Slot</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fechar Paddock Picker"
                            className="w-8 h-8 rounded-[3px] border border-[#000000] bg-[#030303] hover:bg-white/10 hover:text-[#fbaa19] text-white/70 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Corpo Split: Carta Pixel Art (esquerda) + Grid de Seleção (direita) */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Painel de Inspeção em Pixel Art (visível no desktop; compacto no topo mobile) */}
                    <div className="hidden md:flex md:w-72 shrink-0 bg-[#050609] border-r border-white/10 p-5 flex-col justify-between gap-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/45">
                                <span className="flex items-center gap-1 text-[#fbaa19]">
                                    <Sparkles className="w-3 h-3" />
                                    FICHA DO PILOTO
                                </span>
                                <span>{previewDetails.code}</span>
                            </div>

                            <DriverPixelPortrait
                                driverName={previewDetails.name}
                                aspectClass="aspect-[3/4]"
                                className="rounded-md border-2 shadow-2xl"
                            />

                            <div className="flex flex-col gap-1 pt-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h3
                                        style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                        className="text-lg font-black uppercase tracking-wide text-white truncate"
                                    >
                                        {previewDetails.name}
                                    </h3>
                                    <span
                                        className="text-xs font-black px-2 py-0.5 rounded shrink-0"
                                        style={{
                                            backgroundColor: `${previewDetails.teamColor}25`,
                                            color: previewDetails.teamColor,
                                            border: `1px solid ${previewDetails.teamColor}50`,
                                        }}
                                    >
                                        #{previewDetails.num}
                                    </span>
                                </div>

                                <span
                                    className="text-xs font-bold uppercase tracking-widest"
                                    style={{ color: previewDetails.teamColor }}
                                >
                                    {previewDetails.team}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                                <span className="text-white/40">STATUS NO GRID:</span>
                                <span
                                    className={
                                        previewIsUsedElsewhere
                                            ? 'text-red-400 font-bold'
                                            : previewDriver === currentPicked
                                                ? 'text-[#fbaa19] font-bold'
                                                : 'text-emerald-400 font-bold'
                                    }
                                >
                                    {previewIsUsedElsewhere
                                        ? mode === 'top10'
                                            ? `ALOCADO EM P${previewUsedIndex + 1}`
                                            : `ALOCADO EM EVO ${previewUsedIndex + 1}`
                                        : previewDriver === currentPicked
                                            ? 'SELECIONADO AQUI'
                                            : 'DISPONÍVEL'}
                                </span>
                            </div>

                            <button
                                type="button"
                                disabled={previewIsUsedElsewhere}
                                onClick={() => onSelectDriver(previewDetails.name)}
                                className={`w-full py-2.5 rounded text-xs font-black uppercase tracking-widest transition-all border ${
                                    previewIsUsedElsewhere
                                        ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                                        : 'bg-[#fbaa19] text-black border-[#fbaa19] hover:bg-white hover:border-white cursor-pointer'
                                }`}
                            >
                                {previewDriver === currentPicked ? 'MANTER ESCOLHA' : 'CONFIRMAR PILOTO'}
                            </button>
                        </div>
                    </div>

                    {/* Grid de Escolha dos 22 Pilotos */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Barra de Busca e Filtros */}
                        <div className="p-3 sm:p-4 bg-black/60 border-b border-white/10 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar piloto, #número ou equipe..."
                                    className="w-full bg-black/80 border border-white/15 focus:border-[#fbaa19] rounded pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-white/35 outline-none transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                {[
                                    { id: 'all', label: 'TODOS (22)' },
                                    { id: 'available', label: 'DISPONÍVEIS' },
                                    { id: 'top', label: 'PONTA' },
                                    { id: 'mid', label: 'PELOTÃO' },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFilter(f.id as typeof filter)}
                                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-colors cursor-pointer ${
                                            filter === f.id
                                                ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                : 'bg-white/5 text-white/60 border-white/10 hover:border-[#fbaa19]/50 hover:text-white'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cards dos Pilotos */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {filteredDrivers.map((dName) => {
                                    const d = getDriverDetails(dName);
                                    const usedIdx = currentList.indexOf(dName);
                                    const isCurrent = dName === currentPicked;
                                    const isUsedElsewhere = usedIdx !== -1 && usedIdx !== slotIndex;

                                    return (
                                        <button
                                            key={dName}
                                            type="button"
                                            disabled={isUsedElsewhere}
                                            onMouseEnter={() => setPreviewDriver(dName)}
                                            onFocus={() => setPreviewDriver(dName)}
                                            onClick={() => onSelectDriver(dName)}
                                            className={`group relative flex items-center gap-2.5 p-2 rounded-md border text-left transition-all ${
                                                isCurrent
                                                    ? 'bg-[#fbaa19]/15 border-[#fbaa19] ring-1 ring-[#fbaa19]'
                                                    : isUsedElsewhere
                                                        ? 'bg-black/40 border-white/5 opacity-35 cursor-not-allowed'
                                                        : 'bg-black/75 border-white/15 hover:border-[#fbaa19] hover:bg-white/[0.04] cursor-pointer'
                                            }`}
                                        >
                                            {/* Miniatura Pixel Art */}
                                            <DriverPixelPortrait
                                                driverName={d.name}
                                                aspectClass="w-11 h-14 shrink-0 rounded-sm border"
                                                showTeamTrim={true}
                                            />

                                            <div className="flex flex-col min-w-0 leading-tight flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span
                                                        className="text-[10px] font-black"
                                                        style={{ color: d.teamColor }}
                                                    >
                                                        #{d.num}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-[#fbaa19] text-black">
                                                            ATUAL
                                                        </span>
                                                    )}
                                                    {isUsedElsewhere && (
                                                        <span className="text-[8px] font-mono uppercase px-1 py-0.5 rounded bg-white/10 text-white/70">
                                                            {mode === 'top10' ? `P${usedIdx + 1}` : `E${usedIdx + 1}`}
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                                                    className="text-xs font-black uppercase tracking-wide text-white group-hover:text-[#fbaa19] truncate mt-0.5"
                                                >
                                                    {d.name}
                                                </span>

                                                <span className="text-[9px] font-mono text-white/45 uppercase truncate mt-0.5">
                                                    {d.team}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
