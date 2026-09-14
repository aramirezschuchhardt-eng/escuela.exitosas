/**
 * Edificio Vista Amunátegui — AJ Urbana.
 *
 * FUENTES (ningún dato de este archivo fue inventado):
 *  · Brochure «Vista Amunátegui» v. 28-01-2025 — contenido comercial, amenities,
 *    terminaciones, entorno, tipologías, superficies y plantas.
 *  · Planilla general de stock de AJ Urbana, hoja «Info Com» — dirección, fecha
 *    de recepción, condiciones comerciales y valor de la UF.
 *  · Planilla general, hoja «Manual de Procedimientos» — topes de bono pie,
 *    crédito directo y financiamiento.
 *
 * Las tasas hipotecarias (3,2% / 4,0% / 4,5%), los plazos del crédito y el rango
 * de devolución de IVA NO provienen de los documentos: son los escenarios de
 * simulación definidos para la herramienta y se editan en el panel administrador.
 */
import type { Project, ProjectMediaItem, TipologiaInfo } from '../../domain/types';

export const VISTA_AMUNATEGUI_ID = 'vista-amunategui';

/** Ruta de un asset del proyecto, respetando el `base` del build. */
const asset = (archivo: string): string =>
  `${import.meta.env.BASE_URL}proyectos/vista-amunategui/${archivo}`;

const GALERIA: ProjectMediaItem[] = [
  { url: asset('fachada.jpg'), grupo: 'proyecto', caption: 'Edificio Vista Amunátegui' },
  { url: asset('edificio.jpg'), grupo: 'proyecto', caption: 'Fachada del edificio' },
  { url: asset('lobby.jpg'), grupo: 'proyecto', caption: 'Acceso y recepción' },

  { url: asset('entorno-plaza-armas.jpg'), grupo: 'entorno', caption: 'Plaza de Armas' },
  { url: asset('entorno-catedral.jpg'), grupo: 'entorno', caption: 'Centro Histórico de Santiago' },
  { url: asset('entorno-institucional.jpg'), grupo: 'entorno', caption: 'Entorno institucional' },
  { url: asset('entorno-santa-lucia.jpg'), grupo: 'entorno', caption: 'Cerro Santa Lucía' },
  { url: asset('entorno-aerea.jpg'), grupo: 'entorno', caption: 'Vista aérea del sector' },
  { url: asset('entorno-barrio.jpg'), grupo: 'entorno', caption: 'Barrio en renovación' },
  { url: asset('entorno-ciclovia.jpg'), grupo: 'entorno', caption: 'Ciclovías y áreas verdes' },
  { url: asset('entorno-parque.jpg'), grupo: 'entorno', caption: 'Nuevo parque urbano sobre la Autopista Central' },
  { url: asset('entorno-plaza-aerea.jpg'), grupo: 'entorno', caption: 'Plaza de Armas desde el aire' },
  { url: asset('entorno-metro.jpg'), grupo: 'entorno', caption: 'Cercano a Metro Santa Ana y Cal y Canto' },
  { url: asset('entorno-nocturna.jpg'), grupo: 'entorno', caption: 'Centro de Santiago' },

  { url: asset('amenity-piscina.jpg'), grupo: 'amenities', caption: 'Piscina panorámica en la azotea' },
  { url: asset('amenity-quincho.jpg'), grupo: 'amenities', caption: 'Quinchos panorámicos' },
  { url: asset('amenity-gimnasio.jpg'), grupo: 'amenities', caption: 'Gimnasio equipado' },
  { url: asset('amenity-eventos.jpg'), grupo: 'amenities', caption: 'Sala de eventos comunitaria' },
  { url: asset('amenity-gourmet.jpg'), grupo: 'amenities', caption: 'Sala gourmet' },
  { url: asset('amenity-terraza.jpg'), grupo: 'amenities', caption: 'Terraza panorámica' },
  { url: asset('amenity-cowork.jpg'), grupo: 'amenities', caption: 'Sala cowork' },
  { url: asset('amenity-gourmet-2.jpg'), grupo: 'amenities', caption: 'Sala gourmet equipada' },
  { url: asset('amenity-bicicleteros.jpg'), grupo: 'amenities', caption: 'Bicicleteros comunes' },

  { url: asset('interior-cocina.jpg'), grupo: 'interiores', caption: 'Cocina integrada full electric' },
  { url: asset('interior-living.jpg'), grupo: 'interiores', caption: 'Living con terraza' },
  { url: asset('interior-dormitorio.jpg'), grupo: 'interiores', caption: 'Dormitorio' },
  { url: asset('interior-comedor.jpg'), grupo: 'interiores', caption: 'Living comedor' },
  { url: asset('interior-estar.jpg'), grupo: 'interiores', caption: 'Espacios integrados' },
];

