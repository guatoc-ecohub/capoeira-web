// El viaje, en unidades del mundo. Lo dirige _brief/COREOGRAFIA.md: si esto y
// aquello se contradicen, el error esta aca.
//
// El instrumento se entiende DANDO LA VUELTA, como cuando uno toma un objeto en la
// mano y lo gira para comprenderlo. Seis paradas, un solo camino, sin retroceder:
// de frente desde el publico -> por encima de la punta -> abajo, a la mano que
// toca -> de frente a la boca de la cabaca, desde donde la ve quien toca -> se
// retrocede y el instrumento vuelve a leerse entero, ahora en espejo, con el valle
// detras -> se asienta. La camara nunca entra en ninguna pieza.
//
// Marco: la verga corre de -8 a +8 sobre Y y bombea hacia +X; el arame corre
// pegado al eje, del lado -X de la madera. El publico esta en +Z. La cabaca
// cuelga con la BOCA hacia -Z (hacia quien toca) y la panza hacia +Z.

// Los seis tramos. El id empareja con contenido.berimbau.paradas y con el
// atributo data-beat de cada seccion del documento.
export const BEATS = [
  { at: 0, id: 'evento' },
  { at: 1, id: 'dias' },
  { at: 2, id: 'tecnica' },
  { at: 3, id: 'mestres' },
  { at: 4, id: 'lugar' },
  { at: 5, id: 'reserva' },
]

// El eje de la vara, del pie a la punta. Un arco ASIMETRICO: la curva se cierra
// fuerte justo encima de la cabaca y se abre en un tramo largo y casi recto
// hacia la punta. El leve vaiven en Z es la irregularidad de una rama.
export const VERGA = {
  puntos: [
    [0.0, -8.0, 0.0],
    [0.1, -6.8, 0.02],
    [0.28, -5.9, 0.03],
    [0.6, -4.9, 0.02],
    [1.18, -3.7, 0.0],
    [1.98, -2.3, -0.02],
    [2.66, -0.9, -0.03],
    [3.05, 0.6, -0.02],
    [3.12, 2.0, 0.0],
    [2.86, 3.6, 0.02],
    [2.28, 5.2, 0.03],
    [1.34, 6.8, 0.02],
    [0.0, 8.0, 0.0],
  ],
  // Grosor casi parejo: un poco mas gruesa en el pie. La anterior iba de 0,19 a
  // 0,09 y por eso se leia gorda al medio y fina arriba.
  radioPie: 0.14,
  radioPunta: 0.09,
}

// El arame: delgado, tenso, con brillo duro. Se amarra con vueltas en la punta y
// en el pie, y la cordinha lo MUERDE contra la madera a la altura de la cabaca:
// por eso tiene un quiebre ahi y no es una recta de punta a punta. Las X de esos
// tres puntos se calculan desde la madera (berimbau.js), no se escriben.
export const ARAME = { radio: 0.028, yPunta: 7.72, yAtadura: -4.6, yPie: -7.68, vueltas: 3 }

// El cuero del pie: donde se ancla el alambre abajo.
export const CUERO = { largo: 0.55, radio: 0.175 }

// La cabaca a PROPORCION REAL: unos 12 % del largo de la verga (la anterior iba
// al 17 %, inflada para que cupiera la camara). `boca` es el centro del plano de
// la boca; el grupo gira PI sobre Y para que la boca mire a -Z, hacia quien
// toca, y la panza quede hacia el publico. El arco cruza por delante de la boca,
// cerca del borde, como en el instrumento real.
export const CABAZA = {
  boca: [0.5, -5.45, 0.17],
  radioBoca: 0.7,
  pared: 0.05,
  achatado: 0.94, // la boca es ovalada, mas ancha que alta
  giro: [-0.1, Math.PI + 0.08, 0.05],
  // Los dos agujeros por donde pasa la cordinha, en grados desde el eje X local:
  // arriba del borde, uno a cada lado.
  agujeros: [77, 103],
}

