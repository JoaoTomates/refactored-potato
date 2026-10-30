"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { arcadeAudioEngine } from '@/lib/arcade-audio-engine';
import { 
    Radio, 
    Volume2, 
    VolumeX, 
    Play, 
    Pause, 
    ChevronUp, 
    ChevronDown, 
    Sparkles, 
    Disc, 
    Headphones,
    Music,
    RadioTower,
    Clock,
    RotateCcw
} from 'lucide-react';

/**
 * INTERVALO DE OPERAÇÃO: 1:12:500 (1 minuto, 12 segundos e 500 milissegundos = 72,5s)
 * O rádio toca durante esse intervalo, pausa pelo mesmo tempo (intervalo fixo),
 * e depois volta a tocar automaticamente em loop contínuo.
 */
const INTERVAL_MS = 72500; // 1:12:500 em milissegundos

/**
 * Formata milissegundos no padrão oficial de volta rápida da F1: M:SS:mmm (ex: 1:12:500)
 */
export function formatLapTimer(ms: number): string {
    const totalMs = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
}

export type RadioLoopPhase = 'PLAYING' | 'INTERVAL_PAUSED' | 'IDLE';

export default function PaddockRadioPlayer() {
    const pathname = usePathname() || '';

    // Não exibir apenas na página de onboarding /invite para não atrapalhar os diálogos
    const isInviteRoute = pathname === '/invite';

    const [isPlaying, setIsPlaying] = useState(false);
    const [loopPhase, setLoopPhase] = useState<RadioLoopPhase>('IDLE');
    const [remainingMs, setRemainingMs] = useState<number>(INTERVAL_MS);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(35);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Timestamp de início da fase atual para cálculo preciso de tempo
    const phaseStartRef = useRef<number>(Date.now());

    // Barras animadas do equalizador
    const [eqLevels, setEqLevels] = useState<number[]>([40, 70, 50, 85, 60]);

    // Carrega preferências do localStorage e gerencia primeira interação
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedMute = (localStorage.getItem('baeff1_radio_muted') ?? localStorage.getItem('voltgrid_radio_muted')) === 'true';
        const savedVol = localStorage.getItem('baeff1_radio_volume') ?? localStorage.getItem('voltgrid_radio_volume');

        if (savedVol) {
            const v = parseInt(savedVol, 10);
            if (!isNaN(v)) {
                setVolume(v);
                arcadeAudioEngine.setVolume(v / 100);
            }
        }
        if (savedMute) {
            setIsMuted(true);
            arcadeAudioEngine.setMute(true);
        }

        // Inicia suavemente no primeiro clique/toque caso o usuário não tenha desligado
        const handleFirstInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                const userOff = (localStorage.getItem('baeff1_radio_off') ?? localStorage.getItem('voltgrid_radio_off')) === 'true';
                if (!userOff && !arcadeAudioEngine.getIsPlaying()) {
                    arcadeAudioEngine.start();
                    setIsPlaying(true);
                    setLoopPhase('PLAYING');
                    phaseStartRef.current = Date.now();
                    setRemainingMs(INTERVAL_MS);
                }
            }
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };

        window.addEventListener('pointerdown', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);

        return () => {
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [hasInteracted]);

    // Timer do ciclo periódico de 1:12:500 (Play 72.5s -> Pause 72.5s -> Play 72.5s)
    useEffect(() => {
        if (loopPhase === 'IDLE') {
            setRemainingMs(INTERVAL_MS);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - phaseStartRef.current;
            const left = Math.max(0, INTERVAL_MS - elapsed);
            setRemainingMs(left);

            if (elapsed >= INTERVAL_MS) {
                if (loopPhase === 'PLAYING') {
                    // Fase de áudio terminou (1:12:500) -> entra na pausa do intervalo de 1:12:500
                    arcadeAudioEngine.stop();
                    setIsPlaying(false);
                    setLoopPhase('INTERVAL_PAUSED');
                    phaseStartRef.current = Date.now();
                    setRemainingMs(INTERVAL_MS);
                } else if (loopPhase === 'INTERVAL_PAUSED') {
                    // Fase de pausa do intervalo terminou (1:12:500) -> volta a tocar por 1:12:500
                    arcadeAudioEngine.start();
                    setIsPlaying(true);
                    setLoopPhase('PLAYING');
                    phaseStartRef.current = Date.now();
                    setRemainingMs(INTERVAL_MS);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [loopPhase]);

    // Animação das barras do equalizador enquanto toca
    useEffect(() => {
        if (!isPlaying || isMuted) {
            setEqLevels([12, 12, 12, 12, 12]);
            return;
        }

        const interval = setInterval(() => {
            setEqLevels([
                Math.floor(25 + Math.random() * 70),
                Math.floor(35 + Math.random() * 65),
                Math.floor(40 + Math.random() * 60),
                Math.floor(30 + Math.random() * 70),
                Math.floor(20 + Math.random() * 75)
            ]);
        }, 120);

        return () => clearInterval(interval);
    }, [isPlaying, isMuted]);

    const togglePlay = () => {
        if (loopPhase === 'PLAYING') {
            // Se está tocando, para o áudio e desliga o loop
            arcadeAudioEngine.stop();
            setIsPlaying(false);
            setLoopPhase('IDLE');
            setRemainingMs(INTERVAL_MS);
            localStorage.setItem('baeff1_radio_off', 'true');
        } else if (loopPhase === 'INTERVAL_PAUSED') {
            // Se está no intervalo de pausa, sintoniza na hora e recomeça o ciclo de áudio de 1:12:500
            arcadeAudioEngine.start();
            setIsPlaying(true);
            setLoopPhase('PLAYING');
            phaseStartRef.current = Date.now();
            setRemainingMs(INTERVAL_MS);
            localStorage.removeItem('baeff1_radio_off');
        } else {
            // Se está IDLE (desligado), inicia o áudio e o ciclo de 1:12:500
            arcadeAudioEngine.start();
            setIsPlaying(true);
            setLoopPhase('PLAYING');
            phaseStartRef.current = Date.now();
            setRemainingMs(INTERVAL_MS);
            localStorage.removeItem('baeff1_radio_off');
        }
    };

    const restartCurrentPhase = () => {
        phaseStartRef.current = Date.now();
        setRemainingMs(INTERVAL_MS);
        if (loopPhase === 'INTERVAL_PAUSED' || loopPhase === 'IDLE') {
            arcadeAudioEngine.start();
            setIsPlaying(true);
            setLoopPhase('PLAYING');
            localStorage.removeItem('baeff1_radio_off');
        }
    };

    const toggleMute = () => {
        const next = !isMuted;
        setIsMuted(next);
        arcadeAudioEngine.setMute(next);
        localStorage.setItem('baeff1_radio_muted', String(next));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setVolume(val);
        arcadeAudioEngine.setVolume(val / 100);
        localStorage.setItem('baeff1_radio_volume', String(val));
        if (isMuted && val > 0) {
            setIsMuted(false);
            arcadeAudioEngine.setMute(false);
            localStorage.setItem('baeff1_radio_muted', 'false');
        }
    };

    if (isInviteRoute) {
        return null;
    }

    const progressPct = Math.min(100, Math.max(0, ((INTERVAL_MS - remainingMs) / INTERVAL_MS) * 100));

    return (
        <aside 
            aria-label="Rádio do Pitwall"
            className="fixed bottom-4 right-4 z-50 font-mono select-none"
        >
            {/* CARD EXPANDIDO */}
            {isExpanded && (
                <div className="mb-2 w-84 bg-black/95 border-2 border-[#fbaa19]/60 rounded-sm p-4 shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-md animate-fade-in text-white">
                    {/* Header do Player */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                            <RadioTower className={`w-4 h-4 ${isPlaying ? 'text-[#fbaa19] animate-pulse' : 'text-white/40'}`} />
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#fbaa19]">
                                BAEFF1 PADDOCK FM // 88.4 MHz
                            </span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-white/40 hover:text-white transition-colors p-1 cursor-pointer"
                            title="Recolher player"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Faixa Atual & Telemetria do Timer 1:12:500 */}
                    <div className="p-3 rounded bg-white/[0.03] border border-white/10 mb-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider">
                            <span className="text-white/40">STATUS DA TRANSMISSÃO</span>
                            <span className={`font-bold flex items-center gap-1 ${
                                loopPhase === 'PLAYING' 
                                    ? 'text-emerald-400' 
                                    : loopPhase === 'INTERVAL_PAUSED' 
                                    ? 'text-[#fbaa19] animate-pulse' 
                                    : 'text-white/30'
                            }`}>
                                {loopPhase === 'PLAYING' && '● NO AR (TOCANDO)'}
                                {loopPhase === 'INTERVAL_PAUSED' && '⏸ EM INTERVALO FIXO'}
                                {loopPhase === 'IDLE' && '○ DESATIVADO'}
                            </span>
                        </div>

                        <div className="text-xs font-black text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                            <Disc className={`w-3.5 h-3.5 text-[#fbaa19] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                            <span>TAPE 01: PITWALL SUSPENSE (80s)</span>
                        </div>

                        {/* Monitor do Ciclo 1:12:500 */}
                        <div className="bg-black/60 border border-[#fbaa19]/30 rounded p-2 flex flex-col gap-1.5 mt-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-white/50 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#fbaa19]" />
                                    <span>INTERVALO FIXO:</span>
                                </span>
                                <span className="font-mono font-bold text-[#fbaa19]">
                                    1:12:500 (72.5s)
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-white/70">
                                    {loopPhase === 'PLAYING' ? 'RESTA DE ÁUDIO:' : loopPhase === 'INTERVAL_PAUSED' ? 'RETOMA EM:' : 'CICLO PRONTO:'}
                                </span>
                                <span className="font-black tracking-wider text-white bg-white/10 px-1.5 py-0.5 rounded">
                                    {formatLapTimer(remainingMs)}
                                </span>
                            </div>

                            {/* Barra de Progresso do Intervalo */}
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
                                <div 
                                    className={`h-full transition-all duration-100 ${
                                        loopPhase === 'PLAYING' ? 'bg-emerald-400' : 'bg-[#fbaa19]'
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>

                            <p className="text-[9px] text-white/40 italic leading-tight mt-0.5">
                                Toca por 1:12:500, pausa por 1:12:500 e retoma automaticamente em loop.
                            </p>
                        </div>
                    </div>

                    {/* Controles de Volume & Mute */}
                    <div className="flex items-center justify-between gap-3 mb-3 bg-black/40 p-2 rounded border border-white/5">
                        <button
                            onClick={toggleMute}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                                isMuted ? 'text-rose-400 bg-rose-950/40' : 'text-white/80 hover:text-white'
                            }`}
                            title={isMuted ? 'Desmutar' : 'Mutar'}
                        >
                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#fbaa19]"
                            />
                            <span className="text-[9px] text-white/40 font-mono w-6 text-right">
                                {isMuted ? '0%' : `${volume}%`}
                            </span>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col gap-2">
                        {/* Botão de Ligar / Desligar Completo */}
                        <button
                            onClick={togglePlay}
                            className={`w-full py-2.5 rounded text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                loopPhase === 'PLAYING'
                                    ? 'bg-white/10 hover:bg-rose-950/60 text-white hover:text-rose-400 border border-white/20 hover:border-rose-500/50'
                                    : 'bg-[#fbaa19] hover:bg-white text-black shadow-[0_0_15px_rgba(251,170,25,0.3)]'
                            }`}
                        >
                            {loopPhase === 'PLAYING' ? (
                                <>
                                    <Pause className="w-3.5 h-3.5" />
                                    <span>DESLIGAR RÁDIO [OFF]</span>
                                </>
                            ) : loopPhase === 'INTERVAL_PAUSED' ? (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-black" />
                                    <span>PULAR PAUSA & TOCAR AGORA</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-black" />
                                    <span>SINTONIZAR RÁDIO [1:12:500]</span>
                                </>
                            )}
                        </button>

                        {/* Botão para Reiniciar Ciclo */}
                        {loopPhase !== 'IDLE' && (
                            <button
                                onClick={restartCurrentPhase}
                                className="w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3 text-[#fbaa19]" />
                                <span>REINICIAR VOLTA 1:12:500</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* PÍLULA FLUTUANTE FIXA DISCRETA (SEMPRE VISÍVEL NOS DOIS DASHBOARDS) */}
            <div className="relative group/pill overflow-hidden flex items-center gap-2 bg-black/95 border border-[#fbaa19]/50 hover:border-[#fbaa19] rounded-full p-1.5 pr-3 shadow-[0_0_20px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all">
                {/* Linha de Progresso Sutil no fundo inferior da pílula */}
                {loopPhase !== 'IDLE' && (
                    <div 
                        className={`absolute bottom-0 left-0 h-[2px] transition-all duration-100 ${
                            loopPhase === 'PLAYING' ? 'bg-emerald-400' : 'bg-[#fbaa19]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                    />
                )}

                {/* Botão Play / Pause Direto */}
                <button
                    onClick={togglePlay}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        loopPhase === 'PLAYING'
                            ? 'bg-[#fbaa19] text-black shadow-[0_0_10px_rgba(251,170,25,0.4)]' 
                            : loopPhase === 'INTERVAL_PAUSED'
                            ? 'bg-[#fbaa19]/20 text-[#fbaa19] border border-[#fbaa19] animate-pulse'
                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                    }`}
                    title={
                        loopPhase === 'PLAYING'
                            ? 'Pausar rádio' 
                            : loopPhase === 'INTERVAL_PAUSED'
                            ? 'Pular pausa e tocar imediatamente'
                            : 'Sintonizar rádio em ciclo 1:12:500'
                    }
                >
                    {loopPhase === 'PLAYING' ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                    ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    )}
                </button>

                {/* Equalizador Visualizador de LEDs */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 cursor-pointer group shrink-0"
                    title="Clique para abrir os controles do rádio"
                >
                    <div className="flex items-end gap-0.5 h-4 w-7 px-0.5">
                        {eqLevels.map((lvl, idx) => (
                            <span
                                key={idx}
                                className={`w-1 rounded-t-sm transition-all duration-100 ${
                                    isPlaying && !isMuted 
                                        ? idx === 3 ? 'bg-red-500' : idx === 2 ? 'bg-[#fbaa19]' : 'bg-emerald-400'
                                        : 'bg-white/20'
                                }`}
                                style={{ height: `${lvl}%` }}
                            />
                        ))}
                    </div>

                    {/* Texto com Timer 1:12:500 */}
                    <div className="flex flex-col min-w-[88px]">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black tracking-wider text-[#fbaa19] uppercase group-hover:text-white transition-colors">
                                {loopPhase === 'PLAYING' ? 'PADDOCK FM' : loopPhase === 'INTERVAL_PAUSED' ? 'INTERVALO' : 'RÁDIO OFF'}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                loopPhase === 'PLAYING' 
                                    ? 'bg-emerald-400 animate-pulse' 
                                    : loopPhase === 'INTERVAL_PAUSED' 
                                    ? 'bg-[#fbaa19] animate-ping' 
                                    : 'bg-white/30'
                            }`} />
                        </div>
                        <span className="text-[8px] font-mono font-bold text-white/70 tracking-wider">
                            ⏱ {formatLapTimer(remainingMs)}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="text-white/40 hover:text-white transition-colors ml-0.5"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                </div>

                {/* Botão Rápido de Mute / Unmute */}
                <button
                    onClick={toggleMute}
                    className={`ml-0.5 p-1 rounded-full text-white/50 hover:text-white transition-colors shrink-0 ${
                        isMuted ? 'text-rose-400' : ''
                    }`}
                    title={isMuted ? 'Desmutar' : 'Mutar'}
                >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
            </div>
        </aside>
    );
}
