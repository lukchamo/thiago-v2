---
name: cooweb-propuesta-ejecutiva
description: Genera propuestas ejecutivas comerciales de CooWeb de una sola hoja en PDF (oferta marco, one-pager comercial). Estilo consultora minimalista con la marca CooWeb, titular cercano, tira de trayectoria, por qué recomendamos un perfil, tabla comparativa de modalidades con precios (perfil AI Native dedicado, full-stack con experiencia, MVP funcional en 3 semanas), proceso, Technical Lead o CTO fractional por bolsas de horas, método dual track, aviso y pie. Úsalo siempre que pidan una oferta marco, propuesta ejecutiva, one-pager, "algo corto de una hoja para mandarle a" un cliente o aliado, opciones de equipo o staffing con precios, o resumir en una página qué ofrece CooWeb y cuánto cuesta, aunque no digan "skill" ni "PDF". También para ajustar una oferta marco ya hecha (precios, opciones, horas, tono, entidad). Para una propuesta formal de varias páginas con código, versión y alcance detallado, usa cooweb-propuesta-comercial.
---

# Propuesta ejecutiva CooWeb (una hoja)

Convierte un brief comercial en una oferta de **una hoja carta en PDF** que se lee en un minuto: agradece
o engancha, dice por qué recomendamos algo, compara las opciones con precio y cierra con quién lidera y
cómo trabajamos. Tono cercano pero corporativo, sin cabecera formal.

**Cuándo esta y cuándo la formal:** si el cliente necesita decidir entre opciones o tener una primera
oferta para conversar, usa esta. Si pide alcance detallado, plan por semanas, entregables y condiciones
contractuales en varias páginas, usa `cooweb-propuesta-comercial`.

## Flujo

1. **Reúne lo mínimo.**
   - A quién va: persona, empresa y relación. Con aliados cercanos se tutea ("para ti").
   - Qué opciones se ofrecen, cuál recomendamos y por qué.
   - Precios y entidad emisora (`llc` por defecto).

   Lee `references/catalogo.md`: trae las modalidades, tarifas de referencia, textos aprobados y lo que no
   se dice. Pregunta una sola vez, y solo si falta el precio de un perfil o equipo dedicado que no sale
   de las tarifas de referencia. El MVP sin precio no es motivo para preguntar: va como "Precio cerrado".
   Una bolsa de horas sin precio tampoco: se dice "desde" la de 16 h. Lo demás, asúmelo y dilo al
   entregar. Si no puedes preguntar, sigue con lo que hay y deja la duda en los supuestos.
2. **Escribe el JSON** de contenido tomando como modelo `references/ejemplo_thraive.json` (la oferta real
   que aprobó Luis). Guárdalo junto a donde vayas a entregar.
3. **Genera:**
   ```bash
   node <skill>/scripts/build_onepager.js contenido.json Oferta-Marco_CooWeb_<Cliente>
   ```
   Nombra el archivo y la `etiqueta` como lo llamó el usuario: "Oferta marco" o "Propuesta ejecutiva".
   Sale con `.html` (fuente autocontenida), `.pdf` (el entregable) y `.png` (para revisar). Usa
   Playwright si está disponible y, si no, Chromium en modo headless.
4. **Si no cabe** (código de salida 2), el script dice cuántos píxeles sobran y cuánto mide cada bloque.
   Recorta según `references/estilo.md` § "Que quepa en una hoja" y vuelve a generar. El ejemplo de
   Thraive llena la hoja casi entera, así que con todos los bloques lo normal es recortar una o dos veces.
5. **Mira el PNG** antes de entregar. La lista de revisión está en `references/estilo.md`: cifras partidas,
   una sola opción recomendada, totales que cuadran.
6. **Entrega el PDF.** Usa la herramienta de entrega de archivos que tengas (`present_files`,
   `SendUserFile`); si no hay ninguna, da la ruta completa. Guarda el JSON por si piden cambios: los cambios se hacen en el JSON
   y se regenera. Cierra con dos o tres líneas sobre los supuestos que tomaste (precios, horas, qué
   recomendaste) para que Luis los valide.

## Estructura del JSON

Campos de primer nivel:

| Campo | Qué es |
|---|---|
| `entidad` | `"llc"` (Cooweb LLC, por defecto) o `"sas"` (CooWeb Colombia S.A.S.). Define el pie |
| `etiqueta` | Arriba a la derecha, en azul: `"Oferta marco · Thraive"` |
| `para`, `fecha` | `"Thiago Da Cunha"`, `"26 oct 2026"` |
| `titulo` | Frase humana, 1 o 2 líneas: agradecimiento o promesa concreta |
| `intro` | 2 o 3 líneas que enmarcan la recomendación |
| `bloques` | Lista ordenada de bloques (abajo) |
| `aviso` | Opcional; si falta, va el aviso por defecto |
| `firma` | Opcional; por defecto "Luis, CEO de CooWeb · Documento confidencial" |
| `compacto` | Opcional, `true` para ganar cerca de un 8 % de alto |

