"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SENIOR_STRATEGISTS, SeniorStrategist, getSeniorStrategistForRound, getSeniorStrategistById } from '@/lib/race-directors';
import { 
    TechnicalStrategist, 
    getActiveTechnicalStrategist, 
    AllianceCode 
} from '@/lib/technical-strategists';
import { getGroupTechnicalEngineer } from '@/lib/group-engineers';
import { getStrategistSquad } from '@/lib/teamwork';
import { getDashboardPath, normalizeAtSlug, slugAlphanumericKey } from '@/lib/slug';
import { ChevronLeft, ArrowRight, Sparkles, Brain, Trash2, Check, X } from 'lucide-react';
import { DialogueBox, DialogueActionButton, pitWallSound as soundEngine } from '@/components/dialogue-box';
import { useWarRoomChat } from '@/hooks/useWarRoomChat';
import { RACE_WEEK_DIALOGS } from '@/data/dialogues';
import { usePredictionStore } from '@/store/usePredictionStore';
import { ValidatedPrediction } from '@/lib/prediction-validator';
import { StrategistMemory } from '@/lib/strategist-memory';

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
    onCopy?: () => void;
    onFill?: () => void;
    fillLabel?: string;
    copyLabel?: string;
    avatarUrl?: string;
    strategySource?: string;
    isStreaming?: boolean;
    streamingBadge?: string;
    onRadioConsult?: () => void;
    radioConsultLabel?: string;
}

function BoxCard({
    speakerBadge,
    speakerRole,
    categoryTag,
    text,
    accentColor,
    animationDirection,
    isSettled = false,
    settledLabel,
    isFilled = false,
    onCopy,
    onFill,
    fillLabel,
    copyLabel = 'COPY',
    avatarUrl,
    strategySource,
    isStreaming = false,
    streamingBadge,
    onRadioConsult,
    radioConsultLabel = '[ RÁDIO AO VIVO ]',
}: BoxCardProps) {
    const actions: DialogueActionButton[] = [];
    if (onRadioConsult && !isStreaming) {
        actions.push({ label: radioConsultLabel, onClick: onRadioConsult, variant: 'secondary' });
    }
    if (!isSettled && onCopy) {
        actions.push({ label: `[ ${copyLabel} ]`, onClick: onCopy, variant: 'secondary' });
    }
    if (onFill && fillLabel) {
        actions.push({ label: fillLabel, onClick: onFill, variant: 'primary' });
    }

    return (
        <DialogueBox
            speaker={speakerBadge}
            speakerRole={speakerRole}
            categoryTag={categoryTag}
            avatarUrl={avatarUrl}
            dataStrategySource={strategySource}
            text={text}
            accentColor={accentColor}
            direction={animationDirection}
            prefix={null}
            startDelay={60}
            speed={14}
            isSettled={isSettled}
            settledLabel={settledLabel}
            isFilled={isFilled}
            isStreaming={isStreaming}
            streamingBadge={streamingBadge}
            actions={actions}
            animateEntrance
        />
    );
}

// ==========================================
// ESTRUTURAS DE DADOS: REFERÊNCIA HISTÓRICA DO EVENTO ANTERIOR & CONSENSO
// ==========================================
interface HistoricalRaceRef {
    year: string;
    circuitName: string;
    poleTime: string;
    poleDriver: string;
    top10Finish: string[];
    top3: string;
    details: string;
}

const HISTORICAL_RACES: Record<string, HistoricalRaceRef> = {
    '18': {
        year: '2025',
        circuitName: 'Austin (COTA)',
        poleTime: '1:32.329',
        poleDriver: 'L.NORRIS',
        top10Finish: ['LEC', 'SAI', 'VER', 'NOR', 'PIA', 'RUS', 'PER', 'HUL', 'LAW', 'COL'],
        top3: 'LEC, SAI, VER',
        details: 'Pole histórica de L. Norris em 1:32.329. Dobradinha da Ferrari no GP com Charles Leclerc em P1.'
    },
    '19': {
        year: '2025',
        circuitName: 'México (Hermanos Rodríguez)',
        poleTime: '1:15.946',
        poleDriver: 'C.SAINZ',
        top10Finish: ['SAI', 'NOR', 'LEC', 'HAM', 'RUS', 'VER', 'MAG', 'PIA', 'HUL', 'GAS'],
        top3: 'SAI, NOR, LEC',
        details: 'Pole e vitória histórica de C. Sainz em 1:15.946 na altitude do México.'
    },
    '20': {
        year: '2025',
        circuitName: 'Brasil (Interlagos)',
        poleTime: '1:09.680',
        poleDriver: 'L.NORRIS',
        top10Finish: ['VER', 'OCO', 'GAS', 'RUS', 'LEC', 'NOR', 'TSU', 'LAW', 'HAM', 'PIA'],
        top3: 'VER, OCO, GAS',
        details: 'Pole histórica de L. Norris (1:09.680) e vitória histórica de Verstappen na chuva.'
    },
    '1': {
        year: '2025',
        circuitName: 'Bahrein (Sakhir)',
        poleTime: '1:29.179',
        poleDriver: 'M.VERSTAPPEN',
        top10Finish: ['VER', 'PER', 'SAI', 'LEC', 'RUS', 'NOR', 'HAM', 'PIA', 'ALO', 'STR'],
        top3: 'VER, PER, SAI',
        details: 'Pole histórica de M. Verstappen em 1:29.179 com ritmo dominante.'
    }
};

function getHistoricalRaceData(round: number | string): HistoricalRaceRef {
    const key = String(round);
    return HISTORICAL_RACES[key] || HISTORICAL_RACES['19'];
}

interface ConsensusData {
    source: 'TEAMWORK' | 'ALLIANCE' | 'GENERAL';
    sourceLabel: string;
    categoryTag: string;
    poleTime: string;
    top10Finish: string[];
    top3: string;
    reasoning: string;
}

