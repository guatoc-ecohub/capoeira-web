// El berimbau, modelado por codigo. Poca geometria, bien resuelta.
//
// Lo que tiene que leerse de un vistazo: una vara ESBELTA y ligeramente
// irregular, doblada por el arame en un arco asimetrico —cerrado justo encima de
// la cabaca, abierto y casi recto hacia la punta—; el alambre delgado y tenso,
// amarrado con vueltas en las dos puntas y MORDIDO contra la madera por la
// cordinha a la altura de la cabaca, donde tiene un quiebre; y la cabaca a
// proporcion real, cortada de lado, con la boca mas angosta que la panza y la
// pared con grosor, colgando con la boca hacia quien toca.
//
// Las medidas viven en viaje.js. Aca solo hay construccion.

import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'

import { ARAME, BAQUETA, CABAZA, CORDINHA, CUERO, DOBRAO, TELON, VERGA } from './viaje.js'
import { crearMateriales } from './materiales.js'

export const PALETA = {
  fondo: 0x07100b,
  ink: 0xf0f6f1,
  inkSoft: 0xc3d5c8,
  acento: 0x58e39a,
  calido: 0xe6b450,
}

const TAU = Math.PI * 2
const EJE_Y = new Vector3(0, 1, 0)
const EJE_Z = new Vector3(0, 0, 1)

function v3(lista) {
  return new Vector3(lista[0], lista[1], lista[2])
}

// El perfil de la calabaza, del borde de la boca al fondo, en unidades del radio
// de la boca: [radio, hondura]. Se abre justo debajo del borde hasta la panza,
// mas ancha que la boca, y cierra en un fondo redondo. Es aca —y no en mas
// poligonos— donde esta la diferencia entre una calabaza y un casquete.
const PERFIL = [
  [1.0, 0],
  [1.09, 0.1],
  [1.22, 0.3],
  [1.33, 0.56],
  [1.37, 0.84],
  [1.33, 1.12],
  [1.2, 1.38],
  [0.98, 1.6],
  [0.68, 1.78],
  [0.36, 1.9],
  [0, 1.96],
]

// Desplaza el perfil hacia adentro por su propia normal: eso da una pared de
// grosor constante, no una copia escalada.
function perfilInterior(perfil, grosor) {
  const salida = []
  for (let i = 0; i < perfil.length; i += 1) {
    const previo = perfil[Math.max(i - 1, 0)]
    const siguiente = perfil[Math.min(i + 1, perfil.length - 1)]
    const tx = siguiente[0] - previo[0]
    const ty = siguiente[1] - previo[1]
    const largo = Math.hypot(tx, ty) || 1
    const nx = ty / largo
    const ny = -tx / largo
    salida.push([Math.max(perfil[i][0] - nx * grosor, 0), perfil[i][1] - ny * grosor])
  }
  return salida
}

function puntosLathe(perfil, escala) {
  return perfil.map(([r, h]) => new Vector2(r * escala, -h * escala))
}

// -------------------------------------------------------------- utilidades

function lienzo2d(ancho, alto, dibujar) {
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (ctx) dibujar(ctx, ancho, alto)
  const textura = new CanvasTexture(lienzo)
  textura.colorSpace = SRGBColorSpace
  textura.anisotropy = 1
  textura.needsUpdate = true
  return textura
}

function texturaMota() {
  return lienzo2d(32, 32, (ctx, w) => {
    const r = w / 2
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.35, 'rgba(88,227,154,0.75)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, w)
  })
}

