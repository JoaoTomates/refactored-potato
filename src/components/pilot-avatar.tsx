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
    // Sanitize id for SVG references
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

    const primaryColor = teamColor || '#fbaa19';
    const secondaryColor = teamSecondaryColor || '#ffffff';
    const numDisplay = driverNumber !== undefined && driverNumber !== null && String(driverNumber).trim() !== ''
        ? String(driverNumber)
        : null;

    const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

    return (
        <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}>
            <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
            >
                <defs>
                    {/* Carbon Fiber Pattern */}
                    <pattern id={`carbon_${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                        <rect width="8" height="8" fill="#0d0f12" />
                        <rect width="4" height="4" fill="#14181d" />
                        <rect x="4" y="4" width="4" height="4" fill="#181d24" />
                        <path d="M0 4L4 0M4 8L8 4" stroke="#08090a" strokeWidth="0.8" opacity="0.6" />
                    </pattern>

                    {/* Background Radial Glow */}
                    <radialGradient id={`bgGlow_${id}`} cx="50%" cy="45%" r="65%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity={variant === 'team' ? 0.35 : variant === 'neon' ? 0.45 : 0.2} />
                        <stop offset="60%" stopColor="#080a0d" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#030405" stopOpacity="1" />
                    </radialGradient>

                    {/* Champion Gold Radial */}
                    <radialGradient id={`championGlow_${id}`} cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#ffe066" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#b8860b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#060709" stopOpacity="1" />
                    </radialGradient>

                    {/* Helmet Shell 3D Shading */}
                    <linearGradient id={`helmetBase_${id}`} x1="30" y1="30" x2="170" y2="170" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#2b313a" />
                        <stop offset="45%" stopColor="#15181e" />
                        <stop offset="100%" stopColor="#0a0c0f" />
                    </linearGradient>

                    {/* Team Livery Ribbon */}
                    <linearGradient id={`teamStripe_${id}`} x1="40" y1="60" x2="160" y2="130" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.95" />
                        <stop offset="40%" stopColor={primaryColor} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.8" />
                    </linearGradient>

                    {/* Iridescent Visor Gradient (Metallic Horizon Reflex) */}
                    <linearGradient id={`visorReflex_${id}`} x1="75" y1="75" x2="145" y2="115" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffb703" />
                        <stop offset="25%" stopColor="#fb8500" />
                        <stop offset="55%" stopColor="#d90429" />
                        <stop offset="85%" stopColor="#7209b7" />
                        <stop offset="100%" stopColor="#03045e" />
                    </linearGradient>

                    {/* Visor Glare Streak */}
                    <linearGradient id={`visorGlare_${id}`} x1="80" y1="80" x2="130" y2="105" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>

                    {/* Ring Telemetry Gradient */}
                    <linearGradient id={`ringGrad_${id}`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={primaryColor} />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.2" />
                    </linearGradient>

                    {/* Clip path for circular base */}
                    <clipPath id={`avatarClip_${id}`}>
                        <circle cx="100" cy="100" r="94" />
                    </clipPath>
                </defs>

                {/* ============================================================ */}
                {/* 1. BACKGROUND LAYER (Cliped to inner circle) */}
                {/* ============================================================ */}
                <g clipPath={`url(#avatarClip_${id})`}>
                    {/* Base Background Fill */}
                    <rect width="200" height="200" fill="#060709" />

                    {/* Variant Backgrounds */}
                    {variant === 'carbon' && (
                        <>
                            <rect width="200" height="200" fill={`url(#carbon_${id})`} />
                            <circle cx="100" cy="90" r="95" fill={`url(#bgGlow_${id})`} opacity="0.65" />
                        </>
                    )}

                    {variant === 'team' && (
                        <>
                            <rect width="200" height="200" fill={`url(#carbon_${id})`} opacity="0.3" />
                            <circle cx="100" cy="85" r="96" fill={`url(#bgGlow_${id})`} />
                            {/* Aerodynamic Wind Tunnel Rays */}
                            <path d="M-10 60 Q 100 40 210 50" stroke={primaryColor} strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="6 8" />
                            <path d="M-10 100 Q 100 85 210 95" stroke={primaryColor} strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="12 10" />
                            <path d="M-10 140 Q 100 130 210 140" stroke={primaryColor} strokeWidth="1.2" strokeOpacity="0.2" strokeDasharray="8 6" />
                        </>
                    )}

                    {variant === 'neon' && (
                        <>
                            <rect width="200" height="200" fill="#030508" />
                            <circle cx="100" cy="90" r="95" fill={`url(#bgGlow_${id})`} opacity="0.9" />
                            {/* Circuit Grid Lines */}
                            <g stroke={primaryColor} strokeOpacity="0.25" strokeWidth="0.8">
                                <circle cx="100" cy="100" r="60" strokeDasharray="4 8" />
                                <circle cx="100" cy="100" r="82" strokeDasharray="2 10" />
                                <line x1="100" y1="10" x2="100" y2="190" strokeDasharray="6 6" />
                                <line x1="10" y1="100" x2="190" y2="100" strokeDasharray="6 6" />
                            </g>
                        </>
                    )}

                    {variant === 'champion' && (
                        <>
                            <rect width="200" height="200" fill={`url(#carbon_${id})`} opacity="0.5" />
                            <circle cx="100" cy="85" r="96" fill={`url(#championGlow_${id})`} />
                            {/* Laurels / Winner Ticks */}
                            <circle cx="100" cy="100" r="84" stroke="#ffe066" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="5 15" />
                        </>
                    )}

                    {variant === 'minimal' && (
                        <rect width="200" height="200" fill="#0b0d10" />
                    )}

                    {/* Large Background Pilot Number Watermark */}
                    {numDisplay && (
                        <text
                            x="180"
                            y="178"
                            textAnchor="end"
                            fill="#ffffff"
                            fillOpacity="0.05"
                            fontSize="92"
                            fontFamily="Impact, system-ui, sans-serif"
                            fontWeight="900"
                            fontStyle="italic"
                        >
                            {numDisplay}
                        </text>
                    )}

                    {/* ============================================================ */}
                    {/* 2. VECTOR F1 HELMET (High-Precision Racing Geometry) */}
                    {/* ============================================================ */}
                    <g transform="translate(14, 18) scale(0.86)">
                        {/* Helmet Shadow Drop */}
                        <ellipse cx="98" cy="174" rx="64" ry="12" fill="#000000" fillOpacity="0.55" />

                        {/* Top Air Intake Scoop (Aero Vent) */}
                        <path
                            d="M 88 38 Q 112 36 128 42 L 124 49 Q 106 45 86 45 Z"
                            fill="#1c2128"
                            stroke="#333b47"
                            strokeWidth="1.2"
                        />

                        {/* Rear Aero Spoiler (Clear Extension) */}
                        <path
                            d="M 44 92 C 34 94 28 104 26 114 L 32 118 C 36 108 42 100 50 98 Z"
                            fill={primaryColor}
                            fillOpacity="0.75"
                            stroke="#ffffff"
                            strokeWidth="0.8"
                            strokeOpacity="0.4"
                        />

                        {/* MAIN HELMET OUTER SHELL */}
                        <path
                            d="M 52 138 
                               C 40 120 40 85 58 60 
                               C 78 34 126 34 148 58 
                               C 162 74 168 96 166 122 
                               C 165 136 156 148 140 152 
                               C 124 156 82 156 68 152 
                               C 58 149 54 144 52 138 Z"
                            fill={`url(#helmetBase_${id})`}
                            stroke="#3c4452"
                            strokeWidth="2.4"
                        />

                        {/* Carbon Texture Accent on Lower Shell */}
                        <path
                            d="M 58 132 C 64 148 88 154 136 150 C 150 146 158 136 160 124 C 152 130 134 136 112 136 C 88 136 68 132 58 132 Z"
                            fill="#0d1014"
                            stroke="#222831"
                            strokeWidth="1"
                        />

                        {/* TEAM RACING LIVERY STRIPE (Flowing Dynamic Band) */}
                        <path
                            d="M 50 78 
                               C 72 62 114 62 144 76 
                               L 150 92 
                               C 122 78 82 78 56 94 
                               Z"
                            fill={`url(#teamStripe_${id})`}
                        />

                        <path
                            d="M 58 100 
                               C 82 86 126 86 156 102 
                               L 153 112 
                               C 125 98 84 98 56 110 
                               Z"
                            fill={primaryColor}
                            fillOpacity="0.8"
                        />

                        {/* Top Air Vent Holes (Grid) */}
                        <circle cx="104" cy="46" r="2.2" fill="#000000" />
                        <circle cx="112" cy="47" r="2.2" fill="#000000" />
                        <circle cx="120" cy="49" r="2.2" fill="#000000" />

                        {/* VISOR APERTURE RECESS (Dark Cavity Behind Visor) */}
                        <path
                            d="M 94 80 
                               C 114 80 146 84 158 98 
                               C 162 103 162 114 156 120 
                               C 142 126 116 126 96 120 
                               C 90 118 86 110 88 98 
                               C 89 88 91 80 94 80 Z"
                            fill="#050608"
                            stroke="#181c24"
                            strokeWidth="1.5"
                        />

                        {/* VISOR (Iridescent Metallic Shield) */}
                        <path
                            d="M 96 82 
                               C 116 82 144 86 155 98 
                               C 158 103 158 112 153 118 
                               C 140 123 116 123 98 118 
                               C 92 115 89 108 90 98 
                               C 91 88 93 82 96 82 Z"
                            fill={`url(#visorReflex_${id})`}
                            stroke="#000000"
                            strokeWidth="1.2"
                        />

                        {/* Visor Glare / Sunlight Reflection */}
                        <path
                            d="M 100 84 
                               C 114 84 136 88 145 96 
                               L 136 106 
                               C 126 98 110 94 98 94 
                               Z"
                            fill={`url(#visorGlare_${id})`}
                        />

                        {/* Secondary Horizon Specular Line */}
                        <path
                            d="M 94 102 Q 124 105 152 108"
                            stroke="#ffffff"
                            strokeWidth="1"
                            strokeOpacity="0.4"
                            strokeLinecap="round"
                        />

                        {/* Visor Tear-off Post / Pivot Screw (Titanium Hinge) */}
                        <g transform="translate(86, 102)">
                            <circle cx="0" cy="0" r="6" fill="#1b2028" stroke="#3d4756" strokeWidth="1.2" />
                            <circle cx="0" cy="0" r="3.2" fill={primaryColor} />
                            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                        </g>

                        {/* Chin Bar Ventilation Grille (Front Mouth Intake) */}
                        <g transform="translate(142, 134)">
                            <path d="M 0 0 L 8 -1 L 7 6 L -1 6 Z" fill="#0c0e12" stroke="#2c333e" strokeWidth="0.8" />
                            <line x1="2" y1="1" x2="1" y2="5" stroke="#485568" strokeWidth="1" />
                            <line x1="5" y1="1" x2="4" y2="5" stroke="#485568" strokeWidth="1" />
                        </g>

                        {/* Chin Airflow Deflector Lip */}
                        <path
                            d="M 128 146 Q 146 145 156 138"
                            stroke={primaryColor}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                        />

                        {/* Pilot Number on Helmet Chin / Shell (If Available) */}
                        {numDisplay && (
                            <g transform="translate(74, 134) rotate(-8)">
                                <rect x="-2" y="-12" width="28" height="15" rx="3" fill="#000000" fillOpacity="0.65" stroke={primaryColor} strokeWidth="0.8" />
                                <text
                                    x="12"
                                    y="-1"
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize="12"
                                    fontFamily="Impact, system-ui, sans-serif"
                                    fontWeight="900"
                                    fontStyle="italic"
                                >
                                    {numDisplay}
                                </text>
                            </g>
                        )}
                    </g>
                </g>

                {/* ============================================================ */}
                {/* 3. HUD TELEMETRY FRAME & ROTATION TICKS */}
                {/* ============================================================ */}
                {showHUD && (
                    <g pointerEvents="none">
                        {/* Outer Dark Bezel */}
                        <circle
                            cx="100"
                            cy="100"
                            r="96"
                            stroke="#181c22"
                            strokeWidth="4"
                        />

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

                        {/* Angle Calibration Ticks */}
                        <g stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1">
                            <line x1="168" y1="32" x2="163" y2="37" />
                            <line x1="32" y1="168" x2="37" y2="163" />
                            <line x1="168" y1="168" x2="163" y2="163" />
                            <line x1="32" y1="32" x2="37" y2="37" />
                        </g>

                        {/* Status Sensor Blip (Top Right HUD LED) */}
                        <circle cx="168" cy="32" r="3.5" fill="#00ff66" />
                        <circle cx="168" cy="32" r="6" stroke="#00ff66" strokeWidth="1" opacity="0.6" />
                    </g>
                )}
            </svg>

            {/* FLOATING DRIVER NUMBER BADGE (Bottom-Right Pill) */}
            {showBadge && numDisplay && (
                <div
                    className="absolute -bottom-1 -right-1 z-10 flex items-center justify-center font-display font-black text-black rounded-md px-1.5 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)] border border-black/40"
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
