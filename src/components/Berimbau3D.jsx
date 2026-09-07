import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { contenido } from '../data/contenido.js'
import { evaluarSoporte, prefiereMenosMovimiento } from '../tresd/soporte.js'
import { PARADA_LUGAR } from '../tresd/paradas.js'
import FormularioReserva from './FormularioReserva.jsx'
import '../estilos/berimbau.css'

const ESPERA_CARGA = 9000 // ms: si three no llega, se cae al sitio en texto

// Las cuatro artes marciales salen de los bloques de técnica, que son los que el
// operador dictó. No hay lista paralela que se pueda desincronizar.
const artesMarciales = contenido.tecnica.bloques.map((bloque) => bloque.titulo).join(' · ')
const CONSULTA_ANGOSTA = '(max-width: 799px)'

// Cada parada tiene enlace propio: #parada-mestres abre el recorrido ahi.
function paradaDesdeHash(paradas) {
  if (typeof window === 'undefined') return 0
  const hash = window.location.hash.replace('#', '')
  if (!hash) return 0
  const posicion = paradas.findIndex((parada) => `parada-${parada.id}` === hash)
  return posicion >= 0 ? posicion : 0
}

// -------------------------------------------------------------- material 2D
// Ni las fotos ni el video van pegados a la geometria del berimbau: viven en
// las paradas del recorrido, que es donde cuentan algo.

function Foto({ foto, className, conPie = true, ...resto }) {
  const [visible, setVisible] = useState(true)
  if (!foto || !foto.src || !visible) return null
  return (
    <figure className={className}>
      <img
        src={foto.src}
        alt={foto.alt}
        width={foto.ancho}
        height={foto.alto}
        loading="lazy"
        decoding="async"
        onError={() => setVisible(false)}
        {...resto}
      />
      {conPie ? <figcaption>{foto.titulo}</figcaption> : null}
    </figure>
  )
}

// El clip de la cascada. Sin audio de origen, en bucle y arrancado a mano:
// con preload="none" nada se baja hasta que el visitante llega a esta parada.
// Con prefers-reduced-motion o si el video no puede correr, queda el cuadro
// fijo, que es el mismo encuadre: el cambio no mueve la composicion.
function VideoLugar({ video, reducirMovimiento }) {
  const [fallo, setFallo] = useState(false)
  const videoRef = useRef(null)
  const mostrarVideo = Boolean(video.src) && !reducirMovimiento && !fallo

  useEffect(() => {
    if (!mostrarVideo) return undefined
    const elemento = videoRef.current
    if (!elemento) return undefined
    const intento = elemento.play()
    if (intento && typeof intento.catch === 'function') intento.catch(() => setFallo(true))
    return () => elemento.pause()
  }, [mostrarVideo])

  if (mostrarVideo) {
    return (
      <video
        ref={videoRef}
        className="berimbau__destacado"
        src={video.src}
        poster={video.poster || undefined}
        aria-label={video.alt}
        muted
        loop
        playsInline
        preload="none"
        onError={() => setFallo(true)}
      />
    )
  }
  if (video.poster) {
    return <img className="berimbau__destacado" src={video.poster} alt={video.alt} decoding="async" />
  }
  return null
}

// Las dos piezas grandes del lugar, una al lado de la otra: la bananeira dentro
// del domo (que dice de un golpe que aquí se practica capoeira, que el lugar es
// este y que la cascada está al frente) y el agua cayendo. Las dos son verticales
// y casi de la misma proporcion, asi que entran enteras: no se recorta ninguna.
// La de bananeira sobre todo NO admite recorte lateral: el valle va a la
// izquierda y el cuerpo al centro.
function MediosLugar({ destacados, reducirMovimiento }) {
  return destacados.map((pieza) => {
    if (pieza.tipo === 'video') {
      return <VideoLugar key={pieza.id} video={pieza} reducirMovimiento={reducirMovimiento} />
    }
    return (
      <img
        key={pieza.id}
        className="berimbau__destacado"
        src={pieza.src}
        alt={pieza.alt}
        width={pieza.ancho}
        height={pieza.alto}
        decoding="async"
      />
    )
  })
}

// -------------------------------------------------------------- paneles HTML
// Todo el texto de cada parada existe como HTML de verdad. En el canvas solo
// hay materia: madera, arame, calabaza.

