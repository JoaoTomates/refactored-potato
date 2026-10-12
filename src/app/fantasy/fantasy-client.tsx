"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';
import { F1_TEAMS } from '@/lib/teams';

// Golden Rule (Naming): Pilotos e Usuários SEMPRE no formato "L.GUSTAVO"
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
        const clean = fallback.replace(/^@/, '').trim().toUpperCase();
        return clean;
    }
    return 'PILOTO';
}

// Grupos Oficiais (Campeões Históricos)
const CHAMPION_GROUPS = [
    { id: 1, name: "G. FARINA", year: "1950", leader: "L.GUSTAVO" },
    { id: 2, name: "J. M. FANGIO", year: "1951", leader: "M.VERSTAPPEN" },
    { id: 3, name: "A. ASCARI", year: "1952", leader: "C.LECLERC" },
    { id: 4, name: "M. HAWTHORN", year: "1958", leader: "L.NORRIS" },
    { id: 5, name: "J. BRABHAM", year: "1959", leader: "O.PIASTRI" },
    { id: 6, name: "P. HILL", year: "1961", leader: "G.RUSSELL" },
    { id: 7, name: "G. HILL", year: "1962", leader: "L.HAMILTON" },
    { id: 8, name: "J. CLARK", year: "1963", leader: "F.ALONSO" },
    { id: 9, name: "J. SURTEES", year: "1964", leader: "C.SAINZ" },
    { id: 10, name: "D. HULME", year: "1967", leader: "A.ALBON" },
];

// Rodadas da Temporada 2026
const SEASON_ROUNDS = [
    { id: '01', name: 'BAHRAIN GP', track: 'Sakhir Circuit', poleTime: '1:29.179', status: 'CONCLUÍDO' },
    { id: '02', name: 'SAUDI ARABIA GP', track: 'Jeddah Corniche', poleTime: '1:27.472', status: 'CONCLUÍDO' },
    { id: '03', name: 'AUSTRALIAN GP', track: 'Albert Park Circuit', poleTime: '1:15.915', status: 'EM DISPUTA' },
    { id: '04', name: 'JAPANESE GP', track: 'Suzuka International', poleTime: '1:28.197', status: 'ABERTO' },
    { id: '05', name: 'CHINESE GP', track: 'Shanghai Circuit', poleTime: '1:33.660', status: 'PREGÃO ABERTO' },
    { id: '06', name: 'MIAMI GP', track: 'Miami International', poleTime: '1:27.241', status: 'AGUARDANDO' },
];

// Configuração das Competições
type CompetitionKey = 'poletime' | 'master' | 'milesimus' | 'teamwork';

interface CompetitionDef {
    id: CompetitionKey;
    code: string;
    title: string;
    subtitle: string;
    badge: string;
    desc: string;
    icon: string;
}

const COMPETITIONS: CompetitionDef[] = [
    {
        id: 'poletime',
        code: 'POLE',
        title: 'POLETIME COMPETITION',
        subtitle: 'PRECISÃO MILIMÉTRICA NO Q3',
        badge: 'CIRÚRGICO',
        desc: 'Desafio individual contra o relógio: adivinhe o tempo exato da pole position até os milésimos de segundo.',
        icon: '⏱'
    },
    {
        id: 'master',
        code: 'MASTER',
        title: 'MASTER LEAGUE',
        subtitle: 'O GRID FECHADO DE 22 PILOTOS',
        badge: 'LIGA OFICIAL',
        desc: 'Micro-campeonato fechado dentro do seu grupo de 22 assentos com pontuação oficial FIA e desempate em 3 camadas táticas.',
        icon: '🏆'
    },
    {
        id: 'milesimus',
        code: 'MILES',
        title: 'MILESIMUS LEAGUE',
        subtitle: 'RANKING GERAL SUPREMO',
        badge: 'GLOBAL',
        desc: 'A somatória absoluta de todo o repertório técnico de cada estrategista ao longo de toda a temporada mundial.',
        icon: '🌐'
    },
    {
        id: 'teamwork',
        code: 'TEAM',
        title: 'TEAMWORK COMPETITION',
        subtitle: 'GUERRA DE ESCUDERIAS & BLOCOS',
        badge: 'ALIANÇAS',
        desc: 'A disputa entre os construtores e alianças de motores da F1. Cada ponto conquistado soma para a honra da sua equipe.',
        icon: '⚡'
    }
];

// Mock de Leaderboards e Resultados com nomes rigorosamente formatados
const MOCK_POLETIME_RESULTS = [
    { pos: 1, pilot: 'L.GUSTAVO', team: 'McLaren', teamColor: '#FF8000', betTime: '1:15.918', gapMs: 3, points: 4997, timestamp: '14:28:11' },
    { pos: 2, pilot: 'C.LECLERC', team: 'Ferrari', teamColor: '#DC0000', betTime: '1:15.909', gapMs: 6, points: 4994, timestamp: '14:15:02' },
    { pos: 3, pilot: 'M.VERSTAPPEN', team: 'Red Bull', teamColor: '#3671C6', betTime: '1:15.928', gapMs: 13, points: 4987, timestamp: '13:58:44' },
    { pos: 4, pilot: 'L.NORRIS', team: 'McLaren', teamColor: '#FF8000', betTime: '1:15.895', gapMs: 20, points: 4980, timestamp: '14:29:40' },
    { pos: 5, pilot: 'O.PIASTRI', team: 'McLaren', teamColor: '#FF8000', betTime: '1:15.942', gapMs: 27, points: 4973, timestamp: '14:10:19' },
    { pos: 6, pilot: 'G.RUSSELL', team: 'Mercedes', teamColor: '#00D2BE', betTime: '1:15.870', gapMs: 45, points: 4955, timestamp: '14:02:11' },
    { pos: 7, pilot: 'L.HAMILTON', team: 'Ferrari', teamColor: '#DC0000', betTime: '1:15.975', gapMs: 60, points: 4940, timestamp: '12:44:30' },
    { pos: 8, pilot: 'F.ALONSO', team: 'Aston Martin', teamColor: '#229971', betTime: '1:15.830', gapMs: 85, points: 4915, timestamp: '11:15:00' },
];

