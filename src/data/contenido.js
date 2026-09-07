export const contenido = {
  navegacion: [
    { href: '#agenda', label: 'Agenda' },
    { href: '#instructores', label: 'Instructores' },
    { href: '#tecnica', label: 'Técnica' },
    { href: '#precios', label: 'Precios y cupos' },
  ],
  navegacionMarca: 'Guatoc Capoeira',
  navegacionCta: 'Reservar cupo',
  navegacionAria: 'Navegación principal',
  menu: { abrir: 'Abrir menú', cerrar: 'Cerrar menú' },
  saltarContenido: 'Saltar al contenido',
  hero: {
    kicker: '10 · 11 · 12 OCT 2026 • GUATOC · COLOMBIA',
    titulo: 'CAMPAMENTO DE CAPOEIRA',
    tituloLineas: ['CAMPAMENTO DE', 'CAPOEIRA'],
    tagline: 'Artes marciales aplicadas al jogo + fundamentos de competición',
    cupos: '12 cupos limitados · trabajo cercano y personalizado',
    reservaCta: 'Reservar cupo',
    instructoresCta: 'Conocer los mestres',
  },
  agenda: {
    eyebrow: 'El encuentro',
    titulo: 'TRES DÍAS, DOS RODAS',
    intro: 'Un campamento intensivo para llevar la técnica al jogo, entrenar con intención y compartir la energía de la roda.',
    caption: 'Agenda del Campamento de Capoeira',
    columnas: ['Día', 'Hito', 'Hora', 'Sede', 'Roda'],
    rodaSi: 'Sí',
    rodaNo: 'No',
    dias: [
      { dia: 'Sábado 10', hito: 'Roda de bienvenida', hora: '3:30 PM', sede: 'Guatoc', roda: true },
      { dia: 'Domingo 11', hito: 'Entrenamiento a fondo', hora: 'Todo el día', sede: 'Guatoc', roda: false },
      { dia: 'Lunes 12', hito: 'Roda de despedida', hora: '4:00 PM', sede: 'Coliseo vereda El Curí', roda: true },
    ],
  },
  instructores: {
    eyebrow: 'Quienes guían el jogo',
    titulo: 'INSTRUCTORES',
    intro: 'Tres miradas para entrenar el cuerpo de combate sin perder el contexto, el ritmo y la inteligencia de la capoeira.',
    fotoPendiente: 'Foto pendiente',
    disciplinasLabel: 'Disciplinas de',
    fichas: [
      {
        rol: 'Contramestre',
        nombre: 'C.m. Vermelho',
        disciplinas: ['BJJ', 'Muay Thai'],
        descripcion: 'Entrenamiento de BJJ y Muay Thai, enfocada a la capoeira: cómo se utilizan las diferentes técnicas en capoeira sin salirse de su contexto.',
        foto: '/instructores/vermelho.png',
        fotoAlt: 'C.m. Vermelho en el gimnasio',
      },
      {
        rol: 'Contramestre',
        nombre: 'C.m. Águila',
        disciplinas: ['Kick Boxing', 'Capoeira'],
        descripcion: 'Entrenamiento de Kick Boxing y capoeira, enfoque y aplicación a la capoeira competitiva y estrategia manteniendo su objetividad.',
        foto: '/instructores/aguila.png',
        fotoAlt: 'Fotografía de C.m. Águila pendiente',
      },
      {
        rol: 'Profesor',
        nombre: 'Profesor Capeta',
        disciplinas: ['Boxeo', 'Capoeira'],
        descripcion: 'Entrenamiento de boxeo aplicado a la capoeira, aplicación de técnicas sin salir del contexto del jogo.',
        foto: '/instructores/capeta.png',
        fotoAlt: 'Tarjeta de Profesor Capeta en el Campeonato Sudamericano Lima 2025',
      },
    ],
  },
  tecnica: {
    eyebrow: 'El cuerpo como lenguaje',
    titulo: 'TÉCNICA PARA EL JOGO',
    intro: 'Las disciplinas se encuentran con la capoeira para afinar lectura, distancia, control y estrategia dentro de la roda.',
    bloques: [
      { numero: '01', titulo: 'BJJ', texto: 'Control y transiciones aplicadas a la capoeira, sin salirse de su contexto.' },
      { numero: '02', titulo: 'Muay Thai', texto: 'Distancia, equilibrio y uso inteligente de las diferentes técnicas en capoeira.' },
      { numero: '03', titulo: 'Kick Boxing', texto: 'Enfoque y aplicación a la capoeira competitiva, con estrategia y objetividad.' },
      { numero: '04', titulo: 'Boxeo', texto: 'Técnicas de boxeo aplicadas a la capoeira sin perder el contexto del jogo.' },
    ],
  },
  precios: {
    eyebrow: 'Asegure su lugar',
    titulo: 'PRECIOS Y CUPOS',
    intro: 'La reserva asegura el cupo y desbloquea el contenido del campamento. El valor restante se confirma según la cohorte.',
    reserva: '$100.000',
    reservaDetalle: 'Reserva · asegura el cupo y desbloquea el contenido',
    total: '(reserva + cuota, por confirmar)',
    reservaEtiqueta: 'Reserva',
    totalEtiqueta: 'Total marcado:',
    cta: 'Reservar mi cupo',
    earlyBird: 'Entre más pronto reserve, menos paga.',
    cohortes: [
      { nombre: 'Cohorte actual', estado: 'actual', detalle: 'Early-bird vigente', precio: '$100.000', nota: 'Valor de reserva' },
      { nombre: 'Cohorte siguiente', estado: 'agotada', detalle: 'Early-bird', precio: 'Por confirmar', nota: 'Cupo no disponible' },
      { nombre: 'Última cohorte', estado: 'agotada', detalle: 'Tarifa final', precio: 'Por confirmar', nota: 'Cupo no disponible' },
    ],
    cupos: { disponibles: 12, total: 12, texto: 'Quedan 12 de 12 cupos' },
    cuposDisponibles: 'cupos disponibles',
    cohortesAria: 'Cohortes early-bird',
    cohorteActual: 'Cohorte actual',
    cohorteAgotada: 'Agotada',
  },
  reserva: {
    eyebrow: 'Primer paso',
    titulo: 'RESERVE SU CUPO',
    intro: 'Déjenos sus datos para registrar su interés. El equipo del campamento le contactará para confirmar el pago y los detalles.',
    nombreLabel: 'Nombre completo',
    correoLabel: 'Correo electrónico',
    celularLabel: 'Celular',
    celularAyuda: 'Opcional',
    formularioTitulo: 'Datos de contacto',
    enviar: 'Solicitar reserva',
    nota: 'No hacemos cobros en este formulario. Su cupo se confirma al coordinar la reserva de $100.000.',
    mensajeExito: 'Datos validados. El envío se habilitará al conectar el backend.',
    errores: {
      nombre: 'Escriba su nombre completo.',
      correo: 'Escriba su correo electrónico.',
      correoFormato: 'Revise el formato del correo.',
    },
  },
  footer: {
    marca: 'Guatoc Capoeira',
    detalle: '10 · 11 · 12 octubre de 2026 · Guatoc, Colombia',
    lema: 'Artes marciales aplicadas al jogo',
  },
  // Recorrido 3D. El berimbau manda la roda: su toque decide qué juego se juega,
  // así que el instrumento es el menú. El recorrido NO es un adorno con un botón
  // al final: entre las seis paradas tiene que caber toda la información del
  // evento (qué es, cuándo, quiénes, qué se entrena, dónde y cómo reservar).
  // El orden de `paradas` es el mismo de CAMARA en src/tresd/paradas.js.
  berimbau: {
    marca: 'Guatoc Capoeira',
    titulo: 'El berimbau manda',
    cargando: 'Templando el arame…',
    pista: 'Use las flechas, la rueda o el rail para recorrer el instrumento.',
    railAria: 'Paradas del recorrido por el berimbau',
    paradaAria: 'Contenido de la parada',
    anterior: 'Parada anterior',
    siguiente: 'Parada siguiente',
    verTexto: 'Ver todo en texto',
    volver: 'Volver al berimbau',
    avisoFallback: 'El recorrido en 3D no corrió en este equipo, así que acá está el mismo contenido en texto.',
    avisoTexto: 'Está viendo el campamento en texto. El recorrido por el berimbau sigue disponible.',
    avisoRendimiento: 'Bajamos la calidad para sostener el movimiento.',
    toqueEtiqueta: 'Toque',
    paradas: [
      {
        id: 'evento',
        toque: 'Angola',
        toqueNota: 'El toque más antiguo: jogo bajo, pausado, de mirada larga.',
        titulo: 'El campamento',
        entradilla: 'Tres días de entrenamiento en Guatoc, con cupos contados para que el trabajo sea cercano.',
      },
      {
        id: 'dias',
        toque: 'São Bento Grande',
        toqueNota: 'El toque rápido: el jogo sube, se aprieta y pide respuesta.',
        titulo: 'Tres días, dos rodas',
        entradilla: 'Abre una roda, cierra otra, y en medio queda el día largo de entrenamiento.',
      },
      {
        id: 'mestres',
        toque: 'Iúna',
        toqueNota: 'El toque de los graduados: en la roda solo entran los formados.',
        titulo: 'Los mestres',
        entradilla: 'Tres miradas distintas sobre el mismo jogo, cada una con su disciplina de combate.',
      },
      {
        id: 'tecnica',
        toque: 'Benguela',
        toqueNota: 'Toque lento, jogo de dentro: la técnica se trabaja de cerca.',
        titulo: 'Técnica para el jogo',
        entradilla: 'Cuatro disciplinas entran a la roda sin sacar a nadie de su contexto.',
      },
      {
        id: 'lugar',
        toque: 'Cavalaria',
        toqueNota: 'El toque que avisa quién viene llegando al terreiro.',
        titulo: 'El lugar',
        entradilla: 'Guatoc mira de frente la cascada más alta de Colombia. Ahí se entrena, y el coliseo de la vereda El Curí cierra el campamento.',
        sedes: [
          { nombre: 'Guatoc', detalle: 'Frente a la cascada más alta de Colombia. Ahí se entrena y se arma la roda de bienvenida: sábado y domingo.' },
          { nombre: 'Coliseo de la vereda El Curí', detalle: 'La roda de despedida, el lunes a las 4:00 PM.' },
        ],
      },
      {
        id: 'reserva',
        toque: 'Santa Maria',
        toqueNota: 'El toque del dobrão en el piso de la roda: juega quien lo levanta.',
        titulo: 'Reservar el cupo',
        entradilla: 'La reserva asegura el cupo y desbloquea el contenido del campamento.',
      },
    ],
  },
  // Material de Guatoc. Ni una foto va pegada a la geometría del berimbau: todas
  // viven en la parada del lugar. Nada de huecos de taller — lo que no exista,
  // no se pinta, y la sección se acomoda a lo que haya.
  //
  // Para sumar material: agregue la entrada con su `src`. `destacados` se pinta
  // grande (dos piezas verticales, una al lado de la otra); `apoyo`, en miniatura
  // dentro del panel. Todo se descarga SOLO al llegar a esta parada.
  medios: {
    titulo: 'Guatoc',
    destacados: [
      {
        id: 'bananeira',
        tipo: 'foto',
        src: '/guatoc/domo-bananeira.jpg',
        ancho: 574,
        alto: 1020,
        titulo: 'Bananeira en el domo',
        alt: 'Una persona en bananeira dentro del domo geodésico de Guatoc, sobre el piso de madera en espiga, con el ventanal triangular y el valle al fondo',
      },
      {
        id: 'chorrera',
        tipo: 'video',
        src: '/guatoc/chorrera-loop.mp4',
        poster: '/guatoc/chorrera-poster.jpg',
        ancho: 720,
        alto: 1280,
        titulo: 'El agua cayendo',
        alt: 'La cascada más alta de Colombia cayendo por el filo de la montaña, frente a Guatoc',
      },
    ],
    apoyo: [
      {
        id: 'domo-interior',
        src: '/guatoc/domo-interior.jpg',
        ancho: 964,
        alto: 1280,
        titulo: 'El domo por dentro',
        alt: 'El interior del domo geodésico: piso de madera, estructura triangular, estantería y mecedora',
      },
      {
        id: 'terraza',
        src: '/guatoc/domo-terraza-niebla.jpg',
        ancho: 964,
        alto: 1280,
        titulo: 'La terraza en la niebla',
        alt: 'La terraza de madera del domo, el árbol y la niebla tapando el valle',
      },
      {
        id: 'valle',
        src: '/guatoc/chorrera.jpg',
        ancho: 1280,
        alto: 964,
        titulo: 'El valle desde el filo',
        alt: 'El filo de la montaña con la cascada asomando entre la niebla, visto desde Guatoc',
      },
    ],
    // Enganche de audio: sin sonido por ahora, el navegador bloquea el autoplay.
    // Ponga la ruta del toque y conecte reproducirToque() en Berimbau3D.jsx.
    audio: {
      nota: 'Sin audio por ahora. Cada parada ya sabe cuál toque le corresponde.',
      toques: [
        { id: 'angola', src: null },
        { id: 'sao-bento-grande', src: null },
        { id: 'iuna', src: null },
        { id: 'benguela', src: null },
        { id: 'cavalaria', src: null },
        { id: 'santa-maria', src: null },
      ],
    },
  },
}

export const agenda = contenido.agenda.dias
export const instructores = contenido.instructores.fichas
export const tecnica = contenido.tecnica.bloques
export const paradasBerimbau = contenido.berimbau.paradas
export const medios = contenido.medios
