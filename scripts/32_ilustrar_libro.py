# -*- coding: utf-8 -*-
"""Ilustra el libro N5 con gpt-image-2.

    python3 scripts/32_ilustrar_libro.py hoja            # la hoja de personajes
    python3 scripts/32_ilustrar_libro.py cap 1 2 3       # capítulos sueltos
    python3 scripts/32_ilustrar_libro.py cap --todos     # los 103

La hoja de personajes se genera UNA vez y luego se manda como referencia en
cada capítulo. Es lo que evita que Carlos cambie de cara entre el capítulo 4 y
el 80: el modelo no tiene memoria entre llamadas, así que la coherencia hay que
dársela en cada petición.

La clave sale de .env.local (OPENAI_API_KEY) y no se imprime nunca.
"""
import base64, json, os, pathlib, re, ssl, subprocess, sys, time, urllib.request

# El Python del framework no trae el almacén de certificados del sistema, así
# que urllib se cae con CERTIFICATE_VERIFY_FAILED. Se le pasa el bundle de
# OpenSSL de Homebrew, que sí está.
def _contexto():
    for c in ("/opt/homebrew/etc/openssl@3/cert.pem",
              "/etc/ssl/cert.pem", "/usr/local/etc/openssl@3/cert.pem"):
        if pathlib.Path(c).exists():
            return ssl.create_default_context(cafile=c)
    return ssl.create_default_context()

SSL = _contexto()

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "docs" / "libro" / "ilustraciones"
HOJA = SALIDA / "00-personajes.png"
MODELO = "gpt-image-2"

# --------------------------------------------------------------- el estilo
# Este bloque va en TODAS las peticiones, tal cual. Si se toca, se toca aquí y
# se regenera todo: media docena de dibujos con otro estilo se nota más que
# ciento tres con uno mediocre.
ESTILO = """
STYLE — Masaaki Yuasa. Angular, flat, distorted, ugly-beautiful.
Take the character design and linework directly from these four:
THE TATAMI GALAXY, KEMONOZUME, PING PONG THE ANIMATION, DEVILMAN CRYBABY.
That flat angular graphic look, those lean warped bodies, that nervous line.
This is NOT a cute cartoon. Nothing here is round, friendly or charming.

FACES — the single most important thing:
Built from ANGULAR FLAT PLANES, not soft curves. Sharp pointed chins, wedge
noses with a hard bridge, blunt cheekbones, foreheads that slope. Every face is
LOPSIDED: the two halves do not match, one eye sits higher and is a different
size and shape from the other. Eyes are SMALL, NARROW and HALF-LIDDED — thin
slits or flat almonds — never big, never round, never shiny, never with
highlights. Mouths are LONG and HORIZONTAL, thin-lipped, often a flat straight
line or a wide lopsided gash; teeth are one flat band, not individual. Faces
look odd, bony, unglamorous, a bit unsettling. Deliberately unattractive and
full of character.

BODIES: elongated and rubbery, small heads on long torsos, long thin limbs that
bend where they shouldn't, hands and feet too big, shoulders uneven, everyone
leaning slightly off vertical. Perspective is warped and tilted.

LINE: thin, nervous, scratchy contour that suddenly thickens and blots, drawn
in one pass and never corrected. Lines overshoot corners and do not close.

FLAT: black ink on off-white paper. Shading is SOLID FLAT BLACK SHAPES only —
hair, a shadow, a dark garment, filled in solid, with hard graphic edges. NO
halftone, NO hatching, NO grey, NO texture, NO volume, NO rendering. Shapes,
not forms. Big empty white areas.

NOT EVERYONE IS A CARICATURE. The distortion is for the young adults. Draw the
old woman and the child STRAIGHT: same flat angular line, same narrow eyes and
solid blacks, but gently and naturally observed — a real grandmother and a real
twelve-year-old boy. No grotesque exaggeration on them, no sinister or leering
faces, no monstrous teeth. Kenta is an ordinary friendly kid.

If the result looks cute, rounded, friendly, symmetrical or well-behaved, it is
COMPLETELY WRONG. Make it stranger, flatter and more angular.

HARD RULES — these are not suggestions:
1. NO TEXT. No letters, no numbers, no words, no writing, no signage, no
   captions, no speech bubbles, no logos, in any language, anywhere in the
   image. Books, papers, screens, posters and shop signs must be blank or carry
   only meaningless wavy strokes suggesting text from a distance. Never
   anything readable.
2. ANATOMY. Every person has exactly one head, two arms, two legs, two feet.
   Never an extra or missing limb. Hands are simplified rough mitten shapes;
   do not draw individual fingers or fingernails. Keep hands small and vague.
   Feet are simple shapes. When in doubt, hide hands in pockets or behind an
   object rather than drawing them in detail.
3. SIMPLE — this is the rule that gets broken most, so obey it hardest.
   One clear action. The characters are the drawing; everything else is a hint.
   The background is AT MOST three or four loose strokes — a line for the
   horizon, a shape for a building, nothing more. Never draw a full scene,
   never a cityscape, never rows of windows, never crowds, never scenery with
   depth. Leave large areas of the paper completely EMPTY. If you are unsure
   whether to add an object, leave it out.

FORBIDDEN STYLES — do not imitate any of these, even loosely:
Studio Ghibli; Pixar / DreamWorks / any 3D or CGI look; CalArts house style;
the "Diary of a Wimpy Kid" doodle style; mainstream manga or anime;
children's picture-book cuteness; soft rounded friendly character design;
big round expressive eyes; neat symmetrical faces; anything wholesome;
clean vector art; flat corporate illustration; thin uniform outlines; smooth
gradients; cel shading; glossy rendering; big round glossy eyes; perfectly
symmetrical faces; polished modern anime; moe or idol character design;
consistent "model sheet" precision.
""".strip()

