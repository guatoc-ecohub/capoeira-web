// El berimbau modelado por codigo. Nada de modelos descargados.
// Presupuesto: menos de 2.500 triangulos y ocho llamadas de dibujo, para que
// un Mali-G78 sostenga los 30 cuadros sin sombras ni post-proceso.

import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'

import {
  ANCLAS_VIDEO,
  ARAME,
  BAQUETA,
  CABAZA,
  DOBRAO,
  MARCOS_FOTO,
  MARCO_TAMANO,
  PLACA,
  RODA,
  VERGA,
  direccionCabaza,
} from './paradas.js'

export const PALETA = {
  fondo: 0x16100a,
  madera: 0x7a4a22,
  maderaClara: 0xc79a5e,
  cabazaFuera: 0xb07a35,
  cabazaDentro: 0xe0b877,
  arame: 0xcfc7b6,
  oro: 0xedba4e,
  acento: 0xf28c1e,
  crema: 0xf8efdf,
  verde: 0xa3bc5a,
  linea: 0x3e2f1c,
}

const TAU = Math.PI * 2

function v3(lista) {
  return new Vector3(lista[0], lista[1], lista[2])
}

const ARRIBA = new Vector3(0, 1, 0)
const ORIGEN = new Vector3(0, 0, 0)

// Gira el objeto para que su cara (+Z) mire al centro de la cabaca.
function mirarAlCentro(objeto) {
  const matriz = new Matrix4().lookAt(ORIGEN, objeto.position, ARRIBA)
  objeto.quaternion.setFromRotationMatrix(matriz)
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

function recortar(ctx, texto, maximo) {
  let salida = texto
  while (salida.length > 3 && ctx.measureText(salida).width > maximo) {
    salida = salida.slice(0, -1)
  }
  return salida === texto ? texto : `${salida.trim()}…`
}

// Marco vacio: lo que se ve mientras no llegue la foto de Guatoc.
function texturaMarcoPendiente(indice, titulo, etiqueta) {
  return lienzo2d(320, 224, (ctx, w, h) => {
    ctx.fillStyle = '#2e2214'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#f28c1e'
    ctx.lineWidth = 4
    ctx.setLineDash([13, 11])
    ctx.strokeRect(11, 11, w - 22, h - 22)
    ctx.setLineDash([])

    ctx.fillStyle = '#f28c1e'
    ctx.font = 'bold 26px Arial, Helvetica, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(String(indice + 1).padStart(2, '0'), 26, 26)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f8efdf'
    ctx.font = 'bold 34px "Arial Narrow", Arial, sans-serif'
    ctx.fillText(recortar(ctx, titulo.toUpperCase(), w - 60), w / 2, h / 2 - 4)

    ctx.fillStyle = '#c3ae91'
    ctx.font = '19px Arial, Helvetica, sans-serif'
    ctx.fillText(recortar(ctx, etiqueta, w - 60), w / 2, h / 2 + 34)
  })
}

function texturaPlaca(linea1, linea2) {
  return lienzo2d(512, 240, (ctx, w, h) => {
    ctx.fillStyle = '#241a10'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#edba4e'
    ctx.lineWidth = 5
    ctx.strokeRect(14, 14, w - 28, h - 28)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f28c1e'
    ctx.font = 'bold 92px "Arial Narrow", Arial, sans-serif'
    ctx.fillText(recortar(ctx, linea1, w - 70), w / 2, h / 2 - 18)

    ctx.fillStyle = '#c3ae91'
    ctx.font = 'bold 30px Arial, Helvetica, sans-serif'
    ctx.fillText(recortar(ctx, linea2.toUpperCase(), w - 70), w / 2, h / 2 + 62)
  })
}

function texturaBrasa() {
  return lienzo2d(32, 32, (ctx, w) => {
    const r = w / 2
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r)
    grad.addColorStop(0, 'rgba(255, 220, 160, 1)')
    grad.addColorStop(0.4, 'rgba(242, 140, 30, 0.65)')
    grad.addColorStop(1, 'rgba(242, 140, 30, 0)')
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

// Media esfera abollada: una calabaza seca no es un balon partido.
function geometriaCabaza(radio, fondo) {
  const geometria = new SphereGeometry(radio, 26, 13, 0, TAU, 0, Math.PI / 2)
  const posicion = geometria.attributes.position
  const punto = new Vector3()
  for (let i = 0; i < posicion.count; i += 1) {
    punto.fromBufferAttribute(posicion, i)
    const altura = Math.min(Math.max(punto.y / radio, 0), 1) // 0 en la boca, 1 en el polo
    const azimut = Math.atan2(punto.z, punto.x)
    // El bulto se apaga en la boca Y en el polo: sobre el polo convergen todos
    // los triangulos y cualquier deformacion ahi se ve como un abanico de rayas.
    const peso = Math.sin(altura * Math.PI)
    const bulto = 1 + peso * (0.055 * Math.sin(azimut * 3) + 0.04 * Math.cos(azimut * 2 + 1.1) - 0.02)
    punto.multiplyScalar(bulto)
    punto.y *= fondo
    posicion.setXYZ(i, punto.x, punto.y, punto.z)
  }
  geometria.computeVertexNormals()
  // Boca hacia +Z: la camara entra de frente.
  geometria.rotateX(-Math.PI / 2)
  return geometria
}

function anilloRoda(radio, y, color, opacidad) {
  const puntos = []
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * TAU
    puntos.push(Math.cos(a) * radio, y, Math.sin(a) * radio)
  }
  const geometria = new BufferGeometry()
  geometria.setAttribute('position', new Float32BufferAttribute(puntos, 3))
  const material = new LineBasicMaterial({ color, transparent: true, opacity: opacidad })
  return new LineLoop(geometria, material)
}

// -------------------------------------------------------------- construccion

export function construirBerimbau({ medios }) {
  const grupo = new Group()
  grupo.name = 'berimbau'

  const curvaVerga = new QuadraticBezierCurve3(v3(VERGA.pieBase), v3(VERGA.control), v3(VERGA.punta))

  // Verga: el arco de madera. Gruesa en el pie, esbelta en la punta.
  const geoVerga = tuboAhusado(curvaVerga, 44, 8, (t) => VERGA.radioPie + (VERGA.radioPunta - VERGA.radioPie) * t)
  const matMadera = new MeshPhongMaterial({ color: PALETA.madera, shininess: 20, specular: 0x2a1a0c, flatShading: false })
  grupo.add(new Mesh(geoVerga, matMadera))

  // Arame: la cuerda de acero, tensa entre las dos puntas.
  const pie = v3(VERGA.pieBase)
  const punta = v3(VERGA.punta)
  const largoArame = pie.distanceTo(punta)
  const geoArame = new CylinderGeometry(ARAME.radio, ARAME.radio, largoArame, 6, 1, true)
  const matArame = new MeshPhongMaterial({ color: PALETA.arame, shininess: 90, specular: 0x9a9384 })
  const arame = new Mesh(geoArame, matArame)
  arame.position.copy(pie).add(punta).multiplyScalar(0.5)
  grupo.add(arame)

  // Cabezales de cuerda en las dos puntas.
  const geoNudo = new TorusGeometry(0.13, 0.045, 5, 10)
  const matCordel = new MeshLambertMaterial({ color: PALETA.verde })
  for (const extremo of [pie, punta]) {
    const nudo = new Mesh(geoNudo, matCordel)
    nudo.position.copy(extremo).setY(extremo.y + (extremo.y < 0 ? 0.35 : -0.35))
    nudo.rotation.x = Math.PI / 2
    grupo.add(nudo)
  }

  // Cabaca: la caja de resonancia. Es adonde entra el visitante.
  const grupoCabaza = new Group()
  grupoCabaza.name = 'cabaza'
  grupoCabaza.position.copy(v3(CABAZA.centro))
  grupo.add(grupoCabaza)

  const geoCabaza = geometriaCabaza(CABAZA.radio, CABAZA.fondo)
  const matCabazaFuera = new MeshPhongMaterial({ color: PALETA.cabazaFuera, shininess: 16, specular: 0x241708 })
  const matCabazaDentro = new MeshPhongMaterial({
    // Mas oscuro que el exterior: adentro de una vasija entra poca luz, y si el
    // interior se blanquea el sitio deja de ser el sitio (fondo #16100a).
    color: 0x9c6a30,
    shininess: 4,
    specular: 0x120a04,
    emissive: 0x1c0e04,
    side: BackSide,
  })
  grupoCabaza.add(new Mesh(geoCabaza, matCabazaFuera))
  grupoCabaza.add(new Mesh(geoCabaza, matCabazaDentro))

  // Borde de la boca: el corte de la calabaza. Grueso a proposito: es lo que
  // hace que se lea como una vasija abierta y no como una bola.
  const geoBorde = new TorusGeometry(CABAZA.radio * 0.99, 0.075, 6, 34)
  const borde = new Mesh(geoBorde, new MeshPhongMaterial({ color: 0x6d4318, shininess: 6 }))
  grupoCabaza.add(borde)

  // Cordinha: amarra la cabaca al arame y a la verga. Trae el verde del sitio.
  // Amarra la cabaca contra la verga y el arame, por el fondo cerrado.
  const geoAmarre = new TorusGeometry(0.48, 0.035, 5, 18)
  const amarre = new Mesh(geoAmarre, matCordel)
  amarre.position.set(0.08, 0, -CABAZA.radio * CABAZA.fondo - 0.62)
  amarre.rotation.x = Math.PI / 2
  grupoCabaza.add(amarre)

  // Marcos de foto sobre la pared interna. Vacios hasta que lleguen las de Guatoc.
  const fotos = (medios && medios.fotos) || []
  const etiquetaFoto = (medios && medios.pendienteFoto) || 'Foto pendiente'
  const marcos = []
  const geoMarco = new PlaneGeometry(MARCO_TAMANO.ancho, MARCO_TAMANO.alto)
  const geoMarcoBorde = new PlaneGeometry(MARCO_TAMANO.ancho + 0.07, MARCO_TAMANO.alto + 0.07)
  const matMarcoBorde = new MeshBasicMaterial({ color: PALETA.acento, transparent: true, opacity: 0.55 })

  MARCOS_FOTO.forEach((sitio, indice) => {
    const ficha = fotos[indice] || { titulo: `Foto ${indice + 1}` }
    const direccion = direccionCabaza(sitio.azimut, sitio.elevacion)
    const posicion = new Vector3(direccion[0], direccion[1], direccion[2]).multiplyScalar(MARCO_TAMANO.radio)

    const marco = new Group()
    marco.position.copy(posicion)
    mirarAlCentro(marco)
    marco.userData.idFoto = ficha.id || `foto-${indice + 1}`

    const fondo = new Mesh(geoMarcoBorde, matMarcoBorde)
    fondo.position.z = -0.012
    marco.add(fondo)

    const textura = texturaMarcoPendiente(indice, ficha.titulo || `Foto ${indice + 1}`, etiquetaFoto)
    const lamina = new Mesh(geoMarco, new MeshBasicMaterial({ map: textura, toneMapped: false }))
    marco.add(lamina)
    marco.userData.lamina = lamina

    grupoCabaza.add(marco)
    marcos.push(marco)
  })

  // Placa grabada al fondo: donde cae la parada de reserva.
  const direccionPlaca = direccionCabaza(PLACA.azimut, PLACA.elevacion)
  const placa = new Mesh(
    new PlaneGeometry(PLACA.ancho, PLACA.alto),
    new MeshBasicMaterial({ map: texturaPlaca(medios?.placa?.valor || '$100.000', medios?.placa?.pie || 'Reserva'), toneMapped: false }),
  )
  placa.position.set(direccionPlaca[0], direccionPlaca[1], direccionPlaca[2]).multiplyScalar(PLACA.radio)
  mirarAlCentro(placa)
  grupoCabaza.add(placa)

  // Anclas invisibles para la capa HTML de video.
  const anclas = ANCLAS_VIDEO.map((sitio, indice) => {
    const direccion = direccionCabaza(sitio.azimut, sitio.elevacion)
    const local = new Vector3(direccion[0], direccion[1], direccion[2]).multiplyScalar(sitio.radio)
    const video = (medios && medios.videos && medios.videos[indice]) || {}
    return { id: video.id || `video-${indice + 1}`, local, grupo: grupoCabaza }
  })

  // Dobrao: la moneda que aprieta el arame.
  const dobrao = new Mesh(
    new CylinderGeometry(DOBRAO.radio, DOBRAO.radio, DOBRAO.grosor, 18),
    new MeshPhongMaterial({ color: PALETA.oro, shininess: 70, specular: 0x6b5a24 }),
  )
  dobrao.position.set(DOBRAO.posicion[0], DOBRAO.posicion[1], DOBRAO.posicion[2])
  dobrao.rotation.x = Math.PI / 2
  dobrao.rotation.z = 0.18
  grupo.add(dobrao)

  // Baqueta: la varita que golpea el arame.
  const baqueta = new Mesh(
    new CylinderGeometry(BAQUETA.radio, BAQUETA.radio * 0.8, BAQUETA.largo, 6),
    new MeshLambertMaterial({ color: PALETA.maderaClara }),
  )
  baqueta.position.set(BAQUETA.posicion[0], BAQUETA.posicion[1], BAQUETA.posicion[2])
  baqueta.rotation.z = Math.PI / 2 - BAQUETA.inclinacion
  baqueta.rotation.y = 0.22
  grupo.add(baqueta)

  // Roda: dos anillos en el piso. Dan escala y contexto sin costar nada.
  const roda = new Group()
  roda.add(anilloRoda(RODA.radios[0], RODA.y, PALETA.acento, 0.32))
  roda.add(anilloRoda(RODA.radios[1], RODA.y, PALETA.oro, 0.16))
  grupo.add(roda)

  return { grupo, grupoCabaza, marcos, anclas, curvaVerga }
}

// Brasas: puntos que suben despacio. Dan vida al vacio sin poligonos.
export function construirBrasas(cantidad = 130) {
  const posiciones = new Float32Array(cantidad * 3)
  const velocidades = new Float32Array(cantidad)
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = Math.random() * TAU
    const radio = 2 + Math.random() * 7
    posiciones[i * 3] = Math.cos(angulo) * radio
    posiciones[i * 3 + 1] = -9 + Math.random() * 18
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio - 1
    velocidades[i] = 0.25 + Math.random() * 0.65
  }

  const geometria = new BufferGeometry()
  geometria.setAttribute('position', new Float32BufferAttribute(posiciones, 3))

  const material = new PointsMaterial({
    size: 0.22,
    map: texturaBrasa(),
    color: PALETA.acento,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  })

  const puntos = new Points(geometria, material)
  puntos.frustumCulled = false
  puntos.userData.velocidades = velocidades
  return puntos
}

export function animarBrasas(puntos, dt) {
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

// Cambia la lamina de un marco por la foto real cuando exista.
export function ponerFoto(marco, textura) {
  const lamina = marco.userData.lamina
  if (!lamina) return
  const anterior = lamina.material.map
  lamina.material.map = textura
  lamina.material.needsUpdate = true
  if (anterior) anterior.dispose()
}
