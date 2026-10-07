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
        } catch (_) { }
    }
}

const retroSound = new PitWallSoundEngine();

type Phase = 'LOADING' | 'INTRO' | 'AUTO_DIALOG' | 'OFFERS' | 'BRIEFING' | 'SUBMITTING_ENLIST';

interface TeamOffer {
    id: string;
    name: string;
    code: string;
    color: string;
    occupied: number;
    engineSpec: string;
    perk: string;
    description: string;
    seatTitle: string;
    groupName: string;
    groupId: number;
}

const TEAM_SPECS: Record<string, { engineSpec: string; perk: string; description: string; seatTitle: string }> = {
    MER: {
        engineSpec: 'Mercedes-AMG M16 E Performance V6 Turbo Hybrid',
        perk: '+15% de rendimento em previsões de consistência cirúrgica de corrida.',
        description: 'A matriz alemã de Brackley. Máxima cobrança por perfeição matemática, ritmo implacável e confiabilidade de aço.',
        seatTitle: 'ESTRATEGISTA CHEFE MERCEDES'
    },
    MCL: {
        engineSpec: 'Mercedes M16 High Performance Customer PU',
        perk: '+15% de bônus em previsões de volta mais rápida e top speed.',
        description: 'O time de Woking em ascensão meteórica. Exige decisões agressivas de pitwall e arrojo nas ultrapassagens.',
        seatTitle: 'ESTRATEGISTA CHEFE McLAREN'
    },
    ALP: {
        engineSpec: 'Mercedes High Output Customer Specification',
        perk: '+20% de rendimento ao acertar estratégias alternativas de undercut.',
        description: 'A esquadra de Enstone em reformulação tática com motores da estrela para retomar o pelotão da frente.',
        seatTitle: 'ESTRATEGISTA CHEFE ALPINE'
    },
    WIL: {
        engineSpec: 'Mercedes-AMG V6 Turbo Hybrid Standard Spec',
        perk: '+25% de retorno em apostas de azarão e disputas no pelotão intermediário.',
        description: 'A lendária garagem britânica de Grove com alta eficiência em retas e sede de retomada histórica.',
        seatTitle: 'ESTRATEGISTA CHEFE WILLIAMS'
    },
    FER: {
        engineSpec: 'Ferrari 067/3 Hybrid E-Turbo Speciale',
        perk: 'Bônus dobrado (2x) em apostas arriscadas de Pole Position (Poletime).',
        description: 'A mística sagrada de Maranello. Tolerância zero ao erro estratégico sob a vigilância obsessiva dos tifosi.',
        seatTitle: 'ESTRATEGISTA CHEFE FERRARI'
    },
    HAA: {
        engineSpec: 'Ferrari 067/3 Customer Powertrain Package',
        perk: '+20% de rendimento em antecipação de Safety Car e estratégias de largada.',
        description: 'Operação pragmática ítalo-americana focada em ataques cirúrgicos e pontuações em janelas caóticas.',
        seatTitle: 'ESTRATEGISTA CHEFE HAAS'
    },
    CAD: {
        engineSpec: 'Cadillac-Ferrari Powertrain Joint Venture',
        perk: '+25% de rendimento em primeiras voltas e duelos roda a roda.',
        description: 'A nova potência americana desembarcando no paddock com o suporte de Maranello para desafiar os gigantes.',
        seatTitle: 'ESTRATEGISTA CHEFE CADILLAC'
    },
    RBR: {
        engineSpec: 'Red Bull Ford Powertrains V6 Hybrid PU',
        perk: '+25% de rendimento ao antecipar cenários de caos e paradas relâmpago.',
        description: 'Milton Keynes e a máquina impiedosa de vitórias. Exige postura predatória na leitura de telemetria.',
        seatTitle: 'ESTRATEGISTA CHEFE RED BULL'
    },
    RBA: {
        engineSpec: 'Red Bull Ford Powertrains Spec-B Development PU',
        perk: '+20% de bônus na evolução de posições entre largada e chegada.',
        description: 'A divisão dinâmica de Faenza especializada em forjar táticas inovadoras no coração do grid.',
        seatTitle: 'ESTRATEGISTA CHEFE RACING BULLS'
    },
    AST: {
        engineSpec: 'AMR-Honda Factory Works Turbo Hybrid',
        perk: '+15% de rendimento na gestão cirúrgica de desgaste de pneus.',
        description: 'Silverstone aliada à disciplina de ponta da engenharia japonesa da Honda para desafiar o topo do mundo.',
        seatTitle: 'ESTRATEGISTA CHEFE ASTON MARTIN'
    },
    AUD: {
        engineSpec: 'Audi F1 PowerUnit Prototype V6 Hybrid',
        perk: '+30% de rendimento em corridas sob chuva ou condições climáticas mutáveis.',
        description: 'A gigante de Ingolstadt invadindo a Fórmula 1 com engenharia do zero e ambição implacável de domínio.',
        seatTitle: 'ESTRATEGISTA CHEFE AUDI'
    }
};

