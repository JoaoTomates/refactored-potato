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
            
            {/* Background com arte em pixel art do Quartel-General - Cobertura contínua */}
            <img
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed inset-0 w-full h-full object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* BARRA SUPERIOR DE ESCAPE E CONTROLE DE SESSÃO */}
            <div className="relative z-20 w-full bg-black/90 border-b border-white/10 backdrop-blur-md px-4 py-2.5">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white/60 font-bold uppercase tracking-wider text-[11px]">
                            BAEFF1 PITWALL HQ
                        </span>
                        <span className="text-white/30">•</span>
                        <span className="text-[#fbaa19] font-mono text-[11px] truncate max-w-[280px]">
                            {user.email}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6 mt-8 md:mt-10 px-4">
                
                {/* Header do Terminal: Discurso do Agente com as Instruções */}
                <div className="bg-black/85 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-fade-in">
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <span className="text-[#fbaa19] text-xs font-black tracking-[0.2em] uppercase">
                            &gt;_ DESPACHO EXECUTIVO // ALOCAÇÃO DE ASSENTOS NO PITWALL
                        </span>
                        <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30 px-2.5 py-0.5 rounded bg-emerald-950/30">
                            ● SESSÃO HOMOLOGADA • BAEFF1 ACTIVE
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black tracking-widest px-2.5 py-1 rounded bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19]/40 uppercase">
                            [{faction.badge}]
                        </span>
                        <h1 className="text-white text-xl md:text-2xl font-black uppercase tracking-wider">
                            {faction.title}
                        </h1>
                    </div>

                    {/* Discurso do Agente com Typewriter */}
                    <div className="border-l-2 border-[#fbaa19] pl-4 py-1 text-sm md:text-base text-gray-200 leading-relaxed font-mono">
                        <TypewriterLine 
                            text={agentSpeech} 
                            startDelay={150} 
                            onReadyForNext={() => setTypingDone(true)} 
                        />
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded text-red-500 font-bold uppercase tracking-widest text-xs animate-fade-in">
                        [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                    </div>
                )}

                {/* Propostas Oficiais de Equipes com Vagas Reais */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-700 ${typingDone ? 'opacity-100' : 'opacity-85'}`}>
                    {offeredTeams.map((teamOffer) => {
                        const availableSpots = Math.max(0, 2 - teamOffer.occupied);
                        const isSigning = signingId === teamOffer.id;

                        return (
                            <div 
                                key={teamOffer.id}
                                className="bg-black/85 backdrop-blur-sm border border-white/15 hover:border-[#fbaa19] rounded-lg p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3.5 transition-all group relative overflow-hidden animate-fade-in"
                            >
                                {/* Faixa superior de acento com a cor oficial da escuderia */}
                                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: teamOffer.color }} />

                                {/* Topo: Emblema e Nome da Escuderia */}
                                <div className="flex items-center gap-3.5 mt-0.5">
                                    <div 
                                        className="w-12 h-12 rounded flex items-center justify-center font-black text-base shadow border border-white/20 text-white shrink-0"
                                        style={{ backgroundColor: teamOffer.color }}
                                    >
                                        {teamOffer.code}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-base font-black uppercase tracking-wider group-hover:text-[#fbaa19] transition-colors truncate">
                                            {teamOffer.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                                            {teamOffer.seatTitle}
                                        </span>
                                    </div>
                                </div>

                                {/* Dossiê tático da garagem */}
                                <p className="text-xs text-gray-300 italic border-l-2 border-white/20 pl-2.5 py-0.5 leading-relaxed line-clamp-2">
                                    "{teamOffer.description}"
                                </p>

                                {/* Tabela Bloomberg Compacta de Ativos & Requisitos */}
                                <div className="border border-white/10 rounded overflow-hidden text-xs font-mono bg-black/40">
                                    <div className="flex justify-between items-center p-2 bg-white/[0.03] border-b border-white/5">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">VAGAS NO BLOCO</span>
                                        <span className="text-emerald-400 font-bold tracking-widest text-[10px]">
                                            [DISPONÍVEL] • {availableSpots} {availableSpots === 1 ? 'VAGA' : 'VAGAS'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col p-2 gap-0.5">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">UNIDADE DE POTÊNCIA</span>
                                        <span className="text-amber-400 font-bold text-[10px] truncate">{teamOffer.engineSpec}</span>
                                    </div>
                                </div>

                                {/* Botão de Assinatura Definitiva Compacto */}
                                <button
                                    onClick={() => handleSignContract(teamOffer)}
                                    disabled={isSigning || availableSpots <= 0}
                                    className={`w-full py-2.5 px-3 rounded font-black tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                                        availableSpots <= 0 
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
                                            : isSigning 
                                            ? 'bg-[#fbaa19] text-black animate-pulse' 
                                            : 'bg-white text-black hover:bg-[#fbaa19] hover:text-black border border-transparent'
                                    }`}
                                >
                                    {isSigning ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <span>HOMOLOGANDO CONTRATO NA BAEFF1...</span>
                                        </>
                                    ) : availableSpots <= 0 ? (
                                        <span>[ GARAGEM COMPLETA ]</span>
                                    ) : (
                                        <>
                                            <span>ASSINAR COM A {teamOffer.name.toUpperCase()}</span>
                                            <span>&gt;&gt;</span>
                                        </>
                                    )}
                                </button>
                            </div>
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
