#!/usr/bin/env node
/* Graba el diorama isométrico del PoC (poc/farmaconal-poc.html#ciclo) cuadro a cuadro con un
   reloj virtual (requestAnimationFrame y performance.now controlados), así la animación 3D sale
   fluida aunque el render sea más lento que el tiempo real.
   Secuencia: 1 s de preparación · HOY s en modo "Hoy" · clic en "Con la plataforma" · PLAT s.
   Salida: salida/tmp/iso/f0000.jpg… (para el render) y assets/isometrico.mp4 (vista previa). */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const DIR = path.dirname(__dirname);
const POC = path.join(DIR, '..', 'poc', 'farmaconal-poc.html');
const OUT = path.join(DIR, 'salida', 'tmp', 'iso');
const FPS = 30, W = 1600, H = 900;
const HOY = parseFloat(process.argv[2] || '12'), PLAT = parseFloat(process.argv[3] || '14');

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });
  const page = await browser.newPage({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.addInitScript(() => {
    let vt = 0, id = 0; const q = new Map();
    window.requestAnimationFrame = cb => { q.set(++id, cb); return id; };
    window.cancelAnimationFrame = i => q.delete(i);
    performance.now = () => vt;
    window.__step = dt => { vt += dt; const cbs = [...q.values()]; q.clear(); cbs.forEach(cb => cb(vt)); };
  });
  await page.goto('file://' + POC + '#ciclo');
  await page.waitForFunction(() => window.THREE !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: `
    .top,.poc-strip,#v-ciclo .head,.side,.hint,.controls{display:none!important}
    main{padding:0!important;max-width:none!important}
    .cycle{display:block!important}
    .stage-wrap{position:fixed!important;inset:0!important;height:100vh!important;min-height:0!important;border-radius:0!important;border:0!important}
    .log div{animation:none!important}
    .hud{top:22px!important;left:24px!important;right:24px!important}
    .log{right:24px!important;bottom:24px!important}` });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  const cdp = await page.context().newCDPSession(page);
  const step = () => page.evaluate(d => window.__step(d), 1000 / FPS);
  for (let i = 0; i < 6; i++) await step();
  await page.click('.seg button[data-mode="hoy"]');
  for (let i = 0; i < FPS * 1; i++) await step();          // preparación, no se graba
  let n = 0;
  const shot = async () => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync(path.join(OUT, `f${String(n++).padStart(4, '0')}.jpg`), Buffer.from(r.data, 'base64'));
  };
  for (let i = 0; i < Math.round(HOY * FPS); i++) { await step(); await shot(); }
  await page.click('.seg button[data-mode="plat"]');
  for (let i = 0; i < Math.round(PLAT * FPS); i++) { await step(); await shot(); if (n % 150 === 0) console.log(n, 'cuadros'); }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(OUT, 'f%04d.jpg'),
    '-vf', 'scale=1280:720', '-c:v', 'libx264', '-crf', '22', '-pix_fmt', 'yuv420p', path.join(DIR, 'assets', 'isometrico.mp4')]);
  fs.writeFileSync(path.join(OUT, 'info.json'), JSON.stringify({ fps: FPS, frames: n, hoy: HOY, plat: PLAT, w: W, h: H }));
  console.log('listo', n, 'cuadros');
})().catch(e => { console.error(e); process.exit(1); });
