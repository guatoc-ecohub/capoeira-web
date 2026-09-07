import { useState } from 'react'
import { contenido } from '../data/contenido.js'

const estadoInicial = { nombre: '', correo: '', celular: '' }

// El mismo formulario sirve a la pagina 2D y a la parada de reserva del
// recorrido. Se comparte para que la validacion no viva en dos sitios; el
// prefijo evita que los `id` choquen si algun dia se pintan los dos a la vez.
export default function FormularioReserva({ idPrefijo = 'reserva' }) {
  const { reserva } = contenido
  const [form, setForm] = useState(estadoInicial)
  const [errores, setErrores] = useState({})
  const [enviada, setEnviada] = useState(false)

  const id = (campo) => `${idPrefijo}-${campo}`
  const idError = (campo) => `${idPrefijo}-error-${campo}`

  function actualizar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
    setErrores((actual) => ({ ...actual, [campo]: '' }))
    setEnviada(false)
  }

  function enviar(evento) {
    evento.preventDefault()
    const nuevosErrores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = reserva.errores.nombre
    if (!form.correo.trim()) nuevosErrores.correo = reserva.errores.correo
    else if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) nuevosErrores.correo = reserva.errores.correoFormato
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length === 0) setEnviada(true)
  }

  return (
    <form className="reserva-form" onSubmit={enviar} noValidate>
      <p className="reserva-form__titulo">{reserva.formularioTitulo}</p>
      <div className="campo">
        <label htmlFor={id('nombre')}>{reserva.nombreLabel} <span aria-hidden="true">*</span></label>
        <input
          id={id('nombre')}
          name="nombre"
          type="text"
          autoComplete="name"
          required
          value={form.nombre}
          onChange={(e) => actualizar('nombre', e.target.value)}
          aria-invalid={Boolean(errores.nombre)}
          aria-describedby={errores.nombre ? idError('nombre') : undefined}
        />
        {errores.nombre && <p className="campo__error" id={idError('nombre')}>{errores.nombre}</p>}
      </div>
      <div className="campo">
        <label htmlFor={id('correo')}>{reserva.correoLabel} <span aria-hidden="true">*</span></label>
        <input
          id={id('correo')}
          name="correo"
          type="email"
          autoComplete="email"
          required
          value={form.correo}
          onChange={(e) => actualizar('correo', e.target.value)}
          aria-invalid={Boolean(errores.correo)}
          aria-describedby={errores.correo ? idError('correo') : undefined}
        />
        {errores.correo && <p className="campo__error" id={idError('correo')}>{errores.correo}</p>}
      </div>
      <div className="campo">
        <label htmlFor={id('celular')}>{reserva.celularLabel} <small>({reserva.celularAyuda})</small></label>
        <input
          id={id('celular')}
          name="celular"
          type="tel"
          autoComplete="tel"
          value={form.celular}
          onChange={(e) => actualizar('celular', e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn--primario">{reserva.enviar}</button>
      <div className="reserva-form__estado" role="status" aria-live="polite">
        {enviada && reserva.mensajeExito}
      </div>
    </form>
  )
}
