"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePredictionStore } from '@/store/usePredictionStore';
import { useSubmitPrediction } from '@/hooks/useSubmitPrediction';
import { useTeamworkAuto } from '@/hooks/useTeamworkAuto';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import { F1_MATCHUPS, F1_DRIVERS, getDriverDetails } from '@/api/f1-data';
import { 
    Radio, 
    Terminal, 
    ShieldAlert, 
    CheckCircle2, 
    Sparkles, 
    ChevronDown, 
    ChevronUp, 
    RotateCcw, 
    Zap, 
    Trophy, 
    TrendingUp, 
    Swords, 
    HelpCircle, 
    Layers, 
    Send,
    Lock,
    ExternalLink
} from 'lucide-react';

// --- Paleta Oficial das Escuderias ---
const TEAM_COLORS: Record<string, string> = {
    'Mercedes': '#00D2BE',
    'Mercedes-AMG': '#00D2BE',
    'Ferrari': '#DC0000',
    'Scuderia Ferrari': '#DC0000',
    'McLaren': '#FF8000',
    'Red Bull': '#3671C6',
    'Red Bull Racing': '#3671C6',
    'Aston Martin': '#229971',
    'Williams': '#005AFF',
    'Williams Racing': '#005AFF',
    'Alpine': '#FD4BC7',
    'Haas': '#E6002B',
    'Haas F1 Team': '#E6002B',
    'Racing Bulls': '#6692FF',
    'Audi/Sauber': '#F50537',
    'Audi': '#F50537',
    'Cadillac': '#FFC80C',
};

function getTeamColor(teamName: string): string {
    return TEAM_COLORS[teamName] || '#fbaa19';
}

// Golden Rule (Naming): Formatação canônica "L.GUSTAVO88"
function formatPilotName(firstName?: string | null, lastName?: string | null, fallback?: string | null): string {
    if (firstName && lastName) {
        const initial = firstName.trim().charAt(0).toUpperCase();
        const cleanLast = lastName.trim().toUpperCase().replace(/\s+/g, '');
        return `${initial}.${cleanLast}`;
    }
    if (firstName && !lastName) {
        return firstName.trim().toUpperCase();
    }
    if (fallback) {
        return fallback.replace(/^@/, '').trim().toUpperCase();
    }
    return 'PILOTO';
}

const QUESTIONS = [
    { id: 'q1', text: 'Safety car acionado durante o Grande Prêmio?', options: ['SIM', 'NÃO'] },
    { id: 'q2', text: 'Bandeira vermelha acionada na corrida?', options: ['SIM', 'NÃO'] },
    { id: 'q3', text: 'Algum carro da primeira fila sofrerá DNF?', options: ['SIM', 'NÃO'] },
    { id: 'q4', text: 'Ambas as Ferraris terminarão no TOP 5?', options: ['SIM', 'NÃO'] },
    { id: 'q5', text: 'Volta mais rápida conquistada por M. VERSTAPPEN?', options: ['SIM', 'NÃO'] },
];

const TABS = [
    { id: 'all', label: 'TODAS', code: 'ALL', icon: Layers },
    { id: 'poletime', label: 'POLETIME', code: 'POLE', icon: Zap },
    { id: 'master', label: 'TOP 10', code: 'TOP10', icon: Trophy },
    { id: 'evo', label: 'ESCALADA', code: 'EVO', icon: TrendingUp },
    { id: 'h2h', label: 'DUELOS', code: 'H2H', icon: Swords },
    { id: 'misc', label: 'PROPS', code: 'MISC', icon: HelpCircle },
];

export type BlockTier = 'RED' | 'YELLOW' | 'GREEN';

function getBlockInfo(teamName?: string | null) {
    if (!teamName) {
        return { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'BLOCO A', color: '#00D2BE', teamNames: ['McLaren', 'Mercedes', 'Williams', 'Aston Martin', 'Alpine'] };
    }
    const clean = teamName.toLowerCase();
    if (clean.includes('ferrari') || clean.includes('haas') || clean.includes('audi') || clean.includes('cadillac') || clean.includes('sauber')) {
        return { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'BLOCO B', color: '#DC0000', teamNames: ['Ferrari', 'Haas', 'Audi', 'Cadillac', 'Sauber'] };
    }
    if (clean.includes('red bull') || clean.includes('racing bulls') || clean.includes('rb') || clean.includes('bulls')) {
        return { id: 'C', name: 'A VANGUARDA', short: 'BLOCO C', color: '#fbaa19', teamNames: ['Red Bull Racing', 'Red Bull', 'Racing Bulls', 'RB'] };
    }
    return { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'BLOCO A', color: '#00D2BE', teamNames: ['McLaren', 'Mercedes', 'Williams', 'Aston Martin', 'Alpine'] };
}

