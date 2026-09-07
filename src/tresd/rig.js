// La camara del viaje.
//
// Regla dura: TODO se deriva de la posicion del viaje. Nada se acumula, asi que
// llegar a 3,2 retrocediendo da exactamente el mismo cuadro que llegar
// avanzando. El unico estado con memoria es el amortiguado, y con dt = 0 se
// anula para que la escena caiga clavada donde se le pida.
//
// La interpolacion entre claves es LINEAL con suavizado, no spline. Un
// Catmull-Rom por estas claves se pasa de largo en los pares que estan cerca
// —justo los de la entrada a la cabaca— y mete la camara dentro de la pared.

import { Vector3 } from 'three'
import { CAMERA_KEYS, ULTIMA_CLAVE } from './viaje.js'

const puntoA = new Vector3()
const puntoB = new Vector3()
const eje = new Vector3()

function suavizar(t) {
  return t * t * (3 - 2 * t)
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo)
}

export function crearRig(camara) {
  const estado = {
    objetivo: 0,
    suave: 0,
    anclas: [],
    escalaAncho: 1,
  }

  // Busca el par de claves que contiene `en` y mezcla el campo pedido.
  function muestrear(en, salida, campo) {
    const posicion = limitar(en, 0, ULTIMA_CLAVE)
    let i = 0
    while (i < CAMERA_KEYS.length - 2 && CAMERA_KEYS[i + 1].at <= posicion) i += 1
    const a = CAMERA_KEYS[i]
    const b = CAMERA_KEYS[i + 1]
    const tramo = b.at - a.at
    const t = tramo > 0 ? (posicion - a.at) / tramo : 0
    const e = suavizar(t)
    salida.set(
      a[campo][0] + (b[campo][0] - a[campo][0]) * e,
      a[campo][1] + (b[campo][1] - a[campo][1]) * e,
      a[campo][2] + (b[campo][2] - a[campo][2]) * e,
    )
    return { a, b, e }
  }

  function aplicar(en) {
    const { a, b, e } = muestrear(en, puntoA, 'position')
    muestrear(en, puntoB, 'target')

    const fov = a.fov + (b.fov - a.fov) * e
    const fit = a.fit + (b.fit - a.fit) * e
    const giro = (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * e

    // Pantalla angosta: o se retrocede sobre el eje de vista, o se abre el
    // campo. Cada clave decide con cuanto de cada cosa paga. Adentro de la
    // cabaca `fit` es 0 y se paga solo con campo: retroceder ahi saca la camara
    // por detras de la pared.
    const falta = 1 - estado.escalaAncho
    const retroceso = falta * fit * 7
    const apertura = falta * (1 - fit) * 16

    if (retroceso > 0) {
      eje.copy(puntoA).sub(puntoB).normalize()
      puntoA.addScaledVector(eje, retroceso)
    }

    camara.position.copy(puntoA)
    camara.lookAt(puntoB)
    // El giro va DESPUES: lookAt reescribe la orientacion y un roll aplicado
    // antes se pierde sin avisar.
    if (giro !== 0) camara.rotateZ((giro * Math.PI) / 180)
    camara.fov = fov + apertura
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

    // dt = 0 vuelve el amortiguado un no-op: la camara aterriza EXACTAMENTE en
    // la posicion pedida en vez de donde haya quedado el suavizado.
    avanzar(dt) {
      if (dt === 0) estado.suave = estado.objetivo
      else estado.suave += (estado.objetivo - estado.suave) * (1 - Math.exp(-dt * 3.4))
      aplicar(estado.suave)
    },

    irA(posicion) {
      estado.objetivo = limitar(posicion, 0, ULTIMA_CLAVE)
      estado.suave = estado.objetivo
      aplicar(estado.suave)
    },
  }
}
