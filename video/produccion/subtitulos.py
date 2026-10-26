#!/usr/bin/env python3
"""Arma los subtítulos a partir del texto del guion y las marcas por palabra.

Corta cada frase en bloques de ≤ 76 caracteres por puntuación, y toma el tiempo de
inicio de cada bloque de la palabra hablada que le corresponde (los números escritos
en cifras cuentan como las palabras que se pronuncian). Escribe:
  - timeline.json / timeline.js con `subs`
  - salida/subtitulos.srt
"""
import json, os, re, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
V = os.path.dirname(AQUI)
tl = json.load(open(os.path.join(AQUI, 'timeline.json'), encoding='utf-8'))
HABLADAS = {'725': 2, '70': 1, '60': 1, '90': 1, '30': 2, '%': 0}  # "setecientos veinticinco", "treinta por ciento"…
MAX = 76


def bloques(texto):
    partes = re.split(r'(?<=[.?!:;…])\s+', texto)
    out = []
    for p in partes:
        while len(p) > MAX:
            corte = max(p.rfind(', ', 0, MAX), p.rfind(' y ', 0, MAX))
            if corte < 15:
                mitad = len(p) // 2      # sin coma útil: cortar en el espacio más cercano a la mitad
                corte = min((i for i, c in enumerate(p) if c == ' '), key=lambda i: abs(i - mitad))
            else:
                corte += 1
            out.append(p[:corte].strip())
            p = p[corte:].strip()
        if p:
            out.append(p)
    # juntar bloques muy cortos con el siguiente
    res = []
    for b in out:
        if res and len(res[-1]) < 22 and len(res[-1]) + len(b) + 1 <= MAX:
            res[-1] += ' ' + b
        else:
            res.append(b)
    return res


def habladas(b):
    n = 0
    for w in b.split():
        k = re.sub(r'[^\w%]', '', w)
        n += HABLADAS.get(k, 1) if k else 0
    return n


subs = []
for s in tl['segmentos']:
    ws = [p for p in tl['palabras'] if p['s'] == s['id']]
    i = 0
    bs = bloques(s['texto'])
    for j, b in enumerate(bs):
        a = ws[min(i, len(ws) - 1)]['a'] if ws else s['ini']
        i += habladas(b)
        fin = ws[min(i, len(ws)) - 1]['b'] if ws else s['fin']
        subs.append({'a': round(max(a - 0.08, s['ini'] - 0.1), 3), 'b': round(fin + 0.25, 3), 'txt': b})
# que ningún bloque pise al siguiente
for k in range(len(subs) - 1):
    subs[k]['b'] = min(subs[k]['b'], subs[k + 1]['a'] - 0.02)
tl['subs'] = subs
json.dump(tl, open(os.path.join(AQUI, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(V, 'timeline.js'), 'w', encoding='utf-8').write('window.TL = ' + json.dumps(tl, ensure_ascii=False) + ';\n')


def ts(x):
    h, r = divmod(x, 3600)
    m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'


os.makedirs(os.path.join(V, 'salida'), exist_ok=True)
with open(os.path.join(V, 'salida', 'subtitulos.srt'), 'w', encoding='utf-8') as f:
    for k, sb in enumerate(subs, 1):
        f.write(f"{k}\n{ts(sb['a'])} --> {ts(sb['b'])}\n{sb['txt']}\n\n")
for sb in subs:
    print(f"{sb['a']:7.2f}-{sb['b']:7.2f}  {sb['txt']}")
