// Escena, camara por keyframes y bucle de dibujo.
// Este modulo es el unico que importa three y siempre se carga con import()
// dinamico: si no hay WebGL, el visitante nunca lo baja.

import {
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'

import { CABAZA, CAMARA } from './paradas.js'
import { PALETA, animarMotas, construirBerimbau, construirMotas } from './berimbau.js'

const MAX_PIXEL_RATIO = 1.5
const MIN_PIXEL_RATIO = 1
const DURACION_MIN = 0.75
const DURACION_MAX = 2.8
const ANCHO_ANGOSTO = 800 // el mismo corte que usa el CSS para mover el panel

function suavizar(t) {
  // Una sola curva de salida para todo el recorrido: sin tirones ni rebotes.
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function transicionSuave(valor, borde0, borde1) {
  const t = limitar((valor - borde0) / (borde1 - borde0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function crearEscena(opciones) {
  const {
    contenedor,
    reducirMovimiento = false,
    paradaInicial = 0,
    alFallar = () => {},
    alDegradar = () => {},
  } = opciones

  // ------------------------------------------------------------ renderizador
  let renderizador
  try {
    renderizador = new WebGLRenderer({
      antialias: window.devicePixelRatio < 1.5,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    })
  } catch (error) {
    alFallar('arranque', error)
    return null
  }

  let pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
  renderizador.setPixelRatio(pixelRatio)
  renderizador.outputColorSpace = SRGBColorSpace
  renderizador.shadowMap.enabled = false
  renderizador.setClearColor(new Color(PALETA.fondo), 1)

  const lienzo = renderizador.domElement
  lienzo.className = 'berimbau__lienzo'
  lienzo.setAttribute('aria-hidden', 'true')
  contenedor.appendChild(lienzo)

  // -------------------------------------------------------------------- escena
  const escena = new Scene()
  escena.background = new Color(PALETA.fondo)
  escena.fog = new FogExp2(PALETA.fondo, 0.019)

  const camara = new PerspectiveCamera(CAMARA[0].fov, 1, 0.05, 140)
  escena.add(camara)

  // Luz de noche verde: cielo frio arriba, tierra casi negra abajo.
  escena.add(new HemisphereLight(PALETA.inkSoft, 0x060d08, 0.5))

  const clave = new DirectionalLight(PALETA.ink, 0.85)
  clave.position.set(5, 7, 9)
  escena.add(clave)

  // Contraluz verde: es lo que hace que la madera conviva con el acento en vez
  // de pelearse con el.
  const contraluz = new DirectionalLight(PALETA.acento, 0.45)
  contraluz.position.set(-7, 2, -6)
  escena.add(contraluz)

  const { grupo, grupoCabaza } = construirBerimbau()
  escena.add(grupo)

  // Luz calida adentro de la cabaca, entrando por la boca: el fondo queda mas
  // oscuro que el borde, como en una vasija de verdad.
  const brasaInterior = new PointLight(PALETA.calido, 2.4, 6.5, 2)
  brasaInterior.position.set(0, 0.15, 0.35)
  grupoCabaza.add(brasaInterior)

  const motas = construirMotas(reducirMovimiento ? 60 : 120)
  escena.add(motas)

  // ------------------------------------------------------------------- camara
  const curvaPosicion = new CatmullRomCurve3(CAMARA.map((p) => new Vector3(...p.posicion)), false, 'centripetal', 0.5)
  const curvaObjetivo = new CatmullRomCurve3(CAMARA.map((p) => new Vector3(...p.objetivo)), false, 'centripetal', 0.5)
  const ultimaParada = CAMARA.length - 1

  let indiceActual = limitar(paradaInicial, 0, ultimaParada)
  let uDesde = indiceActual / ultimaParada
  let uHasta = uDesde
  let fovDesde = CAMARA[indiceActual].fov
  let fovHasta = fovDesde
  let progreso = 1
  let duracion = 1
  let fovActual = fovDesde
  let angosto = false

  const posicionBase = new Vector3()
  const objetivoBase = new Vector3()
  const vaiven = new Vector3()

  // Entrada: un unico acercamiento al cargar. Con prefers-reduced-motion no corre.
  let entrada = reducirMovimiento ? 0 : 1

  function ubicarCamara(tiempo) {
    const t = suavizar(limitar(progreso, 0, 1))
    const u = uDesde + (uHasta - uDesde) * t
    curvaPosicion.getPoint(u, posicionBase)
    curvaObjetivo.getPoint(u, objetivoBase)

    if (entrada > 0) {
      const alejar = 1 + 0.42 * suavizar(entrada)
      posicionBase.sub(objetivoBase).multiplyScalar(alejar).add(objetivoBase)
    }

    // En vertical el panel se come la mitad de abajo, asi que el instrumento
    // tiene que caber en la mitad de arriba: se retrocede para ganar el alto
    // que el corrimiento de encuadre va a gastar. Adentro de la cabaca no hay
    // para donde retroceder y tampoco hace falta, asi que el retroceso se apaga
    // solo cuando el sujeto esta cerca (y lo hace de forma continua, para no
    // dar un salto a mitad de una transicion).
    if (angosto) {
      const distancia = posicionBase.distanceTo(objetivoBase)
      const mezcla = transicionSuave(distancia, 2.5, 5)
      if (mezcla > 0) posicionBase.sub(objetivoBase).multiplyScalar(1 + 0.85 * mezcla).add(objetivoBase)
    }

    const fov = fovDesde + (fovHasta - fovDesde) * t
    if (Math.abs(fov - fovActual) > 0.01) {
      fovActual = fov
      camara.fov = fov
      camara.updateProjectionMatrix()
    }

    if (reducirMovimiento) {
      vaiven.set(0, 0, 0)
    } else {
      const amplitud = 0.045
      vaiven.set(Math.sin(tiempo * 0.34) * amplitud, Math.cos(tiempo * 0.27) * amplitud * 0.7, 0)
    }

    camara.position.copy(posicionBase).add(vaiven)
    camara.lookAt(objetivoBase)
  }

  function irA(indice, inmediato = false) {
    const destino = limitar(Math.round(indice), 0, ultimaParada)
    const uAhora = uDesde + (uHasta - uDesde) * suavizar(limitar(progreso, 0, 1))
    uDesde = uAhora
    uHasta = destino / ultimaParada
    fovDesde = fovActual
    fovHasta = CAMARA[destino].fov
    indiceActual = destino

    if (inmediato || reducirMovimiento) {
      uDesde = uHasta
      progreso = 1
      duracion = 1
      fovDesde = fovHasta
    } else {
      duracion = limitar(DURACION_MIN + Math.abs(uHasta - uDesde) * 3.4, DURACION_MIN, DURACION_MAX)
      progreso = 0
    }
    return indiceActual
  }

  // ------------------------------------------------------------------ tamanos
  function redimensionar() {
    const ancho = Math.max(contenedor.clientWidth || window.innerWidth, 1)
    const alto = Math.max(contenedor.clientHeight || window.innerHeight, 1)
    angosto = ancho < ANCHO_ANGOSTO
    camara.aspect = ancho / alto
    // El panel de texto tapa parte de la pantalla: a la izquierda en ancho,
    // abajo en angosto. Se corre la PROYECCION, no la camara: asi el encuadre
    // se acomoda sin tocar el punto de vista ni sacar la camara de la cabaca.
    if (angosto) camara.setViewOffset(ancho, alto, 0, alto * 0.25, ancho, alto)
    else camara.setViewOffset(ancho, alto, -ancho * 0.15, 0, ancho, alto)
    camara.updateProjectionMatrix()
    renderizador.setSize(ancho, alto, false)
  }
  redimensionar()

  let pendienteResize = 0
  function alRedimensionar() {
    if (pendienteResize) return
    pendienteResize = requestAnimationFrame(() => {
      pendienteResize = 0
      redimensionar()
    })
  }

  const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(alRedimensionar) : null
  if (observador) observador.observe(contenedor)
  window.addEventListener('resize', alRedimensionar, { passive: true })
  window.addEventListener('orientationchange', alRedimensionar, { passive: true })

  // ------------------------------------------------------------ contexto y fps
  let vivo = true
  let pausado = false

  function alPerderContexto(evento) {
    evento.preventDefault()
    vivo = false
    alFallar('contexto-perdido')
  }
  lienzo.addEventListener('webglcontextlost', alPerderContexto, false)

  let cuadros = 0
  let ventana = 0
  let ventanasLentas = 0
  let calentando = 1.5
  let degradado = false

  function vigilarRendimiento(dt) {
    if (calentando > 0) {
      calentando -= dt
      return
    }
    cuadros += 1
    ventana += dt
    if (ventana < 1) return

    const fps = cuadros / ventana
    cuadros = 0
    ventana = 0

    if (fps >= 26) {
      ventanasLentas = 0
      return
    }

    ventanasLentas += 1
    if (!degradado && ventanasLentas >= 2) {
      // Primero se baja la resolucion: es lo que mas cuesta en gama media.
      degradado = true
      ventanasLentas = 0
      pixelRatio = MIN_PIXEL_RATIO
      renderizador.setPixelRatio(pixelRatio)
      motas.visible = false
      redimensionar()
      alDegradar()
      return
    }
    if (degradado && ventanasLentas >= 3 && fps < 20) {
      vivo = false
      alFallar('rendimiento')
    }
  }

  // -------------------------------------------------------------------- bucle
  let raf = 0
  let anterior = performance.now()
  let reloj = 0

  function bucle(ahora) {
    if (!vivo) return
    raf = requestAnimationFrame(bucle)
    const dt = Math.min((ahora - anterior) / 1000, 0.06)
    anterior = ahora

    // Pausado: el canvas esta tapado por otra capa. Se deja el rAF vivo para
    // volver sin tiron, pero no se dibuja: dibujar debajo de un video que corre
    // es justo lo que tumba los cuadros en gama media.
    if (pausado) return

    reloj += dt
    if (entrada > 0) entrada = Math.max(entrada - dt / 2.4, 0)
    if (progreso < 1) progreso = Math.min(progreso + dt / duracion, 1)
    if (!reducirMovimiento && motas.visible) animarMotas(motas, dt)
    if (!reducirMovimiento) grupo.rotation.y = Math.sin(reloj * 0.11) * 0.03

    ubicarCamara(reloj)
    renderizador.render(escena, camara)
    vigilarRendimiento(dt)
  }

  ubicarCamara(0)
  raf = requestAnimationFrame(bucle)

  // ------------------------------------------------------------------ limpieza
  function destruir() {
    vivo = false
    if (raf) cancelAnimationFrame(raf)
    if (pendienteResize) cancelAnimationFrame(pendienteResize)
    if (observador) observador.disconnect()
    window.removeEventListener('resize', alRedimensionar)
    window.removeEventListener('orientationchange', alRedimensionar)
    lienzo.removeEventListener('webglcontextlost', alPerderContexto)

    escena.traverse((objeto) => {
      if (objeto.geometry) objeto.geometry.dispose()
      const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
      for (const material of materiales) {
        if (!material) continue
        if (material.map) material.map.dispose()
        material.dispose()
      }
    })

    renderizador.dispose()
    if (typeof renderizador.forceContextLoss === 'function') renderizador.forceContextLoss()
    if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo)
  }

  return {
    irA,
    destruir,
    pausar(valor) {
      pausado = Boolean(valor)
      if (!pausado) anterior = performance.now()
    },
    parada: () => indiceActual,
    radioCabaza: CABAZA.radio,
  }
}