PERSONAJES = {
    "carlos": "CARLOS — Mexican man, 23, the narrator. CHEERFUL and a bit "
              "starry-eyed, in over his head and happy about it: easy open "
              "grin, eyebrows up, wide hopeful eyes. Never worried, never sad "
              "unless the scene says so. Messy dark hair, light stubble, plain "
              "hoodie and jeans. EXACTLY THE SAME HEIGHT as Jean.",
    "jean":   "JEAN — Peruvian man, mid twenties. EXACTLY THE SAME HEIGHT as "
              "Carlos, a bit stockier. Extrovert and a charmer, always working "
              "the room: one eyebrow up, easy confident smile, chin lifted, "
              "smoothing his hair, shirt with the top buttons open. Neat "
              "side-parted black hair, round glasses. LATIN AMERICAN EYES: large "
              "and open, rounded almond, visible dark iris, heavy dark brows. "
              "Charming, never sleazy.",
    "gonsa":  "GONSA — Peruvian man, mid twenties. SLIGHTLY TALLER than Carlos "
              "and a bit heavier and rounder than the others, though still "
              "basically lanky. Big round AFRO hair. Deadpan, dry, "
              "gallows-humour grin — one eyebrow up, half-smile, enjoying the "
              "disaster. Loud patterned shirt. LATIN AMERICAN EYES: large and "
              "open, rounded almond, visible dark iris, heavy dark brows. "
              "Wry, never mean.",
    "anna":   "ANNA — Japanese woman in her early TWENTIES, clearly a grown "
              "adult, never a schoolgirl and never in a school uniform. Straight "
              "shoulder-length black hair with a blunt fringe, THIN OVAL "
              "METAL-RIMMED GLASSES, adult build, jeans and a loose jumper. "
              "Calm and watchful.",
    "tanaka": "TANAKA — Japanese woman, late sixties, the landlady. Short and "
              "round, grey hair in a small bun, apron over a knitted vest, "
              "reading glasses low on her nose. Nosy and warm.",
    "min":    "MIN — man from Myanmar, late twenties. Broad shoulders, short "
              "cropped hair, wide calm face, pizzeria apron and a cloth cap. "
              "Carlos's senpai in the kitchen.",
    "kenta":  "KENTA — Japanese boy, 12, Tanaka's grandson. Small, sticking-up "
              "hair, gap-toothed grin, football kit and scuffed trainers.",
    "avion":  "THE PLANE GIRL — Japanese woman, about twenty, a plane nerd. She "
              "must look CLEARLY DIFFERENT from Anna: BIG THICK SQUARE glasses "
              "(not Anna's thin oval ones), long hair in two low bunches, never "
              "a blunt fringe, freckles, hoodie and shorts, a big airline plush "
              "toy always in her lap and a wristwatch she keeps checking.",
}


