import { useState } from 'react'
import { contenido } from '../data/contenido.js'

function FotoInstructor({ ficha, etiqueta }) {
  const [visible, setVisible] = useState(Boolean(ficha.foto))

  return (
    <div className="instructor-card__foto">
      {visible ? (
        <img src={ficha.foto} alt={ficha.fotoAlt} loading="lazy" onError={() => setVisible(false)} />
      ) : (
        <div className="foto-placeholder" role="img" aria-label={`${etiqueta}: ${ficha.nombre}`}>
          <span className="foto-placeholder__marca" aria-hidden="true">◎</span>
          <span>{etiqueta}</span>
        </div>
      )}
    </div>
  )
}

export default function Instructores() {
  const { instructores } = contenido

  return (
    <section id="instructores" className="seccion" aria-labelledby="instructores-titulo">
      <div className="contenedor">
        <p className="eyebrow">{instructores.eyebrow}</p>
        <h2 id="instructores-titulo" className="seccion__titulo">{instructores.titulo}</h2>
        <p className="seccion__intro">{instructores.intro}</p>
        <div className="instructores__grid">
          {instructores.fichas.map((ficha) => (
            <article className="instructor-card" key={ficha.nombre}>
              <FotoInstructor ficha={ficha} etiqueta={instructores.fotoPendiente} />
              <div className="instructor-card__cuerpo">
                <p className="instructor-card__rol">{ficha.rol}</p>
                <h3 className="instructor-card__nombre">{ficha.nombre}</h3>
                <ul className="instructor-card__disciplinas" aria-label={`${instructores.disciplinasLabel} ${ficha.nombre}`}>
                  {ficha.disciplinas.map((disciplina) => <li className="chip-disciplina" key={disciplina}>{disciplina}</li>)}
                </ul>
                <p className="instructor-card__texto">{ficha.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
