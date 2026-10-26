#!/usr/bin/env python3
"""Mezcla la banda del video con precisión de muestra (numpy).

  python3 produccion/mezclar.py voz     → audio/voz-linea.wav (solo la locución en su sitio)
  python3 produccion/mezclar.py final   → audio/banda.wav + audio/banda.m4a (voz + música con ducking)

Cada toma se normaliza a -16 LUFS con ffmpeg y se coloca en su `pos` de timeline.json.
La música se normaliza a -20 LUFS, baja ~7 dB mientras habla la voz (envolvente con
ataque y relajación suaves) y hace fade de entrada y salida.
"""
import json, os, subprocess, sys
import numpy as np

V = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
tl = json.load(open(os.path.join(V, 'produccion', 'timeline.json'), encoding='utf-8'))
TOTAL = tl['total']
N = int(round(TOTAL * SR))


def leer(fn, filtros):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, '-af', filtros + f',aresample={SR}',
                          '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).reshape(-1, 2).copy()


def escribir(fn, x):
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s16le', fn], input=x.tobytes(), check=True)


voz = np.zeros((N, 2), np.float32)
for s in tl['segmentos']:
    clip = leer(os.path.join(V, s['archivo']), 'loudnorm=I=-16:TP=-2:LRA=7')
    a = int(round(s['pos'] * SR))
    b = min(N, a + len(clip))
    voz[a:b] += clip[:b - a]

modo = sys.argv[1] if len(sys.argv) > 1 else 'voz'
if modo == 'voz':
    escribir(os.path.join(V, 'audio', 'voz-linea.wav'), voz)
    print('ok voz', TOTAL)
    sys.exit()

mus = leer(os.path.join(V, 'audio', 'musica.mp3'), 'loudnorm=I=-20:TP=-3:LRA=9')
m = np.zeros((N, 2), np.float32)
m[:min(N, len(mus))] = mus[:N]

# envolvente de la voz (RMS en ventanas de 20 ms) → ganancia de la música
hop = SR // 50
rms = np.sqrt(np.mean(voz[:N - N % hop, 0].reshape(-1, hop) ** 2, axis=1))
habla = (rms > 0.01).astype(np.float32)
g = np.empty_like(habla)
nivel = 1.0
for i, h in enumerate(habla):
    obj = 0.42 if h else 1.0                   # ≈ -7,5 dB bajo la voz
    k = 0.35 if obj < nivel else 0.035          # ataque ~60 ms, relajación ~0,6 s
    nivel += (obj - nivel) * k
    g[i] = nivel
gan = np.repeat(g, hop)
gan = np.concatenate([gan, np.full(N - len(gan), gan[-1])])[:, None]
t = np.arange(N) / SR
fade = np.clip(t / 1.2, 0, 1) * np.clip((TOTAL - t) / 3.5, 0, 1)
m *= gan * fade[:, None] * 0.9

mix = (voz + m) * 1.2          # ≈ -15,5 LUFS
pico = np.max(np.abs(mix))
if pico > 0.89:
    mix *= 0.89 / pico
escribir(os.path.join(V, 'audio', 'banda.wav'), mix)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(V, 'audio', 'banda.wav'), '-c:a', 'aac', '-b:a', '192k',
                os.path.join(V, 'audio', 'banda.m4a')], check=True)
print('ok final', TOTAL, 'pico', round(float(pico), 3))
