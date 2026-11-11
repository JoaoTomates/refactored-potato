"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, Shield, Award, Cpu, Users, SlidersHorizontal } from 'lucide-react';
import { getSystemBoxStyle } from '@/components/system-modal';
import {
    CrewCategory,
    CrewRolesConfig,
    DEFAULT_CREW_ROLES_CONFIG,
    applyCharacterOverride,
    fetchCrewRolesConfig,
    getBaseCrewCatalog,
} from '@/lib/crew-config';

export type { CrewCategory };

interface CrewProfileItem {
    id: string;
    category: CrewCategory;
    code: string;
    fullName: string;
    role: string;
    subtitle: string;
    avatarUrl: string;
    fallbackUrl: string;
    accentColor: string;
    characteristics: Array<{ label: string; value: string }>;
    bioOrQuote: string;
}

export interface CrewViewProps {
    embedded?: boolean;
    initialType?: CrewCategory;
    initialId?: string | null;
}

export default function CrewView({
    embedded = false,
    initialType = 'senior',
    initialId = null,
}: CrewViewProps) {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<CrewCategory>(
        ['senior', 'tech', 'chief'].includes(initialType) ? initialType : 'senior'
    );
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);

    useEffect(() => {
        fetchCrewRolesConfig().then((cfg) => setCrewConfig(cfg));
    }, []);

    const allItems = useMemo(() => {
        const mapped = getBaseCrewCatalog().map((raw) => {
            const c = applyCharacterOverride(raw, crewConfig);
            const characteristics = [
                ...c.extraCharacteristics,
                {
                    label: c.subType === 'tech' ? 'ESPECIALIDADE TÁTICA' : c.subType === 'team_principal' ? 'DIRETRIZ DA MURETA' : 'ESPECIALIDADE',
                    value: c.specialty,
                },
            ];
            return {
                id: c.id,
                category: c.category,
                code: c.code,
                fullName: c.fullName,
                role: c.role,
                subtitle: c.subtitle,
                avatarUrl: c.avatarUrl,
                fallbackUrl: c.fallbackUrl,
                accentColor: c.accentColor,
                characteristics,
                bioOrQuote: c.bioOrQuote,
            } satisfies CrewProfileItem;
        });

        return {
            senior: mapped.filter((m) => m.category === 'senior'),
            tech: mapped.filter((m) => m.category === 'tech'),
            chief: mapped.filter((m) => m.category === 'chief'),
        };
    }, [crewConfig]);

    const activeList = allItems[activeCategory];

    useEffect(() => {
        if (initialId) {
            const idx = activeList.findIndex(
                (item) => item.id.toLowerCase() === initialId.toLowerCase() || item.code.toLowerCase() === initialId.toLowerCase()
            );
            if (idx >= 0) {
                setCurrentIndex(idx);
            }
        }
    }, [initialId, activeList]);

    const currentItem = activeList[currentIndex] || activeList[0];

    const handleCategoryChange = (cat: CrewCategory) => {
        setActiveCategory(cat);
        setCurrentIndex(0);
        if (!embedded) {
            const firstId = allItems[cat][0]?.id || '';
            router.replace(`/crew?type=${cat}&id=${encodeURIComponent(firstId)}`, { scroll: false });
        }
    };

    const handleSelectIndex = (newIdx: number) => {
        const clamped = (newIdx + activeList.length) % activeList.length;
        setCurrentIndex(clamped);
        if (!embedded) {
            const item = activeList[clamped];
            if (item) {
                router.replace(`/crew?type=${activeCategory}&id=${encodeURIComponent(item.id)}`, { scroll: false });
            }
        }
    };

    const inner = (
        <div className={`relative z-10 w-full ${embedded ? 'max-w-4xl mx-auto' : 'max-w-3xl'} flex flex-col gap-6 font-mono`}>
            {/* Header & Back link */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    {!embedded && (
                        <Link
                            href="/"
                            className="p-2 rounded-[3px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>VOLTAR</span>
                        </Link>
                    )}
                    <div>
                        <span className="text-[10px] tracking-[0.25em] text-white/40 uppercase block">
                            BAEFF1 // DOSSIÊ DE PADDOCK
                        </span>
                        <h1 className="text-lg md:text-xl font-black tracking-widest uppercase text-white">
                            CORPO TÉCNICO &amp; LIDERANÇA
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/crew-edit"
                        className="text-[10px] sm:text-xs px-3 py-1.5 rounded-[3px] bg-[#030303] border border-[#000000] hover:border-[#fbaa19] text-[#fbaa19] font-black tracking-widest uppercase flex items-center gap-1.5 transition-colors"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>EDITAR FUNÇÕES</span>
                    </Link>
                    <div className="text-xs px-3 py-1.5 rounded-[3px] bg-[#030303] border border-white/15 font-bold tracking-widest text-white/80">
                        {String(currentIndex + 1).padStart(2, '0')} / {String(activeList.length).padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Seletor de Categoria */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={() => handleCategoryChange('senior')}
                    className={`py-2.5 px-3 rounded-[3px] border text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeCategory === 'senior'
                            ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.3)]'
                            : 'bg-[#030303] text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Award className="w-4 h-4 shrink-0" />
                    <span className="truncate">SÊNIORS ({allItems.senior.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleCategoryChange('tech')}
                    className={`py-2.5 px-3 rounded-[3px] border text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeCategory === 'tech'
                            ? 'bg-[#38bdf8] text-black border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                            : 'bg-[#030303] text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Cpu className="w-4 h-4 shrink-0" />
                    <span className="truncate">TÉCNICOS ({allItems.tech.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleCategoryChange('chief')}
                    className={`py-2.5 px-3 rounded-[3px] border text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeCategory === 'chief'
                            ? 'bg-[#e8002d] text-white border-[#e8002d] shadow-[0_0_20px_rgba(232,0,45,0.35)]'
                            : 'bg-[#030303] text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span className="truncate">CHEFES ({allItems.chief.length})</span>
                </button>
            </div>

            {/* CARD INDIVIDUAL DO PERSONAGEM */}
            <div
                className="rounded-[3px] border border-[#000000] overflow-hidden transition-all duration-300"
                style={getSystemBoxStyle(currentItem.accentColor)}
            >
                <div className="h-1 w-full" style={{ backgroundColor: currentItem.accentColor }} />

                <div className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/10 pb-6">
                        <div
                            className="w-36 h-36 sm:w-44 sm:h-44 rounded-[3px] border-2 overflow-hidden bg-black shrink-0 relative shadow-2xl"
                            style={{ borderColor: currentItem.accentColor }}
                        >
                            <img
                                src={currentItem.avatarUrl}
                                alt={currentItem.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    if (img.src !== window.location.origin + currentItem.fallbackUrl) {
                                        img.src = currentItem.fallbackUrl;
                                    }
                                }}
                            />
                            <div
                                className="absolute bottom-0 inset-x-0 h-1.5"
                                style={{ backgroundColor: currentItem.accentColor }}
                            />
                        </div>

                        <div className="flex-1 text-center sm:text-left min-w-0 flex flex-col justify-center">
                            <span
                                className="inline-block self-center sm:self-start text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-[3px] border mb-2"
                                style={{
                                    borderColor: `${currentItem.accentColor}50`,
                                    color: currentItem.accentColor,
                                    backgroundColor: `${currentItem.accentColor}15`
                                }}
                            >
                                {currentItem.subtitle}
                            </span>

                            <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-white uppercase leading-none mb-2">
                                {currentItem.code}
                            </h2>

                            <p className="text-base sm:text-lg font-bold text-white/80 mb-2">
                                {currentItem.fullName}
                            </p>

                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: currentItem.accentColor }}>
                                {currentItem.role}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentItem.characteristics.map((char, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-[3px] bg-white/[0.03] border border-white/10 flex flex-col gap-1"
                            >
                                <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">
                                    {char.label}
                                </span>
                                <span className="text-xs sm:text-sm text-white/95 font-medium leading-snug">
                                    {char.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div
                        className="p-4 rounded-[3px] bg-white/[0.02] border-l-4 text-xs sm:text-sm text-white/80 italic leading-relaxed"
                        style={{ borderLeftColor: currentItem.accentColor }}
                    >
                        {currentItem.bioOrQuote}
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#030303] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => handleSelectIndex(currentIndex - 1)}
                        className="px-4 py-2 rounded-[3px] bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ANTERIOR</span>
                    </button>

                    <div className="flex items-center gap-2 flex-1 max-w-xs justify-center">
                        <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <select
                            aria-label="Selecionar integrante"
                            value={currentIndex}
                            onChange={(e) => handleSelectIndex(Number(e.target.value))}
                            className="w-full bg-black border border-white/20 rounded-[3px] px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-white/50 cursor-pointer"
                        >
                            {activeList.map((item, idx) => (
                                <option key={item.id} value={idx}>
                                    {String(idx + 1).padStart(2, '0')} · {item.code} ({item.fullName})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSelectIndex(currentIndex + 1)}
                        className="px-4 py-2 rounded-[3px] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer text-black hover:brightness-110"
                        style={{ backgroundColor: currentItem.accentColor }}
                    >
                        <span>PRÓXIMO</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (embedded) {
        return inner;
    }

    return (
        <main className="min-h-screen bg-[#020202] text-white font-mono flex flex-col items-center px-4 py-8 md:py-12 relative overflow-x-hidden">
            <div
                className="fixed inset-0 pointer-events-none opacity-20 transition-colors duration-500"
                style={{
                    background: `radial-gradient(circle at 50% 25%, ${currentItem.accentColor}30 0%, transparent 65%)`
                }}
            />
            {inner}
        </main>
    );
}
