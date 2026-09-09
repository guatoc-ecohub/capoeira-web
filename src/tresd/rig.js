// La camara del viaje.
//
// Regla dura: TODO se deriva de la posicion del viaje. Nada se acumula, asi que
// llegar a 3,2 retrocediendo da exactamente el mismo cuadro que llegar
// avanzando. El unico estado con memoria es el amortiguado, y con dt = 0 se
// anula para que la escena caiga clavada donde se le pida.
//
// Se interpola SOBRE LOS PARAMETROS DEL GIRO —azimut, elevacion, distancia,
// enfoque— y de ellos se saca la posicion. Asi entre dos claves la camara viaja
// por un arco alrededor del instrumento; interpolar posiciones la mandaba por la
// cuerda recta, que se acerca de mas al objeto a mitad de camino. La mezcla es
// lineal con suavizado por tramo: la camara llega frenando al cuadro de cada
// parada y se queda casi quieta mientras se lee su cabeza.

import { Vector3 } from 'three'
import { CAMERA_KEYS, ULTIMA_CLAVE } from './viaje.js'

const GRADOS = Math.PI / 180
const ARRIBA = new Vector3(0, 1, 0)

const foco = new Vector3()
const posicion = new Vector3()
const adelante = new Vector3()
const derecha = new Vector3()
const objetivo = new Vector3()

