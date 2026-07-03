// ===== Branzly landing — vizuály a efekty =====
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!reduceMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
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

function mainRaf(time) {
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

/* ---------- marquee: zdvojení pásky pro nekonečnou smyčku ---------- */
const track = document.getElementById("marqueeTrack");
track.innerHTML += track.innerHTML;

/* ---------- blur+fade reveal (se staggerem mezi sourozenci) ---------- */
const reveals = document.querySelectorAll(".reveal");
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

/* průsečík: digitální lalok zleva, "lidský" zprava, dotýkají se uprostřed */
const meetCanvas = document.getElementById("asciiMeet");
if (meetCanvas) asciiRender(meetCanvas, (x, y, t) => {
  const wob = 0.012 * Math.sin(t + y * 5);
  let v = 0;
  v = Math.max(v, lobe(x, y, 0.16, 0.42 + wob, 0.26, 0.34));
  v = Math.max(v, lobe(x, y, 0.42, 0.52 + wob, 0.10, 0.06));
  v = Math.max(v, lobe(x, y, 0.86, 0.55 - wob, 0.26, 0.36));
  v = Math.max(v, lobe(x, y, 0.58, 0.50 - wob, 0.10, 0.06));
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

document.querySelectorAll("canvas[data-icon]").forEach((cv) => {
  const icon = ICONS[cv.dataset.icon];
  if (!icon) return;
  const ctx = cv.getContext("2d");
  const px = cv.width / 16;
  // glow vrstva (rozmazané pozadí)
  ctx.filter = "blur(14px)";
  ctx.fillStyle = icon.color;
  icon.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === "#") ctx.fillRect(c * px, r * px, px, px);
  }));
  ctx.filter = "none";
  // ostrá pixel vrstva
  icon.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === "#") ctx.fillRect(c * px + 1, r * px + 1, px - 2, px - 2);
  }));
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

/* ---------- kalendář (aktuální měsíc, dny -> mailto) ---------- */
const MONTHS = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const DOWS = ["Po","Út","St","Čt","Pá","So","Ne"];
const calEl = document.getElementById("calendar");
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
      html += off
        ? `<span class="cal-day off">${d}</span>`
        : `<a class="cal-day${isToday ? " today" : ""}" href="mailto:ahoj@branzly.cz?subject=Rezervace konzultace ${d}. ${m + 1}. ${y}">${d}</a>`;
    }
    html += `</div><div class="cal-times">
      <a href="mailto:ahoj@branzly.cz?subject=Rezervace konzultace 9:00">9:00</a>
      <a href="mailto:ahoj@branzly.cz?subject=Rezervace konzultace 11:00">11:00</a>
      <a href="mailto:ahoj@branzly.cz?subject=Rezervace konzultace 14:00">14:00</a>
      <a href="mailto:ahoj@branzly.cz?subject=Rezervace konzultace 16:00">16:00</a>
    </div>`;
    calEl.innerHTML = html;
    document.getElementById("calPrev").onclick = () => { view.setMonth(view.getMonth() - 1); renderCal(); };
    document.getElementById("calNext").onclick = () => { view.setMonth(view.getMonth() + 1); renderCal(); };
  }
  renderCal();
}

/* ---------- rok v patičce ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
