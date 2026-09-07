import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { contenido } from '../data/contenido.js'
import { evaluarSoporte, prefiereMenosMovimiento } from '../tresd/soporte.js'
import { PARADAS_CON_MEDIOS } from '../tresd/paradas.js'
import '../estilos/berimbau.css'

const ESPERA_CARGA = 9000 // ms: si three no llega, se cae al sitio en texto

// Cada parada tiene enlace propio: #parada-mestres abre el recorrido ahi.
function paradaDesdeHash(paradas) {
  if (typeof window === 'undefined') return 0
  const hash = window.location.hash.replace('#', '')
  if (!hash) return 0
  const posicion = paradas.findIndex((parada) => `parada-${parada.id}` === hash)
  return posicion >= 0 ? posicion : 0
}

// -------------------------------------------------------------- paneles HTML
// Todo el texto de cada parada existe como HTML de verdad. En el canvas solo
// hay materia: madera, arame, calabaza. Nada de informacion pintada.

function PanelEvento({ irAReserva }) {
  const { hero } = contenido
  return (
    <>
      <p className="berimbau__kicker">{hero.kicker}</p>
      <p className="berimbau__texto">{hero.tagline}</p>
      <p className="berimbau__cupos">{hero.cupos}</p>
      <button type="button" className="btn btn--primario berimbau__cta" onClick={irAReserva}>
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
      <ul className="berimbau__lista">
        {instructores.fichas.map((ficha) => (
          <li key={ficha.nombre}>
            <span className="berimbau__lista-titulo">{ficha.nombre}</span>
            <span className="berimbau__lista-detalle">
              {ficha.rol} · {ficha.disciplinas.join(' + ')}
            </span>
            <span className="berimbau__lista-texto">{ficha.descripcion}</span>
          </li>
        ))}
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
      <p className="berimbau__nota">
        {medios.titulo}: {medios.fotos.map((foto) => foto.titulo).join(' · ')}.{' '}
        <span className="berimbau__pendiente">{medios.pendienteFoto}</span>
      </p>
    </>
  )
}

function PanelReserva({ irAReserva }) {
  const { precios } = contenido
  return (
    <>
      <p className="berimbau__precio">{precios.reserva}</p>
      <p className="berimbau__texto">{precios.reservaDetalle}</p>
      <p className="berimbau__nota">
        {precios.totalEtiqueta} {precios.total}
      </p>
      <p className="berimbau__cupos">{precios.cupos.texto}</p>
      <button type="button" className="btn btn--primario berimbau__cta" onClick={irAReserva}>
        {precios.cta}
      </button>
    </>
  )
}

function CuerpoParada({ indice, parada, irAReserva }) {
  if (indice === 0) return <PanelEvento irAReserva={irAReserva} />
  if (indice === 1) return <PanelDias />
  if (indice === 2) return <PanelMestres />
  if (indice === 3) return <PanelLugar parada={parada} />
  return <PanelReserva irAReserva={irAReserva} />
}

// ------------------------------------------------------- hueco de video HTML
// El video NO va como textura WebGL: sale caro. Se queda como capa HTML encima
// del canvas, anclada a un punto de la cabaca.

function HuecoVideo({ video, etiqueta, refAncla }) {
  if (video.src) {
    return (
      <div className="berimbau__video" ref={refAncla}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={video.src} poster={video.poster || undefined} controls playsInline preload="none" />
        <span className="berimbau__video-pie">{video.titulo}</span>
      </div>
    )
  }
  return (
    <div className="berimbau__video berimbau__video--vacio" ref={refAncla}>
      <span className="berimbau__video-marca" aria-hidden="true">▶</span>
      <span className="berimbau__video-titulo">{video.titulo}</span>
      <span className="berimbau__video-pie">{etiqueta}</span>
    </div>
  )
}

// ------------------------------------------------------------------ recorrido

