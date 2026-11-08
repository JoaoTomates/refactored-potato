"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SENIOR_STRATEGISTS, SeniorStrategist, getSeniorStrategistForRound } from '@/lib/race-directors';
import { 
    TechnicalStrategist, 
    getActiveTechnicalStrategist, 
    AllianceCode 
} from '@/lib/technical-strategists';
import { ChevronLeft, ArrowRight, Check } from 'lucide-react';

// --- PitWall Sound Engine (Cliques táteis da sala de estratégia) ---
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

const soundEngine = new PitWallSoundEngine();

function TypewriterLine({ 
    text, 
    onComplete, 
    startDelay = 100, 
    speed = 18 
}: { 
    text: string; 
    onComplete?: () => void; 
    startDelay?: number; 
    speed?: number; 
}) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbackRef = useRef(onComplete);

    useEffect(() => {
        callbackRef.current = onComplete;
    }, [onComplete]);

    const finishImmediately = useRef(() => {
        setIsTyping(false);
        setDisplayed(text);
        if (callbackRef.current) callbackRef.current();
    });

    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;

        finishImmediately.current = () => {
            if (isCancelled) return;
            isCancelled = true;
            clearTimeout(timeoutId);
            setIsTyping(false);
            setDisplayed(text);
            if (callbackRef.current) callbackRef.current();
        };

        setDisplayed("");
        setIsTyping(true);

        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);

                if (char !== ' ' && char !== '\n') {
                    soundEngine.playKeyClick(char);
                }

                i++;

                let delay = speed;
                if (char === '.' || char === '!' || char === '?') delay = speed * 8;
                else if (char === ',' || char === '\n' || char === ':') delay = speed * 4;

                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbackRef.current) callbackRef.current();
            }
        };

        timeoutId = setTimeout(typeNext, startDelay);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay, speed]);

    return (
        <span 
            onClick={() => {
                if (isTyping) finishImmediately.current();
            }}
            className="leading-relaxed relative whitespace-pre-wrap cursor-pointer"
            title={isTyping ? "Clique para exibir o texto completo" : undefined}
        >
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block">■</span>}
        </span>
    );
}

// --- Definição das 3 Cores por Aliança ---
// Cor 1: Sênior (#fbaa19 - Amarelo Frank Miller Noir)
// Cor 2: Técnico da Aliança (A: Cyan #00d2be, B: Vermelho #e8002d, C: Azul #38bdf8)
// Cor 3: Homologado / Sucesso (#10b981 - Verde Esmeralda)
interface AllianceTheme {
    allianceName: string;
    badge: string;
    seniorColor: string;
    techColor: string;
    statusColor: string;
    techGlow: string;
}

const ALLIANCE_THEMES: Record<AllianceCode, AllianceTheme> = {
    A: {
        allianceName: 'CONSÓRCIO DA ESTRELA',
        badge: 'BLOCO A',
        seniorColor: '#fbaa19',
        techColor: '#00d2be',   // Cyan Petronas / Mercedes
        statusColor: '#10b981',
        techGlow: 'rgba(0, 210, 190, 0.45)'
    },
    B: {
        allianceName: 'A DINASTIA DE MARANELLO',
        badge: 'BLOCO B',
        seniorColor: '#fbaa19',
        techColor: '#e8002d',   // Vermelho Ferrari
        statusColor: '#10b981',
        techGlow: 'rgba(232, 0, 45, 0.45)'
    },
    C: {
        allianceName: 'A VANGUARDA TECNOLÓGICA',
        badge: 'BLOCO C',
        seniorColor: '#fbaa19',
        techColor: '#38bdf8',   // Azul Cibernético / Red Bull
        statusColor: '#10b981',
        techGlow: 'rgba(56, 189, 248, 0.45)'
    }
};

interface BoxCardProps {
    speakerBadge: string;
    speakerRole: string;
    categoryTag: string;
    text: string;
    accentColor: string;
    accentGlow?: string;
    isActive: boolean;
    isSettled?: boolean;
    settledLabel?: string;
    isFilled?: boolean;
    onOk?: () => void;
    onFill?: () => void;
    fillLabel?: string;
    okLabel?: string;
}

