# Cumbre · Family Office OS · CooWeb para Thiago Da Cunha

Segunda propuesta para Thraive. Thiago le presentó a **JC** (principal de un single-family office
boutique que maneja las finanzas y los proyectos personales de varios peloteros) la propuesta
*The Family Office Operating System*. Aquí está la oferta de CooWeb para construirla y un PoC
interactivo que muestra cómo entendimos lo que JC espera.

- **Para:** Thiago Da Cunha · **Propone:** Thraive (Thiago & Claudio) · **Cliente final:** JC, family office "Cumbre"
- **Construye:** CooWeb (Cooweb LLC) · **Fecha:** 26 de octubre de 2026
- **PoC publicado:** https://claude.ai/artifact/CwKRy8TY7q5Ukc1qsbVrpe (privado: compartir desde el menú *Compartir*)
- **Video:** `video/salida/cumbre-poc-thiago.mp4` (3:47, voz dominicana, subtítulos quemados; video demostrativo)

## Lo que pidió Thiago

Por WhatsApp: quiere **un recurso full-stack que desarrolle las dos soluciones** (Farmaconal y este
family office) **con la consultoría de Luis**, y mantener ese recurso fijo, como un empleado.
Luis le ofreció un recurso base muy bueno que ya trabaja con él, capacidad a demanda cuando haga
falta ampliar y su acompañamiento con un fee.

La oferta formaliza eso como **staff augmentation + Technical Lead senior part-time**.

## Entendimiento de la propuesta de Thraive

JC trabaja casi solo. Lo difícil para JC no es el trabajo sino sostenerlo todo junto: clientes,
familias, abogados, contadores, bancos, aseguradoras, agentes y contratistas, con decenas de hilos
abiertos que pasan por una sola persona. La propuesta promete seis cosas:

1. **Un solo lugar** para cada cliente, documento y conversación.
2. **Búsqueda instantánea** de cualquier documento o conversación.
3. **Cada seguimiento rastreado**: nada pendiente con un tercero se pierde.
4. **Lo que te necesita ahora**, separado de lo que espera a otros.
5. **Un paso adelante**: recordatorios y resúmenes automáticos.
6. **Desde el teléfono**: capturar y consultar desde cualquier lugar.

El sistema tiene dos capas sobre una base privada, con el chat como puerta de entrada:

- **Capa operativa (fase 1, 3–4 semanas):** captura por chat, tablero de seguimientos, centro
  financiero, asistente de IA de solo lectura (pregunta y redacta), lectura de documentos que llegan
  a la bandeja B27 Ops, calendario con recurrentes y KYC de terceros.
- **Backbone patrimonial (fase 2):** conectividad bancaria por API y la plataforma Aleta para el
  patrimonio consolidado.
- **Base:** cifrado, MFA, instancia privada, acceso granular y trazabilidad completa.

El tono es boutique: confidencialidad extrema, trato personal, y una oficina que crece en relaciones
sin crecer en estructura.

## El PoC

Una app de una sola página, en inglés y español (detecta el idioma del navegador), en modo claro con
tema oscuro opcional. El botón *Phone* de la cinta superior muestra la misma app dentro de un marco de
teléfono. Todos los nombres, montos y terceros son ficticios; el día de demo es el martes 28 de julio
de 2026, para que encajen los ejemplos del PDF (flujo de julio, distribución del 30).

