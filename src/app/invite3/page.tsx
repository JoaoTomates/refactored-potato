"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

type Step = 'DIALOG' | 'GROUP_SELECT' | 'ENLIST' | 'PROCESSING';

const TEAM_COLORS: Record<string, string> = {
    MCL: '#FF8000', MER: '#00D2BE', WIL: '#005AFF', ALP: '#FD4BC7',
    FER: '#DC0000', HAA: '#FFFFFF', CAD: '#C8A2C8',
    RBR: '#0600EF', RBA: '#2B4562', AST: '#229971', AUD: '#F50537'
};

const customDialogs = [
    "Puxe uma cadeira e feche a porta.",
    "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
    "Você lê o traçado antes das luzes apagarem.",
    "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar suas fichas.",
    "O novo regulamento deflagrou uma guerra de motores nos bastidores e três grandes alianças se formaram. Chegou a hora de escolher o seu lado."
];

const ENGINE_FACTIONS: Record<'A' | 'B' | 'C', any> = {
  A: {
    id: 'A',
    badge: 'CONSORCIO A',
    title: 'O Consórcio da Estrela (Bloco Mercedes)',
    sub: 'Engenharia Analítica, Confiabilidade de Aço & Domínio de Frota',
    engineSpec: 'Mercedes High Performance Powertrains 1.6L Hybrid',
    teams: ['MER', 'MCL', 'ALP', 'WIL'],
    fantasyPerk: 'BÔNUS DE CONSISTÊNCIA: +15% de XP em previsões de bandeiras quadriculadas duplas e pit stops sincronizados.',
    directorResponse: '“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”'
  },
  B: {
    id: 'B',
    badge: 'CONSORCIO B',
    title: 'A Dinastia de Maranello (Bloco Ferrari)',
    sub: 'Pressão Visceral, Potência de Pico & A Frente Americana',
    engineSpec: 'Scuderia Ferrari 067/3 Hybrid E-Turbo Architecture',
    teams: ['FER', 'HAA', 'CAD'],
    fantasyPerk: 'BÔNUS DE ÍMPETO: Pontuação dobrada em previsões arriscadas de pole position e voltas mais rápidas.',
    directorResponse: '“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a imprensa italiana te destrói.”'
  },
  C: {
    id: 'C',
    badge: 'CONSORCIO C',
    title: 'A Vanguarda dos Desafiantes (Ford, Honda & Audi)',
    sub: 'Risco Tecnológico Máximo, Projetos Proprietários & Ambição Sem Freio',
    engineSpec: 'Red Bull-Ford Powertrains / Honda HRC / Audi F1 PU',
    teams: ['RBR', 'RBA', 'AST', 'AUD'],
    fantasyPerk: 'BÔNUS DE CAOS: +25% de prestígio ao acertar zebras de safety car, abandonos e ultrapassagens do pelotão intermediário.',
    directorResponse: '“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”'
  }
};

function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
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
                i++;
                
                let delay = 30 + Math.random() * 20;
                if (char === '.' || char === '!' || char === '?') delay = 400;
                else if (char === ',') delay = 200;
                
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
        <span className="opacity-90 leading-relaxed relative">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