Bloques (todos opcionales; el orden del ejemplo es el recomendado):

| `tipo` | Campos | Para qué |
|---|---|---|
| `kpis` | `items: [{cifra, texto}]` (2 a 4) | Trayectoria o cifras que dan confianza |
| `porque` | `titulo`, `claim`, `texto`, `atributos: [{nombre, texto}]`, `nota` | Por qué recomendamos esta opción |
| `opciones` | `titulo`, `opciones: [{etiqueta, nombre, recomendada, perfil, enfoque: [..], ideal, precio, unidad, nota}]`, `condiciones`, `filas` | Tabla comparativa (2 a 4 opciones). `filas` renombra las filas `{perfil, enfoque, ideal, inversion}`; una fila sin datos no se pinta |
| `proceso` | `titulo`, `pasos: [{marca, etiqueta, nombre, texto, continuidad}]` (3 a 5) | Flechas de proceso; `continuidad: true` pinta el paso en gris |
| `columnas` | `columnas: [col, col]`; cada `col`: `titulo`, `precio`, `unidad`, `texto`, `paquetes: ["16 h", ..]`, `paquete_destacado: "32 h"`, `paquetes_texto`, `paquetes_precio`, `paquetes_unidad`, `nota`, `carriles: [{nombre, texto}]` | Cierre a dos columnas: liderazgo (con bolsas de horas; la destacada sale en azul) y método (con carriles) |
| `texto` | `titulo`, `texto` | Un párrafo suelto cuando ningún otro bloque encaja |

En cualquier texto, `**así**` sale en negrita. Nada más de markdown.

## Reglas de contenido

- **Recomienda una sola opción** (`"recomendada": true`) y dile al cliente por qué en el bloque
  `porque`. Una oferta que no recomienda deja el trabajo al cliente.
- **Cada opción dice para quién es** (`ideal`). Así el cliente se reconoce en una sin sentir que le
  venden la cara.
- **Precios:** USD con punto de miles (`USD 3.200`), unidad aparte (`/ mes`). Si sumas el Technical Lead,
  muestra el total "desde" y verifica la suma. Sin precio confirmado, escribe "Precio cerrado" y "Se
  cotiza según el objetivo y el alcance". Inventar una cifra compromete a Luis.
- **Opciones o pasos:** si el brief compara alternativas, la tabla compara. Si propone una secuencia
  (MVP y luego perfil dedicado), usa la misma tabla con etiquetas "Recomendado · Paso 1" y
  "Continuidad · Paso 2". No hace falta meter las tres modalidades del catálogo: pon solo las que el
  cliente debe decidir.
- **Squads y equipos mixtos:** nómbralos por su composición ("Squad de 2 AI Native dedicados",
  "1 full-stack con experiencia + 1 AI Native") y suma las tarifas de referencia si el brief no da otro
  precio. Más en `references/catalogo.md` § 4.
- **Technical Lead o CTO fractional:** el título por defecto es "Technical Lead o CTO fractional · Luis".
  Si el cliente no tiene CTO o el brief habla de CTO fractional, usa "CTO fractional · Luis" y marca la
  bolsa propuesta con `paquete_destacado`.
- **Trato:** tú con aliados y clientes cercanos, usted cuando el brief lo pida o el cliente sea formal
  (fundaciones, administración, grandes empresas). Los textos del catálogo están en tú: pásalos a usted
  ("crece con ustedes", "para su equipo") y en los carriles y el aviso nombra al cliente ("la Fundación").
- **Cliente en España o la UE:** usa vocabulario de España ("CV" en vez de "hoja de vida", "coste" en
  vez de "costo"). La entidad sigue siendo Cooweb LLC en USD salvo que Luis diga otra cosa; dilo en los
  supuestos. Si el producto maneja datos personales, menciona el RGPD en los supuestos, no en la hoja
  como promesa.
- **Perfiles AI Native en general:** hablas de la línea de CooWeb, no de una persona concreta, salvo que
  el brief lo pida.
- **Nada que no exista:** ni producto listo que no lo esté, ni clientes o cifras que no estén en el
  catálogo o el brief.
- **Español de negocio**, frases cortas, sin relleno. Fechas como "26 oct 2026".

## Estilo

El generador ya aplica el estilo aprobado. Lee `references/estilo.md` si vas a tocar el HTML a mano, si
el cliente pide otro look o si no cabe. En corto: líneas finas, un solo azul y Calibri. Nada de bordes
redondeados, franjas de color a un lado, degradados, iconos en cajitas ni tarjetas con fondo: a Luis le
parecen "cara de IA" y los rechazó.
