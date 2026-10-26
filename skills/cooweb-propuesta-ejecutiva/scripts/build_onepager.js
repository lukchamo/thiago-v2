#!/usr/bin/env node
// Propuesta ejecutiva CooWeb de una hoja: JSON de contenido -> HTML -> PDF carta + PNG de revisión.
// Uso: node build_onepager.js contenido.json Salida_Base   (genera Salida_Base.html, .pdf y .png)
// Sale con código 2 si el contenido no cabe en una hoja, e indica cuánto sobra y qué bloque pesa más.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SKILL = path.resolve(__dirname, '..');
const PAGE_H = 1056; // 11 in a 96 px/in

const ENTIDADES = {
  llc: 'Cooweb LLC (Delaware, EE. UU.) · cooweb.co',
  sas: 'CooWeb Colombia S.A.S. (NIT 901.012.187-9) · cooweb.co',
};
const AVISO = 'Oferta marco indicativa; no es un contrato ni un compromiso de entrega. Tarifas en USD, sin impuestos, ' +
  'retenciones ni costos bancarios, ajustables según alcance, dedicación y condiciones de la propuesta definitiva. ' +
  'Los plazos dependen de que el cliente entregue a tiempo información, accesos y validaciones. Los perfiles pasan ' +
  'hoja de vida y entrevista técnica antes de asignarse. Vigencia: 30 días.';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Texto con **negrita**; nada más de markdown.
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const b64 = f => fs.readFileSync(path.join(SKILL, f)).toString('base64');