// Tubo de radio variable a lo largo de una curva.
function tuboAhusado(curva, segmentos, lados, radioEn) {
  const marcos = curva.computeFrenetFrames(segmentos, false)
  const posiciones = []
  const normales = []
  const uvs = []
  const indices = []
  const punto = new Vector3()
  const normal = new Vector3()

  for (let i = 0; i <= segmentos; i += 1) {
    const t = i / segmentos
    curva.getPoint(t, punto)
    const N = marcos.normals[i]
    const B = marcos.binormals[i]
    const radio = radioEn(t)
    for (let j = 0; j <= lados; j += 1) {
      const angulo = (j / lados) * TAU
      const sin = Math.sin(angulo)
      const cos = -Math.cos(angulo)
      normal.set(cos * N.x + sin * B.x, cos * N.y + sin * B.y, cos * N.z + sin * B.z).normalize()
      posiciones.push(punto.x + radio * normal.x, punto.y + radio * normal.y, punto.z + radio * normal.z)
      normales.push(normal.x, normal.y, normal.z)
      uvs.push(t, j / lados)
    }
  }

  for (let i = 1; i <= segmentos; i += 1) {
    for (let j = 1; j <= lados; j += 1) {
      const a = (lados + 1) * (i - 1) + (j - 1)
      const b = (lados + 1) * i + (j - 1)
      const c = (lados + 1) * i + j
      const d = (lados + 1) * (i - 1) + j
      indices.push(a, b, d, b, c, d)
    }
  }

  const geometria = new BufferGeometry()
  geometria.setIndex(indices)
  geometria.setAttribute('position', new Float32BufferAttribute(posiciones, 3))
  geometria.setAttribute('normal', new Float32BufferAttribute(normales, 3))
  geometria.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  return geometria
}

function barra(desde, hasta, radioA, radioB, material, lados = 6) {
  const largo = desde.distanceTo(hasta)
  const malla = new Mesh(new CylinderGeometry(radioA, radioB, largo, lados, 1, false), material)
  malla.position.copy(desde).add(hasta).multiplyScalar(0.5)
  malla.quaternion.setFromUnitVectors(EJE_Y, hasta.clone().sub(desde).normalize())
  return malla
}

// Un anillo (una vuelta de alambre o de cuerda) alrededor de un eje.
function vuelta(centro, eje, radioMayor, radioTubo, material) {
  const anillo = new Mesh(new TorusGeometry(radioMayor, radioTubo, 5, 16), material)
  anillo.position.copy(centro)
  anillo.quaternion.setFromUnitVectors(EJE_Z, eje.clone().normalize())
  return anillo
}

// ------------------------------------------------------------ construccion

