// ===== David Sak — portfolio: vizuály a efekty =====
// Animace a efekty běží záměrně na VŠECH zařízeních a prohlížečích,
// nezávisle na systémovém nastavení „omezit pohyb". Kdyby bylo někdy
// potřeba tuto volbu respektovat, stačí vrátit:
//   const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
/* pozice kurzoru nad hero plátnem (normalizovaná) — znaky se rozestupují */
let heroMxN = -9, heroMyN = -9;
const heroCanvasEl = document.getElementById("asciiHero");
if (heroVis && finePointer && !reduceMotion) {
  heroVis.addEventListener("mousemove", (e) => {
    const r = heroVis.getBoundingClientRect();
    tiltTX = ((e.clientY - r.top) / r.height - 0.5) * -4;
    tiltTY = ((e.clientX - r.left) / r.width - 0.5) * 5;
    if (heroCanvasEl) {
      const cr = heroCanvasEl.getBoundingClientRect();
      heroMxN = (e.clientX - cr.left) / cr.width;
      heroMyN = (e.clientY - cr.top) / cr.height;
    }
  });
  heroVis.addEventListener("mouseleave", () => { tiltTX = 0; tiltTY = 0; heroMxN = -9; heroMyN = -9; });
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
    marqueeRaf(dt);
    particlesRaf(dt);
    cursorRaf();
    if (meetVisual) {
      const mr = meetVisual.getBoundingClientRect();
      if (mr.bottom > -60 && mr.top < innerHeight + 60) {
        // 0 = vizuál vjíždí zespodu, 1 = vizuál uprostřed obrazovky (dotyk)
        const raw = clamp01((innerHeight * 0.95 - mr.top) / (innerHeight * 0.62));
        meetP += (raw - meetP) * 0.07;
      }
    }
  }
  requestAnimationFrame(mainRaf);
}
requestAnimationFrame(mainRaf);

/* ---------- mobilní nav (jen na stránkách, které ji mají) ---------- */
const toggle = document.getElementById("navToggle");
const mobile = document.getElementById("navMobile");
if (toggle && mobile) {
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
}

/* ---------- marquee: zdvojení pásky, JS pohon reagující na rychlost scrollu ---------- */
const track = document.getElementById("marqueeTrack");
let mqX = 0, mqHalf = 0;
const mqMeasure = () => { if (track) mqHalf = track.scrollWidth / 2; };
if (track) {
  track.innerHTML += track.innerHTML;
  if (!reduceMotion) {
    track.style.animation = "none";
    mqMeasure();
    addEventListener("resize", mqMeasure);
  }
}
function marqueeRaf(dt) {
  if (!track || !mqHalf) return;
  const r = track.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const vel = lenis ? Math.abs(lenis.velocity) : 0;
  const speed = 55 + Math.min(vel * 14, 260); // px/s, zrychlí při scrollu
  mqX = (mqX + speed * dt) % mqHalf;
  track.style.transform = `translate3d(${(-mqX).toFixed(2)}px,0,0)`;
}

/* ---------- ekosystém: beam hub (SVG křivky se světelnými pulzy) ---------- */
/* loga integrací — path data ze simple-icons (CC0) */
const BH_ICONS = {
  slack: "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
  notion: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
  hubspot: "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z",
  stripe: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z",
  postgresql: "M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z",
  zendesk: "M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z",
};

