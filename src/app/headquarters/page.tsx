"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, TEAM_SPECS, TeamOffer } from '@/utils/alliance-data';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';

// --- PitWall Sound Engine ---
class PitWallSoundEngine {
    ctx: AudioContext | null = null;
    enabled: boolean = true;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playKeyClick(char = 'a') {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const code = char.charCodeAt(0) || 65;
            const freq = 380 + (code % 28) * 14;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.028);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch (_) { }
    }
}

const retroSound = new PitWallSoundEngine();

function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 150 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);

    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;

        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);

                if (char !== ' ' && char !== '\n') {
                    retroSound.playKeyClick(char);
                }

                i++;

                let delay = (25 + Math.random() * 15);
                if (char === '.' || char === '!' || char === '?') delay = 280;
                else if (char === ',' || char === '\n' || char === ':') delay = 140;

                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 600);
                }
            }
        };

        timeoutId = setTimeout(typeNext, startDelay);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay]);

    return (
        <span className="opacity-90 leading-relaxed relative whitespace-pre-wrap">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

function HeadquartersFlow() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [loadingData, setLoadingData] = useState(true);
    const [signingId, setSigningId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [typingDone, setTypingDone] = useState(false);

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
                            sessionStorage.removeItem(redirectKey);
                        } else {
                            sessionStorage.setItem(redirectKey, String(count + 1));
                            const target = profile.slug.startsWith('@') ? profile.slug : `@${profile.slug}`;
                            window.location.replace(`/${target}`);
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

            const targetSlug = profile?.slug || 'dashboard';
            const cleanTarget = targetSlug.startsWith('@') ? targetSlug : `@${targetSlug}`;
            window.location.replace(`/${cleanTarget}`);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "FALHA NA HOMOLOGAÇÃO DO CONTRATO.");
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
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative">
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="fixed inset-0 w-full h-full object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div className="relative z-10 flex flex-col items-center gap-4 bg-black/80 p-8 border border-[#fbaa19]/30 rounded-lg">
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">
                        &gt;_ SINCRONIZANDO TELEMETRIA COM A BASE DE DADOS DA BAEFF1...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative p-4">
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="fixed inset-0 w-full h-full object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div className="relative z-10 w-full max-w-xl bg-black/85 backdrop-blur-sm border border-red-500/40 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-red-400 text-xs font-bold tracking-[0.2em] uppercase">
                            &gt;_ [ACESSO RESTRITO // CREDENCIAL NÃO VERIFICADA]
                        </span>
                        <span className="text-red-500 text-[10px] font-bold tracking-widest uppercase border border-red-500/30 px-2 py-0.5 rounded bg-red-950/30">
                            ● NÃO AUTORIZADO
                        </span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed">
                        Não detectamos uma sessão ativa de Superlicença. Para acessar as vagas exclusivas da sua aliança, realize o login com suas credenciais ou crie seu registro de primeiro dia.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs p-3.5 rounded hover:bg-white transition-colors text-center cursor-pointer"
                        >
                            [ RETORNAR AO INÍCIO ]
                        </button>
                        <button
                            onClick={() => window.location.href = '/superlicense'}
                            className="flex-1 bg-white/10 text-white font-bold uppercase tracking-widest text-xs p-3.5 rounded hover:bg-white/20 border border-white/20 transition-colors text-center cursor-pointer"
                        >
                            [ LOGIN / ENTRAR ]
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const faction = ENGINE_FACTIONS[activeAllianceKey] || ENGINE_FACTIONS['B'];

    const agentSpeech = `Identificação confirmada. Seus canais estão criptografados e homologados na base da BAEFF1. Temos garagens oficiais com vagas abertas na nossa aliança dentro do ${activeGroupName}.\n\nAntes de assinar, preste atenção no que a diretoria exige de você nesta temporada:\n1. MÁXIMA PRECISÃO NO FORMULÁRIO TOP 10 FINISH: Leitura cirúrgica de ritmo de corrida, desgaste de pneus e previsão de pitstops em cada GP;\n2. CLASSIFICAÇÃO DE ELITE NA COMPETIÇÃO MILÉSIMUS: Cravar a volta mais rápida da Pole Position nos treinos classificatórios até a casa dos milésimos de segundo;\n3. LIDERANÇA ABSOLUTA NO MUNDIAL DE MOTORES: Somar pontos em todas as etapas para colocar nossa aliança técnica no topo do campeonato mundial de construtores.\n\nAnalise as propostas oficiais abaixo com vagas disponíveis e assine seu contrato de pitwall.`;

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center pb-24">
            
            {/* Background com arte em pixel art do Quartel-General - Viewport Estável sem expansão */}
            <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden">
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="w-full h-full object-cover object-center opacity-60 md:opacity-80"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6 mt-8 md:mt-12 px-4">
                
                {/* Header do Terminal: Discurso do Agente com as Instruções */}
                <div className="bg-[#0a0c10] border border-[#fbaa19]/40 rounded-lg p-5 md:p-6 shadow-2xl flex flex-col gap-4 animate-fade-in">
                    
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black tracking-widest px-2.5 py-1 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/40 uppercase">
                            [{faction.badge}]
                        </span>
                        <h1 className="text-white text-xl md:text-2xl font-black uppercase tracking-wider">
                            {faction.title}
                        </h1>
                    </div>

                    {/* Discurso do Agente com Altura Mínima Estável para evitar expansão da tela */}
                    <div className="border-l-2 border-[#fbaa19] pl-4 py-1 text-sm md:text-base text-gray-200 leading-relaxed font-mono min-h-[220px] md:min-h-[190px]">
                        <TypewriterLine 
                            text={agentSpeech} 
                            startDelay={150} 
                            onReadyForNext={() => setTypingDone(true)} 
                        />
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-900/40 border border-red-500/50 p-4 rounded text-red-500 font-bold uppercase tracking-widest text-xs animate-fade-in">
                        [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                    </div>
                )}

                {/* Propostas Oficiais de Equipes em Badges Compactos Interativos (Mesmo padrão sólido do box text) */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-700 ${typingDone ? 'opacity-100' : 'opacity-90'}`}>
                    {offeredTeams.map((teamOffer) => {
                        const availableSpots = Math.max(0, 2 - teamOffer.occupied);
                        const isSigning = signingId === teamOffer.id;

                        return (
                            <button
                                key={teamOffer.id}
                                onClick={() => availableSpots > 0 && !isSigning && handleSignContract(teamOffer)}
                                disabled={isSigning || availableSpots <= 0}
                                className={`relative w-full text-left bg-[#0a0c10] hover:bg-[#101318] border border-white/20 rounded-lg p-3.5 sm:p-4 shadow-2xl transition-all cursor-pointer group flex flex-col justify-between gap-2.5 overflow-hidden ${
                                    isSigning 
                                        ? 'ring-2 ring-[#fbaa19] scale-[1.01]' 
                                        : 'hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(251,170,25,0.2)]'
                                }`}
                                style={{ borderColor: `${teamOffer.color}80` }}
                            >
                                {/* Faixa superior de acento com a cor oficial da escuderia */}
                                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: teamOffer.color }} />

                                {/* Topo: Emblema, Nome e Vagas */}
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div 
                                            className="w-10 h-10 rounded flex items-center justify-center font-black text-sm shadow border border-white/20 text-white shrink-0"
                                            style={{ backgroundColor: teamOffer.color }}
                                        >
                                            {teamOffer.code}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white text-sm font-black uppercase tracking-wider group-hover:text-[#fbaa19] transition-colors truncate">
                                                {teamOffer.name}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">
                                                {teamOffer.seatTitle}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded shrink-0">
                                        {availableSpots} {availableSpots === 1 ? 'VAGA' : 'VAGAS'}
                                    </span>
                                </div>

                                {/* Dossiê tático da garagem resumido */}
                                <p className="text-[11px] text-gray-300 italic border-l-2 pl-2 leading-snug line-clamp-2" style={{ borderColor: teamOffer.color }}>
                                    "{teamOffer.description}"
                                </p>

                                {/* Unidade de Potência */}
                                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between pt-1 border-t border-white/10">
                                    <span className="uppercase text-gray-500">UNIDADE DE POTÊNCIA:</span>
                                    <span className="text-amber-400 font-bold truncate max-w-[200px]">{teamOffer.engineSpec}</span>
                                </div>

                                {/* Barra de Confirmação Integrada ao Badge */}
                                <div 
                                    className="w-full py-2 px-3 rounded text-[11px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-1.5 border mt-1"
                                    style={{
                                        backgroundColor: isSigning ? '#fbaa19' : `${teamOffer.color}18`,
                                        borderColor: isSigning ? '#fbaa19' : `${teamOffer.color}45`,
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
