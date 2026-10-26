#!/usr/bin/env node
/* Exporta pieza.html a MP4 1920×1080 a 30 fps, cuadro a cuadro (determinista).
   node render.cjs                         → salida/cumbre-poc-thiago.mp4
   node render.cjs --fotos 3,25.5,60       → salida/fotos/t003.00.png …
   node render.cjs --hoja                  → una foto por escena (hoja de contacto)
   Opciones: --workers 4  --escala 0.5 (borrador)  --desde 0 --hasta 139  --sin-audio */
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const has = k => process.argv.includes('--' + k);
const TL = JSON.parse(fs.readFileSync(path.join(DIR, 'produccion', 'timeline.json'), 'utf8'));
const FPS = 30, W = 1920, H = 1080;
const escala = parseFloat(arg('escala', '1'));
const url = 'file://' + path.join(DIR, 'pieza.html') + '?render=1';

async function abrir(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: escala });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  if (errs.length) console.log('avisos de la página:\n  ' + [...new Set(errs)].join('\n  '));
  const cdp = await page.context().newCDPSession(page);
  return { page, cdp };
}
async function cuadro(tab, t, png) {
  await tab.page.evaluate(x => window.seek(x), t);
  const r = await tab.cdp.send('Page.captureScreenshot', png ? { format: 'png' } : { format: 'jpeg', quality: 92 });
  return Buffer.from(r.data, 'base64');
}

(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--font-render-hinting=none'] });
  const fotos = arg('fotos'), hoja = has('hoja');
  if (fotos || hoja) {
    const dir = path.join(DIR, 'salida', 'fotos'); fs.mkdirSync(dir, { recursive: true });
    const ts = hoja ? TL.escenas.flatMap(e => [e.ini + Math.min(2.5, (e.fin - e.ini) * .3), (e.ini + e.fin) / 2 + 1, e.fin - 0.5]) : fotos.split(',').map(Number);
    const tab = await abrir(browser);
    for (const t of ts) { const f = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`); fs.writeFileSync(f, await cuadro(tab, t, true)); console.log(f); }
    await browser.close(); return;
  }
  const desde = parseFloat(arg('desde', '0')), hasta = parseFloat(arg('hasta', String(TL.total)));
  const n0 = Math.round(desde * FPS), n1 = Math.round(hasta * FPS);
  const workers = parseInt(arg('workers', '4'));
  const tmp = path.join(DIR, 'salida', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil((n1 - n0) / workers);
  const t0 = Date.now();
  let hechos = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = n0 + w * per, b = Math.min(n1, a + per);
    if (a >= b) return;
    const tab = await abrir(browser);
    const out = path.join(tmp, `parte${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-vf', escala !== 1 ? `scale=${W * escala}:${H * escala}` : 'null', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const buf = await cuadro(tab, f / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++hechos % 150 === 0) console.log(`${hechos}/${n1 - n0} cuadros · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }));
  await browser.close();
  const lista = path.join(tmp, 'lista.txt');
  fs.writeFileSync(lista, Array.from({ length: workers }, (_, w) => `file 'parte${w}.mp4'`).filter((_, w) => fs.existsSync(path.join(tmp, `parte${w}.mp4`))).join('\n'));
  const mudo = path.join(tmp, 'mudo.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', mudo]);
  if (has('sin-audio')) { fs.copyFileSync(mudo, path.join(DIR, 'salida', 'tmp', 'video-mudo.mp4')); console.log('listo (sin audio)', `${((Date.now() - t0) / 1000).toFixed(0)} s`); return; }
  const final = path.join(DIR, 'salida', arg('salida', 'cumbre-poc-thiago.mp4'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-ss', String(desde), '-t', String(hasta - desde), '-i', path.join(DIR, 'audio', 'banda.m4a'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', final]);
  console.log('listo', final, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error(e); process.exit(1); });
