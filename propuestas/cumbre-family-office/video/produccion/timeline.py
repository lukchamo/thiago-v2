#!/usr/bin/env python3
"""Mide cada toma (inicio y fin real de la voz) y arma la línea de tiempo del video.
Si existe produccion/palabras.json (marcas por palabra relativas a cada toma, de la
transcripción de ElevenLabs Scribe), las pasa a tiempo absoluto en `palabras`.
Salida: produccion/timeline.json y timeline.js (window.TL). Después: subtitulos.py."""
import json, re, subprocess, os
AQUI = os.path.dirname(os.path.abspath(__file__))
V = os.path.dirname(AQUI)
loc = json.load(open(os.path.join(AQUI, 'locucion.json'), encoding='utf-8'))
LEAD = 1.4  # segundos antes de la primera palabra

def medir(fn):
    dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',fn],capture_output=True,text=True).stdout)
    err = subprocess.run(['ffmpeg','-hide_banner','-i',fn,'-af','silencedetect=noise=-40dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    ini = ends[0] if starts and starts[0] < 0.02 and ends else 0.0
    fin = dur
    if starts and starts[-1] > ini and (len(ends) < len(starts)):
        fin = starts[-1]
    return dur, ini, fin

t = LEAD
segs = []
for s in loc['segmentos']:
    fn = os.path.join(V, 'audio', 'voz', s['id'] + '.mp3')
    dur, ini, fin = medir(fn)
    pos = t - ini                     # dónde se coloca el archivo
    segs.append({'id': s['id'], 'escena': s['escena'], 'texto': s['texto'],
                 'archivo': f"audio/voz/{s['id']}.mp3", 'pos': round(pos, 3),
                 'ini': round(t, 3), 'fin': round(pos + fin, 3), 'dur_archivo': round(dur, 3)})
    t = pos + fin + s['gap']
total = round(t, 2)
# escenas: desde la primera frase de la escena (menos un respiro) hasta la primera de la siguiente
esc = []
for i, sg in enumerate(segs):
    if not esc or esc[-1]['id'] != sg['escena']:
        esc.append({'id': sg['escena'], 'ini': sg['ini'], 'frases': []})
    esc[-1]['frases'].append({'id': sg['id'], 'ini': sg['ini'], 'fin': sg['fin']})
for i, e in enumerate(esc):
    e['ini'] = 0.0 if i == 0 else round(e['ini'] - 0.45, 3)
for i, e in enumerate(esc):
    e['fin'] = esc[i + 1]['ini'] if i + 1 < len(esc) else total
out = {'total': total, 'fps': 30, 'segmentos': segs, 'escenas': esc}
fp = os.path.join(AQUI, 'palabras.json')
if os.path.exists(fp):
    pos = {s['id']: s['pos'] for s in segs}
    out['palabras'] = [{'s': p['s'], 'w': p['w'], 'a': round(pos[p['s']] + p['r'], 3), 'b': round(pos[p['s']] + p['e'], 3)}
                       for p in json.load(open(fp, encoding='utf-8'))]
json.dump(out, open(os.path.join(AQUI, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(V, 'timeline.js'), 'w').write('window.TL = ' + json.dumps(out, ensure_ascii=False) + ';\n')
for e in esc:
    print(f"{e['id']:13s} {e['ini']:7.2f} → {e['fin']:7.2f}  ({e['fin']-e['ini']:5.2f}s)  " + ' '.join(f"{f['id']}@{f['ini']:.2f}-{f['fin']:.2f}" for f in e['frases']))
print('TOTAL', total)