function suavizar(t) {
  return t * t * (3 - 2 * t)
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function mezclar(a, b, e) {
  return a + (b - a) * e
}

export function crearRig(camara) {
  const estado = {
    objetivo: 0,
    suave: 0,
    anclas: [],
    escalaAncho: 1,
    puntero: { x: 0, y: 0 },
    punteroSuave: { x: 0, y: 0 },
  }

  const clave = {
    azimut: 0,
    elevacion: 0,
    distancia: 1,
    derecha: 0,
    fov: 40,
    fit: 1,
    roll: 0,
  }

  // Busca el par de claves que contiene `en` y mezcla todos los campos.
  function muestrear(en) {
    const p = limitar(en, 0, ULTIMA_CLAVE)
    let i = 0
    while (i < CAMERA_KEYS.length - 2 && CAMERA_KEYS[i + 1].at <= p) i += 1
    const a = CAMERA_KEYS[i]
    const b = CAMERA_KEYS[i + 1]
    const tramo = b.at - a.at
    const t = tramo > 0 ? (p - a.at) / tramo : 0
    const e = suavizar(t)
    clave.azimut = mezclar(a.azimut, b.azimut, e)
    clave.elevacion = mezclar(a.elevacion, b.elevacion, e)
    clave.distancia = mezclar(a.distancia, b.distancia, e)
    clave.derecha = mezclar(a.derecha, b.derecha, e)
    clave.fov = mezclar(a.fov, b.fov, e)
    clave.fit = mezclar(a.fit, b.fit, e)
    clave.roll = mezclar(a.roll ?? 0, b.roll ?? 0, e)
    foco.set(
      mezclar(a.foco[0], b.foco[0], e),
      mezclar(a.foco[1], b.foco[1], e),
      mezclar(a.foco[2], b.foco[2], e),
    )
  }

  function aplicar(en) {
    muestrear(en)

    // Pantalla angosta: o se retrocede sobre el eje de vista, o se abre el
    // campo. El retroceso es PROPORCIONAL a la distancia: siete unidades fijas
    // eran nada en el plano general y un salto en el primer plano.
    const falta = 1 - estado.escalaAncho
    const distancia = clave.distancia * (1 + falta * clave.fit * 0.45)
    const fov = clave.fov + falta * (1 - clave.fit) * 14
    // Sin columna segura, el instrumento va al centro.
    const corrimiento = clave.derecha * estado.escalaAncho

    // El puntero gira el objeto en la mano, apenas: un grado largo, y menos a
    // medida que el viaje se acerca a los primeros planos.
    const paralaje = 1 - Math.min(en / 2.5, 1) * 0.6
    const azimut = (clave.azimut + estado.punteroSuave.x * 1.4 * paralaje) * GRADOS
    const elevacion = (clave.elevacion + estado.punteroSuave.y * 0.9 * paralaje) * GRADOS

    posicion.set(
      foco.x + Math.sin(azimut) * Math.cos(elevacion) * distancia,
      foco.y + Math.sin(elevacion) * distancia,
      foco.z + Math.cos(azimut) * Math.cos(elevacion) * distancia,
    )

    // El enfoque se corre a la derecha del cuadro: se mira un punto a la
    // izquierda del enfoque, sobre el eje horizontal de la camara.
    adelante.copy(foco).sub(posicion).normalize()
    derecha.crossVectors(adelante, ARRIBA).normalize()
    const semiancho = distancia * Math.tan((fov / 2) * GRADOS) * camara.aspect
    objetivo.copy(foco).addScaledVector(derecha, -corrimiento * semiancho)

    camara.position.copy(posicion)
    camara.lookAt(objetivo)
    // El giro va DESPUES: lookAt reescribe la orientacion y un roll aplicado
    // antes se pierde sin avisar.
    if (clave.roll !== 0) camara.rotateZ(clave.roll * GRADOS)
    camara.fov = fov
    camara.updateProjectionMatrix()
  }

  return {
    estado,
    get suave() {
      return estado.suave
    },

    set anclas(lista) {
      estado.anclas = lista
    },
    get anclas() {
      return estado.anclas
    },

    // El ancho decide cuanto hay que compensar. 1 = pantalla comoda.
    setAncho(ancho) {
      estado.escalaAncho = limitar((ancho - 380) / (1180 - 380), 0, 1)
    },

    // -1..1 en cada eje. Solo del raton: en tactil no hay puntero que siga.
    setPuntero(x, y) {
      estado.puntero.x = limitar(x || 0, -1, 1)
      estado.puntero.y = limitar(y || 0, -1, 1)
    },

    // Lo unico que se lee del documento en el camino del scroll: scrollY. Las
    // anclas se miden aparte y solo cuando cambia el tamano.
    alDesplazar() {
      const anclas = estado.anclas
      if (anclas.length < 2) return
      const arriba = window.scrollY
      let i = 0
      while (i < anclas.length - 2 && anclas[i + 1] <= arriba) i += 1
      const tramo = anclas[i + 1] - anclas[i]
      const t = tramo > 0 ? (arriba - anclas[i]) / tramo : 0
      estado.objetivo = limitar(i + t, 0, ULTIMA_CLAVE)
    },

    // La posicion de scroll que corresponde a un punto del viaje. Inversa de
    // alDesplazar; sirve para clavar el viaje desde afuera.
    scrollDe(posicionViaje) {
      const anclas = estado.anclas
      if (anclas.length < 2) return null
      const p = limitar(posicionViaje, 0, ULTIMA_CLAVE)
      const i = Math.min(anclas.length - 2, Math.floor(p))
      return anclas[i] + (anclas[i + 1] - anclas[i]) * (p - i)
    },

    // dt = 0 vuelve el amortiguado un no-op: la camara aterriza EXACTAMENTE en
    // la posicion pedida en vez de donde haya quedado el suavizado.
    avanzar(dt) {
      if (dt === 0) {
        estado.suave = estado.objetivo
        estado.punteroSuave.x = estado.puntero.x
        estado.punteroSuave.y = estado.puntero.y
      } else {
        estado.suave += (estado.objetivo - estado.suave) * (1 - Math.exp(-dt * 3.4))
        const k = 1 - Math.exp(-dt * 2.2)
        estado.punteroSuave.x += (estado.puntero.x - estado.punteroSuave.x) * k
        estado.punteroSuave.y += (estado.puntero.y - estado.punteroSuave.y) * k
      }
      aplicar(estado.suave)
    },

    irA(posicionViaje) {
      estado.objetivo = limitar(posicionViaje, 0, ULTIMA_CLAVE)
      estado.suave = estado.objetivo
      estado.punteroSuave.x = estado.puntero.x
      estado.punteroSuave.y = estado.puntero.y
      aplicar(estado.suave)
    },
  }
}
