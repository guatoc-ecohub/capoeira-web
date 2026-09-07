// El berimbau modelado por codigo. Nada de modelos descargados.
// Presupuesto: menos de 2.500 triangulos y una docena de llamadas de dibujo,
// para que un Mali-G78 sostenga los 30 cuadros sin sombras ni post-proceso.
//
// Lo que tiene que leerse de un vistazo, en este orden:
//   1. el arame TENSO de punta a punta, que dobla la verga;
//   2. el triangulo largo y estrecho entre madera y cuerda;
//   3. la cabaca ATADA abajo, cortada y con la boca al frente.

import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'

import { ARAME, BAQUETA, CABAZA, CORDINHA, DOBRAO, VERGA } from './paradas.js'

// Paleta de Guatoc. La madera conserva tono de madera real, pero apagada y
// calida para que conviva con el verde en vez de pelearse con el.
export const PALETA = {
  fondo: 0x07100b,
  ink: 0xf0f6f1,
  inkSoft: 0xc3d5c8,
  acento: 0x58e39a,
  acentoDim: 0x2e9463,
  calido: 0xe6b450,
  madera: 0x8a6236,
  maderaClara: 0xc9a978,
  cabazaFuera: 0xb98f4e,
  cabazaDentro: 0x7d5a2c,
  corte: 0xd9c39a,
}

const TAU = Math.PI * 2

function v3(lista) {
  return new Vector3(lista[0], lista[1], lista[2])
}

// ---------------------------------------------------------------- utilidades

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

// El interior de una calabaza cortada esta raspado: anillos concentricos.
// En una esfera la V corre del borde al polo, asi que unas bandas horizontales
// se leen como anillos alrededor del fondo.
function texturaRaspado() {
  const textura = lienzo2d(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#a67f4c'
    ctx.fillRect(0, 0, w, h)
    // Rayas finas y de poco contraste: marcadas se leen como anillos de tronco
    // y la cabaca pasa a parecer una rodaja de palo.
    for (let i = 0; i < 90; i += 1) {
      const y = (i / 90) * h + Math.sin(i * 2.7) * 1.5
      ctx.fillStyle = Math.sin(i * 1.9) > 0 ? 'rgba(255,232,192,0.05)' : 'rgba(70,46,20,0.07)'
      ctx.fillRect(0, y, w, 1)
    }
    // El fondo del cuenco queda mas oscuro que el borde: es lo que hace que se
    // lea como cavidad y no como disco.
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(24,14,4,0.62)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  })
  textura.wrapS = RepeatWrapping
  textura.repeat.set(2, 1)
  return textura
}

function texturaMota(color) {
  return lienzo2d(32, 32, (ctx, w) => {
    const r = w / 2
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.35, color)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, w)
  })
}

// Tubo de radio variable: la verga es gruesa abajo y delgada arriba.
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

// Cuenco abollado: una calabaza seca no es un balon partido.
function geometriaCabaza(radio, fondo) {
  const geometria = new SphereGeometry(radio, 24, 12, 0, TAU, 0, Math.PI / 2)
  const posicion = geometria.attributes.position
  const punto = new Vector3()
  for (let i = 0; i < posicion.count; i += 1) {
    punto.fromBufferAttribute(posicion, i)
    const altura = Math.min(Math.max(punto.y / radio, 0), 1) // 0 en la boca, 1 en el polo
    const azimut = Math.atan2(punto.z, punto.x)
    // El bulto se apaga en la boca Y en el polo: sobre el polo convergen todos
    // los triangulos y cualquier deformacion ahi se ve como un abanico de rayas.
    const peso = Math.sin(altura * Math.PI)
    const bulto = 1 + peso * (0.06 * Math.sin(azimut * 3) + 0.04 * Math.cos(azimut * 2 + 1.1) - 0.02)
    punto.multiplyScalar(bulto)
    punto.y *= fondo
    posicion.setXYZ(i, punto.x, punto.y, punto.z)
  }
  geometria.computeVertexNormals()
  // Boca hacia +Z: el visitante entra de frente.
  geometria.rotateX(-Math.PI / 2)
  return geometria
}

