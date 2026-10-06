"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

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
    } catch (_) {}
  }
}

const retroSound = new PitWallSoundEngine();

interface TeamSpot {
    id: string;
    code: string;
    name: string;
    color: string;
    block: 'A' | 'B' | 'C';
    engineSpec: string;
    fantasyPerk: string;
    availableSpots: number;
    occupiedSpots: number;
}

type Phase = 'LOADING' | 'INTRO' | 'AUTO_DIALOG' | 'GROUP_SELECT' | 'FETCHING_TEAM' | 'SPOTS_SELECTION' | 'BRIEFING' | 'ENLIST' | 'SUBMITTING_ENLIST';

const customDialogs = [
    "Puxe uma cadeira e feche a porta.",
    "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
    "Você lê o traçado antes das luzes apagarem.",
    "Mas você sabe que o novo regulamento de motores deflagrou uma verdadeira guerra fria nos bastidores. As fronteiras foram desenhadas e três grandes alianças se formaram no grid.",
    "Chegou a hora de escolher o seu lado e buscar uma vaga no pitwall entre os melhores."
];

const ENGINE_FACTIONS: Record<'A' | 'B' | 'C', any> = {
  A: {
    id: 'A',
    badge: 'BLOCO A',
    title: 'CONSÓRCIO DA ESTRELA',
    sub: '"Confiabilidade de Aço & Domínio de Frota"',
    engineSpec: 'Mercedes V6 Hybrid',
    teamsString: 'Mercedes • McLaren • Alpine • Williams',
    teams: ['MER', 'MCL', 'ALP', 'WIL'],
    teamDetails: [
      { code: 'MER', name: 'Mercedes', color: '#00D2BE' },
      { code: 'MCL', name: 'McLaren', color: '#FF8000' },
      { code: 'ALP', name: 'Alpine', color: '#FD4BC7' },
      { code: 'WIL', name: 'Williams', color: '#005AFF' }
    ],
    fantasyPerk: '+15% XP em previsões de consistência.',
    directorResponse: '“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”'
  },
  B: {
    id: 'B',
    badge: 'BLOCO B',
    title: 'A DINASTIA DE MARANELLO',
    sub: '"Potência de Pico & A Frente Americana"',
    engineSpec: 'Ferrari 067/3 Hybrid E-Turbo',
    teamsString: 'Ferrari • Haas • Cadillac',
    teams: ['FER', 'HAA', 'CAD'],
    teamDetails: [
      { code: 'FER', name: 'Ferrari', color: '#DC0000' },
      { code: 'HAA', name: 'Haas', color: '#E6002B' },
      { code: 'CAD', name: 'Cadillac', color: '#FFC80C' }
    ],
    fantasyPerk: '2x XP em apostas arriscadas de pole.',
    directorResponse: '“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a imprensa italiana te destrói.”'
  },
  C: {
    id: 'C',
    badge: 'BLOCO C',
    title: 'A VANGUARDA',
    sub: '"Ambição e Risco Tecnológico"',
    engineSpec: 'Ford / Honda / Audi PU',
    teamsString: 'Red Bull • Racing Bulls • Aston Martin • Audi',
    teams: ['RBR', 'RBA', 'AST', 'AUD'],
    teamDetails: [
      { code: 'RBR', name: 'Red Bull', color: '#3671C6' },
      { code: 'RBA', name: 'Racing Bulls', color: '#6692FF' },
      { code: 'AST', name: 'Aston Martin', color: '#229971' },
      { code: 'AUD', name: 'Audi', color: '#F50537' }
    ],
    fantasyPerk: '+25% XP ao prever cenários de caos.',
    directorResponse: '“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”'
  }
};