def clave() -> str:
    env = RAIZ / ".env.local"
    if env.exists():
        for l in env.read_text(encoding="utf-8").splitlines():
            if l.startswith("OPENAI_API_KEY="):
                return l.split("=", 1)[1].strip()
    k = os.environ.get("OPENAI_API_KEY")
    if not k:
        sys.exit("falta OPENAI_API_KEY en .env.local")
    return k


ASPEROS = (b"KEMONOZUME, ", b"KEMONOZUME,", b"KEMONOZUME",
           b", DEVILMAN CRYBABY", b"DEVILMAN CRYBABY")


def _sin_titulos_asperos(cuerpo: bytes) -> bytes:
    for a in ASPEROS:
        cuerpo = cuerpo.replace(a, b"")
    return cuerpo


def _peticion(url: str, cuerpo, cabeceras, intentos=4):
    """POST con reintentos: la API devuelve 429/5xx de vez en cuando y perder
    un dibujo a medio lote obliga a repetir el lote entero."""
    for n in range(intentos):
        try:
            req = urllib.request.Request(url, data=cuerpo, headers=cabeceras, method="POST")
            with urllib.request.urlopen(req, timeout=600, context=SSL) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            detalle = e.read().decode("utf-8", "replace")[:400]
            # «Kemonozume» y «Devilman Crybaby» hacen saltar el filtro de vez en
            # cuando —son títulos con fama violenta— aunque lo que pedimos no
            # tenga nada. Se reintenta sin esos dos nombres: el estilo lo
            # sostienen igual Tatami Galaxy y Ping Pong.
            if "moderation_blocked" in detalle and n < intentos - 1:
                print("    filtro de contenido; reintento sin los títulos ásperos")
                cuerpo = _sin_titulos_asperos(cuerpo)
                continue
            if e.code in (429, 500, 502, 503, 504) and n < intentos - 1:
                espera = 8 * (n + 1)
                print(f"    {e.code}; reintento en {espera}s")
                time.sleep(espera)
                continue
            raise SystemExit(f"la API respondió {e.code}: {detalle}")
        except Exception as e:
            if n < intentos - 1:
                time.sleep(8 * (n + 1)); continue
            raise


def genera(prompt: str, destino: pathlib.Path, referencia: pathlib.Path | None = None,
           size="1536x1024", gris=True):
    """Un dibujo. Con `referencia` usa /images/edits, que es como se le pasa la
    hoja de personajes para que respete las caras."""
    k = clave()
    if referencia and referencia.exists():
        lim = "----%s" % base64.b16encode(os.urandom(8)).decode()
        partes = []
        def campo(nombre, valor):
            partes.append(f'--{lim}\r\nContent-Disposition: form-data; name="{nombre}"\r\n\r\n{valor}\r\n'.encode())
        campo("model", MODELO); campo("prompt", prompt); campo("size", size)
        partes.append(
            f'--{lim}\r\nContent-Disposition: form-data; name="image[]"; filename="ref.png"\r\n'
            f'Content-Type: image/png\r\n\r\n'.encode() + referencia.read_bytes() + b"\r\n")
        partes.append(f"--{lim}--\r\n".encode())
        cuerpo = b"".join(partes)
        d = _peticion("https://api.openai.com/v1/images/edits", cuerpo,
                      {"Authorization": f"Bearer {k}",
                       "Content-Type": f"multipart/form-data; boundary={lim}"})
    else:
        cuerpo = json.dumps({"model": MODELO, "prompt": prompt, "size": size}).encode()
        d = _peticion("https://api.openai.com/v1/images/generations", cuerpo,
                      {"Authorization": f"Bearer {k}", "Content-Type": "application/json"})
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(base64.b64decode(d["data"][0]["b64_json"]))
    # Son dibujos a tinta negra: guardarlos en RGB ocupa 3,4 veces más sin
    # aportar nada. A 1536x1024 y 115 mm de ancho quedan a ~340 ppp, de sobra
    # para imprenta.
    #
    # `gris=False` para lo que SÍ lleva color. Con esto siempre puesto, las
    # opciones de examen que se distinguen por el color salían grises: el
    # modelo las pintaba bien y esta línea se lo cargaba después.
    if gris:
        try:
            from PIL import Image
            Image.open(destino).convert("L").save(destino, optimize=True)
        except ImportError:
            pass
    u = d.get("usage") or {}
    try: nombre = destino.resolve().relative_to(RAIZ)
    except ValueError: nombre = destino
    print(f"  → {nombre}  ({destino.stat().st_size // 1024} KB"
          + (f", {u.get('total_tokens')} tokens)" if u else ")"))
    return destino


