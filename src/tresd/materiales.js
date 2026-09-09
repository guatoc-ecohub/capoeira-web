// Materiales: tratamiento de superficie y luz.
//
// La forma de la cabaca ya estaba resuelta desde que se torneo de un perfil; lo
// que faltaba era ESTO. Una calabaza real tiene grano, irregularidad de pared,
// el canto mas claro donde la luz lo lame y oclusion hacia el fondo — no un
// tinte plano. Poca geometria bien iluminada gana siempre.
//
// Todas las texturas se pintan por codigo sobre un lienzo: no se descarga nada.
// El ruido va con semilla fija para que dos capturas del mismo cuadro salgan
// identicas y el gate visual sirva de algo.
//
// PRESUPUESTO: esto se va a medir en un Pixel de gama campesino. Los mapas de
// color van a 512, los de relieve a 256, y `bajarCalidad()` suelta relieve y
// entorno de un golpe cuando el vigilante de cuadros lo pide.

import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MixOperation,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
} from 'three'

const SEMILLA = 20260907

function azar(semilla) {
  let a = semilla | 0
  return function siguiente() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lienzo(ancho, alto) {
  const nodo = document.createElement('canvas')
  nodo.width = ancho
  nodo.height = alto
  return nodo
}

function textura(nodo, { color = true, repetirU = 1, repetirV = 1 } = {}) {
  const t = new CanvasTexture(nodo)
  if (color) t.colorSpace = SRGBColorSpace
  t.anisotropy = 1
  if (repetirU !== 1 || repetirV !== 1) {
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.repeat.set(repetirU, repetirV)
  }
  t.needsUpdate = true
  return t
}

// Convierte un campo de altura en gris a un mapa de normales por diferencias
// finitas. Es el paso que hace que una raya deje de ser una raya PINTADA y pase
// a atrapar la luz.
function normalesDesdeAltura(nodoGris, fuerza = 2.2) {
  const ancho = nodoGris.width
  const alto = nodoGris.height
  const origen = nodoGris.getContext('2d').getImageData(0, 0, ancho, alto).data
  const destino = lienzo(ancho, alto)
  const ctx = destino.getContext('2d')
  const salida = ctx.createImageData(ancho, alto)
  const alturaEn = (x, y) => {
    const px = ((y + alto) % alto) * ancho + ((x + ancho) % ancho)
    return origen[px * 4] / 255
  }
  for (let y = 0; y < alto; y += 1) {
    for (let x = 0; x < ancho; x += 1) {
      const dx = (alturaEn(x + 1, y) - alturaEn(x - 1, y)) * fuerza
      const dy = (alturaEn(x, y + 1) - alturaEn(x, y - 1)) * fuerza
      // Normal = normalize(-dx, -dy, 1), empacada a 0..255.
      const largo = Math.hypot(dx, dy, 1)
      const i = (y * ancho + x) * 4
      salida.data[i] = Math.round(((-dx / largo) * 0.5 + 0.5) * 255)
      salida.data[i + 1] = Math.round(((-dy / largo) * 0.5 + 0.5) * 255)
      salida.data[i + 2] = Math.round((1 / largo) * 0.5 * 255 + 127.5)
      salida.data[i + 3] = 255
    }
  }
  ctx.putImageData(salida, 0, 0)
  return destino
}

// ---------------------------------------------------------------- dibujos
// Cada dibujo se pinta dos veces con los mismos trazos: una en color y otra en
// gris como campo de altura. Un solo recorrido, para que el relieve y el color
// no se puedan desincronizar.

function pintarMadera(ctx, w, h, modo) {
  const rnd = azar(SEMILLA)
  ctx.fillStyle = modo === 'altura' ? '#808080' : '#7d5730'
  ctx.fillRect(0, 0, w, h)
  // Vetas a lo largo: la U del tubo corre por el largo de la verga.
  for (let i = 0; i < 210; i += 1) {
    const y = rnd() * h
    const grueso = 0.6 + rnd() * 2.4
    const oscuro = rnd() > 0.45
    const fuerza = 0.05 + rnd() * 0.16
    ctx.strokeStyle =
      modo === 'altura'
        ? `rgba(${oscuro ? 40 : 220},${oscuro ? 40 : 220},${oscuro ? 40 : 220},${fuerza})`
        : `rgba(${oscuro ? 44 : 190},${oscuro ? 30 : 150},${oscuro ? 14 : 100},${fuerza})`
    ctx.lineWidth = grueso
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += 32) {
      ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * (1 + rnd() * 3) + i) * (0.8 + rnd() * 2))
    }
    ctx.stroke()
  }
  // Nudos: pocos y chicos, para que se lea madera y no papel tapiz.
  for (let i = 0; i < 3; i += 1) {
    const cx = rnd() * w
    const cy = rnd() * h
    for (let r = 9; r > 0; r -= 1.6) {
      ctx.strokeStyle = modo === 'altura' ? 'rgba(30,30,30,0.18)' : 'rgba(38,24,10,0.2)'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * 2.4, r, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function pintarCabazaFuera(ctx, w, h, modo) {
  const rnd = azar(SEMILLA + 7)
  ctx.fillStyle = modo === 'altura' ? '#808080' : '#a87a41'
  ctx.fillRect(0, 0, w, h)
  // Manchas: la piel de una calabaza seca nunca es de un solo tono.
  for (let i = 0; i < 90; i += 1) {
    const cx = rnd() * w
    const cy = rnd() * h
    const r = 18 + rnd() * 70
    const claro = rnd() > 0.5
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const alfa = 0.05 + rnd() * 0.1
    if (modo === 'altura') {
      grad.addColorStop(0, `rgba(${claro ? 200 : 60},${claro ? 200 : 60},${claro ? 200 : 60},${alfa})`)
      grad.addColorStop(1, 'rgba(128,128,128,0)')
    } else {
      grad.addColorStop(0, claro ? `rgba(206,166,104,${alfa})` : `rgba(96,64,28,${alfa})`)
      grad.addColorStop(1, 'rgba(168,122,65,0)')
    }
    ctx.fillStyle = grad
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  // Estrias por los meridianos: la U del torneado da la vuelta al eje.
  for (let i = 0; i < 60; i += 1) {
    const x = rnd() * w
    ctx.strokeStyle = modo === 'altura' ? 'rgba(70,70,70,0.07)' : 'rgba(78,52,22,0.08)'
    ctx.lineWidth = 0.8 + rnd() * 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (rnd() - 0.5) * 14, h)
    ctx.stroke()
  }
}

function pintarCabazaDentro(ctx, w, h, modo) {
  const rnd = azar(SEMILLA + 21)
  ctx.fillStyle = modo === 'altura' ? '#808080' : '#5f4222'
  ctx.fillRect(0, 0, w, h)
  // Raspado: anillos concentricos alrededor del fondo. En el torneado la V
  // corre del borde al fondo, asi que una banda horizontal ES un anillo. La
  // fuerza varia a lo largo de la banda para que no se lea como impresion.
  for (let i = 0; i < 120; i += 1) {
    // El desorden vertical es grande a proposito: anillos perfectamente
    // concentricos y parejos se leen como rodaja de tronco, no como raspado.
    const y = (i / 120) * h + (rnd() - 0.5) * 9
    const oscuro = rnd() > 0.5
    const base = 0.035 + rnd() * 0.1
    ctx.lineWidth = 0.7 + rnd() * 2.6
    let x = 0
    while (x < w) {
      const tramo = 20 + rnd() * 90
      const alfa = base * (0.35 + rnd())
      ctx.strokeStyle =
        modo === 'altura'
          ? `rgba(${oscuro ? 40 : 220},${oscuro ? 40 : 220},${oscuro ? 40 : 220},${alfa})`
          : `rgba(${oscuro ? 52 : 198},${oscuro ? 34 : 156},${oscuro ? 14 : 102},${alfa})`
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(Math.min(x + tramo, w), y + (rnd() - 0.5) * 1.6)
      ctx.stroke()
      x += tramo
    }
  }
  // Gubiazos: unos pocos golpes de raspador mas hondos.
  for (let i = 0; i < 14; i += 1) {
    const y = rnd() * h
    ctx.strokeStyle = modo === 'altura' ? 'rgba(28,28,28,0.3)' : 'rgba(44,28,10,0.26)'
    ctx.lineWidth = 2 + rnd() * 3.5
    ctx.beginPath()
    ctx.moveTo(rnd() * w, y)
    ctx.lineTo(rnd() * w, y + (rnd() - 0.5) * 10)
    ctx.stroke()
  }
  if (modo === 'color') {
    // OCLUSION. Es lo que faltaba: adentro de un cuenco la luz no llega al
    // fondo. V=0 es el canto, V=1 el fondo.
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(226,196,150,0.3)') // el borde, que la luz lame
    grad.addColorStop(0.14, 'rgba(0,0,0,0)')
    grad.addColorStop(0.5, 'rgba(12,7,2,0.4)')
    grad.addColorStop(1, 'rgba(6,3,1,0.88)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    // Y no llega igual por todos lados: un poco de deriva alrededor del eje.
    for (let i = 0; i < 8; i += 1) {
      const cx = rnd() * w
      const ancho = 40 + rnd() * 120
      const g2 = ctx.createLinearGradient(cx - ancho, 0, cx + ancho, 0)
      g2.addColorStop(0, 'rgba(10,6,2,0)')
      g2.addColorStop(0.5, `rgba(10,6,2,${0.1 + rnd() * 0.16})`)
      g2.addColorStop(1, 'rgba(10,6,2,0)')
      ctx.fillStyle = g2
      ctx.fillRect(cx - ancho, 0, ancho * 2, h)
    }
  }
}

function pintarCanto(ctx, w, h, modo) {
  const rnd = azar(SEMILLA + 33)
  ctx.fillStyle = modo === 'altura' ? '#808080' : '#d8c49b'
  ctx.fillRect(0, 0, w, h)
  // Fibra del corte: la pulpa cortada es fibrosa y no lisa.
  for (let i = 0; i < 160; i += 1) {
    const x = rnd() * w
    ctx.strokeStyle = modo === 'altura' ? 'rgba(60,60,60,0.16)' : 'rgba(122,98,58,0.18)'
    ctx.lineWidth = 0.5 + rnd() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (rnd() - 0.5) * 6, h)
    ctx.stroke()
  }
}

// El entorno que refleja el metal. Sin esto el arame es una linea pintada; con
// esto tiene de donde sacar un brillo que corre a lo largo del alambre.
function pintarEntorno(ctx, w, h) {
  const cielo = ctx.createLinearGradient(0, 0, 0, h)
  cielo.addColorStop(0, '#16241c')
  cielo.addColorStop(0.48, '#0d1712')
  cielo.addColorStop(0.52, '#070d0a')
  cielo.addColorStop(1, '#040806')
  ctx.fillStyle = cielo
  ctx.fillRect(0, 0, w, h)
  // La clave, como una banda alargada: es el reflejo que recorre el alambre.
  const cx = w * 0.62
  const cy = h * 0.3
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.2)
  grad.addColorStop(0, 'rgba(255,244,214,0.95)')
  grad.addColorStop(0.35, 'rgba(214,196,150,0.4)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, 0.34)
  ctx.translate(-cx, -cy)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
  // Un rebote verde bajo, del monte.
  const rebote = ctx.createRadialGradient(w * 0.2, h * 0.72, 0, w * 0.2, h * 0.72, w * 0.26)
  rebote.addColorStop(0, 'rgba(88,227,154,0.16)')
  rebote.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = rebote
  ctx.fillRect(0, 0, w, h)
}

function pintar(ancho, alto, dibujo, modo) {
  const nodo = lienzo(ancho, alto)
  const ctx = nodo.getContext('2d')
  if (ctx) dibujo(ctx, ancho, alto, modo)
  return nodo
}

// La fibra de una cuerda de algodon: hebras torcidas en diagonal. La U del tubo
// corre a lo largo de la cuerda, asi que las rayas van inclinadas sobre V.
function pintarCordel(ctx, w, h) {
  const rnd = azar(SEMILLA + 45)
  ctx.fillStyle = '#3f8a5c'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 26; i += 1) {
    const x = (i / 26) * w + (rnd() - 0.5) * 3
    const claro = i % 2 === 0
    ctx.strokeStyle = claro ? 'rgba(150,214,176,0.45)' : 'rgba(20,52,34,0.5)'
    ctx.lineWidth = 1.2 + rnd() * 1.6
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h * 0.9, h)
    ctx.stroke()
  }
}

