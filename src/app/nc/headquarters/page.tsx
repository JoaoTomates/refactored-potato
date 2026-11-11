"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, TEAM_SPECS, TeamOffer } from '@/utils/alliance-data';
import { getSystemBoxStyle } from '@/components/system-modal';
import { LogOut, ArrowRight, ShieldCheck, Check } from 'lucide-react';

function MinimalHeadquartersFlow() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();

    const [loadingData, setLoadingData] = useState(true);
    const [signingId, setSigningId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const [activeAllianceKey, setActiveAllianceKey] = useState<'A' | 'B' | 'C'>('B');
    const [activeGroupName, setActiveGroupName] = useState<string>("Grupo 1");
    const [offeredTeams, setOfferedTeams] = useState<TeamOffer[]>([]);

    useEffect(() => {
        const initHQ = async () => {
            if (authLoading) return;

            if (!user) {
                setLoadingData(false);
                return;
            }

            try {
                // 1. Verifica se já assinou contrato anteriormente
                const { data: contract } = await supabase
                    .from('contracts')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (contract) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('slug')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profile?.slug) {
                        const target = profile.slug.startsWith('@') ? profile.slug : `@${profile.slug}`;
                        window.location.replace(`/nc/${target}`);
                        return;
                    }
                }

                // 2. Recupera a aliança técnica
                let alliancePref = user.user_metadata?.alliance_id as ('A' | 'B' | 'C' | undefined);
                if (!alliancePref || !['A', 'B', 'C'].includes(alliancePref)) {
                    alliancePref = (localStorage.getItem('draft_alliance') as ('A' | 'B' | 'C')) || 'B';
                }
                setActiveAllianceKey(alliancePref);
                const currentFaction = ENGINE_FACTIONS[alliancePref] || ENGINE_FACTIONS['B'];

                // 3. Busca equipes da aliança
                const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
                if (teamsError) throw teamsError;

                const factionCodes = currentFaction.teams;
                const factionTeamObjs = (teamsData || []).filter((t: any) => factionCodes.includes(t.code));

                // 4. Busca grupos e contratos para mapear vagas reais (< 2 vagas)
                const { data: availableGroups } = await supabase
                    .from('groups')
                    .select('id, name, is_filling')
                    .order('id', { ascending: true })
                    .limit(50);

                const { data: allContracts } = await supabase
                    .from('contracts')
                    .select('group_id, team_id');

                const countsByGroupTeam: Record<string, number> = {};
                (allContracts || []).forEach((c: any) => {
                    const key = `${c.group_id}_${c.team_id}`;
                    countsByGroupTeam[key] = (countsByGroupTeam[key] || 0) + 1;
                });

                // Encontra o primeiro grupo que possui vagas reais (< 2) para a aliança selecionada
                let selectedGroup = (availableGroups || []).find(g => g.is_filling) || availableGroups?.[0] || { id: 1, name: 'G. Farina' };
                let candidateOpenOffers: TeamOffer[] = [];

                const groupsToScan = availableGroups && availableGroups.length > 0 ? availableGroups : [selectedGroup];
                for (const grp of groupsToScan) {
                    const offersForGrp: TeamOffer[] = factionTeamObjs.map((t: any) => {
                        const spec = TEAM_SPECS[t.code] || {
                            engineSpec: currentFaction.engineSpec,
                            perk: currentFaction.fantasyPerk,
                            description: `Garagem oficial da aliança ${currentFaction.badge}.`,
                            seatTitle: `ESTRATEGISTA CHEFE ${t.name.toUpperCase()}`
                        };
                        const key = `${grp.id}_${t.id}`;
                        const occupied = countsByGroupTeam[key] || 0;
                        const gName = grp.name ? `Grupo ${grp.id} (${grp.name})` : `Grupo ${grp.id}`;
                        return {
                            id: t.id,
                            name: t.name,
                            code: t.code,
                            color: t.color || '#000000',
                            occupied: occupied,
                            engineSpec: spec.engineSpec,
                            perk: spec.perk,
                            description: spec.description,
                            seatTitle: spec.seatTitle,
                            groupName: gName,
                            groupId: grp.id
                        };
                    });

                    const openOnly = offersForGrp.filter(o => o.occupied < 2);
                    if (openOnly.length > 0) {
                        selectedGroup = grp;
                        candidateOpenOffers = openOnly;
                        break;
                    }
                }

                // Fallback dinâmico se todos estiverem cheios
                if (candidateOpenOffers.length === 0) {
                    const nextGroupId = (availableGroups?.[availableGroups.length - 1]?.id || 1) + 1;
                    selectedGroup = { id: nextGroupId, name: `Grupo ${nextGroupId}` };
                    candidateOpenOffers = factionTeamObjs.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        code: t.code,
                        color: t.color || '#000000',
                        occupied: 0,
                        engineSpec: currentFaction.engineSpec,
                        perk: currentFaction.fantasyPerk,
                        description: `Garagem oficial da aliança ${currentFaction.badge}.`,
                        seatTitle: `ESTRATEGISTA CHEFE ${t.name.toUpperCase()}`,
                        groupName: `Grupo ${nextGroupId}`,
                        groupId: nextGroupId
                    }));
                }

                const gName = selectedGroup.name ? `Grupo ${selectedGroup.id} (${selectedGroup.name})` : `Grupo ${selectedGroup.id}`;
                setActiveGroupName(gName);

                // Seleciona até duas propostas com vagas reais abertas (< 2)
                const shuffled = [...candidateOpenOffers].sort(() => 0.5 - Math.random());
                const twoProposals = shuffled.slice(0, 2);
                setOfferedTeams(twoProposals);

            } catch (err: any) {
                console.error(err);
                setErrorMsg(err.message || "Falha ao carregar garagens disponíveis.");
            } finally {
                setLoadingData(false);
            }
        };

        initHQ();
    }, [user, authLoading]);

    const handleSignContract = async (team: TeamOffer) => {
        if (!user) return;
        setSigningId(team.id);
        setErrorMsg('');

        try {
            // 1. Assina contrato via RPC
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: team.id });
            if (rpcError) throw rpcError;

            // 2. Atualiza perfil
            await supabase.from('profiles').update({
                setup_completed: true,
                org_color: team.color
            }).eq('id', user.id);

            // 3. Obtém slug e redireciona para a central minimalista /nc/@slug
            const { data: profile } = await supabase
                .from('profiles')
                .select('slug')
                .eq('id', user.id)
                .single();

            const targetSlug = profile?.slug || 'dashboard';
            const cleanTarget = targetSlug.startsWith('@') ? targetSlug : `@${targetSlug}`;
            window.location.replace(`/nc/${cleanTarget}`);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Falha na homologação do contrato.');
            setSigningId(null);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (_) {}
        window.location.href = '/superlicense?force=login';
    };

    if (authLoading || loadingData) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono text-white p-4">
                <div className="w-8 h-8 border-2 border-[#fbaa19] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs text-[#fbaa19] uppercase tracking-widest animate-pulse">
                    &gt;_ SINCRONIZANDO VAGAS COM A BAEFF1...
                </p>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="w-full min-h-screen bg-[#050401] text-white font-mono flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded p-6 flex flex-col gap-4 text-center">
                    <span className="text-xs text-red-400 font-bold uppercase tracking-widest">
                        ● SESSÃO NÃO IDENTIFICADA
                    </span>
                    <p className="text-xs text-white/60 leading-relaxed">
                        Faça login ou registre sua Superlicença para visualizar as vagas disponíveis da sua aliança técnica.
                    </p>
                    <div className="flex gap-2 pt-2">
                        <Link
                            href="/nc/invite"
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded uppercase tracking-wider"
                        >
                            Criar Conta
                        </Link>
                        <Link
                            href="/superlicense"
                            className="flex-1 bg-[#fbaa19] hover:bg-white text-black text-xs font-black py-2.5 rounded uppercase tracking-wider"
                        >
                            Fazer Login
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const faction = ENGINE_FACTIONS[activeAllianceKey] || ENGINE_FACTIONS['B'];

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono flex flex-col justify-between p-4 sm:p-8 selection:bg-[#fbaa19] selection:text-black">
            
            {/* Header Minimalista com Logout */}
            <header className="w-full max-w-4xl mx-auto flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black tracking-widest text-[#fbaa19]">
                        NC // HEADQUARTERS
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:inline">
                        • {activeGroupName}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/50 text-[11px] truncate max-w-[180px] hidden sm:inline">
                        {user.email}
                    </span>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair / Trocar Conta</span>
                    </button>
                </div>
            </header>

            {/* Conteúdo Central */}
            <div className="w-full max-w-4xl mx-auto my-auto py-8 flex flex-col gap-8">
                
                {/* Despacho Executivo */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/30">
                            [{faction.badge}]
                        </span>
                        <span className="text-xs text-white/60 font-bold uppercase tracking-wider">
                            {faction.title} • {faction.engineSpec}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                        Garagens Oficiais Disponíveis
                    </h1>
                    <p className="text-xs text-white/50 max-w-2xl leading-relaxed">
                        Selecione a sua escuderia no grid para a temporada 2026. A alocação garante seu assento no pitwall dentro do {activeGroupName} sob homologação da BAEFF1.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider">
                        [ERRO] {errorMsg}
                    </div>
                )}

                {/* Grid de Ofertas de Equipes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {offeredTeams.map((team) => {
                        const openSeats = Math.max(0, 2 - team.occupied);
                        const isSigning = signingId === team.id;

                        return (
                            <div
                                key={team.id}
                                className={`border border-[#000000] rounded-[3px] p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all font-mono ${
                                    isSigning ? 'ring-1 ring-[#fbaa19]' : ''
                                }`}
                                style={getSystemBoxStyle(isSigning ? '#fbaa19' : team.color)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-[3px] border border-[#000000] flex items-center justify-center font-black text-sm text-white"
                                            style={{ backgroundColor: team.color }}
                                        >
                                            {team.code}
                                        </div>
                                        <div>
                                            <h2 className="text-[calc(1rem+0.5px)] font-black text-white uppercase tracking-wider">
                                                {team.name}
                                            </h2>
                                            <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                                {team.seatTitle}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#030303] text-emerald-400 border border-[#000000]">
                                        {openSeats} {openSeats === 1 ? 'VAGA ABERTA' : 'VAGAS ABERTAS'}
                                    </span>
                                </div>

                                <p className="text-[calc(0.75rem+0.5px)] text-white/75 italic leading-relaxed border-l-2 pl-3" style={{ borderColor: team.color }}>
                                    "{team.description}"
                                </p>

                                <div className="p-3 bg-[#030303] border border-[#000000] rounded-[3px] text-[11px] flex flex-col gap-1.5">
                                    <div className="flex justify-between text-white/50">
                                        <span>Motor / UP</span>
                                        <span className="text-white font-bold">{team.engineSpec}</span>
                                    </div>
                                    <div className="flex justify-between text-white/50">
                                        <span>Benefício Fantasy</span>
                                        <span className="text-[#fbaa19] font-bold text-right max-w-[200px] truncate">{team.perk}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleSignContract(team)}
                                    disabled={isSigning || openSeats <= 0}
                                    className={`w-full py-3 px-4 rounded-[3px] border border-[#000000] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                        openSeats <= 0 
                                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                            : isSigning
                                            ? 'bg-[#fbaa19] text-black animate-pulse'
                                            : 'bg-white text-black hover:bg-[#fbaa19]'
                                    }`}
                                >
                                    {isSigning ? (
                                        <span>HOMOLOGANDO CONTRATO...</span>
                                    ) : openSeats <= 0 ? (
                                        <span>SEM VAGAS</span>
                                    ) : (
                                        <>
                                            <span>ASSINAR COM A {team.name.toUpperCase()}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Footer Minimalista */}
            <footer className="w-full max-w-4xl mx-auto flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-white/40 uppercase tracking-widest">
                <span>BAEFF1 QUARTEL-GENERAL • TEMPORADA 2026</span>
                <span>PADRÃO MINIMALISTA // NC</span>
            </footer>

        </main>
    );
}

export default function NewConceptHeadquartersPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-[#050401] flex items-center justify-center font-mono text-white text-xs">
                CARREGANDO...
            </div>
        }>
            <MinimalHeadquartersFlow />
        </Suspense>
    );
}
