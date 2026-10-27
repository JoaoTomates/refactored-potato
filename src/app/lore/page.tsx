"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    BookOpen, 
    Plus, 
    Trash2, 
    Edit3, 
    Play, 
    Copy, 
    Check, 
    RotateCcw, 
    Save, 
    FileText, 
    Terminal, 
    Radio, 
    ShieldAlert, 
    Sparkles, 
    ChevronRight,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface NarrativeLine {
    id: string;
    speaker: string;
    text: string;
    tone?: string;
    notes?: string;
}

interface NarrativeChapter {
    id: string;
    title: string;
    category: string;
    summary: string;
    lines: NarrativeLine[];
}

const DEFAULT_CHAPTERS: NarrativeChapter[] = [
    {
        id: 'invite-intro',
        title: '01. O Chamado Confidencial',
        category: 'INVITE ONBOARDING',
        summary: 'Diálogo introdutório do Diretor quando o estrategista entra na sala de operações.',
        lines: [
            {
                id: 'line-1',
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: 'Puxe uma cadeira e feche a porta.',
                tone: 'Sério, seco, confidencial',
                notes: 'Primeira impressão. O silêncio da sala deve ser sentido.'
            },
            {
                id: 'line-2',
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: 'Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.',
                tone: 'Reconhecimento contido',
                notes: 'Estabelece que o jogador tem talento nato acima da média.'
            },
            {
                id: 'line-3',
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: 'Você lê o traçado antes das luzes apagarem.',
                tone: 'Perspicaz',
                notes: 'Alude à mecânica principal de prever resultados antes da largada.'
            },
            {
                id: 'line-4',
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: 'Mas você sabe que o novo regulamento de motores deflagrou uma verdadeira guerra fria nos bastidores. As fronteiras foram desenhadas e três grandes alianças se formaram no grid.',
                tone: 'Tenso, geopolítico',
                notes: 'Apresenta a Era Regulamentar de 2026 e a divisão de forças.'
            },
            {
                id: 'line-5',
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: 'Chegou a hora de escolher o seu lado e buscar uma vaga no pitwall entre os melhores.',
                tone: 'Desafiador, decisivo',
                notes: 'Gatilho para abrir a seleção de alianças dos motores.'
            }
        ]
    },
    {
        id: 'alliances-lore',
        title: '02. Guerra dos Motores 2026',
        category: 'ALIANÇAS & SINDICATOS',
        summary: 'Manifestos e posicionamento dos três blocos de motoristas do grid.',
        lines: [
            {
                id: 'line-a',
                speaker: 'BLOCO A (MERCEDES)',
                text: '"Confiabilidade de Aço & Domínio de Frota"',
                tone: 'Alemão, metódico, frio',
                notes: 'Quatro garagens trocando telemetria de alta precisão.'
            },
            {
                id: 'line-b',
                speaker: 'BLOCO B (FERRARI)',
                text: '"Potência de Pico & A Frente Americana"',
                tone: 'Passional, agressivo, ousado',
                notes: 'A mística de Maranello combinada com a nova força da Cadillac.'
            },
            {
                id: 'line-c',
                speaker: 'BLOCO C (A VANGUARDA)',
                text: '"Ambição e Risco Tecnológico"',
                tone: 'Rebelde, pioneiro, disruptivo',
                notes: 'Red Bull-Ford, Honda e Audi desafiando o establishment.'
            }
        ]
    },
    {
        id: 'directors-responses',
        title: '03. Despacho dos Chefes de Equipe',
        category: 'RESPOSTAS DE CONTRATO',
        summary: 'Reação imediata do chefe do consórcio quando o jogador firma sua escolha de aliança.',
        lines: [
            {
                id: 'dir-a',
                speaker: 'CHEFIA CONSÓRCIO DA ESTRELA',
                text: '“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”',
                tone: 'Exigência germânica',
                notes: 'Cobrança por previsões com delta mínimo de erro.'
            },
            {
                id: 'dir-b',
                speaker: 'CHEFIA DINASTIA DE MARANELLO',
                text: '“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a imprensa italiana te destrói.”',
                tone: 'Fogo nos olhos, dramático',
                notes: 'Tolerância zero para previsões covardes.'
            },
            {
                id: 'dir-c',
                speaker: 'CHEFIA A VANGUARDA',
                text: '“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”',
                tone: 'Audacioso, entusiasmado',
                notes: 'Incentiva apostas contra o favoritismo.'
            }
        ]
    },
    {
        id: 'headquarters-briefing',
        title: '04. Quartel-General & Ofertas',
        category: 'SALA DE CONTRATOS',
        summary: 'Transmissão do staff ao receber as 2 ofertas de equipe exclusivas.',
        lines: [
            {
                id: 'hq-1',
                speaker: 'AGENTE DE CARREIRA',
                text: 'Duas propostas caíram na sua mesa cifrada. Ambas monitoraram suas simulações de treino.',
                tone: 'Negociador de bastidores',
                notes: 'Mostra o peso do jogador no mercado de estrategistas.'
            },
            {
                id: 'hq-2',
                speaker: 'AGENTE DE CARREIRA',
                text: 'Assine com uma das garagens para desbloquear sua credencial no Pit Wall. A outra vaga será preenchida por um rival.',
                tone: 'Urgência controlada',
                notes: 'Pressão pelo preenchimento das vagas limitadas.'
            }
        ]
    },
    {
        id: 'pitwall-radio',
        title: '05. Transmissões de Rádio do GP',
        category: 'RÁDIO AO VIVO',
        summary: 'Falas rápidas do estrategista chefe e engenheiro de pista durante o domingo.',
        lines: [
            {
                id: 'rad-1',
                speaker: 'ENGENHEIRO DE PISTA',
                text: '“Box, box! A previsão do delta indicou chuva em 3 voltas. Entrando agora estamos com ar limpo.”',
                tone: 'Respiração acelerada, rádio distorcido',
                notes: 'Quando o jogador acerta uma aposta de clima ou safety car.'
            },
            {
                id: 'rad-2',
                speaker: 'ENGENHEIRO DE TELEMETRIA',
                text: '“Confirmação da FIA: seu piloto acabou de fechar o setor 2 no roxo. A pontuação de pole está subindo no quadro!”',
                tone: 'Comemoração no headset',
                notes: 'Gatilho para acertos de Poletime.'
            }
        ]
    }
];

