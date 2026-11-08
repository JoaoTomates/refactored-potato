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
import { ChevronLeft, ArrowRight, Check } from 'lucide-react';

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

    // Estado do Fluxo Sequencial
    // 1: Sênior fala Poletime
    // 2: Técnico fala Poletime (se usuário deu OK no Sênior)
    // 3: Sênior fala Top 10 (após poletime preenchido ou OK técnico)
    // 4: Técnico fala Top 10 (se usuário deu OK no Sênior Top 10)
    // 5: Concluído
    const [flowStep, setFlowStep] = useState<1 | 2 | 3 | 4 | 5>(1);

    // Dados Homologados
    const [chosenPoletime, setChosenPoletime] = useState<string | null>(null);
    const [chosenPoletimeSource, setChosenPoletimeSource] = useState<'senior' | 'tech' | null>(null);
    const [chosenTop10, setChosenTop10] = useState<string[] | null>(null);
    const [chosenTop10Source, setChosenTop10Source] = useState<'senior' | 'tech' | null>(null);

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

    // Ações de Poletime
    const handleSeniorPoletimeOk = () => {
        setFlowStep(2); // Abre fala do Engenheiro Técnico
    };

    const handleSeniorPoletimeFill = () => {
        const time = seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209';
        setChosenPoletime(time);
        setChosenPoletimeSource('senior');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança direto para o Top 10
    };

    const handleTechPoletimeOk = () => {
        // Se deu OK no técnico sem preencher, adota o tempo do técnico como padrão e avança
        const time = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';
        setChosenPoletime(time);
        setChosenPoletimeSource('tech');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança para o Top 10
    };

    const handleTechPoletimeFill = () => {
        const time = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';
        setChosenPoletime(time);
        setChosenPoletimeSource('tech');
        saveDraft(time, chosenTop10);
        setFlowStep(3); // Avança para o Top 10
    };

    // Ações de Top 10
    const handleSeniorTop10Ok = () => {
        setFlowStep(4); // Abre fala do Engenheiro Técnico no Top 10
    };

    const handleSeniorTop10Fill = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        setChosenTop10Source('senior');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído
    };

    const handleTechTop10Ok = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído
    };

    const handleTechTop10Fill = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        setChosenTop10Source('tech');
        saveDraft(chosenPoletime, grid);
        setFlowStep(5); // Concluído
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

    const faction = ENGINE_FACTIONS[userAlliance] || ENGINE_FACTIONS['B'];
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
                    className="w-full h-full object-cover object-center brightness-[0.80] contrast-[1.18]"
                />
                {/* Vinheta e Atmosfera Noir */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
            </div>

            {/* TOP BAR MINIMALISTA (ESTILO INVITE) */}
            <header className="relative z-20 w-full bg-black/85 border-b border-white/10 px-4 md:px-8 py-3 backdrop-blur-md flex items-center justify-between">
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
                            style={{ borderColor: `${teamColor}40`, color: teamColor, backgroundColor: `${teamColor}10` }}
                        >
                            {userTeamCode} • {faction.badge}
                        </span>
                    </div>
                </div>

                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest hidden sm:flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ENGENHARIA DE PISTA ATIVA</span>
                </div>
            </header>

            {/* CSS GRID: 4 COLUNAS NO DESKTOP // ROW 1 (POLETIME) & ROW 2 (TOP 10) */}
            <div className="relative z-10 w-full max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex-1 flex flex-col justify-center">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                    
                    {/* ============================================================ */}
                    {/* COLUNA 2, ROW 1: ENGENHEIRO SÊNIOR // POLETIME (DESIGN INVITE) */}
                    {/* ============================================================ */}
                    {flowStep >= 1 && (
                        <div className="md:col-start-2 md:row-start-1 w-full animate-fade-in">
                            <div className="w-full bg-black/85 p-5 md:p-6 backdrop-blur-sm border border-[#fbaa19]/35 rounded-lg shadow-2xl flex flex-col gap-3 group">
                                
                                {/* Cabeçalho do Box no estilo Invite */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-[#fbaa19] text-xs">&gt;_</span>
                                        <span className="text-xs font-black uppercase tracking-wider text-[#fbaa19]">
                                            [{seniorStrategist.code} // SÊNIOR]
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-white/50 uppercase tracking-widest">
                                        POLETIME Q3
                                    </span>
                                </div>

                                {/* Fala do Engenheiro Sênior sobre Poletime */}
                                <div className="text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed min-h-[75px]">
                                    <TypewriterLine
                                        text={`"No volante da F1 a gente sente no estômago. Minha meta de Pole Position para o Q3 é ${seniorTimeTarget}. Qualquer tempo abaixo disso vai depender de vácuo cirúrgico."`}
                                        startDelay={100}
                                    />
                                </div>

                                {/* Dois botões: [ OK ] e [ PREENCHER FORMULÁRIO POLETIME ] */}
                                <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                    <button
                                        onClick={handleSeniorPoletimeOk}
                                        disabled={flowStep > 2 && chosenPoletimeSource === 'senior'}
                                        className={`transition-colors p-1 cursor-pointer ${
                                            flowStep === 1 
                                                ? 'text-white/60 hover:text-white' 
                                                : 'text-white/30'
                                        }`}
                                    >
                                        [ OK ]
                                    </button>

                                    <button
                                        onClick={handleSeniorPoletimeFill}
                                        className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                                            chosenPoletimeSource === 'senior'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                : 'text-[#fbaa19] hover:text-white animate-pulse'
                                        }`}
                                    >
                                        {chosenPoletimeSource === 'senior' && <Check className="w-3.5 h-3.5" />}
                                        <span>[ PREENCHER FORMULÁRIO POLETIME ({seniorTimeTarget}) ] »</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* COLUNA 3, ROW 1: ENGENHEIRO TÉCNICO // POLETIME (FADE IN OPOSIÇÃO) */}
                    {/* ============================================================ */}
                    {flowStep >= 2 && technicalStrategist && (
                        <div className="md:col-start-3 md:row-start-1 w-full animate-fade-in">
                            <div 
                                className="w-full bg-black/85 p-5 md:p-6 backdrop-blur-sm border rounded-lg shadow-2xl flex flex-col gap-3 group"
                                style={{ borderColor: `${teamColor}60` }}
                            >
                                {/* Cabeçalho do Box no estilo Invite */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-xs" style={{ color: teamColor }}>&gt;_</span>
                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: teamColor }}>
                                            [{technicalStrategist.code} // TÉCNICO]
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-white/50 uppercase tracking-widest">
                                        TELEMETRIA Q3
                                    </span>
                                </div>

                                {/* Fala do Engenheiro Técnico sugerindo novamente o Poletime */}
                                <div className="text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed min-h-[75px]">
                                    <TypewriterLine
                                        text={`"Os dados de túnel de vento apontam ganho nas curvas de raio longo. Minha telemetria projeta a Pole Position em ${techTimeTarget}. ${technicalStrategist.telemetryBriefing.reasoning}"`}
                                        startDelay={150}
                                    />
                                </div>

                                {/* Dois botões: [ OK ] e [ PREENCHER FORMULÁRIO POLETIME ] */}
                                <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                    <button
                                        onClick={handleTechPoletimeOk}
                                        className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
                                    >
                                        [ OK ]
                                    </button>

                                    <button
                                        onClick={handleTechPoletimeFill}
                                        className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                                            chosenPoletimeSource === 'tech'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                : 'text-[#fbaa19] hover:text-white animate-pulse'
                                        }`}
                                    >
                                        {chosenPoletimeSource === 'tech' && <Check className="w-3.5 h-3.5" />}
                                        <span>[ PREENCHER FORMULÁRIO POLETIME ({techTimeTarget}) ] »</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* COLUNA 2, ROW 2: ENGENHEIRO SÊNIOR // TOP 10 (MESMA DINÂMICA) */}
                    {/* ============================================================ */}
                    {flowStep >= 3 && (
                        <div className="md:col-start-2 md:row-start-2 w-full animate-fade-in mt-4 md:mt-0">
                            <div className="w-full bg-black/85 p-5 md:p-6 backdrop-blur-sm border border-[#fbaa19]/35 rounded-lg shadow-2xl flex flex-col gap-3 group">
                                
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-[#fbaa19] text-xs">&gt;_</span>
                                        <span className="text-xs font-black uppercase tracking-wider text-[#fbaa19]">
                                            [{seniorStrategist.code} // SÊNIOR]
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-white/50 uppercase tracking-widest">
                                        TOP 10 FINISH // RITMO
                                    </span>
                                </div>

                                <div className="text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed min-h-[75px]">
                                    <TypewriterLine
                                        text={`"Na corrida o desgaste fala mais alto que uma volta lançada. Para o Top 10, aposte na casca grossa: ${seniorStrategist.briefingTips.predictedTop3.join(' • ')} na ponta. ${seniorStrategist.briefingTips.top3Reasoning}"`}
                                        startDelay={100}
                                    />
                                </div>

                                <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                    <button
                                        onClick={handleSeniorTop10Ok}
                                        className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
                                    >
                                        [ OK ]
                                    </button>

                                    <button
                                        onClick={handleSeniorTop10Fill}
                                        className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                                            chosenTop10Source === 'senior'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                : 'text-[#fbaa19] hover:text-white animate-pulse'
                                        }`}
                                    >
                                        {chosenTop10Source === 'senior' && <Check className="w-3.5 h-3.5" />}
                                        <span>[ PREENCHER FORMULÁRIO TOP 10 ] »</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* COLUNA 3, ROW 2: ENGENHEIRO TÉCNICO // TOP 10 (MESMA DINÂMICA) */}
                    {/* ============================================================ */}
                    {flowStep >= 4 && technicalStrategist && (
                        <div className="md:col-start-3 md:row-start-2 w-full animate-fade-in mt-4 md:mt-0">
                            <div 
                                className="w-full bg-black/85 p-5 md:p-6 backdrop-blur-sm border rounded-lg shadow-2xl flex flex-col gap-3 group"
                                style={{ borderColor: `${teamColor}60` }}
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-xs" style={{ color: teamColor }}>&gt;_</span>
                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: teamColor }}>
                                            [{technicalStrategist.code} // TÉCNICO]
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-white/50 uppercase tracking-widest">
                                        TOP 10 // TELEMETRIA PIRELLI
                                    </span>
                                </div>

                                <div className="text-white text-xs md:text-sm font-bold tracking-widest leading-relaxed min-h-[75px]">
                                    <TypewriterLine
                                        text={`"Os modelos Monte Carlo de degradação térmica apontam o Top 10 mais provável: ${technicalStrategist.telemetryBriefing.top10Picks.slice(0, 5).join(', ')} no pelotão de frente. ${technicalStrategist.telemetryBriefing.top10Reasoning}"`}
                                        startDelay={150}
                                    />
                                </div>

                                <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                    <button
                                        onClick={handleTechTop10Ok}
                                        className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
                                    >
                                        [ OK ]
                                    </button>

                                    <button
                                        onClick={handleTechTop10Fill}
                                        className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                                            chosenTop10Source === 'tech'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                : 'text-[#fbaa19] hover:text-white animate-pulse'
                                        }`}
                                    >
                                        {chosenTop10Source === 'tech' && <Check className="w-3.5 h-3.5" />}
                                        <span>[ PREENCHER FORMULÁRIO TOP 10 ] »</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* BOTÃO FINAL DE HOMOLOGAÇÃO QUANDO O FLUXO É CONCLUÍDO (ESTILO INVITE) */}
                {flowStep === 5 && (
                    <div className="mt-8 md:mt-12 w-full max-w-xl mx-auto animate-fade-in flex flex-col items-center gap-3">
                        <button
                            onClick={handleGoToPositions}
                            className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] p-4 hover:bg-white transition-colors rounded shadow-[0_0_20px_rgba(251,170,25,0.4)] cursor-pointer text-xs md:text-sm flex items-center justify-center gap-2"
                        >
                            <span>[ REVISAR & TRANSMITIR ORDENS EM /POSITIONS ]</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-white/50 tracking-widest uppercase">
                            ✓ POLETIME E TOP 10 COMPILADOS NO PROTOCOLO DA BAEFF1
                        </span>
                    </div>
                )}
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
