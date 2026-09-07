import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Agenda from './components/Agenda.jsx'
import Instructores from './components/Instructores.jsx'
import Tecnica from './components/Tecnica.jsx'
import Precios from './components/Precios.jsx'
import Reserva from './components/Reserva.jsx'
import Footer from './components/Footer.jsx'
import { contenido } from './data/contenido.js'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#contenido">{contenido.saltarContenido}</a>
      <Nav />
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
