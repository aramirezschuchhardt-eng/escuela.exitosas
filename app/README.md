# Cotizador Inmobiliario

Aplicación web para que brokers inmobiliarios muestren un catálogo de proyectos y
coticen una unidad frente al cliente: precio, descuento, bono pie, estructura de
financiamiento, crédito directo inmobiliario, dividendo hipotecario, arriendo
mensual estimado, flujo y devolución de IVA.

Está construida como **aplicación de una sola página**, pensada para usarse desde
computador y celular, y preparada para incorporar nuevos proyectos sin tocar el
código.

---

## Datos cargados

La aplicación viene con el **Edificio Vista Amunátegui (AJ Urbana)** completo:

| | |
|---|---|
| Stock | **119 unidades** (20 disponibles, 99 bloqueadas) |
| Precios | Lista, descuento base, precio con descuento, estacionamiento/bodega, precio negocio final y precio con aporte inmobiliario |
| Tipologías | **19 modelos** con superficies y planta, enlazados a cada unidad por su número de modelo |
| Fotografías | 28 imágenes del brochure (proyecto, entorno, amenities, interiores) |
| Contenido | Entorno, conectividad, características, amenities, terminaciones, beneficios, ficha técnica y condiciones comerciales |
| Valor UF | 40.901,94 — el de la planilla general; se actualiza en el panel |

### Procedencia de cada dato

Ningún valor fue inventado. Las fuentes son:

- **Planilla general de stock de AJ Urbana**
  - Hoja `Vista Amunategui (EI)` → las 119 unidades con todos sus precios y estados.
  - Hoja `Info Com` → dirección, fecha de recepción, valor de la UF, aporte
    inmobiliario, pie del cliente, cuotas y arriendo garantizado.
  - Hoja `Manual de Procedimientos` → tope de bono pie (10%), rango del crédito
    directo Fundit (5% a 10%), fondo de puesta en marcha y monto de reserva.
- **Brochure «Vista Amunátegui» v. 28-01-2025** → descripción, entorno,
  conectividad, características, amenities, terminaciones, beneficios, las 19
  tipologías con sus superficies y las plantas.

Lo único que **no** proviene de los documentos, porque no está en ellos, son los
escenarios de simulación: las tres tasas hipotecarias (3,2% / 4,0% / 4,5%), los
plazos del crédito, el rango de devolución de IVA (10% a 15%) y el rango de
arriendo mensual estimado ($300.000 a $500.000). Todos se editan en el panel
administrador.

### Dos cosas para confirmar

1. **La dirección.** La planilla general (`Info Com → Dirección`) dice
   **Amunátegui 767**, el manual de procedimientos nombra la sociedad «Edificio
   Amunátegui 745» con correo `amunategui767@gmail.com`, y el plano de ubicación
   del brochure rotula «amunátegui · 745». Sin embargo, el pie de página del
   brochure repite «santa isabel 4897, Santiago», que corresponde a otro
   proyecto. Se cargó **Amunátegui 767, Santiago**, que es lo que indica la
   planilla operativa. Es editable en el panel.
2. **El arriendo garantizado.** La planilla documenta arriendo garantizado tipo
   XL (2 años, hasta 4 en promociones), pero **no documenta el monto**. Por eso
   el cotizador mantiene el campo como «arriendo mensual estimado», editable por
   el broker, y el arriendo garantizado aparece sólo como condición comercial.

### Actualizar el stock

El stock cargado es el punto de partida, no la fuente permanente. Para
actualizarlo: **Administrar → Importar stock**, subir la planilla, revisar el
mapeo de columnas y confirmar la vista previa. Los datos comerciales que no
vienen de la planilla se conservan.

También se puede regenerar la semilla desde la planilla original:

```bash
node scripts/importar-amunategui.mjs <ruta-planilla.xlsx>
```

El script verifica las identidades de la planilla antes de escribir
(`precio con descuento = lista × (1 − dcto)`,
`negocio final = con descuento + adicionales`, `total = útil + terraza`) y avisa
si alguna no calza. En la planilla entregada, las 119 filas las cumplen.

### Cómo se prepararon las imágenes

