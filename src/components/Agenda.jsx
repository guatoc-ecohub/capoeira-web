import { contenido } from '../data/contenido.js'

export default function Agenda() {
  const { agenda } = contenido

  return (
    <section id="agenda" className="seccion seccion--agenda" aria-labelledby="agenda-titulo">
      <div className="contenedor">
        <p className="eyebrow">{agenda.eyebrow}</p>
        <h2 id="agenda-titulo" className="seccion__titulo">{agenda.titulo}</h2>
        <p className="seccion__intro">{agenda.intro}</p>
        <div className="agenda-tabla-wrap">
          <table className="agenda-tabla">
            <caption className="sr-only">{agenda.caption}</caption>
            <thead><tr>{agenda.columnas.map((columna) => <th scope="col" key={columna}>{columna}</th>)}</tr></thead>
            <tbody>
              {agenda.dias.map((item, index) => (
                <tr key={item.dia} data-roda={item.roda}>
                  <th scope="row"><span className="agenda-tabla__numero">0{index + 1}</span>{item.dia}</th>
                  <td className="agenda-tabla__hito">{item.hito}</td>
                  <td>{item.hora}</td>
                  <td>{item.sede}</td>
                  <td><span className={`badge ${item.roda ? 'badge--roda' : 'badge--no-roda'}`}>{item.roda ? agenda.rodaSi : agenda.rodaNo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
