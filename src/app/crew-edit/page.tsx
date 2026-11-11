"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Award,
    Check,
    Cpu,
    RotateCcw,
    Save,
    Search,
    Shield,
    SlidersHorizontal,
    Users,
} from 'lucide-react';
import { getSystemBoxStyle } from '@/components/system-modal';
import {
    CharacterRoleOverride,
    CrewCategory,
    CrewCharacterBase,
    CrewRolesConfig,
    DEFAULT_CREW_ROLES_CONFIG,
    SystemSlotAssignments,
    applyCharacterOverride,
    fetchCrewRolesConfig,
    getBaseCrewCatalog,
    saveCrewRolesConfig,
} from '@/lib/crew-config';

const SLOT_DEFINITIONS: Array<{
    key: keyof SystemSlotAssignments;
    label: string;
    desc: string;
}> = [
    {
        key: 'inviteDirectorId',
        label: 'Diretor do Invite (/invite)',
        desc: 'Personagem que conduz o diálogo inicial de recrutamento.',
    },
    {
        key: 'headquartersAgentId',
        label: 'Agente do Quartel-General (/headquarters)',
        desc: 'Personagem que apresenta o dossiê e vagas de contrato.',
    },
    {
        key: 'raceWeekFallbackMentorId',
        label: 'Mentor Padrão do Race Week (/race-week)',
        desc: 'Usado apenas quando o visitante ainda não tem estrategista sorteado.',
    },
    {
        key: 'allianceChiefAId',
        label: 'Chefe do Bloco A (Consórcio da Estrela)',
        desc: 'Retrato e função exibidos no dossiê do Bloco A.',
    },
    {
        key: 'allianceChiefBId',
        label: 'Chefe do Bloco B (Dinastia de Maranello)',
        desc: 'Retrato e função exibidos no dossiê do Bloco B.',
    },
    {
        key: 'allianceChiefCId',
        label: 'Chefe do Bloco C (A Vanguarda)',
        desc: 'Retrato e função exibidos no dossiê do Bloco C.',
    },
];

function CharacterAvatar({
    avatarUrl,
    fallbackUrl,
    alt,
    accentColor,
    sizeClass = 'w-12 h-12',
}: {
    avatarUrl: string;
    fallbackUrl: string;
    alt: string;
    accentColor: string;
    sizeClass?: string;
}) {
    const [src, setSrc] = useState(avatarUrl);

    useEffect(() => {
        setSrc(avatarUrl);
    }, [avatarUrl]);

    return (
        <div
            className={`${sizeClass} rounded-[3px] overflow-hidden border border-[#000000] shrink-0 bg-[#030303]`}
            style={{ boxShadow: `0 0 12px ${accentColor}25` }}
        >
            <img
                src={src}
                alt={alt}
                onError={() => {
                    if (src !== fallbackUrl) setSrc(fallbackUrl);
                }}
                className="w-full h-full object-cover"
            />
        </div>
    );
}

