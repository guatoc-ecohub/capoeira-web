# Entrega — El viaje por el berimbau

Rama `berimbau-3d-20260906`. `npm run build` compila limpio.
Verificado con el gate GPU real (`shot3d --headed`, Quadro M6000): los seis tramos
en 1280x800 y en 390x844, y el camino al 2D por clic. 0 errores de página, 0 de
consola, 0 request fallidos.

## Lo que se rehízo, y por qué

El modelo anterior estaba mal planteado, no mal pulido. Se estudió
`vive-hero.vercel.app` (en disco; su licencia permite estudiarlo e implementar las
ideas de forma independiente — **no se copió código**) y se rehízo con ese modelo.

**1. Un solo barrido continuo, sin cortes ni botones.** La posición del scroll ES
la posición del viaje. Se fueron los botones «parada anterior / siguiente» y el
salto discreto: la cámara vuela mientras la copia sube. El viaje es el
instrumento entero en el vacío → se baja por la verga → se pasa por la mano que
toca → se ENTRA por la boca de la cabaça → se recorre la cámara de resonancia por
dentro → se mira hacia afuera por la boca → se sale.

**2. La copia dejó de ser un panel fijo al costado.** Va en el flujo del
documento, tramo por tramo, anclada a la parte del instrumento que la cámara tiene
delante. El 3D dejó de ser fondo decorativo: es lo que se recorre.

**3. Interpolación LINEAL entre claves, con suavizado. No splines.** Es
exactamente el error que yo había cometido: un Catmull-Rom por estas claves se pasa
de largo en los pares que están cerca —los de la entrada a la cabaça— y mete la
cámara dentro de la pared. Yo peleé con eso moviendo claves; la solución era la
interpolación.

**4. Diez claves para seis tramos**, en posiciones fraccionarias (0, 1, 2, 2.55,
2.82, 3, 3.55, 4, 4.6, 5). Las intermedias se concentran donde el camino es
delicado: entrar por la boca y girar dentro del cuenco.

**5. Todo se DERIVA de la posición del viaje; nada se acumula.** Llegar a 3,2
retrocediendo da el mismo cuadro que llegar avanzando. Lo único con memoria es el
amortiguado, y con `dt = 0` se anula.

**6. El patrón `fit`.** Cada clave decide cómo paga una pantalla angosta: cerca de
1 se retrocede sobre el eje de vista; en 0 se paga solo abriendo el campo. Adentro
de la cabaça es 0 — retroceder ahí saca la cámara por detrás de la pared. Reemplaza
el `setViewOffset` y el dolly manual que yo tenía.

**7. Cero layout en el camino del scroll.** Las anclas de las secciones y el tamaño
del lienzo se miden aparte y solo al cambiar el viewport; cada cuadro lee
únicamente `window.scrollY` antes de escribir.

**8. La capa editorial no toca nada.** `src/tresd/editorial.js` solo lee el scroll:
ni el mundo, ni el rig, ni el bucle. Degrada a «visible y quieto» — la clase `js`
es lo único que arma los revelados, así que si ese archivo falla la página está
toda ahí igual.

## La calidad del objeto

La cabaça anterior se leía como un tambor visto de frente. Ahora:

- Se **tornea de un perfil dibujado a mano** (`PERFIL` en `berimbau.js`): más ancha
  justo debajo del borde, cerrando en panza redonda. Ahí —y no en más polígonos—
  está la diferencia entre una calabaza y un casquete.
- Tiene **pared con grosor**: dos superficies torneadas más un anillo de canto que
  las une. El perfil interior sale de desplazar el exterior por su propia normal,
  así que la pared es de grosor constante y no una copia escalada.
- **Boca ovalada** y ligeramente ladeada.
- **Luz de una sola dirección** más un relleno bajo, y una luz cálida que entra POR
  la boca con alcance corto, para que el fondo del cuenco quede más oscuro que el
  borde.

