/* Motor del video: todo es función del tiempo t (segundos), así el render cuadro a cuadro
   y la reproducción en vivo dan exactamente lo mismo.
   Anclas de tiempo en data-in / data-out / data-on / data-type / data-move:
     "@12.3"            segundo absoluto
     "v04.clientes+0.2" palabra de una frase (marcas de la transcripción), con desfase
     "v13.jc#2"         n-ésima aparición de la palabra en la frase
     "reto+0.3"         inicio de una escena ("reto.fin" para su final)
   Atributos:
     data-fx      up | down | left | right | pop | grow | fade | draw      (entrada)
     data-out     ancla de salida; data-outop opacidad final (0 por defecto)
     data-count   "a:b" cuenta de a a b; data-fmt "usd" para $1,234
     data-type    escribe el texto del elemento letra a letra (data-tdur segundos)
     data-move    desplaza el elemento data-dx/data-dy píxeles (data-mdur segundos)
     data-on      añade la clase "on" desde ese momento */
(() => {
'use strict';
const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
const TL = window.TL;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - Math.pow(1 - k, 3);
const eInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eBack = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const prog = (t, a, d) => clamp((t - a) / d);
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const SC = {}; TL.escenas.forEach(e => SC[e.id] = e);
const SEG = {}; TL.segmentos.forEach(s => SEG[s.id] = s);

function palabra(seg, w, n = 1) {
  let c = 0;
  for (const p of TL.palabras) if (p.s === seg && norm(p.w) === w && ++c === n) return p.a;
  c = 0;
  for (const p of TL.palabras) if (p.s === seg && norm(p.w).startsWith(w) && ++c === n) return p.a;
  console.warn('ancla sin palabra', seg, w, n);
  return SEG[seg] ? SEG[seg].ini : 0;
}
const cache = {};
function T(expr) {
  if (expr in cache) return cache[expr];
  const x = expr.trim();
  let r;
  if (x[0] === '@') r = parseFloat(x.slice(1));
  else {
    const m = x.match(/^([a-z0-9]+)(?:\.([a-z0-9]+)(?:#(\d+))?)?([+-]\d*\.?\d+)?$/i);
    if (!m) { console.warn('ancla inválida', expr); r = 0; }
    else {
      const [, base, w, n, off] = m;
      if (/^v\d\d[a-z]?$/.test(base)) r = w ? palabra(base, w, n ? +n : 1) : SEG[base].ini;
      else if (SC[base]) r = w === 'fin' ? SC[base].fin : SC[base].ini;
      else { console.warn('escena desconocida', base); r = 0; }
      r += off ? parseFloat(off) : 0;
    }
  }
  return (cache[expr] = r);
}
window.__T = T;

/* ------------------------------------------------------------------ */
/* Contenido dinámico                                                  */
/* ------------------------------------------------------------------ */
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

/* --- RETO: hilos que viajan de cada tercero hacia JC --- */
const RC = { x: 700, y: 585 };
const PARTIES = $$('#ring .party').map(el => ({ el, x: parseFloat(el.style.left), y: parseFloat(el.style.top), t: T(el.dataset.in) }));
const ringSvg = $('#ringSvg');
const dots = [];
PARTIES.forEach((p, i) => {
  for (let k = 0; k < 3; k++) dots.push({ p, ph: (i * 0.37 + k / 3) % 1, el: svgEl('circle', { r: 5.5, fill: '#BC4F2B', opacity: 0 }, ringSvg) });
});

/* --- capítulos --- */
const CH = [['contexto', 'Cliente'], ['reto', 'Reto'], ['pide', 'Pedido'], ['sistema', 'Sistema'], ['hoy', 'Hoy'], ['captura', 'Captura'], ['tablero', 'Tablero'],
  ['finanzas', 'Finanzas'], ['asistente', 'Asistente'], ['operacion', 'Operación'], ['seguridad', 'Seguridad'], ['patrimonio', 'Patrimonio'], ['poc', 'Maqueta'], ['fases', 'Fases'], ['oferta', 'Equipo']];
const chEls = CH.map(([id, l]) => { const d = document.createElement('div'); d.innerHTML = `${l}<i></i>`; $('#chapters').appendChild(d); return { d, i: $('i', d), e: SC[id] }; });

/* ------------------------------------------------------------------ */
/* Elementos animados                                                  */
/* ------------------------------------------------------------------ */
const items = $$('[data-in]').map(el => {
  const fx = el.dataset.fx || 'up';
  const it = { el, fx, tin: T(el.dataset.in), dur: el.dataset.dur ? +el.dataset.dur : (fx === 'draw' ? 1 : 0.55),
    tout: el.dataset.out ? T(el.dataset.out) : null, outop: el.dataset.outop ? +el.dataset.outop : 0,
    count: el.dataset.count ? el.dataset.count.split(':').map(Number) : null, fmt: el.dataset.fmt || '', sc: el.closest('.sc') };
  if (fx === 'draw') { const L = el.getTotalLength(); it.len = L; el.style.strokeDasharray = `${L} ${L + 2}`; }
  return it;
});
const typers = $$('[data-type]').map(el => ({ el, txt: el.textContent, t0: T(el.dataset.type), d: +(el.dataset.tdur || 1.2), last: -1, sc: el.closest('.sc') }));
const movers = $$('[data-move]').map(el => ({ el, t0: T(el.dataset.move), dx: +(el.dataset.dx || 0), dy: +(el.dataset.dy || 0), d: +(el.dataset.mdur || 0.7), sc: el.closest('.sc') }));
const ons = $$('[data-on]').map(el => ({ el, t: T(el.dataset.on) }));
const scenes = TL.escenas.map((e, i) => ({ e, el: $('#s-' + e.id), first: i === 0, last: i === TL.escenas.length - 1 }));
const sceneVis = {};
const fmtNum = (v, f) => f === 'usd' ? '$' + Math.round(v).toLocaleString('en-US') : Math.round(v).toLocaleString('en-US');
const visible = sc => !sc || sceneVis[sc.id.slice(2)];

function applyItem(it, t) {
  const { el, fx } = it;
  if (it.count) {
    const k = eOut(prog(t, it.tin, it.dur));
    el.textContent = fmtNum(lerp(it.count[0], it.count[1], k), it.fmt);
    return;
  }
  const k = prog(t, it.tin, it.dur);
  if (fx === 'draw') { el.style.strokeDashoffset = it.len * (1 - eInOut(k)); return; }
  let op = fx === 'pop' ? clamp(k * 2.2) : eOut(k);
  if (it.tout !== null && t > it.tout) op *= lerp(1, it.outop, eOut(prog(t, it.tout, 0.45)));
  el.style.opacity = op.toFixed(3);
  const e = eOut(k);
  let tr = '';
  if (fx === 'up') tr = `translateY(${(1 - e) * 26}px)`;
  else if (fx === 'down') tr = `translateY(${-(1 - e) * 40}px)`;
  else if (fx === 'left') tr = `translateX(${-(1 - e) * 44}px)`;
  else if (fx === 'right') tr = `translateX(${(1 - e) * 44}px)`;
  else if (fx === 'pop') tr = `scale(${lerp(0.82, 1, eBack(k))})`;
  else if (fx === 'grow') { tr = `scaleX(${Math.max(0.001, eOut(k))})`; el.style.transformOrigin = 'left center'; }
  if (tr && k < 1) el.style.transform = tr; else if (tr) el.style.transform = '';
}

/* ------------------------------------------------------------------ */
/* Cuadro                                                              */
/* ------------------------------------------------------------------ */
let lastCap = null;
function render(t) {
  for (const s of scenes) {
    const { ini, fin } = s.e;
    const kin = s.first ? 1 : eInOut(prog(t, ini - 0.3, 0.5));
    const kout = s.last ? 1 : 1 - eInOut(prog(t, fin - 0.2, 0.5));
    const vis = t >= ini - 0.3 && (s.last || t <= fin + 0.3);
    sceneVis[s.e.id] = vis;
    s.el.style.display = vis ? 'block' : 'none';
    if (vis) { s.el.style.opacity = (kin * kout).toFixed(3); s.el.style.transform = kin < 1 ? `translateY(${(1 - kin) * 16}px)` : ''; }
  }
  for (const it of items) if (visible(it.sc)) applyItem(it, t);
  for (const o of ons) o.el.classList.toggle('on', t >= o.t);
  for (const ty of typers) if (visible(ty.sc)) {
    const n = Math.round(ty.txt.length * prog(t, ty.t0, ty.d));
    if (n !== ty.last) { ty.el.textContent = ty.txt.slice(0, n); ty.last = n; }
  }
  for (const m of movers) if (visible(m.sc)) {
    const k = eInOut(prog(t, m.t0, m.d));
    m.el.style.translate = `${(m.dx * k).toFixed(1)}px ${(m.dy * k).toFixed(1)}px`;
  }

  // fondo
  $('#blob1').style.transform = `translate(${Math.sin(t * .11) * 60}px,${Math.cos(t * .09) * 40}px)`;
  $('#blob2').style.transform = `translate(${Math.cos(t * .08) * 70}px,${Math.sin(t * .1) * 40}px)`;

  // chrome y capítulos
  const cIn = prog(t, SC.contexto.ini - 0.2, 0.5), cOut = 1 - prog(t, SC.cierre.ini - 0.1, 0.4);
  $('#chrome').style.opacity = (eOut(cIn) * cOut).toFixed(3);
  $('#chapters').style.opacity = (eOut(cIn) * cOut).toFixed(3);
  for (const c of chEls) {
    const k = prog(t, c.e.ini, c.e.fin - c.e.ini);
    c.i.style.width = (k * 100).toFixed(2) + '%';
    c.d.classList.toggle('on', t >= c.e.ini && t < c.e.fin);
    c.d.classList.toggle('done', t >= c.e.fin);
  }

  // subtítulos
  const sb = TL.subs.find(s => t >= s.a && t < s.b);
  const cap = $('#cap');
  if (sb !== lastCap) { cap.textContent = sb ? sb.txt : ''; lastCap = sb; }
  cap.style.opacity = sb ? (Math.min(prog(t, sb.a, 0.12), 1 - prog(t, sb.b - 0.12, 0.12))).toFixed(3) : 0;
  cap.style.display = sb ? 'inline-block' : 'none';

  if (sceneVis.reto) reto(t);
  return null;
}

function reto(t) {
  const tHilos = T('v04.decenas') - 0.2, tPersona = T('v04.persona') - 0.1;
  const kh = prog(t, tHilos, 0.6);
  for (const d of dots) {
    if (t < Math.max(tHilos, d.p.t + 0.3)) { d.el.setAttribute('opacity', 0); continue; }
    const speed = t > tPersona ? 0.95 : 0.55;
    const u = ((t - tHilos) * speed + d.ph) % 1;
    const x = lerp(d.p.x, RC.x, u), y = lerp(d.p.y, RC.y, u);
    d.el.setAttribute('cx', x.toFixed(1)); d.el.setAttribute('cy', y.toFixed(1));
    d.el.setAttribute('opacity', (kh * Math.sin(Math.PI * u) * 0.95).toFixed(3));
  }
  // la principal se carga: el aro crece con cada hilo
  const kp = eOut(prog(t, tPersona, 0.5));
  const pulse = t > tPersona ? 1 + 0.035 * Math.sin((t - tPersona) * 7) : 1;
  $('#jcNode').style.transform = `translate(-50%,-50%) scale(${(lerp(1, 1.08, kp) * pulse).toFixed(3)})`;
  $('#jcHalo').style.opacity = (kp * 0.9).toFixed(3);
  $('#jcHalo').style.transform = `translate(-50%,-50%) scale(${(1 + 0.12 * Math.sin((t - tPersona) * 3.5) * kp).toFixed(3)})`;
}

/* ------------------------------------------------------------------ */
/* Modos: render (cuadro a cuadro) y vivo (con audio)                  */
/* ------------------------------------------------------------------ */
window.seek = t => render(t);
window.TOTAL = TL.total;
const imgs = $$('img').map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = i.onerror = r; }));
window.__ready = Promise.all([document.fonts.ready, ...imgs]).then(() => true);

if (RENDER) {
  document.body.classList.add('render');
  render(+params.get('t') || 0);
} else {
  const stage = $('#stage'), audio = $('#audio');
  const fit = () => { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${s})`; stage.style.position = 'absolute'; stage.style.left = ((innerWidth - 1920 * s) / 2) + 'px'; stage.style.top = ((innerHeight - 1080 * s) / 2) + 'px'; };
  addEventListener('resize', fit); fit();
  const t0 = +params.get('t') || 0;
  audio.currentTime = t0;
  render(t0);
  const loop = () => { render(audio.currentTime); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  const toggle = () => audio.paused ? audio.play() : audio.pause();
  addEventListener('click', toggle);
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'ArrowRight') audio.currentTime = Math.min(TL.total, audio.currentTime + 5);
    if (e.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    if (e.key === 'r' || e.key === 'R') audio.currentTime = 0;
  });
}
})();