function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300, fastMode = false }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number, fastMode?: boolean }) {
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
                
                let delay = fastMode ? (10 + Math.random() * 10) : (40 + Math.random() * 30); 
                if (char === '.' || char === '!' || char === '?') delay = fastMode ? 100 : 400;
                else if (char === ',' || char === '\n') delay = fastMode ? 50 : 200;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 1000); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, startDelay);
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay, fastMode]);
    
    return (
        <span className="opacity-90 leading-relaxed relative whitespace-pre-wrap">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

function InviteFlow() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [phase, setPhase] = useState<Phase>('LOADING');
    const [introReady, setIntroReady] = useState(false);
    const [autoIndex, setAutoIndex] = useState(1);
    const [groupIndex, setGroupIndex] = useState(0); 
    
    const [readyFlags, setReadyFlags] = useState<Record<number, boolean>>({});
    const [groupReadyFlags, setGroupReadyFlags] = useState<Record<string, boolean>>({});
    
    const [typingComplete, setTypingComplete] = useState(false);
    
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'C' | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<TeamSpot | null>(null);
    const [availableSpotsList, setAvailableSpotsList] = useState<TeamSpot[]>([]);
    const [isFallback, setIsFallback] = useState<boolean>(false);
    const [activeGroupName, setActiveGroupName] = useState<string>('J. Fangio');
    const [activeGroupId, setActiveGroupId] = useState<number>(2);
    const [groupIntroReady, setGroupIntroReady] = useState(false);
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (authLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).single();
                if (data?.setup_completed && data?.slug) {
                    window.location.replace(`/${data.slug}`);
                    return;
                }
            }
            setPhase('INTRO');
        };
        
        checkUserStatus();
    }, [authLoading, user]);

    useEffect(() => {
        if (messagesEndRef.current && phase !== 'INTRO') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [autoIndex, groupIndex, phase, groupReadyFlags]);

    const startAutoDialog = () => {
        retroSound.init();
        setPhase('AUTO_DIALOG');
        setAutoIndex(1);
    };

    const startGroupSelect = () => {
        retroSound.init();
        setPhase('GROUP_SELECT');
        setGroupIndex(0);
        setGroupReadyFlags({ A: true, B: true, C: true });
    };

    const handleSelectGroup = async (groupId: 'A' | 'B' | 'C') => {
        retroSound.init();
        setSelectedGroup(groupId);
        setPhase('FETCHING_TEAM');
        setErrorMsg("");
        
        try {
            // 1. Grupo ativo da liga
            const { data: groupData } = await supabase.from('groups').select('*').eq('is_filling', true).single();
            const currentGId = groupData?.id || 2;
            const currentGName = groupData?.name || 'J. Fangio';
            setActiveGroupId(currentGId);
            setActiveGroupName(currentGName);

            // 2. Equipes
            const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
            if (teamsError) throw teamsError;

            // 3. Contratos no grupo ativo
            const { data: contractsData } = await supabase.from('contracts').select('team_id').eq('group_id', currentGId);

            // 4. Mapeia as vagas de cada equipe (máximo 2 por escuderia)
            const spots: TeamSpot[] = (teamsData || []).map((t: any) => {
                let block: 'A' | 'B' | 'C' = 'A';
                if (ENGINE_FACTIONS.B.teams.includes(t.code)) block = 'B';
                else if (ENGINE_FACTIONS.C.teams.includes(t.code)) block = 'C';

                const occupied = (contractsData || []).filter((c: any) => c.team_id === t.id).length;
                const available = Math.max(0, 2 - occupied);

                return {
                    id: t.id,
                    code: t.code,
                    name: t.name,
                    color: t.color,
                    block,
                    engineSpec: ENGINE_FACTIONS[block]?.engineSpec || '',
                    fantasyPerk: ENGINE_FACTIONS[block]?.fantasyPerk || '',
                    availableSpots: available,
                    occupiedSpots: occupied
                };
            });

            // 5. Vagas no bloco selecionado
            const chosenBlockSpots = spots.filter(s => s.block === groupId && s.availableSpots > 0);

            if (chosenBlockSpots.length > 0) {
                setAvailableSpotsList(chosenBlockSpots);
                setIsFallback(false);
            } else {
                // Se não houver vagas no bloco selecionado, mostra as vagas dos outros grupos!
                const otherSpots = spots.filter(s => s.block !== groupId && s.availableSpots > 0);
                setAvailableSpotsList(otherSpots);
                setIsFallback(true);
            }

            localStorage.setItem('draft_alliance', groupId);
            setPhase('SPOTS_SELECTION');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO NA VERIFICAÇÃO DE VAGAS");
            setPhase('GROUP_SELECT');
        }
    };

    const handleViewOffer = (spot: TeamSpot) => {
        retroSound.init();
        setSelectedSpot(spot);
        setSelectedTeamId(spot.id);
        setPhase('BRIEFING');
    };

    const handleConfirmOffer = async () => {
        if (!selectedSpot) return;
        retroSound.init();

        if (user) {
            setPhase('SUBMITTING_ENLIST');
            await signInitialContract(selectedSpot.id);
        } else {
            setTypingComplete(false);
            setPhase('ENLIST');
        }
    };

    const signInitialContract = async (teamId: string, slug?: string) => {
        try {
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamId });
            if (rpcError) throw rpcError;
            
            if (slug) {
                window.location.href = `/${slug}`;
            } else {
                const { data } = await supabase.from('profiles').select('slug').eq('id', user!.id).single();
                window.location.href = `/${data?.slug || 'superlicense'}`;
            }
        } catch (err: any) {
            console.error('RPC Error:', err);
            setErrorMsg("FALHA NA ASSINATURA");
            setPhase('BRIEFING');
        }
    };

    const isValidNamePart = (val: string) => {
        const trimmed = val.trim();
        return trimmed.length >= 2 && /^[\p{L}'-]+$/u.test(trimmed);
    };

    const handleEnlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
        if (nameParts.length < 2) {
            setErrorMsg("A SUPERLICENÇA EXIGE PELO MENOS DOIS NOMES (NOME E SOBRENOME).");
            return;
        }

        if (!nameParts.every(isValidNamePart)) {
            setErrorMsg("NOMES INVÁLIDOS: CADA NOME DEVE CONTER NO MÍNIMO 2 LETRAS (SEM NÚMEROS).");
            return;
        }

        retroSound.init();
        setPhase('SUBMITTING_ENLIST');

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; 
            }

            const autoPassword = 'Volt' + Math.random().toString(36).slice(-6) + '!';

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password: autoPassword 
            });

            if (authError) throw authError;

            if (authData.user) {
                const rawFirst = nameParts[0];
                const rawLast = nameParts.slice(1).join(' ');

                const cleanFirstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
                const cleanLastName = rawLast.toUpperCase();
                const generatedNumber = Math.floor(Math.random() * 99) + 1;
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${generatedNumber}`;

                const teamColor = selectedSpot?.color || '#000000';

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: teamColor,
                    setup_completed: false, 
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: teamColor,
                        setup_completed: false, 
                        slug: slug
                    });
                }

                if (selectedSpot?.id) {
                    localStorage.setItem('draft_team_id', selectedSpot.id);
                    localStorage.setItem('draft_alliance', selectedSpot.block);
                    try {
                        await supabase.rpc('sign_initial_contract', { p_team_id: selectedSpot.id });
                    } catch (rpcErr) {
                        console.warn('RPC post-signup error:', rpcErr);
                    }
                }
                
                window.location.href = `/${slug}`;
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO CRÍTICO");
            setPhase('ENLIST');
        }
    };

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center">
            
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {phase === 'INTRO' && (
                <div className="absolute bottom-[25%] md:bottom-[30%] w-full max-w-3xl px-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                        <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                        <TypewriterLine text={customDialogs[0]} startDelay={150} onReadyForNext={() => setIntroReady(true)} />
                        
                        {introReady && (
                            <div className="mt-5 flex justify-end animate-fade-in">
                                <button 
                                    onClick={startAutoDialog}
                                    className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse"
                                >
                                    [ CONTINUAR ] »
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {phase === 'AUTO_DIALOG' && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-16 mb-16 px-4">
                    {customDialogs.map((dialog, idx) => {
                        if (idx === 0) return null;
                        
                        if (idx <= autoIndex) {
                            return (
                                <div key={idx} className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine 
                                        text={dialog} 
                                        startDelay={150} 
                                        onReadyForNext={() => {
                                            if (idx < customDialogs.length - 1) {
                                                setTimeout(() => setAutoIndex(idx + 1), 1000);
                                            } else {
                                                setReadyFlags(prev => ({ ...prev, [idx]: true }));
                                            }
                                        }} 
                                    />
                                    
                                    {readyFlags[idx] && idx === customDialogs.length - 1 && (
                                        <div className="mt-5 flex justify-end animate-fade-in">
                                            <button 
                                                onClick={startGroupSelect}
                                                className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse"
                                            >
                                                [ ACESSAR ALIANÇAS ] »
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })}
                    <div ref={messagesEndRef} className="h-4 w-full" />
                </div>
            )}

            {phase === 'GROUP_SELECT' && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-16 mb-16 px-4">
                    {errorMsg && (
                        <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded mb-2 animate-fade-in">
                            [ERRO] {errorMsg}
                        </div>
                    )}

                    <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                        <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                        <TypewriterLine text="SELECIONE UMA ALIANÇA PARA CONSULTAR AS VAGAS DISPONÍVEIS NO GRID:" startDelay={100} onReadyForNext={() => setGroupIntroReady(true)} />
                    </div>
                    
                    {(['A', 'B', 'C'] as const).map((groupId, idx) => {
                        const g = ENGINE_FACTIONS[groupId];

                        return (
                            <div 
                                key={g.id} 
                                className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl hover:border-[#fbaa19] transition-all cursor-pointer animate-fade-in group"
                                onClick={() => handleSelectGroup(groupId)}
                            >
                                <div className="flex items-start">
                                    <span className="opacity-50 mr-3 text-[#fbaa19] select-none">&gt; -</span>
                                    <div className="flex-1 text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed flex flex-col gap-2">
                                        <div>
                                            <span className="text-[#fbaa19]">[{g.badge}]</span> <span className="text-white">{g.title}</span>
                                        </div>
                                        <div className="text-white/80">
                                            <TypewriterLine text={`${g.sub}\nEQUIPES: ${g.teamsString}\nSPEC: ${g.engineSpec}\nPERK: ${g.fantasyPerk}`} startDelay={250 + idx * 150} fastMode={true} />
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/60 text-[10px] md:text-xs">EQUIPES:</span>
                                                {g.teamDetails?.map((t: any, i: number) => (
                                                    <span key={t.code} className="text-[11px] md:text-xs font-bold" style={{ color: t.color }}>
                                                        {t.name}{i < g.teamDetails.length - 1 ? ' • ' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[#fbaa19] text-xs font-bold uppercase group-hover:text-white transition-colors animate-pulse">
                                                [ CONSULTAR VAGAS ] »
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-4 w-full" />
                </div>
            )}

            {phase === 'FETCHING_TEAM' && (
                <div className="relative z-10 w-full flex flex-col items-center justify-center gap-6 mt-32 px-4">
                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs md:text-sm">
                        &gt;_ VERIFICANDO DISPONIBILIDADE NO GRID...
                    </p>
                </div>
            )}

            {phase === 'SPOTS_SELECTION' && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-16 mb-16 px-4">
                    {/* Alerta de Vagas ou Status */}
                    <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                        <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                        {isFallback ? (
                            <span className="leading-relaxed">
                                <span className="text-amber-400">[VAGAS ESGOTADAS]</span>
                                <TypewriterLine 
                                    text={` O BLOCO ESCOLHIDO NÃO POSSUI VAGAS NO GRUPO ATIVO (${activeGroupName.toUpperCase()}). EXIBINDO VAGAS DISPONÍVEIS EM OUTROS BLOCOS:`}
                                    startDelay={100}
                                    fastMode={true}
                                />
                            </span>
                        ) : (
                            <TypewriterLine 
                                text={`VAGAS LOCALIZADAS NO GRUPO ATIVO (${activeGroupName.toUpperCase()}) — ${selectedGroup ? ENGINE_FACTIONS[selectedGroup].title : ''}:`}
                                startDelay={100}
                                fastMode={true}
                            />
                        )}
                    </div>

                    {/* Lista de Vagas */}
                    {availableSpotsList.map((spot) => (
                        <div 
                            key={spot.id}
                            className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl hover:border-[#fbaa19] transition-all animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex items-start">
                                <span className="opacity-50 mr-3 text-[#fbaa19] select-none">&gt; -</span>
                                <div className="flex flex-col gap-1.5 font-mono">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base md:text-lg font-bold" style={{ color: spot.color }}>
                                            {spot.name.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-[#fbaa19]">
                                            [{ENGINE_FACTIONS[spot.block].badge}]
                                        </span>
                                    </div>
                                    <div className="text-xs text-white/70">
                                        SPEC: <span className="text-white">{spot.engineSpec}</span>
                                    </div>
                                    <div className="text-xs text-white/70">
                                        DIVISÃO: <span className="text-[#fbaa19] font-bold">GRUPO {activeGroupName}</span>
                                    </div>
                                    <div className="text-xs text-emerald-400 font-bold">
                                        VAGAS ABERTAS: {spot.availableSpots} / 2
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <button 
                                    onClick={() => handleViewOffer(spot)}
                                    className="w-full md:w-auto bg-[#fbaa19] hover:bg-white text-black font-black uppercase tracking-widest text-xs px-5 py-3 rounded transition-all shadow-[0_0_15px_rgba(251,170,25,0.3)] animate-pulse"
                                >
                                    [ VER OFERTA ] »
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Botão de retorno */}
                    <div className="flex justify-between items-center mt-2">
                        <button 
                            onClick={() => setPhase('GROUP_SELECT')}
                            className="text-white/60 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors"
                        >
                            « [ ESCOLHER OUTRO BLOCO ]
                        </button>
                    </div>
                    <div ref={messagesEndRef} className="h-4 w-full" />
                </div>
            )}

            {phase === 'BRIEFING' && selectedSpot && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-16 mb-16 px-4">
                    {/* Box Proposta */}
                    <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="opacity-50 text-[#fbaa19]">&gt;_</span>
                            <span className="text-[#fbaa19]">BRIEFING TÁTICO DA PROPOSTA</span>
                        </div>
                        <div className="text-white text-sm md:text-base leading-relaxed">
                            A escuderia <span style={{ color: selectedSpot.color }}>{selectedSpot.name.toUpperCase()}</span> formalizou sua proposta para vaga de estrategista no <span className="text-[#fbaa19]">GRUPO {activeGroupName.toUpperCase()}</span>.
                        </div>
                    </div>

                    {/* Box Briefing Competições */}
                    <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-4 text-xs md:text-sm">
                        <div className="text-[#fbaa19] font-bold tracking-widest uppercase pb-2 border-b border-white/10 flex items-center justify-between">
                            <span>REGULAMENTO DAS COMPETIÇÕES</span>
                            <span className="text-white/60">TEMPORADA OFICIAL</span>
                        </div>

                        <div className="flex flex-col gap-3 font-mono">
                            <div className="bg-black/40 p-3 rounded border border-white/10">
                                <span className="text-[#fbaa19] font-bold block mb-1">&gt; 1. POLETIME (DESAFIO DA POLE POSITION)</span>
                                <p className="text-white/80 leading-relaxed text-xs">
                                    Preveja o tempo exato da pole position no Q3 de cada final de semana de GP. A precisão até o milésimo define sua pontuação técnica e prestígio no paddock.
                                </p>
                            </div>

                            <div className="bg-black/40 p-3 rounded border border-white/10">
                                <span className="text-[#fbaa19] font-bold block mb-1">&gt; 2. LIGA MASTER (CONFRONTO DIRETO DE GRID)</span>
                                <p className="text-white/80 leading-relaxed text-xs">
                                    Duelos diretos contra estrategistas da sua divisão. Seus pontos individuais somam para a conquista do Campeonato Mundial de Construtores pela sua escuderia.
                                </p>
                            </div>

                            <div className="bg-black/40 p-3 rounded border border-white/10">
                                <span className="text-[#fbaa19] font-bold block mb-1">&gt; 3. MILESIMUS / F1 FANTASY</span>
                                <p className="text-white/80 leading-relaxed text-xs">
                                    Gestão de pontuação por corrida. Sua aliança garante o bônus: <span className="text-[#fbaa19] font-bold">{selectedSpot.fantasyPerk}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 text-xs text-white/60 flex flex-wrap items-center gap-2">
                            <span>ESCUDERIA:</span>
                            <span className="font-bold" style={{ color: selectedSpot.color }}>{selectedSpot.name}</span>
                            <span>• PU:</span>
                            <span className="text-white">{selectedSpot.engineSpec}</span>
                            <span>• ALIANÇA:</span>
                            <span className="text-[#fbaa19]">[{ENGINE_FACTIONS[selectedSpot.block].badge}]</span>
                        </div>

                        {/* Confirmação ou Recusa */}
                        <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-white/10">
                            <button 
                                onClick={handleConfirmOffer}
                                className="w-full bg-[#fbaa19] hover:bg-white text-black font-black uppercase tracking-[0.2em] p-4 rounded transition-all shadow-[0_0_15px_rgba(251,170,25,0.4)] text-sm"
                            >
                                [ CONFIRMAR CONTRATO ] »
                            </button>

                            <button 
                                onClick={() => setPhase('SPOTS_SELECTION')}
                                className="w-full text-white/60 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors py-2 text-center"
                            >
                                « [ RECUSAR E VER OUTRAS VAGAS ]
                            </button>
                        </div>
                    </div>
                    <div ref={messagesEndRef} className="h-4 w-full" />
                </div>
            )}

            {(phase === 'ENLIST' || phase === 'SUBMITTING_ENLIST') && selectedGroup && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-16 mb-16 px-4">
                    <div className="w-full bg-black/80 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-6">
                        <div>
                            <p className="text-[#fbaa19] text-xs font-bold tracking-[0.2em] mb-3 uppercase">
                                RESPOSTA DO DIRETOR [{ENGINE_FACTIONS[selectedGroup].badge}]
                            </p>
                            <div className="text-white text-base md:text-lg font-bold tracking-widest leading-relaxed border-l-2 border-[#fbaa19] pl-4 py-1 italic">
                                <TypewriterLine text={ENGINE_FACTIONS[selectedGroup].directorResponse} startDelay={300} onReadyForNext={() => setTypingComplete(true)} />
                            </div>
                        </div>
                        
                        <form onSubmit={handleEnlistSubmit} className={`flex flex-col gap-6 w-full mt-4 transition-opacity duration-1000 ${typingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {errorMsg && (
                                <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded">
                                    [ERRO] {errorMsg}
                                </div>
                            )}
                            
                            {phase === 'SUBMITTING_ENLIST' ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-8">
                                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase">&gt;_ INICIALIZANDO SUPERLICENÇA...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="flex flex-col w-full">
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="NOME E SOBRENOME"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className={`w-full bg-black/50 border text-white p-4 font-bold uppercase tracking-widest focus:outline-none transition-all rounded placeholder-white/30 text-sm ${
                                                    fullName.trim()
                                                        ? (fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p)))
                                                            ? "border-emerald-500/50 focus:border-emerald-500" 
                                                            : "border-amber-500/60 focus:border-amber-500"
                                                        : "border-white/20 focus:border-[#fbaa19]"
                                                }`}
                                            />
                                            {fullName.trim() && !(fullName.trim().split(/\s+/).filter(Boolean).length >= 2 && fullName.trim().split(/\s+/).filter(Boolean).every(p => p.length >= 2 && /^[\p{L}'-]+$/u.test(p))) && (
                                                <span className="text-[10px] text-amber-400 font-mono mt-1.5 flex items-center gap-1">
                                                    <span>⚠</span> A Superlicença exige pelo menos dois nomes (Nome e Sobrenome válidos).
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="E-MAIL"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded placeholder-white/30 text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(251,170,25,0.4)]">
                                        [ ASSINAR CONTRATO E ACESSAR PITWALL ]
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function InvitePageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow />
        </Suspense>
    );
}