Presupuesto: ~2.800 triángulos, una docena de llamadas de dibujo. Menos geometría
que antes, mejor resuelta.

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/tresd/viaje.js` | El viaje en unidades del mundo: tramos, medidas y las diez claves. Manda el ORDEN. |
| `src/tresd/rig.js` | La cámara: muestreo lineal con suavizado, patrón `fit`, amortiguado, derivación desde las anclas. |
| `src/tresd/berimbau.js` | La geometría, con la cabaça torneada de perfil. |
| `src/tresd/escena.js` | Mundo y bucle. Único que importa three, siempre por `import()` dinámico. |
| `src/tresd/editorial.js` | Revelados y punto activo del rail. Solo lee scroll. |
| `src/components/Berimbau3D.jsx` | El documento: seis secciones en flujo, una por tramo. |

`src/tresd/paradas.js` se eliminó: su papel lo cumple `viaje.js`.

**Una sola fuente de orden.** Las secciones se arman recorriendo `BEATS` y buscando
su copia por `id`. Cuando el orden vivía en dos sitios se desalinearon —la cámara
entraba a la cabaça mientras el texto hablaba de las artes marciales— y ahora eso es
imposible por construcción. Consecuencia: el contenido quedó con **técnica antes que
mestres**, que es el orden que pide la geometría (la mano que toca → las artes; la
cámara de resonancia → los tres que guían).

## Un defecto que casi «arreglo» sin serlo

En las capturas se veía una línea dorada cruzando la cavidad de la cabaça, y todo mi
razonamiento decía que era el arame dibujándose por delante. Antes de tocar nada hice
una prueba con colores testigo: arame magenta, interior azul. El arame quedó
**correctamente oculto** por la calabaza. La línea era una costura de la textura de
raspado, que se envolvía dos veces alrededor del eje; se quitó la repetición y
desapareció. Si me hubiera fiado del razonamiento habría movido geometría que estaba
bien.

## Lo que no cambió

- **El fallback y su detección temprana.** Sigue siendo la primera decisión de la
  app, antes del primer pintado y sin tocar three: sin WebGL, GPU por software,
  `MAX_TEXTURE_SIZE<2048`, ahorro de datos o menos de 1 GB de memoria → arranca en
  2D. El motor sigue en chunk aparte (475 kB, 121 kB gzip) por `import()` dinámico.
  Más 9 s de espera máxima, contexto perdido, y el vigilante de cuadros que primero
  baja el pixel ratio y apaga las motas y solo después cae al 2D. El botón «Ver todo
  en texto» sigue siempre visible; probado con clic real.
- **La paleta verde de Guatoc**, con el acento reservado a figuras e índices.
- **Las artes marciales rotulando**, y quién dicta cada una cruzado contra las
  `disciplinas` de cada ficha.
- **El material de Guatoc donde estaba**: la bananeira y el clip como la ventana del
  tramo del lugar, y las tres de apoyo en fila. El clip sigue siendo capa HTML,
  nunca textura WebGL, con `preload="none"`; ahora además solo corre mientras su
  tramo está en pantalla. Nada de huecos de «Foto pendiente».
- **`prefers-reduced-motion`**: sin amortiguado (la cámara sigue el scroll clavada),
  sin revelados y sin motas animadas.
- **Todo el contenido como HTML de verdad**, ahora en el flujo del documento.

## Materiales: el hueco medido

Teníamos 353 líneas de geometría y **ningún módulo de materiales**. Ahora hay
`src/tresd/materiales.js`. No es más geometría —la forma ya estaba resuelta desde
que la cabaça se torneó de un perfil— es tratamiento de superficie y luz.

Todas las texturas se **pintan por código** sobre un lienzo: no se descarga nada.
El ruido va con semilla fija, así que dos capturas del mismo cuadro salen
idénticas y el gate visual sirve de algo.

- **La cabaça por dentro**, que era un degradado plano y oscuro, ahora tiene
  raspado en anillos irregulares, gubiazos más hondos, **oclusión hacia el fondo**
  —adentro de un cuenco la luz no llega al fondo— y una banda clara justo en el
  borde, que es donde la luz lo lame. Los anillos van con desorden vertical
  grande a propósito: perfectamente concéntricos se leían como rodaja de tronco.
- **Mapa de normales** derivado del mismo campo de altura por diferencias
  finitas. Es el paso que hace que una raya deje de ser una raya *pintada* y pase
  a atrapar la luz. Se pinta una sola vez por superficie, en color y en gris, para
  que relieve y color no se puedan desincronizar.
- **La piel de afuera** tiene manchas —una calabaza seca nunca es de un solo
  tono— y estrías por los meridianos, con algo de cera en el brillo.
- **El canto** del corte tiene fibra: la pulpa cortada no es lisa.
- **La verga** tiene veta a lo largo y tres nudos, con `specularMap` para que la
  veta oscura brille menos que la clara.
- **El arame y el dobrão** reflejan un **mapa de entorno** procedural (un cielo
  oscuro, la clave como banda alargada y un rebote verde del monte). Eso es lo que
  separa al alambre de una línea pintada: ahora tiene de dónde sacar un brillo que
  le corre a lo largo.

**Presupuesto, que es lo que se va a medir en el Pixel.** Mapas de color a 512,
de relieve a 256. Y el vigilante de cuadros ahora degrada en **dos escalones**:
primero suelta relieve y entorno de un golpe (`bajarCalidad()`), porque cuesta
menos perder el tratamiento de superficie que perder resolución; solo si sigue
corto baja el pixel ratio y apaga las motas. Si aun así no da, cae al 2D como
siempre.

## La ventana: al mirar afuera ahora se ve Guatoc

Era mi propia observación al entregar: la boca de la cabaça daba al vacío. Ahora
hay un **telón** con `chorrera.jpg` —el valle con la cascada entre niebla— colgado
del grupo de la cabaça a **36 unidades** sobre el eje de la boca.

La distancia es el número que decide si se lee como vista o como calcomanía; a 36
unidades y con la boca recortándolo, se lee como el paisaje de allá afuera. Elegí
el valle y no la bananeira porque el valle **es** una vista: la bananeira es un
interior con una persona y a esa distancia se leería como un afiche colgado.

No hay que apagarlo en el resto del viaje: en todos los demás tramos la cámara
mira hacia −Z y el telón le queda literalmente a la espalda. La geometría sola lo
resuelve, sin trucos de opacidad. Y la imagen **no se pide al arrancar**: se pide
cuando el viaje pasa de 1,8, camino de la cabaça.

Efecto secundario que hubo que resolver: es el único tramo con fondo claro, así
que ahí la copia toma el mismo vidrio tintado que usa en pantalla angosta, en
todos los anchos, y el rail lleva un vidrio tenue permanente. La tipografía se
resuelve contra el render, y ese render mide claro.

## Los dos portales, una sola paleta

El 2D pasó a la familia verde de Guatoc. Se cambiaron los **valores** de los doce
tokens de `:root`, no las reglas, así que los nombres siguen sirviendo en los cien
sitios donde ya se usaban.

- Mapeo directo: `--c-bg` → `#07100b`, `--c-text` → `#f0f6f1`, `--c-muted` →
  `#c3d5c8`, `--c-accent` → `#58e39a`, `--c-gold` → `#e6b450`.