const beamhub = document.getElementById("beamhub");
if (beamhub) {
  const bhSvg = document.getElementById("bhSvg");
  const bhHub = document.getElementById("bhHub");
  const bhNodes = [...beamhub.querySelectorAll(".bh-node")];
  const NS = "http://www.w3.org/2000/svg";
  // vložit loga
  bhNodes.forEach((n) => {
    const d = BH_ICONS[n.dataset.icon];
    if (!d) return;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
    n.prepend(svg);
  });
  // křivky z karet do hubu + pulzy
  function layoutBeams() {
    const br = beamhub.getBoundingClientRect();
    if (!br.width) return;
    bhSvg.setAttribute("viewBox", `0 0 ${Math.round(br.width)} ${Math.round(br.height)}`);
    bhSvg.innerHTML = "";
    const hr = bhHub.getBoundingClientRect();
    const hx = hr.left - br.left + hr.width / 2;
    const hy = hr.top - br.top + hr.height / 2;
    bhNodes.forEach((n, i) => {
      const nr = n.getBoundingClientRect();
      const fromRight = !!n.closest(".bh-right");
      const sx = fromRight ? nr.left - br.left : nr.right - br.left;
      const sy = nr.top - br.top + nr.height / 2;
      const ex = hx + (fromRight ? 46 : -46), ey = hy;
      const bend = Math.min(90, Math.abs(ex - sx) * 0.45);
      const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${(sx + (fromRight ? -bend : bend)).toFixed(1)} ${sy.toFixed(1)}, ${(ex + (fromRight ? bend : -bend)).toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const base = document.createElementNS(NS, "path");
      base.setAttribute("d", d);
      base.setAttribute("class", "bh-path");
      const pulse = document.createElementNS(NS, "path");
      pulse.setAttribute("d", d);
      pulse.setAttribute("pathLength", "100");
      pulse.setAttribute("class", "bh-pulse" + (n.dataset.dir === "out" ? " out" : ""));
      pulse.style.animationDelay = `${(i * 0.65).toFixed(2)}s`;
      bhSvg.append(base, pulse);
    });
  }
  layoutBeams();
  addEventListener("resize", layoutBeams);
  addEventListener("load", layoutBeams);
}

/* živé počítadlo zpracovaných úloh v hubu */
const orbitCount = document.getElementById("orbitCount");
if (orbitCount && beamhub) {
  let n = 1180 + Math.floor(Math.random() * 140);
  const fmt = () => { orbitCount.textContent = n.toLocaleString("cs-CZ"); };
  fmt();
  setInterval(() => {
    const r = beamhub.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    n += 1 + Math.floor(Math.random() * 3);
    fmt();
  }, 900);
}

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

/* ---------- ceník: postupné navázání fází + prokreslovaná spojnice ----------
   Fáze naběhnou v pořadí (1 → 2 → 3) posunem ze své strany a mezi kartami se
   prokreslí SVG spojnice s uzly, která fázi napojuje na fázi. Vše pak zůstává
   trvale vidět — žádné mlžení ani překrývání za scrollu. */
const tierStack = document.querySelector(".tier-stack");
if (tierStack) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "tier-link");
  svg.setAttribute("aria-hidden", "true");
  /* podkladová (tečkovaná) trasa + kreslená čára s gradientem + puls na špičce */
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = '<linearGradient id="tierGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#3455fa"/><stop offset="1" stop-color="#7aa2f7"/></linearGradient>';
  svg.appendChild(defs);
  const track = document.createElementNS(NS, "path");
  track.setAttribute("class", "tier-link-track");
  const linkPath = document.createElementNS(NS, "path");
  linkPath.setAttribute("class", "tier-link-path");
  linkPath.setAttribute("stroke", "url(#tierGrad)");
  const pulse = document.createElementNS(NS, "circle");
  pulse.setAttribute("class", "tier-pulse");
  pulse.setAttribute("r", "5");
  svg.appendChild(track);
  svg.appendChild(linkPath);
  svg.appendChild(pulse);
  const dots = [];
  for (let i = 0; i < 4; i++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "tier-link-dot");
    c.setAttribute("r", "3.5");
    svg.appendChild(c);
    dots.push(c);
  }
  // append (ne prepend), aby SVG nerozhodilo nth-child pořadí fází;
  // vrstvení řeší z-index (spojnice pod kartami)
  tierStack.appendChild(svg);

  const rows = [...tierStack.querySelectorAll(".tier-row")];
  let L = 0;                 // celková délka čáry
  let joins = [1, 0, 0];     // délky, při kterých se "připojí" jednotlivé karty
  let dotLens = [];          // délky, při kterých se rozsvítí koncové tečky

  const buildLink = () => {
    const cards = [...tierStack.querySelectorAll(".tier-card")];
    if (cards.length < 3) return;
    const sr = tierStack.getBoundingClientRect();
    svg.setAttribute("width", sr.width);
    svg.setAttribute("height", sr.height);
    defs.querySelector("linearGradient").setAttribute("y2", sr.height);
    const P = cards.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2 - sr.left, top: r.top - sr.top, bot: r.bottom - sr.top };
    });
    const seg = (a, b) => {
      const dy = (b.top - a.bot) * 0.55;
      return `M ${a.x} ${a.bot} C ${a.x} ${a.bot + dy} ${b.x} ${b.top - dy} ${b.x} ${b.top}`;
    };
    const d = `${seg(P[0], P[1])} ${seg(P[1], P[2])}`;
    linkPath.setAttribute("d", d);
    track.setAttribute("d", d);
    const tmp = document.createElementNS(NS, "path");
    tmp.setAttribute("d", seg(P[0], P[1]));
    const l1 = tmp.getTotalLength();
    L = linkPath.getTotalLength();
    joins = [1, l1, L - 2];
    const ends = [[P[0].x, P[0].bot], [P[1].x, P[1].top], [P[1].x, P[1].bot], [P[2].x, P[2].top]];
    dotLens = [0, l1, l1, L];
    dots.forEach((dt, i) => { dt.setAttribute("cx", ends[i][0]); dt.setAttribute("cy", ends[i][1]); });
    linkPath.style.strokeDasharray = L;
    setProgress(lastP);
  };

  let lastP = 0;
  const setProgress = (p) => {
    if (!L) return;
    lastP = p;
    const drawn = L * p;
    linkPath.style.strokeDashoffset = Math.max(L - drawn, 0);
    if (p > 0.004 && p < 0.996) {
      const pt = linkPath.getPointAtLength(drawn);
      pulse.setAttribute("cx", pt.x);
      pulse.setAttribute("cy", pt.y);
      pulse.style.opacity = "1";
    } else {
      pulse.style.opacity = "0";
    }
    rows.forEach((row, i) => row.classList.toggle("connected", drawn >= joins[i]));
    dots.forEach((dt, i) => dt.classList.toggle("on", drawn >= dotLens[i] - 0.5));
  };

  buildLink();
  addEventListener("load", buildLink);
  addEventListener("resize", buildLink);

  const gsapOK = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (reduceMotion) {
    tierStack.classList.add("in");
    setProgress(1);
  } else if (gsapOK) {
    /* kreslení spojnice řízené scrollem — karty se připojují postupně */
    gsap.registerPlugin(ScrollTrigger);
    tierStack.classList.add("js-scroll", "in");
    linkPath.style.transition = "none";
    ScrollTrigger.create({
      trigger: tierStack,
      start: "top 74%",
      end: "bottom 58%",
      scrub: 0.45,
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: () => buildLink(),
    });
  } else {
    new IntersectionObserver(([en], io) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      tierStack.classList.add("in");
      linkPath.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s";
      requestAnimationFrame(() => setProgress(1));
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }).observe(tierStack);
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

/* ---------- hero: plovoucí particles + filmové zrno ---------- */
const pCanvas = document.getElementById("heroParticles");
let pCtx = null, pDots = [];
if (pCanvas && !reduceMotion) {
  pCtx = pCanvas.getContext("2d");
  const heroEl = pCanvas.parentElement;
  function pSize() {
    pCanvas.width = heroEl.clientWidth;
    pCanvas.height = heroEl.clientHeight;
  }
  pSize();
  addEventListener("resize", pSize);
  for (let i = 0; i < 34; i++) {
    pDots.push({
      x: Math.random(), y: Math.random(),
      r: 1 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.008,
      vy: -0.004 - Math.random() * 0.01,
      a: 0.08 + Math.random() * 0.2,
      blue: Math.random() < 0.35,
    });
  }
}
function particlesRaf(dt) {
  if (!pCtx) return;
  const r = pCanvas.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const W = pCanvas.width, H = pCanvas.height;
  pCtx.clearRect(0, 0, W, H);
  for (const d of pDots) {
    d.x += d.vx * dt * 10;
    d.y += d.vy * dt * 10;
    if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
    if (d.x < -0.02) d.x = 1.02;
    if (d.x > 1.02) d.x = -0.02;
    pCtx.globalAlpha = d.a;
    pCtx.fillStyle = d.blue ? "#3455fa" : "#9a9a9a";
    pCtx.beginPath();
    pCtx.arc(d.x * W, d.y * H, d.r, 0, 6.2832);
    pCtx.fill();
  }
  pCtx.globalAlpha = 1;
}
// filmové zrno přes hero (jednou vygenerovaný noise tile)
const heroSection = document.querySelector(".hero");
if (heroSection && !reduceMotion) {
  const g = document.createElement("canvas");
  g.width = g.height = 128;
  const gx = g.getContext("2d");
  const img = gx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.floor(Math.random() * 130);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gx.putImageData(img, 0, 0);
  const grain = document.createElement("div");
  grain.className = "grain";
  grain.style.backgroundImage = `url(${g.toDataURL()})`;
  heroSection.appendChild(grain);
}

