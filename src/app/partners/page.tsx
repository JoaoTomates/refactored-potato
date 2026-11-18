"use client";

import React, { useState } from 'react';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

interface PartnerHexItem {
    id: string;
    name: string;
    category: string;
    renderEmblem: (isHovered: boolean) => React.ReactNode;
}

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

const PARTNERS: PartnerHexItem[] = [
    {
        id: 'lvmh',
        name: 'LVMH',
        category: 'RELÓGIO',
        renderEmblem: (isHovered) => (
            <svg viewBox="0 0 80 80" className="w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105" fill="none">
                {/* Pulseira superior e inferior do Relógio */}
                <rect x="31" y="6" width="18" height="10" rx="1.5" stroke={isHovered ? '#fbaa19' : '#9ca3af'} strokeWidth="2" />
                <rect x="31" y="64" width="18" height="10" rx="1.5" stroke={isHovered ? '#fbaa19' : '#9ca3af'} strokeWidth="2" />
                {/* Caixa e coroa do Cronógrafo */}
                <circle cx="40" cy="40" r="22" fill="#0d0e11" stroke={isHovered ? '#fbaa19' : '#d1d5db'} strokeWidth="2.4" />
                <circle cx="40" cy="40" r="17.5" stroke={isHovered ? '#fbaa19' : '#4b5563'} strokeWidth="1.2" strokeDasharray="2 3" />
                <rect x="62" y="36.5" width="4.5" height="7" rx="1" fill={isHovered ? '#fbaa19' : '#9ca3af'} />
                {/* Ponteiros e sub-mostrador */}
                <line x1="40" y1="40" x2="40" y2="26" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="40" y1="40" x2="50" y2="44" stroke={isHovered ? '#fbaa19' : '#d1d5db'} strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="40" r="2.2" fill="#fbaa19" />
                <circle cx="40" cy="50" r="3.5" stroke="#6b7280" strokeWidth="1.2" />
            </svg>
        ),
    },
    {
        id: 'heineken',
        name: 'HEINEKEN',
        category: 'CERVEJA',
        renderEmblem: (isHovered) => (
            <svg viewBox="0 0 80 80" className="w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105" fill="none">
                {/* Espuma da Cerveja */}
                <path
                    d="M23 23 C20 17, 26 12, 32 15 C35 11, 44 11, 48 15 C54 13, 59 18, 56 23 Z"
                    fill="#14161a"
                    stroke={isHovered ? '#fbaa19' : '#e5e7eb'}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                {/* Caneca de Cerveja */}
                <path
                    d="M24 23 H55 L52.5 64 C52.3 66.2 50.5 68 48.2 68 H30.8 C28.5 68 26.7 66.2 26.5 64 Z"
                    fill="#0d0e11"
                    stroke={isHovered ? '#fbaa19' : '#d1d5db'}
                    strokeWidth="2.3"
                    strokeLinejoin="round"
                />
                {/* Alça da caneca */}
                <path
                    d="M54.5 31 H61 C63.8 31 66 33.2 66 36 V50 C66 52.8 63.8 55 61 55 H53.2"
                    stroke={isHovered ? '#fbaa19' : '#9ca3af'}
                    strokeWidth="2.3"
                    strokeLinecap="round"
                />
                {/* Estrela estilizada & frisos */}
                <polygon
                    points="39.5,34 41.4,39.4 47,39.4 42.5,42.8 44.2,48.2 39.5,44.9 34.8,48.2 36.5,42.8 32,39.4 37.6,39.4"
                    fill={isHovered ? '#fbaa19' : '#9ca3af'}
                />
                <line x1="33" y1="56" x2="46" y2="56" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'pirelli',
        name: 'PIRELLI',
        category: 'PNEU F1',
        renderEmblem: (isHovered) => (
            <svg viewBox="0 0 80 80" className="w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105" fill="none">
                {/* Pneu Slick de Fórmula 1 */}
                <circle cx="40" cy="40" r="27" fill="#0b0c0e" stroke={isHovered ? '#fbaa19' : '#d1d5db'} strokeWidth="2.4" />
                {/* Faixa lateral Pirelli estilizada */}
                <circle
                    cx="40"
                    cy="40"
                    r="21.5"
                    stroke={isHovered ? '#fbaa19' : '#9ca3af'}
                    strokeWidth="2"
                    strokeDasharray="24 8"
                    strokeLinecap="round"
                />
                {/* Aro da roda */}
                <circle cx="40" cy="40" r="14.5" fill="#15171c" stroke="#6b7280" strokeWidth="1.8" />
                {/* Raios e porca central */}
                <line x1="40" y1="26" x2="40" y2="54" stroke="#9ca3af" strokeWidth="1.8" />
                <line x1="27.8" y1="33" x2="52.2" y2="47" stroke="#9ca3af" strokeWidth="1.8" />
                <line x1="52.2" y1="33" x2="27.8" y2="47" stroke="#9ca3af" strokeWidth="1.8" />
                <circle cx="40" cy="40" r="5" fill="#090a0c" stroke="#fbaa19" strokeWidth="2" />
            </svg>
        ),
    },
    {
        id: 'dhl',
        name: 'DHL',
        category: 'CARTA',
        renderEmblem: (isHovered) => (
            <svg viewBox="0 0 80 80" className="w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105" fill="none">
                {/* Linhas de velocidade postal */}
                <line x1="8" y1="31" x2="18" y2="31" stroke="#fbaa19" strokeWidth="2" strokeLinecap="round" />
                <line x1="5" y1="40" x2="16" y2="40" stroke={isHovered ? '#fbaa19' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="49" x2="18" y2="49" stroke="#fbaa19" strokeWidth="2" strokeLinecap="round" />
                {/* Carta / Envelope expresso */}
                <rect
                    x="20"
                    y="23"
                    width="50"
                    height="34"
                    rx="2.5"
                    fill="#0d0e11"
                    stroke={isHovered ? '#fbaa19' : '#d1d5db'}
                    strokeWidth="2.3"
                />
                <path
                    d="M21 25 L45 43 L69 25"
                    stroke={isHovered ? '#fbaa19' : '#e5e7eb'}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                />
                <line x1="22" y1="55" x2="36" y2="42" stroke="#4b5563" strokeWidth="1.8" />
                <line x1="68" y1="55" x2="54" y2="42" stroke="#4b5563" strokeWidth="1.8" />
            </svg>
        ),
    },
    {
        id: 'aramco',
        name: 'ARAMCO',
        category: 'COMBUSTÍVEIS',
        renderEmblem: (isHovered) => (
            <svg viewBox="0 0 80 80" className="w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105" fill="none">
                {/* Gota de combustível sustentável + núcleo energético */}
                <path
                    d="M40 12 C40 12, 60 35, 60 49 C60 60.5 51 69 40 69 C29 69 20 60.5 20 49 C20 35 40 12 40 12 Z"
                    fill="#0d0e11"
                    stroke={isHovered ? '#fbaa19' : '#d1d5db'}
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                />
                {/* Raio de octanagem / combustão limpa */}
                <path
                    d="M42.5 31 L33 46 H41 L37.5 58 L47 43 H39 Z"
                    fill={isHovered ? '#fbaa19' : '#9ca3af'}
                    stroke={isHovered ? '#fbaa19' : '#d1d5db'}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                {/* Reflexo técnico */}
                <path d="M27 49 C27 54 30 59 35 61.5" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
];

function HoneycombCell({
    partner,
    isHovered,
    onHover,
    onLeave,
}: {
    partner: PartnerHexItem;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}) {
    return (
        <div
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className="group relative w-[114px] h-[132px] sm:w-[196px] sm:h-[226px] md:w-[218px] md:h-[252px] shrink-0 select-none transition-transform duration-300 hover:-translate-y-1"
            style={{
                filter: isHovered
                    ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 18px rgba(251, 170, 25, 0.25))'
                    : 'drop-shadow(0 12px 22px rgba(0, 0, 0, 0.9))',
            }}
        >
            {/* Hexágono externo (borda cinza escuro / destaque âmbar no hover) */}
            <div
                className="w-full h-full p-[2px] transition-colors duration-300"
                style={{
                    clipPath: HEX_CLIP,
                    background: isHovered
                        ? 'linear-gradient(160deg, #fbaa19 0%, #374151 100%)'
                        : 'linear-gradient(160deg, #32363f 0%, #16181d 100%)',
                }}
            >
                {/* Hexágono interno cinza escuro */}
                <div
                    className="w-full h-full flex flex-col items-center justify-center px-2 sm:px-5 text-center relative"
                    style={{
                        clipPath: HEX_CLIP,
                        background: 'radial-gradient(circle at 50% 35%, #23262d 0%, #15171c 62%, #0e1014 100%)',
                    }}
                >
                    {/* Filete interno sutil */}
                    <div
                        className="absolute inset-[6px] sm:inset-[9px] pointer-events-none opacity-45"
                        style={{
                            clipPath: HEX_CLIP,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    />

                    {/* Ícone estilizado */}
                    <div className="mb-1 sm:mb-2.5 flex items-center justify-center">
                        {partner.renderEmblem(isHovered)}
                    </div>

                    {/* Logomarca estilizada no padrão do projeto */}
                    <span
                        className={`text-[11px] sm:text-base md:text-lg font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] transition-colors duration-300 ${
                            partner.id === 'dhl' ? 'italic' : ''
                        } ${isHovered ? 'text-[#fbaa19]' : 'text-white'}`}
                    >
                        {partner.name}
                    </span>

                    {/* Subtítulo do elemento */}
                    <span className="mt-0.5 sm:mt-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        {partner.category}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function PartnersPage() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const topRow = PARTNERS.slice(0, 3);
    const bottomRow = PARTNERS.slice(3, 5);

    return (
        <div className="min-h-dvh w-full bg-[#07080a] text-white flex flex-col font-mono relative overflow-x-clip">
            {/* Malha sutil cinza escuro de fundo */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-20"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 50% 30%, #262932 0%, transparent 65%)',
                }}
            />

            <Navigation />

            <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 pt-28 sm:pt-32 pb-16 flex flex-col items-center justify-center">
                {/* Título Direto */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center tracking-tight text-white mb-10 sm:mb-14">
                    Quer ser um parceiro do <span className="text-[#fbaa19]">The Strategist One</span> ?
                </h1>

                {/* Colmeia Cinza Escuro (3 em cima, 2 encaixados embaixo) */}
                <section
                    aria-label="Global Partners Honeycomb"
                    className="flex flex-col items-center justify-center w-full py-2"
                >
                    <div className="flex items-center justify-center gap-2 sm:gap-3.5 md:gap-4">
                        {topRow.map((partner) => (
                            <HoneycombCell
                                key={partner.id}
                                partner={partner}
                                isHovered={hoveredId === partner.id}
                                onHover={() => setHoveredId(partner.id)}
                                onLeave={() => setHoveredId(null)}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 sm:gap-3.5 md:gap-4 -mt-[28px] sm:-mt-[49px] md:-mt-[55px]">
                        {bottomRow.map((partner) => (
                            <HoneycombCell
                                key={partner.id}
                                partner={partner}
                                isHovered={hoveredId === partner.id}
                                onHover={() => setHoveredId(partner.id)}
                                onLeave={() => setHoveredId(null)}
                            />
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
