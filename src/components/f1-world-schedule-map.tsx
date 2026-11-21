"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Flag, Clock, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Radio } from 'lucide-react';

export interface WorldRaceEvent {
    id: string;
    round: number;
    code: string; // Ex: #F1M101
    name: string;
    circuitName: string;
    city: string;
    country: string;
    raceDate: string;
    raceTimeLocal: string;
    qualiDate: string;
    qualiTimeLocal: string;
    // Posição percentual no World Map (0-100)
    mapX: number;
    mapY: number;
    status: 'past' | 'next' | 'future';
}

export const F1_2026_CALENDAR_MAP: WorldRaceEvent[] = [
    {
        id: 'r1',
        round: 1,
        code: '#F1M101',
        name: 'AUSTRALIAN GRAND PRIX',
        circuitName: 'MELBOURNE CIRCUIT',
        city: 'MELBOURNE',
        country: 'AUSTRÁLIA',
        raceDate: 'DE MARÇO 17',
        raceTimeLocal: '13:10 Local Time',
        qualiDate: '16 DE MARÇO',
        qualiTimeLocal: '13:00 Local Time',
        mapX: 86.8,
        mapY: 79.2,
        status: 'next',
    },
    {
        id: 'r2',
        round: 2,
        code: '#F1M102',
        name: 'CHINESE GRAND PRIX',
        circuitName: 'SHANGHAI INTERNATIONAL CIRCUIT',
        city: 'SHANGHAI',
        country: 'CHINA',
        raceDate: 'DE MARÇO 29',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '28 DE MARÇO',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 80.5,
        mapY: 42.5,
        status: 'future',
    },
    {
        id: 'r3',
        round: 3,
        code: '#F1M103',
        name: 'JAPANESE GRAND PRIX',
        circuitName: 'SUZUKA CIRCUIT',
        city: 'SUZUKA',
        country: 'JAPÃO',
        raceDate: 'DE ABRIL 05',
        raceTimeLocal: '14:00 Local Time',
        qualiDate: '04 DE ABRIL',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 86.2,
        mapY: 39.8,
        status: 'future',
    },
    {
        id: 'r4',
        round: 4,
        code: '#F1M104',
        name: 'BAHRAIN GRAND PRIX',
        circuitName: 'BAHRAIN INTERNATIONAL CIRCUIT',
        city: 'SAKHIR',
        country: 'BAHRAIN',
        raceDate: 'DE ABRIL 19',
        raceTimeLocal: '18:00 Local Time',
        qualiDate: '18 DE ABRIL',
        qualiTimeLocal: '19:00 Local Time',
        mapX: 61.2,
        mapY: 46.2,
        status: 'future',
    },
    {
        id: 'r5',
        round: 5,
        code: '#F1M105',
        name: 'SAUDI ARABIAN GRAND PRIX',
        circuitName: 'JEDDAH CORNICHE CIRCUIT',
        city: 'JEDDAH',
        country: 'ARÁBIA SAUDITA',
        raceDate: 'DE ABRIL 26',
        raceTimeLocal: '20:00 Local Time',
        qualiDate: '25 DE ABRIL',
        qualiTimeLocal: '20:00 Local Time',
        mapX: 59.8,
        mapY: 48.5,
        status: 'future',
    },
    {
        id: 'r6',
        round: 6,
        code: '#F1M106',
        name: 'MIAMI GRAND PRIX',
        circuitName: 'MIAMI INTERNATIONAL AUTODROME',
        city: 'MIAMI',
        country: 'ESTADOS UNIDOS',
        raceDate: 'DE MAIO 10',
        raceTimeLocal: '16:00 Local Time',
        qualiDate: '09 DE MAIO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 26.5,
        mapY: 44.8,
        status: 'future',
    },
    {
        id: 'r7',
        round: 7,
        code: '#F1M107',
        name: 'EMILIA ROMAGNA GRAND PRIX',
        circuitName: 'AUTODROMO ENZO E DINO FERRARI',
        city: 'IMOLA',
        country: 'ITÁLIA',
        raceDate: 'DE MAIO 24',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '23 DE MAIO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 52.8,
        mapY: 34.8,
        status: 'future',
    },
    {
        id: 'r8',
        round: 8,
        code: '#F1M108',
        name: 'MONACO GRAND PRIX',
        circuitName: 'CIRCUIT DE MONACO',
        city: 'MONTE CARLO',
        country: 'MÔNACO',
        raceDate: 'DE MAIO 31',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '30 DE MAIO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 51.5,
        mapY: 35.8,
        status: 'future',
    },
    {
        id: 'r9',
        round: 9,
        code: '#F1M109',
        name: 'SPANISH GRAND PRIX',
        circuitName: 'CIRCUIT DE BARCELONA-CATALUNYA',
        city: 'BARCELONA',
        country: 'ESPANHA',
        raceDate: 'DE JUNHO 14',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '13 DE JUNHO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 49.5,
        mapY: 37.2,
        status: 'future',
    },
    {
        id: 'r10',
        round: 10,
        code: '#F1M110',
        name: 'CANADIAN GRAND PRIX',
        circuitName: 'CIRCUIT GILLES VILLENEUVE',
        city: 'MONTREAL',
        country: 'CANADÁ',
        raceDate: 'DE JUNHO 28',
        raceTimeLocal: '14:00 Local Time',
        qualiDate: '27 DE JUNHO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 27.5,
        mapY: 33.2,
        status: 'future',
    },
    {
        id: 'r11',
        round: 11,
        code: '#F1M111',
        name: 'AUSTRIAN GRAND PRIX',
        circuitName: 'RED BULL RING',
        city: 'SPIELBERG',
        country: 'ÁUSTRIA',
        raceDate: 'DE JULHO 05',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '04 DE JULHO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 53.8,
        mapY: 33.8,
        status: 'future',
    },
    {
        id: 'r12',
        round: 12,
        code: '#F1M112',
        name: 'BRITISH GRAND PRIX',
        circuitName: 'SILVERSTONE CIRCUIT',
        city: 'SILVERSTONE',
        country: 'REINO UNIDO',
        raceDate: 'DE JULHO 19',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '18 DE JULHO',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 48.8,
        mapY: 30.5,
        status: 'future',
    },
    {
        id: 'r13',
        round: 13,
        code: '#F1M113',
        name: 'BELGIAN GRAND PRIX',
        circuitName: 'CIRCUIT DE SPA-FRANCORCHAMPS',
        city: 'SPA',
        country: 'BÉLGICA',
        raceDate: 'DE JULHO 26',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '25 DE JULHO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 51.0,
        mapY: 32.2,
        status: 'future',
    },
    {
        id: 'r14',
        round: 14,
        code: '#F1M114',
        name: 'HUNGARIAN GRAND PRIX',
        circuitName: 'HUNGARORING',
        city: 'BUDAPESTE',
        country: 'HUNGRIA',
        raceDate: 'DE AGOSTO 02',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '01 DE AGOSTO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 54.8,
        mapY: 34.0,
        status: 'future',
    },
    {
        id: 'r15',
        round: 15,
        code: '#F1M115',
        name: 'DUTCH GRAND PRIX',
        circuitName: 'CIRCUIT ZANDVOORT',
        city: 'ZANDVOORT',
        country: 'HOLANDA',
        raceDate: 'DE AGOSTO 30',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '29 DE AGOSTO',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 50.5,
        mapY: 31.5,
        status: 'future',
    },
    {
        id: 'r16',
        round: 16,
        code: '#F1M116',
        name: 'ITALIAN GRAND PRIX',
        circuitName: 'AUTODROMO NAZIONALE MONZA',
        city: 'MONZA',
        country: 'ITÁLIA',
        raceDate: 'DE SETEMBRO 06',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '05 DE SETEMBRO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 52.2,
        mapY: 34.2,
        status: 'future',
    },
    {
        id: 'r17',
        round: 17,
        code: '#F1M117',
        name: 'AZERBAIJAN GRAND PRIX',
        circuitName: 'BAKU CITY CIRCUIT',
        city: 'BAKU',
        country: 'AZERBAIJÃO',
        raceDate: 'DE SETEMBRO 20',
        raceTimeLocal: '15:00 Local Time',
        qualiDate: '19 DE SETEMBRO',
        qualiTimeLocal: '16:00 Local Time',
        mapX: 62.0,
        mapY: 36.8,
        status: 'future',
    },
    {
        id: 'r18',
        round: 18,
        code: '#F1M118',
        name: 'SINGAPORE GRAND PRIX',
        circuitName: 'MARINA BAY STREET CIRCUIT',
        city: 'MARINA BAY',
        country: 'SINGAPURA',
        raceDate: 'DE OUTUBRO 04',
        raceTimeLocal: '20:00 Local Time',
        qualiDate: '03 DE OUTUBRO',
        qualiTimeLocal: '21:00 Local Time',
        mapX: 77.2,
        mapY: 57.5,
        status: 'future',
    },
    {
        id: 'r19',
        round: 19,
        code: '#F1M119',
        name: 'UNITED STATES GRAND PRIX',
        circuitName: 'CIRCUIT OF THE AMERICAS',
        city: 'AUSTIN',
        country: 'ESTADOS UNIDOS',
        raceDate: 'DE OUTUBRO 18',
        raceTimeLocal: '14:00 Local Time',
        qualiDate: '17 DE OUTUBRO',
        qualiTimeLocal: '17:00 Local Time',
        mapX: 22.8,
        mapY: 43.0,
        status: 'future',
    },
    {
        id: 'r20',
        round: 20,
        code: '#F1M120',
        name: 'MEXICO CITY GRAND PRIX',
        circuitName: 'AUTÓDROMO HERMANOS RODRÍGUEZ',
        city: 'CIDADE DO MÉXICO',
        country: 'MÉXICO',
        raceDate: 'DE OUTUBRO 25',
        raceTimeLocal: '14:00 Local Time',
        qualiDate: '24 DE OUTUBRO',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 21.2,
        mapY: 47.5,
        status: 'future',
    },
    {
        id: 'r21',
        round: 21,
        code: '#F1M121',
        name: 'SÃO PAULO GRAND PRIX',
        circuitName: 'AUTÓDROMO DE INTERLAGOS',
        city: 'SÃO PAULO',
        country: 'BRASIL',
        raceDate: 'DE NOVEMBRO 08',
        raceTimeLocal: '14:00 Local Time',
        qualiDate: '07 DE NOVEMBRO',
        qualiTimeLocal: '15:00 Local Time',
        mapX: 35.2,
        mapY: 71.5,
        status: 'future',
    },
    {
        id: 'r22',
        round: 22,
        code: '#F1M122',
        name: 'LAS VEGAS GRAND PRIX',
        circuitName: 'LAS VEGAS STRIP CIRCUIT',
        city: 'LAS VEGAS',
        country: 'ESTADOS UNIDOS',
        raceDate: 'DE NOVEMBRO 21',
        raceTimeLocal: '22:00 Local Time',
        qualiDate: '20 DE NOVEMBRO',
        qualiTimeLocal: '23:00 Local Time',
        mapX: 19.5,
        mapY: 39.8,
        status: 'future',
    },
    {
        id: 'r23',
        round: 23,
        code: '#F1M123',
        name: 'QATAR GRAND PRIX',
        circuitName: 'LUSAIL INTERNATIONAL CIRCUIT',
        city: 'LUSAIL',
        country: 'QATAR',
        raceDate: 'DE NOVEMBRO 29',
        raceTimeLocal: '20:00 Local Time',
        qualiDate: '28 DE NOVEMBRO',
        qualiTimeLocal: '20:00 Local Time',
        mapX: 62.0,
        mapY: 46.8,
        status: 'future',
    },
    {
        id: 'r24',
        round: 24,
        code: '#F1M124',
        name: 'ABU DHABI GRAND PRIX',
        circuitName: 'YAS MARINA CIRCUIT',
        city: 'YAS MARINA',
        country: 'EMIRADOS ÁRABES',
        raceDate: 'DE DEZEMBRO 06',
        raceTimeLocal: '17:00 Local Time',
        qualiDate: '05 DE DEZEMBRO',
        qualiTimeLocal: '18:00 Local Time',
        mapX: 63.2,
        mapY: 47.5,
        status: 'future',
    },
];

