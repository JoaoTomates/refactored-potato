"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { F1Event, fetchNextEvent } from '@/api/f1-data';
import { ChevronRight, Calendar, Clock, AlertTriangle, ShieldCheck, Radio, Flag, CheckCircle2 } from 'lucide-react';

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
        message: string;
        tacticalObjective: string;
    };
    baeff1Broadcast: {
        code: string;
        title: string;
        systemAction: string;
        marketStatus: string;
    };
}

export interface RaceWeekScheduleProps {
    event?: F1Event | null;
    compact?: boolean;
    accentColor?: string;
    className?: string;
    showNavigationLink?: boolean;
}

export default function RaceWeekSchedule({
    event: propEvent,
    compact = false,
    accentColor = '#fbaa19',
    className = '',
    showNavigationLink = true,
}: RaceWeekScheduleProps) {
    const [event, setEvent] = useState<F1Event | null>(propEvent || null);
    const [selectedDay, setSelectedDay] = useState<string>('today');
    const [showSprintModal, setShowSprintModal] = useState(false);

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
        if (!propEvent) {
            fetchNextEvent().then(ev => {
                if (ev) setEvent(ev);
            });
        } else {
            setEvent(propEvent);
        }
    }, [propEvent]);

    const eventName = event?.name || 'MEXICO CITY GRAND PRIX';
    const circuitName = event?.circuit || 'AUTÓDROMO HERMANOS RODRÍGUEZ';
    const isSprint = !!event?.isSprint;

    // Cronograma adaptado genericamente com base no evento e formato (Standard vs Sprint)
    const raceWeekDays: DaySchedule[] = [
        {
            dayId: 'mon',
            dayNumber: 1,
            dayName: 'SEGUNDA-FEIRA',
            subTitle: 'Logística Global & Desembarque no Circuito',
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: `“Bom dia, piloto. Nossas cargas tocaram o solo para o ${eventName}. A garagem está sendo montada. Abra os mapas de telemetria histórica e inicie o aquecimento de dados.”`,
                tacticalObjective: 'Introduzir características de downforce e exigência de pneus do traçado.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B101-INIT',
                title: 'HOMOLOGAÇÃO DA ETAPA E ABERTURA OFICIAL DO CIRCUITO',
                systemAction: 'Sincronização de satélites e enlace criptografado com o pitwall.',
                marketStatus: 'BOOK DE MERCADOS: ABERTO EM MODO PRE-RACE'
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: `“O motor está montado no chassi. A fábrica está simulando janelas de degradação térmica para as retas de ${circuitName}. Acompanhe o clima previsto.”`,
                tacticalObjective: 'Estimular análise de clima e direção dos ventos para poletime e corrida.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B102-INFRA',
                title: 'VALIDAÇÃO DE FREQUÊNCIAS DE RÁDIO E SENSORES',
                systemAction: 'Checagem de transponders oficiais e enlace de dados do carro.',
                marketStatus: 'COTAÇÕES MLS: HOMOLOGADAS NA BASE'
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: '“Caminhamos pelo asfalto esta manhã. As zebras externas exigem cuidado com assoalho. Ajuste sua estimativa de desgaste e paradas de box no terminal.”',
                tacticalObjective: 'Fornecer dados técnicos de pista para refinar o Top 10 e Duelos H2H.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B103-COMPOUNDS',
                title: 'DIVULGAÇÃO DOS COMPOSTOS OFICIAIS E LIMITES DE PISTA',
                systemAction: 'Registro oficial das zonas de DRS e calibração de sensores de linha branca.',
                marketStatus: 'JANELA DE PREVISÃO POLETIME: ABERTA'
            }
        },
        {
            dayId: 'thu',
            dayNumber: 4,
            dayName: 'QUINTA-FEIRA',
            subTitle: 'Media Day Oficial & Escrutínio Técnico BAEFF1',
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
                    title: 'Curfew Noturno Obrigatório BAEFF1',
                    desc: 'Paddock trancado para garantir descanso regulamentar dos mecânicos.',
                    badge: 'CURFEW',
                    color: '#ef4444'
                }
            ],
            mentorDialogue: {
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: '“Monopostos aprovados na balança sem infrações. Amanhã os motores finalmente roncam na pista. Não perca a janela de abertura de posições.”',
                tacticalObjective: 'Pressionar o apostador a registrar seu Poletime antes dos treinos decisivos.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B104-SCRUTINEER',
                title: 'HOMOLOGAÇÃO TÉCNICA DOS MONOPOSTOS CONCLUÍDA',
                systemAction: 'Contagem regressiva oficial para abertura do pitlane.',
                marketStatus: 'AVISO: JANELAS DE PREVISÃO EM CONTAGEM REGRESSIVA'
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: isSprint
                    ? `“Semana Sprint não perdoa hesitação: apenas 60 minutos de FP1 e entramos direto na disputa do grid Sprint. Olhe a velocidade máxima nos setores e crave seu palpite!”`
                    : `“A telemetria do FP2 confirmou o ritmo das equipes líderes nos stints médios. Observe quem conserva os pneus dianteiros em ${circuitName.split(' ')[0]} para definir o Top 10.”`,
                tacticalObjective: 'Entregar o insider de ritmo real para guiar a seleção de Top 10 e Duelos H2H.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B105-PRACTICE',
                title: 'RELATÓRIO DE TELEMETRIA OFICIAL PÓS-TREINOS',
                systemAction: 'Liberação de tempos de setores, speed traps e desgaste no painel de telemetria.',
                marketStatus: 'ALERTA: JANELA POLETIME FECHA NO INÍCIO DO Q1'
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: `“O grid de largada do ${eventName} está homologado e os carros estão sob Parque Fechado BAEFF1. Se você cravou o tempo de pole, seus pontos já foram computados. Foco total nas estratégias da corrida de amanhã!”`,
                tacticalObjective: 'Conectar resultado da classificação com o Poletime e preparar as previsões de domingo.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B106-GRID',
                title: 'HOMOLOGAÇÃO OFICIAL DO GRID E RESULTADOS POLETIME',
                systemAction: 'Fechamento de Poletime e abertura dos mercados de Volta Mais Rápida e Duelos.',
                marketStatus: 'MERCADO POLETIME: ENCERRADO E HOMOLOGADO'
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
                speaker: 'Estrategista Sênior',
                role: 'Mentor de Telemetria e Aliança',
                message: '“Bandeirada quadriculada! As decisões de pit stop definiram o vencedor. Acesse o extrato de Milesimus (MLS) no seu painel: os dividendos das posições homologadas já estão disponíveis.”',
                tacticalObjective: 'Debriefing da rodada, cálculo de dividendos MLS e atualização do ranking Master.'
            },
            baeff1Broadcast: {
                code: 'BAEFF1-SYS // B107-RESULTS',
                title: 'HOMOLOGAÇÃO DOS RESULTADOS E LIQUIDAÇÃO DE MERCADOS',
                systemAction: 'Auditoria das apostas de Master, Duelos, Duplas Teamwork e ranking geral.',
                marketStatus: 'MERCADOS LIQUIDADOS // RESULTADOS HOMOLOGADOS BAEFF1'
            }
        }
    ];

    // Dia ativo selecionado para exibição
    const activeDayData = selectedDay === 'today'
        ? (raceWeekDays.find(d => d.dayId === currentDayId) || raceWeekDays[4])
        : raceWeekDays.find(d => d.dayId === selectedDay);

    const isShowingAll = selectedDay === 'all';
    const displayedDays = isShowingAll 
        ? raceWeekDays 
        : (activeDayData ? [activeDayData] : [raceWeekDays[4]]);

    return (
        <section className={`w-full font-mono flex flex-col gap-4 ${className}`}>
            {/* CABEÇALHO DO COMPONENTE */}
            <div className="w-full bg-black/90 border border-white/10 p-4 sm:p-5 flex flex-col gap-3 rounded-lg shadow-xl relative overflow-hidden backdrop-blur-md">
                <div 
                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                    style={{ backgroundColor: accentColor }}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]" style={{ color: accentColor }}>
                            BAEFF1 // RACE WEEK DISPATCH
                        </span>
                        {event?.round && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 text-white rounded-xs">
                                R{event.round}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isSprint && (
                            <button
                                onClick={() => setShowSprintModal(!showSprintModal)}
                                className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-red-600/30 hover:bg-red-600 text-red-200 border border-red-500/50 rounded transition-all cursor-pointer flex items-center gap-1"
                            >
                                <span>⚡ SPRINT GP</span>
                                <span className="text-[8px] opacity-75">INFO</span>
                            </button>
                        )}
                        {showNavigationLink && (
                            <Link
                                href="/race-week"
                                className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white px-2.5 py-1 border border-white/15 hover:border-white/40 rounded transition-all flex items-center gap-1"
                            >
                                <span>PROTOCOLO COMPLETO</span>
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Título e Circuito do Evento */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 relative z-10">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                            {eventName}
                        </h2>
                        <p className="text-xs text-white/60 uppercase tracking-widest mt-0.5">
                            {circuitName} {event?.date ? `· ${event.date}` : ''}
                        </p>
                    </div>

                    {/* Indicador de Status do Dia Atual */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-white/80">
                            HOJE: <strong className="text-emerald-400">{raceWeekDays.find(d => d.dayId === currentDayId)?.dayName}</strong>
                        </span>
                    </div>
                </div>

                {/* MODAL / DROPDOWN CONCISO DE REGULAMENTO SPRINT (Apenas quando evento Sprint) */}
                {isSprint && showSprintModal && (
                    <div className="mt-2 p-3.5 bg-red-950/40 border border-red-500/40 rounded text-xs text-white/80 flex flex-col gap-2 relative z-10 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between font-bold text-red-400 uppercase text-[10px] tracking-wider border-b border-red-500/30 pb-1.5">
                            <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                FORMATO DA SEMANA SPRINT (COMPRESSÃO OPERACIONAL)
                            </span>
                            <button 
                                onClick={() => setShowSprintModal(false)}
                                className="text-white/60 hover:text-white cursor-pointer px-1 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] leading-relaxed">
                            <div className="p-2 bg-black/50 border border-red-500/20">
                                <strong className="text-white block mb-0.5">1. Treino Único:</strong>
                                Apenas 60 minutos de FP1 na sexta-feira antes do Shootout eliminatório.
                            </div>
                            <div className="p-2 bg-black/50 border border-red-500/20">
                                <strong className="text-white block mb-0.5">2. Corrida Sprint:</strong>
                                100 km sem pit stop obrigatório no sábado de manhã valendo 8 a 1 pontos mundiais.
                            </div>
                            <div className="p-2 bg-black/50 border border-red-500/20">
                                <strong className="text-white block mb-0.5">3. Parque Fechado Bipolar:</strong>
                                Reabre por 2h após a Sprint para ajustes finos antes do Qualifying do GP.
                            </div>
                        </div>
                    </div>
                )}

                {/* SELETOR DE DIAS DA SEMANA */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 relative z-10">
                    <button
                        onClick={() => setSelectedDay('today')}
                        className={`px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedDay === 'today'
                                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                        ? 'bg-white text-black font-black'
                                        : isToday
                                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50'
                                        : isPast
                                        ? 'bg-white/5 text-white/40 hover:text-white/70'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }`}
                            >
                                <span>{d.dayName.slice(0, 3)}</span>
                                {isPast && !isSelected && <span className="text-[8px] opacity-40">✓</span>}
                                {isToday && !isSelected && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setSelectedDay(selectedDay === 'all' ? 'today' : 'all')}
                        className={`ml-auto px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all rounded cursor-pointer ${
                            selectedDay === 'all'
                                ? 'bg-[#fbaa19] text-black font-black'
                                : 'text-white/50 hover:text-[#fbaa19] underline'
                        }`}
                    >
                        {selectedDay === 'all' ? 'FECHAR VISÃO COMPLETA' : 'VER TODOS OS 7 DIAS'}
                    </button>
                </div>
            </div>

            {/* LISTAGEM DOS DIAS SELECIONADOS */}
            <div className="flex flex-col gap-4">
                {displayedDays.map(day => {
                    const isToday = day.dayId === currentDayId;
                    const isPast = day.dayNumber < (raceWeekDays.find(r => r.dayId === currentDayId)?.dayNumber || 5);

                    return (
                        <div
                            key={day.dayId}
                            className={`w-full bg-black/80 border transition-all rounded-lg p-4 sm:p-6 flex flex-col gap-4 relative overflow-hidden ${
                                isToday 
                                    ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30' 
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            {/* Marca d'água */}
                            <div className="absolute right-4 top-1 text-[50px] sm:text-[70px] font-black text-white/[0.03] select-none pointer-events-none">
                                {String(day.dayNumber).padStart(2, '0')}
                            </div>

                            {/* TOPO DO CARD DO DIA */}
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
                                    <span className={`text-[9px] sm:text-[10px] font-mono tracking-widest font-bold px-2.5 py-1 rounded border inline-block ${
                                        isToday 
                                            ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/50' 
                                            : 'text-white/60 bg-white/5 border-white/10'
                                    }`}>
                                        {day.trackActivity}
                                    </span>
                                </div>
                            </div>

                            {/* LINHA DO TEMPO OPERACIONAL DO DIA */}
                            <div className="flex flex-col gap-2 relative z-10">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-[#fbaa19]" />
                                    ROTINA OPERACIONAL DE PISTA E BOXES
                                </span>
                                <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-2.5`}>
                                    {day.operationalTimeline.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xs flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold text-white/50">{item.time}</span>
                                                <span 
                                                    className="text-[8px] font-black px-1.5 py-0.5 rounded-xs uppercase tracking-wider" 
                                                    style={{ color: item.color, backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
                                                >
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white tracking-wide uppercase">{item.title}</h4>
                                            <p className="text-[11px] text-white/60 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DUPLA CAMADA DE DISPAROS FANTASY & BAEFF1 */}
                            <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-3 pt-1 relative z-10`}>
                                
                                {/* DISPARO 1: CONVERSA ESTRATEGISTA SÊNIOR -> PILOTO */}
                                <div className="p-3.5 bg-gradient-to-br from-blue-950/20 to-black border border-blue-500/30 rounded flex flex-col gap-2">
                                    <div className="flex items-center justify-between border-b border-blue-500/20 pb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Radio className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-[9px] font-black tracking-widest uppercase text-blue-300">
                                                RÁDIO // {day.mentorDialogue.speaker.toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-[8px] text-blue-400/60 uppercase">INSIDER DE TELEMETRIA</span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-white/90 italic leading-relaxed font-sans">
                                        {day.mentorDialogue.message}
                                    </p>
                                    <div className="mt-auto pt-1.5 text-[9px] sm:text-[10px] text-blue-400/70 border-t border-blue-500/10">
                                        <strong>Alvo Tático:</strong> {day.mentorDialogue.tacticalObjective}
                                    </div>
                                </div>

                                {/* DISPARO 2: TRANSMISSÃO DO SISTEMA BAEFF1 */}
                                <div className="p-3.5 bg-gradient-to-br from-amber-950/20 to-black border border-[#fbaa19]/30 rounded flex flex-col gap-2">
                                    <div className="flex items-center justify-between border-b border-[#fbaa19]/20 pb-1.5">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-[#fbaa19]" />
                                            <span className="text-[9px] font-black tracking-widest uppercase text-[#fbaa19]">
                                                BOLETIM NORMATIVO BAEFF1
                                            </span>
                                        </div>
                                        <span className="text-[8px] text-[#fbaa19]/60 font-mono">{day.baeff1Broadcast.code}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                                        {day.baeff1Broadcast.title}
                                    </h4>
                                    <p className="text-[11px] text-white/70 leading-relaxed">
                                        {day.baeff1Broadcast.systemAction}
                                    </p>
                                    <div className="mt-auto pt-1.5 text-[9px] sm:text-[10px] text-[#fbaa19] font-bold border-t border-[#fbaa19]/10 font-mono">
                                        {day.baeff1Broadcast.marketStatus}
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
