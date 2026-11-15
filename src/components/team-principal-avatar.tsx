"use client";

import React from 'react';

interface TeamPrincipalAvatarProps {
    teamCode: string;
    size?: number;
    className?: string;
}

/**
 * Avatares vetoriais pixel-art estilizados idênticos aos chefes de equipe reais da F1:
 * - MER: Toto Wolff (T.WULFF) - Cabelo escuro penteado, headset de rádio preto nos ouvidos, camisa branca
 * - RBR: Christian Horner (C.HORNE) - Jaqueta Red Bull marinho/vermelho, cabelo castanho claro, fone de mureta
 * - FER: Fred Vasseur (F.VASSEUX) - Cabeça raspada/careca, fone de rádio vermelho, camisa vermelha Scuderia
 * - MCL: Andrea Stella (A.STELLAR) - Cabelo preto curto, camisa preta/laranja papaya, fone analítico
 * - AST: Mike Krack (M.KRAKE) - Óculos metálicos, camisa verde britânica Aston Martin
 * - WIL: James Vowles (J.VOWLESON) - Camisa azul escuro Williams, fone e postura calma
 * - ALP: Oliver Oakes (O.OAKESBY) - Traços jovens, camisa preta/azul Alpine
 * - HAA: Ayao Komatsu (A.KOMATSU) - Cabelo preto liso, camisa branca/preta Haas
 * - AUD: Mattia Binotto (M.BINOTTI) - Cabelo cacheado volumoso, óculos redondos clássicos
 * - RBA: Laurent Mekies (L.MEKIEZ) - Cabelo castanho, camisa azul Racing Bulls
 * - CAD: Michael Andretti (M.ANDRETTO) - Cabelo grisalho icônico, camisa Cadillac
 */
