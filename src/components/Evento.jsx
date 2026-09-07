import { IconJaguar, IconFrailejon, IconAguja } from './icons/Botanicos.jsx'

const puntos = [
  {
    Icono: IconJaguar,
    titulo: 'La casa abierta',
    texto:
      'Todo el fin de semana —25, 26 y 27 de septiembre— la casa en Guatoc queda abierta para tatuarse. No es un evento de un solo día: es un espacio permanente durante los tres días.',
  },
  {
    Icono: IconAguja,
    titulo: '3-4 tatuadores permanentes',
    texto:
      'Un equipo pequeño de tatuadores trabaja en simultáneo durante todo el fin de semana, cada uno con su estilo. Flash tattoo para quien llega sin cita y sesiones completas para quien ya agendó.',
  },
  {
    Icono: IconFrailejon,
    titulo: 'Tatuaje de biodiversidad',
    texto:
      'El eje editorial del fin de semana: la flora y fauna de la zona —colibrí, jaguar, frailejón, ranas, insectos, orquídeas— como fuente de diseño. Naturaleza de Guatoc convertida en línea de tinta.',
  },
]

export default function Evento() {
  return (
    <section id="evento" className="evento">
      <div className="contenedor">
        <h2 className="titulo-seccion">El evento</h2>
        <p className="evento__intro">
          Guatoc abre las puertas de la casa para un fin de semana de tatuaje pensado
          desde el territorio: cada trazo dialoga con la biodiversidad que rodea el lugar.
        </p>
        <div className="evento__grid">
          {puntos.map((p) => (
            <article key={p.titulo} className="evento__tarjeta">
              <p.Icono className="evento__icono" />
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