const CSS = `
@font-face{font-family:Carlito;font-weight:400;src:local('Carlito'),url(data:font/ttf;base64,${b64('assets/fonts/Carlito-Regular.ttf')}) format('truetype')}
@font-face{font-family:Carlito;font-weight:700;src:local('Carlito Bold'),local('Carlito-Bold'),url(data:font/ttf;base64,${b64('assets/fonts/Carlito-Bold.ttf')}) format('truetype')}
@page{size:Letter;margin:0}
:root{--blue:#1145A8;--ink:#1A2433;--ink2:#4B5563;--ink3:#6B7280;--hair:#CBD3DF;--tint:#F4F7FC;--grey:#E6EAF0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:8.5in;height:11in;background:#fff}
body{font-family:Carlito,Calibri,'Segoe UI',Arial,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.32;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:8.5in;height:11in;padding:0.4in 0.55in 0.3in;display:flex;flex-direction:column;overflow:hidden}
b{font-weight:700}
.muted{color:var(--ink2)}
.top{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid var(--blue)}
.top img{height:28px;display:block}
.meta{text-align:right;font-size:8.5pt;color:var(--ink2);line-height:1.4}
.meta b{color:var(--blue)}
h1{font-size:20pt;line-height:1.1;color:var(--blue);font-weight:700;margin-top:11px}
.lead{font-size:10.4pt;color:var(--ink2);margin-top:5px}
.lead b{color:var(--ink)}
.kpis{display:grid;margin-top:9px;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.kpi{padding:5px 14px 5px 0}
.kpi+.kpi{padding-left:14px;border-left:1px solid var(--hair)}
.kpi .n{display:block;font-size:16pt;font-weight:700;color:var(--blue);line-height:1.1}
.kpi span:not(.n){font-size:9pt;color:var(--ink2)}
.kpi span b{color:var(--ink)}
h2{font-size:11.5pt;color:var(--blue);font-weight:700;margin-top:12px;padding-bottom:3px;border-bottom:1px solid var(--blue)}
.txt{margin-top:6px;color:var(--ink2)}
.txt b{color:var(--ink)}
.why{display:grid;grid-template-columns:34% 1fr;column-gap:20px;margin-top:7px}
.why .claim{font-size:15pt;font-weight:700;color:var(--ink);line-height:1.1;margin-bottom:4px}
.why .claim+p{font-size:9.6pt;color:var(--ink2)}
.why .claim+p b{color:var(--ink)}
.dl div{display:grid;grid-template-columns:142px 1fr;padding:3px 0;border-bottom:1px solid var(--hair)}
.dl div:first-child{border-top:1px solid var(--hair)}
.dl dt{font-weight:700}
.dl dd{color:var(--ink2)}
.also{margin-top:6px;color:var(--ink2);font-size:9.3pt}
.also b{color:var(--ink)}
table{width:100%;border-collapse:collapse;margin-top:7px;table-layout:fixed}
col.l{width:78px}
th,td{text-align:left;vertical-align:top;padding:4px 9px;border-bottom:1px solid var(--hair);font-weight:400}
th{padding:6px 9px 5px;border-top:2px solid var(--ink);border-bottom:1px solid var(--ink)}
th.blank{border-top-color:transparent}
th .k{display:block;font-size:7.6pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3)}
th b{display:block;font-size:11pt;line-height:1.15;margin-top:1px}
th.rec{background:var(--blue);color:#fff;border-top-color:var(--blue);border-bottom-color:var(--blue)}
th.rec .k{color:#C9D8F5}
td.rec{background:var(--tint)}
td.l{font-size:8pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);padding-left:0}
td{font-size:9.3pt}
td ul{list-style:none}
td li{padding-left:10px;position:relative}
td li::before{content:"–";position:absolute;left:0;color:var(--ink3)}
td .v{font-size:13pt;font-weight:700;color:var(--ink);white-space:nowrap}
td.rec .v{color:var(--blue)}
td .v small{font-size:9pt;color:var(--ink2);font-weight:400}
td .s{display:block;font-size:8.6pt;color:var(--ink3)}
td .s b{color:var(--ink2);white-space:nowrap}
tr:last-child td{border-bottom:1px solid var(--ink)}
.conds{margin-top:5px;font-size:8.7pt;color:var(--ink2)}
.conds b{color:var(--ink)}
.proc{display:grid;column-gap:3px;margin-top:7px}
.chev{height:21px;display:flex;align-items:center;gap:6px;padding:0 10px 0 18px;background:var(--blue);color:#fff;font-size:8pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;overflow:hidden;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%,10px 50%)}
.p:first-child .chev{padding-left:10px;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)}
.p.alt .chev{background:var(--grey);color:var(--ink)}
.chev i{font-style:normal;font-size:10pt}
.p .tx{padding:5px 12px 0 2px}
.p .tx b{display:block}
.p .tx span{color:var(--ink2);font-size:9.2pt}
.duo{display:grid;grid-template-columns:1fr 1fr;margin-top:13px;border-top:1px solid var(--blue)}
.duo>div{padding:7px 16px 0 0}
.duo>div+div{padding:7px 0 0 16px;border-left:1px solid var(--hair)}
h3{font-size:11pt;color:var(--blue);display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:2px}
h3 span{color:var(--ink);white-space:nowrap}
h3 span small{font-size:8.5pt;color:var(--ink3);font-weight:400}
.packs{display:flex;align-items:center;gap:8px;margin-top:5px}
.seg{display:flex}
.seg b{border:1px solid var(--hair);padding:1px 9px;font-size:10pt;white-space:nowrap}
.seg b+b{border-left:0}
.packs .pv{margin-left:auto;font-weight:700;font-size:11pt;white-space:nowrap}
.packs .pv small{font-size:8.5pt;color:var(--ink3);font-weight:400}
.adj{margin-top:4px;font-size:9pt;color:var(--ink2)}
.adj b{color:var(--ink)}
.lanes{margin-top:5px}
.lanes div{display:grid;grid-template-columns:70px 1fr;padding:2px 0;border-top:1px solid var(--hair);font-size:9.2pt}
.lanes div:last-child{border-bottom:1px solid var(--hair)}
.lanes b{color:var(--blue)}
.lanes span{color:var(--ink2)}
.disc{margin-top:12px;padding-top:6px;border-top:1px solid var(--hair);font-size:7.6pt;line-height:1.38;color:var(--ink3)}
.disc b{color:var(--ink2)}
.foot{margin-top:auto;padding-top:6px;display:flex;justify-content:space-between;font-size:8pt;color:var(--ink3)}
/* compacto: ~8 % menos de alto para contenidos que casi caben */
body.compacto{font-size:9.1pt;line-height:1.28}
.compacto .page{padding:0.34in 0.5in 0.26in}
.compacto h1{font-size:18.5pt;margin-top:9px}
.compacto .lead{font-size:9.8pt}
.compacto h2{font-size:11pt;margin-top:9px}
.compacto .kpi .n{font-size:14.5pt}
.compacto .why .claim{font-size:13.5pt}
.compacto td{font-size:8.9pt;padding:3px 8px}
.compacto .duo{margin-top:10px}
.compacto .disc{margin-top:9px;font-size:7.3pt}
`;

function kpis(b) {
  const it = b.items || [];
  return `<div class="kpis" style="grid-template-columns:repeat(${it.length},1fr)">` +
    it.map(k => `<div class="kpi"><span class="n">${md(k.cifra)}</span><span>${md(k.texto)}</span></div>`).join('') + '</div>';
}

function porque(b) {
  const at = (b.atributos || []).map(a => `<div><dt>${md(a.nombre)}</dt><dd>${md(a.texto)}</dd></div>`).join('');
  return `<h2>${md(b.titulo)}</h2><div class="why"><div><p class="claim">${md(b.claim)}</p><p>${md(b.texto)}</p></div>` +
    `<div><dl class="dl">${at}</dl></div></div>` + (b.nota ? `<p class="also">${md(b.nota)}</p>` : '');
}

