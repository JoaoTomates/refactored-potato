"use client";
import React, { useId } from 'react';

export type LogoVariant = 'with-text' | 'icon-only' | 'ts1-bottom';

interface Props {
    isOnDarkBackground?: boolean;
    isPulsing?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    variant?: LogoVariant;
    showSubtitle?: boolean;
}

const Logo = ({
    isOnDarkBackground,
    isPulsing = false,
    size = 'md',
    className = '',
    variant = 'with-text',
    showSubtitle = true,
}: Props) => {
    const rawId = useId();
    // Sanitiza o id para uso seguro em URLs de clipPath SVG
    const clipId = `ts1-logo-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9 md:w-10 md:h-10',
        lg: 'w-14 h-14 md:w-16 md:h-16',
        xl: 'w-20 h-20',
    }[size];

    const textSizeClasses = {
        sm: { title: 'text-xs md:text-sm tracking-[0.14em]', sub: 'text-[7px] md:text-[8px] tracking-[0.22em]' },
        md: { title: 'text-sm md:text-base tracking-[0.16em]', sub: 'text-[8px] md:text-[9px] tracking-[0.26em]' },
        lg: { title: 'text-base sm:text-xl tracking-[0.16em]', sub: 'text-[9px] md:text-[10px] tracking-[0.28em]' },
        xl: { title: 'text-2xl md:text-3xl tracking-[0.2em]', sub: 'text-xs tracking-[0.3em]' },
    }[size];

    // O círculo clássico bicolor original (Opção 2 - 100% puro e geométrico)
    const circleSvg = (
        <svg
            className={`${sizeClasses} shrink-0 transition-transform hover:scale-105`}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="The Strategist One (TS1) Logo"
        >
            <defs>
                <clipPath id={`${clipId}-top`}>
                    <rect x="0" y="0" width="100" height="50" />
                </clipPath>
                <clipPath id={`${clipId}-bottom`}>
                    <rect x="0" y="50" width="100" height="50" />
                </clipPath>
            </defs>

            {/* Anel Externo Âmbar / Terminal Gold (#fbaa19) */}
            <circle cx="50" cy="50" r="47" stroke="#fbaa19" strokeWidth="4" />

            {/* Anel Interno Preto de Contenção (#000000) */}
            <circle cx="50" cy="50" r="43" stroke="#000000" strokeWidth="2.5" />

            {/* Metade Superior Bicolor (Âmbar) - Lisa e Limpa */}
            <circle cx="50" cy="50" r="41" fill="#fbaa19" clipPath={`url(#${clipId}-top)`} />

            {/* Metade Inferior Bicolor (Preto) */}
            <circle cx="50" cy="50" r="41" fill="#000000" clipPath={`url(#${clipId}-bottom)`} />

            {/* Linha Divisória de Horizonte Tático */}
            <line x1="9" y1="50" x2="91" y2="50" stroke="#000000" strokeWidth="1.5" />

            {/* Variante opcional com TS1 discreto na metade preta se solicitado */}
            {variant === 'ts1-bottom' && (
                <g clipPath={`url(#${clipId}-bottom)`}>
                    <text
                        x="50"
                        y="63"
                        textAnchor="middle"
                        style={{
                            fontFamily: 'var(--font-montserrat), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            fontWeight: 900,
                            fontSize: '13px',
                            letterSpacing: '1.5px',
                        }}
                        fill="#fbaa19"
                    >
                        TS1
                    </text>
                </g>
            )}
        </svg>
    );

    // Se for apenas o ícone circular limpo
    if (variant === 'icon-only' || variant === 'ts1-bottom') {
        return (
            <div className={`flex shrink-0 items-center justify-center ${isPulsing ? 'animate-pulse' : ''} ${className}`}>
                {circleSvg}
            </div>
        );
    }

    // Opção 2 Oficial: Círculo original limpo com 'The Strategist One' ao lado
    return (
        <div className={`flex shrink-0 items-center gap-2.5 sm:gap-3 ${isPulsing ? 'animate-pulse' : ''} ${className}`}>
            {circleSvg}
            <div className="flex flex-col leading-none">
                <span
                    style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
                    className={`font-black uppercase text-[#fbaa19] ${textSizeClasses.title}`}
                >
                    THE STRATEGIST ONE
                </span>
                {showSubtitle && (
                    <span className={`uppercase text-white/55 font-mono mt-1 ${textSizeClasses.sub}`}>
                        F1 TELEMETRY &amp; STRATEGY // TS1
                    </span>
                )}
            </div>
        </div>
    );
};

export default Logo;
