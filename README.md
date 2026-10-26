# Propuestas · CooWeb

Propuestas y pruebas de concepto que CooWeb arma para clientes y aliados. Cada propuesta vive
en su carpeta, con su PoC, su video y todo lo necesario para regenerarlos.

| Propuesta | Para | Qué incluye | Estado |
|---|---|---|---|
| [`propuestas/farmaconal-thraive`](propuestas/farmaconal-thraive/) | Thiago Da Cunha · propuesta de Thraive para Farmaconal Quirúrgica | PoC interactivo (5 vistas + diorama isométrico) y video de 3:12 con voz dominicana | Enviada · octubre 2026 |
| [`propuestas/cumbre-family-office`](propuestas/cumbre-family-office/) | Thiago Da Cunha · propuesta de Thraive para el family office de JC | Oferta de equipo dedicado (PDF y Word), PoC interactivo bilingüe de 11 vistas con asistente de IA y video demostrativo de 3:47 con voz dominicana | Por enviar · octubre 2026 |

## Skills

| Skill | Qué hace |
|---|---|
| [`skills/cooweb-propuesta-ejecutiva`](skills/cooweb-propuesta-ejecutiva/) | Oferta ejecutiva comercial de CooWeb en una hoja (PDF), estilo consultora: JSON de contenido → HTML → PDF carta, con control de que quepa en una página. Nació de la oferta marco para Thraive. Para instalarlo en claude.ai, sube `skills/cooweb-propuesta-ejecutiva.skill` |

## Estructura de una propuesta

```
propuestas/<cliente-aliado>/
  README.md        entendimiento, entregables, notas y cómo regenerar
  oferta/          la oferta comercial de CooWeb (PDF, Word y el JSON fuente)
  poc/             el PoC interactivo (HTML autocontenido)
  video/           pieza de motion graphics, locución, música, render y MP4 final
```