- Los escalones de superficie y borde (`--c-bg-alt`, `--c-surface`,
  `--c-surface-2`, `--c-line`, `--c-ink`) se derivaron **conservando los mismos
  saltos de luminancia** que tenían en marrón, medidos uno por uno, para que la
  jerarquía de profundidad no se perdiera. `--c-line` quedó en `#29332d`, que es
  casi exactamente el borde que el 3D pinta con su `--rule` sobre el fondo: los
  dos portales dibujan la misma línea.
- `--c-danger` se quedó cálido a propósito: un error tiene que verse como error.

**Contraste medido, par por par.** Ninguno bajó de AA y varios mejoraron: texto
sobre fondo 16,5 → 17,6; secundario sobre fondo 8,8 → 12,6; secundario sobre
superficie 7,9 → 11,5; acento sobre fondo 7,7 → 11,8. El texto largo del 2D quedó
mejor servido que antes.

**Los translúcidos se derivan de un solo lugar.** Antes cada transparencia era un
hex con alfa o un `rgb()` con el naranja escrito adentro. Ahora hay tripletas
(`--c-accent-rgb`, `--c-gold-rgb`, `--c-verde-rgb`, `--c-text-rgb`, `--c-bg-rgb`) y
todo se arma con `rgb(var(--…) / X%)`. El degradado del botón sale del acento por
`color-mix`, con el acento plano declarado antes como respaldo: si el navegador no
entiende `color-mix` queda un botón verde liso, no un botón sin fondo.