/**
 * Componente intuitivo de informação oculta em (?)
 * Remove a verbosidade visual e abre explicações concisas por clique ou hover.
 */
function InfoTooltip({ title, text }: { title?: string; text: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <span ref={ref} className="relative inline-flex items-center align-middle ml-1.5">
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="w-4 h-4 rounded-full bg-white/10 hover:bg-[#fbaa19] text-white/50 hover:text-black font-bold text-[10px] inline-flex items-center justify-center transition-all cursor-pointer border border-white/20 hover:border-[#fbaa19]"
                title={title || "Informações"}
                aria-label={title || "Informações"}
            >
                ?
            </button>

            {isOpen && (
                <div 
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-3 bg-black/95 border border-[#fbaa19]/70 rounded shadow-[0_0_25px_rgba(0,0,0,0.95)] text-[11px] leading-relaxed text-white/90 normal-case font-mono animate-fade-in pointer-events-auto"
                >
                    {title && (
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                            <span className="text-[#fbaa19] font-black uppercase tracking-wider text-[10px]">
                                {title}
                            </span>
                            <span className="text-[9px] text-white/40">TELEMETRIA</span>
                        </div>
                    )}
                    <p className="text-white/80">{text}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                </div>
            )}
        </span>
    );
}

export default function NewConceptPositionsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [isBriefingOpen, setIsBriefingOpen] = useState(false); // Fechado por padrão para reduzir verbosidade

    // Piloto e Bloco
    const [pilotInfo, setPilotInfo] = useState<{
        name: string;
        teamName: string | null;
        teamColor: string;
        block: ReturnType<typeof getBlockInfo>;
    }>({
        name: 'ESTRATEGISTA',
        teamName: null,
        teamColor: '#fbaa19',
        block: getBlockInfo(null)
    });

    // Prediction Store (Zustand)
    const {
        poletime,
        top10,
        evo,
        h2h,
        misc,
        setPoletime,
        setTop10,
        setEvo,
        setH2H,
        setMisc
    } = usePredictionStore();

    const { autoPoletime, autoTop10, autoEvo, autoH2H, isAutoLoading } = useTeamworkAuto();
    const { submit: handleSubmit, isSubmitting, isSuccess } = useSubmitPrediction();

    // 1. Carrega dados do piloto e escuderia
    useEffect(() => {
        if (!user) return;
        let isSubscribed = true;

        async function loadProfileAndContract() {
            try {
                const [profRes, contractRes] = await Promise.all([
                    supabase.from('profiles').select('first_name, last_name, username, slug, driver_number').eq('id', user!.id).maybeSingle(),
                    supabase.from('contracts').select('group_id, teams(name, color, code)').eq('user_id', user!.id).maybeSingle()
                ]);

                if (!isSubscribed) return;
                const prof = profRes.data;
                const contract = contractRes.data;
                const team = contract?.teams ? (Array.isArray(contract.teams) ? contract.teams[0] : contract.teams) : null;
                const tName = team?.name || null;
                const block = getBlockInfo(tName);

                setPilotInfo({
                    name: formatPilotName(prof?.first_name, prof?.last_name, prof?.slug || user!.email?.split('@')[0]),
                    teamName: tName,
                    teamColor: team?.color || block.color,
                    block
                });
            } catch (err) {
                console.warn('Erro ao carregar perfil:', err);
            }
        }

        loadProfileAndContract();
        return () => { isSubscribed = false; };
    }, [user]);

    // 2. Progresso dos formulários (0 a 5)
    const completionStats = useMemo(() => {
        const isPoleFilled = poletime.some(d => d > 0);
        const top10Count = top10.filter(Boolean).length;
        const evoCount = evo.filter(Boolean).length;
        const h2hCount = Object.keys(h2h).length;
        const miscCount = Object.keys(misc).length;

        let completedSections = 0;
        if (isPoleFilled) completedSections++;
        if (top10Count === 10) completedSections++;
        if (evoCount === 5) completedSections++;
        if (h2hCount >= F1_MATCHUPS.length) completedSections++;
        if (miscCount >= QUESTIONS.length) completedSections++;

        return {
            completedSections,
            isAllComplete: completedSections === 5,
            isPoleFilled,
            top10Count,
            evoCount,
            h2hCount,
            miscCount
        };
    }, [poletime, top10, evo, h2h, misc]);

    // Helper de dígitos do poletime
    const handlePoletimeDigit = (index: number, val: number) => {
        setPoletime(prev => {
            const next = [...prev];
            next[index] = val;
            return next;
        });
    };

    // Aplicar referência do Poletime de Austin (1:32.329)
    const handleApplyBenchmark = () => {
        setPoletime([1, 3, 2, 3, 2, 9]);
    };

    // Seleção de piloto no Top 10 com swap recíproco
    const handleSelectTop10 = (index: number, driverName: string) => {
        setTop10(prev => {
            const next = [...prev];
            const existingIdx = next.indexOf(driverName);
            if (existingIdx !== -1 && existingIdx !== index) {
                next[existingIdx] = next[index];
            }
            next[index] = driverName;
            return next;
        });
    };

    // Seleção de piloto no EVO
    const handleSelectEvo = (index: number, driverName: string) => {
        setEvo(prev => {
            const next = [...prev];
            const existingIdx = next.indexOf(driverName);
            if (existingIdx !== -1 && existingIdx !== index) {
                next[existingIdx] = next[index];
            }
            next[index] = driverName;
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-[#050401] text-white font-mono pb-28">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5">

                {/* Switcher & Badges de Modo */}
                <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-3 px-1">
                    <span className="flex items-center gap-1.5 text-[#fbaa19] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fbaa19] animate-ping" />
                        <span>NOVO CONCEITO INTUITIVO // TEXTOS EM (?)</span>
                    </span>
                    <Link href="/positions" className="hover:text-white transition-colors underline">
                        [ Alternar para Versão Clássica » ]
                    </Link>
                </div>

                {/* ========================================================
                    BARRA SUPERIOR COMPACTA // HUD DO ESTRATEGISTA
                   ======================================================== */}
                <div className="bg-black/90 border border-white/15 p-3 rounded-sm mb-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pilotInfo.block.color }} />
                        <span className="font-black uppercase tracking-wider text-white">
                            {pilotInfo.name}
                        </span>
                        <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                            style={{ borderColor: `${pilotInfo.block.color}40`, color: pilotInfo.block.color }}
                        >
                            {pilotInfo.block.short}
                        </span>
                        <InfoTooltip 
                            title="Compliance da Aliança" 
                            text="Indica seu bloco de motores oficial. Manter suas apostas alinhadas garante bônus de construtores ao fim da rodada." 
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status de Conclusão */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/50 uppercase hidden sm:inline">PROGRESSO:</span>
                            <span 
                                className="font-bold text-xs font-mono"
                                style={{ color: completionStats.isAllComplete ? '#10b981' : '#fbaa19' }}
                            >
                                [{completionStats.completedSections}/5]
                            </span>
                            <InfoTooltip 
                                title="Protocolo de 5 Posições" 
                                text="Para pontuar integralmente, preencha: Poletime, Top 10, Escalada (EVO), Duelos H2H e Event Props (Misc)." 
                            />
                        </div>

                        {/* Botão de Auto-Preenchimento Rápido */}
                        <button
                            onClick={() => {
                                autoPoletime();
                                autoTop10();
                                autoEvo();
                                autoH2H();
                            }}
                            disabled={isAutoLoading}
                            className="px-2.5 py-1 bg-white/10 hover:bg-[#fbaa19] hover:text-black transition-colors rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sparkles className="w-3 h-3 text-[#fbaa19] group-hover:text-black" />
                            <span>{isAutoLoading ? 'Calculando...' : 'Auto-Preencher'}</span>
                        </button>
                        <InfoTooltip 
                            title="Consenso do Pitwall" 
                            text="Preenche automaticamente as posições com base nas tendências e telemetria da sua escuderia." 
                        />
                    </div>
                </div>

                {/* RÁDIO DO DIRETOR COMPACTO // NARRATIVA OCULTA / RECOLHIDA */}
                <div 
                    className="bg-black/90 border rounded-sm mb-5 text-xs transition-all overflow-hidden"
                    style={{ borderColor: `${pilotInfo.block.color}40` }}
                >
                    <div 
                        onClick={() => setIsBriefingOpen(!isBriefingOpen)}
                        className="px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                    >
                        <div className="flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: pilotInfo.block.color }} />
                            <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: pilotInfo.block.color }}>
                                RÁDIO DO DIRETOR TÉCNICO // {pilotInfo.block.name}
                            </span>
                            <InfoTooltip 
                                title="Rádio do Diretor" 
                                text="Transmissão tática interna de pitwall. Clique para expandir as instruções narrativas da etapa ou consulte o dossiê completo em Next Race." 
                            />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase">
                            <span className="hidden sm:inline">{isBriefingOpen ? 'Recolher Memo' : 'Expandir Memo'}</span>
                            {isBriefingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                    </div>

                    {isBriefingOpen && (
                        <div className="p-3.5 border-t border-white/10 bg-white/[0.02] text-white/80 leading-relaxed italic text-[11px] animate-fade-in flex flex-col gap-2">
                            <p>
                                “{pilotInfo.name}, o pitlane está aberto para o pregão de posições. O túnel de vento confirmou nossas janelas críticas. Suas 5 escolhas aqui são a palavra final da nossa escuderia.”
                            </p>
                            <Link href="/next-race" className="text-[#fbaa19] hover:underline font-bold not-italic flex items-center gap-1 self-start text-[10px] uppercase">
                                <span>Consultar Dossiê de Pista em Next Race</span>
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* TABS DE SELEÇÃO TÁTICA (COMPACTAS) */}
                <div className="flex items-center gap-1 bg-black/90 p-1 border border-white/15 rounded-sm mb-5 overflow-x-auto scrollbar-none">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                    isSelected 
                                        ? 'bg-[#fbaa19] text-black shadow-[0_0_12px_rgba(251,170,25,0.35)]' 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ========================================================
                    MODALIDADES DE PROTOCOLO // INTERFACE OBJETIVA COM (?)
                   ======================================================== */}

                {/* 01. POLETIME */}
                {(activeTab === 'all' || activeTab === 'poletime') && (
                    <div className="bg-black/90 border border-white/15 p-4 sm:p-5 rounded-sm mb-5 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#fbaa19]" />
                                <span className="text-xs font-black uppercase tracking-widest text-[#fbaa19]">
                                    01. POLETIME
                                </span>
                                <InfoTooltip 
                                    title="Regras do Poletime" 
                                    text="Crave o tempo da Pole Position do Q3 da classificação ao milésimo de segundo (M:SS.MMM). Pontuação proporcional à aproximação milimétrica." 
                                />
                            </div>

                            <button
                                onClick={handleApplyBenchmark}
                                className="text-[10px] text-white/60 hover:text-[#fbaa19] uppercase tracking-wider transition-colors flex items-center gap-1 font-bold cursor-pointer"
                            >
                                <Sparkles className="w-3 h-3 text-[#fbaa19]" />
                                <span>Benchmark: 1:32.329</span>
                            </button>
                        </div>

                        {/* Seletor de Dígitos Direto e Limpo */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 bg-white/[0.02] border border-white/5 rounded-sm">
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[0]}
                                    onChange={(e) => handlePoletimeDigit(0, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIN</span>
                            </div>

                            <span className="text-2xl font-black text-[#fbaa19] mb-4">:</span>

                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[1]}
                                    onChange={(e) => handlePoletimeDigit(1, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">SEG (D)</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[2]}
                                    onChange={(e) => handlePoletimeDigit(2, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">SEG (U)</span>
                            </div>

                            <span className="text-2xl font-black text-[#fbaa19] mb-4">.</span>

                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[3]}
                                    onChange={(e) => handlePoletimeDigit(3, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (1)</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[4]}
                                    onChange={(e) => handlePoletimeDigit(4, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (2)</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[5]}
                                    onChange={(e) => handlePoletimeDigit(5, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-1.5 rounded text-center w-12 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (3)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 02. TOP 10 FINISH */}
                {(activeTab === 'all' || activeTab === 'master') && (
                    <div className="bg-black/90 border border-white/15 p-4 sm:p-5 rounded-sm mb-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                                    02. TOP 10 FINISH
                                </span>
                                <InfoTooltip 
                                    title="Regras do Top 10" 
                                    text="Defina a ordem exata de chegada dos 10 primeiros pilotos no domingo. Cada posição cravada garante pontuação máxima na Master League." 
                                />
                            </div>
                            <span className="text-[10px] text-white/50 font-mono">
                                {top10.filter(Boolean).length}/10 CRAVADOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Array.from({ length: 10 }).map((_, idx) => {
                                const selectedDriver = top10[idx];
                                const details = selectedDriver ? getDriverDetails(selectedDriver) : null;
                                const tColor = details ? getTeamColor(details.team) : '#555';

                                return (
                                    <div 
                                        key={idx}
                                        className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/10"
                                    >
                                        <div className="w-8 h-7 bg-black/80 border border-white/20 rounded flex items-center justify-center font-black text-xs text-white shrink-0">
                                            P{idx + 1}
                                        </div>

                                        <select
                                            value={selectedDriver || ''}
                                            onChange={(e) => handleSelectTop10(idx, e.target.value)}
                                            className="w-full bg-black border border-white/15 p-1 rounded text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:border-[#fbaa19]"
                                            style={{ borderLeftColor: tColor, borderLeftWidth: '3px' }}
                                        >
                                            <option value="">[ SELECIONAR PILOTO ]</option>
                                            {F1_DRIVERS.map(driverName => {
                                                const d = getDriverDetails(driverName);
                                                const isUsed = top10.includes(driverName) && top10[idx] !== driverName;
                                                return (
                                                    <option key={driverName} value={driverName}>
                                                        #{d.num} {driverName} ({d.team}) {isUsed ? `• P${top10.indexOf(driverName) + 1}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 03. EVO (ESCALADA) */}
                {(activeTab === 'all' || activeTab === 'evo') && (
                    <div className="bg-black/90 border border-white/15 p-4 sm:p-5 rounded-sm mb-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                                    03. EVO (ESCALADA)
                                </span>
                                <InfoTooltip 
                                    title="Regras do EVO" 
                                    text="Aposte nos 5 pilotos que mais ganharão posições em relação ao grid de largada. Excelente para pilotos rápidos largando do fundo por punição de motor." 
                                />
                            </div>
                            <span className="text-[10px] text-white/50 font-mono">
                                {evo.filter(Boolean).length}/5 DEFINIDOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const selectedDriver = evo[idx];
                                const details = selectedDriver ? getDriverDetails(selectedDriver) : null;
                                const tColor = details ? getTeamColor(details.team) : '#555';

                                return (
                                    <div 
                                        key={idx}
                                        className="flex flex-col p-2 rounded bg-white/[0.02] border border-white/10"
                                    >
                                        <span className="text-[9px] text-blue-400 font-bold uppercase mb-1">
                                            EVO #{idx + 1}
                                        </span>
                                        <select
                                            value={selectedDriver || ''}
                                            onChange={(e) => handleSelectEvo(idx, e.target.value)}
                                            className="w-full bg-black border border-white/15 p-1 rounded text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:border-blue-400"
                                            style={{ borderLeftColor: tColor, borderLeftWidth: '3px' }}
                                        >
                                            <option value="">[ SELECIONAR ]</option>
                                            {F1_DRIVERS.map(driverName => {
                                                const d = getDriverDetails(driverName);
                                                return (
                                                    <option key={driverName} value={driverName}>
                                                        #{d.num} {driverName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 04. DUELOS TÁTICOS (H2H) */}
                {(activeTab === 'all' || activeTab === 'h2h') && (
                    <div className="bg-black/90 border border-white/15 p-4 sm:p-5 rounded-sm mb-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <Swords className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                                    04. DUELOS TÁTICOS (H2H)
                                </span>
                                <InfoTooltip 
                                    title="Regras do Head-to-Head" 
                                    text="Escolha qual companheiro de equipe cruzará a linha de chegada na frente. Confronto direto com mesmo carro e motor." 
                                />
                            </div>
                            <span className="text-[10px] text-white/50 font-mono">
                                {Object.keys(h2h).length}/{F1_MATCHUPS.length} DUELOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {F1_MATCHUPS.map((match) => {
                                const currentPick = h2h[match.id] || match.defaultPick;
                                const isD1Selected = currentPick === match.d1.num;
                                const isD2Selected = currentPick === match.d2.num;
                                const tColor = getTeamColor(match.team);

                                return (
                                    <div 
                                        key={match.id}
                                        className="p-2.5 bg-white/[0.02] border border-white/10 rounded flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">
                                            <span style={{ color: tColor }}>{match.team.toUpperCase()}</span>
                                            <span>DUELO INTERNO</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setH2H(prev => ({ ...prev, [match.id]: match.d1.num }))}
                                                className={`py-1.5 px-2.5 rounded text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-between cursor-pointer ${
                                                    isD1Selected 
                                                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                                        : 'bg-black/60 border-white/10 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                <span>#{match.d1.num} {match.d1.name}</span>
                                                {isD1Selected && <span className="text-[10px] text-purple-400">✓</span>}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setH2H(prev => ({ ...prev, [match.id]: match.d2.num }))}
                                                className={`py-1.5 px-2.5 rounded text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-between cursor-pointer ${
                                                    isD2Selected 
                                                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                                        : 'bg-black/60 border-white/10 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                <span>#{match.d2.num} {match.d2.name}</span>
                                                {isD2Selected && <span className="text-[10px] text-purple-400">✓</span>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 05. EVENT PROPS (MISC) */}
                {(activeTab === 'all' || activeTab === 'misc') && (
                    <div className="bg-black/90 border border-white/15 p-4 sm:p-5 rounded-sm mb-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                    05. EVENT PROPS (MISC)
                                </span>
                                <InfoTooltip 
                                    title="Regras dos Event Props" 
                                    text="Responda SIM ou NÃO para eventos dinâmicos de corrida (Safety Car, abandonos, voltas rápidas e bandeiras vermelhas)." 
                                />
                            </div>
                            <span className="text-[10px] text-white/50 font-mono">
                                {Object.keys(misc).length}/{QUESTIONS.length} RESPONDIDOS
                            </span>
                        </div>

                        <div className="space-y-2">
                            {QUESTIONS.map((q, idx) => {
                                const answer = misc[q.id];

                                return (
                                    <div 
                                        key={q.id}
                                        className="p-2.5 bg-white/[0.02] border border-white/10 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-white">
                                            <span className="text-amber-400 font-bold font-mono">[{idx + 1}]</span>
                                            <span>{q.text}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {q.options.map(opt => {
                                                const isPicked = answer === opt;

                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setMisc(prev => ({ ...prev, [q.id]: opt }))}
                                                        className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                                            isPicked 
                                                                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                                                                : 'bg-black/60 border-white/15 text-white/60 hover:text-white'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>

            {/* ========================================================
                BARRA FIXA DE TRANSMISSÃO // DISPARO RÁPIDO AO GRID
               ======================================================== */}
            <div className="fixed bottom-0 inset-x-0 bg-black/95 backdrop-blur-md border-t border-white/20 p-3 sm:p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${completionStats.isAllComplete ? 'bg-emerald-400 animate-pulse' : 'bg-[#fbaa19]'}`} />
                        <span className="text-xs font-bold text-white uppercase">
                            {completionStats.isAllComplete 
                                ? '✓ 5 PROTOCOLOS COMPLETOS' 
                                : `${completionStats.completedSections}/5 PREENCHIDOS (${5 - completionStats.completedSections} PENDENTES)`}
                        </span>
                    </div>

                    <button
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto px-7 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                            isSuccess 
                                ? 'bg-emerald-500 text-black' 
                                : 'bg-[#fbaa19] hover:bg-white text-black shadow-[0_0_15px_rgba(251,170,25,0.4)]'
                        }`}
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'TRANSMITINDO...' : isSuccess ? 'ORDENS TRANSMITIDAS ✓' : 'TRANSMITIR POSIÇÕES »'}</span>
                    </button>
                </div>
            </div>

        </div>
    );
}
