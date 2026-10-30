"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { F1_TEAMS } from '@/lib/teams';
import { getChampionGroupName } from '@/lib/champions';
import Settings from "@/components/settings";
import SetupForm from "@/components/setup-form";
import Calendar from "@/components/calendar";
import ReportForm from "@/components/report-form";
import SillySeason from "@/components/silly-season";
import { nextRaceStart, isRaceWeek } from '@/lib/race';
import RaceWeekSchedule from '@/components/race-week-schedule';
import { formatMls } from '@/lib/mls';
import { 
    TeamworkSquad, 
    getStrategistSquad, 
    createTeamworkSquad, 
    joinTeamworkSquad, 
    leaveTeamworkSquad 
} from '@/lib/teamwork';
import {
    SeniorStrategist, 
    getSeniorStrategistById, 
    getSeniorStrategistForRound, 
    getStrategistVoice, 
    AllianceBlock 
} from '@/lib/race-directors';
import { 
    Radio, 
    TrendingUp, 
    BookOpen, 
    Users, 
    Calendar as CalendarIcon, 
    Settings as SettingsIcon, 
    FileText, 
    LogOut, 
    Check, 
    Copy,
    Clock
} from 'lucide-react';

/* ============================================================
 * NEW CONCEPT // DYNAMIC MINIMALIST DASHBOARD (/nc/[driver_slug])
 * Exemplo: /nc/@lgustavo88, /nc/@mrossi46, etc.
 * ============================================================ */

const ALLIANCES = {
    A: { id: 'A', name: 'CONSÓRCIO DA ESTRELA', short: 'ESTRELA', codes: ['MER', 'MCL', 'ALP', 'WIL'] },
    B: { id: 'B', name: 'DINASTIA DE MARANELLO', short: 'MARANELLO', codes: ['FER', 'HAA', 'CAD'] },
    C: { id: 'C', name: 'A VANGUARDA', short: 'VANGUARDA', codes: ['RBR', 'RBA', 'AST', 'AUD'] },
} as const;
type AllianceId = keyof typeof ALLIANCES;

const allianceForCode = (code?: string): AllianceId =>
    (Object.keys(ALLIANCES) as AllianceId[]).find(k => (ALLIANCES[k].codes as readonly string[]).includes(code || '')) || 'A';

interface Strategist {
    id: string;
    slug: string | null;
    name: string;
    teamCode: string;
    teamName: string;
    teamColor: string;
    groupId: number;
    series: number[];
    isDemo?: boolean;
    mlsBalance?: number;
    driverNumber?: number;
    nationality?: string;
}

type MinimalTab = 'telemetry' | 'book' | 'radio' | 'teamwork';

const fmt = (v: number | undefined | null) => {
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
        return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0,00';
};

/* ---------- Gráfico Minimalista de Cotação ---------- */
function MinimalChart({ data, teamColor = '#fbaa19' }: { data: number[]; teamColor?: string }) {
    if (!data || data.length < 2) {
        return (
            <div className="w-full h-40 flex items-center justify-center text-xs text-white/30 font-mono">
                &gt;_ CARREGANDO SÉRIE DE COTAÇÃO...
            </div>
        );
    }

    const min = Math.min(...data), max = Math.max(...data);
    const isBaseline = min === max;
    const pad = isBaseline ? Math.max(10, min * 0.1) : (max - min) * 0.12 || 1;
    const lo = min - pad, hi = max + pad;
    const W = 600, H = 160;
    const x = (i: number) => (i / (data.length - 1)) * W;
    const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;

    return (
        <div className="relative w-full h-40 select-none overflow-hidden">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="ncAreaGradUser" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={teamColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={teamColor} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="0" x2={W} y1={H * 0.5} y2={H * 0.5} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
                <path d={area} fill="url(#ncAreaGradUser)" />
                <path d={line} fill="none" stroke={teamColor} strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] bg-black/80 px-2 py-0.5 border border-white/10 rounded-xs">
                <span className="text-white/40">STATUS:</span>
                <span className="text-white font-bold">{fmt(data[data.length - 1])} MLS</span>
                {isBaseline && <span className="text-emerald-400 font-bold">● ABERTURA ESTÁVEL</span>}
            </div>
            <div className="absolute right-2 top-2 text-[9px] text-white/30 tabular-nums">
                MÁX: {fmt(hi)} · MÍN: {fmt(lo)}
            </div>
        </div>
    );
}

