// El berimbau, modelado por codigo. Poca geometria, bien resuelta.
//
// Lo que tiene que leerse de un vistazo: el arame TENSO de punta a punta, que
// dobla la verga y deja entre madera y cuerda un triangulo largo y estrecho; y
// la cabaca ATADA abajo, con volumen de calabaza, boca ovalada y PARED CON
// GROSOR. La cabaca se tornea de un perfil dibujado a mano y se construye con
// dos superficies mas un anillo de canto: por eso el borde de la boca es un
// canto y no una arista, y por eso no se lee como un tambor visto de frente.

import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  PlaneGeometry,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  RingGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three'

import { ARAME, BAQUETA, CABAZA, CORDINHA, DOBRAO, TELON, VERGA } from './viaje.js'
import { crearMateriales } from './materiales.js'

export const PALETA = {
  fondo: 0x07100b,
  ink: 0xf0f6f1,
  inkSoft: 0xc3d5c8,
  acento: 0x58e39a,
  calido: 0xe6b450,
  madera: 0x7d5730,
  maderaClara: 0xc9a978,
  cabazaFuera: 0xa87a41,
  cabazaDentro: 0x6f4f26,
  canto: 0xd8c49b,
}

const TAU = Math.PI * 2

function v3(lista) {
  return new Vector3(lista[0], lista[1], lista[2])
}

// El perfil de la calabaza, del borde de la boca al fondo: [radio, hondura].
// Mas ancha justo debajo del borde y cerrando en una panza redonda. Es aca —y no
// en mas poligonos— donde esta la diferencia entre una calabaza y un casquete.
const PERFIL = [
  [1, 0],
  [1.022, 0.12],
  [1.007, 0.28],
  [0.933, 0.47],
  [0.815, 0.645],
  [0.637, 0.79],
  [0.415, 0.908],
  [0.193, 0.975],
  [0, 1],
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
    // Normal hacia afuera del cuenco.
    const nx = ty / largo
    const ny = -tx / largo
    salida.push([Math.max(perfil[i][0] - nx * grosor, 0), perfil[i][1] - ny * grosor])
  }
  return salida
}

function puntosLathe(perfil, radio, fondo) {
  return perfil.map(([r, h]) => new Vector2(r * radio, -h * fondo))
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

// Tubo de radio variable: la verga es gruesa en el pie y esbelta en la punta.
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

function barra(desde, hasta, radio, material, lados = 5) {
  const largo = desde.distanceTo(hasta)
  const malla = new Mesh(new CylinderGeometry(radio, radio, largo, lados, 1, true), material)
  malla.position.copy(desde).add(hasta).multiplyScalar(0.5)
  malla.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), hasta.clone().sub(desde).normalize())
  return malla
}

// ------------------------------------------------------------ construccion