/* ---------- spotlight karty (radiální světlo sledující kurzor) ---------- */
if (finePointer) {
  document.querySelectorAll(".feature-cell, .tier-card, .case, .tl-card, .team-card").forEach((card) => {
    card.classList.add("spot");
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty("--sy", `${(e.clientY - r.top).toFixed(0)}px`);
    });
  });
}

/* ---------- vlastní kurzor (tečka -> kroužek nad interaktivními prvky) ---------- */
let cursorEl = null, curX = -100, curY = -100, curTX = -100, curTY = -100;
if (finePointer && !reduceMotion) {
  cursorEl = document.createElement("i");
  cursorEl.className = "cursor-dot";
  document.body.appendChild(cursorEl);
  addEventListener("mousemove", (e) => {
    curTX = e.clientX; curTY = e.clientY;
    cursorEl.classList.add("on");
  });
  document.documentElement.addEventListener("mouseleave", () => cursorEl.classList.remove("on"));
  const INTERACTIVE = "a, button, summary, input, textarea, .cal-day, .cal-time";
  addEventListener("mouseover", (e) => cursorEl.classList.toggle("big", !!e.target.closest(INTERACTIVE)));
}
function cursorRaf() {
  if (!cursorEl) return;
  curX += (curTX - curX) * 0.22;
  curY += (curTY - curY) * 0.22;
  cursorEl.style.transform = `translate(${curX.toFixed(1)}px, ${curY.toFixed(1)}px)`;
}

/* ---------- easter egg: klávesa G zapne design mřížku ---------- */
addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "g" || e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  document.body.classList.toggle("grid-on");
});

/* ---------- selection handles na hover karet (design-tool motiv) ---------- */
document.querySelectorAll(".tier-card, .feature-cell").forEach((card) => {
  card.classList.add("handles");
  for (let i = 1; i <= 4; i++) {
    const h = document.createElement("i");
    h.className = `h h${i}`;
    card.appendChild(h);
  }
});

/* ---------- napočítávaná čísla (stats sekce, mockupy) ---------- */
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  new IntersectionObserver(([en], io) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1400;
    (function tick(now) {
      const p = clamp01((now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }, { threshold: 0.5 }).observe(el);
});

/* ---------- mock chat: přehrání konverzace při najetí do viewportu ---------- */
document.querySelectorAll('[data-mock="chat"]').forEach((mock) => {
  const chat = mock.querySelector(".mock-chat");
  const msgs = [...mock.querySelectorAll(".chat-msg")];
  if (!chat || !msgs.length) return;
  const typings = [...mock.querySelectorAll(".chat-typing")];
  const plan = msgs.map((el) => {
    const citeEl = el.querySelector(".chat-cite");
    const citeText = citeEl ? citeEl.textContent : "";
    const text = el.textContent.replace(citeText, "").trim();
    return { el, user: el.classList.contains("user"), text, citeEl, citeText };
  });
  const reduce2 = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce2) { msgs.forEach((m) => m.classList.add("show")); typings.forEach((t) => t.remove()); return; }
  const zzz = (ms) => new Promise((r) => setTimeout(r, ms));
  /* skroluj jen po spodek právě zobrazeného prvku (skryté zprávy dál zabírají místo) */
  const follow = (el) => { chat.scrollTop = Math.max(0, el.offsetTop + el.offsetHeight + 14 - chat.clientHeight); };
  let running = false;
  async function play() {
    if (running) return; running = true;
    while (true) {
      /* reset kola */
      mock.classList.add("chat-reset");
      await zzz(420);
      msgs.forEach((m) => m.classList.remove("show"));
      typings.forEach((t) => t.classList.remove("show"));
      chat.querySelectorAll(".chat-tool").forEach((t) => t.remove());
      mock.classList.remove("chat-reset");
      await zzz(380);
      for (const st of plan) {
        if (st.user) {
          st.el.classList.add("show");
          follow(st.el);
          await zzz(950);
        } else {
          const prev = st.el.previousElementSibling;
          const ty = prev && prev.classList.contains("chat-typing") ? prev : null;
          if (ty) { ty.classList.add("show"); await zzz(820); ty.classList.remove("show"); }
          /* chip s "voláním nástroje" odvozený z citace zdroje */
          if (st.citeText) {
            const chip = document.createElement("div");
            chip.className = "chat-tool";
            const label = st.citeText.replace(/^Zdroj:\s*/i, "čtu ").replace(/^Akce:\s*/i, "spouštím ");
            chip.innerHTML = "→ " + label + " <b>…</b>";
            chat.insertBefore(chip, st.el);
            requestAnimationFrame(() => { chip.classList.add("show"); follow(chip); });
            await zzz(900);
            chip.querySelector("b").textContent = "✓";
            chip.classList.add("done");
            await zzz(320);
          }
          /* streamování odpovědi po slovech */
          st.el.textContent = "";
          st.el.classList.add("show", "streaming");
          const words = st.text.split(/\s+/);
          for (const w of words) {
            st.el.textContent += (st.el.textContent ? " " : "") + w;
            follow(st.el);
            await zzz(44);
          }
          st.el.classList.remove("streaming");
          if (st.citeEl) st.el.appendChild(st.citeEl);
          await zzz(650);
        }
        follow(st.el);
      }
      await zzz(4200);
    }
  }
  new IntersectionObserver(([en], io) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    play();
  }, { threshold: 0.35 }).observe(mock);
});

/* ---------- tlačítka: efekt odlesku (shine sweep) je čistě v CSS, .btn::after ---------- */

/* ---------- blur+fade reveal (se staggerem mezi sourozenci) ---------- */
/* sledují se i .split nadpisy bez vlastního .reveal (FAQ, CTA) — jinak by
   jejich slova zůstala navždy schovaná pod maskou */
const reveals = document.querySelectorAll(".reveal, main h3.split:not(.reveal)");
// stagger: pořadí v rámci rodiče -> --i
document.querySelectorAll(".feature-grid, .case-grid, .faq-list, .tag-strip, .stats-grid, .study-stats, .ref-grid, .mf-list, .explore-grid").forEach((parent) => {
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
      if (reduceMotion) { item.open = false; return; }
      const done = (ev) => {
        if (ev.propertyName !== "max-height") return;
        body.removeEventListener("transitionend", done);
        item.open = false;
      };
      body.addEventListener("transitionend", done);
    } else {
      item.open = true;
      requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + "px"; });
    }
  });
});

