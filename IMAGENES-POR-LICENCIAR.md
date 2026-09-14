# Imágenes con marca de agua en la galería de Vista Amunátegui

**Estado: pendiente de resolver. No se ha modificado el cotizador.**

Ocho fotografías de la galería del proyecto Edificio Vista Amunátegui son
**comps sin licenciar de Adobe Stock**, con la marca de agua y el número de
archivo visibles en la propia imagen.

Están publicadas: el cotizador las muestra hoy a cualquiera que abra la ficha
del proyecto, en la pestaña de entorno y en la de interiores.

Esto importa por dos motivos. El primero es de licencia: un comp no se puede
usar en material comercial. El segundo es de credibilidad: cuando una broker
abre el cotizador frente a un comprador, la marca de agua se ve en pantalla.

## Los ocho archivos

Cada uno existe en dos lugares: el original en `app/public/proyectos/vista-amunategui/`
y la copia publicada en `cotizador/proyectos/vista-amunategui/`. Las referencias
están en `app/src/data/projects/vista-amunategui.ts`.

| Archivo | Línea | Leyenda en la galería | Adobe Stock | Tamaño |
|---|---|---|---|---|
| `entorno-catedral.jpg` | 30 | Centro Histórico de Santiago | #152199971 | 1000×668 |
| `entorno-institucional.jpg` | 31 | Entorno institucional | #243585843 | 1000×735 |
| `entorno-santa-lucia.jpg` | 32 | Cerro Santa Lucía | #188811860 | 1000×667 |
| `entorno-aerea.jpg` | 33 | Vista aérea del sector | #64689876 | 1000×667 |
| `entorno-barrio.jpg` | 34 | Barrio en renovación | #954310019 | 1000×667 |
| `entorno-ciclovia.jpg` | 35 | Ciclovías y áreas verdes | #496911872 | 1000×562 |
| `entorno-parque.jpg` | 36 | Nuevo parque urbano sobre la Autopista Central | #51286359… | 1000×667 |
| `interior-living.jpg` | 52 | Living con terraza | #261666657 | 1000×667 |

> En `entorno-parque.jpg` el último dígito queda tapado por el follaje del
> propio encuadre. Los ocho primeros son seguros; el número completo se puede
> confirmar buscando la imagen en Adobe Stock.

## Las que sí están limpias

No hace falta tocarlas. Se revisaron una por una:

- `entorno-plaza-armas.jpg` — Plaza de Armas (1458×973)
- `entorno-plaza-aerea.jpg` — Plaza de Armas desde el aire (1081×557)
- `entorno-metro.jpg` — Metro Santa Ana y Cal y Canto (862×550)
- `entorno-nocturna.jpg` — Centro de Santiago (1600×824)

También están limpios todos los renders del proyecto: fachada, edificio, lobby,
interiores (cocina, dormitorio, estar, comedor), los espacios comunes y las
19 plantas. Esos vienen de la constructora, no de un banco de imágenes.

## Cómo reconocerlos

Los ocho comps miden **exactamente 1000 píxeles de ancho**, que es el tamaño al
que Adobe Stock entrega las vistas previas gratuitas. Ninguna imagen legítima
del proyecto mide 1000 de ancho. Sirve como filtro rápido:

```sh
python3 - <<'PY'
from PIL import Image; import glob, os
for f in sorted(glob.glob('app/public/proyectos/*/*.jpg')):
    if Image.open(f).size[0] == 1000:
        print('revisar:', os.path.basename(f))
PY
```

Conviene pasarlo antes de sumar fotos nuevas a cualquier proyecto.

## Opciones para resolverlo

1. **Licenciarlas.** Comprar las ocho en Adobe Stock y reemplazar cada archivo
   por la versión sin marca de agua. Es lo más directo si las fotos gustan:
   los nombres de archivo y el código quedan igual, sólo cambia el contenido.

2. **Reemplazarlas por fotografía propia.** El entorno del proyecto es el centro
   de Santiago; son ubicaciones fotografiables sin permisos especiales, y una
   foto real del barrio vende mejor que un banco de imágenes.

3. **Quitarlas de la galería.** Es lo más rápido, pero deja el entorno con sólo
   4 fotos en vez de 11, y los interiores pierden el living.

Si se opta por quitarlas o reemplazarlas, hay que editar
`app/src/data/projects/vista-amunategui.ts` y **volver a compilar**: la carpeta
`cotizador/` es el resultado del build y no se actualiza sola.