function PanelEvento({ irAParada }) {
  const { hero } = contenido
  return (
    <>
      <p className="berimbau__texto">{hero.tagline}</p>
      <p className="berimbau__cupos">{hero.cupos}</p>
      <button
        type="button"
        className="btn btn--primario berimbau__cta"
        onClick={() => irAParada(contenido.berimbau.paradas.length - 1)}
      >
        {hero.reservaCta}
      </button>
    </>
  )
}

function PanelDias() {
  const { agenda } = contenido
  return (
    <>
      <p className="berimbau__texto">{agenda.intro}</p>
      <ul className="berimbau__lista">
        {agenda.dias.map((dia) => (
          <li key={dia.dia}>
            <span className="berimbau__lista-titulo">{dia.dia}</span>
            <span className="berimbau__lista-detalle">
              {dia.hito} · {dia.hora} · {dia.sede}
            </span>
            {dia.roda ? <span className="badge badge--roda">Roda</span> : null}
          </li>
        ))}
      </ul>
    </>
  )
}

function PanelMestres() {
  const { instructores } = contenido
  return (
    <>
      <p className="berimbau__texto">{instructores.intro}</p>
      <ul className="berimbau__mestres">
        {instructores.fichas.map((ficha) => (
          <li key={ficha.nombre}>
            <Foto
              foto={{ src: ficha.foto, alt: ficha.fotoAlt, titulo: ficha.nombre }}
              className="berimbau__mestre-foto"
              conPie={false}
            />
            <div>
              <span className="berimbau__lista-titulo">{ficha.nombre}</span>
              <span className="berimbau__lista-detalle">
                {ficha.rol} · {ficha.disciplinas.join(' + ')}
              </span>
              <span className="berimbau__lista-texto">{ficha.descripcion}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

// Quién dicta cada arte no se escribe a mano: se cruza contra las `disciplinas`
// de cada ficha, que son texto dictado por el operador. Si un arte no apareciera
// en ninguna ficha, no se inventa un profesor: sencillamente no se muestra.
function quienDicta(arte) {
  const ficha = contenido.instructores.fichas.find((candidata) => candidata.disciplinas.includes(arte))
  return ficha ? ficha.nombre : null
}

function PanelTecnica() {
  const { tecnica } = contenido
  return (
    <>
      <p className="berimbau__texto">{tecnica.intro}</p>
      <ul className="berimbau__lista">
        {tecnica.bloques.map((bloque) => {
          const dicta = quienDicta(bloque.titulo)
          return (
            <li key={bloque.titulo}>
              <span className="berimbau__lista-titulo">
                <span className="berimbau__numero">{bloque.numero}</span> {bloque.titulo}
              </span>
              {dicta ? (
                <span className="berimbau__lista-detalle">
                  {tecnica.dictaLabel} {dicta}
                </span>
              ) : null}
              <span className="berimbau__lista-texto">{bloque.texto}</span>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function PanelLugar({ parada }) {
  const { medios } = contenido
  return (
    <>
      <ul className="berimbau__lista">
        {(parada.sedes || []).map((sede) => (
          <li key={sede.nombre}>
            <span className="berimbau__lista-titulo">{sede.nombre}</span>
            <span className="berimbau__lista-detalle">{sede.detalle}</span>
          </li>
        ))}
      </ul>
      <p className="berimbau__rotulo">{medios.titulo}</p>
      <div className="berimbau__fotos">
        {medios.apoyo.map((foto) => (
          <Foto key={foto.id} foto={foto} className="berimbau__foto" />
        ))}
      </div>
    </>
  )
}

function PanelReserva() {
  const { precios } = contenido
  return (
    <>
      <p className="berimbau__precio">{precios.reserva}</p>
      <p className="berimbau__texto">{precios.reservaDetalle}</p>
      <p className="berimbau__nota">
        {precios.totalEtiqueta} {precios.total}
      </p>
      <p className="berimbau__cupos">{precios.cupos.texto}</p>
      <p className="berimbau__rotulo">{precios.earlyBird}</p>
      <ul className="berimbau__cohortes" aria-label={precios.cohortesAria}>
        {precios.cohortes.map((cohorte) => (
          <li key={cohorte.nombre} data-activa={cohorte.estado === 'actual'}>
            <span className="berimbau__lista-detalle">{cohorte.nombre}</span>
            <strong>{cohorte.precio}</strong>
            <span className={`badge ${cohorte.estado === 'actual' ? 'badge--activa' : 'badge--agotada'}`}>
              {cohorte.estado === 'actual' ? precios.cohorteActual : precios.cohorteAgotada}
            </span>
          </li>
        ))}
      </ul>
      <FormularioReserva idPrefijo="recorrido" />
    </>
  )
}

function CuerpoParada({ indice, parada, irAParada }) {
  if (indice === 0) return <PanelEvento irAParada={irAParada} />
  if (indice === 1) return <PanelDias />
  if (indice === 2) return <PanelMestres />
  if (indice === 3) return <PanelTecnica />
  if (indice === PARADA_LUGAR) return <PanelLugar parada={parada} />
  return <PanelReserva />
}

// ------------------------------------------------------------------ recorrido

export default function Berimbau3D({ alCaer, verTexto }) {
  const { berimbau, medios } = contenido
  const paradas = berimbau.paradas

  const contenedorRef = useRef(null)
  const controlRef = useRef(null)
  const ruedaRef = useRef(0)
  const tactoRef = useRef(null)
  const caidoRef = useRef(false)

  const [indice, setIndice] = useState(() => paradaDesdeHash(paradas))
  const indiceInicialRef = useRef(indice)
  const [estado, setEstado] = useState('cargando')
  const [degradado, setDegradado] = useState(false)
  const [angosto, setAngosto] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA_ANGOSTA).matches,
  )

  const reducirMovimiento = useMemo(() => prefiereMenosMovimiento(), [])
  const parada = paradas[indice]
  const enLugar = indice === PARADA_LUGAR
  // La parada de las artes marciales se rotula con las artes que dictan los
  // profesores: ahí la etiqueta es información, no adorno.
  const rotulo = parada.rotulo || (parada.id === 'tecnica' ? artesMarciales : null)

  const caer = useCallback(
    (razon) => {
      if (caidoRef.current) return
      caidoRef.current = true
      setEstado('caido')
      alCaer(razon)
    },
    [alCaer],
  )

  // Arranque: primero se mira si el equipo aguanta, y solo entonces se baja three.
  useEffect(() => {
    const soporte = evaluarSoporte()
    if (!soporte.ok) {
      caer(soporte.razon)
      return undefined
    }

    let vigente = true
    const demora = window.setTimeout(() => {
      if (vigente && !controlRef.current) caer('demora')
    }, ESPERA_CARGA)

    import('../tresd/escena.js')
      .then(({ crearEscena }) => {
        if (!vigente || !contenedorRef.current) return
        const control = crearEscena({
          contenedor: contenedorRef.current,
          reducirMovimiento,
          paradaInicial: indiceInicialRef.current,
          alFallar: (razon) => caer(razon),
          alDegradar: () => setDegradado(true),
        })
        if (!control) return
        controlRef.current = control
        setEstado('listo')
      })
      .catch(() => {
        if (vigente) caer('carga')
      })

    return () => {
      vigente = false
      window.clearTimeout(demora)
      if (controlRef.current) {
        controlRef.current.destruir()
        controlRef.current = null
      }
    }
  }, [caer, reducirMovimiento])

  // Mientras el recorrido esta en pantalla, la pagina no hace scroll.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const consulta = window.matchMedia(CONSULTA_ANGOSTA)
    const alCambiar = (evento) => setAngosto(evento.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  // En celular el clip tapa el canvas entero: dibujar debajo de un video que
  // corre es justo lo que tumba los cuadros en gama media. Se espera a que
  // termine el viaje para no congelar la camara a mitad de camino.
  useEffect(() => {
    const control = controlRef.current
    if (!control) return undefined
    const tapado = angosto && enLugar && medios.destacados.some((pieza) => pieza.src)
    if (!tapado) {
      control.pausar(false)
      return undefined
    }
    const espera = window.setTimeout(() => control.pausar(true), 3000)
    return () => {
      window.clearTimeout(espera)
      control.pausar(false)
    }
  }, [angosto, enLugar, estado, medios.destacados])

  const irAParada = useCallback(
    (destino) => {
      const siguiente = Math.min(Math.max(destino, 0), paradas.length - 1)
      setIndice(siguiente)
      if (controlRef.current) controlRef.current.irA(siguiente)
      if (window.history && typeof window.history.replaceState === 'function') {
        // replaceState, no hash directo: no llena el historial ni mueve el scroll.
        window.history.replaceState(null, '', `#parada-${paradas[siguiente].id}`)
      }
      // Enganche de audio: aca sonaria la pista de la parada cuando existan los
      // archivos. Hoy no suena nada: sin gesto previo el navegador lo bloquea.
      // reproducirPista(contenido.medios.audio.pistas[siguiente])
    },
    [paradas],
  )

  // Teclado: flechas y avance/retroceso de pagina.
  useEffect(() => {
    function alTeclear(evento) {
      if (evento.defaultPrevented || evento.metaKey || evento.ctrlKey || evento.altKey) return
      const foco = document.activeElement
      if (foco && ['INPUT', 'TEXTAREA', 'SELECT'].includes(foco.tagName)) return
      if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(evento.key)) {
        evento.preventDefault()
        irAParada(indice + 1)
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(evento.key)) {
        evento.preventDefault()
        irAParada(indice - 1)
      } else if (evento.key === 'Home') {
        evento.preventDefault()
        irAParada(0)
      } else if (evento.key === 'End') {
        evento.preventDefault()
        irAParada(paradas.length - 1)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [indice, irAParada, paradas.length])

  const alRodar = useCallback(
    (evento) => {
      const ahora = performance.now()
      if (ahora - ruedaRef.current < 620) return
      if (Math.abs(evento.deltaY) < 12) return
      ruedaRef.current = ahora
      irAParada(indice + (evento.deltaY > 0 ? 1 : -1))
    },
    [indice, irAParada],
  )

  const alTocarInicio = useCallback((evento) => {
    const dedo = evento.touches[0]
    tactoRef.current = dedo ? { y: dedo.clientY, t: performance.now() } : null
  }, [])

  const alTocarFin = useCallback(
    (evento) => {
      const inicio = tactoRef.current
      tactoRef.current = null
      if (!inicio) return
      const dedo = evento.changedTouches[0]
      if (!dedo) return
      const salto = inicio.y - dedo.clientY
      if (Math.abs(salto) < 55 || performance.now() - inicio.t > 900) return
      irAParada(indice + (salto > 0 ? 1 : -1))
    },
    [indice, irAParada],
  )

  return (
    <div className="berimbau" data-estado={estado} data-parada={parada.id}>
      <div
        className="berimbau__escena"
        ref={contenedorRef}
        onWheel={alRodar}
        onTouchStart={alTocarInicio}
        onTouchEnd={alTocarFin}
      />

      {enLugar ? <div className="berimbau__velo" aria-hidden="true" /> : null}

      {enLugar ? (
        <div className="berimbau__lugar-marco">
          <MediosLugar destacados={medios.destacados} reducirMovimiento={reducirMovimiento} />
        </div>
      ) : null}

      <header className="berimbau__marca">
        <p className="berimbau__marca-nombre">{berimbau.marca}</p>
        <p className="berimbau__marca-lema">{berimbau.titulo}</p>
      </header>

      <button type="button" className="btn btn--fantasma berimbau__texto-boton" onClick={verTexto}>
        {berimbau.verTexto}
      </button>

      {estado === 'cargando' ? (
        <p className="berimbau__cargando" role="status">
          {berimbau.cargando}
        </p>
      ) : null}

      {degradado ? (
        <p className="berimbau__aviso" role="status">
          {berimbau.avisoRendimiento}
        </p>
      ) : null}

      <section className="berimbau__panel" aria-live="polite" aria-label={berimbau.paradaAria}>
        {rotulo ? <p className="berimbau__parada-rotulo">{rotulo}</p> : null}
        <h1 className="berimbau__titulo">{parada.titulo}</h1>
        <p className="berimbau__entradilla">{parada.entradilla}</p>
        <CuerpoParada indice={indice} parada={parada} irAParada={irAParada} />
        <div className="berimbau__pasos">
          <button type="button" className="berimbau__paso" onClick={() => irAParada(indice - 1)} disabled={indice === 0}>
            {berimbau.anterior}
          </button>
          <button
            type="button"
            className="berimbau__paso"
            onClick={() => irAParada(indice + 1)}
            disabled={indice === paradas.length - 1}
          >
            {berimbau.siguiente}
          </button>
        </div>
      </section>

      <nav className="berimbau__rail" aria-label={berimbau.railAria}>
        <ol>
          {paradas.map((item, posicion) => (
            <li key={item.id}>
              <button
                type="button"
                className="berimbau__rail-boton"
                aria-label={`${berimbau.paradaDe} ${posicion + 1}: ${item.titulo}`}
                aria-current={posicion === indice ? 'step' : undefined}
                onClick={() => irAParada(posicion)}
              >
                <span className="berimbau__rail-marca" aria-hidden="true" />
                <span className="berimbau__rail-texto">
                  <span className="berimbau__rail-indice">{String(posicion + 1).padStart(2, '0')}</span>
                  <span className="berimbau__rail-titulo">{item.titulo}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="berimbau__pista">{berimbau.pista}</p>
      </nav>
    </div>
  )
}
