# Estilo de la propuesta ejecutiva CooWeb

## La idea

Estilo consultora minimalista. El orden lo dan las líneas finas, el espacio en blanco y el tamaño de la
letra, no las cajas ni los adornos. Un solo color de acento (azul CooWeb `#1145A8`) y la tipografía de
marca (Calibri, o Carlito, su clon métrico, que va incrustado). Hoja carta.

| Pieza | Cómo se ve |
|---|---|
| Cabecera | Logo a la izquierda; a la derecha la etiqueta en azul y "Para <persona> · <fecha>". Debajo, un filete azul de 2 px |
| Titular | Una frase humana en azul ("Thiago, gracias por confiar en CooWeb."), no "Propuesta comercial" |
| KPIs | Cifras grandes en azul con divisores verticales finos, entre dos filetes grises |
| Secciones | Título azul con un filete azul fino debajo |
| Opciones | Tabla comparativa. Columna recomendada: cabecera rellena de azul y celdas con un tinte muy suave |
| Proceso | Flechas tipo chevron en azul; el último paso (continuidad), en gris |
| Cierre | Dos columnas separadas por un filete vertical: liderazgo y método |
| Aviso y pie | Letra pequeña gris, separada por un filete |

## Lo que no se usa, y por qué

Luis rechazó la primera versión porque "tenía mucha cara de IA". Las guías de diseño coinciden en las
señales de un diseño generado sin criterio:

- **Bordes redondeados** en tarjetas, cajas o botones.
- **Franjas de color a un lado** de una tarjeta (el "bisel" izquierdo). Es la señal más reconocible.
- **Barras o fondos con degradado.**
- **Iconos dentro de cuadritos de color**, avatares circulares, píldoras o badges redondeados.
- **Tarjetas con fondo suave** para todo, sombras y emojis.

El generador no los usa. Si editas el HTML a mano, tampoco los añadas. Si el cliente pide otro look,
quedan dos alternativas probadas que mantienen estas reglas:

- **Suizo:** Inter, columna de etiquetas numeradas a la izquierda y todo alineado a la izquierda.
- **Editorial:** titulares con serifa (Newsreader) y columnas separadas por filetes verticales.

## Que quepa en una hoja

Una oferta ejecutiva se lee en un minuto: si no cabe, sobra texto, no falta hoja. El script mide el alto
real y sale con código 2 si se pasa. Recorta en este orden:

1. **Texto.** Cada celda en 1 o 2 líneas, viñetas de 6 palabras o menos y el `intro` en 2 líneas.
   Suele bastar.
2. **Notas opcionales.** La `nota` del bloque `porque`, o acortar los textos de los KPIs.
3. **`"compacto": true`.** Reduce letra y márgenes cerca de un 8 %. Úsalo solo si falta poco: por
   debajo de esa densidad la hoja deja de respirar.
4. **Un bloque entero.** Quita el de menos peso para este cliente (a menudo `kpis` o `proceso`).

No bajes el aviso a un tamaño ilegible ni partas la oferta en dos hojas. Si sobra espacio, déjalo: el
blanco forma parte del estilo.

## Revisión visual (siempre mira el PNG)

- Que ninguna cifra se parta en dos líneas ("USD 3.200 / mes" va entera).
- Que el titular no pase de 2 líneas y el `intro` no pase de 3.
- Que quede claro qué opción recomendamos (una sola) y que cada opción tenga "Ideal para".
- Que los totales "desde" cuadren (modalidad + Technical Lead).
- Que la tabla tenga 2 a 4 opciones y el proceso 3 a 5 pasos: con más, los textos se aprietan.
