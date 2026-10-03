"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  RotateCcw, 
  Power, 
  ShieldCheck, 
  Terminal, 
  Zap, 
  Disc, 
  Layers,
  Crosshair,
  TrendingUp,
  Cpu,
  Flame,
  Radio
} from 'lucide-react';

class PitWallSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKeyClick(char = 'a') {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const code = char.charCodeAt(0) || 65;
      const freq = 380 + (code % 28) * 14;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.022, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.028);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (_) {}
  }

  playBeep(freq = 640, duration = 0.06, wave = 'square', gainLevel = 0.04) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  playRadioChirp() {
    if (!this.enabled || !this.ctx) return;
    this.playBeep(880, 0.03, 'sine', 0.035);
    setTimeout(() => this.playBeep(1320, 0.045, 'sine', 0.03), 40);
  }

  playDegauss() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.76);
    } catch (_) {}
  }
}

const retroSound = new PitWallSoundEngine();

const ENGINE_FACTIONS = {
  A: {
    id: 'A',
    badge: 'CONSORCIO A',
    title: 'O Consórcio da Estrela (Bloco Mercedes)',
    sub: 'Engenharia Analítica, Confiabilidade de Aço & Domínio de Frota',
    engineSpec: 'Mercedes High Performance Powertrains 1.6L Hybrid (350kW MGU-K)',
    garages: [
      { name: 'Mercedes-AMG Petronas F1 Team', role: 'Fábrica Titular' },
      { name: 'McLaren Formula 1 Team', role: 'Cliente de Ponta' },
      { name: 'Alpine F1 Team', role: 'Nova Cliente 2026' },
      { name: 'Williams Racing', role: 'Parceira de Longa Data' }
    ],
    fantasyPerk: 'BÔNUS DE CONSISTÊNCIA: +15% de XP em previsões de bandeiras quadriculadas duplas e pit stops sincronizados.',
    loreQuote: '"A telemetria não mente. Quatro garagens alimentam o mesmo algoritmo. Quem erra aqui não perde corrida, perde a cadeira."',
    directorResponse: '“Excelente cálculo. Você escolheu a maior bancada de testes da Fórmula 1. 4 carros de fábrica e clientes cruzando telemetria em tempo real. Seus relatórios de previsão alimentarão a sala de operações de Brackley e Brixworth. Precisão alemã é o mínimo exigido.”'
  },
  B: {
    id: 'B',
    badge: 'CONSORCIO B',
    title: 'A Dinastia de Maranello (Bloco Ferrari)',
    sub: 'Pressão Visceral, Potência de Pico & A Frente Americana',
    engineSpec: 'Scuderia Ferrari 067/3 Hybrid E-Turbo Architecture',
    garages: [
      { name: 'Scuderia Ferrari HP', role: 'Fábrica de Maranello' },
      { name: 'Haas F1 Team', role: 'Parceira Satélite' },
      { name: 'Cadillac F1 Team', role: 'Nova Estreante Americana 2026' }
    ],
    fantasyPerk: 'BÔNUS DE ÍMPETO: Pontuação dobrada em previsões arriscadas de pole position e voltas mais rápidas.',
    loreQuote: '"Aqui não existe empate técnico. Ou a sua previsão nos coloca no degrau mais alto em Monza, ou você está fora."',
    directorResponse: '“Você tem coragem. Entrar em Maranello e assumir as rédeas da Cadillac exige estômago de aço. Nossos motores entregam toda a potência que o novo regulamento permite, mas nossa tolerância para previsões covardes é zero. Faça a Itália comemorar.”'
  },
  C: {
    id: 'C',
    badge: 'CONSORCIO C',
    title: 'A Vanguarda dos Desafiantes (Ford, Honda & Audi)',
    sub: 'Risco Tecnológico Máximo, Projetos Proprietários & Ambição Sem Freio',
    engineSpec: 'Red Bull-Ford Powertrains / Honda HRC Works / Audi F1 PU',
    garages: [
      { name: 'Oracle Red Bull Racing', role: 'Red Bull Ford Powertrains' },
      { name: 'Visa Cash App RB', role: 'Irmã Técnica RB-Ford' },
      { name: 'Aston Martin Aramco', role: 'Fábrica Exclusiva Honda HRC' },
      { name: 'Audi Revolut F1 Team', role: 'Projeto 100% Fábrica Audi' }
    ],
    fantasyPerk: 'BÔNUS DE CAOS: +25% de prestígio ao acertar zebras de safety car, abandonos e ultrapassagens do pelotão intermediário.',
    loreQuote: '"O antigo reinado acabou. Nós projetamos nossos próprios motores para ditar o que a Fórmula 1 será pelos próximos dez anos."',
    directorResponse: '“Aposta audaciosa. Você ignorou a zona de conforto para se aliar às montadoras que vieram tomar o grid de assalto. Red Bull com a Ford, a Honda furiosa na Aston e a Audi chegando com tudo. O risco de quebra mecânica é real, mas quem prevê o caos fatura o campeonato.”'
  }
};