Las fotografías y plantas se extrajeron del brochure PDF, se redimensionaron y
se guardaron en `public/proyectos/vista-amunategui/`. Para un proyecto nuevo, lo
habitual es subirlas desde **Administrar → Proyectos → Editar**, que hace el
redimensionado automáticamente.

---

## Puesta en marcha

```bash
cd app
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run test         # 86 pruebas del motor de cálculo y de la importación
npm run build        # build de producción → /cotizador
npm run preview      # sirve el build en http://localhost:4173
```

Prueba end-to-end en navegador real (requiere el build servido):

```bash
npm run build && npm run preview &
npm run e2e:fixture   # genera una planilla de prueba
npm run e2e           # recorre catálogo → stock → cotizador → cotización
```

---

## Despliegue

`npm run build` emite el sitio estático en **`/cotizador`** en la raíz del
repositorio. Con GitHub Pages sirviendo la rama `main` desde la raíz, la
aplicación queda publicada en `https://<sitio>/cotizador/`, sin interferir con la
landing de Escuela Exitosas que vive en `index.html`.

La configuración usa `base: './'` y enrutamiento por *hash*, de modo que el mismo
build funciona en la raíz de un dominio o en cualquier subdirectorio, y en
cualquier hosting estático (GitHub Pages, Netlify, Vercel, S3) sin reglas de
reescritura en el servidor.

---

## Arquitectura

```
src/
├── domain/                  Núcleo de negocio. Sin React, sin almacenamiento.
│   ├── types.ts             Modelo de datos
│   ├── finance.ts           ★ Motor de cálculo (funciones puras)
│   ├── finance.test.ts        50 pruebas del motor
│   ├── units.ts             Normalización de estados, tipologías, superficies
│   ├── filters.ts           Filtros de catálogo y estadísticas por proyecto
│   ├── money.ts             Formateo — único lugar donde se redondea
│   └── defaults.ts          Condiciones comerciales por defecto
│
├── data/                    Persistencia e ingesta
│   ├── repository.ts        ★ Puerto de persistencia (hoy localStorage)
│   ├── seed.ts              Semilla del proyecto inicial
│   ├── projects/            Datos de Vista Amunátegui (proyecto y 119 unidades)
│   ├── store.tsx            Contexto de React sobre el repositorio
│   └── excel/
│       ├── parse.ts         Lectura de .xlsx/.csv y conversión de celdas
│       ├── mapping.ts       Reconocimiento de encabezados
│       ├── diff.ts          Vista previa y aplicación de la importación
│       └── excel.test.ts      36 pruebas de la importación
│
├── components/              Kit de interfaz y panel de filtros
├── features/                Pantallas: catálogo, ficha, cotizador, cotización, admin
├── lib/                     Links compartibles e imágenes
└── styles/globals.css       Sistema de diseño (tokens, responsive, impresión)
```

### Dónde tocar para crecer

| Necesidad | Punto de cambio |
|---|---|
| Backend en vez del navegador | Implementar `Repository` en `data/repository.ts` y cambiar la instancia exportada. Ningún componente se modifica. |
| Nuevo proyecto | Panel administrador. No requiere código. |
| Otro formato de planilla | Agregar alias en `data/excel/mapping.ts`. |
| Nueva regla financiera | `domain/finance.ts` + su prueba. |
| Marca y colores | Panel administrador → Configuración. |

---

## Reglas de cálculo

Todo el cálculo vive en `domain/finance.ts`, en funciones puras y con pruebas.
Los montos de propiedad se manejan en **UF** (la unidad de la planilla) y los
montos mensuales se expresan en **pesos** usando el valor de UF configurado.

**Precio y descuento** — sin doble descuento. Si la planilla trae el precio final,
ese valor manda y el descuento se deriva por diferencia; si además viene un
porcentaje o monto declarado que no calza, se muestra una advertencia. Si no hay
precio final, se aplica **una sola vez** el monto (si existe) o el porcentaje.

**Bono pie** — `precio considerado × %`. Reduce el pie requerido pero **no** forma
parte del aporte efectivo del cliente. Configurable por proyecto y por unidad; un
proyecto puede no tenerlo.

**Adicionales y base de cotización** — cuando la planilla asigna estacionamiento
o bodega a una unidad, el cotizador muestra
`precio del depto con descuento + adicionales = precio negocio final` y permite
elegir sobre cuál de los precios de la planilla se cotiza: el del departamento,
el negocio final (sugerido cuando hay adicionales) o el precio con aporte
inmobiliario. La elección define el monto financiado, el pie y el dividendo.

