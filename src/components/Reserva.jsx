import { contenido } from '../data/contenido.js'
import FormularioReserva from './FormularioReserva.jsx'

export default function Reserva() {
  const { reserva } = contenido

  return (
    <section id="reserva" className="seccion seccion--reserva" aria-labelledby="reserva-titulo">
      <div className="contenedor reserva__grid">
        <div className="reserva__copy">
          <p className="eyebrow">{reserva.eyebrow}</p>
          <h2 id="reserva-titulo" className="seccion__titulo">{reserva.titulo}</h2>
          <p className="seccion__intro">{reserva.intro}</p>
          <p className="reserva__nota">{reserva.nota}</p>
        </div>
        <FormularioReserva idPrefijo="pagina" />
      </div>
    </section>
  )
}
