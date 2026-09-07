// Geometria del recorrido: medidas del instrumento y las paradas de camara.
// Datos planos a proposito (sin three) para que los pueda leer tanto la escena
// como React sin arrastrar el bundle 3D.

// El berimbau vive de pie sobre el eje Y, en el plano Z = 0.
// La verga va de -8 a +8 y el arame es la CUERDA RECTA entre las dos puntas:
// entre madera y cuerda queda un triangulo largo y estrecho. Ese triangulo es
// lo que hace reconocible al instrumento, asi que la flecha del arco esta
// dibujada para que se lea (2,2 sobre 16 de largo).
export const VERGA = {
  pieBase: [0, -8, 0],
  control: [4.4, 0, 0], // control de la bezier: la verga se abre porque el arame la dobla
  punta: [0, 8, 0],
  radioPie: 0.19,
  radioPunta: 0.09,
}

// Grueso de lectura, no de realismo: un arame real seria invisible a esta escala.
export const ARAME = { radio: 0.055 }

// La cabaca va ATADA cerca del extremo de abajo, con la BOCA ABIERTA AL FRENTE.
// `centro` es el plano de la boca; el fondo cerrado queda contra la verga, que
// es donde la cordinha la amarra.
export const CABAZA = {
  centro: [0.75, -5.45, 1.55],
  radio: 1.25,
  fondo: 0.95, // una calabaza cortada es un cuenco, no media esfera exacta
}

// Cordinha: el lazo que amarra la cabaca a la verga. Radio corto a proposito:
// un lazo ancho alcanza a meter su arco delantero DENTRO del cuenco y desde
// adentro se ve como un tubo verde cruzando la pantalla.
// A la altura del FILO de la cabaca, que es donde la cuerda abraza la verga en
// el instrumento de verdad, y ademas es donde se ve: metida detras del cuenco
// la atadura no existe para el visitante.
export const CORDINHA = { y: -4.25, radio: 0.3, tubo: 0.04 }

export const DOBRAO = { posicion: [-0.2, -3.3, 0.05], radio: 0.24, grosor: 0.035 }
export const BAQUETA = { posicion: [0.55, -3.65, 0.45], largo: 3.2, radio: 0.04, inclinacion: 0.26 }

// Las seis paradas. El orden manda: es el mismo de contenido.berimbau.paradas.
// La camara baja por la verga y termina adentro de la cabaca.
export const CAMARA = [
  { id: 'evento', posicion: [4.2, 2.2, 17.8], objetivo: [1, 0, 0.5], fov: 56 },
  { id: 'dias', posicion: [2.6, 5.4, 7.2], objetivo: [0.7, 4.8, 0.2], fov: 46 },
  { id: 'mestres', posicion: [3, 1, 6.6], objetivo: [1.2, 0.3, 0.2], fov: 46 },
  { id: 'tecnica', posicion: [2, -2.3, 4.3], objetivo: [0.5, -3.35, 0.3], fov: 46 },
  { id: 'lugar', posicion: [1.2, -4.85, 6], objetivo: [0.75, -5.37, 0.9], fov: 50 },
  { id: 'reserva', posicion: [0.75, -5.35, 1.35], objetivo: [0.75, -5.6, 0.45], fov: 68 },
]

export const IDS_PARADAS = CAMARA.map((parada) => parada.id)

// La parada del lugar es la unica que trae material de Guatoc encima del canvas.
export const PARADA_LUGAR = IDS_PARADAS.indexOf('lugar')
export const PARADA_RESERVA = IDS_PARADAS.indexOf('reserva')