| Vista | Qué demuestra |
|---|---|
| Hoy | Resumen de la mañana, lo que te necesita, lo que espera a terceros, próximos 7 días, documentos de la noche y julio de un vistazo |
| Capturar | Un chat tipo WhatsApp: una frase se vuelve seguimiento, idea o gasto, con cliente, fecha y tercero |
| Seguimientos | Tablero Bandeja / Por hacer / Esperando a terceros / Hecho, con arrastrar, detalle e historial |
| Asistente | Solo lectura. Responde con los datos del sistema y redacta el correo de aprobación al banco o un recordatorio |
| Centro financiero | Entradas y salidas por categoría, posición neta, flujo de julio, esperado del mes, presupuestos y captura de gastos |
| Documentos | La bandeja B27 Ops: recibido → leído → archivado → conciliado; simula un extracto nuevo con una excepción |
| Calendario | Julio con entradas, salidas y vencimientos, y los patrones que el sistema aprendió |
| KYC de terceros | Expedientes por contraparte, verificación de una nueva y renovación de una que vence |
| Patrimonio | Vista previa de la fase 2: patrimonio consolidado, por hogar, por clase de activo y conectividad bancaria |
| Seguridad | Los seis pilares, quién ve qué por rol, vista "ver como" y la trazabilidad de todo lo que se hizo en la demo |
| Hoja de ruta | Fases, matriz valor/facilidad, cómo lo construye CooWeb (sin precios) y el siguiente paso |

**IA en vivo:** el artifact declara la capacidad `sample`. Abierto dentro de Claude, el asistente
contesta preguntas libres y la captura entiende mensajes libres usando la cuenta de Claude de quien
lo ve, que primero tiene que dar permiso. Sin eso, las preguntas sugeridas y los mensajes de ejemplo
funcionan igual, con reglas locales.

## La oferta (`oferta/`)

`Propuesta_Equipo-Dedicado_Thraive.pdf` y `.docx` (código PC-THRAIVE-01, emite Cooweb LLC),
generados con la skill de propuestas de CooWeb desde `oferta/propuesta.json`.

| Línea | USD / mes |
|---|---|
| Desarrollador full-stack senior, dedicado | 3.800 |
| Technical Lead senior part-time (Luis, ≈8 h/semana) | 1.500 |
| **Total mensual** | **5.300** |
| Referencia 6 meses | 31.800 |
| A demanda: desarrollador (875/semana, mínimo 2 semanas) | 3.500 |
| A demanda: QA (700/semana, mínimo 1 semana) | 2.800 |

Condiciones: mínimo 3 meses, luego mes a mes con aviso de 30 días; facturación mensual anticipada a
15 días; reemplazo con empalme sin costo; garantía de ajuste de 30 días; la propiedad intelectual es
de Thraive. Plan indicativo: semana 0 arranque; semanas 1–4 Cumbre fase 1; 5–12 Farmaconal ola 1;
13–20 Farmaconal ola 2 + Cumbre fase 2; después, continuo.

## Supuestos y riesgos

- **Tarifas a demanda** (3.500 y 2.800) son una propuesta nuestra; Luis no las fijó.
- **No hay cláusula de conversión a empleado.** Thiago quiere "mantener el recurso fijo como
  empleado". Si lo pide, conviene ofrecer una conversión con fee después de un plazo mínimo, en vez
  de perder el recurso sin compensación.
- **Un desarrollador para dos productos.** Cumbre fase 1 en 3–4 semanas deja a Farmaconal esperando;
  la ola 1 de Farmaconal (app sin señal, visión, SAP) es pesada y probablemente pida capacidad a demanda.

## Notas sobre la propuesta de Thraive

- **Alcance de la fase 1:** la tabla de funciones pone 7 capacidades en fase 1 (incluye calendario,
  KYC y redacción), pero la matriz de factibilidad promete 5 en 3–4 semanas. Conviene decir que las
  5 núcleo salen en 3–4 semanas y calendario/KYC en las semanas 5–6.
- **"Sin dependencias externas" no es del todo cierto:** WhatsApp Business Platform necesita
  aprobación de Meta (número y plantillas), la lectura de documentos necesita acceso a la bandeja
  B27 Ops y conocer el formato de los extractos de Gentros.
- **"Cada vez que se usa la AmEx, la transacción entra sola"** necesita un agregador bancario o acceso
  de datos de AmEx; está bien en fase 2, pero hay que validarlo antes de prometerlo.
- **Asistente sobre datos financieros:** definir proveedor de IA y retención de datos (idealmente cero)
  y contarlo en la parte de seguridad.

