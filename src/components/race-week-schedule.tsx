"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { F1Event, fetchNextEvent } from '@/api/f1-data';
import { 
    getTeamPrincipal, 
    getCrewRelationship, 
    TeamPrincipal, 
    CrewRelationshipState 
} from '@/lib/paddock-crew';
import { SENIOR_STRATEGISTS, SeniorStrategist, getSeniorStrategistById } from '@/lib/race-directors';
import { ChevronRight, Clock, Radio, UserCheck, Flame, Users, Sparkles } from 'lucide-react';
import { DialogueBox } from '@/components/dialogue-box';
import { RACE_WEEK_DIALOGS } from '@/data/dialogues';
import { supabase } from '@/utils/supabase';
import { CrewRolesConfig, DEFAULT_CREW_ROLES_CONFIG, fetchCrewRolesConfig } from '@/lib/crew-config';
import { EngineeringCouncilModal } from '@/components/engineering-council-modal';
import { TeamPrincipalAvatar } from '@/components/team-principal-avatar';

export interface DaySchedule {
    dayId: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    dayNumber: number; // 1 to 7
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
    mentorDialogue: {
        speaker: string;
        role: string;
        avatarUrl?: string;
        message: string;
        tacticalObjective: string;
    };
    ts1Broadcast: {
        code: string;
        title: string;
        systemAction: string;
        marketStatus: string;
    };
    actionButton?: {
        label: string;
        href: string;
    };
}

export interface RaceWeekScheduleProps {
    event?: F1Event | null;
    compact?: boolean;
    teamCode?: string;
    mentorId?: string | null;
    mentor?: SeniorStrategist | null;
    accentColor?: string;
    className?: string;
    showNavigationLink?: boolean;
}

