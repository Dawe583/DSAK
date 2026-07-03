// ===== Branzly landing — vizuály a efekty =====
// animace běží vždy — web nerespektuje systémové "omezit animace"
const reduceMotion = false;

/* ---------- Lenis smooth scroll (ScrollEase easing) ---------- */
let lenis = null;
if (!reduceMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponenciální ease-out jako ScrollEase
    smoothWheel: true,
  });
  // kotvy přes Lenis (plynulý dojezd)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    });
  });
  // nav se schová při scrollu dolů, ukáže při scrollu nahoru
  const navWrap = document.querySelector(".nav-wrap");
  lenis.on("scroll", ({ scroll, direction }) => {
    navWrap.classList.toggle("hidden", direction === 1 && scroll > 220);
  });
}

/* ---------- parallax + tilt (jeden rAF pro vše) ---------- */
const plxEls = [...document.querySelectorAll("[data-plx]")];
const heroVis = document.getElementById("heroVisual");
const finePointer = matchMedia("(pointer: fine)").matches;
let tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
if (heroVis && finePointer && !reduceMotion) {
  heroVis.addEventListener("mousemove", (e) => {
    const r = heroVis.getBoundingClientRect();
    tiltTX = ((e.clientY - r.top) / r.height - 0.5) * -4;
    tiltTY = ((e.clientX - r.left) / r.width - 0.5) * 5;
  });
  heroVis.addEventListener("mouseleave", () => { tiltTX = 0; tiltTY = 0; });
  heroVis.parentElement.style.perspective = "900px";
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
let prevTime = 0;

/* průsečík: postup přibližování rukou (0 = daleko, 1 = dotek) */
const meetVisual = document.querySelector(".intersection-visual");
let meetP = 0;

function mainRaf(time) {
  const dt = prevTime ? Math.min((time - prevTime) / 1000, 0.05) : 0.016;
  prevTime = time;
  if (lenis) lenis.raf(time);
  if (!reduceMotion) {
    const mid = innerHeight / 2;
    for (const el of plxEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) continue;
      const off = (r.top + r.height / 2 - mid) * +el.dataset.plx;
      if (el === heroVis) {
        tiltX += (tiltTX - tiltX) * 0.08;
        tiltY += (tiltTY - tiltY) * 0.08;
        el.style.transform = `translateY(${off.toFixed(1)}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      } else {
        el.style.transform = `translateY(${off.toFixed(1)}px)`;
      }
    }
    stackRaf();
    quoteRaf();
    marqueeRaf(dt);
    orbitRaf(time / 1000);
    if (meetVisual) {
      const mr = meetVisual.getBoundingClientRect();
      if (mr.bottom > -60 && mr.top < innerHeight + 60) {
        const raw = clamp01((innerHeight * 0.92 - mr.top) / (innerHeight * 0.7));
        meetP += (raw - meetP) * 0.07;
      }
    }
  }
  requestAnimationFrame(mainRaf);
}
requestAnimationFrame(mainRaf);

/* ---------- mobilní nav ---------- */
const toggle = document.getElementById("navToggle");
const mobile = document.getElementById("navMobile");
toggle.addEventListener("click", () => {
  const open = mobile.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
mobile.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    mobile.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- marquee: zdvojení pásky, JS pohon reagující na rychlost scrollu ---------- */
const track = document.getElementById("marqueeTrack");
track.innerHTML += track.innerHTML;
let mqX = 0, mqHalf = 0;
const mqMeasure = () => { mqHalf = track.scrollWidth / 2; };
if (!reduceMotion) {
  track.style.animation = "none";
  mqMeasure();
  addEventListener("resize", mqMeasure);
}
function marqueeRaf(dt) {
  if (!mqHalf) return;
  const r = track.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const vel = lenis ? Math.abs(lenis.velocity) : 0;
  const speed = 55 + Math.min(vel * 14, 260); // px/s, zrychlí při scrollu
  mqX = (mqX + speed * dt) % mqHalf;
  track.style.transform = `translate3d(${(-mqX).toFixed(2)}px,0,0)`;
}

/* ---------- orbit: uzly skutečně obíhají po drahách ---------- */
const orbitEl = document.querySelector(".orbit");
let orbitBodies = [];
if (orbitEl) {
  // 3 uzly na vnější dráze (po směru), 3 na vnitřní (proti směru); popisky zůstávají vzpřímené
  const defs = [
    { sel: ".on1", ring: 1, a: -90, speed: 7 },
    { sel: ".on3", ring: 1, a: 30, speed: 7 },
    { sel: ".on5", ring: 1, a: 150, speed: 7 },
    { sel: ".on2", ring: 2, a: -30, speed: -11 },
    { sel: ".on4", ring: 2, a: 90, speed: -11 },
    { sel: ".on6", ring: 2, a: 210, speed: -11 },
  ];
  orbitBodies = defs.map((d) => ({ el: orbitEl.querySelector(d.sel), ...d }));
  // komety: světelné tečky putující po drahách
  [{ ring: 1, a: 0, speed: 26 }, { ring: 1, a: 180, speed: 26 }, { ring: 2, a: 90, speed: -38 }].forEach((c) => {
    const el = document.createElement("i");
    el.className = "orbit-comet";
    orbitEl.appendChild(el);
    orbitBodies.push({ el, ...c });
  });
}
function orbitRaf(t) {
  if (!orbitEl) return;
  const r = orbitEl.getBoundingClientRect();
  if (r.bottom < -60 || r.top > innerHeight + 60) return;
  const R1 = r.width / 2, R2 = r.width * 0.28;
  for (const b of orbitBodies) {
    const rad = ((b.a + t * b.speed) * Math.PI) / 180;
    const R = b.ring === 1 ? R1 : R2;
    b.el.style.transform = `translate(-50%,-50%) translate(${(Math.cos(rad) * R).toFixed(1)}px, ${(Math.sin(rad) * R).toFixed(1)}px)`;
  }
}
orbitRaf(0); // výchozí rozmístění ještě před prvním snímkem

/* ---------- word-split: maskované nadpisy (StackGrid styl) ---------- */
function maskSplit(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((wd, i) => {
    const w = document.createElement("span");
    w.className = "w";
    const wi = document.createElement("span");
    wi.className = "wi";
    wi.textContent = wd;
    wi.style.setProperty("--wi", i);
    w.appendChild(wi);
    el.appendChild(w);
    el.appendChild(document.createTextNode(" "));
  });
  el.classList.add("split");
}
const heroH1 = document.querySelector(".hero h1");
if (!reduceMotion) {
  document.querySelectorAll("main h3").forEach(maskSplit);
  if (heroH1) {
    maskSplit(heroH1);
    // dvojitý rAF: nejdřív se vykreslí výchozí stav, pak přechod
    requestAnimationFrame(() => requestAnimationFrame(() => heroH1.classList.add("in")));
  }
}

/* ---------- stacking karty ceníku (StackGrid efekt) ---------- */
const tierRows = [...document.querySelectorAll(".tier-row")];
function stackRaf() {
  if (!tierRows.length) return;
  const stackRect = tierRows[0].parentElement.getBoundingClientRect();
  if (stackRect.bottom < 0 || stackRect.top > innerHeight) return;
  for (let i = 0; i < tierRows.length - 1; i++) {
    const cur = tierRows[i].getBoundingClientRect();
    const next = tierRows[i + 1].getBoundingClientRect();
    // p: 0 = další karta dole mimo, 1 = další karta překryla aktuální
    const p = clamp01((innerHeight - next.top) / Math.max(innerHeight - cur.top - 30, 1));
    const row = tierRows[i];
    if (p > 0.001) {
      // vypnout reveal transition, jinak by scroll-driven transform "plaval"
      row.style.transition = "none";
      row.style.transform = `scale(${(1 - 0.06 * p).toFixed(4)})`;
      row.style.filter = `blur(${(3 * p).toFixed(2)}px)`;
      row.style.opacity = (1 - 0.35 * p).toFixed(3);
    } else {
      row.style.transition = row.style.transform = row.style.filter = row.style.opacity = "";
    }
  }
}

/* ---------- scroll-linked rozsvěcení citace ---------- */
const bq = document.querySelector(".big-quote blockquote");
let quoteWords = [];
if (bq && !reduceMotion) {
  const words = bq.textContent.trim().split(/\s+/);
  bq.textContent = "";
  words.forEach((wd) => {
    const s = document.createElement("span");
    s.className = "qw";
    s.textContent = wd;
    bq.appendChild(s);
    bq.appendChild(document.createTextNode(" "));
  });
  quoteWords = [...bq.querySelectorAll(".qw")];
}
function quoteRaf() {
  if (!quoteWords.length) return;
  const r = bq.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const p = clamp01((innerHeight * 0.9 - r.top) / (innerHeight * 0.55 + r.height));
  const idx = p * (quoteWords.length + 3);
  for (let i = 0; i < quoteWords.length; i++) {
    quoteWords[i].style.opacity = (0.14 + 0.86 * clamp01(idx - i)).toFixed(3);
  }
}

/* ---------- magnetická tlačítka ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.32).toFixed(1)}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
  });
}

/* ---------- blur+fade reveal (se staggerem mezi sourozenci) ---------- */
/* sledují se i .split nadpisy bez vlastního .reveal (FAQ, CTA) — jinak by
   jejich slova zůstala navždy schovaná pod maskou */
const reveals = document.querySelectorAll(".reveal, main h3.split:not(.reveal)");
// stagger: pořadí v rámci rodiče -> --i
document.querySelectorAll(".feature-grid, .case-grid, .faq-list, .tag-strip").forEach((parent) => {
  [...parent.children].forEach((child, i) => child.style.setProperty("--i", i));
});
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}
/* ---------- FAQ: plynulé rozbalení ---------- */
document.querySelectorAll(".faq-item").forEach((item) => {
  const summary = item.querySelector("summary");
  const body = item.querySelector(".faq-body");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (item.open) {
      body.style.maxHeight = "0px";
      if (reduceMotion) item.open = false;
      else body.addEventListener("transitionend", () => { item.open = false; }, { once: true });
    } else {
      item.open = true;
      requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + "px"; });
    }
  });
});

/* ---------- ASCII renderer ----------
   Hustotní pole -> ASCII znaky. shapeFn(x, y, t) vrací 0..1. */
const RAMP = " .·:;+*#@";
function asciiRender(canvas, shapeFn, animate) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cell = 8;
  const cols = Math.floor(W / cell), rows = Math.floor(H / (cell * 1.15));
  ctx.font = `${cell + 1}px monospace`;
  ctx.textBaseline = "top";

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c / cols, y = r / rows;
        let v = shapeFn(x, y, t);
        if (v <= 0.04) continue;
        v = Math.min(1, v);
        const ch = RAMP[Math.floor(v * (RAMP.length - 1))];
        const shade = 40 + Math.floor((1 - v) * 130);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillText(ch, c * cell, r * cell * 1.15);
      }
    }
  }

  if (animate && !reduceMotion) {
    let raf;
    const loop = (ms) => { frame(ms / 1000); raf = requestAnimationFrame(loop); };
    // animuj jen když je canvas vidět
    const vis = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    });
    vis.observe(canvas);
  } else {
    frame(0);
  }
}

/* organický lalok: metaball z několika kruhů + šum */
function lobe(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return Math.max(0, 1 - (dx * dx + dy * dy));
}
function noise(x, y, t) {
  return 0.5 + 0.5 * Math.sin(x * 12.9 + t * 0.7) * Math.cos(y * 9.7 - t * 0.5);
}

/* hero: dvě ruce/laloky natahující se k sobě */
const heroCanvas = document.getElementById("asciiHero");
if (heroCanvas) asciiRender(heroCanvas, (x, y, t) => {
  const wob = 0.015 * Math.sin(t * 0.8 + y * 6);
  let v = 0;
  // levý lalok s "prsty"
  v = Math.max(v, lobe(x, y, 0.24 + wob, 0.55, 0.21, 0.30));
  v = Math.max(v, lobe(x, y, 0.40 + wob, 0.46, 0.09, 0.07));
  v = Math.max(v, lobe(x, y, 0.43 + wob, 0.58, 0.08, 0.05));
  // pravý lalok
  v = Math.max(v, lobe(x, y, 0.76 - wob, 0.42, 0.22, 0.32));
  v = Math.max(v, lobe(x, y, 0.58 - wob, 0.50, 0.09, 0.06));
  v = Math.max(v, lobe(x, y, 0.61 - wob, 0.38, 0.07, 0.05));
  return v * (0.55 + 0.45 * noise(x, y, t));
}, true);

/* průsečík: digitální lalok zleva, "lidský" zprava — ruce se k sobě
   natahují podle scrollu (meetP) a v místě dotyku přeskočí jiskra */
const meetCanvas = document.getElementById("asciiMeet");
if (meetCanvas) asciiRender(meetCanvas, (x, y, t) => {
  const wob = 0.012 * Math.sin(t + y * 5);
  const reach = 0.16 * meetP; // prsty se natahují ke středu
  let v = 0;
  v = Math.max(v, lobe(x, y, 0.16, 0.42 + wob, 0.26, 0.34));
  v = Math.max(v, lobe(x, y, 0.26 + reach, 0.52 + wob, 0.10, 0.06));
  v = Math.max(v, lobe(x, y, 0.86, 0.55 - wob, 0.26, 0.36));
  v = Math.max(v, lobe(x, y, 0.74 - reach, 0.50 - wob, 0.10, 0.06));
  // jiskra při dotyku: rozsvítí se až těsně před spojením a tepe
  const spark = clamp01((meetP - 0.8) / 0.2) * (0.55 + 0.45 * Math.sin(t * 7));
  if (spark > 0.02) {
    v = Math.max(v, spark * lobe(x, y, 0.5, 0.51, 0.06 + 0.05 * spark, 0.04 + 0.04 * spark));
  }
  // pravá strana hladší (lidská), levá zrnitější (digitální)
  const grain = x < 0.5 ? noise(x, y, t) : 0.85;
  return v * (0.5 + 0.5 * grain);
}, true);

/* footer: vztyčená paže s pochodní (statická silueta) */
const footCanvas = document.getElementById("asciiFoot");
if (footCanvas) asciiRender(footCanvas, (x, y) => {
  let v = 0;
  v = Math.max(v, lobe(x, y, 0.5, 0.12, 0.16, 0.10));       // plamen
  v = Math.max(v, lobe(x, y, 0.5, 0.26, 0.10, 0.05));       // mísa
  v = Math.max(v, lobe(x, y, 0.5, 0.55, 0.07, 0.30));       // paže
  v = Math.max(v, lobe(x, y, 0.5, 0.92, 0.13, 0.12));       // pěst/základna
  return v * (0.5 + 0.5 * noise(x, y, 0));
}, false);

/* ---------- pixelové ikony (16x16 bitmapy, upscale + glow) ---------- */
const ICONS = {
  agent: { color: "#2f9bff", map: [
    "................",
    ".....######.....",
    "....##....##....",
    "...##......##...",
    "...#..####..#...",
    "...#.##..##.#...",
    "##.#.##..##.#.##",
    "#..#..####..#..#",
    "#..##......##..#",
    "#...########...#",
    "##....####....##",
    ".##..######..##.",
    "..############..",
    "....########....",
    "....##....##....",
    "................" ] },
  pipeline: { color: "#e935e0", map: [
    "................",
    "..#########.....",
    "..#########.....",
    "........###.....",
    "........###.....",
    "........###.....",
    "..###############",
    "..###############",
    "..###...........",
    "..###...........",
    "..###..#########",
    "..###..#########",
    "..###......###..",
    "..#########.###.",
    "..#########..##.",
    "................" ] },
  database: { color: "#2fd0a4", map: [
    "................",
    "...##########...",
    "..############..",
    "..##........##..",
    "..############..",
    "..############..",
    "..##........##..",
    "..############..",
    "..############..",
    "..##...##...##..",
    "..##..####..##..",
    "..##.##..##.##..",
    "..##.######.##..",
    "..##..####..##..",
    "...##########...",
    "................" ] },
  audit: { color: "#f5a623", map: [
    "................",
    "....########....",
    "....#......#....",
    "..###.####.###..",
    "..#..........#..",
    "..#.########.#..",
    "..#..........#..",
    "..#.######...#..",
    "..#.......##.#..",
    "..#.####.####.#.",
    "..#.....##..##..",
    "..#.....#....#..",
    "..#......####.#.",
    "..#...........##",
    "..#############.",
    "................" ] }
};

/* ikony se poskládají pixel po pixelu, pak jemně světélkují;
   hover na kartě vyvolá krátké zajiskření */
document.querySelectorAll("canvas[data-icon]").forEach((cv) => {
  const icon = ICONS[cv.dataset.icon];
  if (!icon) return;
  const ctx = cv.getContext("2d");
  const px = cv.width / 16;
  // seznam pixelů + náhodné pořadí nástupu
  const pixels = [];
  icon.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === "#") pixels.push({ r, c, ord: 0 });
  }));
  const order = pixels.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach((pi, i) => { pixels[pi].ord = i / order.length; });

  let buildStart = -1, hoverT = -1e9, raf = 0, running = false;

  function frame(now) {
    const t = now / 1000;
    if (buildStart < 0) buildStart = t;
    const bt = t - buildStart;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // glow vrstva (dýchá)
    ctx.save();
    ctx.filter = "blur(14px)";
    ctx.fillStyle = icon.color;
    for (const p of pixels) {
      const a = clamp01((bt - p.ord * 0.7) / 0.35);
      if (a <= 0) continue;
      ctx.globalAlpha = a * (0.7 + 0.3 * Math.sin(t * 1.8 + (p.r + p.c) * 0.5));
      ctx.fillRect(p.c * px, p.r * px, px, px);
    }
    ctx.restore();
    // ostré pixely: nástup s dorůstáním, plynulé vlnění jasu, hover jiskra
    ctx.fillStyle = icon.color;
    const spark = clamp01(1 - (t - hoverT) / 0.6);
    for (const p of pixels) {
      const a = clamp01((bt - p.ord * 0.7) / 0.35);
      if (a <= 0) continue;
      const flick = spark > 0 ? spark * 0.5 * Math.sin(t * 40 + p.ord * 60) : 0;
      const shimmer = 0.84 + 0.16 * Math.sin(t * 1.6 + (p.r + p.c) * 0.55);
      ctx.globalAlpha = clamp01(a * shimmer + flick);
      const s = (px - 2) * (0.4 + 0.6 * a);
      const o = (px - s) / 2;
      ctx.fillRect(p.c * px + o, p.r * px + o, s, s);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  }, { threshold: 0.1 }).observe(cv);

  const cell = cv.closest(".feature-cell");
  if (cell) cell.addEventListener("mouseenter", () => { hoverT = performance.now() / 1000; });
});

/* ---------- dither avatary (halftone placeholder) ---------- */
document.querySelectorAll("canvas.avatar, canvas.quote-photo").forEach((cv) => {
  const seed = +cv.dataset.seed || 1;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, d = 4;
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < H; y += d) {
    for (let x = 0; x < W; x += d) {
      // radiální gradient hlavy + náhodný dither
      const dx = (x - W / 2) / (W / 2), dy = (y - H / 2.4) / (H / 2);
      const head = Math.max(0, 1 - (dx * dx * 1.6 + dy * dy));
      const body = y > H * 0.62 ? Math.max(0, 1 - Math.abs(dx) * 1.2) : 0;
      const v = Math.max(head, body) * 0.9;
      if (rnd() < v) {
        const g = 60 + Math.floor(rnd() * 120);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(x, y, d - 1, d - 1);
      }
    }
  }
});

/* ---------- kalendář: výběr termínu, propíše se do formuláře ---------- */
const MONTHS = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const DOWS = ["Po","Út","St","Čt","Pá","So","Ne"];
const TIMES = ["9:00", "11:00", "14:00", "16:00"];
const calEl = document.getElementById("calendar");
const termInput = document.getElementById("formTerm");
let selDate = null, selTime = null;
let calRerender = () => {};

function updateTerm() {
  if (!termInput) return;
  const parts = [];
  if (selDate) parts.push(`${selDate.getDate()}. ${selDate.getMonth() + 1}. ${selDate.getFullYear()}`);
  if (selTime) parts.push(`v ${selTime}`);
  termInput.value = parts.join(" ");
}

if (calEl) {
  let view = new Date();
  view.setDate(1);

  function renderCal() {
    const y = view.getFullYear(), m = view.getMonth();
    const today = new Date();
    const first = (new Date(y, m, 1).getDay() + 6) % 7; // Po = 0
    const days = new Date(y, m + 1, 0).getDate();
    let html = `<div class="cal-head">
      <span class="cal-title">${MONTHS[m]} <span>${y}</span></span>
      <span class="cal-nav">
        <button type="button" id="calPrev" aria-label="Předchozí měsíc">‹</button>
        <button type="button" id="calNext" aria-label="Další měsíc">›</button>
      </span></div><div class="cal-grid">`;
    html += DOWS.map((d) => `<span class="cal-dow">${d}</span>`).join("");
    for (let i = 0; i < first; i++) html += `<span class="cal-day off"></span>`;
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const isToday = date.toDateString() === today.toDateString();
      const past = date < today && !isToday;
      const dow = (date.getDay() + 6) % 7;
      const off = past || dow > 4;
      const sel = selDate && date.toDateString() === selDate.toDateString();
      html += off
        ? `<span class="cal-day off">${d}</span>`
        : `<button type="button" class="cal-day${isToday ? " today" : ""}${sel ? " sel" : ""}" data-d="${d}">${d}</button>`;
    }
    html += `</div><div class="cal-times">`
      + TIMES.map((tm) => `<button type="button" class="cal-time${selTime === tm ? " sel" : ""}" data-t="${tm}">${tm}</button>`).join("")
      + `</div><p class="cal-hint">${selDate || selTime
        ? "Termín se propsal do formuláře — stačí dokončit poptávku."
        : "Vyberte den a čas, propíšou se do formuláře."}</p>`;
    calEl.innerHTML = html;
    document.getElementById("calPrev").onclick = () => { view.setMonth(view.getMonth() - 1); renderCal(); };
    document.getElementById("calNext").onclick = () => { view.setMonth(view.getMonth() + 1); renderCal(); };
    calEl.querySelectorAll(".cal-day[data-d]").forEach((b) => {
      b.onclick = () => { selDate = new Date(y, m, +b.dataset.d); updateTerm(); renderCal(); };
    });
    calEl.querySelectorAll(".cal-time").forEach((b) => {
      b.onclick = () => { selTime = selTime === b.dataset.t ? null : b.dataset.t; updateTerm(); renderCal(); };
    });
  }
  calRerender = renderCal;
  renderCal();
}

/* ---------- kontaktní formulář ---------- */
// odesílá přes FormSubmit (po první zprávě přijde na ahoj@branzly.cz aktivační
// e-mail — stačí potvrdit); při výpadku otevře e-mailového klienta s předvyplněnou zprávou
const FORM_ENDPOINT = "https://formsubmit.co/ajax/ahoj@branzly.cz";
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  const fName = document.getElementById("fName");
  const fEmail = document.getElementById("fEmail");
  const fMsg = document.getElementById("fMsg");
  const fHoney = document.getElementById("fHoney");
  const statusEl = document.getElementById("formStatus");
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  const mark = (el, ok) => { el.classList.toggle("invalid", !ok); return ok; };
  [fName, fEmail, fMsg].forEach((el) => el.addEventListener("input", () => el.classList.remove("invalid")));

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (fHoney.value) return; // bot
    const name = fName.value.trim(), email = fEmail.value.trim(), msg = fMsg.value.trim();
    let ok = true;
    ok = mark(fName, name.length >= 2) && ok;
    ok = mark(fEmail, /^\S+@\S+\.\S+$/.test(email)) && ok;
    ok = mark(fMsg, msg.length >= 5) && ok;
    if (!ok) {
      statusEl.textContent = "Vyplňte prosím jméno, platný e-mail a zprávu.";
      statusEl.className = "form-status err";
      return;
    }
    const term = termInput && termInput.value ? termInput.value : "neuveden";
    submitBtn.disabled = true;
    statusEl.textContent = "Odesílám…";
    statusEl.className = "form-status";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, term, message: msg, _subject: `Poptávka z webu — ${name}` }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(String(res.status));
      contactForm.reset();
      selDate = null; selTime = null; updateTerm(); calRerender();
      statusEl.textContent = "✓ Díky za poptávku! Ozveme se vám do 24 hodin.";
      statusEl.className = "form-status ok";
    } catch {
      // záložní cesta: předvyplněný e-mail v klientovi návštěvníka
      const body = `Jméno: ${name}\nE-mail: ${email}\nTermín: ${term}\n\n${msg}`;
      location.href = `mailto:ahoj@branzly.cz?subject=${encodeURIComponent("Poptávka z webu — " + name)}&body=${encodeURIComponent(body)}`;
      statusEl.textContent = "Přímé odeslání se nepodařilo — otevřeli jsme váš e-mail s předvyplněnou zprávou.";
      statusEl.className = "form-status err";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- rok v patičce ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
