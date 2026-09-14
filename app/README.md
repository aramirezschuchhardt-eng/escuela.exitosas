# Cotizador Inmobiliario

Aplicación web para que brokers inmobiliarios muestren un catálogo de proyectos y
coticen una unidad frente al cliente: precio, descuento, bono pie, estructura de
financiamiento, crédito directo inmobiliario, dividendo hipotecario, arriendo
mensual estimado, flujo y devolución de IVA.

Está construida como **aplicación de una sola página**, pensada para usarse desde
computador y celular, y preparada para incorporar nuevos proyectos sin tocar el
código.

---

## Estado de los datos

> **Importante.** Los archivos fuente mencionados en el encargo — la planilla
> Excel de stock y el brochure PDF del Edificio Vista Amunátegui — **no estaban
> disponibles** al construir esta versión.
>
> Siguiendo la regla de no inventar información, la semilla del proyecto contiene
> únicamente los datos enunciados de forma explícita: nombre, dirección
> (Santa Isabel 4897, Santiago), comuna, los hitos de conectividad nombrados
> (Metro Santa Ana, Metro Cal y Canto, Plaza de Armas) y las tres tipologías
> (Estudio, 1D+1B, 2D+2B).
>
> **No hay stock, precios, descuentos, superficies, imágenes ni amenities
> cargados.** La interfaz marca esos campos como «pendiente de carga» en lugar de
> rellenarlos con supuestos. Se cargan por las dos vías previstas en el encargo:
> la planilla Excel (stock) y el panel administrador (información comercial del
> brochure).

### Cómo cargar los datos reales

1. Abrir **Administrar** (clave inicial: `admin`).
2. **Configuración** → registrar el valor de la UF, el nombre de la empresa y el logo.
3. **Importar stock** → subir la planilla Excel, revisar el mapeo de columnas y
   confirmar la vista previa.
4. **Proyectos → Editar** → cargar del brochure: imágenes, entorno, conectividad,
   características, amenities, terminaciones, beneficios, tipologías y plantas.
5. **Condiciones comerciales** → ajustar bono pie, financiamiento, crédito
   directo, tasas, plazos, devolución de IVA y rango de arriendo.

---

## Puesta en marcha

```bash
cd app
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run test         # 71 pruebas del motor de cálculo y de la importación
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
│   ├── finance.test.ts        36 pruebas del motor
│   ├── units.ts             Normalización de estados, tipologías, superficies
│   ├── filters.ts           Filtros de catálogo y estadísticas por proyecto
│   ├── money.ts             Formateo — único lugar donde se redondea
│   └── defaults.ts          Condiciones comerciales por defecto
│
├── data/                    Persistencia e ingesta
│   ├── repository.ts        ★ Puerto de persistencia (hoy localStorage)
│   ├── seed.ts              Semilla del proyecto inicial
│   ├── store.tsx            Contexto de React sobre el repositorio
│   └── excel/
│       ├── parse.ts         Lectura de .xlsx/.csv y conversión de celdas
│       ├── mapping.ts       Reconocimiento de encabezados
│       ├── diff.ts          Vista previa y aplicación de la importación
│       └── excel.test.ts      35 pruebas de la importación
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

**Financiamiento** — `pie total = precio × (1 − LTV)`, `crédito = precio × LTV`.

**Crédito directo inmobiliario** — acotado al menor entre el tope del proyecto y
el pie total. Cuota por anualidad; con tasa 0% equivale a `monto ÷ cuotas`.

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