**Financiamiento** — `pie total = precio × (1 − LTV)`, `crédito = precio × LTV`.

**Crédito directo inmobiliario** — acotado al menor entre el tope del proyecto y
el pie total, y con un mínimo configurable cuando se usa (5% en Vista
Amunátegui). Cuota por anualidad; con tasa 0% equivale a `monto ÷ cuotas`.

**Aporte efectivo** — `pie total − crédito directo − bono pie`, nunca negativo
(si lo fuera, se avisa).

**Dividendo** — cuota fija del sistema francés:

```
cuota = P · i / (1 − (1 + i)^(−n))
```

La conversión de tasa anual a mensual es **configurable por proyecto**: efectiva
anual `(1+i)^(1/12)−1` (por defecto, convención habitual en Chile) o nominal
anual `i/12`. Las tres tasas se calculan simultáneamente. No incluye seguros ni
gastos operacionales, y así se declara en pantalla.

**Desembolso mensual** — dos etapas explícitas: `dividendo + cuota crédito
directo` durante la vigencia del crédito directo, y sólo `dividendo` después.

**Arriendo y flujo** — el arriendo es siempre editable por el broker y nunca
proviene de la planilla. Rentabilidad bruta anual = `arriendo anual / precio con
descuento`. Flujo = `arriendo − desembolso`, en ambas etapas.

**Devolución de IVA** — se presenta como beneficio estimado aparte. **No** se
descuenta del precio ni del monto financiado, salvo que el proyecto esté
configurado explícitamente para hacerlo.

---

## Importación de Excel

El archivo se procesa **en el navegador**; no se envía a ningún servidor.

- Detecta la fila de encabezados aunque la planilla tenga títulos o logos arriba.
- Reconoce los encabezados habituales y permite corregir el mapeo a mano.
- Interpreta formatos chilenos y anglosajones: `2.345,67`, `2,345.67`, `UF 3.450`,
  `$ 1.234`, `45,5 m²`, `5%`, `(150)`.
- Normaliza los estados a DISPONIBLE / BLOQUEADA / RESERVADA / VENDIDA,
  conservando siempre el texto original de la planilla.
- Conserva las columnas no mapeadas junto a la unidad.
- Preserva los datos comerciales que no vienen de la planilla (por ejemplo, el
  bono pie propio de una unidad).
- Encuentra la fila de encabezados aunque la planilla traiga títulos, enlaces y
  notas sueltas antes de la tabla: puntúa cada fila por cuántos encabezados
  reconoce en ella.
- Lee los .csv en UTF-8 (con respaldo a Windows-1252), de modo que las tildes no
  se rompen en archivos exportados desde Google Sheets.
- Muestra una **vista previa** con el detalle de nuevas / actualizadas / cambios
  de estado / sin cambios / no importables, y el destino de las unidades del
  stock que no aparecen en la planilla. Nada se modifica hasta confirmar.

Sólo las unidades **DISPONIBLE** y con precio pueden cotizarse.

---

## Limitaciones conocidas de esta versión

- **Los datos viven en el navegador** (`localStorage`). No se comparten entre
  equipos ni entre usuarios. Hay exportación e importación de respaldo en
  Configuración. El reemplazo por un backend está previsto en la interfaz
  `Repository`.
- **La clave del panel no es autenticación real**: sólo oculta el panel en el
  navegador. Los usuarios, roles y permisos corresponden a la etapa con backend.
- **El PDF se genera con la impresión del navegador** («Guardar como PDF»). El
  documento tiene estilos de impresión propios para tamaño carta/A4.
- **El link compartido** codifica los parámetros de la cotización, pero el
  destinatario necesita tener el stock cargado en su navegador para reconstruirla.
  El link universal requiere backend.
- **El valor de la UF es un parámetro manual** del administrador; no se consulta
  ningún servicio externo.

## Fuera de alcance en esta versión

Conforme al encargo, quedan preparados en la arquitectura pero **no**
desarrollados: CRM, leads, seguimiento de cotizaciones, comisiones, comparador de
proyectos, integración con WhatsApp Business, analytics y dashboard comercial.
