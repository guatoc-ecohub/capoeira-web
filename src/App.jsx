import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Evento from './components/Evento.jsx'
import Tatuadores from './components/Tatuadores.jsx'
import FlashSesiones from './components/FlashSesiones.jsx'
import Reserva from './components/Reserva.jsx'
import Ubicacion from './components/Ubicacion.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Nav />
      <main id="contenido">
        <Hero />
        <Evento />
        <Tatuadores />
        <FlashSesiones />
        <Reserva />
        <Ubicacion />
      </main>
      <Footer />
    </>
  )
}
