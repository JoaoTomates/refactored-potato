"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Radio } from 'lucide-react';
import { findCrewCharacter } from '@/lib/crew-config';

/**
 * Motor de áudio mecânico do PitWall para digitação tática.
 */
class PitWallSoundEngine {
    ctx: AudioContext | null = null;
    enabled: boolean = true;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    playKeyClick(char = 'a') {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const code = char.charCodeAt(0) || 65;
            const freq = 380 + (code % 28) * 14;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.028);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch {
            // Ignora erro caso AudioContext ainda não tenha sido desbloqueado por gesto
        }
    }
}

export const pitWallSound = new PitWallSoundEngine();
export const retroSound = pitWallSound;

export interface TypewriterLineProps {
    text: string;
    onComplete?: () => void;
    onReadyForNext?: () => void;
    startDelay?: number;
    speed?: number;
    instant?: boolean;
    accentColor?: string;
    className?: string;
}

/**
 * Renderizador de texto com efeito de digitação tática e clique para completar.
 */
export function TypewriterLine({
    text,
    onComplete,
    onReadyForNext,
    startDelay = 120,
    speed,
    instant = false,
    accentColor = '#fbaa19',
    className = '',
}: TypewriterLineProps) {
    const [displayed, setDisplayed] = useState(instant ? text : '');
    const [isTyping, setIsTyping] = useState(!instant);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);

    const finishImmediatelyRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (instant) {
            setDisplayed(text);
            setIsTyping(false);
            return;
        }

        let i = 0;
        let timeoutId: ReturnType<typeof setTimeout>;
        let completeTimeoutId: ReturnType<typeof setTimeout>;
        let isCancelled = false;

        finishImmediatelyRef.current = () => {
            if (isCancelled) return;
            isCancelled = true;
            clearTimeout(timeoutId);
            clearTimeout(completeTimeoutId);
            setIsTyping(false);
            setDisplayed(text);
            if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
            if (callbacksRef.current.onComplete) callbacksRef.current.onComplete();
        };

        setDisplayed('');
        setIsTyping(true);

        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);

                if (char !== ' ' && char !== '\n') {
                    pitWallSound.playKeyClick(char);
                }

                i++;

                let delay = speed !== undefined ? speed : (30 + Math.random() * 20);
                if (char === '.' || char === '!' || char === '?') {
                    delay = speed !== undefined ? speed * 6 : 320;
                } else if (char === ',' || char === '\n' || char === ':') {
                    delay = speed !== undefined ? speed * 3 : 160;
                }

                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    completeTimeoutId = setTimeout(() => {
                        if (!isCancelled && callbacksRef.current.onComplete) {
                            callbacksRef.current.onComplete();
                        }
                    }, 700);
                }
            }
        };

        timeoutId = setTimeout(typeNext, startDelay);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
            clearTimeout(completeTimeoutId);
        };
    }, [text, startDelay, speed, instant]);

    return (
        <span
            onClick={(e) => {
                if (isTyping) {
                    e.stopPropagation();
                    finishImmediatelyRef.current();
                }
            }}
            className={`leading-relaxed relative whitespace-pre-wrap ${isTyping ? 'cursor-pointer' : ''} ${className}`}
            title={isTyping ? 'Clique para exibir o texto completo imediatamente' : undefined}
        >
            {displayed}
            {isTyping && (
                <span
                    className="animate-pulse ml-1 inline-block translate-y-[1px]"
                    style={{ color: accentColor }}
                >
                    ■
                </span>
            )}
        </span>
    );
}

export interface DialogueActionButton {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
}

