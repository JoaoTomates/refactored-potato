const fs = require('fs');

const content = `"use client";

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

type Phase = 'LOADING' | 'INTRO' | 'AUTO_DIALOG' | 'GROUP_SELECT' | 'FETCHING_TEAM' | 'ENLIST' | 'SUBMITTING_ENLIST';

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
    sub: 'Confiabilidade de Aço & Domínio de Frota',
    engineSpec: 'Mercedes V6 Hybrid',
    teamsString: 'Mercedes-AMG • McLaren • Alpine • Williams',
    teams: ['MER', 'MCL', 'ALP', 'WIL'],
    fantasyPerk: '+15% XP em previsões de consistência.',
    directorResponse: '“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”'
  },
  B: {
    id: 'B',
    badge: 'BLOCO B',
    title: 'A DINASTIA DE MARANELLO',
    sub: 'Potência de Pico & A Frente Americana',
    engineSpec: 'Ferrari 067/3 Hybrid E-Turbo',
    teamsString: 'Scuderia Ferrari • Haas • Cadillac',
    teams: ['FER', 'HAA', 'CAD'],
    fantasyPerk: '2x XP em apostas arriscadas de pole.',
    directorResponse: '“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a imprensa italiana te destrói.”'
  },
  C: {
    id: 'C',
    badge: 'BLOCO C',
    title: 'OS DESAFIANTES',
    sub: 'Risco Tecnológico & Ambição',
    engineSpec: 'Ford / Honda / Audi PU',
    teamsString: 'Red Bull • Racing Bulls • Aston Martin • Audi',
    teams: ['RBR', 'RBA', 'AST', 'AUD'],
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
                
                if (char !== ' ' && char !== '\\n') {
                    retroSound.playKeyClick(char);
                }
                
                i++;
                
                let delay = fastMode ? (10 + Math.random() * 10) : (40 + Math.random() * 30); 
                if (char === '.' || char === '!' || char === '?') delay = fastMode ? 100 : 400;
                else if (char === ',' || char === '\\n') delay = fastMode ? 50 : 200;
                
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

function InviteFlow3() {
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
                    window.location.replace(\`/\${data.slug}\`);
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
    };

    const handleSelectGroup = async (groupId: 'A' | 'B' | 'C') => {
        if (!groupReadyFlags[groupId]) return; 
        
        retroSound.init();
        setSelectedGroup(groupId);
        setPhase('FETCHING_TEAM');
        setErrorMsg("");
        
        try {
            const { data, error } = await supabase.from('teams').select('*');
            if (error) throw error;
            
            const groupData = ENGINE_FACTIONS[groupId];
            
            let groupTeams = data.filter(t => groupData.teams.includes(t.code) && t.is_available);
            if (groupTeams.length === 0) {
                groupTeams = data.filter(t => groupData.teams.includes(t.code));
            }
            
            if (groupTeams.length === 0) {
                throw new Error("Não há equipes cadastradas para esse bloco.");
            }
            
            const randomTeam = groupTeams[Math.floor(Math.random() * groupTeams.length)];
            setSelectedTeamId(randomTeam.id);
            setPhase('ENLIST');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO NA CONEXÃO");
            setPhase('GROUP_SELECT');
        }
    };

    const signInitialContract = async (teamId: string, slug?: string) => {
        try {
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamId });
            if (rpcError) throw rpcError;
            
            if (slug) {
                window.location.href = \`/\${slug}\`;
            } else {
                const { data } = await supabase.from('profiles').select('slug').eq('id', user!.id).single();
                window.location.href = \`/\${data?.slug || 'superlicense'}\`;
            }
        } catch (err: any) {
            console.error('RPC Error:', err);
            setErrorMsg("FALHA NA ASSINATURA");
            setPhase('ENLIST');
        }
    };

    const handleEnlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        retroSound.init();
        setPhase('SUBMITTING_ENLIST');
        setErrorMsg("");

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = \`\${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app\`; 
            }

            const autoPassword = 'Volt' + Math.random().toString(36).slice(-6) + '!';

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password: autoPassword 
            });

            if (authError) throw authError;

            if (authData.user && selectedTeamId) {
                const nameParts = fullName.trim().split(' ');
                const rawFirst = nameParts[0] || 'Rookie';
                const rawLast = nameParts.slice(1).join(' ') || 'Strategist';

                const cleanFirstName = rawFirst.charAt(0).toUpperCase();
                const cleanLastName = rawLast.toUpperCase();
                const generatedNumber = Math.floor(Math.random() * 99) + 1;
                const slug = \`@\${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}\${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}\${generatedNumber}\`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true, 
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: '#000000',
                        setup_completed: true,
                        slug: slug
                    });
                }
                
                await signInitialContract(selectedTeamId, slug);
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
                    
                    {(['A', 'B', 'C'] as const).map((groupId, idx) => {
                        if (idx > groupIndex) return null;
                        
                        const g = ENGINE_FACTIONS[groupId];
                        // Integramos os nomes das equipes diretamente no texto typewriter para manter tudo no mesmo padrão limpo
                        const fullText = \`[\${g.badge}] \${g.title}\\n> \${g.sub}\\n> EQUIPES: \${g.teamsString}\\n> SPEC: \${g.engineSpec}\\n> PERK: \${g.fantasyPerk}\`;
                        const isReady = groupReadyFlags[groupId];

                        return (
                            <div 
                                key={g.id} 
                                className={\`w-full bg-black/80 backdrop-blur-sm border rounded-lg shadow-2xl p-4 md:p-5 animate-fade-in transition-all \${isReady ? 'cursor-pointer border-[#fbaa19]/30 hover:border-[#fbaa19] hover:bg-black/90 group' : 'border-white/10'}\`}
                                onClick={() => handleSelectGroup(groupId)}
                            >
                                <div className="text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed">
                                    <TypewriterLine 
                                        text={fullText} 
                                        startDelay={100} 
                                        fastMode={true}
                                        onReadyForNext={() => {
                                            setGroupReadyFlags(prev => ({...prev, [groupId]: true}));
                                            if (idx < 2) {
                                                setTimeout(() => setGroupIndex(idx + 1), 400);
                                            }
                                        }}
                                    />
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
                        &gt;_ NEGOCIANDO CONTRATO...
                    </p>
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
                        
                        <form onSubmit={handleEnlistSubmit} className={\`flex flex-col gap-6 w-full mt-4 transition-opacity duration-1000 \${typingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}>
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
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="NOME E SOBRENOME"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded placeholder-white/30 text-sm"
                                        />
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="E-MAIL"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black/50 border border-white/20 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] transition-all rounded placeholder-white/30 text-sm"
                                        />
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

export default function Invite3PageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow3 />
        </Suspense>
    );
}
`;

fs.writeFileSync('src/app/invite3/page.tsx', content);
console.log('Successfully applied dialogue text adjustments and replaced team badges with text strings.');