export const CORDINHA = { y: -4.6, tubo: 0.03 }
export const DOBRAO = { y: -3.7, radio: 0.2, grosor: 0.03, normal: [0.7, 0.1, -0.7] }
export const BAQUETA = { punta: [0.44, -3.2, -0.09], direccion: [-0.85, -0.35, -0.4], largo: 4, radio: 0.036 }

// El telon de Guatoc: el valle que aparece DETRAS del instrumento cuando la
// camara retrocede desde la boca, en el tramo del lugar. Lejos, para que se lea
// como vista y no como calcomania; la niebla del vacio lo vela. No se pide al
// arrancar: se pide cuando el viaje pasa de `pedirDesde`.
export const TELON = {
  posicion: [-15, 3, 31],
  ancho: 96,
  alto: 72,
  imagen: '/guatoc/chorrera.jpg',
  pedirDesde: 1.8,
  aparece: [3.3, 4.0],
}

// Una sola direccion de luz: alta, desde la izquierda del publico y un poco por
// delante. Del lado de quien toca queda a contraluz, y ahi es la luz de la boca
// la que dibuja el interior. El relleno es bajo para que la sombra no se hunda.
export const LUZ = { clave: [-0.45, 0.75, 0.45], relleno: 0.18 }

// Las claves de camara, UNA POR TRAMO. No se escriben como posiciones sino como
// el giro alrededor del enfoque: azimut (0 = el publico de frente; negativo gira
// hacia el lado de la cuerda; -180 = quien toca), elevacion, distancia y el
// punto que se mira. El rig interpola ESTOS parametros, asi que entre dos
// paradas la camara viaja por un arco alrededor del instrumento y no por la
// cuerda recta entre dos puntos, que se le mete al objeto a mitad de camino.
//
// `derecha` corre el enfoque hacia la derecha del cuadro, como fraccion del
// semiancho de vista: la copia va a la izquierda. `fit` decide como se paga una
// pantalla angosta: cerca de 1 se retrocede sobre el eje de vista, cerca de 0 se
// abre el campo. Como la camara nunca esta dentro de nada, todas retroceden.
export const CAMERA_KEYS = [
  // 0 · El campamento: plano general desde el publico, corrido al lado de la
  // cuerda para que el arame quede delante y el arco se lea con su asimetria.
  { at: 0, azimut: -28, elevacion: 7, distancia: 30, foco: [1.3, 0.1, 0.3], derecha: 0.42, fov: 34, fit: 0.95, roll: -2.5 },
  // 1 · Tres dias: por encima de la punta, mirando hacia abajo a lo largo. La
  // punta cerca, el arame en escorzo, la calabaza lejos al fondo.
  { at: 1, azimut: -72, elevacion: 45, distancia: 12, foco: [0.7, 3.2, 0], derecha: 0.34, fov: 42, fit: 0.85, roll: 3 },
  // 2 · Las artes: bajo, por fuera y ya del lado de quien toca. El arame delante,
  // el dobrao detras de el, la baqueta entrando en diagonal.
  { at: 2, azimut: -132, elevacion: 6, distancia: 6.2, foco: [0.45, -3.7, -0.1], derecha: 0.32, fov: 42, fit: 0.7, roll: -1.5 },
  // 3 · Los mestres: de frente a la boca, desde donde la ve quien toca, un poco
  // desde arriba para ver adentro. El plano mas cerrado del viaje.
  { at: 3, azimut: -176, elevacion: 11, distancia: 3.4, foco: [0.5, -5.4, 0.17], derecha: 0.28, fov: 46, fit: 0.55, roll: 1 },
  // 4 · El lugar: plano general desde el otro lado, en espejo, con el valle
  // apareciendo detras.
  { at: 4, azimut: -206, elevacion: 9, distancia: 21, foco: [1.0, -0.3, 0.4], derecha: 0.42, fov: 36, fit: 0.9, roll: -1 },
  // 5 · Reservar: unos grados mas, casi a la horizontal, un poco mas lejos. Quieto.
  { at: 5, azimut: -226, elevacion: 3, distancia: 26, foco: [1.1, -0.2, 0.4], derecha: 0.42, fov: 34, fit: 0.95, roll: 0 },
]

export const ULTIMA_CLAVE = CAMERA_KEYS[CAMERA_KEYS.length - 1].at
