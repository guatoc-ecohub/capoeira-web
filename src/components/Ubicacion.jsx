export default function Ubicacion() {
  return (
    <section id="ubicacion" className="ubicacion">
      <div className="contenedor ubicacion__grid">
        <div>
          <h2 className="titulo-seccion">Ubicación y logística</h2>
          <p>
            La casa abierta queda en Guatoc. La dirección exacta y las indicaciones de
            acceso se comparten al confirmar tu cupo por el formulario de reserva.
          </p>
          <ul className="ubicacion__lista">
            <li>Abierto los 3 días: 25, 26 y 27 de septiembre de 2026.</li>
            <li>Flash por orden de llegada — llega con tiempo si quieres asegurar cupo.</li>
            <li>Sesiones con cita: se coordina fecha y hora directamente con el tatuador.</li>
          </ul>
        </div>

        <div className="ubicacion__contacto">
          <h3>Contacto del evento</h3>
          <p className="ubicacion__pendiente">WhatsApp del evento: por confirmar</p>
          <p className="ubicacion__pendiente">Instagram del evento: por confirmar</p>
          <p>
            Mientras tanto, usa el{' '}
            <a href="#reserva">formulario de reserva</a> — si no llega directo, se abre
            WhatsApp con tu mensaje listo para enviar.
          </p>
        </div>
      </div>
    </section>
  )
}
