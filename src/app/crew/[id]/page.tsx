"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    findCrewCharacter, 
    fetchCrewRolesConfig, 
    CrewRolesConfig, 
    DEFAULT_CREW_ROLES_CONFIG,
    CrewCharacterBase
} from '@/lib/crew-config';
import { ArrowLeft, CheckCircle2, Shield, Terminal, FileText, Building2, History, Award } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface TeamHistoryItem {
    teamName: string;
    teamColor: string;
    period: string;
    role: string;
    chassisOrSpec: string;
    highlight: string;
    status: 'ATUAL' | 'ANTERIOR';
}

function getCharacterTeamHistory(character: CrewCharacterBase): { currentTeam: TeamHistoryItem; previousTeams: TeamHistoryItem[] } {
    let currentTeam: TeamHistoryItem;
    if (character.subType === 'alliance_chief') {
        const isA = character.subtitle.includes('BLOCO A') || character.accentColor === '#00d2be';
        const isB = character.subtitle.includes('BLOCO B') || character.accentColor === '#e8002d';
        currentTeam = {
            teamName: isA ? 'Consórcio da Estrela (Mercedes-AMG & McLaren)' : isB ? 'Dinastia de Maranello (Scuderia Ferrari & Haas)' : 'A Vanguarda (Red Bull Powertrains & Aston Martin)',
            teamColor: character.accentColor,
            period: '2026 - PRESENTE',
            role: character.role,
            chassisOrSpec: isA ? 'Mercedes M16 E Performance V6 Turbo' : isB ? 'Ferrari 067/3 Hybrid E-Turbo Speciale' : 'Red Bull Ford Powertrains / Audi F1 PU',
            highlight: 'Liderança técnica de fornecimento, mapeamento de potência e homologação de motores para as garagens da aliança.',
            status: 'ATUAL',
        };
    } else if (character.subType === 'team_principal') {
        currentTeam = {
            teamName: character.fullName.includes('Horner') ? 'Oracle Red Bull Racing' : character.fullName.includes('Vasseur') ? 'Scuderia Ferrari HP' : character.fullName.includes('Wolff') ? 'Mercedes-AMG PETRONAS F1 Team' : 'Escuderia Oficial BAEF 2026',
            teamColor: character.accentColor,
            period: '2026 - PRESENTE',
            role: character.role,
            chassisOrSpec: 'Monocoque de Competição Homologado BAEFF1',
            highlight: 'Comando supremo de operações desportivas, contratação de pilotos e ordens de rádio de mureta.',
            status: 'ATUAL',
        };
    } else {
        currentTeam = {
            teamName: 'VoltGrid Paddock Operations // PitWall Mentorship',
            teamColor: '#fbaa19',
            period: '2026 - PRESENTE',
            role: character.role,
            chassisOrSpec: 'Central de Telemetria & Simulação BAEFF1 (Tempo Real)',
            highlight: 'Designado para mentoria tática de estrategistas novatos e homologação de previsões de corrida.',
            status: 'ATUAL',
        };
    }

    let previousTeams: TeamHistoryItem[] = [];
    const code = character.code.toUpperCase();
    if (code.includes('LEWISEVANS') || character.id === 'strat-19') {
        previousTeams = [
            {
                teamName: 'Vanwall Formula 1 Team',
                teamColor: '#00594f',
                period: '1957 - 1958',
                role: 'Piloto Oficial & Especialista em Qualificação',
                chassisOrSpec: 'Vanwall VW5 / Motor 2.5L L4',
                highlight: '2 Pole Positions, 2 Pódios e 16 pontos. Conquistou com a equipe o histórico 1º Campeonato Mundial de Construtores de Fórmula 1 em 1958 ao lado de Stirling Moss.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Connaught Engineering',
                teamColor: '#1b3b22',
                period: '1956 - 1957',
                role: 'Piloto Titular de Desenvolvimento',
                chassisOrSpec: 'Connaught Tipo B / Alta Compressão',
                highlight: 'Pontuou no GP de Goodwood e liderou a evolução de suspensão independente e aerodinâmica de ponta.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'British Racing Partnership',
                teamColor: '#0b1d3a',
                period: '1954 - 1955',
                role: 'Piloto de Monopostos 500cc',
                chassisOrSpec: 'Cooper-Norton 500cc',
                highlight: 'Múltiplas vitórias em Brands Hatch e Silverstone na categoria base que pavimentou sua superlicença BAEF.',
                status: 'ANTERIOR',
            },
        ];
    } else if (code.includes('SALO') || character.id === 'strat-29') {
        previousTeams = [
            {
                teamName: 'Scuderia Ferrari',
                teamColor: '#e8002d',
                period: '1999',
                role: 'Piloto Oficial Substituto',
                chassisOrSpec: 'Ferrari F399 / V10 3.0L',
                highlight: '2 Pódios históricos. Liderou o GP da Alemanha em Hockenheim e entregou a vitória ao companheiro de equipe por ordem tática pelo mundial.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Tyrrell Racing Organisation',
                teamColor: '#00205b',
                period: '1995 - 1997',
                role: 'Piloto Titular & Homologação de Pneus',
                chassisOrSpec: 'Tyrrell 023 / Yamaha V10',
                highlight: '5º lugar lendário no GP de Mônaco de 1997 em pista molhada sem efetuar nenhuma troca de pneus durante as 2 horas de prova.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Sauber Petronas & Toyota F1',
                teamColor: '#009088',
                period: '2000 - 2002',
                role: 'Piloto Titular & Chefe de Testes de Fábrica',
                chassisOrSpec: 'Sauber C19 & Toyota TF102',
                highlight: 'Marcou os primeiros pontos da Toyota na história da Fórmula 1 logo na sua corrida de estreia no GP da Austrália em Melbourne.',
                status: 'ANTERIOR',
            },
        ];
    } else if (code.includes('CHADWICK') || character.id === 'chief-chadwick') {
        previousTeams = [
            {
                teamName: 'McLaren Racing (Woking)',
                teamColor: '#ff8000',
                period: '2015 - 2023',
                role: 'Engenheiro Sênior de Mapeamento de Potência',
                chassisOrSpec: 'McLaren MCL35M / Mercedes E Performance',
                highlight: 'Responsável pela curva de aceleração de stint longo e eficiência de recuperação de energia no MGU-K.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Brawn GP & Mercedes GP',
                teamColor: '#00d2be',
                period: '2009 - 2014',
                role: 'Analista de Bancada Térmica',
                chassisOrSpec: 'BGP 001 & W05 Hybrid',
                highlight: 'Participou do desenvolvimento do lendário motor híbrido turbo V6 que dominou o início da era moderna.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Williams Grand Prix Engineering',
                teamColor: '#005aff',
                period: '2002 - 2008',
                role: 'Engenheiro de Calibração de Dinamômetro',
                chassisOrSpec: 'Williams FW25 / BMW P83 V10 (19.200 RPM)',
                highlight: 'Calibração dos regimes mais altos de rotação na história da Fórmula 1.',
                status: 'ANTERIOR',
            },
        ];
    } else {
        previousTeams = [
            {
                teamName: 'Team Lotus & Classic Garages',
                teamColor: '#e0af00',
                period: '1976 - 1982',
                role: 'Consultor de Efeito Solo & Monocoque',
                chassisOrSpec: 'Lotus 78 / Ford Cosworth DFV',
                highlight: 'Otimização de vácuo aerodinâmico sob saias laterais e telemetria mecânica de suspensão.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Brabham Racing Organisation',
                teamColor: '#003366',
                period: '1983 - 1987',
                role: 'Especialista em Pressão de Sobrealimentação',
                chassisOrSpec: 'Brabham BT52 / BMW M12/13 Turbo (1.400 HP)',
                highlight: 'Gerenciamento de pressões de até 5.5 bar na qualificação da era mais potente do automobilismo.',
                status: 'ANTERIOR',
            },
            {
                teamName: 'Benetton Formula & Base Motorsport',
                teamColor: '#00a3e0',
                period: '1988 - 1993',
                role: 'Analista de Estratégia de PitStop & Reabastecimento',
                chassisOrSpec: 'Benetton B190 / Ford HBA4',
                highlight: 'Pioneirismo em táticas de paradas rápidas e conservação de ritmo em trechos de tanque cheio.',
                status: 'ANTERIOR',
            },
        ];
    }

    return { currentTeam, previousTeams };
}

export default function CharacterEmployeeSheetPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const rawId = decodeURIComponent(resolvedParams.id || '');

    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);
    const [imgFailed, setImgFailed] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

    useEffect(() => {
        fetchCrewRolesConfig().then(cfg => setCrewConfig(cfg));
    }, []);

    const character = useMemo(() => {
        return findCrewCharacter(rawId, crewConfig);
    }, [rawId, crewConfig]);

    const photoUrl = imgFailed 
        ? (character?.fallbackUrl || '/avatar/others/alianca_1_a.jpg') 
        : (character?.avatarUrl || character?.fallbackUrl || '/avatar/others/alianca_1_a.jpg');

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/invite?step=alliances');
        }
    };

    if (!character) {
        return (
            <main className="min-h-screen w-full bg-[#0d0d11] text-white flex flex-col items-center justify-center font-mono p-6">
                <div className="max-w-md w-full p-6 border border-red-500/40 bg-red-950/20 rounded-[3px] flex flex-col gap-4 text-center">
                    <span className="text-red-400 font-black tracking-widest text-sm uppercase">
                        [ ARQUIVO NÃO LOCALIZADO ]
                    </span>
                    <p className="text-xs text-white/70">
                        O dossiê de colaborador com registro <strong className="text-white">"{rawId}"</strong> não foi encontrado no arquivo morto do paddock.
                    </p>
                    <button
                        onClick={handleBack}
                        className="mt-2 py-2.5 px-4 bg-[#fbaa19] text-black font-black uppercase tracking-wider text-xs rounded hover:bg-white transition-colors"
                    >
                        « Voltar
                    </button>
                </div>
            </main>
        );
    }

    const nationality = character.extraCharacteristics.find(x => x.label.includes('NACIONALIDADE'))?.value || 'Internacional';
    const careerStats = character.extraCharacteristics.find(x => x.label.includes('HISTÓRICO'))?.value || '';
    const assertiveness = character.extraCharacteristics.find(x => x.label.includes('ASSERTIVIDADE'))?.value || '';
    const age = character.extraCharacteristics.find(x => x.label.includes('IDADE'))?.value || '';

    const { currentTeam, previousTeams } = getCharacterTeamHistory(character);

    const signatureName = useMemo(() => {
        if (!character?.fullName) return 'Titular Homologado';
        // Extrai o nome de assinatura autêntico e legível sem parênteses/anos (ex: "B. Martini (Pierluigi Martini (1984–1995))" -> "Pierluigi Martini")
        const innerMatch = character.fullName.match(/\(([^()0-9–-]+)/);
        if (innerMatch && innerMatch[1]?.trim()) {
            return innerMatch[1].trim();
        }
        return character.fullName.split('(')[0]?.trim() || character.fullName;
    }, [character?.fullName]);

    return (
        <main className="min-h-screen w-full relative bg-[#0b0c10] font-mono select-none overflow-x-hidden flex flex-col items-center justify-start py-6 sm:py-10 px-3 sm:px-6">

            {/* ========================================================= */}
            {/* BACKGROUND: MESA EM PERSPECTIVA VISTA DE CIMA             */}
            {/* Janela ao topo, armários à esquerda, terminal à direita   */}
            {/* ========================================================= */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0c0d12]">
                
                {/* 1. Tampo da Mesa de Madeira Nobre / Carbono com Iluminação Direcional Superior */}
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 50% 38%, #1f1b18 0%, #141211 48%, #0a0909 95%)',
                        boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.95)'
                    }}
                />

                {/* 2. Textura sutil do tampo da mesa */}
                <div 
                    className="absolute inset-0 opacity-20 mix-blend-overlay"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* 3. JANELA AO TOPO: Vista panorâmica do circuito noturno */}
                <div className="absolute top-0 inset-x-0 h-28 sm:h-36 border-b-4 border-[#08080a] bg-gradient-to-b from-[#030712] via-[#09152b] to-[#040915] flex flex-col justify-between overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.9)]">
                    <div className="absolute inset-0 flex justify-around pointer-events-none">
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                    </div>

                    <div className="w-full h-full relative opacity-60">
                        <div className="absolute top-2 left-1/4 w-32 h-16 bg-amber-400/20 blur-2xl rounded-full" />
                        <div className="absolute top-1 right-1/3 w-40 h-20 bg-blue-500/20 blur-2xl rounded-full" />
                        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#02040a] to-transparent flex items-end px-6 pb-1">
                            <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">
                                // VOLTGRID INTERNATIONAL CIRCUIT — PADDOCK OFFICE PERSPECTIVE
                            </span>
                        </div>
                    </div>

                    <div className="w-full h-3 bg-gradient-to-r from-[#171513] via-[#2a2420] to-[#171513] border-t border-white/10" />
                </div>

                {/* 4. ARMÁRIOS DE ARQUIVO À ESQUERDA (Gaveteiros de Metal Industrial) */}
                <div className="hidden lg:flex absolute left-0 top-36 bottom-0 w-36 flex-col justify-around p-3 border-r-2 border-[#000000] bg-gradient-to-r from-[#0c0d11] to-[#16181f] shadow-[12px_0_28px_rgba(0,0,0,0.8)]">
                    {[1, 2, 3, 4, 5].map((drawerIdx) => (
                        <div 
                            key={drawerIdx}
                            className="w-full h-20 rounded-[2px] border border-black bg-[#101218] p-2 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_8px_rgba(0,0,0,0.6)]"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="text-[8px] text-white/30 uppercase tracking-widest">GAV #{drawerIdx}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                            </div>
                            <div className="w-full py-1 px-1.5 rounded-[1px] bg-[#07080a] border border-white/10 text-center">
                                <span className="text-[7.5px] font-mono uppercase tracking-wider text-[#fbaa19]/80 font-bold block truncate">
                                    {drawerIdx === 1 ? 'ESTRATEGISTAS' : drawerIdx === 2 ? 'ENGENHARIA' : drawerIdx === 3 ? 'CHEFES 2026' : drawerIdx === 4 ? 'TELEMETRIA' : 'CONTRATOS'}
                                </span>
                            </div>
                            <div className="w-12 h-1 bg-white/15 mx-auto rounded-full" />
                        </div>
                    ))}
                </div>

                {/* 5. TERMINAL DE COMPUTADOR À DIREITA (CRT Monitor / Telemetria) */}
                <div className="hidden lg:flex absolute right-0 top-36 bottom-0 w-44 flex-col justify-start p-3 border-l-2 border-[#000000] bg-gradient-to-l from-[#0b0c10] to-[#14161d] shadow-[-12px_0_28px_rgba(0,0,0,0.8)] gap-3">
                    <div className="w-full rounded-[3px] border-2 border-[#1f232d] bg-[#030508] p-2.5 flex flex-col gap-2 shadow-[inset_0_0_20px_rgba(0,255,180,0.08),0_6px_16px_rgba(0,0,0,0.9)]">
                        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1 text-[8px] text-emerald-400 font-mono">
                            <span className="flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                CRT-04
                            </span>
                            <span>UTC 19:42</span>
                        </div>
                        <div className="space-y-1 text-[7.5px] font-mono text-emerald-400/90 leading-tight">
                            <p>&gt; LINK_PADDOCK: OK</p>
                            <p>&gt; SYS_HR: ACTIVE</p>
                            <p>&gt; DOSSIER_ID: {character.id}</p>
                            <p className="text-amber-400">&gt; STATUS: HOMOLOGADO</p>
                        </div>
                        <div className="w-full h-12 bg-black/70 border border-emerald-500/20 rounded-[2px] p-1 flex items-end gap-1">
                            <div className="w-1/6 h-[40%] bg-emerald-500/30" />
                            <div className="w-1/6 h-[70%] bg-emerald-500/50" />
                            <div className="w-1/6 h-[55%] bg-emerald-500/40" />
                            <div className="w-1/6 h-[85%] bg-emerald-500/70" />
                            <div className="w-1/6 h-[60%] bg-emerald-500/50" />
                            <div className="w-1/6 h-[95%] bg-emerald-400" />
                        </div>
                    </div>

                    <div className="w-full p-2.5 rounded-[2px] bg-[#f5d76e]/95 text-black text-[8px] font-mono font-bold shadow-[2px_3px_8px_rgba(0,0,0,0.5)] rotate-1">
                        <span className="block border-b border-black/20 pb-0.5 uppercase tracking-wider text-[7px] text-black/60">
                            MEMO // DIRETORIA
                        </span>
                        <p className="mt-1 leading-snug">
                            "Validar pontuação de assertividade antes do próximo GP."
                        </p>
                    </div>

                    <div className="w-full py-4 flex items-center justify-center">
                        <div className="w-2.5 h-28 rounded-full bg-gradient-to-r from-gray-400 via-gray-100 to-gray-500 shadow-[3px_4px_8px_rgba(0,0,0,0.7)] rotate-6" />
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* CONTEÚDO PRINCIPAL: FICHÁRIO FÍSICO COM FOLHAS 3D         */}
            {/* ========================================================= */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-2 mt-8 sm:mt-12 animate-fade-in">
                
                {/* Barra de Ações Superior & Abas de Fichário Integradas ao Topo da Pasta */}
                <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
                    {/* Botão Retornar */}
                    <div className="flex items-center pb-1">
                        <button
                            onClick={handleBack}
                            type="button"
                            className="inline-flex items-center gap-2 py-2 px-3.5 rounded-[3px] bg-black/80 hover:bg-[#fbaa19] text-white hover:text-black border border-white/20 hover:border-[#fbaa19] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] cursor-pointer group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span>[ « Voltar ao PitWall ]</span>
                        </button>
                    </div>

                    {/* ABAS FÍSICAS DO FICHÁRIO / FOLDER TABS */}
                    <div className="flex items-end gap-1 overflow-x-auto pt-2">
                        {/* Aba 1: Ficha Individual */}
                        <button
                            onClick={() => setActiveTab('profile')}
                            type="button"
                            aria-selected={activeTab === 'profile'}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-md font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                                activeTab === 'profile'
                                    ? 'bg-[#fbfbf9] text-black border-t-4 border-t-[#fbaa19] border-l-2 border-r-2 border-black/30 shadow-[0_-4px_12px_rgba(0,0,0,0.4)] z-30 translate-y-[2px]'
                                    : 'bg-[#181f2a] text-white/60 hover:text-white border-t border-l border-r border-white/15 hover:bg-[#222c3b] z-10 translate-y-[6px] hover:translate-y-[4px]'
                            }`}
                        >
                            <FileText className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-black' : 'text-[#fbaa19]'}`} />
                            <span>Ficha Individual</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/10 text-black/70 font-mono">P1</span>
                        </button>

                        {/* Aba 2: Dossiê de Equipes */}
                        <button
                            onClick={() => setActiveTab('history')}
                            type="button"
                            aria-selected={activeTab === 'history'}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-md font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                                activeTab === 'history'
                                    ? 'bg-[#fbfbf9] text-black border-t-4 border-t-blue-600 border-l-2 border-r-2 border-black/30 shadow-[0_-4px_12px_rgba(0,0,0,0.4)] z-30 translate-y-[2px]'
                                    : 'bg-[#181f2a] text-white/60 hover:text-white border-t border-l border-r border-white/15 hover:bg-[#222c3b] z-10 translate-y-[6px] hover:translate-y-[4px]'
                            }`}
                        >
                            <History className={`w-3.5 h-3.5 ${activeTab === 'history' ? 'text-blue-700' : 'text-blue-400'}`} />
                            <span>Dossiê de Equipes</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/10 text-black/70 font-mono">P2</span>
                        </button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* PILHA FÍSICA DE FOLHAS DO FICHÁRIO (1º E 2º PLANO 3D)     */}
                {/* ========================================================= */}
                <div className="relative w-full">

                    {/* FOLHA 1: FICHA INDIVIDUAL DE FUNCIONÁRIO */}
                    <article 
                        onClick={() => {
                            if (activeTab !== 'profile') setActiveTab('profile');
                        }}
                        className={`w-full bg-[#fbfbf9] text-[#171717] rounded-[2px] p-6 sm:p-9 md:p-10 font-mono flex flex-col gap-6 transition-all duration-500 ease-out ${
                            activeTab === 'profile'
                                ? 'relative z-20 scale-100 translate-y-0 translate-x-0 opacity-100 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.15)] pointer-events-auto'
                                : 'absolute top-0 left-0 z-10 scale-[0.985] translate-y-3.5 -translate-x-2 opacity-75 shadow-[0_15px_35px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer filter brightness-90 hover:opacity-90 hover:brightness-95'
                        }`}
                        style={{
                            backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                            backgroundSize: '16px 16px'
                        }}
                        title={activeTab !== 'profile' ? 'Clique para trazer a Ficha Individual para o primeiro plano' : undefined}
                    >
                        {/* Clipe Metálico Superior Esquerdo */}
                        <div className="absolute -top-3 left-8 w-5 h-9 rounded-t-full border-2 border-gray-400 bg-gradient-to-r from-gray-300 to-gray-200 shadow-[2px_3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />

                        {/* Carimbo Físico Inclinado (Tinta Vermelha) */}
                        <div 
                            className="absolute top-6 right-6 sm:top-8 sm:right-8 border-2 border-red-700/80 text-red-700/85 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-[2px] rotate-[-7deg] shadow-[0_1px_3px_rgba(0,0,0,0.15)] select-none pointer-events-none"
                        >
                            HOMOLOGADO // BAEF 2026
                        </div>

                        {/* 1. CABEÇALHO DO DOCUMENTO */}
                        <div className="border-b-2 border-black pb-4 flex flex-col gap-1 pr-24">
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-black/60 font-black">
                                <FileText className="w-3.5 h-3.5" />
                                <span>VOLTGRID MOTORSPORT // PADDOCK HR & OPERATIONS</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight mt-0.5">
                                Ficha Individual de Colaborador
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-black/70 font-bold mt-1">
                                <span>REGISTRO: <strong>VG-HR-{character.id.toUpperCase()}</strong></span>
                                <span>DATA DE ARQUIVAMENTO: <strong>TEMPORADA 2026</strong></span>
                            </div>
                        </div>

                        {/* 2. BLOCO PRINCIPAL: FOTO 3X4 COM CLIPE + IDENTIFICAÇÃO FORMAL */}
                        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                            <div className="relative shrink-0 mx-auto sm:mx-0">
                                <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-[2px] border-2 border-black bg-white p-1 shadow-[3px_4px_10px_rgba(0,0,0,0.25)] flex flex-col items-center justify-between">
                                    <div className="w-full h-full overflow-hidden bg-black/10 rounded-[1px]">
                                        <img
                                            src={photoUrl}
                                            alt={character.fullName}
                                            onError={() => setImgFailed(true)}
                                            className="w-full h-full object-cover filter contrast-105"
                                        />
                                    </div>
                                </div>
                                <div className="text-center mt-1.5">
                                    <span className="inline-block px-1.5 py-0.5 bg-black text-[#fbaa19] text-[9px] font-mono font-black uppercase tracking-wider rounded-[1px]">
                                        [ {character.code} ]
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between gap-3 w-full">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block">
                                        NOME COMPLETO DO COLABORADOR
                                    </span>
                                    <h2 className="text-lg sm:text-xl font-black uppercase text-black tracking-wide leading-snug">
                                        {character.fullName}
                                    </h2>
                                </div>

                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block">
                                        FUNÇÃO HOMOLOGADA / CARGO
                                    </span>
                                    <p className="text-xs sm:text-sm font-bold text-black uppercase tracking-wide">
                                        {character.role}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block">
                                        LOTAÇÃO TÁTICA / DEPARTAMENTO
                                    </span>
                                    <p className="text-xs text-black/80 font-bold uppercase">
                                        {character.subtitle}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. GRADE DE ESPECIFICAÇÕES & DADOS TÁTICOS */}
                        <div className="border-t border-b border-black/20 py-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-wider text-black/50 font-bold">NACIONALIDADE</span>
                                <span className="font-bold text-black mt-0.5">{nationality}</span>
                            </div>

                            {age && (
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-black/50 font-bold">IDADE REGISTRADA</span>
                                    <span className="font-bold text-black mt-0.5">{age}</span>
                                </div>
                            )}

                            {careerStats && (
                                <div className="flex flex-col col-span-2 sm:col-span-1">
                                    <span className="text-[9px] uppercase tracking-wider text-black/50 font-bold">HISTÓRICO REAL</span>
                                    <span className="font-bold text-black mt-0.5">{careerStats}</span>
                                </div>
                            )}

                            {assertiveness && (
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-black/50 font-bold">ASSERTIVIDADE</span>
                                    <span className="font-black text-emerald-800 mt-0.5">{assertiveness}</span>
                                </div>
                            )}

                            <div className="flex flex-col col-span-2">
                                <span className="text-[9px] uppercase tracking-wider text-black/50 font-bold">ESPECIALIDADE TÁTICA</span>
                                <span className="font-bold text-black mt-0.5">{character.specialty}</span>
                            </div>
                        </div>

                        {/* 4. DOSSIÊ / DIRETRIZ OFICIAL / CITAÇÃO */}
                        <div className="flex flex-col gap-1.5 bg-black/[0.03] border-l-2 border-black p-3.5 rounded-[1px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-black/60">
                                REGISTRO DE CONDUTA // DECLARAÇÃO DE DIRETRIZ
                            </span>
                            <p className="text-xs sm:text-sm text-black/90 italic leading-relaxed font-serif">
                                "{character.bioOrQuote}"
                            </p>
                        </div>

                        {/* 5. RODAPÉ DE VALIDAÇÃO: ASSINATURAS E CARIMBO */}
                        <div className="pt-4 border-t border-black/20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-[10px]">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[8.5px] uppercase tracking-widest text-black/50 font-bold">ASSINATURA DO TITULAR:</span>
                                <div className="border-b-2 border-black/60 pb-0.5 min-w-[210px] sm:min-w-[240px] flex items-end">
                                    <span 
                                        className="font-signature text-2xl sm:text-3xl text-[#0b214d] tracking-wide inline-block -rotate-[2deg] transform origin-bottom-left select-none leading-none pt-1"
                                        title={`Assinatura Oficial: ${signatureName}`}
                                    >
                                        {signatureName}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 sm:text-right">
                                <span className="text-[8.5px] uppercase tracking-widest text-black/50 font-bold">VISTO DE AUDITORIA:</span>
                                <span className="text-[10px] font-mono font-bold uppercase text-black">
                                    [ VISTO POR STUART EVANS — DIRETOR ]
                                </span>
                            </div>
                        </div>
                    </article>

                    {/* FOLHA 2: HISTÓRICO DE EQUIPES & GARAGENS (DOSSIÊ MOCK) */}
                    <article 
                        onClick={() => {
                            if (activeTab !== 'history') setActiveTab('history');
                        }}
                        className={`w-full bg-[#fbfbf9] text-[#171717] rounded-[2px] p-6 sm:p-9 md:p-10 font-mono flex flex-col gap-6 transition-all duration-500 ease-out ${
                            activeTab === 'history'
                                ? 'relative z-20 scale-100 translate-y-0 translate-x-0 opacity-100 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.15)] pointer-events-auto'
                                : 'absolute top-0 left-0 z-10 scale-[0.985] translate-y-3.5 translate-x-2 opacity-75 shadow-[0_15px_35px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer filter brightness-90 hover:opacity-90 hover:brightness-95'
                        }`}
                        style={{
                            backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                            backgroundSize: '16px 16px'
                        }}
                        title={activeTab !== 'history' ? 'Clique para trazer o Dossiê de Equipes para o primeiro plano' : undefined}
                    >
                        {/* Clipe Metálico Superior Esquerdo */}
                        <div className="absolute -top-3 left-8 w-5 h-9 rounded-t-full border-2 border-gray-400 bg-gradient-to-r from-gray-300 to-gray-200 shadow-[2px_3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />

                        {/* Carimbo Físico Inclinado (Tinta Azul da Auditoria) */}
                        <div 
                            className="absolute top-6 right-6 sm:top-8 sm:right-8 border-2 border-blue-800/80 text-blue-800/85 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-[2px] rotate-[-5deg] shadow-[0_1px_3px_rgba(0,0,0,0.15)] select-none pointer-events-none"
                        >
                            HISTÓRICO AUDITADO // BAEF
                        </div>

                        {/* 1. CABEÇALHO DO DOCUMENTO */}
                        <div className="border-b-2 border-black pb-4 flex flex-col gap-1 pr-24">
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-black/60 font-black">
                                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                                <span>VOLTGRID MOTORSPORT // PADDOCK TEAM CONTRACTS</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight mt-0.5">
                                Dossiê de Vínculos & Histórico de Equipes
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-black/70 font-bold mt-1">
                                <span>TITULAR: <strong>[ {character.code} ] {character.fullName}</strong></span>
                                <span>REGISTRO: <strong>VG-TEAMS-{character.id.toUpperCase()}</strong></span>
                            </div>
                        </div>

                        {/* 2. EQUIPE ATUAL (VÍNCULO VIGENTE) */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                ESCUDERIA ATUAL // VÍNCULO VIGENTE TEMPORADA 2026
                            </span>

                            <div 
                                className="p-4 rounded-[2px] border-2 border-black bg-white shadow-[2px_3px_6px_rgba(0,0,0,0.08)] flex flex-col gap-2 relative overflow-hidden"
                            >
                                <div 
                                    className="absolute top-0 left-0 bottom-0 w-2"
                                    style={{ backgroundColor: currentTeam.teamColor }}
                                />

                                <div className="pl-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-black/10 pb-2">
                                    <h3 className="text-base font-black uppercase tracking-wide text-black">
                                        {currentTeam.teamName}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                                        {currentTeam.period}
                                    </span>
                                </div>

                                <div className="pl-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    <div>
                                        <span className="text-[8.5px] uppercase tracking-wider text-black/50 font-bold block">FUNÇÃO NA ESCUDERIA</span>
                                        <span className="font-bold text-black">{currentTeam.role}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] uppercase tracking-wider text-black/50 font-bold block">ESPECIFICAÇÃO DE MOTOR / BASE</span>
                                        <span className="font-bold text-black">{currentTeam.chassisOrSpec}</span>
                                    </div>
                                </div>

                                <p className="pl-2 text-[11px] text-black/80 italic pt-1 border-t border-black/5">
                                    "{currentTeam.highlight}"
                                </p>
                            </div>
                        </div>

                        {/* 3. EQUIPES ANTERIORES & HISTÓRICO DE CARREIRA */}
                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/60 flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" />
                                ESCUDERIAS ANTERIORES & HISTÓRICO NO PADDOCK
                            </span>

                            <div className="flex flex-col gap-3">
                                {previousTeams.map((team, idx) => (
                                    <div 
                                        key={idx}
                                        className="p-3.5 rounded-[2px] border border-black/30 bg-black/[0.02] flex flex-col gap-2 relative pl-4 hover:bg-black/[0.04] transition-colors"
                                    >
                                        <div 
                                            className="absolute top-0 left-0 bottom-0 w-1.5"
                                            style={{ backgroundColor: team.teamColor }}
                                        />

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-black/10 pb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-[1px] bg-black text-white">
                                                    #{idx + 1}
                                                </span>
                                                <h4 className="text-sm font-black uppercase tracking-wide text-black">
                                                    {team.teamName}
                                                </h4>
                                            </div>
                                            <span className="text-[9.5px] font-bold text-black/60 bg-black/5 px-2 py-0.5 rounded-[2px] shrink-0">
                                                {team.period}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[8.5px] uppercase tracking-wider text-black/50 font-bold block">CARGO / PAPEL</span>
                                                <span className="font-bold text-black">{team.role}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8.5px] uppercase tracking-wider text-black/50 font-bold block">CHASSI & ESPECIFICAÇÃO</span>
                                                <span className="font-bold text-black">{team.chassisOrSpec}</span>
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-black/85 pt-1.5 border-t border-black/5 flex items-start gap-1.5">
                                            <Award className="w-3.5 h-3.5 text-[#fbaa19] shrink-0 mt-0.5" />
                                            <span>{team.highlight}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. CERTIDÃO DE AUDITORIA DE CONTRATOS */}
                        <div className="pt-4 border-t border-black/20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-[10px]">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8.5px] uppercase tracking-widest text-black/50">CERTIFICAÇÃO DE VÍNCULO:</span>
                                <span className="text-black/80 font-bold">
                                    CONTRATOS AUDITADOS CONFORME DIRETRIZES DESPORTIVAS BAEF 2026
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:text-right">
                                <span className="text-[8.5px] uppercase tracking-widest text-black/50">HOMOLOGAÇÃO:</span>
                                <span className="text-[10px] font-mono font-bold uppercase text-black">
                                    [ AUDITORIA HOMOLOGADA — BAEFF1 ]
                                </span>
                            </div>
                        </div>
                    </article>

                </div>

                {/* Botões de Rodapé para Alternar Pastas */}
                <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-2 z-30">
                    <button
                        onClick={() => setActiveTab(activeTab === 'profile' ? 'history' : 'profile')}
                        type="button"
                        className="w-full sm:flex-1 py-3 bg-[#fbaa19] text-black font-mono text-xs font-black uppercase tracking-widest rounded-[3px] border border-[#000000] hover:bg-white transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                    >
                        {activeTab === 'profile' ? '[ FOLHEAR PARA DOSSIÊ DE EQUIPES ] »' : '« [ FOLHEAR PARA FICHA INDIVIDUAL ]'}
                    </button>

                    <button
                        onClick={handleBack}
                        type="button"
                        className="w-full sm:flex-1 py-3 bg-black/90 hover:bg-[#fbaa19] text-white hover:text-black font-mono text-xs font-black uppercase tracking-widest rounded-[3px] border border-white/20 hover:border-[#fbaa19] transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                    >
                        [ « RETORNAR AO PITWALL ]
                    </button>
                </div>
            </div>
        </main>
    );
}