def hoja_personajes(sufijo=""):
    prompt = (ESTILO + "\n\nSUBJECT — a character model sheet.\n"
              "Seven characters standing full-body in a single row against a "
              "plain empty off-white background, evenly spaced, all drawn at "
              "the same scale, facing forward, relaxed poses. This is a "
              "reference sheet for an illustrator, so each face must be "
              "clearly distinct from the others.\n\n"
              "HEIGHTS — measure these against each other before drawing:\n"
              "- Carlos and Jean are IDENTICAL in height. Imagine a horizontal "
              "line across the top of Carlos's head: Jean's head touches the "
              "very same line. Not one pixel taller.\n"
              "- Gonsa is only slightly taller: half a head above Carlos and "
              "Jean, no more. He is not towering.\n"
              "- Anna and Min are about a head shorter than Carlos.\n"
              "- Tanaka is short and round; Kenta is a small child; the plane "
              "girl is about Anna's height.\n\n"
              + "\n".join(f"- {v}" for v in PERSONAJES.values())
              + "\n\nRemember: absolutely no text, no labels, no names under "
                "the figures. One head, two arms, two legs each. Simplified "
                "mitten hands, no fingers.")
    print("hoja de personajes…")
    genera(prompt, HOJA.with_stem(HOJA.stem + sufijo))


def portada():
    """La portada, SIN una sola letra.

    El título y el logo se componen encima con PIL: estos modelos escriben
    japonés fatal —salen kanji inventados— y un logo dibujado de memoria no es
    nuestro logo. El dibujo pone la torre y el personaje; las letras las pone
    una tipografía de verdad."""
    prompt = (ESTILO + "\n\nSUBJECT — the cover of a book.\n"
              "Kobe Port Tower: the tall red lattice tower with the pinched "
              "hourglass waist, drawn as a flat angular silhouette of thin "
              "crossing struts, standing tall on the right. At its foot, small, "
              "Carlos with his hands in his hoodie pockets, looking up at it, "
              "cheerful. A couple of loose strokes for the ground and one for "
              "the hills behind. Nothing else.\n\n"
              f"{PERSONAJES['carlos']}\n\n"
              "The attached image is the character model sheet — copy Carlos's "
              "design exactly. Vertical portrait composition. Leave the whole "
              "upper third almost EMPTY: a title goes there later.\n\n"
              "ABSOLUTELY NO TEXT, no letters, no title, no logo, no signature, "
              "no watermark. Not one character anywhere.")
    print("portada…")
    genera(prompt, SALIDA / "00-portada.png", referencia=HOJA, size="1024x1536")


TITULO_JA = "こうべの一年"
TITULO_ES = "Un año en Kobe"
FUENTES = pathlib.Path("/private/tmp/claude-501/-Users-jadhasfuh-Documents-jlptest"
                       "/de6ce02c-8b5a-444f-9eba-a860178bf9ed/scratchpad/fuentes")
LOGO = RAIZ / "android" / "play" / "icono-512.png"


def monta_portada():
    """Pone el título y el logo sobre el dibujo de la portada.

    Se compone aquí y no en el prompt porque el modelo escribe japonés fatal
    —inventa kanji— y un logo dibujado de memoria no es nuestro logo."""
    from PIL import Image, ImageDraw, ImageFont
    base = Image.open(SALIDA / "00-portada.png").convert("RGB")
    W, H = base.size
    d = ImageDraw.Draw(base)
    mincho = ImageFont.truetype(str(FUENTES / "ipaexm.ttf"), int(W * 0.089))
    gothic = ImageFont.truetype(str(FUENTES / "ipaexg.ttf"), int(W * 0.038))
    pie = ImageFont.truetype(str(FUENTES / "ipaexg.ttf"), int(W * 0.026))

    # El título va arriba a la IZQUIERDA, no centrado: la torre sube por la
    # derecha hasta el borde y un título centrado se le monta encima.
    x0 = int(W * 0.09)

    def izquierda(txt, fuente, y, gris=0):
        a = d.textbbox((0, 0), txt, font=fuente)
        d.text((x0 - a[0], y - a[1]), txt, font=fuente, fill=(gris,) * 3)
        return a[3] - a[1]

    alto = izquierda(TITULO_JA, mincho, int(H * 0.085))
    izquierda(TITULO_ES, gothic, int(H * 0.085) + alto + int(H * 0.028), 70)

    # El logo abajo a la izquierda, con la dirección DEBAJO y no al lado: al
    # lado se metía entre los pies del personaje.
    logo = Image.open(LOGO).convert("RGB")
    lado = int(W * 0.070)
    logo = logo.resize((lado, lado), Image.LANCZOS)
    x, y = x0, int(H * 0.885)
    base.paste(logo, (x, y))
    d.text((x, y + lado + int(H * 0.008)), "jlptest.org", font=pie,
           fill=(70, 70, 70))

    destino = SALIDA / "00-portada-montada.png"
    base.save(destino)
    print(f"  → {destino.relative_to(RAIZ)}  ({destino.stat().st_size // 1024} KB)")


