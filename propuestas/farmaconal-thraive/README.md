# PoC Farmaconal Quirúrgica · CooWeb para Thiago Da Cunha

Prueba de concepto de CooWeb que muestra nuestro entendimiento de la propuesta de
**Thraive** para **Farmaconal Quirúrgica**: una capa operativa encima de SAP Business One
donde el caso quirúrgico es el centro (conduce → quirófano → conciliación → factura).

Casos, nombres y montos son de ejemplo; las cifras de operación salen de la propuesta.

- **Para:** Thiago Da Cunha · **Propone:** Thraive · **Cliente final:** Farmaconal Quirúrgica (Rep. Dominicana)
- **Construye la PoC:** CooWeb · **Fecha:** 26 de octubre de 2026
- **PoC publicado:** https://claude.ai/artifact/8Rw3GdpSQDh2EPUF8srmLZ (privado: compartir desde el menú *Compartir*)

## Entendimiento

Thraive le propone a Farmaconal una **capa operativa encima de SAP Business One** (SAP se queda como
sistema de registro). La **fase 1** es el flujo interno del consumo quirúrgico: conduce, quirófano,
conciliación y factura, en tres olas:

1. **El hilo:** caso digital desde la orden en SAP, app del técnico sin señal y con visión, torre de
   control y checklist que bloquea el despacho. No depende del catálogo.
2. **SAP y conciliación:** Service Layer con idempotencia (nunca escritura directa en tablas),
   conciliación por escaneo, FEFO y expediente con semáforo.
3. **IA que aprende:** kit sugerido por consumo histórico y causa probable de incidencias (≈12 meses de datos).

El catálogo sin códigos de barra es el gran bloqueante, pero la ola 1 no depende de él: la cámara lee
la etiqueta (referencia, lote y vencimiento). Además de la versión móvil, se construye una
**plataforma web** para coordinación, preparación, recepción y facturación.

**Cómo lo construye CooWeb:** células de trabajo con planeación cerrada e hitos de facturación por
tiempo y/o resultado (cierres cortos, escalables), o desarrollo completo más soporte y mantenimiento
y bolsa de horas evolutivas.

## Notas para la propuesta técnica

Inconsistencias detectadas en el PDF de la propuesta:

- Habla de 20 técnicos en varias secciones y de 26 en el caso de negocio.
- La portada dice dos reuniones de descubrimiento y los supuestos dicen una.
- La portada dice septiembre y el cierre dice agosto de 2026.
- La garantía de "no cobramos hasta que los beneficios ocurran" es riesgosa para la rentabilidad:
  mejor hitos de aceptación medibles.

En el video, los 4 hitos de la célula, los roles del equipo y las etiquetas "SLA de soporte",
"Un solo responsable" y "Mejoras continuas" son ilustrativos: ajustarlos a la oferta real.

## Qué hay

| Ruta | Qué es |
|---|---|
| `video/salida/farmaconal-poc-thiago.mp4` | El video (1920×1080, 30 fps, 3:12) con voz en off dominicana, música y subtítulos quemados |
| `video/salida/subtitulos.srt` | Los mismos subtítulos, aparte |
| `video/guion.md` | Guion de la locución por escenas |
| `video/pieza.html` | La pieza de motion graphics. Se abre en el navegador: clic o espacio = reproducir/pausar, ← → = ±5 s, R = reinicio |
| `poc/farmaconal-poc.html` | El PoC interactivo (5 vistas), versión en blanco (la publicada) |
| `poc/farmaconal-poc-original.html` | El PoC antes de aclararlo, como se envió primero |
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
cd propuestas/farmaconal-thraive/video
node produccion/grabar-isometrico.cjs 12 15   # cuadros del diorama (salida/tmp/iso)
python3 produccion/timeline.py && python3 produccion/subtitulos.py
python3 produccion/mezclar.py final
node render.cjs                    # MP4 completo (≈ 4 min en 4 núcleos)
node render.cjs --fotos 3,44,95    # fotos sueltas para revisar
```
