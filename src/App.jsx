import { useCallback, useMemo, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Agenda from './components/Agenda.jsx'
import Instructores from './components/Instructores.jsx'
import Tecnica from './components/Tecnica.jsx'
import Precios from './components/Precios.jsx'
import Reserva from './components/Reserva.jsx'
import Footer from './components/Footer.jsx'
import Berimbau3D from './components/Berimbau3D.jsx'
import { contenido } from './data/contenido.js'
import { soportaBerimbau, textoRazon } from './tresd/soporte.js'

export default function App() {
  // La deteccion corre antes del primer pintado y sin tocar three: si el equipo
  // no da, el visitante arranca directo en la pagina 2D y nunca baja el bundle 3D.
  const soportado = useMemo(() => soportaBerimbau(), [])
  const [modo, setModo] = useState(() => (soportado ? 'tresd' : 'dosd'))
  const [aviso, setAviso] = useState(null)

  const alCaer = useCallback((razon) => {
    setAviso(textoRazon(razon))
    setModo('dosd')
  }, [])

  const verTexto = useCallback(() => {
    setAviso(null)
    setModo('dosd')
  }, [])

  const volverAlBerimbau = useCallback(() => {
    setAviso(null)
    setModo('tresd')
  }, [])

  if (modo === 'tresd') {
    return <Berimbau3D alCaer={alCaer} verTexto={verTexto} />
  }

  return (
    <>
      <a className="skip-link" href="#contenido">{contenido.saltarContenido}</a>
      <Nav />
      {aviso || soportado ? (
        <div className="cambio-modo">
          <p>{aviso || contenido.berimbau.avisoTexto}</p>
          {soportado ? (
            <button type="button" className="btn btn--fantasma" onClick={volverAlBerimbau}>
              {contenido.berimbau.volver}
            </button>
          ) : null}
        </div>
      ) : null}
      <main id="contenido">
        <Hero />
        <Agenda />
        <Instructores />
        <Tecnica />
        <Precios />
        <Reserva />
      </main>
      <Footer />
    </>
  )
}
