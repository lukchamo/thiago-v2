# PoC Farmaconal Quirúrgica · CooWeb para Thiago Da Cunha

Prueba de concepto de CooWeb que muestra nuestro entendimiento de la propuesta de
**Thraive** para **Farmaconal Quirúrgica**: una capa operativa encima de SAP Business One
donde el caso quirúrgico es el centro (conduce → quirófano → conciliación → factura).

Casos, nombres y montos son de ejemplo; las cifras de operación salen de la propuesta.

## Qué hay

| Ruta | Qué es |
|---|---|
| `video/salida/farmaconal-poc-thiago.mp4` | El video (1920×1080, 30 fps, 3:12) con voz en off dominicana, música y subtítulos quemados |
| `video/salida/subtitulos.srt` | Los mismos subtítulos, aparte |
| `video/guion.md` | Guion de la locución por escenas |
| `video/pieza.html` | La pieza de motion graphics. Se abre en el navegador: clic o espacio = reproducir/pausar, ← → = ±5 s, R = reinicio |
| `poc/farmaconal-poc.html` | El PoC interactivo (5 vistas), versión en blanco |
| `video/assets/isometrico.mp4` | El diorama isométrico del PoC grabado (modo Hoy → Con la plataforma) |

## Cómo se hizo el video

1. **Locución** (`video/produccion/locucion.json`): 22 frases, ElevenLabs `eleven_v4` con la voz
   *Chaer – Locutor Latino Dominicano* y etiquetas de intención (`[warmly]`, `[serious]`, `[confident]`…).
   "CooWeb" va en fonética (`/koˈweb/`) para que suene "Co-web".
2. **Línea de tiempo** (`produccion/timeline.py`): mide cada toma y la coloca con sus pausas.
3. **Marcas por palabra** (`produccion/palabras.json`): transcripción con ElevenLabs Scribe; cada
   animación se ancla a la palabra exacta que la dispara (`data-in="v04.foto"`).
4. **Subtítulos** (`produccion/subtitulos.py`) → `timeline.js` y `salida/subtitulos.srt`.
5. **Música**: ElevenLabs Music v2.5, instrumental de 196 s; se mezcla con ducking bajo la voz
   (`produccion/mezclar.py final` → `audio/banda.m4a`, ≈ -15,5 LUFS).
6. **Isométrico** (`produccion/grabar-isometrico.cjs`): graba el diorama 3D del PoC cuadro a cuadro
   con un reloj virtual (12 s en "Hoy", clic, 15 s "Con la plataforma").
7. **Render** (`render.cjs`): Playwright cuadro a cuadro (el motor es determinista) → H.264 + AAC.

```bash
cd video
node produccion/grabar-isometrico.cjs 12 15   # cuadros del diorama (salida/tmp/iso)
python3 produccion/timeline.py && python3 produccion/subtitulos.py
python3 produccion/mezclar.py final
node render.cjs                    # MP4 completo (≈ 4 min en 4 núcleos)
node render.cjs --fotos 3,44,95    # fotos sueltas para revisar
```
