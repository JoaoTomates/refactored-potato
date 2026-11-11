"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { F1_TEAMS, TeamData } from '@/lib/teams';
import { TEAM_SPECS } from '@/utils/alliance-data';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getDashboardPath, normalizeAtSlug } from '@/lib/slug';

// Mapeamento Canônico de Campeões para Grupos/Ligas
const CHAMPION_NAMES: Record<number, string> = {
    1: "G. FARINA",
    2: "J. M. FANGIO",
    3: "A. ASCARI",
    4: "M. HAWTHORN",
    5: "J. BRABHAM",
    6: "P. HILL",
    7: "G. HILL",
    8: "J. CLARK",
    9: "J. SURTEES",
    10: "D. HULME",
};

// Alianças Técnicas de Motores (RPG de Facções)
type AllianceBlock = 'ALL' | 'A' | 'B' | 'C';

const ALLIANCE_CONFIG: Record<'A' | 'B' | 'C', {
    name: string;
    badge: string;
    color: string;
    engine: string;
    teams: string[];
}> = {
    A: {
        name: "CONSÓRCIO DA ESTRELA",
        badge: "BLOCO A",
        color: "#00D2BE",
        engine: "Mercedes-AMG V6 Hybrid",
        teams: ["MER", "MCL", "ALP", "WIL"]
    },
    B: {
        name: "A DINASTIA DE MARANELLO",
        badge: "BLOCO B",
        color: "#DC0000",
        engine: "Ferrari 067/3 Hybrid E-Turbo",
        teams: ["FER", "HAA", "CAD"]
    },
    C: {
        name: "A VANGUARDA",
        badge: "BLOCO C",
        color: "#fbaa19",
        engine: "Red Bull Ford / Honda / Audi PU",
        teams: ["RBR", "RBA", "AST", "AUD"]
    }
};

// Golden Rule (Naming): Formata os nomes de pilotos/estrategistas sempre no padrão "L.GUSTAVO"
function formatDriverName(profile: any): string {
    if (!profile) return "VAGA DISPONÍVEL";
    const firstName = profile.first_name ? profile.first_name.trim() : "";
    const lastName = profile.last_name ? profile.last_name.trim() : "";
    
    if (firstName && lastName) {
        const firstInitial = firstName.charAt(0).toUpperCase();
        const cleanLast = lastName.toUpperCase();
        return `${firstInitial}.${cleanLast}`;
    }
    if (firstName) {
        return firstName.toUpperCase();
    }
    if (profile.slug) {
        return profile.slug.replace('@', '').toUpperCase();
    }
    return "ESTRATEGISTA";
}

// Determina o Bloco da equipe a partir de seu código (logo)
function getTeamAlliance(logo: string): 'A' | 'B' | 'C' {
    if (ALLIANCE_CONFIG.A.teams.includes(logo)) return 'A';
    if (ALLIANCE_CONFIG.B.teams.includes(logo)) return 'B';
    return 'C';
}