/* ---------- ASCII renderer ----------
   Hustotní pole -> ASCII znaky. shapeFn(x, y, t) vrací 0..1.
   Kvůli výkonu se znaky kreslí z předrenderovaného atlasu (drawImage je
   řádově levnější než fillText + změny fillStyle) a dekorativní animace
   běží na ~30 fps — u pomalého vlnění je to nerozeznatelné. */
const RAMP = " .·:;+*#@";
const CHARS = RAMP.length - 1;
const SHADES = 8;
let glyphAtlas = null;
function getGlyphAtlas(cell) {
  if (glyphAtlas) return glyphAtlas;
  const cv = document.createElement("canvas");
  const cw = cell + 2, ch = Math.ceil(cell * 1.15) + 2;
  cv.width = cw * CHARS;
  cv.height = ch * SHADES;
  const cx = cv.getContext("2d");
  cx.font = `${cell + 1}px monospace`;
  cx.textBaseline = "top";
  for (let s = 0; s < SHADES; s++) {
    const shade = 40 + Math.floor((1 - (s + 0.5) / SHADES) * 130);
    cx.fillStyle = `rgb(${shade},${shade},${shade})`;
    for (let i = 0; i < CHARS; i++) cx.fillText(RAMP[i + 1], i * cw + 1, s * ch + 1);
  }
  glyphAtlas = { cv, cw, ch };
  return glyphAtlas;
}

