"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    RadioTower
} from 'lucide-react';

export default function PaddockRadioPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(35);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Barras animadas do equalizador
    const [eqLevels, setEqLevels] = useState<number[]>([40, 70, 50, 85, 60]);

    // Carrega preferências do localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedMute = localStorage.getItem('voltgrid_radio_muted') === 'true';
        const savedVol = localStorage.getItem('voltgrid_radio_volume');
        const autoStartPref = localStorage.getItem('voltgrid_radio_autoplay_enabled');

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

        // Tenta iniciar suavemente no primeiro clique em qualquer lugar da tela caso autoplay não tenha sido bloqueado
        const handleFirstInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                // Se o usuário não desativou explicitamente antes, pode iniciar
                const userOff = localStorage.getItem('voltgrid_radio_off') === 'true';
                if (!userOff && !arcadeAudioEngine.getIsPlaying()) {
                    arcadeAudioEngine.start();
                    setIsPlaying(true);
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

    // Animação das barras do equalizador enquanto toca
    useEffect(() => {
        if (!isPlaying || isMuted) {
            setEqLevels([15, 15, 15, 15, 15]);
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
        if (isPlaying) {
            arcadeAudioEngine.stop();
            setIsPlaying(false);
            localStorage.setItem('voltgrid_radio_off', 'true');
        } else {
            arcadeAudioEngine.start();
            setIsPlaying(true);
            localStorage.removeItem('voltgrid_radio_off');
        }
    };

    const toggleMute = () => {
        const next = !isMuted;
        setIsMuted(next);
        arcadeAudioEngine.setMute(next);
        localStorage.setItem('voltgrid_radio_muted', String(next));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setVolume(val);
        arcadeAudioEngine.setVolume(val / 100);
        localStorage.setItem('voltgrid_radio_volume', String(val));
        if (isMuted && val > 0) {
            setIsMuted(false);
            arcadeAudioEngine.setMute(false);
            localStorage.setItem('voltgrid_radio_muted', 'false');
        }
    };

    return (
        <aside 
            aria-label="Rádio do Pitwall"
            className="fixed bottom-20 sm:bottom-4 right-4 z-50 font-mono select-none"
        >
            {/* CARD EXPANDIDO */}
            {isExpanded && (
                <div className="mb-2 w-80 bg-black/95 border-2 border-[#fbaa19]/60 rounded-sm p-4 shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-md animate-fade-in text-white">
                    {/* Header do Player */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                            <RadioTower className={`w-4 h-4 ${isPlaying ? 'text-[#fbaa19] animate-pulse' : 'text-white/40'}`} />
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#fbaa19]">
                                VOLTGRID PADDOCK FM // 88.4 MHz
                            </span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-white/40 hover:text-white transition-colors p-1"
                            title="Recolher player"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Faixa Atual / Lore Arcade */}
                    <div className="p-2.5 rounded bg-white/[0.03] border border-white/5 mb-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px] text-white/40 uppercase">
                            <span>TRANSMISSÃO AO VIVO</span>
                            <span className={isPlaying ? 'text-emerald-400 font-bold' : 'text-white/30'}>
                                {isPlaying ? '● NO AR' : '○ PAUSADO'}
                            </span>
                        </div>
                        <div className="text-xs font-black text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                            <Disc className={`w-3.5 h-3.5 text-[#fbaa19] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                            <span>TAPE 01: PITWALL SUSPENSE (80s ARCADE)</span>
                        </div>
                        <p className="text-[10px] text-white/50 italic">
                            Sintetizador analógico procedural em Ré Menor com telemetria e estática de rádio.
                        </p>
                    </div>

                    {/* Controles de Volume & Mute */}
                    <div className="flex items-center justify-between gap-3 mb-3 bg-black/40 p-2 rounded border border-white/5">
                        <button
                            onClick={toggleMute}
                            className={`p-1.5 rounded transition-colors ${
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

                    {/* Hook de Integração Futura (Rede Social / Spotify / WebRadio) */}
                    <div className="p-2 rounded bg-[#fbaa19]/10 border border-[#fbaa19]/20 flex items-start gap-2 mb-3 text-[10px]">
                        <Headphones className="w-3.5 h-3.5 text-[#fbaa19] shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-[#fbaa19] block uppercase">HUB DE ÁUDIO SOCIAL (EM BREVE):</span>
                            <span className="text-white/70 leading-tight block">
                                Conecte sua playlist do Spotify, WebRadio ou canais da sua equipe para ouvir enquanto navega pelo grid.
                            </span>
                        </div>
                    </div>

                    {/* Botão de Ligar / Desligar Completo */}
                    <button
                        onClick={togglePlay}
                        className={`w-full py-2.5 rounded text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isPlaying
                                ? 'bg-white/10 hover:bg-rose-950/60 text-white hover:text-rose-400 border border-white/20 hover:border-rose-500/50'
                                : 'bg-[#fbaa19] hover:bg-white text-black shadow-[0_0_15px_rgba(251,170,25,0.3)]'
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>DESLIGAR RÁDIO [OFF]</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 fill-black" />
                                <span>SINTONIZAR RÁDIO [ON]</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* PÍLULA FLUTUANTE DISCRETA (SEMPRE VISÍVEL) */}
            <div className="flex items-center gap-2 bg-black/95 border border-[#fbaa19]/40 hover:border-[#fbaa19] rounded-full p-1.5 pr-3 shadow-[0_0_20px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all">
                {/* Botão Play / Pause Direto */}
                <button
                    onClick={togglePlay}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isPlaying 
                            ? 'bg-[#fbaa19] text-black shadow-[0_0_10px_rgba(251,170,25,0.4)]' 
                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                    }`}
                    title={isPlaying ? 'Pausar áudio' : 'Tocar áudio de suspense'}
                >
                    {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                    ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-white/80" />
                    )}
                </button>

                {/* Equalizador Visualizador de LEDs */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 cursor-pointer group"
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

                    <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#fbaa19] uppercase group-hover:text-white transition-colors">
                            {isPlaying ? 'PADDOCK FM' : 'RÁDIO [OFF]'}
                        </span>
                        <span className="text-[7px] text-white/40 tracking-wider uppercase">
                            {isPlaying ? '88.4 MHz' : 'CLIQUE P/ TUNE'}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="text-white/40 hover:text-white transition-colors ml-1"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                </div>

                {/* Botão Rápido de Mute / Unmute */}
                <button
                    onClick={toggleMute}
                    className={`ml-1 p-1 rounded-full text-white/50 hover:text-white transition-colors ${
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
