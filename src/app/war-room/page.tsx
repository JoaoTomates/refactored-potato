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
import { ENGINE_FACTIONS } from '@/utils/alliance-data';
import { ChevronLeft, ArrowRight, Check, ShieldAlert, Cpu } from 'lucide-react';

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
            const freq = 400 + (code % 24) * 12;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
            gain.gain.exponentialRampToTime(0.0001, this.ctx.currentTime + 0.026);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.028);
        } catch (_) { }
    }
}

const soundEngine = new PitWallSoundEngine();

function TypewriterLine({ 
    text, 
    onComplete, 
    startDelay = 100, 
    speed = 20 
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

    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;

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
        <span className="leading-relaxed relative whitespace-pre-wrap">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block">■</span>}
        </span>
    );
}

// --- Definição das 3 Cores por Aliança ---
interface AllianceTheme {
    allianceName: string;
    badge: string;
    seniorColor: string;    // Cor 1: Amarelo Frank Miller Noir (#fbaa19)
    techColor: string;      // Cor 2: Cor da Aliança (A: Cyan, B: Red, C: Amber/Cobalt)
    statusColor: string;    // Cor 3: Status / Homologação Verde (#10b981)
    techGlow: string;
}

const ALLIANCE_THEMES: Record<AllianceCode, AllianceTheme> = {
    A: {
        allianceName: 'CONSÓRCIO DA ESTRELA',
        badge: 'BLOCO A',
        seniorColor: '#fbaa19',
        techColor: '#00d2be',   // Cyan Teutônico
        statusColor: '#10b981', // Verde Sucesso
        techGlow: 'rgba(0, 210, 190, 0.45)'
    },
    B: {
        allianceName: 'A DINASTIA DE MARANELLO',
        badge: 'BLOCO B',
        seniorColor: '#fbaa19',
        techColor: '#e8002d',   // Vermelho Maranello
        statusColor: '#10b981', // Verde Sucesso
        techGlow: 'rgba(232, 0, 45, 0.45)'
    },
    C: {
        allianceName: 'A VANGUARDA TECNOLÓGICA',
        badge: 'BLOCO C',
        seniorColor: '#fbaa19',
        techColor: '#38bdf8',   // Azul Cibernético / Alta Voltagem
        statusColor: '#10b981', // Verde Sucesso
        techGlow: 'rgba(56, 189, 248, 0.45)'
    }
};

interface BoxTextCardProps {
    speakerBadge: string;
    speakerRole: string;
    categoryTag: string;
    text: string;
    accentColor: string;
    accentGlow?: string;
    isFilled?: boolean;
    filledLabel?: string;
    onOk?: () => void;
    okDisabled?: boolean;
    onFill: () => void;
    fillLabel: string;
    okLabel?: string;
    delay?: number;
}

