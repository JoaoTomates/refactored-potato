"use client";

import React, { useState } from 'react';
import Link from 'next/link';

type TabView = 'all' | 'schedule' | 'sprint' | 'triggers';

interface DaySchedule {
    dayId: string;
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

const RACE_WEEK_DAYS: DaySchedule[] = [
    {
        dayId: 'mon',
        dayName: 'SEGUNDA-FEIRA',
        subTitle: 'Logística Global & Desembarque de Cargas Pesadas',
        trackActivity: 'SEM ATIVIDADE DE PISTA // PADDOCK FECHADO',
        operationalTimeline: [
            {
                time: '06:00 - 12:00',
                title: 'Desembarque das Frotas e Cargas Aéreas (DHL / BAEFF1 Cargo)',
                desc: 'Comboios de carretas na Europa ou cargueiros fretados para etapas flyaway descarregam centenas de toneladas de contêineres e chassis no circuito.',
                badge: 'LOGÍSTICA',
                color: '#60a5fa'
            },
            {
                time: '13:00 - 20:00',
                title: 'Montagem Estrutural das Garagens e Infraestrutura',
                desc: 'Equipes avançadas (riggers) assumem os boxes. Montagem de painéis divisórios, fiação elétrica trifásica, dutos de ar comprimido e redes de fibra ótica de alta densidade.',
                badge: 'INFRAESTRUTURA',
                color: '#a78bfa'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“Bom dia, piloto. Nossas caixas acabaram de tocar o solo do autódromo. Hoje os mecânicos levantam as paredes da nossa garagem. Abra o mapa do circuito no terminal e revise os dados de telemetria da última temporada. A semana de GP começou.”',
            tacticalObjective: 'Alinhar o foco mental do apostador e introduzir as características de downforce e exigência de pneus do traçado.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B101-INIT',
            title: 'HOMOLOGAÇÃO DA ETAPA E ABERTURA OFICIAL DO CIRCUITO',
            systemAction: 'Sincronização de satélites e servidores locais de telemetria. Liberação do Book de Mercados preliminares no terminal.',
            marketStatus: 'BOOK DE MERCADOS: ABERTO EM MODO PRE-RACE'
        }
    },
    {
        dayId: 'tue',
        dayName: 'TERÇA-FEIRA',
        subTitle: 'Construção do Pit Wall & Montagem Mecânica dos Monopostos',
        trackActivity: 'SEM ATIVIDADE DE PISTA // MONTAGEM INTERNA',
        operationalTimeline: [
            {
                time: '08:00 - 14:00',
                title: 'Erguimento do Pit Wall e Centro de Operações',
                desc: 'Instalação das telas de telemetria dos estrategistas na mureta dos boxes e interligação com o Mission Control da fábrica.',
                badge: 'PIT WALL',
                color: '#38bdf8'
            },
            {
                time: '14:00 - 22:00',
                title: 'Encaixe de Power Unit, Câmbio e Suspensões',
                desc: 'Mecânicos desembalam os chassis monocoque e acoplam o motor de combustão, MGU-K, MGU-H, bateria e transmissão.',
                badge: 'MECÂNICA',
                color: '#fb923c'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“O motor está no chassi e a mureta está operacional. A fábrica em Brackley/Maranello já está simulando as janelas de degradação térmica dos compostos. Fique atento às previsões meteorológicas para o fim de semana.”',
            tacticalObjective: 'Estimular o apostador a analisar o clima e condições de vento para os prognósticos de Poletime e Master.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B102-INFRA',
            title: 'VALIDAÇÃO DE FREQUÊNCIAS DE RÁDIO E SENSORES DE BOXES',
            systemAction: 'Checagem de transponders de cronometragem oficial e enlace de telemetria criptografada.',
            marketStatus: 'COTAÇÕES MLS: HOMOLOGADAS EM 000.100 MLS BASE'
        }
    },
    {
        dayId: 'wed',
        dayName: 'QUARTA-FEIRA',
        subTitle: 'Track Walk, Alocação Pirelli & Calibração de Sistemas',
        trackActivity: 'RECONHECIMENTO A PÉ // CALIBRAÇÃO TÉCNICA',
        operationalTimeline: [
            {
                time: '09:00 - 13:00',
                title: 'Track Walk Oficial de Pilotos e Engenheiros',
                desc: 'Pilotos e estrategistas percorrem a pé toda a extensão da pista analisando recapeamento de asfalto, zebras novas, inclinações e pontos de frenagem.',
                badge: 'TRACK WALK',
                color: '#facc15'
            },
            {
                time: '14:00 - 18:00',
                title: 'Alocação Oficial de Pneus Pirelli & Testes de Fogo',
                desc: 'Entrega dos 13 jogos de pneus de pista seca por piloto (Soft, Medium, Hard). Fire-up dos motores nos boxes para checagem de pressão e telemetria.',
                badge: 'PIRELLI ALLOC',
                color: '#f43f5e'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“Acabamos de caminhar pela curva 4. O asfalto está mais abrasivo do que prevíamos e as zebras externas estão agressivas. O desgaste de pneu dianteiro esquerdo será crítico. Ajuste suas expectativas de paradas no pit stop.”',
            tacticalObjective: 'Fornecer dados técnicos de insider que influenciam na montagem do Top 10 e duelos Head-to-Head.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B103-COMPOUNDS',
            title: 'DIVULGAÇÃO DOS COMPOSTOS OFICIAIS (C1 a C5) E LIMITES DE PISTA',
            systemAction: 'Registro oficial das zonas de DRS e limites de sensores de pressão na zebra.',
            marketStatus: 'JANELA DE PREVISÃO POLETIME: ABERTA'
        }
    },
    {
        dayId: 'thu',
        dayName: 'QUINTA-FEIRA',
        subTitle: 'Media Day Oficial, Escrutínio Técnico BAEFF1 & Treinos de Pit Stop',
        trackActivity: 'INSPEÇÃO TÉCNICA BAEFF1 // TREINOS DE PIT STOP',
        operationalTimeline: [
            {
                time: '09:00 - 13:00',
                title: 'Media Day BAEFF1 & Coletivas de Imprensa',
                desc: 'Pilotos atendem à imprensa internacional em grupos divididos na sala de conferências da BAEFF1 e no cercado de TV.',
                badge: 'MEDIA DAY',
                color: '#34d399'
            },
            {
                time: '11:00 - 16:00',
                title: 'Escrutínio Técnico Homologado BAEFF1 (Scrutineering)',
                desc: 'Comissários e delegados técnicos da BAEFF1 inspecionam milimetricamente cada monoposto: peso mínimo (798 kg), dimensões de asas, deflexão e segurança do halo.',
                badge: 'ESCRUTÍNIO BAEFF1',
                color: '#fbaa19'
            },
            {
                time: '16:30 - 18:00',
                title: 'Treinos Intensivos de Troca de Pneus (Pit Crew Drills)',
                desc: 'Equipes treinam simulações de pit stop buscando o tempo de ouro abaixo de 2 segundos.',
                badge: 'PIT CREW',
                color: '#e879f9'
            },
            {
                time: '20:00 - 06:00',
                title: 'Curfew BAEFF1 (Toque de Recolher Noturno Obrigatório)',
                desc: 'Paddock trancado por regulamento. Mecânicos são impedidos de trabalhar nos carros para garantir descanso.',
                badge: 'CURFEW BAEFF1',
                color: '#ef4444'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“Nosso carro passou na balança da BAEFF1 sem pendências. Amanhã teremos os treinos livres. Não durma no ponto: estude o ritmo das equipes de ponta antes de cravar seu palpite de Poletime.”',
            tacticalObjective: 'Pressionar o apostador a registrar seu Poletime antes das janelas críticas de fechamento.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B104-SCRUTINEER',
            title: 'HOMOLOGAÇÃO TÉCNICA DOS 20 MONOPOSTOS CONCLUÍDA',
            systemAction: 'Aviso formal de ativação do Curfew Noturno e contagem regressiva para abertura do pit lane.',
            marketStatus: 'AVISO: JANELAS DE PREVISÃO ENCERRANDO ANTES DO QUALIFY'
        }
    },
    {
        dayId: 'fri',
        dayName: 'SEXTA-FEIRA',
        subTitle: 'Abertura de Pista: Treinos Livres (FP1 / FP2) ou Quali Sprint',
        trackActivity: 'MOTORES NA PISTA // FP1 (60 min) + FP2 (60 min)',
        operationalTimeline: [
            {
                time: '12:30 - 13:30',
                title: 'Treino Livre 1 (FP1 — 60 minutos)',
                desc: 'Avaliação de correlação aerodinâmica com grades aero-rakes e tinta flow-vis. Teste de balanceamento inicial e primeiras referências de voltas.',
                badge: 'FP1 PISTA',
                color: '#22c55e'
            },
            {
                time: '14:00 - 15:00',
                title: 'Coletiva BAEFF1 de Chefes de Equipe e Diretores Técnicos',
                desc: 'Lideranças técnicas respondem à BAEFF1 sobre atualizações mecânicas e estratégias das escuderias.',
                badge: 'BAEFF1 PRESS',
                color: '#06b6d4'
            },
            {
                time: '16:00 - 17:00',
                title: 'Treino Livre 2 (FP2 — 60 minutos — Sessão Crucial)',
                desc: 'Mesmo horário da classificação e corrida. 30 min de voltas de classificação com pneus macios e 30 min de simulações com tanque cheio (long runs).',
                badge: 'FP2 LONG RUNS',
                color: '#10b981'
            },
            {
                time: '18:30 - 20:00',
                title: 'Drivers Briefing BAEFF1 com Direção de Prova',
                desc: 'Reunião obrigatória de todos os 20 pilotos com o Diretor de Prova BAEFF1 para discutir segurança e limites de pista.',
                badge: 'DIREÇÃO PROVA',
                color: '#f59e0b'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“Analisei a telemetria do FP2. O ritmo de corrida da McLaren e da Red Bull nos stints médios foi 3 décimos mais veloz que o resto do pelotão. Ferrari e Mercedes estão rápidas em volta única, mas superaquecem o eixo traseiro. Use isso na sua montagem do Master!”',
            tacticalObjective: 'Entregar o insider de ritmo de corrida real para guiar a seleção de Top 10 e Duelos H2H.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B105-PRACTICE',
            title: 'RELATÓRIO DE TELEMETRIA OFICIAL PÓS-FP2 DISPONÍVEL',
            systemAction: 'Liberação de tempos oficiais de setores, speed trap e mapa de desgaste de pneus no painel de Telemetria.',
            marketStatus: 'ALERTA: JANELA POLETIME FECHA NO INÍCIO DO Q1'
        }
    },
    {
        dayId: 'sat',
        dayName: 'SÁBADO',
        subTitle: 'Treino Livre 3, Classificação Oficial & Regime de Parque Fechado BAEFF1',
        trackActivity: 'FP3 (60 min) + SESSÃO DE CLASSIFICAÇÃO OFICIAL (Q1/Q2/Q3)',
        operationalTimeline: [
            {
                time: '11:30 - 12:30',
                title: 'Treino Livre 3 (FP3 — 60 minutos)',
                desc: 'Última oportunidade de calibrar asas para volta única. Prática de largadas na saída do pit lane.',
                badge: 'FP3 PISTA',
                color: '#3b82f6'
            },
            {
                time: '15:00 - 16:00',
                title: 'Classificação Oficial do Grande Prêmio (Qualifying)',
                desc: 'Q1 (18m - eliminam 5) ➔ Q2 (15m - eliminam 5) ➔ Q3 (12m - disputa brutal da Pole Position).',
                badge: 'QUALIFYING',
                color: '#fbaa19'
            },
            {
                time: '16:01',
                title: 'Entrada Imediata em Parque Fechado BAEFF1 (Parc Fermé)',
                desc: 'Os carros ficam sob custódia dos fiscais da BAEFF1. Proibida qualquer alteração de suspensão, molas ou pacotes aerodinâmicos.',
                badge: 'PARC FERMÉ BAEFF1',
                color: '#ef4444'
            },
            {
                time: '16:30 - 17:30',
                title: 'Coletiva BAEFF1 dos 3 Primeiros e Escrutínio Pós-Quali',
                desc: 'Pesagem, checagem de combustível e vistorias de deflexão de asas pela equipe técnica BAEFF1.',
                badge: 'VISTORIA BAEFF1',
                color: '#8b5cf6'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“O grid de largada está cravado e os carros estão trancados no Parque Fechado BAEFF1. O pole surpreendeu com uma volta perfeita no Q3. Se você acertou o tempo de pole no Poletime, seus pontos já estão computados. Agora foco total no Master de amanhã!”',
            tacticalObjective: 'Conectar o resultado da classificação real com a pontuação do Poletime e direcionar para as previsões de corrida.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B106-GRID',
            title: 'HOMOLOGAÇÃO OFICIAL DO GRID DE LARGADA E RESULTADOS POLETIME',
            systemAction: 'Distribuição dos pontos do Poletime e travamento definitivo do mercado de Pole. Abertura das apostas de Volta Mais Rápida e Duelos.',
            marketStatus: 'MERCADO POLETIME: ENCERRADO E HOMOLOGADO'
        }
    },
    {
        dayId: 'sun',
        dayName: 'DOMINGO',
        subTitle: 'Dia do Grande Prêmio, Pódio, Vistorias Finais & O Grande Pack-Down',
        trackActivity: 'CORRIDA OFICIAL DE ~305 KM // BANDEIRA QUADRICULADA',
        operationalTimeline: [
            {
                time: '10:00 - 11:30',
                title: 'Reunião Estratégica Definitiva de Equipe',
                desc: 'Definição dos planos de corrida: Plano A (1 parada), Plano B (2 paradas), janelas de Virtual Safety Car e gerenciamento de tráfego.',
                badge: 'ESTRATÉGIA',
                color: '#6366f1'
            },
            {
                time: '12:50 - 13:20',
                title: 'Drivers Parade BAEFF1 (Desfile dos Pilotos)',
                desc: 'Pilotos percorrem o circuito em caminhão aberto ou clássicos para saudar a torcida.',
                badge: 'DESFILE',
                color: '#14b8a6'
            },
            {
                time: '14:20 - 14:45',
                title: 'Abertura do Pit Lane e Formação do Grid',
                desc: 'Voltas de reconhecimento, instalação no grid de largada, hino nacional oficial e cerimonial de honra.',
                badge: 'GRID BUILDUP',
                color: '#f59e0b'
            },
            {
                time: '15:00',
                title: 'LARGADA: O GRANDE PRÊMIO DE FÓRMULA 1 (305 KM)',
                desc: 'Volta de apresentação, apagamento das 5 luzes vermelhas e disputa por 25 pontos mundiais.',
                badge: 'LIGHTS OUT',
                color: '#22c55e'
            },
            {
                time: '16:45 - 17:30',
                title: 'Pódio, Cerimônia do Espumante & Media Pen Global',
                desc: 'Entrega de troféus aos 3 primeiros e ao construtor vencedor. Entrevistas de todos os 20 pilotos.',
                badge: 'PÓDIO',
                color: '#fbaa19'
            },
            {
                time: '17:30 - 20:00',
                title: 'Escrutínio Técnico Pós-Corrida BAEFF1 (Vistoria Profunda)',
                desc: 'Pesagem oficial, teste de densidade de combustível, medição de desgaste do skid block (madeira do assoalho). Desclassificações se houver irregularidade.',
                badge: 'INSPEÇÃO BAEFF1',
                color: '#ef4444'
            },
            {
                time: '18:00 - 02:00+',
                title: 'O Grande Pack-Down (Desmontagem Noturna dos Boxes)',
                desc: 'Imediatamente após a bandeirada, mecânicos e equipes de carga desmontam todo o pit wall e encaixotam os carros rumo à próxima etapa.',
                badge: 'PACK-DOWN',
                color: '#64748b'
            }
        ],
        mentorDialogue: {
            speaker: 'Estrategista Sênior',
            role: 'Mentor de Telemetria e Aliança',
            message: '“Bandeira quadriculada! A estratégia de 1 parada pagou dividendos, mas a quebra nas voltas finais virou o campeonato de cabeça para baixo. Confira o extrato de Milesimus (MLS) no seu terminal: os lucros das previsões homologadas já caíram na sua conta.”',
            tacticalObjective: 'Fazer o debriefing de encerramento da rodada, celebrar os acertos e computar os pontos de Teamwork e Milesimus.'
        },
        baeff1Broadcast: {
            code: 'BAEFF1-SYS // B107-RESULTS',
            title: 'HOMOLOGAÇÃO DOS RESULTADOS OFICIAIS E LIQUIDAÇÃO DE MERCADOS',
            systemAction: 'Auditoria de pontuações de Master, Poletime, Duplas Teamwork e crédito de dividendos MLS. Atualização do Ranking Geral.',
            marketStatus: 'MERCADOS LIQUIDADOS // RESULTADOS HOMOLOGADOS BAEFF1'
        }
    }
];

export default function RaceWeekSchedulePage() {
    const [activeTab, setActiveTab] = useState<TabView>('all');
    const [selectedDay, setSelectedDay] = useState<string>('all');

    const filteredDays = selectedDay === 'all' 
        ? RACE_WEEK_DAYS 
        : RACE_WEEK_DAYS.filter(d => d.dayId === selectedDay);

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden pb-24">
            {/* Background Texture & Ambient Lights */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#fbaa19]/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[140px]" />
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 flex flex-col gap-8">
                
                {/* HEADER DA PÁGINA */}
                <div className="flex flex-col gap-4 border-b border-white/10 pb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#fbaa19] animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#fbaa19]">
                                PROTOCOLO OFICIAL BAEFF1 // RACE WEEK ARCHITECTURE
                            </span>
                        </div>
                        <Link 
                            href="/"
                            className="text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-white/20 hover:border-[#fbaa19] hover:text-[#fbaa19] px-4 py-2 transition-all"
                        >
                            « VOLTAR AO PITWALL
                        </Link>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-white">
                        CRONOGRAMA DE RACE WEEK
                    </h1>
                    <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-3xl">
                        A anatomia completa de 7 dias de uma semana de Grande Prêmio: da chegada dos cargueiros na segunda-feira até a desmontagem noturna pós-corrida. Este protocolo padroniza os **disparos operacionais diários** entre o <strong className="text-white">Estrategista Sênior</strong> e o apostador, somados aos <strong className="text-[#fbaa19]">boletins regulamentares da BAEFF1</strong>.
                    </p>

                    {/* BARRA DE NAVEGAÇÃO / FILTROS */}
                    <div className="flex flex-wrap gap-2 pt-4">
                        <button
                            onClick={() => { setActiveTab('all'); setSelectedDay('all'); }}
                            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${activeTab === 'all' && selectedDay === 'all' ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'bg-black/60 text-white/60 border-white/15 hover:border-white'}`}
                        >
                            VISÃO GERAL COMPLETA (7 DIAS)
                        </button>
                        <button
                            onClick={() => setActiveTab('sprint')}
                            className={`px-3.5 py-2 text-xs font-black uppercase tracking-widest border transition-all ${activeTab === 'sprint' ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-red-950/30 text-red-400 border-red-500/40 hover:bg-red-900/40'}`}
                        >
                            ⚡ PROTOCOLO ESPECÍFICO DE CORRIDAS SPRINT
                        </button>
                    </div>

                    {/* SELETOR DE DIAS RÁPIDO */}
                    {activeTab !== 'sprint' && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest flex items-center pr-2">DIAS:</span>
                            {RACE_WEEK_DAYS.map(d => (
                                <button
                                    key={d.dayId}
                                    onClick={() => setSelectedDay(d.dayId)}
                                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xs ${selectedDay === d.dayId ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {d.dayName.slice(0, 3)}
                                </button>
                            ))}
                            {selectedDay !== 'all' && (
                                <button
                                    onClick={() => setSelectedDay('all')}
                                    className="px-2.5 py-1 text-[10px] text-[#fbaa19] underline uppercase tracking-widest ml-1"
                                >
                                    VER TODOS
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* SESSÃO CONTUNDENTE: O FATOR SPRINT (DESTAQUE MÁXIMO) */}
                {(activeTab === 'sprint' || activeTab === 'all') && (
                    <section className="bg-gradient-to-b from-red-950/40 via-black to-black border-2 border-red-500/60 p-6 sm:p-8 rounded-sm shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col gap-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/30 pb-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-widest">
                                    REGULAMENTO DE IMPACTO MÁXIMO
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white">
                                    O FATOR SPRINT: A COMPRESSÃO BRUTAL DO FIM DE SEMANA
                                </h2>
                            </div>
                            <span className="text-xs text-red-400 font-mono tracking-widest font-bold">
                                // 100 KM DE ADRENALINA SEM PIT STOP
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/80 leading-relaxed">
                            <div className="p-4 bg-black/60 border border-red-500/30 flex flex-col gap-2">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-[11px]">
                                    1. A PENALIDADE DE APENAS 60 MINUTOS
                                </span>
                                <p>
                                    Em um fim de semana convencional, as equipes têm <strong>180 minutos (FP1, FP2, FP3)</strong> para acertar o carro. No fim de semana Sprint, há <strong>APENAS 60 MINUTOS de treino livre (FP1)</strong> na sexta de manhã.
                                </p>
                                <p className="text-white/50 text-[10px] mt-1">
                                    Qualquer erro de altura de rodagem, rigidez de barra ou mapa aerodinâmico no FP1 condena a equipe para a Classificação Sprint logo em seguida.
                                </p>
                            </div>

                            <div className="p-4 bg-black/60 border border-red-500/30 flex flex-col gap-2">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-[11px]">
                                    2. SPRINT QUALIFYING (SHOOTOUT)
                                </span>
                                <p>
                                    Sessão eliminatória ultrarrápida na sexta-feira à tarde:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-white/70 text-[11px]">
                                    <li><strong>SQ1 (12 min):</strong> Obrigatório uso de pneus Médios novos.</li>
                                    <li><strong>SQ2 (10 min):</strong> Obrigatório uso de pneus Médios novos.</li>
                                    <li><strong>SQ3 (8 min):</strong> Pneus Macios novos. Tempo para apenas 1 volta rápida cravada!</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-black/60 border border-red-500/30 flex flex-col gap-2">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-[11px]">
                                    3. PARQUE FECHADO MODULAR BAEFF1
                                </span>
                                <p>
                                    A BAEFF1 aplica o <strong>Regime de Parque Fechado Bipolar</strong>:
                                </p>
                                <p>
                                    Os carros ficam trancados do início da Sprint Qualifying até o fim da corrida Sprint de sábado. Após a Sprint, <strong>o Parque Fechado é reaberto por 2 a 3 horas</strong> para que os engenheiros possam consertar danos e mudar o acerto antes do Qualifying principal para o GP de domingo!
                                </p>
                            </div>
                        </div>

                        {/* DETALHAMENTO DA CORRIDA SPRINT */}
                        <div className="p-4 sm:p-5 bg-red-950/20 border border-red-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-black text-white uppercase tracking-wider">
                                    A CORRIDA SPRINT (SÁBADO DE MANHÃ // 100 KM DE PURA VELOCIDADE)
                                </span>
                                <p className="text-xs text-white/70 max-w-2xl">
                                    Largada parada, sem necessidade de pit stop obrigatório, aproximadamente 30 minutos de corrida flat-out. Pontuação imediata para os 8 primeiros colocados: <strong>8, 7, 6, 5, 4, 3, 2, 1 ponto</strong>.
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-2xl font-black text-red-400 font-mono">8 A 1 PTS</span>
                                <span className="block text-[10px] text-white/50 uppercase tracking-widest">PONTOS DIRETOS NO CAMPEONATO</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* CRONOGRAMA DIA A DIA DETALHADO */}
                <div className="flex flex-col gap-8">
                    {filteredDays.map((day, idx) => (
                        <div 
                            key={day.dayId}
                            className="bg-black/80 border border-white/10 hover:border-white/20 transition-all p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden group"
                        >
                            {/* Marca d'água do dia */}
                            <div className="absolute right-4 top-2 text-[60px] sm:text-[90px] font-black text-white/[0.03] select-none pointer-events-none font-mono">
                                {String(idx + 1).padStart(2, '0')}
                            </div>

                            {/* Topo do Card do Dia */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 bg-[#fbaa19] text-black font-black text-[10px] tracking-widest uppercase">
                                            DIA {idx + 1}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white">
                                            {day.dayName}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-white/60 tracking-wider mt-1 uppercase">
                                        {day.subTitle}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1">
                                        {day.trackActivity}
                                    </span>
                                </div>
                            </div>

                            {/* LINHA DO TEMPO OPERACIONAL DO GP */}
                            <div className="flex flex-col gap-3 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
                                    <span>⏱️</span> ROTINA OPERACIONAL DO PADDOCK & PISTA
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {day.operationalTimeline.map((item, i) => (
                                        <div key={i} className="p-3.5 bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold text-white/40">{item.time}</span>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase tracking-wider" style={{ color: item.color, backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white tracking-wide uppercase">{item.title}</h4>
                                            <p className="text-[11px] text-white/60 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DUPLA CAMADA DE DISPAROS DO FANTASY BAEFF1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 relative z-10">
                                
                                {/* DISPARO 1: CONVERSA ESTRATEGISTA SÊNIOR -> PILOTO */}
                                <div className="p-4 bg-gradient-to-br from-blue-950/20 to-black border border-blue-500/30 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-blue-300">
                                                DISPARO FANTASY // {day.mentorDialogue.speaker.toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-blue-400/60 uppercase">RÁDIO CODIFICADO</span>
                                    </div>
                                    <p className="text-xs text-white/90 italic leading-relaxed font-sans">
                                        {day.mentorDialogue.message}
                                    </p>
                                    <div className="mt-auto pt-2 text-[10px] text-blue-400/70 border-t border-blue-500/10">
                                        <strong>Alvo Tático:</strong> {day.mentorDialogue.tacticalObjective}
                                    </div>
                                </div>

                                {/* DISPARO 2: TRANSMISSÃO DO SISTEMA BAEFF1 */}
                                <div className="p-4 bg-gradient-to-br from-amber-950/20 to-black border border-[#fbaa19]/30 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between border-b border-[#fbaa19]/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#fbaa19]" />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-[#fbaa19]">
                                                SISTEMA BAEFF1 // BOLETIM NORMATIVO
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-[#fbaa19]/60 font-mono">{day.baeff1Broadcast.code}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                                        {day.baeff1Broadcast.title}
                                    </h4>
                                    <p className="text-[11px] text-white/70 leading-relaxed">
                                        {day.baeff1Broadcast.systemAction}
                                    </p>
                                    <div className="mt-auto pt-2 text-[10px] text-[#fbaa19] font-bold border-t border-[#fbaa19]/10 font-mono">
                                        {day.baeff1Broadcast.marketStatus}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                {/* FOOTER DA PÁGINA */}
                <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
                    <span>BAEFF1 RACE CONTROL // MOTORSPORT OPERATIONAL TIMETABLE</span>
                    <span className="text-white/60">AUTOMAÇÃO DE DISPAROS DE PRE-SEASON & GRAND PRIX</span>
                </div>

            </div>
        </main>
    );
}