function useTypewriter(fullText: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    setIsTyping(true);

    const timer = setInterval(() => {
      if (i < fullText.length) {
        const char = fullText.charAt(i);
        setDisplayed(prev => prev + char);
        if (char !== ' ') {
          retroSound.playKeyClick(char);
        }
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [fullText, speed]);

  const fastForward = () => {
    setDisplayed(fullText);
    setIsTyping(false);
  };

  return { displayed, isTyping, fastForward };
}

function PitWallTelemetryCanvas({ activePulse }: { activePulse: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frameId: number;
    let t = 0;

    const draw = () => {
      t++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#080602';
      ctx.fillRect(0, 0, w, h);

      // CRT Grid
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Telemetry Wave (50% ICE + 50% MGU-K Hybrid Power Pulse)
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const waveWidth = w - 24;
      for (let x = 0; x < waveWidth; x += 3) {
        const speed = activePulse ? 0.08 : 0.035;
        const amp = activePulse ? 20 : 11;
        const wave = Math.sin((x * 0.04) + (t * speed)) * amp +
                     Math.cos((x * 0.012) - (t * 0.02)) * 6;
        const y = (h * 0.32) + wave;
        if (x === 0) ctx.moveTo(12 + x, y);
        else ctx.lineTo(12 + x, y);
      }
      ctx.stroke();

      // Pixelated 2026 Active Aero Monoposto Silhouette
      const carX = Math.floor(w / 2);
      const carY = Math.floor(h * 0.78);

      ctx.fillStyle = '#ffc300';
      // Front wing endplates & nose
      ctx.fillRect(carX - 115, carY + 8, 32, 4);
      ctx.fillRect(carX - 100, carY + 3, 16, 5);
      ctx.fillRect(carX - 84, carY + 1, 75, 8);
      // Halo & Driver Helmet
      ctx.fillRect(carX - 28, carY - 9, 22, 10);
      ctx.fillRect(carX - 18, carY - 6, 8, 6);
      // Sidepods & Airbox
      ctx.fillRect(carX - 12, carY - 3, 62, 12);
      ctx.fillRect(carX - 10, carY - 15, 18, 12);
      // Rear Active Wing (2026 low-drag mode)
      ctx.fillRect(carX + 54, carY - 18, 26, 6);
      ctx.fillRect(carX + 68, carY - 12, 6, 21);
      ctx.fillRect(carX + 44, carY + 7, 38, 4);

      // Pirelli 18" pixel tires
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(carX - 78, carY - 5, 20, 20);
      ctx.fillRect(carX + 38, carY - 7, 24, 23);

      // Blinking MGU-K Energy Recovery Diode
      const ledGlow = (Math.sin(t * 0.12) + 1) / 2;
      ctx.fillStyle = `rgba(255, 240, 150, ${0.4 + ledGlow * 0.6})`;
      ctx.fillRect(carX - 82, carY + 3, 4, 4);

      // Telemetry OSD Labels
      ctx.fillStyle = '#ffb703';
      ctx.font = '10px monospace';
      ctx.fillText('PU: 1.6L TURBO + 350kW MGU-K // 50-50 ENERGY SPLIT', 12, 16);
      ctx.fillText('PREDICTIVE BIAS: STOCHASTIC RACE MATRIX', 12, 28);
      ctx.fillText('ACTIVE AERO: Z-MODE ARMED', w - 190, 16);

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [activePulse]);

  return (
    <div className="relative border border-[#d49a00]/40 bg-[#080602] rounded overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={130} 
        className="w-full h-[120px] md:h-[135px] block image-pixelated"
      />
      <div className="absolute top-1 right-2 text-[9px] font-mono text-[#ffb703]/70 uppercase">
        ENCRYPTED-PADDOCK-LINK
      </div>
    </div>
  );
}

function FiaStartingLights({ onFinished }: { onFinished?: () => void }) {
  const [count, setCount] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= 5) {
        setCount(step);
        retroSound.playBeep(440, 0.08, 'sawtooth', 0.06);
      } else {
        clearInterval(interval);
        // Realistic FIA random light delay (0.8s - 1.6s)
        const delay = 850 + Math.random() * 700;
        setTimeout(() => {
          setLightsOut(true);
          retroSound.playBeep(880, 0.45, 'sawtooth', 0.1);
          if (onFinished) onFinished();
        }, delay);
      }
    }, 620);

    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div className="p-3 bg-black/90 border-2 border-[#ffb703]/50 rounded-lg flex flex-col items-center space-y-2">
      <div className="text-[10px] font-mono text-[#ffb703] uppercase tracking-widest">
        {lightsOut 
          ? '● LUZES APAGADAS // SUA TEMPORADA DE PREVISÕES COMEÇOU!' 
          : count > 0 
            ? `ALINHAMENTO DO GRID FIA 2026... [${count}/5 LUZES]` 
            : 'SINCRONIZANDO TELEMETRIA DO CIRCUITO...'}
      </div>
      <div className="flex space-x-2 md:space-x-4 p-2 bg-[#120f04] border border-[#ffb703]/30 rounded">
        {[1, 2, 3, 4, 5].map((index) => {
          const isRed = !lightsOut && index <= count;
          const isGreen = lightsOut;
          return (
            <div 
              key={index}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                isRed 
                  ? 'bg-red-600 border-red-300 shadow-[0_0_16px_#ff0033]' 
                  : isGreen 
                    ? 'bg-[#183a18] border-green-600 shadow-[0_0_10px_#22c55e]' 
                    : 'bg-[#220707] border-red-950 opacity-60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRed ? 'bg-white/80' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuperlicenseCard({ data, onReset }: { data: any, onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="border-2 border-[#ffc300] bg-[#120f04] p-5 rounded-lg shadow-[0_0_30px_rgba(255,195,0,0.25)] relative overflow-hidden">
        <div className="flex justify-between items-start border-b border-[#ffb703]/40 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ffb703] text-black font-black flex items-center justify-center text-sm font-mono rounded">
              F1
            </div>
            <div>
              <div className="text-xs font-mono text-[#ffb703] font-bold tracking-widest uppercase">
                FIA WORLD CHAMPIONSHIP 2026 // PADDOCK SHADOW-OPS
              </div>
              <div className="text-[10px] text-[#ffd000]/70 font-mono">
                CREDENCIAL DE ANALISTA DE PREVISÕES & ESTRATÉGIA
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 border border-[#22c55e] text-[#22c55e] text-[10px] font-mono rounded bg-black/60">
            HOMOLOGADO ●
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono mb-4">
          <div>
            <div className="text-[#8e7428] uppercase text-[10px]">CALLSIGN DO ANALISTA</div>
            <div className="text-[#ffe066] text-base font-bold tracking-wider">{data.callsign}</div>
          </div>
          <div>
            <div className="text-[#8e7428] uppercase text-[10px]">CANAL CRIPTOGRAFADO</div>
            <div className="text-[#ffb703] truncate">{data.email}</div>
          </div>
          <div>
            <div className="text-[#8e7428] uppercase text-[10px]">SINDICATO DE MOTORES ESCOLHIDO</div>
            <div className="text-[#ffd000] font-semibold">{data.faction.title}</div>
          </div>
          <div>
            <div className="text-[#8e7428] uppercase text-[10px]">CREDENCIAL OPERACIONAL</div>
            <div className="text-[#ffe066]">FIA-STRAT-{data.licenseId}</div>
          </div>
        </div>

        <div className="border-t border-[#ffb703]/30 pt-3">
          <div className="text-[10px] font-mono text-[#8e7428] uppercase mb-1.5">
            GARAGENS SOB SUA INFLUÊNCIA DE PREVISÃO:
          </div>
          <div className="flex flex-wrap gap-2">
            {data.faction.garages.map((g: any, i: number) => (
              <span key={i} className="text-[10px] font-mono bg-[#2a2007] text-[#ffe066] px-2 py-1 border border-[#ffb703]/30 rounded">
                {g.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#ffb703]/30 flex justify-between items-center text-[10px] font-mono">
          <span className="text-[#ffb703]/60 tracking-[0.25em]">|||| || ||||| |||| ||| ||||||| |||</span>
          <span className="text-[#ffb703]">STATUS: PREPARADO PARA O PRÓXIMO GP</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 px-4 border border-[#ffb703]/60 hover:bg-[#ffb703]/20 text-[#ffb703] font-mono text-xs flex items-center justify-center space-x-2 transition rounded"
        >
          <RotateCcw className="w-4 h-4" />
          <span>REINICIAR TERMINAL</span>
        </button>
        <button
          onClick={() => {
            retroSound.playRadioChirp();
            retroSound.playBeep(920, 0.1, 'square');
          }}
          className="flex-1 py-3 px-4 bg-[#ffb703] hover:bg-[#ffd000] text-black font-mono font-bold text-xs flex items-center justify-center space-x-2 transition rounded shadow-[0_0_15px_rgba(255,183,3,0.4)]"
        >
          <Zap className="w-4 h-4" />
          <span>ACESSAR MESA DE PREVISÕES DO GP</span>
        </button>
      </div>
    </div>
  );
}

export default function Invite4Page() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFactionId, setSelectedFactionId] = useState('A');
  const [callsign, setCallsign] = useState('');
  const [email, setEmail] = useState('');
  const [powerOn, setPowerOn] = useState(true);
  const [scanlinesActive, setScanlinesActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [degaussFlicker, setDegaussFlicker] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);

  const narrativeSteps: Record<number, string> = {
    1: "Sinal seguro estabelecido. O ano é 2026. A Fórmula 1 encerrou uma década de certezas e entrou em guerra aberta. Novo regulamento: 50% motor a combustão com combustível 100% sintético e 50% impulso elétrico bruto de 350kW. Não são mais apenas pilotos disputando curvas; é uma batalha de inteligência industrial, telemetria secreta e especulação de dados.",
    2: "Nosso jogo opera nas sombras do pit wall. Toda semana de corrida, você atua como Corretor de Probabilidades e Estrategista Fantasma. Suas previsões — quem faz a pole position, quem quebra o motor na relargada, a janela exata do safety car e os pódios improváveis — alimentam os números das montadoras. Previsões certeiras rendem pontos de telemetria, prestígio no paddock e fazem você subir na hierarquia secreta do grid.",
    3: "Mas no novo regulamento, ninguém joga neutro. Você precisa escolher a qual sindicato de motores vai jurar lealdade nesta temporada. Três blocos industriais dividem os 11 construtores do paddock. Onde você vai colocar seu cérebro e suas fichas?",
    4: "A garagem confirmou o recebimento da sua telemetria. Registre seu Call Sign oficial e canal de transmissão para selar sua superlicença de estrategista 2026."
  };

  const activeNarrative = narrativeSteps[currentStep] || "";
  const { displayed, isTyping, fastForward } = useTypewriter(activeNarrative, 20);

  const toggleSound = () => {
    retroSound.init();
    const next = !soundEnabled;
    retroSound.enabled = next;
    setSoundEnabled(next);
    if (next) retroSound.playBeep(700, 0.05);
  };

  const triggerDegauss = () => {
    retroSound.init();
    retroSound.playDegauss();
    setDegaussFlicker(true);
    setTimeout(() => setDegaussFlicker(false), 520);
  };

  const handleNextStep = (stepTarget: number | null = null) => {
    retroSound.init();
    retroSound.playRadioChirp();
    setCurrentStep(stepTarget || currentStep + 1);
  };

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim() || !email.trim()) return;

    retroSound.init();
    retroSound.playRadioChirp();
    setRegisteredData({
      callsign: callsign.trim().toUpperCase(),
      email: email.trim(),
      faction: ENGINE_FACTIONS[selectedFactionId as 'A' | 'B' | 'C'],
      licenseId: Math.floor(100000 + Math.random() * 900000)
    });
    setCurrentStep(5);
  };

  const handleReset = () => {
    retroSound.init();
    retroSound.playBeep(450, 0.08);
    setCallsign('');
    setEmail('');
    setSelectedFactionId('A');
    setRegisteredData(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-[#050401] text-[#ffb703] flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none">
      
      {/* Outer 2000s CRT Monitor Chassis */}
      <div className="w-full max-w-5xl bg-[#19160e] border-4 border-[#332b1a] rounded-2xl p-3 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative">
        
        {/* CRT Top Casing Ventilation Grille & Hardware Branding */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-[#ffb703] rounded-sm inline-block shadow-[0_0_8px_#ffb703]"></span>
            <span className="text-xs tracking-widest text-[#a88c3a] font-bold">
              MARELLI-TELEMETRY // MULTI-FEED TERMINAL CRT-2006
            </span>
          </div>
          <div className="hidden sm:flex space-x-1.5 opacity-40">
            <span className="w-8 h-1 bg-[#ffb703] rounded"></span>
            <span className="w-8 h-1 bg-[#ffb703] rounded"></span>
            <span className="w-8 h-1 bg-[#ffb703] rounded"></span>
          </div>
        </div>

        {/* Curved Glass CRT Screen */}
        <div className={`relative bg-[#090802] border-4 border-[#120e06] rounded-xl overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.98)] transition-opacity duration-300 ${
          powerOn ? 'opacity-100' : 'opacity-10'
        } ${degaussFlicker ? 'animate-pulse scale-[1.01] brightness-150' : ''}`}>
          
          {/* Scanlines Effect */}
          {scanlinesActive && (
            <div className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.48)_50%)] bg-[length:100%_4px] shadow-[inset_0_0_90px_rgba(0,0,0,0.95)]" />
          )}

          {/* Glass Glare */}
          <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-tr from-transparent via-[#ffb703]/[0.02] to-[#ffb703]/[0.06]" />

          {/* Internal Terminal Top Status Header */}
          <div className="bg-[#120f04] border-b-2 border-[#ffb703]/30 px-3 md:px-5 py-2.5 flex flex-wrap justify-between items-center text-xs relative z-20">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb703] animate-ping inline-block" />
              <span className="font-bold text-[#ffd000] tracking-wider">
                F1 2026 // GUERRA DOS MOTORES [ETAPA {currentStep}/5]
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center space-x-1.5 text-[10px] mt-1 sm:mt-0">
              {[
                { n: 1, label: 'LORE' },
                { n: 2, label: 'FANTASY/RPG' },
                { n: 3, label: 'SINDICATO' },
                { n: 4, label: 'CONTRATO' },
                { n: 5, label: 'GRID' }
              ].map((s) => (
                <span
                  key={s.n}
                  className={`px-1.5 py-0.5 rounded border transition-colors ${
                    s.n === currentStep
                      ? 'bg-[#ffb703] text-black border-[#ffb703] font-bold'
                      : s.n < currentStep
                        ? 'bg-[#291f06] text-[#ffd000] border-[#ffb703]/40'
                        : 'bg-black/60 text-[#7a6428] border-black'
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Screen Body Content */}
          <div className="p-4 sm:p-6 md:p-8 min-h-[470px] flex flex-col justify-between relative z-20">
            
            {/* Story Dialogue Section (Steps 1 to 4) */}
            {currentStep <= 4 && (
              <div className="space-y-4">
                <div className="border border-[#ffb703]/40 bg-[#100d03]/90 p-4 rounded-lg shadow-[0_0_15px_rgba(255,183,3,0.12)]">
                  <div className="flex justify-between items-center text-[10px] text-[#8e7428] uppercase border-b border-[#ffb703]/20 pb-1.5 mb-2.5">
                    <span className="flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#ffb703]" />
                      <span>CANAL CRIPTOGRAFADO // DIRETORIA DE OPERAÇÕES</span>
                    </span>
                    <span>BAUD: 57600 // SEC-01</span>
                  </div>

                  <div className="text-base sm:text-lg font-mono text-[#ffe066] leading-relaxed min-h-[70px]">
                    {displayed}
                    <span className="inline-block w-2.5 h-5 bg-[#ffc300] ml-1.5 animate-pulse align-middle" />
                  </div>

                  {isTyping && (
                    <div className="mt-2 text-right">
                      <button 
                        onClick={fastForward}
                        className="text-[10px] text-[#ffb703]/70 hover:text-[#ffe066] underline font-mono"
                      >
                        [PULAR DIGITAÇÃO &gt;&gt;]
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 1 Visual: Telemetry Canvas & Background Context */}
                {currentStep === 1 && (
                  <div className="space-y-2">
                    <PitWallTelemetryCanvas activePulse={false} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-2 border border-[#ffb703]/30 bg-black/60 rounded">
                        <span className="text-[#8e7428] block text-[9px]">ERA REGULATÓRIA</span>
                        <span className="text-[#ffe066] font-bold text-sm">2026 // HÍBRIDO 50/50</span>
                      </div>
                      <div className="p-2 border border-[#ffb703]/30 bg-black/60 rounded">
                        <span className="text-[#8e7428] block text-[9px]">POTÊNCIA DO MGU-K</span>
                        <span className="text-[#ffe066] font-bold text-sm">350 kW (~475 CV)</span>
                      </div>
                      <div className="p-2 border border-[#ffb703]/30 bg-black/60 rounded">
                        <span className="text-[#8e7428] block text-[9px]">COMBUSTÍVEL</span>
                        <span className="text-[#ffe066] font-bold text-sm">100% SUSTENTÁVEL</span>
                      </div>
                      <div className="p-2 border border-[#ffb703]/30 bg-black/60 rounded">
                        <span className="text-[#8e7428] block text-[9px]">AERODINÂMICA</span>
                        <span className="text-[#ffe066] font-bold text-sm">ATIVA (MODO X / Z)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Visual: RPG & Fantasy Mechanics Explainer */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 border border-[#ffb703]/30 bg-black/60 rounded space-y-1">
                      <div className="text-[#ffb703] font-bold flex items-center space-x-1.5">
                        <Crosshair className="w-4 h-4 text-[#ffe066]" />
                        <span>1. PREVISÕES DE GP</span>
                      </div>
                      <p className="text-[#ffd000]/80 text-[11px] leading-relaxed">
                        Defina suas previsões semanais: poles, pódios, deltas de voltas e primeira quebra de motor do domingo.
                      </p>
                    </div>

                    <div className="p-3 border border-[#ffb703]/30 bg-black/60 rounded space-y-1">
                      <div className="text-[#ffb703] font-bold flex items-center space-x-1.5">
                        <TrendingUp className="w-4 h-4 text-[#ffe066]" />
                        <span>2. PONTOS & TELEMETRIA</span>
                      </div>
                      <p className="text-[#ffd000]/80 text-[11px] leading-relaxed">
                        Acertos geram Pontos de Telemetria (TP) e sobem sua equipe no ranking mundial dos sindicatos de construtores.
                      </p>
                    </div>

                    <div className="p-3 border border-[#ffb703]/30 bg-black/60 rounded space-y-1">
                      <div className="text-[#ffb703] font-bold flex items-center space-x-1.5">
                        <Cpu className="w-4 h-4 text-[#ffe066]" />
                        <span>3. PROGRESSÃO DE RPG</span>
                      </div>
                      <p className="text-[#ffd000]/80 text-[11px] leading-relaxed">
                        Evolua sua patente no pit wall: de simples Analista Júnior a Diretor de Estratégia de Sombras.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Interactive Engine Faction Selection */}
            {currentStep === 3 && (
              <div className="space-y-4 my-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(ENGINE_FACTIONS).map((f) => {
                    const isSelected = selectedFactionId === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          retroSound.init();
                          retroSound.playBeep(720, 0.05);
                          setSelectedFactionId(f.id);
                        }}
                        className={`p-3.5 border-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-[#ffe066] bg-[#291f06] shadow-[0_0_22px_rgba(255,195,0,0.35)]' 
                            : 'border-[#ffb703]/30 bg-black/70 hover:border-[#ffb703]/70 hover:bg-[#181305]'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#ffb703] text-black rounded font-mono">
                              {f.badge}
                            </span>
                            <span className="text-[10px] text-[#ffb703]/60 font-mono">
                              {f.garages.length} CONSTRUTORES
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-[#ffe066] mb-1">
                            {f.title}
                          </h3>

                          <div className="text-[10px] text-[#8e7428] uppercase mb-2">
                            {f.engineSpec}
                          </div>

                          <div className="text-[10px] text-[#ffd000] border-y border-[#ffb703]/20 py-1.5 mb-2 space-y-0.5">
                            {f.garages.map((g, i) => (
                              <div key={i} className="truncate">▸ {g.name} <span className="text-[#8e7428]">({g.role})</span></div>
                            ))}
                          </div>

                          <div className="text-[11px] text-[#ffb703] bg-black/60 p-2 rounded border border-[#ffb703]/20 mb-2">
                            {f.fantasyPerk}
                          </div>

                          <p className="text-[10px] text-[#ffb703]/80 italic">
                            {f.loreQuote}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#ffb703]/20 text-center">
                          <span className={`text-[10px] font-mono tracking-wider ${
                            isSelected ? 'text-[#ffe066] font-bold' : 'text-[#8e7428]'
                          }`}>
                            {isSelected ? '● SINDICATO SELECIONADO' : '[CLIQUE PARA JURAR LEALDADE]'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Boss Response & Strategist Contract Form */}
            {currentStep === 4 && (
              <div className="space-y-4 my-2">
                <div className="p-3.5 border-l-4 border-[#ffc300] bg-[#1a1406] text-xs sm:text-sm text-[#ffe066] leading-relaxed rounded-r">
                  <div className="text-[10px] text-[#ffb703] font-bold tracking-widest uppercase mb-1 flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#ffe066] animate-pulse" />
                    <span>DESPACHO DA DIRETORIA TÉCNICA // {ENGINE_FACTIONS[selectedFactionId as 'A' | 'B' | 'C'].title}</span>
                  </div>
                  <div>{ENGINE_FACTIONS[selectedFactionId as 'A' | 'B' | 'C'].directorResponse}</div>
                </div>

                <form onSubmit={handleContractSubmit} className="border border-[#ffb703]/40 bg-black/80 p-4 rounded-lg space-y-3">
                  <div className="text-xs text-[#ffb703] font-bold uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#ffe066]" />
                    <span>REGISTRO DE SUPERLICENÇA DE ESTRATEGISTA FANTASY 2026</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#8e7428] uppercase text-[10px] mb-1">
                        CALLSIGN DE PIT WALL (APELIDO NO RANKING)
                      </label>
                      <input
                        type="text"
                        required
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value)}
                        placeholder="Ex: SENNA_SHADOW_91"
                        className="w-full bg-[#120e04] border border-[#ffb703]/50 px-3 py-2 text-[#ffe066] font-mono rounded focus:outline-none focus:border-[#ffe066]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8e7428] uppercase text-[10px] mb-1">
                        CANAL CRIPTOGRAFADO (SEU E-MAIL)
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="estrategista@paddock-ops.f1"
                        className="w-full bg-[#120e04] border border-[#ffb703]/50 px-3 py-2 text-[#ffe066] font-mono rounded focus:outline-none focus:border-[#ffe066]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#8e7428] pt-1">
                    <span>SINDICATO CONTRATADO: <strong className="text-[#ffe066]">{ENGINE_FACTIONS[selectedFactionId as 'A' | 'B' | 'C'].title}</strong></span>
                    <span>TEMPORADA: FIA-2026-FANTASY-PREDICTIONS</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#ffb703] hover:bg-[#ffd000] text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase rounded transition shadow-[0_0_15px_rgba(255,183,3,0.3)] active:translate-y-0.5"
                  >
                    [ ASSINAR CONTRATO & ARMAR O SISTEMA DE LARGADA ]
                  </button>
                </form>
              </div>
            )}

            {/* Step 5: Start Lights & Superlicense Paddock Pass */}
            {currentStep === 5 && registeredData && (
              <div className="space-y-4">
                <FiaStartingLights 
                  onFinished={() => {
                    // Lights out finished event
                  }} 
                />

                <SuperlicenseCard 
                  data={registeredData} 
                  onReset={handleReset} 
                />
              </div>
            )}

            {/* Stepper Bottom Controls (Steps 1, 2, 3) */}
            {currentStep < 4 && (
              <div className="pt-3 border-t border-[#ffb703]/20 flex flex-wrap justify-between items-center gap-2">
                <div className="text-[11px] text-[#8e7428]">
                  COMUNICAÇÃO SEGURA: AGUARDANDO DECISÃO DO ANALISTA
                </div>

                <div className="flex space-x-2">
                  {currentStep > 1 && (
                    <button
                      onClick={() => handleNextStep(currentStep - 1)}
                      className="px-3 py-1.5 border border-[#ffb703]/40 text-[#ffb703] text-xs hover:bg-[#ffb703]/20 rounded font-mono"
                    >
                      &lt; VOLTAR
                    </button>
                  )}

                  <button
                    onClick={() => handleNextStep()}
                    className="px-5 py-2 bg-[#ffb703] hover:bg-[#ffd000] text-black font-bold text-xs rounded font-mono flex items-center space-x-2 shadow-[0_0_12px_rgba(255,183,3,0.3)]"
                  >
                    <span>
                      {currentStep === 1 
                        ? '[ ENTENDER AS REGRAS DO JOGO ]' 
                        : currentStep === 2 
                          ? '[ ESCOLHER SINDICATO DE MOTORES ]' 
                          : '[ CONFIRMAR SINDICATO & EMITIR CONTRATO ]'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* CRT Lower Hardware Footer */}
          <div className="bg-[#120e04] border-t border-[#ffb703]/20 px-4 py-1.5 flex justify-between text-[10px] text-[#7a6428]">
            <span>BAUD: 57600 // CIPHER: AES-PIT-2026</span>
            <span className="hidden sm:inline">FORMULA 1 NEW ENGINE FORMULA COMPLIANT</span>
            <span className="text-[#ffb703]">SINAL: ATIVO</span>
          </div>

        </div>

        {/* Physical Monitor Bezel Controls (Y2K / 2000s Pit Wall Hardware) */}
        <div className="mt-4 pt-3 border-t border-[#332b1a] flex flex-wrap justify-between items-center px-3 text-xs gap-3">
          
          <div className="flex items-center space-x-2">
            <span className="text-base font-black tracking-tighter text-[#4a3f28]">M-MARELLI</span>
            <span className="text-[10px] text-[#7a673c]">TRINITRON PIT-DESK v2.6</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Degauss Button */}
            <button
              onClick={triggerDegauss}
              title="Degauss CRT Tube"
              className="px-2.5 py-1 bg-[#282215] hover:bg-[#3d3420] text-[#a88c3a] border border-[#443820] rounded text-[10px] font-mono active:translate-y-0.5 flex items-center space-x-1"
            >
              <Disc className="w-3 h-3 text-[#ffb703]" />
              <span className="hidden sm:inline">DEGAUSS</span>
            </button>

            {/* Scanlines Button */}
            <button
              onClick={() => setScanlinesActive(!scanlinesActive)}
              className="px-2.5 py-1 bg-[#282215] hover:bg-[#3d3420] text-[#a88c3a] border border-[#443820] rounded text-[10px] font-mono active:translate-y-0.5 flex items-center space-x-1"
            >
              <Layers className="w-3 h-3 text-[#ffb703]" />
              <span className="hidden sm:inline">SCANLINES:</span>
              <span className={scanlinesActive ? "text-green-400" : "text-red-400"}>
                {scanlinesActive ? "ON" : "OFF"}
              </span>
            </button>

            {/* Audio Button */}
            <button
              onClick={toggleSound}
              className="px-2.5 py-1 bg-[#282215] hover:bg-[#3d3420] text-[#a88c3a] border border-[#443820] rounded text-[10px] font-mono active:translate-y-0.5 flex items-center space-x-1"
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-green-400" /> : <VolumeX className="w-3 h-3 text-red-400" />}
              <span className="hidden sm:inline">AUDIO</span>
            </button>

            {/* Power Switch & Power LED */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#3a311d]">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                powerOn 
                  ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' 
                  : 'bg-red-950 border border-red-800'
              }`} />
              <button
                onClick={() => {
                  retroSound.init();
                  retroSound.playBeep(powerOn ? 220 : 660, 0.1);
                  setPowerOn(!powerOn);
                }}
                className="p-1.5 bg-[#2a2213] hover:bg-[#3d321c] border border-[#44371f] rounded text-[#a88c3a] active:translate-y-0.5"
                title="Ligar / Desligar Monitor"
              >
                <Power className="w-3.5 h-3.5 text-[#ffb703]" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