// Componente de Box Text estilizado fielmente à imagem enviada:
// - Card com cantos arredondados (rounded-2xl)
// - Fundo escuro obsidiana translúcido com backdrop-blur
// - Barra vertical neon na borda esquerda
// - Borda sutil com brilho suave condizente à cor
function BoxTextCard({
    speakerBadge,
    speakerRole,
    categoryTag,
    text,
    accentColor,
    accentGlow,
    isFilled = false,
    filledLabel = 'HOMOLOGADO NO PROTOCOLO',
    onOk,
    okDisabled = false,
    onFill,
    fillLabel,
    okLabel = 'OK',
    delay = 100
}: BoxTextCardProps) {
    const activeColor = isFilled ? '#10b981' : accentColor;
    const activeGlow = isFilled ? 'rgba(16, 185, 129, 0.4)' : (accentGlow || `${accentColor}40`);

    return (
        <div 
            className="relative w-full rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300 backdrop-blur-md flex items-stretch gap-4 md:gap-5 shadow-2xl group border"
            style={{
                backgroundColor: isFilled ? 'rgba(8, 18, 14, 0.94)' : 'rgba(11, 13, 18, 0.92)',
                borderColor: `${activeColor}40`,
                boxShadow: `0 12px 35px -10px ${activeGlow}, 0 0 1px 1px ${activeColor}30`
            }}
        >
            {/* BARRA VERTICAL NEON NA LATERAL ESQUERDA (ESTILO EXATO DA IMAGEM) */}
            <div 
                className="w-1.5 self-stretch rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                    backgroundColor: activeColor,
                    boxShadow: `0 0 14px ${activeColor}, 0 0 4px ${activeColor}`
                }}
            />

            {/* CONTEÚDO PRINCIPAL DO BOX TEXT */}
            <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                {/* Cabeçalho do Box */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span 
                            className="text-xs sm:text-sm font-black uppercase tracking-wider"
                            style={{ color: activeColor }}
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

                {/* Fala do Engenheiro com Typewriter */}
                <div className="text-white text-xs sm:text-sm font-semibold tracking-wide leading-relaxed py-1 min-h-[55px]">
                    <TypewriterLine text={text} startDelay={delay} />
                </div>

                {/* Ações: [ OK ] e [ PREENCHER FORMULÁRIO ... ] */}
                <div className="mt-1 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                    {onOk && (
                        <button
                            type="button"
                            onClick={onOk}
                            disabled={okDisabled}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                okDisabled
                                    ? 'opacity-30 cursor-not-allowed text-white/40'
                                    : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                            }`}
                        >
                            [ {okLabel} ]
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onFill}
                        className={`px-4 py-2 rounded-lg font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                            isFilled
                                ? 'bg-emerald-500 text-black shadow-[0_0_18px_rgba(16,185,129,0.55)]'
                                : 'text-black hover:opacity-95'
                        }`}
                        style={{
                            backgroundColor: isFilled ? '#10b981' : activeColor,
                            boxShadow: isFilled 
                                ? '0 0 18px rgba(16,185,129,0.5)' 
                                : `0 0 16px ${activeColor}50`
                        }}
                    >
                        {isFilled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{isFilled ? filledLabel : fillLabel}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function WarRoomContent() {
    const router = useRouter();
    const { user } = useSupabaseAuth();

    // Aliança e Equipe
    const [userAlliance, setUserAlliance] = useState<AllianceCode>('B');
    const [userTeamCode, setUserTeamCode] = useState<string>('FER');
    const [teamColor, setTeamColor] = useState<string>('#E8002D');
    
    // Personagens da Mesa
    const [seniorStrategist, setSeniorStrategist] = useState<SeniorStrategist>(SENIOR_STRATEGISTS[0]);
    const [technicalStrategist, setTechnicalStrategist] = useState<TechnicalStrategist | null>(null);

    // Estado do Fluxo Sequencial (Rows diferentes)
    // Row 1: Sênior fala Poletime
    // Row 2: Técnico fala Poletime (após OK no Sênior)
    // Row 3: Sênior fala Top 10 (após poletime preenchido ou OK)
    // Row 4: Técnico fala Top 10 (após OK no Sênior Top 10)
    // Row 5: Conclusão & Transmissão para /positions
    const [flowStep, setFlowStep] = useState<1 | 2 | 3 | 4 | 5>(1);

    // Dados Homologados
    const [chosenPoletime, setChosenPoletime] = useState<string | null>(null);
    const [chosenPoletimeSource, setChosenPoletimeSource] = useState<'senior' | 'tech' | null>(null);
    const [chosenTop10, setChosenTop10] = useState<string[] | null>(null);
    const [chosenTop10Source, setChosenTop10Source] = useState<'senior' | 'tech' | null>(null);

    // Refs para scroll automático para a nova linha (Row) revelada
    const row2Ref = useRef<HTMLDivElement>(null);
    const row3Ref = useRef<HTMLDivElement>(null);
    const row4Ref = useRef<HTMLDivElement>(null);
    const row5Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        soundEngine.init();

        const loadProfile = async () => {
            let allianceKey: AllianceCode = 'B';
            let teamCode = 'FER';
            let color = '#E8002D';

            if (user) {
                const { data: contract } = await supabase
                    .from('contracts')
                    .select('team_id, teams(code, color), group_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (contract) {
                    const t = Array.isArray(contract.teams) ? contract.teams[0] : contract.teams;
                    if (t?.code) teamCode = t.code;
                    if (t?.color) color = t.color;

                    if (['MER', 'MCL', 'ALP', 'WIL'].includes(teamCode)) allianceKey = 'A';
                    else if (['FER', 'HAA', 'CAD'].includes(teamCode)) allianceKey = 'B';
                    else allianceKey = 'C';
                }
            }

            setUserAlliance(allianceKey);
            setUserTeamCode(teamCode);
            setTeamColor(color);

            const senior = getSeniorStrategistForRound(2);
            setSeniorStrategist(senior);

            const tech = getActiveTechnicalStrategist(user?.id || 'guest', teamCode, allianceKey);
            setTechnicalStrategist(tech);
        };

        loadProfile();
    }, [user]);

    // Recalcula o estrategista técnico se a aliança for alternada
    const handleSwitchAlliance = (code: AllianceCode) => {
        setUserAlliance(code);
        const faction = ENGINE_FACTIONS[code];
        const defaultTeam = faction.teams[0] || 'FER';
        setUserTeamCode(defaultTeam);
        const tech = getActiveTechnicalStrategist(user?.id || 'guest', defaultTeam, code);
        setTechnicalStrategist(tech);
    };

    // Auto-scroll suave para o novo Box Text na linha correspondente
    useEffect(() => {
        if (flowStep === 2) row2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (flowStep === 3) row3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (flowStep === 4) row4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (flowStep === 5) row5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [flowStep]);

    // Ações de Poletime
    const handleSeniorPoletimeOk = () => {
        setFlowStep(2); // Revela Row 2 (Técnico Poletime)
    };

    const handleSeniorPoletimeFill = () => {
        const time = seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209';
        setChosenPoletime(time);
        setChosenPoletimeSource('senior');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança para Row 3 (Sênior Top 10)
    };

    const handleTechPoletimeOk = () => {
        const time = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';
        setChosenPoletime(time);
        setChosenPoletimeSource('tech');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança para Row 3 (Sênior Top 10)
    };

    const handleTechPoletimeFill = () => {
        const time = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';
        setChosenPoletime(time);
        setChosenPoletimeSource('tech');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança para Row 3 (Sênior Top 10)
    };

    // Ações de Top 10
    const handleSeniorTop10Ok = () => {
        setFlowStep(4); // Revela Row 4 (Técnico Top 10)
    };

    const handleSeniorTop10Fill = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        setChosenTop10Source('senior');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído (Row 5)
    };

    const handleTechTop10Ok = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído (Row 5)
    };

    const handleTechTop10Fill = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído (Row 5)
    };

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

    const handleGoToPositions = () => {
        router.push('/positions?from=war_room');
    };

    const theme = ALLIANCE_THEMES[userAlliance] || ALLIANCE_THEMES['B'];
    const seniorTimeTarget = seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209';
    const techTimeTarget = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden selection:bg-[#fbaa19] selection:text-black flex flex-col justify-between">
            
            {/* BACKGROUND ESTÁVEL FRANK MILLER NOIR TRAVADO NA VIEWPORT */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden" 
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                <img
                    src="/war_room_bg.jpg"
                    alt="Formula 1 War Room Boardroom Noir"
                    className="w-full h-full object-cover object-center brightness-[0.75] contrast-[1.22]"
                />
                {/* Vinheta e Atmosfera Frank Miller Noir */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/75" />
            </div>

            {/* TOP BAR MINIMALISTA COM SELETOR DE ALIANÇA (3 CORES) */}
            <header className="relative z-20 w-full bg-black/85 border-b border-white/10 px-4 md:px-8 py-3 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/${user?.user_metadata?.slug || 'pitwall'}`}
                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#fbaa19]" />
                        <span>[ « PITWALL ]</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-[#fbaa19] uppercase">
                            BAEFF1 // WAR ROOM
                        </span>
                        <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border"
                            style={{ 
                                borderColor: `${theme.techColor}50`, 
                                color: theme.techColor, 
                                backgroundColor: `${theme.techColor}15` 
                            }}
                        >
                            {userTeamCode} • {theme.badge}
                        </span>
                    </div>
                </div>

                {/* SELETOR DE ALIANÇA (3 CORES OFICIAIS DO GRID) */}
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest px-2 hidden sm:inline">
                        ALIANÇA:
                    </span>
                    {(['A', 'B', 'C'] as AllianceCode[]).map((code) => {
                        const t = ALLIANCE_THEMES[code];
                        const isActive = userAlliance === code;
                        return (
                            <button
                                key={code}
                                onClick={() => handleSwitchAlliance(code)}
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                    isActive
                                        ? 'bg-white/15 text-white border'
                                        : 'text-white/40 hover:text-white/80'
                                }`}
                                style={{
                                    borderColor: isActive ? t.techColor : 'transparent',
                                    color: isActive ? t.techColor : undefined
                                }}
                            >
                                <span 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: t.techColor }} 
                                />
                                <span>{t.badge}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* CONTAINER VERTICAL DE ROWS (NUNCA LADO A LADO) */}
            <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 flex flex-col justify-start">
                
                {/* Legenda sutil da paleta de 3 cores */}
                <div className="mb-6 flex flex-wrap items-center justify-between text-[10px] text-white/50 tracking-widest uppercase border-b border-white/10 pb-2">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.seniorColor }} />
                            <span>1. SÊNIOR ({seniorStrategist.code})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.techColor }} />
                            <span>2. TELEMETRIA ({technicalStrategist?.code || 'TÉCNICO'})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.statusColor }} />
                            <span>3. HOMOLOGADO</span>
                        </span>
                    </div>
                    <span className="hidden sm:inline text-white/30">
                        BRIEFING ESTRATÉGICO // ROWS SEQUENCIAIS
                    </span>
                </div>

                <div className="flex flex-col gap-6">

                    {/* ============================================================ */}
                    {/* ROW 1: ENGENHEIRO SÊNIOR // POLETIME (COR 1: #FBAA19)        */}
                    {/* ============================================================ */}
                    {flowStep >= 1 && (
                        <div className="w-full animate-fade-in">
                            <BoxTextCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                categoryTag="POLETIME // VOLTA LANÇADA"
                                text={`"No volante da F1 a gente sente no estômago. Minha meta de Pole Position para o Q3 é ${seniorTimeTarget}. Qualquer tempo abaixo disso vai depender de vácuo cirúrgico e zebra agressiva."`}
                                accentColor={theme.seniorColor}
                                accentGlow="rgba(251, 170, 25, 0.4)"
                                isFilled={chosenPoletimeSource === 'senior'}
                                filledLabel={`POLETIME HOMOLOGADO [${seniorTimeTarget}]`}
                                onOk={flowStep === 1 ? handleSeniorPoletimeOk : undefined}
                                okDisabled={flowStep > 1 && chosenPoletimeSource === 'senior'}
                                onFill={handleSeniorPoletimeFill}
                                fillLabel={`PREENCHER POLETIME (${seniorTimeTarget}) »`}
                                delay={100}
                            />
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* ROW 2: ENGENHEIRO TÉCNICO // POLETIME (COR 2: ALIANÇA)       */}
                    {/* ============================================================ */}
                    {flowStep >= 2 && technicalStrategist && (
                        <div ref={row2Ref} className="w-full animate-fade-in">
                            <BoxTextCard
                                speakerBadge={`[${technicalStrategist.code}]`}
                                speakerRole={`ENGENHARIA DE PISTA // ${theme.badge}`}
                                categoryTag="TELEMETRIA // Q3 TARGET"
                                text={`"Os dados de túnel de vento apontam ganho nas curvas de raio longo. Minha telemetria projeta a Pole Position em ${techTimeTarget}. ${technicalStrategist.telemetryBriefing.reasoning}"`}
                                accentColor={theme.techColor}
                                accentGlow={theme.techGlow}
                                isFilled={chosenPoletimeSource === 'tech'}
                                filledLabel={`POLETIME HOMOLOGADO [${techTimeTarget}]`}
                                onOk={flowStep === 2 ? handleTechPoletimeOk : undefined}
                                okDisabled={flowStep > 2 && chosenPoletimeSource === 'tech'}
                                onFill={handleTechPoletimeFill}
                                fillLabel={`PREENCHER POLETIME (${techTimeTarget}) »`}
                                delay={150}
                            />
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* ROW 3: ENGENHEIRO SÊNIOR // TOP 10 (COR 1: #FBAA19)          */}
                    {/* ============================================================ */}
                    {flowStep >= 3 && (
                        <div ref={row3Ref} className="w-full animate-fade-in">
                            <BoxTextCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                categoryTag="RITMO DE CORRIDA // TOP 10"
                                text={`"Na corrida o desgaste fala mais alto que uma volta lançada. Para o Top 10, aposte na casca grossa: ${seniorStrategist.briefingTips.predictedTop3.join(' • ')} na ponta. ${seniorStrategist.briefingTips.top3Reasoning}"`}
                                accentColor={theme.seniorColor}
                                accentGlow="rgba(251, 170, 25, 0.4)"
                                isFilled={chosenTop10Source === 'senior'}
                                filledLabel="TOP 10 HOMOLOGADO NO PROTOCOLO"
                                onOk={flowStep === 3 ? handleSeniorTop10Ok : undefined}
                                okDisabled={flowStep > 3 && chosenTop10Source === 'senior'}
                                onFill={handleSeniorTop10Fill}
                                fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                                delay={100}
                            />
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* ROW 4: ENGENHEIRO TÉCNICO // TOP 10 (COR 2: ALIANÇA)         */}
                    {/* ============================================================ */}
                    {flowStep >= 4 && technicalStrategist && (
                        <div ref={row4Ref} className="w-full animate-fade-in">
                            <BoxTextCard
                                speakerBadge={`[${technicalStrategist.code}]`}
                                speakerRole={`ENGENHARIA DE PISTA // ${theme.badge}`}
                                categoryTag="SIMULAÇÃO MONTE CARLO // TOP 10"
                                text={`"Os modelos Monte Carlo de degradação térmica apontam o Top 10 mais provável: ${technicalStrategist.telemetryBriefing.top10Picks.slice(0, 5).join(', ')} no pelotão de frente. ${technicalStrategist.telemetryBriefing.top10Reasoning}"`}
                                accentColor={theme.techColor}
                                accentGlow={theme.techGlow}
                                isFilled={chosenTop10Source === 'tech'}
                                filledLabel="TOP 10 HOMOLOGADO NO PROTOCOLO"
                                onOk={flowStep === 4 ? handleTechTop10Ok : undefined}
                                okDisabled={flowStep > 4 && chosenTop10Source === 'tech'}
                                onFill={handleTechTop10Fill}
                                fillLabel="PREENCHER FORMULÁRIO TOP 10 »"
                                delay={150}
                            />
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* ROW 5: CONSOLIDAÇÃO & TRANSMISSÃO PARA /POSITIONS (COR 3)    */}
                    {/* ============================================================ */}
                    {flowStep === 5 && (
                        <div ref={row5Ref} className="w-full animate-fade-in pt-2">
                            <div 
                                className="relative w-full rounded-2xl p-5 md:p-6 backdrop-blur-md flex flex-col items-center gap-4 text-center border shadow-2xl"
                                style={{
                                    backgroundColor: 'rgba(8, 20, 15, 0.95)',
                                    borderColor: 'rgba(16, 185, 129, 0.5)',
                                    boxShadow: '0 15px 40px -10px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>✓ TODAS AS ORDENS ESTRATÉGICAS COMPILADAS COM SUCESSO</span>
                                </div>

                                <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                                    O Poletime ({chosenPoletime || seniorTimeTarget}) e o Top 10 foram integrados na prancheta de pitwall. Acesse o protocolo geral para revisar e transmitir suas posições oficiais.
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

                </div>
            </div>

            {/* RODAPÉ DISCRETO NO ESTILO INVITE */}
            <footer className="relative z-20 w-full py-3 px-4 border-t border-white/10 bg-black/80 backdrop-blur text-center text-[10px] text-white/40 tracking-widest uppercase">
                &gt;_ BAEFF1 TACTICAL BRIEFING • REUNIÃO DE CÚPULA HOMOLOGADA SOB DIRETRIZES DA FIA
            </footer>
        </main>
    );
}

export default function WarRoomPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center text-white font-mono gap-3">
                <div className="w-10 h-10 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs uppercase font-bold tracking-widest text-[#fbaa19]">&gt;_ ACESSANDO REUNIÃO DA WAR ROOM...</p>
            </div>
        }>
            <WarRoomContent />
        </Suspense>
    );
}
