# Landing · Alison Ramírez

Página de marca personal para **Alison Ramírez** — estrategia inmobiliaria y construcción de patrimonio.

Es un único archivo estático (`index.html`) sin dependencias ni build: se abre directo en el navegador
o se publica tal cual (GitHub Pages, Netlify, Vercel, hosting propio). Sólo carga tipografías de Google Fonts.

## Estructura comercial

Hero → autoridad → problema → transformación → Método Patrimonio 360° → filtro "es / no es para ti" →
escalera de productos → tabla comparativa → posicionamiento → entregables → testimonios → sobre Alison →
FAQ → CTA final.

Jerarquía de conversión: **Patrimonio 360 ($1.499.000 → $990.000)** › Tu Mejor Inversión ($790.000 → $490.000) › Sesión Diagnóstico ($49.900, sin descuento).

## Campos editables

Todos los puntos pendientes están marcados en el HTML con el comentario `EDITABLE`:

| Qué | Dónde |
|---|---|
| Fotografías de Alison (hero, autoridad, sobre Alison) | bloques `.portrait-ph` — reemplazar por `<img>` |
| Logos de medios | `.logo-slot` en la barra de medios |
| Cifras de trayectoria | `.stat` en la sección de autoridad — **sólo cifras reales** |
| Testimonios | `.tst` en la sección de testimonios — **sólo testimonios reales y autorizados** |
| Links de pago / agenda | objeto `LINKS_DE_PAGO` al inicio del `<script>` — un solo lugar para los tres programas |
| WhatsApp y correo | enlaces del footer |
| Redes sociales | enlaces del footer |

## Links de pago

Los seis botones de compra (los tres de las tarjetas y los tres del CTA final) leen un único objeto
al inicio del `<script>`:

```js
var LINKS_DE_PAGO = {
  'patrimonio-360':     '',   // $990.000
  'tu-mejor-inversion': '',   // $490.000
  'diagnostico':        ''    // $49.900
};
```

Basta pegar cada link entre las comillas. Mientras estén vacíos, los botones llevan a la sección de
programas, así que la página nunca queda con un botón muerto.

## Urgencia

No hay escasez falsa ni countdown inventado. El bloque de contador
(`#countdown`) permanece **oculto** mientras `data-deadline` esté vacío; sólo se activa al escribir
una fecha real y futura, por ejemplo:

```html
<div class="countdown" id="countdown" data-deadline="2026-12-31T23:59:00-03:00">
```

## Identidad visual

- Blanco / hueso como base, rosado sofisticado (`--rose`) para energía y CTA, verde salvia (`--sage`)
  para patrimonio y estabilidad, carbón (`--ink`) para texto y contraste.
- Tipografías: Fraunces (títulos editoriales) + DM Sans (texto).
- Todos los colores y radios están en variables CSS al inicio del archivo (`:root`).

## Notas de comunicación

La página no promete rentabilidades, plusvalías ni resultados de inversión, y el footer incluye el
descargo correspondiente. Cualquier edición debería mantener ese criterio.