function InviteFlow3() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [step, setStep] = useState<Step>('LOADING');
    const [dialogIndex, setDialogIndex] = useState(0);
    const [readyFlags, setReadyFlags] = useState<Record<number, boolean>>({});
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
                    window.location.replace(`/${data.slug}`);
                    return;
                }
            }
            setStep('DIALOG');
        };
        
        checkUserStatus();
    }, [authLoading, user]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step]);

    const handleReadyForNext = (idx: number) => {
        setReadyFlags(prev => ({ ...prev, [idx]: true }));
    };

    const handleNextDialog = (idx: number) => {
        if (idx < customDialogs.length - 1) {
            setDialogIndex(idx + 1);
        } else {
            setStep('GROUP_SELECT');
        }
    };

    const handleSelectGroup = async (groupId: 'A' | 'B' | 'C') => {
        setSelectedGroup(groupId);
        setStep('PROCESSING');
        
        try {
            const { data, error } = await supabase.from('teams').select('*').eq('is_available', true);
            if (error) throw error;
            
            const groupData = ENGINE_FACTIONS[groupId];
            const groupTeams = data.filter(t => groupData.teams.includes(t.code));
            
            // Randomly select one team from the chosen alliance
            const randomTeam = groupTeams[Math.floor(Math.random() * groupTeams.length)];
            setSelectedTeamId(randomTeam.id);
            setStep('ENLIST');
        } catch (err) {
            console.error(err);
            setErrorMsg("ERRO NA CONEXÃO");
            setStep('GROUP_SELECT');
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
            setStep('ENLIST');
        }
    };

    const handleEnlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROCESSING');
        setErrorMsg("");

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

            if (authData.user && selectedTeamId) {
                const nameParts = fullName.trim().split(' ');
                const rawFirst = nameParts[0] || 'Rookie';
                const rawLast = nameParts.slice(1).join(' ') || 'Strategist';

                const cleanFirstName = rawFirst.charAt(0).toUpperCase();
                const cleanLastName = rawLast.toUpperCase();
                const generatedNumber = Math.floor(Math.random() * 99) + 1;
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${generatedNumber}`;

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
            setStep('ENLIST');
        }
    };

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center p-4 pt-16 pb-16">
            
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            <div className="relative z-10 w-full max-w-3xl flex flex-col gap-4">
                
                {/* Dialogue Sequence */}
                {step === 'DIALOG' && customDialogs.map((dialog, idx) => (
                    idx <= dialogIndex && (
                        <div key={idx} className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest">
                            <span className="opacity-50 mr-3 text-[#fbaa19]">&gt;_</span>
                            <TypewriterLine text={dialog} startDelay={150} onReadyForNext={() => handleReadyForNext(idx)} />
                            
                            {readyFlags[idx] && dialogIndex === idx && (
                                <div className="mt-5 flex justify-end animate-fade-in">
                                    <button 
                                        onClick={() => handleNextDialog(idx)} 
                                        className="text-[#fbaa19] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors animate-pulse"
                                    >
                                        {idx === customDialogs.length - 1 ? '[ ACESSAR ALIANÇAS ] »' : '[ CONTINUAR ] »'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                ))}

                {/* GROUP SELECT BOXES */}
                {step === 'GROUP_SELECT' && (
                    <div className="w-full flex flex-col gap-6 animate-fade-in">
                        <p className="text-[#fbaa19] font-bold tracking-[0.2em] uppercase text-center bg-black/80 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg p-4 shadow-2xl text-xs md:text-sm">
                            CONEXÃO ESTABELECIDA. DECODIFICANDO DADOS DE ALIANÇA...
                        </p>
                        
                        {(['A', 'B', 'C'] as const).map((groupId) => {
                            const g = ENGINE_FACTIONS[groupId];
                            return (
                                <div 
                                    key={g.id} 
                                    className="w-full bg-black/80 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl p-6 md:p-8 cursor-pointer hover:border-[#fbaa19] hover:bg-black/90 transition-all group"
                                    onClick={() => handleSelectGroup(groupId)}
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <span className="text-[#fbaa19] text-xs font-black tracking-widest uppercase mb-1 block">
                                                    [{g.badge}]
                                                </span>
                                                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-[#fbaa19] transition-colors">
                                                    {g.title}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-2 shrink-0">
                                                {g.teams.map((tCode: string) => (
                                                    <div key={tCode} className="w-7 h-7 md:w-8 md:h-8 rounded-sm border border-white/20 flex items-center justify-center text-[9px] font-black shadow-inner" style={{backgroundColor: TEAM_COLORS[tCode] || '#333', color: '#fff'}}>
                                                        {tCode}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <p className="text-white/70 text-xs md:text-sm font-bold tracking-widest uppercase mt-2">
                                            &gt;_ {g.sub}
                                        </p>
                                        
                                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                                            <p className="text-[10px] md:text-xs text-[#fbaa19]/80 font-mono">
                                                <strong className="text-white">SPEC:</strong> {g.engineSpec}
                                            </p>
                                            <p className="text-[10px] md:text-xs text-[#fbaa19]/80 font-mono">
                                                <strong className="text-white">PERK:</strong> {g.fantasyPerk}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ENLIST BOX */}
                {step === 'ENLIST' && selectedGroup && (
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
                        </form>
                    </div>
                )}

                {/* PROCESSING */}
                {step === 'PROCESSING' && (
                    <div className="w-full bg-black/80 p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col items-center justify-center gap-6 h-64">
                        <div className="w-16 h-16 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[#fbaa19] font-bold tracking-widest uppercase">&gt;_ INICIALIZANDO SUPERLICENÇA...</p>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4 w-full" />
            </div>
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
