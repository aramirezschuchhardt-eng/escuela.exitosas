# Escuela de Brokers · Avance Inmobiliario

Presentación de formación inicial para nuevas brokers. 32 láminas en 16:9,
pensadas para proyectarse en una reunión o clase.

Abre `index.html` en el navegador (o publícala junto al resto del sitio).

## Cómo se usa

| Tecla | Qué hace |
|---|---|
| `→` `espacio` | Lámina siguiente |
| `←` | Lámina anterior |
| `O` | Vista general de las 32 láminas |
| `F` | Pantalla completa |
| `P` | Imprimir o guardar como PDF (una lámina por página) |
| `Inicio` / `Fin` | Primera / última lámina |

También responde al clic en los costados y a deslizar el dedo en tablet.
La dirección lleva el número de lámina (`index.html#14`), así que se puede
compartir un enlace directo a una lámina concreta.

## Las fotografías

Todas las imágenes se declaran en un solo archivo: **`imagenes.js`**.
Ninguna lámina escribe una URL directamente, así que cambiar una foto
es cambiar una línea.

Hay dos orígenes:

1. **Fotografías y renders reales del proyecto Edificio Vista Amunátegui**
   (`img/proyecto/`), que ya estaban en este repositorio. Son las que se usan
   en todo el bloque de propiedades nuevas: fachada, interiores, espacios
   comunes y entorno.

2. **Fotografías de escena generadas para esta presentación** (brokers,
   reuniones, visitas, llaves, cierre), que se cargan desde una URL remota.

### Para reemplazar una foto por una propia

1. Deja el archivo en `img/escena/` (crea la carpeta si no existe).
2. En `imagenes.js`, cambia el valor por la ruta local:

   ```js
   portada: 'img/escena/mi-portada.jpg',
   ```

No hay que tocar ninguna otra cosa: la lámina que use esa clave se actualiza sola.

> Conviene hacerlo con las fotos de escena apenas haya material propio de
> Avance. Las fotografías reales del equipo y de operaciones cerradas siempre
> van a comunicar mejor que una imagen genérica, y además dejan la
> presentación funcionando sin depender de una URL externa.

Si alguna imagen remota no carga, la lámina no se rompe: en su lugar aparece
un degradado con los colores de la marca y el texto se sigue leyendo igual.

## Archivos

```
index.html     La página: sólo la estructura y los controles
estilos.css    El sistema visual (colores, tipografías, tipos de lámina)
imagenes.js    El listado de fotografías ← aquí se cambian las imágenes
piezas.js      Piezas reutilizables: iconos, tarjetas, checklists, pies
guion.js       El contenido de las 32 láminas, una entrada por lámina
deck.js        Navegación, escalado, vista general y respaldo de imágenes
img/proyecto/  Renders reales de Edificio Vista Amunátegui
img/marca/     Logotipo de Avance Inmobiliario
```

## Para editar el contenido

Cada lámina es una entrada de la lista `LAMINAS` en `guion.js`:

```js
{
  titulo: 'El cierre',      // nombre en la vista general
  mini:   IMG.firma,        // miniatura de la vista general
  oscura: true,             // opcional: texto claro sobre fotografía
  html:   `…`               // el contenido
}
```

Para reordenar las láminas basta con mover la entrada de lugar; la numeración
y la vista general se recalculan solas.

## Recorrido

1. Portada y bienvenida (1–2)
2. El oficio: qué hace una broker y cómo se gana (3–6)
3. Nuevo vs. usado: comparación y cuadro (7–9)
4. Propiedades nuevas: verde/blanco/entrega, producto, espacios, ubicación (10–14)
5. Propiedades usadas: ventajas, revisión y lectura de cliente (15–17)
6. Captación: embudo, canales y guion del primer contacto (18–21)
7. Proceso comercial: los siete pasos, la visita, herramientas, objeciones (22–25)
8. Roleplay: cómo funciona y los tres casos (26–28)
9. Cierre, post venta y primera semana (29–32)
