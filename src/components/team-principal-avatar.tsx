"use client";

import React, { useState } from 'react';
import { getTeamPrincipal } from '@/lib/paddock-crew';

interface TeamPrincipalAvatarProps {
    teamCode: string;
    size?: number;
    className?: string;
    showBadge?: boolean;
}

/**
 * Avatares oficiais dos Chefes de Equipe da F1 (16-bit Retro Pixel-Art):
 * - MER: Toto Wolff (T.WULFF)
 * - RBR: Christian Horner (C.HORNE)
 * - FER: Fred Vasseur (F.VASSEUX)
 * - MCL: Andrea Stella (A.STELLAR)
 * - AST: Mike Krack (M.KRAKE)
 * - WIL: James Vowles (J.VOWLESON)
 * - ALP: Oliver Oakes (O.OAKESBY)
 * - HAA: Ayao Komatsu (A.KOMATSU)
 * - AUD: Mattia Binotto (M.BINOTTI)
 * - RBA: Laurent Mekies (L.MEKIEZ)
 * - CAD: Michael Andretti (M.ANDRETTO)
 */
export function TeamPrincipalAvatar({
    teamCode,
    size = 56,
    className = "",
    showBadge = true,
}: TeamPrincipalAvatarProps) {
    const code = (teamCode || 'FER').toUpperCase().trim();
    const principal = getTeamPrincipal(code);
    const [imgFailed, setImgFailed] = useState(false);

    // Fallbacks fotográficos retro 16-bit
    const fallbackMap: Record<string, string> = {
        MER: '/avatar/others/alianca_1_a.jpg',
        FER: '/avatar/others/alianca_2_a.jpg',
        MCL: '/avatar/others/alianca_1_b.jpg',
        RBR: '/avatar/others/alianca_3_a.jpg',
        AST: '/avatar/others/alianca_3_b.jpg',
        WIL: '/avatar/others/alianca_1_a.jpg',
        ALP: '/avatar/principals/ALP.jpg',
        HAA: '/avatar/others/alianca_2_b.jpg',
        AUD: '/avatar/others/alianca_3_b.jpg',
        CAD: '/avatar/others/alianca_2_b.jpg',
        RBA: '/avatar/others/alianca_3_a.jpg',
    };

    const primaryUrl = principal.avatarUrl || `/avatar/principals/${code}.jpg`;
    const avatarSrc = imgFailed ? (fallbackMap[code] || '/avatar/others/alianca_1_a.jpg') : primaryUrl;

    return (
        <div
            className={`relative flex flex-col items-center shrink-0 select-none group/tp ${className}`}
            style={{ width: size }}
            title={`${principal.fullName} — ${principal.title}`}
        >
            <div
                className="w-full aspect-square rounded-[3px] overflow-hidden border border-[#000000] p-0.5 flex items-center justify-center transition-all group-hover/tp:ring-1 group-hover/tp:ring-[#fbaa19]"
                style={{
                    background: 'linear-gradient(180deg, #18191c 0%, #0a0b0d 100%)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
            >
                <img
                    src={avatarSrc}
                    alt={principal.fullName}
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover rounded-[2px] filter contrast-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transition-all group-hover/tp:brightness-110"
                />
            </div>
            {showBadge && (
                <span
                    className="text-[9px] font-mono font-black tracking-wider mt-1 text-[#fbaa19] uppercase text-center px-1.5 py-0.5 rounded-[2px] border border-[#000000] truncate max-w-full"
                    style={{
                        background: 'linear-gradient(180deg, #18191c 0%, #0a0b0d 100%)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
                    }}
                >
                    [ {principal.code} ]
                </span>
            )}
        </div>
    );
}
