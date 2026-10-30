/**
 * BAEFF1 Arcade Noir // Suspense Audio Engine
 * 
 * Sintetizador procedural via Web Audio API com estética 80s Arcade Suspense / Cyberpunk Pitwall:
 * - Baixo arpejado sombrio em Ré Menor (D minor suspense arpeggio)
 * - Filtro Low-Pass analógico ressonante com varredura contínua
 * - Acordes de pad com modulação de chorus e reverberação vintage
 * - Pings de telemetria de radar / sonar a cada compasso
 * - Ruído de fita cassete / estática de rádio analógico
 * 
 * Funciona nativamente sem dependências externas e não quebra por links quebrados.
 */

class ArcadeSuspenseSynth {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private filterNode: BiquadFilterNode | null = null;
    private isRunning: boolean = false;
    private noiseNode: AudioBufferSourceNode | null = null;
    private tempo: number = 108; // BPM de suspense estilo OutRun / Kavinsky
    private currentStep: number = 0;
    private timerId: number | null = null;
    private volume: number = 0.35; // Volume padrão confortável
    private isMuted: boolean = false;

    // Escala de Suspense em Ré Menor (D2, F2, A2, D3, C3, Bb2, A2, G2)
    private basslineNotes: number[] = [
        73.42,  // D2
        73.42,  // D2
        87.31,  // F2
        73.42,  // D2
        110.00, // A2
        73.42,  // D2
        116.54, // Bb2
        110.00, // A2
        73.42,  // D2
        73.42,  // D2
        130.81, // C3
        116.54, // Bb2
        110.00, // A2
        98.00,  // G2
        87.31,  // F2
        73.42   // D2
    ];

    // Acordes de suspense (Pads)
    private padChords: number[][] = [
        [146.83, 174.61, 220.00], // Dm (D3, F3, A3)
        [116.54, 146.83, 174.61], // Bb (Bb2, D3, F3)
        [130.81, 164.81, 196.00], // C  (C3, E3, G3)
        [110.00, 138.59, 164.81]  // A  (A2, C#3, E3)
    ];

    public init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public start() {
        this.init();
        if (!this.ctx || this.isRunning) return;

        try {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

            // Filtro Low-Pass estilo sintetizador analógico dos anos 80
            this.filterNode = this.ctx.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
            this.filterNode.Q.setValueAtTime(4.5, this.ctx.currentTime);

            this.filterNode.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.isRunning = true;
            this.currentStep = 0;

            // Inicia o gerador de ruído de fita / rádio
            this.startTapeHiss();

            // Inicia o sequencer rítmico de suspense
            const stepDurationMs = (60 / this.tempo / 4) * 1000;
            this.timerId = window.setInterval(() => this.tick(), stepDurationMs);
        } catch (e) {
            console.warn('Erro ao iniciar Arcade Suspense Synth:', e);
        }
    }

    public stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        if (this.noiseNode) {
            try {
                this.noiseNode.stop();
                this.noiseNode.disconnect();
            } catch (_) {}
            this.noiseNode = null;
        }
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
            } catch (_) {}
        }
        this.isRunning = false;
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    public getVolume(): number {
        return this.volume;
    }

    public setMute(muted: boolean) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
        }
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }

    public getIsPlaying(): boolean {
        return this.isRunning;
    }

    private tick() {
        if (!this.ctx || !this.filterNode || !this.isRunning) return;

        const now = this.ctx.currentTime;
        const step = this.currentStep % 16;
        const barStep = Math.floor(this.currentStep / 16) % 4;

        // Modulação suave do filtro para dar sensação de suspense contínuo
        const cutoffFreq = 380 + Math.sin(this.currentStep * 0.08) * 220;
        this.filterNode.frequency.setValueAtTime(cutoffFreq, now);

        // 1. Toca a nota de baixo no arpeggio
        const noteFreq = this.basslineNotes[step];
        this.playBassNote(noteFreq, now);

        // 2. A cada 16 passos (início do compasso), dispara acorde atmosférico
        if (step === 0) {
            const chord = this.padChords[barStep];
            this.playSuspenseChord(chord, now);
        }

        // 3. Telemetria / Radar Ping a cada 8 passos
        if (step === 8) {
            this.playRadarPing(now);
        }

        // 4. Bumbo eletrônico abafado (Kick Arcade) a cada 4 passos
        if (step % 4 === 0) {
            this.playSubKick(now);
        }

        this.currentStep++;
    }

    // Nota de baixo com corte rápido e ataque analógico
    private playBassNote(freq: number, time: number) {
        if (!this.ctx || !this.filterNode) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Envelope Punchy do Synthwave
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

        osc.connect(gain);
        gain.connect(this.filterNode);

        osc.start(time);
        osc.stop(time + 0.18);
    }

    // Acorde de pad misterioso e cavernoso
    private playSuspenseChord(frequencies: number[], time: number) {
        if (!this.ctx || !this.masterGain) return;

        frequencies.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            // Leve detune para efeito de coro
            osc.detune.setValueAtTime((idx - 1) * 7, time);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.06, time + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.8);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time);
            osc.stop(time + 4.0);
        });
    }

    // Ping sutil de radar no estilo telemetria militar / pitwall
    private playRadarPing(time: number) {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, time); // A6
        osc.frequency.exponentialRampToValueAtTime(880, time + 0.4);

        gain.gain.setValueAtTime(0.025, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    // Sub-kick abafado de 808
    private playSubKick(time: number) {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.2);

        gain.gain.setValueAtTime(0.28, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.28);
    }

    // Chiado de rádio e fita cassete analógica no fundo
    private startTapeHiss() {
        if (!this.ctx || !this.masterGain) return;

        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.008;
            }

            const noise = this.ctx.createBufferSource();
            this.noiseNode = noise;
            noise.buffer = buffer;
            noise.loop = true;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1200;
            noiseFilter.Q.value = 1.0;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.value = 0.02;

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);

            noise.start();
        } catch (_) {}
    }
}

// Instância única (Singleton) compartilhada por todo o sistema
export const arcadeAudioEngine = new ArcadeSuspenseSynth();