export interface DialogueBoxProps {
    speaker?: string;
    speakerRole?: string;
    badgeTitle?: string;
    categoryTag?: string;
    avatarUrl?: string;
    text?: string;
    children?: React.ReactNode;
    accentColor?: string;
    /**
     * Direção / posicionamento do avatar: 'left' (padrão) ou 'right'.
     */
    direction?: 'left' | 'right';
    avatarPosition?: 'left' | 'right';
    avatarSide?: 'left' | 'right';
    /**
     * Define se o avatar deve ser renderizado. Por padrão, true.
     */
    hasAvatar?: boolean;
    showAvatar?: boolean;
    hideAvatar?: boolean;
    prefix?: string | null;
    typewriter?: boolean;
    startDelay?: number;
    speed?: number;
    onReadyForNext?: () => void;
    onComplete?: () => void;
    onClick?: () => void;
    title?: string;
    footerHint?: string;
    footerNote?: React.ReactNode;
    actions?: DialogueActionButton[];
    extraAction?: React.ReactNode;
    isSettled?: boolean;
    settledLabel?: string;
    isFilled?: boolean;
    compact?: boolean;
    italic?: boolean;
    minHeightClass?: string;
    animateEntrance?: boolean;
    inlinePortrait?: {
        avatarUrl?: string;
        name?: string;
    };
    characterId?: string;
    dataStrategySource?: string;
    className?: string;
    disableAvatarClick?: boolean;
    hideDividers?: boolean;
    textAlign?: 'left' | 'right' | 'inherit';
}

export const DIALOGUE_BOX_GRADIENT = 'linear-gradient(160deg, #030303 0%, #000000 100%)';
const BOX_GRADIENT = DIALOGUE_BOX_GRADIENT;

export function getDialogueShadow(direction: 'left' | 'right', accentColor: string): string {
    const xPrimary = direction === 'left' ? '8px' : '-8px';
    const xAccent = direction === 'left' ? '4px' : '-4px';
    return `${xPrimary} 6px 24px 2px rgba(0, 0, 0, 0.96), ${xAccent} 2px 16px 1px ${accentColor}30`;
}
const getDirectionalShadow = getDialogueShadow;

export function getAvatarBlackShadow(direction: 'left' | 'right' = 'left'): string {
    const xOffset = direction === 'left' ? '3px' : '-3px';
    return `${xOffset} 4px 8px 1px rgba(0, 0, 0, 0.98), 0 1px 3px 0 rgba(0, 0, 0, 0.95)`;
}

