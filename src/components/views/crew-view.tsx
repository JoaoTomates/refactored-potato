"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, Shield, Award, Cpu, Users } from 'lucide-react';
import { SENIOR_STRATEGISTS } from '@/lib/race-directors';
import { CANONICAL_ENGINEERS_METADATA } from '@/lib/group-engineers';
import { TEAM_PRINCIPALS } from '@/lib/paddock-crew';
import { getSystemBoxStyle } from '@/components/system-modal';

export type CrewCategory = 'senior' | 'tech' | 'chief';

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

const ALLIANCE_CHIEFS_META = [
    {
        id: 'chief-chadwick',
        code: 'D.CHADWICK',
        fullName: 'Daniel Chadwick',
        role: 'Engenheiro-Chefe de Calibração Térmica e Mapeamento de Potência',
        subtitle: 'CONSÓRCIO DA ESTRELA // BLOCO A',
        age: '48 anos',
        nationality: 'Britânico',
        profile: 'Formado na clássica escola de motorsport de Northamptonshire. Especialista em balancear curvas de entrega de potência e mapas de ignição agressivos sem ultrapassar as janelas de temperatura de câmara.',
        keyAttribute: 'Otimização de tempo em voltas de qualificação (Quali Mode).',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_a.jpg',
        fallbackUrl: '/avatar/others/alianca_1_a.jpg',
        accentColor: '#00d2be'
    },
    {
        id: 'chief-schweiger',
        code: 'K.SCHWEIGER',
        fullName: 'Klaus Schweiger',
        role: 'Especialista em Dinâmica de Turbocompressores & Fluxo de Gases',
        subtitle: 'CONSÓRCIO DA ESTRELA // BLOCO A',
        age: '54 anos',
        nationality: 'Alemão',
        profile: 'Engenharia de precisão com vasta experiência em bancos de teste de Stuttgart. Focado na eficiência termodinâmica da turbina e no aproveitamento máximo do fluxo de escape para eliminar o atraso de turbo.',
        keyAttribute: 'Confiabilidade do compressor e resposta linear de aceleração.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_1_b.jpg',
        fallbackUrl: '/avatar/others/alianca_1_b.jpg',
        accentColor: '#00d2be'
    },
    {
        id: 'chief-bellini',
        code: 'M.BELLINI',
        fullName: 'Matteo Bellini',
        role: 'Engenheiro-Chefe & Mestre de Metalurgia e Resistência',
        subtitle: 'DINASTIA DE MARANELLO // BLOCO B',
        age: '61 anos',
        nationality: 'Italiano',
        profile: 'Veterano forjado nos bastidores de Maranello. Especialista em ligas ultraleves para pistões, bielas forjadas e válvulas de titânio preparadas para suportar regimes extremos de rotação contínua.',
        keyAttribute: 'Redução de desgaste mecânico e fadiga de material em alta quilometragem.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_a.jpg',
        fallbackUrl: '/avatar/others/alianca_2_a.jpg',
        accentColor: '#e8002d'
    },
    {
        id: 'chief-crawford',
        code: 'A.CRAWFORD',
        fullName: 'Alistair Crawford',
        role: 'Engenheiro de Sistemas de Combustível & Injeção Direta',
        subtitle: 'DINASTIA DE MARANELLO // BLOCO B',
        age: '41 anos',
        nationality: 'Britânico',
        profile: 'Focado nas altas pressões das bombas de combustível e na atomização do spray nos cilindros. Trabalha no limite dos fluxômetros para extrair máxima queima de cada gota de combustível permitida pelo regulamento.',
        keyAttribute: 'Economia de combustível em ritmo sustentado de corrida (Lift and Coast).',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_2_b.jpg',
        fallbackUrl: '/avatar/others/alianca_2_b.jpg',
        accentColor: '#e8002d'
    },
    {
        id: 'chief-zimmermann',
        code: 'S.ZIMMERMANN',
        fullName: 'Stefan Zimmermann',
        role: 'Engenheiro-Chefe de Lubrificação, Pressão Hidráulica e Refrigeração',
        subtitle: 'A VANGUARDA // BLOCO C',
        age: '36 anos',
        nationality: 'Alemão',
        profile: 'Metódico e analítico, monitora o circuito de cárter seco, dissipação de calor nos radiadores e viscosidade de óleos sintéticos sob forças centrífugas elevadas em curvas de alta velocidade.',
        keyAttribute: 'Prevenção de quebras críticas por superaquecimento ou perda de pressão de óleo.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_a.jpg',
        fallbackUrl: '/avatar/others/alianca_3_a.jpg',
        accentColor: '#38bdf8'
    },
    {
        id: 'chief-marchetti',
        code: 'G.MARCHETTI',
        fullName: 'Giulio Marchetti',
        role: 'Engenheiro de Integração Dinâmica & Análise Harmônica',
        subtitle: 'A VANGUARDA // BLOCO C',
        age: '49 anos',
        nationality: 'Italiano',
        profile: 'Especialista na interface entre o bloco do motor e o chassi de fibra de carbono. Analisa as frequências vibratórias do virabrequim para mitigar ressonâncias parasitas que afetam suportes estruturais e chicotes elétricos.',
        keyAttribute: 'Estabilidade mecânica da unidade de potência acoplada ao monocoque.',
        avatarUrl: 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/others/alianca_3_b.jpg',
        fallbackUrl: '/avatar/others/alianca_3_b.jpg',
        accentColor: '#38bdf8'
    }
];