// Componente individual de Box Text:
// - Fiel ao estilo da imagem anexada:
// - Cantos arredondados (rounded-2xl)
// - Fundo obsidiana translúcido com backdrop-blur
// - Barra vertical neon na borda esquerda
// - Borda suave com brilho colorido
function BoxCard({
    speakerBadge,
    speakerRole,
    categoryTag,
    text,
    accentColor,
    accentGlow,
    isActive,
    isSettled = false,
    settledLabel,
    isFilled = false,
    onOk,
    onFill,
    fillLabel,
    okLabel = 'OK'
}: BoxCardProps) {
    const cardColor = isFilled ? '#10b981' : accentColor;
    const cardGlow = isFilled ? 'rgba(16, 185, 129, 0.4)' : (accentGlow || `${accentColor}40`);

    return (
        <div 
            className={`relative w-full rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-500 backdrop-blur-md flex items-stretch gap-4 md:gap-5 shadow-2xl border ${
                isActive ? 'opacity-100 scale-100' : 'opacity-85 scale-[0.99]'
            }`}
            style={{
                backgroundColor: isFilled ? 'rgba(8, 20, 15, 0.94)' : 'rgba(11, 13, 18, 0.92)',
                borderColor: `${cardColor}40`,
                boxShadow: `0 12px 35px -10px ${cardGlow}, 0 0 1px 1px ${cardColor}30`
            }}
        >
            {/* BARRA VERTICAL NEON NA LATERAL ESQUERDA (ESTILO EXATO DO BANNER) */}
            <div 
                className="w-1.5 self-stretch rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                    backgroundColor: cardColor,
                    boxShadow: `0 0 14px ${cardColor}, 0 0 4px ${cardColor}`
                }}
            />

            {/* CONTEÚDO PRINCIPAL DO DIÁLOGO */}
            <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <span 
                            className="text-xs sm:text-sm font-black uppercase tracking-wider"
                            style={{ color: cardColor }}
                        >
                            {speakerBadge}
                        </span>
                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                            // {speakerRole}
                        </span>
                    </div>

                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                        {categoryTag}
                    </span>
                </div>

                {/* Texto da fala */}
                <div className="text-white text-xs sm:text-sm font-semibold tracking-wide leading-relaxed py-1 min-h-[50px]">
                    {isActive ? (
                        <TypewriterLine text={text} startDelay={100} />
                    ) : (
                        <span>{text}</span>
                    )}
                </div>

                {/* Ações interativas da rodada atual */}
                <div className="mt-1 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                    {/* Se já foi resolvido em etapa anterior, mostra apenas o badge fixado */}
                    {isSettled ? (
                        <div 
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold"
                            style={{ 
                                color: isFilled ? '#10b981' : '#ffffff80',
                                backgroundColor: isFilled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                border: isFilled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {isFilled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{settledLabel || (isFilled ? 'HOMOLOGADO NO PROTOCOLO' : 'OK REGISTRADO')}</span>
                        </div>
                    ) : (
                        <>
                            {onOk && (
                                <button
                                    type="button"
                                    onClick={onOk}
                                    className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                >
                                    [ {okLabel} ]
                                </button>
                            )}

                            {onFill && fillLabel && (
                                <button
                                    type="button"
                                    onClick={onFill}
                                    className="px-4 py-2 rounded-lg font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 text-xs text-black hover:opacity-95"
                                    style={{
                                        backgroundColor: cardColor,
                                        boxShadow: `0 0 16px ${cardColor}50`
                                    }}
                                >
                                    <span>{fillLabel}</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Estados possíveis do fluxo dinâmico:
// 1: Sênior abre Poletime
// 2A: Técnico inicia TOP 10 (porque o usuário preencheu o formulário com o Sênior sem contradição)
// 3A: Sênior contra-argumenta TOP 10 (se usuário clicou OK no 2A)
// 2B: Técnico sugere novo tempo de Poletime (porque o usuário deu apenas OK no Sênior)
// 3B: Sênior inicia TOP 10 (após poletime resolvido no 2B)
// 4B: Técnico sugere novo TOP 10 (se usuário clicou OK no 3B)
// 5: Conclusão & Transmissão Final para /positions
type StageKey = '1_SENIOR_POLE' | '2A_TECH_TOP10' | '3A_SENIOR_TOP10' | '2B_TECH_POLE' | '3B_SENIOR_TOP10' | '4B_TECH_TOP10' | '5_FINAL';

function WarRoomContent() {
    const router = useRouter();
    const { user } = useSupabaseAuth();

    // Aliança e Equipe
    const [userAlliance, setUserAlliance] = useState<AllianceCode>('B');
    const [userTeamCode, setUserTeamCode] = useState<string>('FER');
    
    // Personagens da Mesa
    const [seniorStrategist, setSeniorStrategist] = useState<SeniorStrategist>(SENIOR_STRATEGISTS[0]);
    const [technicalStrategist, setTechnicalStrategist] = useState<TechnicalStrategist | null>(null);

    // Estado da máquina de diálogo
    const [stage, setStage] = useState<StageKey>('1_SENIOR_POLE');

    // Dados salvos
    const [chosenPoletime, setChosenPoletime] = useState<string | null>(null);
    const [chosenPoletimeSource, setChosenPoletimeSource] = useState<'senior' | 'tech' | null>(null);
    const [chosenTop10, setChosenTop10] = useState<string[] | null>(null);
    const [chosenTop10Source, setChosenTop10Source] = useState<'senior' | 'tech' | null>(null);

    // Histórico de decisões para manter os cards anteriores fixados sem sobreposição
    const [seniorPoleSettled, setSeniorPoleSettled] = useState<{ filled: boolean; text: string } | null>(null);
    const [techPoleSettled, setTechPoleSettled] = useState<{ filled: boolean; text: string } | null>(null);
    const [seniorTop10Settled, setSeniorTop10Settled] = useState<{ filled: boolean; text: string } | null>(null);
    const [techTop10Settled, setTechTop10Settled] = useState<{ filled: boolean; text: string } | null>(null);

    // Ref para auto-scroll suave sempre que um novo card surgir
    const bottomMarkerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        soundEngine.init();

        const loadProfile = async () => {
            let allianceKey: AllianceCode = 'B';
            let teamCode = 'FER';

            if (user) {
                const { data: contract } = await supabase
                    .from('contracts')
                    .select('team_id, teams(code, color), group_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (contract) {
                    const t = Array.isArray(contract.teams) ? contract.teams[0] : contract.teams;
                    if (t?.code) teamCode = t.code;

                    if (['MER', 'MCL', 'ALP', 'WIL'].includes(teamCode)) allianceKey = 'A';
                    else if (['FER', 'HAA', 'CAD'].includes(teamCode)) allianceKey = 'B';
                    else allianceKey = 'C';
                }
            }

            setUserAlliance(allianceKey);
            setUserTeamCode(teamCode);

            const senior = getSeniorStrategistForRound(2);
            setSeniorStrategist(senior);

            const tech = getActiveTechnicalStrategist(user?.id || 'guest', teamCode, allianceKey);
            setTechnicalStrategist(tech);
        };

        loadProfile();
    }, [user]);

    // Scroll suave para o final da prancheta ao avançar de etapa
    useEffect(() => {
        const timer = setTimeout(() => {
            bottomMarkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
        return () => clearTimeout(timer);
    }, [stage]);

    const theme = ALLIANCE_THEMES[userAlliance] || ALLIANCE_THEMES['B'];
    const seniorTimeTarget = seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209';
    const techTimeTarget = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';

    const saveDraft = (pole: string | null, top10: string[] | null) => {
        if (typeof window === 'undefined') return;
        const currentDraftRaw = localStorage.getItem('war_room_draft');
        let currentDraft: any = {};
        try {
            if (currentDraftRaw) currentDraft = JSON.parse(currentDraftRaw);
        } catch (_) {}

        const updated = {
            ...currentDraft,
            poletime: pole || currentDraft.poletime || '1:12.209',
            top10: top10 || currentDraft.top10 || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('war_room_draft', JSON.stringify(updated));
    };

    // ==========================================
    // TRANSIÇÕES DINÂMICAS DE DIÁLOGO
    // ==========================================

    // ETAPA 1: Sênior fala Poletime
    // Se "preencher formulário" -> Engenheiro técnico inicia TOP 10 sem contrariar o chefe (Branch A)
    const handleSeniorPoleFill = () => {
        setChosenPoletime(seniorTimeTarget);
        setChosenPoletimeSource('senior');
        setSeniorPoleSettled({ filled: true, text: `POLETIME HOMOLOGADO [${seniorTimeTarget}]` });
        saveDraft(seniorTimeTarget, chosenTop10);
        setStage('2A_TECH_TOP10');
    };

    // Se "ok" -> Técnico surge com nova sugestão de Poletime (Branch B)
    const handleSeniorPoleOk = () => {
        setSeniorPoleSettled({ filled: false, text: 'OK REGISTRADO' });
        setStage('2B_TECH_POLE');
    };

    // BRANCH A (Técnico inicia TOP 10)
    const handleTechTop10FillA = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        setTechTop10Settled({ filled: true, text: 'TOP 10 HOMOLOGADO NO PROTOCOLO' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    const handleTechTop10OkA = () => {
        setTechTop10Settled({ filled: false, text: 'OK REGISTRADO' });
        setStage('3A_SENIOR_TOP10'); // Sênior dá sua contra-visão experiente
    };

    // BRANCH A (Sênior contra-argumenta TOP 10)
    const handleSeniorTop10FillA = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        setChosenTop10Source('senior');
        setSeniorTop10Settled({ filled: true, text: 'TOP 10 HOMOLOGADO NO PROTOCOLO' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    const handleSeniorTop10OkA = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        setChosenTop10Source('senior');
        setSeniorTop10Settled({ filled: false, text: 'OK REGISTRADO // TOP 10 SÊNIOR' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    // BRANCH B (Técnico sugeriu novo Poletime)
    const handleTechPoleFillB = () => {
        setChosenPoletime(techTimeTarget);
        setChosenPoletimeSource('tech');
        setTechPoleSettled({ filled: true, text: `POLETIME HOMOLOGADO [${techTimeTarget}]` });
        saveDraft(techTimeTarget, chosenTop10);
        setStage('3B_SENIOR_TOP10'); // Passa para o assunto seguinte (TOP 10)
    };

    const handleTechPoleOkB = () => {
        setChosenPoletime(techTimeTarget);
        setChosenPoletimeSource('tech');
        setTechPoleSettled({ filled: false, text: `OK REGISTRADO [${techTimeTarget}]` });
        saveDraft(techTimeTarget, chosenTop10);
        setStage('3B_SENIOR_TOP10'); // Passa para o assunto seguinte (TOP 10)
    };

    // BRANCH B (Sênior inicia TOP 10)
    const handleSeniorTop10FillB = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        setChosenTop10Source('senior');
        setSeniorTop10Settled({ filled: true, text: 'TOP 10 HOMOLOGADO NO PROTOCOLO' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    const handleSeniorTop10OkB = () => {
        setSeniorTop10Settled({ filled: false, text: 'OK REGISTRADO' });
        setStage('4B_TECH_TOP10'); // Técnico sugere novo TOP 10
    };

    // BRANCH B (Técnico sugere novo TOP 10)
    const handleTechTop10FillB = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        setTechTop10Settled({ filled: true, text: 'TOP 10 HOMOLOGADO NO PROTOCOLO' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    const handleTechTop10OkB = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        setTechTop10Settled({ filled: false, text: 'OK REGISTRADO // TOP 10 TÉCNICO' });
        saveDraft(chosenPoletime, grid);
        setStage('5_FINAL');
    };

    const handleGoToPositions = () => {
        router.push('/positions?from=war_room');
    };

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center justify-center">

            {/* BACKGROUND IMERSIVO FRANK MILLER NOIR TRAVADO NA VIEWPORT (ESTILO INVITE) */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden" 
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                <img
                    src="/war_room_bg.jpg"
                    alt="Formula 1 War Room Frank Miller Noir"
                    className="w-full h-full object-cover object-center brightness-[0.72] contrast-[1.25]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
            </div>

            {/* BOTÃO DISCRETO DE SAÍDA NO CANTO SUPERIOR (SEM POLUIÇÃO VISUAL) */}
            <div className="absolute top-4 left-4 z-20">
                <Link
                    href={`/${user?.user_metadata?.slug || 'pitwall'}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-[#fbaa19] transition-colors uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#fbaa19]" />
                    <span>[ « SAIR ]</span>
                </Link>
            </div>

            {/* CONTAINER VERTICAL DE DIÁLOGOS EM ROWS DIFERENTES (NUNCA LADO A LADO E SEM SOBREPOSIÇÃO) */}
            <div className="relative z-10 w-full max-w-2xl px-4 py-12 md:py-16 flex flex-col gap-5 justify-center">

                {/* ========================================================================= */}
                {/* ROW 1: ENGENHEIRO SÊNIOR // POLETIME (SEMPRE A PRIMEIRA FALA)             */}
                {/* ========================================================================= */}
                <div className="w-full animate-fade-in">
                    <BoxCard
                        speakerBadge={`[${seniorStrategist.code}]`}
                        speakerRole="ESTRATEGISTA SÊNIOR"
                        categoryTag="POLETIME // VOLTA LANÇADA"
                        text={`"No volante da F1 a gente sente no estômago. Minha meta de Pole Position para o Q3 é ${seniorTimeTarget}. Qualquer tempo abaixo disso vai depender de vácuo cirúrgico e zebra agressiva."`}
                        accentColor={theme.seniorColor}
                        accentGlow="rgba(251, 170, 25, 0.4)"
                        isActive={stage === '1_SENIOR_POLE'}
                        isSettled={seniorPoleSettled !== null}
                        settledLabel={seniorPoleSettled?.text}
                        isFilled={seniorPoleSettled?.filled}
                        onOk={stage === '1_SENIOR_POLE' ? handleSeniorPoleOk : undefined}
                        onFill={stage === '1_SENIOR_POLE' ? handleSeniorPoleFill : undefined}
                        fillLabel={`PREENCHER FORMULÁRIO (${seniorTimeTarget}) »`}
                        okLabel="OK"
                    />
                </div>

                {/* ========================================================================= */}
                {/* BRANCH A: SE USUÁRIO PREENCHEU POLETIME DO SÊNIOR                         */}
                {/* O TÉCNICO INICIA O ASSUNTO SEGUINTE (TOP 10) SEM CONTRARIAR O CHEFE       */}
                {/* ========================================================================= */}
                {['2A_TECH_TOP10', '3A_SENIOR_TOP10', '5_FINAL'].includes(stage) && technicalStrategist && seniorPoleSettled?.filled && (
                    <div className="w-full animate-fade-in">
                        <BoxCard
                            speakerBadge={`[${technicalStrategist.code}]`}
                            speakerRole={`ENGENHARIA // ${theme.badge}`}
                            categoryTag="TOP 10 FINISH // TELEMETRIA"
                            text={`"Tempo de Pole Position em ${seniorTimeTarget} homologado no protocolo, chefe. Telemetria 100% alinhada. Para a corrida de domingo (TOP 10 Finish), nossos modelos apontam que o ritmo favorece: ${technicalStrategist.telemetryBriefing.top10Picks.slice(0, 5).join(', ')} na ponta. ${technicalStrategist.telemetryBriefing.top10Reasoning}"`}
                            accentColor={theme.techColor}
                            accentGlow={theme.techGlow}
                            isActive={stage === '2A_TECH_TOP10'}
                            isSettled={techTop10Settled !== null}
                            settledLabel={techTop10Settled?.text}
                            isFilled={techTop10Settled?.filled}
                            onOk={stage === '2A_TECH_TOP10' ? handleTechTop10OkA : undefined}
                            onFill={stage === '2A_TECH_TOP10' ? handleTechTop10FillA : undefined}
                            fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                            okLabel="OK"
                        />
                    </div>
                )}

                {/* BRANCH A: SE DEU APENAS OK NO TÉCNICO TOP 10, O SÊNIOR DÁ SUA CONTRA-VISÃO */}
                {stage === '3A_SENIOR_TOP10' && (
                    <div className="w-full animate-fade-in">
                        <BoxCard
                            speakerBadge={`[${seniorStrategist.code}]`}
                            speakerRole="ESTRATEGISTA SÊNIOR"
                            categoryTag="RITMO DE CORRIDA // EXPERIÊNCIA"
                            text={`"Entendido os dados da telemetria. Mas na corrida a casca grossa e a gestão de pneus frios falam mais alto: ${seniorStrategist.briefingTips.predictedTop3.join(' • ')} na ponta. ${seniorStrategist.briefingTips.top3Reasoning}"`}
                            accentColor={theme.seniorColor}
                            accentGlow="rgba(251, 170, 25, 0.4)"
                            isActive={true}
                            isSettled={seniorTop10Settled !== null}
                            settledLabel={seniorTop10Settled?.text}
                            isFilled={seniorTop10Settled?.filled}
                            onOk={handleSeniorTop10OkA}
                            onFill={handleSeniorTop10FillA}
                            fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                            okLabel="OK"
                        />
                    </div>
                )}

                {/* ========================================================================= */}
                {/* BRANCH B: SE USUÁRIO DEU APENAS "OK" NO SÊNIOR POLETIME                   */}
                {/* O TÉCNICO SURGE COM UMA NOVA SUGESTÃO DE TEMPO PARA POLETIME              */}
                {/* ========================================================================= */}
                {['2B_TECH_POLE', '3B_SENIOR_TOP10', '4B_TECH_TOP10'].includes(stage) && technicalStrategist && !seniorPoleSettled?.filled && (
                    <div className="w-full animate-fade-in">
                        <BoxCard
                            speakerBadge={`[${technicalStrategist.code}]`}
                            speakerRole={`ENGENHARIA // ${theme.badge}`}
                            categoryTag="POLETIME // TELEMETRIA Q3"
                            text={`"Anotado, chefe. Porém, cruzando os dados da telemetria e o ganho aerodinâmico em curvas de raio longo, projeto a Pole Position em ${techTimeTarget}. ${technicalStrategist.telemetryBriefing.reasoning}"`}
                            accentColor={theme.techColor}
                            accentGlow={theme.techGlow}
                            isActive={stage === '2B_TECH_POLE'}
                            isSettled={techPoleSettled !== null}
                            settledLabel={techPoleSettled?.text}
                            isFilled={techPoleSettled?.filled}
                            onOk={stage === '2B_TECH_POLE' ? handleTechPoleOkB : undefined}
                            onFill={stage === '2B_TECH_POLE' ? handleTechPoleFillB : undefined}
                            fillLabel={`PREENCHER FORMULÁRIO (${techTimeTarget}) »`}
                            okLabel="OK"
                        />
                    </div>
                )}

                {/* BRANCH B: APÓS POLETIME DO TÉCNICO, SÊNIOR ABRE O TOP 10 */}
                {['3B_SENIOR_TOP10', '4B_TECH_TOP10'].includes(stage) && (
                    <div className="w-full animate-fade-in">
                        <BoxCard
                            speakerBadge={`[${seniorStrategist.code}]`}
                            speakerRole="ESTRATEGISTA SÊNIOR"
                            categoryTag="TOP 10 FINISH // RITMO"
                            text={`"Na corrida o desgaste fala mais alto que uma volta lançada. Para o Top 10, aposte na casca grossa: ${seniorStrategist.briefingTips.predictedTop3.join(' • ')} na ponta. ${seniorStrategist.briefingTips.top3Reasoning}"`}
                            accentColor={theme.seniorColor}
                            accentGlow="rgba(251, 170, 25, 0.4)"
                            isActive={stage === '3B_SENIOR_TOP10'}
                            isSettled={seniorTop10Settled !== null}
                            settledLabel={seniorTop10Settled?.text}
                            isFilled={seniorTop10Settled?.filled}
                            onOk={stage === '3B_SENIOR_TOP10' ? handleSeniorTop10OkB : undefined}
                            onFill={stage === '3B_SENIOR_TOP10' ? handleSeniorTop10FillB : undefined}
                            fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                            okLabel="OK"
                        />
                    </div>
                )}

                {/* BRANCH B: SE DEU APENAS OK NO SÊNIOR TOP 10, TÉCNICO SUGERE NOVO TOP 10 */}
                {stage === '4B_TECH_TOP10' && technicalStrategist && (
                    <div className="w-full animate-fade-in">
                        <BoxCard
                            speakerBadge={`[${technicalStrategist.code}]`}
                            speakerRole={`ENGENHARIA // ${theme.badge}`}
                            categoryTag="SIMULAÇÃO MONTE CARLO // TOP 10"
                            text={`"Compreendido, chefe. No entanto, os modelos Monte Carlo de degradação térmica apontam o Top 10 mais provável com: ${technicalStrategist.telemetryBriefing.top10Picks.slice(0, 5).join(', ')} no pelotão da frente. ${technicalStrategist.telemetryBriefing.top10Reasoning}"`}
                            accentColor={theme.techColor}
                            accentGlow={theme.techGlow}
                            isActive={true}
                            isSettled={techTop10Settled !== null}
                            settledLabel={techTop10Settled?.text}
                            isFilled={techTop10Settled?.filled}
                            onOk={handleTechTop10OkB}
                            onFill={handleTechTop10FillB}
                            fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                            okLabel="OK"
                        />
                    </div>
                )}

                {/* ========================================================================= */}
                {/* ROW FINAL: HOMOLOGAÇÃO & TRANSMISSÃO PARA /POSITIONS (COR 3: VERDE ESMERALDA) */}
                {/* ========================================================================= */}
                {stage === '5_FINAL' && (
                    <div className="w-full animate-fade-in pt-2">
                        <div 
                            className="relative w-full rounded-2xl p-5 md:p-6 backdrop-blur-md flex flex-col items-center gap-4 text-center border shadow-2xl"
                            style={{
                                backgroundColor: 'rgba(8, 20, 15, 0.95)',
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                                boxShadow: '0 15px 40px -10px rgba(16, 185, 129, 0.35)'
                            }}
                        >
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>✓ TODAS AS ORDENS ESTRATÉGICAS COMPILADAS COM SUCESSO</span>
                            </div>

                            <p className="text-white/80 text-xs sm:text-sm max-w-lg leading-relaxed">
                                Poletime ({chosenPoletime || seniorTimeTarget}) e grid do Top 10 consolidados no protocolo da equipe. Prossiga para revisar e transmitir suas apostas.
                            </p>

                            <button
                                onClick={handleGoToPositions}
                                className="w-full max-w-md bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] py-3.5 px-6 hover:bg-white transition-all rounded-xl shadow-[0_0_25px_rgba(251,170,25,0.45)] cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                                <span>[ TRANSMITIR ORDENS EM /POSITIONS ]</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div ref={bottomMarkerRef} className="h-4" />
            </div>
        </main>
    );
}

export default function WarRoomPage() {
    return (
        <Suspense fallback={<div className="w-full min-h-screen bg-black" />}>
            <WarRoomContent />
        </Suspense>
    );
}