function getSpeakerInitials(speaker?: string): string {
    if (!speaker) return 'HQ';
    const clean = speaker.replace(/[\[\]]/g, '').trim();
    if (!clean) return 'HQ';
    const parts = clean.split(/[\s.]+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
}

interface AvatarFrameProps {
    avatarUrl?: string;
    name?: string;
    accentColor: string;
    shadow: string;
    sizeClass: string;
    interactive?: boolean;
    allowWideLabel?: boolean;
    characterId?: string;
    disableClick?: boolean;
}

function AvatarFrame({
    avatarUrl,
    name,
    accentColor,
    shadow,
    sizeClass,
    interactive = false,
    allowWideLabel = false,
    characterId,
    disableClick = false,
}: AvatarFrameProps) {
    const router = useRouter();
    const [currentImg, setCurrentImg] = useState<string | undefined>(avatarUrl);
    const [imgFailed, setImgFailed] = useState(false);

    useEffect(() => {
        setCurrentImg(avatarUrl);
        setImgFailed(false);
    }, [avatarUrl]);

    const handleImgError = () => {
        if (currentImg && currentImg.startsWith('http')) {
            const parts = currentImg.split('/avatars/');
            if (parts[1]) {
                setCurrentImg(`/avatar/${parts[1]}`);
                return;
            }
        }
        setImgFailed(true);
    };

    const cleanName = name ? name.replace(/[\[\]]/g, '').trim() : '';

    const resolvedChar = useMemo(() => {
        return findCrewCharacter(characterId || name || avatarUrl);
    }, [characterId, name, avatarUrl]);

    const tooltipText = disableClick
        ? (resolvedChar ? `${resolvedChar.fullName} — ${resolvedChar.role}` : cleanName || 'Personagem')
        : (resolvedChar
            ? `${resolvedChar.fullName} — ${resolvedChar.role} [Clique para abrir Ficha de Funcionário]`
            : (cleanName ? `${cleanName} [Clique para ver Ficha]` : 'Ficha do Colaborador'));

    const handleNavigateToCrew = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disableClick) return;
        const targetId = resolvedChar?.id || (cleanName ? cleanName.toLowerCase() : 'strat-1');
        router.push(`/crew/${encodeURIComponent(targetId)}`);
    };

    return (
        <div
            onClick={disableClick ? (e) => e.stopPropagation() : handleNavigateToCrew}
            title={tooltipText}
            className={`flex flex-col items-center shrink-0 select-none ${
                disableClick
                    ? 'cursor-default'
                    : 'cursor-pointer group/avatar transition-transform hover:scale-[1.04]'
            }`}
        >
            <div
                className={`${sizeClass} rounded-[3px] overflow-hidden border border-[#000000] p-0.5 flex items-center justify-center shrink-0 transition-all ${
                    disableClick ? '' : 'group-hover/avatar:ring-1 group-hover/avatar:ring-[#fbaa19]'
                }`}
                style={{
                    background: BOX_GRADIENT,
                    boxShadow: shadow,
                }}
            >
                {currentImg && !imgFailed ? (
                    <img
                        src={currentImg}
                        alt={resolvedChar?.fullName || cleanName || 'Personagem'}
                        onError={handleImgError}
                        className={`w-full h-full object-cover rounded-[2px] filter contrast-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transition-all ${
                            disableClick ? '' : 'group-hover/avatar:brightness-110'
                        }`}
                    />
                ) : (
                    <div className="w-full h-full rounded-[2px] flex flex-col items-center justify-center bg-[#030303] text-center">
                        {cleanName ? (
                            <span
                                className="text-xs sm:text-sm font-black tracking-widest uppercase"
                                style={{ color: accentColor }}
                            >
                                {getSpeakerInitials(cleanName)}
                            </span>
                        ) : (
                            <Radio className="w-5 h-5" style={{ color: accentColor }} />
                        )}
                    </div>
                )}
            </div>

            {cleanName && (
                <span
                    className={`text-[10px] sm:text-[11px] font-mono font-black tracking-wider mt-1.5 uppercase text-center px-2 py-0.5 rounded-[3px] border border-[#000000] transition-colors ${
                        disableClick ? '' : 'group-hover/avatar:border-white/30 group-hover/avatar:text-white'
                    } ${
                        allowWideLabel ? 'whitespace-nowrap' : 'truncate max-w-[96px] sm:max-w-[116px]'
                    }`}
                    style={{
                        color: accentColor,
                        background: BOX_GRADIENT,
                        boxShadow: shadow,
                    }}
                >
                    [ {cleanName} ]
                </span>
            )}
        </div>
    );
}

/**
 * Modelo definitivo e padronizado de Caixa de Diálogo Narrativa do BAEFF1.
 * Superfície #030303 -> #000000, borda #000000, radius <= 3px e sombra spread direcional.
 */
