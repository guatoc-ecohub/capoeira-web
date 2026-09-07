// Geometria del recorrido: medidas del instrumento y las paradas de camara.
// Datos planos a proposito (sin three) para que los pueda leer tanto la escena
// como React sin arrastrar el bundle 3D.

// El berimbau vive de pie sobre el eje Y, en el plano Z = 0.
// La verga va de -8 a +8 y se arquea hacia +X; el arame es la cuerda recta.
export const VERGA = {
  pieBase: [0, -8, 0],
  control: [3.2, 0, 0], // control de la bezier cuadratica: la flecha del arco
  punta: [0, 8, 0],
  radioPie: 0.17,
  radioPunta: 0.085,
}

export const ARAME = { radio: 0.032 }

// La cabaca va cerca del extremo de abajo, no en el centro.
// `centro` es el plano de la BOCA. La calabaza se abre hacia +Z (hacia el
// visitante) y su fondo cerrado queda contra la verga y el arame, como en el
// instrumento de verdad: desde el frente la cabaca tapa el palo, no al reves.
export const CABAZA = {
  centro: [0.3, -5.8, 2.4],
  radio: 1.7,
  fondo: 1.12, // que tan honda es respecto al radio (una calabaza no es media esfera)
}

// Reparto de la informacion sobre la pared interna de la cabaca.
// azimut: giro alrededor del eje Y, medido desde el fondo (-Z). elevacion en radianes.
export const MARCOS_FOTO = [
  { azimut: -0.74, elevacion: 0.24 },
  { azimut: -0.37, elevacion: 0.31 },
  { azimut: 0, elevacion: 0.33 },
  { azimut: 0.37, elevacion: 0.31 },
  { azimut: 0.74, elevacion: 0.24 },
]
export const MARCO_TAMANO = { ancho: 0.5, alto: 0.36, radio: 1.46 }

// Anclas para la capa HTML de video (el video no va como textura WebGL).
// Van abajo y abiertas para no chocar con la placa ni con el rail.
export const ANCLAS_VIDEO = [
  { azimut: -0.8, elevacion: -0.55, radio: 1.5 },
  { azimut: 0.8, elevacion: -0.55, radio: 1.5 },
]

// Placa grabada al fondo de la cabaca, donde cae la parada de reserva.
export const PLACA = { azimut: 0, elevacion: -0.4, radio: 1.3, ancho: 0.56, alto: 0.26 }

export const DOBRAO = { posicion: [-0.21, -3.45, 0.06], radio: 0.26, grosor: 0.035 }
export const BAQUETA = { posicion: [0.5, -3.8, 0.5], largo: 3.4, radio: 0.042, inclinacion: 0.26 }

export const RODA = { y: -8.55, radios: [7.6, 5.2] }

// Las cinco paradas. El orden manda: es el mismo de contenido.berimbau.paradas.
// La camara baja por la verga y termina adentro de la cabaca.
export const CAMARA = [
  { id: 'evento', posicion: [5.2, 1.2, 16.6], objetivo: [0.5, 0.4, 0], fov: 58 },
  { id: 'dias', posicion: [3.4, 5, 7.4], objetivo: [0.55, 4.4, 0], fov: 50 },
  { id: 'mestres', posicion: [2.8, -2.55, 5.7], objetivo: [0.4, -3.5, 0], fov: 48 },
  { id: 'lugar', posicion: [0.75, -5.5, 8.2], objetivo: [0.3, -5.75, 1.3], fov: 50 },
  { id: 'reserva', posicion: [0.3, -5.88, 2.15], objetivo: [0.3, -6.24, 1.06], fov: 66 },
]

export const IDS_PARADAS = CAMARA.map((parada) => parada.id)

// Paradas donde la cabaca esta en cuadro: solo ahi tiene sentido pintar la capa
// HTML de los videos.
export const PARADAS_CON_MEDIOS = [3]

// Direccion unitaria dentro de la cabaca para un azimut/elevacion dados.
export function direccionCabaza(azimut, elevacion) {
  const cos = Math.cos(elevacion)
  return [Math.sin(azimut) * cos, Math.sin(elevacion), -Math.cos(azimut) * cos]
}
