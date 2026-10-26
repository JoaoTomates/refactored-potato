"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    CIRCUITS_INTEL, 
    getCircuitIntel, 
    CircuitTelemetryIntel 
} from '@/lib/circuits-intel';
import SeniorStrategistCard from '@/components/senior-strategist-card';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import { 
    Wind, 
    Thermometer, 
    Droplets, 
    Gauge, 
    Activity, 
    AlertTriangle, 
    ShieldAlert, 
    Layers, 
    Clock, 
    Calendar as CalendarIcon, 
    Trophy, 
    ChevronRight, 
    Target, 
    Terminal, 
    Sparkles, 
    Radio,
    CircleDot,
    ArrowRight,
    FileText,
    Lock,
    Unlock,
    Fingerprint,
    CheckCircle2
} from 'lucide-react';

type FactionKey = 'A' | 'B' | 'C';

const FACTION_THEMES: Record<FactionKey, {
    name: string;
    sub: string;
    color: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    badge: string;
}> = {
    A: {
        name: 'CONSÓRCIO DA ESTRELA',
        sub: 'Mercedes-AMG • McLaren • Alpine • Williams',
        color: '#00D2BE',
        borderClass: 'border-[#00D2BE]',
        bgClass: 'bg-[#00D2BE]/10',
        textClass: 'text-[#00D2BE]',
        badge: 'BLOCO A // ESTRELA'
    },
    B: {
        name: 'A DINASTIA DE MARANELLO',
        sub: 'Scuderia Ferrari • Haas F1 • Cadillac Racing',
        color: '#DC0000',
        borderClass: 'border-[#DC0000]',
        bgClass: 'bg-[#DC0000]/10',
        textClass: 'text-[#DC0000]',
        badge: 'BLOCO B // MARANELLO'
    },
    C: {
        name: 'A VANGUARDA TECNOLÓGICA',
        sub: 'Red Bull Racing • Racing Bulls • Aston Martin • Audi',
        color: '#fbaa19',
        borderClass: 'border-[#fbaa19]',
        bgClass: 'bg-[#fbaa19]/10',
        textClass: 'text-[#fbaa19]',
        badge: 'BLOCO C // VANGUARDA'
    }
};

