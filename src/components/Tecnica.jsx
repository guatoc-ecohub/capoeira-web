import { contenido } from '../data/contenido.js'

export default function Tecnica() {
  const { tecnica: seccion } = contenido

  return (
    <section id="tecnica" className="seccion seccion--tecnica" aria-labelledby="tecnica-titulo">
      <div className="contenedor">
        <p className="eyebrow">{seccion.eyebrow}</p>
        <h2 id="tecnica-titulo" className="seccion__titulo">{seccion.titulo}</h2>
        <p className="seccion__intro">{seccion.intro}</p>
        <div className="tecnica__grid">
          {seccion.bloques.map((bloque) => (
            <article className="tecnica-card" key={bloque.numero}>
              <span className="tecnica-card__numero">{bloque.numero}</span>
              <h3>{bloque.titulo}</h3>
              <p>{bloque.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