export default function RaceWeekSchedule({
    event: propEvent,
    compact = false,
    teamCode,
    mentorId,
    mentor: propMentor,
    accentColor = '#fbaa19',
    className = '',
    showNavigationLink = true,
}: RaceWeekScheduleProps) {
    const [event, setEvent] = useState<F1Event | null>(propEvent || null);
    const [selectedDay, setSelectedDay] = useState<string>('today');
    const [showHospitalityModal, setShowHospitalityModal] = useState(false);
    const [councilModalDay, setCouncilModalDay] = useState<'tue' | 'wed' | 'thu' | 'fri' | null>(null);
    const [relationship, setRelationship] = useState<CrewRelationshipState | null>(null);
    const [userMentorId, setUserMentorId] = useState<string | null>(mentorId || propMentor?.id || null);
    const [userTeamCode, setUserTeamCode] = useState<string>(teamCode || 'FER');
    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);
    const [postRaceReaction, setPostRaceReaction] = useState<string | null>(null);
    const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);

    // Identifica o dia da semana atual no fuso local (0 = Domingo, 1 = Segunda ... 6 = Sábado)
    const todayIndex = new Date().getDay();
    const dayIndexToDayId: Record<number, 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'> = {
        0: 'sun',
        1: 'mon',
        2: 'tue',
        3: 'wed',
        4: 'thu',
        5: 'fri',
        6: 'sat'
    };
    const currentDayId = dayIndexToDayId[todayIndex] || 'fri';

    useEffect(() => {
        if (mentorId) setUserMentorId(mentorId);
        else if (propMentor?.id) setUserMentorId(propMentor.id);
    }, [mentorId, propMentor]);

    useEffect(() => {
        if (teamCode) setUserTeamCode(teamCode);
    }, [teamCode]);

    useEffect(() => {
        fetchCrewRolesConfig().then((cfg) => setCrewConfig(cfg));

        // Se o mentor ou equipe não foram passados via props (ex: rota /race-week), busca do usuário logado
        if (!propMentor && !mentorId) {
            let cancelled = false;
            supabase.auth.getUser().then(async ({ data: authData }) => {
                const uid = authData?.user?.id;
                if (!uid || cancelled) return;

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('senior_strategist_id')
                    .eq('id', uid)
                    .maybeSingle();

                if (!cancelled && prof?.senior_strategist_id) {
                    setUserMentorId(prof.senior_strategist_id);
                }

                if (!teamCode) {
                    const { data: contractData } = await supabase
                        .from('contracts')
                        .select('teams(code)')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const teamsField = (contractData as { teams?: { code?: string } | Array<{ code?: string }> } | null)?.teams;
                    const resolvedCode = Array.isArray(teamsField) ? teamsField[0]?.code : teamsField?.code;
                    if (!cancelled && resolvedCode) {
                        setUserTeamCode(resolvedCode);
                    }
                }
            }).catch(() => {});

            return () => {
                cancelled = true;
            };
        }
    }, [propMentor, mentorId, teamCode]);

    const effectiveTeamCode = teamCode || userTeamCode || 'FER';
    const basePrincipal: TeamPrincipal = getTeamPrincipal(effectiveTeamCode);
    const principalOverride = crewConfig.overrides[`tp-${basePrincipal.teamCode}`];
    const principal: TeamPrincipal = principalOverride
        ? {
            ...basePrincipal,
            title: principalOverride.role || basePrincipal.title,
            briefingFocus: principalOverride.specialty || basePrincipal.briefingFocus,
            hospitalityWelcome: principalOverride.bioOrQuote || basePrincipal.hospitalityWelcome,
        }
        : basePrincipal;

    const baseMentor: SeniorStrategist =
        propMentor ||
        getSeniorStrategistById(userMentorId || crewConfig.slots.raceWeekFallbackMentorId) ||
        SENIOR_STRATEGISTS[0];
    const mentorOverride = crewConfig.overrides[baseMentor.id];
    const mentor: SeniorStrategist = mentorOverride
        ? {
            ...baseMentor,
            title: mentorOverride.role || baseMentor.title,
        }
        : baseMentor;
    const mentorAvatarUrl =
        (mentor as SeniorStrategist & { avatarUrl?: string }).avatarUrl ||
        `/avatar/ex_drivers/avatar_driver_${parseInt(mentor.id.replace('strat-', ''), 10) || 1}.jpg`;

    useEffect(() => {
        if (!propEvent) {
            fetchNextEvent().then(ev => {
                if (ev) setEvent(ev);
            });
        } else {
            setEvent(propEvent);
        }
        setRelationship(getCrewRelationship(effectiveTeamCode));
    }, [propEvent, effectiveTeamCode]);

    const eventName = event?.name || 'MEXICO CITY GRAND PRIX';
    const circuitName = event?.circuit || 'AUTÓDROMO HERMANOS RODRÍGUEZ';
    const isSprint = !!event?.isSprint;

    // Cronograma adaptado genericamente com base no evento e formato (Standard vs Sprint)
    const baseRaceWeekDays: DaySchedule[] = [
        {
            dayId: 'mon',
            dayNumber: 1,
            dayName: 'SEGUNDA-FEIRA',
            subTitle: 'Logística Global & Recepção de Hospitalidade',
            trackActivity: 'SEM ATIVIDADE DE PISTA // PADDOCK FECHADO',
            operationalTimeline: [
                {
                    time: '06:00 - 12:00',
                    title: `Desembarque das Frotas em ${circuitName.split(' ')[0]}`,
                    desc: 'Cargueiros fretados e contêineres de chassis chegam ao autódromo com equipamentos e telemetria.',
                    badge: 'LOGÍSTICA',
                    color: '#60a5fa'
                },
                {
                    time: '13:00 - 20:00',
                    title: 'Montagem Estrutural das Garagens Oficiais',
                    desc: 'Instalação de fibra óptica, painéis divisórios e redes dedicadas para conexão ao pitwall.',
                    badge: 'INFRAESTRUTURA',
                    color: '#a78bfa'
                }
            ],
            mentorDialogue: {
                speaker: principal.code,
                role: principal.title,
                message: `“${principal.hospitalityWelcome.replace(/“|”/g, '')} Comece alinhando os parâmetros do ${eventName}. A semana de GP é curta e cada erro de telemetria custa caro.”`,
                tacticalObjective: 'Alinhamento com o Chefe de Equipe e introdução das características de downforce do traçado.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B101-INIT',
                title: 'HOMOLOGAÇÃO DA ETAPA E ABERTURA OFICIAL DO CIRCUITO',
                systemAction: 'Sincronização de satélites e enlace criptografado com o pitwall.',
                marketStatus: 'BOOK DE MERCADOS: ABERTO EM MODO PRE-RACE'
            },
            actionButton: {
                label: 'REUNIÃO NO HOSPITALITY COM O CHEFE',
                href: '#hospitality'
            }
        },
        {
            dayId: 'tue',
            dayNumber: 2,
            dayName: 'TERÇA-FEIRA',
            subTitle: 'Construção do Pit Wall & Montagem Mecânica',
            trackActivity: 'SEM ATIVIDADE DE PISTA // MONTAGEM INTERNA',
            operationalTimeline: [
                {
                    time: '08:00 - 14:00',
                    title: 'Erguimento do Pit Wall e Centro de Operações',
                    desc: 'Calibração das telas de telemetria dos estrategistas na mureta dos boxes.',
                    badge: 'PIT WALL',
                    color: '#38bdf8'
                },
                {
                    time: '14:00 - 22:00',
                    title: 'Acoplamento de Power Unit, Câmbio e Suspensões',
                    desc: 'Mecânicos montam motor térmico, baterias híbridas e sistemas de transmissão.',
                    badge: 'MECÂNICA',
                    color: '#fb923c'
                }
            ],
            mentorDialogue: {
                speaker: mentor.code,
                role: mentor.title,
                avatarUrl: mentorAvatarUrl,
                message: `“O motor está no chassi. A fábrica está simulando janelas de degradação térmica para as retas de ${circuitName}. Acompanhe o clima previsto antes de definir os alvos de tempo.”`,
                tacticalObjective: 'Estimular análise de clima e direção dos ventos para poletime e corrida.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B102-INFRA',
                title: 'VALIDAÇÃO DE FREQUÊNCIAS DE RÁDIO E SENSORES',
                systemAction: 'Checagem de transponders oficiais e enlace de dados do carro.',
                marketStatus: 'COTAÇÕES MLS: HOMOLOGADAS NA BASE'
            },
            actionButton: {
                label: 'MESA DE ENGENHARIA // DEBATER POLETIME',
                href: '#council-tue'
            }
        },
        {
            dayId: 'wed',
            dayNumber: 3,
            dayName: 'QUARTA-FEIRA',
            subTitle: 'Track Walk, Alocação Pirelli & Reconhecimento',
            trackActivity: 'RECONHECIMENTO A PÉ // CALIBRAÇÃO TÉCNICA',
            operationalTimeline: [
                {
                    time: '09:00 - 13:00',
                    title: `Track Walk Oficial em ${circuitName}`,
                    desc: 'Pilotos e estrategistas percorrem o traçado a pé inspecionando zebras, recapeamento e frenagens.',
                    badge: 'TRACK WALK',
                    color: '#facc15'
                },
                {
                    time: '14:00 - 18:00',
                    title: 'Alocação de Pneus Pirelli & Fire-up dos Motores',
                    desc: 'Recebimento dos jogos de pneus slick (Soft, Medium, Hard) e testes de partida nos boxes.',
                    badge: 'PIRELLI ALLOC',
                    color: '#f43f5e'
                }
            ],
            mentorDialogue: {
                speaker: mentor.code,
                role: mentor.title,
                avatarUrl: mentorAvatarUrl,
                message: '“Caminhamos pelo asfalto esta manhã. As zebras externas exigem cuidado com assoalho. Ajuste sua estimativa de desgaste e paradas de box no terminal.”',
                tacticalObjective: 'Fornecer dados técnicos de pista para refinar o Top 10 e Duelos H2H.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B103-COMPOUNDS',
                title: 'DIVULGAÇÃO DOS COMPOSTOS OFICIAIS E LIMITES DE PISTA',
                systemAction: 'Registro oficial das zonas de DRS e calibração de sensores de linha branca.',
                marketStatus: 'JANELA DE PREVISÃO POLETIME: ABERTA'
            },
            actionButton: {
                label: 'MESA DE ENGENHARIA // DEBATER EVO (ESCALADA)',
                href: '#council-wed'
            }
        },
        {
            dayId: 'thu',
            dayNumber: 4,
            dayName: 'QUINTA-FEIRA',
            subTitle: 'Media Day Oficial & Escrutínio Técnico TS1',
            trackActivity: 'INSPEÇÃO TÉCNICA // TREINOS DE PIT STOP',
            operationalTimeline: [
                {
                    time: '09:00 - 13:00',
                    title: 'Media Day & Coletivas de Imprensa dos Pilotos',
                    desc: 'Declarações e expectativas das equipes antes da primeira sessão de pista.',
                    badge: 'MEDIA DAY',
                    color: '#34d399'
                },
                {
                    time: '11:00 - 16:00',
                    title: 'Escrutínio Técnico Homologado (Scrutineering)',
                    desc: 'Pesagem de 798 kg, conferência milimétrica de asas e testes de deflexão de carga.',
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
            mentorDialogue: {
                speaker: mentor.code,
                role: mentor.title,
                avatarUrl: mentorAvatarUrl,
                message: `“Monopostos aprovados na balança sem infrações. O alvo de Poletime projetado pela nossa equipe fica na faixa de ${mentor.briefingTips.poletimeTarget}. Abra seu formulário e faça as primeiras marcações.”`,
                tacticalObjective: 'Pressionar o apostador a registrar seu Poletime antes dos treinos decisivos.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B104-SCRUTINEER',
                title: 'HOMOLOGAÇÃO TÉCNICA DOS MONOPOSTOS CONCLUÍDA',
                systemAction: 'Contagem regressiva oficial para abertura do pitlane.',
                marketStatus: 'AVISO: JANELAS DE PREVISÃO EM CONTAGEM REGRESSIVA'
            },
            actionButton: {
                label: 'MESA DE ENGENHARIA // DEBATER DUELOS H2H',
                href: '#council-thu'
            }
        },
        {
            dayId: 'fri',
            dayNumber: 5,
            dayName: 'SEXTA-FEIRA',
            subTitle: isSprint 
                ? 'Abertura de Pista: Treino Livre Único (FP1) + Classificação Sprint'
                : 'Abertura de Pista: Treinos Livres (FP1 / FP2)',
            trackActivity: isSprint
                ? 'FP1 (60 min) + SPRINT QUALIFYING (SHOOTOUT)'
                : 'FP1 (60 min) + FP2 (60 min) — COLETA DE TELEMETRIA',
            operationalTimeline: isSprint
                ? [
                    {
                        time: event?.fp1Time ? `${event.fp1Time}` : '12:30 - 13:30',
                        title: 'Treino Livre 1 (FP1 — 60 min de Acerto Único)',
                        desc: 'Apenas uma hora para acertar downforce, altura de rodagem e correlação de fluxo aero.',
                        badge: 'FP1 ÚNICO',
                        color: '#22c55e'
                    },
                    {
                        time: event?.sprintTime ? `${event.sprintTime}` : '16:30 - 17:15',
                        title: 'Sprint Qualifying (Shootout SQ1 / SQ2 / SQ3)',
                        desc: 'Sessão eliminatória em regime de Parque Fechado Bipolar: SQ1 (Médio), SQ2 (Médio), SQ3 (Macio).',
                        badge: 'SPRINT QUALI',
                        color: '#ef4444'
                    }
                ]
                : [
                    {
                        time: event?.fp1Time ? `${event.fp1Time}` : '12:30 - 13:30',
                        title: 'Treino Livre 1 (FP1 — 60 minutos)',
                        desc: 'Avaliação de aero-rakes, correlação de pneus e referências iniciais de pista.',
                        badge: 'FP1 PISTA',
                        color: '#22c55e'
                    },
                    {
                        time: event?.fp2Time ? `${event.fp2Time}` : '16:00 - 17:00',
                        title: 'Treino Livre 2 (FP2 — Simulação de Classificação & Long Runs)',
                        desc: 'Teste crucial no mesmo horário de corrida: voltas rápidas de qualificação e ritmo com tanque cheio.',
                        badge: 'FP2 LONG RUNS',
                        color: '#10b981'
                    }
                ],
            mentorDialogue: {
                speaker: principal.code,
                role: `${principal.title} // ${principal.teamName}`,
                avatarUrl: undefined,
                message: principal.fridayMiscBriefing,
                tacticalObjective: `Orientação da Chefia [${principal.code} & ${principal.leadChiefStrategist.code}]: diretriz conservadora para o formulário MISC. A alocação de risco final pertence exclusivamente a você.`
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B105-PRACTICE',
                title: 'RELATÓRIO DE TELEMETRIA OFICIAL PÓS-TREINOS',
                systemAction: 'Liberação de tempos de setores, speed traps e desgaste no painel de telemetria.',
                marketStatus: 'ALERTA: JANELA POLETIME FECHA NO INÍCIO DO Q1'
            },
            actionButton: {
                label: 'CRAVAR POLETIME & ABRIR MESA TÁTICA',
                href: '#council-fri'
            }
        },
        {
            dayId: 'sat',
            dayNumber: 6,
            dayName: 'SÁBADO',
            subTitle: isSprint 
                ? 'Corrida Sprint (100 km) & Classificação Oficial do GP'
                : 'Treino Livre 3 (FP3) & Classificação Oficial (Q1/Q2/Q3)',
            trackActivity: isSprint 
                ? 'CORRIDA SPRINT (100 KM) + SESSÃO DE CLASSIFICAÇÃO OFICIAL'
                : 'FP3 (60 min) + CLASSIFICAÇÃO OFICIAL (Q1/Q2/Q3)',
            operationalTimeline: isSprint
                ? [
                    {
                        time: '11:00 - 11:45',
                        title: 'A Corrida Sprint (100 km flat-out)',
                        desc: 'Largada parada sem pit stop obrigatório. Pontuação direta aos 8 primeiros (8 a 1 pts).',
                        badge: 'CORRIDA SPRINT',
                        color: '#ef4444'
                    },
                    {
                        time: event?.qualiTime ? `${event.qualiTime}` : '15:00 - 16:00',
                        title: 'Classificação Oficial do Grande Prêmio (Qualifying)',
                        desc: 'Disputa da Pole Position e definição do grid principal de largada (Q1, Q2, Q3).',
                        badge: 'QUALIFYING',
                        color: '#fbaa19'
                    }
                ]
                : [
                    {
                        time: event?.fp3Time ? `${event.fp3Time}` : '11:30 - 12:30',
                        title: 'Treino Livre 3 (FP3 — 60 minutos)',
                        desc: 'Ajustes finos para volta voadora e treino de largadas na saída dos boxes.',
                        badge: 'FP3 PISTA',
                        color: '#3b82f6'
                    },
                    {
                        time: event?.qualiTime ? `${event.qualiTime}` : '15:00 - 16:00',
                        title: 'Classificação Oficial do Grande Prêmio (Qualifying)',
                        desc: 'Q1 (18m - eliminam 5), Q2 (15m - eliminam 5), Q3 (12m - disputa brutal pela Pole Position).',
                        badge: 'QUALIFYING',
                        color: '#fbaa19'
                    }
                ],
            mentorDialogue: {
                speaker: principal.code,
                role: principal.title,
                message: `“O grid de largada está homologado e os carros entram em regime de Parque Fechado. A diretoria espera precisão total na montagem do Top 10 e nas apostas de duelo. Mostre seu valor no pit wall.”`,
                tacticalObjective: 'Conectar resultado da classificação com o Poletime e preparar as previsões de domingo.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B106-GRID',
                title: 'HOMOLOGAÇÃO OFICIAL DO GRID E RESULTADOS POLETIME',
                systemAction: 'Fechamento de Poletime e abertura dos mercados de Volta Mais Rápida e Duelos.',
                marketStatus: 'MERCADO POLETIME: ENCERRADO E HOMOLOGADO'
            },
            actionButton: {
                label: 'CONSOLIDAR TOP 10 FINISH & DUELOS',
                href: '/positions?tab=master'
            }
        },
        {
            dayId: 'sun',
            dayNumber: 7,
            dayName: 'DOMINGO',
            subTitle: 'Dia do Grande Prêmio, Pódio, Vistorias & Pack-Down',
            trackActivity: 'CORRIDA OFICIAL (~305 KM) // BANDEIRA QUADRICULADA',
            operationalTimeline: [
                {
                    time: '10:00 - 11:30',
                    title: 'Briefing Estratégico Definitivo',
                    desc: 'Planos de corrida: Plano A (1 parada), Plano B (2 paradas) e janelas de Safety Car.',
                    badge: 'ESTRATÉGIA',
                    color: '#6366f1'
                },
                {
                    time: event?.time ? `${event.time}` : '15:00',
                    title: `LARGADA: ${eventName} (305 KM)`,
                    desc: 'Apagamento das 5 luzes vermelhas e disputa por 25 pontos do mundial e fantasy.',
                    badge: 'LIGHTS OUT',
                    color: '#22c55e'
                },
                {
                    time: '17:00 - 18:00',
                    title: 'Cerimônia do Pódio & Entrevistas Oficiais',
                    desc: 'Troféus para os 3 primeiros colocados e construtor vencedor.',
                    badge: 'PÓDIO',
                    color: '#fbaa19'
                },
                {
                    time: '18:30 - 02:00+',
                    title: 'O Grande Pack-Down (Desmontagem dos Boxes)',
                    desc: 'Desmontagem noturna acelerada dos equipamentos rumo à próxima etapa do calendário.',
                    badge: 'PACK-DOWN',
                    color: '#64748b'
                }
            ],
            mentorDialogue: {
                speaker: principal.code,
                role: principal.title,
                message: `“Bandeirada quadriculada no ${eventName}! As decisões de pit stop definiram o resultado. Acesse o extrato de Milesimus (MLS) no seu painel: os dividendos das posições homologadas já estão disponíveis.”`,
                tacticalObjective: 'Debriefing da rodada, cálculo de dividendos MLS e atualização do ranking Master.'
            },
            ts1Broadcast: {
                code: 'TS1-SYS // B107-RESULTS',
                title: 'HOMOLOGAÇÃO DOS RESULTADOS E LIQUIDAÇÃO DE MERCADOS',
                systemAction: 'Auditoria das apostas de Master, Duelos, Duplas Teamwork e ranking geral.',
                marketStatus: 'MERCADOS LIQUIDADOS // RESULTADOS HOMOLOGADOS TS1'
            },
            actionButton: {
                label: 'VER EXTRATO DE MILESIMUS & RANKING',
                href: '/telemetry'
            }
        }
    ];

    const raceWeekDays: DaySchedule[] = baseRaceWeekDays.map((day) => {
        const synced = RACE_WEEK_DIALOGS[day.dayId];
        if (!synced) return day;
        const chosenMsg = (isSprint && day.dayId === 'fri' && synced.sprintMessage)
            ? synced.sprintMessage
            : synced.message;
        return {
            ...day,
            mentorDialogue: {
                ...day.mentorDialogue,
                message: chosenMsg ? `“${chosenMsg}”` : day.mentorDialogue.message,
                tacticalObjective: synced.tacticalObjective || day.mentorDialogue.tacticalObjective,
            },
        };
    });

    const handleGeneratePostRaceDebrief = async () => {
        setIsGeneratingDebrief(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch('/api/race-week/post-race-reaction', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    round: String(event?.round || '19'),
                    teamCode: userTeamCode,
                    userPoints: 165,
                    circuitName: event?.name || 'Grande Prêmio',
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.reaction) {
                    setPostRaceReaction(data.reaction);
                }
            }
        } catch (err) {
            console.warn('Erro ao carregar debriefing dinâmico:', err);
        } finally {
            setIsGeneratingDebrief(false);
        }
    };

    // Dia ativo selecionado para exibição
    const activeDayData = selectedDay === 'today'
        ? (raceWeekDays.find(d => d.dayId === currentDayId) || raceWeekDays[4])
        : raceWeekDays.find(d => d.dayId === selectedDay);

    const isShowingAll = selectedDay === 'all';
    const displayedDays = isShowingAll 
        ? raceWeekDays 
        : (activeDayData ? [activeDayData] : [raceWeekDays[4]]);

    return (
        <section className={`w-full font-mono flex flex-col gap-3 ${className}`}>
            
            {/* 1. CABEÇALHO DO COMPONENTE */}
            <div className="w-full bg-black border border-white/10 p-4 sm:p-5 flex flex-col gap-3 rounded-sm shadow-xl">
                
                {/* Título do Evento */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white">
                            {eventName}
                        </h2>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest mt-0.5">
                            {circuitName} {event?.date ? `· ${event.date}` : ''}
                        </p>
                    </div>
                </div>

                {/* SELETOR DE DIAS DA SEMANA */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10">
                    <button
                        onClick={() => setSelectedDay('today')}
                        className={`px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedDay === 'today'
                                ? 'bg-white text-black shadow-md'
                                : 'bg-white/5 text-white/60 hover:text-white border border-white/15'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>HOJE ({raceWeekDays.find(d => d.dayId === currentDayId)?.dayName.slice(0, 3)})</span>
                    </button>

                    <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

                    {raceWeekDays.map(d => {
                        const isToday = d.dayId === currentDayId;
                        const isPast = d.dayNumber < (raceWeekDays.find(r => r.dayId === currentDayId)?.dayNumber || 5);
                        const isSelected = selectedDay === d.dayId || (selectedDay === 'today' && isToday);

                        return (
                            <button
                                key={d.dayId}
                                onClick={() => setSelectedDay(d.dayId)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                        ? 'bg-white text-black font-black'
                                        : isToday
                                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50'
                                        : isPast
                                        ? 'bg-white/5 text-white/40 hover:text-white/70'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }`}
                            >
                                <span>{d.dayName.slice(0, 3)}</span>
                                {isPast && !isSelected && <span className="text-[8px] opacity-40">✓</span>}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setSelectedDay(selectedDay === 'all' ? 'today' : 'all')}
                        className="ml-auto text-[10px] font-bold text-white/50 hover:text-[#fbaa19] underline uppercase tracking-widest cursor-pointer"
                    >
                        {selectedDay === 'all' ? 'FECHAR VISÃO COMPLETA' : 'VER TODOS OS 7 DIAS'}
                    </button>
                </div>
            </div>

            {/* 2. LISTAGEM DO DIA ATIVO OU SEMANA COMPLETA */}
            <div className="flex flex-col gap-3">
                {displayedDays.map(day => {
                    const isToday = day.dayId === currentDayId;
                    const isPast = day.dayNumber < (raceWeekDays.find(r => r.dayId === currentDayId)?.dayNumber || 5);

                    return (
                        <div
                            key={day.dayId}
                            className={`w-full bg-black border transition-all rounded-sm p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden ${
                                isToday 
                                    ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                    : 'border-white/10'
                            }`}
                        >
                            {/* Marca d'água discreta */}
                            <div className="absolute right-3 top-1 text-[50px] sm:text-[60px] font-black text-white/[0.03] select-none pointer-events-none">
                                {String(day.dayNumber).padStart(2, '0')}
                            </div>

                            {/* Topo do Card do Dia */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span 
                                            className={`px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-xs ${
                                                isToday 
                                                    ? 'bg-emerald-500 text-black' 
                                                    : 'bg-white/10 text-white/70'
                                            }`}
                                        >
                                            DIA {day.dayNumber} {isToday ? '● HOJE' : isPast ? '✓ CONCLUÍDO' : 'PROGRAMADO'}
                                        </span>
                                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                                            {day.dayName}
                                        </h3>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-white/60 tracking-wider mt-1 uppercase">
                                        {day.subTitle}
                                    </p>
                                </div>

                                <div className="text-left sm:text-right shrink-0">
                                    <span className="text-[10px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-xs border border-white/10 text-white/70 bg-white/5 inline-block">
                                        {day.trackActivity}
                                    </span>
                                </div>
                            </div>

                            {/* DIÁLOGOS DE PADDOCK COM FUNDO PRETO E TEXTO BRANCO ENTRE ASPAS */}
                            {/* REGRA: Terça, Quarta e Quinta foram movidas para dentro do botão da Mesa de Engenharia */}
                            {(day.dayId === 'mon' || day.dayId === 'fri' || day.dayId === 'sat' || day.dayId === 'sun') && (
                                <div className="grid grid-cols-1 gap-3 relative z-10">
                                    <DialogueBox
                                        compact
                                        typewriter={false}
                                        speaker={day.dayId === 'fri' ? principal.code : (day.dayId === 'sun' && postRaceReaction ? principal.code : day.mentorDialogue.speaker)}
                                        speakerRole={day.dayId === 'fri' ? `TEAM PRINCIPAL // ${principal.teamName}` : (day.dayId === 'sun' && postRaceReaction ? `CHEFE DE EQUIPE // ${principal.teamName}` : day.mentorDialogue.role)}
                                        categoryTag={day.dayId === 'fri' ? "DIÁLOGO DIRETO COM O CHEFÃO" : day.dayId === 'sun' && postRaceReaction ? "DEBRIEFING OFICIAL" : "RÁDIO DE PITWALL"}
                                        avatarUrl={day.dayId === 'fri' || (day.dayId === 'sun' && postRaceReaction) ? (principal.avatarUrl || `/avatar/principals/${principal.teamCode}.jpg`) : day.mentorDialogue.avatarUrl}
                                        text={day.dayId === 'sun' && postRaceReaction ? postRaceReaction : day.mentorDialogue.message}
                                        accentColor={day.dayId === 'fri' ? "#ef4444" : "#fbaa19"}
                                        italic
                                        footerNote={
                                            <>
                                                <strong className="text-white/70">Alvo Tático:</strong> {day.mentorDialogue.tacticalObjective}
                                            </>
                                        }
                                                extraAction={
                                                    day.dayId === 'mon' ? (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowHospitalityModal(!showHospitalityModal)}
                                                                className="bg-[#fbaa19] hover:bg-[#fbaa19]/90 text-black font-black uppercase text-[10px] sm:text-[11px] tracking-wider px-3.5 py-1.5 rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                                            >
                                                                <Flame className="w-3.5 h-3.5" />
                                                                <span>DESPACHO COM {principal.code} »</span>
                                                            </button>
                                                        </div>
                                                    ) : day.dayId === 'sun' ? (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={handleGeneratePostRaceDebrief}
                                                                disabled={isGeneratingDebrief}
                                                                className="bg-[#fbaa19] hover:bg-[#fbaa19]/90 text-black font-black uppercase text-[10px] sm:text-[11px] tracking-wider px-3.5 py-1.5 rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                                            >
                                                                <Radio className="w-3.5 h-3.5" />
                                                                <span>{isGeneratingDebrief ? 'TRANSMISSÃO AO VIVO...' : `DEBRIEFING COM ${principal.code} »`}</span>
                                                            </button>
                                                        </div>
                                                    ) : undefined
                                                }
                                            />
                                        </div>
                            )}

                            {/* ROTINA OPERACIONAL RESUMIDA */}
                            <div className="flex flex-col gap-1.5 relative z-10 pt-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-[#fbaa19]" />
                                    HORÁRIOS & SESSÕES DE PISTA
                                </span>
                                <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-2`}>
                                    {day.operationalTimeline.map((item, idx) => (
                                        <div key={idx} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xs flex items-center justify-between gap-2">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-white uppercase truncate">{item.title}</span>
                                                <span className="text-[9px] text-white/50 truncate font-sans">{item.desc}</span>
                                            </div>
                                            <span className="text-[9px] font-mono font-bold text-white/50 shrink-0">{item.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* HOSPITALITY DIALOGUE BOX (QUANDO ABERTO NO DIA DO DESPACHO - SEGUNDA-FEIRA) */}
                            {day.dayId === 'mon' && showHospitalityModal && (
                                <div className="my-1 flex flex-col gap-2 relative z-10">
                                    <DialogueBox
                                        compact
                                        typewriter={false}
                                        speaker={principal.code}
                                        badgeTitle={`HOSPITALITY // ${principal.fullName.toUpperCase()} (${principal.title})`}
                                        text={principal.hospitalityWelcome}
                                        accentColor={accentColor}
                                        italic
                                        actions={[
                                            { label: '[FECHAR]', onClick: () => setShowHospitalityModal(false), variant: 'secondary' }
                                        ]}
                                        footerNote={
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10px] text-white/50">
                                                <span>
                                                    <strong className="text-white">Perfil da Chefia:</strong> {principal.personality}
                                                </span>
                                                <span>
                                                    <strong className="text-[#fbaa19]">Foco do Briefing:</strong> {principal.briefingFocus}
                                                </span>
                                            </div>
                                        }
                                    />
                                </div>
                            )}

                            {/* BOTÃO "ACTIONS" PARA OS DEMAIS DIAS */}
                            {day.dayId !== 'mon' && day.actionButton && (
                                <div className="pt-2 border-t border-white/10 flex justify-end relative z-10">
                                    {day.actionButton.href.startsWith('#council-') ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const targetDay = day.actionButton?.href.replace('#council-', '') as 'tue' | 'wed' | 'thu' | 'fri';
                                                setCouncilModalDay(targetDay || 'fri');
                                            }}
                                            className="bg-[#fbaa19] hover:bg-[#fbaa19]/90 text-black font-black uppercase text-xs tracking-wider px-4 py-2.5 rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{day.actionButton.label}</span>
                                            <span>»</span>
                                        </button>
                                    ) : day.actionButton.href.startsWith('#') ? (
                                        <button
                                            onClick={() => setShowHospitalityModal(true)}
                                            className="bg-[#fbaa19] hover:bg-[#fbaa19]/90 text-black font-black uppercase text-xs tracking-wider px-4 py-2.5 rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                                        >
                                            <span>{day.actionButton.label}</span>
                                            <span>»</span>
                                        </button>
                                    ) : (
                                        <Link
                                            href={day.actionButton.href}
                                            className="bg-[#fbaa19] hover:bg-[#fbaa19]/90 text-black font-black uppercase text-xs tracking-wider px-4 py-2.5 rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                                        >
                                            <span>{day.actionButton.label}</span>
                                            <span>»</span>
                                        </Link>
                                    )}
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>

            {/* MODAL DA MESA TÁTICA DA ENGENHARIA // DEBATES TER/QUA/QUI E CÚPULA SEX */}
            {councilModalDay && (
                <EngineeringCouncilModal
                    isOpen={!!councilModalDay}
                    onClose={() => setCouncilModalDay(null)}
                    principal={principal}
                    initialDay={councilModalDay}
                    userPilotCode={effectiveTeamCode}
                />
            )}
        </section>
    );
}
