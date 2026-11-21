import { useMemo, useRef, useEffect, useState } from "react";

/* ------------------------------------------------------------------
   TS1 · The Strategist One — landing page (map + stage list)
   Mock data: replace RACES with Jolpica / OpenF1 responses.
   Map: dot-matrix world drawn from coarse polygons (no map library).
------------------------------------------------------------------- */

const RACES = [
    { round: 1, gp: "Australian Grand Prix", circuit: "Albert Park Circuit", city: "Melbourne", country: "Australia", lat: -37.85, lon: 144.97, race: "2026-03-08T04:00:00Z", quali: "2026-03-07T05:00:00Z", tz: "Australia/Melbourne", laps: 58, km: 5.278 },
    { round: 2, gp: "Japanese Grand Prix", circuit: "Suzuka Circuit", city: "Suzuka", country: "Japan", lat: 34.84, lon: 136.54, race: "2026-03-29T05:00:00Z", quali: "2026-03-28T06:00:00Z", tz: "Asia/Tokyo", laps: 53, km: 5.807 },
    { round: 3, gp: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", city: "Sakhir", country: "Bahrain", lat: 26.03, lon: 50.51, race: "2026-04-12T15:00:00Z", quali: "2026-04-11T16:00:00Z", tz: "Asia/Bahrain", laps: 57, km: 5.412 },
    { round: 4, gp: "Monaco Grand Prix", circuit: "Circuit de Monaco", city: "Monte Carlo", country: "Monaco", lat: 43.74, lon: 7.42, race: "2026-06-07T13:00:00Z", quali: "2026-06-06T14:00:00Z", tz: "Europe/Monaco", laps: 78, km: 3.337 },
    { round: 5, gp: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", city: "Montreal", country: "Canada", lat: 45.5, lon: -73.52, race: "2026-06-14T18:00:00Z", quali: "2026-06-13T20:00:00Z", tz: "America/Toronto", laps: 70, km: 4.361 },
    { round: 6, gp: "British Grand Prix", circuit: "Silverstone Circuit", city: "Silverstone", country: "United Kingdom", lat: 52.07, lon: -1.01, race: "2026-07-05T14:00:00Z", quali: "2026-07-04T14:00:00Z", tz: "Europe/London", laps: 52, km: 5.891 },
    { round: 7, gp: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", city: "Monza", country: "Italy", lat: 45.62, lon: 9.28, race: "2026-09-06T13:00:00Z", quali: "2026-09-05T14:00:00Z", tz: "Europe/Rome", laps: 53, km: 5.793 },
    { round: 8, gp: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", city: "Singapore", country: "Singapore", lat: 1.29, lon: 103.86, race: "2026-10-04T12:00:00Z", quali: "2026-10-03T13:00:00Z", tz: "Asia/Singapore", laps: 62, km: 4.927 },
    { round: 9, gp: "United States Grand Prix", circuit: "Circuit of the Americas", city: "Austin", country: "United States", lat: 30.13, lon: -97.64, race: "2026-10-25T19:00:00Z", quali: "2026-10-24T22:00:00Z", tz: "America/Chicago", laps: 56, km: 5.513 },
    { round: 10, gp: "São Paulo Grand Prix", circuit: "Autódromo José Carlos Pace (Interlagos)", city: "São Paulo", country: "Brazil", lat: -23.7, lon: -46.7, race: "2026-11-08T17:00:00Z", quali: "2026-11-07T18:00:00Z", tz: "America/Sao_Paulo", laps: 71, km: 4.309 },
    { round: 11, gp: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.47, lon: 54.6, race: "2026-12-06T13:00:00Z", quali: "2026-12-05T14:00:00Z", tz: "Asia/Dubai", laps: 58, km: 5.281 },
];

/* coarse continent outlines [lon, lat] */
const LAND = [
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
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((80 - lat) / 140) * H;

const inside = (x, y, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
};

const fmt = (iso, tz, o) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...o }).format(new Date(iso));
const day = (iso, tz) => fmt(iso, tz, { day: "numeric", month: "long" });
const hour = (iso, tz) => fmt(iso, tz, { hour: "2-digit", minute: "2-digit", hour12: false });
const pad = (n) => String(n).padStart(2, "0");

function DotMap() {
    const d = useMemo(() => {
        let p = "";
        for (let lat = 78; lat > -58; lat -= 2.4)
            for (let lon = -178; lon < 180; lon += 2.4)
                if (LAND.some((poly) => inside(lon, lat, poly)))
                    p += `M${(px(lon)).toFixed(1)} ${(py(lat)).toFixed(1)}h1.5v1.5h-1.5z`;
        return p;
    }, []);
    return (
        <svg className="ts1-dots" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path d={d} />
        </svg>
    );
}

export default function TS1Landing() {
    const [sel, setSel] = useState(RACES[0].round);
    const listRef = useRef(null);
    const r = RACES.find((x) => x.round === sel);

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-round="${sel}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [sel]);

    const flip = r.lon > 60 || r.lon < -90 ? "left" : "right";

    return (
        <main className="ts1">
            <style>{css}</style>

            <header className="ts1-head">
                <p className="ts1-next"><span>Next on</span></p>
                <h1 key={r.round}>
                    <i>#TS1{pad(r.round)}</i>
                    <b>{r.circuit.replace(/ \(.*\)/, "")}</b>
                </h1>
                <p className="ts1-race">Race · {day(r.race, r.tz)}, {hour(r.race, r.tz)} local time</p>
                <p className="ts1-quali">Qualifying · {day(r.quali, r.tz)}, {hour(r.quali, r.tz)} local time</p>
            </header>

            <section className="ts1-map" aria-label="Race calendar map">
                <DotMap />
                {RACES.map((x) => (
                    <button
                        key={x.round}
                        className={"ts1-pin" + (x.round === sel ? " on" : "")}
                        style={{ left: `${px(x.lon) / 10}%`, top: `${py(x.lat) / 5}%` }}
                        onClick={() => setSel(x.round)}
                        aria-pressed={x.round === sel}
                        aria-label={`${x.gp}, round ${x.round}`}
                    >
                        <span className="ts1-pulse" />
                        <span className="ts1-tag">{x.city}</span>
                    </button>
                ))}

                <aside key={r.round} className={"ts1-card " + flip}>
                    <p className="ts1-card-gp">{r.gp}</p>
                    <p className="ts1-card-place">{r.city}, {r.country}</p>
                    <dl>
                        <div><dt>Race</dt><dd>{day(r.race, r.tz)}</dd></div>
                        <div><dt>Lights out</dt><dd>{hour(r.race, r.tz)}</dd></div>
                        <div><dt>Laps</dt><dd>{r.laps}</dd></div>
                        <div><dt>Length</dt><dd>{r.km.toFixed(3)} km</dd></div>
                    </dl>
                </aside>
            </section>

            <section className="ts1-list" ref={listRef} aria-label="Stages">
                {RACES.map((x) => (
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
.ts1{--y:#FFD200;--g:#3fd13f;--r:#ff3b30;--ink:#f3efe6;--mute:#8d8a80;--bg:#070707;--panel:#111110;
  min-height:100vh;background:radial-gradient(900px 340px at 20% 0,#2a2100 0,transparent 70%),var(--bg);
  color:var(--ink);font-family:'Chakra Petch',system-ui,sans-serif;padding:48px clamp(16px,6vw,96px) 72px;box-sizing:border-box}
.ts1 *{box-sizing:border-box}
.ts1 button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:left}
.ts1 button:focus-visible{outline:2px solid var(--y);outline-offset:3px}

.ts1-head h1{margin:6px 0 10px;display:flex;flex-wrap:wrap;font:italic 900 clamp(28px,5vw,52px)/1 'Exo 2',sans-serif;text-transform:uppercase;animation:ts1-in .35s ease-out}
.ts1-head h1 i{background:#000;color:var(--y);border:2px solid var(--y);padding:.1em .25em;font-style:italic}
.ts1-head h1 b{background:var(--y);color:#000;padding:.1em .3em;font-weight:900}
.ts1-next span{display:inline-block;background:#000;border:1px solid #2a2a2a;padding:2px 8px;font-size:12px;letter-spacing:.08em;color:var(--g)}
.ts1-race,.ts1-quali{margin:2px 0;font-size:15px;font-weight:500}
.ts1-race{color:var(--g)}.ts1-quali{color:var(--r)}

.ts1-map{position:relative;margin:36px auto 0;max-width:1100px;aspect-ratio:2/1;border:6px solid #262624;border-radius:28px;
  background:radial-gradient(70% 70% at 50% 45%,#16150f,#000 80%);overflow:hidden}
.ts1-dots{position:absolute;inset:3% 2%;width:96%;height:94%}
.ts1-dots path{fill:#3a3524;filter:drop-shadow(0 0 2px rgba(255,210,0,.25))}

.ts1-pin{position:absolute;width:0;height:0;transform:translate(0,0);z-index:2}
.ts1-pulse{position:absolute;left:-6px;top:-6px;width:12px;height:12px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 3px rgba(255,255,255,.15);transition:.2s}
.ts1-pin:hover .ts1-pulse{background:var(--y);transform:scale(1.25)}
.ts1-tag{position:absolute;left:12px;top:-9px;white-space:nowrap;font-size:11px;font-weight:600;color:var(--mute);transition:.2s}
.ts1-pin:hover .ts1-tag,.ts1-pin.on .ts1-tag{color:var(--ink)}
.ts1-pin.on{z-index:3}
.ts1-pin.on .ts1-pulse{background:var(--y);box-shadow:0 0 0 4px rgba(255,210,0,.35),0 0 18px 4px rgba(255,210,0,.6);animation:ts1-p 1.8s infinite}

.ts1-card{position:absolute;bottom:5%;width:min(260px,44%);background:rgba(8,8,8,.88);backdrop-filter:blur(6px);
  border-left:4px solid var(--y);padding:14px 16px;animation:ts1-in .3s ease-out}
.ts1-card.right{right:4%}.ts1-card.left{left:4%}
.ts1-card-gp{margin:0;font:italic 700 17px/1.15 'Exo 2',sans-serif;text-transform:uppercase}
.ts1-card-place{margin:2px 0 10px;font-size:12px;color:var(--mute)}
.ts1-card dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}
.ts1-card dt{font-size:11px;color:var(--mute)}.ts1-card dd{margin:0;font-size:14px;font-weight:600}

.ts1-list{max-width:1100px;margin:28px auto 0;max-height:460px;overflow:auto;border-top:1px solid #262624;scrollbar-color:#3a3524 transparent}
.ts1-row{display:grid;grid-template-columns:44px 1fr 150px 110px 60px 70px;gap:12px;align-items:center;width:100%;padding:14px 12px;
  border-bottom:1px solid #1c1c1a;font-size:14px;transition:background .15s}
.ts1-row:hover{background:#15140f}
.ts1-row .n{font:italic 900 22px 'Exo 2',sans-serif;color:#4a4636}
.ts1-row .g strong{display:block;font-weight:600}
.ts1-row small{color:var(--mute);font-size:12px}
.ts1-row .c,.ts1-row .l{color:var(--mute)}
.ts1-row.on{background:var(--y);color:#000}
.ts1-row.on .n,.ts1-row.on small,.ts1-row.on .c,.ts1-row.on .l{color:#000}

@keyframes ts1-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes ts1-p{50%{box-shadow:0 0 0 9px rgba(255,210,0,0),0 0 18px 4px rgba(255,210,0,.6)}}
@media(max-width:720px){
  .ts1-row{grid-template-columns:34px 1fr 64px;} .ts1-row .c,.ts1-row .t,.ts1-row .l{display:none}
  .ts1-tag{display:none}.ts1-pin.on .ts1-tag{display:block}
  .ts1-card{position:static;width:100%;margin-top:0}
  .ts1-map{aspect-ratio:auto;padding-bottom:0}.ts1-dots{position:relative;inset:auto;width:100%;height:auto;display:block}
}
@media(prefers-reduced-motion:reduce){.ts1 *{animation:none!important;transition:none!important}}
`;