export function TeamPrincipalAvatar({
    teamCode,
    size = 56,
    className = "",
}: TeamPrincipalAvatarProps) {
    const code = (teamCode || 'FER').toUpperCase();

    // Paleta e configurações personalizadas para cada chefe
    const getPrincipalTheme = () => {
        switch (code) {
            case 'MER':
                return {
                    teamName: 'Mercedes-AMG',
                    bgGradient: ['#0f172a', '#00d2be'],
                    hairColor: '#1e293b',
                    skinColor: '#f1c27d',
                    shirtColor: '#f8fafc',
                    accentColor: '#00d2be',
                    hasGlasses: false,
                    isBald: false,
                    headset: '#111827',
                    details: 'TOTO'
                };
            case 'RBR':
                return {
                    teamName: 'Red Bull Racing',
                    bgGradient: ['#0a192f', '#dc2626'],
                    hairColor: '#78350f',
                    skinColor: '#f5cba7',
                    shirtColor: '#0c2340',
                    accentColor: '#facc15',
                    hasGlasses: false,
                    isBald: false,
                    headset: '#1e293b',
                    details: 'HORNER'
                };
            case 'FER':
                return {
                    teamName: 'Scuderia Ferrari',
                    bgGradient: ['#450a0a', '#dc2626'],
                    hairColor: '#d1d5db',
                    skinColor: '#f8d7da',
                    shirtColor: '#dc2626',
                    accentColor: '#fef08a',
                    hasGlasses: true,
                    isBald: true,
                    headset: '#991b1b',
                    details: 'VASSEUR'
                };
            case 'MCL':
                return {
                    teamName: 'McLaren F1',
                    bgGradient: ['#1c1917', '#ff8000'],
                    hairColor: '#18181b',
                    skinColor: '#f5d0b0',
                    shirtColor: '#ff8000',
                    accentColor: '#000000',
                    hasGlasses: true,
                    isBald: false,
                    headset: '#27272a',
                    details: 'STELLA'
                };
            case 'AST':
                return {
                    teamName: 'Aston Martin',
                    bgGradient: ['#022c22', '#059669'],
                    hairColor: '#52525b',
                    skinColor: '#fae1c5',
                    shirtColor: '#00594f',
                    accentColor: '#ccff00',
                    hasGlasses: true,
                    isBald: false,
                    headset: '#064e3b',
                    details: 'KRACK'
                };
            case 'WIL':
                return {
                    teamName: 'Williams Racing',
                    bgGradient: ['#082f49', '#0284c7'],
                    hairColor: '#451a03',
                    skinColor: '#f5d0b0',
                    shirtColor: '#002f6c',
                    accentColor: '#38bdf8',
                    hasGlasses: false,
                    isBald: false,
                    headset: '#0c4a6e',
                    details: 'VOWLES'
                };
            case 'AUD':
                return {
                    teamName: 'Audi F1',
                    bgGradient: ['#18181b', '#ef4444'],
                    hairColor: '#27272a',
                    skinColor: '#f5cba7',
                    shirtColor: '#18181b',
                    accentColor: '#ef4444',
                    hasGlasses: true,
                    isBald: false,
                    headset: '#3f3f46',
                    details: 'BINOTTO'
                };
            default:
                return {
                    teamName: 'Paddock Principal',
                    bgGradient: ['#111827', '#fbaa19'],
                    hairColor: '#27272a',
                    skinColor: '#f5cba7',
                    shirtColor: '#1f2937',
                    accentColor: '#fbaa19',
                    hasGlasses: false,
                    isBald: false,
                    headset: '#030712',
                    details: 'CHIEF'
                };
        }
    };

    const t = getPrincipalTheme();

    return (
        <div 
            className={`relative rounded-[2px] overflow-hidden border border-black/40 shadow-[0_2px_8px_rgba(0,0,0,0.6)] shrink-0 select-none ${className}`}
            style={{ width: size, height: size }}
            title={`Chefe de Equipe // ${t.teamName}`}
        >
            <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                className="w-full h-full block"
            >
                {/* Fundo Gradiente da Garagem */}
                <defs>
                    <linearGradient id={`grad-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={t.bgGradient[0]} />
                        <stop offset="100%" stopColor={t.bgGradient[1]} />
                    </linearGradient>
                    <pattern id={`grid-pat-${code}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                    </pattern>
                </defs>

                <rect width="100" height="100" fill={`url(#grad-${code})`} />
                <rect width="100" height="100" fill={`url(#grid-pat-${code})`} />

                {/* Corpo / Ombro e Camisa Oficial */}
                <path
                    d="M 16 100 L 26 72 L 74 72 L 84 100 Z"
                    fill={t.shirtColor}
                    stroke="#000"
                    strokeWidth="2"
                />

                {/* Colarinho / Zíper / Detalhes da Escuderia */}
                <polygon points="44,72 56,72 50,86" fill={t.accentColor} opacity="0.9" />
                <line x1="50" y1="84" x2="50" y2="100" stroke="#000" strokeWidth="1.5" />

                {/* Pescoço */}
                <rect x="42" y="58" width="16" height="18" fill={t.skinColor} stroke="#000" strokeWidth="1.5" />

                {/* Rosto / Mandíbula */}
                {t.isBald ? (
                    // Rosto mais arredondado para Fred Vasseur
                    <ellipse cx="50" cy="46" rx="22" ry="24" fill={t.skinColor} stroke="#000" strokeWidth="2" />
                ) : (
                    // Rosto angular executivo (Toto / Horner / Stella)
                    <polygon points="28,32 72,32 68,60 50,68 32,60" fill={t.skinColor} stroke="#000" strokeWidth="2" />
                )}

                {/* Cabelo Icônico */}
                {!t.isBald && (
                    <>
                        {code === 'MER' && (
                            // Toto: Corte elegante com risca lateral
                            <path
                                d="M 26 34 C 28 16, 72 16, 74 34 C 68 22, 38 22, 26 34 Z"
                                fill={t.hairColor}
                                stroke="#000"
                                strokeWidth="1.5"
                            />
                        )}
                        {code === 'RBR' && (
                            // Horner: Cabelo castanho com mecha sutil
                            <path
                                d="M 25 35 C 28 18, 70 18, 75 35 C 65 24, 35 24, 25 35 Z"
                                fill={t.hairColor}
                                stroke="#000"
                                strokeWidth="1.5"
                            />
                        )}
                        {code === 'MCL' && (
                            // Stella: Cabelo curto italiano discreto
                            <path
                                d="M 27 34 C 30 20, 70 20, 73 34 C 64 25, 36 25, 27 34 Z"
                                fill={t.hairColor}
                                stroke="#000"
                                strokeWidth="1.5"
                            />
                        )}
                        {code !== 'MER' && code !== 'RBR' && code !== 'MCL' && (
                            <path
                                d="M 26 34 C 28 18, 72 18, 74 34 C 66 22, 34 22, 26 34 Z"
                                fill={t.hairColor}
                                stroke="#000"
                                strokeWidth="1.5"
                            />
                        )}
                    </>
                )}

                {/* Sobrancelhas */}
                <rect x="36" y="38" width="10" height="2" fill="#1e293b" rx="1" />
                <rect x="54" y="38" width="10" height="2" fill="#1e293b" rx="1" />

                {/* Olhos Focados */}
                <ellipse cx="41" cy="43" rx="2.5" ry="1.8" fill="#0f172a" />
                <ellipse cx="59" cy="43" rx="2.5" ry="1.8" fill="#0f172a" />
                <circle cx="41.5" cy="42.5" r="0.6" fill="#fff" />
                <circle cx="59.5" cy="42.5" r="0.6" fill="#fff" />

                {/* Nariz */}
                <polygon points="50,44 48,53 52,53" fill="rgba(0,0,0,0.18)" />

                {/* Boca / Expressão Determinada */}
                <line x1="44" y1="58" x2="56" y2="58" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

                {/* Óculos (para Fred Vasseur, Andrea Stella, Mike Krack, Binotto) */}
                {t.hasGlasses && (
                    <g stroke="#18181b" strokeWidth="1.5" fill="none">
                        <rect x="34" y="39" width="13" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
                        <rect x="53" y="39" width="13" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
                        <line x1="47" y1="43" x2="53" y2="43" />
                    </g>
                )}

                {/* Headset de Rádio de Pitwall (Fone de Mureta) */}
                <g>
                    {/* Alça do fone sobre a cabeça */}
                    <path
                        d="M 22 42 C 22 14, 78 14, 78 42"
                        fill="none"
                        stroke={t.headset}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                    {/* Concha Esquerda do Headset */}
                    <rect x="18" y="36" width="7" height="15" rx="3" fill={t.headset} stroke="#000" strokeWidth="1" />
                    {/* Concha Direita do Headset */}
                    <rect x="75" y="36" width="7" height="15" rx="3" fill={t.headset} stroke="#000" strokeWidth="1" />
                    {/* Microfone de Rádio curvado até a boca */}
                    <path
                        d="M 23 48 C 26 58, 38 64, 46 62"
                        fill="none"
                        stroke={t.headset}
                        strokeWidth="2"
                    />
                    <circle cx="46" cy="62" r="2.5" fill="#fbaa19" />
                </g>

                {/* Tag de Código Oficial no Rodapé */}
                <rect x="0" y="88" width="100" height="12" fill="rgba(0,0,0,0.85)" />
                <text
                    x="50"
                    y="97"
                    textAnchor="middle"
                    fill={t.accentColor}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="900"
                    letterSpacing="0.8"
                >
                    {t.details}
                </text>
            </svg>
        </div>
    );
}
