#!/usr/bin/env python3
"""Marcas por palabra de cada toma con Whisper local (faster-whisper, modelo small).
Escribe produccion/palabras.json con {s, w, r, e}: palabra y tiempos relativos al archivo
de la toma. Se le da el texto del guion como pista para que escriba bien los nombres."""
import json, os, re, subprocess
import numpy as np
from faster_whisper import WhisperModel
AQUI = os.path.dirname(os.path.abspath(__file__))
V = os.path.dirname(AQUI)
loc = json.load(open(os.path.join(AQUI, 'locucion.json'), encoding='utf-8'))
m = WhisperModel('small', device='cpu', compute_type='int8')
out = []
for s in loc['segmentos']:
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(V, 'audio', 'voz', s['id'] + '.mp3'), '-ac', '1', '-ar', '16000',
                          '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    segs, _ = m.transcribe(np.frombuffer(pcm, np.float32), language='es', word_timestamps=True,
                           initial_prompt=s['texto'], beam_size=5, vad_filter=False)
    ws = [{'w': w.word.strip(), 'r': w.start, 'e': w.end} for sg in segs for w in sg.words]
    # Whisper pone la primera palabra en 0: se lleva al final del silencio inicial real
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', os.path.join(V, 'audio', 'voz', s['id'] + '.mp3'), '-af',
                          'silencedetect=noise=-40dB:d=0.05', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = re.findall(r'silence_start: ([\d.]+)', err); en = re.findall(r'silence_end: ([\d.]+)', err)
    lead = float(en[0]) if st and float(st[0]) < 0.02 and en else 0.0
    if ws and ws[0]['r'] < lead:
        ws[0]['r'] = min(lead, ws[0]['e'] - 0.05)
    for w in ws:
        out.append({'s': s['id'], 'w': w['w'], 'r': round(w['r'], 3), 'e': round(w['e'], 3)})
    print(s['id'], ' '.join(f"{w['w']}@{w['r']:.2f}" for w in ws[:4]), '…')
json.dump(out, open(os.path.join(AQUI, 'palabras.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'palabras')
