"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { DIALOGUE_BOX_GRADIENT, getDialogueShadow } from '@/components/dialogue-box';

export interface SystemModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    accentColor?: string;
    maxWidthClass?: string;
    zIndexClass?: string;
    closeDisabled?: boolean;
    closeLabel?: string;
    headerRight?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}

/**
 * Shell definitivo de Modal do Sistema BAEFF1.
 * Segue o mesmo padrão visual do DialogueBox:
 * fundo #030303 -> #000000, borda #000000, radius <= 3px, sombra spread direcional e font-mono.
 */
export function SystemModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    accentColor = '#fbaa19',
    maxWidthClass = 'max-w-2xl',
    zIndexClass = 'z-50',
    closeDisabled = false,
    closeLabel,
    headerRight,
    footer,
    children,
    className = '',
    bodyClassName = 'p-4 sm:p-6',
}: SystemModalProps) {
    useEffect(() => {
        if (!isOpen || !onClose || closeDisabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose, closeDisabled]);

    if (!isOpen) return null;

    const shadow = getDialogueShadow('left', accentColor);

    return (
        <div
            className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto font-mono`}
            onClick={() => {
                if (!closeDisabled && onClose) onClose();
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full ${maxWidthClass} max-h-[90vh] rounded-[3px] border border-[#000000] flex flex-col overflow-hidden my-auto text-[calc(0.75rem+0.5px)] sm:text-[calc(0.875rem+0.5px)] ${className}`}
                style={{
                    background: DIALOGUE_BOX_GRADIENT,
                    boxShadow: shadow,
                }}
            >
                {(title || onClose || headerRight) && (
                    <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {icon && <span className="shrink-0">{icon}</span>}
                            <div className="min-w-0">
                                {title && (
                                    <h3
                                        className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] truncate"
                                        style={{ color: accentColor }}
                                    >
                                        {title}
                                    </h3>
                                )}
                                {subtitle && (
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider truncate mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {headerRight}
                            {onClose && (
                                <button
                                    type="button"
                                    disabled={closeDisabled}
                                    onClick={onClose}
                                    aria-label="Fechar modal"
                                    className="px-2.5 py-1.5 rounded-[3px] border border-[#000000] bg-[#030303] hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                                >
                                    {closeLabel ? <span>{closeLabel}</span> : <X className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="px-4 sm:px-6 py-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Superfície padrão para cards de diálogo/formulário de sistema (ex: Login, Avisos, Enlist).
 */
export function getSystemBoxStyle(accentColor = '#fbaa19', direction: 'left' | 'right' = 'left'): React.CSSProperties {
    return {
        background: DIALOGUE_BOX_GRADIENT,
        boxShadow: getDialogueShadow(direction, accentColor),
    };
}
