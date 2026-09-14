/* ───────────────────────────────────────────────────────────────────
   MANIFIESTO DE IMÁGENES · Manual de Broker · Avance Inmobiliario

   Cada lámina pide su fotografía por NOMBRE, nunca por URL.
   Para cambiar una foto, reemplaza aquí el valor y listo: la
   presentación completa se actualiza sola.

   · Las rutas "img/proyecto/…" son fotografías y renders reales del
     proyecto Edificio Vista Amunátegui que ya viven en este repositorio.
   · Las rutas remotas son fotografías generadas para esta presentación.
     Si prefieres usar fotos propias, descárgalas a img/escena/ y cambia
     la URL por la ruta local. No hace falta tocar nada más.
   ─────────────────────────────────────────────────────────────────── */

const CDN = 'https://cdn.gamma.app/jvr5bu31s9cibm4/design-anything';

export const IMG = {
  /* ── Personas, escenas y momentos comerciales ── */
  portada:            `${CDN}/5WXCi07kJ39eyyVaQrYL9/lExff8H_s45LteJeaEsD_.jpg`,
  brokerTrabajando:   `${CDN}/qbkoRRmpw1vGIfn8mq4NJ/zNoe3nAhNPtRuG_UccshN.jpg`,
  reunionClientes:    `${CDN}/LF8Nx4mB5N20DYWSc1Lhc/oAizDQQogi6AAO2RortUw.jpg`,
  mostrandoDepto:     `${CDN}/rC9jwiQts7bY0ORfg0LZz/6NeKJT2FReU0-ylmaWjjT.jpg`,
  casaUsada:          `${CDN}/XcRKxasPIAVcuXkjXyu1g/5e6YA3OeaUbqmDxAXjwxA.jpg`,
  visitaUsada:        `${CDN}/97qNyNKwuMNLOB9siqWCy/RzHFFDe3Dkjcz4YtT3_eo.jpg`,
  captacionDueno:     `${CDN}/fT48u4BSyu4U4HXjkvm51/E4xZsPPrKbSRHF1PYjfzZ.jpg`,
  llaves:             `${CDN}/BISGtcGau434ESKmkwHw2/AUjRYHNhm31ssyWEVzc_Q.jpg`,
  primeraVivienda:    `${CDN}/qW5wVjbkMvkk3Oj0qXdAr/5A1SVUArq0aJqeUawGQyT.jpg`,
  inversionista:      `${CDN}/epFIR3eKpwhXvRXMTfpS4/vM6XzFuEomj87RWruvSho.jpg`,
  tecnologia:         `${CDN}/gkk38Bol25bSuHNraeNSD/kg-9IMPkc_4zbdfpiyjci.jpg`,
  equipo:             `${CDN}/LKnAAi6uNxWXm3IpnmcUk/kQVZDKrIcITPNk6vyLL0G.jpg`,
  exito:              `${CDN}/vPt1huvbqpHoEsLla0at9/35ynldf3UtssWAG4XXHtO.jpg`,
  clienteDuda:        `${CDN}/0lKCy6muH5UpJbr9abuRs/5tesIfkOcB56G1UOWaC7M.jpg`,
  firma:              `${CDN}/SUh0bxgUtcFB6ccES3YAA/2X3LiMv1_pRjdIfnsyuM1.jpg`,
  captacionDigital:   `${CDN}/1LkOxsIil0wrr4nbl2QT3/sau72yTtNOO_Isfo9YnFL.jpg`,
  videollamada:       `${CDN}/1zQYWDSGFlN6hp4ufQl5r/EQMfzeQT-5pQG_VUTxx0T.jpg`,
  construccion:       `${CDN}/DFngcL9n1QDxGRAjMhXs7/8Kls13ktsHXcFljkxnP8b.jpg`,
  apretonManos:       `${CDN}/H69pVdhU3lZSG72JF2gKA/DZfyRLyg18Vbs8X6c9sta.jpg`,
  roleplay:           `${CDN}/6QmJdzT5BG3jePzmSvhSp/E8UxFjlX2LYYuYtatJM1f.jpg`,

  /* ── Producto real: Edificio Vista Amunátegui ── */
  fachada:      'img/proyecto/fachada.jpg',
  edificio:     'img/proyecto/edificio.jpg',
  lobby:        'img/proyecto/lobby.jpg',
  cocina:       'img/proyecto/interior-cocina.jpg',
  dormitorio:   'img/proyecto/interior-dormitorio.jpg',
  estar:        'img/proyecto/interior-estar.jpg',
  comedor:      'img/proyecto/interior-comedor.jpg',
  piscina:      'img/proyecto/amenity-piscina.jpg',
  terraza:      'img/proyecto/amenity-terraza.jpg',
  gimnasio:     'img/proyecto/amenity-gimnasio.jpg',
  cowork:       'img/proyecto/amenity-cowork.jpg',
  gourmet:      'img/proyecto/amenity-gourmet.jpg',
  planta:       'img/proyecto/planta-modelo-3.jpg',
  barrioNoche:  'img/proyecto/entorno-nocturna.jpg',
  metro:        'img/proyecto/entorno-metro.jpg',

  /* ── Marca ── */
  logo: 'img/marca/avance-inmobiliario.png',
};
