import { IMG } from './imagenes.js';
import { ico, pie, fondo, check, tarjeta, tarjetaFoto, celda } from './piezas.js';

/* ═══════════════════════════════════════════════════════════════
   EL GUION · una entrada por lámina
   { titulo, mini, html }
   ═══════════════════════════════════════════════════════════════ */

export const LAMINAS = [

/* ── 01 · PORTADA ─────────────────────────────────────────── */
{
  titulo: 'Portada', mini: IMG.portada, oscura: true,
  html: `
    ${fondo(IMG.portada, 'izq')}
    <div class="cuerpo centro" style="max-width:720px">
      <div class="placa-marca" style="margin-bottom:42px" data-anima="1">
        <img src="${IMG.logo}" alt="Avance Inmobiliario">
      </div>
      <span class="rotulo claro" data-anima="2" style="display:block;margin-bottom:20px">Escuela de Brokers · Formación inicial</span>
      <h1 class="titular-xl" data-anima="3" style="margin-bottom:26px">
        De cero a tu<br>primera <span style="color:var(--naranja-claro)">venta</span>
      </h1>
      <p class="bajada" data-anima="4" style="font-size:20px;max-width:44ch">
        Todo lo que necesitas saber para vender propiedades nuevas y usadas
        con seguridad, método y respaldo.
      </p>
      <div style="display:flex;gap:10px;margin-top:38px" data-anima="5">
        <span class="pildora contorno-claro">Propiedades nuevas</span>
        <span class="pildora contorno-claro">Propiedades usadas</span>
        <span class="pildora contorno-claro">Captación</span>
        <span class="pildora contorno-claro">Cierre</span>
      </div>
    </div>`
},

/* ── 02 · FRASE POTENTE ───────────────────────────────────── */
{
  titulo: 'No vendes metros cuadrados', mini: IMG.llaves, oscura: true,
  html: `
    ${fondo(IMG.llaves, 'total')}
    <div class="cuerpo centro" style="align-items:center;text-align:center">
      <h2 class="editorial" data-anima="1"
          style="font-size:62px;line-height:1.12;max-width:19ch;color:#fff">
        No vendes metros cuadrados.<br>
        Vendes <span style="color:var(--naranja-claro);font-style:normal;font-family:var(--display);font-weight:800">la decisión</span>
        más importante de la vida de alguien.
      </h2>
      <div data-anima="2" style="width:56px;height:3px;background:var(--naranja);margin-top:38px;border-radius:2px"></div>
    </div>
    ${pie('01 · Bienvenida')}`
},

/* ── 03 · RUTA DE HOY ─────────────────────────────────────── */
{
  titulo: 'La ruta de hoy', mini: IMG.equipo,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Tu formación</span>
        <h2 class="titular">La ruta de hoy</h2>
        <p class="bajada">Seis bloques. Al final de cada uno vas a saber exactamente qué hacer, qué decir y con qué respaldo cuentas.</p>
      </div>
      <div class="rejilla r3" style="grid-template-rows:1fr 1fr;gap:16px" data-anima="2">
        ${tarjeta('maletin',   'El oficio',        'Qué hace una broker de verdad y cómo se gana la vida con esto.', 'lienzo')}
        ${tarjeta('edificio',  'Nuevo vs. usado',  'Los dos productos que vas a vender y en qué se diferencian.', 'lienzo')}
        ${tarjeta('megafono',  'Captación',        'Cómo consigues propiedades y compradores desde el día uno.', 'lienzo')}
        ${tarjeta('grafico',   'Proceso comercial','Los siete pasos que van desde el primer contacto hasta la firma.', 'lienzo')}
        ${tarjeta('personas',  'Roleplay',         'Practicas la conversación real antes de salir a terreno.', 'lienzo')}
        ${tarjeta('llave',     'El cierre',        'Cómo se cierra bien y qué pasa después de la firma.', 'destacada')}
      </div>
    </div>
    ${pie('02 · Agenda')}`
},

/* ── 04 · QUÉ HACE UNA BROKER ─────────────────────────────── */
{
  titulo: '¿Qué hace una broker?', mini: IMG.brokerTrabajando,
  html: `
    <div class="media-foto a-la-derecha"><img src="${IMG.brokerTrabajando}" alt=""></div>
    <div class="cuerpo centro" style="width:56%;padding-right:40px">
      <span class="rotulo" data-anima="1" style="display:block;margin-bottom:16px">El oficio</span>
      <h2 class="titular" data-anima="2" style="margin-bottom:22px">
        Una broker <mark>conecta</mark><br>y acompaña
      </h2>
      <p class="bajada" data-anima="3" style="margin-bottom:30px;max-width:38ch">
        No eres vendedora de folletos. Eres la persona que traduce un proyecto
        en una decisión que alguien puede tomar con tranquilidad.
      </p>
      <div class="lista-check" data-anima="4">
        ${check('<strong>Entiendes al cliente</strong> antes de mostrarle nada.')}
        ${check('<strong>Conoces el producto</strong> mejor que el folleto: plantas, orientación, gastos, entrega.')}
        ${check('<strong>Ordenas el camino</strong>: financiamiento, documentos, plazos y expectativas.')}
        ${check('<strong>Estás cuando aparece la duda</strong>, que es justo cuando se cae una venta.')}
      </div>
    </div>
    ${pie('03 · El oficio')}`
},

/* ── 05 · LOS DOS MODELOS DE COMISIÓN ────────────────────── */
{
  titulo: 'Cómo te pagan', mini: IMG.reunionClientes,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Tu ingreso</span>
        <h2 class="titular">Te pagan de dos maneras distintas</h2>
        <p class="bajada">Según si la propiedad es nueva o usada. Son estructuras diferentes, y conviene que las tengas claras desde hoy.</p>
      </div>
      <div class="dos-columnas" style="gap:26px">
        <div class="tarjeta destacada" data-anima="2" style="justify-content:center;gap:14px">
          <span class="t-num">Propiedad nueva · Vista Amunátegui</span>
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
            <span class="cifra naranja" style="font-size:58px">1,6<span class="unidad">%</span></span>
            <span style="font-family:var(--display);font-weight:800;font-size:22px;color:var(--gris)">+ $1.000.000</span>
          </div>
          <div class="t-texto" style="font-size:15px">
            Un <strong>1,6 % del valor de venta</strong>, más un <strong>bono fijo de un millón de pesos</strong> por cada operación cerrada.
          </div>
        </div>
        <div class="tarjeta" data-anima="3" style="justify-content:center;gap:14px">
          <span class="t-num">Propiedad usada</span>
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
            <span class="cifra" style="font-size:58px">30<span class="unidad">%</span></span>
            <span style="font-family:var(--display);font-weight:800;font-size:22px;color:var(--gris)">del 4 %</span>
          </div>
          <div class="t-texto" style="font-size:15px">
            El negocio completo cobra un <strong>4 % del valor</strong>. De ese 4 %, a ti te toca un <strong>30 % por vender</strong>
            — y <strong>otro 30 % si además tú captaste</strong> la propiedad.
          </div>
        </div>
      </div>
    </div>
    ${pie('03 · El oficio')}`
},

/* ── 06 · EL DETALLE DEL NUEVO ───────────────────────────── */
{
  titulo: 'Lo que deja una nueva', mini: IMG.fachada,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Propiedad nueva · con precios reales del edificio</span>
        <h2 class="titular">Lo que deja cada tipo de departamento</h2>
        <p class="bajada">Precios medianos reales de Vista Amunátegui. La comisión es 1,6 % del valor, más el bono fijo en cada caso.</p>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;min-height:0">
      <div class="rejilla r3" data-anima="2" style="flex:none;gap:16px">
        <div class="tarjeta lienzo" style="gap:8px">
          <span class="t-num">Estudio · UF 2.496</span>
          <div class="cifra chica" style="font-size:42px">UF 40</div>
          <div class="t-texto" style="font-size:14px">+ $1.000.000 de bono</div>
        </div>
        <div class="tarjeta lienzo" style="gap:8px">
          <span class="t-num">1D + 1B · UF 3.219</span>
          <div class="cifra chica" style="font-size:42px">UF 51</div>
          <div class="t-texto" style="font-size:14px">+ $1.000.000 de bono</div>
        </div>
        <div class="tarjeta lienzo" style="gap:8px">
          <span class="t-num">2D + 2B · UF 3.945</span>
          <div class="cifra chica" style="font-size:42px">UF 63</div>
          <div class="t-texto" style="font-size:14px">+ $1.000.000 de bono</div>
        </div>
      </div>
      <div class="tarjeta naranja-suave en-fila" data-anima="3" style="align-items:center">
        ${ico('chispa')}
        <div class="t-cuerpo">
          <div class="t-titulo" style="font-size:17px">El bono es fijo, y eso cambia la cuenta</div>
          <div class="t-texto" style="font-size:14px">
            Un millón de pesos pesa mucho más sobre un estudio que sobre un 2D. Vender unidades chicas no es vender menos:
            para ti rinden proporcionalmente más, y además se venden más rápido.
          </div>
        </div>
      </div>
      </div>
    </div>
    ${pie('03 · El oficio')}`
},

/* ── 07 · EL DETALLE DEL USADO ───────────────────────────── */
{
  titulo: 'Lo que deja una usada', mini: IMG.casaUsada,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Propiedad usada · ejemplo con una de UF 4.000</span>
        <h2 class="titular">Captar y vender es cobrar dos veces</h2>
      </div>
      <div class="dos-columnas" style="gap:34px">
        <div style="display:flex;flex-direction:column;justify-content:center;gap:11px" data-anima="2">
          <div class="embudo-nivel" style="width:100%;background:var(--tinta);height:54px">
            <span>El negocio cobra 4 %</span><span class="en-cifra">UF 160</span>
          </div>
          <div class="embudo-nivel" style="width:78%;background:var(--naranja-hondo);height:54px">
            <span>Tú, por vender (30 %)</span><span class="en-cifra">UF 48</span>
          </div>
          <div class="embudo-nivel" style="width:78%;background:var(--naranja-hondo);height:54px">
            <span>Tú, por captar (30 %)</span><span class="en-cifra">UF 48</span>
          </div>
          <div class="embudo-nivel" style="width:100%;background:var(--naranja);height:64px;box-shadow:0 8px 22px rgba(244,99,36,.32)">
            <span style="font-size:17px">Si hiciste las dos</span><span class="en-cifra" style="font-size:30px">UF 96</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:16px" data-anima="3">
          ${tarjeta('llave', 'La captación te duplica el ingreso', 'Misma propiedad, mismo cierre, el doble de comisión. Por eso una broker con cartera propia gana distinto que una que sólo muestra lo que le pasan.', 'destacada')}
          ${tarjeta('lupa', 'Una usada propia rinde como dos ventas', 'UF 96 en una operación captada y vendida por ti. Cuesta más trabajo y toma más tiempo, pero el número lo justifica.', 'lienzo')}
        </div>
      </div>
    </div>
    ${pie('03 · El oficio')}`
},

/* ── 08 · PROYECCIÓN REALISTA ────────────────────────────── */
{
  titulo: 'Tu año, con números reales', mini: IMG.exito,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Proyección con las comisiones reales</span>
        <h2 class="titular">Tres años posibles</h2>
        <p class="bajada">Nuevas al valor mediano del edificio (UF 3.202) y usadas propias de UF 4.000. No es una promesa: es la cuenta exacta de cada escenario.</p>
      </div>
      <div class="dos-columnas" style="gap:44px">
        <div style="height:100%;padding-bottom:8px" data-anima="2">
          <div class="barras">
            <div class="barra-col">
              <div class="barra-valor">UF 307</div>
              <div class="barra" style="height:31%;--retraso:.15s"></div>
              <div class="barra-etiqueta">Arranque<br>6 nuevas</div>
            </div>
            <div class="barra-col">
              <div class="barra-valor">UF 614</div>
              <div class="barra" style="height:62%;--retraso:.3s"></div>
              <div class="barra-etiqueta">En ritmo<br>12 nuevas</div>
            </div>
            <div class="barra-col">
              <div class="barra-valor" style="color:var(--naranja)">UF 998</div>
              <div class="barra" style="height:100%;--retraso:.45s"></div>
              <div class="barra-etiqueta"><strong>Con cartera</strong><br>12 nuevas + 4 usadas</div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:14px" data-anima="3">
          <div class="tarjeta lienzo" style="gap:6px;padding:16px 20px">
            <span class="t-num">Y además, en pesos</span>
            <div class="t-texto" style="font-size:14.5px">El bono de $1.000.000 va aparte de la UF: <strong>$6.000.000 en el año de arranque y $12.000.000 en ritmo</strong>, sólo en bonos.</div>
          </div>
          ${tarjeta('reloj', 'Una venta al mes', 'Ese es el escenario del medio. Suena lejos el primer mes y deja de sonar lejos al sexto.', 'lienzo')}
          ${tarjeta('chispa', 'La diferencia está en captar', 'Cuatro usadas propias en el año agregan UF 384. Es el salto entre la segunda barra y la tercera.', 'naranja-suave')}
        </div>
      </div>
    </div>
    ${pie('03 · El oficio')}`
},

/* ── 09 · DIVISOR: NUEVO VS USADO ─────────────────────────── */
{
  titulo: 'Nuevo vs. Usado', mini: IMG.construccion, oscura: true,
  html: `
    <div class="panel-comparativo" style="position:absolute;inset:0;border-radius:0">
      <div>
        <div class="pc-foto"><img src="${IMG.construccion}" alt=""><div class="velo abajo"></div></div>
        <div class="pc-contenido">
          <span class="pildora contorno-claro" style="margin-bottom:16px">Se vende antes de existir</span>
          <h2 class="titular" style="font-size:46px">Propiedad<br>nueva</h2>
        </div>
      </div>
      <div>
        <div class="pc-foto"><img src="${IMG.casaUsada}" alt=""><div class="velo abajo"></div></div>
        <div class="pc-contenido">
          <span class="pildora contorno-claro" style="margin-bottom:16px">Se vende con historia</span>
          <h2 class="titular" style="font-size:46px">Propiedad<br>usada</h2>
        </div>
      </div>
    </div>
    <div class="versus" data-anima="1">VS</div>
    <div class="velo arriba" style="height:190px;bottom:auto"></div>
    <div style="position:absolute;top:54px;left:0;right:0;text-align:center;z-index:6" data-anima="2">
      <span class="rotulo claro">Bloque 2</span>
      <p style="color:rgba(255,255,255,.88);font-size:17px;margin-top:10px;font-weight:500">
        Dos productos distintos. Dos conversaciones distintas.
      </p>
    </div>`
},

/* ── 10 · COMPARACIÓN CARA A CARA ─────────────────────────── */
{
  titulo: 'Cara a cara', mini: IMG.fachada, oscura: true,
  html: `
    <div class="panel-comparativo" style="position:absolute;inset:0;border-radius:0">
      <div style="justify-content:flex-end">
        <div class="pc-foto"><img src="${IMG.fachada}" alt=""><div class="velo abajo"></div></div>
        <div class="pc-contenido" data-anima="1">
          <span class="rotulo claro" style="display:block;margin-bottom:12px">Nueva</span>
          <h3 style="font-size:27px;margin-bottom:18px">Todo por estrenar</h3>
          <div class="lista-check" style="gap:9px">
            ${check('Pie en cuotas durante la construcción')}
            ${check('Garantía del vendedor y de la constructora')}
            ${check('Terminaciones y equipamiento actuales')}
            ${check('Amenities y espacios comunes')}
          </div>
        </div>
      </div>
      <div style="justify-content:flex-end">
        <div class="pc-foto"><img src="${IMG.casaUsada}" alt=""><div class="velo abajo"></div></div>
        <div class="pc-contenido" data-anima="2">
          <span class="rotulo claro" style="display:block;margin-bottom:12px">Usada</span>
          <h3 style="font-size:27px;margin-bottom:18px">Se ve lo que se compra</h3>
          <div class="lista-check" style="gap:9px">
            ${check('Entrega inmediata, sin esperar obra')}
            ${check('Barrio ya consolidado y comprobable')}
            ${check('Metros más grandes por el mismo valor')}
            ${check('Precio conversable con el propietario')}
          </div>
        </div>
      </div>
    </div>
    <div class="versus">VS</div>`
},

/* ── 11 · TABLA COMPARATIVA ───────────────────────────────── */
{
  titulo: 'El cuadro comparativo', mini: IMG.edificio,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1" style="margin-bottom:24px">
        <span class="rotulo">El cuadro que tienes que saber de memoria</span>
        <h2 class="titular">Nuevo o usado, según lo que importa</h2>
      </div>
      <div style="flex:1;display:flex;align-items:center;min-height:0">
      <table class="tabla" data-anima="2">
        <thead>
          <tr><th class="criterio"></th><th class="col-nueva">Propiedad nueva</th><th>Propiedad usada</th></tr>
        </thead>
        <tbody>
          <tr><td class="criterio">Forma de pago del pie</td><td class="col-nueva">En cuotas, durante la obra</td><td>Al contado, a la firma</td></tr>
          <tr><td class="criterio">Plazo de entrega</td><td class="col-nueva">Según avance: en verde, en blanco o inmediata</td><td>Inmediata</td></tr>
          <tr><td class="criterio">Estado</td><td class="col-nueva">A estrenar, con garantía</td><td>Se recibe como está</td></tr>
          <tr><td class="criterio">Negociación del precio</td><td class="col-nueva">Lista de precios de la inmobiliaria</td><td>Directa con el propietario</td></tr>
          <tr><td class="criterio">Gastos operacionales</td><td class="col-nueva">Muchas veces incluidos en la promoción</td><td>Los asume el comprador</td></tr>
          <tr><td class="criterio">Quién gana con el tiempo</td><td class="col-nueva">La plusvalía entre la compra y la entrega</td><td>La del barrio, desde el día uno</td></tr>
        </tbody>
      </table>
      </div>
    </div>
    ${pie('04 · Nuevo vs. usado')}`
},

/* ── 12 · PROPIEDAD NUEVA ─────────────────────────────────── */
{
  titulo: 'Por qué una propiedad nueva', mini: IMG.fachada, oscura: true,
  html: `
    ${fondo(IMG.fachada, 'der')}
    <div class="cuerpo centro" style="left:auto;right:0;width:52%;padding:64px 72px 64px 20px">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:16px">Propiedad nueva</span>
      <h2 class="titular" data-anima="2" style="margin-bottom:30px">Cuatro razones<br>que sí convencen</h2>
      <div style="display:flex;flex-direction:column;gap:20px" data-anima="3">
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('calculadora', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">El pie se paga de a poco</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Durante los meses de obra, en cuotas. Para mucha gente esa es toda la diferencia entre poder y no poder.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('grafico', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Compra hoy al precio de hoy</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Y recibe en dos o tres años más. Lo que suba en el intermedio queda del lado del comprador.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('escudo', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Garantía y post venta</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">La constructora responde por la obra. Una casa usada no tiene a quién reclamarle.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('estrella', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Espacios comunes que no se pagan aparte</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Piscina, gimnasio, cowork, quincho. Suben la vida diaria y también el arriendo.</div></div>
        </div>
      </div>
    </div>
    ${pie('05 · Propiedades nuevas')}`
},

/* ── 13 · VENTA EN VERDE ──────────────────────────────────── */
{
  titulo: 'Verde, blanco y entrega', mini: IMG.construccion,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Vocabulario obligatorio</span>
        <h2 class="titular">Verde, blanco y entrega inmediata</h2>
        <p class="bajada">Son los tres momentos en que se puede vender un mismo departamento. Cambia el precio, cambia el riesgo y cambia el tipo de cliente.</p>
      </div>
      <div style="flex:1;display:flex;align-items:center;min-height:0">
        <div class="proceso" style="align-items:flex-start;flex:none;width:100%">
          <div class="riel"><span style="width:100%"></span></div>
          <div class="paso viva">
            <div class="paso-num">1</div>
            <div class="paso-titulo">En verde</div>
            <div class="paso-texto">Se vende con el proyecto aprobado y la obra recién partiendo. <strong>El precio más bajo de toda la vida del proyecto.</strong> El cliente necesita paciencia y confianza.</div>
          </div>
          <div class="paso viva">
            <div class="paso-num">2</div>
            <div class="paso-titulo">En blanco</div>
            <div class="paso-texto">La obra está avanzada y ya se puede caminar. Precio intermedio y mucha menos incertidumbre: el cliente ve lo que compra.</div>
          </div>
          <div class="paso viva">
            <div class="paso-num">3</div>
            <div class="paso-titulo">Entrega inmediata</div>
            <div class="paso-texto">Recepción municipal lista, escrituración en semanas. El precio más alto, y el único que sirve para quien necesita mudarse ya.</div>
          </div>
        </div>
      </div>
      <div class="tarjeta naranja-suave" style="flex-direction:row;align-items:center;gap:22px;padding:20px 24px;margin-top:26px" data-anima="4">
        ${ico('megafono')}
        <div class="t-texto" style="color:var(--tinta-media);font-size:15px">
          <strong style="font-family:var(--display)">Cómo se dice en la reunión:</strong>
          “Comprando en verde entras al precio más bajo del edificio y pagas el pie en cuotas hasta la entrega.
          Si necesitas mudarte este año, te muestro lo que ya está recibido.”
        </div>
      </div>
    </div>
    ${pie('05 · Propiedades nuevas')}`
},

/* ── 14 · EL PRODUCTO POR DENTRO ──────────────────────────── */
{
  titulo: 'El producto por dentro', mini: IMG.cocina,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:22px">
        <span class="rotulo">Edificio Vista Amunátegui · producto real de Avance</span>
        <h2 class="titular">Esto es lo que muestras</h2>
      </div>
      <div class="mosaico" data-anima="2"
           style="grid-template-columns:repeat(4,1fr);grid-template-rows:1.25fr 1fr;
                  grid-template-areas:'a a b c' 'a a d e'">
        ${celda(IMG.estar,      'Living comedor', 'a')}
        ${celda(IMG.cocina,     'Cocina integrada', 'b')}
        ${celda(IMG.dormitorio, 'Dormitorio', 'c')}
        ${celda(IMG.comedor,    'Comedor', 'd')}
        ${celda(IMG.lobby,      'Lobby y recepción', 'e')}
      </div>
    </div>
    ${pie('05 · Propiedades nuevas')}`
},

/* ── 15 · AMENITIES ───────────────────────────────────────── */
{
  titulo: 'Los espacios comunes', mini: IMG.piscina,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:22px">
        <span class="rotulo">Argumento de venta, no decoración</span>
        <h2 class="titular">Los espacios comunes se venden solos</h2>
      </div>
      <div class="mosaico" data-anima="2"
           style="grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;
                  grid-template-areas:'a b b' 'a c d'">
        ${celda(IMG.terraza,  'Terraza panorámica', 'a')}
        ${celda(IMG.piscina,  'Piscina', 'b')}
        ${celda(IMG.gimnasio, 'Gimnasio', 'c')}
        ${celda(IMG.cowork,   'Cowork y bicicleteros', 'd')}
      </div>
    </div>
    ${pie('05 · Propiedades nuevas')}`
},

/* ── 16 · UBICACIÓN ───────────────────────────────────────── */
{
  titulo: 'La ubicación', mini: IMG.barrioNoche, oscura: true,
  html: `
    ${fondo(IMG.barrioNoche, 'abajo')}
    <div class="cuerpo" style="justify-content:flex-end">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:14px">Lo primero que pregunta el cliente</span>
      <h2 class="titular" data-anima="2" style="margin-bottom:20px;max-width:16ch">La ubicación es<br>la mitad del precio</h2>
      <div class="rejilla r4" data-anima="3" style="flex:none;gap:14px;margin-top:8px">
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:8px">
          <div class="t-titulo" style="color:#fff;font-size:16px">Metro y recorridos</div>
          <div class="t-texto" style="color:rgba(255,255,255,.72);font-size:13.5px">Cuántas cuadras, qué línea, cuánto demora al centro.</div>
        </div>
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:8px">
          <div class="t-titulo" style="color:#fff;font-size:16px">Servicios a pie</div>
          <div class="t-texto" style="color:rgba(255,255,255,.72);font-size:13.5px">Supermercado, farmacia, colegios, consultorio.</div>
        </div>
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:8px">
          <div class="t-titulo" style="color:#fff;font-size:16px">Qué se está construyendo</div>
          <div class="t-texto" style="color:rgba(255,255,255,.72);font-size:13.5px">Obras cerca hoy son plusvalía mañana.</div>
        </div>
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:8px">
          <div class="t-titulo" style="color:#fff;font-size:16px">Demanda de arriendo</div>
          <div class="t-texto" style="color:rgba(255,255,255,.72);font-size:13.5px">El dato que decide a un inversionista.</div>
        </div>
      </div>
    </div>
    ${pie('05 · Propiedades nuevas')}`
},


/* ── 17 · PROPIEDAD USADA ─────────────────────────────────── */
{
  titulo: 'Por qué una propiedad usada', mini: IMG.casaUsada, oscura: true,
  html: `
    ${fondo(IMG.casaUsada, 'izq')}
    <div class="cuerpo centro" style="width:52%;padding-right:24px">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:16px">Propiedad usada</span>
      <h2 class="titular" data-anima="2" style="margin-bottom:30px">Lo que la nueva<br>no puede ofrecer</h2>
      <div style="display:flex;flex-direction:column;gap:20px" data-anima="3">
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('llave', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Las llaves ahora</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Quien arrienda y quiere dejar de arrendar este año no puede esperar una obra.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('mapa', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Barrio comprobado</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Árboles grandes, vecinos, comercio andando. No hay que imaginárselo.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('casa', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">Más metros por el mismo valor</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Y muchas veces patio, bodega o un estacionamiento que ya viene incluido.</div></div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          ${ico('manos', 'solido')}
          <div><div class="t-titulo" style="color:#fff;margin-bottom:3px">El precio se conversa</div>
          <div style="font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.7)">Hay una persona al frente, no una lista de precios. Ahí tu trabajo vale doble.</div></div>
        </div>
      </div>
    </div>
    ${pie('06 · Propiedades usadas')}`
},

/* ── 18 · LA VISITA A UNA USADA ───────────────────────────── */
{
  titulo: 'Qué mirar en una usada', mini: IMG.visitaUsada,
  html: `
    <div class="media-foto a-la-izquierda"><img src="${IMG.visitaUsada}" alt=""></div>
    <div class="cuerpo" style="left:50%;width:50%;padding:60px 68px 60px 44px;justify-content:center">
      <span class="rotulo" data-anima="1" style="display:block;margin-bottom:14px">En terreno</span>
      <h2 class="titular-sm" data-anima="2" style="margin-bottom:10px">Lo que revisas<br>antes de ofrecerla</h2>
      <p class="bajada" data-anima="3" style="font-size:15.5px;margin-bottom:24px">Una usada mal revisada es una venta que se cae en el estudio de títulos. Anda con esta lista.</p>
      <div class="lista-check" data-anima="4" style="gap:11px">
        ${check('<strong>Títulos al día</strong> y sin hipotecas ni prohibiciones vigentes')}
        ${check('<strong>Contribuciones y gastos comunes</strong> sin deuda')}
        ${check('<strong>Recepción municipal</strong> de ampliaciones y regularizaciones')}
        ${check('<strong>Humedad, filtraciones e instalaciones</strong>: mira techo, baños y tablero')}
        ${check('<strong>Orientación y luz</strong> a la hora real en que se vive la casa')}
        ${check('<strong>Motivo de venta y urgencia</strong> del propietario')}
      </div>
    </div>
    ${pie('06 · Propiedades usadas')}`
},

/* ── 19 · A QUIÉN LE SIRVE CADA UNA ───────────────────────── */
{
  titulo: 'Tres clientes, tres respuestas', mini: IMG.primeraVivienda,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:24px">
        <span class="rotulo">Lectura de cliente</span>
        <h2 class="titular">Tres clientes, tres respuestas distintas</h2>
        <p class="bajada">No existe “la mejor propiedad”. Existe la que le sirve a quien tienes al frente.</p>
      </div>
      <div class="rejilla r3" data-anima="2">
        ${tarjetaFoto(IMG.primeraVivienda, 'Primera vivienda',
          'Le ofreces nueva, en verde',
          'Junta el pie de a poco mientras se construye, entra al precio más bajo y no arrastra reparaciones. Aquí tu trabajo es dar tranquilidad y ordenar el financiamiento.')}
        ${tarjetaFoto(IMG.inversionista, 'Inversionista',
          'Le ofreces números',
          'Quiere rentabilidad, no terminaciones. Llega con arriendo de mercado en la zona, gastos comunes, contribuciones y flujo. Decide con una planilla, no con una visita.')}
        ${tarjetaFoto(IMG.visitaUsada, 'Familia que se cambia',
          'Le ofreces usada',
          'Necesita metros, colegio cerca y mudarse en meses, no en años. Aquí la usada gana casi siempre, y el barrio es el argumento.')}
      </div>
    </div>
    ${pie('06 · Propiedades usadas')}`
},

/* ── 20 · DIVISOR CAPTACIÓN ───────────────────────────────── */
{
  titulo: 'Captación', mini: IMG.captacionDueno, oscura: true,
  html: `
    ${fondo(IMG.captacionDueno, 'izq')}
    <div class="cuerpo centro" style="width:58%">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:18px">Bloque 3</span>
      <h2 class="titular-xl" data-anima="2" style="font-size:66px;margin-bottom:24px">Captación</h2>
      <p class="bajada" data-anima="3" style="font-size:20px;max-width:34ch">
        Sin cartera no hay venta. Esta es la parte que separa
        a la broker que vive de esto de la que lo intentó un verano.
      </p>
    </div>`
},

/* ── 21 · EMBUDO ──────────────────────────────────────────── */
{
  titulo: 'El embudo', mini: IMG.reunionClientes,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Cómo funciona de verdad</span>
        <h2 class="titular">Se vende por volumen, no por suerte</h2>
        <p class="bajada">Proporciones de referencia para que midas tu mes. Si el final no aparece, el problema casi siempre está arriba.</p>
      </div>
      <div class="dos-columnas" style="gap:48px">
        <div class="embudo" data-anima="2">
          <div class="embudo-nivel" style="width:100%;background:var(--tinta)">
            <span>Contactos del mes</span><span class="en-cifra">100</span>
          </div>
          <div class="embudo-nivel" style="width:84%;background:#3A4350">
            <span>Conversaciones reales</span><span class="en-cifra">40</span>
          </div>
          <div class="embudo-nivel" style="width:66%;background:var(--naranja-hondo)">
            <span>Visitas agendadas</span><span class="en-cifra">15</span>
          </div>
          <div class="embudo-nivel" style="width:48%;background:var(--naranja)">
            <span>Cotizaciones</span><span class="en-cifra">8</span>
          </div>
          <div class="embudo-nivel" style="width:30%;background:var(--naranja-claro)">
            <span>Cierres</span><span class="en-cifra">2</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:16px" data-anima="3">
          ${tarjeta('lupa',  'El embudo no miente',  'Si no cierras, cuenta hacia atrás. Casi siempre faltan contactos arriba, no talento abajo.', 'lienzo')}
          ${tarjeta('reloj', 'Todos los días, poco', 'Veinte contactos diarios rinden más que una semana heroica cada mes.', 'naranja-suave')}
        </div>
      </div>
    </div>
    ${pie('07 · Captación')}`
},

/* ── 22 · CANALES ─────────────────────────────────────────── */
{
  titulo: 'Dónde están tus clientes', mini: IMG.captacionDigital,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:22px">
        <span class="rotulo">Canales</span>
        <h2 class="titular">Dónde están tus clientes</h2>
      </div>
      <div class="rejilla r3" data-anima="2" style="grid-template-rows:1.5fr 1fr">
        ${tarjetaFoto(IMG.captacionDigital, 'Canal 01', 'Redes sociales',
          'Video vertical mostrando la propiedad, hablando tú. No publiques folletos: publica recorridos con tu voz.')}
        ${tarjetaFoto(IMG.videollamada, 'Canal 02', 'Tu círculo cercano',
          'Tus primeras tres ventas salen de gente que ya te conoce. Avísales a todos que ahora vendes propiedades.')}
        ${tarjetaFoto(IMG.apretonManos, 'Canal 03', 'Referidos',
          'Cada cliente atendido bien vale dos más. Pide el referido el día de la entrega, no seis meses después.')}
        ${tarjeta('mapa',     'Terreno',   'Barrios donde vendes: conserjes, comercio, carteles “se vende” de particulares.', 'lienzo')}
        ${tarjeta('telefono', 'Portales',  'Responde en minutos. El lead de portal se enfría en una hora.', 'lienzo')}
        ${tarjeta('personas', 'La red Avance', 'Cartera compartida y proyectos de la inmobiliaria desde tu primer día.', 'destacada')}
      </div>
    </div>
    ${pie('07 · Captación')}`
},

/* ── 23 · EL PRIMER CONTACTO ──────────────────────────────── */
{
  titulo: 'El primer contacto', mini: IMG.captacionDueno,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Guion de captación</span>
        <h2 class="titular">Los primeros treinta segundos</h2>
        <p class="bajada">Con un propietario que publicó por su cuenta. No vendas tu servicio: ofrécele resolver el problema que ya tiene.</p>
      </div>
      <div class="dos-columnas" style="gap:40px">
        <div style="display:flex;flex-direction:column;gap:13px;justify-content:center" data-anima="2">
          <div class="burbuja broker"><span class="quien">Tú</span>
            Hola Marcela, vi que está vendiendo el departamento de Amunátegui. Soy broker y trabajo esa zona. ¿Puedo hacerle dos preguntas rápidas?</div>
          <div class="burbuja cliente"><span class="quien">Propietaria</span>
            Ya lo tengo publicado hace tres meses y no pasa nada.</div>
          <div class="burbuja broker"><span class="quien">Tú</span>
            Es lo más normal. ¿Le han pedido visitas o ni eso? Le pregunto porque casi siempre es precio o son fotos, y son dos problemas distintos.</div>
          <div class="burbuja broker"><span class="quien">Tú</span>
            Si preguntan y después desaparecen, no es el precio. Déjeme mandarle hoy los valores reales de cierre de su edificio y, si le hace sentido, conversamos.</div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:16px" data-anima="3">
          ${tarjeta('mensaje', 'Pregunta antes de proponer', 'Quien pregunta dirige la conversación. Quien lanza su discurso la pierde.', 'lienzo')}
          ${tarjeta('grafico', 'Llega con un dato', 'Valores de cierre de su edificio. El dato te da autoridad en un minuto.', 'lienzo')}
          ${tarjeta('bandera', 'Cierra con un paso chico', 'No pidas la exclusiva en el primer mensaje. Pide permiso para mandarle algo útil.', 'naranja-suave')}
        </div>
      </div>
    </div>
    ${pie('07 · Captación')}`
},


/* ── 24 · EL PROCESO COMERCIAL ────────────────────────────── */
{
  titulo: 'El proceso comercial', mini: IMG.reunionClientes,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Bloque 4 · El método</span>
        <h2 class="titular">Siete pasos, siempre los mismos</h2>
        <p class="bajada">Cuando te sientas perdida en una venta, es porque te saltaste uno. Vuelve al paso anterior.</p>
      </div>
      <div style="flex:1;display:flex;align-items:center;min-height:0" data-anima="2">
        <div class="proceso" style="width:100%;flex:none">
          <div class="riel"><span style="width:100%"></span></div>
          <div class="paso viva"><div class="paso-num">1</div>
            <div class="paso-titulo">Contacto</div>
            <div class="paso-texto">Responde rápido y preséntate con nombre y respaldo.</div></div>
          <div class="paso viva"><div class="paso-num">2</div>
            <div class="paso-titulo">Calificación</div>
            <div class="paso-texto">Presupuesto, plazo, pie y motivo. Sin esto vas a ciegas.</div></div>
          <div class="paso viva"><div class="paso-num">3</div>
            <div class="paso-titulo">Selección</div>
            <div class="paso-texto">Dos o tres opciones, nunca veinte. Elegir cansa.</div></div>
          <div class="paso viva"><div class="paso-num">4</div>
            <div class="paso-titulo">Visita</div>
            <div class="paso-texto">Muestra y escucha. La visita es para que hable el cliente.</div></div>
          <div class="paso viva"><div class="paso-num">5</div>
            <div class="paso-titulo">Cotización</div>
            <div class="paso-texto">Números exactos: precio, pie, dividendo y gastos.</div></div>
          <div class="paso viva"><div class="paso-num">6</div>
            <div class="paso-titulo">Reserva</div>
            <div class="paso-texto">Se firma y se paga la reserva. Recién ahí hay algo.</div></div>
          <div class="paso viva"><div class="paso-num">7</div>
            <div class="paso-titulo">Escritura</div>
            <div class="paso-texto">Crédito, firma y entrega. Acompañas hasta las llaves.</div></div>
        </div>
      </div>
    </div>
    ${pie('08 · Proceso comercial')}`
},

/* ── 25 · LA VISITA ───────────────────────────────────────── */
{
  titulo: 'Cómo se conduce una visita', mini: IMG.mostrandoDepto,
  html: `
    <div class="media-foto a-la-derecha"><img src="${IMG.mostrandoDepto}" alt=""></div>
    <div class="cuerpo" style="width:52%;padding:60px 40px 60px 72px;justify-content:center">
      <span class="rotulo" data-anima="1" style="display:block;margin-bottom:14px">Paso 4</span>
      <h2 class="titular-sm" data-anima="2" style="margin-bottom:10px">La visita no es<br>un tour guiado</h2>
      <p class="bajada" data-anima="3" style="font-size:15.5px;margin-bottom:22px">Si hablaste más que el cliente, la visita salió mal. Tu trabajo es que él se imagine viviendo ahí.</p>
      <div class="lista-check" data-anima="4" style="gap:11px">
        ${check('<strong>Llega quince minutos antes.</strong> Luces, ventanas, olor, temperatura.')}
        ${check('<strong>Parte por lo mejor</strong> y cierra por lo mejor. Lo flojo va al medio.')}
        ${check('<strong>Haz preguntas, no discursos:</strong> “¿dónde pondría el escritorio?”')}
        ${check('<strong>Deja silencios.</strong> En el silencio aparece la objeción real.')}
        ${check('<strong>Nunca inventes un dato.</strong> “Lo confirmo hoy” vale más que una cifra falsa.')}
        ${check('<strong>Sal con la próxima fecha</strong> agendada, no con un “le aviso”.')}
      </div>
    </div>
    ${pie('08 · Proceso comercial')}`
},

/* ── 26 · HERRAMIENTAS ────────────────────────────────────── */
{
  titulo: 'Tus herramientas', mini: IMG.tecnologia,
  html: `
    <div class="cuerpo denso">
      <div class="encabezado" data-anima="1">
        <span class="rotulo">Tecnología aplicada</span>
        <h2 class="titular">No cotices a mano</h2>
        <p class="bajada">Avance te entrega las herramientas. Tu ventaja frente a un particular es llegar con el número correcto el mismo día.</p>
      </div>
      <div class="dos-columnas" style="gap:34px">
        <div style="border-radius:16px;overflow:hidden;position:relative" data-anima="2">
          <img src="${IMG.tecnologia}" alt="" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;justify-content:center" data-anima="3">
          ${tarjeta('calculadora', 'Cotizador Avance', 'Precio, pie en cuotas, dividendo estimado y gastos. Deja la cotización lista para enviar.', 'destacada en-fila')}
          ${tarjeta('documento',   'Fichas y plantas',  'Superficie útil, terraza, orientación y piso de cada modelo.', 'en-fila')}
          ${tarjeta('grafico',     'Proyección a 3, 5 y 10 años', 'Plusvalía y flujo, para la conversación con inversionistas.', 'en-fila')}
        </div>
      </div>
    </div>
    ${pie('08 · Proceso comercial')}`
},

/* ── 27 · OBJECIONES ──────────────────────────────────────── */
{
  titulo: 'Las cuatro objeciones', mini: IMG.clienteDuda,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:22px">
        <span class="rotulo">Manejo de objeciones</span>
        <h2 class="titular">Las cuatro que vas a escuchar siempre</h2>
        <p class="bajada">Una objeción no es un no. Es una duda sin resolver, y resolverla es exactamente tu trabajo.</p>
      </div>
      <div class="rejilla r2" data-anima="2" style="grid-template-rows:1fr 1fr;gap:16px">
        <div class="tarjeta" style="gap:12px">
          <div class="burbuja cliente" style="max-width:100%;font-size:14.5px;padding:13px 16px">“Está caro.”</div>
          <div class="t-texto" style="font-size:14.5px;color:var(--tinta-media)">
            <strong style="font-family:var(--display);color:var(--naranja)">Caro comparado con qué.</strong>
            Pregúntalo tal cual, sin ironía. Casi siempre lo comparan con una propiedad que no es equivalente, y ahí recién puedes mostrar valores reales de cierre de la zona.</div>
        </div>
        <div class="tarjeta" style="gap:12px">
          <div class="burbuja cliente" style="max-width:100%;font-size:14.5px;padding:13px 16px">“Lo tengo que conversar.”</div>
          <div class="t-texto" style="font-size:14.5px;color:var(--tinta-media)">
            <strong style="font-family:var(--display);color:var(--naranja)">Perfecto, conversémoslo juntos.</strong>
            Ofrece estar en esa conversación o mandar el resumen escrito. Lo que se conversa sin ti se cuenta mal, y el que no fue a la visita decide con la mitad de la información.</div>
        </div>
        <div class="tarjeta" style="gap:12px">
          <div class="burbuja cliente" style="max-width:100%;font-size:14.5px;padding:13px 16px">“Voy a esperar que bajen.”</div>
          <div class="t-texto" style="font-size:14.5px;color:var(--tinta-media)">
            <strong style="font-family:var(--display);color:var(--naranja)">Esperar también cuesta.</strong>
            Mientras espera sigue pagando arriendo y el proyecto sube de precio a medida que avanza la obra. Muéstrale la lista de precios por etapa: el argumento lo da el propio proyecto.</div>
        </div>
        <div class="tarjeta" style="gap:12px">
          <div class="burbuja cliente" style="max-width:100%;font-size:14.5px;padding:13px 16px">“No sé si me van a dar el crédito.”</div>
          <div class="t-texto" style="font-size:14.5px;color:var(--tinta-media)">
            <strong style="font-family:var(--display);color:var(--naranja)">Averigüémoslo hoy mismo.</strong>
            Esta es la única objeción que se resuelve con un trámite, no con palabras. Deriva a preaprobación de inmediato: una semana de silencio aquí mata la venta.</div>
        </div>
      </div>
    </div>
    ${pie('08 · Proceso comercial')}`
},

/* ── 28 · DIVISOR ROLEPLAY ────────────────────────────────── */
{
  titulo: 'Roleplay', mini: IMG.roleplay, oscura: true,
  html: `
    ${fondo(IMG.roleplay, 'der')}
    <div class="cuerpo centro" style="left:auto;right:0;width:56%;padding-right:72px">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:18px">Bloque 5</span>
      <h2 class="titular-xl" data-anima="2" style="font-size:66px;margin-bottom:24px">Roleplay</h2>
      <p class="bajada" data-anima="3" style="font-size:20px;max-width:32ch">
        Equivocarse aquí sale gratis. Equivocarse con un cliente real cuesta una venta.
      </p>
    </div>`
},

/* ── 29 · CÓMO FUNCIONA EL ROLEPLAY ───────────────────────── */
{
  titulo: 'Cómo funciona', mini: IMG.clienteDuda,
  html: `
    <div class="cuerpo">
      <div class="encabezado" data-anima="1" style="margin-bottom:24px">
        <span class="rotulo">Práctica en vivo</span>
        <h2 class="titular">Dos roles, quince minutos</h2>
      </div>
      <div class="dos-columnas" style="gap:26px">
        <div class="tarjeta-foto" data-anima="2" style="border-color:var(--linea)">
          <div class="tf-img" style="height:52%"><img src="${IMG.clienteDuda}" alt=""></div>
          <div class="tf-cuerpo" style="gap:11px">
            <span class="t-num">Rol A</span>
            <div class="t-titulo">El cliente</div>
            <div class="t-texto">Recibes una tarjeta con tu presupuesto, tu plazo y una objeción escondida. No la sueltas hasta que te pregunten bien. Tu pega es poner el problema, no facilitarlo.</div>
          </div>
        </div>
        <div class="tarjeta-foto" data-anima="3" style="border-color:var(--naranja)">
          <div class="tf-img" style="height:52%"><img src="${IMG.reunionClientes}" alt=""></div>
          <div class="tf-cuerpo" style="gap:11px">
            <span class="t-num">Rol B</span>
            <div class="t-titulo">La broker</div>
            <div class="t-texto">Califica, selecciona, muestra y cotiza. Tienes que salir con el siguiente paso agendado. Si no lo lograste, lo repites al tiro con lo que acabas de aprender.</div>
          </div>
        </div>
      </div>
      <div class="tarjeta naranja-suave" data-anima="4" style="flex-direction:row;align-items:center;gap:22px;padding:18px 24px;margin-top:20px">
        ${ico('reloj')}
        <div class="t-texto" style="color:var(--tinta-media);font-size:14.5px">
          <strong style="font-family:var(--display)">Siete minutos por ronda, tres minutos de comentarios, y se cambian los roles.</strong>
          La observación se hace sobre lo que se dijo, nunca sobre la persona.
        </div>
      </div>
    </div>
    ${pie('09 · Roleplay')}`
},

/* ── 30 · LOS CASOS ───────────────────────────────────────── */
{
  titulo: 'Los tres casos', mini: IMG.primeraVivienda,
  html: `
    <div class="cuerpo" style="padding-bottom:56px">
      <div class="encabezado" data-anima="1" style="margin-bottom:22px">
        <span class="rotulo">Tarjetas de la práctica</span>
        <h2 class="titular">Los tres casos de hoy</h2>
      </div>
      <div class="rejilla r3" data-anima="2">
        <div class="tarjeta" style="gap:14px">
          ${ico('personas','solido')}
          <div class="t-titulo">Caso 1 · Pareja joven</div>
          <div class="t-texto">Arriendan hace cuatro años. Tienen UF 300 ahorradas y quieren dejar de arrendar. Ella quiere esperar; él quiere comprar ya.</div>
          <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--linea)">
            <span class="t-num">Objeción escondida</span>
            <div class="t-texto" style="margin-top:4px">No saben si les van a dar el crédito y les da vergüenza preguntarlo.</div>
          </div>
        </div>
        <div class="tarjeta" style="gap:14px">
          ${ico('grafico','solido')}
          <div class="t-titulo">Caso 2 · Inversionista</div>
          <div class="t-texto">Ya tiene dos departamentos arrendados. Compara tu proyecto con otro más barato en otra comuna y te lo dice en la cara.</div>
          <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--linea)">
            <span class="t-num">Objeción escondida</span>
            <div class="t-texto" style="margin-top:4px">No le importa el precio: le importa cuánto se demora en arrendarse.</div>
          </div>
        </div>
        <div class="tarjeta" style="gap:14px">
          ${ico('casa','solido')}
          <div class="t-titulo">Caso 3 · Familia que se achica</div>
          <div class="t-texto">Los hijos se fueron. Venden la casa grande y quieren un departamento cerca de la misma comuna, sin perder metros de más.</div>
          <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--linea)">
            <span class="t-num">Objeción escondida</span>
            <div class="t-texto" style="margin-top:4px">Tienen que vender antes de comprar y nadie les ha explicado cómo se calza eso.</div>
          </div>
        </div>
      </div>
    </div>
    ${pie('09 · Roleplay')}`
},

/* ── 31 · EL CIERRE ───────────────────────────────────────── */
{
  titulo: 'El cierre', mini: IMG.firma,
  html: `
    <div class="media-foto a-la-izquierda"><img src="${IMG.firma}" alt=""></div>
    <div class="cuerpo" style="left:50%;width:50%;padding:60px 68px 60px 44px;justify-content:center">
      <span class="rotulo" data-anima="1" style="display:block;margin-bottom:14px">Bloque 6</span>
      <h2 class="titular-sm" data-anima="2" style="margin-bottom:10px">Cerrar es ordenar,<br>no presionar</h2>
      <p class="bajada" data-anima="3" style="font-size:15.5px;margin-bottom:22px">Nadie firma por insistencia. Firma cuando ya no le queda ninguna duda sin responder.</p>
      <div class="lista-check" data-anima="4" style="gap:12px">
        ${check('<strong>Resume en voz alta</strong> lo que el cliente te dijo que necesitaba, y muestra cómo esta propiedad lo cumple.')}
        ${check('<strong>Pon los números por escrito.</strong> Precio, reserva, pie, dividendo y gastos, en un solo documento.')}
        ${check('<strong>Nombra el siguiente paso con fecha.</strong> “El jueves firmamos la reserva”, no “avísame cuando puedas”.')}
        ${check('<strong>Acompaña la firma.</strong> Reserva, promesa, crédito y escritura: en cada una aparece una duda nueva.')}
        ${check('<strong>El día de las llaves, pide el referido.</strong> Es el único momento en que nadie te dice que no.')}
      </div>
    </div>
    ${pie('10 · El cierre')}`
},

/* ── 32 · DESPUÉS DE LA FIRMA ─────────────────────────────── */
{
  titulo: 'Después de la firma', mini: IMG.llaves, oscura: true,
  html: `
    ${fondo(IMG.llaves, 'der')}
    <div class="cuerpo centro" style="left:auto;right:0;width:50%;padding-right:72px">
      <span class="rotulo claro" data-anima="1" style="display:block;margin-bottom:16px">Post venta</span>
      <h2 class="titular" data-anima="2" style="margin-bottom:22px">La venta no<br>termina firmando</h2>
      <p class="bajada" data-anima="3" style="margin-bottom:28px;max-width:32ch">
        La broker que desaparece después de la escritura vuelve a empezar de cero cada mes.
        La que acompaña se construye una cartera.
      </p>
      <div class="rejilla r2" data-anima="4" style="flex:none;gap:14px">
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:6px">
          <div class="cifra chica" style="font-size:34px">1</div>
          <div class="t-texto" style="color:rgba(255,255,255,.74);font-size:13.5px">Llamada la semana de la entrega, para la recepción del departamento.</div>
        </div>
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:6px">
          <div class="cifra chica" style="font-size:34px">2</div>
          <div class="t-texto" style="color:rgba(255,255,255,.74);font-size:13.5px">Mensaje al mes, por si aparece algo de post venta con la constructora.</div>
        </div>
        <div class="tarjeta" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:18px 20px;gap:6px">
          <div class="cifra chica" style="font-size:34px">3</div>
          <div class="t-texto" style="color:rgba(255,255,255,.74);font-size:13.5px">Saludo al año de la compra. Ahí aparecen los referidos y la segunda inversión.</div>
        </div>
        <div class="tarjeta" style="background:var(--naranja);border-color:transparent;padding:18px 20px;gap:6px">
          <div class="t-titulo" style="color:#fff;font-size:16px">Tu cartera</div>
          <div class="t-texto" style="color:rgba(255,255,255,.9);font-size:13.5px">Es lo único que de verdad se acumula en este oficio.</div>
        </div>
      </div>
    </div>`
},

/* ── 33 · CHECKLIST FINAL ─────────────────────────────────── */
{
  titulo: 'Tu primera semana', mini: IMG.equipo,
  html: `
    <div class="media-foto a-la-derecha"><img src="${IMG.equipo}" alt=""></div>
    <div class="cuerpo" style="width:53%;padding:60px 36px 60px 72px;justify-content:center">
      <span class="rotulo" data-anima="1" style="display:block;margin-bottom:14px">Para salir de aquí con algo hecho</span>
      <h2 class="titular-sm" data-anima="2" style="margin-bottom:22px">Tu primera semana</h2>
      <div class="lista-check" data-anima="3" style="gap:13px">
        ${check('Aprenderte <strong>un proyecto completo</strong>: plantas, precios, orientación y entrega.')}
        ${check('<strong>Avisarle a treinta personas</strong> de tu círculo que ahora vendes propiedades.')}
        ${check('<strong>Grabar un video</strong> recorriendo una propiedad, hablando tú.')}
        ${check('<strong>Armar tu planilla de cartera</strong>: nombre, presupuesto, plazo, próximo paso.')}
        ${check('<strong>Cotizar tres escenarios</strong> distintos en el cotizador hasta que te salga sin pensar.')}
        ${check('<strong>Agendar tu primera visita.</strong> Aunque no compre. Es la práctica que importa.')}
      </div>
    </div>
    ${pie('10 · El cierre')}`
},

/* ── 34 · CIERRE ASPIRACIONAL ─────────────────────────────── */
{
  titulo: 'Cierre', mini: IMG.exito, oscura: true,
  html: `
    ${fondo(IMG.exito, 'izq')}
    <div class="cuerpo centro" style="width:60%">
      <div class="placa-marca" style="margin-bottom:36px" data-anima="1">
        <img src="${IMG.logo}" alt="Avance Inmobiliario">
      </div>
      <h2 class="editorial" data-anima="2" style="font-size:52px;line-height:1.14;margin-bottom:28px;max-width:18ch;color:#fff">
        La primera venta cuesta.<br>
        <span style="font-style:normal;font-family:var(--display);font-weight:800;color:var(--naranja-claro)">La décima es un oficio.</span>
      </h2>
      <p class="bajada" data-anima="3" style="font-size:18px;max-width:36ch;margin-bottom:34px">
        Sales de aquí con el producto, el método y la red.
        Lo que falta es empezar, y eso parte esta semana.
      </p>
      <div style="display:flex;gap:12px;align-items:center" data-anima="4">
        <span class="pildora naranja">Bienvenida a Avance</span>
        <span class="pildora contorno-claro">Escuela de Brokers</span>
      </div>
    </div>`
},

];