const MOCK_MASTER_GROUP_STANDINGS = [
    { rank: 1, pilot: 'L.GUSTAVO', team: 'McLaren', teamColor: '#FF8000', racePoints: 68, top10Hits: 8, annualPoints: 75, tieBreakerDetail: 'Top 10: 8 pilotos (+0.8)' },
    { rank: 2, pilot: 'C.LECLERC', team: 'Ferrari', teamColor: '#DC0000', racePoints: 68, top10Hits: 7, annualPoints: 58, tieBreakerDetail: 'Top 10: 7 pilotos (+0.7)' },
    { rank: 3, pilot: 'M.VERSTAPPEN', team: 'Red Bull', teamColor: '#3671C6', racePoints: 55, top10Hits: 7, annualPoints: 52, tieBreakerDetail: 'Top 10: 7 pilotos (+0.7)' },
    { rank: 4, pilot: 'L.NORRIS', team: 'McLaren', teamColor: '#FF8000', racePoints: 48, top10Hits: 6, annualPoints: 40, tieBreakerDetail: 'Qualifying Mirror: P2' },
    { rank: 5, pilot: 'O.PIASTRI', team: 'McLaren', teamColor: '#FF8000', racePoints: 48, top10Hits: 6, annualPoints: 37, tieBreakerDetail: 'Timestamp: 13:40:15' },
    { rank: 6, pilot: 'G.RUSSELL', team: 'Mercedes', teamColor: '#00D2BE', racePoints: 40, top10Hits: 5, annualPoints: 30, tieBreakerDetail: 'Top 10: 5 pilotos' },
    { rank: 7, pilot: 'L.HAMILTON', team: 'Ferrari', teamColor: '#DC0000', racePoints: 32, top10Hits: 5, annualPoints: 24, tieBreakerDetail: 'Timestamp: 11:20:00' },
    { rank: 8, pilot: 'C.SAINZ', team: 'Williams', teamColor: '#005AFF', racePoints: 26, top10Hits: 4, annualPoints: 18, tieBreakerDetail: 'Top 10: 4 pilotos' },
    { rank: 9, pilot: 'F.ALONSO', team: 'Aston Martin', teamColor: '#229971', racePoints: 20, top10Hits: 4, annualPoints: 12, tieBreakerDetail: 'Top 10: 4 pilotos' },
    { rank: 10, pilot: 'A.ALBON', team: 'Williams', teamColor: '#005AFF', racePoints: 15, top10Hits: 3, annualPoints: 8, tieBreakerDetail: 'Top 10: 3 pilotos' },
    { rank: 11, pilot: 'E.OCON', team: 'Haas', teamColor: '#E6002B', racePoints: 12, top10Hits: 2, annualPoints: 0, tieBreakerDetail: 'Fora da zona de pontos' },
    { rank: 12, pilot: 'P.GASLY', team: 'Alpine', teamColor: '#FD4BC7', racePoints: 10, top10Hits: 2, annualPoints: 0, tieBreakerDetail: 'Fora da zona de pontos' },
];

const MOCK_MILESIMUS_OVERALL = [
    { rank: 1, pilot: 'L.GUSTAVO', group: 'G. FARINA', team: 'McLaren', teamColor: '#FF8000', poletime: 14850, master: 172, evo: 45, h2h: 30, misc: 18, total: 15115 },
    { rank: 2, pilot: 'C.LECLERC', group: 'G. FARINA', team: 'Ferrari', teamColor: '#DC0000', poletime: 14780, master: 165, evo: 40, h2h: 25, misc: 20, total: 15030 },
    { rank: 3, pilot: 'M.VERSTAPPEN', group: 'J. M. FANGIO', team: 'Red Bull', teamColor: '#3671C6', poletime: 14690, master: 158, evo: 50, h2h: 25, misc: 16, total: 14939 },
    { rank: 4, pilot: 'L.NORRIS', group: 'G. FARINA', team: 'McLaren', teamColor: '#FF8000', poletime: 14610, master: 150, evo: 35, h2h: 30, misc: 20, total: 14845 },
    { rank: 5, pilot: 'G.RUSSELL', group: 'A. ASCARI', team: 'Mercedes', teamColor: '#00D2BE', poletime: 14520, master: 142, evo: 40, h2h: 20, misc: 14, total: 14736 },
    { rank: 6, pilot: 'O.PIASTRI', group: 'M. HAWTHORN', team: 'McLaren', teamColor: '#FF8000', poletime: 14450, master: 138, evo: 35, h2h: 25, misc: 18, total: 14666 },
    { rank: 7, pilot: 'L.HAMILTON', group: 'A. ASCARI', team: 'Ferrari', teamColor: '#DC0000', poletime: 14380, master: 130, evo: 30, h2h: 20, misc: 16, total: 14576 },
    { rank: 8, pilot: 'C.SAINZ', group: 'J. BRABHAM', team: 'Williams', teamColor: '#005AFF', poletime: 14210, master: 122, evo: 45, h2h: 15, misc: 12, total: 14404 },
];