function opciones(b) {
  const ops = b.opciones || [];
  const f = Object.assign({ perfil: 'Perfil', enfoque: 'Enfoque', ideal: 'Ideal para', inversion: 'Inversión' }, b.filas);
  const rc = o => (o.recomendada ? ' class="rec"' : '');
  // Una fila solo aparece si alguna opción trae ese dato.
  const row = (label, key, cell) => ops.some(o => o[key] != null && o[key] !== '')
    ? `<tr><td class="l">${esc(label)}</td>${ops.map(o => `<td${rc(o)}>${o[key] != null ? cell(o) : ''}</td>`).join('')}</tr>` : '';
  const head = `<tr><th class="blank"></th>${ops.map(o => `<th${rc(o)}><span class="k">${md(o.etiqueta)}</span><b>${md(o.nombre)}</b></th>`).join('')}</tr>`;
  const body = [
    row(f.perfil, 'perfil', o => md(o.perfil)),
    row(f.enfoque, 'enfoque', o => Array.isArray(o.enfoque) ? `<ul>${o.enfoque.map(x => `<li>${md(x)}</li>`).join('')}</ul>` : md(o.enfoque)),
    row(f.ideal, 'ideal', o => md(o.ideal)),
    row(f.inversion, 'precio', o => `<span class="v">${md(o.precio)}${o.unidad ? ` <small>${md(o.unidad)}</small>` : ''}</span>` +
      (o.nota ? `<span class="s">${md(o.nota)}</span>` : '')),
  ].join('');
  return `<h2>${md(b.titulo)}</h2><table><colgroup><col class="l">${ops.map(() => '<col>').join('')}</colgroup>` +
    `<thead>${head}</thead><tbody>${body}</tbody></table>` + (b.condiciones ? `<p class="conds">${md(b.condiciones)}</p>` : '');
}

function proceso(b) {
  const ps = b.pasos || [];
  return `<h2>${md(b.titulo)}</h2><div class="proc" style="grid-template-columns:repeat(${ps.length},1fr)">` +
    ps.map(p => `<div class="p${p.continuidad ? ' alt' : ''}"><div class="chev"><i>${md(p.marca)}</i>${md(p.etiqueta)}</div>` +
      `<div class="tx"><b>${md(p.nombre)}</b><span>${md(p.texto)}</span></div></div>`).join('') + '</div>';
}

function columna(c) {
  let h = `<h3>${md(c.titulo)}${c.precio ? `<span>${md(c.precio)}${c.unidad ? `<small> ${md(c.unidad)}</small>` : ''}</span>` : ''}</h3>`;
  if (c.texto) h += `<p class="muted">${md(c.texto)}</p>`;
  if (c.paquetes && c.paquetes.length) {
    h += `<div class="packs"><span class="seg">${c.paquetes.map(p => `<b>${md(p)}</b>`).join('')}</span>` +
      (c.paquetes_texto ? `<span class="muted">${md(c.paquetes_texto)}</span>` : '') +
      (c.paquetes_precio ? `<span class="pv">${md(c.paquetes_precio)}${c.paquetes_unidad ? `<small> ${md(c.paquetes_unidad)}</small>` : ''}</span>` : '') + '</div>';
  }
  if (c.nota) h += `<p class="adj">${md(c.nota)}</p>`;
  if (c.carriles && c.carriles.length) {
    h += `<div class="lanes">${c.carriles.map(l => `<div><b>${md(l.nombre)}</b><span>${md(l.texto)}</span></div>`).join('')}</div>`;
  }
  return `<div>${h}</div>`;
}

const columnas = b => `<div class="duo">${(b.columnas || []).slice(0, 2).map(columna).join('')}</div>`;
const texto = b => (b.titulo ? `<h2>${md(b.titulo)}</h2>` : '') + `<p class="txt">${md(b.texto)}</p>`;
const BLOQUES = { kpis, porque, opciones, proceso, columnas, texto };

function html(d) {
  const ent = ENTIDADES[d.entidad || 'llc'];
  if (!ent) throw new Error(`entidad desconocida: ${d.entidad} (usa "llc" o "sas")`);
  const blocks = (d.bloques || []).map((b, i) => {
    const fn = BLOQUES[b.tipo];
    if (!fn) throw new Error(`bloque ${i}: tipo desconocido "${b.tipo}" (válidos: ${Object.keys(BLOQUES).join(', ')})`);
    return `<section data-b="${i}:${b.tipo}">${fn(b)}</section>`;
  }).join('\n');
  const meta = [d.etiqueta ? `<b>${md(d.etiqueta)}</b>` : '', [d.para && `Para ${md(d.para)}`, d.fecha && md(d.fecha)].filter(Boolean).join(' · ')]
    .filter(Boolean).join('<br>');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(d.etiqueta || 'Propuesta ejecutiva CooWeb')}</title>