def anuncio():
    """El arte del anuncio de Facebook, sin letras.

    Los personajes leyendo. El texto y el logo se componen después, igual que
    en la portada y por lo mismo: el modelo no escribe."""
    quienes = ["carlos", "anna", "gonsa", "jean"]
    fichas = "\n".join(f"- {PERSONAJES[q]}" for q in quienes)
    prompt = (ESTILO + "\n\nSUBJECT — four friends reading, side by side in a "
              "single horizontal row, seen from the front, standing or sitting "
              "on the same low step. Each one is absorbed in an open book held "
              "in front of them, at a different angle and a different height, "
              "with a different posture — one leaning back, one hunched over, "
              "one holding it up close, one half looking away. Relaxed and "
              "unposed.\n\n"
              f"CHARACTERS — match the attached reference sheet exactly:\n{fichas}\n\n"
              "The books are blank: their pages carry only a few meaningless "
              "wavy strokes, never readable text. Empty background, no room, no "
              "furniture, no scenery — just the figures on white paper with "
              "generous empty space above them.\n\n"
              "ABSOLUTELY NO TEXT of any kind anywhere in the image.")
    print("anuncio…")
    genera(prompt, SALIDA / "00-anuncio-arte.png", referencia=HOJA, size="1536x1024")


ROJO   = (215, 38, 61)      # el rojo del logo, muestreado del icono
TINTA  = (28, 30, 35)
PAPEL  = (247, 245, 240)
FUTURA = "/System/Library/Fonts/Supplemental/Futura.ttc"
AVENIR = "/System/Library/Fonts/Avenir Next.ttc"


def monta_anuncio():
    """El anuncio de Facebook, 1080x1350 (4:5, que es el formato que más ocupa
    en el feed). El arte sobre papel y no sobre el fondo oscuro del promo
    anterior: la ilustración es tinta negra, y sobre oscuro habría que
    invertirla y pierde el aire de dibujo a mano."""
    from PIL import Image, ImageDraw, ImageFont, ImageOps
    W, H = 1080, 1350
    lienzo = Image.new("RGB", (W, H), PAPEL)
    d = ImageDraw.Draw(lienzo)
    tit = ImageFont.truetype(FUTURA, 92, index=2)          # Futura Bold
    sub = ImageFont.truetype(AVENIR, 32, index=5)     # Medium
    pie = ImageFont.truetype(AVENIR, 27, index=2)     # Demi Bold
    x0 = 76

    d.text((x0, 150), "Lecturas", font=tit, fill=TINTA)
    d.text((x0, 150 + 104), "progresivas", font=tit, fill=ROJO)

    y = 150 + 104 * 2 + 34
    for linea in ("607 lecturas ordenadas de N5 a N1.",
                  "Empiezas con veinte palabras y acabas",
                  "leyendo japonés de verdad."):
        d.text((x0, y), linea, font=sub, fill=(90, 92, 98)); y += 44

    # El arte, a sangre por abajo. Se tiñe al color del papel: pegado tal cual
    # se veía la costura entre su blanco y el fondo. Y se le recorta el aire de
    # arriba, que si no se comía el tercer renglón del texto.
    arte = Image.open(SALIDA / "00-anuncio-arte.png").convert("L")
    caja = arte.point(lambda v: 255 if v < 200 else 0).getbbox()
    if caja:
        arte = arte.crop((0, max(0, caja[1] - 18), arte.width, arte.height))
    # El «blanco» del dibujo ronda el 240, no el 255, así que al teñirlo salía
    # un rectángulo más gris que el papel. Se empuja el casi-blanco a blanco.
    arte = arte.point(lambda v: 255 if v > 228 else v)
    arte = ImageOps.colorize(arte, black=TINTA, white=PAPEL)
    alto = int(arte.height * W / arte.width)
    arte = arte.resize((W, alto), Image.LANCZOS)
    tope = H - alto - 104
    lienzo.paste(arte, (0, tope))

    # franja de pie
    d.rectangle([0, H - 104, W, H], fill=TINTA)
    logo = Image.open(LOGO).convert("RGB").resize((58, 58), Image.LANCZOS)
    lienzo.paste(logo, (x0 - 8, H - 81))
    d.text((x0 + 66, H - 74), "Los 5 primeros capítulos, gratis", font=pie,
           fill=(238, 238, 240))
    a = d.textbbox((0, 0), "jlptest.org", font=pie)
    d.text((W - x0 - (a[2] - a[0]), H - 74), "jlptest.org", font=pie, fill=ROJO)

    destino = RAIZ / "android" / "play" / "promo-lecturas-1080x1350.png"
    lienzo.save(destino)
    print(f"  → {destino.relative_to(RAIZ)}  ({destino.stat().st_size // 1024} KB)")