export function construirBerimbau() {
  const grupo = new Group()
  grupo.name = 'berimbau'
  const mat = crearMateriales()

  // --- la verga ---------------------------------------------------------
  const curva = new CatmullRomCurve3(VERGA.puntos.map(v3), false, 'centripetal', 0.5)

  // Grosor casi parejo con un vaiven leve: es una rama, no un torneado.
  function radioVerga(t) {
    const base = VERGA.radioPie + (VERGA.radioPunta - VERGA.radioPie) * Math.pow(t, 0.85)
    return base + 0.006 * Math.sin(t * 23 + 0.7) + 0.004 * Math.sin(t * 41 + 2.1)
  }

  // El parametro de la curva a una altura dada. La vara es monotona en Y.
  function enAltura(y) {
    let lo = 0
    let hi = 1
    const p = new Vector3()
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2
      curva.getPoint(mid, p)
      if (p.y < y) lo = mid
      else hi = mid
    }
    return (lo + hi) / 2
  }

  grupo.add(new Mesh(tuboAhusado(curva, 72, 10, radioVerga), mat.madera))

  // Las puntas cerradas: vistas de canto, un tubo abierto es un hueco.
  for (const t of [0, 1]) {
    const tapa = new Mesh(new SphereGeometry(radioVerga(t) * 0.98, 8, 6), mat.madera)
    tapa.position.copy(curva.getPoint(t))
    grupo.add(tapa)
  }

  // El cuero del pie, alineado con la vara.
  const tCuero = enAltura(VERGA.puntos[0][1] + CUERO.largo / 2)
  const cuero = new Mesh(new CylinderGeometry(CUERO.radio, CUERO.radio * 0.9, CUERO.largo, 12, 1, false), mat.cuero)
  cuero.position.copy(curva.getPoint(tCuero))
  cuero.quaternion.setFromUnitVectors(EJE_Y, curva.getTangent(tCuero))
  grupo.add(cuero)

  // --- el arame ---------------------------------------------------------
  // Tres puntos: donde se amarra en la punta, donde la cordinha lo muerde
  // contra la madera, y donde se amarra en el pie. Corre por el lado -X de la
  // vara, pegado a ella; el quiebre en la atadura es la tension hecha visible.
  function puntoArame(y, holgura) {
    const t = enAltura(y)
    const centro = curva.getPoint(t)
    return new Vector3(centro.x - (radioVerga(t) + ARAME.radio + holgura), y, centro.z)
  }
  const anclaPunta = puntoArame(ARAME.yPunta, 0.005)
  const atadura = puntoArame(ARAME.yAtadura, 0.012)
  const anclaPie = puntoArame(ARAME.yPie, CUERO.radio - radioVerga(0) + 0.005)

  grupo.add(barra(anclaPunta, atadura, ARAME.radio, ARAME.radio, mat.arame, 7))
  grupo.add(barra(atadura, anclaPie, ARAME.radio, ARAME.radio, mat.arame, 7))

  // Las vueltas que lo amarran: alrededor de la madera en la punta, alrededor
  // del cuero en el pie.
  for (let i = 0; i < ARAME.vueltas; i += 1) {
    const yPunta = ARAME.yPunta - i * ARAME.radio * 2.4
    const tp = enAltura(yPunta)
    grupo.add(vuelta(curva.getPoint(tp), curva.getTangent(tp), radioVerga(tp) + ARAME.radio * 0.6, ARAME.radio, mat.arame))
    const yPie = ARAME.yPie + i * ARAME.radio * 2.4
    const tb = enAltura(yPie)
    grupo.add(vuelta(curva.getPoint(tb), curva.getTangent(tb), CUERO.radio + ARAME.radio * 0.6, ARAME.radio, mat.arame))
  }

  // --- la cabaca --------------------------------------------------------
  // El torneado abre hacia +Z local; el cuaternion lleva ese +Z a la normal de
  // la boca, asi que la boca mira hacia donde dice viaje.js.
  const cabaza = new Group()
  cabaza.name = 'cabaza'
  cabaza.position.copy(v3(CABAZA.boca))
  cabaza.quaternion.setFromUnitVectors(EJE_Z, v3(CABAZA.normal).normalize())
  cabaza.scale.set(1, CABAZA.achatado, 1)
  grupo.add(cabaza)

  const perfilFuera = puntosLathe(PERFIL, CABAZA.radioBoca)
  const perfilDentro = puntosLathe(perfilInterior(PERFIL, CABAZA.pared / CABAZA.radioBoca), CABAZA.radioBoca)

  // Invertido a proposito: el perfil corre del borde al fondo (Y decreciente) y
  // LatheGeometry saca las normales del orden de los puntos. Sin invertirlo, la
  // cara de afuera mira hacia adentro y la calabaza se lee como una bola.
  const geoFuera = new LatheGeometry([...perfilFuera].reverse(), 40)
  const geoDentro = new LatheGeometry(perfilDentro, 40)
  // El torneado sale abierto hacia +Y; se acuesta para que la boca mire a +Z local.
  geoFuera.rotateX(Math.PI / 2)
  geoDentro.rotateX(Math.PI / 2)

  cabaza.add(new Mesh(geoFuera, mat.cabazaFuera))
  mat.cabazaDentro.side = DoubleSide
  cabaza.add(new Mesh(geoDentro, mat.cabazaDentro))

  // El CANTO de la boca: el anillo que une las dos superficies. Es lo que da el
  // grosor de pared y lo que hace que la boca se lea como un borde.
  mat.canto.side = DoubleSide
  cabaza.add(new Mesh(new RingGeometry(CABAZA.radioBoca - CABAZA.pared, CABAZA.radioBoca, 40), mat.canto))

  // La cicatriz del tallo en el fondo: una calabaza no es una esfera lisa.
  const fondo = PERFIL[PERFIL.length - 1][1] * CABAZA.radioBoca
  const boton = new Mesh(new CylinderGeometry(0.05, 0.075, 0.06, 8), mat.cuero)
  boton.position.set(0, 0, -fondo + 0.015)
  boton.rotation.x = Math.PI / 2
  cabaza.add(boton)

  // --- la cordinha ------------------------------------------------------
  // Una sola cuerda: sube de un agujero del borde, da la vuelta alrededor de la
  // madera Y del alambre —mordiendolos juntos— y baja al otro agujero. Los
  // agujeros van en el punto del borde mas cercano al arco, uno a cada lado.
  cabaza.updateMatrixWorld(true)
  const tAtadura = enAltura(CORDINHA.y)
  const madera = curva.getPoint(tAtadura)
  const rMadera = radioVerga(tAtadura)
  const xMedio = (madera.x + atadura.x) / 2
  const holgura = CORDINHA.tubo + 0.012
  const trasero = new Vector3(xMedio + 0.05, CORDINHA.y - 0.04, rMadera + holgura)
  const enBorde = (grados) => {
    const a = grados * (Math.PI / 180)
    const r = CABAZA.radioBoca - CABAZA.pared * 0.5
    return cabaza.localToWorld(new Vector3(Math.cos(a) * r, Math.sin(a) * r, 0))
  }
  let anguloCercano = 0
  let menor = Infinity
  for (let g = 0; g < 360; g += 2) {
    const d = enBorde(g).distanceTo(trasero)
    if (d < menor) {
      menor = d
      anguloCercano = g
    }
  }
  const cordinha = new CatmullRomCurve3(
    [
      enBorde(anguloCercano - CABAZA.separacionAgujeros),
      new Vector3(atadura.x - ARAME.radio - holgura, CORDINHA.y - 0.03, -0.02),
      new Vector3(xMedio, CORDINHA.y + 0.02, -(rMadera + holgura)),
      new Vector3(madera.x + rMadera + holgura, CORDINHA.y, 0.02),
      trasero,
      enBorde(anguloCercano + CABAZA.separacionAgujeros),
    ],
    false,
    'centripetal',
  )
  grupo.add(new Mesh(new TubeGeometry(cordinha, 48, CORDINHA.tubo, 6, false), mat.cordel))

  // --- la mano que toca -------------------------------------------------
  // El dobrao, apretado contra el alambre un palmo encima de la atadura.
  const normalDobrao = v3(DOBRAO.normal).normalize()
  const sobreArame = atadura.clone().lerp(anclaPunta, (DOBRAO.y - atadura.y) / (anclaPunta.y - atadura.y))
  const dobrao = new Mesh(new CylinderGeometry(DOBRAO.radio, DOBRAO.radio, DOBRAO.grosor, 20), mat.dobrao)
  dobrao.position.copy(sobreArame).addScaledVector(normalDobrao, DOBRAO.grosor / 2 + ARAME.radio)
  dobrao.quaternion.setFromUnitVectors(EJE_Y, normalDobrao)
  grupo.add(dobrao)

  // La baqueta, en reposo: apoyada dentro del arco, del hombro de la
  // calabaza a la cara interna de la madera. Una varilla fina.
  grupo.add(barra(v3(BAQUETA.desde), v3(BAQUETA.hasta), BAQUETA.radio, BAQUETA.radio * 0.8, mat.maderaClara, 7))

  return { grupo, cabaza, materiales: mat }
}