async function fetchConsensusData(
    userId: string,
    allianceKey: AllianceCode,
    defaultTechTime: string,
    defaultTechTop10: string[]
): Promise<ConsensusData> {
    try {
        // 1. Prioridade 1: Teamwork Squad do Usuário
        if (userId && userId !== 'guest') {
            const squad = await getStrategistSquad(userId);
            if (squad && squad.members.length > 0) {
                const memberIds = squad.members.map(m => m.userId);
                const { data: squadPreds } = await supabase
                    .from('predictions')
                    .select('poletime, top10, positions')
                    .in('user_id', memberIds)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (squadPreds && squadPreds.length > 0) {
                    const validTimes = squadPreds.map((p: any) => p.poletime).filter(Boolean);
                    const chosenTime = validTimes.length > 0 ? validTimes[0] : defaultTechTime;
                    
                    const driverCounts: Record<string, number> = {};
                    squadPreds.forEach((p: any) => {
                        const list = (p.top10 || p.positions || []) as string[];
                        list.forEach((drv, idx) => {
                            if (typeof drv === 'string') {
                                driverCounts[drv] = (driverCounts[drv] || 0) + (10 - idx);
                            }
                        });
                    });
                    const ranked = Object.keys(driverCounts).sort((a, b) => driverCounts[b] - driverCounts[a]);
                    const finalTop10 = ranked.length >= 5 
                        ? ranked.concat(defaultTechTop10.filter(d => !ranked.includes(d))).slice(0, 10)
                        : defaultTechTop10;

                    return {
                        source: 'TEAMWORK',
                        sourceLabel: `TEAMWORK [${squad.name.toUpperCase()}]`,
                        categoryTag: 'TEAMWORK SQUAD',
                        poleTime: chosenTime,
                        top10Finish: finalTop10,
                        top3: finalTop10.slice(0, 3).join(', '),
                        reasoning: `Consenso calculado a partir dos estrategistas do esquadrão ${squad.name}.`
                    };
                }
            }
        }

        // 2. Prioridade 2: Aliança Técnica de Motor (Bloco A, B ou C)
        const allianceTeams = allianceKey === 'A' ? ['MER', 'MCL', 'ALP', 'WIL']
            : allianceKey === 'B' ? ['FER', 'HAA', 'CAD']
            : ['RBR', 'RBA', 'AST', 'AUD'];

        const { data: allianceContracts } = await supabase
            .from('contracts')
            .select('user_id, team_id, teams!inner(code)')
            .in('teams.code', allianceTeams)
            .limit(15);

        if (allianceContracts && allianceContracts.length > 0) {
            const userIds = allianceContracts.map((c: any) => c.user_id).filter(Boolean);
            if (userIds.length > 0) {
                const { data: alliancePreds } = await supabase
                    .from('predictions')
                    .select('poletime, top10, positions')
                    .in('user_id', userIds)
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (alliancePreds && alliancePreds.length > 0) {
                    const validTimes = alliancePreds.map((p: any) => p.poletime).filter(Boolean);
                    const chosenTime = validTimes.length > 0 ? validTimes[0] : defaultTechTime;
                    return {
                        source: 'ALLIANCE',
                        sourceLabel: `ALIANÇA TÉCNICA [BLOCO ${allianceKey}]`,
                        categoryTag: 'ALIANÇA TÉCNICA',
                        poleTime: chosenTime,
                        top10Finish: defaultTechTop10,
                        top3: defaultTechTop10.slice(0, 3).join(', '),
                        reasoning: `Telemetria compartilhada entre as garagens do Bloco ${allianceKey}.`
                    };
                }
            }
        }

        // 3. Prioridade 3: Mercado Geral do Grid
        const { data: generalPreds } = await supabase
            .from('predictions')
            .select('poletime, top10, positions')
            .order('created_at', { ascending: false })
            .limit(20);

        if (generalPreds && generalPreds.length > 0) {
            const validTimes = generalPreds.map((p: any) => p.poletime).filter(Boolean);
            const chosenTime = validTimes.length > 0 ? validTimes[0] : defaultTechTime;
            return {
                source: 'GENERAL',
                sourceLabel: 'MERCADO GERAL DO GRID',
                categoryTag: 'TENDÊNCIA GERAL',
                poleTime: chosenTime,
                top10Finish: defaultTechTop10,
                top3: defaultTechTop10.slice(0, 3).join(', '),
                reasoning: 'Média de apostas e projeções coletivas de todo o grid BAEFF1.'
            };
        }
    } catch (e) {
        console.error('Erro ao buscar dados de consenso:', e);
    }

    return {
        source: 'GENERAL',
        sourceLabel: 'CONSENSO GERAL DO GRID',
        categoryTag: 'TENDÊNCIA GERAL',
        poleTime: defaultTechTime,
        top10Finish: defaultTechTop10,
        top3: defaultTechTop10.slice(0, 3).join(', '),
        reasoning: 'Calibrado com os modelos estocásticos de telemetria do paddock.'
    };
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
    const searchParams = useSearchParams();
    const mentorParam = searchParams.get('mentor');
    const driverParam = searchParams.get('driver');
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const [accessReady, setAccessReady] = useState(false);

    // Aliança e Equipe
    const [userAlliance, setUserAlliance] = useState<AllianceCode>('B');
    const [userTeamCode, setUserTeamCode] = useState<string>('FER');
    
    // Personagens da Mesa
    const [seniorStrategist, setSeniorStrategist] = useState<SeniorStrategist>(SENIOR_STRATEGISTS[0]);
    const [technicalStrategist, setTechnicalStrategist] = useState<TechnicalStrategist | null>(null);

    // Fontes de inteligência (Histórica do Ano Anterior e Consenso Teamwork/Aliança/Geral)
    const [historicalData, setHistoricalData] = useState<HistoricalRaceRef>(HISTORICAL_RACES['19']);
    const [consensusData, setConsensusData] = useState<ConsensusData | null>(null);
    const [isSeniorHistoricalRole, setIsSeniorHistoricalRole] = useState<boolean>(true);

    // Estado de Tópico Paginado & Efeito de Limpeza de Tela
    const [currentTopic, setCurrentTopic] = useState<Topic>('POLETIME');
    const [isClearing, setIsClearing] = useState(false);

    // Rádio do Pitwall / IA dos Estrategistas
    const {
        isTransmitting,
        streamingText,
        activeSpeaker,
        remainingToday,
        askStrategist,
        resetChat,
    } = useWarRoomChat();

    const getCardText = (charType: 'senior' | 'technical', defaultText: string) => {
        if (activeSpeaker === charType && streamingText !== null) {
            return streamingText;
        }
        return defaultText;
    };

    const isCardStreaming = (charType: 'senior' | 'technical') => {
        return isTransmitting && activeSpeaker === charType;
    };

    const todayIndex = new Date().getDay();
    const dayIndexToDayId: Record<number, string> = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
    };
    const activeRaceWeekDay = dayIndexToDayId[todayIndex] || 'fri';
    const activeRaceWeekObjective = RACE_WEEK_DIALOGS[activeRaceWeekDay]?.tacticalObjective;

    // Sub-etapa interna em cada tópico:
    // 'SENIOR': apenas fala do Sênior visível (Row 1)
    // 'TECH': Técnico entrou abaixo em Row 2 (porque deu OK ou preencheu)
    const [subStep, setSubStep] = useState<'SENIOR' | 'TECH'>('SENIOR');

    const [userSlug, setUserSlug] = useState<string>('');

    // Dados salvos para o protocolo
    const [chosenPoletime, setChosenPoletime] = useState<string>('1:12.209');
    const [chosenTop10, setChosenTop10] = useState<string[]>(['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB']);
    const [chosenEvo, setChosenEvo] = useState<string[]>(['HAM', 'SAI', 'ALO', 'TSU', 'ALB']);
    const [chosenH2H, setChosenH2H] = useState<Record<string, string>>({
        m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
        m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27'
    });

    const store = usePredictionStore();

    // Estado da Sugestão Assistida por IA
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestModalOpen, setSuggestModalOpen] = useState(false);
    const [suggestedPrediction, setSuggestedPrediction] = useState<ValidatedPrediction | null>(null);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [applySuccessNotice, setApplySuccessNotice] = useState<string | null>(null);

    // Estado da Memória Tática
    const [memoryModalOpen, setMemoryModalOpen] = useState(false);
    const [tacticalMemory, setTacticalMemory] = useState<StrategistMemory | null>(null);
    const [isMemoryLoading, setIsMemoryLoading] = useState(false);
    const [memoryResetNotice, setMemoryResetNotice] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace('/superlicense?redirect=/war-room');
            return;
        }

        soundEngine.init();
        let isActive = true;

        const loadProfile = async () => {
            let allianceKey: AllianceCode = 'B';
            let teamCode = 'FER';
            let userGroupId = 1;
            let resolvedSenior: SeniorStrategist | null = null;

            // 1. Carrega exclusivamente dados do perfil e contrato do usuário autenticado
            const [{ data: p }, { data: contract }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, slug, senior_strategist_id, setup_completed')
                    .eq('id', user.id)
                    .maybeSingle(),
                supabase
                    .from('contracts')
                    .select('team_id, teams(code, color), group_id')
                    .eq('user_id', user.id)
                    .maybeSingle()
            ]);

            if (!isActive) return;

            if (!p || p.setup_completed !== true || !contract) {
                router.replace('/headquarters');
                return;
            }

            // 2. Bloqueia participação na War Room de outro estrategista via query param (?driver=...)
            if (driverParam && p.slug && slugAlphanumericKey(driverParam) !== slugAlphanumericKey(p.slug)) {
                router.replace('/war-room');
                return;
            }

            const ownSlug = normalizeAtSlug(p.slug);
            if (ownSlug) {
                setUserSlug(ownSlug);
                if (typeof window !== 'undefined') localStorage.setItem('vg_user_slug', ownSlug);
            }

            if (p.senior_strategist_id) {
                resolvedSenior = getSeniorStrategistById(p.senior_strategist_id) || null;
            }

            if (contract) {
                if (contract.group_id) userGroupId = Number(contract.group_id);
                const t = Array.isArray(contract.teams) ? contract.teams[0] : contract.teams;
                if (t?.code) teamCode = t.code;

                if (['MER', 'MCL', 'ALP', 'WIL'].includes(teamCode)) allianceKey = 'A';
                else if (['FER', 'HAA', 'CAD'].includes(teamCode)) allianceKey = 'B';
                else allianceKey = 'C';
            }

            // 3. Apenas se o usuário autenticado não possuir mentor salvo no perfil, aceita fallback de URL/rodada
            if (!resolvedSenior && mentorParam) {
                const queryMentor = getSeniorStrategistById(mentorParam);
                if (queryMentor) resolvedSenior = queryMentor;
            }

            // 4. Fallback final para rodada oficial (ex: round 19)
            if (!resolvedSenior) {
                resolvedSenior = getSeniorStrategistForRound(19);
            }

            setUserAlliance(allianceKey);
            setUserTeamCode(teamCode);
            setSeniorStrategist(resolvedSenior);

            // 5. Configura o Engenheiro Técnico da Garagem do próprio usuário
            const tech = getActiveTechnicalStrategist(user.id, teamCode, allianceKey);
            const groupEng = getGroupTechnicalEngineer(userGroupId, user.id);
            if (groupEng) {
                tech.code = groupEng.code;
                tech.avatarUrl = groupEng.avatarUrl;
                tech.fullName = groupEng.fullName;
                tech.role = groupEng.role;
                tech.specialty = groupEng.specialty;
            }
            setTechnicalStrategist({ ...tech });

            // 6. SORTEIO DETERMINÍSTICO POR CORRIDA (ROUND):
            // Um engenheiro busca a referência do evento do ano anterior (pole e top 10)
            // e o outro baseia-se no Teamwork / Aliança / Geral
            const activeRound = 19;
            const seed = ((activeRound * 9301 + 49297) % 233280);
            const seniorIsHist = seed % 2 === 0;
            setIsSeniorHistoricalRole(seniorIsHist);

            const histRef = getHistoricalRaceData(activeRound);
            setHistoricalData(histRef);

            const cData = await fetchConsensusData(
                user.id,
                allianceKey,
                tech.telemetryBriefing.poletimeTarget,
                tech.telemetryBriefing.top10Picks
            );
            if (!isActive) return;
            setConsensusData(cData);
            setAccessReady(true);
        };

        loadProfile();
        return () => { isActive = false; };
    }, [authLoading, user, mentorParam, driverParam, router]);

    const theme = ALLIANCE_THEMES[userAlliance] || ALLIANCE_THEMES['B'];

    // ==========================================
    // CÁLCULO DAS PROPOSTAS: ANO ANTERIOR VS TEAMWORK/ALIANÇA/GERAL
    // ==========================================
    const seniorTimeTarget = isSeniorHistoricalRole
        ? historicalData.poleTime
        : (consensusData?.poleTime || seniorStrategist.briefingTips.poletimeTarget.split(' ')[0] || '1:12.209');

    const techTimeTarget = isSeniorHistoricalRole
        ? (consensusData?.poleTime || technicalStrategist?.telemetryBriefing.poletimeTarget || '1:12.164')
        : historicalData.poleTime;

    const seniorTop10List = useMemo(() => {
        if (isSeniorHistoricalRole) return historicalData.top10Finish;
        if (consensusData?.top10Finish && consensusData.top10Finish.length > 0) return consensusData.top10Finish;
        return seniorStrategist.briefingTips.predictedTop3.concat(['RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB', 'TSU']).slice(0, 10);
    }, [isSeniorHistoricalRole, historicalData, consensusData, seniorStrategist]);

    const techTop10List = useMemo(() => {
        if (!isSeniorHistoricalRole) return historicalData.top10Finish;
        if (consensusData?.top10Finish && consensusData.top10Finish.length > 0) return consensusData.top10Finish;
        return technicalStrategist?.telemetryBriefing.top10Picks.slice(0, 10) || ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];
    }, [isSeniorHistoricalRole, historicalData, consensusData, technicalStrategist]);

    const seniorTop3 = seniorTop10List.slice(0, 3).join(', ');
    const techTop3 = techTop10List.slice(0, 3).join(', ');

    const seniorEvoDriver = seniorStrategist.briefingTips.predictedEvoDriver || 'HAM';
    const techEvoDriver = technicalStrategist?.telemetryBriefing.top10Picks[4] || 'SAI';

    const seniorH2HDrivers = seniorStrategist.briefingTips.dominantH2HDrivers.slice(0, 2).join(' & ') || 'NOR & VER';

    // Marcador tipográfico discreto para auditoria do administrador:
    // "//" identifica quem traz referência histórica (API ano anterior)
    // "•" identifica quem traz previsão pelo mercado de posições (Teamwork / Aliança / Geral)
    const marketSourceTag = consensusData ? `market-${consensusData.source.toLowerCase()}` : 'market-general';
    const seniorSourceId = isSeniorHistoricalRole ? 'historical-api' : marketSourceTag;
    const techSourceId = isSeniorHistoricalRole ? marketSourceTag : 'historical-api';
    const seniorSep = isSeniorHistoricalRole ? '//' : '•';
    const techSep = isSeniorHistoricalRole ? '•' : '//';

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
            userId: user?.id || null,
            poletime: updates.poletime || currentDraft.poletime || chosenPoletime,
            top10: updates.top10 || currentDraft.top10 || chosenTop10,
            evo: updates.evo || currentDraft.evo || chosenEvo,
            h2h: updates.h2h || currentDraft.h2h || chosenH2H,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('war_room_draft', JSON.stringify(updated));
    };

    // Handlers da Sugestão Assistida por IA
    const handleRequestAiSuggestion = async () => {
        setIsSuggesting(true);
        setSuggestError(null);
        setSuggestModalOpen(true);
        setApplySuccessNotice(null);
        try {
            const res = await fetch('/api/war-room/suggest-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    circuitId: 'americas',
                    characterType: subStep === 'TECH' ? 'technical' : 'senior',
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Falha ao compilar proposta de estratégia.');
            }
            setSuggestedPrediction(data.suggestion);
        } catch (err: any) {
            setSuggestError(err.message || 'Erro de comunicação no rádio.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleApplySuggestion = () => {
        if (!suggestedPrediction) return;

        // 1. Atualiza Zustand Store
        store.setPoletime(suggestedPrediction.poletime);
        store.setTop10(suggestedPrediction.top10);
        store.setEvo(suggestedPrediction.evo);
        store.setH2H(suggestedPrediction.h2h);
        store.setMisc(suggestedPrediction.misc);

        // 2. Atualiza estado local do War Room
        setChosenPoletime(suggestedPrediction.formattedPoletime);
        setChosenTop10(suggestedPrediction.top10);
        setChosenEvo(suggestedPrediction.evo);
        setChosenH2H(suggestedPrediction.h2h);

        // 3. Persiste no localStorage para sincronização com /positions
        saveToLocalStorage({
            poletime: suggestedPrediction.formattedPoletime,
            top10: suggestedPrediction.top10,
            evo: suggestedPrediction.evo,
            h2h: suggestedPrediction.h2h,
        });

        // 4. Som e notificação de confirmação
        soundEngine.playKeyClick('!');
        setApplySuccessNotice('Estratégia da IA gravada no rascunho com sucesso!');
        setTimeout(() => {
            setApplySuccessNotice(null);
            setSuggestModalOpen(false);
        }, 1500);
    };

    const handleOpenMemoryModal = async () => {
        setMemoryModalOpen(true);
        setIsMemoryLoading(true);
        setMemoryResetNotice(null);
        try {
            const res = await fetch('/api/war-room/memory');
            const data = await res.json();
            if (data.ok && data.memory) {
                setTacticalMemory(data.memory);
            }
        } catch (_) {
            // Silencioso
        } finally {
            setIsMemoryLoading(false);
        }
    };

    const handleClearMemory = async () => {
        if (!confirm('Deseja realmente reiniciar o histórico de memória tática do pit wall?')) return;
        try {
            const res = await fetch('/api/war-room/memory', { method: 'DELETE' });
            const data = await res.json();
            if (data.ok) {
                setMemoryResetNotice('Memória reiniciada com sucesso.');
                setTacticalMemory({
                    userId: user?.id || 'guest',
                    accuracyRate: 72.0,
                    totalPredictions: 1,
                    recentPicksSummary: 'Estrategista estreando telemetria de precisão na temporada.',
                    updatedAt: new Date().toISOString(),
                });
            }
        } catch (_) {
            alert('Falha ao reiniciar memória.');
        }
    };

    // Função de limpeza de tela e transição entre tópicos
    const transitionToTopic = (next: Topic) => {
        resetChat();
        setIsClearing(true);
        setTimeout(() => {
            setCurrentTopic(next);
            setSubStep('SENIOR');
            setIsClearing(false);
        }, 320);
    };

    // ==========================================
    // TÓPICO 1: POLETIME
    // ==========================================
    const handlePoletimeSeniorAccept = () => {
        setChosenPoletime(seniorTimeTarget);
        saveToLocalStorage({ poletime: seniorTimeTarget });
        transitionToTopic('TOP10');
    };

    const handlePoletimeSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handlePoletimeTechAccept = () => {
        setChosenPoletime(techTimeTarget);
        saveToLocalStorage({ poletime: techTimeTarget });
        transitionToTopic('TOP10');
    };

    const handlePoletimeTechCopy = () => {
        saveToLocalStorage({ poletime: chosenPoletime });
        transitionToTopic('TOP10');
    };

    // ==========================================
    // TÓPICO 2: TOP 10 FINISH
    // ==========================================
    const handleTop10SeniorAccept = () => {
        setChosenTop10(seniorTop10List);
        saveToLocalStorage({ top10: seniorTop10List });
        transitionToTopic('EVO');
    };

    const handleTop10SeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleTop10TechAccept = () => {
        setChosenTop10(techTop10List);
        saveToLocalStorage({ top10: techTop10List });
        transitionToTopic('EVO');
    };

    const handleTop10TechCopy = () => {
        saveToLocalStorage({ top10: chosenTop10 });
        transitionToTopic('EVO');
    };

    // ==========================================
    // TÓPICO 3: EVO / ESCALADA
    // ==========================================
    const handleEvoSeniorAccept = () => {
        const evoGrid = [seniorEvoDriver, 'SAI', 'ALO', 'TSU', 'ALB'];
        setChosenEvo(evoGrid);
        saveToLocalStorage({ evo: evoGrid });
        transitionToTopic('H2H');
    };

    const handleEvoSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleEvoTechAccept = () => {
        const evoGrid = [techEvoDriver, 'HAM', 'ALO', 'TSU', 'COL'];
        setChosenEvo(evoGrid);
        saveToLocalStorage({ evo: evoGrid });
        transitionToTopic('H2H');
    };

    const handleEvoTechCopy = () => {
        saveToLocalStorage({ evo: chosenEvo });
        transitionToTopic('H2H');
    };

    // ==========================================
    // TÓPICO 4: H2H / DUELOS TÁTICOS
    // ==========================================
    const handleH2HSeniorAccept = () => {
        const seniorPicks = {
            m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
            m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27'
        };
        setChosenH2H(seniorPicks);
        saveToLocalStorage({ h2h: seniorPicks });
        transitionToTopic('FINAL_MISC');
    };

    const handleH2HSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleH2HTechAccept = () => {
        const techPicks = {
            m1: '81', m2: '44', m3: '12', m4: '01', m5: '14',
            m6: '43', m7: '87', m8: '41', m9: '77', m10: '23', m11: '05'
        };
        setChosenH2H(techPicks);
        saveToLocalStorage({ h2h: techPicks });
        transitionToTopic('FINAL_MISC');
    };

    const handleH2HTechCopy = () => {
        saveToLocalStorage({ h2h: chosenH2H });
        transitionToTopic('FINAL_MISC');
    };

    // Redireciona o usuário diretamente para preencher o MISC sozinho no formulário de posições
    const handleGoToPositionsMisc = () => {
        router.push('/positions?tab=misc&from=war_room');
    };

    if (authLoading || !user || !accessReady) {
        return (
            <main className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono gap-4 p-4">
                <div className="w-10 h-10 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold tracking-[0.22em] text-[#fbaa19] uppercase animate-pulse text-center">
                    &gt;_ VERIFICANDO CREDENCIAL NA WAR ROOM...
                </p>
            </main>
        );
    }

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center justify-center p-4 transition-all duration-300">

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
                className="fixed inset-0 w-full h-lvh pointer-events-none z-0 overflow-hidden" 
                style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
            >
                <img
                    src="/war_room_bg.jpg"
                    alt="Formula 1 War Room Frank Miller Noir"
                    className="w-full h-full object-cover object-center brightness-[0.70] contrast-[1.28]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/75" />
            </div>

            {/* BARRA SUPERIOR: SAÍDA & FERRAMENTAS DE IA */}
            <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between gap-2">
                <Link
                    href={getDashboardPath(userSlug, '/headquarters')}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-[#fbaa19] transition-colors uppercase tracking-wider bg-black/75 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#fbaa19]" />
                    <span>[ « SAIR ]</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenMemoryModal}
                        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-white/70 hover:text-[#fbaa19] transition-colors uppercase tracking-wider bg-black/75 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#fbaa19]/40 backdrop-blur-sm cursor-pointer"
                        title="Ver histórico tático e assertividade do usuário"
                    >
                        <Brain className="w-3.5 h-3.5 text-[#fbaa19]" />
                        <span className="hidden sm:inline">MEMÓRIA TÁTICA</span>
                        <span className="sm:hidden">MEMÓRIA</span>
                    </button>

                    <button
                        onClick={handleRequestAiSuggestion}
                        disabled={isSuggesting}
                        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-black bg-[#fbaa19] hover:bg-white transition-all uppercase tracking-wider px-2.5 sm:px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(251,170,25,0.35)] cursor-pointer disabled:opacity-50"
                        title="Gerar proposta tática completa baseada em IA e telemetria"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSuggesting ? 'GERANDO...' : 'SUGESTÃO IA'}</span>
                    </button>
                </div>
            </div>

            {/* CONTAINER VERTICAL DE DIÁLOGOS CENTRALIZADO NA TELA */}
            <div 
                className={`relative z-10 w-full max-w-2xl px-2 sm:px-0 flex flex-col gap-5 self-center mx-auto my-auto transition-all duration-300 ${
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
                                categoryTag={`1/4 ${seniorSep} POLETIME Q3`}
                                strategySource={seniorSourceId}
                                text={getCardText(
                                    'senior',
                                    isSeniorHistoricalRole
                                        ? `"Sinto no estômago e na leitura deste asfalto. A marca ideal para a pole é ${seniorTimeTarget}. Abaixo disso, só no vácuo perfeito."`
                                        : `"Pelo movimento dos boxes e contatos no pitwall, a marca de referência é ${seniorTimeTarget}. Esse é o ponto ótimo de aposta."`
                                )}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'POLETIME',
                                        circuitId: 'americas',
                                        message: 'M. Amon, qual o seu conselho de pista para a disputa da Pole Position?',
                                        fallbackText: isSeniorHistoricalRole
                                            ? `"Sinto no estômago e na leitura deste asfalto. A marca ideal para a pole é ${seniorTimeTarget}. Abaixo disso, só no vácuo perfeito."`
                                            : `"Pelo movimento dos boxes e contatos no pitwall, a marca de referência é ${seniorTimeTarget}. Esse é o ponto ótimo de aposta."`
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handlePoletimeSeniorCopy : undefined}
                                onFill={handlePoletimeSeniorAccept}
                                fillLabel={`ACCEPT (${seniorTimeTarget}) »`}
                                copyLabel="COPY"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag={`TELEMETRIA ${techSep} Q3`}
                                    strategySource={techSourceId}
                                    text={getCardText(
                                        'technical',
                                        isSeniorHistoricalRole
                                            ? `"Nossos modelos estocásticos apontam ${techTimeTarget}. Há ganho aerodinâmico real nos setores 2 e 3."`
                                            : `"Pelos micro-setores registrados na garagem, vejo potencial para ${techTimeTarget}. A evolução da pista vai favorecer o Q3."`
                                    )}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'POLETIME',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, qual a projeção matemática de tempo exato para o Q3?',
                                            fallbackText: isSeniorHistoricalRole
                                                ? `"Nossos modelos estocásticos apontam ${techTimeTarget}. Há ganho aerodinâmico real nos setores 2 e 3."`
                                                : `"Pelos micro-setores registrados na garagem, vejo potencial para ${techTimeTarget}. A evolução da pista vai favorecer o Q3."`
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handlePoletimeTechCopy}
                                    onFill={handlePoletimeTechAccept}
                                    fillLabel={`ACCEPT (${techTimeTarget}) »`}
                                    copyLabel="COPY"
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
                                categoryTag={`2/4 ${seniorSep} TOP 10 FINISH`}
                                strategySource={seniorSourceId}
                                text={getCardText(
                                    'senior',
                                    isSeniorHistoricalRole
                                        ? `"Corrida aqui é desgaste e casca grossa. A ponta vai se consolidar com ${seniorTop3}."`
                                        : `"Quem quer pontuar alto no campeonato precisa mirar nestes nomes: ${seniorTop3} decidem as primeiras posições."`
                                )}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'TOP10',
                                        circuitId: 'americas',
                                        message: 'M. Amon, qual o seu conselho sobre o ritmo de corrida para o Top 10?',
                                        fallbackText: isSeniorHistoricalRole
                                            ? `"Corrida aqui é desgaste e casca grossa. A ponta vai se consolidar com ${seniorTop3}."`
                                            : `"Quem quer pontuar alto no campeonato precisa mirar nestes nomes: ${seniorTop3} decidem as primeiras posições."`
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handleTop10SeniorCopy : undefined}
                                onFill={handleTop10SeniorAccept}
                                fillLabel={`ACCEPT TOP 10 (${seniorStrategist.code}) »`}
                                copyLabel="COPY"
                            />
                        </div>

                        {/* TÉCNICO (FADE-IN RIGHT) */}
                        {subStep === 'TECH' && technicalStrategist && (
                            <div className="w-full">
                                <BoxCard
                                    speakerBadge={`[${technicalStrategist.code}]`}
                                    speakerRole={`ENGENHARIA // ${theme.badge}`}
                                    avatarUrl={technicalStrategist.avatarUrl}
                                    categoryTag={`MONTE CARLO ${techSep} SIM`}
                                    strategySource={techSourceId}
                                    text={getCardText(
                                        'technical',
                                        isSeniorHistoricalRole
                                            ? `"Nossas simulações de Monte Carlo indicam ${techTop3} com maior eficiência de degradação térmica para domingo."`
                                            : `"Cruzando os dados de ritmo em stint longo, o favoritismo térmico é de ${techTop3}."`
                                    )}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'TOP10',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, quais os dados de degradação térmica para os líderes?',
                                            fallbackText: isSeniorHistoricalRole
                                                ? `"Nossas simulações de Monte Carlo indicam ${techTop3} com maior eficiência de degradação térmica para domingo."`
                                                : `"Cruzando os dados de ritmo em stint longo, o favoritismo térmico é de ${techTop3}."`
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handleTop10TechCopy}
                                    onFill={handleTop10TechAccept}
                                    fillLabel={`ACCEPT TOP 10 (${technicalStrategist.code}) »`}
                                    copyLabel="COPY"
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
                                text={getCardText('senior', `"Na largada vai ter confusão. Aposto em ${seniorEvoDriver} escalando o pelotão."`)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'EVO',
                                        circuitId: 'americas',
                                        message: 'M. Amon, quem tem estofo para escalar o grid com Safety Car?',
                                        fallbackText: `"Na largada vai ter confusão. Aposto em ${seniorEvoDriver} escalando o pelotão."`
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handleEvoSeniorCopy : undefined}
                                onFill={handleEvoSeniorAccept}
                                fillLabel={`ACCEPT (${seniorEvoDriver}) »`}
                                copyLabel="COPY"
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
                                    text={getCardText('technical', `"Ritmo de tráfego indica ${techEvoDriver} com maior delta de ultrapassagem."`)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'EVO',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, qual o piloto com melhor delta de ultrapassagem nos setores de DRS?',
                                            fallbackText: `"Ritmo de tráfego indica ${techEvoDriver} com maior delta de ultrapassagem."`
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handleEvoTechCopy}
                                    onFill={handleEvoTechAccept}
                                    fillLabel={`ACCEPT (${techEvoDriver}) »`}
                                    copyLabel="COPY"
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
                                text={getCardText('senior', `"Primeiro rival é o companheiro de box. Cravamos ${seniorH2HDrivers} nos duelos internos."`)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'H2H',
                                        circuitId: 'americas',
                                        message: 'M. Amon, como avaliar a pressão psicológica nos duelos diretos de garagem?',
                                        fallbackText: `"Primeiro rival é o companheiro de box. Cravamos ${seniorH2HDrivers} nos duelos internos."`
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handleH2HSeniorCopy : undefined}
                                onFill={handleH2HSeniorAccept}
                                fillLabel={`ACCEPT (${seniorStrategist.code}) »`}
                                copyLabel="COPY"
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
                                    text={getCardText('technical', `"Telemetria cruzada aponta inversão técnica nos duelos de asa móvel."`)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'H2H',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, os dados de telemetria apontam vantagem de motor ou de chassi nos confrontos diretos?',
                                            fallbackText: `"Telemetria cruzada aponta inversão técnica nos duelos de asa móvel."`
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handleH2HTechCopy}
                                    onFill={handleH2HTechAccept}
                                    fillLabel={`ACCEPT (${technicalStrategist.code}) »`}
                                    copyLabel="COPY"
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

                {/* RÁDIO INTERATIVO DO PIT WALL (IA) */}
                {currentTopic !== 'FINAL_MISC' && (
                    <div className="w-full mt-1 flex flex-col gap-1.5 animate-fade-in font-mono">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const input = form.elements.namedItem('radioMsg') as HTMLInputElement;
                                if (!input || !input.value.trim() || isTransmitting) return;
                                const query = input.value.trim();
                                input.value = '';
                                const targetCharType = subStep === 'TECH' && technicalStrategist ? 'technical' : 'senior';
                                const targetCharId = targetCharType === 'technical' ? technicalStrategist!.id : seniorStrategist.id;
                                askStrategist({
                                    characterType: targetCharType,
                                    characterId: targetCharId,
                                    topic: currentTopic,
                                    circuitId: 'americas',
                                    raceWeekDay: activeRaceWeekDay,
                                    raceWeekObjective: activeRaceWeekObjective,
                                    message: query,
                                    fallbackText: targetCharType === 'senior' 
                                        ? 'Telemetria do rádio sênior em sincronização padrão.' 
                                        : 'Canal de dados operando em redundância local.',
                                });
                            }}
                            className="flex items-center gap-2 bg-[#050505] border border-white/10 rounded-[3px] px-3 py-2 text-xs shadow-lg focus-within:border-[#fbaa19]/60 transition-all"
                        >
                            <span className="text-[#fbaa19] font-black shrink-0">&gt;_</span>
                            <input
                                name="radioMsg"
                                type="text"
                                disabled={isTransmitting}
                                placeholder={
                                    isTransmitting
                                        ? "Transmissão aberta no canal de telemetria..."
                                        : `Questionar ${subStep === 'TECH' && technicalStrategist ? technicalStrategist.code : seniorStrategist.code} pelo rádio... [Enter para transmitir]`
                                }
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/35 text-xs font-mono disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isTransmitting}
                                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-[2px] bg-white/10 text-white/90 hover:bg-[#fbaa19] hover:text-black transition-all cursor-pointer disabled:opacity-40"
                            >
                                {isTransmitting ? 'TRANSMITINDO...' : 'FALAR'}
                            </button>
                            {remainingToday !== null && (
                                <span className="text-[9px] text-white/40 shrink-0 hidden sm:inline" title="Cota diária restante">
                                    COTA: {remainingToday}
                                </span>
                            )}
                        </form>
                    </div>
                )}

            </div>

            {/* ========================================================================= */}
            {/* MODAL 1: SUGESTÃO TÁTICA ESTRUTURADA DA IA                                */}
            {/* ========================================================================= */}
            {suggestModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-mono">
                    <div className="relative w-full max-w-xl bg-[#0a0a0c] border border-white/15 rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-xs text-white/90 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#fbaa19]" />
                                <span className="text-[#fbaa19] font-black uppercase tracking-wider text-[11px] sm:text-xs">
                                    &gt;_ PROPOSTA TÁTICA DA IA // PIT WALL
                                </span>
                            </div>
                            <button
                                onClick={() => setSuggestModalOpen(false)}
                                className="text-white/50 hover:text-white transition-colors cursor-pointer p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {isSuggesting && (
                            <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                                <div className="w-8 h-8 border-3 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[11px] text-[#fbaa19] font-bold tracking-widest uppercase animate-pulse">
                                    &gt;_ Sintonizando telemetria e calculando proposta...
                                </p>
                            </div>
                        )}

                        {suggestError && !isSuggesting && (
                            <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-3 rounded text-[11px]">
                                {suggestError}
                            </div>
                        )}

                        {suggestedPrediction && !isSuggesting && (
                            <div className="flex flex-col gap-3.5 animate-fade-in">
                                {suggestedPrediction.reasoning && (
                                    <div className="bg-white/[0.03] border-l-2 border-[#fbaa19] p-3 text-white/80 italic text-[11px] leading-relaxed">
                                        &gt;_ &ldquo;{suggestedPrediction.reasoning}&rdquo;
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            POLE POSITION ESTIMADA
                                        </span>
                                        <span className="text-[#fbaa19] font-bold text-sm tracking-widest">
                                            {suggestedPrediction.formattedPoletime}
                                        </span>
                                    </div>

                                    <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            PILOTOS DE EVOLUÇÃO (EVO)
                                        </span>
                                        <span className="text-white/90 font-bold">
                                            {suggestedPrediction.evo.join(', ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                                    <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                        PREVISÃO DO TOP 10 (GRID DE CHEGADA)
                                    </span>
                                    <p className="text-white/90 font-bold tracking-wide">
                                        {suggestedPrediction.top10.join(' › ')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            DUELOS H2H (MATCHUPS)
                                        </span>
                                        <span className="text-emerald-400 font-bold">
                                            ✓ 11 confrontos preenchidos
                                        </span>
                                    </div>

                                    <div className="bg-black/60 border border-white/10 p-2.5 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            EVENTOS DE PISTA (MISC)
                                        </span>
                                        <span className="text-white/80 font-bold">
                                            Q1: {suggestedPrediction.misc.q1} | Q2: {suggestedPrediction.misc.q2} | Q3: {suggestedPrediction.misc.q3}
                                        </span>
                                    </div>
                                </div>

                                {applySuccessNotice && (
                                    <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 rounded text-center font-bold text-[11px] animate-fade-in flex items-center justify-center gap-1.5">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{applySuccessNotice}</span>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-3 border-t border-white/10">
                                    <button
                                        onClick={handleApplySuggestion}
                                        className="flex-1 bg-[#fbaa19] text-black font-black uppercase tracking-wider py-2.5 px-4 rounded hover:bg-white transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>[ APLICAR NO RASCUNHO & STORE ]</span>
                                    </button>
                                    <button
                                        onClick={() => setSuggestModalOpen(false)}
                                        className="bg-white/5 hover:bg-white/10 text-white/70 py-2.5 px-4 rounded transition-all cursor-pointer text-xs uppercase"
                                    >
                                        [ DESCARTAR ]
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: MEMÓRIA TÁTICA DO USUÁRIO & PRIVACIDADE                          */}
            {/* ========================================================================= */}
            {memoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-mono">
                    <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/15 rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-xs text-white/90">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-[#fbaa19]" />
                                <span className="text-[#fbaa19] font-black uppercase tracking-wider text-[11px] sm:text-xs">
                                    &gt;_ MEMÓRIA TÁTICA // PIT WALL
                                </span>
                            </div>
                            <button
                                onClick={() => setMemoryModalOpen(false)}
                                className="text-white/50 hover:text-white transition-colors cursor-pointer p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {isMemoryLoading ? (
                            <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                                <div className="w-6 h-6 border-2 border-[#fbaa19] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] text-white/50 uppercase">Carregando métricas...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-black/60 border border-white/10 p-3 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            TAXA DE ASSERTIVIDADE
                                        </span>
                                        <span className="text-[#fbaa19] font-bold text-lg">
                                            {tacticalMemory?.accuracyRate ? `${tacticalMemory.accuracyRate}%` : '72%'}
                                        </span>
                                    </div>
                                    <div className="bg-black/60 border border-white/10 p-3 rounded">
                                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                            GPS NO PIT WALL
                                        </span>
                                        <span className="text-white font-bold text-lg">
                                            {tacticalMemory?.totalPredictions || 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-black/60 border border-white/10 p-3 rounded">
                                    <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold mb-1">
                                        HISTÓRICO TÁTICO RECENTE
                                    </span>
                                    <p className="text-white/80 text-[11px] leading-relaxed">
                                        {tacticalMemory?.recentPicksSummary || 'Estrategista ativo na temporada com telemetria calibrada.'}
                                    </p>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded text-[10px] text-white/45 leading-relaxed">
                                    <p className="font-bold uppercase text-white/60 mb-1">Privacidade &amp; LGPD:</p>
                                    Nenhum dado pessoal é retido. As métricas agregadas de jogo calibram exclusivamente o tom e a profundidade técnica dos diálogos no pit wall.
                                </div>

                                {memoryResetNotice && (
                                    <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2 rounded text-center text-[10px]">
                                        ✓ {memoryResetNotice}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={handleClearMemory}
                                        className="flex-1 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/30 py-2 px-3 rounded text-[11px] uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>[ REINICIAR MEMÓRIA ]</span>
                                    </button>
                                    <button
                                        onClick={() => setMemoryModalOpen(false)}
                                        className="bg-white/5 hover:bg-white/10 text-white/70 py-2 px-3 rounded text-[11px] uppercase transition-colors cursor-pointer"
                                    >
                                        [ FECHAR ]
                                    </button>
                                </div>
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
        <Suspense fallback={<div className="w-full min-h-screen bg-black" />}>
            <WarRoomContent />
        </Suspense>
    );
}