/**
 * Los 19 modelos del brochure. El campo `modelo` corresponde a la columna
 * «Modelo» de la planilla de stock, de modo que cada unidad queda enlazada con
 * su planta. Las superficies son las del brochure ("aprox."); las de cada
 * unidad concreta vienen de la planilla y pueden diferir levemente.
 */
const m = (
  modelo: number,
  nombre: string,
  dormitorios: number,
  banos: number,
  util: number,
  terraza: number | null,
  total: number,
  orientacion: string,
  sinTerrazaPiso2: boolean,
): TipologiaInfo => ({
  nombre: `Modelo ${modelo} · ${nombre}`,
  modelo,
  pisos: '2 al 16',
  orientacion,
  dormitorios,
  banos,
  superficieUtil: util,
  superficieTerraza: terraza,
  superficieTotal: total,
  plantaUrl: asset(`planta-modelo-${modelo}.jpg`),
  nota: sinTerrazaPiso2 ? 'El piso 2 no tiene terraza.' : undefined,
});

const TIPOLOGIAS: TipologiaInfo[] = [
  m(1, '1 Dormitorio + 1 Baño', 1, 1, 35.69, 4.56, 40.25, 'Poniente', true),
  m(2, '1 Dormitorio + 1 Baño', 1, 1, 34.14, 5.1, 39.24, 'Poniente', true),
  m(3, '1 Dormitorio + 1 Baño', 1, 1, 35.49, 5.1, 40.59, 'Poniente', true),
  m(4, '1 Dormitorio + 1 Baño', 1, 1, 32.33, 5.1, 37.43, 'Poniente', true),
  m(5, '1 Dormitorio + 1 Baño', 1, 1, 31.08, 5.12, 36.2, 'Poniente', true),
  m(6, '1 Dormitorio + 1 Baño', 1, 1, 30.83, 5.1, 35.93, 'Poniente', true),
  m(7, '2 Dormitorios + 2 Baños', 2, 2, 56.18, 7.4, 63.58, 'Poniente', true),
  m(8, '2 Dormitorios + 2 Baños', 2, 2, 45.17, null, 45.17, 'Sur', false),
  m(9, '2 Dormitorios + 2 Baños', 2, 2, 44.89, null, 44.89, 'Oriente', false),
  m(10, '1 Dormitorio + 1 Baño', 1, 1, 29.24, null, 29.24, 'Oriente', false),
  m(11, 'Estudio', 0, 1, 21.97, 3.16, 25.13, 'Sur', false),
  m(12, '1 Dormitorio + 1 Baño', 1, 1, 32.58, 5.01, 37.59, 'Sur', false),
  m(13, '1 Dormitorio + 1 Baño', 1, 1, 34.81, 5.51, 40.32, 'Norte', true),
  m(14, 'Estudio', 0, 1, 21.57, 3.12, 24.69, 'Norte', false),
  m(15, '2 Dormitorios + 2 Baños', 2, 2, 53.17, 1.62, 54.79, 'Nororiente', false),
  m(16, 'Estudio', 0, 1, 22.06, 2.92, 24.98, 'Norte', true),
  m(17, 'Estudio', 0, 1, 20.99, 2.88, 23.87, 'Norte', true),
  m(18, 'Estudio', 0, 1, 20.82, 3.7, 24.52, 'Sur', false),
  m(19, 'Estudio', 0, 1, 19.77, 3.58, 23.35, 'Sur', false),
];