function asciiRender(canvas, shapeFn, animate) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cell = 8;
  const cols = Math.floor(W / cell), rows = Math.floor(H / (cell * 1.15));
  const atlas = getGlyphAtlas(cell);

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c / cols, y = r / rows;
        let v = shapeFn(x, y, t);
        if (v <= 0.04) continue;
        v = Math.min(1, v);
        const idx = Math.floor(v * CHARS);
        if (idx < 1) continue;
        const s = Math.min(SHADES - 1, Math.floor(v * SHADES));
        ctx.drawImage(atlas.cv, (idx - 1) * atlas.cw, s * atlas.ch, atlas.cw, atlas.ch,
          c * cell - 1, r * cell * 1.15 - 1, atlas.cw, atlas.ch);
      }
    }
  }

  if (animate && !reduceMotion) {
    let raf, last = 0;
    const loop = (ms) => {
      if (ms - last >= 31) { last = ms; frame(ms / 1000); }
      raf = requestAnimationFrame(loop);
    };
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

/* hero: dvě ruce/laloky natahující se k sobě; znaky se rozestupují kolem kurzoru */
const heroCanvas = document.getElementById("asciiHero");
if (heroCanvas) asciiRender(heroCanvas, (x, y, t) => {
  if (heroMxN > -5) {
    const dx = x - heroMxN, dy = (y - heroMyN) * 0.49; // poměr stran plátna
    const dd = dx * dx + dy * dy;
    const f = Math.exp(-dd / 0.006);
    if (f > 0.02) {
      const inv = 1 / Math.sqrt(dd + 1e-4);
      x += dx * inv * 0.035 * f;
      y += dy * inv * 0.07 * f;
    }
  }
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

/* průsečík: ASCII ruka AI zleva se scrollem natahuje k lidské ruce zprava
   (jemný halftone, fotografický ráz) — Michelangelo kompozice jako předloha.
   Nad rukama pluje čtyřcípá hvězda, při dotyku přeskočí jiskra. */
const meetCanvas = document.getElementById("asciiMeet");
if (meetCanvas) {
  const mctx = meetCanvas.getContext("2d");
  const MW = meetCanvas.width, MH = meetCanvas.height;

  /* Fotorealistická ruka: nahrajte assets/hand.png (ruka zprava, prsty
     doleva, bílé/průhledné pozadí) a použije se místo halftone renderu.
     Konstanty níže slouží k doladění pozice fotky. */
  const HAND_H = 1.12;      // výška fotky vůči výšce plátna (paže přetéká přes horní roh)
  const HAND_RIGHT = -0.187; // odsazení od pravého okraje (záporné = paže bleedne z rohu)
  const HAND_TOP = -0.483;  // svislé usazení (podíl výšky)
  const HAND_TRAVEL = 0.24; // o kolik (v jednotkách výšky) se fotka přisune při meetP=1
  const handImg = new Image();
  let handReady = false;
  handImg.onload = () => { handReady = true; };
  handImg.onerror = () => { handReady = false; };
  handImg.src = "assets/hand.png";
  const ASP = MW / MH; // souřadnice: X v [0, ASP], y v [0,1] — vzdálenosti izotropní
  const mcell = 8, dcell = 3; // jemnější rastr pro lidskou ruku
  const mcols = Math.floor(MW / mcell), mrows = Math.floor(MH / (mcell * 1.15));
  const dcols = Math.floor(MW / dcell), drows = Math.floor(MH / dcell);
  const matlas = getGlyphAtlas(mcell);

  // hustota kapsle (úsečka s poloměrem) — z nich se skládají dlaně a prsty
  function cap(X, y, x1, y1, x2, y2, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1e-6;
    let t = ((X - x1) * dx + (y - y1) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = x1 + t * dx - X, py = y1 + t * dy - y;
    const d2 = (px * px + py * py) / (r * r);
    return d2 >= 1 ? 0 : 1 - d2;
  }
  // čtyřcípá hvězda (astroida) — sparkle jako v předloze
  function star4(X, y, cx, cy, s) {
    const dx = Math.abs(X - cx) / s, dy = Math.abs(y - cy) / s;
    const r = Math.pow(Math.sqrt(dx) + Math.sqrt(dy), 2);
    return r >= 1 ? 0 : 1 - r;
  }

  function aiHand(X, y, t) {
    X -= 0.12 * meetP; // celá paže se přisouvá ke středu
    const w = 0.008 * Math.sin(t * 1.1 + y * 9); // digitální chvění
    let v = cap(X, y, -0.25, 0.72 + w, 0.72, 0.60 + w, 0.105);     // předloktí
    v = Math.max(v, cap(X, y, 0.72, 0.585, 0.95, 0.55, 0.10));     // dlaň
    v = Math.max(v, cap(X, y, 0.98, 0.525, 1.30 + 0.06 * meetP, 0.497, 0.029)); // ukazovák
    v = Math.max(v, cap(X, y, 1.00, 0.567, 1.22, 0.568, 0.026));   // prostředník
    v = Math.max(v, cap(X, y, 0.985, 0.615, 1.16, 0.628, 0.024));  // prsteník
    v = Math.max(v, cap(X, y, 0.96, 0.66, 1.09, 0.677, 0.019));    // malík
    v = Math.max(v, cap(X, y, 0.85, 0.50, 0.99, 0.42, 0.026));     // palec
    return v;
  }
  /* lidská ruka: hřbet dlaně a prsty s klouby v póze podle předlohy —
     ukazovák natažený, ostatní kaskádovitě pokrčené, palec kříží pod
     dlaní. Vrací parabolickou "výšku" 0..1 pro objemové stínování. */
  function humanHand(X, y) {
    X += 0.22 * meetP; // celá ruka vychází vstříc
    let v = cap(X, y, ASP + 0.25, 0.82, 2.45, 0.615, 0.10);          // předloktí
    v = Math.max(v, cap(X, y, 2.50, 0.63, 2.40, 0.595, 0.095));      // zápěstí
    v = Math.max(v, cap(X, y, 2.42, 0.60, 2.22, 0.52, 0.105));       // dlaň
    v = Math.max(v, cap(X, y, 2.30, 0.56, 2.18, 0.50, 0.09));
    // ukazovák — natažený, špička mírně vzhůru
    v = Math.max(v, cap(X, y, 2.14, 0.475, 1.95, 0.468, 0.028));
    v = Math.max(v, cap(X, y, 1.95, 0.468, 1.78 - 0.06 * meetP, 0.478, 0.024));
    // prostředník — pokrčený
    v = Math.max(v, cap(X, y, 2.16, 0.525, 1.96, 0.535, 0.027));
    v = Math.max(v, cap(X, y, 1.96, 0.535, 1.87, 0.567, 0.023));
    // prsteník — víc pokrčený
    v = Math.max(v, cap(X, y, 2.18, 0.573, 2.02, 0.60, 0.025));
    v = Math.max(v, cap(X, y, 2.02, 0.60, 1.96, 0.647, 0.021));
    // malík — nejvíc pokrčený
    v = Math.max(v, cap(X, y, 2.21, 0.617, 2.10, 0.65, 0.020));
    v = Math.max(v, cap(X, y, 2.10, 0.65, 2.06, 0.70, 0.017));
    // palec — kříží pod dlaní doleva dolů
    v = Math.max(v, cap(X, y, 2.25, 0.545, 2.12, 0.60, 0.026));
    v = Math.max(v, cap(X, y, 2.12, 0.60, 2.02, 0.628, 0.022));
    return v;
  }

  function meetFrame(t) {
    mctx.clearRect(0, 0, MW, MH);
    const sparkA = clamp01((meetP - 0.82) / 0.18);
    // A) ASCII vrstva: AI ruka + hvězda + jiskra dotyku
    for (let r = 0; r < mrows; r++) {
      for (let c = 0; c < mcols; c++) {
        const X = ((c + 0.5) / mcols) * ASP, y = (r + 0.5) / mrows;
        if (X > 1.9) continue;
        let v = Math.min(1, aiHand(X, y, t) * 1.35) * (0.62 + 0.38 * noise(X, y, t));
        const st = star4(X, y, 1.42, 0.22, 0.15 + 0.015 * Math.sin(t * 1.4)) * (0.75 + 0.25 * Math.sin(t * 2.2));
        v = Math.max(v, st);
        if (sparkA > 0.02) {
          const sp = star4(X, y, 1.53, 0.503, 0.06 + 0.06 * sparkA) * sparkA * (0.65 + 0.35 * Math.sin(t * 8));
          v = Math.max(v, sp);
        }
        if (v <= 0.04) continue;
        v = Math.min(1, v);
        const idx = Math.floor(v * CHARS);
        if (idx < 1) continue;
        const s = Math.min(SHADES - 1, Math.floor(v * SHADES));
        mctx.drawImage(matlas.cv, (idx - 1) * matlas.cw, s * matlas.ch, matlas.cw, matlas.ch,
          c * mcell - 1, r * mcell * 1.15 - 1, matlas.cw, matlas.ch);
      }
    }
    // B) lidská ruka: fotka (pokud je nahraná), jinak halftone tečky
    if (handReady) {
      const s = (MH * HAND_H) / handImg.height;
      const w = handImg.width * s, h = handImg.height * s;
      const x = MW - w - MW * HAND_RIGHT - HAND_TRAVEL * meetP * MH;
      mctx.save();
      mctx.filter = "grayscale(1)";
      mctx.drawImage(handImg, x, MH * HAND_TOP, w, h);
      mctx.restore();
    } else {
      // procedurální halftone s objemovým stínováním: světlé hřbety prstů,
      // tmavé kontury na okrajích, světlo shora — dojem jemného tisku
      for (let r = 0; r < drows; r++) {
        const y = (r + 0.5) / drows;
        if (y < 0.32 || y > 0.97) continue;
        for (let c = 0; c < dcols; c++) {
          const X = ((c + 0.5) / dcols) * ASP;
          if (X < 1.35) continue;
          const h = humanHand(X, y);
          if (h <= 0.02) continue;
          // numerický sklon podle osy y = směr světla shora
          const grad = humanHand(X, y - 0.012) - humanHand(X, y + 0.012);
          const lambert = Math.min(1, Math.max(0.25, 0.66 + grad * 2.4));
          const core = Math.sqrt(Math.min(1, h)); // 1 = střed prstu (válcový lesk)
          const lum = Math.min(1, (0.28 + 0.58 * core) * lambert);
          const dark = 1 - lum;
          if (dark <= 0.10) continue;
          const s = 0.7 + dark * 2.45;
          const g = 68 + Math.floor(lum * 138);
          mctx.fillStyle = `rgb(${g},${g},${g})`;
          mctx.fillRect(c * dcell + (dcell - s) / 2, r * dcell + (dcell - s) / 2, s, s);
        }
      }
    }
  }

  let mraf, mlast = 0;
  const mloop = (ms) => {
    if (ms - mlast >= 31) { mlast = ms; meetFrame(ms / 1000); } // ~30 fps
    mraf = requestAnimationFrame(mloop);
  };
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) mraf = requestAnimationFrame(mloop);
    else cancelAnimationFrame(mraf);
  }).observe(meetCanvas);
}

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

  // glow se předrenderuje jednou do offscreen canvasu — blur filtr při
  // každém snímku byl hlavní příčina trhání této sekce
  const glow = document.createElement("canvas");
  glow.width = cv.width;
  glow.height = cv.height;
  const gx = glow.getContext("2d");
  gx.filter = "blur(14px)";
  gx.fillStyle = icon.color;
  for (const p of pixels) gx.fillRect(p.c * px, p.r * px, px, px);

  let buildStart = -1, hoverT = -1e9, raf = 0, running = false, last = 0;

  function frame(now) {
    if (now - last < 31) { raf = requestAnimationFrame(frame); return; } // ~30 fps
    last = now;
    const t = now / 1000;
    if (buildStart < 0) buildStart = t;
    const bt = t - buildStart;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // glow vrstva (dýchá)
    ctx.globalAlpha = clamp01(bt / 1.05) * (0.7 + 0.3 * Math.sin(t * 1.8));
    ctx.drawImage(glow, 0, 0);
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

/* Cal.com rezervace: až budete mít založený účet, vyplňte sem reálný odkaz
   (např. "davidsak/konzultace") a místo vlastního kalendáře se vloží živý
   rezervační widget se skutečnými sloty. Dokud je prázdný, renderuje se náš
   vlastní interaktivní kalendář — placeholder odkaz by se načetl rozbitě. */
const CAL_LINK = "";

if (calEl && CAL_LINK) {
  calEl.classList.add("cal-embed");
  calEl.innerHTML = `<iframe src="https://cal.com/${CAL_LINK}?embed=true&theme=light" loading="lazy" title="Rezervace konzultace"></iframe>`;
} else if (calEl) {
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

/* ---------- kontaktní formulář ----------
   Kaskáda odeslání:
   1. /api/contact — vlastní backend (Vercel serverless + Resend, viz api/contact.js);
      funguje po nasazení na Vercel s env RESEND_API_KEY
   2. FormSubmit — bez backendu; po první zprávě přijde na business@dsak.tech
      aktivační e-mail, stačí potvrdit
   3. mailto — otevře e-mailového klienta návštěvníka s předvyplněnou zprávou */
const FORM_ENDPOINTS = ["/api/contact", "https://formsubmit.co/ajax/business@dsak.tech"];
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
      let sent = false;
      for (const endpoint of FORM_ENDPOINTS) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ name, email, term, message: msg, _subject: `Poptávka z webu — ${name}` }),
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          if (res.ok) { sent = true; break; }
        } catch { /* zkusí další endpoint */ }
      }
      if (!sent) throw new Error("no endpoint");
      contactForm.reset();
      selDate = null; selTime = null; updateTerm(); calRerender();
      statusEl.textContent = "✓ Díky za poptávku! Ozveme se vám do 24 hodin.";
      statusEl.className = "form-status ok";
    } catch {
      // záložní cesta: předvyplněný e-mail v klientovi návštěvníka
      const body = `Jméno: ${name}\nE-mail: ${email}\nTermín: ${term}\n\n${msg}`;
      location.href = `mailto:business@dsak.tech?subject=${encodeURIComponent("Poptávka z webu — " + name)}&body=${encodeURIComponent(body)}`;
      statusEl.textContent = "Přímé odeslání se nepodařilo — otevřeli jsme váš e-mail s předvyplněnou zprávou.";
      statusEl.className = "form-status err";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- lead magnet: checklist na e-mail ---------- */
const magnetForm = document.getElementById("magnetForm");
if (magnetForm) {
  const mEmail = document.getElementById("magnetEmail");
  const mStatus = document.getElementById("magnetStatus");
  mEmail.addEventListener("input", () => mEmail.classList.remove("invalid"));
  magnetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = mEmail.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      mEmail.classList.add("invalid");
      mStatus.textContent = "Zadejte prosím platný e-mail.";
      mStatus.className = "form-status err";
      return;
    }
    mStatus.textContent = "Odesílám…";
    mStatus.className = "form-status";
    try {
      let sent = false;
      for (const endpoint of FORM_ENDPOINTS) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ name: "Checklist", email, message: "Žádost o checklist automatizace", _subject: `Checklist — ${email}` }),
          });
          if (res.ok) { sent = true; break; }
        } catch { /* zkusí další endpoint */ }
      }
      if (!sent) throw new Error("no endpoint");
      magnetForm.reset();
      mStatus.textContent = "✓ Díky! Checklist vám dorazí do pár minut.";
      mStatus.className = "form-status ok";
    } catch {
      mStatus.textContent = "Odeslání se nepodařilo — napište mi přímo na business@dsak.tech.";
      mStatus.className = "form-status err";
    }
  });
}

