"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    findCrewCharacter, 
    fetchCrewRolesConfig, 
    CrewRolesConfig, 
    DEFAULT_CREW_ROLES_CONFIG 
} from '@/lib/crew-config';
import { ArrowLeft, CheckCircle2, Shield, Terminal, FileText } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CharacterEmployeeSheetPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const rawId = decodeURIComponent(resolvedParams.id || '');

    const [crewConfig, setCrewConfig] = useState<CrewRolesConfig>(DEFAULT_CREW_ROLES_CONFIG);
    const [imgFailed, setImgFailed] = useState(false);

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
            router.push('/invite');
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
                    {/* Moldura da Janela com divisórias verticais de vidro */}
                    <div className="absolute inset-0 flex justify-around pointer-events-none">
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                        <div className="w-[3px] h-full bg-[#050608]/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                    </div>

                    {/* Silhueta da arquibancada e holofotes do circuito de F1 na noite */}
                    <div className="w-full h-full relative opacity-60">
                        {/* Holofotes de pista */}
                        <div className="absolute top-2 left-1/4 w-32 h-16 bg-amber-400/20 blur-2xl rounded-full" />
                        <div className="absolute top-1 right-1/3 w-40 h-20 bg-blue-500/20 blur-2xl rounded-full" />
                        {/* Linha do horizonte do circuito com gradiente suave */}
                        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#02040a] to-transparent flex items-end px-6 pb-1">
                            <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">
                                // VOLTGRID INTERNATIONAL CIRCUIT — PADDOCK OFFICE PERSPECTIVE
                            </span>
                        </div>
                    </div>

                    {/* Peitoril da janela com reflexo suave */}
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
                            {/* Puxador de metal industrial com etiqueta */}
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
                    {/* Bezel do Monitor CRT */}
                    <div className="w-full rounded-[3px] border-2 border-[#1f232d] bg-[#030508] p-2.5 flex flex-col gap-2 shadow-[inset_0_0_20px_rgba(0,255,180,0.08),0_6px_16px_rgba(0,0,0,0.9)]">
                        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1 text-[8px] text-emerald-400 font-mono">
                            <span className="flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                CRT-04
                            </span>
                            <span>UTC 19:42</span>
                        </div>
                        {/* Scanlines verdes de telemetria */}
                        <div className="space-y-1 text-[7.5px] font-mono text-emerald-400/90 leading-tight">
                            <p>&gt; LINK_PADDOCK: OK</p>
                            <p>&gt; SYS_HR: ACTIVE</p>
                            <p>&gt; DOSSIER_ID: {character.id}</p>
                            <p className="text-amber-400">&gt; STATUS: HOMOLOGADO</p>
                        </div>
                        {/* Gráfico wireframe de telemetria */}
                        <div className="w-full h-12 bg-black/70 border border-emerald-500/20 rounded-[2px] p-1 flex items-end gap-1">
                            <div className="w-1/6 h-[40%] bg-emerald-500/30" />
                            <div className="w-1/6 h-[70%] bg-emerald-500/50" />
                            <div className="w-1/6 h-[55%] bg-emerald-500/40" />
                            <div className="w-1/6 h-[85%] bg-emerald-500/70" />
                            <div className="w-1/6 h-[60%] bg-emerald-500/50" />
                            <div className="w-1/6 h-[95%] bg-emerald-400" />
                        </div>
                    </div>

                    {/* Bloco de notas adesivas e caneta metálica na mesa */}
                    <div className="w-full p-2.5 rounded-[2px] bg-[#f5d76e]/95 text-black text-[8px] font-mono font-bold shadow-[2px_3px_8px_rgba(0,0,0,0.5)] rotate-1">
                        <span className="block border-b border-black/20 pb-0.5 uppercase tracking-wider text-[7px] text-black/60">
                            MEMO // DIRETORIA
                        </span>
                        <p className="mt-1 leading-snug">
                            "Validar pontuação de assertividade antes do próximo GP."
                        </p>
                    </div>

                    {/* Caneta metálica sobre a mesa */}
                    <div className="w-full py-4 flex items-center justify-center">
                        <div className="w-2.5 h-28 rounded-full bg-gradient-to-r from-gray-400 via-gray-100 to-gray-500 shadow-[3px_4px_8px_rgba(0,0,0,0.7)] rotate-6" />
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* CONTEÚDO PRINCIPAL: BARRA SUPERIOR + FICHA BRANCA         */}
            {/* ========================================================= */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-4 mt-8 sm:mt-12 animate-fade-in">
                
                {/* Barra de Ações Superior (Voltar ao Paddock) */}
                <div className="w-full flex items-center justify-between gap-3 px-1">
                    <button
                        onClick={handleBack}
                        type="button"
                        className="inline-flex items-center gap-2 py-2 px-3.5 rounded-[3px] bg-black/80 hover:bg-[#fbaa19] text-white hover:text-black border border-white/20 hover:border-[#fbaa19] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] cursor-pointer group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>[ « Voltar ao PitWall ]</span>
                    </button>

                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono hidden sm:block">
                        DOSSIÊ INDIVIDUAL // ARQUIVO MORTO
                    </div>
                </div>

                {/* ========================================================= */}
                {/* FICHA BRANCA DE FUNCIONÁRIO (DOCUMENTO OFICIAL IMPRESSO)   */}
                {/* ========================================================= */}
                <article 
                    className="w-full bg-[#fbfbf9] text-[#171717] rounded-[2px] p-6 sm:p-9 md:p-10 relative font-mono shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.15)] flex flex-col gap-6"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                    }}
                >
                    {/* Clipe Metálico Superior Esquerdo */}
                    <div className="absolute -top-3 left-8 w-5 h-9 rounded-t-full border-2 border-gray-400 bg-gradient-to-r from-gray-300 to-gray-200 shadow-[2px_3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />

                    {/* Carimbo Físico Inclinado (Tinta Vermelha) */}
                    <div 
                        className="absolute top-6 right-6 sm:top-8 sm:right-8 border-2 border-red-700/80 text-red-700/85 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-[2px] rotate-[-7deg] shadow-[0_1px_3px_rgba(0,0,0,0.15)] select-none pointer-events-none"
                    >
                        HOMOLOGADO // FIA 2026
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
                        
                        {/* Foto do Personagem com moldura estilo documento */}
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

                        {/* Dados Nominais e Cargo */}
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
                        <div className="flex flex-col gap-1">
                            <span className="text-[8.5px] uppercase tracking-widest text-black/50">ASSINATURA DO TITULAR:</span>
                            <span className="font-serif italic text-sm text-black/80 font-bold border-b border-black/40 pb-0.5 min-w-[180px]">
                                {character.fullName}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:text-right">
                            <span className="text-[8.5px] uppercase tracking-widest text-black/50">VISTO DE AUDITORIA:</span>
                            <span className="text-[10px] font-mono font-bold uppercase text-black">
                                [ VISTO POR STUART EVANS — DIRETOR ]
                            </span>
                        </div>
                    </div>
                </article>

                {/* Botão de Rodapé para Facilitar Navegação no Mobile */}
                <button
                    onClick={handleBack}
                    type="button"
                    className="w-full py-3 bg-black/90 hover:bg-[#fbaa19] text-white hover:text-black font-mono text-xs font-black uppercase tracking-widest rounded-[3px] border border-white/20 hover:border-[#fbaa19] transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                >
                    [ « RETORNAR AO PITWALL ]
                </button>
            </div>
        </main>
    );
}
