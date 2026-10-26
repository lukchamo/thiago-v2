/* Motor del video: todo es función del tiempo t (segundos), así el render cuadro a cuadro
   y la reproducción en vivo dan exactamente lo mismo.
   Anclas de tiempo en data-in / data-out / data-on:
     "@12.3"            segundo absoluto
     "v04.foto+0.2"     palabra de una frase (marcas de la transcripción), con desfase
     "v09.el#2"         n-ésima aparición de la palabra en la frase
     "torre+0.3"        inicio de una escena */
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
const div = (html, style, parent, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; if (style) d.style.cssText = style; d.innerHTML = html; if (parent) parent.appendChild(d); return d; };

/* --- ROTO: tubería de 8 etapas, hilo que se rompe, tecleado ×4, error que viaja --- */
const NX = [200, 417, 634, 851, 1068, 1285, 1502, 1719], NY = 350;
const NL = ['Conduce', 'Preparación', 'Asignación', 'Entrega', 'Quirófano', 'Recogida', 'Conciliación', 'Facturación'];
const rotoSvg = $('#rotoSvg');
const segs = [];
for (let i = 0; i < 7; i++) {
  const a = svgEl('line', { y1: NY, y2: NY, 'stroke-width': 5, 'stroke-linecap': 'round' }, rotoSvg);
  const b = svgEl('line', { y1: NY, y2: NY, 'stroke-width': 5, 'stroke-linecap': 'round' }, rotoSvg);
  const z = svgEl('path', { d: '', stroke: '#D2452D', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, rotoSvg);
  segs.push({ a, b, z, x0: NX[i] + 36, x1: NX[i + 1] - 36 });
}
const nodes = NX.map((x, i) => {
  const n = div(String(i + 1), `left:${x}px;top:${NY}px`, $('#rotoNodes'), 'node');
  const l = div(NL[i], `left:${x}px;top:${NY + 40}px`, $('#rotoNodes'), 'nlabel');
  return { n, l };
});
const BAD = { 2: 'v04.foto', 4: 'v04.quirofano', 6: 'v05.recepcion', 7: 'v05.facturacion' };
const typed = [0, 2, 6, 7].map((ni, k) => {
  const d = div(`CQ-10481 · L2507-4418<b>×${k + 1}</b>`, `left:${NX[ni]}px;top:${NY - 64}px;transform:translateX(-50%)`, $('#typedBoxes'), 'abs');
  d.innerHTML = `<div class="typed"><span class="tx"></span><b>×${k + 1}</b></div>`;
  return { el: d, tx: $('.tx', d), t0: T('v05.mismo') + k * 0.42 };
});
const scrawl = $('#scrawl');
const scrawlLines = [];
for (let i = 0; i < 11; i++) {
  const y = 14 + i * 22, w = 170 + ((i * 53) % 120);
  let d = `M4 ${y}`;
  for (let x = 4; x < w; x += 22) d += ` q 6 ${-6 - (i % 3)} 11 0 t 11 ${(i % 2) ? 2 : -1}`;
  if (i % 3 === 1) d += ` M ${w + 14} ${y} l 22 0`;
  const p = svgEl('path', { d, stroke: i % 4 === 3 ? '#B23A2A' : '#2C3E66', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }, scrawl);
  scrawlLines.push(p);
}

/* --- PROPUESTA: paradas del hilo vertical y órbita del caso --- */
const STOPS = ['Orden aprobada en SAP', ...NL, 'Cobro'];
const hiloStops = STOPS.map((s, i) => {
  const y = 340 + i * (540 / (STOPS.length - 1));
  const end = i === 0 || i === STOPS.length - 1;
  const d = div(`<i style="position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #C9D5E4"></i><span style="position:absolute;left:30px;top:-14px;white-space:nowrap;font-size:${end ? 21 : 18}px;font-weight:${end ? 600 : 400};color:var(--ink2)">${s}</span>`,
    `left:200px;top:${y}px`, $('#hiloStops'), 'abs');
  return { el: d, dot: $('i', d), lab: $('span', d), y };
});
const ORB = [['Paciente', 930, 330], ['Médico', 900, 420], ['Centro', 930, 510], ['Consumo', 1130, 300], ['Evidencias', 1410, 300], ['Aseguradora', 1610, 330], ['Conduce', 1640, 420], ['Firma', 1610, 510]];
const orbSvg = svgEl('svg', { width: 1920, height: 1080, style: 'position:absolute;left:0;top:0' }, $('#orbit'));
const orb = ORB.map(([s, x, y], i) => {
  const ln = svgEl('line', { x1: 1270, y1: 440, x2: x, y2: y, stroke: '#9CC7EE', 'stroke-width': 2, 'stroke-dasharray': '5 6' }, orbSvg);
  const c = div(`<span class="chip blue" style="font-size:18px">${s}</span>`, `left:${x}px;top:${y}px`, $('#orbit'), 'orb');
  return { ln, c, t0: lerp(T('v07.caso'), T('v07.centro') + 0.2, i / (ORB.length - 1)) };
});

/* --- TORRE --- */
const AG = [
  ['07:30', 'CQ-10481', 'Artrodesis lumbar L4–L5', 'CEDIMAT', 6, 'ok', 'En recepción'],
  ['07:45', 'CQ-10482', 'Osteosíntesis de radio distal', 'Hospiten Santo Domingo', 4, 'warn', 'Firma pendiente'],
  ['08:00', 'CQ-10483', 'Reemplazo total de rodilla', 'Centro Médico Real', 4, 'info', 'En quirófano'],
  ['08:30', 'CQ-10484', 'Clavo intramedular de fémur', 'Plaza de la Salud', 3, 'info', 'Despachado'],
  ['09:00', 'CQ-10485', 'Discectomía cervical con caja', 'Clínica Abreu', 3, 'info', 'Despachado'],
  ['09:30', 'CQ-10486', 'Fijación de tobillo bimaleolar', 'Centro Médico Moderno', 3, 'warn', 'Vence indicación'],
  ['10:15', 'CQ-10487', 'Reconstrucción de LCA', 'CEDIMAT', 3, 'info', 'Despachado'],
  ['11:00', 'CQ-10488', 'Placa de clavícula', 'HOMS Santiago', 2, 'info', 'Autorizado']
];
const agCols = 'grid-template-columns:66px 112px 1fr 200px 128px 150px';
div(`<span>Hora</span><span>Caso</span><span>Procedimiento</span><span>Centro</span><span>Etapa</span><span>Estado</span>`, agCols, $('#agenda'), 'row h');
const agRows = AG.map((r, i) => div(
  `<span class="num" style="color:var(--ink2)">${r[0]}</span><b class="mono" style="font-weight:500;font-size:16px">${r[1]}</b><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:10px">${r[2]}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink2);padding-right:10px">${r[3]}</span><span class="sbar">${Array.from({ length: 8 }, (_, k) => `<i class="${k < r[4] ? 'on' : k === r[4] ? 'now' : ''}"></i>`).join('')}</span><span><span class="pill ${r[5]}">${r[6]}</span></span>`,
  agCols, $('#agenda'), 'row'));
const FI = [['Dr. José Almonte · CQ-10482', 'warn', 'Pendiente'], ['Dr. Rafael Then · CQ-10483', 'info', 'Impresa · MAPFRE'], ['Dra. Carolina Peña · CQ-10481', 'ok', 'Firmada']];
const fiRows = FI.map(r => div(`<span>${r[0]}</span><span class="pill ${r[1]}" style="justify-self:end">${r[2]}</span>`, 'grid-template-columns:1fr auto;height:38px;font-size:17px', $('#firmas'), 'row'));
const CO = [['CEDIMAT', 71], ['Hospiten Santo Domingo', 54], ['Plaza de la Salud', 46], ['Centro Médico Real', 38]];
const coRows = CO.map(r => {
  const d = div(`<span style="font-size:16px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r[0]}</span><div class="hbar"><span style="width:0"></span></div><b class="num" style="font-size:16px;text-align:right">${r[1]}</b>`, 'grid-template-columns:190px 1fr 40px;gap:12px;height:32px;border:0', $('#cons'), 'row');
  return { el: d, bar: $('.hbar span', d), v: r[1] };
});
const VI = [['CQ-10489 · Hospiten', 27, 'var(--red)'], ['CQ-10486 · C. M. Moderno', 26, 'var(--red)'], ['CQ-10482 · Hospiten', 21, '#E2A325']];
const viRows = VI.map(r => {
  const d = div(`<span style="font-size:16px;white-space:nowrap">${r[0]}</span><div class="hbar"><span style="width:0;background:${r[2]}"></span></div><b class="num" style="font-size:15px;text-align:right;color:${r[2]}">${r[1]} de 30 d</b>`, 'grid-template-columns:200px 1fr 92px;gap:12px;height:30px;border:0', $('#vig'), 'row');
  return { el: d, bar: $('.hbar span', d), v: r[1] };
});
const FOCUS = [['#pAgenda', 'v10.agenda-0.2'], ['#pFirmas', 'v10.firmas-0.2'], ['#pCons', 'v10.consignacion-0.2'], ['#pVig', 'v10.indicaciones-0.2']].map(([s, a]) => {
  const p = $(s), st = p.style;   // la escena está oculta al iniciar: medir por el estilo, no por offset*
  return { x: parseFloat(st.left) - 7, y: parseFloat(st.top) - 7, w: parseFloat(st.width) + 14, h: parseFloat(st.height) + 14, t: T(a) };
});

/* --- CONCILIACIÓN --- */
const RC = [['Tornillo pedicular 6.5 × 45 mm', 6, 4, 2], ['Tornillo pedicular 6.5 × 50 mm', 6, 0, 6], ['Barra de titanio 5.5 × 80 mm', 4, 2, 2], ['Tapón de cierre (set screw)', 12, 4, 7],
  ['Caja intersomática PEEK 10 mm', 2, 1, 1], ['Injerto óseo sintético 5 cc', 3, 1, 2], ['Guía de alambre K 1.6 mm', 6, 2, 4]];
const rcRows = RC.map(r => {
  const d = div(`<span>${r[0]}</span><span class="r">${r[1]}</span><span class="r">${r[2]}</span><span class="r dv" style="color:var(--ink3)">—</span><span class="r df" style="color:var(--ink3)"></span>`, '', $('#recRows'), 'row');
  return { el: d, dv: $('.dv', d), df: $('.df', d), r };
});
const CODE = [
  ['<span class="k">POST</span> /b1s/v1/$batch', 'v13.consumo-0.35'],
  ['<span class="c">── changeset · CQ-10481 ─────────</span>', 'v13.consumo'],
  ['<span class="b">InventoryGenExit</span>   consumo · 14 uds', 'v13.devolucion'],
  ['<span class="b">StockTransfer</span>      CEN-CEDIMAT → ALM-01', 'v13.entran'],
  ['<span class="b">U_IdemKey</span>          CQ-10481-CIERRE', 'v13.sap'],
  ['<span class="g">→ 201 Created · un solo envío</span>', 'v13.envio']
];
const codeLines = CODE.map(([h, a]) => ({ el: div(h, 'opacity:0', $('#codeBox')), t: T(a) }));

/* --- ISOMÉTRICO: diorama grabado del PoC; el clic a "Con la plataforma" cae en ISO.cambio --- */
const ISO = { fps: 30, frames: 810, cambio: 12 };
const isoImg = $('#isoImg'), isoVid = $('#isoVid');
let isoSrc = '';

/* --- capítulos --- */
const CH = [['contexto', 'Contexto'], ['roto', 'Problema'], ['propuesta', 'Propuesta'], ['isometrico', 'Ciclo 3D'], ['fase1', 'Fase 1'], ['plataforma', 'Plataforma'], ['torre', 'Torre'], ['app', 'App técnico'], ['conciliacion', 'Conciliación'], ['impacto', 'Impacto'], ['olas', 'Olas'], ['oferta', 'CooWeb']];
const chEls = CH.map(([id, l]) => { const d = div(`${l}<i></i>`, '', $('#chapters')); return { d, i: $('i', d), e: SC[id] }; });

/* ------------------------------------------------------------------ */
/* Elementos con data-in                                               */
/* ------------------------------------------------------------------ */
const items = $$('[data-in]').map(el => {
  const fx = el.dataset.fx || 'up';
  const it = { el, fx, tin: T(el.dataset.in), dur: el.dataset.dur ? +el.dataset.dur : (fx === 'draw' ? 1 : 0.55),
    tout: el.dataset.out ? T(el.dataset.out) : null, outop: el.dataset.outop ? +el.dataset.outop : 0,
    count: el.dataset.count ? el.dataset.count.split(':').map(Number) : null, sc: el.closest('.sc') };
  if (fx === 'draw') { const L = el.getTotalLength(); it.len = L; el.style.strokeDasharray = `${L} ${L + 2}`; }
  return it;
});
const ons = $$('[data-on]').map(el => ({ el, t: T(el.dataset.on) }));
const scenes = TL.escenas.map((e, i) => ({ e, el: $('#s-' + e.id), first: i === 0, last: i === TL.escenas.length - 1 }));
const sceneVis = {};

function applyItem(it, t) {
  const { el, fx } = it;
  if (it.count) {
    const k = eOut(prog(t, it.tin, it.dur));
    el.textContent = Math.round(lerp(it.count[0], it.count[1], k)).toLocaleString('es-DO');
    return;
  }
  let k = prog(t, it.tin, it.dur);
  if (fx === 'draw') { el.style.strokeDashoffset = it.len * (1 - eInOut(k)); return; }
  let op = fx === 'pop' ? clamp(k * 2.2) : eOut(k);
  if (it.tout !== null && t > it.tout) op *= lerp(1, it.outop, eOut(prog(t, it.tout, 0.45)));
  el.style.opacity = op.toFixed(3);
  const e = eOut(k);
  let tr = '';
  if (fx === 'up') tr = `translateY(${(1 - e) * 26}px)`;
  else if (fx === 'down') tr = `translateY(${-(1 - e) * 70}px)`;
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
  // escenas
  for (const s of scenes) {
    const { ini, fin } = s.e;
    const kin = s.first ? 1 : eInOut(prog(t, ini - 0.3, 0.5));
    const kout = s.last ? 1 : 1 - eInOut(prog(t, fin - 0.2, 0.5));
    const vis = t >= ini - 0.3 && (s.last || t <= fin + 0.3);
    sceneVis[s.e.id] = vis;
    s.el.style.display = vis ? 'block' : 'none';
    if (vis) { s.el.style.opacity = (kin * kout).toFixed(3); s.el.style.transform = kin < 1 ? `translateY(${(1 - kin) * 16}px)` : ''; }
  }
  for (const it of items) if (!it.sc || sceneVis[it.sc.id.slice(2)]) applyItem(it, t);
  for (const o of ons) o.el.classList.toggle('on', t >= o.t);

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

  if (sceneVis.roto) roto(t);
  if (sceneVis.propuesta) propuesta(t);
  if (sceneVis.torre) torre(t);
  if (sceneVis.app) app(t);
  if (sceneVis.conciliacion) conciliacion(t);
  if (sceneVis.impacto) impacto(t);
  return sceneVis.isometrico ? isometrico(t) : null;
}

function roto(t) {
  const t0 = SC.roto.ini, tb = T('v03.roto') - 0.1;
  nodes.forEach((n, i) => {
    const k = prog(t, t0 + 0.15 + i * 0.09, 0.45);
    n.n.style.opacity = clamp(k * 2); n.n.style.transform = `scale(${lerp(.6, 1, eBack(k))})`;
    n.l.style.opacity = eOut(k);
    n.n.classList.toggle('bad', BAD[i] ? t >= T(BAD[i]) : false);
  });
  const kb = eOut(prog(t, tb, 0.35));
  const shake = t > tb && t < tb + 0.6 ? Math.sin((t - tb) * 60) * 7 * (1 - (t - tb) / 0.6) : 0;
  rotoSvg.style.transform = `translateX(${shake}px)`;
  $('#rotoNodes').style.transform = `translateX(${shake}px)`;
  const col = kb > 0 ? `rgb(${Math.round(lerp(201, 210, kb))},${Math.round(lerp(213, 69, kb))},${Math.round(lerp(228, 45, kb))})` : '#C9D5E4';
  segs.forEach((s, i) => {
    const kd = eInOut(prog(t, t0 + 0.4 + i * 0.12, 0.45));
    const xe = lerp(s.x0, s.x1, kd);
    const mid = (s.x0 + s.x1) / 2, g = kb * 16;
    s.a.setAttribute('x1', s.x0); s.a.setAttribute('x2', Math.min(xe, mid - g));
    s.b.setAttribute('x1', mid + g); s.b.setAttribute('x2', Math.max(xe, mid + g));
    s.b.style.opacity = xe > mid + g ? 1 : 0;
    s.a.setAttribute('stroke', col); s.b.setAttribute('stroke', col);
    s.a.setAttribute('stroke-dasharray', kb > 0 ? '10 8' : 'none'); s.b.setAttribute('stroke-dasharray', kb > 0 ? '10 8' : 'none');
    s.z.setAttribute('d', kb > 0 ? `M${mid - 7} ${NY - 13} l7 7 -7 6 7 6 M${mid + 7} ${NY - 13} l-7 7 7 6 -7 6` : '');
    s.z.style.opacity = kb;
  });
  // garabatos de la hoja
  const a0 = T('v04.escribe'), a1 = T('v04.lineas') + 0.8;
  scrawlLines.forEach((p, i) => {
    const L = p.__L || (p.__L = p.getTotalLength());
    const k = prog(t, lerp(a0, a1, i / scrawlLines.length), (a1 - a0) / scrawlLines.length);
    p.style.strokeDasharray = `${L} ${L + 2}`; p.style.strokeDashoffset = L * (1 - k);
  });
  // tecleado ×4
  const dimT = T('v05.error') - 0.1;
  typed.forEach(o => {
    const k = prog(t, o.t0, 0.35);
    const txt = 'CQ-10481 · L2507-4418';
    o.tx.textContent = txt.slice(0, Math.round(txt.length * prog(t, o.t0, 0.32)));
    let op = clamp(k * 3);
    if (t > dimT) op *= lerp(1, 0.2, prog(t, dimT, 0.4));
    if (t > T('v06.de')) op *= 1 - prog(t, T('v06.de'), 0.3);
    o.el.style.opacity = op;
  });
  // error que viaja del quirófano a recepción
  const e0 = T('v05.error') - 0.15, e1 = T('v05.aparece'), e2 = T('v05.recepcion'), e3 = T('v06.de');
  const dot = $('#errDot'), cal = $('#errCal');
  const kt = eInOut(prog(t, e1, e2 - e1));
  const x = lerp(NX[4], NX[6], kt);
  const vis = t >= e0 && t < e3 + 0.3;
  dot.style.display = cal.style.display = vis ? '' : 'none';
  if (vis) {
    const kin = prog(t, e0, 0.3), kout = 1 - prog(t, e3, 0.3);
    dot.style.left = x + 'px'; dot.style.top = NY + 'px';
    dot.style.opacity = clamp(kin * 2) * kout; dot.style.transform = `scale(${lerp(.4, 1, eBack(kin))})`;
    cal.style.left = (x - 52) + 'px'; cal.style.top = (NY - 82) + 'px';
    cal.style.opacity = clamp(kin * 2) * kout;
    cal.textContent = `+${Math.round(kt * 3)} días`;
  }
  // barra de 60-90 días
  $('#cobroFill').style.width = (eInOut(prog(t, T('v06.cotizacion'), T('v06.dias') + 0.6 - T('v06.cotizacion'))) * 100).toFixed(2) + '%';
}

function propuesta(t) {
  const h0 = T('v07.un') - 0.2, hd = 1.9;
  hiloStops.forEach((s, i) => {
    const kin = prog(t, SC.propuesta.ini + 0.25 + i * 0.06, 0.4);
    s.el.style.opacity = eOut(kin);
    const lit = t >= h0 + hd * eInOut(clamp((s.y - 340) / 540)) - 0.02 && t >= h0;
    const last = i === hiloStops.length - 1;
    s.dot.style.borderColor = lit ? (last ? '#16A653' : '#0064BF') : '#C9D5E4';
    s.dot.style.background = lit ? (last ? '#16A653' : '#0064BF') : '#fff';
    s.lab.style.color = lit ? 'var(--ink)' : 'var(--ink3)';
  });
  orb.forEach(o => {
    const k = prog(t, o.t0, 0.45);
    o.c.style.opacity = clamp(k * 2); o.c.style.transform = `translate(-50%,-50%) scale(${lerp(.7, 1, eBack(k))})`;
    o.ln.style.opacity = eOut(k) * 0.9;
  });
}

function torre(t) {
  const a0 = T('v10.torre') - 0.2;
  agRows.forEach((r, i) => { const k = prog(t, a0 + i * 0.12, 0.4); r.style.opacity = eOut(k); r.style.transform = `translateX(${(1 - eOut(k)) * 24}px)`; });
  fiRows.forEach((r, i) => { const k = prog(t, T('v10.control') + i * 0.15, 0.4); r.style.opacity = eOut(k); });
  coRows.forEach((r, i) => { r.bar.style.width = (eOut(prog(t, T('v10.consignacion') - 0.35 + i * 0.12, 0.8)) * r.v / 80 * 100).toFixed(1) + '%'; });
  viRows.forEach((r, i) => { r.bar.style.width = (eOut(prog(t, T('v10.indicaciones') - 0.35 + i * 0.12, 0.8)) * r.v / 30 * 100).toFixed(1) + '%'; });
  const f = $('#focus');
  if (t < FOCUS[0].t) { f.style.opacity = 0; return; }
  let j = 0; while (j + 1 < FOCUS.length && t >= FOCUS[j + 1].t) j++;
  const A = FOCUS[Math.max(0, j - 1)], B = FOCUS[j];
  const k = j === 0 ? 1 : eInOut(prog(t, B.t, 0.45));
  f.style.opacity = j === 0 ? eOut(prog(t, B.t, 0.3)) : 1;
  f.style.left = lerp(A.x, B.x, k) + 'px'; f.style.top = lerp(A.y, B.y, k) + 'px';
  f.style.width = lerp(A.w, B.w, k) + 'px'; f.style.height = lerp(A.h, B.h, k) + 'px';
}

function app(t) {
  const tB = T('v11.camara') - 0.35, tC = T('v12.vencido') - 0.75;
  const sA = $('#scrA'), sB = $('#scrB'), sC = $('#scrC');
  const kB = eInOut(prog(t, tB, 0.35)), kC = eInOut(prog(t, tC, 0.35));
  sA.style.opacity = 1 - kB; sA.style.transform = `translateX(${-kB * 40}px)`; sA.style.display = kB >= 1 ? 'none' : '';
  sB.style.opacity = kB * (1 - kC); sB.style.transform = `translateX(${(1 - kB) * 40 - kC * 40}px)`; sB.style.display = kB <= 0 || kC >= 1 ? 'none' : '';
  sC.style.opacity = kC; sC.style.transform = `translateX(${(1 - kC) * 40}px)`; sC.style.display = kC <= 0 ? 'none' : '';
  // red
  const off = t >= T('v11.funciona') - 0.1;
  const np = $('#netpill');
  np.textContent = off ? 'Sin señal' : 'En línea';
  np.style.background = off ? 'var(--amberbg)' : 'var(--greenbg)'; np.style.color = off ? 'var(--amber)' : 'var(--green)';
  const kq = eOut(prog(t, T('v11.funciona'), 0.4)), q = $('#queue');
  q.style.opacity = kq; q.style.maxHeight = (kq * 44) + 'px'; q.style.marginBottom = (kq * 8) + 'px'; q.style.paddingTop = q.style.paddingBottom = (kq * 8) + 'px';
  // búsqueda
  const ty0 = T('v11.escribe') - 0.2;
  $('#qtext').textContent = 'torn'.slice(0, Math.round(4 * prog(t, ty0, 0.5)));
  $('#caret').style.opacity = Math.floor(t * 2.5) % 2 ? 0 : 1;
  $$('#results .mres').forEach((r, i) => { const k = prog(t, ty0 + 0.45 + i * 0.1, 0.3); r.style.opacity = eOut(k); r.style.transform = `translateY(${(1 - eOut(k)) * 10}px)`; });
  const tap = T('v11.selecciona');
  const r1 = $('#res1'); r1.style.borderColor = t >= tap ? 'var(--blue)' : ''; r1.style.background = t >= tap ? '#EAF3FE' : '';
  const kn = prog(t, tap + 0.1, 0.4), ni = $('#newItem');
  ni.style.opacity = clamp(kn * 2); ni.style.transform = `scale(${lerp(.9, 1, eBack(kn))})`;
  $('#qty').textContent = Math.max(1, Math.round(lerp(1, 4, prog(t, tap + 0.5, 0.9))));
  // cámara
  const ref = T('v11.referencia'), lote = T('v11.lote'), venc = T('v11.vencimiento');
  const scanning = t < venc + 0.3;
  const sl = $('#scanline');
  sl.style.top = (12 + 74 * (0.5 + 0.5 * Math.sin((t - tB) * 3.2))) + '%';
  sl.style.opacity = scanning ? 1 : Math.max(0, 1 - (t - venc - 0.3) * 3);
  [['#lb1', ref], ['#lb2', lote], ['#lb3', venc]].forEach(([s, a]) => {
    const on = t >= a - 0.1; const e = $(s);
    e.style.background = on ? 'rgba(106,219,155,.38)' : 'transparent'; e.style.outline = on ? '2px solid #34B36B' : 'none'; e.style.borderRadius = '3px';
  });
  $('#hl').style.display = 'none';
}

function conciliacion(t) {
  const s0 = T('v13.escanea') - 0.25, s1 = T('v13.valida');
  const k = prog(t, s0, s1 - s0);
  $('#scanFill').style.width = (k * 100).toFixed(1) + '%';
  $('#scanTxt').textContent = `${Math.round(k * 24)}/24`;
  rcRows.forEach((r, i) => {
    const kin = prog(t, SC.conciliacion.ini + 0.3 + i * 0.07, 0.35);
    r.el.style.opacity = eOut(kin);
    const done = k >= (i + 1) / rcRows.length;
    r.dv.textContent = done ? r.r[3] : '—';
    r.dv.style.color = done ? 'var(--ink)' : 'var(--ink3)';
    const diff = r.r[1] - r.r[2] - r.r[3];
    r.df.textContent = done ? (diff ? '+' + diff : '0') : '';
    r.df.style.color = diff ? 'var(--red)' : 'var(--ink3)'; r.df.style.fontWeight = diff ? 700 : 400;
    r.el.classList.toggle('flag', done && diff > 0);
  });
  codeLines.forEach(c => { const kk = prog(t, c.t, 0.3); c.el.style.opacity = eOut(kk); c.el.style.transform = `translateX(${(1 - eOut(kk)) * 14}px)`; });
  const sem = $('#sem'); const green = t >= T('v14.completitud') - 0.2;
  sem.className = 'sem ' + (green ? 'green' : 'amber');
}

function isometrico(t) {
  const ct = clamp(t - (T('v07c') - ISO.cambio), 0, (ISO.frames - 1) / ISO.fps);
  const k = prog(t, T('v07c') - 0.25, 0.25), k2 = prog(t, T('v07c'), 0.4);
  $('#isoFlash').style.opacity = (k < 1 ? k : 1 - k2) * 0.55;
  if (RENDER) {
    const src = `salida/tmp/iso/f${String(Math.round(ct * ISO.fps)).padStart(4, '0')}.jpg`;
    if (src !== isoSrc) { isoSrc = src; isoImg.src = src; return isoImg.decode().catch(() => {}); }
    return null;
  }
  isoImg.style.display = 'none'; isoVid.style.display = 'block';
  const audio = $('#audio');
  if (audio.paused) { if (!isoVid.paused) isoVid.pause(); if (Math.abs(isoVid.currentTime - ct) > 0.05) isoVid.currentTime = ct; }
  else { if (isoVid.paused) isoVid.play().catch(() => {}); if (Math.abs(isoVid.currentTime - ct) > 0.25) isoVid.currentTime = ct; }
  return null;
}

function impacto(t) {
  [['#old1', 'v15.cero'], ['#old2', 'v15.una'], ['#old3', 'v15.treinta']].forEach(([s, a]) => {
    $(s).style.setProperty('--s', eOut(prog(t, T(a) - 0.45, 0.35)).toFixed(3));
  });
}

/* ------------------------------------------------------------------ */
/* Modos: render (cuadro a cuadro) y vivo (con audio)                  */
/* ------------------------------------------------------------------ */
window.seek = t => render(t);   // devuelve una promesa cuando hay que esperar un cuadro del isométrico
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
  let t0 = +params.get('t') || 0;
  audio.currentTime = t0;
  render(t0);
  const loop = () => { render(audio.paused ? audio.currentTime : audio.currentTime); requestAnimationFrame(loop); };
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