<style>${CSS}</style></head><body${d.compacto ? ' class="compacto"' : ''}><div class="page">
<div class="top"><img src="data:image/png;base64,${b64('assets/logo_cooweb.png')}" alt="CooWeb"><div class="meta">${meta}</div></div>
<section data-b="titulo"><h1>${md(d.titulo)}</h1>${d.intro ? `<p class="lead">${md(d.intro)}</p>` : ''}</section>
${blocks}
<p class="disc"><b>Aviso.</b> ${md(d.aviso || AVISO)}</p>
<div class="foot"><span>${esc(ent)}</span><span>${md(d.firma || 'Luis, CEO de CooWeb · Documento confidencial')}</span></div>
</div></body></html>`;
}

function loadPlaywright() {
  for (const m of ['playwright', 'playwright-core']) { try { return require(m); } catch (_) {} }
  try { // instalación global de npm
    const root = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim();
    for (const m of ['playwright', 'playwright-core']) { try { return require(path.join(root, m)); } catch (_) {} }
  } catch (_) {}
  return null;
}

async function renderPlaywright(pw, htmlFile, base) {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 816, height: PAGE_H }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + htmlFile);
  await page.evaluate(() => document.fonts.ready);
  const fit = await page.evaluate(() => {
    const pg = document.querySelector('.page');
    pg.style.height = 'auto'; // medir el alto natural, sin el recorte de la hoja
    const natural = pg.scrollHeight;
    pg.style.height = '';
    const blocks = [...pg.querySelectorAll('section[data-b]')].map(s => [s.dataset.b, Math.round(s.getBoundingClientRect().height)]);
    return { natural, blocks };
  });
  await page.pdf({ path: base + '.pdf', format: 'Letter', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
  await page.screenshot({ path: base + '.png', clip: { x: 0, y: 0, width: 816, height: PAGE_H } });
  await browser.close();
  return fit;
}

function renderChromiumCli(htmlFile, base) {
  const bins = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', '/opt/pw-browsers/chromium'];
  const bin = bins.find(b => spawnSync(b, ['--version'], { encoding: 'utf8' }).status === 0);
  if (!bin) return null;
  const flags = ['--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer'];
  spawnSync(bin, [...flags, `--print-to-pdf=${base}.pdf`, 'file://' + htmlFile]);
  spawnSync(bin, [...flags, '--window-size=816,1056', `--screenshot=${base}.png`, 'file://' + htmlFile]);
  // Sonda: misma página sin recorte; si imprime más de una hoja, el contenido no cabe.
  const probe = base + '.sonda.html';
  fs.writeFileSync(probe, fs.readFileSync(htmlFile, 'utf8').replace('</style>', '.page{height:auto!important;overflow:visible!important}html,body{height:auto!important}</style>'));
  spawnSync(bin, [...flags, `--print-to-pdf=${base}.sonda.pdf`, 'file://' + probe]);
  const pages = (fs.readFileSync(base + '.sonda.pdf', 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  fs.rmSync(probe); fs.rmSync(base + '.sonda.pdf');
  return { natural: pages > 1 ? PAGE_H + 1 : PAGE_H, blocks: [], pages };
}

(async () => {
  const [json, out] = process.argv.slice(2);
  if (!json || !out) { console.error('Uso: node build_onepager.js contenido.json Salida_Base'); process.exit(1); }
  const base = path.resolve(out.replace(/\.(pdf|html)$/i, ''));
  const data = JSON.parse(fs.readFileSync(json, 'utf8'));
  fs.writeFileSync(base + '.html', html(data));
  console.log('HTML  ', base + '.html');

  const pw = loadPlaywright();
  const fit = pw ? await renderPlaywright(pw, base + '.html', base) : renderChromiumCli(base + '.html', base);
  if (!fit) {
    console.error('No encontré Playwright ni Chromium: el HTML quedó listo, imprímelo a PDF carta sin márgenes desde un navegador.');
    process.exit(3);
  }
  console.log('PDF   ', base + '.pdf');
  console.log('PNG   ', base + '.png');
  const over = fit.natural - PAGE_H;
  if (fit.blocks.length) console.log('Alto por bloque (px):', fit.blocks.map(([k, h]) => `${k}=${h}`).join('  '));
  if (over > 0) {
    console.log(`NO CABE: ${fit.pages ? 'sobra contenido para otra hoja' : 'sobran ' + over + ' px'} (la hoja mide ${PAGE_H}px). Recorta texto o usa "compacto": true.`);
    process.exit(2);
  }
  console.log(`CABE en una hoja (margen libre: ${-over} px).`);
})().catch(e => { console.error(e.message || e); process.exit(1); });
