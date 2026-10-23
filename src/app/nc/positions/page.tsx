"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Lock
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

export default function NewConceptPositionsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [isBriefingOpen, setIsBriefingOpen] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<{ type: 'top10' | 'evo', index: number } | null>(null);

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

    const [calibrationTier, setCalibrationTier] = useState<BlockTier>('YELLOW');
    const [blockPicksCount, setBlockPicksCount] = useState<number>(7);

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

    // 2. Cálculo do progresso dos formulários (0 a 5)
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

    // Seleção de piloto no Top 10
    const handleSelectTop10 = (index: number, driverName: string) => {
        setTop10(prev => {
            const next = [...prev];
            const existingIdx = next.indexOf(driverName);
            if (existingIdx !== -1 && existingIdx !== index) {
                // Troca recíproca de posições (Swap)
                next[existingIdx] = next[index];
            }
            next[index] = driverName;
            return next;
        });
        setOpenDropdown(null);
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
        setOpenDropdown(null);
    };

    return (
        <div className="min-h-screen bg-[#050401] text-white font-mono pb-32">
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">

                {/* ========================================================
                    ARQUÉTIPO I: O BUNKER NOIR // RITO NARRATIVO DO DIRETOR
                   ======================================================== */}
                <section aria-label="Director Briefing" className="mb-6">
                    <div 
                        className="bg-black/95 border rounded-sm overflow-hidden shadow-2xl transition-all duration-300"
                        style={{ borderColor: `${pilotInfo.block.color}60` }}
                    >
                        {/* Faixa Superior de Rádio */}
                        <div 
                            className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b cursor-pointer"
                            style={{ borderBottomColor: `${pilotInfo.block.color}30` }}
                            onClick={() => setIsBriefingOpen(!isBriefingOpen)}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: pilotInfo.block.color }}></span>
                                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: pilotInfo.block.color }}>
                                    <Radio className="w-3.5 h-3.5" />
                                    <span>RÁDIO DO DIRETOR // {pilotInfo.block.name}</span>
                                </span>
                                <span className="text-white/30 text-xs hidden sm:inline">|</span>
                                <span className="text-[10px] text-white/50 uppercase hidden sm:inline">TRANSMISSÃO CRIPTOGRAFADA DE PITWALL</span>
                            </div>

                            <button 
                                className="text-white/60 hover:text-white p-1 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
                                aria-label="Toggle Briefing"
                            >
                                <span className="hidden sm:inline">{isBriefingOpen ? 'Recolher Memo' : 'Expandir Memo'}</span>
                                {isBriefingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Corpo do Memorando Narrativo */}
                        {isBriefingOpen && (
                            <div className="p-4 sm:p-5 bg-gradient-to-b from-white/[0.03] to-transparent animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <Terminal className="w-4 h-4 text-[#fbaa19] shrink-0 mt-1" />
                                    <div className="flex-1 text-xs text-white/90 leading-relaxed">
                                        <p className="mb-2 italic">
                                            “Estrategista <strong className="text-white not-italic">{pilotInfo.name}</strong>, puxe a cadeira e tranque a porta da cabine. 
                                            O pitlane está prestes a fechar a entrada do pregão. Nossos engenheiros já carregaram a telemetria da próxima etapa e o túnel de vento confirmou nossas janelas críticas. 
                                            Suas 5 tomadas de posição aqui são a palavra final da nossa escuderia. Não hesite nos milésimos da pole e proteja a pontuação do nosso construtor no Top 10.”
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-white/50 border-t border-white/10 uppercase">
                                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>CANAL SEGURO HOMOLOGADO FIA</span>
                                            </span>
                                            <span>•</span>
                                            <Link href="/next-race" className="text-[#fbaa19] hover:underline font-bold flex items-center gap-1">
                                                <span>Consultar Dossiê de Pista em Next Race »</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ========================================================
                    ARQUÉTIPO II: O TERMINAL FINANCEIRO // DADOS & PREGÃO
                   ======================================================== */}

                {/* HUD DE CALIBRAÇÃO DO BLOCO & STATUS DE COMPLETUDE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs">
                    
                    {/* Card 1: Compliance / Calibragem da Aliança */}
                    <div className="bg-black/85 border border-white/10 p-3.5 rounded-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block mb-0.5">COMPLIANCE DA ALIANÇA:</span>
                            <span className="text-xs font-black uppercase text-white">{pilotInfo.block.short}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                TIER VERDE // REGULAR
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Progresso dos 5 Formulários */}
                    <div className="bg-black/85 border border-white/10 p-3.5 rounded-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block mb-0.5">STATUS DO PROTOCOLO:</span>
                            <span className="text-xs font-black uppercase" style={{ color: completionStats.isAllComplete ? '#10b981' : '#fbaa19' }}>
                                [{completionStats.completedSections} / 5 PROTOCOLOS PREENCHIDOS]
                            </span>
                        </div>
                        <div className="w-16 bg-white/10 h-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#fbaa19] transition-all duration-300"
                                style={{ width: `${(completionStats.completedSections / 5) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Card 3: Automação Rápida de Duplas (Teamwork Consensus) */}
                    <div className="bg-black/85 border border-white/10 p-3.5 rounded-sm flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block mb-0.5">AUTOMAÇÃO TÁTICA:</span>
                            <span className="text-[11px] font-bold text-white/70">Consenso de Box</span>
                        </div>
                        <button
                            onClick={() => {
                                autoPoletime();
                                autoTop10();
                                autoEvo();
                                autoH2H();
                            }}
                            disabled={isAutoLoading}
                            className="px-3 py-1 bg-white/10 hover:bg-[#fbaa19] hover:text-black transition-colors rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        >
                            <Sparkles className="w-3 h-3 text-[#fbaa19] group-hover:text-black" />
                            <span>{isAutoLoading ? 'Calculando...' : 'Auto-Preencher'}</span>
                        </button>
                    </div>
                </div>

                {/* TABS DE SELEÇÃO TÁTICA */}
                <div className="flex items-center gap-1 bg-black/90 p-1.5 border border-white/15 rounded-sm mb-6 overflow-x-auto scrollbar-none">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                    isSelected 
                                        ? 'bg-[#fbaa19] text-black shadow-[0_0_15px_rgba(251,170,25,0.4)]' 
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
                    MODALIDADES DE PROTOCOLO (TAB CONTENTS)
                   ======================================================== */}

                {/* ABA 1: POLETIME */}
                {(activeTab === 'all' || activeTab === 'poletime') && (
                    <div className="bg-black/90 border border-white/15 p-5 sm:p-6 rounded-sm mb-6 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#fbaa19]" />
                                <span className="text-xs font-black uppercase tracking-widest text-[#fbaa19]">
                                    [MODO 01] POLETIME // VOLTA DA POLE POSITION
                                </span>
                            </div>
                            <button
                                onClick={handleApplyBenchmark}
                                className="text-[10px] text-white/50 hover:text-[#fbaa19] uppercase tracking-wider transition-colors flex items-center gap-1 font-bold"
                            >
                                <Sparkles className="w-3 h-3 text-[#fbaa19]" />
                                <span>Aplicar Benchmark Austin (1:32.329)</span>
                            </button>
                        </div>

                        <p className="text-[11px] text-white/60 mb-4">
                            Cravação do tempo oficial da volta mais rápida do Q3 da classificação ao milésimo de segundo (<span className="text-[#fbaa19]">M:SS.MMM</span>).
                        </p>

                        {/* Digits Display & Selectors */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 py-4 bg-white/[0.02] border border-white/5 rounded-sm">
                            {/* Minuto */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[0]}
                                    onChange={(e) => handlePoletimeDigit(0, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIN</span>
                            </div>

                            <span className="text-2xl font-black text-[#fbaa19] mb-4">:</span>

                            {/* Segundos Dezena */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[1]}
                                    onChange={(e) => handlePoletimeDigit(1, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">SEG (D)</span>
                            </div>

                            {/* Segundos Unidade */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[2]}
                                    onChange={(e) => handlePoletimeDigit(2, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">SEG (U)</span>
                            </div>

                            <span className="text-2xl font-black text-[#fbaa19] mb-4">.</span>

                            {/* Milésimos 1 */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[3]}
                                    onChange={(e) => handlePoletimeDigit(3, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (1)</span>
                            </div>

                            {/* Milésimos 2 */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[4]}
                                    onChange={(e) => handlePoletimeDigit(4, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (2)</span>
                            </div>

                            {/* Milésimos 3 */}
                            <div className="flex flex-col items-center">
                                <select 
                                    value={poletime[5]}
                                    onChange={(e) => handlePoletimeDigit(5, parseInt(e.target.value, 10))}
                                    className="bg-black border border-white/20 text-white text-xl sm:text-2xl font-black font-mono p-2 rounded text-center w-12 sm:w-14 cursor-pointer hover:border-[#fbaa19]"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-[8px] text-white/40 uppercase mt-1">MIL (3)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 2: TOP 10 FINISH (MASTER) */}
                {(activeTab === 'all' || activeTab === 'master') && (
                    <div className="bg-black/90 border border-white/15 p-5 sm:p-6 rounded-sm mb-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                                    [MODO 02] TOP 10 FINISH // MASTER LEAGUE
                                </span>
                            </div>
                            <span className="text-[10px] text-white/40 uppercase">
                                {top10.filter(Boolean).length}/10 POSIÇÕES DEFINIDAS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Array.from({ length: 10 }).map((_, idx) => {
                                const selectedDriver = top10[idx];
                                const details = selectedDriver ? getDriverDetails(selectedDriver) : null;
                                const tColor = details ? getTeamColor(details.team) : '#666';

                                return (
                                    <div 
                                        key={idx}
                                        className="flex items-center gap-2 p-2 rounded bg-white/[0.02] border border-white/10 hover:border-white/30 transition-all"
                                    >
                                        <div className="w-9 h-8 bg-black/80 border border-white/20 rounded flex items-center justify-center font-black text-xs text-white shrink-0">
                                            P{idx + 1}
                                        </div>

                                        <div className="flex-1">
                                            <select
                                                value={selectedDriver || ''}
                                                onChange={(e) => handleSelectTop10(idx, e.target.value)}
                                                className="w-full bg-black border border-white/15 p-1.5 rounded text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:border-[#fbaa19]"
                                                style={{ borderLeftColor: tColor, borderLeftWidth: '3px' }}
                                            >
                                                <option value="">[ SELECIONAR PILOTO ]</option>
                                                {F1_DRIVERS.map(driverName => {
                                                    const d = getDriverDetails(driverName);
                                                    const isUsedElsewhere = top10.includes(driverName) && top10[idx] !== driverName;
                                                    return (
                                                        <option key={driverName} value={driverName}>
                                                            #{d.num} {driverName} ({d.team}) {isUsedElsewhere ? '• Já em P' + (top10.indexOf(driverName) + 1) : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ABA 3: EVO (ESCALADA) */}
                {(activeTab === 'all' || activeTab === 'evo') && (
                    <div className="bg-black/90 border border-white/15 p-5 sm:p-6 rounded-sm mb-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                                    [MODO 03] EVO // MAIOR GANHO DE POSIÇÕES NA CORRIDA
                                </span>
                            </div>
                            <span className="text-[10px] text-white/40 uppercase">
                                {evo.filter(Boolean).length}/5 PILOTOS SELECIONADOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const selectedDriver = evo[idx];
                                const details = selectedDriver ? getDriverDetails(selectedDriver) : null;
                                const tColor = details ? getTeamColor(details.team) : '#666';

                                return (
                                    <div 
                                        key={idx}
                                        className="flex flex-col p-2.5 rounded bg-white/[0.02] border border-white/10"
                                    >
                                        <span className="text-[10px] text-blue-400 font-bold uppercase mb-1">
                                            EVO #{idx + 1}
                                        </span>
                                        <select
                                            value={selectedDriver || ''}
                                            onChange={(e) => handleSelectEvo(idx, e.target.value)}
                                            className="w-full bg-black border border-white/15 p-1.5 rounded text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:border-blue-400"
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

                {/* ABA 4: DUELOS TÁTICOS (H2H) */}
                {(activeTab === 'all' || activeTab === 'h2h') && (
                    <div className="bg-black/90 border border-white/15 p-5 sm:p-6 rounded-sm mb-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Swords className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                                    [MODO 04] DUELOS TÁTICOS (HEAD-TO-HEAD) // COMPANHEIROS DE EQUIPE
                                </span>
                            </div>
                            <span className="text-[10px] text-white/40 uppercase">
                                {Object.keys(h2h).length}/{F1_MATCHUPS.length} DUELOS CRAVADOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {F1_MATCHUPS.map((match) => {
                                const currentPick = h2h[match.id] || match.defaultPick;
                                const isD1Selected = currentPick === match.d1.num;
                                const isD2Selected = currentPick === match.d2.num;
                                const tColor = getTeamColor(match.team);

                                return (
                                    <div 
                                        key={match.id}
                                        className="p-3 bg-white/[0.02] border border-white/10 rounded flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">
                                            <span style={{ color: tColor }}>{match.team.toUpperCase()}</span>
                                            <span>DUELO DIRETO</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setH2H(prev => ({ ...prev, [match.id]: match.d1.num }))}
                                                className={`py-2 px-3 rounded text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-between ${
                                                    isD1Selected 
                                                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                                        : 'bg-black/60 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                                                }`}
                                            >
                                                <span>#{match.d1.num} {match.d1.name}</span>
                                                {isD1Selected && <span className="text-[10px] text-purple-400">✓</span>}
                                            </button>

                                            <button
                                                onClick={() => setH2H(prev => ({ ...prev, [match.id]: match.d2.num }))}
                                                className={`py-2 px-3 rounded text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-between ${
                                                    isD2Selected 
                                                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                                        : 'bg-black/60 border-white/10 text-white/60 hover:text-white hover:border-white/30'
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

                {/* ABA 5: EVENT PROPS (MISC) */}
                {(activeTab === 'all' || activeTab === 'misc') && (
                    <div className="bg-black/90 border border-white/15 p-5 sm:p-6 rounded-sm mb-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                    [MODO 05] EVENT PROPS (MISC) // CENÁRIOS ESPECIAIS DE PISTA
                                </span>
                            </div>
                            <span className="text-[10px] text-white/40 uppercase">
                                {Object.keys(misc).length}/{QUESTIONS.length} RESPOSTAS DEFINIDAS
                            </span>
                        </div>

                        <div className="space-y-3">
                            {QUESTIONS.map((q, idx) => {
                                const answer = misc[q.id];

                                return (
                                    <div 
                                        key={q.id}
                                        className="p-3 bg-white/[0.02] border border-white/10 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-2.5 text-xs text-white">
                                            <span className="text-amber-400 font-bold font-mono">[{idx + 1}]</span>
                                            <span>{q.text}</span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {q.options.map(opt => {
                                                const isPicked = answer === opt;

                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setMisc(prev => ({ ...prev, [q.id]: opt }))}
                                                        className={`px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all border ${
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
                BARRA DE AÇÃO FIXA DE PITWALL // DISPARO DO PROTOCOLO
               ======================================================== */}
            <div className="fixed bottom-0 inset-x-0 bg-black/95 backdrop-blur-md border-t border-white/20 p-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="text-xs">
                            <span className="font-bold text-white uppercase block">
                                PROTOCOLO DE PROGNÓSTICOS DO ESTRATEGISTA
                            </span>
                            <span className="text-[10px] text-white/50">
                                {completionStats.isAllComplete 
                                    ? '✓ TODAS AS 5 TOMADAS DE POSIÇÃO VALIDADAS' 
                                    : `FALTAM ${5 - completionStats.completedSections} PROTOCOLOS PARA CONCLUSÃO COMPLETA`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className={`w-full sm:w-auto px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl ${
                                isSuccess 
                                    ? 'bg-emerald-500 text-black' 
                                    : 'bg-[#fbaa19] hover:bg-white text-black shadow-[0_0_20px_rgba(251,170,25,0.4)]'
                            }`}
                        >
                            <Send className="w-4 h-4" />
                            <span>{isSubmitting ? 'TRANSMITINDO AO PITWALL...' : isSuccess ? 'ORDENS TRANSMITIDAS COM SUCESSO ✓' : 'TRANSMITIR POSIÇÕES AO GRID »'}</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
