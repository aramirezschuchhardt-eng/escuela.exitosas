# Encuesta La Ruta Inmobiliaria · Expo

Encuesta para el stand de la Expo: la persona responde en la tablet, sus datos
quedan **guardados en la base de datos** y salen **automáticamente por correo a
`Alison@avanceinmobiliario.cl`** apenas presiona **«¡YA ESTÁS PARTICIPANDO!»**.

La interfaz usa los **colores de Agricultura** (el rojo de su isotipo «a»); el
logotipo de **La Ruta Inmobiliaria** va arriba a la izquierda en su versión
blanca, y **Agricultura** y **Agricultura TV** acompañan como marcas asociadas
en todas las pantallas.

---

## Cómo se ve y cómo funciona

| Pantalla | Qué hace |
|---|---|
| Bienvenida | Invita a responder; un solo botón grande para empezar. |
| Paso 1 · Tus datos | Nombre, apellido, teléfono, correo y comuna (con sugerencias). |
| Paso 2 · En la radio | 🎙️ ¿Qué le gustaría escuchar? Selección múltiple. |
| Paso 3 · Tu visita | 🏢 ¿Por qué vino a la Expo? Selección múltiple. |
| Paso 4 · Listo | Autorización de comunicaciones, resumen y botón «¡YA ESTÁS PARTICIPANDO!». |
| Confirmación | «¡GRACIAS POR PARTICIPAR! 🎉», «Tus respuestas fueron registradas correctamente» y «¡Ya estás participando!». Vuelve sola al inicio a los 20 segundos. |
| Panel `/#/admin` | Estadísticas en vivo, listado de participantes, estado de cada correo, reenvío manual y exportación a Excel. |

Todo está pensado para **pantalla táctil**: botones de 64 px de alto,
alternativas de 74 px, teclados correctos por campo (teléfono, correo), nada que
dependa del mouse y sin gestos finos.

---

## Puesta en marcha

```bash
cd app-encuesta
npm install
cp .env.example .env     # completar con las credenciales del correo
npm run build            # compila la aplicación en dist/
npm start                # servidor en http://localhost:8787
```

Durante el desarrollo:

```bash
npm run dev              # Vite + API con recarga automática
```

| Script | Para qué |
|---|---|
| `npm run build` | Revisa tipos y compila el cliente. |
| `npm start` | Levanta la API y publica `dist/`. |
| `npm test` | Pruebas de validación, del correo y de la exportación. |
| `npm run e2e` | Prueba de humo: guarda una respuesta y revisa el correo y el panel. |
| `npm run capturas` | Recorre la encuesta y deja una captura de cada pantalla. |
| `npm run lint` | oxlint. |

---

## Envío de correo (seguro)

**En el navegador no hay ninguna credencial ni la dirección de destino**: el
front sólo llama a `POST /api/respuestas` de nuestro propio servidor, y es el
servidor el que envía el correo con lo que tenga en las variables de entorno.

Hay tres transportes; se elige con `ENCUESTA_TRANSPORTE_CORREO` o se detecta
solo:

| Transporte | Cuándo usarlo | Variables |
|---|---|---|
| `resend` | Servicio transaccional (recomendado, sale por HTTPS). | `RESEND_API_KEY` |
| `smtp` | Correo propio: Google Workspace, Zoho, Office 365, hosting. | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` |
| `registro` | Desarrollo: el correo se escribe en la consola y no se envía. | — |

El destino se configura en `ENCUESTA_CORREO_DESTINO` y viene fijado en
`Alison@avanceinmobiliario.cl`. Todas las variables están documentadas en
[`.env.example`](.env.example); `.env` no se versiona.

### Formato del correo

Asunto: **Nuevo participante — Encuesta La Ruta Inmobiliaria Expo**

```
👤 DATOS DEL PARTICIPANTE      Nombre / Apellido / Teléfono / Correo / Comuna
🎙️ ¿QUÉ LE GUSTARÍA ESCUCHAR EN LA RADIO?   ☑ cada alternativa marcada
🏢 ¿POR QUÉ VINO A LA EXPO?                 ☑ cada alternativa marcada
📅 DATOS DEL REGISTRO          Fecha / Hora / Origen / Autorización (Sí o No)
```

Se envía en texto plano y en HTML con los colores de la marca. Fecha y hora
siempre en horario de Chile. Si alguien responde el correo, la respuesta llega
al participante.

---

## Nada se pierde

El requisito es explícito y la arquitectura lo respeta en tres niveles:

1. **Primero se guarda.** `POST /api/respuestas` valida, escribe en SQLite y
   recién entonces contesta. La confirmación que ve la persona significa que el
   dato ya está guardado.
2. **El correo va después y en segundo plano.** Si falla, se reintenta cuatro
   veces con espera creciente; si aun así no sale, queda anotado como
   `fallida` en la tabla `entregas` y un barrido periódico lo reintenta. La
   persona **nunca ve un error técnico**, y el panel muestra el estado real de
   cada envío con un botón para reenviar.
3. **Si ni siquiera hay conexión** con el servidor (wifi de la Expo), la
   respuesta se guarda en el navegador y se reenvía sola al recuperar la red.

---

## Panel administrativo

En `/#/admin`, protegido con `ENCUESTA_TOKEN_ADMIN` (si se deja vacío, sólo se
puede abrir desde el mismo computador del servidor). Muestra participantes del
día, autorizaciones, ranking de temas de radio, motivos de visita y comunas,
estado de cada correo, reenvío manual y **exportación a CSV** que Excel abre
directamente.