const TEAM_COLORS_MAP: Record<string, { color: string; allianceImg: string }> = {
    MER: { color: '#27F4D2', allianceImg: '/avatar/others/alianca_1_a.jpg' },
    MCL: { color: '#FF8000', allianceImg: '/avatar/others/alianca_1_a.jpg' },
    ALP: { color: '#0093CC', allianceImg: '/avatar/others/alianca_1_b.jpg' },
    WIL: { color: '#64C4FF', allianceImg: '/avatar/others/alianca_1_b.jpg' },
    FER: { color: '#E8002D', allianceImg: '/avatar/others/alianca_2_a.jpg' },
    HAA: { color: '#B6BABD', allianceImg: '/avatar/others/alianca_2_b.jpg' },
    CAD: { color: '#D4AF37', allianceImg: '/avatar/others/alianca_2_a.jpg' },
    RBR: { color: '#3671C6', allianceImg: '/avatar/others/alianca_3_a.jpg' },
    AST: { color: '#229971', allianceImg: '/avatar/others/alianca_3_b.jpg' },
    RBA: { color: '#6692FF', allianceImg: '/avatar/others/alianca_3_a.jpg' },
    AUD: { color: '#52E252', allianceImg: '/avatar/others/alianca_3_b.jpg' },
};

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

    const allItems = useMemo(() => {
        const seniors: CrewProfileItem[] = SENIOR_STRATEGISTS.map((s) => {
            const num = parseInt(s.id.replace('strat-', ''), 10) || 1;
            const localImg = `/avatar/ex_drivers/avatar_driver_${num}.jpg`;
            return {
                id: s.id,
                category: 'senior',
                code: s.code,
                fullName: `${s.displayName} (${s.originalDriver})`,
                role: s.title,
                subtitle: `ESTRATEGISTA SÊNIOR // ERA ${s.decade}`,
                avatarUrl: (s as any).avatarUrl || localImg,
                fallbackUrl: localImg,
                accentColor: '#fbaa19',
                characteristics: [
                    { label: 'NACIONALIDADE', value: s.nationality },
                    { label: 'ESPECIALIDADE', value: s.specialty },
                    { label: 'HISTÓRICO REAL', value: s.careerStat },
                    { label: 'ASSERTIVIDADE', value: `${s.evaluation.accuracyRate}% (${s.evaluation.communityRating}/5.0)` },
                ],
                bioOrQuote: `${s.signatureQuote} — ${s.biography}`
            };
        });

        const techs: CrewProfileItem[] = CANONICAL_ENGINEERS_METADATA.map((t, i) => {
            const idx = i + 1;
            const localFallback = idx === 23 ? '/avatar/eng/avatar_25b.jpg' : `/avatar/eng/avatar_${idx}.jpg`;
            return {
                id: `eng-${idx}`,
                category: 'tech',
                code: t.code,
                fullName: t.fullName,
                role: t.role,
                subtitle: `ENGENHEIRO TÉCNICO // REGISTRO ENG #${idx}`,
                avatarUrl: `https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/eng/avatar_${idx}.jpg`,
                fallbackUrl: localFallback,
                accentColor: '#38bdf8',
                characteristics: [
                    { label: 'NACIONALIDADE', value: t.nationality },
                    { label: 'IDADE', value: `${t.age} anos` },
                    { label: 'FUNÇÃO OFICIAL', value: t.role },
                    { label: 'ESPECIALIDADE TÁTICA', value: t.specialty },
                ],
                bioOrQuote: `Operacional de telemetria e análise de garagem focado em ${t.specialty.toLowerCase()}.`
            };
        });

        const allianceChiefs: CrewProfileItem[] = ALLIANCE_CHIEFS_META.map((c) => ({
            id: c.id,
            category: 'chief',
            code: c.code,
            fullName: c.fullName,
            role: c.role,
            subtitle: c.subtitle,
            avatarUrl: c.avatarUrl,
            fallbackUrl: c.fallbackUrl,
            accentColor: c.accentColor,
            characteristics: [
                { label: 'NACIONALIDADE', value: c.nationality },
                { label: 'IDADE', value: c.age },
                { label: 'ATRIBUTO CHAVE', value: c.keyAttribute },
                { label: 'PATENTE', value: 'ENGENHEIRO-CHEFE DE ALIANÇA' },
            ],
            bioOrQuote: c.profile
        }));

        const teamPrincipals: CrewProfileItem[] = Object.values(TEAM_PRINCIPALS).map((tp) => {
            const meta = TEAM_COLORS_MAP[tp.teamCode] || { color: '#e8002d', allianceImg: '/avatar/others/alianca_1_a.jpg' };
            return {
                id: `tp-${tp.teamCode}`,
                category: 'chief',
                code: tp.code,
                fullName: tp.fullName,
                role: tp.title,
                subtitle: `CHEFE DE EQUIPE // ${tp.teamName.toUpperCase()}`,
                avatarUrl: meta.allianceImg,
                fallbackUrl: meta.allianceImg,
                accentColor: meta.color,
                characteristics: [
                    { label: 'ESCUDERIA', value: `${tp.teamName} (${tp.teamCode})` },
                    { label: 'PERFIL DE COMANDO', value: tp.personality },
                    { label: 'DIRETRIZ DA MURETA', value: tp.briefingFocus },
                    { label: 'CARGO', value: 'TEAM PRINCIPAL' },
                ],
                bioOrQuote: tp.hospitalityWelcome
            };
        });

        return {
            senior: seniors,
            tech: techs,
            chief: [...allianceChiefs, ...teamPrincipals]
        };
    }, []);

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

                <div className="text-xs px-3 py-1.5 rounded-[3px] bg-[#030303] border border-white/15 font-bold tracking-widest text-white/80">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(activeList.length).padStart(2, '0')}
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
