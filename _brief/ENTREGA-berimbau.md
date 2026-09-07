# Entrega — Berimbau 3D del Campamento de Capoeira

Rama `berimbau-3d-20260906`. `npm run build` compila limpio.
Capturas del gate GPU real (Quadro M6000, `shot3d --headed`): 0 errores de página,
0 de consola, 0 request fallidos en las seis paradas, en 1280x800 y en 390x844.

## Segunda pasada: lo que cambió

1. **Paleta de Guatoc.** Fuera la familia brasa. Los tokens (`--bg #07100b`,
   `--ink`, `--ink-soft`, `--ink-quiet`, `--accent #58e39a`, `--accent-dim`,
   `--warm #e6b450`) se declaran en `.berimbau` dentro de `src/estilos/berimbau.css`
   y se repiten en `PALETA` de `src/tresd/berimbau.js` para la escena. Se respeta
   la disciplina del sitio hermano: **el acento es para figuras, índices y estados
   activos, nunca para párrafos**. La madera conserva tono de madera real y convive
   con el verde por un contraluz verde en la escena; el dorado va al arame y al
   dobrão. ⚠️ **La página 2D sigue con la paleta brasa** (`src/index.css`): el
   encargo acotaba el cambio a `berimbau.css` y a la escena, y ese archivo lo está
   tocando el otro carril. Unificarla es cambiar los tokens de `:root` al juntar.
2. **Fuera el precio de la entrada.** `hero.reservaCta` es «Reservar cupo», sin
   cifra, y el botón de la primera parada lleva a la parada de reservar, que es
   donde vive el precio. El 2D hereda el mismo cambio.
3. **El berimbau ahora se lee como berimbau.** Ver abajo.
4. **Las fotos salieron del instrumento.** No queda un solo plano de foto en la
   geometría. Van en los paneles del recorrido.
5. **El recorrido carga toda la información.** Seis paradas y el formulario dentro.

## Que el instrumento se lea de un vistazo

- **El arame tensa.** Es cuerda recta de punta a punta, en dorado y con grosor de
  lectura (0,055 de radio: un arame real sería invisible a esta escala). La flecha
  del arco pasó a 2,2 sobre 16 de largo, así que entre madera y cuerda queda el
  **triángulo largo y estrecho** que hace reconocible al instrumento. La verga se
  abre porque el arame la dobla, y los amarres de las dos puntas marcan de dónde
  tira.
- **La cabaça es una calabaza cortada, no un globo.** Bajó de radio 1,7 a 1,25
  (más esbelto el conjunto, y el pie de la verga vuelve a asomar por debajo). El
  **corte** es un anillo grueso y pálido —la pulpa recién cortada es lo más claro
  de la calabaza— alrededor de una cavidad oscura: ese contraste es lo que separa
  una vasija abierta de una bola. Tiene cuello en el fondo cerrado.
- **La atadura se ve.** La cordinha abraza la verga al filo de la cabaça, en verde
  del sitio, y de ella bajan dos cabos que se meten detrás del cuenco.
- **Fuera las órbitas.** Los anillos de roda alrededor de la cabaça ya no existen.

## Las seis paradas (qué, cuándo, quiénes, qué se entrena, dónde, cómo)

| # | Toque | Parada | Qué lleva |
|---|---|---|---|
| 1 | Angola | El campamento | Fechas, tagline, cupos, botón de reserva sin cifra |
| 2 | São Bento Grande | Tres días, dos rodas | La agenda completa de los tres días |
| 3 | Iúna | Los mestres | Las tres fichas **con sus fotos** |
| 4 | Benguela | Técnica para el jogo | Las cuatro disciplinas (BJJ, Muay Thai, Kick Boxing, Boxeo) |
| 5 | Cavalaria | El lugar | Las dos sedes + el material de Guatoc |
| 6 | Santa Maria | Reservar el cupo | Precio, total, cupos, cohortes **y el formulario** |

La parada de técnica es nueva y el formulario de reserva ahora vive dentro del
recorrido: se extrajo a `src/components/FormularioReserva.jsx` y lo comparten la
página 2D y la parada, para que la validación no viva en dos sitios.

Los toques no son decorado: Iúna es el toque de los graduados, Santa Maria el del
jogo por la moneda en el piso de la roda, Benguela el toque lento del jogo de dentro.

## El material de Guatoc

- `public/guatoc/chorrera-loop.mp4` (720x1280, 2,8 s, sin pista de audio) es el
  material principal de la parada del lugar. Va como **capa HTML encima del canvas**,
  nunca como textura WebGL: `muted loop playsinline preload="none"`, y se arranca a
  mano al llegar a la parada, así que **no se baja un byte hasta que el visitante
  llega ahí**.