def cubierta():
    """El arte de la portada de Facebook, sin letras."""
    quienes = ["carlos", "jean", "gonsa", "anna", "min", "kenta"]
    fichas = "\n".join(f"- {PERSONAJES[q]}" for q in quienes)
    prompt = (ESTILO + "\n\nSUBJECT — six friends walking together, seen from "
              "the front, spread out in ONE WIDE HORIZONTAL LINE across the "
              "whole width of the picture, mid-stride, chatting. Full body, "
              "feet on the same ground line, plenty of space between them. "
              "Relaxed and unposed, each one doing something different — one "
              "gesturing, one looking back, one hands in pockets.\n\n"
              f"CHARACTERS — match the attached reference sheet exactly:\n{fichas}\n\n"
              "Empty background: one loose line for the ground and nothing "
              "else. No street, no buildings, no scenery. Leave generous empty "
              "space above their heads.\n\n"
              "ABSOLUTELY NO TEXT of any kind anywhere in the image.")
    print("portada de Facebook…")
    genera(prompt, SALIDA / "00-cubierta-arte.png", referencia=HOJA, size="1536x1024")


def monta_cubierta():
    """1640 x 856, que es lo que pide Facebook.

    Dos recortes que hay que respetar: en móvil se comen los lados, así que lo
    que importa va al centro; y en escritorio la foto de perfil tapa la esquina
    de abajo a la izquierda, que se deja vacía."""
    from PIL import Image, ImageDraw, ImageFont, ImageOps
    W, H = 1640, 856
    lienzo = Image.new("RGB", (W, H), PAPEL)
    d = ImageDraw.Draw(lienzo)

    arte = Image.open(SALIDA / "00-cubierta-arte.png").convert("L")
    arte = arte.point(lambda v: 255 if v > 228 else v)
    caja = arte.point(lambda v: 255 if v < 200 else 0).getbbox()
    if caja:
        arte = arte.crop((0, max(0, caja[1] - 24), arte.width, arte.height))
    arte = ImageOps.colorize(arte, black=TINTA, white=PAPEL)
    # 0,72 del alto dejaba el pelo de Gonsa rozando el subtítulo.
    alto = int(H * 0.66)
    ancho = int(arte.width * alto / arte.height)
    arte = arte.resize((ancho, alto), Image.LANCZOS)
    lienzo.paste(arte, ((W - ancho) // 2, H - alto - 10))

    tit = ImageFont.truetype(FUTURA, 58, index=2)
    sub = ImageFont.truetype(AVENIR, 27, index=5)
    x0, y0 = 92, 74
    d.text((x0, y0), "Japonés para el JLPT", font=tit, fill=TINTA)
    d.text((x0, y0 + 70), "de N5 a N1", font=tit, fill=ROJO)
    d.text((x0, y0 + 152), "Vocabulario, kanji, gramática, lecturas y exámenes.",
           font=sub, fill=(92, 94, 100))

    # arriba a la derecha: fuera del recorte de móvil por poco, pero el logo
    # aguanta perderse; la esquina de abajo a la izquierda se queda libre para
    # la foto de perfil.
    logo = Image.open(LOGO).convert("RGB").resize((66, 66), Image.LANCZOS)
    lienzo.paste(logo, (W - 92 - 66, y0))
    pie = ImageFont.truetype(AVENIR, 30, index=2)
    a = d.textbbox((0, 0), "jlptest.org", font=pie)
    d.text((W - 92 - (a[2] - a[0]), y0 + 84), "jlptest.org", font=pie, fill=ROJO)

    destino = RAIZ / "docs" / "facebook-portada-personajes.png"
    lienzo.save(destino)
    print(f"  → {destino.relative_to(RAIZ)}  ({destino.stat().st_size // 1024} KB)")


def capitulos():
    """Los capítulos en el orden del LIBRO, con su texto en español."""
    orden = json.loads((RAIZ / "data/fuente/orden_libro.json").read_text(encoding="utf-8"))
    ids = orden.get("orden") or orden.get("ids") or next(
        (v for k, v in orden.items() if isinstance(v, list)), [])
    out = []
    for uid in ids:
        f = RAIZ / "data/fuente/lecturas" / (uid.replace("/", "_") + ".json")
        if not f.exists():
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        limpia = lambda s: re.sub(r"</?ruby>|</?rt>|<[^>]+>", "", s or "")
        out.append({"id": uid, "titulo": limpia(d["titulo"]),
                    "es": (d.get("traduccion") or "").strip()})
    return out


def quien_sale(texto: str):
    ALIAS = {"carlos": ["carlos"], "jean": ["jean"], "gonsa": ["gonsa", "gonza"],
             "anna": ["anna"], "tanaka": ["tanaka"], "min": ["min"],
             "kenta": ["kenta"]}
    t = texto.lower()
    return [k for k, ns in ALIAS.items()
            if any(re.search(rf"\b{n}\b", t) for n in ns)]


def ilustra_capitulo(n: int, cap: dict):
    quienes = quien_sale(cap["es"] + " " + cap["titulo"]) or ["carlos"]
    fichas = "\n".join(f"- {PERSONAJES[q]}" for q in quienes)
    prompt = (ESTILO + f"\n\nSUBJECT — one illustration for chapter {n} of a "
              "graded reader. Draw the single clearest moment of this scene.\n\n"
              f"SCENE (Spanish, from the book):\n{cap['es']}\n\n"
              f"CHARACTERS IN THIS SCENE — match the attached reference sheet "
              f"exactly, same faces, same clothes, same proportions:\n{fichas}\n\n"
              "The attached image is the character model sheet. Copy those "
              "designs; do not redesign anyone. Draw only the characters listed "
              "above — no extra people unless the scene needs a vague figure in "
              "the background. Horizontal composition with room to breathe. "
              "Remember: no text of any kind, simplified mitten hands, one head "
              "and two arms and two legs per person.")
    destino = SALIDA / f"{n:03d}-{cap['id'].split('/')[-1]}.png"
    print(f"cap {n:>3} · {cap['titulo'][:34]:<34} [{', '.join(quienes)}]")
    genera(prompt, destino, referencia=HOJA)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    orden = sys.argv[1]
    if orden == "cubierta":
        if "--montar" in sys.argv: monta_cubierta()
        else: cubierta()
        return
    if orden == "anuncio":
        if "--montar" in sys.argv: monta_anuncio()
        else: anuncio()
        return
    if orden == "portada":
        if "--montar" in sys.argv: monta_portada()
        else: portada()
        return
    if orden == "hoja":
        hoja_personajes(sys.argv[2] if len(sys.argv) > 2 else ""); return
    if orden != "cap":
        sys.exit(__doc__)
    if not HOJA.exists():
        sys.exit("primero la hoja de personajes: python3 scripts/32_ilustrar_libro.py hoja")
    caps = capitulos()
    print(f"capítulos en el libro: {len(caps)}")
    resto = sys.argv[2:]
    nums = range(1, len(caps) + 1) if resto == ["--todos"] else [int(x) for x in resto]
    for n in nums:
        if not 1 <= n <= len(caps):
            print(f"  cap {n} no existe"); continue
        destino = SALIDA / f"{n:03d}-{caps[n-1]['id'].split('/')[-1]}.png"
        if destino.exists():
            print(f"cap {n:>3} ya está, se salta"); continue
        ilustra_capitulo(n, caps[n - 1])


if __name__ == "__main__":
    main()
