import { evento } from '../data/tatuadores.js'
import { IconColibri, IconOrquidea, IconHoja } from './icons/Botanicos.jsx'

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero__fondo" aria-hidden="true">
        <IconHoja className="hero__icono hero__icono--hoja-1" />
        <IconOrquidea className="hero__icono hero__icono--orquidea" />
        <IconColibri className="hero__icono hero__icono--colibri" />
        <IconHoja className="hero__icono hero__icono--hoja-2" />
      </div>
      <div className="contenedor hero__contenido">
        <p className="hero__kicker">{evento.eje ?? 'tatuaje de biodiversidad de la zona'}</p>
        <h1 className="hero__titulo">
          {evento.fechas ?? '25-27 septiembre 2026'}
          <span className="hero__linea">Abrimos la casa en Guatoc</span>
        </h1>
        <p className="hero__descripcion">
          Un fin de semana completo de tatuaje: casa abierta, tatuadores permanentes,
          flash por orden de llegada y sesiones con cita. La flora y fauna del territorio
          —colibrí, jaguar, frailejón, ranas, orquídeas— como inspiración del arte que
          queda en la piel.
        </p>
        <div className="hero__acciones">
          <a className="boton boton--primario" href="#reserva">
            Reservar mi cupo
          </a>
          <a className="boton boton--fantasma" href="#tatuadores">
            Ver tatuadores
          </a>
        </div>
      </div>
    </section>
  )
}