interface F1WorldScheduleMapProps {
    onBack?: () => void;
    accentColor?: string;
}

export default function F1WorldScheduleMap({ onBack, accentColor = '#fbaa19' }: F1WorldScheduleMapProps) {
    const nextEvent = useMemo(() => {
        return F1_2026_CALENDAR_MAP.find(e => e.status === 'next') || F1_2026_CALENDAR_MAP[0];
    }, []);

    const [selectedEventId, setSelectedEventId] = useState<string>(nextEvent.id);

    const currentEvent = useMemo(() => {
        return F1_2026_CALENDAR_MAP.find(e => e.id === selectedEventId) || nextEvent;
    }, [selectedEventId, nextEvent]);

    const handleSelectPrev = () => {
        const idx = F1_2026_CALENDAR_MAP.findIndex(e => e.id === currentEvent.id);
        if (idx > 0) {
            setSelectedEventId(F1_2026_CALENDAR_MAP[idx - 1].id);
        } else {
            setSelectedEventId(F1_2026_CALENDAR_MAP[F1_2026_CALENDAR_MAP.length - 1].id);
        }
    };

    const handleSelectNext = () => {
        const idx = F1_2026_CALENDAR_MAP.findIndex(e => e.id === currentEvent.id);
        if (idx < F1_2026_CALENDAR_MAP.length - 1) {
            setSelectedEventId(F1_2026_CALENDAR_MAP[idx + 1].id);
        } else {
            setSelectedEventId(F1_2026_CALENDAR_MAP[0].id);
        }
    };

    return (
        <section className="relative w-full min-h-[640px] bg-[#000000] text-white font-mono rounded-[4px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-zinc-800">
            {/* TEXTURA DE BACKGROUND ESCURO (MICRO-GRADE CARBONO NOIR IDÊNTICA À IMAGEM) */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-45 z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1.2px 1.2px, rgba(255,255,255,0.16) 1.2px, transparent 0)',
                    backgroundSize: '14px 14px',
                }}
            />

            {/* HEADER COM BANNER "NEXT ON" NO CANTO SUPERIOR ESQUERDO (IDÊNTICO À IMAGEM DE REFERÊNCIA) */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex flex-col items-start gap-1 select-none">
                    {/* TAG "NEXT ON" VERDE BRILHANTE */}
                    <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-[#00ff66] uppercase">
                        NEXT ON
                    </span>

                    {/* CAIXA COM BORDA AMARELA GROSSA #F1M101 NOME DO CIRCUITO */}
                    <div className="border-[3px] border-[#ffb800] bg-black px-3.5 py-1 rounded-[2px] shadow-[0_0_30px_rgba(255,184,0,0.3)] flex items-center">
                        <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-[#ffb800] uppercase font-sans pr-3 border-r-[2.5px] border-[#ffb800]">
                            {currentEvent.code}
                        </span>
                        <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-[#ffb800] uppercase font-sans pl-3">
                            {currentEvent.circuitName}
                        </span>
                    </div>

                    {/* HORÁRIOS: RACE (VERDE) E QUALIFYING (VERMELHO) */}
                    <div className="flex flex-col gap-0.5 mt-1 font-bold text-xs sm:text-sm tracking-wide">
                        <p className="text-[#00ff66] font-sans font-bold">
                            Race {currentEvent.raceDate.replace('DE ', '')}, {currentEvent.raceTimeLocal}
                        </p>
                        <p className="text-[#ff3b30] font-sans font-bold">
                            Qualifying {currentEvent.qualiDate}, {currentEvent.qualiTimeLocal}
                        </p>
                    </div>
                </div>

                {/* CONTROLES RÁPIDOS DE NAVEGAÇÃO ENTRE GPS */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-black/85 p-1.5 rounded border border-white/10 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={handleSelectPrev}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-white/10 hover:border-[#ffb800] hover:text-[#ffb800] transition-all flex items-center gap-1 cursor-pointer bg-white/[0.03]"
                        title="Etapa Anterior"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ANTERIOR</span>
                    </button>
                    <span className="text-[10px] font-mono font-black text-amber-400 px-2">
                        R{currentEvent.round.toString().padStart(2, '0')}/24
                    </span>
                    <button
                        type="button"
                        onClick={handleSelectNext}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-white/10 hover:border-[#ffb800] hover:text-[#ffb800] transition-all flex items-center gap-1 cursor-pointer bg-white/[0.03]"
                        title="Próxima Etapa"
                    >
                        <span className="hidden sm:inline">PRÓXIMA</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="ml-2 px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            <span>VOLTAR</span>
                        </button>
                    )}
                </div>
            </div>

            {/* MOLDURA DO MAPA MUNDI CENTRAL COM BORDAS ARREDONDADAS SUAVES E FUNDO PRETO */}
            <div className="relative z-10 w-full flex-1 min-h-[460px] md:min-h-[520px] rounded-2xl md:rounded-3xl border border-zinc-700/60 bg-[#000000] overflow-hidden flex items-center justify-center shadow-[inset_0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.8)]">
                
                {/* SVG VETORIAL COMPLETO DO WORLD MAP COM CONTORNOS EM GLOW DOURADO/ÂMBAR */}
                <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-full object-contain select-none pointer-events-none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* FILTRO DE GLOW DOURADO NO CONTORNO DOS CONTINENTES (IDÊNTICO À IMAGEM) */}
                        <filter id="world-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feFlood floodColor="#fbaa19" floodOpacity="0.45" result="glowColor" />
                            <feComposite in="glowColor" in2="blur" operator="in" result="glowBlur" />
                            <feMerge>
                                <feMergeNode in="glowBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* GRADIENTE PARA A MASSA CONTINENTAL */}
                        <radialGradient id="land-gradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#0b0e14" />
                            <stop offset="85%" stopColor="#05070a" />
                            <stop offset="100%" stopColor="#000000" />
                        </radialGradient>
                    </defs>

                    {/* GRUPO DOS CONTINENTES COM TRAÇADO DOURADO COM GLOW */}
                    <g
                        fill="url(#land-gradient)"
                        stroke="#eab308"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter="url(#world-gold-glow)"
                        opacity="0.88"
                    >
                        {/* AMÉRICA DO NORTE (CANADÁ, ALASCA, EUA, GROENLÂNDIA, MÉXICO) */}
                        <path d="M 85,95 Q 120,60 170,55 Q 230,50 270,70 Q 290,95 270,120 Q 240,110 215,135 Q 245,150 280,140 Q 285,170 250,185 Q 275,200 240,230 Q 210,250 190,240 Q 180,265 170,240 Q 150,215 130,225 Q 110,180 85,170 Q 75,130 85,95 Z" />
                        {/* GROENLÂNDIA */}
                        <path d="M 320,40 Q 370,30 380,65 Q 360,95 315,80 Q 310,55 320,40 Z" />
                        {/* FLÓRIDA & CARIBE */}
                        <path d="M 235,210 Q 245,215 242,235 Q 230,230 235,210 Z" />

                        {/* AMÉRICA DO SUL (BRASIL, COLÔMBIA, PERU, CHILE, ARGENTINA) */}
                        <path d="M 260,265 Q 300,260 345,280 Q 380,310 365,360 Q 340,410 320,445 Q 305,430 300,380 Q 280,340 260,305 Q 250,280 260,265 Z" />

                        {/* EUROPA (REINO UNIDO, ESCANDINÁVIA, PENÍNSULA IBÉRICA, FRANÇA, ITÁLIA) */}
                        <path d="M 460,110 Q 480,90 515,95 Q 520,135 490,140 Q 470,165 440,175 Q 430,195 445,215 Q 475,225 500,205 Q 525,215 540,190 Q 525,165 540,145 Q 505,140 495,115 Z" />
                        {/* ILHAS BRITÂNICAS */}
                        <path d="M 450,130 Q 465,120 460,145 Q 445,155 450,130 Z" />

                        {/* ÁFRICA (MAGREBE, SAARA, GOLFO DA GUINÉ, ÁFRICA DO SUL, MADAGASCAR) */}
                        <path d="M 450,225 Q 520,210 565,245 Q 590,300 550,355 Q 530,410 495,415 Q 465,360 460,310 Q 430,285 450,225 Z" />
                        {/* MADAGASCAR */}
                        <path d="M 585,345 Q 600,340 595,380 Q 580,385 585,345 Z" />

                        {/* ÁSIA (RÚSSIA, SIBÉRIA, ORIENTE MÉDIO, ÍNDIA, CHINA, SUDESTE ASIÁTICO) */}
                        <path d="M 545,95 Q 650,70 780,85 Q 860,105 890,135 Q 850,165 805,170 Q 820,200 845,225 Q 815,260 770,250 Q 755,295 720,290 Q 700,260 670,240 Q 640,250 610,230 Q 575,170 555,145 Z" />
                        {/* JAPÃO */}
                        <path d="M 870,185 Q 890,195 875,225 Q 860,210 870,185 Z" />
                        {/* SUDESTE ASIÁTICO / INDONÉSIA */}
                        <path d="M 750,310 Q 790,305 825,320 Q 800,340 760,330 Z" />

                        {/* OCEANIA / AUSTRÁLIA & NOVA ZELÂNDIA */}
                        <path d="M 800,370 Q 870,350 910,385 Q 920,440 880,455 Q 830,460 795,420 Q 790,385 800,370 Z" />
                        {/* NOVA ZELÂNDIA */}
                        <path d="M 940,430 Q 955,425 948,460 Q 935,455 940,430 Z" />
                    </g>
                </svg>

                {/* OVERLAY DE MARCAÇÕES DOS GPS NO MAPA MUNDI */}
                <div className="absolute inset-0 pointer-events-auto">
                    {F1_2026_CALENDAR_MAP.map((race) => {
                        const isSelected = race.id === currentEvent.id;
                        const isNext = race.status === 'next';
                        const isPast = race.status === 'past';

                        return (
                            <div
                                key={race.id}
                                style={{
                                    left: `${race.mapX}%`,
                                    top: `${race.mapY}%`,
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                                onClick={() => setSelectedEventId(race.id)}
                            >
                                {/* PONTO / RADAR PING DO CIRCUITO */}
                                <div className="relative flex items-center justify-center">
                                    {isNext && (
                                        <span className="absolute w-7 h-7 rounded-full bg-[#fbaa19]/30 animate-ping pointer-events-none" />
                                    )}
                                    {isSelected && !isNext && (
                                        <span className="absolute w-5 h-5 rounded-full bg-white/20 animate-pulse pointer-events-none" />
                                    )}
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 shadow-md ${
                                            isNext
                                                ? 'bg-[#fbaa19] border-white scale-125 shadow-[0_0_12px_#fbaa19]'
                                                : isSelected
                                                    ? 'bg-white border-[#fbaa19] scale-110 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                                                    : isPast
                                                        ? 'bg-zinc-600 border-zinc-500 opacity-60'
                                                        : 'bg-zinc-300 border-zinc-700 opacity-80 group-hover:bg-[#fbaa19] group-hover:scale-125'
                                        }`}
                                    />
                                </div>

                                {/* PLAQUETA RETANGULAR IDÊNTICA À IMAGEM: "CIDADE PAÍS   DATA" */}
                                <div
                                    className={`absolute left-3.5 -top-3.5 whitespace-nowrap px-2.5 py-0.5 rounded-[2px] backdrop-blur-md transition-all duration-200 select-none flex items-center gap-2.5 border font-sans ${
                                        isNext
                                            ? 'bg-black/95 border-[#ffb800] text-[#ffb800] shadow-[0_0_20px_rgba(255,184,0,0.5)] z-30 scale-110 ring-1 ring-[#ffb800]/50'
                                            : isSelected
                                                ? 'bg-black/90 border-white text-white z-30 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                                                : 'bg-black/70 border-white/20 text-white/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] hover:bg-black/90 hover:border-white/60 hover:scale-105'
                                    }`}
                                >
                                    <span className="font-black italic text-[9.5px] sm:text-[10.5px] tracking-wider uppercase font-sans">
                                        {race.city} {race.country}
                                    </span>
                                    <span className={`font-bold italic text-[8.5px] sm:text-[9.5px] tracking-wide font-sans ${
                                        isNext ? 'text-[#ffb800]' : isSelected ? 'text-zinc-200' : 'text-zinc-300'
                                    }`}>
                                        {race.raceDate}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* STATUS BAR DISCRETA NO BOTTOM DO MAPA */}
                <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-zinc-500 pointer-events-none select-none">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>SISTEMA DE TELEMETRIA GLOBAL BAEFF1 · CALENDÁRIO 2026</span>
                    </span>
                    <span className="hidden sm:inline text-zinc-600">
                        LAT/LONG PROJECTION · 24 CIRCUITOS HOMOLOGADOS
                    </span>
                </div>
            </div>

            {/* RODAPÉ DO MÓDULO COM DETALHES ADICIONAIS DO GP SELECIONADO */}
            <div className="relative z-10 mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        CIRCUITO SELECIONADO:
                    </span>
                    <span className="font-black text-white uppercase text-xs sm:text-sm">
                        {currentEvent.circuitName} ({currentEvent.city}, {currentEvent.country})
                    </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#fbaa19]" />
                        <span>PRÓXIMO GP</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-300" />
                        <span>FUTUROS</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                        <span>PASSADOS</span>
                    </span>
                </div>
            </div>
        </section>
    );
}