export default function LoreStudioPage() {
    const [chapters, setChapters] = useState<NarrativeChapter[]>(DEFAULT_CHAPTERS);
    const [selectedChapterId, setSelectedChapterId] = useState<string>('invite-intro');
    const [copied, setCopied] = useState(false);

    // Form inputs for new line
    const [newLineSpeaker, setNewLineSpeaker] = useState('');
    const [newLineText, setNewLineText] = useState('');
    const [newLineTone, setNewLineTone] = useState('');
    const [newLineNotes, setNewLineNotes] = useState('');

    // Form input for new chapter
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterCategory, setNewChapterCategory] = useState('');
    const [newChapterSummary, setNewChapterSummary] = useState('');

    // Live simulator state
    const [isSimulating, setIsSimulating] = useState(false);
    const [simIndex, setSimIndex] = useState(0);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('baeff1_lore_chapters') || localStorage.getItem('voltgrid_lore_chapters');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setChapters(parsed);
                }
            } catch (e) {
                console.error('Erro ao ler capítulos do localStorage:', e);
            }
        }
    }, []);

    // Save to localStorage on change
    const saveChapters = (updated: NarrativeChapter[]) => {
        setChapters(updated);
        localStorage.setItem('baeff1_lore_chapters', JSON.stringify(updated));
    };

    const currentChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

    // Add new line to current chapter
    const handleAddLine = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLineText.trim()) return;

        const newLine: NarrativeLine = {
            id: `line-${Date.now()}`,
            speaker: newLineSpeaker.trim() || 'NARRADOR',
            text: newLineText.trim(),
            tone: newLineTone.trim() || undefined,
            notes: newLineNotes.trim() || undefined
        };

        const updated = chapters.map(c => {
            if (c.id === currentChapter.id) {
                return {
                    ...c,
                    lines: [...c.lines, newLine]
                };
            }
            return c;
        });

        saveChapters(updated);
        setNewLineText('');
        setNewLineNotes('');
    };

    // Delete a line
    const handleDeleteLine = (lineId: string) => {
        const updated = chapters.map(c => {
            if (c.id === currentChapter.id) {
                return {
                    ...c,
                    lines: c.lines.filter(l => l.id !== lineId)
                };
            }
            return c;
        });
        saveChapters(updated);
    };

    // Move line up / down
    const handleMoveLine = (index: number, direction: 'up' | 'down') => {
        if (!currentChapter) return;
        const newLines = [...currentChapter.lines];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newLines.length) return;

        const temp = newLines[index];
        newLines[index] = newLines[targetIndex];
        newLines[targetIndex] = temp;

        const updated = chapters.map(c => {
            if (c.id === currentChapter.id) {
                return { ...c, lines: newLines };
            }
            return c;
        });
        saveChapters(updated);
    };

    // Create a new chapter
    const handleCreateChapter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChapterTitle.trim()) return;

        const newId = `chap-${Date.now()}`;
        const newChap: NarrativeChapter = {
            id: newId,
            title: newChapterTitle.trim(),
            category: newChapterCategory.trim().toUpperCase() || 'NOVO ATO',
            summary: newChapterSummary.trim() || 'Sem descrição cadastrada.',
            lines: []
        };

        const updated = [...chapters, newChap];
        saveChapters(updated);
        setSelectedChapterId(newId);
        setIsCreatingChapter(false);
        setNewChapterTitle('');
        setNewChapterCategory('');
        setNewChapterSummary('');
    };

    // Reset to defaults
    const handleResetDefaults = () => {
        if (window.confirm('Deseja restaurar as conversas e capítulos para o padrão original da F1 2026?')) {
            saveChapters(DEFAULT_CHAPTERS);
            setSelectedChapterId('invite-intro');
        }
    };

    // Copy formatted TypeScript export to clipboard
    const handleCopyTS = () => {
        const json = JSON.stringify(currentChapter.lines.map(l => l.text), null, 4);
        navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="min-h-screen bg-[#07090c] text-white flex flex-col font-sans selection:bg-[#fbaa19] selection:text-black">
            
            {/* TOP HEADER: Dossiê de Operações */}
            <header className="border-b border-white/10 bg-[#0a0d12]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#fbaa19]/10 border border-[#fbaa19]/30 flex items-center justify-center text-[#fbaa19]">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm md:text-base font-black tracking-wider uppercase">
                                FICHÁRIO DE NARRATIVAS // BAEFF1 LORE
                            </h1>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                OFFLINE SYNC ON
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">
                            Dossiê de roteiros, diálogos e cartas confidenciais da Era 2026
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleResetDefaults}
                        className="text-xs font-mono px-3 py-1.5 rounded border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                        title="Restaurar roteiros de fábrica"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Restaurar Padrões</span>
                    </button>
                    <Link
                        href="/invite"
                        className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded bg-[#fbaa19] text-black hover:bg-white transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,170,25,0.3)]"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ver Imersão Real</span>
                    </Link>
                </div>
            </header>

            {/* MAIN BINDER (FICHÁRIO) CONTAINER */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">
                
                {/* LEFT: FICHÁRIO VERTICAL MENU (ABAS DE SEPARADORES) */}
                <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#fbaa19] font-bold">
                            // ÍNDICE DO FICHÁRIO ({chapters.length} PÁGINAS)
                        </span>
                        <button
                            onClick={() => setIsCreatingChapter(!isCreatingChapter)}
                            className="text-[11px] font-mono text-[#fbaa19] hover:underline flex items-center gap-1 font-bold"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Nova Página</span>
                        </button>
                    </div>

                    {/* Criar nova página/capítulo */}
                    {isCreatingChapter && (
                        <form onSubmit={handleCreateChapter} className="p-3.5 rounded-lg border border-[#fbaa19]/40 bg-black/60 backdrop-blur-md flex flex-col gap-2.5 animate-fade-in shadow-xl">
                            <span className="text-[10px] font-mono text-[#fbaa19] uppercase font-bold">
                                + ADICIONAR SEPARADOR / CAPÍTULO
                            </span>
                            <input
                                type="text"
                                required
                                placeholder="Título (ex: 06. Rádio do Pit Wall)"
                                value={newChapterTitle}
                                onChange={e => setNewChapterTitle(e.target.value)}
                                className="bg-black/50 border border-white/20 p-2 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19]"
                            />
                            <input
                                type="text"
                                placeholder="Categoria (ex: EVENTO CLIMÁTICO)"
                                value={newChapterCategory}
                                onChange={e => setNewChapterCategory(e.target.value)}
                                className="bg-black/50 border border-white/20 p-2 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19]"
                            />
                            <textarea
                                placeholder="Resumo do momento narrativo..."
                                value={newChapterSummary}
                                onChange={e => setNewChapterSummary(e.target.value)}
                                rows={2}
                                className="bg-black/50 border border-white/20 p-2 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#fbaa19] text-black text-xs font-bold uppercase py-1.5 rounded hover:bg-white transition-colors"
                                >
                                    Criar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingChapter(false)}
                                    className="px-3 border border-white/20 text-gray-400 hover:text-white text-xs rounded"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Lista Vertical com Estilo Abas de Fichário */}
                    <div className="flex flex-col gap-2 relative">
                        {/* Linha decorativa dos anéis do fichário */}
                        <div className="hidden lg:block absolute -left-3 top-4 bottom-4 w-1 border-r border-dashed border-white/20" />

                        {chapters.map((chap, idx) => {
                            const isSelected = chap.id === selectedChapterId;
                            return (
                                <button
                                    key={chap.id}
                                    onClick={() => {
                                        setSelectedChapterId(chap.id);
                                        setIsSimulating(false);
                                    }}
                                    className={`relative text-left p-3.5 rounded-lg border transition-all flex flex-col gap-1 group ${
                                        isSelected 
                                            ? 'bg-black/90 border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.15)] translate-x-1' 
                                            : 'bg-[#0e1218]/60 border-white/10 hover:border-white/25 hover:bg-[#121620]'
                                    }`}
                                >
                                    {/* Marcador lateral dourado da aba selecionada */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#fbaa19] rounded-r" />
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-mono tracking-wider uppercase font-bold ${isSelected ? 'text-[#fbaa19]' : 'text-gray-500'}`}>
                                            [{chap.category || `SEÇÃO ${idx + 1}`}]
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-500">
                                            {chap.lines.length} falas
                                        </span>
                                    </div>

                                    <h2 className={`text-sm font-bold tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                        {chap.title}
                                    </h2>

                                    <p className="text-[11px] text-gray-400 line-clamp-1">
                                        {chap.summary}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* RIGHT: FOLHA DO FICHÁRIO (EDITOR & VISUALIZADOR DA PÁGINA ATUAL) */}
                <section className="flex-1 flex flex-col gap-5">
                    
                    {/* Header da Página Aberta */}
                    <div className="p-5 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-[#fbaa19] tracking-widest uppercase font-bold">
                                    // PÁGINA ATIVA :: {currentChapter.category}
                                </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
                                {currentChapter.title}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {currentChapter.summary}
                            </p>
                        </div>

                        {/* Ações do Capítulo */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyTS}
                                className="text-xs font-mono px-3 py-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                                title="Copiar array de diálogos para TypeScript"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? 'Copiado!' : 'Exportar JSON'}</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsSimulating(!isSimulating);
                                    setSimIndex(0);
                                }}
                                className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                                    isSimulating
                                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{isSimulating ? 'Modo Ao Vivo' : 'Simular Leitura'}</span>
                            </button>
                        </div>
                    </div>

                    {/* MODO SIMULADOR AO VIVO (COMO APARECE EM JOGO) */}
                    {isSimulating && (
                        <div className="p-6 rounded-xl border-2 border-emerald-500/40 bg-black/95 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-4 animate-fade-in relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span>[SIMULAÇÃO EM TEMPO REAL :: LINHA {simIndex + 1} DE {currentChapter.lines.length}]</span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500">
                                    Clique em Avançar para ler como o jogador lê
                                </span>
                            </div>

                            {currentChapter.lines.length > 0 && currentChapter.lines[simIndex] ? (
                                <div className="py-4">
                                    <span className="text-[11px] font-mono text-[#fbaa19] uppercase font-bold tracking-widest block mb-2">
                                        // {currentChapter.lines[simIndex].speaker}
                                    </span>
                                    <p className="text-lg md:text-xl font-bold tracking-widest text-white leading-relaxed border-l-4 border-[#fbaa19] pl-4 py-1">
                                        {currentChapter.lines[simIndex].text}
                                    </p>
                                    {currentChapter.lines[simIndex].tone && (
                                        <p className="text-xs text-gray-400 italic mt-3 font-mono">
                                            Tom de fala: {currentChapter.lines[simIndex].tone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-xs py-4 font-mono">Sem diálogos cadastrados para simulação.</p>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <button
                                    disabled={simIndex === 0}
                                    onClick={() => setSimIndex(prev => Math.max(0, prev - 1))}
                                    className="text-xs font-mono px-3 py-1.5 rounded border border-white/15 disabled:opacity-30 hover:bg-white/10 transition-colors"
                                >
                                    « Anterior
                                </button>
                                <span className="text-xs font-mono text-gray-400">
                                    {simIndex + 1} / {currentChapter.lines.length}
                                </span>
                                <button
                                    disabled={simIndex >= currentChapter.lines.length - 1}
                                    onClick={() => setSimIndex(prev => Math.min(currentChapter.lines.length - 1, prev + 1))}
                                    className="text-xs font-mono px-3 py-1.5 rounded bg-emerald-500 text-black font-bold disabled:opacity-30 hover:bg-white transition-colors"
                                >
                                    Próxima Fala »
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LISTA DAS LINHAS / DIÁLOGOS EXISTENTES NO CAPÍTULO */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#fbaa19] font-bold">
                                // SEQUÊNCIA DE TRANSMISSÕES ({currentChapter.lines.length} ENTRADAS)
                            </span>
                        </div>

                        {currentChapter.lines.length === 0 ? (
                            <div className="p-8 rounded-xl border border-dashed border-white/15 bg-black/40 text-center flex flex-col items-center justify-center gap-2">
                                <FileText className="w-8 h-8 text-gray-600" />
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                                    Nenhuma fala cadastrada nesta página
                                </p>
                                <p className="text-xs text-gray-500">
                                    Use o formulário abaixo para acrescentar as primeiras falas desta narrativa.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {currentChapter.lines.map((line, idx) => (
                                    <div
                                        key={line.id}
                                        className="p-4 md:p-5 rounded-lg border border-white/10 bg-black/80 hover:border-[#fbaa19]/60 hover:bg-black/95 transition-all shadow-lg flex flex-col gap-2 group relative"
                                    >
                                        {/* Header da linha */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                                                    #{String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <span className="text-xs font-mono font-bold tracking-widest text-[#fbaa19] uppercase">
                                                    {line.speaker}
                                                </span>
                                                {line.tone && (
                                                    <span className="text-[10px] text-gray-400 font-mono italic">
                                                        ({line.tone})
                                                    </span>
                                                )}
                                            </div>

                                            {/* Controles de ordem e exclusão */}
                                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveLine(idx, 'up')}
                                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20"
                                                    title="Mover para cima"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    disabled={idx === currentChapter.lines.length - 1}
                                                    onClick={() => handleMoveLine(idx, 'down')}
                                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20"
                                                    title="Mover para baixo"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLine(line.id)}
                                                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors ml-1"
                                                    title="Excluir fala"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Texto da fala */}
                                        <p className="text-sm md:text-base font-bold text-white tracking-widest leading-relaxed">
                                            {line.text}
                                        </p>

                                        {/* Anotações de bastidores / Contexto */}
                                        {line.notes && (
                                            <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                                                <span className="text-gray-500">NOTA:</span>
                                                <span>{line.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TEXT BOX PARA ACRESCENTAR ATUALIZAÇÕES / NOVAS LINHAS */}
                    <form 
                        onSubmit={handleAddLine} 
                        className="p-5 md:p-6 rounded-xl border-2 border-[#fbaa19]/30 bg-black/90 backdrop-blur-md shadow-2xl flex flex-col gap-4 mt-2"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-[#fbaa19]" />
                                <span className="text-xs font-mono font-bold tracking-widest uppercase text-white">
                                    ACRESCENTAR ATUALIZAÇÃO À PÁGINA [{currentChapter.title}]
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#fbaa19]">
                                + DIÁLOGO INTERATIVO
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                                    Personagem / Emissor:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: DIRETOR DE OPERAÇÕES, ENGENHEIRO DE PISTA..."
                                    value={newLineSpeaker}
                                    onChange={e => setNewLineSpeaker(e.target.value)}
                                    className="bg-black/50 border border-white/20 p-2.5 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19]"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                                    Tom de Voz / Efeito:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Confidencial, Rádio estático, Agressivo..."
                                    value={newLineTone}
                                    onChange={e => setNewLineTone(e.target.value)}
                                    className="bg-black/50 border border-white/20 p-2.5 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-gray-400 uppercase font-bold flex items-center justify-between">
                                <span>Texto da Fala (O que o usuário lê na tela):</span>
                                <span className="text-[9px] text-gray-500 font-mono">Pressione Enter ou Salve abaixo</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Digite a nova linha de diálogo aqui..."
                                value={newLineText}
                                onChange={e => setNewLineText(e.target.value)}
                                className="bg-black/50 border border-white/20 p-3 text-xs md:text-sm font-bold tracking-wider rounded text-white focus:outline-none focus:border-[#fbaa19] resize-none leading-relaxed"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                                Anotações de Produção / Roteiro (Opcional):
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Essa fala destrava o botão de assinar superlicença..."
                                value={newLineNotes}
                                onChange={e => setNewLineNotes(e.target.value)}
                                className="bg-black/50 border border-white/20 p-2.5 text-xs rounded text-white focus:outline-none focus:border-[#fbaa19]"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-3 rounded bg-[#fbaa19] text-black font-black uppercase tracking-wider text-xs hover:bg-white transition-colors shadow-[0_0_20px_rgba(251,170,25,0.4)] flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Inserir Esta Fala na Narrativa</span>
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
