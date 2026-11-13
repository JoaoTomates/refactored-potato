"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, TEAM_SPECS, TeamOffer } from '@/utils/alliance-data';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { clearCachedStrategistSession, getDashboardPath, normalizeAtSlug } from '@/lib/slug';
import { DialogueBox, retroSound } from '@/components/dialogue-box';
import { getSystemBoxStyle } from '@/components/system-modal';
import { HEADQUARTERS_DIALOG_TEXT } from '@/data/dialogues';
import {
    CrewRolesConfig,
    DEFAULT_CREW_ROLES_CONFIG,
    fetchCrewRolesConfig,
    resolveCrewCharacterById,
} from '@/lib/crew-config';

const AGENT_AVATAR_URL = 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/ex_drivers/avatar_driver_1.jpg';

function HeadquartersFlow() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [loadingData, setLoadingData] = useState(true);
    const [signingId, setSigningId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [typingDone, setTypingDone] = useState(false);

    const [activeAllianceKey, setActiveAllianceKey] = useState<'A' | 'B' | 'C'>('B');
    const [activeGroupName, setActiveGroupName] = useState<string>("Grupo 1");
    const [offeredTeams, setOfferedTeams] = useState<TeamOffer[]>([]);
    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);

    useEffect(() => {
        fetchCrewRolesConfig().then((cfg) => setCrewConfig(cfg));
    }, []);

    useEffect(() => {
        const initHQ = async () => {
            if (authLoading) return;
            
            if (!user) {
                setLoadingData(false);
                return;
            }

            try {
                retroSound.init();

                // 1. Verifica se já assinou contrato anteriormente
                const { data: contract } = await supabase
                    .from('contracts')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (contract) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('slug, setup_completed')
                        .eq('id', user.id)
                        .maybeSingle();

                    // Só redireciona se o contrato existe E o setup foi devidamente concluído
                    if (profile?.slug && profile?.setup_completed === true) {
                        const redirectKey = 'redirect_hq_guard';
                        const count = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
                        if (count > 2) {
                            console.warn('[BAEFF1 Guard] Loop detectado em headquarters. Redirecionamento interrompido.');
                        } else {
                            sessionStorage.setItem(redirectKey, String(count + 1));
                            const target = (profile.slug.startsWith('@') ? profile.slug : `@${profile.slug}`).toLowerCase();
                            router.replace(`/${target}`);
                            return;
                        }
                    } else {
                        sessionStorage.removeItem('redirect_hq_guard');
                    }
                }

                // 2. Recupera a aliança escolhida pelo usuário
                let alliancePref = user.user_metadata?.alliance_id as ('A' | 'B' | 'C' | undefined);
                if (!alliancePref || !['A', 'B', 'C'].includes(alliancePref)) {
                    alliancePref = (localStorage.getItem('draft_alliance') as ('A' | 'B' | 'C')) || 'B';
                }
                setActiveAllianceKey(alliancePref);
                const currentFaction = ENGINE_FACTIONS[alliancePref] || ENGINE_FACTIONS['B'];

                // 3. Busca equipes cadastradas no banco
                const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
                if (teamsError) throw teamsError;

                const factionCodes = currentFaction.teams;
                const factionTeamObjs = (teamsData || []).filter((t: any) => factionCodes.includes(t.code));

                // 4. Busca grupos e contratos para mapear a ocupação real (< 2 vagas)
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

                // Fallback dinâmico se todos estiverem ocupados
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

                // Seleciona exatamente duas propostas com vagas reais abertas (< 2)
                const shuffled = [...candidateOpenOffers].sort(() => 0.5 - Math.random());
                const twoProposals = shuffled.slice(0, 2);
                setOfferedTeams(twoProposals);

            } catch (err: any) {
                console.error(err);
                setErrorMsg(err.message || "FALHA AO CARREGAR VAGAS DO GRID");
            } finally {
                setLoadingData(false);
            }
        };

        initHQ();
    }, [user, authLoading]);

    const handleSignContract = async (team: TeamOffer) => {
        if (!user) return;
        retroSound.init();
        setSigningId(team.id);
        setErrorMsg('');

        try {
            // 1. Assina o contrato oficial na equipe via RPC
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: team.id });
            if (rpcError) throw rpcError;

            // 2. Atualiza o perfil do estrategista
            await supabase.from('profiles').update({ 
                setup_completed: true,
                org_color: team.color 
            }).eq('id', user.id);

            // 3. Obtém o slug e redireciona para o pitwall do piloto
            const { data: profile } = await supabase
                .from('profiles')
                .select('slug')
                .eq('id', user.id)
                .single();

            const normalizedSlug = normalizeAtSlug(profile?.slug);
            if (typeof window !== 'undefined') {
                if (normalizedSlug) localStorage.setItem('vg_user_slug', normalizedSlug);
                else localStorage.removeItem('vg_user_slug');
            }
            router.replace(getDashboardPath(normalizedSlug, '/headquarters'));

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "FALHA NA HOMOLOGAÇÃO DO CONTRATO.");
            setSigningId(null);
        }
    };

    const handleSignOut = async () => {
        clearCachedStrategistSession();
        try {
            await supabase.auth.signOut();
        } catch (_) {}
        window.location.href = '/superlicense?force=login';
    };

    if (authLoading || loadingData) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative">
                <div 
                    className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden"
                    style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
                >
                    <img
                        src="/pixel_invite_bg_v2.jpg"
                        alt=""
                        className="w-full h-full object-cover object-center opacity-60 md:opacity-80"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>
                <div
                    className="relative z-10 flex flex-col items-center gap-4 p-8 border border-[#000000] rounded-[3px]"
                    style={getSystemBoxStyle('#fbaa19')}
                >
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-[calc(0.75rem+0.5px)] animate-pulse">
                        &gt;_ SINCRONIZANDO TELEMETRIA COM A BASE DE DADOS DA BAEFF1...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative p-4">
                <div 
                    className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden"
                    style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
                >
                    <img
                        src="/pixel_invite_bg_v2.jpg"
                        alt=""
                        className="w-full h-full object-cover object-center opacity-60 md:opacity-80"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>
                <div
                    className="relative z-10 w-full max-w-xl border border-[#000000] rounded-[3px] p-6 md:p-8 flex flex-col gap-6"
                    style={getSystemBoxStyle('#ef4444')}
                >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-red-400 text-xs font-bold tracking-[0.2em] uppercase">
                            &gt;_ [ACESSO RESTRITO // CREDENCIAL NÃO VERIFICADA]
                        </span>
                        <span className="text-red-500 text-[10px] font-bold tracking-widest uppercase border border-[#000000] px-2 py-0.5 rounded-[3px] bg-red-950/30">
                            ● NÃO AUTORIZADO
                        </span>
                    </div>

                    <p className="text-gray-300 text-[calc(0.875rem+0.5px)] leading-relaxed">
                        Não detectamos uma sessão ativa de Superlicença. Para acessar as vagas exclusivas da sua aliança, realize o login com suas credenciais ou crie seu registro de primeiro dia.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs p-3.5 rounded-[3px] border border-[#000000] hover:bg-white transition-colors text-center cursor-pointer"
                        >
                            [ RETORNAR AO INÍCIO ]
                        </button>
                        <button
                            onClick={() => window.location.href = '/superlicense'}
                            className="flex-1 bg-white/10 text-white font-bold uppercase tracking-widest text-xs p-3.5 rounded-[3px] hover:bg-white/20 border border-[#000000] transition-colors text-center cursor-pointer"
                        >
                            [ LOGIN / ENTRAR ]
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const faction = ENGINE_FACTIONS[activeAllianceKey] || ENGINE_FACTIONS['B'];

    const isMainGroup = activeGroupName.includes('1');
    const cleanFarinaName = activeGroupName.replace(/^Grupo\s+1\s*\((.*?)\)$/, '$1') || 'G. Farina';
    const groupLabel = isMainGroup 
        ? `O grupo principal (${cleanFarinaName})`
        : `O ${activeGroupName}`;

    const teamsLabel = offeredTeams.length >= 2 
        ? `${offeredTeams[0].name} e ${offeredTeams[1].name}`
        : (offeredTeams[0]?.name || 'nossas escuderias');

    const agentSpeech = `Identificação confirmada. Seu canal foi homologado.

${groupLabel} precisa de estrategistas para ${teamsLabel}. Lembrando: ao final da temporada haverá um grande novo recrutamento feito pelas principais equipes e grupos do paddock.

O que essas equipes esperam de você:
1. Termine entre os 10 primeiros colocados no seu grupo Master e a renovação de contrato estará garantida;
2. Uma participação consistente em Poletime e Milesimus — traga recursos;
3. Monte um time (Teamwork) de bons estrategistas e melhore seu desempenho.`;

    const resolvedAgent = resolveCrewCharacterById(crewConfig.slots.headquartersAgentId, crewConfig);
    const agentSpeaker = resolvedAgent?.code || 'AGENTE';
    const agentAvatarUrl = resolvedAgent?.avatarUrl || AGENT_AVATAR_URL;
    const agentRoleTag = resolvedAgent?.role || 'HEADQUARTERS // CONTRATOS';

    return (
        <main className="w-full min-h-dvh relative bg-[#050401] overflow-x-clip select-none flex flex-col font-mono items-center pb-12 sm:pb-16">
            
            {/* Background com arte em pixel art do Quartel-General - Viewport Estável sem expansão */}
            <div
                className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden"
                style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
            >
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="w-full h-full object-cover object-center opacity-60 md:opacity-80"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col gap-4 mt-4 sm:mt-6 px-4">
                
                {/* Header do Terminal: Discurso do Agente com as Instruções */}
                <DialogueBox
                    speaker={agentSpeaker}
                    characterId={crewConfig.slots.headquartersAgentId}
                    badgeTitle={`[${faction.badge}] ${faction.title}`}
                    categoryTag={agentRoleTag}
                    avatarUrl={agentAvatarUrl}
                    accentColor="#fbaa19"
                    text={agentSpeech}
                    startDelay={100}
                    speed={18}
                    compact
                    minHeightClass="min-h-[130px] md:min-h-[110px]"
                    onReadyForNext={() => setTypingDone(true)}
                    animateEntrance
                />

                {errorMsg && (
                    <div className="bg-red-900/40 border border-red-500/50 p-3 rounded text-red-500 font-bold uppercase tracking-widest text-xs animate-fade-in">
                        [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                    </div>
                )}

                {/* Propostas Oficiais de Equipes em Badges Compactos Interativos (Mesmo padrão sólido do box text) */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 transition-opacity duration-700 ${typingDone ? 'opacity-100' : 'opacity-90'}`}>
                    {offeredTeams.map((teamOffer) => {
                        const availableSpots = Math.max(0, 2 - teamOffer.occupied);
                        const isSigning = signingId === teamOffer.id;

                        return (
                            <button
                                key={teamOffer.id}
                                onClick={() => availableSpots > 0 && !isSigning && handleSignContract(teamOffer)}
                                disabled={isSigning || availableSpots <= 0}
                                className={`relative w-full text-left border border-[#000000] rounded-[3px] p-3.5 sm:p-4 transition-all cursor-pointer group flex flex-col justify-between gap-2.5 overflow-hidden font-mono ${
                                    isSigning 
                                        ? 'ring-1 ring-[#fbaa19]' 
                                        : 'hover:brightness-110'
                                } ${availableSpots <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                                style={getSystemBoxStyle(isSigning ? '#fbaa19' : teamOffer.color)}
                            >
                                {/* Topo: Emblema, Nome e Vagas */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div 
                                            className="w-10 h-10 rounded-[3px] flex items-center justify-center font-black text-sm border border-[#000000] text-white shrink-0"
                                            style={{ backgroundColor: teamOffer.color }}
                                        >
                                            {teamOffer.code}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white text-[calc(0.875rem+0.5px)] font-black uppercase tracking-wider group-hover:text-[#fbaa19] transition-colors truncate">
                                                {teamOffer.name}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">
                                                {teamOffer.seatTitle}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-[#030303] border border-[#000000] px-2 py-0.5 rounded-[3px] shrink-0">
                                        {availableSpots} {availableSpots === 1 ? 'VAGA' : 'VAGAS'}
                                    </span>
                                </div>

                                {/* Dossiê tático da garagem resumido */}
                                <p className="text-[calc(0.6875rem+0.5px)] text-gray-300 italic border-l-2 pl-2.5 leading-snug line-clamp-2" style={{ borderColor: teamOffer.color }}>
                                    "{teamOffer.description}"
                                </p>

                                {/* Unidade de Potência */}
                                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between pt-2 border-t border-white/10">
                                    <span className="uppercase text-gray-500">UNIDADE DE POTÊNCIA:</span>
                                    <span className="text-amber-400 font-bold truncate max-w-[200px]">{teamOffer.engineSpec}</span>
                                </div>

                                {/* Barra de Confirmação Integrada ao Badge */}
                                <div 
                                    className="w-full py-2.5 px-3 rounded-[3px] text-[11px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-1.5 border border-[#000000] mt-0.5"
                                    style={{
                                        backgroundColor: isSigning ? '#fbaa19' : `${teamOffer.color}18`,
                                        color: isSigning ? '#000' : '#fff'
                                    }}
                                >
                                    {isSigning ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                            <span>HOMOLOGANDO CONTRATO...</span>
                                        </>
                                    ) : availableSpots <= 0 ? (
                                        <span className="text-gray-500">[ GARAGEM COMPLETA ]</span>
                                    ) : (
                                        <>
                                            <span className="group-hover:text-[#fbaa19] transition-colors">CONFIRMAR ASSENTO COM A {teamOffer.name.toUpperCase()}</span>
                                            <span className="text-[#fbaa19]">»</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Rodapé institucional */}
                <div className="text-center text-[11px] text-gray-400 tracking-widest uppercase border-t border-white/10 pt-4 flex flex-col gap-1 font-mono">
                    <p>&gt;_ CONTRATO VINCULANTE TEMPORADA 2026 • HOMOLOGAÇÃO SOB DIRETRIZES DA BAEFF1</p>
                    <p className="text-[10px] text-gray-400">Após a confirmação, o assento é reservado e intransferível até a janela de Silly Season.</p>
                </div>

            </div>
        </main>
    );
}

export default function HeadquartersPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-[#050401] flex items-center justify-center font-mono text-[#fbaa19]">
                &gt;_ CARREGANDO QUARTEL-GENERAL...
            </div>
        }>
            <HeadquartersFlow />
        </Suspense>
    );
}