// Cilindro entre dos puntos, para los cordeles cortos.
function barra(desde, hasta, radio, material, lados = 5) {
  const largo = desde.distanceTo(hasta)
  const malla = new Mesh(new CylinderGeometry(radio, radio, largo, lados, 1, true), material)
  malla.position.copy(desde).add(hasta).multiplyScalar(0.5)
  malla.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), hasta.clone().sub(desde).normalize())
  return malla
}

// -------------------------------------------------------------- construccion

export function construirBerimbau() {
  const grupo = new Group()
  grupo.name = 'berimbau'

  const pie = v3(VERGA.pieBase)
  const punta = v3(VERGA.punta)
  const curvaVerga = new QuadraticBezierCurve3(pie, v3(VERGA.control), punta)

  const matMadera = new MeshPhongMaterial({ color: PALETA.madera, shininess: 18, specular: 0x2a2214 })
  const matCordel = new MeshLambertMaterial({ color: PALETA.acento })
  const matMetal = new MeshPhongMaterial({ color: PALETA.calido, shininess: 110, specular: 0xa08850 })

  // Verga: el arco de madera. Gruesa en el pie, esbelta en la punta.
  const geoVerga = tuboAhusado(curvaVerga, 44, 8, (t) => VERGA.radioPie + (VERGA.radioPunta - VERGA.radioPie) * t)
  grupo.add(new Mesh(geoVerga, matMadera))

  // Arame: la cuerda de acero, TENSA y recta entre las dos puntas. Es la que
  // dobla la verga; sin ella el arco parece una cana de pescar.
  const arame = barra(pie, punta, ARAME.radio, matMetal, 6)
  grupo.add(arame)

  // Amarres de las puntas: ahi es donde el arame tira de la madera.
  const geoAmarrePunta = new TorusGeometry(0.15, 0.05, 5, 12)
  for (const extremo of [pie, punta]) {
    const nudo = new Mesh(geoAmarrePunta, matCordel)
    nudo.position.copy(extremo)
    nudo.position.y += extremo.y < 0 ? 0.42 : -0.42
    nudo.rotation.x = Math.PI / 2
    grupo.add(nudo)
  }

  // Cabaca: la caja de resonancia, adonde entra el visitante.
  const grupoCabaza = new Group()
  grupoCabaza.name = 'cabaza'
  grupoCabaza.position.copy(v3(CABAZA.centro))
  grupo.add(grupoCabaza)

  const geoCabaza = geometriaCabaza(CABAZA.radio, CABAZA.fondo)
  const texturaDentro = texturaRaspado()
  grupoCabaza.add(new Mesh(geoCabaza, new MeshPhongMaterial({ color: PALETA.cabazaFuera, shininess: 14, specular: 0x241d0e })))
  grupoCabaza.add(
    new Mesh(
      geoCabaza,
      new MeshPhongMaterial({
        color: PALETA.cabazaDentro,
        map: texturaDentro,
        shininess: 4,
        specular: 0x0f0a04,
        emissive: 0x1a1006,
        side: BackSide,
      }),
    ),
  )

  // El CORTE de la boca: grueso y PALIDO. La pulpa recien cortada es lo mas
  // claro de la calabaza, y ese anillo claro alrededor de un hueco oscuro es
  // justo lo que separa una vasija abierta de una bola.
  const borde = new Mesh(
    new TorusGeometry(CABAZA.radio * 0.985, 0.08, 6, 32),
    new MeshPhongMaterial({ color: PALETA.corte, shininess: 12, specular: 0x40331c }),
  )
  grupoCabaza.add(borde)

  // Cuello: el rabo de la calabaza, en el fondo cerrado. Cuesta 100 triangulos
  // y es lo que la vuelve calabaza y no esfera.
  const cuello = new Mesh(
    new SphereGeometry(0.15, 8, 6),
    new MeshPhongMaterial({ color: PALETA.corte, shininess: 6 }),
  )
  // Bien atras: si el cuello asoma por dentro del cuenco se ve como un bulto
  // pegado en la pared del fondo.
  cuello.position.set(0, 0, -CABAZA.radio * CABAZA.fondo - 0.3)
  cuello.scale.set(0.9, 0.9, 1.4)
  grupoCabaza.add(cuello)

  // Cordinha: el lazo que amarra la cabaca a la verga y al arame. Verde del
  // sitio, para que la atadura se vea.
  const xVerga = curvaVerga.getPoint((CORDINHA.y + 8) / 16).x
  const lazo = new Mesh(new TorusGeometry(CORDINHA.radio, CORDINHA.tubo, 5, 18), matCordel)
  lazo.position.set(xVerga, CORDINHA.y, 0)
  lazo.rotation.x = Math.PI / 2
  grupo.add(lazo)

  // Dos cabos que bajan del lazo y se meten detras del cuenco. Se ven salir de
  // la verga y desaparecer tras el filo: eso es lo que cuenta que esta atada.
  const zFondo = CABAZA.centro[2] - CABAZA.radio * CABAZA.fondo
  for (const lado of [-1, 1]) {
    grupo.add(
      barra(
        new Vector3(xVerga + lado * 0.16, CORDINHA.y - 0.05, 0.18),
        new Vector3(CABAZA.centro[0] + lado * 0.3, CABAZA.centro[1] + 0.55, zFondo),
        0.032,
        matCordel,
        4,
      ),
    )
  }

  // Dobrao: la moneda que aprieta el arame.
  const dobrao = new Mesh(
    new CylinderGeometry(DOBRAO.radio, DOBRAO.radio, DOBRAO.grosor, 16),
    new MeshPhongMaterial({ color: PALETA.calido, shininess: 60, specular: 0x6b5a24 }),
  )
  dobrao.position.set(DOBRAO.posicion[0], DOBRAO.posicion[1], DOBRAO.posicion[2])
  dobrao.rotation.x = Math.PI / 2
  dobrao.rotation.z = 0.18
  grupo.add(dobrao)

  // Baqueta: la varita que golpea el arame.
  const baqueta = new Mesh(
    new CylinderGeometry(BAQUETA.radio, BAQUETA.radio * 0.78, BAQUETA.largo, 6),
    new MeshLambertMaterial({ color: PALETA.maderaClara }),
  )
  baqueta.position.set(BAQUETA.posicion[0], BAQUETA.posicion[1], BAQUETA.posicion[2])
  baqueta.rotation.z = Math.PI / 2 - BAQUETA.inclinacion
  baqueta.rotation.y = 0.22
  grupo.add(baqueta)

  return { grupo, grupoCabaza }
}

// Motas de luz que suben despacio: el monte de Guatoc de noche. Puntos, no
// poligonos.
export function construirMotas(cantidad = 120) {
  const posiciones = new Float32Array(cantidad * 3)
  const velocidades = new Float32Array(cantidad)
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = Math.random() * TAU
    const radio = 2.5 + Math.random() * 7.5
    posiciones[i * 3] = Math.cos(angulo) * radio
    posiciones[i * 3 + 1] = -9 + Math.random() * 18
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio - 1
    velocidades[i] = 0.18 + Math.random() * 0.5
  }

  const geometria = new BufferGeometry()
  geometria.setAttribute('position', new Float32BufferAttribute(posiciones, 3))

  const material = new PointsMaterial({
    size: 0.2,
    map: texturaMota('rgba(88,227,154,0.85)'),
    color: PALETA.acento,
    transparent: true,
    opacity: 0.55,
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
