import { useState } from 'react'
import { contenido } from '../data/contenido.js'

const estadoInicial = { nombre: '', correo: '', celular: '' }

export default function Reserva() {
  const { reserva } = contenido
  const [form, setForm] = useState(estadoInicial)
  const [errores, setErrores] = useState({})
  const [enviada, setEnviada] = useState(false)

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
    <section id="reserva" className="seccion seccion--reserva" aria-labelledby="reserva-titulo">
      <div className="contenedor reserva__grid">
        <div className="reserva__copy">
          <p className="eyebrow">{reserva.eyebrow}</p>
          <h2 id="reserva-titulo" className="seccion__titulo">{reserva.titulo}</h2>
          <p className="seccion__intro">{reserva.intro}</p>
          <p className="reserva__nota">{reserva.nota}</p>
        </div>
        <form className="reserva-form" onSubmit={enviar} noValidate>
          <p className="reserva-form__titulo">{reserva.formularioTitulo}</p>
          <div className="campo">
            <label htmlFor="nombre">{reserva.nombreLabel} <span aria-hidden="true">*</span></label>
            <input id="nombre" name="nombre" type="text" autoComplete="name" required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} aria-invalid={Boolean(errores.nombre)} aria-describedby={errores.nombre ? 'error-nombre' : undefined} />
            {errores.nombre && <p className="campo__error" id="error-nombre">{errores.nombre}</p>}
          </div>
          <div className="campo">
            <label htmlFor="correo">{reserva.correoLabel} <span aria-hidden="true">*</span></label>
            <input id="correo" name="correo" type="email" autoComplete="email" required value={form.correo} onChange={(e) => actualizar('correo', e.target.value)} aria-invalid={Boolean(errores.correo)} aria-describedby={errores.correo ? 'error-correo' : undefined} />
            {errores.correo && <p className="campo__error" id="error-correo">{errores.correo}</p>}
          </div>
          <div className="campo">
            <label htmlFor="celular">{reserva.celularLabel} <small>({reserva.celularAyuda})</small></label>
            <input id="celular" name="celular" type="tel" autoComplete="tel" value={form.celular} onChange={(e) => actualizar('celular', e.target.value)} />
          </div>
          <button type="submit" className="btn btn--primario">{reserva.enviar}</button>
          <div className="reserva-form__estado" role="status" aria-live="polite">
            {enviada && reserva.mensajeExito}
          </div>
        </form>
      </div>
    </section>
  )
}
