"use client";
// app/page.tsx — Next.js 13+ (App Router). No extra packages, no audio files needed.
import { useCallback, useEffect, useRef, useState } from "react";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "800"] });
const body = Newsreader({ subsets: ["latin"], style: ["normal", "italic"] });

// Edit everything here. Tokenomics values must match what you really launch with.
const CFG = {
  ticker: "$TRUCE",
  ca: "REPLACE_WITH_CONTRACT_ADDRESS",
  pair: "", // DexScreener pair address; when filled, a live chart appears
  buy: "https://pump.fun/",
  x: "#",
  tg: "#",
  supply: "1,000,000,000",
  tax: "0%",
  liquidity: "Bonding curve on pump.fun (edit)",
  mint: "Revoked (edit)",
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const N = 44;
const rnd = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

function frontLine(t: number) {
  return Array.from({ length: N }, (_, i) => {
    const y = 90 + (i / (N - 1)) * 380;
    const x = 600 + rnd(i, 1) * 80 * (1 - t) + Math.sin((i / N) * Math.PI * 3) * 6 * t;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function Soldier({ x, dir }: { x: number; dir: 1 | -1 }) {
  return (
    <g transform={`translate(${x} 470) scale(${dir} 1)`} fill="#7f92ad">
      <path d="M-11 -91a11 11 0 0 1 22 0z" />
      <circle cx="0" cy="-86" r="7" />
      <path d="M-13 -78h26l3 46h-32z" />
      <rect x="-10" y="-33" width="8" height="33" />
      <rect x="2" y="-33" width="8" height="33" />
      <rect x="-4" y="-68" width="46" height="4" transform="rotate(-8 0 -66)" />
    </g>
  );
}

function Person({ x, s = 1, c, cane = false }: { x: number; s?: number; c: string; cane?: boolean }) {
  return (
    <g transform={`translate(${x} 470) scale(${s})`} fill={c}>
      <circle cx="0" cy="-70" r="8" />
      <path d="M-11 -58h22l5 34h-32z" />
      <rect x="-9" y="-26" width="7" height="26" />
      <rect x="2" y="-26" width="7" height="26" />
      {cane && <rect x="17" y="-42" width="3" height="42" />}
    </g>
  );
}

// Muzzle positions: [soldier x, direction]
const SHOOTERS: [number, 1 | -1][] = [[210, 1], [290, 1], [990, -1], [910, -1]];

export default function Page() {
  const wrap = useRef<HTMLElement>(null);
  const [t, setT] = useState(0);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [entered, setEntered] = useState(false);
  const [doves, setDoves] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const tRef = useRef(0);
  tRef.current = t;
  const audio = useRef<{ ctx: AudioContext; music: GainNode; bus: GainNode; timer: number; melody: number } | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setT(clamp(-r.top / (r.height - window.innerHeight)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    try {
      setCount(Number(localStorage.getItem("doves") || 0));
    } catch {}
  }, []);

  const stopSound = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    clearTimeout(a.timer);
    clearTimeout(a.melody);
    a.ctx.close();
    audio.current = null;
  }, []);

  const startSound = () => {
    const ctx = new AudioContext();
    const music = ctx.createGain();
    music.gain.value = 0.03;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    music.connect(lp);
    lp.connect(ctx.destination);
    [130.81, 196, 261.63, 329.63].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      o.connect(music);
      o.start();
    });
    const len = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const bus = ctx.createGain();
    bus.gain.value = 0.08;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    const fb = ctx.createGain();
    fb.gain.value = 0.4;
    bus.connect(ctx.destination);
    bus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(ctx.destination);
    const state = { ctx, music, bus, timer: 0, melody: 0 };
    const scale = [261.63, 293.66, 329.63, 392, 440, 523.25];
    const tune = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 4, 2, 1, 0];
    let n = 0;
    const play = () => {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = scale[tune[n++ % tune.length]];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(1, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      o.connect(g);
      g.connect(bus);
      o.start(now);
      o.stop(now + 2.3);
      state.melody = window.setTimeout(play, 1000 + (n % 4 === 0 ? 600 : 0));
    };
    play();
    const loop = () => {
      const war = Math.max(0, 1 - tRef.current / 0.6);
      if (war > 0.05) {
        const s = ctx.createBufferSource();
        s.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 500 + Math.random() * 700;
        const g = ctx.createGain();
        g.gain.value = 0.18 * war * Math.random();
        s.connect(f);
        f.connect(g);
        g.connect(ctx.destination);
        s.start();
      }
      state.timer = window.setTimeout(loop, 120 + Math.random() * 900);
    };
    loop();
    audio.current = state;
  };

  const toggleSound = () => {
    if (soundOn) stopSound();
    else startSound();
    setSoundOn(!soundOn);
  };

  const enter = () => {
    setEntered(true);
    startSound();
    setSoundOn(true);
  };

  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
  }, [entered]);

  useEffect(() => () => stopSound(), [stopSound]);

  useEffect(() => {
    const a = audio.current;
    if (a) {
      a.music.gain.setTargetAtTime(0.03 + t * 0.09, a.ctx.currentTime, 0.4);
      a.bus.gain.setTargetAtTime(0.08 + t * 0.14, a.ctx.currentTime, 0.4);
    }
  }, [t, soundOn]);

  const release = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setDoves((d) => [...d, id]);
    setTimeout(() => setDoves((d) => d.filter((x) => x !== id)), 4200);
    setCount((c) => {
      try {
        localStorage.setItem("doves", String(c + 1));
      } catch {}
      return c + 1;
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CFG.ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const war = clamp(1 - t / 0.6);
  const people = clamp((t - 0.3) * 2.2);
  const horizon = `hsl(${5 + t * 40} 60% ${14 + t * 22}%)`;

  return (
    <main className={body.className}>
      <style>{css}</style>

      {!entered && (
        <div className="gate">
          <h2 className={display.className}>{CFG.ticker}</h2>
          <p>Best experienced with sound.</p>
          <button className="btn" onClick={enter}>Enter with sound</button>
        </div>
      )}

      <button className="sound" onClick={toggleSound} aria-pressed={soundOn}>
        Sound: {soundOn ? "on" : "off"}
      </button>
      {doves.map((id) => (
        <span key={id} className="dove" style={{ left: `${8 + ((id * 37) % 80)}%` }} aria-hidden>
          🕊️
        </span>
      ))}

      <section className="tall" ref={wrap}>
        <div className="stick">
          <h1 className={display.className}>Straighten the line.</h1>

          <svg viewBox="0 0 1200 520" role="img" aria-label="Night battlefield with Ukrainian and Russian flags and soldiers on either side of a front line that straightens as you scroll, while gunfire fades and civilians gather in the middle">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#050d22" />
                <stop offset="1" stopColor={horizon} />
              </linearGradient>
            </defs>
            <rect width="1200" height="520" fill="url(#sky)" />
            {Array.from({ length: 26 }, (_, i) => (
              <circle key={i} cx={(rnd(i, 3) + 1) * 600} cy={(rnd(i, 4) + 1) * 130} r={1 + (i % 3) * 0.6} fill="#fff" opacity={0.85 - t * 0.6} />
            ))}
            <circle cx="600" cy={420 - t * 280} r="70" fill="hsl(44 92% 62%)" opacity={0.1 + t * 0.9} />
            <path d="M0 430 Q200 370 400 420 T800 405 T1200 390 V520 H0Z" fill="#0a1a33" opacity=".9" />
            <rect y="470" width="1200" height="50" fill="#07142a" />

            {/* Ukraine */}
            <rect x="68" y="110" width="4" height="362" fill="#c9d1dc" />
            <circle cx="70" cy="108" r="5" fill="#e9b949" />
            <g className="wave wl">
              <rect x="72" y="118" width="170" height="44" fill="#0057B7" />
              <rect x="72" y="162" width="170" height="44" fill="#FFD700" />
            </g>
            {/* Russia */}
            <rect x="1128" y="110" width="4" height="362" fill="#c9d1dc" />
            <circle cx="1130" cy="108" r="5" fill="#e9b949" />
            <g className="wave wr">
              <rect x="958" y="118" width="170" height="30" fill="#ffffff" />
              <rect x="958" y="148" width="170" height="30" fill="#0039A6" />
              <rect x="958" y="178" width="170" height="30" fill="#D52B1E" />
            </g>

            {SHOOTERS.map(([x, dir]) => (
              <Soldier key={x} x={x} dir={dir} />
            ))}

            <g opacity={war}>
              {SHOOTERS.map(([x, dir], i) => {
                const mx = x + dir * 44;
                return (
                  <g key={x}>
                    <line className="tr" x1={mx} y1="404" x2={600 - dir * 30} y2={380 + rnd(i, 9) * 30} stroke="#ffd27a" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="22 600" style={{ animationDelay: `${i * 0.37}s` }} />
                    <circle className="fl" cx={mx} cy="404" r="9" fill="#ffe7a6" style={{ animationDelay: `${i * 0.37}s` }} />
                  </g>
                );
              })}
            </g>

            <path d={frontLine(t)} fill="none" stroke={`hsl(${10 + t * 130} 65% 58%)`} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />

            <g opacity={people} transform={`translate(0 ${(1 - people) * 24})`}>
              <Person x={545} c="#f2a65a" />
              <Person x={585} s={0.6} c="#f4d35e" />
              <Person x={625} c="#e07a8b" />
              <Person x={668} s={0.85} c="#c9b8f0" cane />
            </g>
          </svg>

          <div className="row">
            <button className="btn" onClick={release}>Release a dove</button>
            <span className="caption">
              {t > 0.95 ? "Every line can be redrawn." : "Scroll to straighten the line."}
              {count > 0 && ` Your doves: ${count}`}
            </span>
          </div>
        </div>
      </section>

      <section className="about">
        <h2 className={display.className}>Two flags. One line. Millions of people in between.</h2>
        <p>
          {CFG.ticker} is a community meme token on Solana for everyone who is tired of the war and wants to see it end. Soldiers
          on both sides and ordinary people caught between them are the reason it exists.
        </p>
      </section>

      <section className="grid">
        <div>
          <h2 className={display.className}>Token facts</h2>
          <dl>
            <dt>Supply</dt><dd>{CFG.supply}</dd>
            <dt>Tax</dt><dd>{CFG.tax}</dd>
            <dt>Liquidity</dt><dd>{CFG.liquidity}</dd>
            <dt>Mint authority</dt><dd>{CFG.mint}</dd>
          </dl>
        </div>
      </section>

      {CFG.pair && (
        <section className="chart">
          <iframe title="Live chart" src={`https://dexscreener.com/solana/${CFG.pair}?embed=1&theme=dark&info=0`} loading="lazy" />
        </section>
      )}

      <section className="cta">
        <h2 className={display.className}>Join the community</h2>
        <button className="ca" onClick={copy} aria-label="Copy contract address">
          <span>{CFG.ca}</span>
          <b>{copied ? "Copied" : "Copy"}</b>
        </button>
        <div className="links">
          <a href={CFG.buy} target="_blank" rel="noreferrer">Buy {CFG.ticker} on pump.fun</a>
          <a href={CFG.x} target="_blank" rel="noreferrer">X</a>
          <a href={CFG.tg} target="_blank" rel="noreferrer">Telegram</a>
        </div>
      </section>

      <footer>
        {CFG.ticker} is a community token, not an investment product, and it can lose all of its value. It is not affiliated with
        any government or organization. Nothing on this page is financial advice.
      </footer>
    </main>
  );
}

const css = `
:root{--ink:#0b1d3a;--paper:#f3efe4;--wheat:#e9b949;--ash:#aab6c8}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--paper)}
main{max-width:1100px;margin:0 auto;padding:0 20px 40px;font-size:19px;line-height:1.6}
.tall{height:280vh;position:relative}
.stick{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;gap:10px}
.stick h1{font-size:clamp(40px,8vw,104px);line-height:.95;margin:0;font-weight:800;letter-spacing:-.02em;animation:rise .9s cubic-bezier(.2,.8,.2,1) both}
.stick svg{width:100%;height:auto;max-height:60vh;border-radius:10px}
.row{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.caption{color:var(--ash);font-style:italic}
.btn{background:var(--wheat);color:var(--ink);border:0;border-radius:999px;padding:10px 20px;font:inherit;font-weight:600;cursor:pointer}
.btn:active{transform:scale(.96)}
.sound{position:fixed;top:14px;right:14px;z-index:10;background:rgba(11,29,58,.85);color:var(--paper);border:2px solid var(--paper);border-radius:999px;padding:6px 14px;font:inherit;font-size:15px;cursor:pointer}
.gate{position:fixed;inset:0;z-index:30;background:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
.gate h2{font-size:clamp(48px,12vw,120px);margin:0;font-weight:800}
.gate p{margin:0 0 8px;color:var(--ash)}
.dove{position:fixed;bottom:12vh;font-size:40px;z-index:9;pointer-events:none;animation:fly 4s ease-out forwards}
.wave{transform-box:fill-box;animation:wave 3s ease-in-out infinite alternate}
.wl{transform-origin:left center}
.wr{transform-origin:right center;animation-delay:-1.4s}
.tr{animation:tr 1.4s linear infinite}
.fl{opacity:0;animation:fl 1.4s linear infinite}
.about{max-width:760px;padding:48px 0}
.about h2,.cta h2,.grid h2{font-size:clamp(30px,5.5vw,60px);line-height:1.05;margin:0 0 20px;font-weight:800}
.grid h2{font-size:clamp(26px,4vw,40px)}
.about p{color:var(--ash);max-width:60ch;margin:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;padding:24px 0 48px;border-top:2px solid var(--ash)}
.grid ol{margin:0;padding-left:22px;color:var(--ash)}
.grid li{margin-bottom:8px}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 20px;color:var(--ash)}
dt{color:var(--paper)}
dd{margin:0}
.chart iframe{width:100%;height:480px;border:0;border-radius:10px}
.cta{padding:48px 0 16px}
.ca{display:flex;gap:16px;align-items:center;justify-content:space-between;width:100%;max-width:680px;background:var(--paper);color:var(--ink);border:0;border-radius:6px;padding:16px 18px;font:inherit;cursor:pointer}
.ca span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px}
.ca b{background:var(--ink);color:var(--paper);padding:6px 12px;border-radius:4px;font-size:15px;white-space:nowrap}
.ca:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid var(--wheat);outline-offset:3px}
.links{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
.links a{color:var(--paper);padding:10px 18px;border:2px solid var(--paper);border-radius:999px;text-decoration:none;transition:background .2s,color .2s}
.links a:first-child{background:var(--wheat);border-color:var(--wheat);color:var(--ink)}
.links a:hover{background:var(--paper);color:var(--ink)}
footer{margin-top:56px;color:var(--ash);font-size:14px;max-width:70ch}
@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes wave{from{transform:skewY(-3deg) scaleX(.98)}to{transform:skewY(3deg) scaleX(1)}}
@keyframes tr{from{stroke-dashoffset:22}to{stroke-dashoffset:-420}}
@keyframes fl{0%,88%{opacity:0}92%{opacity:1}100%{opacity:0}}
@keyframes fly{from{transform:translateY(0) rotate(-8deg);opacity:1}to{transform:translateY(-85vh) rotate(10deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.wave,.stick h1,.tr,.fl,.dove{animation:none}}
`;
