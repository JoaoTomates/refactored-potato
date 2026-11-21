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
import { ChevronLeft, ArrowRight, Calendar, Clock, MapPin, Gauge, Shield, Flag, CloudRain, AlertTriangle, Layers } from 'lucide-react';
import { DialogueBox, DialogueActionButton, pitWallSound as soundEngine } from '@/components/dialogue-box';
import { useWarRoomChat } from '@/hooks/useWarRoomChat';
import { RACE_WEEK_DIALOGS } from '@/data/dialogues';
import { usePredictionStore } from '@/store/usePredictionStore';
import { WarRoomBriefing } from '@/lib/war-room-briefing';
import { getTeamPrincipal, TeamPrincipal } from '@/lib/paddock-crew';
import { getCircuitIntel, CircuitTelemetryIntel } from '@/lib/circuits-intel';

export type RaceWeekDayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayScheduleDetail {
    dayId: RaceWeekDayId;
    dayName: string;
    subTitle: string;
    trackActivity: string;
    operationalTimeline: {
        time: string;
        title: string;
        desc: string;
        badge: string;
        color: string;
    }[];
    tacticalObjective: string;
    broadcastCode: string;
    marketStatus: string;
}

const WEEK_DAYS: { id: RaceWeekDayId; label: string; short: string; num: number }[] = [
    { id: 'mon', label: 'Segunda', short: 'seg', num: 1 },
    { id: 'tue', label: 'Terça', short: 'ter', num: 2 },
    { id: 'wed', label: 'Quarta', short: 'qua', num: 3 },
    { id: 'thu', label: 'Quinta', short: 'qui', num: 4 },
    { id: 'fri', label: 'Sexta', short: 'sex', num: 5 },
    { id: 'sat', label: 'Sábado', short: 'sab', num: 6 },
    { id: 'sun', label: 'Domingo', short: 'dom', num: 7 },
];

