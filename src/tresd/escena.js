// Mundo y bucle de dibujo. Unico modulo que importa three, y siempre entra por
// import() dinamico: si no hay WebGL, el visitante nunca lo baja.
//
// El bucle NO mide el documento. Lo unico que se lee en el camino del scroll es
// scrollY; las anclas de las secciones y el tamano del lienzo se miden aparte y
// solo cuando cambia el viewport. Medir dentro del mismo cuadro que escribe
// obliga al navegador a rehacer el layout en cada frame, y el viaje se siente
// como si fuera debajo del agua.

import {
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three'

import { CABAZA, LUZ, TELON, ULTIMA_CLAVE } from './viaje.js'
import { PALETA, animarMotas, construirBerimbau, construirMotas, construirTelon } from './berimbau.js'
import { crearRig } from './rig.js'

const MAX_PIXEL_RATIO = 1.5

function suavizar(t) {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}

export function crearEscena(opciones) {
  const {
    lienzoContenedor,
    reducirMovimiento = false,
    alFallar = () => {},
    alDegradar = () => {},
  } = opciones

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
  lienzo.className = 'viaje__lienzo'
  lienzo.setAttribute('aria-hidden', 'true')
  lienzoContenedor.appendChild(lienzo)

  const escena = new Scene()
  escena.background = new Color(PALETA.fondo)
  escena.fog = new FogExp2(PALETA.fondo, 0.013)

  const camara = new PerspectiveCamera(34, 1, 0.05, 220)
  escena.add(camara)

  // Una sola direccion de luz, y un relleno bajo para que la cara en sombra no
  // se hunda del todo. Nada mas: la sobriedad sale de aca.
  const clave = new DirectionalLight(0xfff2dc, 2.3)
  clave.position.set(...LUZ.clave).multiplyScalar(12)
  escena.add(clave)
  escena.add(new AmbientLight(0x2a4234, LUZ.relleno))

  const { grupo, cabaza, materiales } = construirBerimbau()
  escena.add(grupo)

  // La luz que entra POR la boca. Puesta justo afuera del plano de la boca, del
  // lado de quien toca: asi el fondo del cuenco queda mas oscuro que el borde,
  // que es como se ilumina una vasija de verdad.
  const luzBoca = new PointLight(PALETA.calido, 1.6, CABAZA.radioBoca * 3.2, 2)
  luzBoca.position.set(0, 0.1, 0.5)
  cabaza.add(luzBoca)

  const telon = construirTelon(materiales.telon)
  escena.add(telon)

  const motas = construirMotas(reducirMovimiento ? 32 : 56)
  escena.add(motas)

  const rig = crearRig(camara)

  // -------------------------------------------------------------- medidas
  // Todo lo que exige tocar el layout vive aca, y aca solo se entra al
  // arrancar y al cambiar de tamano.
  function medir() {
    const ancho = Math.max(window.innerWidth, 1)
    const alto = Math.max(window.innerHeight, 1)
    const arriba = window.scrollY
    const secciones = Array.from(document.querySelectorAll('[data-beat]'))
    rig.anclas = secciones.map((seccion) => Math.round(seccion.getBoundingClientRect().top + arriba))
    rig.setAncho(ancho)
    camara.aspect = ancho / alto
    camara.updateProjectionMatrix()
    renderizador.setSize(ancho, alto, false)
    rig.alDesplazar()
  }

  let pendiente = 0
  function alRedimensionar() {
    if (pendiente) return
    pendiente = requestAnimationFrame(() => {
      pendiente = 0
      medir()
    })
  }

  medir()
  window.addEventListener('resize', alRedimensionar, { passive: true })
  window.addEventListener('orientationchange', alRedimensionar, { passive: true })
  // En el camino del scroll no se mide nada: solo se lee scrollY.
  const alDesplazar = () => rig.alDesplazar()
  window.addEventListener('scroll', alDesplazar, { passive: true })

  // El raton gira el objeto en la mano, apenas. Solo raton: en tactil el dedo
  // esta scrolleando y no hay puntero que seguir.
  const alMoverPuntero = (evento) => {
    if (evento.pointerType && evento.pointerType !== 'mouse') return
    rig.setPuntero((evento.clientX / window.innerWidth) * 2 - 1, -((evento.clientY / window.innerHeight) * 2 - 1))
  }
  const alSalirPuntero = () => rig.setPuntero(0, 0)
  if (!reducirMovimiento) {
    window.addEventListener('pointermove', alMoverPuntero, { passive: true })
    window.addEventListener('pointerleave', alSalirPuntero, { passive: true })
  }

  // ---------------------------------------------------- contexto y cuadros
  let vivo = true
  function alPerderContexto(evento) {
    evento.preventDefault()
    vivo = false
    alFallar('contexto-perdido')
  }
  lienzo.addEventListener('webglcontextlost', alPerderContexto, false)

  let cuadros = 0
  let ventana = 0
  let lentas = 0
  let calentando = 1.5
  let paso = 0

  function vigilar(dt) {
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
      lentas = 0
      return
    }
    lentas += 1
    if (paso === 0 && lentas >= 2) {
      // Primer escalon: se sueltan relieve y entorno. Cuesta menos perder el
      // tratamiento de superficie que perder resolucion.
      paso = 1
      lentas = 0
      materiales.bajarCalidad()
      alDegradar()
      return
    }
    if (paso === 1 && lentas >= 2) {
      paso = 2
      lentas = 0
      pixelRatio = 1
      renderizador.setPixelRatio(pixelRatio)
      motas.visible = false
      medir()
      alDegradar()
      return
    }
    if (paso >= 2 && lentas >= 3 && fps < 20) {
      vivo = false
      alFallar('rendimiento')
    }
  }

  // ------------------------------------------------------------- el telon
  // La imagen no se pide al arrancar: se pide cuando el viaje ya va camino de
  // la boca. Y se muestra segun la posicion del viaje: aparece cuando la camara
  // retrocede desde la cabaca y se queda hasta el final.
  let telonPedido = false
  let telonListo = false
  function pedirTelon() {
    if (telonPedido) return
    telonPedido = true
    new TextureLoader().load(
      TELON.imagen,
      (imagen) => {
        imagen.colorSpace = SRGBColorSpace
        materiales.telon.map = imagen
        materiales.telon.needsUpdate = true
        telonListo = true
      },
      undefined,
      () => {}, // si no llega, el instrumento queda en el vacio y ya
    )
  }

  function acomodarTelon(posicion) {
    if (!telonPedido && posicion > TELON.pedirDesde) pedirTelon()
    const opacidad = suavizar((posicion - TELON.aparece[0]) / (TELON.aparece[1] - TELON.aparece[0]))
    materiales.telon.opacity = opacidad
    telon.visible = telonListo && opacidad > 0.004
  }

  // -------------------------------------------------------------- el bucle
  let raf = 0
  let anterior = performance.now()

  function cuadro(ahora) {
    if (!vivo) return
    raf = requestAnimationFrame(cuadro)
    const dt = Math.min((ahora - anterior) / 1000, 0.05)
    anterior = ahora
    rig.avanzar(reducirMovimiento ? 0 : dt)
    acomodarTelon(rig.suave)
    if (!reducirMovimiento && motas.visible) animarMotas(motas, dt)
    renderizador.render(escena, camara)
    vigilar(dt)
  }

  // Deja el viaje clavado en una posicion: mueve el documento a la altura que
  // le corresponde y la camara aterriza ahi sin esperar al amortiguado.
  function irA(posicion) {
    const p = Math.min(Math.max(Number(posicion) || 0, 0), ULTIMA_CLAVE)
    const arriba = rig.scrollDe(p)
    if (arriba !== null) window.scrollTo({ top: arriba, behavior: 'auto' })
    rig.irA(p)
    acomodarTelon(p)
    renderizador.render(escena, camara)
  }

  rig.avanzar(0)
  acomodarTelon(rig.suave)
  raf = requestAnimationFrame(cuadro)

  // Contrato para el arnes de capturas: clavar el viaje y leer donde quedo la
  // camara. No lo usa la pagina.
  window.__VIAJE__ = {
    irA,
    progreso: () => rig.suave,
    muestra: () => ({
      progreso: rig.suave,
      x: camara.position.x,
      y: camara.position.y,
      z: camara.position.z,
      fov: camara.fov,
    }),
  }

  function destruir() {
    vivo = false
    if (raf) cancelAnimationFrame(raf)
    if (pendiente) cancelAnimationFrame(pendiente)
    window.removeEventListener('resize', alRedimensionar)
    window.removeEventListener('orientationchange', alRedimensionar)
    window.removeEventListener('scroll', alDesplazar)
    window.removeEventListener('pointermove', alMoverPuntero)
    window.removeEventListener('pointerleave', alSalirPuntero)
    lienzo.removeEventListener('webglcontextlost', alPerderContexto)
    if (window.__VIAJE__ && window.__VIAJE__.irA === irA) delete window.__VIAJE__
    escena.traverse((objeto) => {
      if (objeto.geometry) objeto.geometry.dispose()
      const lista = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
      for (const material of lista) {
        if (!material) continue
        if (material.map) material.map.dispose()
        material.dispose()
      }
    })
    materiales.liberar()
    renderizador.dispose()
    if (typeof renderizador.forceContextLoss === 'function') renderizador.forceContextLoss()
    if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo)
  }

  return {
    destruir,
    medir,
    progreso: () => rig.suave,
    radioCabaza: CABAZA.radioBoca,
    irA,
  }
}
