#!/usr/bin/env python3
"""
Empaqueta el Manual de Broker en UN SOLO archivo .html autocontenido.

Mete dentro del archivo el CSS, los cuatro módulos de JavaScript y todas las
fotografías locales (como data URI), de modo que el resultado se pueda enviar
por correo, guardar en un pendrive o abrir sin servidor.

    python3 empaquetar.py [destino.html]

Las fotografías de escena que viven en una URL remota siguen siendo remotas:
no se pueden empotrar. Si no hay conexión, esas láminas muestran el degradado
de marca y el texto se lee igual.
"""
import base64, mimetypes, pathlib, re, sys

AQUI = pathlib.Path(__file__).parent
destino = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else AQUI / 'manual-de-broker.html')

def data_uri(ruta):
    p = AQUI / ruta
    tipo = mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return f"data:{tipo};base64,{base64.b64encode(p.read_bytes()).decode()}"

# ── 1. Los módulos, en orden de dependencia y sin import/export ──
def limpiar(nombre):
    s = (AQUI / nombre).read_text(encoding='utf-8')
    s = re.sub(r"^\s*import\s+.*?from\s+'[^']+';\s*$", '', s, flags=re.M)
    s = re.sub(r"^\s*export\s+\{[^}]*\};\s*$", '', s, flags=re.M)
    s = re.sub(r"^(\s*)export\s+(const|let|function|class)\b", r'\1\2', s, flags=re.M)
    return s

js = '\n'.join(limpiar(n) for n in ('imagenes.js', 'piezas.js', 'guion.js', 'deck.js'))

# ── 2. Las fotos locales, empotradas ──
incrustadas = 0
for ruta in sorted({m for m in re.findall(r"'(img/[^']+)'", js)}):
    js = js.replace(f"'{ruta}'", f"'{data_uri(ruta)}'")
    incrustadas += 1

# ── 3. El armado final ──
html = (AQUI / 'index.html').read_text(encoding='utf-8')
html = html.replace(
    '<link rel="stylesheet" href="estilos.css">',
    '<style>\n' + (AQUI / 'estilos.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="icon" href="img/marca/avance-inmobiliario.png">',
                    f'<link rel="icon" href="{data_uri("img/marca/avance-inmobiliario.png")}">')
# Script clásico a propósito: Safari bloquea <script type="module"> cuando la
# página se abre como archivo local (file://), y la presentación quedaría en negro.
html = html.replace('<script type="module" src="deck.js"></script>',
                    '<script>\n' + js + '\n</script>')

destino.write_text(html, encoding='utf-8')
print(f'{destino}  ·  {destino.stat().st_size/1048576:.1f} MB  ·  {incrustadas} fotografías empotradas')