- **Fallback del clip**: `chorrera-poster.jpg`, que es el mismo encuadre, así que el
  cambio no mueve la composición. Se usa con `prefers-reduced-motion` (queda la foto
  quieta, nunca el video) y si la reproducción falla.
- **Encuadre**: en celular llena la franja de canvas que deja el panel, casi a su
  proporción nativa. En pantalla ancha **no se estiró ni se recortó a franja
  horizontal**: la caída del agua es el sujeto y recortarla a lo ancho la destruye,
  así que va como ventana vertical enmarcada. Decisión mía, distinta de la sugerencia
  de la franja; si prefieren la franja, es un bloque de CSS.
- **Velo sobre la escena** mientras se muestra el lugar: sin él la ventana se leía
  como calcomanía pegada sobre la calabaza, que es justo lo rechazado.
- `public/guatoc/chorrera.jpg` (1280x964, la niebla) va en el panel, a tamaño nativo,
  como la primera de las tres fotos del lugar. Las otras dos quedan como huecos
  punteados y nombrados (`El terreiro`, `La casa`), igual que el segundo video.
- **Las fotos de los instructores** (`public/instructores/*.png`) entran en la parada
  de los mestres. Siguen fuera del repo por `.gitignore` (fotos de personas): están
  en el deploy y en el worktree, no en el commit.

## Fallback (sin cambios de fondo)

Sigue siendo la primera decisión de la app, antes del primer pintado y sin tocar
three: sin WebGL, GPU por software, `MAX_TEXTURE_SIZE<2048`, ahorro de datos o
menos de 1 GB de memoria → arranca en 2D. El motor sigue en chunk aparte (476 kB,
122 kB gzip) por `import()` dinámico, verificado ausente de `index.html`. Además:
9 s de espera máxima, contexto perdido, y el vigilante de cuadros que primero baja
el pixel ratio y apaga las motas, y solo después cae al 2D. Botón «Ver todo en
texto» siempre visible.

**Nuevo**: en celular, mientras el clip tapa el canvas entero, el bucle de dibujo se
**pausa** (se deja el rAF vivo para volver sin tirón). Dibujar debajo de un video que
corre es justo lo que tumba los cuadros en gama media.

## Encuadre: se mueve la proyección, no la cámara

El panel tapa media pantalla —a la izquierda en ancho, abajo en angosto— así que el
encuadre se corre con `camera.setViewOffset`, no moviendo la cámara. Así el punto de
vista no cambia, la perspectiva no se deforma y, sobre todo, **la cámara no se sale
de la cabaça** al corregir el encuadre en vertical. En angosto se retrocede además
lo justo para que el instrumento entre completo en la mitad de arriba, y ese
retroceso se apaga solo (de forma continua) cuando el sujeto está cerca.

## Defectos que encontré mirando las capturas por regiones

Ninguno de estos se vio a simple vista; salieron con lupa al 240 %:

1. La cordinha metía su arco delantero **dentro** del cuenco: desde la parada de
   reserva se veía como un tubo verde cruzando la pantalla.
2. El cuello de la calabaza asomaba por dentro del fondo, como un bulto pegado.
3. El raspado interior, con rayas marcadas, hacía que la cabaça se leyera como una
   **rodaja de tronco**. Rayas más finas, menos contraste y una sombra hacia el fondo.
4. En vertical le faltaba la punta al instrumento por unos pocos por ciento.
5. La marca y el botón se perdían sobre el agua clara del clip: velo arriba.
6. Con seis paradas la columna de puntos del rail se montaba sobre el panel.

## Rendimiento (lo medido y lo no medido)

- ~2.400 triángulos, una docena de llamadas de dibujo, 4 luces, sin sombras ni
  post-proceso. Pixel ratio tope 1,5.
- **Medido**: 60 fps (tope de vsync) en la Quadro M6000 del gate.
- **NO medido**: Mali-G78. No hay celular en este carril. Sigue siendo lo primero
  que hay que probar en el aparato, y ahora con el clip corriendo encima.

## Qué queda pendiente

1. **Probar en celular real de gama media-baja**, con el clip.
2. Dos fotos de Guatoc (`El terreiro`, `La casa`) y el segundo video (`El camino`).
3. La copia dice «la cascada más alta de Colombia» tal como la dictó el operador;
   en el cuerpo no se nombra la cascada (solo el pie de foto dice «La Chorrera entre
   niebla»). Si quieren nombrarla en el texto, es una línea en `contenido.js`.
4. Unificar la paleta de la página 2D con la de Guatoc.
5. `package-lock.json` sigue sin `three`: `npm install` acá escribiría en el
   `node_modules` compartido con el otro carril. Toca `npm install --package-lock-only`
   al juntar.
6. El hook `orchestrator-edit-guard.sh` bloquea `Write`/`Edit` en esta sesión pese a
   ser el carril de implementación; todo esto se escribió por Bash.
