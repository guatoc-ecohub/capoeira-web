import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { contenido } from '../data/contenido.js'
import { evaluarSoporte, prefiereMenosMovimiento } from '../tresd/soporte.js'
import { arrancarEditorial } from '../tresd/editorial.js'
import { BEATS } from '../tresd/viaje.js'
import FormularioReserva from './FormularioReserva.jsx'
import '../estilos/berimbau.css'

const ESPERA_CARGA = 9000 // ms: si three no llega, se cae al sitio en texto

// Las cuatro artes marciales salen de los bloques de técnica, que son los que el
// operador dictó. No hay lista paralela que se pueda desincronizar.
const artesMarciales = contenido.tecnica.bloques.map((bloque) => bloque.titulo).join(' · ')

// Quién dicta cada arte no se escribe a mano: se cruza contra las `disciplinas`
// de cada ficha. Si un arte no apareciera en ninguna, no se inventa un profesor.
function quienDicta(arte) {
  const ficha = contenido.instructores.fichas.find((candidata) => candidata.disciplinas.includes(arte))
  return ficha ? ficha.nombre : null
}

// Lo que no exista, no se pinta. Nada de huecos de taller.
function Foto({ foto, className, conPie = true }) {
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
      />
      {conPie ? <figcaption>{foto.titulo}</figcaption> : null}
    </figure>
  )
}