export function DialogueBox({
    speaker,
    speakerRole,
    badgeTitle,
    categoryTag,
    avatarUrl,
    text,
    children,
    accentColor = '#fbaa19',
    direction = 'left',
    avatarPosition,
    avatarSide,
    hasAvatar,
    showAvatar,
    hideAvatar = false,
    prefix = '>_',
    typewriter = true,
    startDelay = 120,
    speed,
    onReadyForNext,
    onComplete,
    onClick,
    title,
    footerHint,
    footerNote,
    actions,
    extraAction,
    isSettled = false,
    settledLabel,
    isFilled = false,
    compact = false,
    italic = false,
    minHeightClass,
    animateEntrance = false,
    inlinePortrait,
    characterId,
    dataStrategySource,
    className = '',
    disableAvatarClick = false,
    hideDividers = true,
    textAlign,
}: DialogueBoxProps) {
    const effectiveAccent = isFilled ? '#10b981' : accentColor;
    const effectiveSide: 'left' | 'right' = avatarPosition || avatarSide || direction || 'left';
    const isRight = effectiveSide === 'right';
    const directionalShadow = getDirectionalShadow(effectiveSide, effectiveAccent);
    const avatarShadow = getAvatarBlackShadow(effectiveSide);

    // Por padrão o avatar é exibido (hasAvatar = true), podendo ser desligado explicitamente
    const shouldShowAvatar = hasAvatar !== undefined
        ? hasAvatar
        : (showAvatar !== undefined ? showAvatar : !hideAvatar);

    const hasHeader = Boolean(badgeTitle || speakerRole || categoryTag);
    const hasActionsRow = Boolean(isFilled || isSettled || (actions && actions.length > 0) || extraAction || footerHint || footerNote);

    const entranceAnim = animateEntrance
        ? (isRight ? 'animate-fade-in-right' : 'animate-fade-in-left')
        : '';

    const avatarSizeClass = compact
        ? 'w-12 h-12 sm:w-14 sm:h-14'
        : 'w-16 h-16 sm:w-20 sm:h-20';

    const boxPaddingClass = compact
        ? 'p-3.5 sm:p-4'
        : 'p-4 sm:p-5';

    const textMinHeight = minHeightClass || (compact ? 'min-h-[36px]' : 'min-h-[44px]');

    // Mantém a font-mono atual com +0.5px no tamanho base
    const textSizeClass = compact
        ? 'text-[calc(0.75rem+0.5px)] sm:text-[calc(0.8125rem+0.5px)]'
        : 'text-[calc(0.75rem+0.5px)] sm:text-[calc(0.875rem+0.5px)] md:text-[calc(1rem+0.5px)]';

    const alignmentClass = textAlign
        ? (textAlign === 'right' ? 'text-right justify-end' : (textAlign === 'left' ? 'text-left justify-start' : ''))
        : (isRight ? 'text-right justify-end' : 'text-left justify-start');

    return (
        <div
            onClick={onClick}
            title={title}
            data-strategy-source={dataStrategySource}
            className={`w-full flex items-start gap-3 sm:gap-4 transition-all duration-300 py-1.5 font-mono ${
                isRight ? 'flex-row-reverse' : 'flex-row'
            } ${onClick ? 'cursor-pointer group' : ''} ${entranceAnim} ${className}`}
        >
            {/* 1. AVATAR EXTERNO (por padrão sim, renderizado à esquerda [padrão] ou à direita) */}
            {shouldShowAvatar && (
                <AvatarFrame
                    avatarUrl={avatarUrl}
                    name={speaker}
                    characterId={characterId}
                    accentColor={effectiveAccent}
                    shadow={avatarShadow}
                    sizeClass={avatarSizeClass}
                    interactive={Boolean(onClick)}
                    disableClick={disableAvatarClick}
                />
            )}

            {/* 2. BOX CARD DO DIÁLOGO (#030303 -> #000000, border #000000, radius <= 3px, sombra spread direcional, sem linhas cinza) */}
            <div
                className={`flex-1 rounded-[3px] ${boxPaddingClass} transition-all duration-300 border border-[#000000] flex flex-col justify-between ${
                    compact ? 'min-h-[76px]' : 'min-h-[92px] sm:min-h-[98px]'
                }`}
                style={{
                    background: BOX_GRADIENT,
                    boxShadow: directionalShadow,
                }}
            >
                {/* Cabeçalho interno opcional (cargo / contexto / categoria) - Sem linhas cinza */}
                {hasHeader && (
                    <div
                        className={`flex items-center justify-between gap-2 pb-1.5 mb-1.5 ${
                            isRight ? 'flex-row-reverse' : 'flex-row'
                        }`}
                    >
                        <span
                            className="text-[10px] sm:text-xs font-black uppercase tracking-wider truncate"
                            style={{ color: effectiveAccent }}
                        >
                            {badgeTitle || speakerRole}
                        </span>
                        {categoryTag && (
                            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-white/45 shrink-0">
                                {categoryTag}
                            </span>
                        )}
                    </div>
                )}

                {/* Texto da fala + retrato interno opcional à direita */}
                <div
                    className={`flex items-start justify-between gap-4 ${
                        isRight ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                    <div
                        className={`flex-1 min-w-0 text-white font-bold tracking-wide leading-relaxed py-0.5 ${textMinHeight} flex items-start ${textSizeClass} ${alignmentClass} ${italic ? 'italic' : ''}`}
                    >
                        <div className="w-full">
                            {prefix && (
                                <span
                                    className="opacity-70 mr-2 select-none font-black"
                                    style={{ color: effectiveAccent }}
                                >
                                    {prefix}
                                </span>
                            )}
                            {text !== undefined ? (
                                <TypewriterLine
                                    text={text}
                                    startDelay={startDelay}
                                    speed={speed}
                                    instant={!typewriter}
                                    accentColor={effectiveAccent}
                                    onReadyForNext={onReadyForNext}
                                    onComplete={onComplete}
                                />
                            ) : (
                                children
                            )}
                        </div>
                    </div>

                    {inlinePortrait && (
                        <AvatarFrame
                            avatarUrl={inlinePortrait.avatarUrl}
                            name={inlinePortrait.name}
                            accentColor={effectiveAccent}
                            shadow={getAvatarBlackShadow('right')}
                            sizeClass={avatarSizeClass}
                            interactive={Boolean(onClick)}
                            allowWideLabel
                            disableClick={disableAvatarClick}
                        />
                    )}
                </div>

                {/* Rodapé opcional: ações, status homologado, nota tática ou dica de avanço - Sem linhas cinza */}
                {hasActionsRow && (
                    <div
                        className={`mt-2 pt-1 flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest font-mono flex-wrap ${
                            isRight ? 'justify-between flex-row-reverse' : 'justify-between'
                        }`}
                    >
                        {footerNote ? (
                            <div className="text-[10px] text-white/50 font-mono normal-case tracking-normal">
                                {footerNote}
                            </div>
                        ) : (
                            <span />
                        )}

                        <div className={`flex items-center gap-2 flex-wrap ${isRight ? 'justify-start' : 'justify-end'}`}>
                            {isFilled ? (
                                <div
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold font-mono border border-[#000000]"
                                    style={{
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.14)',
                                    }}
                                >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>{settledLabel || 'HOMOLOGADO'}</span>
                                </div>
                            ) : (
                                <>
                                    {isSettled && (
                                        <span className="px-2.5 py-1 rounded-[3px] text-[10px] font-mono text-white/50 bg-white/5 border border-[#000000]">
                                            {settledLabel || 'COPY'}
                                        </span>
                                    )}

                                    {actions?.map((action, idx) => (
                                        <button
                                            key={`${action.label}-${idx}`}
                                            type="button"
                                            disabled={action.disabled}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.onClick();
                                            }}
                                            className={
                                                action.variant === 'primary'
                                                    ? 'px-4 py-1.5 rounded-[3px] font-mono font-black text-xs text-black hover:brightness-110 transition-all uppercase tracking-wider shadow cursor-pointer flex items-center gap-1 border border-[#000000] disabled:opacity-40'
                                                    : 'px-4 py-1.5 rounded-[3px] text-white/80 hover:text-white bg-black/80 hover:bg-white/10 border border-[#000000] transition-all font-mono text-xs font-bold cursor-pointer disabled:opacity-40'
                                            }
                                            style={
                                                action.variant === 'primary'
                                                    ? { backgroundColor: effectiveAccent }
                                                    : undefined
                                            }
                                        >
                                            <span>{action.label}</span>
                                        </button>
                                    ))}

                                    {footerHint && (
                                        <span className="text-[10px] text-white/45 font-mono tracking-widest uppercase">
                                            {footerHint}
                                        </span>
                                    )}

                                    {extraAction && extraAction}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DialogueBox;