const MOCK_TEAMWORK_STANDINGS = [
    { rank: 1, team: 'McLaren', block: 'BLOCO A (ESTRELA)', color: '#FF8000', pilots: ['L.GUSTAVO', 'L.NORRIS'], totalPts: 322, avgPts: 161.0 },
    { rank: 2, team: 'Scuderia Ferrari', block: 'BLOCO B (MARANELLO)', color: '#DC0000', pilots: ['C.LECLERC', 'L.HAMILTON'], totalPts: 295, avgPts: 147.5 },
    { rank: 3, team: 'Red Bull Racing', block: 'BLOCO C (VANGUARDA)', color: '#3671C6', pilots: ['M.VERSTAPPEN', 'Y.TSUNODA'], totalPts: 278, avgPts: 139.0 },
    { rank: 4, team: 'Mercedes-AMG', block: 'BLOCO A (ESTRELA)', color: '#00D2BE', pilots: ['G.RUSSELL', 'K.ANTONELLI'], totalPts: 246, avgPts: 123.0 },
    { rank: 5, team: 'Williams Racing', block: 'BLOCO A (ESTRELA)', color: '#005AFF', pilots: ['C.SAINZ', 'A.ALBON'], totalPts: 212, avgPts: 106.0 },
    { rank: 6, team: 'Aston Martin', block: 'BLOCO C (VANGUARDA)', color: '#229971', pilots: ['F.ALONSO', 'L.STROLL'], totalPts: 184, avgPts: 92.0 },
];

