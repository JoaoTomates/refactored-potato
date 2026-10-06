"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
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

type Phase = 'LOADING' | 'INTRO' | 'AUTO_DIALOG' | 'ENLIST' | 'SUBMITTING_ENLIST';

const customDialogs = [
    "Puxe uma cadeira e feche a porta.",
    "Os relatórios da sua telemetria caíram na minha mesa. Seus números são impressionantes.",
    "Você decifra o traçado antes mesmo das luzes vermelhas se apagarem.",
    "Mas o novo regulamento de motores deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid e exigem lealdade absoluta.",
    "Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações."
];

const ALLIANCE_KEYS: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

const ENGINE_FACTIONS: Record<'A' | 'B' | 'C', any> = {
  A: {
    id: 'A',
    badge: 'BLOCO A',
    title: 'CONSÓRCIO DA ESTRELA',
    sub: '"Confiabilidade de Aço & Engenharia Teutônica"',
    engineSpec: 'Mercedes-AMG High Performance Powertrains V6 Hybrid',
    teamsString: 'Mercedes • McLaren • Alpine • Williams',
    teams: ['MER', 'MCL', 'ALP', 'WIL'],
    teamDetails: [
      { code: 'MER', name: 'Mercedes', color: '#00D2BE' },
      { code: 'MCL', name: 'McLaren', color: '#FF8000' },
      { code: 'ALP', name: 'Alpine', color: '#FD4BC7' },
      { code: 'WIL', name: 'Williams', color: '#005AFF' }
    ],
    fantasyPerk: '+15% de rendimento em previsões de consistência cirúrgica.',
    directorResponse: '“Decisão metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens compartilhando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”'
  },
  B: {
    id: 'B',
    badge: 'BLOCO B',
    title: 'A DINASTIA DE MARANELLO',
    sub: '"Potência de Pico & A Frente Ítalo-Americana"',
    engineSpec: 'Ferrari 067/3 Hybrid E-Turbo Speciale',
    teamsString: 'Ferrari • Haas • Cadillac',
    teams: ['FER', 'HAA', 'CAD'],
    teamDetails: [
      { code: 'FER', name: 'Ferrari', color: '#DC0000' },
      { code: 'HAA', name: 'Haas', color: '#E6002B' },
      { code: 'CAD', name: 'Cadillac', color: '#FFC80C' }
    ],
    fantasyPerk: 'Bônus dobrado (2x) em apostas arriscadas de Pole Position.',
    directorResponse: '“Sangue quente. Você escolheu a mística de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou sua telemetria nos coloca na frente, ou a imprensa italiana te destrói.”'
  },
  C: {
    id: 'C',
    badge: 'BLOCO C',
    title: 'A VANGUARDA',
    sub: '"Ousadia Tecnológica & A Força do Caos"',
    engineSpec: 'Red Bull Ford Powertrains / Honda / Audi F1 PU',
    teamsString: 'Red Bull • Racing Bulls • Aston Martin • Audi',
    teams: ['RBR', 'RBA', 'AST', 'AUD'],
    teamDetails: [
      { code: 'RBR', name: 'Red Bull', color: '#3671C6' },
      { code: 'RBA', name: 'Racing Bulls', color: '#6692FF' },
      { code: 'AST', name: 'Aston Martin', color: '#229971' },
      { code: 'AUD', name: 'Audi', color: '#F50537' }
    ],
    fantasyPerk: '+25% de rendimento ao antecipar cenários de caos no traçado.',
    directorResponse: '“Aprecio a ousadia. Você marchou direto para o terreno hostil de motores inéditos. Risco brutal, mas é exatamente no caos que os estrategistas lendários constroem dinastias.”'
  }
};

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
                
                let delay = (40 + Math.random() * 30); 
                if (char === '.' || char === '!' || char === '?') delay = 400;
                else if (char === ',' || char === '\n') delay = 200;
                
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
    }, [text, startDelay]);
    
    return (
        <span className="opacity-90 leading-relaxed relative whitespace-pre-wrap">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

export function InviteFlow() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [phase, setPhase] = useState<Phase>('LOADING');
    const [introReady, setIntroReady] = useState(false);
    
    // Paginação de diálogos com limpeza de tela:
    // dialogPage: 1 (Boxes 1 e 2), 2 (Boxes 3 e 4), 3 (Ofertas de Alianças: Bloco A, B, C)
    const [dialogPage, setDialogPage] = useState<1 | 2 | 3>(1);
    const [pageStep, setPageStep] = useState<number>(1);
    const [isPageClearing, setIsPageClearing] = useState(false);
    const [pageAutoAdvanceReady, setPageAutoAdvanceReady] = useState(false);
    const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [typingComplete, setTypingComplete] = useState(false);
    
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'C' | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedTeamColor, setSelectedTeamColor] = useState<string>('#000000');
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialCheckDone = useRef(false);

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (authLoading || initialCheckDone.current) return;
        initialCheckDone.current = true;

        const checkUserStatus = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('slug, setup_completed')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error || !data) {
                    // Sessão fantasma/órfã no cliente que não existe no banco. Limpa o cache de auth.
                    await supabase.auth.signOut();
                    setPhase('INTRO');
                    return;
                }

                if (data.setup_completed && data.slug) {
                    window.location.replace(`/${data.slug}`);
                    return;
                }
            }
            setPhase(prev => (prev === 'LOADING' ? 'INTRO' : prev));
        };
        
        checkUserStatus();
    }, [authLoading, user]);

    useEffect(() => {
        if (messagesEndRef.current && phase === 'AUTO_DIALOG') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogPage, pageStep, phase]);

    const changeToPage = (nextPage: 1 | 2 | 3) => {
        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        setPageAutoAdvanceReady(false);
        setIsPageClearing(true);
        setTimeout(() => {
            setDialogPage(nextPage);
            setPageStep(1);
            setIsPageClearing(false);
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 300);
    };

    const startAutoDialog = () => {
        retroSound.init();
        setPhase('AUTO_DIALOG');
        setDialogPage(1);
        setPageStep(1);
        setPageAutoAdvanceReady(false);
        setIsPageClearing(false);
    };

    const handleSelectGroup = async (groupId: 'A' | 'B' | 'C') => {
        retroSound.init();
        setSelectedGroup(groupId);
        setErrorMsg("");
        
        try {
            const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
            if (teamsError) throw teamsError;

            const factionTeams = ENGINE_FACTIONS[groupId].teams;
            const factionTeamObjs = (teamsData || []).filter((t: any) => factionTeams.includes(t.code));
            
            const chosenTeam = factionTeamObjs[0] || (teamsData || [])[0];
            const teamId = chosenTeam?.id || '';
            const teamColor = chosenTeam?.color || '#000000';

            setSelectedTeamId(teamId);
            setSelectedTeamColor(teamColor);
            localStorage.setItem('draft_team_id', teamId);
            localStorage.setItem('draft_alliance', groupId);

            // Transição direta para o Despacho do Diretor do Bloco selecionado
            setTypingComplete(false);
            setPhase('ENLIST');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO NA ALOCAÇÃO DE EQUIPE");
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

            // Desloga qualquer sessão anterior/fantasma do localStorage para garantir novo cadastro limpo
            try {
                await supabase.auth.signOut();
            } catch (_) {}

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password: autoPassword 
            });

            if (authError) throw authError;

            const newUserId = authData.user?.id;
            if (!newUserId) {
                throw new Error("FALHA AO GERAR IDENTIFICAÇÃO DO PILOTO");
            }

            const rawFirst = nameParts[0];
            const rawLast = nameParts.slice(1).join(' ');

            const cleanFirstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
            const cleanLastName = rawLast.toUpperCase();
            const generatedNumber = Math.floor(Math.random() * 99) + 1;
            const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${generatedNumber}`;

            const teamColor = selectedTeamColor || '#000000';

            // Atualiza o perfil criado automaticamente pelo trigger da tabela auth.users
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: newUserId,
                email: emailToUse,
                first_name: cleanFirstName,
                last_name: cleanLastName,
                nationality: null,
                org_color: teamColor,
                setup_completed: false, 
                slug: slug
            });

            if (profileError) throw profileError;

            if (selectedTeamId) {
                const { error: rpcErr } = await supabase.rpc('sign_initial_contract', { p_team_id: selectedTeamId });
                if (rpcErr) {
                    console.error('RPC Error:', rpcErr);
                    throw rpcErr;
                }
            }
            
            window.location.href = `/${slug}`;
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO NA EMISSÃO DA SUPERLICENÇA");
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
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 ${
                    isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}>
                    {/* PÁGINA 1: Mérito e Telemetria (Boxes 1 e 2) */}
                    {dialogPage === 1 && (
                        <>
                            {pageStep >= 1 && (
                                <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine 
                                        text={customDialogs[1]} 
                                        startDelay={150} 
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 400);
                                        }} 
                                    />
                                </div>
                            )}

                            {pageStep >= 2 && (
                                <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine 
                                        text={customDialogs[2]} 
                                        startDelay={150} 
                                        onReadyForNext={() => {
                                            setPageAutoAdvanceReady(true);
                                            advanceTimeoutRef.current = setTimeout(() => {
                                                changeToPage(2);
                                            }, 1400);
                                        }} 
                                    />
                                </div>
                            )}

                            {pageAutoAdvanceReady && (
                                <div className="flex justify-end animate-fade-in">
                                    <button 
                                        onClick={() => changeToPage(2)}
                                        className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse"
                                    >
                                        [ AVANÇAR ] »
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* PÁGINA 2: O Novo Regulamento e o Chamado (Boxes 3 e 4) */}
                    {dialogPage === 2 && (
                        <>
                            {pageStep >= 1 && (
                                <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine 
                                        text={customDialogs[3]} 
                                        startDelay={150} 
                                        onReadyForNext={() => {
                                            setTimeout(() => setPageStep(2), 400);
                                        }} 
                                    />
                                </div>
                            )}

                            {pageStep >= 2 && (
                                <div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                                    <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                                    <TypewriterLine 
                                        text={customDialogs[4]} 
                                        startDelay={150} 
                                        onReadyForNext={() => {
                                            setPageAutoAdvanceReady(true);
                                            advanceTimeoutRef.current = setTimeout(() => {
                                                changeToPage(3);
                                            }, 1400);
                                        }} 
                                    />
                                </div>
                            )}

                            {pageAutoAdvanceReady && (
                                <div className="flex justify-end animate-fade-in">
                                    <button 
                                        onClick={() => changeToPage(3)}
                                        className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse"
                                    >
                                        [ VER PROPOSTAS ] »
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* PÁGINA 3: Propostas das Alianças (Transcritas de cima para baixo) */}
                    {dialogPage === 3 && (
                        <>
                            {ALLIANCE_KEYS.map((groupId, aIdx) => {
                                const stepNeeded = aIdx + 1;
                                if (pageStep < stepNeeded) return null;

                                const g = ENGINE_FACTIONS[groupId];

                                return (
                                    <div 
                                        key={g.id}
                                        className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl hover:border-[#fbaa19] transition-all cursor-pointer animate-fade-in text-white text-sm md:text-base font-bold tracking-widest group"
                                        onClick={() => handleSelectGroup(groupId)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="opacity-50 text-[#fbaa19]">&gt;_</span>
                                            <span className="text-[#fbaa19]">[{g.badge}]</span>
                                            <span className="text-white font-black">{g.title}</span>
                                        </div>

                                        <div className="mt-2 text-white/80 text-xs md:text-sm font-normal leading-relaxed">
                                            <TypewriterLine 
                                                text={`${g.sub}\nEQUIPES: ${g.teamsString}\nSPEC: ${g.engineSpec}\nPERK: ${g.fantasyPerk}`} 
                                                startDelay={150}
                                                onReadyForNext={() => {
                                                    if (stepNeeded < 3) {
                                                        setTimeout(() => setPageStep(stepNeeded + 1), 600);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                                            <span className="text-[#fbaa19] text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors animate-pulse">
                                                [ ESCOLHER {g.badge} ] »
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {errorMsg && (
                        <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded animate-fade-in">
                            [ERRO] {errorMsg}
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-6 w-full" />
                </div>
            )}

            {(phase === 'ENLIST' || phase === 'SUBMITTING_ENLIST') && selectedGroup && (
                <div className="relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-16 mb-16 px-4 font-mono">
                    <div className="w-full bg-black/80 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-6">
                        <div>
                            <p className="text-[#fbaa19] text-xs font-bold tracking-[0.2em] mb-3 uppercase">
                                DESPACHO CONFIDENCIAL DO DIRETOR [{ENGINE_FACTIONS[selectedGroup].badge}]
                            </p>
                            <div className="text-white text-base md:text-lg font-bold tracking-widest leading-relaxed border-l-2 border-[#fbaa19] pl-4 py-1 italic">
                                <TypewriterLine text={ENGINE_FACTIONS[selectedGroup].directorResponse} startDelay={250} onReadyForNext={() => setTypingComplete(true)} />
                            </div>
                        </div>
                        
                        <form onSubmit={handleEnlistSubmit} className={`flex flex-col gap-6 w-full mt-4 transition-opacity duration-1000 ${typingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {errorMsg && (
                                <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded">
                                    [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                                </div>
                            )}
                            
                            {phase === 'SUBMITTING_ENLIST' ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-8">
                                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase">&gt;_ EMITINDO SUPERLICENÇA & HOMOLOGANDO CONTRATO...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="flex flex-col w-full">
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="NOME E SOBRENOME DO PILOTO"
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
                                                placeholder="CANAL DE TELEMETRIA (E-MAIL)"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded placeholder-white/30 text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(251,170,25,0.4)]">
                                        [ EMITIR SUPERLICENÇA & ACESSAR PITWALL ]
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
