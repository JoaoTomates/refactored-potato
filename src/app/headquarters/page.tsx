"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ENGINE_FACTIONS, TEAM_SPECS, TeamOffer } from '@/utils/alliance-data';

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

                let delay = (30 + Math.random() * 20);
                if (char === '.' || char === '!' || char === '?') delay = 320;
                else if (char === ',' || char === '\n' || char === ':') delay = 160;

                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 800);
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
    const [activeGroupName, setActiveGroupName] = useState<string>("Grupo 1 (G. Farina)");
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

                    if (profile?.slug) {
                        window.location.replace(`/${profile.slug}`);
                        return;
                    }
                }

                // 2. Recupera a aliança escolhida pelo usuário
                let alliancePref = user.user_metadata?.alliance_id as ('A' | 'B' | 'C' | undefined);
                if (!alliancePref || !['A', 'B', 'C'].includes(alliancePref)) {
                    alliancePref = (localStorage.getItem('draft_alliance') as ('A' | 'B' | 'C')) || 'B';
                }
                setActiveAllianceKey(alliancePref);
                const currentFaction = ENGINE_FACTIONS[alliancePref] || ENGINE_FACTIONS['B'];

                // 3. Busca o grupo ativo do Fantasy (is_filling = true)
                const { data: activeGroupData } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('is_filling', true)
                    .maybeSingle();

                const group = activeGroupData || { id: 1, name: 'G. Farina' };
                const gName = group.name ? `Grupo ${group.id} (${group.name})` : `Grupo ${group.id}`;
                setActiveGroupName(gName);

                // 4. Busca contratos ocupados no grupo ativo
                const { data: contractsData } = await supabase
                    .from('contracts')
                    .select('team_id')
                    .eq('group_id', group.id);

                const occupiedCounts: Record<string, number> = {};
                (contractsData || []).forEach((c: any) => {
                    occupiedCounts[c.team_id] = (occupiedCounts[c.team_id] || 0) + 1;
                });

                // 5. Busca equipes cadastradas no banco
                const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
                if (teamsError) throw teamsError;

                const factionCodes = currentFaction.teams;
                const factionTeamObjs = (teamsData || []).filter((t: any) => factionCodes.includes(t.code));

                // 6. Monta especificações das ofertas
                const offersList: TeamOffer[] = factionTeamObjs.map((t: any) => {
                    const spec = TEAM_SPECS[t.code] || {
                        engineSpec: currentFaction.engineSpec,
                        perk: currentFaction.fantasyPerk,
                        description: `Garagem oficial da aliança ${currentFaction.badge}.`,
                        seatTitle: `ESTRATEGISTA CHEFE ${t.name.toUpperCase()}`
                    };
                    const occupied = occupiedCounts[t.id] || 0;
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
                        groupId: group.id
                    };
                });

                // 7. Filtra equipes com vagas abertas (< 2)
                let openOffers = offersList.filter(o => o.occupied < 2);
                if (openOffers.length === 0) {
                    openOffers = offersList;
                }

                // Seleciona exatamente duas propostas oficiais
                const shuffled = [...openOffers].sort(() => 0.5 - Math.random());
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

            // 3. Obtém o slug e redireciona para a central pessoal
            const { data: profile } = await supabase
                .from('profiles')
                .select('slug')
                .eq('id', user.id)
                .single();

            const targetSlug = profile?.slug || 'dashboard';
            window.location.replace(`/${targetSlug}`);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "FALHA NA HOMOLOGAÇÃO DO CONTRATO.");
            setSigningId(null);
        }
    };

    if (authLoading || loadingData) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative">
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div className="relative z-10 flex flex-col items-center gap-4 bg-black/80 p-8 border border-[#fbaa19]/30 rounded-lg">
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">
                        &gt;_ SINCRONIZANDO TELEMETRIA COM A BASE DE DADOS DA FIA...
                    </p>
                </div>
            </main>
        );
    }

    // Se o usuário não estiver autenticado (abriu direto sem confirmar e-mail)
    if (!user) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono relative p-4">
                <img
                    src="/pixel_invite_bg_v2.jpg"
                    alt=""
                    className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
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
                        Não detectamos uma sessão ativa de Superlicença. Para acessar as vagas exclusivas da sua aliança, clique no link de homologação enviado para seu e-mail de telemetria ou realize o login com suas credenciais.
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

    // Discurso do Agente / Diretor narrando as metas das três competições
    const agentSpeech = `Identificação confirmada. Seus canais estão criptografados e homologados na base da FIA. Temos exatamente DUAS garagens com assento vago na nossa aliança dentro do ${activeGroupName}.\n\nAntes de assinar, preste atenção no que a diretoria exige de você nesta temporada:\n1. MÁXIMA PRECISÃO NO FORMULÁRIO TOP 10 FINISH: Leitura cirúrgica de ritmo de corrida, desgaste de pneus e previsão de pitstops em cada GP;\n2. CLASSIFICAÇÃO DE ELITE NA COMPETIÇÃO MILÉSIMUS: Cravar a volta mais rápida da Pole Position nos treinos classificatórios até a casa dos milésimos de segundo;\n3. LIDERANÇA ABSOLUTA NO MUNDIAL DE MOTORES: Somar pontos em todas as etapas para colocar nossa aliança técnica no topo do campeonato mundial de construtores.\n\nAnalise as duas propostas oficiais abaixo e assine seu contrato de pitwall.`;

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center pb-24">
            
            <img
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6 mt-12 md:mt-16 px-4">
                
                {/* Header do Terminal: Discurso do Agente com as Instruções */}
                <div className="bg-black/85 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-fade-in">
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <span className="text-[#fbaa19] text-xs font-black tracking-[0.2em] uppercase">
                            &gt;_ DESPACHO EXECUTIVO // ALOCAÇÃO DE ASSENTOS NO PITWALL
                        </span>
                        <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30 px-2.5 py-0.5 rounded bg-emerald-950/30">
                            ● SESSÃO HOMOLOGADA • FIA ACTIVE
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
                            startDelay={200} 
                            onReadyForNext={() => setTypingDone(true)} 
                        />
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded text-red-500 font-bold uppercase tracking-widest text-xs animate-fade-in">
                        [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                    </div>
                )}

                {/* Duas Propostas Oficiais de Equipes (Estilo Bloomberg / Paddock Noir) */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-700 ${typingDone ? 'opacity-100' : 'opacity-85'}`}>
                    {offeredTeams.map((teamOffer) => {
                        const availableSpots = Math.max(0, 2 - teamOffer.occupied);
                        const isSigning = signingId === teamOffer.id;

                        return (
                            <div 
                                key={teamOffer.id}
                                className="bg-black/85 backdrop-blur-sm border border-white/15 hover:border-[#fbaa19] rounded-lg p-6 shadow-2xl flex flex-col justify-between gap-5 transition-all group relative overflow-hidden animate-fade-in"
                            >
                                {/* Faixa superior de acento com a cor oficial da escuderia */}
                                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamOffer.color }} />

                                {/* Topo: Emblema e Nome da Escuderia */}
                                <div className="flex items-center gap-4 mt-1">
                                    <div 
                                        className="w-14 h-14 rounded flex items-center justify-center font-black text-lg shadow-lg border border-white/20 text-white shrink-0"
                                        style={{ backgroundColor: teamOffer.color }}
                                    >
                                        {teamOffer.code}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-lg font-black uppercase tracking-wider group-hover:text-[#fbaa19] transition-colors">
                                            {teamOffer.name}
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                            {teamOffer.seatTitle}
                                        </span>
                                    </div>
                                </div>

                                {/* Dossiê tático da garagem */}
                                <p className="text-xs text-gray-300 italic border-l-2 border-white/20 pl-3 leading-relaxed">
                                    "{teamOffer.description}"
                                </p>

                                {/* Tabela Bloomberg de Ativos & Requisitos */}
                                <div className="border border-white/10 rounded overflow-hidden text-xs font-mono bg-black/40">
                                    <div className="flex justify-between items-center p-2.5 bg-white/[0.03] border-b border-white/5">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">STATUS DO ATIVO</span>
                                        <span className="text-emerald-400 font-bold tracking-widest text-[11px]">
                                            [OPEN] • {availableSpots} {availableSpots === 1 ? 'VAGA RESTANTE' : 'VAGAS ABERTAS'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 border-b border-white/5">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">GRUPO FANTASY</span>
                                        <span className="text-white font-bold text-[11px]">{teamOffer.groupName}</span>
                                    </div>
                                    <div className="flex flex-col p-2.5 border-b border-white/5 gap-1">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">UNIDADE DE POTÊNCIA</span>
                                        <span className="text-[#fbaa19] text-[11px] font-bold">{teamOffer.engineSpec}</span>
                                    </div>
                                    <div className="flex flex-col p-2.5 border-b border-white/5 gap-1">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">PERK DE OPERAÇÃO</span>
                                        <span className="text-white text-[11px] leading-relaxed">{teamOffer.perk}</span>
                                    </div>
                                    <div className="flex flex-col p-2.5 gap-1 bg-white/[0.02]">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">METAS DA TEMPORADA</span>
                                        <div className="text-[10px] text-gray-300 flex flex-col gap-0.5">
                                            <span>• TOP 10 Finish: Máxima precisão de chegada</span>
                                            <span>• Milésimus: Duelos de Poletime até os milésimos</span>
                                            <span>• Mundial de Motores: Supremacia técnica</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botão Oficial de Homologação de Contrato */}
                                <button
                                    onClick={() => handleSignContract(teamOffer)}
                                    disabled={!!signingId}
                                    className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.15em] text-xs p-3.5 rounded hover:bg-white hover:shadow-[0_0_15px_rgba(251,170,25,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSigning ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                            HOMOLOGANDO CONTRATO NA FIA...
                                        </span>
                                    ) : (
                                        `[ ASSINAR CONTRATO & ASSUMIR O PITWALL DA ${teamOffer.name.toUpperCase()} ] »`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>
        </main>
    );
}

export default function HeadquartersPage() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <HeadquartersFlow />
        </Suspense>
    );
}