export default function NextRacePage() {
    const { user } = useSupabaseAuth();
    
    // Estado do circuito ativo para inspeção
    const [selectedCircuitKey, setSelectedCircuitKey] = useState<string>('americas');
    const [activeFaction, setActiveFaction] = useState<FactionKey>('A');
    const [userContractGroup, setUserContractGroup] = useState<string | null>(null);
    const [userSeniorStrategistId, setUserSeniorStrategistId] = useState<string | undefined>(undefined);

    // Contagem regressiva ao vivo
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // 1. Tenta recuperar o contrato do usuário no Supabase para pré-selecionar o Diretor do seu Bloco
    useEffect(() => {
        if (!user) return;
        async function fetchUserAlliance() {
            try {
                // Busca contrato da equipe e aliança
                const { data: contract } = await supabase
                    .from('contracts')
                    .select('group_id, teams(name, code)')
                    .eq('user_id', user!.id)
                    .maybeSingle();

                // Busca o estrategista sênior designado ao usuário no perfil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('senior_strategist_id')
                    .eq('id', user!.id)
                    .maybeSingle();

                if (profile?.senior_strategist_id) {
                    setUserSeniorStrategistId(profile.senior_strategist_id);
                }

                if (contract?.teams) {
                    const team = Array.isArray(contract.teams) ? contract.teams[0] : contract.teams;
                    const code = team.code?.toUpperCase();
                    if (['MER', 'MCL', 'ALP', 'WIL'].includes(code)) {
                        setActiveFaction('A');
                        setUserContractGroup('BLOCO A // CONSÓRCIO DA ESTRELA');
                    } else if (['FER', 'HAA', 'CAD'].includes(code)) {
                        setActiveFaction('B');
                        setUserContractGroup('BLOCO B // DINASTIA DE MARANELLO');
                    } else if (['RBR', 'RBA', 'AST', 'AUD'].includes(code)) {
                        setActiveFaction('C');
                        setUserContractGroup('BLOCO C // A VANGUARDA');
                    }
                }
            } catch (err) {
                console.warn('Erro ao carregar contrato para o briefing do diretor:', err);
            }
        }
        fetchUserAlliance();
    }, [user]);

    // 2. Sincronização com Jolpica para detectar a próxima etapa oficial
    useEffect(() => {
        let isMounted = true;
        async function detectNextEvent() {
            try {
                const res = await fetch('https://api.jolpi.ca/ergast/f1/current/next.json');
                if (res.ok) {
                    const data = await res.json();
                    const race = data.MRData?.RaceTable?.Races?.[0];
                    if (race && isMounted) {
                        const circuitId = race.Circuit?.circuitId || '';
                        if (CIRCUITS_INTEL[circuitId]) {
                            setSelectedCircuitKey(circuitId);
                        } else {
                            const intel = getCircuitIntel(circuitId || race.Circuit?.circuitName || race.raceName);
                            setSelectedCircuitKey(intel.id);
                        }
                    }
                }
            } catch (err) {
                console.warn('Jolpica next race fallback to local intel:', err);
            }
        }
        detectNextEvent();
        return () => { isMounted = false; };
    }, []);

    // Recupera dados do circuito ativo
    const circuit: CircuitTelemetryIntel = useMemo(() => {
        return getCircuitIntel(selectedCircuitKey);
    }, [selectedCircuitKey]);

    // Memorando ativo do diretor técnico selecionado
    const activeDirectorMemo = useMemo(() => {
        return circuit.directorMemos[activeFaction];
    }, [circuit, activeFaction]);

    const activeTheme = FACTION_THEMES[activeFaction];

    // Cálculo da contagem regressiva para a largada da corrida
    useEffect(() => {
        function updateTimer() {
            const targetDate = new Date('2026-10-25T20:00:00Z').getTime();
            const now = new Date().getTime();
            const diff = targetDate - now;

            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [circuit]);

    // Renderizador visual de medidor de 1 a 5 no terminal
    const renderGauge = (value: number, max = 5, colorClass = "text-[#fbaa19]") => {
        return (
            <div className="flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: max }).map((_, i) => (
                    <span 
                        key={i} 
                        className={`inline-block w-3.5 h-3.5 leading-none text-center font-bold ${
                            i < value ? `${colorClass} opacity-100` : 'text-white/20'
                        }`}
                    >
                        ■
                    </span>
                ))}
                <span className="ml-2 font-bold text-white/80">{value}/{max}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050401] text-white font-mono relative selection:bg-[#fbaa19] selection:text-black pb-28">
            {/* Background Texture em Pixel Art Atmosférico conforme Guia de Estilo */}
            <img 
                src="/pixel_invite_bg_v2.jpg" 
                alt="" 
                className="fixed top-0 left-0 w-screen h-screen object-cover z-0 opacity-40 pointer-events-none"
                style={{ imageRendering: 'pixelated' }}
            />
            {/* Scanlines Overlay sutil */}
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#050401]/60 to-[#050401] pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                
                {/* CABEÇALHO DO PROTOCOLO CONFIDENCIAL // ENVELOPE DE DESPACHO */}
                <div className="bg-black/95 border border-white/20 p-4 sm:p-5 rounded-sm mb-6 shadow-2xl relative overflow-hidden">
                    {/* Linha decorativa no topo com cor do bloco */}
                    <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-500" style={{ backgroundColor: activeTheme.color }}></div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-red-600/90 text-white font-black tracking-widest text-[10px] uppercase animate-pulse flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>CLASSIFICAÇÃO: NÍVEL 5 — EYES ONLY</span>
                            </span>
                            <span className="text-white/40 hidden sm:inline">|</span>
                            <span className="text-white/60 text-[11px] hidden sm:inline">USO INTERNO DO PITWALL</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase">
                            <Fingerprint className="w-3.5 h-3.5 text-[#fbaa19]" />
                            <span>PROTOCOLO: #DOC-2026-RND{circuit.round}-DESPATCH</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-b border-white/10 pb-3 mb-3">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block">Origem do Despacho:</span>
                            <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5" style={{ color: activeTheme.color }}>
                                <Terminal className="w-3.5 h-3.5" />
                                <span>{activeDirectorMemo.headquarters}</span>
                            </span>
                        </div>
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block">Autoridade Técnica:</span>
                            <span className="font-bold text-white uppercase text-[11px] truncate block">
                                {activeDirectorMemo.directorTitle.split('//')[0]}
                            </span>
                        </div>
                        <div>
                            <span className="text-[9px] text-white/40 uppercase block">Destinatário:</span>
                            <span className="font-bold text-white uppercase text-[11px]">
                                {user ? `ESTRATEGISTA HOMOLOGADO (${userContractGroup || 'ALIANÇA GLOBAL'})` : 'ESTRATEGISTA CHEFE DE PITWALL'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/50 uppercase">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>DESCRIPTOGRAFADO EM TEMPO REAL VIA REDE DE TELEMETRIA VOLTGRID</span>
                        </span>
                        <span className="text-[#fbaa19] font-bold">
                            CODINOME: {activeDirectorMemo.codeWord}
                        </span>
                    </div>
                </div>

                {/* SELETOR DE PERSPECTIVA DA DIRETORIA TÉCNICA (FACÇÕES) */}
                <div className="mb-6 bg-black/90 border border-white/10 p-3 sm:p-4 rounded-sm">
                    <div className="flex items-center justify-between text-[11px] text-white/50 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
                        <span className="flex items-center gap-2 text-[#fbaa19] font-bold">
                            <Radio className="w-3.5 h-3.5" />
                            <span>CANAL DE COMUNICAÇÃO DO DIRETOR TÉCNICO:</span>
                        </span>
                        <span className="text-[10px] text-white/40 hidden sm:inline">Selecione para alternar o ponto de vista da engenharia</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(['A', 'B', 'C'] as FactionKey[]).map((fKey) => {
                            const isSelected = activeFaction === fKey;
                            const theme = FACTION_THEMES[fKey];
                            return (
                                <button
                                    key={fKey}
                                    onClick={() => setActiveFaction(fKey)}
                                    className={`p-3 text-left rounded transition-all border relative overflow-hidden ${
                                        isSelected 
                                            ? `bg-black/90 ${theme.borderClass} shadow-[0_0_15px_rgba(0,0,0,0.8)] ring-1` 
                                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                                    }`}
                                    style={{ ringColor: isSelected ? theme.color : undefined }}
                                >
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-2 h-2 rounded-full m-2 animate-ping" style={{ backgroundColor: theme.color }}></div>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] font-bold tracking-wider mb-1 uppercase">
                                        <span style={{ color: theme.color }}>{theme.badge}</span>
                                        {isSelected && <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded text-white">ATIVO</span>}
                                    </div>
                                    <div className="text-xs font-black uppercase text-white truncate">{theme.name}</div>
                                    <div className="text-[9px] text-white/40 truncate">{theme.sub}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MEMORANDO CONFIDENCIAL DO DIRETOR TÉCNICO // DESTAQUE EM PRIMEIRA PESSOA */}
                <div 
                    className="relative overflow-hidden bg-black/95 border-2 rounded-sm p-6 sm:p-8 mb-8 shadow-2xl transition-all duration-300"
                    style={{ borderColor: activeTheme.color }}
                >
                    {/* Carimbo de Fundo Translúcido */}
                    <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-5 font-black text-8xl uppercase tracking-tighter text-white">
                        {activeTheme.name.split(' ')[0]}
                    </div>

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.25em] font-bold block" style={{ color: activeTheme.color }}>
                                    &gt;_ DESPACHO OFICIAL DO DIRETOR TÉCNICO // DISSECAÇÃO DE PISTA
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-1">
                                    {activeDirectorMemo.directorTitle}
                                </h2>
                            </div>
                            <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 text-white/70 uppercase tracking-widest font-bold">
                                {activeDirectorMemo.confidentialityLevel}
                            </span>
                        </div>

                        {/* Texto do Memorando em tom confidencial */}
                        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-sm mb-6 relative">
                            <span className="text-4xl text-[#fbaa19] opacity-30 absolute top-2 left-3 font-serif select-none">“</span>
                            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-mono pl-6 italic">
                                {activeDirectorMemo.memo}
                            </p>
                        </div>

                        {/* Diretrizes Táticas de Paddock & Alerta Secreto */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-black/60 border border-white/10 p-4 rounded-sm">
                                <span className="text-[10px] uppercase font-bold tracking-widest mb-2 block" style={{ color: activeTheme.color }}>
                                    &gt; - DIRETRIZES TÁTICAS PRIORITÁRIAS DA ENGENHARIA:
                                </span>
                                <ul className="space-y-2">
                                    {activeDirectorMemo.tacticalDirectives.map((directive, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-white/80">
                                            <span className="font-bold text-[#fbaa19] mt-0.5">[{idx + 1}]</span>
                                            <span>{directive}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-red-950/20 border border-red-500/40 p-4 rounded-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-red-400 uppercase font-black tracking-widest flex items-center gap-1.5 mb-2">
                                        <ShieldAlert className="w-4 h-4 text-red-400" />
                                        <span>ALERTA DE SEGURANÇA TÁTICA</span>
                                    </span>
                                    <p className="text-[11px] text-red-200/90 leading-relaxed">
                                        {activeDirectorMemo.secretWarning}
                                    </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-red-500/20 text-[9px] text-red-400/60 uppercase">
                                    Transmissão criptografada via rádio do diretor
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ETAPA SELECTOR / SWITCHER TÁTICO DE CIRCUITOS */}
                <div className="mb-8 bg-black/85 backdrop-blur-md border border-[#fbaa19]/30 p-3 sm:p-4 rounded-sm">
                    <div className="flex items-center justify-between text-[11px] text-white/50 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
                        <span className="flex items-center gap-2 text-[#fbaa19] font-bold">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>ARQUIVO DE ETAPAS DO CALENDÁRIO 2026:</span>
                        </span>
                        <span className="hidden sm:inline text-white/40">Selecione para carregar o dossiê correspondente</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.values(CIRCUITS_INTEL).map((c) => {
                            const isSelected = c.id === circuit.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCircuitKey(c.id)}
                                    className={`text-left p-2.5 rounded transition-all border ${
                                        isSelected 
                                            ? 'bg-[#fbaa19]/20 border-[#fbaa19] text-white shadow-[0_0_10px_rgba(251,170,25,0.2)]' 
                                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1">
                                        <span className={isSelected ? 'text-[#fbaa19]' : 'text-white/40'}>RND {c.round}</span>
                                        <span className="text-[9px] px-1 bg-white/10 rounded">{c.countryCode}</span>
                                    </div>
                                    <div className="text-xs font-black uppercase truncate">{c.name.replace(' GRAND PRIX', '')}</div>
                                    <div className="text-[9px] text-white/40 truncate">{c.locality}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* HERO BANNER DA ETAPA ATIVA COM CRONÔMETRO REGRESSIVO */}
                <div className="relative overflow-hidden bg-black/90 border-2 border-[#fbaa19] p-6 sm:p-8 rounded-sm mb-8 shadow-[0_0_40px_rgba(251,170,25,0.15)]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Activity className="w-64 h-64 text-[#fbaa19]" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="bg-[#fbaa19] text-black font-black text-xs px-2.5 py-0.5 tracking-widest uppercase">
                                    ROUND {circuit.round} // PRÓXIMA ETAPA
                                </span>
                                <span className="bg-white/10 text-white/80 font-bold text-xs px-2.5 py-0.5 tracking-widest uppercase">
                                    {circuit.country.toUpperCase()}
                                </span>
                                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    PREGÃO DE PROGNÓSTICOS ABERTO NO PITWALL
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-white mb-2 leading-tight">
                                {circuit.name}
                            </h1>
                            <p className="text-[#fbaa19] text-base sm:text-lg font-bold tracking-widest uppercase">
                                {circuit.circuitName} // {circuit.locality}
                            </p>
                            <p className="text-white/50 text-xs tracking-wider uppercase mt-1">
                                {circuit.officialTitle}
                            </p>
                        </div>

                        {/* CRONÔMETRO REGRESSIVO DO PITWALL */}
                        <div className="bg-black/95 border border-white/20 p-4 rounded-sm flex flex-col items-center sm:items-end justify-center min-w-[280px]">
                            <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#fbaa19]" />
                                <span>LARGADA EM CONTAGEM REGRESSIVA</span>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-3 text-center">
                                <div className="bg-white/5 border border-white/10 px-2.5 py-2 rounded">
                                    <span className="text-xl sm:text-2xl font-black text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                                    <span className="block text-[8px] text-white/40 tracking-widest uppercase mt-0.5">DIAS</span>
                                </div>
                                <span className="text-xl font-bold text-[#fbaa19]">:</span>
                                <div className="bg-white/5 border border-white/10 px-2.5 py-2 rounded">
                                    <span className="text-xl sm:text-2xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="block text-[8px] text-white/40 tracking-widest uppercase mt-0.5">HRS</span>
                                </div>
                                <span className="text-xl font-bold text-[#fbaa19]">:</span>
                                <div className="bg-white/5 border border-white/10 px-2.5 py-2 rounded">
                                    <span className="text-xl sm:text-2xl font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="block text-[8px] text-white/40 tracking-widest uppercase mt-0.5">MIN</span>
                                </div>
                                <span className="text-xl font-bold text-[#fbaa19]">:</span>
                                <div className="bg-white/5 border border-white/10 px-2.5 py-2 rounded">
                                    <span className="text-xl sm:text-2xl font-black text-[#fbaa19]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <span className="block text-[8px] text-white/40 tracking-widest uppercase mt-0.5">SEG</span>
                                </div>
                            </div>

                            <Link 
                                href="/positions" 
                                className="mt-4 w-full bg-[#fbaa19] hover:bg-white text-black py-2 text-center text-xs font-black uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2"
                            >
                                <span>ABRIR PROTOCOLO DE POSIÇÕES</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* A VOZ DO BRIEFING // ESTRATEGISTA SÊNIOR DA ETAPA */}
                <div className="mb-8">
                    <SeniorStrategistCard 
                        roundNumber={circuit.round} 
                        initialStrategistId={userSeniorStrategistId}
                    />
                </div>

                {/* DISSECAÇÃO TÉCNICA ENVELOPADA // 3 ANEXOS DE ENGENHARIA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* ANEXO 1: RELATÓRIO DO ENGENHEIRO DE DINÂMICA VEICULAR & CHASSI */}
                    <div className="bg-black/90 backdrop-blur-sm border border-white/15 p-5 rounded-sm flex flex-col gap-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] flex items-center gap-2">
                                <Gauge className="w-4 h-4" />
                                <span>ANEXO I // DINÂMICA VEICULAR</span>
                            </span>
                            <span className="text-[10px] text-white/40 uppercase">CHASSI SPEC</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white/5 p-2.5 rounded border border-white/5">
                                <span className="text-[9px] text-white/40 uppercase block">Extensão da Volta</span>
                                <span className="text-base font-black text-white">{circuit.circuitLengthKm} km</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded border border-white/5">
                                <span className="text-[9px] text-white/40 uppercase block">Voltas / GP</span>
                                <span className="text-base font-black text-white">{circuit.laps} voltas</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded border border-white/5">
                                <span className="text-[9px] text-white/40 uppercase block">Distância Total</span>
                                <span className="text-base font-black text-white">{circuit.raceDistanceKm} km</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded border border-white/5">
                                <span className="text-[9px] text-white/40 uppercase block">Curvas</span>
                                <span className="text-base font-black text-white">{circuit.turns.total} ({circuit.turns.left}E / {circuit.turns.right}D)</span>
                            </div>
                        </div>

                        {/* BARRAS DE NÍVEL / MEDIDORES DE PISTA */}
                        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                            <div>
                                <div className="flex items-center justify-between text-[11px] uppercase mb-1">
                                    <span className="text-white/70">Abrasividade do Asfalto:</span>
                                    <span className="text-xs font-bold text-amber-400">
                                        {circuit.asphaltAbrasiveness >= 4 ? 'ALTA' : circuit.asphaltAbrasiveness === 3 ? 'MÉDIA' : 'BAIXA'}
                                    </span>
                                </div>
                                {renderGauge(circuit.asphaltAbrasiveness, 5, "text-amber-400")}
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-[11px] uppercase mb-1">
                                    <span className="text-white/70">Aderência do Asfalto (Grip):</span>
                                    <span className="text-xs font-bold text-emerald-400">
                                        {circuit.trackGrip >= 4 ? 'ELEVADO' : 'MÉDIO'}
                                    </span>
                                </div>
                                {renderGauge(circuit.trackGrip, 5, "text-emerald-400")}
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-[11px] uppercase mb-1">
                                    <span className="text-white/70">Estresse Lateral nos Pneus:</span>
                                    <span className="text-xs font-bold text-rose-400">
                                        {circuit.tireStress >= 4 ? 'SEVERO' : 'MODERADO'}
                                    </span>
                                </div>
                                {renderGauge(circuit.tireStress, 5, "text-rose-400")}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                <span className="text-white/50 uppercase">Downforce Exigido:</span>
                                <span className="font-black text-[#fbaa19]">{circuit.downforceLevel}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/50 uppercase">Demanda de Freios:</span>
                                <span className="font-black text-red-400">{circuit.brakeSeverity}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/50 uppercase">Top Speed Projetada:</span>
                                <span className="font-black text-white">{circuit.topSpeedKmh} km/h</span>
                            </div>
                        </div>

                        {/* DRS ZONES */}
                        <div className="bg-white/5 p-3 rounded border border-white/10 mt-auto">
                            <div className="text-[10px] text-[#fbaa19] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                <span>{circuit.drsZones} ZONAS DE DRS ATIVAS</span>
                            </div>
                            <p className="text-[10px] text-white/70 leading-relaxed">
                                {circuit.drsDetails}
                            </p>
                        </div>
                    </div>

                    {/* ANEXO 2: DOSSIÊ PIRELLI DO ENGENHEIRO-CHEFE DE PNEUS & BOX */}
                    <div className="bg-black/90 backdrop-blur-sm border border-white/15 p-5 rounded-sm flex flex-col gap-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] flex items-center gap-2">
                                <CircleDot className="w-4 h-4" />
                                <span>ANEXO II // PNEUS & ESTRATÉGIA</span>
                            </span>
                            <span className="text-[10px] text-white/40 uppercase">PIRELLI DOSSIER</span>
                        </div>

                        {/* COMPOSTOS HOMOLOGADOS */}
                        <div className="bg-white/5 p-3 rounded border border-white/10">
                            <span className="text-[10px] text-white/50 uppercase tracking-widest block mb-2">Alocação Oficial de Compostos:</span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                                <div className="p-2 rounded bg-black/60 border border-white/40">
                                    <span className="w-3 h-3 rounded-full bg-white inline-block mb-1 mx-auto"></span>
                                    <span className="block text-[9px] text-white/50">HARD</span>
                                    <span className="text-white">{circuit.tireAllocation.hard.split(' ')[0]}</span>
                                </div>
                                <div className="p-2 rounded bg-black/60 border border-yellow-400">
                                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block mb-1 mx-auto"></span>
                                    <span className="block text-[9px] text-yellow-400/70">MEDIUM</span>
                                    <span className="text-yellow-400">{circuit.tireAllocation.medium.split(' ')[0]}</span>
                                </div>
                                <div className="p-2 rounded bg-black/60 border border-red-500">
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block mb-1 mx-auto"></span>
                                    <span className="block text-[9px] text-red-500/70">SOFT</span>
                                    <span className="text-red-400">{circuit.tireAllocation.soft.split(' ')[0]}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-white/60 mt-2 leading-relaxed italic">
                                {circuit.tireAllocation.desc}
                            </p>
                        </div>

                        {/* DEGRADAÇÃO & PIT STOP DELTA */}
                        <div className="flex flex-col gap-2.5 text-xs">
                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                                <span className="text-white/60 uppercase">Degradação Térmica:</span>
                                <span className={`font-black ${
                                    circuit.tireDegradation === 'EXTREMA' || circuit.tireDegradation === 'ALTA' 
                                        ? 'text-rose-400' 
                                        : 'text-amber-400'
                                }`}>
                                    {circuit.tireDegradation}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                                <span className="text-white/60 uppercase">Perda Média no Pitlane:</span>
                                <span className="font-black text-white">{circuit.pitLaneTimeLossSec}s</span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                                <span className="text-white/60 uppercase">Poder do Undercut:</span>
                                <span className="font-black text-[#fbaa19]">{circuit.undercutStrength}</span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                                <span className="text-white/60 uppercase">Dificuldade Ultrapassagem:</span>
                                <span className="font-black text-white">{circuit.overtakingDifficulty}</span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                                <span className="text-white/60 uppercase">Delta de Ultrapassagem:</span>
                                <span className="font-black text-white">~{circuit.overtakingDeltaSec}s por volta</span>
                            </div>
                        </div>

                        {/* PLANO DE PITWALL OFICIAL */}
                        <div className="mt-auto p-3 rounded bg-[#fbaa19]/10 border border-[#fbaa19]/40">
                            <div className="text-[10px] text-[#fbaa19] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Radio className="w-3 h-3" />
                                <span>ESTRATÉGIA DO DIRETOR DE CORRIDA:</span>
                            </div>
                            <p className="text-xs text-white/90 font-bold">
                                {circuit.optimalStrategy}
                            </p>
                        </div>
                    </div>

                    {/* ANEXO 3: BOLETIM DA ESTAÇÃO METEOROLÓGICA DE PITWALL */}
                    <div className="bg-black/90 backdrop-blur-sm border border-white/15 p-5 rounded-sm flex flex-col gap-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] flex items-center gap-2">
                                <Wind className="w-4 h-4" />
                                <span>ANEXO III // RADAR METEOROLÓGICO</span>
                            </span>
                            <span className="text-[10px] text-white/40 uppercase">LIVE PIT RADAR</span>
                        </div>

                        {/* STATUS METEOROLÓGICO */}
                        <div className="bg-gradient-to-br from-white/10 to-transparent p-4 rounded border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] text-[#fbaa19] font-bold uppercase tracking-widest">
                                    CONDIÇÃO AMBIENTAL
                                </span>
                                <span className="text-xs font-bold text-emerald-400">PISTA SECA</span>
                            </div>
                            <p className="text-xs text-white/90 mb-4 font-bold">
                                {circuit.weather.condition}
                            </p>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-black/60 p-2.5 rounded border border-white/10">
                                    <span className="text-[9px] text-white/40 uppercase block">Temp. do Ar</span>
                                    <span className="text-2xl font-black text-white">{circuit.weather.ambientTemp}°C</span>
                                </div>
                                <div className="bg-black/60 p-2.5 rounded border border-amber-500/30">
                                    <span className="text-[9px] text-amber-400/80 uppercase block">Temp. do Asfalto</span>
                                    <span className="text-2xl font-black text-amber-400">{circuit.weather.trackTemp}°C</span>
                                </div>
                            </div>
                        </div>

                        {/* CHUVA & VENTO */}
                        <div className="flex flex-col gap-2.5 text-xs">
                            <div className="p-2.5 rounded bg-white/5 border border-white/5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-white/60 uppercase flex items-center gap-1.5">
                                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Risco de Chuva:</span>
                                    </span>
                                    <span className={`font-black ${
                                        circuit.weather.rainRiskPercent > 40 ? 'text-blue-400' : 'text-emerald-400'
                                    }`}>
                                        {circuit.weather.rainRiskPercent}%
                                    </span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${circuit.weather.rainRiskPercent > 40 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${circuit.weather.rainRiskPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-2.5 rounded bg-white/5 border border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white/60 uppercase flex items-center gap-1.5">
                                        <Wind className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Vento no Traçado:</span>
                                    </span>
                                    <span className="font-black text-white">{circuit.weather.windSpeedKmh} km/h ({circuit.weather.windDirection})</span>
                                </div>
                                <p className="text-[10px] text-white/50 italic mt-1">
                                    {circuit.weather.windImpact}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-[9px] text-white/40 uppercase block">Umidade</span>
                                    <span className="font-bold text-white">{circuit.weather.humidityPercent}%</span>
                                </div>
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-[9px] text-white/40 uppercase block">Pressão</span>
                                    <span className="font-bold text-white">{circuit.weather.barometerHpa} hPa</span>
                                </div>
                            </div>
                        </div>

                        {/* RISCO T1 & SAFETY CAR */}
                        <div className="mt-auto grid grid-cols-2 gap-2 text-center">
                            <div className="p-2.5 rounded bg-black/60 border border-red-500/30">
                                <span className="text-[9px] text-red-400 uppercase block font-bold">Risco Curva 1</span>
                                <span className="text-xs font-black text-red-500">{circuit.t1IncidentRisk}</span>
                            </div>
                            <div className="p-2.5 rounded bg-black/60 border border-[#fbaa19]/30">
                                <span className="text-[9px] text-[#fbaa19] uppercase block font-bold">Chance Safety Car</span>
                                <span className="text-xs font-black text-white">{circuit.scProbability}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ANEXO IV: ARQUIVO CRIPTOGRAFADO DE BENCHMARKS HISTÓRICOS */}
                <div className="bg-black/90 border border-white/15 p-6 rounded-sm mb-8 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                <span>ANEXO IV // ARQUIVO CRIPTOGRAFADO DE BENCHMARKS HISTÓRICOS</span>
                            </span>
                            <span className="text-xs text-white/40 mt-1 block">Dados homologados para calibrar o Poletime ao milésimo e previsões de pódio</span>
                        </div>
                        <div className="bg-white/5 px-3 py-1 rounded border border-white/10 text-xs">
                            <span className="text-white/50">Taxa Pole-to-Win:</span> <span className="font-bold text-[#fbaa19]">{circuit.poleToWinRate}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded">
                            <span className="text-[10px] text-[#fbaa19] uppercase tracking-widest font-bold block mb-1">
                                ÚLTIMA POLE (REFERÊNCIA DE POLETIME)
                            </span>
                            <span className="text-2xl font-black text-white tracking-wider block font-mono">
                                {circuit.lastPoleTime.time}
                            </span>
                            <span className="text-xs text-white/60 uppercase">
                                {circuit.lastPoleTime.driver} ({circuit.lastPoleTime.year})
                            </span>
                        </div>

                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded">
                            <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-1">
                                RECORDE OFICIAL DA PISTA
                            </span>
                            <span className="text-2xl font-black text-white tracking-wider block font-mono">
                                {circuit.lapRecord.time}
                            </span>
                            <span className="text-xs text-white/60 uppercase">
                                {circuit.lapRecord.driver} ({circuit.lapRecord.year})
                            </span>
                        </div>

                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded">
                            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block mb-1">
                                HISTÓRICO DE SAFETY CAR (SC)
                            </span>
                            <span className="text-2xl font-black text-amber-400 tracking-wider block font-mono">
                                {circuit.scProbability}%
                            </span>
                            <span className="text-xs text-white/60 uppercase">
                                VSC: {circuit.vscProbability}% das edições
                            </span>
                        </div>

                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded">
                            <span className="text-[10px] text-rose-400 uppercase tracking-widest font-bold block mb-1">
                                MÉDIA HISTÓRICA DE ABANDONOS (DNF)
                            </span>
                            <span className="text-2xl font-black text-rose-400 tracking-wider block font-mono">
                                {circuit.dnfAverage} MONOPOSTOS
                            </span>
                            <span className="text-xs text-white/60 uppercase">
                                Risco de Red Flag: Moderado
                            </span>
                        </div>
                    </div>
                </div>

                {/* ANEXO V: DIRETRIZES DE COMBATE OPERACIONAL (OS 5 PROGNÓSTICOS DO VOLTGRID) */}
                <div className="bg-black/95 border-2 border-[#fbaa19]/40 p-6 sm:p-8 rounded-sm mb-8 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#fbaa19]" />
                            <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                                ANEXO V // INSTRUÇÕES OPERACIONAIS PARA AS 5 TOMADAS DE POSIÇÃO
                            </span>
                        </div>
                        <span className="text-xs text-[#fbaa19] font-bold hidden sm:inline">ORDENS DE PITWALL</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-black uppercase text-[#fbaa19] block mb-2 flex items-center gap-1.5">
                                    <span>⚡ 01. POLETIME</span>
                                </span>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                    {circuit.briefing.poletimeTactics}
                                </p>
                            </div>
                            <span className="text-[9px] text-white/40 uppercase mt-3 pt-2 border-t border-white/5">
                                Cravar tempo ao milésimo
                            </span>
                        </div>

                        <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-black uppercase text-emerald-400 block mb-2 flex items-center gap-1.5">
                                    <span>🏆 02. TOP 10 FINISH</span>
                                </span>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                    {circuit.briefing.masterTactics}
                                </p>
                            </div>
                            <span className="text-[9px] text-white/40 uppercase mt-3 pt-2 border-t border-white/5">
                                Ordem exata de chegada
                            </span>
                        </div>

                        <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-black uppercase text-blue-400 block mb-2 flex items-center gap-1.5">
                                    <span>📈 03. EVO (ESCALADA)</span>
                                </span>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                    {circuit.briefing.evoTactics}
                                </p>
                            </div>
                            <span className="text-[9px] text-white/40 uppercase mt-3 pt-2 border-t border-white/5">
                                Pilotos com maior ganho de posições
                            </span>
                        </div>

                        <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-black uppercase text-purple-400 block mb-2 flex items-center gap-1.5">
                                    <span>⚔️ 04. DUELOS TÁTICOS (H2H)</span>
                                </span>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                    {circuit.briefing.h2hTactics}
                                </p>
                            </div>
                            <span className="text-[9px] text-white/40 uppercase mt-3 pt-2 border-t border-white/5">
                                Confrontos internos diretos
                            </span>
                        </div>

                        <div className="p-4 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-black uppercase text-amber-400 block mb-2 flex items-center gap-1.5">
                                    <span>🎲 05. EVENT PROPS (MISC)</span>
                                </span>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                    {circuit.briefing.miscTactics}
                                </p>
                            </div>
                            <span className="text-[9px] text-white/40 uppercase mt-3 pt-2 border-t border-white/5">
                                Safety Car, voltas mais rápidas e DNF
                            </span>
                        </div>
                    </div>
                </div>

                {/* CRONOGRAMA OFICIAL DAS SESSÕES */}
                <div className="bg-black/90 border border-white/10 p-6 rounded-sm mb-12">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#fbaa19] flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>ANEXO VI // CRONOGRAMA DAS SESSÕES OFICIAIS (HORÁRIOS UTC)</span>
                        </span>
                        <span className="text-xs text-white/40">FUSO: UTC / LONDRES</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                        {circuit.schedule.fp1 && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                <span className="text-[9px] text-white/40 uppercase block mb-1">{circuit.schedule.fp1.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.fp1.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block">{circuit.schedule.fp1.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.fp2 && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                <span className="text-[9px] text-white/40 uppercase block mb-1">{circuit.schedule.fp2.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.fp2.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block">{circuit.schedule.fp2.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.sprintQuali && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                <span className="text-[9px] text-white/40 uppercase block mb-1">{circuit.schedule.sprintQuali.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.sprintQuali.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block">{circuit.schedule.sprintQuali.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.sprintRace && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                <span className="text-[9px] text-white/40 uppercase block mb-1">{circuit.schedule.sprintRace.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.sprintRace.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block">{circuit.schedule.sprintRace.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.fp3 && (
                            <div className="p-3 bg-white/5 border border-white/5 rounded">
                                <span className="text-[9px] text-white/40 uppercase block mb-1">{circuit.schedule.fp3.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.fp3.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block">{circuit.schedule.fp3.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.qualifying && (
                            <div className="p-3 bg-[#fbaa19]/10 border border-[#fbaa19]/40 rounded">
                                <span className="text-[9px] text-[#fbaa19] uppercase block mb-1">{circuit.schedule.qualifying.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.qualifying.label}</span>
                                <span className="text-xs text-[#fbaa19] font-mono mt-1 block font-black">{circuit.schedule.qualifying.timeUtc}</span>
                            </div>
                        )}
                        {circuit.schedule.race && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded">
                                <span className="text-[9px] text-emerald-400 uppercase block mb-1">{circuit.schedule.race.date}</span>
                                <span className="font-bold text-white block truncate">{circuit.schedule.race.label}</span>
                                <span className="text-xs text-emerald-400 font-mono mt-1 block font-black">{circuit.schedule.race.timeUtc}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* AUTENTICAÇÃO DIGITAL & CALL TO ACTION // ENCERRAMENTO DO BRIEFING */}
                <div className="text-center bg-gradient-to-r from-black via-black/95 to-black border-2 border-[#fbaa19] p-8 sm:p-10 rounded-sm shadow-[0_0_50px_rgba(251,170,25,0.2)] flex flex-col items-center justify-center gap-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-[0.2em]">
                        <Fingerprint className="w-4 h-4 text-[#fbaa19]" />
                        <span>ASSINATURA DIGITAL CERTIFICADA // HASH: 8f46a381a0854d8c92a281794fb17a2a</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white max-w-3xl leading-snug">
                        DIRETRIZES TÉCNICAS RECONHECIDAS. É HORA DE GRAVAR SEUS PROGNÓSTICOS NO GRID.
                    </h2>

                    <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                        Você possui os dados do túnel de vento, o dossiê térmico dos pneus Pirelli, os benchmarks de tempo de pole e o despacho confidencial do Diretor Técnico da sua aliança. O Pitwall do VoltGrid está pronto para receber suas 5 tomadas de posição oficiais.
                    </p>

                    <Link 
                        href="/positions" 
                        className="bg-[#fbaa19] hover:bg-white text-black px-8 py-4 sm:px-10 sm:py-5 text-sm sm:text-base font-black uppercase tracking-widest transition-all rounded-sm shadow-[0_0_30px_rgba(251,170,25,0.4)] flex items-center gap-3 cursor-pointer"
                    >
                        <span>[ &gt;_ ABRIR PROTOCOLO DE POSIÇÕES ]</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <span className="text-[10px] text-white/30 uppercase tracking-widest">
                        VOLTGRID PITWALL TELEMETRY SYSTEM © 2026 // NÍVEL 5 CLASSIFICADO
                    </span>
                </div>

            </div>
        </div>
    );
}
