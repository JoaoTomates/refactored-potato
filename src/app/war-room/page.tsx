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
import { getGroupTechnicalEngineer } from '@/lib/group-engineers';
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
    startDelay = 60, 
    speed = 14 
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
                if (char === '.' || char === '!' || char === '?') delay = speed * 6;
                else if (char === ',' || char === '\n' || char === ':') delay = speed * 3;

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
            className="leading-relaxed relative whitespace-pre-wrap cursor-pointer select-none"
            title={isTyping ? "Clique para exibir tudo" : undefined}
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
    animationDirection: 'left' | 'right';
    isSettled?: boolean;
    settledLabel?: string;
    isFilled?: boolean;
    onOk?: () => void;
    onFill?: () => void;
    fillLabel?: string;
    okLabel?: string;
    avatarUrl?: string;
}

// Componente individual de Box Text DESACOPLADO (Círculo fixo + Retângulo de Diálogo)
// Se a conversa vier da esquerda (Sênior): Círculo na ponta esquerda, retângulo à direita
// Se a conversa vier da direita (Técnico): Círculo na ponta direita, retângulo à esquerda
function BoxCard({
    speakerBadge,
    speakerRole,
    categoryTag,
    text,
    accentColor,
    accentGlow,
    animationDirection,
    isSettled = false,
    settledLabel,
    isFilled = false,
    onOk,
    onFill,
    fillLabel,
    okLabel = 'OK',
    avatarUrl
}: BoxCardProps) {
    const cardColor = isFilled ? '#10b981' : accentColor;
    const cardGlow = isFilled ? 'rgba(16, 185, 129, 0.4)' : (accentGlow || `${accentColor}40`);

    const [currentImg, setCurrentImg] = useState(avatarUrl);
    useEffect(() => {
        setCurrentImg(avatarUrl);
    }, [avatarUrl]);

    const handleImgError = () => {
        if (currentImg && currentImg.startsWith('http')) {
            const parts = currentImg.split('/avatars/');
            if (parts[1]) {
                setCurrentImg(`/avatar/${parts[1]}`);
            }
        }
    };

    // Extrai o nome limpo para exibição no formato [ NOME ]
    const cleanBadge = (speakerBadge || '').replace(/[\[\]]/g, '').trim();
    const isRight = animationDirection === 'right';

    return (
        <div 
            className={`w-full flex items-center gap-3 sm:gap-4 transition-all duration-300 py-1.5 ${
                isRight ? 'flex-row-reverse' : 'flex-row'
            } ${
                animationDirection === 'left' ? 'animate-fade-in-left' : 'animate-fade-in-right'
            }`}
        >
            {/* 1. CÍRCULO DO AVATAR TOTALMENTE DESACOPLADO E COM TAMANHO FIXO */}
            <div className="flex flex-col items-center shrink-0 select-none">
                <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 flex items-center justify-center shadow-2xl bg-black shrink-0 transition-transform"
                    style={{ 
                        borderColor: cardColor,
                        boxShadow: `0 0 22px ${cardGlow}, inset 0 0 10px rgba(0,0,0,0.8)` 
                    }}
                >
                    <img 
                        src={currentImg} 
                        alt={cleanBadge} 
                        onError={handleImgError}
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
                {/* Plaqueta de nome ancorada logo abaixo do círculo */}
                <span 
                    className="text-[10px] sm:text-[11px] font-mono font-black tracking-wider mt-1.5 uppercase text-center truncate max-w-[80px] sm:max-w-[96px]"
                    style={{ color: cardColor }}
                >
                    [ {cleanBadge} ]
                </span>
            </div>

            {/* 2. RETÂNGULO DO DIÁLOGO TOTALMENTE DESACOPLADO E ESTÁVEL */}
            <div 
                className="flex-1 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-2xl border flex flex-col justify-between min-h-[92px] sm:min-h-[98px] backdrop-blur-md"
                style={{
                    backgroundColor: isFilled ? 'rgba(5, 14, 10, 0.97)' : 'rgba(7, 7, 9, 0.97)',
                    borderColor: isFilled ? 'rgba(16, 185, 129, 0.45)' : `${cardColor}40`,
                    boxShadow: `0 10px 30px -10px ${cardGlow}, 0 0 1px 1px ${cardColor}20`
                }}
            >
                {/* Fala do personagem com min-height estável para evitar qualquer expansão durante a digitação */}
                <div className={`text-white text-xs sm:text-sm font-semibold tracking-wide leading-relaxed py-0.5 min-h-[44px] flex items-center ${
                    isRight ? 'text-right justify-end' : 'text-left justify-start'
                }`}>
                    <TypewriterLine text={text} startDelay={60} />
                </div>

                {/* Divisória e Ações */}
                <div className={`mt-2 pt-2 border-t border-white/10 flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest font-mono ${
                    isRight ? 'justify-start' : 'justify-end'
                }`}>
                    {isSettled ? (
                        <div 
                            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono"
                            style={{ 
                                color: isFilled ? '#10b981' : '#ffffff80',
                                backgroundColor: isFilled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                border: isFilled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {isFilled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{settledLabel || (isFilled ? 'HOMOLOGADO' : 'OK REGISTRADO')}</span>
                        </div>
                    ) : (
                        <>
                            {onOk && (
                                <button
                                    type="button"
                                    onClick={onOk}
                                    className="px-4 py-1.5 rounded text-white/80 hover:text-white bg-black/80 hover:bg-white/10 border border-white/20 transition-all font-mono text-xs font-bold cursor-pointer"
                                >
                                    [ {okLabel} ]
                                </button>
                            )}

                            {onFill && fillLabel && (
                                <button
                                    type="button"
                                    onClick={onFill}
                                    className="px-4 py-1.5 rounded font-mono font-black text-xs text-black hover:brightness-110 transition-all uppercase tracking-wider shadow cursor-pointer flex items-center gap-1"
                                    style={{
                                        backgroundColor: cardColor,
                                        boxShadow: `0 0 16px ${cardColor}40`
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

// 5 Tópicos Paginados (A tela limpa entre cada tópico):
// 1: POLETIME
// 2: TOP10
// 3: EVO (Escalada)
// 4: H2H (Duelos)
// 5: FINAL_MISC (Transição para o usuário preencher o MISC sozinho)
type Topic = 'POLETIME' | 'TOP10' | 'EVO' | 'H2H' | 'FINAL_MISC';

export function WarRoomContent() {
    const router = useRouter();
    const { user } = useSupabaseAuth();

    // Aliança e Equipe
    const [userAlliance, setUserAlliance] = useState<AllianceCode>('B');
    const [userTeamCode, setUserTeamCode] = useState<string>('FER');
    
    // Personagens da Mesa
    const [seniorStrategist, setSeniorStrategist] = useState<SeniorStrategist>(SENIOR_STRATEGISTS[0]);
    const [technicalStrategist, setTechnicalStrategist] = useState<TechnicalStrategist | null>(null);

    // Estado de Tópico Paginado & Efeito de Limpeza de Tela
    const [currentTopic, setCurrentTopic] = useState<Topic>('POLETIME');
    const [isClearing, setIsClearing] = useState(false);

    // Sub-etapa interna em cada tópico:
    // 'SENIOR': apenas fala do Sênior visível (Row 1)
    // 'TECH': Técnico entrou abaixo em Row 2 (porque deu OK ou preencheu)
    const [subStep, setSubStep] = useState<'SENIOR' | 'TECH'>('SENIOR');
    const [topicSettledStatus, setTopicSettledStatus] = useState<string | null>(null);

    // Seletor de posicionamento dos diálogos (V1: Topo-Esquerdo [Padrão], V2: Centro)
    const [dialogVersion, setDialogVersion] = useState<1 | 2>(1);
    const [userSlug, setUserSlug] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('vg_user_slug');
            if (cached) return cached.startsWith('@') ? cached : `@${cached}`;
        }
        return 'pitwall';
    });

    // Dados salvos para o protocolo
    const [chosenPoletime, setChosenPoletime] = useState<string>('1:12.209');
    const [chosenTop10, setChosenTop10] = useState<string[]>(['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB']);
    const [chosenEvo, setChosenEvo] = useState<string[]>(['HAM', 'SAI', 'ALO', 'TSU', 'ALB']);
    const [chosenH2H, setChosenH2H] = useState<Record<string, string>>({
        m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
        m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27'
    });

    useEffect(() => {
        soundEngine.init();

        const loadProfile = async () => {
            let allianceKey: AllianceCode = 'B';
            let teamCode = 'FER';

            let userGroupId = 1;
            if (user) {
                const { data: p } = await supabase.from('profiles').select('slug').eq('id', user.id).maybeSingle();
                if (p?.slug) {
                    const s = p.slug.startsWith('@') ? p.slug : `@${p.slug}`;
                    setUserSlug(s);
                    if (typeof window !== 'undefined') localStorage.setItem('vg_user_slug', p.slug);
                }

                const { data: contract } = await supabase
                    .from('contracts')
                    .select('team_id, teams(code, color), group_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (contract) {
                    if (contract.group_id) userGroupId = Number(contract.group_id);
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
            const groupEng = getGroupTechnicalEngineer(userGroupId, user?.id || 'guest');
            if (groupEng) {
                tech.code = groupEng.code;
                tech.avatarUrl = groupEng.avatarUrl;
                tech.fullName = groupEng.fullName;
                tech.role = groupEng.role;
                tech.specialty = groupEng.specialty;
            }
            setTechnicalStrategist({ ...tech });
        };

        loadProfile();
    }, [user]);

    const theme = ALLIANCE_THEMES[userAlliance] || ALLIANCE_THEMES['B'];

    // Valores do Sênior e do Técnico
    const seniorTimeTarget = seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209';
    const techTimeTarget = technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164';

    const seniorTop3 = seniorStrategist.briefingTips.predictedTop3.slice(0, 3).join(', ');
    const techTop3 = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 3).join(', ') || 'NOR, VER, LEC';

    const seniorEvoDriver = seniorStrategist.briefingTips.predictedEvoDriver || 'HAM';
    const techEvoDriver = technicalStrategist?.telemetryBriefing.top10Picks[4] || 'SAI';

    const seniorH2HDrivers = seniorStrategist.briefingTips.dominantH2HDrivers.slice(0, 2).join(' & ') || 'NOR & VER';

    // Gravação em localStorage para integração perfeita com /positions
    const saveToLocalStorage = (updates: Partial<{ poletime: string; top10: string[]; evo: string[]; h2h: Record<string, string> }>) => {
        if (typeof window === 'undefined') return;
        const currentDraftRaw = localStorage.getItem('war_room_draft');
        let currentDraft: any = {};
        try {
            if (currentDraftRaw) currentDraft = JSON.parse(currentDraftRaw);
        } catch (_) {}

        const updated = {
            ...currentDraft,
            poletime: updates.poletime || currentDraft.poletime || chosenPoletime,
            top10: updates.top10 || currentDraft.top10 || chosenTop10,
            evo: updates.evo || currentDraft.evo || chosenEvo,
            h2h: updates.h2h || currentDraft.h2h || chosenH2H,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('war_room_draft', JSON.stringify(updated));
    };

    // Função de limpeza de tela e transição entre tópicos
    const transitionToTopic = (next: Topic) => {
        setIsClearing(true);
        setTimeout(() => {
            setCurrentTopic(next);
            setSubStep('SENIOR');
            setTopicSettledStatus(null);
            setIsClearing(false);
        }, 320);
    };

    // ==========================================
    // TÓPICO 1: POLETIME
    // ==========================================
    const handlePoletimeSeniorFill = () => {
        setChosenPoletime(seniorTimeTarget);
        saveToLocalStorage({ poletime: seniorTimeTarget });
        setTopicSettledStatus(`POLETIME [${seniorTimeTarget}] HOMOLOGADO`);
        // Técnico confirma sem contrariar e avança para Top 10
        setSubStep('TECH');
    };

    const handlePoletimeSeniorOk = () => {
        // Técnico surge com contra-proposta
        setSubStep('TECH');
    };

    const handlePoletimeTechFill = () => {
        setChosenPoletime(techTimeTarget);
        saveToLocalStorage({ poletime: techTimeTarget });
        transitionToTopic('TOP10');
    };

    const handlePoletimeTechOk = () => {
        saveToLocalStorage({ poletime: chosenPoletime });
        transitionToTopic('TOP10');
    };

    // ==========================================
    // TÓPICO 2: TOP 10 FINISH
    // ==========================================
    const handleTop10SeniorFill = () => {
        const grid = seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
        setChosenTop10(grid);
        saveToLocalStorage({ top10: grid });
        setTopicSettledStatus('TOP 10 SÊNIOR HOMOLOGADO');
        setSubStep('TECH');
    };

    const handleTop10SeniorOk = () => {
        setSubStep('TECH');
    };

    const handleTop10TechFill = () => {
        const grid = technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
        setChosenTop10(grid);
        saveToLocalStorage({ top10: grid });
        transitionToTopic('EVO');
    };

    const handleTop10TechOk = () => {
        saveToLocalStorage({ top10: chosenTop10 });
        transitionToTopic('EVO');
    };

    // ==========================================
    // TÓPICO 3: EVO / ESCALADA
    // ==========================================
    const handleEvoSeniorFill = () => {
        const evoGrid = [seniorEvoDriver, 'SAI', 'ALO', 'TSU', 'ALB'];
        setChosenEvo(evoGrid);
        saveToLocalStorage({ evo: evoGrid });
        setTopicSettledStatus(`ESCALADA [${seniorEvoDriver}] HOMOLOGADA`);
        setSubStep('TECH');
    };

    const handleEvoSeniorOk = () => {
        setSubStep('TECH');
    };

    const handleEvoTechFill = () => {
        const evoGrid = [techEvoDriver, 'HAM', 'ALO', 'TSU', 'COL'];
        setChosenEvo(evoGrid);
        saveToLocalStorage({ evo: evoGrid });
        transitionToTopic('H2H');
    };

    const handleEvoTechOk = () => {
        saveToLocalStorage({ evo: chosenEvo });
        transitionToTopic('H2H');
    };

    // ==========================================
    // TÓPICO 4: H2H / DUELOS TÁTICOS
    // ==========================================
    const handleH2HSeniorFill = () => {
        const seniorPicks = {
            m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
            m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27'
        };
        setChosenH2H(seniorPicks);
        saveToLocalStorage({ h2h: seniorPicks });
        setTopicSettledStatus('DUELOS HOMOLOGADOS NO PROTOCOLO');
        setSubStep('TECH');
    };

    const handleH2HSeniorOk = () => {
        setSubStep('TECH');
    };

    const handleH2HTechFill = () => {
        const techPicks = {
            m1: '81', m2: '44', m3: '12', m4: '01', m5: '14',
            m6: '43', m7: '87', m8: '41', m9: '77', m10: '23', m11: '05'
        };
        setChosenH2H(techPicks);
        saveToLocalStorage({ h2h: techPicks });
        transitionToTopic('FINAL_MISC');
    };

    const handleH2HTechOk = () => {
        saveToLocalStorage({ h2h: chosenH2H });
        transitionToTopic('FINAL_MISC');
    };

    // Redireciona o usuário diretamente para preencher o MISC sozinho no formulário de posições
    const handleGoToPositionsMisc = () => {
        router.push('/positions?tab=misc&from=war_room');
    };

    return (
        <main className={`w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono transition-all duration-300 ${
            dialogVersion === 1 ? 'items-start justify-start pt-16 sm:pt-20 px-4 sm:px-10' : 'items-center justify-center p-4'
        }`}>

            {/* KEYFRAME ANIMATIONS PARA FADE-IN LEFT & FADE-IN RIGHT */}
            <style jsx global>{`
                @keyframes fadeInLeftAnim {
                    0% { opacity: 0; transform: translateX(-32px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeInRightAnim {
                    0% { opacity: 0; transform: translateX(32px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-left {
                    animation: fadeInLeftAnim 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in-right {
                    animation: fadeInRightAnim 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* BACKGROUND IMERSIVO FRANK MILLER NOIR TRAVADO NA VIEWPORT (ESTILO INVITE) */}
            <div 
                className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden" 
                style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
            >
                <img
                    src="/war_room_bg.jpg"
                    alt="Formula 1 War Room Frank Miller Noir"
                    className="w-full h-full object-cover object-center brightness-[0.70] contrast-[1.28]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/75" />
            </div>

            {/* BARRA SUPERIOR: SAÍDA + SELETOR DE VERSÃO (V1 PADRÃO vs V2 CENTRO) */}
            <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between">
                <Link
                    href={`/${userSlug}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-[#fbaa19] transition-colors uppercase tracking-wider bg-black/75 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#fbaa19]" />
                    <span>[ « SAIR ]</span>
                </Link>

                {/* Seletor de Versão de Posicionamento do Diálogo */}
                <div className="flex items-center gap-2 bg-black/85 border border-white/15 px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-md">
                    <span className="text-white/40 uppercase text-[10px]">VERSÃO:</span>
                    <button
                        type="button"
                        onClick={() => setDialogVersion(1)}
                        className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                            dialogVersion === 1
                                ? 'bg-[#fbaa19] text-black shadow'
                                : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                    >
                        1
                    </button>
                    <button
                        type="button"
                        onClick={() => setDialogVersion(2)}
                        className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                            dialogVersion === 2
                                ? 'bg-[#fbaa19] text-black shadow'
                                : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                    >
                        2
                    </button>
                    <span className="text-[#fbaa19] text-[10px] font-bold ml-1">(V1 PADRÃO)</span>
                </div>

                <div className="w-16 hidden sm:block" />
            </div>

            {/* CONTAINER VERTICAL DE DIÁLOGOS COM TRANSIÇÃO DE LIMPEZA DE TELA */}
            <div 
                className={`relative z-10 w-full max-w-2xl px-2 sm:px-0 flex flex-col gap-5 transition-all duration-300 ${
                    dialogVersion === 1 ? 'self-start mt-2 sm:mt-4' : 'self-center mx-auto my-auto'
                } ${
                    isClearing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                }`}
            >

                {/* ========================================================================= */}
                {/* TÓPICO 1: POLETIME                                                        */}
                {/* ========================================================================= */}
                {currentTopic === 'POLETIME' && (
                    <>
                        {/* SÊNIOR (FADE-IN LEFT) */}
                        <div className="w-full">
                            <BoxCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                avatarUrl={seniorStrategist.avatarUrl}
                                categoryTag="1/4 • POLETIME Q3"
                                text={`"Sinto no estômago. Minha meta para a pole é ${seniorTimeTarget}. Abaixo disso, só no vácuo."`}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel={topicSettledStatus || 'OK REGISTRADO'}
                                isFilled={!!topicSettledStatus}
                                onOk={subStep === 'SENIOR' ? handlePoletimeSeniorOk : undefined}
                                onFill={subStep === 'SENIOR' ? handlePoletimeSeniorFill : undefined}
                                fillLabel={`PREENCHER (${seniorTimeTarget}) »`}
                                okLabel="OK"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag="TELEMETRIA"
                                    text={
                                        topicSettledStatus 
                                            ? `"Pole em ${seniorTimeTarget} homologada, chefe. Telemetria alinhada."`
                                            : `"Telemetria aponta ${techTimeTarget}. Há ganho aerodinâmico real no setor 2."`
                                    }
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onOk={handlePoletimeTechOk}
                                    onFill={!topicSettledStatus ? handlePoletimeTechFill : undefined}
                                    fillLabel={`PREENCHER (${techTimeTarget}) »`}
                                    okLabel="AVANÇAR PARA TOP 10 »"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================================= */}
                {/* TÓPICO 2: TOP 10 FINISH                                                   */}
                {/* ========================================================================= */}
                {currentTopic === 'TOP10' && (
                    <>
                        {/* SÊNIOR (FADE-IN LEFT) */}
                        <div className="w-full">
                            <BoxCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                avatarUrl={seniorStrategist.avatarUrl}
                                categoryTag="2/4 • TOP 10 FINISH"
                                text={`"Corrida é desgaste. Casca grossa decide: ${seniorTop3} na ponta."`}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel={topicSettledStatus || 'OK REGISTRADO'}
                                isFilled={!!topicSettledStatus}
                                onOk={subStep === 'SENIOR' ? handleTop10SeniorOk : undefined}
                                onFill={subStep === 'SENIOR' ? handleTop10SeniorFill : undefined}
                                fillLabel="PREENCHER TOP 10 SÊNIOR »"
                                okLabel="OK"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag="MONTE CARLO"
                                    text={
                                        topicSettledStatus
                                            ? `"Top 10 do chefe gravado no pitwall. Consistência blindada para domingo."`
                                            : `"Pirelli discorda, chefe. A degradação térmica favorece ${techTop3}."`
                                    }
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onOk={handleTop10TechOk}
                                    onFill={!topicSettledStatus ? handleTop10TechFill : undefined}
                                    fillLabel="PREENCHER TOP 10 TÉCNICO »"
                                    okLabel="AVANÇAR PARA EVO »"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================================= */}
                {/* TÓPICO 3: EVO / ESCALADA                                                  */}
                {/* ========================================================================= */}
                {currentTopic === 'EVO' && (
                    <>
                        {/* SÊNIOR (FADE-IN LEFT) */}
                        <div className="w-full">
                            <BoxCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                avatarUrl={seniorStrategist.avatarUrl}
                                categoryTag="3/4 • EVO / ESCALADA"
                                text={`"Na largada vai ter confusão. Aposto em ${seniorEvoDriver} escalando o pelotão."`}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel={topicSettledStatus || 'OK REGISTRADO'}
                                isFilled={!!topicSettledStatus}
                                onOk={subStep === 'SENIOR' ? handleEvoSeniorOk : undefined}
                                onFill={subStep === 'SENIOR' ? handleEvoSeniorFill : undefined}
                                fillLabel={`PREENCHER ESCALADA (${seniorEvoDriver}) »`}
                                okLabel="OK"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag="DELTA ULTRAPASSAGEM"
                                    text={
                                        topicSettledStatus
                                            ? `"Estratégia de escalada aceita. 5 pilotos setados na ofensiva."`
                                            : `"Ritmo de tráfego indica ${techEvoDriver} com maior delta de ultrapassagem."`
                                    }
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onOk={handleEvoTechOk}
                                    onFill={!topicSettledStatus ? handleEvoTechFill : undefined}
                                    fillLabel={`PREENCHER ESCALADA (${techEvoDriver}) »`}
                                    okLabel="AVANÇAR PARA H2H »"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================================= */}
                {/* TÓPICO 4: H2H / DUELOS TÁTICOS                                            */}
                {/* ========================================================================= */}
                {currentTopic === 'H2H' && (
                    <>
                        {/* SÊNIOR (FADE-IN LEFT) */}
                        <div className="w-full">
                            <BoxCard
                                speakerBadge={`[${seniorStrategist.code}]`}
                                speakerRole="ESTRATEGISTA SÊNIOR"
                                avatarUrl={seniorStrategist.avatarUrl}
                                categoryTag="4/4 • DUELOS TÁTICOS"
                                text={`"Primeiro rival é o companheiro de box. Cravamos ${seniorH2HDrivers} nos duelos internos."`}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel={topicSettledStatus || 'OK REGISTRADO'}
                                isFilled={!!topicSettledStatus}
                                onOk={subStep === 'SENIOR' ? handleH2HSeniorOk : undefined}
                                onFill={subStep === 'SENIOR' ? handleH2HSeniorFill : undefined}
                                fillLabel="PREENCHER DUELOS SÊNIOR »"
                                okLabel="OK"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag="DUELOS ASA MÓVEL"
                                    text={
                                        topicSettledStatus
                                            ? `"Duelos confirmados no pitwall. Protocolo fechado para os 11 confrontos."`
                                            : `"Telemetria cruzada aponta inversão técnica nos duelos de asa móvel."`
                                    }
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onOk={handleH2HTechOk}
                                    onFill={!topicSettledStatus ? handleH2HTechFill : undefined}
                                    fillLabel="PREENCHER DUELOS TÉCNICO »"
                                    okLabel="CONCLUIR REUNIÃO »"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================================= */}
                {/* TÓPICO 5: CONCLUSÃO & DIRECIONAMENTO PARA O USUÁRIO PREENCHER O MISC      */}
                {/* ========================================================================= */}
                {currentTopic === 'FINAL_MISC' && (
                    <div className="w-full animate-fade-in">
                        <div 
                            className="relative w-full rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col items-center gap-5 text-center border shadow-2xl"
                            style={{
                                backgroundColor: 'rgba(8, 20, 15, 0.95)',
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                                boxShadow: '0 15px 40px -10px rgba(16, 185, 129, 0.35)'
                            }}
                        >
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>✓ POLETIME, TOP 10, EVO E DUELOS COMPILADOS</span>
                            </div>

                            <p className="text-white/85 text-xs sm:text-sm max-w-lg leading-relaxed">
                                A estratégia principal da equipe está fechada no protocolo. Agora é a sua vez como Estrategista Principal: defina os eventos de pista (<span className="text-[#fbaa19] font-bold">MISC / Event Props</span>) sozinho no grid.
                            </p>

                            <button
                                onClick={handleGoToPositionsMisc}
                                className="w-full max-w-md bg-[#fbaa19] text-black font-black uppercase tracking-[0.2em] py-3.5 px-6 hover:bg-white transition-all rounded-xl shadow-[0_0_25px_rgba(251,170,25,0.45)] cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                                <span>[ TRANSMITIR ORDENS & PREENCHER MISC ]</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

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