const RACE_WEEK_SCHEDULE_DATA: Record<RaceWeekDayId, DayScheduleDetail> = {
    mon: {
        dayId: 'mon',
        dayName: 'SEGUNDA-FEIRA',
        subTitle: 'Logística Global & Recepção de Hospitalidade',
        trackActivity: 'SEM ATIVIDADE DE PISTA // PADDOCK FECHADO',
        operationalTimeline: [
            {
                time: '06:00 - 12:00',
                title: 'Desembarque das Frotas de Carga',
                desc: 'Cargueiros fretados e contêineres chegam ao autódromo com chassis e telemetria.',
                badge: 'LOGÍSTICA',
                color: '#60a5fa'
            },
            {
                time: '13:00 - 20:00',
                title: 'Montagem Estrutural das Garagens',
                desc: 'Instalação de fibra óptica, painéis divisórios e redes dedicadas ao pitwall.',
                badge: 'INFRAESTRUTURA',
                color: '#a78bfa'
            }
        ],
        tacticalObjective: 'Alinhamento com o Chefe de Equipe e introdução das características de downforce do traçado.',
        broadcastCode: 'TS1-SYS // B101-INIT',
        marketStatus: 'BOOK PRE-RACE ABERTO'
    },
    tue: {
        dayId: 'tue',
        dayName: 'TERÇA-FEIRA',
        subTitle: 'Construção do Pit Wall & Montagem Mecânica',
        trackActivity: 'SEM ATIVIDADE DE PISTA // MONTAGEM INTERNA',
        operationalTimeline: [
            {
                time: '08:00 - 14:00',
                title: 'Erguimento do Pit Wall e Mureta Tática',
                desc: 'Calibração das telas de telemetria dos estrategistas na mureta dos boxes.',
                badge: 'PIT WALL',
                color: '#38bdf8'
            },
            {
                time: '14:00 - 22:00',
                title: 'Acoplamento de Power Unit & Câmbio',
                desc: 'Mecânicos montam motor térmico, baterias híbridas e transmissão.',
                badge: 'MECÂNICA',
                color: '#fb923c'
            }
        ],
        tacticalObjective: 'Estimular análise de clima e direção dos ventos para poletime e corrida.',
        broadcastCode: 'TS1-SYS // B102-INFRA',
        marketStatus: 'COTAÇÕES MLS HOMOLOGADAS'
    },
    wed: {
        dayId: 'wed',
        dayName: 'QUARTA-FEIRA',
        subTitle: 'Track Walk, Alocação Pirelli & Reconhecimento',
        trackActivity: 'RECONHECIMENTO A PÉ // CALIBRAÇÃO TÉCNICA',
        operationalTimeline: [
            {
                time: '09:00 - 13:00',
                title: 'Track Walk Oficial no Circuito',
                desc: 'Pilotos e estrategistas percorrem o traçado a pé inspecionando zebras e asfalto.',
                badge: 'TRACK WALK',
                color: '#facc15'
            },
            {
                time: '14:00 - 18:00',
                title: 'Alocação de Pneus Pirelli & Fire-up',
                desc: 'Recebimento dos jogos de pneus slick (Soft, Medium, Hard) e testes de partida.',
                badge: 'PIRELLI ALLOC',
                color: '#f43f5e'
            }
        ],
        tacticalObjective: 'Fornecer dados técnicos de pista para refinar o Top 10 e Duelos H2H.',
        broadcastCode: 'TS1-SYS // B103-COMPOUNDS',
        marketStatus: 'JANELA POLETIME ABERTA'
    },
    thu: {
        dayId: 'thu',
        dayName: 'QUINTA-FEIRA',
        subTitle: 'Media Day Oficial & Escrutínio Técnico TS1',
        trackActivity: 'INSPEÇÃO TÉCNICA // TREINOS DE PIT STOP',
        operationalTimeline: [
            {
                time: '09:00 - 13:00',
                title: 'Media Day & Coletivas de Imprensa',
                desc: 'Declarações e expectativas das equipes antes da primeira sessão de pista.',
                badge: 'MEDIA DAY',
                color: '#34d399'
            },
            {
                time: '11:00 - 16:00',
                title: 'Escrutínio Técnico Homologado',
                desc: 'Pesagem regulamentar de 798 kg, conferência de asas e testes de deflexão.',
                badge: 'ESCRUTÍNIO',
                color: '#fbaa19'
            },
            {
                time: '20:00 - 06:00',
                title: 'Curfew Noturno Obrigatório TS1',
                desc: 'Paddock trancado para garantir descanso regulamentar dos mecânicos.',
                badge: 'CURFEW',
                color: '#ef4444'
            }
        ],
        tacticalObjective: 'Pressionar o estrategista a registrar seu Poletime antes dos treinos decisivos.',
        broadcastCode: 'TS1-SYS // B104-SCRUTINEER',
        marketStatus: 'AVISO: CONTAGEM REGRESSIVA'
    },
    fri: {
        dayId: 'fri',
        dayName: 'SEXTA-FEIRA',
        subTitle: 'Abertura de Pista: Treinos Livres (FP1 / FP2)',
        trackActivity: 'FP1 (60 min) + FP2 (60 min) — COLETA DE TELEMETRIA',
        operationalTimeline: [
            {
                time: '12:30 - 13:30',
                title: 'Treino Livre 1 (FP1 — 60 minutos)',
                desc: 'Avaliação de aero-rakes, correlação de pneus e referências iniciais de pista.',
                badge: 'FP1 PISTA',
                color: '#22c55e'
            },
            {
                time: '16:00 - 17:00',
                title: 'Treino Livre 2 (FP2 — Long Runs & Quali)',
                desc: 'Teste crucial no mesmo horário de corrida: voltas rápidas e ritmo com tanque cheio.',
                badge: 'FP2 LONG RUNS',
                color: '#10b981'
            }
        ],
        tacticalObjective: 'Entregar o insider de ritmo real para guiar a seleção de Top 10 e Duelos H2H.',
        broadcastCode: 'TS1-SYS // B105-PRACTICE',
        marketStatus: 'FECHAMENTO POLE NO Q1'
    },
    sat: {
        dayId: 'sat',
        dayName: 'SÁBADO',
        subTitle: 'Treino Livre 3 (FP3) & Classificação Oficial (Q1/Q2/Q3)',
        trackActivity: 'FP3 (60 min) + CLASSIFICAÇÃO OFICIAL (Q1/Q2/Q3)',
        operationalTimeline: [
            {
                time: '11:30 - 12:30',
                title: 'Treino Livre 3 (FP3 — Ajustes Finais)',
                desc: 'Ajustes finos de asa dianteira e pressão de pneus antes do regime de Parque Fechado.',
                badge: 'FP3 AJUSTES',
                color: '#38bdf8'
            },
            {
                time: '15:00 - 16:00',
                title: 'Sessão de Classificação Oficial (Q1 / Q2 / Q3)',
                desc: 'Disputa pela Pole Position em volta única. Carros entram em Parque Fechado.',
                badge: 'CLASSIFICAÇÃO',
                color: '#e11d48'
            }
        ],
        tacticalObjective: 'Conectar resultado da classificação com o Poletime e preparar as previsões de domingo.',
        broadcastCode: 'TS1-SYS // B106-QUALI',
        marketStatus: 'PARQUE FECHADO ATIVO'
    },
    sun: {
        dayId: 'sun',
        dayName: 'DOMINGO',
        subTitle: 'Dia de Corrida: Procedimento de Grid, GP & Debriefing',
        trackActivity: 'GRANDE PRÊMIO OFICIAL (56 VOLTAS)',
        operationalTimeline: [
            {
                time: '13:00 - 13:45',
                title: 'Abertura de Pitlane & Hino Oficial',
                desc: 'Monopostos se posicionam no grid sob inspeção de comissários e cobertura global.',
                badge: 'GRID PROC',
                color: '#a855f7'
            },
            {
                time: '14:00 - 16:00',
                title: 'Largada do Grande Prêmio (Bandeira Verde)',
                desc: 'Corrida principal: gestão de stints, chamadas de pit stop e duelos em pista.',
                badge: 'CORRIDA OFICIAL',
                color: '#22c55e'
            },
            {
                time: '17:00 - 19:00',
                title: 'Debriefing Tático & Apuração MLS',
                desc: 'Conferência de relatórios de telemetria, pagamento de dividendos e cálculo de pontuação.',
                badge: 'DEBRIEFING',
                color: '#f59e0b'
            }
        ],
        tacticalObjective: 'Debriefing da rodada, cálculo de dividendos MLS e atualização do ranking Master.',
        broadcastCode: 'TS1-SYS // B107-RACEDAY',
        marketStatus: 'APURAÇÃO & DIVIDENDOS MLS'
    }
};

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
                reasoning: 'Média de apostas e projeções coletivas de todo o grid TS1.'
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

    // Seletor da Semana de Corrida (Mapeamento em 3 Colunas)
    const [selectedDay, setSelectedDay] = useState<RaceWeekDayId>(activeRaceWeekDay as RaceWeekDayId);
    const [mobileView, setMobileView] = useState<'track' | 'dialogue' | 'timeline'>('dialogue');

    const circuitIntel: CircuitTelemetryIntel = useMemo(() => {
        return getCircuitIntel('americas');
    }, []);

    const activeDayData = useMemo(() => {
        return RACE_WEEK_SCHEDULE_DATA[selectedDay] || RACE_WEEK_SCHEDULE_DATA['fri'];
    }, [selectedDay]);

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

    // Briefing de Sessão Unificado (IA + Telemetria incorporada nos personagens)
    const [sessionBriefing, setSessionBriefing] = useState<WarRoomBriefing | null>(null);
    const [principalClosing, setPrincipalClosing] = useState<string | null>(null);
    const [teamPrincipal, setTeamPrincipal] = useState<TeamPrincipal | null>(null);
    const [aiStatus, setAiStatus] = useState<'syncing' | 'online' | 'fallback'>('syncing');

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

            // 5. Configura Chefe de Equipe e Engenheiro Técnico da Garagem do próprio usuário
            const principal = getTeamPrincipal(teamCode);
            setTeamPrincipal(principal);

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

            // 7. CARREGAMENTO EM SEGUNDO PLANO DO BRIEFING DE SESSÃO & ORDENS DO CHEFE
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                console.log('>_ [STRATEGY DESK] Sintonizando telemetria IA com o servidor...');

                const [briefingRes, closingRes] = await Promise.all([
                    fetch('/api/war-room/briefing', { headers }).then(r => r.json()).catch(() => null),
                    fetch('/api/war-room/principal-closing', {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ circuitId: 'americas', teamCode }),
                    }).then(r => r.json()).catch(() => null),
                ]);

                if (isActive) {
                    if (briefingRes?.ok && briefingRes.briefing) {
                        setSessionBriefing(briefingRes.briefing);
                        setAiStatus('online');
                        console.log('>_ [STRATEGY DESK] IA ONLINE (Gemini 3.8 Flash). Briefing de telemetria recebido:', briefingRes.briefing);
                    } else {
                        setAiStatus('fallback');
                        console.warn('>_ [STRATEGY DESK] Briefing IA em fallback determinístico (roteiro estático / consenso). Motivo:', briefingRes?.error || 'sem dados de IA');
                    }
                    if (closingRes?.ok && closingRes.closingStatement) {
                        setPrincipalClosing(closingRes.closingStatement);
                    }
                }
            } catch (err) {
                if (isActive) {
                    setAiStatus('fallback');
                    console.warn('>_ [STRATEGY DESK] Erro de rede ao conectar à IA. Operando em modo de segurança:', err);
                }
            }
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

    // Valores Finais Propostos (Prioridade: Briefing de Sessão com IA/Telemetria integrada > Consenso/Histórico)
    const effectiveSeniorPoletime = sessionBriefing?.poletime.senior.value || seniorTimeTarget;
    const effectiveTechPoletime = sessionBriefing?.poletime.technical.value || techTimeTarget;

    const effectiveSeniorTop10 = sessionBriefing?.top10.senior.value || seniorTop10List;
    const effectiveTechTop10 = sessionBriefing?.top10.technical.value || techTop10List;

    const effectiveSeniorEvo = sessionBriefing?.evo.senior.value || [seniorEvoDriver, 'SAI', 'ALO', 'TSU', 'ALB'];
    const effectiveTechEvo = sessionBriefing?.evo.technical.value || [techEvoDriver, 'HAM', 'ALO', 'TSU', 'COL'];

    const defaultSeniorH2H: Record<string, string> = {
        m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
        m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27'
    };
    const defaultTechH2H: Record<string, string> = {
        m1: '81', m2: '44', m3: '12', m4: '01', m5: '14',
        m6: '43', m7: '87', m8: '41', m9: '77', m10: '23', m11: '05'
    };
    const effectiveSeniorH2H = sessionBriefing?.h2h.senior.value || defaultSeniorH2H;
    const effectiveTechH2H = sessionBriefing?.h2h.technical.value || defaultTechH2H;

    // Linhas de Diálogo dos Personagens (Briefing da Sessão ou Fallbacks Noir)
    const seniorPoletimeLine = sessionBriefing?.poletime.senior.line
        ? (sessionBriefing.memoryHook ? `${sessionBriefing.memoryHook} ${sessionBriefing.poletime.senior.line}` : sessionBriefing.poletime.senior.line)
        : (isSeniorHistoricalRole
            ? `"Sinto no estômago e na leitura deste asfalto. A marca ideal para a pole é ${effectiveSeniorPoletime}. Abaixo disso, só no vácuo perfeito."`
            : `"Pelo movimento dos boxes e contatos no pitwall, a marca de referência é ${effectiveSeniorPoletime}. Esse é o ponto ótimo de aposta."`);

    const techPoletimeLine = sessionBriefing?.poletime.technical.line || (
        isSeniorHistoricalRole
            ? `"Nossos modelos estocásticos apontam ${effectiveTechPoletime}. Há ganho aerodinâmico real nos setores 2 e 3."`
            : `"Pelos micro-setores registrados na garagem, vejo potencial para ${effectiveTechPoletime}. A evolução da pista vai favorecer o Q3."`
    );

    const seniorTop10Line = sessionBriefing?.top10.senior.line || (
        isSeniorHistoricalRole
            ? `"Corrida aqui é desgaste e casca grossa. A ponta vai se consolidar com ${effectiveSeniorTop10.slice(0, 3).join(', ')}."`
            : `"Quem quer pontuar alto no campeonato precisa mirar nestes nomes: ${effectiveSeniorTop10.slice(0, 3).join(', ')} decidem as primeiras posições."`
    );

    const techTop10Line = sessionBriefing?.top10.technical.line || (
        isSeniorHistoricalRole
            ? `"Nossas simulações de Monte Carlo indicam ${effectiveTechTop10.slice(0, 3).join(', ')} com maior eficiência de degradação térmica para domingo."`
            : `"Cruzando os dados de ritmo em stint longo, o favoritismo térmico é de ${effectiveTechTop10.slice(0, 3).join(', ')}."`
    );

    const seniorEvoLine = sessionBriefing?.evo.senior.line || `"Na largada vai ter confusão. Aposto em ${effectiveSeniorEvo[0]} escalando o pelotão."`;
    const techEvoLine = sessionBriefing?.evo.technical.line || `"Ritmo de tráfego indica ${effectiveTechEvo[0]} com maior delta de ultrapassagem."`;

    const seniorH2HLine = sessionBriefing?.h2h.senior.line || `"Primeiro rival é o companheiro de box. Cravamos ${seniorH2HDrivers} nos duelos internos."`;
    const techH2HLine = sessionBriefing?.h2h.technical.line || `"Telemetria cruzada aponta inversão técnica nos duelos de asa móvel."`;

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
        setChosenPoletime(effectiveSeniorPoletime);
        store.setPoletime(effectiveSeniorPoletime);
        saveToLocalStorage({ poletime: effectiveSeniorPoletime });
        soundEngine.playKeyClick('!');
        transitionToTopic('TOP10');
    };

    const handlePoletimeSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handlePoletimeTechAccept = () => {
        setChosenPoletime(effectiveTechPoletime);
        store.setPoletime(effectiveTechPoletime);
        saveToLocalStorage({ poletime: effectiveTechPoletime });
        soundEngine.playKeyClick('!');
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
        setChosenTop10(effectiveSeniorTop10);
        store.setTop10(effectiveSeniorTop10);
        saveToLocalStorage({ top10: effectiveSeniorTop10 });
        soundEngine.playKeyClick('!');
        transitionToTopic('EVO');
    };

    const handleTop10SeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleTop10TechAccept = () => {
        setChosenTop10(effectiveTechTop10);
        store.setTop10(effectiveTechTop10);
        saveToLocalStorage({ top10: effectiveTechTop10 });
        soundEngine.playKeyClick('!');
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
        setChosenEvo(effectiveSeniorEvo);
        store.setEvo(effectiveSeniorEvo);
        saveToLocalStorage({ evo: effectiveSeniorEvo });
        soundEngine.playKeyClick('!');
        transitionToTopic('H2H');
    };

    const handleEvoSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleEvoTechAccept = () => {
        setChosenEvo(effectiveTechEvo);
        store.setEvo(effectiveTechEvo);
        saveToLocalStorage({ evo: effectiveTechEvo });
        soundEngine.playKeyClick('!');
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
        setChosenH2H(effectiveSeniorH2H);
        store.setH2H(effectiveSeniorH2H);
        saveToLocalStorage({ h2h: effectiveSeniorH2H });
        soundEngine.playKeyClick('!');
        transitionToTopic('FINAL_MISC');
    };

    const handleH2HSeniorCopy = () => {
        setSubStep('TECH');
    };

    const handleH2HTechAccept = () => {
        setChosenH2H(effectiveTechH2H);
        store.setH2H(effectiveTechH2H);
        saveToLocalStorage({ h2h: effectiveTechH2H });
        soundEngine.playKeyClick('!');
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
                    &gt;_ CONECTANDO À STRATEGY DESK...
                </p>
            </main>
        );
    }

    return (
        <main className="w-full min-h-screen relative bg-[#050401] overflow-x-hidden select-none flex flex-col font-mono items-center justify-start transition-all duration-300">

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

            {/* NAVBAR PRETO COM PEQUENA TRANSPARÊNCIA NO MENU SUPERIOR */}
            <header className="sticky top-0 z-30 w-full px-4 sm:px-8 py-2.5 flex items-center justify-between border-b border-white/10 bg-black/85 backdrop-blur-md">
                <Link
                    href={getDashboardPath(userSlug, '/headquarters')}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-[#fbaa19] transition-colors uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#fbaa19]/40 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#fbaa19]" />
                    <span>[ « SAIR ]</span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* SINAL VISUAL TÁTICO: STATUS DO MOTOR DE IA / TELEMETRIA */}
                    <div 
                        className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                            aiStatus === 'online' 
                                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                                : aiStatus === 'syncing' 
                                    ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' 
                                    : 'bg-zinc-900/70 text-zinc-400 border-zinc-700/40'
                        }`}
                        title={
                            aiStatus === 'online' 
                                ? 'Motor de IA (Gemini 3.8 Flash) ativo: briefing, propostas e rádio ao vivo integrados.' 
                                : aiStatus === 'syncing' 
                                    ? 'Sintonizando canal de telemetria IA...' 
                                    : 'Modo seguro ativo: operando com dados históricos e telemetria determinística.'
                        }
                    >
                        <span 
                            className={`w-1.5 h-1.5 rounded-full ${
                                aiStatus === 'online' 
                                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]' 
                                    : aiStatus === 'syncing' 
                                        ? 'bg-amber-400 animate-ping' 
                                        : 'bg-zinc-500'
                            }`} 
                        />
                        <span>
                            {aiStatus === 'online' && 'AI TELEMETRY // ONLINE'}
                            {aiStatus === 'syncing' && 'AI // SYNCING...'}
                            {aiStatus === 'fallback' && 'TELEMETRY // SECURE FALLBACK'}
                        </span>
                    </div>

                    <div 
                        className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-lg border backdrop-blur-sm"
                        style={{ borderColor: `${theme.techColor}40`, color: theme.techColor }}
                    >
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.techColor }} />
                        <span>STRATEGY DESK // {theme.badge} • {teamPrincipal?.teamName.toUpperCase() || 'PIT WALL'}</span>
                    </div>
                </div>
            </header>

            {/* CONTAINER PRINCIPAL: ROW 1 (DIAS DA SEMANA) + WORKSTATION EM 3 COLUNAS */}
            <div 
                className={`relative z-10 w-full max-w-[1520px] px-2 sm:px-4 pt-2.5 sm:pt-3.5 pb-10 flex flex-col gap-3.5 sm:gap-4 mx-auto transition-all duration-300 ${
                    isClearing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                }`}
            >
                {/* ROW 1: SELETOR DOS 7 DIAS DA SEMANA [seg] [ter] [qua] [qui] [sex] [sab] [dom] */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-black/80 border border-white/10 rounded-lg p-2.5 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">
                            RACE WEEK // {circuitIntel.officialTitle.toUpperCase()}
                        </span>
                    </div>

                    {/* SELETOR DOS DIAS: [seg] [ter] [qua] [qui] [sex] [sab] [dom] */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {WEEK_DAYS.map((d) => {
                            const isSelected = selectedDay === d.id;
                            const isToday = activeRaceWeekDay === d.id;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setSelectedDay(d.id)}
                                    className={`font-mono text-xs sm:text-sm font-bold tracking-wider px-2.5 sm:px-3 py-1 rounded transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)] font-black scale-105'
                                            : isToday
                                                ? 'text-emerald-400/80 hover:text-emerald-300 border border-dashed border-emerald-500/40 bg-emerald-950/20'
                                                : 'text-white/40 hover:text-white/80 border border-transparent hover:border-white/10'
                                    }`}
                                >
                                    [{d.short}]
                                </button>
                            );
                        })}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/40 uppercase">
                        <span>CRONOGRAMA:</span>
                        <span className="text-emerald-400 font-bold">{activeDayData.dayName}</span>
                    </div>
                </div>

                {/* CONTROLES MOBILE: ABAS PARA ALTERNAR ENTRE PISTA, DIÁLOGOS E ROTINA */}
                <div className="flex lg:hidden items-center justify-center gap-1.5 border-b border-white/10 pb-2">
                    <button
                        type="button"
                        onClick={() => setMobileView('track')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                            mobileView === 'track'
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] font-black'
                                : 'bg-black/60 text-white/60 border-white/10'
                        }`}
                    >
                        [ PISTA ]
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileView('dialogue')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                            mobileView === 'dialogue'
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] font-black'
                                : 'bg-black/60 text-white/60 border-white/10'
                        }`}
                    >
                        [ DIÁLOGOS ]
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileView('timeline')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                            mobileView === 'timeline'
                                ? 'bg-[#fbaa19] text-black border-[#fbaa19] font-black'
                                : 'bg-black/60 text-white/60 border-white/10'
                        }`}
                    >
                        [ ROTINA ]
                    </button>
                </div>

                {/* GRID WORKSTATION DE 3 COLUNAS */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">

                    {/* COLUNA ESQUERDA (lg:col-span-3): STATUS DA PISTA & CONDICIONAMENTO */}
                    <div className={`w-full lg:col-span-3 flex-col gap-3.5 ${mobileView === 'track' ? 'flex' : 'hidden lg:flex'}`}>
                        <div 
                            className="border-2 rounded-lg p-3.5 flex flex-col gap-3 font-mono bg-black/85 backdrop-blur-md transition-all shadow-xl"
                            style={{ borderColor: `${theme.seniorColor}80` }}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#fbaa19] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fbaa19]">
                                        STATUS DA PISTA // {activeDayData.dayName}
                                    </span>
                                </div>
                                <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-bold uppercase">
                                    R19 // {circuitIntel.countryCode}
                                </span>
                            </div>

                            {/* Atividade de Pista do Dia */}
                            <div className="p-2.5 rounded bg-white/[0.03] border border-white/10 flex flex-col gap-1">
                                <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold">ATIVIDADE OFICIAL DE PISTA:</span>
                                <span className="text-[11px] font-black text-white leading-tight">
                                    {activeDayData.trackActivity}
                                </span>
                            </div>

                            {/* Grid de Métricas de Circuito */}
                            <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                                <div className="p-2 bg-white/[0.02] border border-white/5 rounded">
                                    <span className="text-white/40 block text-[8px] uppercase">EXTENSÃO / VOLTAS</span>
                                    <span className="font-bold text-white">{circuitIntel.circuitLengthKm} KM · {circuitIntel.laps} LAPS</span>
                                </div>
                                <div className="p-2 bg-white/[0.02] border border-white/5 rounded">
                                    <span className="text-white/40 block text-[8px] uppercase">DOWNFORCE</span>
                                    <span className="font-bold text-white">{circuitIntel.downforceLevel}</span>
                                </div>
                                <div className="p-2 bg-white/[0.02] border border-white/5 rounded">
                                    <span className="text-white/40 block text-[8px] uppercase">SAFETY CAR</span>
                                    <span className="font-bold text-[#fbaa19]">{circuitIntel.scProbability}%</span>
                                </div>
                                <div className="p-2 bg-white/[0.02] border border-white/5 rounded">
                                    <span className="text-white/40 block text-[8px] uppercase">RISCO DE CHUVA</span>
                                    <span className="font-bold text-cyan-400">{circuitIntel.weather?.rainRiskPercent || 20}%</span>
                                </div>
                            </div>

                            {/* Degradação & Estratégia */}
                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col gap-1 text-[9.5px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-[8px] uppercase">DEGRADAÇÃO TÉRMICA:</span>
                                    <span className="font-bold text-rose-400">{circuitIntel.tireDegradation}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-[8px] uppercase">ESTRATÉGIA ÓTIMA:</span>
                                    <span className="font-bold text-emerald-400">{circuitIntel.optimalStrategy}</span>
                                </div>
                            </div>

                            {/* Alocação Pirelli */}
                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex flex-col gap-1 text-[9.5px]">
                                <span className="text-white/40 text-[8px] uppercase">COMPOSTOS PIRELLI:</span>
                                <div className="flex items-center gap-1.5 font-bold text-[9px] mt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">HARD {circuitIntel.tireAllocation.hard}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">MED {circuitIntel.tireAllocation.medium}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">SOFT {circuitIntel.tireAllocation.soft}</span>
                                </div>
                            </div>

                            {/* Pole de Referência */}
                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-[9px]">
                                <span className="text-white/40 uppercase">POLE ANTERIOR:</span>
                                <span className="font-bold text-emerald-400">{circuitIntel.lastPoleTime.time} ({circuitIntel.lastPoleTime.driver})</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA CENTRAL (lg:col-span-6): MESA TÁTICA / DIÁLOGOS DOS ESTRATEGISTAS */}
                    <div className={`w-full lg:col-span-6 flex flex-col gap-4 ${mobileView === 'dialogue' ? 'flex' : 'hidden lg:flex'}`}>

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
                                text={getCardText('senior', seniorPoletimeLine)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'POLETIME',
                                        circuitId: 'americas',
                                        message: 'M. Amon, qual o seu conselho de pista para a disputa da Pole Position?',
                                        fallbackText: seniorPoletimeLine
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handlePoletimeSeniorCopy : undefined}
                                onFill={handlePoletimeSeniorAccept}
                                fillLabel={`ACCEPT (${effectiveSeniorPoletime}) »`}
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
                                    text={getCardText('technical', techPoletimeLine)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'POLETIME',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, qual a projeção matemática de tempo exato para o Q3?',
                                            fallbackText: techPoletimeLine
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handlePoletimeTechCopy}
                                    onFill={handlePoletimeTechAccept}
                                    fillLabel={`ACCEPT (${effectiveTechPoletime}) »`}
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
                                text={getCardText('senior', seniorTop10Line)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'TOP10',
                                        circuitId: 'americas',
                                        message: 'M. Amon, qual o seu conselho sobre o ritmo de corrida para o Top 10?',
                                        fallbackText: seniorTop10Line
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
                                    text={getCardText('technical', techTop10Line)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'TOP10',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, quais os dados de degradação térmica para os líderes?',
                                            fallbackText: techTop10Line
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
                                text={getCardText('senior', seniorEvoLine)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'EVO',
                                        circuitId: 'americas',
                                        message: 'M. Amon, quem tem estofo para escalar o grid com Safety Car?',
                                        fallbackText: seniorEvoLine
                                    });
                                }}
                                accentColor={theme.seniorColor}
                                animationDirection="left"
                                isSettled={subStep === 'TECH'}
                                settledLabel="COPY"
                                onCopy={subStep === 'SENIOR' ? handleEvoSeniorCopy : undefined}
                                onFill={handleEvoSeniorAccept}
                                fillLabel={`ACCEPT (${effectiveSeniorEvo[0]}) »`}
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
                                    text={getCardText('technical', techEvoLine)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'EVO',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, qual o piloto com melhor delta de ultrapassagem nos setores de DRS?',
                                            fallbackText: techEvoLine
                                        });
                                    }}
                                    accentColor={theme.techColor}
                                    accentGlow={theme.techGlow}
                                    animationDirection="right"
                                    onCopy={handleEvoTechCopy}
                                    onFill={handleEvoTechAccept}
                                    fillLabel={`ACCEPT (${effectiveTechEvo[0]}) »`}
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
                                text={getCardText('senior', seniorH2HLine)}
                                isStreaming={isCardStreaming('senior')}
                                streamingBadge="RÁDIO SÊNIOR"
                                onRadioConsult={() => {
                                    askStrategist({
                                        characterType: 'senior',
                                        characterId: seniorStrategist.id,
                                        topic: 'H2H',
                                        circuitId: 'americas',
                                        message: 'M. Amon, como avaliar a pressão psicológica nos duelos diretos de garagem?',
                                        fallbackText: seniorH2HLine
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
                                    text={getCardText('technical', techH2HLine)}
                                    isStreaming={isCardStreaming('technical')}
                                    streamingBadge="TELEMETRIA AO VIVO"
                                    onRadioConsult={() => {
                                        askStrategist({
                                            characterType: 'technical',
                                            characterId: technicalStrategist.id,
                                            topic: 'H2H',
                                            circuitId: 'americas',
                                            message: 'Engenheiro, os dados de telemetria apontam vantagem de motor ou de chassi nos confrontos diretos?',
                                            fallbackText: techH2HLine
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
                {/* TÓPICO 5: CONCLUSÃO & ORDENS DO CHEFE DE EQUIPE                           */}
                {/* ========================================================================= */}
                {currentTopic === 'FINAL_MISC' && (
                    <div className="w-full animate-fade-in-left">
                        <BoxCard
                            speakerBadge={teamPrincipal ? `[${teamPrincipal.code}]` : '[DIR.GERAL]'}
                            speakerRole={teamPrincipal ? `CHEFE DE EQUIPE // ${teamPrincipal.teamName.toUpperCase()}` : 'CHEFE DE EQUIPE // STRATEGY DESK'}
                            avatarUrl={teamPrincipal?.avatarUrl}
                            categoryTag="ORDENS DA STRATEGY DESK // MISC & EVENT PROPS"
                            text={principalClosing || (teamPrincipal?.fridayMiscBriefing ? `"${teamPrincipal.fridayMiscBriefing}"` : `"A estratégia de telemetria está compilada na Strategy Desk. Assuma o pit wall, defina os eventos de pista e transmita a ordem."`)}
                            accentColor="#10b981"
                            animationDirection="left"
                            onFill={handleGoToPositionsMisc}
                            fillLabel="[ TRANSMITIR ORDENS & PREENCHER MISC » ]"
                        />
                    </div>
                )}

                {/* RÁDIO INTERATIVO DA STRATEGY DESK (IA) */}
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
                                        ? "Transmissão aberta na Strategy Desk..."
                                        : `Questionar ${subStep === 'TECH' && technicalStrategist ? technicalStrategist.code : seniorStrategist.code} na Strategy Desk... [Enter para transmitir]`
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

                    {/* COLUNA DIREITA (lg:col-span-3): CRONOGRAMA OPERACIONAL RACE WEEK */}
                    <div className={`w-full lg:col-span-3 flex-col gap-3.5 ${mobileView === 'timeline' ? 'flex' : 'hidden lg:flex'}`}>
                        <div 
                            className="border-2 rounded-lg p-3.5 flex flex-col gap-3 font-mono bg-black/85 backdrop-blur-md transition-all shadow-xl"
                            style={{ borderColor: `${theme.seniorColor}80` }}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                        CRONOGRAMA // {activeDayData.dayName}
                                    </span>
                                </div>
                                <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                                    {activeDayData.broadcastCode}
                                </span>
                            </div>

                            <p className="text-[10.5px] text-white/70 italic leading-snug">
                                "{activeDayData.subTitle}"
                            </p>

                            {/* Timeline de Atividades Operacionais */}
                            <div className="flex flex-col gap-2">
                                {activeDayData.operationalTimeline.map((item, idx) => (
                                    <div key={idx} className="p-2 rounded bg-white/[0.03] border border-white/10 flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-white/50">{item.time}</span>
                                            <span 
                                                className="text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase"
                                                style={{ backgroundColor: `${item.color}20`, color: item.color }}
                                            >
                                                {item.badge}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white">{item.title}</span>
                                        <p className="text-[9px] text-white/60 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Diretriz Tática do Dia */}
                            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1 text-[9.5px]">
                                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                                    &gt;_ DIRETRIZ TÁTICA DO DIA:
                                </span>
                                <p className="text-white/90 text-[10px] leading-relaxed">
                                    {activeDayData.tacticalObjective}
                                </p>
                            </div>

                            {/* Status de Mercado */}
                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-[8.5px] text-white/40">
                                <span>STATUS TS1:</span>
                                <span className="text-emerald-400 font-bold">{activeDayData.marketStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
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