export function construirBerimbau() {
  const grupo = new Group()
  grupo.name = 'berimbau'

  const pie = v3(VERGA.pie)
  const punta = v3(VERGA.punta)
  const curvaVerga = new QuadraticBezierCurve3(pie, v3(VERGA.control), punta)

  const mat = crearMateriales()
  const matMadera = mat.madera
  const matCordel = mat.cordel
  const matMetal = mat.arame

  const geoVerga = tuboAhusado(curvaVerga, 44, 8, (t) => VERGA.radioPie + (VERGA.radioPunta - VERGA.radioPie) * t)
  grupo.add(new Mesh(geoVerga, matMadera))

  grupo.add(barra(pie, punta, ARAME.radio, matMetal, 6))

  const geoNudo = new TorusGeometry(0.15, 0.05, 5, 12)
  for (const extremo of [pie, punta]) {
    const nudo = new Mesh(geoNudo, matCordel)
    nudo.position.copy(extremo)
    nudo.position.y += extremo.y < 0 ? 0.42 : -0.42
    nudo.rotation.x = Math.PI / 2
    grupo.add(nudo)
  }

  // --- la cabaca --------------------------------------------------------
  const cabaza = new Group()
  cabaza.name = 'cabaza'
  cabaza.position.copy(v3(CABAZA.boca))
  cabaza.rotation.set(CABAZA.giro[0], CABAZA.giro[1], CABAZA.giro[2])
  cabaza.scale.set(1, CABAZA.achatado, 1)
  grupo.add(cabaza)

  const perfilFuera = puntosLathe(PERFIL, CABAZA.radio, CABAZA.fondo)
  const perfilDentro = puntosLathe(
    perfilInterior(PERFIL, CABAZA.pared / CABAZA.radio),
    CABAZA.radio,
    CABAZA.fondo,
  )

  // Invertido a proposito: el perfil corre del borde al fondo (Y decreciente) y
  // LatheGeometry saca las normales del orden de los puntos. Sin invertirlo, la
  // cara de afuera mira hacia adentro, la boca no se ve y la calabaza se lee
  // como una bola.
  const geoFuera = new LatheGeometry([...perfilFuera].reverse(), 44)
  const geoDentro = new LatheGeometry(perfilDentro, 44)
  // El torneado sale abierto hacia +Y; se acuesta para que la boca mire a +Z.
  geoFuera.rotateX(Math.PI / 2)
  geoDentro.rotateX(Math.PI / 2)

  cabaza.add(new Mesh(geoFuera, mat.cabazaFuera))
  mat.cabazaDentro.side = DoubleSide
  cabaza.add(new Mesh(geoDentro, mat.cabazaDentro))

  // El CANTO de la boca: el anillo que une las dos superficies. Es lo que da el
  // grosor de pared y lo que hace que la boca se lea como un borde.
  mat.canto.side = DoubleSide
  const canto = new Mesh(new RingGeometry(CABAZA.radio - CABAZA.pared, CABAZA.radio, 44), mat.canto)
  cabaza.add(canto)

  // --- la atadura -------------------------------------------------------
  const xVerga = curvaVerga.getPoint((CORDINHA.y + 8) / 16).x
  const lazo = new Mesh(new TorusGeometry(CORDINHA.radio, CORDINHA.tubo, 5, 18), matCordel)
  lazo.position.set(xVerga, CORDINHA.y, 0)
  lazo.rotation.x = Math.PI / 2
  grupo.add(lazo)

  const zFondo = CABAZA.boca[2] - CABAZA.fondo
  for (const lado of [-1, 1]) {
    grupo.add(
      barra(
        new Vector3(xVerga + lado * 0.16, CORDINHA.y - 0.05, 0.18),
        new Vector3(CABAZA.boca[0] + lado * 0.3, CABAZA.boca[1] + 0.55, zFondo + 0.12),
        0.032,
        matCordel,
        4,
      ),
    )
  }

  // --- la mano que toca -------------------------------------------------
  const dobrao = new Mesh(new CylinderGeometry(DOBRAO.radio, DOBRAO.radio, DOBRAO.grosor, 16), mat.dobrao)
  dobrao.position.set(...DOBRAO.posicion)
  dobrao.rotation.x = Math.PI / 2
  dobrao.rotation.z = 0.18
  grupo.add(dobrao)

  const baqueta = new Mesh(new CylinderGeometry(BAQUETA.radio, BAQUETA.radio * 0.78, BAQUETA.largo, 6), mat.maderaClara)
  baqueta.position.set(...BAQUETA.posicion)
  baqueta.rotation.z = Math.PI / 2 - BAQUETA.inclinacion
  baqueta.rotation.y = 0.22
  grupo.add(baqueta)

  // El TELON: lo que se ve al mirar hacia afuera por la boca. Va colgado del
  // grupo de la cabaca, asi que queda solo sobre el eje de la boca sin tener
  // que calcularlo; y va LEJOS —36 unidades— para que se lea como la vista de
  // allá afuera y no como una calcomania pegada al cuenco.
  //
  // No hace falta apagarlo en el resto del viaje: en todos los demas tramos la
  // camara mira hacia -Z y el telon le queda literalmente a la espalda. La
  // geometria sola lo resuelve.
  const telon = new Mesh(new PlaneGeometry(84, 63), mat.telon)
  telon.position.set(0, 0, TELON.distancia)
  telon.rotation.y = Math.PI // de cara al cuenco
  telon.scale.y = 1 / CABAZA.achatado // deshace el achatado de la boca
  telon.visible = false // hasta que llegue la imagen
  telon.frustumCulled = false
  cabaza.add(telon)

  return { grupo, cabaza, telon, materiales: mat }
}

// Motas de luz en el vacio. Pocas y tenues: dan profundidad sin ensuciar.
export function construirMotas(cantidad = 70) {
  const posiciones = new Float32Array(cantidad * 3)
  const velocidades = new Float32Array(cantidad)
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = Math.random() * TAU
    const radio = 3 + Math.random() * 9
    posiciones[i * 3] = Math.cos(angulo) * radio
    posiciones[i * 3 + 1] = -9 + Math.random() * 18
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio - 1
    velocidades[i] = 0.14 + Math.random() * 0.4
  }
  const geometria = new BufferGeometry()
  geometria.setAttribute('position', new Float32BufferAttribute(posiciones, 3))
  const material = new PointsMaterial({
    size: 0.16,
    map: texturaMota(),
    color: PALETA.acento,
    transparent: true,
    opacity: 0.38,
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