export default function FantasyClient() {
    const { user } = useSupabaseAuth();
    const [activeComp, setActiveComp] = useState<CompetitionKey>('poletime');
    const [activeTab, setActiveTab] = useState<'ranking' | 'results' | 'rules'>('ranking');
    const [selectedRound, setSelectedRound] = useState<string>('03');
    const [selectedGroupId, setSelectedGroupId] = useState<number>(1);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Carrega perfil real do usuário logado se existir
    useEffect(() => {
        const fetchUser = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('slug, first_name, last_name, driver_number')
                    .eq('id', user.id)
                    .single();
                if (data) setUserProfile(data);
            } catch (e) {
                // silencioso
            }
        };
        fetchUser();
    }, [user]);

    const userDisplayName = useMemo(() => {
        if (!userProfile) return 'L.GUSTAVO';
        return formatPilotName(userProfile.first_name, userProfile.last_name, userProfile.slug);
    }, [userProfile]);

    const activeRoundData = useMemo(() => {
        return SEASON_ROUNDS.find(r => r.id === selectedRound) || SEASON_ROUNDS[2];
    }, [selectedRound]);

    const activeCompData = useMemo(() => {
        return COMPETITIONS.find(c => c.id === activeComp) || COMPETITIONS[0];
    }, [activeComp]);

    return (
        <div className="w-full min-h-screen bg-[#050401] text-white flex flex-col font-mono relative overflow-x-hidden selection:bg-[#fbaa19] selection:text-black">
            
            {/* Background Pixel Art Imersivo com Scanlines Analógicas */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none opacity-30"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#050401]/90 via-[#050401]/95 to-[#050401] pointer-events-none"></div>
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }}></div>
            </div>

            {/* CONTEÚDO PRINCIPAL (Z-INDEX 10) */}
            <div className="relative z-10 w-full flex flex-col flex-1 pb-24">
                
                {/* 1. TOP HEADER OPERACIONAL COM TICKER F1 (ESTILO TERMINAL) */}
                <header className="border-b border-white/10 bg-black/85 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-2xl">
                    <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Terminal ID & Título */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] md:text-xs font-black tracking-[0.25em] text-[#fbaa19] uppercase">
                                    &gt;_ FANTASY AUDIT ENGINE // TEMPORADA 2026
                                </span>
                                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                                    FIA OFFICIAL SPEC
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
                                Central de Ligas & Competições
                            </h1>
                            <p className="text-[11px] text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <span>PILOTO ATIVO: <strong className="text-white">{userDisplayName}</strong></span>
                                <span className="opacity-30">|</span>
                                <span className="text-emerald-400 font-bold">PREGÃO ABERTO: R03 ALBERT PARK</span>
                            </p>
                        </div>

                        {/* Ações & Atalhos Rápidos */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            <Link
                                href="/positions"
                                className="px-3.5 py-2 rounded bg-[#fbaa19] hover:bg-white text-black font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(251,170,25,0.3)] flex items-center gap-1.5"
                            >
                                <span>[ ENVIAR ORDENS ]</span>
                            </Link>

                            <Link
                                href="/pitwall"
                                className="px-3 py-2 rounded bg-white/5 hover:bg-white/15 border border-white/20 text-white font-bold tracking-widest uppercase transition-all flex items-center gap-1.5"
                            >
                                <span>[ PITWALL ]</span>
                            </Link>

                            <Link
                                href="/fantasy2"
                                className="px-2.5 py-2 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white/40 hover:text-white text-[10px] tracking-widest uppercase transition-all"
                                title="Versão Clássica do Fantasy"
                            >
                                <span>[ LEGACY v1 ]</span>
                            </Link>
                        </div>
                    </div>

                    {/* FAIXA INFORMATIVA DO DEADLINE DE MERCADO */}
                    <div className="max-w-[1500px] mx-auto mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-white/60 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[#fbaa19] font-black animate-pulse">⚡ DEADLINE:</span>
                            <span>O fechamento definitivo do pregão ocorre no **início da Classificação (Q1 / Qualifying)**.</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase">
                            <span>SISTEMA DE DESEMPATE: CRONOLÓGICO & TRIPLA CAMADA</span>
                        </div>
                    </div>
                </header>

                {/* 2. CONSOLE SELETOR DE COMPETIÇÕES (HUD EM 4 MÓDULOS) */}
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 mt-6 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {COMPETITIONS.map((comp) => {
                            const isSelected = activeComp === comp.id;
                            return (
                                <button
                                    key={comp.id}
                                    onClick={() => setActiveComp(comp.id)}
                                    className={`relative p-4 rounded-lg text-left transition-all duration-200 border flex flex-col justify-between overflow-hidden group ${
                                        isSelected
                                            ? 'bg-black/85 border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.2)]'
                                            : 'bg-black/50 border-white/10 hover:border-white/30 hover:bg-black/70'
                                    }`}
                                >
                                    {/* Linha decorativa no topo quando selecionado */}
                                    {isSelected && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fbaa19] via-amber-300 to-[#fbaa19]"></div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase ${
                                                isSelected ? 'bg-[#fbaa19] text-black' : 'bg-white/10 text-white/60'
                                            }`}>
                                                [{comp.code}]
                                            </span>
                                            <span className="text-[10px] tracking-widest text-white/40 uppercase font-semibold">
                                                {comp.badge}
                                            </span>
                                        </div>

                                        <h3 className={`text-base font-black uppercase tracking-wider transition-colors ${
                                            isSelected ? 'text-[#fbaa19]' : 'text-white group-hover:text-white'
                                        }`}>
                                            {comp.title}
                                        </h3>
                                        <p className="text-[10px] text-white/50 tracking-wider uppercase mt-0.5">
                                            {comp.subtitle}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                                        <span className="text-white/40 line-clamp-1">{comp.desc}</span>
                                        <span className={`text-xs ml-2 ${isSelected ? 'text-[#fbaa19]' : 'text-white/30'}`}>
                                            {isSelected ? '● ATIVO' : '○ VER'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. BARRA DE CONTROLE DA COMPETIÇÃO (SUB-ABAS & FILTROS) */}
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 mt-6 w-full">
                    <div className="bg-black/80 border border-white/10 rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                        
                        {/* Seletor de Abas Principais */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setActiveTab('ranking')}
                                className={`px-4 py-2 rounded text-xs font-black tracking-widest uppercase transition-all ${
                                    activeTab === 'ranking'
                                        ? 'bg-[#fbaa19] text-black shadow-[0_0_12px_rgba(251,170,25,0.3)]'
                                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                                }`}
                            >
                                [ CLASSIFICAÇÃO GERAL ]
                            </button>

                            <button
                                onClick={() => setActiveTab('results')}
                                className={`px-4 py-2 rounded text-xs font-black tracking-widest uppercase transition-all ${
                                    activeTab === 'results'
                                        ? 'bg-[#fbaa19] text-black shadow-[0_0_12px_rgba(251,170,25,0.3)]'
                                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                                }`}
                            >
                                [ RESULTADOS DA ETAPA ]
                            </button>

                            <button
                                onClick={() => setActiveTab('rules')}
                                className={`px-4 py-2 rounded text-xs font-black tracking-widest uppercase transition-all ${
                                    activeTab === 'rules'
                                        ? 'bg-[#fbaa19] text-black shadow-[0_0_12px_rgba(251,170,25,0.3)]'
                                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                                }`}
                            >
                                [ REGRAS & DESEMPATE ]
                            </button>
                        </div>

                        {/* Filtros Contextuais (Etapa ou Grupo) */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            {/* Seletor de Rodadas / GP */}
                            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded border border-white/10">
                                <span className="text-[10px] text-white/40 uppercase">ETAPA:</span>
                                <select
                                    value={selectedRound}
                                    onChange={(e) => setSelectedRound(e.target.value)}
                                    className="bg-transparent text-[#fbaa19] font-black uppercase text-xs focus:outline-none cursor-pointer"
                                >
                                    {SEASON_ROUNDS.map(r => (
                                        <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                                            R{r.id} - {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Seletor de Grupo (Apenas para Master League) */}
                            {activeComp === 'master' && (
                                <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded border border-white/10">
                                    <span className="text-[10px] text-white/40 uppercase">LIGA:</span>
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                        className="bg-transparent text-emerald-400 font-black uppercase text-xs focus:outline-none cursor-pointer"
                                    >
                                        {CHAMPION_GROUPS.map(g => (
                                            <option key={g.id} value={g.id} className="bg-neutral-900 text-white">
                                                GRUPO {g.id} - {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. ÁREA CENTRAL DE CONTEÚDO (BASEADO NA ABA ATIVA) */}
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 mt-6 w-full">
                    
                    {/* ===== ABA: CLASSIFICAÇÃO / RANKING ===== */}
                    {activeTab === 'ranking' && (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            
                            {/* Card Hero com Estatísticas da Competição Selecionada */}
                            <div className="bg-black/75 border border-white/10 rounded-lg p-5 backdrop-blur-md">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl">{activeCompData.icon}</span>
                                            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                                                {activeCompData.title} // TABELA DO CAMPEONATO
                                            </h2>
                                        </div>
                                        <p className="text-xs text-white/60 max-w-2xl">
                                            {activeCompData.desc}
                                        </p>
                                    </div>

                                    {/* Call to action de envio de posições */}
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href="/positions"
                                            className="px-4 py-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs tracking-widest uppercase transition-all flex items-center gap-2"
                                        >
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                            <span>LANÇAR ORDENS NO GRID</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* TABELAS ESPECÍFICAS DE CADA COMPETIÇÃO */}

                            {/* 1. POLETIME LEADERBOARD */}
                            {activeComp === 'poletime' && (
                                <div className="bg-black/85 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                                    <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#fbaa19] text-xs font-bold">⏱</span>
                                            <span className="text-xs font-black tracking-widest uppercase text-white">
                                                CLASSIFICAÇÃO ACUMULADA // POLETIME WORLD CHAMPIONSHIP
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-white/40 uppercase">
                                            REGRA DE DESEMPATE: CRONOLOGIA (ANTIGUIDADE DE ENVIO)
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-white/50 border-b border-white/10 uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="py-3 px-4">POS</th>
                                                    <th className="py-3 px-4">ESTRATEGISTA</th>
                                                    <th className="py-3 px-4">ESCUDERIA</th>
                                                    <th className="py-3 px-4 text-center">TEMPO DO PALPITE</th>
                                                    <th className="py-3 px-4 text-center">DISPERSÃO (GAP)</th>
                                                    <th className="py-3 px-4 text-right">SCORE POLE</th>
                                                    <th className="py-3 px-4 text-center">HORA DO ENVIO</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {MOCK_POLETIME_RESULTS.map((row) => (
                                                    <tr key={row.pos} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-3 px-4 font-black">
                                                            <span className={`inline-block w-6 text-center ${
                                                                row.pos === 1 ? 'text-[#fbaa19]' : row.pos <= 3 ? 'text-amber-200' : 'text-white/60'
                                                            }`}>
                                                                #{row.pos}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.teamColor }}></span>
                                                            <span>{row.pilot}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-white/60 uppercase">
                                                            {row.team}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-mono font-bold text-white">
                                                            {row.betTime}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-mono text-[#fbaa19]">
                                                            +{row.gapMs} ms
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-black text-emerald-400">
                                                            {row.points.toLocaleString('pt-BR')} pts
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/40 font-mono text-[11px]">
                                                            {row.timestamp}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 2. MASTER LEAGUE STANDINGS */}
                            {activeComp === 'master' && (
                                <div className="bg-black/85 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                                    <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#fbaa19] text-xs font-bold">🏆</span>
                                            <span className="text-xs font-black tracking-widest uppercase text-white">
                                                GRUPO {selectedGroupId}: {CHAMPION_GROUPS.find(g => g.id === selectedGroupId)?.name} // 22 PILOTOS
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-white/40 uppercase flex items-center gap-2">
                                            <span>DESEMPATE ATIVO:</span>
                                            <span className="text-[#fbaa19] font-bold">1º TOP 10 (+0,1) • 2º QUALIFYING • 3º TIMESTAMP</span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-white/50 border-b border-white/10 uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="py-3 px-4">RANK</th>
                                                    <th className="py-3 px-4">ESTRATEGISTA</th>
                                                    <th className="py-3 px-4">EQUIPE</th>
                                                    <th className="py-3 px-4 text-center">PTS RODADA (FASE 1)</th>
                                                    <th className="py-3 px-4 text-center">ACERTOS TOP 10</th>
                                                    <th className="py-3 px-4 text-center">CRITÉRIO DESEMPATE</th>
                                                    <th className="py-3 px-4 text-right">PTS CAMPEONATO (FASE 2)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {MOCK_MASTER_GROUP_STANDINGS.map((row) => (
                                                    <tr key={row.rank} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-3 px-4 font-black">
                                                            <span className={`inline-block w-6 text-center ${
                                                                row.rank === 1 ? 'text-[#fbaa19]' : row.rank <= 3 ? 'text-amber-200' : 'text-white/60'
                                                            }`}>
                                                                {row.rank}º
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.teamColor }}></span>
                                                            <span>{row.pilot}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-white/60 uppercase">
                                                            {row.team}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-bold text-white">
                                                            {row.racePoints} pts
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/80">
                                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400 font-bold">
                                                                {row.top10Hits} / 10
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-[11px] text-white/50">
                                                            {row.tieBreakerDetail}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-black text-[#fbaa19]">
                                                            {row.annualPoints} pts
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 3. MILESIMUS STANDINGS */}
                            {activeComp === 'milesimus' && (
                                <div className="bg-black/85 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                                    <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#fbaa19] text-xs font-bold">🌐</span>
                                            <span className="text-xs font-black tracking-widest uppercase text-white">
                                                RANKING GERAL ABSOLUTO // MILESIMUS LEAGUE
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-white/40 uppercase">
                                            SOMA GERAL: POLETIME + MASTER + EVO + H2H + PROPS
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-white/50 border-b border-white/10 uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="py-3 px-4">POS</th>
                                                    <th className="py-3 px-4">ESTRATEGISTA</th>
                                                    <th className="py-3 px-4">GRUPO</th>
                                                    <th className="py-3 px-4">EQUIPE</th>
                                                    <th className="py-3 px-4 text-center">POLETIME</th>
                                                    <th className="py-3 px-4 text-center">MASTER</th>
                                                    <th className="py-3 px-4 text-center">EVO</th>
                                                    <th className="py-3 px-4 text-center">H2H</th>
                                                    <th className="py-3 px-4 text-center">PROPS</th>
                                                    <th className="py-3 px-4 text-right">TOTAL BRUTO</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {MOCK_MILESIMUS_OVERALL.map((row) => (
                                                    <tr key={row.rank} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-3 px-4 font-black">
                                                            <span className={`inline-block w-6 text-center ${
                                                                row.rank === 1 ? 'text-[#fbaa19]' : row.rank <= 3 ? 'text-amber-200' : 'text-white/60'
                                                            }`}>
                                                                #{row.rank}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.teamColor }}></span>
                                                            <span>{row.pilot}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-white/50 uppercase text-[11px]">
                                                            {row.group}
                                                        </td>
                                                        <td className="py-3 px-4 text-white/60 uppercase">
                                                            {row.team}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/70 font-mono">
                                                            {row.poletime}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/70 font-mono">
                                                            {row.master}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/70 font-mono">
                                                            {row.evo}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/70 font-mono">
                                                            {row.h2h}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/70 font-mono">
                                                            {row.misc}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-black text-[#fbaa19]">
                                                            {row.total.toLocaleString('pt-BR')} pts
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 4. TEAMWORK STANDINGS */}
                            {activeComp === 'teamwork' && (
                                <div className="bg-black/85 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                                    <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#fbaa19] text-xs font-bold">⚡</span>
                                            <span className="text-xs font-black tracking-widest uppercase text-white">
                                                CAMPEONATO DE CONSTRUTORES & ALIANÇAS DE MOTORES
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-white/40 uppercase">
                                            BLOCO ESTRELA (A) • BLOCO MARANELLO (B) • BLOCO VANGUARDA (C)
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-white/50 border-b border-white/10 uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="py-3 px-4">POS</th>
                                                    <th className="py-3 px-4">ESCUDERIA</th>
                                                    <th className="py-3 px-4">ALIANÇA TÉCNICA</th>
                                                    <th className="py-3 px-4">PILOTOS TITULARES</th>
                                                    <th className="py-3 px-4 text-center">MÉDIA / PILOTO</th>
                                                    <th className="py-3 px-4 text-right">PONTOS TOTAIS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {MOCK_TEAMWORK_STANDINGS.map((row) => (
                                                    <tr key={row.rank} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-3 px-4 font-black">
                                                            <span className={`inline-block w-6 text-center ${
                                                                row.rank === 1 ? 'text-[#fbaa19]' : row.rank <= 3 ? 'text-amber-200' : 'text-white/60'
                                                            }`}>
                                                                {row.rank}º
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }}></span>
                                                            <span>{row.team}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-white/60 uppercase text-[11px]">
                                                            {row.block}
                                                        </td>
                                                        <td className="py-3 px-4 text-white/80 font-bold">
                                                            {row.pilots.join(' & ')}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-white/60 font-mono">
                                                            {row.avgPts.toFixed(1)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-black text-[#fbaa19]">
                                                            {row.totalPts} pts
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* ===== ABA: RESULTADOS DA ETAPA ===== */}
                    {activeTab === 'results' && (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            {/* Card de Informação da Etapa Selecionada */}
                            <div className="bg-black/80 border border-white/10 rounded-lg p-5 backdrop-blur-md">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs px-2 py-0.5 rounded bg-[#fbaa19] text-black font-black uppercase">
                                                ETAPA R{activeRoundData.id}
                                            </span>
                                            <h2 className="text-xl font-black uppercase tracking-wider text-white">
                                                {activeRoundData.name}
                                            </h2>
                                        </div>
                                        <p className="text-xs text-white/60 uppercase tracking-wider">
                                            CIRCUITO: {activeRoundData.track} • POLE POSITION OFICIAL FIA: <strong className="text-[#fbaa19] font-mono">{activeRoundData.poleTime}</strong>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] px-3 py-1.5 rounded font-black tracking-widest uppercase border ${
                                            activeRoundData.status === 'CONCLUÍDO'
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : 'bg-[#fbaa19]/10 border-[#fbaa19]/30 text-[#fbaa19]'
                                        }`}>
                                            STATUS: {activeRoundData.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Comparativo de Resultados da Rodada */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Painel: Top 10 Oficial da Corrida */}
                                <div className="bg-black/85 border border-white/10 rounded-lg p-5">
                                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                                        <span className="text-xs font-black tracking-widest uppercase text-white">
                                            🏁 RESULTADO OFICIAL FIA // {activeRoundData.name}
                                        </span>
                                        <span className="text-[10px] text-white/40 uppercase">AUDITADO</span>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { p: 'P1', pilot: 'M.VERSTAPPEN', team: 'Red Bull', pts: '25 pts', color: '#3671C6' },
                                            { p: 'P2', pilot: 'C.LECLERC', team: 'Ferrari', pts: '18 pts', color: '#DC0000' },
                                            { p: 'P3', pilot: 'L.NORRIS', team: 'McLaren', pts: '15 pts', color: '#FF8000' },
                                            { p: 'P4', pilot: 'O.PIASTRI', team: 'McLaren', pts: '12 pts', color: '#FF8000' },
                                            { p: 'P5', pilot: 'G.RUSSELL', team: 'Mercedes', pts: '10 pts', color: '#00D2BE' },
                                            { p: 'P6', pilot: 'L.HAMILTON', team: 'Ferrari', pts: '8 pts', color: '#DC0000' },
                                            { p: 'P7', pilot: 'C.SAINZ', team: 'Williams', pts: '6 pts', color: '#005AFF' },
                                            { p: 'P8', pilot: 'F.ALONSO', team: 'Aston Martin', pts: '4 pts', color: '#229971' },
                                            { p: 'P9', pilot: 'Y.TSUNODA', team: 'Racing Bulls', pts: '2 pts', color: '#6692FF' },
                                            { p: 'P10', pilot: 'A.ALBON', team: 'Williams', pts: '1 pt', color: '#005AFF' },
                                        ].map((row) => (
                                            <div key={row.p} className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/5 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-[#fbaa19] w-6">{row.p}</span>
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }}></span>
                                                    <span className="font-bold text-white">{row.pilot}</span>
                                                    <span className="text-[10px] text-white/40 uppercase">{row.team}</span>
                                                </div>
                                                <span className="font-mono font-bold text-emerald-400">{row.pts}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Painel: Destaques de Performance dos Estrategistas */}
                                <div className="bg-black/85 border border-white/10 rounded-lg p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                                            <span className="text-xs font-black tracking-widest uppercase text-white">
                                                📊 RADAR DE PRECISÃO // ROUND {activeRoundData.id}
                                            </span>
                                            <span className="text-[10px] text-[#fbaa19] uppercase">TELEMETRIA</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 rounded bg-white/[0.02] border border-white/5">
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                                                    MELHOR PALPITE POLETIME
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-black text-white">L.GUSTAVO</span>
                                                    <span className="text-xs font-mono text-[#fbaa19] font-bold">GAP: +0.003s (4.997 pts)</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded bg-white/[0.02] border border-white/5">
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                                                    MAIOR PONTUAÇÃO MASTER LEAGUE (FASE 1)
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-black text-white">C.LECLERC & L.GUSTAVO</span>
                                                    <span className="text-xs font-mono text-emerald-400 font-bold">68 pts (8 no Top 10)</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded bg-white/[0.02] border border-white/5">
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                                                    EQUIPE DESTAQUE TEAMWORK
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-black text-white">MCLAREN F1 TEAM</span>
                                                    <span className="text-xs font-mono text-[#fbaa19] font-bold">116 pts somados</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                        <Link
                                            href="/positions"
                                            className="inline-block w-full py-3 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-white font-black text-xs tracking-widest uppercase transition-all"
                                        >
                                            [ REVISAR SUAS ORDENS NESTA ETAPA ]
                                        </Link>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ===== ABA: REGRAS & DESEMPATE (O NOVO MANUAL DO ESTRATEGISTA) ===== */}
                    {activeTab === 'rules' && (
                        <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto">
                            
                            {/* Bloco 1: A Regra de Ouro (Deadline) */}
                            <div className="bg-black/85 border border-[#fbaa19]/40 rounded-lg p-6 shadow-[0_0_25px_rgba(251,170,25,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbaa19]/10 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-emerald-400 text-base font-black animate-pulse">●</span>
                                    <span className="text-xs font-black tracking-[0.25em] text-[#fbaa19] uppercase">
                                        REGRA DE OURO // FECHAMENTO DO MERCADO
                                    </span>
                                </div>
                                <h3 className="text-lg md:text-2xl font-black uppercase text-white mb-2">
                                    Prazo Limite Improrrogável: Início do Q1 (Qualifying)
                                </h3>
                                <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                                    O prazo limite para envio, consolidação ou alteração de qualquer ordem na central <strong className="text-white">/positions</strong> é o 
                                    <strong className="text-[#fbaa19]"> exato instante em que as luzes verdes se acendem para o início do Q1 (Sessão de Classificação oficial da FIA)</strong>.
                                    A partir deste momento, o terminal entra no modo <span className="text-amber-300 font-mono">[PREGÃO FECHADO // AUDITORIA]</span> e nenhuma nova aposta é computada.
                                </p>
                            </div>

                            {/* Bloco 2: As 4 Competições e Pontuações */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Poletime */}
                                <div className="bg-black/80 border border-white/10 rounded-lg p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[#fbaa19] text-base font-bold">⏱</span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white">1. POLETIME COMPETITION</h4>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">
                                        Previsão cirúrgica do tempo de volta mais rápida na classificação até os milésimos (ex: <code className="text-white font-mono">1:23.456</code>).
                                    </p>
                                    <div className="bg-white/[0.03] p-3 rounded border border-white/5 text-xs space-y-1.5 font-mono">
                                        <div className="text-emerald-400 font-bold">FÓRMULA: 5.000 - GAP (milissegundos)</div>
                                        <div className="text-white/50 text-[11px]">• Acerto exato (Bullseye): 5.000 pontos integrais.</div>
                                        <div className="text-white/50 text-[11px]">• Dispersão acima de 5.000 ms = 0 pontos (sem pontos negativos).</div>
                                    </div>
                                </div>

                                {/* Master League */}
                                <div className="bg-black/80 border border-white/10 rounded-lg p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[#fbaa19] text-base font-bold">🏆</span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white">2. MASTER LEAGUE (GRID DE 22)</h4>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">
                                        Micro-campeonato disputado estritamente dentro do seu grupo de 22 assentos com duas fases de pontuação:
                                    </p>
                                    <div className="bg-white/[0.03] p-3 rounded border border-white/5 text-xs space-y-1.5 font-mono">
                                        <div className="text-[#fbaa19] font-bold">FASE 1: ACERTOS DE CORRIDA (P1 a P10)</div>
                                        <div className="text-white/50 text-[11px]">Pontuação oficial FIA: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1.</div>
                                        <div className="text-emerald-400 font-bold mt-2">FASE 2: TABELA DO CAMPEONATO ANUAL</div>
                                        <div className="text-white/50 text-[11px]">Os 10 melhores da rodada do grupo recebem: 25 a 1 ponto na tabela geral.</div>
                                    </div>
                                </div>

                                {/* Milesimus League */}
                                <div className="bg-black/80 border border-white/10 rounded-lg p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[#fbaa19] text-base font-bold">🌐</span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white">3. MILESIMUS LEAGUE</h4>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">
                                        O ranking geral supremo e unificado com todos os pilotos do mundo:
                                    </p>
                                    <div className="bg-white/[0.03] p-3 rounded border border-white/5 text-xs space-y-1 font-mono text-white/70">
                                        <div>SOMA TOTAL BRUTA DE:</div>
                                        <div className="text-[#fbaa19]">• Poletime + Master (Fase 1) + Evo + H2H + Props</div>
                                    </div>
                                </div>

                                {/* Teamwork Competition */}
                                <div className="bg-black/80 border border-white/10 rounded-lg p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[#fbaa19] text-base font-bold">⚡</span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white">4. TEAMWORK COMPETITION</h4>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">
                                        A batalha das escuderias e alianças de motores da F1:
                                    </p>
                                    <div className="bg-white/[0.03] p-3 rounded border border-white/5 text-xs space-y-1 font-mono text-white/70">
                                        <div>PONTUAÇÃO DE EQUIPE:</div>
                                        <div className="text-emerald-400">• Soma dos pontos conquistados pelos pilotos da mesma escuderia e bloco.</div>
                                    </div>
                                </div>

                            </div>

                            {/* Bloco 3: CRITÉRIOS DE DESEMPATE OFICIAIS */}
                            <div className="bg-black/90 border border-white/10 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                                    <span className="text-[#fbaa19] font-black">⚖</span>
                                    <h3 className="text-base font-black uppercase tracking-widest text-white">
                                        CRITÉRIOS OFICIAIS DE DESEMPATE
                                    </h3>
                                </div>

                                {/* Critério Geral: Poletime, Milesimus e Teamwork */}
                                <div className="mb-6 p-4 rounded bg-white/[0.02] border border-white/5">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#fbaa19] mb-1">
                                        A. POLETIME, MILESIMUS & TEAMWORK // CRONOLOGIA (ANTIGUIDADE)
                                    </h4>
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        Em caso de empate em pontos, a prioridade absoluta é do estrategista que enviou sua aposta <strong className="text-white">mais cedo</strong>.
                                        <br />
                                        <span className="text-amber-300 font-bold">Aviso sobre edições:</span> Ao atualizar suas posições, o sistema carimba o novo horário da modificação. A data válida para desempate é sempre a do <strong>último registro transmitido</strong>.
                                    </p>
                                </div>

                                {/* Critério Exclusivo: MASTER LEAGUE EM 3 CAMADAS TÁTICAS */}
                                <div className="p-4 rounded bg-gradient-to-b from-black to-[#050401] border border-[#fbaa19]/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs px-2 py-0.5 rounded bg-[#fbaa19] text-black font-black uppercase">EXCLUSIVO</span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                                            B. MASTER LEAGUE // DESEMPATE EM 3 CAMADAS TÁTICAS
                                        </h4>
                                    </div>
                                    <p className="text-xs text-white/70 mb-4">
                                        Para desempatar competidores com a mesma pontuação na Master League, o sistema aplica sucessivamente três camadas de auditoria técnica:
                                    </p>

                                    {/* Visual em 3 Camadas Sucessivas */}
                                    <div className="space-y-3">
                                        
                                        {/* Camada 1 */}
                                        <div className="p-3.5 rounded bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">CAMADA 1</span>
                                                    <span className="text-xs font-black text-white uppercase">Presença de Pilotos no Top 10</span>
                                                </div>
                                                <p className="text-[11px] text-white/60 mt-1">
                                                    Cada piloto que você acertou dentro do Top 10 (mesmo que em posição diferente da cravada) concede <strong className="text-[#fbaa19]">+0,1 décimo de ponto</strong> de desempate.
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-mono font-black text-[#fbaa19] bg-black px-2 py-1 rounded border border-white/10">
                                                    10 ACERTOS = +1,0 PT
                                                </span>
                                            </div>
                                        </div>

                                        {/* Camada 2 */}
                                        <div className="p-3.5 rounded bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">CAMADA 2</span>
                                                    <span className="text-xs font-black text-white uppercase">Espelhamento contra o Treino de Classificação (Qualifying)</span>
                                                </div>
                                                <p className="text-[11px] text-white/60 mt-1">
                                                    Se persistir o empate, sua aposta de corrida é confrontada contra o resultado oficial do Qualifying (grid de largada oficial da FIA), aplicando o mesmo critério de pontuação e os acertos no P10.
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-mono font-black text-amber-300 bg-black px-2 py-1 rounded border border-white/10">
                                                    GRID Q3 OFICIAL
                                                </span>
                                            </div>
                                        </div>

                                        {/* Camada 3 */}
                                        <div className="p-3.5 rounded bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">CAMADA 3</span>
                                                    <span className="text-xs font-black text-white uppercase">Antiguidade do Envio (Timestamp da Ordem)</span>
                                                </div>
                                                <p className="text-[11px] text-white/60 mt-1">
                                                    Se após as duas etapas técnicas os estrategistas permanecerem rigorosamente empatados, a ordem mais antiga (enviada primeiro) vence.
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-mono font-black text-blue-400 bg-black px-2 py-1 rounded border border-white/10">
                                                    TIMESTAMP AUDIT
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}
