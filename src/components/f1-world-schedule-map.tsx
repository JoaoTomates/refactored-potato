"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import worldLandData from "@/data/world-land-path.json";
import { ArrowLeft, Map, Globe, Grid } from "lucide-react";

/* ------------------------------------------------------------------
   TS1 · The Strategist One — Grand Prix Calendar & Tactical HUD Map
   High-definition GeoJSON coastline contours + Dot-Matrix hybrid map.
   24 rounds of the 2026 season with interactive pins and stage list.
------------------------------------------------------------------- */

export interface RaceStage {
    round: number;
    code: string;
    gp: string;
    circuit: string;
    city: string;
    country: string;
    lat: number;
    lon: number;
    race: string;
    quali: string;
    tz: string;
    laps: number;
    km: number;
    status: 'past' | 'next' | 'future';
}

export const F1_2026_STAGES: RaceStage[] = [
    { round: 1, code: "#TS101", gp: "Australian Grand Prix", circuit: "Albert Park Circuit", city: "Melbourne", country: "Australia", lat: -37.85, lon: 144.97, race: "2026-03-08T04:00:00Z", quali: "2026-03-07T05:00:00Z", tz: "Australia/Melbourne", laps: 58, km: 5.278, status: 'next' },
    { round: 2, code: "#TS102", gp: "Chinese Grand Prix", circuit: "Shanghai International Circuit", city: "Shanghai", country: "China", lat: 31.34, lon: 121.22, race: "2026-03-22T07:00:00Z", quali: "2026-03-21T07:00:00Z", tz: "Asia/Shanghai", laps: 56, km: 5.451, status: 'future' },
    { round: 3, code: "#TS103", gp: "Japanese Grand Prix", circuit: "Suzuka Circuit", city: "Suzuka", country: "Japan", lat: 34.84, lon: 136.54, race: "2026-04-05T05:00:00Z", quali: "2026-04-04T06:00:00Z", tz: "Asia/Tokyo", laps: 53, km: 5.807, status: 'future' },
    { round: 4, code: "#TS104", gp: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", city: "Sakhir", country: "Bahrain", lat: 26.03, lon: 50.51, race: "2026-04-19T15:00:00Z", quali: "2026-04-18T16:00:00Z", tz: "Asia/Bahrain", laps: 57, km: 5.412, status: 'future' },
    { round: 5, code: "#TS105", gp: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", city: "Jeddah", country: "Saudi Arabia", lat: 21.63, lon: 39.10, race: "2026-04-26T17:00:00Z", quali: "2026-04-25T17:00:00Z", tz: "Asia/Riyadh", laps: 50, km: 6.174, status: 'future' },
    { round: 6, code: "#TS106", gp: "Miami Grand Prix", circuit: "Miami International Autodrome", city: "Miami", country: "United States", lat: 25.96, lon: -80.24, race: "2026-05-10T20:00:00Z", quali: "2026-05-09T20:00:00Z", tz: "America/New_York", laps: 57, km: 5.412, status: 'future' },
    { round: 7, code: "#TS107", gp: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", city: "Imola", country: "Italy", lat: 44.34, lon: 11.72, race: "2026-05-24T13:00:00Z", quali: "2026-05-23T14:00:00Z", tz: "Europe/Rome", laps: 63, km: 4.909, status: 'future' },
    { round: 8, code: "#TS108", gp: "Monaco Grand Prix", circuit: "Circuit de Monaco", city: "Monte Carlo", country: "Monaco", lat: 43.74, lon: 7.42, race: "2026-06-07T13:00:00Z", quali: "2026-06-06T14:00:00Z", tz: "Europe/Monaco", laps: 78, km: 3.337, status: 'future' },
    { round: 9, code: "#TS109", gp: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", city: "Barcelona", country: "Spain", lat: 41.57, lon: 2.26, race: "2026-06-21T13:00:00Z", quali: "2026-06-20T14:00:00Z", tz: "Europe/Madrid", laps: 66, km: 4.657, status: 'future' },
    { round: 10, code: "#TS110", gp: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", city: "Montreal", country: "Canada", lat: 45.50, lon: -73.52, race: "2026-06-28T18:00:00Z", quali: "2026-06-27T20:00:00Z", tz: "America/Toronto", laps: 70, km: 4.361, status: 'future' },
    { round: 11, code: "#TS111", gp: "Austrian Grand Prix", circuit: "Red Bull Ring", city: "Spielberg", country: "Austria", lat: 47.22, lon: 14.76, race: "2026-07-12T13:00:00Z", quali: "2026-07-11T14:00:00Z", tz: "Europe/Vienna", laps: 71, km: 4.318, status: 'future' },
    { round: 12, code: "#TS112", gp: "British Grand Prix", circuit: "Silverstone Circuit", city: "Silverstone", country: "United Kingdom", lat: 52.08, lon: -1.02, race: "2026-07-26T14:00:00Z", quali: "2026-07-25T14:00:00Z", tz: "Europe/London", laps: 52, km: 5.891, status: 'future' },
    { round: 13, code: "#TS113", gp: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", city: "Spa", country: "Belgium", lat: 50.44, lon: 5.97, race: "2026-08-02T13:00:00Z", quali: "2026-08-01T14:00:00Z", tz: "Europe/Brussels", laps: 44, km: 7.004, status: 'future' },
    { round: 14, code: "#TS114", gp: "Hungarian Grand Prix", circuit: "Hungaroring", city: "Budapest", country: "Hungary", lat: 47.58, lon: 19.25, race: "2026-08-30T13:00:00Z", quali: "2026-08-29T14:00:00Z", tz: "Europe/Budapest", laps: 70, km: 4.381, status: 'future' },
    { round: 15, code: "#TS115", gp: "Dutch Grand Prix", circuit: "Circuit Zandvoort", city: "Zandvoort", country: "Netherlands", lat: 52.39, lon: 4.54, race: "2026-09-06T13:00:00Z", quali: "2026-09-05T14:00:00Z", tz: "Europe/Amsterdam", laps: 72, km: 4.259, status: 'future' },
    { round: 16, code: "#TS116", gp: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", city: "Monza", country: "Italy", lat: 45.62, lon: 9.28, race: "2026-09-13T13:00:00Z", quali: "2026-09-12T14:00:00Z", tz: "Europe/Rome", laps: 53, km: 5.793, status: 'future' },
    { round: 17, code: "#TS117", gp: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", city: "Baku", country: "Azerbaijan", lat: 40.37, lon: 49.85, race: "2026-09-27T11:00:00Z", quali: "2026-09-26T12:00:00Z", tz: "Asia/Baku", laps: 51, km: 6.003, status: 'future' },
    { round: 18, code: "#TS118", gp: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", city: "Singapore", country: "Singapore", lat: 1.29, lon: 103.86, race: "2026-10-11T12:00:00Z", quali: "2026-10-10T13:00:00Z", tz: "Asia/Singapore", laps: 62, km: 4.940, status: 'future' },
    { round: 19, code: "#TS119", gp: "United States Grand Prix", circuit: "Circuit of the Americas", city: "Austin", country: "United States", lat: 30.13, lon: -97.64, race: "2026-10-25T19:00:00Z", quali: "2026-10-24T22:00:00Z", tz: "America/Chicago", laps: 56, km: 5.513, status: 'future' },
    { round: 20, code: "#TS120", gp: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", city: "Mexico City", country: "Mexico", lat: 19.40, lon: -99.09, race: "2026-11-01T20:00:00Z", quali: "2026-10-31T21:00:00Z", tz: "America/Mexico_City", laps: 71, km: 4.304, status: 'future' },
    { round: 21, code: "#TS121", gp: "São Paulo Grand Prix", circuit: "Autódromo José Carlos Pace (Interlagos)", city: "São Paulo", country: "Brazil", lat: -23.70, lon: -46.70, race: "2026-11-15T17:00:00Z", quali: "2026-11-14T18:00:00Z", tz: "America/Sao_Paulo", laps: 71, km: 4.309, status: 'future' },
    { round: 22, code: "#TS122", gp: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", city: "Las Vegas", country: "United States", lat: 36.11, lon: -115.17, race: "2026-11-22T06:00:00Z", quali: "2026-11-21T06:00:00Z", tz: "America/Los_Angeles", laps: 50, km: 6.201, status: 'future' },
    { round: 23, code: "#TS123", gp: "Qatar Grand Prix", circuit: "Lusail International Circuit", city: "Lusail", country: "Qatar", lat: 25.49, lon: 51.45, race: "2026-11-29T17:00:00Z", quali: "2026-11-28T17:00:00Z", tz: "Asia/Qatar", laps: 57, km: 5.419, status: 'future' },
    { round: 24, code: "#TS124", gp: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.47, lon: 54.60, race: "2026-12-06T13:00:00Z", quali: "2026-12-05T14:00:00Z", tz: "Asia/Dubai", laps: 58, km: 5.281, status: 'future' },
];

/* Coarse continent polygons for the dot matrix calculation */
const LAND_POLYS = [
    [[-168, 66], [-140, 70], [-95, 72], [-80, 68], [-62, 58], [-55, 48], [-70, 42], [-76, 35], [-81, 25], [-97, 26], [-97, 18], [-88, 16], [-83, 9], [-78, 8], [-92, 14], [-106, 23], [-115, 30], [-124, 40], [-125, 49], [-140, 60], [-165, 60]],
    [[-55, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76]],
    [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-66, -46], [-70, -54], [-74, -45], [-72, -30], [-70, -18], [-81, -5]],
    [[-10, 36], [-9, 43], [-2, 48], [-5, 52], [5, 58], [10, 64], [20, 70], [40, 68], [70, 73], [110, 77], [140, 72], [180, 68], [170, 60], [160, 52], [140, 48], [130, 35], [122, 30], [120, 22], [108, 18], [104, 9], [98, 15], [92, 20], [80, 8], [72, 20], [58, 24], [56, 26], [50, 30], [44, 12], [36, 28], [34, 31], [27, 37], [12, 38], [0, 38]],
    [[-17, 21], [-6, 36], [10, 37], [32, 31], [43, 12], [51, 11], [40, -5], [40, -16], [32, -28], [20, -35], [12, -17], [8, 4], [-9, 5], [-17, 14]],
    [[114, -22], [130, -12], [142, -11], [153, -26], [147, -38], [135, -35], [115, -34]],
    [[-6, 50], [1, 51], [-2, 58], [-6, 57]],
    [[130, 32], [141, 36], [142, 44], [140, 41]],
];

const W = 1000, H = 500;
const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((80 - lat) / 140) * H;

const inside = (x: number, y: number, poly: number[][]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
};

const fmt = (iso: string, tz: string, o: Intl.DateTimeFormatOptions) => {
    try {
        return new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...o }).format(new Date(iso));
    } catch {
        return new Intl.DateTimeFormat("en-GB", o).format(new Date(iso));
    }
};
const day = (iso: string, tz: string) => fmt(iso, tz, { day: "numeric", month: "long" });
const hour = (iso: string, tz: string) => fmt(iso, tz, { hour: "2-digit", minute: "2-digit", hour12: false });
const pad = (n: number) => String(n).padStart(2, "0");

interface F1WorldScheduleMapProps {
    onBack?: () => void;
    accentColor?: string;
}

export default function F1WorldScheduleMap({ onBack, accentColor = '#FFD200' }: F1WorldScheduleMapProps) {
    const [sel, setSel] = useState<number>(F1_2026_STAGES[0].round);
    const [mapMode, setMapMode] = useState<'hybrid' | 'geojson' | 'dots'>('hybrid');
    const listRef = useRef<HTMLDivElement>(null);
    const r = useMemo(() => F1_2026_STAGES.find((x) => x.round === sel) || F1_2026_STAGES[0], [sel]);

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-round="${sel}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [sel]);

    // Precomputed dot matrix path for high performance
    const dotMatrixPath = useMemo(() => {
        let p = "";
        for (let lat = 78; lat > -58; lat -= 2.4) {
            for (let lon = -178; lon < 180; lon += 2.4) {
                if (LAND_POLYS.some((poly) => inside(lon, lat, poly))) {
                    p += `M${(px(lon)).toFixed(1)} ${(py(lat)).toFixed(1)}h1.5v1.5h-1.5z`;
                }
            }
        }
        return p;
    }, []);

    const flip = r.lon > 60 || r.lon < -90 ? "left" : "right";

    return (
        <main className="ts1">
            <style>{css}</style>

            {/* TOP BAR / NAVIGATION HEADER */}
            <div className="ts1-top-bar">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="ts1-back-btn"
                        title="Voltar ao Terminal"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>[ « VOLTAR AO TERMINAL ]</span>
                    </button>
                ) : (
                    <div className="ts1-badge-brand">
                        <span>BAEF1 // CALENDÁRIO TÁTICO GLOBAL</span>
                    </div>
                )}

                {/* MAP MODE SWITCHER: GEOJSON HD / HYBRID / DOT-MATRIX */}
                <div className="ts1-mode-switch">
                    <button
                        type="button"
                        onClick={() => setMapMode('hybrid')}
                        className={`ts1-mode-btn ${mapMode === 'hybrid' ? 'active' : ''}`}
                        title="GeoJSON HD + Matriz de Pontos"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        <span>HÍBRIDO HD</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapMode('geojson')}
                        className={`ts1-mode-btn ${mapMode === 'geojson' ? 'active' : ''}`}
                        title="Vetorial Puro GeoJSON"
                    >
                        <Map className="w-3.5 h-3.5" />
                        <span>GEOJSON VETOR</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapMode('dots')}
                        className={`ts1-mode-btn ${mapMode === 'dots' ? 'active' : ''}`}
                        title="Matriz de Pontos Clássica"
                    >
                        <Grid className="w-3.5 h-3.5" />
                        <span>DOT-MATRIX</span>
                    </button>
                </div>
            </div>

            {/* HEADER DINÂMICO DO EVENTO (IDÊNTICO AO SCHEDULE_MOK) */}
            <header className="ts1-head">
                <p className="ts1-next">
                    <span>Next on</span>
                </p>
                <h1 key={r.round}>
                    <i>#TS1{pad(r.round)}</i>
                    <b>{r.circuit.replace(/ \(.*\)/, "")}</b>
                </h1>
                <p className="ts1-race">Race · {day(r.race, r.tz)}, {hour(r.race, r.tz)} local time</p>
                <p className="ts1-quali">Qualifying · {day(r.quali, r.tz)}, {hour(r.quali, r.tz)} local time</p>
            </header>

            {/* SEÇÃO DO WORLD MAP COM CONTORNO DETALHADO GEOJSON E PINS */}
            <section className="ts1-map" aria-label="Race calendar map">
                <svg className="ts1-svg-map" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        {/* FILTRO GLOW DOURADO PARA OS CONTORNOS GEOJSON */}
                        <filter id="ts1-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feFlood floodColor="#FFD200" floodOpacity="0.45" result="glowColor" />
                            <feComposite in="glowColor" in2="blur" operator="in" result="glowBlur" />
                            <feMerge>
                                <feMergeNode in="glowBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <radialGradient id="ts1-land-grad" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stopColor="#18160e" />
                            <stop offset="90%" stopColor="#0d0c08" />
                            <stop offset="100%" stopColor="#050504" />
                        </radialGradient>
                    </defs>

                    {/* LINHAS SUTIS DE LATITUDE E LONGITUDE */}
                    <g className="ts1-gridlines" opacity="0.12">
                        <line x1="0" y1={py(0)} x2={W} y2={py(0)} stroke="#FFD200" strokeWidth="0.8" strokeDasharray="3 3" />
                        <line x1={px(0)} y1="0" x2={px(0)} y2={H} stroke="#FFD200" strokeWidth="0.8" strokeDasharray="3 3" />
                        <line x1="0" y1={py(45)} x2={W} y2={py(45)} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" />
                        <line x1="0" y1={py(-30)} x2={W} y2={py(-30)} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" />
                    </g>

                    {/* CAMADA VETORIAL GEOJSON DETALHADA COM CONTORNO LUMINOSO */}
                    {(mapMode === 'geojson' || mapMode === 'hybrid') && (
                        <path
                            d={worldLandData.path}
                            fill={mapMode === 'hybrid' ? "url(#ts1-land-grad)" : "#14130d"}
                            stroke="#FFD200"
                            strokeWidth={mapMode === 'hybrid' ? "0.9" : "1.1"}
                            strokeOpacity="0.85"
                            filter="url(#ts1-gold-glow)"
                            className="transition-all duration-300"
                        />
                    )}

                    {/* CAMADA DOT-MATRIX (MOCK CLÁSSICO) */}
                    {(mapMode === 'dots' || mapMode === 'hybrid') && (
                        <path
                            d={dotMatrixPath}
                            fill="#3a3524"
                            className="ts1-dots-path"
                            opacity={mapMode === 'hybrid' ? 0.7 : 1}
                        />
                    )}
                </svg>

                {/* PINS INTERATIVOS DAS 24 ETAPAS */}
                {F1_2026_STAGES.map((x) => (
                    <button
                        key={x.round}
                        className={"ts1-pin" + (x.round === sel ? " on" : "")}
                        style={{ left: `${(px(x.lon) / 10).toFixed(2)}%`, top: `${(py(x.lat) / 5).toFixed(2)}%` }}
                        onClick={() => setSel(x.round)}
                        aria-pressed={x.round === sel}
                        aria-label={`${x.gp}, round ${x.round}`}
                    >
                        <span className="ts1-pulse" />
                        <span className="ts1-tag">{x.city}</span>
                    </button>
                ))}

                {/* CARTÃO HUD FLUTUANTE DA ETAPA SELECIONADA */}
                <aside key={r.round} className={"ts1-card " + flip}>
                    <p className="ts1-card-gp">{r.gp}</p>
                    <p className="ts1-card-place">{r.city}, {r.country}</p>
                    <dl>
                        <div>
                            <dt>Race</dt>
                            <dd>{day(r.race, r.tz)}</dd>
                        </div>
                        <div>
                            <dt>Lights out</dt>
                            <dd>{hour(r.race, r.tz)}</dd>
                        </div>
                        <div>
                            <dt>Laps</dt>
                            <dd>{r.laps}</dd>
                        </div>
                        <div>
                            <dt>Length</dt>
                            <dd>{r.km.toFixed(3)} km</dd>
                        </div>
                    </dl>
                </aside>
            </section>

            {/* LISTA COMPLETA DAS ETAPAS (24 ROUNDS) SINCRONIZADA COM O MAPA */}
            <section className="ts1-list" ref={listRef} aria-label="Stages">
                {F1_2026_STAGES.map((x) => (
                    <button
                        key={x.round}
                        data-round={x.round}
                        className={"ts1-row" + (x.round === sel ? " on" : "")}
                        onClick={() => setSel(x.round)}
                        aria-pressed={x.round === sel}
                    >
                        <span className="n">{pad(x.round)}</span>
                        <span className="g">
                            <strong>{x.gp}</strong>
                            <small>{x.circuit}</small>
                        </span>
                        <span className="c">{x.country}</span>
                        <span className="d">{day(x.race, x.tz)}</span>
                        <span className="t">{hour(x.race, x.tz)}</span>
                        <span className="l">{x.laps} laps</span>
                    </button>
                ))}
            </section>
        </main>
    );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@1,700;1,900&family=Chakra+Petch:wght@400;500;600&display=swap');

.ts1 {
  --y: #FFD200;
  --g: #3fd13f;
  --r: #ff3b30;
  --ink: #f3efe6;
  --mute: #8d8a80;
  --bg: #070707;
  --panel: #111110;
  min-height: 100vh;
  background: radial-gradient(900px 340px at 20% 0, #2a2100 0, transparent 70%), var(--bg);
  color: var(--ink);
  font-family: 'Chakra Petch', system-ui, sans-serif;
  padding: 32px clamp(16px, 4vw, 64px) 64px;
  box-sizing: border-box;
}

.ts1 * {
  box-sizing: border-box;
}

.ts1 button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.ts1 button:focus-visible {
  outline: 2px solid var(--y);
  outline-offset: 3px;
}

.ts1-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.ts1-back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Chakra Petch', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--y);
  background: rgba(255, 210, 0, 0.08);
  border: 1px solid rgba(255, 210, 0, 0.3) !important;
  padding: 6px 14px;
  border-radius: 4px;
  transition: all 0.2s;
}

.ts1-back-btn:hover {
  background: rgba(255, 210, 0, 0.2);
  border-color: var(--y) !important;
  color: #fff;
  transform: translateX(-2px);
}

.ts1-badge-brand {
  font-size: 12px;
  letter-spacing: 0.15em;
  font-weight: 700;
  color: var(--mute);
}

.ts1-mode-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #111110;
  border: 1px solid #262624;
  padding: 4px;
  border-radius: 6px;
}

.ts1-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--mute);
  transition: all 0.15s;
}

.ts1-mode-btn.active {
  background: var(--y);
  color: #000;
  font-weight: 800;
}

.ts1-mode-btn:hover:not(.active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.ts1-head h1 {
  margin: 6px 0 10px;
  display: flex;
  flex-wrap: wrap;
  font: italic 900 clamp(24px, 4vw, 48px)/1 'Exo 2', sans-serif;
  text-transform: uppercase;
  animation: ts1-in 0.35s ease-out;
}

.ts1-head h1 i {
  background: #000;
  color: var(--y);
  border: 2px solid var(--y);
  padding: 0.1em 0.25em;
  font-style: italic;
  margin-right: 2px;
}

.ts1-head h1 b {
  background: var(--y);
  color: #000;
  padding: 0.1em 0.3em;
  font-weight: 900;
}

.ts1-next span {
  display: inline-block;
  background: #000;
  border: 1px solid #2a2a2a;
  padding: 2px 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--g);
  font-weight: 700;
  text-transform: uppercase;
}

.ts1-race, .ts1-quali {
  margin: 3px 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ts1-race {
  color: var(--g);
}

.ts1-quali {
  color: var(--r);
}

.ts1-map {
  position: relative;
  margin: 28px auto 0;
  max-width: 1200px;
  aspect-ratio: 2/1;
  border: 4px solid #262624;
  border-radius: 28px;
  background: radial-gradient(70% 70% at 50% 45%, #16150f, #000 85%);
  overflow: hidden;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.9), 0 10px 40px rgba(0, 0, 0, 0.8);
}

.ts1-svg-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ts1-dots-path {
  filter: drop-shadow(0 0 2px rgba(255, 210, 0, 0.25));
}

.ts1-pin {
  position: absolute;
  width: 0;
  height: 0;
  transform: translate(0, 0);
  z-index: 2;
}

.ts1-pulse {
  position: absolute;
  left: -6px;
  top: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ink);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
  transition: 0.2s;
}

.ts1-pin:hover .ts1-pulse {
  background: var(--y);
  transform: scale(1.25);
}

.ts1-tag {
  position: absolute;
  left: 12px;
  top: -9px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  color: var(--mute);
  transition: 0.2s;
  pointer-events: none;
}

.ts1-pin:hover .ts1-tag, .ts1-pin.on .ts1-tag {
  color: var(--ink);
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
}

.ts1-pin.on {
  z-index: 3;
}

.ts1-pin.on .ts1-pulse {
  background: var(--y);
  box-shadow: 0 0 0 4px rgba(255, 210, 0, 0.35), 0 0 18px 4px rgba(255, 210, 0, 0.6);
  animation: ts1-p 1.8s infinite;
}

.ts1-card {
  position: absolute;
  bottom: 5%;
  width: min(280px, 46%);
  background: rgba(8, 8, 8, 0.92);
  backdrop-filter: blur(8px);
  border-left: 4px solid var(--y);
  padding: 14px 16px;
  border-radius: 0 6px 6px 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 210, 0, 0.15);
  animation: ts1-in 0.3s ease-out;
  z-index: 5;
}

.ts1-card.right {
  right: 4%;
}

.ts1-card.left {
  left: 4%;
  border-left: 0;
  border-right: 4px solid var(--y);
  border-radius: 6px 0 0 6px;
}

.ts1-card-gp {
  margin: 0;
  font: italic 800 17px/1.15 'Exo 2', sans-serif;
  text-transform: uppercase;
  color: #fff;
}

.ts1-card-place {
  margin: 2px 0 10px;
  font-size: 12px;
  color: var(--mute);
  font-weight: 500;
}

.ts1-card dl {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.ts1-card dt {
  font-size: 10.5px;
  color: var(--mute);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ts1-card dd {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.ts1-list {
  max-width: 1200px;
  margin: 28px auto 0;
  max-height: 480px;
  overflow-y: auto;
  border-top: 1px solid #262624;
  scrollbar-color: #3a3524 transparent;
  padding-right: 4px;
}

.ts1-row {
  display: grid;
  grid-template-columns: 48px 1fr 140px 120px 70px 80px;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border-bottom: 1px solid #1c1c1a;
  font-size: 13.5px;
  transition: background 0.15s, transform 0.1s;
  cursor: pointer;
}

.ts1-row:hover {
  background: #15140f;
}

.ts1-row .n {
  font: italic 900 20px 'Exo 2', sans-serif;
  color: #55503e;
}

.ts1-row .g strong {
  display: block;
  font-weight: 700;
  color: #f3efe6;
}

.ts1-row small {
  color: var(--mute);
  font-size: 12px;
}

.ts1-row .c, .ts1-row .l {
  color: var(--mute);
  font-size: 12.5px;
}

.ts1-row .d {
  font-weight: 600;
}

.ts1-row .t {
  font-family: monospace;
  font-size: 12px;
}

.ts1-row.on {
  background: var(--y);
  color: #000;
  border-radius: 3px;
  transform: scale-[1.01];
}

.ts1-row.on .n, .ts1-row.on small, .ts1-row.on .c, .ts1-row.on .l, .ts1-row.on .g strong {
  color: #000;
}

@keyframes ts1-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes ts1-p {
  50% {
    box-shadow: 0 0 0 9px rgba(255, 210, 0, 0), 0 0 18px 4px rgba(255, 210, 0, 0.6);
  }
}

@media(max-width: 820px) {
  .ts1-row {
    grid-template-columns: 36px 1fr 80px;
  }
  .ts1-row .c, .ts1-row .t, .ts1-row .l {
    display: none;
  }
  .ts1-tag {
    display: none;
  }
  .ts1-pin.on .ts1-tag {
    display: block;
  }
  .ts1-card {
    position: static;
    width: 100%;
    margin-top: 12px;
    border-radius: 6px;
  }
  .ts1-map {
    aspect-ratio: auto;
    min-height: 380px;
  }
}

@media(prefers-reduced-motion: reduce) {
  .ts1 * {
    animation: none !important;
    transition: none !important;
  }
}
`;
