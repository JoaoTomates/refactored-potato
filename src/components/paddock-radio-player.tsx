"use client";

import React, { useEffect, useState } from 'react';
import { arcadeAudioEngine } from '@/lib/arcade-audio-engine';

interface PaddockRadioPlayerProps {
    className?: string;
    teamColor?: string;
}

/**
 * Botão simples no estilo colchetes [ PLAY ] / [ PAUSE ],
 * posicionado diretamente no dashboard do usuário antes do botão [ SAIR ].
 * O áudio toca durante 30 segundos e pausa por 90 segundos em ciclo contínuo.
 */
export default function PaddockRadioPlayer({ className, teamColor }: PaddockRadioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [phase, setPhase] = useState<'PLAYING' | 'INTERVAL_PAUSED' | 'IDLE'>('IDLE');

    useEffect(() => {
        setIsPlaying(arcadeAudioEngine.getIsPlaying());
        setPhase(arcadeAudioEngine.getPhase());

        const unsubscribe = arcadeAudioEngine.subscribe(state => {
            setIsPlaying(state.isPlaying);
            setPhase(state.phase);
        });

        // Suporte a primeiro clique do usuário para desbloquear AudioContext se não estiver desligado explicitamente
        const handleFirstInteraction = () => {
            if (typeof window === 'undefined') return;
            let userOffVal = localStorage.getItem('ts1_radio_off');
            if (userOffVal === null) {
                const legacyVal = localStorage.getItem('baeff1_radio_off') ?? localStorage.getItem('voltgrid_radio_off');
                if (legacyVal !== null) {
                    userOffVal = legacyVal;
                    localStorage.setItem('ts1_radio_off', legacyVal);
                    localStorage.removeItem('baeff1_radio_off');
                    localStorage.removeItem('voltgrid_radio_off');
                }
            }
            const userOff = userOffVal === 'true';
            if (!userOff && !arcadeAudioEngine.getIsPlaying() && arcadeAudioEngine.getPhase() === 'IDLE') {
                arcadeAudioEngine.playManual();
            }
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };

        window.addEventListener('pointerdown', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);

        return () => {
            unsubscribe();
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    const handleClick = () => {
        arcadeAudioEngine.toggle();
    };

    const isAudioActive = isPlaying || phase === 'PLAYING';

    return (
        <button
            type="button"
            onClick={handleClick}
            title={
                isAudioActive 
                    ? "Pitwall Audio: Tocando (30s play / 90s pause) - Clique para pausar" 
                    : phase === 'INTERVAL_PAUSED'
                    ? "Pitwall Audio: Em intervalo de 90s - Clique para tocar agora"
                    : "Pitwall Audio: Pausado - Clique para tocar (30s play / 90s pause)"
            }
            className={
                className || 
                `transition-colors uppercase cursor-pointer font-mono tracking-wider text-[10px] md:text-xs select-none ${
                    isAudioActive 
                        ? 'text-[#fbaa19] hover:text-white font-bold' 
                        : 'text-white/40 hover:text-white'
                }`
            }
            style={isAudioActive && teamColor ? { color: teamColor } : undefined}
        >
            {isAudioActive ? '[ PAUSE ]' : '[ PLAY ]'}
        </button>
    );
}

export { PaddockRadioPlayer as DashboardAudioButton };
