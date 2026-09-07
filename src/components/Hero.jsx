import { contenido } from '../data/contenido.js'

function RodaDecorativa() {
  return (
    <svg className="hero__roda" viewBox="0 0 600 600" aria-hidden="true">
      <circle cx="300" cy="300" r="238" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 14" />
      <circle cx="300" cy="300" r="180" fill="none" stroke="currentColor" strokeWidth="1" opacity=".7" />
      <path d="M300 62v476M62 300h476M132 132l336 336M468 132 132 468" fill="none" stroke="currentColor" strokeWidth="1" opacity=".35" />
      <circle cx="300" cy="300" r="16" fill="currentColor" />
    </svg>
  )
}

export default function Hero() {
  const { hero } = contenido

  return (
    <section id="inicio" className="hero" aria-labelledby="hero-titulo">
      <div className="hero__overlay" aria-hidden="true" />
      <RodaDecorativa />
      <div className="contenedor hero__contenido">
        <p className="hero__fechas">{hero.kicker}</p>
        <h1 id="hero-titulo" className="hero__titulo">
          <span className="hero__linea hero__linea--contorno">{hero.tituloLineas[0]}</span>
          <span className="hero__linea hero__linea--brasa">{hero.tituloLineas[1]}</span>
        </h1>
        <p className="hero__subtitulo">{hero.tagline}</p>
        <p className="hero__cupos">{hero.cupos}</p>
        <div className="hero__cta">
          <a className="btn btn--primario" href="#reserva">{hero.reservaCta}</a>
          <a className="btn btn--fantasma" href="#instructores">{hero.instructoresCta}</a>
        </div>
      </div>
      <div className="hero__corte" aria-hidden="true" />
    </section>
  )
}
