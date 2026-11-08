"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SENIOR_STRATEGISTS, SeniorStrategist, getSeniorStrategistForRound } from '@/lib/race-directors';
import { 
    TechnicalStrategist, 
    getActiveTechnicalStrategist, 
    evaluateTechnicalStrategist, 
    AllianceCode 
} from '@/lib/technical-strategists';
import { ENGINE_FACTIONS } from '@/utils/alliance-data';
import { ChevronLeft, Zap, Shield, ArrowRight, UserCheck, AlertTriangle, Users, Terminal } from 'lucide-react';

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
            const freq = 420 + (code % 24) * 12;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.026);

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
    speed = 22 
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

function WarRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useSupabaseAuth();

    const initialMode = searchParams.get('mode') === 'debrief' ? 'debrief' : 'briefing';
    const [mode, setMode] = useState<'briefing' | 'debrief'>(initialMode);
    
    // Aliança e Equipe do Usuário
    const [userAlliance, setUserAlliance] = useState<AllianceCode>('B');
    const [userTeamCode, setUserTeamCode] = useState<string>('FER');
    const [teamColor, setTeamColor] = useState<string>('#E8002D');
    
    // Personagens da Mesa
    const [seniorStrategist, setSeniorStrategist] = useState<SeniorStrategist>(SENIOR_STRATEGISTS[0]);
    const [technicalStrategist, setTechnicalStrategist] = useState<TechnicalStrategist | null>(null);

    // Estado da Avaliação do Superior (Terça-Feira)
    const [evalAnswered, setEvalAnswered] = useState<boolean>(false);
    const [evalResultMessage, setEvalResultMessage] = useState<string>('');

    // Estado dos 5 Atos da Reunião Tática
    const [currentAct, setCurrentAct] = useState<number>(1);
    const [actTypingDone, setActTypingDone] = useState<boolean>(false);

    // Decisões coletadas no Briefing
    const [draftPoletime, setDraftPoletime] = useState<string>('1:12.209');
    const [poletimeChosenSource, setPoletimeChosenSource] = useState<'senior' | 'tech' | 'custom'>('senior');
    const [draftTop10, setDraftTop10] = useState<string[]>([]);
    const [riskAllocation, setRiskAllocation] = useState<10 | 20 | 30>(20);

    // Carrega dados de escuderia e aliança
    useEffect(() => {
        soundEngine.init();

        const loadProfileData = async () => {
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

            // Carrega Sênior da rodada
            const senior = getSeniorStrategistForRound(2);
            setSeniorStrategist(senior);

            // Carrega Engenheiro Técnico da Aliança
            const tech = getActiveTechnicalStrategist(user?.id || 'guest', teamCode, allianceKey);
            setTechnicalStrategist(tech);
            setDraftPoletime(senior.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209');
            setDraftTop10(tech.telemetryBriefing.top10Picks);
        };

        loadProfileData();
    }, [user]);

    // Manipula a resposta da Terça-Feira ao Superior
    const handleEvaluateSuperior = (satisfied: boolean) => {
        if (!technicalStrategist) return;

        const result = evaluateTechnicalStrategist(
            user?.id || 'guest',
            technicalStrategist.id,
            satisfied,
            userAlliance
        );

        setTechnicalStrategist(result.newStrategist);
        setEvalResultMessage(result.message);
        setEvalAnswered(true);
    };

    // Avança para o próximo Ato Teatral
    const handleNextAct = () => {
        setActTypingDone(false);
        setCurrentAct(prev => Math.min(5, prev + 1));
    };

    // Homologa e transfere os palpites para /positions
    const handleHomologateToPositions = () => {
        const payload = {
            poletime: draftPoletime,
            source: poletimeChosenSource,
            top10: draftTop10,
            riskAllocation,
            timestamp: new Date().toISOString()
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem('war_room_draft', JSON.stringify(payload));
        }

        router.push('/positions?from=war_room');
    };

    const faction = ENGINE_FACTIONS[userAlliance] || ENGINE_FACTIONS['B'];

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden selection:bg-[#fbaa19] selection:text-black flex flex-col justify-between">
            
            {/* BACKGROUND FRANK MILLER NOIR TRAVADO NA VIEWPORT (ISOMÉTRICO 7 LUGARES) */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden" 
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                <img
                    src="/war_room_bg.jpg"
                    alt="Formula 1 War Room Boardroom Noir"
                    className="w-full h-full object-cover object-center brightness-[0.82] contrast-[1.18]"
                />
                {/* Vinheta de Iluminação Chiaroscuro Noir & F1 Telemetry Atmosphere */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/75" />
                <div className="absolute inset-0 bg-radial-vignette opacity-50" />
            </div>

            {/* BARRA SUPERIOR DE TELEMETRIA & NAVEGAÇÃO DA WAR ROOM */}
            <header className="relative z-20 w-full bg-black/90 border-b border-white/15 px-4 md:px-8 py-3 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/${user?.user_metadata?.slug || ''}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded border border-white/15"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#fbaa19]" />
                        <span>Pitwall</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-[#fbaa19] uppercase">
                            BAEFF1 // WAR ROOM
                        </span>
                        <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border"
                            style={{ borderColor: `${teamColor}50`, color: teamColor, backgroundColor: `${teamColor}15` }}
                        >
                            {userTeamCode} • {faction.badge}
                        </span>
                    </div>
                </div>

                {/* Alternador de Modo: Briefing Tático (Quarta/Quinta) vs Debrief do Superior (Terça) */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                    <button
                        onClick={() => { setMode('briefing'); setCurrentAct(1); setActTypingDone(false); }}
                        className={`px-3 py-1.5 rounded border font-bold uppercase transition-all cursor-pointer ${
                            mode === 'briefing'
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_15px_rgba(251,170,25,0.4)]'
                                : 'bg-black/60 border-white/15 text-gray-400 hover:text-white'
                        }`}
                    >
                        [ BRIEFING DOS 5 ATOS ]
                    </button>
                    <button
                        onClick={() => { setMode('debrief'); setEvalAnswered(false); }}
                        className={`px-3 py-1.5 rounded border font-bold uppercase transition-all cursor-pointer ${
                            mode === 'debrief'
                                ? 'bg-[#e10600] text-white border-[#e10600] shadow-[0_0_15px_rgba(225,6,0,0.4)]'
                                : 'bg-black/60 border-white/15 text-gray-400 hover:text-white'
                        }`}
                    >
                        [ TERÇA: DEBRIEF DO SUPERIOR ]
                    </button>
                </div>
            </header>

            {/* ============================================================ */}
            {/* MODO 1: DEBRIEF DA TERÇA-FEIRA (O SUPERIOR NA CABECEIRA DA MESA) */}
            {/* ============================================================ */}
            {mode === 'debrief' && (
                <div className="relative z-10 w-full max-w-4xl mx-auto my-auto px-4 py-8 flex flex-col gap-6 animate-fade-in font-mono">
                    
                    {/* Box do Superior na Cabeceira da Mesa */}
                    <div className="bg-[#0a0c10] border-2 border-[#fbaa19]/60 rounded-lg p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.95)] flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-white/15 pb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-[#fbaa19] animate-ping" />
                                <span className="text-xs font-black uppercase tracking-widest text-[#fbaa19]">
                                    CABECEIRA DA MESA // O SUPERIOR [DIRETORIA EXECUTIVA]
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                ETAPA SEMANAL: TERÇA-FEIRA
                            </span>
                        </div>

                        {/* Diálogo do Superior */}
                        <div className="border-l-4 border-[#fbaa19] pl-4 py-2 text-sm md:text-base text-gray-100 leading-relaxed italic">
                            <TypewriterLine
                                text={`"Estrategista, a diretoria exige o balanço da garagem. Analisamos a telemetria do último GP e os relatórios de túnel de vento. O conselho de fábrica precisa saber: você está plenamente satisfeito com as recomendações técnicas e o ritmo do seu Engenheiro Chefe, ${technicalStrategist?.fullName} (${technicalStrategist?.code})?"`}
                                startDelay={150}
                                onComplete={() => setActTypingDone(true)}
                            />
                        </div>

                        {/* Dados Rápidos do Engenheiro em Análise */}
                        {technicalStrategist && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[10px]">
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white/40 block">ENGENHEIRO ATUAL:</span>
                                    <span className="font-bold text-white text-xs">{technicalStrategist.code}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white/40 block">ESPECIALIDADE:</span>
                                    <span className="font-bold text-[#fbaa19] truncate block">{technicalStrategist.specialty}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white/40 block">ASSERTIVIDADE:</span>
                                    <span className="font-bold text-emerald-400">{technicalStrategist.accuracyRate}%</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white/40 block">CONFIANÇA DIRETORIA:</span>
                                    <span className="font-bold text-amber-400">{technicalStrategist.confidenceScore}%</span>
                                </div>
                            </div>
                        )}

                        {/* Botões Binários: [ SIM ] ou [ NÃO ] */}
                        {!evalAnswered ? (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/15">
                                <button
                                    onClick={() => handleEvaluateSuperior(true)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-xs p-3.5 rounded transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>[ SIM // RENOVAR CONFIANÇA NO ENGENHEIRO ]</span>
                                </button>
                                <button
                                    onClick={() => handleEvaluateSuperior(false)}
                                    className="flex-1 bg-[#e10600] hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs p-3.5 rounded transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>[ NÃO // EXIGIR SUBSTITUIÇÃO NA ALIANÇA ]</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 pt-4 border-t border-white/15 animate-fade-in">
                                <div className="p-4 bg-white/10 border border-[#fbaa19]/40 rounded text-xs text-white leading-relaxed">
                                    <span className="font-black text-[#fbaa19] block mb-1">» RESPOSTA REGISTRADA NA ATA DE PADDOCK:</span>
                                    {evalResultMessage}
                                </div>

                                <button
                                    onClick={() => { setMode('briefing'); setCurrentAct(1); setActTypingDone(false); }}
                                    className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs p-3.5 rounded hover:bg-white transition-colors cursor-pointer text-center"
                                >
                                    [ AVANÇAR PARA A REUNIÃO TÁTICA DOS 5 ATOS ] »
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODO 2: BRIEFING TÁTICO DOS 5 ATOS (SÊNIOR vs TÉCNICO vs VOCÊ) */}
            {/* ============================================================ */}
            {mode === 'briefing' && (
                <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5 font-mono">
                    
                    {/* BARRA DE PROGRESSO DOS 5 ATOS TEATRAIS */}
                    <div className="bg-black/90 p-3 rounded-lg border border-white/15 flex items-center justify-between gap-2 overflow-x-auto text-[10px]">
                        {[
                            { num: 1, title: 'ATO 1: PISTA & ASFALTO' },
                            { num: 2, title: 'ATO 2: POLETIME Q3' },
                            { num: 3, title: 'ATO 3: TOP 10 RITMO' },
                            { num: 4, title: 'ATO 4: ALOCAÇÃO DE RISCO' },
                            { num: 5, title: 'ATO 5: HOMOLOGAÇÃO' },
                        ].map((act) => (
                            <button
                                key={act.num}
                                onClick={() => { setCurrentAct(act.num); setActTypingDone(false); }}
                                className={`px-2.5 py-1 rounded font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                                    currentAct === act.num
                                        ? 'bg-[#fbaa19] text-black'
                                        : currentAct > act.num
                                        ? 'bg-white/15 text-white/80'
                                        : 'bg-black/40 text-white/40'
                                }`}
                            >
                                {act.title}
                            </button>
                        ))}
                    </div>

                    {/* CORPO DO ATO ATUAL: ESTRATÉGIA NOIR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* TERMINAL ESQUERDO: O ESTRATEGISTA SÊNIOR (LENDA DO PASSADO) */}
                        <div className="bg-[#0a0c10] border border-[#fbaa19]/40 rounded-lg p-5 shadow-2xl flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <div>
                                    <span className="text-[10px] text-[#fbaa19] font-black uppercase tracking-widest block">
                                        ASSENTO ESQUERDO // CONSELHEIRO SÊNIOR
                                    </span>
                                    <span className="text-white font-black text-sm">
                                        {seniorStrategist.code} ({seniorStrategist.decade})
                                    </span>
                                </div>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                                    INSTINTO & HISTÓRIA
                                </span>
                            </div>

                            {/* Fala do Sênior por Ato */}
                            <div className="text-xs text-gray-200 leading-relaxed italic border-l-2 border-[#fbaa19] pl-3 py-1 min-h-[95px]">
                                {currentAct === 1 && (
                                    <TypewriterLine
                                        text={`"${seniorStrategist.signatureQuote}. Este circuito pune quem confia demais no computador. O asfalto vai esfriar no fim da tarde e o vento contra a reta principal vai matar a asa aberta."`}
                                        startDelay={100}
                                        onComplete={() => setActTypingDone(true)}
                                    />
                                )}
                                {currentAct === 2 && (
                                    <TypewriterLine
                                        text={`"No meu tempo a gente sentia no volante. Minha meta de Pole Position para o Q3 é ${seniorStrategist.briefingTips.poletimeTarget}. Qualquer coisa abaixo disso vai depender de vácuo perfeito."`}
                                        startDelay={100}
                                        onComplete={() => setActTypingDone(true)}
                                    />
                                )}
                                {currentAct === 3 && (
                                    <TypewriterLine
                                        text={`"Para o domingo, esqueça o túnel de vento: ${seniorStrategist.briefingTips.predictedTop3.join(' • ')} têm ritmo de combate no tráfego. Atenção no ${seniorStrategist.briefingTips.evoTargetDriver} para a Escalada."`}
                                        startDelay={100}
                                        onComplete={() => setActTypingDone(true)}
                                    />
                                )}
                                {currentAct === 4 && (
                                    <TypewriterLine
                                        text={`"Agora a mesa se cala. Nós damos a rota, mas a gestão do cofre é sua. Se colocar fichas demais no risco, a escuderia quebra. Seja cirúrgico."`}
                                        startDelay={100}
                                        onComplete={() => setActTypingDone(true)}
                                    />
                                )}
                                {currentAct === 5 && (
                                    <TypewriterLine
                                        text={`"As ordens estão na mesa. Assine a súmula e transmita para a comissária da FIA em /positions. Bom GP, chefe."`}
                                        startDelay={100}
                                        onComplete={() => setActTypingDone(true)}
                                    />
                                )}
                            </div>

                            <div className="text-[10px] text-white/50 pt-2 border-t border-white/5 flex items-center justify-between">
                                <span>PILOTO REAL: {seniorStrategist.originalDriver}</span>
                                <span className="text-emerald-400 font-bold">{seniorStrategist.evaluation.accuracyRate}% ASSERTIVIDADE</span>
                            </div>
                        </div>

                        {/* TERMINAL DIREITO: O ESTRATEGISTA TÉCNICO (DADOS & TELEMETRIA) */}
                        <div 
                            className="bg-[#0a0c10] border rounded-lg p-5 shadow-2xl flex flex-col justify-between gap-3"
                            style={{ borderColor: `${teamColor}60` }}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: teamColor }}>
                                        ASSENTO DIREITO // ENGENHEIRO TÉCNICO
                                    </span>
                                    <span className="text-white font-black text-sm">
                                        {technicalStrategist?.fullName} ({technicalStrategist?.code})
                                    </span>
                                </div>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                                    TELEMETRIA & DADOS
                                </span>
                            </div>

                            {/* Fala do Técnico por Ato */}
                            <div className="text-xs text-gray-200 leading-relaxed font-mono border-l-2 pl-3 py-1 min-h-[95px]" style={{ borderColor: teamColor }}>
                                {currentAct === 1 && (
                                    <TypewriterLine
                                        text={`"Comandante, os sensores de pista confirmam: taxa de abrasão de 3.2 bar nas curvas rápidas. ${technicalStrategist?.telemetryBriefing.riskEvaluation}"`}
                                        startDelay={250}
                                    />
                                )}
                                {currentAct === 2 && (
                                    <TypewriterLine
                                        text={`"Discordo do Sênior no delta. Meus algoritmos de fluxo computacional projetam a Pole exatamente em ${technicalStrategist?.telemetryBriefing.poletimeTarget}. ${technicalStrategist?.telemetryBriefing.reasoning}"`}
                                        startDelay={250}
                                    />
                                )}
                                {currentAct === 3 && (
                                    <TypewriterLine
                                        text={`"Projeção estocástica para o Top 10: ${technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 5).join(', ')} no pelotão da frente. ${technicalStrategist?.telemetryBriefing.top10Reasoning}"`}
                                        startDelay={250}
                                    />
                                )}
                                {currentAct === 4 && (
                                    <TypewriterLine
                                        text={`"A alocação de risco da banca não admite intuição. 10% protege contra bandeiras vermelhas; 30% exige alinhamento perfeito de astros. O comando é seu."`}
                                        startDelay={250}
                                    />
                                )}
                                {currentAct === 5 && (
                                    <TypewriterLine
                                        text={`"Telemetria pronta para envio criptografado. Todas as ordens da mesa foram compiladas para a sua revisão final."`}
                                        startDelay={250}
                                    />
                                )}
                            </div>

                            <div className="text-[10px] text-white/50 pt-2 border-t border-white/5 flex items-center justify-between">
                                <span>ORIGEM: {technicalStrategist?.nationality}</span>
                                <span className="text-amber-400 font-bold">CONFIANÇA: {technicalStrategist?.confidenceScore}%</span>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* TERMINAL CENTRAL // DECISÃO DO USUÁRIO PARA O ATO ATUAL */}
                    {/* ============================================================ */}
                    <div className="bg-black/95 border-2 border-white/20 rounded-lg p-5 shadow-2xl flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-[#fbaa19]" />
                                DECISÃO TÁTICA DO COMANDO // ATO {currentAct} DE 5
                            </span>
                            <span className="text-[10px] text-white/40 uppercase">SUA PALAVRA FINAL</span>
                        </div>

                        {/* ATO 1: PISTA & ASFALTO */}
                        {currentAct === 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs text-gray-300">
                                    Você ouviu o parecer sobre asfalto e meteorologia. Os dados de vento e temperatura foram carregados no console.
                                </p>
                                <button
                                    onClick={handleNextAct}
                                    className="w-full sm:w-auto px-6 py-3 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs rounded hover:bg-white transition-colors cursor-pointer shrink-0"
                                >
                                    [ AVANÇAR PARA A BATALHA DO POLETIME ] »
                                </button>
                            </div>
                        )}

                        {/* ATO 2: POLETIME */}
                        {currentAct === 2 && (
                            <div className="flex flex-col gap-3">
                                <span className="text-xs text-gray-300">
                                    Quem você apoia para cravar a volta mais rápida da classificação no Q3?
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => {
                                            setDraftPoletime(seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209');
                                            setPoletimeChosenSource('senior');
                                        }}
                                        className={`p-3 rounded border text-left transition-all cursor-pointer ${
                                            poletimeChosenSource === 'senior'
                                                ? 'bg-[#fbaa19]/20 border-[#fbaa19] text-[#fbaa19]'
                                                : 'bg-black/60 border-white/15 text-white/80 hover:border-white/40'
                                        }`}
                                    >
                                        <span className="text-[9px] uppercase block opacity-60">OPÇÃO SÊNIOR:</span>
                                        <span className="text-sm font-black">{seniorStrategist.briefingTips.poletimeTarget}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setDraftPoletime(technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164');
                                            setPoletimeChosenSource('tech');
                                        }}
                                        className={`p-3 rounded border text-left transition-all cursor-pointer ${
                                            poletimeChosenSource === 'tech'
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : 'bg-black/60 border-white/15 text-white/80 hover:border-white/40'
                                        }`}
                                    >
                                        <span className="text-[9px] uppercase block opacity-60">OPÇÃO TÉCNICO (DADOS):</span>
                                        <span className="text-sm font-black">{technicalStrategist?.telemetryBriefing.poletimeTarget}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={draftPoletime}
                                            onChange={(e) => {
                                                setDraftPoletime(e.target.value);
                                                setPoletimeChosenSource('custom');
                                            }}
                                            placeholder="1:12.000"
                                            className="w-full bg-black border border-white/20 p-2.5 rounded text-sm font-black text-center text-white focus:outline-none focus:border-[#fbaa19]"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleNextAct}
                                        className="px-6 py-2.5 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs rounded hover:bg-white transition-colors cursor-pointer"
                                    >
                                        [ CONFIRMAR POLE & IR PARA O TOP 10 ] »
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ATO 3: TOP 10 */}
                        {currentAct === 3 && (
                            <div className="flex flex-col gap-3">
                                <span className="text-xs text-gray-300">
                                    Grade recomendada de pilotos para pontuação na zona da FIA (Top 10):
                                </span>
                                
                                <div className="flex items-center gap-1.5 flex-wrap bg-white/5 p-3 rounded border border-white/10 font-black text-xs">
                                    {draftTop10.map((code, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-black border border-white/20 rounded">
                                            {idx + 1}º {code}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleNextAct}
                                        className="px-6 py-2.5 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs rounded hover:bg-white transition-colors cursor-pointer"
                                    >
                                        [ CONFIRMAR GRID & DEFINIR ALOCAÇÃO DE RISCO ] »
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ATO 4: ALOCAÇÃO DE RISCO SOLO (10%, 20%, 30%) */}
                        {currentAct === 4 && (
                            <div className="flex flex-col gap-3">
                                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                                    ⚠ DECISÃO EXCLUSIVA DO COMANDANTE // ALOCAÇÃO DE BANCA MLS:
                                </span>
                                <p className="text-[11px] text-gray-400">
                                    Defina a proporção do seu patrimônio em moeda Milesimus que você irá arriscar nas apostas desta etapa:
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    {[
                                        { val: 10, label: '10% // CONSERVADOR', desc: 'Preserva capital em corridas com risco de chuva ou Safety Car.' },
                                        { val: 20, label: '20% // TÁTICO EQUILIBRADO', desc: 'Retorno balanceado seguindo a telemetria da mesa.' },
                                        { val: 30, label: '30% // AGRESSIVO ALL-IN', desc: 'Máximo multiplicador para escalar divisões na liga.' },
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setRiskAllocation(opt.val as any)}
                                            className={`p-3.5 rounded border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                                riskAllocation === opt.val
                                                    ? 'bg-[#fbaa19] text-black border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.3)]'
                                                    : 'bg-black/60 border-white/15 text-white/80 hover:border-white/40'
                                            }`}
                                        >
                                            <span className="text-sm font-black">{opt.label}</span>
                                            <span className="text-[10px] leading-snug opacity-80">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleNextAct}
                                        className="px-6 py-2.5 bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs rounded hover:bg-white transition-colors cursor-pointer"
                                    >
                                        [ CONCLUIR BRIEFING & REVISAR HOMOLOGAÇÃO ] »
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ATO 5: REVISÃO & HOMOLOGAÇÃO FINAL */}
                        {currentAct === 5 && (
                            <div className="flex flex-col gap-4 animate-fade-in">
                                <div className="bg-white/5 border border-white/10 rounded p-4 text-xs flex flex-col gap-2">
                                    <span className="font-bold text-[#fbaa19] uppercase tracking-wider">
                                        ✓ SÚMULA DE PREVISÕES HOMOLOGADA PELA MESA:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                                        <div>
                                            <span className="text-white/40 block">POLETIME ESCOLHIDO:</span>
                                            <span className="font-black text-white text-sm">{draftPoletime}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40 block">P1 PROJETADO (RITMO):</span>
                                            <span className="font-black text-white text-sm">{draftTop10[0] || 'VER'}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40 block">RISCO DE BANCA:</span>
                                            <span className="font-black text-amber-400 text-sm">{riskAllocation}% MLS</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleHomologateToPositions}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm rounded shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>[ REVISAR & TRANSMITIR ORDENS OFICIAIS EM /POSITIONS ]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