// El clip solo se baja y solo corre cuando su tramo está en pantalla.
function ClipGuatoc({ video, reducirMovimiento }) {
  const [fallo, setFallo] = useState(false)
  const videoRef = useRef(null)
  const mostrar = Boolean(video.src) && !reducirMovimiento && !fallo

  useEffect(() => {
    const elemento = videoRef.current
    if (!mostrar || !elemento || typeof IntersectionObserver !== 'function') return undefined
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            const intento = elemento.play()
            if (intento && typeof intento.catch === 'function') intento.catch(() => {})
          } else {
            elemento.pause()
          }
        }
      },
      { threshold: 0.2 },
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [mostrar])

  if (mostrar) {
    return (
      <video
        ref={videoRef}
        className="viaje__pieza"
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
  if (video.poster) return <img className="viaje__pieza" src={video.poster} alt={video.alt} decoding="async" />
  return null
}

// ------------------------------------------------------------- los tramos
// La copia va en el flujo del documento, tramo por tramo, y sube con el scroll
// mientras la cámara vuela. No hay panel fijo al costado ni botones de parada:
// la posición del scroll ES la posición del viaje.

function CuerpoEvento() {
  const { hero } = contenido
  return (
    <>
      <p className="viaje__texto reveal">{hero.tagline}</p>
      <p className="viaje__cupos reveal">{hero.cupos}</p>
      <p className="viaje__pie reveal">{contenido.berimbau.pista}</p>
    </>
  )
}

function CuerpoDias() {
  const { agenda } = contenido
  return (
    <>
      <p className="viaje__texto reveal">{agenda.intro}</p>
      <ol className="viaje__lista">
        {agenda.dias.map((dia, i) => (
          <li key={dia.dia} className="reveal" style={{ '--retardo': `${i * 90}ms` }}>
            <span className="viaje__indice">{String(i + 1).padStart(2, '0')}</span>
            <span className="viaje__lista-titulo">{dia.dia}</span>
            <span className="viaje__lista-detalle">
              {dia.hito} · {dia.hora} · {dia.sede}
            </span>
            {dia.roda ? <span className="badge badge--roda">Roda</span> : null}
          </li>
        ))}
      </ol>
    </>
  )
}

function CuerpoTecnica() {
  const { tecnica } = contenido
  return (
    <>
      <p className="viaje__texto reveal">{tecnica.intro}</p>
      <ol className="viaje__lista">
        {tecnica.bloques.map((bloque, i) => {
          const dicta = quienDicta(bloque.titulo)
          return (
            <li key={bloque.titulo} className="reveal" style={{ '--retardo': `${i * 90}ms` }}>
              <span className="viaje__indice">{bloque.numero}</span>
              <span className="viaje__lista-titulo">{bloque.titulo}</span>
              {dicta ? (
                <span className="viaje__lista-detalle">
                  {tecnica.dictaLabel} {dicta}
                </span>
              ) : null}
              <span className="viaje__lista-texto">{bloque.texto}</span>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function CuerpoMestres() {
  const { instructores } = contenido
  return (
    <>
      <p className="viaje__texto reveal">{instructores.intro}</p>
      <ul className="viaje__mestres">
        {instructores.fichas.map((ficha, i) => (
          <li key={ficha.nombre} className="reveal" style={{ '--retardo': `${i * 90}ms` }}>
            <Foto
              foto={{ src: ficha.foto, alt: ficha.fotoAlt, titulo: ficha.nombre }}
              className="viaje__mestre-foto"
              conPie={false}
            />
            <div>
              <span className="viaje__lista-titulo">{ficha.nombre}</span>
              <span className="viaje__lista-detalle">
                {ficha.rol} · {ficha.disciplinas.join(' + ')}
              </span>
              <span className="viaje__lista-texto">{ficha.descripcion}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function CuerpoLugar({ tramo, reducirMovimiento }) {
  const { medios } = contenido
  const [foto, video] = medios.destacados
  return (
    <>
      <ul className="viaje__lista">
        {(tramo.sedes || []).map((sede, i) => (
          <li key={sede.nombre} className="reveal" style={{ '--retardo': `${i * 90}ms` }}>
            <span className="viaje__lista-titulo">{sede.nombre}</span>
            <span className="viaje__lista-detalle">{sede.detalle}</span>
          </li>
        ))}
      </ul>
      {/* La ventana: lo que se ve al mirar hacia afuera por la boca de la cabaça. */}
      <div className="viaje__ventana reveal">
        {foto && foto.src ? (
          <img className="viaje__pieza" src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} decoding="async" />
        ) : null}
        {video ? <ClipGuatoc video={video} reducirMovimiento={reducirMovimiento} /> : null}
      </div>
      <div className="viaje__apoyo reveal">
        {medios.apoyo.map((pieza) => (
          <Foto key={pieza.id} foto={pieza} className="viaje__apoyo-foto" />
        ))}
      </div>
    </>
  )
}

function CuerpoReserva() {
  const { precios } = contenido
  return (
    <>
      <p className="viaje__precio reveal">{precios.reserva}</p>
      <p className="viaje__texto reveal">{precios.reservaDetalle}</p>
      <p className="viaje__pie reveal">
        {precios.totalEtiqueta} {precios.total}
      </p>
      <p className="viaje__cupos reveal">{precios.cupos.texto}</p>
      <ul className="viaje__cohortes reveal" aria-label={precios.cohortesAria}>
        {precios.cohortes.map((cohorte) => (
          <li key={cohorte.nombre} data-activa={cohorte.estado === 'actual'}>
            <span className="viaje__lista-detalle">{cohorte.nombre}</span>
            <strong>{cohorte.precio}</strong>
            <span className={`badge ${cohorte.estado === 'actual' ? 'badge--activa' : 'badge--agotada'}`}>
              {cohorte.estado === 'actual' ? precios.cohorteActual : precios.cohorteAgotada}
            </span>
          </li>
        ))}
      </ul>
      <div className="reveal">
        <FormularioReserva idPrefijo="recorrido" />
      </div>
    </>
  )
}

function Cuerpo({ indice, tramo, reducirMovimiento }) {
  if (indice === 0) return <CuerpoEvento />
  if (indice === 1) return <CuerpoDias />
  if (indice === 2) return <CuerpoTecnica />
  if (indice === 3) return <CuerpoMestres />
  if (indice === 4) return <CuerpoLugar tramo={tramo} reducirMovimiento={reducirMovimiento} />
  return <CuerpoReserva />
}

// --------------------------------------------------------------- el viaje

export default function Berimbau3D({ alCaer, verTexto }) {
  const { berimbau } = contenido
  // El orden lo manda el viaje, no el contenido: las secciones se arman
  // recorriendo BEATS y buscando su copia por id. Asi la cámara y el texto no
  // pueden desalinearse — que es exactamente lo que pasó al reordenarlos aparte.
  const tramos = useMemo(
    () => BEATS.map((beat) => berimbau.paradas.find((parada) => parada.id === beat.id)).filter(Boolean),
    [berimbau.paradas],
  )

  const contenedorRef = useRef(null)
  const controlRef = useRef(null)
  const caidoRef = useRef(false)
  const [estado, setEstado] = useState('cargando')
  const [degradado, setDegradado] = useState(false)
  const reducirMovimiento = useMemo(() => prefiereMenosMovimiento(), [])

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
          lienzoContenedor: contenedorRef.current,
          reducirMovimiento,
          alFallar: (razon) => caer(razon),
          alDegradar: () => setDegradado(true),
        })
        if (!control) return
        controlRef.current = control
        setEstado('listo')
        // Las secciones ya están en el DOM, pero sus alturas dependen de las
        // fuentes y de las imágenes: se vuelve a medir cuando el layout asienta.
        // `?viaje=N` clava el viaje en una posición: es para el arnés de
        // capturas, y solo actúa una vez, ya medido.
        window.setTimeout(() => {
          control.medir()
          const pedido = new URLSearchParams(window.location.search).get('viaje')
          if (pedido !== null && pedido !== '' && Number.isFinite(Number(pedido))) control.irA(Number(pedido))
        }, 60)
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

  // La capa editorial es independiente: si falla, la página sigue toda ahí.
  useEffect(() => arrancarEditorial(), [])

  // Enlace por tramo (#tramo-mestres). El navegador no puede saltar al ancla
  // solo: cuando procesa el fragmento las secciones todavía no existen, porque
  // las pinta React. Así que el salto se hace acá, una vez, ya montado.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#tramo-')) return undefined
    const espera = window.setTimeout(() => {
      const destino = document.getElementById(hash.slice(1))
      if (!destino) return
      destino.scrollIntoView({ behavior: 'auto', block: 'start' })
      if (controlRef.current) controlRef.current.medir()
    }, 80)
    return () => window.clearTimeout(espera)
  }, [])

  return (
    <div className="viaje" data-estado={estado}>
      <div className="viaje__escena" ref={contenedorRef} aria-hidden="true" />

      <header className="viaje__marca">
        <p className="viaje__marca-nombre">{berimbau.marca}</p>
        <p className="viaje__marca-lema">{berimbau.titulo}</p>
      </header>

      <button type="button" className="btn btn--fantasma viaje__texto-boton" onClick={verTexto}>
        {berimbau.verTexto}
      </button>

      {estado === 'cargando' ? (
        <p className="viaje__cargando" role="status">
          {berimbau.cargando}
        </p>
      ) : null}
      {degradado ? (
        <p className="viaje__aviso" role="status">
          {berimbau.avisoRendimiento}
        </p>
      ) : null}

      <nav className="viaje__rail" aria-label={berimbau.railAria}>
        <ol>
          {tramos.map((tramo, posicion) => (
            <li key={tramo.id}>
              <a className="viaje__rail-punto" data-rail={posicion} href={`#tramo-${tramo.id}`}>
                <span className="viaje__rail-marca" aria-hidden="true" />
                <span className="viaje__rail-texto">
                  <span className="viaje__rail-indice">{String(posicion + 1).padStart(2, '0')}</span>
                  <span className="viaje__rail-titulo">{tramo.titulo}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="viaje__copia" id="contenido">
        {tramos.map((tramo, indice) => (
          <section
            key={tramo.id}
            id={`tramo-${tramo.id}`}
            className="tramo"
            data-beat={indice}
            data-tramo={tramo.id}
            aria-labelledby={`titulo-${tramo.id}`}
          >
            <div className="tramo__columna">
              {(indice === 2 ? artesMarciales : tramo.rotulo) ? (
                <p className="tramo__rotulo reveal">{indice === 2 ? artesMarciales : tramo.rotulo}</p>
              ) : null}
              <h2 id={`titulo-${tramo.id}`} className="tramo__titulo reveal">
                {tramo.titulo}
              </h2>
              <p className="tramo__entradilla reveal">{tramo.entradilla}</p>
              <Cuerpo indice={indice} tramo={tramo} reducirMovimiento={reducirMovimiento} />
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