---

## Identidad visual

Los colores están definidos **en un solo lugar**:

- [`src/estilos/marca.css`](src/estilos/marca.css) — variables CSS que usan
  fondo, botones, tarjetas, títulos, barra de progreso, estados seleccionados,
  bienvenida, confirmación y panel.
- [`src/compartido/marca.ts`](src/compartido/marca.ts) — los mismos valores para
  el correo HTML.

| | |
|---|---|
| Rojo Agricultura | `#E23A42` — botones, estados seleccionados y acentos |
| Rojo vivo | `#F4616A` |
| Rojo oscuro | `#B3212A` |
| Granate | `#6F0F15` — fondo y títulos |
| Granate profundo | `#4D0A0F` |
| Rosa | `#F7CCD0` — bordes y superficies suaves |
| Rosa suave | `#FDEFF0` — alternativa seleccionada |
| Azul La Ruta Inmobiliaria | `#1F4289` — su logotipo circular sobre fondo claro |

Logotipos en [`public/marca/`](public/marca): `la-ruta-inmobiliaria.svg` (versión
blanca para fondo de color), `la-ruta-inmobiliaria-circulo.svg` (versión azul
para fondo claro), `agricultura.svg` y `agricultura-tv.svg`.

> **Pendiente de la marca:** los logotipos se redibujaron en SVG a partir de las
> imágenes entregadas por el cliente y los colores se tomaron a ojo de esas
> mismas imágenes, no de un manual. Al recibir los archivos vectoriales
> oficiales: reemplazar los SVG de `public/marca/` (mismos nombres) y ajustar
> los códigos en los dos archivos de arriba. No hay colores sueltos en ningún
> componente, así que no se toca nada más.

---

## Vista previa pública

Para revisar la encuesta desde cualquier navegador, sin servidor detrás:

```bash
npm run build:demo
```

Deja el sitio compilado en la carpeta `encuesta/` de la raíz del repositorio,
que GitHub Pages publica junto a la landing y el cotizador:

<https://aramirezschuchhardt-eng.github.io/escuela.exitosas/encuesta/>

En este modo (`VITE_VISTA_PREVIA=1`) la aplicación **no guarda ni envía nada** y
muestra un aviso permanente que lo advierte, para que no se confunda con la
encuesta real. Para la Expo se usa el build normal (`npm run build`) con el
servidor, que es el que guarda y envía los correos.

---

## Integraciones futuras

Cada destino de una respuesta es una **integración** que implementa el contrato
de [`server/integraciones/tipos.ts`](server/integraciones/tipos.ts) y se agrega a
la lista de [`server/integraciones/registro.ts`](server/integraciones/registro.ts).
El despachador se encarga de reintentos, registro de estado y reenvíos.

Ya vienen dos:

- **`correo`** — obligatoria, la del requerimiento.
- **`webhook`** — opcional: publica la respuesta como JSON en la URL de
  `ENCUESTA_WEBHOOK_URL`. Con eso se conecta hoy mismo Zapier, Make o n8n hacia
  **Google Sheets, un CRM, WhatsApp o email marketing** sin tocar el código.

Para una integración nativa (por ejemplo la API de Google Sheets) se escribe un
archivo nuevo en `server/integraciones/` y se suma a la lista: el resto —
guardado, reintentos, panel y estadísticas — ya está resuelto.

---

## Preguntas de la encuesta

Están en [`src/compartido/definicion.ts`](src/compartido/definicion.ts), que es
la única fuente de verdad: formulario, correo, panel y estadísticas leen de ahí.
Para agregar o cambiar una alternativa basta con editar ese archivo
(conservando los `id`, que son los que quedan guardados).

---

## Estructura

```
app-encuesta/
├─ src/
│  ├─ compartido/   definición de la encuesta, tipos, validación, fechas, marca
│  ├─ componentes/  encabezado con las dos marcas, barra de progreso, campos
│  ├─ pantallas/    bienvenida, pasos y confirmación
│  ├─ admin/        panel administrativo
│  ├─ estilos/      marca.css (colores) y globales.css
│  └─ lib/          cliente de la API y cola local de respaldo
├─ server/
│  ├─ index.ts      API + publicación del build
│  ├─ db.ts         SQLite: respuestas y entregas
│  ├─ correo/       plantilla del correo y transportes (Resend / SMTP)
│  ├─ integraciones/ contrato, correo, webhook y despachador con reintentos
│  └─ exportar.ts   CSV para Excel
└─ e2e/             prueba de humo y capturas de pantalla
```

## API

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/respuestas` | Guarda una respuesta y dispara las integraciones. |
| `GET` | `/api/salud` | Estado del servidor, total de respuestas y transporte de correo. |
| `GET` | `/api/admin/respuestas` | Listado con el estado de cada entrega. |
| `GET` | `/api/admin/estadisticas` | Métricas en vivo del panel. |
| `GET` | `/api/admin/exportar.csv` | Exportación para Excel. |
| `POST` | `/api/admin/reenviar` | Reintenta el correo de una respuesta. |
| `POST` | `/api/admin/reintentar-pendientes` | Reintenta todas las entregas pendientes. |

Las rutas `/api/admin/*` exigen el encabezado `x-token-admin` (o `?token=`).