export default function DynamicMinimalistDashboard() {
    const router = useRouter();
    const params = useParams();
    const { user, isLoading: authLoading, logout } = useSupabaseAuth();

    // Extrai o slug da URL (ex: @lgustavo88 ou lgustavo88)
    const rawSlug = (params?.driver_slug as string) || '';
    const decodedSlug = rawSlug ? decodeURIComponent(rawSlug) : '';
    const targetSlug = decodedSlug.startsWith('@') ? decodedSlug : (decodedSlug ? `@${decodedSlug}` : '');

    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState<Strategist | null>(null);
    const [field, setField] = useState<Strategist[]>([]);
    const [activeTab, setActiveTab] = useState<MinimalTab>('telemetry');
    const [userPrediction, setUserPrediction] = useState<any>(null);
    const [teamPartner, setTeamPartner] = useState<{ name: string; slug: string | null } | null>(null);
    const [squad, setSquad] = useState<TeamworkSquad | null>(null);
    const [assignedMentor, setAssignedMentor] = useState<SeniorStrategist | null>(null);
    const [activeView, setActiveView] = useState<"menu" | "settings" | "setup" | "calendar" | "report" | "silly_season">("menu");

    // Form inputs de Teamwork
    const [squadNameInput, setSquadNameInput] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [squadActionLoading, setSquadActionLoading] = useState(false);
    const [squadActionMsg, setSquadActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    // Contagem regressiva
    const [now, setNow] = useState<Date>(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const countdownStr = useMemo(() => {
        const target = nextRaceStart(now);
        const diff = Math.max(0, target.getTime() - now.getTime());
        const d = Math.floor(diff / 86400000);
        const h = Math.floor(diff / 3600000) % 24;
        const m = Math.floor(diff / 60000) % 60;
        const s = Math.floor(diff / 1000) % 60;
        return `${String(d).padStart(2, '0')}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, [now]);

    useEffect(() => {
        if (authLoading) return;

        const loadPilotDashboard = async () => {
            try {
                // 1. Identifica o perfil correspondente ao slug informado na rota
                let profile: any = null;
                if (targetSlug) {
                    const clean = targetSlug.replace('@', '');
                    const { data: pBySlug } = await supabase
                        .from('profiles')
                        .select('*')
                        .or(`slug.eq.${targetSlug},slug.eq.${clean},slug.ilike.${targetSlug},slug.ilike.${clean}`)
                        .maybeSingle();
                    profile = pBySlug;
                }

                if (!profile && user) {
                    const { data: pUser } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();
                    profile = pUser;
                }

                if (!profile) {
                    const { data: pFallback } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('slug', '@lgustavo88')
                        .maybeSingle();
                    profile = pFallback;
                }

                // 2. Carrega todos os contratos do grid oficial
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select('user_id, group_id, team_id, created_at, profiles(slug, first_name, last_name, driver_number, mls_balance, nationality)');

                const strategists: Strategist[] = (contracts || []).map((c: any) => {
                    const p = Array.isArray(c.profiles) ? c.profiles[0] || {} : c.profiles || {};
                    const initial = p.first_name ? p.first_name.trim().charAt(0).toUpperCase() : '';
                    const last = (p.last_name || '').trim().toUpperCase().replace(/\s+/g, '');
                    const num = p.driver_number ? String(p.driver_number) : '';
                    const codeName = initial && last ? `${initial}.${last}${num}` : 'ESTRATEGISTA';
                    const team = F1_TEAMS.find(t => t.id === c.team_id || t.logo === c.team_id) || F1_TEAMS[0];
                    const balance = typeof p.mls_balance === 'number' ? p.mls_balance : 100;

                    return {
                        id: c.user_id,
                        slug: p.slug || null,
                        name: codeName,
                        teamCode: team.logo,
                        teamName: team.name,
                        teamColor: team.color,
                        groupId: c.group_id || 1,
                        series: Array(24).fill(balance),
                        mlsBalance: balance,
                        driverNumber: p.driver_number || 88,
                        nationality: p.nationality || 'BR'
                    };
                });

                setField(strategists);

                // 3. Define o estrategista ativo
                const myContract = (contracts || []).find((c: any) => c.user_id === profile?.id);
                const activeStrategist = strategists.find(s => s.id === profile?.id) || strategists[0] || null;
                setMe(activeStrategist);

                // 4. Carrega Mentor, Previsões e Esquadrão
                if (profile?.senior_strategist_id) {
                    setAssignedMentor(getSeniorStrategistById(profile.senior_strategist_id) || getSeniorStrategistForRound(19));
                } else {
                    setAssignedMentor(getSeniorStrategistForRound(19));
                }

                if (activeStrategist) {
                    const { data: predData } = await supabase
                        .from('predictions')
                        .select('*')
                        .eq('user_id', activeStrategist.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    setUserPrediction(predData || null);

                    const squadData = await getStrategistSquad(activeStrategist.id);
                    setSquad(squadData);

                    const partner = (contracts || []).find((c: any) => 
                        c.team_id === (myContract?.team_id || activeStrategist.teamCode) && 
                        c.group_id === (myContract?.group_id || activeStrategist.groupId) && 
                        c.user_id !== activeStrategist.id
                    );
                    if (partner) {
                        const pp = Array.isArray(partner.profiles) ? partner.profiles[0] || {} : partner.profiles || {};
                        const pName = pp.first_name ? `${pp.first_name.charAt(0).toUpperCase()}.${(pp.last_name || '').toUpperCase()}` : 'COMPANHEIRO';
                        setTeamPartner({ name: pName, slug: pp.slug || null });
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar Minimalist Dashboard Dinâmico:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPilotDashboard();
    }, [authLoading, user, targetSlug]);

    const teamColor = me?.teamColor || '#fbaa19';
    const allianceId = allianceForCode(me?.teamCode);

    const mentorVoice = useMemo(() => {
        if (!assignedMentor) return null;
        return getStrategistVoice(assignedMentor, allianceId as AllianceBlock, me?.nationality, me?.name);
    }, [assignedMentor, allianceId, me]);

    const allianceIdx = useMemo(() => (Object.keys(ALLIANCES) as AllianceId[]).map(k => {
        const teamCodes = ALLIANCES[k].codes as readonly string[];
        const members = field.filter(s => teamCodes.includes(s.teamCode));
        const total = members.reduce((acc, s) => acc + (s.mlsBalance ?? 100), 0);
        return { k, name: ALLIANCES[k].short, total, count: members.length };
    }), [field]);

    const groupRanking = useMemo(() => {
        if (!me) return [];
        return field
            .filter(s => s.groupId === me.groupId)
            .sort((a, b) => (b.mlsBalance ?? 100) - (a.mlsBalance ?? 100));
    }, [field, me]);

    const handleCreateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!me) return;
        setSquadActionLoading(true);
        setSquadActionMsg(null);
        const res = await createTeamworkSquad(me.id, squadNameInput);
        setSquadActionLoading(false);
        if (res.success && res.squad) {
            setSquad(res.squad);
            setSquadNameInput('');
            setSquadActionMsg({ type: 'success', text: `Esquadrão ${res.squad.name} fundado!` });
        } else {
            setSquadActionMsg({ type: 'error', text: res.error || 'Erro ao fundar esquadrão.' });
        }
    };

    const handleJoinSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!me) return;
        setSquadActionLoading(true);
        setSquadActionMsg(null);
        const res = await joinTeamworkSquad(me.id, inviteCodeInput);
        setSquadActionLoading(false);
        if (res.success && res.squad) {
            setSquad(res.squad);
            setInviteCodeInput('');
            setSquadActionMsg({ type: 'success', text: `Integrado ao esquadrão ${res.squad.name}!` });
        } else {
            setSquadActionMsg({ type: 'error', text: res.error || 'Código inválido.' });
        }
    };

    const handleLeaveSquad = async () => {
        if (!me) return;
        if (!confirm('Deseja realmente sair do esquadrão?')) return;
        setSquadActionLoading(true);
        const res = await leaveTeamworkSquad(me.id);
        setSquadActionLoading(false);
        if (res.success) {
            setSquad(null);
            setSquadActionMsg({ type: 'success', text: 'Você saiu do esquadrão.' });
        }
    };

    const handleLogout = async () => {
        try {
            if (logout) await logout();
            window.location.href = '/';
        } catch (_) {
            await supabase.auth.signOut();
            window.location.href = '/';
        }
    };

    if (loading || !me) {
        return (
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono gap-3">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: teamColor, borderTopColor: 'transparent' }} />
                <p className="text-[11px] font-bold tracking-widest uppercase text-white/50 animate-pulse">
                    CONECTANDO AO COCKPIT MINIMALISTA {targetSlug.toUpperCase()}...
                </p>
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative pb-16 overflow-x-hidden selection:bg-[#fbaa19] selection:text-black">
            {/* Background Minimalista */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[160px] opacity-10" style={{ backgroundColor: teamColor }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">
                
                {/* 1. TOP BAR UNIFICADA */}
                <header className="bg-black/85 border border-white/10 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                    
                    {/* Identidade do Piloto */}
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-black tracking-wider text-white">
                                    {me.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold uppercase" style={{ backgroundColor: `${teamColor}20`, color: teamColor }}>
                                    {me.teamCode}
                                </span>
                                <span className="text-[10px] text-white/40 font-bold">
                                    #{me.driverNumber}
                                </span>
                                {me.slug && (
                                    <span className="text-[10px] text-[#fbaa19] font-mono tracking-wider">
                                        {me.slug}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-white/40 tracking-widest uppercase">
                                {getChampionGroupName(me.groupId)} · {ALLIANCES[allianceId].short}
                            </p>
                        </div>
                    </div>

                    {/* Métrica Chave: Saldo MLS */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <span className="text-[9px] text-white/40 block tracking-widest uppercase">SALDO MILESIMUS</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-white font-mono">
                                    {formatMls(me.mlsBalance ?? 100)}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase">MLS</span>
                            </div>
                        </div>
                    </div>

                    {/* Contagem Regressiva */}
                    <div className="hidden md:flex items-center gap-2 text-right">
                        <Clock className="w-4 h-4 text-white/40" />
                        <div>
                            <span className="text-[9px] text-white/40 block tracking-widest uppercase">PRÓXIMO GP</span>
                            <span className="text-xs font-bold text-white font-mono tracking-wider">{countdownStr}</span>
                        </div>
                    </div>

                    {/* Operações */}
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setActiveView(activeView === 'setup' ? 'menu' : 'setup')}
                            className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white transition-colors"
                            title="Setup do Monoposto"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setActiveView(activeView === 'calendar' ? 'menu' : 'calendar')}
                            className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white transition-colors"
                            title="Calendário da Temporada"
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setActiveView(activeView === 'settings' ? 'menu' : 'settings')}
                            className="p-2 border border-white/10 hover:border-white text-white/60 hover:text-white transition-colors"
                            title="Configurações da Superlicença"
                        >
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-2 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/40 transition-colors ml-1"
                            title="Desconectar do Pitwall"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* SUBTELAS OPERACIONAIS */}
                {activeView === 'setup' && (
                    <div className="bg-black/90 border border-white/20 p-6 rounded-sm animate-fade-in relative">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-xs font-bold tracking-widest text-[#fbaa19] uppercase">&gt;_ SETUP TÉCNICO BAEFF1</span>
                            <button onClick={() => setActiveView('menu')} className="text-xs text-white/50 hover:text-white">[FECHAR]</button>
                        </div>
                        <SetupForm />
                    </div>
                )}

                {activeView === 'calendar' && (
                    <div className="bg-black/90 border border-white/20 p-6 rounded-sm animate-fade-in relative">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-xs font-bold tracking-widest text-[#fbaa19] uppercase">&gt;_ CALENDÁRIO OFICIAL 2026</span>
                            <button onClick={() => setActiveView('menu')} className="text-xs text-white/50 hover:text-white">[FECHAR]</button>
                        </div>
                        <Calendar />
                    </div>
                )}

                {activeView === 'settings' && (
                    <div className="bg-black/90 border border-white/20 p-6 rounded-sm animate-fade-in relative">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-xs font-bold tracking-widest text-[#fbaa19] uppercase">&gt;_ CONFIGURAÇÕES DO PILOTO</span>
                            <button onClick={() => setActiveView('menu')} className="text-xs text-white/50 hover:text-white">[FECHAR]</button>
                        </div>
                        <Settings />
                    </div>
                )}

                {/* 2. GRID PRINCIPAL (2 COLUNAS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* COLUNA ESQUERDA (8 COLS): COCKPIT MULTIFUNCIONAL */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        
                        {/* CRONOGRAMA OFICIAL DE RACE WEEK (RENDERIZADO EM SEMANA DE CORRIDA) */}
                        {isRaceWeek() && (
                            <RaceWeekSchedule compact={true} accentColor={teamColor} />
                        )}

                        {/* SELETOR DE ABAS */}
                        <div className="flex border-b border-white/10 gap-2 bg-black/60 p-1.5 rounded-sm overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('telemetry')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${activeTab === 'telemetry' ? 'bg-white/10 text-white border-b-2' : 'text-white/40 hover:text-white'}`}
                                style={{ borderBottomColor: activeTab === 'telemetry' ? teamColor : 'transparent', color: activeTab === 'telemetry' ? teamColor : undefined }}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>COTAÇÃO & TELEMETRIA</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('book')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${activeTab === 'book' ? 'bg-white/10 text-white border-b-2' : 'text-white/40 hover:text-white'}`}
                                style={{ borderBottomColor: activeTab === 'book' ? teamColor : 'transparent', color: activeTab === 'book' ? teamColor : undefined }}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>PROGNÓSTICOS (BOOK)</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('radio')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${activeTab === 'radio' ? 'bg-white/10 text-white border-b-2' : 'text-white/40 hover:text-white'}`}
                                style={{ borderBottomColor: activeTab === 'radio' ? teamColor : 'transparent', color: activeTab === 'radio' ? teamColor : undefined }}
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>RÁDIO SÊNIOR</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('teamwork')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${activeTab === 'teamwork' ? 'bg-white/10 text-white border-b-2' : 'text-white/40 hover:text-white'}`}
                                style={{ borderBottomColor: activeTab === 'teamwork' ? teamColor : 'transparent', color: activeTab === 'teamwork' ? teamColor : undefined }}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>TEAMWORK</span>
                            </button>
                        </div>

                        {/* CONTEÚDO DA ABA */}
                        <div className="bg-black/75 border border-white/10 p-5 rounded-sm flex flex-col gap-4">
                            
                            {/* ABA 1: COTAÇÃO E TELEMETRIA */}
                            {activeTab === 'telemetry' && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-white/50">CURVA DE VALORAÇÃO BAEFF1</span>
                                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                                RATING AAA
                                            </span>
                                        </div>
                                        <span className="text-white/40 text-[10px]">BASE OFICIAL DE ABERTURA</span>
                                    </div>

                                    <MinimalChart data={me.series} teamColor={teamColor} />

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
                                        <div className="p-2.5 bg-white/[0.02] border border-white/5">
                                            <span className="text-[9px] text-white/40 uppercase block">Cotação Atual</span>
                                            <span className="text-sm font-bold text-white font-mono">{fmt(me.mlsBalance ?? 100)} MLS</span>
                                        </div>
                                        <div className="p-2.5 bg-white/[0.02] border border-white/5">
                                            <span className="text-[9px] text-white/40 uppercase block">Variação GP</span>
                                            <span className="text-sm font-bold text-white/50 font-mono">● 0,00%</span>
                                        </div>
                                        <div className="p-2.5 bg-white/[0.02] border border-white/5">
                                            <span className="text-[9px] text-white/40 uppercase block">Parceiro de Equipe</span>
                                            <span className="text-sm font-bold text-white truncate block">
                                                {teamPartner ? teamPartner.name : 'Vaga Aberta'}
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-white/[0.02] border border-white/5">
                                            <span className="text-[9px] text-white/40 uppercase block">Aliança Tática</span>
                                            <span className="text-sm font-bold text-[#fbaa19] truncate block">
                                                {ALLIANCES[allianceId].short}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: BOOK DE PROGNÓSTICOS */}
                            {activeTab === 'book' && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-bold tracking-widest uppercase text-white/60">
                                            STATUS DOS MERCADOS PARA A PRÓXIMA ETAPA
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5">
                                            JANELA ABERTA
                                        </span>
                                    </div>

                                    {/* Poletime */}
                                    <div className="p-3.5 bg-white/[0.02] border border-white/10 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-white/40 font-bold tracking-wider uppercase block">POLETIME (QUALIFY)</span>
                                            <span className="text-lg font-black text-white font-mono">
                                                {userPrediction?.poletime || '--:--.---'}
                                            </span>
                                            <span className="text-[10px] text-white/40 block mt-0.5">
                                                {userPrediction ? 'Homologado na Direção de Prova' : 'Nenhum tempo enviado ainda'}
                                            </span>
                                        </div>
                                        <Link 
                                            href="/next-race"
                                            className="px-3 py-1.5 bg-[#fbaa19] hover:bg-[#e59914] text-black text-xs font-black uppercase tracking-wider transition-colors"
                                        >
                                            {userPrediction ? 'ATUALIZAR »' : 'ENVIAR »'}
                                        </Link>
                                    </div>

                                    {/* Master */}
                                    <div className="p-3.5 bg-white/[0.02] border border-white/10 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-white/40 font-bold tracking-wider uppercase block">MASTER (TOP 10 FINISH)</span>
                                            <span className="text-lg font-black text-white font-mono">
                                                {Array.isArray(userPrediction?.top10) ? `${userPrediction.top10.length}/10 PILOTOS` : '0/10 PILOTOS'}
                                            </span>
                                            <span className="text-[10px] text-white/40 block mt-0.5">
                                                {Array.isArray(userPrediction?.top10) && userPrediction.top10.length > 0 ? 'Ordem de pontuação registrada' : 'Grid em aberto'}
                                            </span>
                                        </div>
                                        <Link 
                                            href="/next-race"
                                            className="px-3 py-1.5 border border-white/20 hover:border-white text-white text-xs font-black uppercase tracking-wider transition-colors"
                                        >
                                            EDITAR »
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: RÁDIO DO ESTRATEGISTA SÊNIOR */}
                            {activeTab === 'radio' && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                            <span className="text-xs font-bold tracking-widest uppercase text-white/80">
                                                CANAL CRIPTOGRAFADO // {assignedMentor?.name.toUpperCase() || 'ESTRATEGISTA SÊNIOR'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-white/40 uppercase font-mono">
                                            {assignedMentor?.experienceYears} ANOS DE GRID
                                        </span>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-blue-950/20 to-transparent border-l-2 border-blue-400 text-xs sm:text-sm italic text-white/90 leading-relaxed font-sans">
                                        “{mentorVoice?.message || 'Aguardando telemetria dos treinos livres.'}”
                                    </div>

                                    {mentorVoice?.tacticalObjective && (
                                        <div className="text-[11px] text-blue-300/80 bg-blue-950/30 border border-blue-500/20 p-3 rounded-xs">
                                            <strong className="text-blue-300 uppercase tracking-widest">Alvo Tático:</strong> {mentorVoice.tacticalObjective}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ABA 4: TEAMWORK */}
                            {activeTab === 'teamwork' && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <div>
                                            <span className="text-xs font-bold tracking-widest uppercase text-white/80">
                                                COMPETIÇÃO DE ESQUADRÕES (TEAMWORK)
                                            </span>
                                            <p className="text-[10px] text-white/40 mt-0.5">
                                                Grupos de até 20 estrategistas pontuando juntos por média de MLS
                                            </p>
                                        </div>
                                        {squad && (
                                            <button 
                                                onClick={handleLeaveSquad}
                                                disabled={squadActionLoading}
                                                className="text-[10px] text-red-400 hover:underline uppercase"
                                            >
                                                Sair do Time
                                            </button>
                                        )}
                                    </div>

                                    {squadActionMsg && (
                                        <div className={`p-2.5 text-xs font-bold border ${squadActionMsg.type === 'success' ? 'bg-green-950/40 border-green-500/40 text-emerald-400' : 'bg-red-950/40 border-red-500/40 text-red-400'}`}>
                                            {squadActionMsg.text}
                                        </div>
                                    )}

                                    {squad ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="p-3 bg-white/[0.02] border border-white/10 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-white/40 uppercase block">Esquadrão Ativo</span>
                                                    <span className="text-base font-black text-white">{squad.name}</span>
                                                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                                                        Média: {squad.formattedAverage} MLS · {squad.memberCount}/20 Membros
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (squad.inviteCode && navigator.clipboard) {
                                                            navigator.clipboard.writeText(squad.inviteCode);
                                                            setCopiedCode(true);
                                                            setTimeout(() => setCopiedCode(false), 2000);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold uppercase transition-colors"
                                                >
                                                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    <span>{squad.inviteCode}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <form onSubmit={handleCreateSquad} className="p-3 bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                                <span className="text-[10px] font-bold uppercase text-white/60">Fundar Novo Time</span>
                                                <input 
                                                    type="text" 
                                                    placeholder="Nome do Esquadrão"
                                                    value={squadNameInput}
                                                    onChange={e => setSquadNameInput(e.target.value)}
                                                    required
                                                    className="bg-black border border-white/20 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fbaa19]"
                                                />
                                                <button type="submit" disabled={squadActionLoading} className="py-2 bg-[#fbaa19] text-black text-xs font-black uppercase hover:bg-yellow-500 transition-colors">
                                                    Criar Time
                                                </button>
                                            </form>

                                            <form onSubmit={handleJoinSquad} className="p-3 bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                                                <span className="text-[10px] font-bold uppercase text-white/60">Entrar com Código</span>
                                                <input 
                                                    type="text" 
                                                    placeholder="Código de Convite (ex: BF-APEX)"
                                                    value={inviteCodeInput}
                                                    onChange={e => setInviteCodeInput(e.target.value)}
                                                    required
                                                    className="bg-black border border-white/20 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fbaa19]"
                                                />
                                                <button type="submit" disabled={squadActionLoading} className="py-2 border border-white/20 hover:border-white text-white text-xs font-black uppercase transition-colors">
                                                    Ingressar
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* COLUNA DIREITA (4 COLS): MONITOR DO GRID & ALIANÇAS */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        
                        {/* 1. Ranking do Grupo */}
                        <div className="bg-black/75 border border-white/10 p-4 rounded-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#fbaa19]">
                                    RANKING · {getChampionGroupName(me.groupId)}
                                </span>
                                <span className="text-[9px] text-white/40 uppercase font-mono">
                                    {groupRanking.length} PILOTOS
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                                {groupRanking.map((p, i) => {
                                    const isMe = p.id === me.id;
                                    const pilotUrl = p.slug ? `/nc/${p.slug}` : `/nc/@${p.name.toLowerCase()}`;
                                    return (
                                        <Link 
                                            key={p.id}
                                            href={pilotUrl}
                                            className={`flex items-center justify-between p-2 rounded-xs text-xs transition-colors ${isMe ? 'bg-white/10 border-l-2' : 'hover:bg-white/5'}`}
                                            style={{ borderLeftColor: isMe ? teamColor : undefined }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] text-white/40 w-4 font-mono">{i + 1}</span>
                                                <span className="w-1.5 h-3 rounded-full shrink-0" style={{ backgroundColor: p.teamColor }} />
                                                <div className="min-w-0">
                                                    <span className={`font-bold truncate block ${isMe ? 'text-white' : 'text-white/80'}`}>
                                                        {p.name} {isMe && '(VOCÊ)'}
                                                    </span>
                                                    <span className="text-[9px] text-white/40 uppercase">{p.teamCode}</span>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-white tabular-nums shrink-0">
                                                {formatMls(p.mlsBalance ?? 100)}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Índices das Alianças BAEFF1 */}
                        <div className="bg-black/75 border border-white/10 p-4 rounded-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                                    CONSÓRCIOS & ALIANÇAS
                                </span>
                                <span className="text-[9px] text-emerald-400 uppercase font-bold">ESTÁVEL</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {allianceIdx.map(a => {
                                    const isMyAlliance = a.k === allianceId;
                                    return (
                                        <div 
                                            key={a.k}
                                            className={`p-2.5 rounded-xs border text-xs flex items-center justify-between transition-colors ${isMyAlliance ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5'}`}
                                        >
                                            <div>
                                                <span className="text-[9px] text-white/40 uppercase block">ALIANÇA {a.k}</span>
                                                <span className={`font-bold block ${isMyAlliance ? 'text-[#fbaa19]' : 'text-white'}`}>
                                                    {a.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-white font-mono">{fmt(a.total)}</span>
                                                <span className="text-[9px] text-white/40 block">MLS TOTAL ({a.count} PILOTOS)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <footer className="border-t border-white/10 pt-4 flex flex-wrap justify-between items-center text-[10px] text-white/30 tracking-widest uppercase">
                    <span>BAEFF1 PITWALL // MINIMAL CONCEPT [NC]</span>
                    <span>COCKPIT DO ESTRATEGISTA {me.name} ({me.slug})</span>
                </footer>

            </div>
        </main>
    );
}