export default function CrewEditPage() {
    const baseCatalog = useMemo(() => getBaseCrewCatalog(), []);
    const [config, setConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const [activeCategory, setActiveCategory] = useState<CrewCategory>('senior');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string>('strat-1');

    useEffect(() => {
        fetchCrewRolesConfig().then((loaded) => {
            setConfig(loaded);
            setLoading(false);
        });
    }, []);

    const resolvedCatalog = useMemo(
        () => baseCatalog.map((item) => applyCharacterOverride(item, config)),
        [baseCatalog, config]
    );

    const filteredList = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return resolvedCatalog.filter((item) => {
            if (item.category !== activeCategory) return false;
            if (!q) return true;
            return (
                item.code.toLowerCase().includes(q) ||
                item.fullName.toLowerCase().includes(q) ||
                item.role.toLowerCase().includes(q) ||
                item.specialty.toLowerCase().includes(q)
            );
        });
    }, [resolvedCatalog, activeCategory, searchQuery]);

    const selectedBase: CrewCharacterBase = useMemo(() => {
        return baseCatalog.find((c) => c.id === selectedId) || baseCatalog[0];
    }, [baseCatalog, selectedId]);

    const selectedResolved: CrewCharacterBase = useMemo(() => {
        return applyCharacterOverride(selectedBase, config);
    }, [selectedBase, config]);

    const handleCategoryChange = (cat: CrewCategory) => {
        setActiveCategory(cat);
        const first = baseCatalog.find((c) => c.category === cat);
        if (first) setSelectedId(first.id);
    };

    const handleSlotChange = (key: keyof SystemSlotAssignments, characterId: string) => {
        setConfig((prev) => ({
            ...prev,
            slots: {
                ...prev.slots,
                [key]: characterId,
            },
        }));
    };

    const handleFieldEdit = (field: keyof CharacterRoleOverride, value: string) => {
        setConfig((prev) => {
            const currentOv = prev.overrides[selectedBase.id] || {};
            const nextOv: CharacterRoleOverride = {
                ...currentOv,
                [field]: value,
            };
            return {
                ...prev,
                overrides: {
                    ...prev.overrides,
                    [selectedBase.id]: nextOv,
                },
            };
        });
    };

    const handleResetCharacter = () => {
        setConfig((prev) => {
            const nextOverrides = { ...prev.overrides };
            delete nextOverrides[selectedBase.id];
            return {
                ...prev,
                overrides: nextOverrides,
            };
        });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setStatusMsg(null);
        const res = await saveCrewRolesConfig(config);
        setSaving(false);

        if (res.ok) {
            setStatusMsg({
                type: 'ok',
                text: 'FUNÇÕES E PAPÉIS SALVOS NO SUPABASE (GLOBAL_SETTINGS) COM SUCESSO.',
            });
            setTimeout(() => setStatusMsg(null), 4000);
        } else {
            setStatusMsg({
                type: 'err',
                text: res.error || 'ERRO AO SALVAR CONFIGURAÇÃO DE PERSONAGENS.',
            });
        }
    };

    return (
        <main className="w-full min-h-dvh bg-[#050401] text-white font-mono relative overflow-x-clip pb-20">
            <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-[520px] h-[360px] bg-[#fbaa19]/10 rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 flex flex-col gap-6">
                {/* Cabeçalho Admin */}
                <header
                    className="border border-[#000000] rounded-[3px] p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="flex items-center gap-3">
                        <Link
                            href="/crew"
                            className="p-2 rounded-[3px] bg-[#030303] hover:bg-white/10 border border-[#000000] text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>CREW</span>
                        </Link>
                        <div>
                            <span className="text-[10px] tracking-[0.25em] text-[#fbaa19] uppercase flex items-center gap-1.5 font-black">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                ADMINISTRAÇÃO DE PADDOCK // CREW-EDIT
                            </span>
                            <h1 className="text-lg sm:text-xl font-black tracking-widest uppercase text-white mt-0.5">
                                REDEFINIÇÃO DE FUNÇÕES DOS PERSONAGENS
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                            href="/race-control"
                            className="px-3 py-2 rounded-[3px] border border-[#000000] bg-[#030303] hover:text-[#fbaa19] text-white/70 text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            RACE CONTROL
                        </Link>
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={saving || loading}
                            className="px-4 py-2 rounded-[3px] border border-[#000000] bg-[#fbaa19] hover:bg-white text-black text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'SALVANDO...' : 'SALVAR TUDO'}</span>
                        </button>
                    </div>
                </header>

                {statusMsg && (
                    <div
                        className={`p-3.5 rounded-[3px] border border-[#000000] text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                            statusMsg.type === 'ok'
                                ? 'bg-emerald-950/60 text-emerald-300'
                                : 'bg-red-950/60 text-red-300'
                        }`}
                    >
                        {statusMsg.type === 'ok' && <Check className="w-4 h-4 shrink-0" />}
                        <span>{statusMsg.text}</span>
                    </div>
                )}

                {/* SEÇÃO 1: PAPÉIS OPERACIONAIS DO SISTEMA */}
                <section
                    className="border border-[#000000] rounded-[3px] p-4 sm:p-6 flex flex-col gap-4"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#fbaa19]">
                                01. ATRIBUIÇÃO DE PAPÉIS NO SISTEMA
                            </h2>
                            <p className="text-[calc(0.6875rem+0.5px)] text-white/60 mt-1">
                                Defina qual personagem assume cada ponto fixo da jornada. No Race Week de usuários logados, o mentor sorteado do usuário tem prioridade automática.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {SLOT_DEFINITIONS.map((slot) => {
                            const assigned =
                                resolvedCatalog.find((c) => c.id === config.slots[slot.key]) || resolvedCatalog[0];

                            return (
                                <div
                                    key={slot.key}
                                    className="p-3.5 rounded-[3px] border border-[#000000] bg-[#030303] flex flex-col gap-2.5"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CharacterAvatar
                                            avatarUrl={assigned.avatarUrl}
                                            fallbackUrl={assigned.fallbackUrl}
                                            alt={assigned.code}
                                            accentColor={assigned.accentColor}
                                            sizeClass="w-10 h-10"
                                        />
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#fbaa19] block truncate">
                                                {slot.label}
                                            </span>
                                            <span className="text-[10px] text-white/50 block leading-tight mt-0.5">
                                                {slot.desc}
                                            </span>
                                        </div>
                                    </div>

                                    <select
                                        value={config.slots[slot.key]}
                                        onChange={(e) => handleSlotChange(slot.key, e.target.value)}
                                        className="w-full bg-black border border-[#000000] text-white text-xs font-bold p-2 rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#fbaa19]"
                                    >
                                        {resolvedCatalog.map((char) => (
                                            <option key={char.id} value={char.id}>
                                                [{char.code}] {char.fullName} — {char.role.slice(0, 34)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* SEÇÃO 2: EDIÇÃO INDIVIDUAL DAS FUNÇÕES DE CADA PERSONAGEM */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Lista / Seletor à esquerda */}
                    <div
                        className="lg:col-span-5 border border-[#000000] rounded-[3px] p-4 flex flex-col gap-3"
                        style={getSystemBoxStyle('#38bdf8')}
                    >
                        <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#38bdf8]">
                            02. CATÁLOGO DE PERSONAGENS ({resolvedCatalog.length})
                        </h2>

                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleCategoryChange('senior')}
                                className={`py-2 px-2 rounded-[3px] border border-[#000000] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                                    activeCategory === 'senior'
                                        ? 'bg-[#fbaa19] text-black'
                                        : 'bg-[#030303] text-white/60 hover:text-white'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>SÊNIORS</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCategoryChange('tech')}
                                className={`py-2 px-2 rounded-[3px] border border-[#000000] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                                    activeCategory === 'tech'
                                        ? 'bg-[#38bdf8] text-black'
                                        : 'bg-[#030303] text-white/60 hover:text-white'
                                }`}
                            >
                                <Cpu className="w-3.5 h-3.5" />
                                <span>TÉCNICOS</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCategoryChange('chief')}
                                className={`py-2 px-2 rounded-[3px] border border-[#000000] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                                    activeCategory === 'chief'
                                        ? 'bg-[#e8002d] text-white'
                                        : 'bg-[#030303] text-white/60 hover:text-white'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>CHEFES</span>
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nome, código ou função..."
                                className="w-full bg-[#030303] border border-[#000000] text-white placeholder-white/35 pl-8 pr-3 py-2 text-xs rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-1">
                            {filteredList.map((char) => {
                                const isSelected = char.id === selectedResolved.id;
                                const isModified = Boolean(config.overrides[char.id]);
                                return (
                                    <button
                                        key={char.id}
                                        type="button"
                                        onClick={() => setSelectedId(char.id)}
                                        className={`w-full text-left p-2.5 rounded-[3px] border border-[#000000] flex items-center gap-2.5 transition-all cursor-pointer ${
                                            isSelected ? 'bg-white/10 ring-1 ring-[#fbaa19]' : 'bg-[#030303] hover:bg-white/5'
                                        }`}
                                    >
                                        <CharacterAvatar
                                            avatarUrl={char.avatarUrl}
                                            fallbackUrl={char.fallbackUrl}
                                            alt={char.code}
                                            accentColor={char.accentColor}
                                            sizeClass="w-10 h-10"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className="text-xs font-black uppercase tracking-wider truncate"
                                                    style={{ color: char.accentColor }}
                                                >
                                                    {char.code}
                                                </span>
                                                {isModified && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[#fbaa19]/20 text-[#fbaa19] font-bold shrink-0">
                                                        EDITADO
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-white font-bold block truncate">
                                                {char.fullName}
                                            </span>
                                            <span className="text-[10px] text-white/50 block truncate">
                                                {char.role}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editor do personagem selecionado à direita */}
                    <div
                        className="lg:col-span-7 border border-[#000000] rounded-[3px] p-5 sm:p-6 flex flex-col gap-4"
                        style={getSystemBoxStyle(selectedResolved.accentColor)}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3.5">
                                <CharacterAvatar
                                    avatarUrl={selectedResolved.avatarUrl}
                                    fallbackUrl={selectedResolved.fallbackUrl}
                                    alt={selectedResolved.code}
                                    accentColor={selectedResolved.accentColor}
                                    sizeClass="w-16 h-16"
                                />
                                <div>
                                    <span
                                        className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
                                        style={{ color: selectedResolved.accentColor }}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        [{selectedResolved.code}] // ID: {selectedResolved.id}
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-0.5">
                                        {selectedResolved.fullName}
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleResetCharacter}
                                disabled={!config.overrides[selectedBase.id]}
                                className="px-3 py-1.5 rounded-[3px] border border-[#000000] bg-[#030303] hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-35"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>RESTAURAR PADRÃO</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-3.5 text-[calc(0.75rem+0.5px)]">
                            <div>
                                <label className="text-[10px] text-[#fbaa19] font-black uppercase tracking-widest block mb-1.5">
                                    FUNÇÃO / CARGO OFICIAL
                                </label>
                                <input
                                    type="text"
                                    value={selectedResolved.role}
                                    onChange={(e) => handleFieldEdit('role', e.target.value)}
                                    className="w-full bg-[#030303] border border-[#000000] text-white p-3 rounded-[3px] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#fbaa19]"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-[#fbaa19] font-black uppercase tracking-widest block mb-1.5">
                                    SUBTÍTULO / DIVISÃO
                                </label>
                                <input
                                    type="text"
                                    value={selectedResolved.subtitle}
                                    onChange={(e) => handleFieldEdit('subtitle', e.target.value)}
                                    className="w-full bg-[#030303] border border-[#000000] text-white p-3 rounded-[3px] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#fbaa19]"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-[#fbaa19] font-black uppercase tracking-widest block mb-1.5">
                                    ESPECIALIDADE / DIRETRIZ TÁTICA
                                </label>
                                <input
                                    type="text"
                                    value={selectedResolved.specialty}
                                    onChange={(e) => handleFieldEdit('specialty', e.target.value)}
                                    className="w-full bg-[#030303] border border-[#000000] text-white p-3 rounded-[3px] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#fbaa19]"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-[#fbaa19] font-black uppercase tracking-widest block mb-1.5">
                                    FRASE / BIOGRAFIA / MENSAGEM DE BOAS-VINDAS
                                </label>
                                <textarea
                                    rows={4}
                                    value={selectedResolved.bioOrQuote}
                                    onChange={(e) => handleFieldEdit('bioOrQuote', e.target.value)}
                                    className="w-full bg-[#030303] border border-[#000000] text-white p-3 rounded-[3px] text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#fbaa19]"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-[10px] text-white/45">
                                Após editar os personagens desejados, clique em <strong>SALVAR TUDO</strong>.
                            </span>
                            <button
                                type="button"
                                onClick={handleSaveAll}
                                disabled={saving || loading}
                                className="px-5 py-2.5 rounded-[3px] border border-[#000000] bg-[#fbaa19] hover:bg-white text-black text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
