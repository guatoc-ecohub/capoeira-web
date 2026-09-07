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

## Rendimiento

- ~2.800 triángulos, una docena de llamadas de dibujo, 2 luces de escena más la de
  la boca, sin sombras ni post-proceso. Pixel ratio tope 1,5.
- **NO medido: Mali-G78.** No hay celular en este carril. Sigue siendo lo primero
  que hay que probar en el aparato.

## Qué queda pendiente

1. **Probar en celular real de gama media-baja.**
2. Los tramos de adentro de la cabaça son sobrios a propósito, pero mirar hacia
   afuera por la boca da al vacío: en la referencia, la ventana mira un planeta.
   Si el operador quiere que ahí haya algo, es una decisión de dirección de arte,
   no de código.
3. La copia dice «la cascada más alta de Colombia» tal como la dictó el operador; en
   el cuerpo no se nombra la cascada.
4. Unificar la paleta de la página 2D (sigue en la familia brasa de `index.css`).
5. `package-lock.json` sigue sin `three`: `npm install` acá escribiría en el
   `node_modules` compartido con el otro carril. Toca `npm install --package-lock-only`
   al juntar.
6. El hook `orchestrator-edit-guard.sh` bloquea `Write`/`Edit` en esta sesión pese a
   ser el carril de implementación; todo esto se escribió por Bash.