// El TELON: el valle de Guatoc, lejos, detras del instrumento. Va en el mundo,
// no colgado de ninguna pieza; mira al instrumento. Su opacidad la maneja la
// escena segun la posicion del viaje.
export function construirTelon(material) {
  const telon = new Mesh(new PlaneGeometry(TELON.ancho, TELON.alto), material)
  telon.position.set(...TELON.posicion)
  telon.lookAt(0, TELON.posicion[1], 0)
  telon.visible = false // hasta que llegue la imagen y el viaje lo pida
  telon.frustumCulled = false
  return telon
}

// Motas de luz en el vacio. Pocas y tenues: dan profundidad sin ensuciar.
export function construirMotas(cantidad = 56) {
  const posiciones = new Float32Array(cantidad * 3)
  const velocidades = new Float32Array(cantidad)
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = Math.random() * TAU
    const radio = 3 + Math.random() * 10
    posiciones[i * 3] = Math.cos(angulo) * radio + 1
    posiciones[i * 3 + 1] = -9 + Math.random() * 18
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio
    velocidades[i] = 0.12 + Math.random() * 0.35
  }
  const geometria = new BufferGeometry()
  geometria.setAttribute('position', new Float32BufferAttribute(posiciones, 3))
  const material = new PointsMaterial({
    size: 0.14,
    map: texturaMota(),
    color: PALETA.acento,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  })
  const puntos = new Points(geometria, material)
  puntos.frustumCulled = false
  puntos.userData.velocidades = velocidades
  return puntos
}

export function animarMotas(puntos, dt) {
  const atributo = puntos.geometry.attributes.position
  const velocidades = puntos.userData.velocidades
  const arreglo = atributo.array
  for (let i = 0; i < velocidades.length; i += 1) {
    const indiceY = i * 3 + 1
    arreglo[indiceY] += velocidades[i] * dt
    if (arreglo[indiceY] > 9.5) arreglo[indiceY] = -9.5
  }
  atributo.needsUpdate = true
}