/* ---------- rok v patičce ---------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- živý čas v patičce (ČR, Europe/Prague) ---------- */
const pragueEl = document.getElementById("pragueTime");
if (pragueEl) {
  const fmt = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Prague" });
  const tick = () => { pragueEl.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
}

/* ---------- sticky CTA: zobrazit po hero, skrýt u kontaktu, křížkem zavřít ---------- */
const stickyCta = document.getElementById("stickyCta");
if (stickyCta) {
  const heroEl = document.querySelector(".hero");
  const kontaktEl = document.getElementById("kontakt");
  let dismissed = sessionStorage.getItem("ctaDismissed") === "1";
  const sync = () => {
    const vh = window.innerHeight || 800;
    const pastHero = heroEl.getBoundingClientRect().bottom < 0;
    const nearContact = kontaktEl.getBoundingClientRect().top < vh;
    const show = !dismissed && pastHero && !nearContact;
    stickyCta.classList.toggle("show", show);
    stickyCta.setAttribute("aria-hidden", String(!show));
  };
  const closeBtn = stickyCta.querySelector(".sticky-close");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    dismissed = true;
    sessionStorage.setItem("ctaDismissed", "1");
    sync();
  });
  window.addEventListener("scroll", sync, { passive: true });
  sync();
}

/* ---------- reference: kurzorový spotlight na kartách ---------- */
document.querySelectorAll(".ref").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  });
});