export default function Berimbau3D({ alCaer, irAReserva, verTexto }) {
  const { berimbau, medios } = contenido
  const paradas = berimbau.paradas

  const contenedorRef = useRef(null)
  const controlRef = useRef(null)
  const anclasRef = useRef(new Map())
  const ruedaRef = useRef(0)
  const tactoRef = useRef(null)
  const caidoRef = useRef(false)

  const [indice, setIndice] = useState(() => paradaDesdeHash(paradas))
  const indiceInicialRef = useRef(indice)
  const [estado, setEstado] = useState('cargando')
  const [degradado, setDegradado] = useState(false)

  const reducirMovimiento = useMemo(() => prefiereMenosMovimiento(), [])
  const parada = paradas[indice]

  const caer = useCallback(
    (razon) => {
      if (caidoRef.current) return
      caidoRef.current = true
      setEstado('caido')
      alCaer(razon)
    },
    [alCaer],
  )

  // Refs estables por video: registrar el ancla no debe recrear callbacks.
  const refsAncla = useMemo(() => {
    const mapa = new Map()
    for (const video of medios.videos) {
      mapa.set(video.id, (elemento) => {
        if (elemento) anclasRef.current.set(video.id, elemento)
        else anclasRef.current.delete(video.id)
        if (controlRef.current) controlRef.current.registrarAncla(video.id, elemento)
      })
    }
    return mapa
  }, [medios.videos])

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
          medios,
          reducirMovimiento,
          paradaInicial: indiceInicialRef.current,
          alFallar: (razon) => caer(razon),
          alDegradar: () => setDegradado(true),
        })
        if (!control) return
        controlRef.current = control
        for (const [id, elemento] of anclasRef.current) control.registrarAncla(id, elemento)
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
  }, [caer, medios, reducirMovimiento])

  // Mientras el recorrido esta en pantalla, la pagina no hace scroll.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  const irAParada = useCallback(
    (destino) => {
      const siguiente = Math.min(Math.max(destino, 0), paradas.length - 1)
      setIndice(siguiente)
      if (controlRef.current) controlRef.current.irA(siguiente)
      if (window.history && typeof window.history.replaceState === 'function') {
        // replaceState, no hash directo: no llena el historial ni mueve el scroll.
        window.history.replaceState(null, '', `#parada-${paradas[siguiente].id}`)
      }
      // Enganche de audio: aca sonaria el toque de la parada cuando existan los
      // archivos. Hoy no suena nada: sin gesto previo el navegador lo bloquea.
      // reproducirToque(contenido.medios.audio.toques[siguiente])
    },
    [paradas.length],
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

  const mostrarMedios = PARADAS_CON_MEDIOS.includes(indice)

  return (
    <div className="berimbau" data-estado={estado}>
      <div
        className="berimbau__escena"
        ref={contenedorRef}
        onWheel={alRodar}
        onTouchStart={alTocarInicio}
        onTouchEnd={alTocarFin}
      />

      <div className="berimbau__medios" aria-hidden={!mostrarMedios}>
        {medios.videos.map((video) => (
          <HuecoVideo key={video.id} video={video} etiqueta={medios.pendienteVideo} refAncla={refsAncla.get(video.id)} />
        ))}
      </div>

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
        <p className="berimbau__toque">
          <span>{berimbau.toqueEtiqueta}</span> {parada.toque}
        </p>
        <h1 className="berimbau__titulo">{parada.titulo}</h1>
        <p className="berimbau__toque-nota">{parada.toqueNota}</p>
        <p className="berimbau__entradilla">{parada.entradilla}</p>
        <CuerpoParada indice={indice} parada={parada} irAReserva={irAReserva} />
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
                aria-label={`${item.toque} · ${item.titulo}`}
                aria-current={posicion === indice ? 'step' : undefined}
                onClick={() => irAParada(posicion)}
              >
                <span className="berimbau__rail-marca" aria-hidden="true" />
                <span className="berimbau__rail-texto">
                  <span className="berimbau__rail-toque">{item.toque}</span>
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
