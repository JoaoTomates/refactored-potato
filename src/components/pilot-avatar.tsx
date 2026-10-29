"use client";

import React, { useId } from 'react';

export type AvatarVariant = 'carbon' | 'team' | 'neon' | 'minimal' | 'champion';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

export interface PilotAvatarProps {
    teamColor?: string;
    teamSecondaryColor?: string;
    teamName?: string;
    driverNumber?: string | number | null;
    variant?: AvatarVariant;
    size?: AvatarSize;
    seed?: string;
    showHUD?: boolean;
    showBadge?: boolean;
    className?: string;
}

const SIZE_MAP: Record<AvatarSize, string> = {
    xs: 'w-7 h-7 min-w-7 min-h-7',       // ~28px
    sm: 'w-10 h-10 min-w-10 min-h-10',   // ~40px
    md: 'w-16 h-16 min-w-16 min-h-16',   // ~64px
    lg: 'w-24 h-24 min-w-24 min-h-24',   // ~96px
    xl: 'w-36 h-36 min-w-36 min-h-36',   // ~144px
    '2xl': 'w-52 h-52 min-w-52 min-h-52', // ~208px
    custom: 'w-full h-full',
};

export const PilotAvatar: React.FC<PilotAvatarProps> = ({
    teamColor = '#fbaa19',
    teamSecondaryColor,
    teamName,
    driverNumber,
    variant = 'team',
    size = 'md',
    seed,
    showHUD = true,
    showBadge = true,
    className = '',
}) => {
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

    const rawColor = teamColor || '#fbaa19';
    // Garante que cores excessivamente escuras recebam o dourado clássico VoltGrid para não desaparecer
    const primaryColor = (rawColor === '#000000' || rawColor === '#050401' || rawColor === '#111111') 
        ? '#fbaa19' 
        : rawColor;

    const numDisplay = driverNumber !== undefined && driverNumber !== null && String(driverNumber).trim() !== ''
        ? String(driverNumber)
        : null;

    const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

    const maskStyle: React.CSSProperties = {
        WebkitMaskImage: 'url(/avatar-overlay.svg)',
        maskImage: 'url(/avatar-overlay.svg)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
    };

    return (
        <div className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full ${sizeClass} ${className}`}>
            
            {/* ============================================================ */}
            {/* 1. BACKGROUND SVG LAYER (Dynamic themes) */}
            {/* ============================================================ */}
            <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full pointer-events-none"
            >
                <defs>
                    {/* Carbon Fiber Pattern */}
                    <pattern id={`carbon_${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                        <rect width="8" height="8" fill="#0d0f12" />
                        <rect width="4" height="4" fill="#14181d" />
                        <rect x="4" y="4" width="4" height="4" fill="#181d24" />
                        <path d="M0 4L4 0M4 8L8 4" stroke="#08090a" strokeWidth="0.8" opacity="0.6" />
                    </pattern>

                    {/* Team Glow Radial */}
                    <radialGradient id={`bgGlow_${id}`} cx="50%" cy="50%" r="65%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity={variant === 'team' ? 0.45 : variant === 'neon' ? 0.5 : 0.25} />
                        <stop offset="65%" stopColor="#080a0d" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#030405" stopOpacity="1" />
                    </radialGradient>

                    {/* Champion Gold Radial */}
                    <radialGradient id={`championGlow_${id}`} cx="50%" cy="45%" r="60%">
                        <stop offset="0%" stopColor="#ffe066" stopOpacity="0.45" />
                        <stop offset="50%" stopColor="#b8860b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#060709" stopOpacity="1" />
                    </radialGradient>

                    {/* Ring Telemetry Gradient */}
                    <linearGradient id={`ringGrad_${id}`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={primaryColor} />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Background Fills based on variant */}
                <rect width="200" height="200" fill="#060709" />

                {variant === 'carbon' && (
                    <>
                        <rect width="200" height="200" fill={`url(#carbon_${id})`} />
                        <circle cx="100" cy="100" r="95" fill={`url(#bgGlow_${id})`} opacity="0.6" />
                    </>
                )}

                {variant === 'team' && (
                    <>
                        <rect width="200" height="200" fill={`url(#carbon_${id})`} opacity="0.3" />
                        <circle cx="100" cy="100" r="96" fill={`url(#bgGlow_${id})`} />
                        {/* Streamline wind lines */}
                        <path d="M-10 65 Q 100 45 210 55" stroke={primaryColor} strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="6 8" />
                        <path d="M-10 100 Q 100 85 210 95" stroke={primaryColor} strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="12 10" />
                        <path d="M-10 135 Q 100 125 210 135" stroke={primaryColor} strokeWidth="1.2" strokeOpacity="0.2" strokeDasharray="8 6" />
                    </>
                )}

                {variant === 'neon' && (
                    <>
                        <rect width="200" height="200" fill="#030508" />
                        <circle cx="100" cy="100" r="95" fill={`url(#bgGlow_${id})`} opacity="0.9" />
                        <g stroke={primaryColor} strokeOpacity="0.3" strokeWidth="0.8">
                            <circle cx="100" cy="100" r="65" strokeDasharray="4 8" />
                            <circle cx="100" cy="100" r="84" strokeDasharray="2 10" />
                            <line x1="100" y1="10" x2="100" y2="190" strokeDasharray="6 6" />
                            <line x1="10" y1="100" x2="190" y2="100" strokeDasharray="6 6" />
                        </g>
                    </>
                )}

                {variant === 'champion' && (
                    <>
                        <rect width="200" height="200" fill={`url(#carbon_${id})`} opacity="0.5" />
                        <circle cx="100" cy="100" r="96" fill={`url(#championGlow_${id})`} />
                        <circle cx="100" cy="100" r="86" stroke="#ffe066" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="5 15" />
                    </>
                )}

                {variant === 'minimal' && (
                    <rect width="200" height="200" fill="#090b0e" />
                )}

                {/* Pilot Number Watermark behind helmet */}
                {numDisplay && (
                    <text
                        x="180"
                        y="178"
                        textAnchor="end"
                        fill="#ffffff"
                        fillOpacity="0.08"
                        fontSize="96"
                        fontFamily="Impact, system-ui, sans-serif"
                        fontWeight="900"
                        fontStyle="italic"
                    >
                        {numDisplay}
                    </text>
                )}
            </svg>

            {/* ============================================================ */}
            {/* 2. OFFICIAL HELMET OVERLAY LAYER (avatar-overlay.svg) - ALTO CONTRASTE */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center justify-center p-[6%] pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center">
                    
                    {/* Pedestal Luminoso / Halo de Fundo */}
                    <div 
                        className="absolute inset-0 rounded-full pointer-events-none opacity-80" 
                        style={{
                            background: `radial-gradient(circle at 50% 48%, ${primaryColor}55 0%, ${primaryColor}18 45%, transparent 72%)`
                        }}
                    />

                    {/* Vector Oficial F1 com Realce de Brilho & Contraste nas Linhas */}
                    <img
                        src="/avatar-overlay.svg"
                        alt="Capacete Oficial F1"
                        className="w-full h-full object-contain select-none transition-all drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]"
                        style={{
                            filter: 'brightness(1.85) contrast(1.35) drop-shadow(0 0 1px rgba(255,255,255,0.45))'
                        }}
                    />

                    {/* Camada 1: Coloração Vibrante Mantendo Luminância */}
                    <div
                        className="absolute inset-0 mix-blend-color opacity-95"
                        style={{
                            ...maskStyle,
                            backgroundColor: primaryColor,
                        }}
                    />

                    {/* Camada 2: Sombras e Linhas Estruturais Suaves */}
                    <div
                        className="absolute inset-0 mix-blend-multiply opacity-55"
                        style={{
                            ...maskStyle,
                            backgroundColor: primaryColor,
                        }}
                    />

                    {/* Camada 3: Realce Especular nas Linhas da Viseira e Contornos */}
                    <div
                        className="absolute inset-0 mix-blend-screen opacity-45"
                        style={{
                            ...maskStyle,
                            backgroundColor: '#ffffff',
                        }}
                    />

                    {/* Camada 4: Borda Externa Neon Realçada */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
                        style={{
                            filter: `drop-shadow(0 0 6px ${primaryColor}) drop-shadow(0 0 1px #ffffff)`
                        }}
                    >
                        <img 
                            src="/avatar-overlay.svg" 
                            alt="" 
                            className="w-full h-full object-contain select-none" 
                        />
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 3. HUD TELEMETRY FRAME & ROTATION TICKS */}
            {/* ============================================================ */}
            {showHUD && (
                <svg
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                >
                    {/* Outer Bezel */}
                    <circle cx="100" cy="100" r="96" stroke="#181c22" strokeWidth="4" />

                    {/* Active Team Color Sector Arc */}
                    <circle
                        cx="100"
                        cy="100"
                        r="96"
                        stroke={`url(#ringGrad_${id})`}
                        strokeWidth="3.2"
                        strokeDasharray="280 320"
                        strokeDashoffset="45"
                        strokeLinecap="round"
                    />

                    {/* Precision Telemetry Calibrations (0, 90, 180, 270 degrees) */}
                    <line x1="100" y1="2" x2="100" y2="9" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    <line x1="100" y1="191" x2="100" y2="198" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    <line x1="2" y1="100" x2="9" y2="100" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    <line x1="191" y1="100" x2="198" y2="100" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />

                    {/* Corner Calibrations */}
                    <g stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1">
                        <line x1="168" y1="32" x2="163" y2="37" />
                        <line x1="32" y1="168" x2="37" y2="163" />
                        <line x1="168" y1="168" x2="163" y2="163" />
                        <line x1="32" y1="32" x2="37" y2="37" />
                    </g>

                    {/* Status Sensor Blip (Top Right HUD LED) */}
                    <circle cx="168" cy="32" r="3.5" fill="#00ff66" />
                    <circle cx="168" cy="32" r="6" stroke="#00ff66" strokeWidth="1" opacity="0.6" />
                </svg>
            )}

            {/* ============================================================ */}
            {/* 4. DRIVER NUMBER BADGE */}
            {/* ============================================================ */}
            {showBadge && numDisplay && (
                <div
                    className="absolute -bottom-0.5 -right-0.5 z-20 flex items-center justify-center font-display font-black text-black rounded px-1.5 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.85)] border border-black/40"
                    style={{
                        backgroundColor: primaryColor,
                        fontSize: size === 'xs' ? '8px' : size === 'sm' ? '10px' : size === 'md' ? '11px' : '13px',
                        lineHeight: 1,
                    }}
                    title={`Piloto #${numDisplay}`}
                >
                    <span>#{numDisplay}</span>
                </div>
            )}
        </div>
    );
};

export default PilotAvatar;
