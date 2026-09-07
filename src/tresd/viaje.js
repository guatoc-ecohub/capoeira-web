// El viaje, en unidades del mundo.
//
// El berimbau ES el contenido. Un solo barrido continuo: el instrumento entero
// en el vacio -> se baja por la verga -> se pasa por la mano que toca -> se
// ENTRA por la boca de la cabaca -> se recorre la camara de resonancia por
// dentro -> se mira hacia afuera por la boca -> se sale y el instrumento queda
// atras. La posicion del scroll ES la posicion del viaje. No hay cortes ni
// botones de parada.
//
// La verga va de -8 a +8 sobre el eje Y y el arame es la cuerda recta entre las
// puntas: la flecha del arco existe porque esa cuerda dobla la madera.

// Los seis tramos. El id emparejan con contenido.berimbau.paradas y con el
// atributo data-beat de cada seccion del documento.
export const BEATS = [
  { at: 0, id: 'evento' },
  { at: 1, id: 'dias' },
  { at: 2, id: 'tecnica' },
  { at: 3, id: 'mestres' },
  { at: 4, id: 'lugar' },
  { at: 5, id: 'reserva' },
]

export const VERGA = {
  pie: [0, -8, 0],
  control: [4.4, 0, 0],
  punta: [0, 8, 0],
  radioPie: 0.19,
  radioPunta: 0.09,
}

export const ARAME = { radio: 0.055 }

// La cabaca: `boca` es el centro del plano de la boca, que se abre hacia +Z.
// El perfil se lathea, asi que tiene volumen de calabaza y no de casquete, y se
// construye con DOS superficies mas un anillo de canto: la pared tiene grosor y
// la boca se ve como un borde, no como una arista.
export const CABAZA = {
  boca: [0.9, -5.3, 1.75],
  radio: 1.35,
  fondo: 1.52,
  pared: 0.055,
  achatado: 0.92, // la boca es ovalada, mas ancha que alta
  giro: [0.06, -0.12, 0.1],
}

export const CORDINHA = { y: -4.2, radio: 0.3, tubo: 0.04 }
export const DOBRAO = { posicion: [-0.2, -3.2, 0.05], radio: 0.24, grosor: 0.035 }
export const BAQUETA = { posicion: [0.55, -3.5, 0.45], largo: 3.2, radio: 0.04, inclinacion: 0.26 }

// Una sola direccion de luz. El resto es relleno bajo para que la silueta no se
// pierda del todo en la sombra.
export const LUZ = { clave: [0.72, 0.5, 0.48], relleno: 0.16 }

// Las claves de camara. Son MAS que los tramos: los tramos delicados —entrar por
// la boca y girar dentro de la camara de resonancia— se cubren con claves
// intermedias en posiciones fraccionarias.
//
// `fit` decide como se paga una pantalla angosta: cerca de 1 se retrocede sobre
// el eje de vista; en 0 se paga solo abriendo el campo. Adentro de la cabaca
// tiene que ser 0 — retroceder ahi mete la camara a traves de la pared.
export const CAMERA_KEYS = [
  { at: 0, position: [7, 2.5, 27], target: [1.2, 0, 0.4], fov: 34, fit: 0.95, roll: -2 },
  { at: 1, position: [4.2, 5.6, 9.5], target: [1, 4.2, 0.3], fov: 38, fit: 0.85, roll: -1 },
  { at: 2, position: [3, -2.2, 5.4], target: [0.7, -3.3, 0.4], fov: 40, fit: 0.8 },
  // Sobre el eje de la boca: la aproximacion se compromete con la entrada en vez
  // de buscarla de lado.
  { at: 2.55, position: [1.15, -5, 6.4], target: [0.9, -5.25, 1.6], fov: 42, fit: 0.55 },
  { at: 2.82, position: [0.95, -5.22, 2.35], target: [0.9, -5.3, 0.6], fov: 46, fit: 0.3 },
  // Dentro. La camara mira SIEMPRE en direccion rasante al borde de la boca, no
  // de frente a la pared: asi el canto claro cruza el cuadro con el vacio de un
  // lado y la pared del otro. Sin esa referencia el interior se lee como un
  // fondo pardo cualquiera y no como estar adentro de algo.
  { at: 3, position: [0.85, -5.28, 0.5], target: [1.85, -5.45, 1.5], fov: 54, fit: 0 },
  { at: 3.55, position: [0.95, -5.35, 0.55], target: [0.05, -5.15, 1.5], fov: 54, fit: 0 },
  // En la ventana: casi de frente a la salida, con el canto entrando por la
  // derecha para que se lea como mirar hacia afuera y no como vacio a secas.
  { at: 4, position: [1.35, -5.35, 0.75], target: [1.15, -5.25, 4.2], fov: 58, fit: 0 },
  { at: 4.6, position: [1.1, -5.3, 1.55], target: [1.05, -5.25, 5], fov: 52, fit: 0.05 },
  { at: 5, position: [2.6, -4.2, 8.2], target: [1, -5, 0.6], fov: 44, fit: 0.7 },
]

export const ULTIMA_CLAVE = CAMERA_KEYS[CAMERA_KEYS.length - 1].at
