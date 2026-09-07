import { contenido } from '../data/contenido.js'

function Cupos() {
  const { cupos } = contenido.precios

  return (
    <div className="cupos" aria-label={cupos.texto}>
      <div className="cupos__texto"><strong>{cupos.disponibles}</strong> / {cupos.total} {contenido.precios.cuposDisponibles}</div>
      <div className="cupos__barra" aria-hidden="true"><span style={{ width: `${(cupos.disponibles / cupos.total) * 100}%` }} /></div>
      <p>{cupos.texto}</p>
    </div>
  )
}

export default function Precios() {
  const { precios } = contenido

  return (
    <section id="precios" className="seccion seccion--precios" aria-labelledby="precios-titulo">
      <div className="contenedor">
        <p className="eyebrow">{precios.eyebrow}</p>
        <h2 id="precios-titulo" className="seccion__titulo">{precios.titulo}</h2>
        <p className="seccion__intro">{precios.intro}</p>
        <div className="precios__principal">
          <div>
            <p className="precios__etiqueta">{precios.reservaEtiqueta}</p>
            <p className="precios__reserva">{precios.reserva}</p>
            <p className="precios__detalle">{precios.reservaDetalle}</p>
            <p className="precios__total">{precios.totalEtiqueta} <strong>{precios.total}</strong></p>
          </div>
          <Cupos />
        </div>
        <p className="precios__early">{precios.earlyBird}</p>
        <div className="cohortes" aria-label={precios.cohortesAria}>
          {precios.cohortes.map((cohorte, index) => (
            <article className="cohorte-card" data-activa={cohorte.estado === 'actual'} key={cohorte.nombre}>
              <div className="cohorte-card__top"><span>0{index + 1}</span><span className={`badge ${cohorte.estado === 'actual' ? 'badge--activa' : 'badge--agotada'}`}>{cohorte.estado === 'actual' ? precios.cohorteActual : precios.cohorteAgotada}</span></div>
              <h3>{cohorte.nombre}</h3>
              <p className="cohorte-card__detalle">{cohorte.detalle}</p>
              <strong>{cohorte.precio}</strong>
              <small>{cohorte.nota}</small>
            </article>
          ))}
        </div>
        <a className="btn btn--primario precios__cta" href="#reserva">{precios.cta}</a>
      </div>
    </section>
  )
}
