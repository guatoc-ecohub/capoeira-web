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
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'

import { CAMARA, CABAZA, PARADAS_CON_MEDIOS } from './paradas.js'
import { PALETA, animarBrasas, construirBerimbau, construirBrasas, ponerFoto } from './berimbau.js'

const MAX_PIXEL_RATIO = 1.5
const MIN_PIXEL_RATIO = 1
const DURACION_MIN = 0.75
const DURACION_MAX = 2.8

function suavizar(t) {
  // Una sola curva de salida para todo el recorrido: sin tirones ni rebotes.
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function puntos(lista) {
  return lista.map((parada) => new Vector3(...parada.posicion))
}

function objetivos(lista) {
  return lista.map((parada) => new Vector3(...parada.objetivo))
}

export function crearEscena(opciones) {
  const {
    contenedor,
    medios,
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
  escena.fog = new FogExp2(PALETA.fondo, 0.021)

  const camara = new PerspectiveCamera(CAMARA[0].fov, 1, 0.05, 140)
  escena.add(camara)

  const hemisferio = new HemisphereLight(0xf8efdf, 0x120c06, 0.5)
  escena.add(hemisferio)

  const sol = new DirectionalLight(0xffd9a0, 0.9)
  sol.position.set(5, 7, 9)
  escena.add(sol)

  const contraluz = new DirectionalLight(PALETA.verde, 0.22)
  contraluz.position.set(-7, 2, -6)
  escena.add(contraluz)

  const { grupo, grupoCabaza, marcos, anclas } = construirBerimbau({ medios })
  escena.add(grupo)

  // Brasa adentro de la cabaca: entrar tiene que sentirse tibio.
  // La luz entra por la boca, como en una vasija de verdad: el fondo queda mas
  // oscuro que el borde. Puesta adentro se veia el punto caliente sobre la malla.
  const brasaInterior = new PointLight(PALETA.acento, 2.6, 9, 2)
  brasaInterior.position.set(0, 0.25, 0.15)
  grupoCabaza.add(brasaInterior)

  const brasas = construirBrasas(reducirMovimiento ? 70 : 130)
  escena.add(brasas)

  // Fotos reales cuando existan; si no, se queda el marco vacio.
  const cargador = new TextureLoader()
  const texturasCargadas = []
  const fotos = (medios && medios.fotos) || []
  fotos.forEach((foto, indice) => {
    if (!foto || !foto.src || !marcos[indice]) return
    cargador.load(
      foto.src,
      (textura) => {
        textura.colorSpace = SRGBColorSpace
        texturasCargadas.push(textura)
        ponerFoto(marcos[indice], textura)
      },
      undefined,
      () => {},
    )
  })

  // Anclas de video en coordenadas de mundo, para la capa HTML.
  const anclasMundo = new Map()
  grupo.updateMatrixWorld(true)
  for (const ancla of anclas) {
    anclasMundo.set(ancla.id, ancla.grupo.localToWorld(ancla.local.clone()))
  }
  const elementosAncla = new Map()

  // ------------------------------------------------------------------- camara
  const curvaPosicion = new CatmullRomCurve3(puntos(CAMARA), false, 'centripetal', 0.5)
  const curvaObjetivo = new CatmullRomCurve3(objetivos(CAMARA), false, 'centripetal', 0.5)
  const ultimaParada = CAMARA.length - 1

  let indiceActual = limitar(paradaInicial, 0, ultimaParada)
  let uDesde = indiceActual / ultimaParada
  let uHasta = uDesde
  let fovDesde = CAMARA[indiceActual].fov
  let fovHasta = fovDesde
  let progreso = 1
  let duracion = 1
  let fovActual = fovDesde

  const posicionBase = new Vector3()
  const objetivoBase = new Vector3()
  const vaiven = new Vector3()
  const proyectado = new Vector3()

  // El panel de texto tapa parte de la pantalla: abajo en vertical, a la
  // izquierda en horizontal. Corremos el encuadre para que el instrumento no
  // quede debajo del panel. Se mueve la camara, no el objetivo: la perspectiva
  // no se deforma.
  function aplicarEncuadre() {
    const distancia = camara.position.distanceTo(objetivoBase)
    // El umbral es el mismo 800px del CSS: con el panel a un lado se corre el
    // encuadre en horizontal; con el panel abajo, en vertical.
    if (lienzo.clientWidth >= 800) {
      camara.translateX(-0.2 * distancia)
      return
    }
    // En vertical el panel tapa la mitad de abajo, asi que el berimbau tiene que
    // caber en la mitad de arriba. Correr la camara sin mas lo deja sin cabeza:
    // primero se retrocede para ganar el alto que el corrimiento va a gastar.
    // Adentro de la cabaca no hay para donde retroceder, y ahi no hace falta.
    const retroceso = distancia > 3 ? 0.95 * distancia : 0
    if (retroceso > 0) camara.translateZ(retroceso)
    // El corrimiento se mide contra el ALTO VISIBLE, no contra la distancia:
    // asi el sujeto cae siempre a un cuarto de la pantalla, con cualquier fov.
    const altoVisible = 2 * (distancia + retroceso) * Math.tan((camara.fov * Math.PI) / 360)
    camara.translateY(-0.25 * altoVisible)
  }

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
    aplicarEncuadre()
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

  // -------------------------------------------------------------- capa de HTML
  function registrarAncla(id, elemento) {
    if (elemento) elementosAncla.set(id, elemento)
    else elementosAncla.delete(id)
  }

  function actualizarAnclas() {
    if (elementosAncla.size === 0) return
    const visiblesAqui = PARADAS_CON_MEDIOS.includes(indiceActual)
    const ancho = lienzo.clientWidth
    const alto = lienzo.clientHeight

    for (const [id, elemento] of elementosAncla) {
      const punto = anclasMundo.get(id)
      if (!punto) continue
      if (!visiblesAqui) {
        elemento.style.visibility = 'hidden'
        elemento.style.opacity = '0'
        continue
      }
      proyectado.copy(punto).project(camara)
      // Margen apretado: la tarjeta se centra en el ancla, asi que un ancla
      // pegada al borde deja media tarjeta colgando fuera de la pantalla.
      const dentro = proyectado.z < 1 && Math.abs(proyectado.x) < 0.86 && Math.abs(proyectado.y) < 0.86
      if (!dentro) {
        elemento.style.visibility = 'hidden'
        elemento.style.opacity = '0'
        continue
      }
      const x = (proyectado.x * 0.5 + 0.5) * ancho
      const y = (-proyectado.y * 0.5 + 0.5) * alto
      const distancia = camara.position.distanceTo(punto)
      const escala = limitar(1.9 / Math.max(distancia, 0.4), 0.55, 1.35)
      elemento.style.visibility = 'visible'
      elemento.style.opacity = '1'
      elemento.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${escala.toFixed(3)})`
    }
  }

  // ------------------------------------------------------------------ tamanos
  function redimensionar() {
    const ancho = Math.max(contenedor.clientWidth || window.innerWidth, 1)
    const alto = Math.max(contenedor.clientHeight || window.innerHeight, 1)
    camara.aspect = ancho / alto
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
      brasas.visible = false
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
    reloj += dt

    if (entrada > 0) entrada = Math.max(entrada - dt / 2.4, 0)
    if (progreso < 1) progreso = Math.min(progreso + dt / duracion, 1)
    if (!reducirMovimiento && brasas.visible) animarBrasas(brasas, dt)
    if (!reducirMovimiento) grupo.rotation.y = Math.sin(reloj * 0.11) * 0.035

    ubicarCamara(reloj)
    renderizador.render(escena, camara)
    actualizarAnclas()
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
    for (const textura of texturasCargadas) textura.dispose()

    renderizador.dispose()
    if (typeof renderizador.forceContextLoss === 'function') renderizador.forceContextLoss()
    if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo)
  }

  return {
    irA,
    registrarAncla,
    destruir,
    parada: () => indiceActual,
    // Enganche de audio: cuando existan los toques, este es el punto donde la
    // escena avisa que cambio la parada. Hoy no suena nada a proposito: el
    // navegador bloquea el autoplay sin gesto del visitante.
    radioCabaza: CABAZA.radio,
  }
}