/* ---------- GSAP ScrollTrigger: scrub animace ---------- */
const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
if (hasGsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);
  addEventListener("load", () => ScrollTrigger.refresh());

  // proces: linka se kreslí podle scrollu, body se rozsvěcí
  const tl = document.getElementById("timeline");
  if (tl) {
    gsap.to("#tlProgress", {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: tl, start: "top 72%", end: "bottom 72%", scrub: true },
    });
    tl.querySelectorAll(".tl-dot").forEach((d) => {
      ScrollTrigger.create({
        trigger: d, start: "top 72%",
        onEnter: () => d.classList.add("on"),
        onLeaveBack: () => d.classList.remove("on"),
      });
    });
  }

  // citace: slova se rozsvěcí postupně se scrollem
  if (quoteWords.length) {
    gsap.to(quoteWords, {
      opacity: 1, ease: "none", stagger: 0.05,
      scrollTrigger: { trigger: ".big-quote", start: "top 88%", end: "center 42%", scrub: true },
    });
  }

  // vizuály: jemné scale-in při vjezdu do viewportu
  const meetC = document.getElementById("asciiMeet");
  if (meetC) {
    gsap.fromTo(meetC, { scale: 0.93, opacity: 0.7 }, {
      scale: 1, opacity: 1, ease: "none",
      scrollTrigger: { trigger: meetC, start: "top 92%", end: "top 42%", scrub: true },
    });
  }
  const qPhoto = document.querySelector(".quote-photo");
  if (qPhoto) {
    gsap.fromTo(qPhoto, { scale: 1.07 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: ".big-quote", start: "top 92%", end: "top 40%", scrub: true },
    });
  }
} else {
  // fallback bez GSAP nebo s omezeným pohybem: rovnou finální stavy
  document.querySelectorAll(".big-quote .qw").forEach((w) => { w.style.opacity = 1; });
  const tp = document.getElementById("tlProgress");
  if (tp) tp.style.transform = "scaleY(1)";
  document.querySelectorAll(".tl-dot").forEach((d) => d.classList.add("on"));
}

/* ===== David Sak — dodatečné animace & interakce ===== */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* kurzorový spotlight */
  const sp = document.getElementById("spotlight");
  if (sp && fine && !reduce) {
    let raf = 0, x = 0, y = 0;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY; sp.classList.add("on");
      if (!raf) raf = requestAnimationFrame(() => {
        sp.style.setProperty("--mx", x + "px");
        sp.style.setProperty("--my", y + "px");
        raf = 0;
      });
    }, { passive: true });
  }

  /* hero — rotující slovo */
  const rot = document.getElementById("heroRotator");
  if (rot && !reduce) {
    const words = ["AI agenty", "automatizace", "webové aplikace", "datové pipeline", "RAG systémy"];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      rot.classList.remove("swap"); void rot.offsetWidth;
      rot.textContent = words[i];
      rot.classList.add("swap");
    }, 2300);
  }

  /* terminál — editor se záložkami, psaním kódu a spuštěním */
  const codeEl = document.getElementById("termCode");
  const curEl = document.getElementById("termCursor");
  const tabsEl = document.getElementById("termTabs");
  const gutterEl = document.getElementById("termGutter");
  const outEl = document.getElementById("termOut");
  const outCodeEl = document.getElementById("termOutCode");
  const runBtn = document.getElementById("termRun");
  const langEl = document.getElementById("termLang");
  const metaEl = document.getElementById("termMeta");
  if (codeEl && tabsEl && langEl) {
    const snippets = [
      { title: "agent.py", lang: "python", meta: "⎇ main ✓ · 3.12", code:
`from anthropic import Anthropic

client = Anthropic()

def agent(otazka, tools):
    # LLM smyčka s nástroji a citací zdroje
    msg = client.messages.create(
        model="claude-sonnet-5",
        tools=tools,
        messages=[{"role": "user", "content": otazka}],
    )
    return handle(msg)  # nejistotu předá člověku`,
        out: [
          "$ python agent.py",
          '→ dotaz: "Kolik objednávek čeká na schválení?"',
          "→ tool: erp.fronta_schvaleni() … ✓",
          "✓ odpověď s citací doručena · 2,1 s · exit 0",
        ] },
      { title: "rag.ts", lang: "typescript", meta: "⎇ main ✓ · node 22", code:
`export async function search(q: string) {
  const vec = await embed(q)          // dotaz -> vektor
  const { rows } = await db.query(SQL, [vec])
  return rows.map((r) => ({
    text: r.chunk,
    source: r.source,                 // vždy s citací
  }))
}`,
        out: [
          '$ tsx rag.ts "výpovědní lhůta"',
          "→ embedding … ✓ (768 dim)",
          "→ nalezeno 5 pasáží · zdroj: smlouva.pdf",
          "✓ hotovo · 180 ms · exit 0",
        ] },
      { title: "pipeline.py", lang: "python", meta: "⎇ main ✓ · 3.12", code:
`@flow
def sync_faktury():
    for inv in erp.pull("pending"):
        if crm.verify(inv):
            approve(inv)              # ~80 % automaticky
        else:
            slack.notify("#schvalovani", inv)`,
        out: [
          "$ python pipeline.py --run",
          "→ 6 objednávek ve frontě",
          "→ 4× schváleno automaticky · 2× → #schvalovani",
          "✓ pipeline dokončena · 11 min ušetřeno · exit 0",
        ] },
    ];

    /* záložky souborů */
    const tabs = snippets.map((s0, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.tabIndex = -1;
      b.className = "term-tab";
      b.textContent = s0.title;
      b.addEventListener("click", () => { if (!reduce) jumpTo(i); });
      tabsEl.appendChild(b);
      return b;
    });
    const setTab = (i) => {
      tabs.forEach((t, j) => t.classList.toggle("on", j === i));
      langEl.textContent = snippets[i].lang;
      if (metaEl) metaEl.textContent = snippets[i].meta;
    };

    const KW = /\b(from|import|def|return|export|async|function|await|const|let|for|if|else|class|new|in)\b/g;
    const esc = (s0) => s0.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    function hl(code, lang) {
      return esc(code).split("\n").map((line) => {
        const ci = lang === "python" ? line.indexOf("#") : line.indexOf("//");
        let head = line, tail = "";
        if (ci >= 0) { head = line.slice(0, ci); tail = '<span class="tk-com">' + line.slice(ci) + "</span>"; }
        head = head
          .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tk-str">$1</span>')
          .replace(KW, '<span class="tk-kw">$1</span>')
          .replace(/\b(\d+)\b/g, '<span class="tk-num">$1</span>');
        return head + tail;
      }).join("\n");
    }
    const gut = (n) => { gutterEl.textContent = Array.from({ length: Math.max(n, 1) }, (_, i) => i + 1).join("\n"); };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let epoch = 0;       // zneplatní běžící smyčku při ručním přepnutí tabu
    let started = false;

    async function typeOut(lines, ep) {
      outEl.classList.add("on");
      outCodeEl.innerHTML = "";
      for (const ln of lines) {
        if (ep !== epoch) return;
        const div = document.createElement("div");
        div.className = ln.startsWith("✓") ? "ln-ok" : ln.startsWith("$") ? "ln-cmd" : "ln-step";
        outCodeEl.appendChild(div);
        for (let k = 0; k < ln.length; k++) {
          if (ep !== epoch) return;
          div.textContent += ln[k];
          await sleep(7);
        }
        await sleep(260);
      }
    }

    async function playFrom(startIdx) {
      const ep = ++epoch;
      let si = startIdx;
      while (true) {
        if (ep !== epoch) return;
        const s0 = snippets[si];
        setTab(si);
        outEl.classList.remove("on");
        outCodeEl.innerHTML = "";
        codeEl.textContent = "";
        gut(1);
        if (curEl) curEl.style.display = "";
        let lines = 1;
        for (let k = 0; k < s0.code.length; k++) {
          if (ep !== epoch) return;
          codeEl.textContent += s0.code[k];
          if (s0.code[k] === "\n") { lines++; gut(lines); }
          await sleep(s0.code[k] === "\n" ? 34 : 11 + Math.random() * 20);
        }
        codeEl.innerHTML = hl(s0.code, s0.lang);
        if (curEl) curEl.style.display = "none";
        await sleep(350);
        runBtn.classList.add("busy");
        await typeOut(s0.out, ep);
        runBtn.classList.remove("busy");
        if (ep !== epoch) return;
        await sleep(2100);
        si = (si + 1) % snippets.length;
      }
    }
    const jumpTo = (i) => playFrom(i);
    if (runBtn) runBtn.addEventListener("click", () => { if (!reduce) playFrom(tabs.findIndex((t) => t.classList.contains("on"))); });

    function boot() {
      if (started) return; started = true;
      if (reduce) {
        const s0 = snippets[0];
        setTab(0);
        codeEl.innerHTML = hl(s0.code, s0.lang);
        gut(s0.code.split("\n").length);
        if (curEl) curEl.style.display = "none";
        outEl.classList.add("on");
        outCodeEl.innerHTML = s0.out.map((l) => `<div class="${l.startsWith("✓") ? "ln-ok" : l.startsWith("$") ? "ln-cmd" : "ln-step"}">${l}</div>`).join("");
        return;
      }
      playFrom(0);
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) boot(); });
    }, { threshold: 0.25 });
    io.observe(codeEl);
  }

  /* 3D tilt na repo kartách */
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(720px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* brána na heslo (SebCaffe) — AES-GCM dešifrování URL klíčem odvozeným z hesla */
  document.querySelectorAll(".repo-card.locked").forEach((card) => {
    const btn = card.querySelector("[data-gate]");
    const box = card.querySelector(".gate-box");
    const input = card.querySelector(".gate-input");
    const submit = card.querySelector(".gate-submit");
    const msg = card.querySelector(".gate-msg");
    if (!btn || !box || !input || !submit) return;
    btn.addEventListener("click", () => { box.hidden = false; btn.hidden = true; input.focus(); });
    const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    async function unlock() {
      const pass = (input.value || "").trim();
      if (!pass) return;
      msg.textContent = "Ověřuji…"; msg.className = "gate-msg";
      try {
        const salt = b64d(card.dataset.salt), iv = b64d(card.dataset.iv), ct = b64d(card.dataset.ct);
        const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
          { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
          baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
        const url = new TextDecoder().decode(pt);
        msg.textContent = "Odemčeno — otevírám demo…"; msg.className = "gate-msg ok";
        window.open(url, "_blank", "noopener");
      } catch (err) {
        msg.textContent = "Špatné heslo. Zkuste to znovu."; msg.className = "gate-msg err";
      }
    }
    submit.addEventListener("click", unlock);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); unlock(); } });
  });
})();