// El desvanecido del telon: blanco al centro, negro en el borde. Con esto el
// valle no tiene esquinas: se funde con el vacio antes de mostrar que es un
// rectangulo.
function pintarVineta(ctx, w, h) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.min(w, h) * 0.62)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.55, '#c8c8c8')
  grad.addColorStop(1, '#000000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ------------------------------------------------------------ construccion

export function crearMateriales() {
  const texturas = []
  const guardar = (t) => {
    texturas.push(t)
    return t
  }

  const maderaMapa = guardar(textura(pintar(512, 128, pintarMadera, 'color')))
  const maderaRelieve = guardar(textura(normalesDesdeAltura(pintar(256, 64, pintarMadera, 'altura'), 2.6), { color: false }))
  const fueraMapa = guardar(textura(pintar(512, 512, pintarCabazaFuera, 'color')))
  const fueraRelieve = guardar(textura(normalesDesdeAltura(pintar(256, 256, pintarCabazaFuera, 'altura'), 1.6), { color: false }))
  const dentroMapa = guardar(textura(pintar(512, 512, pintarCabazaDentro, 'color')))
  const dentroRelieve = guardar(textura(normalesDesdeAltura(pintar(256, 256, pintarCabazaDentro, 'altura'), 3), { color: false }))
  const cantoMapa = guardar(textura(pintar(128, 128, pintarCanto, 'color')))
  const cordelMapa = guardar(textura(pintar(128, 32, pintarCordel, 'color'), { repetirU: 22, repetirV: 1 }))
  const vineta = guardar(textura(pintar(256, 192, pintarVineta, 'color'), { color: false }))

  const entorno = guardar(textura(pintar(256, 128, pintarEntorno, 'color')))
  entorno.mapping = EquirectangularReflectionMapping

  const madera = new MeshPhongMaterial({
    map: maderaMapa,
    normalMap: maderaRelieve,
    normalScale: new Vector2(0.7, 0.7),
    specularMap: maderaMapa, // la veta oscura brilla menos que la clara
    color: 0xffffff,
    specular: 0x554634,
    shininess: 26,
  })

  const maderaClara = new MeshPhongMaterial({
    map: maderaMapa,
    normalMap: maderaRelieve,
    normalScale: new Vector2(0.4, 0.4),
    color: 0xd8c093,
    specular: 0x4a4030,
    shininess: 34,
  })

  const cabazaFuera = new MeshPhongMaterial({
    map: fueraMapa,
    normalMap: fueraRelieve,
    normalScale: new Vector2(0.55, 0.55),
    specularMap: fueraMapa,
    color: 0xffffff,
    specular: 0x3a3122,
    shininess: 22, // la cascara seca tiene algo de cera, no es mate del todo
  })

  const cabazaDentro = new MeshPhongMaterial({
    map: dentroMapa,
    normalMap: dentroRelieve,
    normalScale: new Vector2(1.05, 1.05),
    color: 0xcdbfae,
    specular: 0x1a120a,
    shininess: 6,
  })

  const canto = new MeshPhongMaterial({
    map: cantoMapa,
    color: 0xffffff,
    specular: 0x6b6047,
    shininess: 30,
  })

  // Acero, no oro: el arame de un berimbau es alambre de llanta. El reflejo del
  // entorno es lo que lo separa de una linea pintada.
  const arame = new MeshPhongMaterial({
    color: 0xd4d8d3,
    specular: 0xffffff,
    shininess: 260,
    envMap: entorno,
    combine: MixOperation,
    reflectivity: 0.7,
  })

  // Una moneda gastada: laton viejo, brillo apagado.
  const dobrao = new MeshPhongMaterial({
    color: 0xb58f52,
    specular: 0xf2dfa8,
    shininess: 90,
    envMap: entorno,
    combine: MixOperation,
    reflectivity: 0.3,
  })

  // Algodon tenido de verde, mate: la fibra torcida es lo que lo separa de un
  // tubo de color.
  const cordel = new MeshPhongMaterial({ map: cordelMapa, color: 0xffffff, specular: 0x142218, shininess: 5 })

  const cuero = new MeshPhongMaterial({ color: 0x3a2416, specular: 0x2a1a10, shininess: 14 })

  const conRelieve = [madera, maderaClara, cabazaFuera, cabazaDentro]
  const conEntorno = [arame, dobrao]

  return {
    madera,
    maderaClara,
    cabazaFuera,
    cabazaDentro,
    canto,
    arame,
    dobrao,
    cordel,
    cuero,
    // Material del telon: sin luz, porque es una vista lejana y no un objeto de
    // la escena. Con niebla, para que el vacio lo vele; con vineta, para que no
    // tenga esquinas; con opacidad, que la escena sube y baja segun el viaje.
    telon: new MeshBasicMaterial({
      color: 0x93a49a,
      alphaMap: vineta,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),

    // El vigilante de cuadros llama esto: relieve y entorno se sueltan de un
    // golpe y la escena queda con color plano, que es barato y sigue leyendose.
    bajarCalidad() {
      for (const material of conRelieve) {
        material.normalMap = null
        material.needsUpdate = true
      }
      for (const material of conEntorno) {
        material.envMap = null
        material.reflectivity = 0
        material.needsUpdate = true
      }
    },

    liberar() {
      for (const t of texturas) t.dispose()
    },
  }
}