export default function PitwallPage() {
    const { user } = useSupabaseAuth();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<number>(1);
    const [selectedAlliance, setSelectedAlliance] = useState<AllianceBlock>('ALL');
    const [userSlug, setUserSlug] = useState<string | null>(null);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const { data, error } = await supabase
                    .from('contracts')
                    .select('group_id, team_id, user_id, profiles(slug, first_name, last_name, driver_number)');
                
                if (!error && data) {
                    setContracts(data);
                }
            } catch (err) {
                console.error("Erro ao carregar contratos de Pitwall:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserProfile = async () => {
            if (!user) {
                setUserSlug(null);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('slug, setup_completed')
                .eq('id', user.id)
                .maybeSingle();
            if (data?.slug && data?.setup_completed === true) {
                setUserSlug(normalizeAtSlug(data.slug));
            } else {
                setUserSlug(null);
            }
        };

        fetchContracts();
        fetchUserProfile();
    }, [user]);

    // Identificar grupos únicos existentes ou fallback para Grupo 1
    const groupIds = useMemo(() => {
        const ids = Array.from(new Set(contracts.map(c => c.group_id).filter(Boolean))).sort((a, b) => Number(a) - Number(b));
        if (ids.length === 0) return [1];
        return ids as number[];
    }, [contracts]);

    // Sincronizar selectedGroup com o primeiro disponível se o atual não existir
    useEffect(() => {
        if (!groupIds.includes(selectedGroup) && groupIds.length > 0) {
            setSelectedGroup(groupIds[0]);
        }
    }, [groupIds, selectedGroup]);

    // Filtrar equipes por aliança selecionada
    const filteredTeams = useMemo(() => {
        return F1_TEAMS.filter(team => {
            if (selectedAlliance === 'ALL') return true;
            return getTeamAlliance(team.logo) === selectedAlliance;
        });
    }, [selectedAlliance]);

    // Estatísticas da liga ativa
    const groupContracts = useMemo(() => {
        return contracts.filter(c => Number(c.group_id) === Number(selectedGroup));
    }, [contracts, selectedGroup]);

    const totalSeats = F1_TEAMS.length * 2; // 22 cockpits por liga
    const occupiedSeats = groupContracts.length;
    const vacantSeats = Math.max(0, totalSeats - occupiedSeats);
    const occupancyRate = Math.round((occupiedSeats / totalSeats) * 100);

    // Estatísticas por Bloco
    const allianceStats = useMemo(() => {
        const stats = {
            A: { total: ALLIANCE_CONFIG.A.teams.length * 2, occupied: 0 },
            B: { total: ALLIANCE_CONFIG.B.teams.length * 2, occupied: 0 },
            C: { total: ALLIANCE_CONFIG.C.teams.length * 2, occupied: 0 }
        };

        groupContracts.forEach(c => {
            const team = F1_TEAMS.find(t => t.id === c.team_id);
            if (team) {
                const alliance = getTeamAlliance(team.logo);
                if (stats[alliance]) {
                    stats[alliance].occupied++;
                }
            }
        });

        return stats;
    }, [groupContracts]);

    if (loading) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono text-white">
                <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#fbaa19] text-xs font-bold tracking-[0.25em] uppercase animate-pulse">
                    &gt;_ SINCRONIZANDO MATRIZ DE PITWALL DO GRID...
                </p>
            </main>
        );
    }

    const activeGroupName = CHAMPION_NAMES[selectedGroup] || `GRUPO ${selectedGroup}`;

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white flex flex-col font-mono relative overflow-x-hidden selection:bg-[#fbaa19] selection:text-black">
            
            {/* Background Pixel Art Imersivo com Scanlines Analógicas */}
            <img 
                src="/pixel_setup_bg.png"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none opacity-40"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#050401]/90 via-[#050401]/95 to-[#050401] pointer-events-none"></div>
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }}></div>
            </div>

            {/* CONTEÚDO PRINCIPAL (Z-INDEX 10) */}
            <div className="relative z-10 w-full flex flex-col flex-1">
                
                {/* 1. TOP HEADER OPERACIONAL (CLI CYBERPUNK) */}
                <header className="border-b border-white/10 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-2xl">
                    <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Identificador CLI */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] md:text-xs font-black tracking-[0.25em] text-[#fbaa19] uppercase">
                                    &gt;_ PITWALL GLOBAL // MATRIZ OPERACIONAL DE ASSENTOS & ALIANÇAS
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
                                Central de Telemetria do Grid
                            </h1>
                            <p className="text-[11px] text-white/50 uppercase tracking-widest">
                                Homologação de Contratos & Distribuição de Assentos nas Escuderias da FIA • Temporada 2026
                            </p>
                        </div>

                        {/* Atalhos Rápidos & Telemetria de Sessão */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            {userSlug && (
                                <Link
                                    href={`/${userSlug}`}
                                    className="px-3 py-2 rounded bg-white/5 hover:bg-white/15 border border-white/20 text-white font-bold tracking-widest uppercase transition-all flex items-center gap-1.5"
                                >
                                    <span className="text-[#fbaa19]">«</span> MEU TERMINAL
                                </Link>
                            )}

                            <Link
                                href="/headquarters"
                                className="px-3.5 py-2 rounded bg-[#fbaa19] hover:bg-white text-black font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(251,170,25,0.3)] flex items-center gap-1.5"
                            >
                                <span>RECRUTAMENTO / DRAFT</span>
                                <span>»</span>
                            </Link>
                        </div>
                    </div>

                    {/* STATUS DE PREGÃO & KPIS DE GRID */}
                    <div className="max-w-[1600px] mx-auto mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] md:text-xs uppercase tracking-widest">
                        <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                            <span className="text-white/40 block text-[9px] mb-0.5">Sessão Oficial</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                MERCADO ABERTO
                            </span>
                        </div>

                        <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                            <span className="text-white/40 block text-[9px] mb-0.5">Ocupação do Grid</span>
                            <span className="text-white font-bold tabular-nums">
                                {occupiedSeats} / {totalSeats} <span className="text-[#fbaa19]">({occupancyRate}%)</span>
                            </span>
                        </div>

                        <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                            <span className="text-white/40 block text-[9px] mb-0.5">Cockpits Vagos</span>
                            <span className={vacantSeats > 0 ? "text-amber-400 font-bold tabular-nums" : "text-white/50 font-bold"}>
                                {vacantSeats} {vacantSeats === 1 ? 'ASSENTO DISPONÍVEL' : 'ASSENTOS DISPONÍVEIS'}
                            </span>
                        </div>

                        <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                            <span className="text-white/40 block text-[9px] mb-0.5">Liga Homologada</span>
                            <span className="text-[#fbaa19] font-black truncate block">
                                {activeGroupName}
                            </span>
                        </div>
                    </div>
                </header>

                {/* 2. BARRA DE CONTROLE TÁTICO: FILTROS DE LIGA & ALIANÇAS */}
                <section className="bg-black/60 border-b border-white/10 px-4 sm:px-6 py-4">
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Seletor de Ligas / Grupos de Campeões */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">
                                [ ETAPA 1 ] SELECIONAR LIGA DE CAMPEÕES (DIVISÃO DO GRID):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {groupIds.map(gid => {
                                    const gName = CHAMPION_NAMES[gid] || `GRUPO ${gid}`;
                                    const isSelected = selectedGroup === gid;
                                    return (
                                        <button
                                            key={gid}
                                            type="button"
                                            onClick={() => setSelectedGroup(gid)}
                                            className={`px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                                                isSelected 
                                                    ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_12px_rgba(251,170,25,0.4)]'
                                                    : 'bg-black/50 text-white/70 border-white/15 hover:border-white/40 hover:text-white'
                                            }`}
                                        >
                                            {gName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Filtro por Aliança Técnica (Blocos A, B, C) */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">
                                [ ETAPA 2 ] FILTRO POR ALIANÇA DE MOTORES:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAlliance('ALL')}
                                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                                        selectedAlliance === 'ALL'
                                            ? 'bg-white text-black border-white shadow'
                                            : 'bg-black/50 text-white/60 border-white/15 hover:border-white/40 hover:text-white'
                                    }`}
                                >
                                    TODAS (11 ESCUDERIAS)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAlliance('A')}
                                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                                        selectedAlliance === 'A'
                                            ? 'bg-[#00D2BE] text-black border-[#00D2BE] shadow-[0_0_12px_rgba(0,210,190,0.4)]'
                                            : 'bg-black/50 text-white/60 border-white/15 hover:border-[#00D2BE]/50 hover:text-[#00D2BE]'
                                    }`}
                                >
                                    BLOCO A (MERCEDES)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAlliance('B')}
                                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                                        selectedAlliance === 'B'
                                            ? 'bg-[#DC0000] text-white border-[#DC0000] shadow-[0_0_12px_rgba(220,0,0,0.4)]'
                                            : 'bg-black/50 text-white/60 border-white/15 hover:border-[#DC0000]/50 hover:text-[#DC0000]'
                                    }`}
                                >
                                    BLOCO B (FERRARI)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAlliance('C')}
                                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                                        selectedAlliance === 'C'
                                            ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_12px_rgba(251,170,25,0.4)]'
                                            : 'bg-black/50 text-white/60 border-white/15 hover:border-[#fbaa19]/50 hover:text-[#fbaa19]'
                                    }`}
                                >
                                    BLOCO C (VANGUARDA)
                                </button>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 3. RADAR DE FORÇA DAS ALIANÇAS (ALLIANCE POWER BARS) */}
                <section className="px-4 sm:px-6 py-4 max-w-[1600px] mx-auto w-full">
                    <div className="bg-black/70 border border-white/10 rounded-sm p-3 sm:p-4 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                        
                        {/* Bloco A */}
                        <div className="flex flex-col gap-1.5 p-2 rounded bg-white/[0.02] border border-[#00D2BE]/20">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-[#00D2BE] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#00D2BE]"></span>
                                    BLOCO A: ESTRELA (MERCEDES PU)
                                </span>
                                <span className="text-white/70 tabular-nums">
                                    {allianceStats.A.occupied} / {allianceStats.A.total}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-[#00D2BE] transition-all duration-500"
                                    style={{ width: `${(allianceStats.A.occupied / allianceStats.A.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Bloco B */}
                        <div className="flex flex-col gap-1.5 p-2 rounded bg-white/[0.02] border border-[#DC0000]/20">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-[#DC0000] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#DC0000]"></span>
                                    BLOCO B: MARANELLO (FERRARI PU)
                                </span>
                                <span className="text-white/70 tabular-nums">
                                    {allianceStats.B.occupied} / {allianceStats.B.total}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-[#DC0000] transition-all duration-500"
                                    style={{ width: `${(allianceStats.B.occupied / allianceStats.B.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Bloco C */}
                        <div className="flex flex-col gap-1.5 p-2 rounded bg-white/[0.02] border border-[#fbaa19]/20">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-[#fbaa19] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#fbaa19]"></span>
                                    BLOCO C: A VANGUARDA (PU REBELDE)
                                </span>
                                <span className="text-white/70 tabular-nums">
                                    {allianceStats.C.occupied} / {allianceStats.C.total}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-[#fbaa19] transition-all duration-500"
                                    style={{ width: `${(allianceStats.C.occupied / allianceStats.C.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 4. GRID DE GARAGENS & COCKPITS DO PITWALL */}
                <section className="px-4 sm:px-6 pb-16 max-w-[1600px] mx-auto w-full flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTeams.map((team: TeamData) => {
                            const alliance = getTeamAlliance(team.logo);
                            const allianceInfo = ALLIANCE_CONFIG[alliance];
                            const spec = TEAM_SPECS[team.logo] || { engineSpec: allianceInfo.engine };

                            // Obter pilotos contratados para esta equipe nesta liga
                            const teamContracts = contracts.filter(c => c.team_id === team.id && Number(c.group_id) === Number(selectedGroup));
                            
                            // Monta exatamente 2 assentos
                            const seats = [
                                teamContracts[0]?.profiles || null,
                                teamContracts[1]?.profiles || null
                            ];

                            const occupiedCount = seats.filter(Boolean).length;
                            const isFullyOccupied = occupiedCount === 2;

                            return (
                                <div 
                                    key={team.id}
                                    className="bg-black/85 backdrop-blur-md border border-white/10 rounded-sm overflow-hidden flex flex-col shadow-2xl hover:border-white/25 transition-all duration-300 relative group"
                                >
                                    {/* Faixa decorativa superior com a cor oficial da equipe */}
                                    <div 
                                        className="h-1.5 w-full shrink-0" 
                                        style={{ backgroundColor: team.color }}
                                    ></div>

                                    {/* Cabeçalho da Garagem */}
                                    <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-white/[0.02]">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span 
                                                    className="text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase tracking-widest border"
                                                    style={{ 
                                                        borderColor: `${allianceInfo.color}50`, 
                                                        color: allianceInfo.color,
                                                        backgroundColor: `${allianceInfo.color}15`
                                                    }}
                                                >
                                                    {allianceInfo.badge}
                                                </span>
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                                                    GARAGEM OFICIAL
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }}></span>
                                                {team.name}
                                            </h3>
                                            <p className="text-[10px] text-white/50 truncate max-w-[200px] mt-0.5" title={spec.engineSpec}>
                                                {spec.engineSpec}
                                            </p>
                                        </div>

                                        {/* Sigla da Equipe & Status de Ocupação */}
                                        <div className="flex flex-col items-end">
                                            <span 
                                                className="text-2xl font-black font-mono tracking-tighter"
                                                style={{ color: team.color }}
                                            >
                                                {team.logo}
                                            </span>
                                            <span className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 px-1.5 py-0.5 rounded-xs ${
                                                isFullyOccupied 
                                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' 
                                                    : 'bg-amber-950/40 text-amber-400 border border-amber-500/30 animate-pulse'
                                            }`}>
                                                {isFullyOccupied ? '2/2 OCUPADO' : `${occupiedCount}/2 VAGAS`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Os 2 Assentos do Cockpit */}
                                    <div className="flex flex-col divide-y divide-white/5 flex-1">
                                        {seats.map((driver, seatIdx) => {
                                            const isOccupied = !!driver;
                                            const driverFormattedName = formatDriverName(driver);
                                            const driverNumber = driver?.driver_number ? String(driver.driver_number).padStart(2, '0') : '--';

                                            return (
                                                <div 
                                                    key={seatIdx}
                                                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                                                >
                                                    {/* Indicador de Assento e Nome */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-sm bg-black/80 border border-white/10 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-white/60">
                                                                #{seatIdx + 1}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-emerald-400' : 'bg-amber-400/80 animate-ping'}`}></span>
                                                                <span className="text-[9px] uppercase tracking-widest text-white/40">
                                                                    {isOccupied ? 'HOMOLOGADO' : 'ASSENTO LIVRE'}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate font-mono">
                                                                {driverFormattedName}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Número e Botão de Ação */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isOccupied ? (
                                                            <>
                                                                <span className="text-[10px] font-bold text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                                                                    #{driverNumber}
                                                                </span>
                                                                {driver?.slug ? (
                                                                    <Link
                                                                        href={getDashboardPath(driver.slug)}
                                                                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-white/10 hover:bg-[#fbaa19] text-white hover:text-black border border-white/20 hover:border-[#fbaa19] transition-all font-mono"
                                                                        title={`Acessar telemetria de ${driverFormattedName}`}
                                                                    >
                                                                        TELEMETRIA »
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-[10px] text-white/30 uppercase font-mono">
                                                                        ATIVO
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Link
                                                                href="/headquarters"
                                                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-[#fbaa19]/20 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black border border-[#fbaa19]/40 hover:border-[#fbaa19] transition-all font-mono"
                                                            >
                                                                ASSUMIR »
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Rodapé do Card com Perfil da Aliança */}
                                    <div className="px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] text-white/40 flex items-center justify-between">
                                        <span className="truncate">MOTORES: {allianceInfo.engine}</span>
                                        <span className="text-[#fbaa19] font-bold">FIA 2026</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 5. RODAPÉ DE SISTEMA (NARRATIVA NOIR) */}
                <footer className="border-t border-white/10 bg-black/90 p-6 text-center text-xs text-white/40 uppercase tracking-widest mt-auto">
                    <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[#fbaa19] font-bold">&gt;_</span>
                            <span>BAEFF1 PITWALL PROTOCOL // CENTRAL OFICIAL DE TELEMETRIA</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px]">
                            <span>ENCRYPTION: AES-256</span>
                            <span>SERVIDORES: FIA-GENEVA</span>
                            <span className="text-emerald-400">STATUS: CONEXÃO SEGURA</span>
                        </div>
                    </div>
                </footer>

            </div>
        </main>
    );
}