const customDialogs = [
    "Puxe uma cadeira e feche a porta.",
    "Os relatórios da sua telemetria caíram na minha mesa. Seus números são impressionantes.",
    "Você decifra o traçado antes mesmo das luzes vermelhas se apagarem.",
    "Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid e exigem lealdade absoluta.",
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
        sub: '"Potência Máxima & A Frente Ítalo-Americana"',
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
    const [selectedTeam, setSelectedTeam] = useState<TeamOffer | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedTeamColor, setSelectedTeamColor] = useState<string>('#000000');
    const [offeredTeams, setOfferedTeams] = useState<TeamOffer[]>([]);
    const [activeGroupName, setActiveGroupName] = useState<string>("Grupo 1 (G. Farina)");
    const [isFetchingOffers, setIsFetchingOffers] = useState<boolean>(false);

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

    const handleSelectAlliance = async (groupId: 'A' | 'B' | 'C') => {
        retroSound.init();
        setSelectedGroup(groupId);
        setErrorMsg("");
        setIsFetchingOffers(true);

        try {
            // 1. Busca o grupo que está recebendo pilotos atualmente
            const { data: activeGroupData } = await supabase
                .from('groups')
                .select('*')
                .eq('is_filling', true)
                .maybeSingle();

            const group = activeGroupData || { id: 1, name: 'G. Farina' };
            const gName = group.name ? `Grupo ${group.id} (${group.name})` : `Grupo ${group.id}`;
            setActiveGroupName(gName);

            // 2. Busca contratos ocupados no grupo ativo
            const { data: contractsData } = await supabase
                .from('contracts')
                .select('team_id')
                .eq('group_id', group.id);

            const occupiedCounts: Record<string, number> = {};
            (contractsData || []).forEach((c: any) => {
                occupiedCounts[c.team_id] = (occupiedCounts[c.team_id] || 0) + 1;
            });

            // 3. Busca equipes cadastradas no banco
            const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
            if (teamsError) throw teamsError;

            const factionCodes = ENGINE_FACTIONS[groupId].teams;
            const factionTeamObjs = (teamsData || []).filter((t: any) => factionCodes.includes(t.code));

            // 4. Mapeia as ofertas com especificações completas de telemetria
            const offersList: TeamOffer[] = factionTeamObjs.map((t: any) => {
                const spec = TEAM_SPECS[t.code] || {
                    engineSpec: ENGINE_FACTIONS[groupId].engineSpec,
                    perk: ENGINE_FACTIONS[groupId].fantasyPerk,
                    description: `Garagem oficial da aliança ${ENGINE_FACTIONS[groupId].badge}.`,
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

            // 5. Filtra equipes que possuem pelo menos 1 vaga aberta (< 2)
            let openOffers = offersList.filter(o => o.occupied < 2);
            if (openOffers.length === 0) {
                openOffers = offersList;
            }

            // Seleciona exatamente duas propostas oficiais
            const shuffled = [...openOffers].sort(() => 0.5 - Math.random());
            const twoProposals = shuffled.slice(0, 2);

            setOfferedTeams(twoProposals);
            localStorage.setItem('draft_alliance', groupId);

            // Zera a tela com transição cinematográfica e abre a vitrine de propostas
            setIsPageClearing(true);
            setTimeout(() => {
                setPhase('OFFERS');
                setIsPageClearing(false);
                if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 300);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "ERRO AO CARREGAR OFERTAS DO GRID");
        } finally {
            setIsFetchingOffers(false);
        }
    };

    const handleViewOffer = (offer: TeamOffer) => {
        retroSound.init();
        setSelectedTeam(offer);
        setSelectedTeamId(offer.id);
        setSelectedTeamColor(offer.color);
        localStorage.setItem('draft_team_id', offer.id);

        setIsPageClearing(true);
        setTimeout(() => {
            setTypingComplete(false);
            setPhase('BRIEFING');
            setIsPageClearing(false);
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 300);
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
            } catch (_) { }

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
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-4 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 ${isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
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
                                        onClick={() => handleSelectAlliance(groupId)}
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

            {/* FASE OFFERS: Apresentação das DUAS PROPOSTAS OFICIAIS com vagas disponíveis */}
            {phase === 'OFFERS' && selectedGroup && (
                <div className={`relative z-10 w-full max-w-4xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 transition-all duration-300 font-mono ${
                    isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}>
                    {/* Header do Terminal / Stock Exchange Noir */}
                    <div className="bg-black/85 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg p-5 md:p-8 shadow-2xl flex flex-col gap-3 animate-fade-in">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <span className="text-[#fbaa19] text-xs font-black tracking-[0.2em] uppercase">
                                &gt;_ SISTEMA DE ALOCAÇÃO DE GRID // {activeGroupName.toUpperCase()}
                            </span>
                            <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30 px-2.5 py-0.5 rounded bg-emerald-950/30">
                                ● PREGÃO: ABERTO • ORDENS EM DISPUTA
                            </span>
                        </div>

                        <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-widest">
                            PROPOSTAS DE VAGA NO PITWALL [{ENGINE_FACTIONS[selectedGroup].badge}]
                        </h2>

                        <p className="text-gray-300 text-xs md:text-sm italic border-l-2 border-[#fbaa19] pl-3 py-0.5">
                            {ENGINE_FACTIONS[selectedGroup].sub}
                        </p>

                        <p className="text-white/70 text-xs font-mono leading-relaxed mt-1">
                            <span className="text-[#fbaa19] font-bold">&gt; -</span> O regulamento oficial correlaciona cada garagem real a 2 assentos estratégicos no {activeGroupName}. Analise as duas propostas oficiais homologadas abaixo e examine os termos operacionais:
                        </p>
                    </div>

                    {/* Grid com as DUAS PROPOSTAS OFICIAIS DE EQUIPES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {offeredTeams.map((teamOffer) => {
                            const availableSpots = Math.max(0, 2 - teamOffer.occupied);
                            return (
                                <div 
                                    key={teamOffer.id}
                                    className="bg-black/85 backdrop-blur-sm border border-white/15 hover:border-[#fbaa19] rounded-lg p-6 shadow-2xl flex flex-col justify-between gap-5 transition-all group relative overflow-hidden animate-fade-in"
                                >
                                    {/* Faixa superior de acento com a cor oficial da escuderia */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamOffer.color }} />

                                    {/* Topo: Emblema e Nome */}
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

                                    {/* Descrição tática da garagem */}
                                    <p className="text-xs text-gray-300 italic border-l-2 border-white/20 pl-3 leading-relaxed">
                                        "{teamOffer.description}"
                                    </p>

                                    {/* Tabela de Telemetria e Mercado (Estilo Bloomberg / Wall Street do Paddock) */}
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
                                        <div className="flex flex-col p-2.5 gap-1">
                                            <span className="text-gray-400 uppercase tracking-widest text-[10px]">PERK DE OPERAÇÃO</span>
                                            <span className="text-white text-[11px] leading-relaxed">{teamOffer.perk}</span>
                                        </div>
                                    </div>

                                    {/* Botão Oficial: [ VER OFERTA ] » */}
                                    <button
                                        onClick={() => handleViewOffer(teamOffer)}
                                        className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.15em] text-xs p-3.5 rounded hover:bg-white hover:shadow-[0_0_15px_rgba(251,170,25,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        [ VER OFERTA ] »
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Botão de Retorno */}
                    <div className="flex justify-start pt-2">
                        <button
                            onClick={() => {
                                setIsPageClearing(true);
                                setTimeout(() => {
                                    setPhase('AUTO_DIALOG');
                                    setDialogPage(3);
                                    setPageStep(3);
                                    setIsPageClearing(false);
                                }, 250);
                            }}
                            className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            « [ VOLTAR E ESCOLHER OUTRA ALIANÇA ]
                        </button>
                    </div>
                </div>
            )}

            {/* FASE BRIEFING: Despacho do Diretor, Briefing das Competições e Homologação */}
            {(phase === 'BRIEFING' || phase === 'SUBMITTING_ENLIST') && selectedGroup && selectedTeam && (
                <div className={`relative z-10 w-full max-w-3xl flex flex-col gap-6 mt-12 md:mt-16 mb-24 px-4 font-mono transition-all duration-300 ${
                    isPageClearing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}>
                    <div className="w-full bg-black/85 p-6 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-6">
                        
                        {/* Topo do Briefing: Identificação da Aliança e Escuderia */}
                        <div className="border-b border-white/10 pb-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[#fbaa19] text-xs font-bold tracking-[0.2em] uppercase">
                                    DESPACHO CONFIDENCIAL DO DIRETOR [{ENGINE_FACTIONS[selectedGroup].badge}]
                                </span>
                                <span 
                                    className="px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border border-white/20 text-white"
                                    style={{ backgroundColor: selectedTeam.color }}
                                >
                                    {selectedTeam.name}
                                </span>
                            </div>
                            <div className="text-white text-base md:text-lg font-bold tracking-widest leading-relaxed border-l-2 border-[#fbaa19] pl-4 py-1 italic">
                                <TypewriterLine text={ENGINE_FACTIONS[selectedGroup].directorResponse} startDelay={250} onReadyForNext={() => setTypingComplete(true)} />
                            </div>
                        </div>

                        {/* Briefing Tático Operacional das Competições */}
                        <div className="bg-black/60 border border-white/10 rounded-lg p-5 flex flex-col gap-3 text-xs leading-relaxed">
                            <p className="text-[#fbaa19] font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                                <span>&gt; -</span> BRIEFING TÁTICO OPERACIONAL // REGULAMENTO DA LIGA MASTER
                            </p>
                            <div className="flex flex-col gap-2.5 text-gray-300">
                                <p>
                                    <strong className="text-white">1. SISTEMA MASTER FANTASY:</strong> Sua pontuação e patrimônio na temporada dependem da precisão com que você prevê posições de chegada, consistência e pitstops reais durante cada Grande Prêmio.
                                </p>
                                <p>
                                    <strong className="text-white">2. DUELOS DE POLETIME:</strong> Nas sextas e sábados de classificação, acertar a volta mais rápida da pole position aciona bônus multiplicadores de rendimento operacional.
                                </p>
                                <p>
                                    <strong className="text-white">3. ALOCAÇÃO NO GRID:</strong> Você assumirá o posto oficial na garagem da <span className="text-white font-bold">{selectedTeam.name}</span> no <span className="text-[#fbaa19] font-bold">{selectedTeam.groupName}</span>, competindo diretamente contra os outros 21 estrategistas do grid.
                                </p>
                            </div>
                        </div>

                        {/* Formulário de Emissão da Superlicença e Homologação */}
                        <form onSubmit={handleEnlistSubmit} className={`flex flex-col gap-6 w-full transition-opacity duration-1000 ${typingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {errorMsg && (
                                <div className="text-red-500 font-bold uppercase tracking-widest text-sm bg-red-900/20 border border-red-500/50 p-3 rounded">
                                    [FALHA DE HOMOLOGAÇÃO] {errorMsg}
                                </div>
                            )}

                            {phase === 'SUBMITTING_ENLIST' ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-8">
                                    <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">
                                        &gt;_ EMITINDO SUPERLICENÇA & HOMOLOGANDO CONTRATO NA {selectedTeam.name.toUpperCase()}...
                                    </p>
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

                                    <button 
                                        type="submit" 
                                        className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm"
                                    >
                                        [ EMITIR SUPERLICENÇA & ASSINAR CONTRATO COM A {selectedTeam.name.toUpperCase()} ]
                                    </button>

                                    <div className="flex justify-between items-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsPageClearing(true);
                                                setTimeout(() => {
                                                    setPhase('OFFERS');
                                                    setIsPageClearing(false);
                                                }, 250);
                                            }}
                                            className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            « [ ANALISAR OUTRA PROPOSTA ]
                                        </button>
                                    </div>
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
