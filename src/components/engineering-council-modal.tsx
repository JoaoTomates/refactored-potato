"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    X, 
    MessageSquare, 
    Radio, 
    ShieldAlert, 
    Zap, 
    Award, 
    CheckCircle2, 
    TrendingUp, 
    Lock, 
    ArrowRight,
    Users
} from 'lucide-react';
import { TeamPrincipal } from '@/lib/paddock-crew';
import { TeamPrincipalAvatar } from '@/components/team-principal-avatar';

export interface EngineeringCouncilModalProps {
    isOpen: boolean;
    onClose: () => void;
    principal: TeamPrincipal;
    initialDay?: 'tue' | 'wed' | 'thu' | 'fri';
    userPilotCode?: string;
    gpsCount?: number;
}

export function EngineeringCouncilModal({
    isOpen,
    onClose,
    principal,
    initialDay = 'fri',
    userPilotCode = 'CARRO 1',
    gpsCount = 4,
}: EngineeringCouncilModalProps) {
    const [activeDay, setActiveDay] = useState<'tue' | 'wed' | 'thu' | 'fri'>(initialDay);

    if (!isOpen) return null;

    // Regra dos GPs no currículo: desbloqueia 50% apenas para veteranos com 20+ participações
    const isUnlocked50 = gpsCount >= 20;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
            <div 
                className="relative w-full max-w-3xl bg-[#090c10] border-2 border-[#fbaa19] rounded-[3px] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(251,170,25,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
                style={{
                    backgroundImage: 'radial-gradient(rgba(251, 170, 25, 0.04) 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                }}
            >
                {/* CABEÇALHO MILITAR / CRT */}
                <div className="bg-[#10151f] border-b border-[#fbaa19]/40 p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fbaa19] animate-pulse" />
                        <div>
                            <span className="text-[9px] uppercase tracking-[0.25em] text-[#fbaa19] font-black block">
                                MESA TÁTICA DA ENGENHARIA // DEBRIEFING SEMANAL
                            </span>
                            <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                                Debate Técnico das Tomadas de Posição
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-[2px] bg-white/5 hover:bg-white/20 text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer"
                        title="Fechar Painel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* BARRA DE HIERARQUIA INSTITUCIONAL DA EQUIPE */}
                <div className="bg-[#06080c] border-b border-white/10 px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/70">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-[#fbaa19] text-[9px]">DIRETORIA:</span>
                        <span>{principal.code} ({principal.title.split('//')[0].trim()})</span>
                    </div>
                    <span className="text-white/20">»</span>
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <span className="text-white/40 text-[9px]">ESTRATEGISTA-CHEFE:</span>
                        <span>{principal.leadChiefStrategist.code}</span>
                    </div>
                    <span className="text-white/20">»</span>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <span className="text-white/40 text-[9px]">SEU POSTO:</span>
                        <span>ESTRATEGISTA DO PILOTO [{userPilotCode}]</span>
                    </div>
                </div>

                {/* ABAS DOS DIAS DA SEMANA COM DINÂMICA ENTRE ENGENHEIROS */}
                <div className="bg-[#0c1017] border-b border-white/10 px-3 sm:px-4 pt-2 flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: 'tue' as const, label: 'TER // POLETIME', sub: 'Volta Rápida', badge: 'TELEMETRIA' },
                        { id: 'wed' as const, label: 'QUA // EVO', sub: 'Escalada +5', badge: 'DEGRADAÇÃO' },
                        { id: 'thu' as const, label: 'QUI // H2H', sub: 'Duelos Internos', badge: 'PARCIAIS' },
                        { id: 'fri' as const, label: 'SEX // REUNIÃO CÚPULA', sub: 'Props & Risco MISC', badge: 'CHEFÃO' },
                    ].map((tab) => {
                        const isCurrent = activeDay === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveDay(tab.id)}
                                className={`px-3 py-2 rounded-t-[2px] text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-t border-l border-r flex items-center gap-1.5 ${
                                    isCurrent
                                        ? 'bg-[#141b24] text-[#fbaa19] border-[#fbaa19] shadow-sm translate-y-[1px]'
                                        : 'bg-black/40 text-white/50 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                                    isCurrent ? 'bg-[#fbaa19] text-black font-black' : 'bg-white/10 text-white/50'
                                }`}>
                                    {tab.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* CORPO DO DEBATE / CONTEÚDO DO DIA */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    
                    {/* --- TERÇA: DEBATE DE POLETIME --- */}
                    {activeDay === 'tue' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded text-xs text-blue-200">
                                <strong className="text-white block uppercase mb-1">
                                    [TERÇA-FEIRA // CALIBRAÇÃO DE POLETIME]
                                </strong>
                                Simulações de vácuo e tempo ideal de volta única. Engenharia de pista confronta dados do túnel de vento.
                            </div>

                            {/* Diálogo Engenheiro 1 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-cyan-400 border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-cyan-400">T.VANCE // ENGENHEIRO DE TELEMETRIA</span>
                                    <span className="text-white/40">SIMULAÇÃO COMPUTACIONAL</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “Nossos dados mostram que com 32°C de pista no Q3, o ápice da curva rápida rende 0.18s a mais de pressão aerodinâmica. Se o asfalto emborrachar rápido, o tempo de pole vai despencar na segunda tentativa.”
                                </p>
                            </div>

                            {/* Diálogo Engenheiro 2 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-[#fbaa19] border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-[#fbaa19]">H.WEBER // DIRETOR TÉCNICO & POWERTRAIN</span>
                                    <span className="text-white/40">CALIBRAÇÃO DE MOTOR</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “Atenção com a temperatura do compressor: os turbos vão trabalhar no limite de RPM na reta dos boxes. Não recomendo cravar tempo abaixo da margem de segurança antes do FP1.”
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Link
                                    href="/positions?tab=poletime"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-[#fbaa19] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 shadow-md"
                                >
                                    <span>[ ABRIR FORMULÁRIO DE POLETIME » ]</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* --- QUARTA: DEBATE DE EVO (ESCALADA) --- */}
                    {activeDay === 'wed' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded text-xs text-purple-200">
                                <strong className="text-white block uppercase mb-1">
                                    [QUARTA-FEIRA // AVALIAÇÃO DE ESCALADA EVO]
                                </strong>
                                Identificação de pilotos rápidos que podem largar fora de posição e ganhar 5+ posições na corrida.
                            </div>

                            {/* Diálogo Engenheiro 1 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-purple-400 border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-purple-400">L.MORETTI // ANALISTA DE PNEUS & DEGRADAÇÃO</span>
                                    <span className="text-white/40">DESGASTE TÉRMICO</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “Pilotos com ritmo consistente de composto duro são as melhores escolhas para a Escalada EVO. Quem poupar os pneus dianteiros na primeira perna do stint vai ultrapassar 4 ou 5 carros quando o pelotão intermediário parar.”
                                </p>
                            </div>

                            {/* Diálogo Engenheiro 2 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-emerald-400 border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-emerald-400">M.SATO // ESPECIALISTA EM AERODINÂMICA</span>
                                    <span className="text-white/40">PRESSÃO DE VÁCUO</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “Selecione no EVO quem tiver eficiência máxima nas zonas de DRS duplo. Em retas longas, o arrasto reduzido garante ultrapassagens limpas sem desgastar o trem de força.”
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Link
                                    href="/positions?tab=evo"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-[#fbaa19] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 shadow-md"
                                >
                                    <span>[ ABRIR FORMULÁRIO EVO / ESCALADA » ]</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* --- QUINTA: DEBATE DE DUELOS H2H --- */}
                    {activeDay === 'thu' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded text-xs text-amber-200">
                                <strong className="text-white block uppercase mb-1">
                                    [QUINTA-FEIRA // CONFRONTOS DIRETOS H2H]
                                </strong>
                                Batalhas internas entre companheiros de escuderia: quem lida melhor com pressão de tráfego e acerto de suspensão.
                            </div>

                            {/* Diálogo Engenheiro 1 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-amber-400 border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-amber-400">K.MENSAH // ENGENHEIRO DE RÁDIO DO PILOTO</span>
                                    <span className="text-white/40">PSICOLÓGICO DE PISTA</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “Nos confrontos diretos H2H, o piloto mais calmo sob regime de Safety Car costuma levar a melhor. Veja o histórico das relargadas do ano passado antes de marcar o vencedor da batalha interna.”
                                </p>
                            </div>

                            {/* Diálogo Engenheiro 2 */}
                            <div className="p-3.5 rounded bg-black/60 border-l-2 border-blue-400 border-t border-r border-b border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-blue-400">I.NOVAK // ANALISTA DE DESEMPENHO E PARCIAIS</span>
                                    <span className="text-white/40">MICRO-SETORES</span>
                                </div>
                                <p className="text-xs text-white/90 italic leading-relaxed">
                                    “No confronto da nossa equipe, temos 0.12s de diferença a favor do carro 1 nas frenagens fortes. A vantagem é real, mas o tráfego de saída de box pode inverter a ordem.”
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Link
                                    href="/positions?tab=h2h"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-[#fbaa19] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 shadow-md"
                                >
                                    <span>[ ABRIR FORMULÁRIO DE DUELOS H2H » ]</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* --- SEXTA: REUNIÃO DE CÚPULA COM O CHEFÃO & FORMULÁRIO MISC --- */}
                    {activeDay === 'fri' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-3.5 bg-red-950/20 border-2 border-red-500/40 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-red-400 font-black block">
                                        REUNIÃO EXECUTIVA DE SEXTA-FEIRA // BRIEFING OFICIAL DA CHEFIA
                                    </span>
                                    <h3 className="text-sm sm:text-base font-black text-white uppercase mt-0.5">
                                        Despacho da Diretoria sobre o Formulário MISC
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                                    DECISÃO EXCLUSIVA DO USUÁRIO
                                </span>
                            </div>

                            {/* BANNER COM AVATAR DO CHEFÃO REAL FICTÍCIO */}
                            <div className="p-4 rounded bg-black/75 border border-[#fbaa19]/40 flex flex-col sm:flex-row items-start gap-4 shadow-lg">
                                <div className="shrink-0 mx-auto sm:mx-0">
                                    <TeamPrincipalAvatar teamCode={principal.teamCode} size={68} />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/10 pb-1.5">
                                        <div>
                                            <span className="text-sm font-black text-[#fbaa19] uppercase tracking-wider block">
                                                {principal.fullName} [{principal.code}]
                                            </span>
                                            <span className="text-[9px] text-white/50 uppercase font-bold">
                                                {principal.title} // {principal.teamName}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                            RÁDIO DIRETO DE PITWALL
                                        </span>
                                    </div>

                                    {/* Orientação conservadora do Chefão */}
                                    <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed">
                                        {principal.fridayMiscBriefing}
                                    </p>

                                    {/* Dica do Estrategista-Chefe */}
                                    <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-amber-200/80">
                                        <span className="font-bold text-[#fbaa19]">
                                            [DIRETRIZ DE {principal.leadChiefStrategist.code}]:
                                        </span>
                                        <span>
                                            Recomendamos calibragem conservadora no MISC. A alocação de risco final (10%, 20%, 30% ou 50%) é sua prerrogativa.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD DE ALOCAÇÃO DE RISCO NO MISC & REGRAS DE GPS NO CURRÍCULO */}
                            <div className="p-4 rounded bg-white/[0.03] border border-white/10 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-[#fbaa19]" />
                                        REGRAS DE ORÇAMENTO NO FORMULÁRIO MISC
                                    </span>
                                    <span className="text-[10px] text-white/50 font-mono">
                                        CURRÍCULO: <strong className="text-white">{gpsCount} GPs DISPUTADOS</strong>
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {/* 10% */}
                                    <div className="p-2.5 rounded bg-black/60 border border-emerald-500/40 flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-black text-emerald-400">10%</span>
                                            <span className="text-[8px] text-white/50 block font-bold uppercase mt-0.5">CONSERVADOR</span>
                                        </div>
                                        <span className="text-[8px] text-emerald-300/80 mt-1">Sugestão do Chefe</span>
                                    </div>

                                    {/* 20% */}
                                    <div className="p-2.5 rounded bg-black/60 border border-blue-500/40 flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-black text-blue-400">20%</span>
                                            <span className="text-[8px] text-white/50 block font-bold uppercase mt-0.5">MODERADO</span>
                                        </div>
                                        <span className="text-[8px] text-blue-300/80 mt-1">Equilíbrio de Frota</span>
                                    </div>

                                    {/* 30% */}
                                    <div className="p-2.5 rounded bg-black/60 border border-amber-500/40 flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-black text-amber-400">30%</span>
                                            <span className="text-[8px] text-white/50 block font-bold uppercase mt-0.5">AGRESSIVO</span>
                                        </div>
                                        <span className="text-[8px] text-amber-300/80 mt-1">Alto Risco</span>
                                    </div>

                                    {/* 50% - Bloqueado se < 20 GPs */}
                                    <div className={`p-2.5 rounded flex flex-col justify-between border ${
                                        isUnlocked50 
                                            ? 'bg-black/60 border-red-500/40' 
                                            : 'bg-black/40 border-white/10 opacity-60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-red-400">50%</span>
                                                {!isUnlocked50 && <Lock className="w-3 h-3 text-white/40" />}
                                            </div>
                                            <span className="text-[8px] text-white/50 block font-bold uppercase mt-0.5">ALL-IN TOTAL</span>
                                        </div>
                                        <span className="text-[7.5px] text-white/40 mt-1 truncate">
                                            {isUnlocked50 ? 'Desbloqueado' : 'Requer 20+ GPs'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-white/60">
                                    O orçamento percentual selecionado é distribuído entre as perguntas ativas no MISC. O Chefe de Equipe sugere opções conservadoras para evitar perdas catastróficas.
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Link
                                    href="/positions?tab=misc"
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-[#fbaa19] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    <span>[ TRANSMITIR PALPITES NO FORMULÁRIO MISC » ]</span>
                                </Link>
                            </div>
                        </div>
                    )}

                </div>

                {/* RODAPÉ DO MODAL COM BOTÕES RÁPIDOS */}
                <div className="bg-[#0c1017] border-t border-white/10 p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:inline">
                        BAEFF1 // CIRCUITO OPERACIONAL
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                        <Link
                            href="/positions"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-[2px] bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/20 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            [ TODAS AS POSIÇÕES ]
                        </Link>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-[2px] bg-[#fbaa19] hover:bg-white text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                            [ FECHAR MESA ]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