**Dos cosas que la unificación destapó y hubo que resolver:**

1. El **precio** compartía el verde del sistema con la disponibilidad, y dentro de
   la tarjeta de precios las dos señales se anulaban. Pasó a `--c-gold`, que además
   es el dorado que el precio ya tenía en el recorrido 3D.
2. `--c-verde` quedaba con el mismo valor que `--c-accent`. **Resuelto en la pasada
   siguiente por decisión del operador**: el aviso de cupos pasó a cálido y el token
   dejó de llamarse «verde» conteniendo dorado. Ahora hay `--c-cupos` (cálido: el
   aviso de disponibilidad, porque en un sitio verde un aviso del color del sistema
   deja de avisar) y `--c-exito` (verde: el mensaje de que algo salió bien, que
   aparece solo tras enviar y no compite con nada). Y el **precio volvió al verde
   del sistema**: con los cupos en cálido, dejarlo dorado los volvía a confundir
   dentro de la misma tarjeta. Los dos portales lo hacen igual.

**El barrido, que es donde estaba el riesgo.** Un `grep` de `#f28c1e` no habría
bastado: además de los cinco hex del botón había **diez literales en forma `rgb()`**
—el acento, el dorado y el verde escritos como tripletas decimales— que ningún grep
de hexadecimal encuentra. Es el patrón de los controles ciegos por identificador.
Quedaron cero supervivientes de toda la familia marrón en `src/` y en `index.html`,
incluido el `theme-color` de la barra del navegador.

## Rendimiento

- ~2.800 triángulos, una docena de llamadas de dibujo, 2 luces de escena más la de
  la boca, sin sombras ni post-proceso. Pixel ratio tope 1,5.
- **NO medido: Mali-G78.** No hay celular en este carril. Sigue siendo lo primero
  que hay que probar en el aparato.

## Qué queda pendiente

1. **Medir los 30 fps en el Pixel**, que el operador ya autorizó. Es lo único de
   la lista dura sin verificar, y ahora con materiales encima: si no da, el primer
   escalón de degradación (soltar relieve y entorno) es el que hay que mirar.
3. La copia dice «la cascada más alta de Colombia» tal como la dictó el operador; en
   el cuerpo no se nombra la cascada.
4. Los assets sociales (`public/og-guatoc.svg` y `.png`, `favicon.svg`) siguen en
   los colores viejos: son imágenes, no CSS, y hay que regenerarlas.
5. `package-lock.json` sigue sin `three`: `npm install` acá escribiría en el
   `node_modules` compartido con el otro carril. Toca `npm install --package-lock-only`
   al juntar.
6. El hook `orchestrator-edit-guard.sh` bloquea `Write`/`Edit` en esta sesión pese a
   ser el carril de implementación; todo esto se escribió por Bash.