export function vistaAmunateguiProject(): Project {
  return {
    id: VISTA_AMUNATEGUI_ID,
    nombre: 'Edificio Vista Amunátegui',
    inmobiliaria: 'AJ Urbana',
    comuna: 'Santiago',
    direccion: 'Amunátegui 767, Santiago',
    descripcion:
      'Una inversión de alta plusvalía y demanda en el Centro Histórico de Santiago. ' +
      'Un emplazamiento único, rodeado de los tesoros más importantes de la ciudad y de ' +
      'las oficinas gubernamentales más importantes de Chile. Acá nace un concepto de ' +
      '«Barrio Dormitorio» para las oficinas del entorno, donde la oferta por espacios ' +
      'residenciales es escasa, generando una alta demanda en el sector por este tipo de ' +
      'proyectos.',
    imagenPrincipal: asset('fachada.jpg'),
    galeria: GALERIA,
    brochureUrl: null,

    entorno: [
      'Plaza de Armas',
      'Teatro Municipal',
      'Cerro Santa Lucía',
      'Biblioteca Nacional',
      'Palacio de La Moneda',
      'Congreso Nacional de Chile (sede Santiago)',
      'Cuartel general de la PDI',
      'Juzgados',
      'ChileAtiende',
      'Parque Forestal',
      'Parque Los Reyes',
      'Renovación de la Nueva Alameda: mejoras en infraestructura y espacios públicos del eje principal de Santiago',
      'Nuevo parque urbano sobre la Autopista Central: 2,1 km de áreas verdes y ciclovías',
      'Desarrollo de la Explanada de los Mercados',
    ],

    conectividad: [
      'Metro Santa Ana',
      'Metro Cal y Canto: líneas 2 y 3, más la línea 7 en construcción (conectará con Las Condes y Vitacura) y la futura línea 9',
      'Metro Plaza de Armas',
    ],

    caracteristicas: [
      'Edificio verde con certificación de energía eléctrica 100% renovable',
      'Optimizado en todos los sentidos para obtener un bajo gasto común',
      'Edificio de alta seguridad con CCTV sin puntos ciegos',
      'Modernos ascensores Heavenward - Mitsubishi',
      'Central de agua caliente ultra eficiente a gas natural',
      'Certificado por IDIEM de la Universidad de Chile',
      'Home Studio, 1 y 2 dormitorios',
    ],

    amenities: [
      'Piscina panorámica en la azotea',
      'Quinchos panorámicos',
      'Gimnasio equipado',
      'Sala gourmet',
      'Sala de eventos comunitaria',
      'Sala cowork',
      'Lavandería',
      'Áreas verdes',
      'Sala e-commerce',
      'Bicicleteros comunes',
      'Sala lavado mascotas',
      'Bodega de mudanzas',
      'Oficina property management',
      'Audio y wifi en cada amenity',
    ],

    terminaciones: [
      'Cocinas integradas full electric (incluye refrigerador apanelado no frost, encimera y horno)',
      'Cubierta de granito en cocinas',
      'Cubierta de cuarzo blanco',
      'Pisos vinílicos en los departamentos',
      'Ventanas termopanel',
      'Magnético en ventanas de departamentos de pisos 2 y 3',
      'Cerradura electrónica en cada puerta con control centralizado por tarjeta tipo hotel',
      'Cortinas roller en todos los departamentos (blackout en dormitorios), soporte para TV y luminarias',
      'Enchufe de fuerza en cada recinto para estufa eléctrica',
      'Opción para instalar lavadora en todos los departamentos',
    ],

    beneficios: [
      'Arquitectura pensada para que el flujo de usuarios externos no se mezcle con los propietarios del edificio habitacional',
      'Ascensor de parking entre los subterráneos y el piso 1, exclusivo para usuarios externos',
      'Oficina para administración de parking independiente con control de CCTV',
      'Estacionamientos pensados para la electromovilidad futura (bandejas y espacio asegurado en sala eléctrica)',
      'Fórmula extra de rentabilidad a través de sus estacionamientos',
      'Asesoría integral',
      'Compra protegida',
      'Flexibilidad comercial',
    ],

    condicionesComerciales: [
      'Entrega inmediata. Venta libre.',
      'Arriendo garantizado tipo XL: 2 años estándar, hasta 4 años en eventos de promoción.',
      'Alternativa de bono amoblamiento en lugar del arriendo garantizado.',
      'Crédito directo inmobiliario (Fundit) del 5% al 10% del valor, hasta 60 cuotas sin interés.',
      'Bono pie de hasta 10%.',
      'Aporte inmobiliario de hasta 15% del pie (10% en estudios y 1D+1B; 15% en 2D+2B).',
      'Pie a financiar por el cliente: 10%.',
      'Fondo de puesta en marcha: 10 UF por departamento y 1,5 UF por estacionamiento.',
      'Reserva: $100.000, recaudada por el broker y devuelta al cliente al promesar o desistir.',
      'Las unidades 2D+2B deben adquirirse con estacionamiento.',
      'Piloto disponible: unidades 303 y 307 (Estudio / 1D+1B).',
    ],

    fichaTecnica: [
      { label: 'Inmobiliaria', value: 'AJ Urbana' },
      { label: 'Dirección', value: 'Amunátegui 767, Santiago' },
      { label: 'Pisos', value: '16' },
      { label: 'Departamentos en la planilla', value: '119' },
      { label: 'Estacionamientos', value: '95' },
      { label: 'Bodegas', value: '10' },
      { label: 'Recepción municipal', value: 'Octubre de 2025' },
      { label: 'Entrega', value: 'Inmediata' },
      { label: 'Piloto', value: 'Sí — unidades 303 y 307' },
      { label: 'Tipologías', value: 'Estudio · 1D+1B · 2D+2B (19 modelos)' },
      { label: 'Fuente del brochure', value: 'Catálogo v. 28-01-2025' },
    ],

    tipologias: TIPOLOGIAS,

    config: {
      // Manual de procedimientos AJ Urbana: "Bono Pie MAX 10%".
      bonoPie: { enabled: true, minPct: 0, maxPct: 0.1, defaultPct: 0 },
      // El encargo define 90% y 80%. El manual documenta un rango de 70% a 90%:
      // el 70% puede agregarse desde el panel administrador si se necesita.
      financiamiento: [0.9, 0.8],
      financiamientoDefault: 0.9,
      // Info Com: "Pie a financiar por cliente: 10%".
      pieDirectoPct: 0.1,
      creditoDirecto: {
        enabled: true,
        // Manual: "Fundit 5% a 10%". Info Com: 60 cuotas sin interés.
        minPct: 0.05,
        maxPct: 0.1,
        defaultPct: 0.1,
        plazos: [12, 24, 36, 48, 60],
        defaultPlazo: 60,
        tasaAnual: 0,
      },
      // Escenarios de simulación definidos para la herramienta, no del brochure.
      tasas: [0.032, 0.04, 0.045],
      plazosAnios: [15, 20, 25, 30],
      plazoDefaultAnios: 30,
      convencionTasa: 'efectivaAnual',
      iva: {
        enabled: true,
        minPct: 0.1,
        maxPct: 0.15,
        defaultPct: 0.1,
        base: 'precioConDescuento',
        aplicarAlFinanciamiento: false,
      },
      // Sin monto de arriendo documentado: el broker lo ingresa en cada cotización.
      arriendo: { minCLP: 300_000, maxCLP: 500_000, stepCLP: 10_000, defaultCLP: null },
    },

    publicado: true,
    updatedAt: '2026-09-14T00:00:00.000Z',
  };
}