## Qué hay

| Ruta | Qué es |
|---|---|
| `Cumbre-Family-Office-OS-Proposal-Thraive.pdf` | La propuesta de Thraive a JC (insumo) |
| `oferta/Propuesta_Equipo-Dedicado_Thraive.pdf` / `.docx` | La oferta de CooWeb a Thraive |
| `oferta/propuesta.json` | El contenido de la oferta, para regenerarla |
| `poc/cumbre-os.html` | El PoC (HTML autocontenido; los logos están en `poc/assets/`) |
| `video/salida/cumbre-poc-thiago.mp4` | El video demostrativo (1920×1080, 30 fps, 3:47) con voz en off dominicana, música y subtítulos quemados |
| `video/salida/subtitulos.srt` | Los mismos subtítulos, aparte |
| `video/guion.md` | Guion de la locución por escenas, con tiempos |
| `video/pieza.html` | La pieza de motion graphics. Se abre en el navegador: clic o espacio = reproducir/pausar, ← → = ±5 s, R = reinicio |

Para actualizar el PoC publicado, edita `poc/cumbre-os.html` y vuelve a publicar el mismo archivo con
la herramienta de artifacts: conserva el mismo enlace.

## El video

Mismo método que el de Farmaconal, con la identidad visual del PoC de Cumbre (Newsreader, Hanken
Grotesk e IBM Plex Mono, verde azulado y coral sobre blanco). 17 escenas: apertura, el cliente, el
reto, lo que pidió JC, el sistema de Thraive, Hoy, captura por chat, tablero, centro financiero,
asistente, documentos/calendario/KYC, seguridad, patrimonio (fase 2), la maqueta (capturas del PoC en
escritorio y teléfono, en inglés y español), las tres fases, el equipo de CooWeb y el cierre.
No muestra precios. Es un **video demostrativo**: la plataforma todavía no existe y el video lo dice
(en la locución, en un aviso sobre la maqueta, en la cabecera y en el cierre).

1. **Locución** (`video/produccion/locucion.json`): 22 frases, ElevenLabs `eleven_v4`, voz
   *Chaer – Locutor Latino Dominicano*, con etiquetas de intención. "CooWeb" y "Thraive" van en
   fonética; "JC" se escribe "Jota Ce". La frase v19 se regeneró: "Como lo pediste" sonaba a pregunta
   y quedó "Tal como lo pediste". La v17 decía que la prueba de concepto "ya funciona" y se cambió por
   "armamos una maqueta interactiva… es solo una demostración: la plataforma se construye por fases"
   (las tomas descartadas están en `produccion/descartes/`).
2. **Marcas por palabra** (`produccion/marcas.py`): Whisper local (`faster-whisper`, modelo small)
   transcribe cada toma con el guion como pista → `produccion/palabras.json`.
3. **Línea de tiempo y subtítulos** (`produccion/timeline.py`, `produccion/subtitulos.py`).
4. **Música**: ElevenLabs Music v2.5, instrumental de 222 s con toque caribeño, estirada un 2 % para
   cubrir los 3:47; mezcla con ducking (`produccion/mezclar.py final` → `audio/banda.m4a`, ≈ -16 LUFS).
5. **Capturas de la maqueta** (`video/assets/poc/`): pantallas de `poc/cumbre-os.html` en escritorio
   (1600×1000) y teléfono (390×844), en español e inglés.
6. **Render** (`video/render.cjs`): Playwright cuadro a cuadro → H.264 + AAC.

```bash
cd propuestas/cumbre-family-office/video
pip install faster-whisper                    # solo si cambian las tomas
python3 produccion/marcas.py                  # marcas por palabra (si cambian las tomas)
python3 produccion/timeline.py && python3 produccion/subtitulos.py
python3 produccion/mezclar.py final
node render.cjs --workers 6                   # MP4 completo (≈ 6 min en 4 núcleos)
node render.cjs --fotos 30,95,128             # fotos sueltas para revisar
```