/* ===== scroll progress bar + animace ceníku ===== */
(function () {
  if (!document.querySelector(".scroll-progress")) {
    var bar = document.createElement("div"); bar.className = "scroll-progress"; document.body.appendChild(bar);
    var upd = function () { var h = document.documentElement; var sc = h.scrollTop || document.body.scrollTop; var mx = (h.scrollHeight - h.clientHeight) || 1; bar.style.width = (sc / mx * 100) + "%"; };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var prices = [].slice.call(document.querySelectorAll(".cprice"));
  if (prices.length) {
    var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
    var run = function (el) { var to = +el.dataset.to; if (reduce) { el.textContent = fmt(to); return; } var t0 = null, D = 1100; var step = function (ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / D, 1); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    prices.forEach(function (el) { io.observe(el); });
  }
})();

/* ===== beamhub: reakce nodů na pulzy, tooltipy, orbit ===== */
(function () {
  var hub = document.getElementById("beamhub");
  if (!hub) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var svg = document.getElementById("bhSvg");
  var center = document.getElementById("bhHub");
  var nodes = [].slice.call(hub.querySelectorAll(".bh-node"));

  /* tooltipy s tím, co s nástrojem stavím */
  var TIPS = {
    slack: "Notifikace a schvalování rovnou do kanálů",
    notion: "Znalostní báze jako zdroj pro RAG",
    hubspot: "CRM — leady, kontakty, pipeline",
    stripe: "Platby, faktury a vyúčtování",
    postgresql: "Hlavní databáze + vektorové vyhledávání",
    zendesk: "Tickety a zákaznická podpora",
  };
  nodes.forEach(function (n) { var t = TIPS[n.dataset.icon]; if (t) n.setAttribute("data-tip", t); });

  /* orbitující tečky kolem hubu */
  if (center && !reduce && !center.querySelector(".bh-orbit")) {
    var orbit = document.createElement("i");
    orbit.className = "bh-orbit";
    orbit.setAttribute("aria-hidden", "true");
    orbit.innerHTML = "<b></b><b></b>";
    center.appendChild(orbit);
  }

  /* ping nodu/hubu při odletu a příletu pulzu (delegovaně — přežije rebuild drah) */
  var ping = function (el) {
    if (!el) return;
    el.classList.remove("ping");
    void el.offsetWidth;
    el.classList.add("ping");
  };
  if (svg && !reduce) {
    svg.addEventListener("animationiteration", function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains("bh-pulse")) return;
      var pulses = [].slice.call(svg.querySelectorAll(".bh-pulse"));
      var i = pulses.indexOf(t);
      var node = nodes[i];
      if (!node) return;
      var DUR = 3400;
      if (node.dataset.dir === "out") {
        ping(center);
        setTimeout(function () { ping(node); }, DUR * 0.8);
      } else {
        ping(node);
        setTimeout(function () { ping(center); }, DUR * 0.8);
      }
    });
  }
})();
