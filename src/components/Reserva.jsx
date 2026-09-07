import { useMemo, useState } from 'react'
import { tatuadores } from '../data/tatuadores.js'

const FECHAS = [
  { valor: '2026-09-25', label: 'Viernes 25 de septiembre' },
  { valor: '2026-09-26', label: 'Sábado 26 de septiembre' },
  { valor: '2026-09-27', label: 'Domingo 27 de septiembre' },
  { valor: 'sin-decidir', label: 'Aún no decido' },
]

const TIPOS = [
  { valor: 'flash', label: 'Flash (orden de llegada)' },
  { valor: 'sesion', label: 'Sesión completa (con cita)' },
]

const ESTADO_INICIAL = {
  nombre: '',
  tatuadorId: 'sin-preferencia',
  tipo: 'flash',
  fecha: FECHAS[0].valor,
  contacto: '',
  idea: '',
}

function construirMensajeWhatsApp(form, tatuadorLabel) {
  const tipoLabel = TIPOS.find((t) => t.valor === form.tipo)?.label ?? form.tipo
  const fechaLabel = FECHAS.find((f) => f.valor === form.fecha)?.label ?? form.fecha

  const lineas = [
    'Reserva — Tatuaje Guatoc (25-27 sep 2026)',
    `Nombre: ${form.nombre}`,
    `Tatuador: ${tatuadorLabel}`,
    `Tipo: ${tipoLabel}`,
    `Fecha preferida: ${fechaLabel}`,
    `Contacto: ${form.contacto}`,
  ]
  if (form.idea.trim()) {
    lineas.push(`Idea del tatuaje: ${form.idea.trim()}`)
  }
  return lineas.join('\n')
}

export default function Reserva() {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [errores, setErrores] = useState({})
  const [estado, setEstado] = useState('idle') // idle | enviando | ok | fallback | error

  const opcionesTatuador = useMemo(
    () => [
      { valor: 'sin-preferencia', label: 'Sin preferencia (cualquiera disponible)' },
      ...tatuadores.map((t) => ({ valor: t.id || t.nombre, label: t.nombre })),
    ],
    [],
  )

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function validar() {
    const nuevosErrores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = 'Escribe tu nombre.'
    if (!form.contacto.trim()) {
      nuevosErrores.contacto = 'Deja un WhatsApp o correo para contactarte.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validar()) return

    const tatuadorLabel =
      opcionesTatuador.find((o) => o.valor === form.tatuadorId)?.label ?? 'Sin preferencia'

    setEstado('enviando')

    const payload = {
      nombre: form.nombre.trim(),
      tatuadorId: form.tatuadorId,
      tatuador: tatuadorLabel,
      tipo: form.tipo,
      fecha: form.fecha,
      contacto: form.contacto.trim(),
      idea: form.idea.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      const controlador = new AbortController()
      const timeout = setTimeout(() => controlador.abort(), 6000)

      const res = await fetch('/api/reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controlador.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`Backend respondió ${res.status}`)

      setEstado('ok')
      setForm(ESTADO_INICIAL)
    } catch {
      // Sin backend disponible (o falló): no se pierde la reserva, se abre WhatsApp prellenado.
      const mensaje = construirMensajeWhatsApp(form, tatuadorLabel)
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer')
      setEstado('fallback')
    }
  }

  return (
    <section id="reserva" className="reserva">
      <div className="contenedor">
        <h2 className="titulo-seccion">Reserva tu cupo</h2>
        <p className="reserva__intro">
          Cuéntanos qué quieres hacerte. Si el envío directo falla, te abrimos WhatsApp
          con el mensaje ya listo para que la reserva no se pierda.
        </p>

        <form className="reserva__form" onSubmit={onSubmit} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              value={form.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            />
            {errores.nombre && (
              <p className="campo__error" id="error-nombre">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="tatuador">Tatuador</label>
            <select
              id="tatuador"
              name="tatuador"
              value={form.tatuadorId}
              onChange={(e) => actualizar('tatuadorId', e.target.value)}
            >
              {opcionesTatuador.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="campo campo--fieldset">
            <legend>Tipo</legend>
            <div className="campo__opciones">
              {TIPOS.map((t) => (
                <label key={t.valor} className="opcion">
                  <input
                    type="radio"
                    name="tipo"
                    value={t.valor}
                    checked={form.tipo === t.valor}
                    onChange={(e) => actualizar('tipo', e.target.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="campo">
            <label htmlFor="fecha">Fecha preferida</label>
            <select
              id="fecha"
              name="fecha"
              value={form.fecha}
              onChange={(e) => actualizar('fecha', e.target.value)}
            >
              {FECHAS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="contacto">WhatsApp o correo</label>
            <input
              id="contacto"
              name="contacto"
              type="text"
              autoComplete="tel"
              placeholder="300 000 0000 o tu@correo.com"
              value={form.contacto}
              onChange={(e) => actualizar('contacto', e.target.value)}
              aria-invalid={Boolean(errores.contacto)}
              aria-describedby={errores.contacto ? 'error-contacto' : undefined}
            />
            {errores.contacto && (
              <p className="campo__error" id="error-contacto">
                {errores.contacto}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="idea">Idea del tatuaje (opcional)</label>
            <textarea
              id="idea"
              name="idea"
              rows={4}
              placeholder="Cuéntanos qué tienes en mente, tamaño, zona del cuerpo..."
              value={form.idea}
              onChange={(e) => actualizar('idea', e.target.value)}
            />
          </div>

          <button type="submit" className="boton boton--primario" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando...' : 'Reservar mi cupo'}
          </button>

          <div className="reserva__estado" role="status" aria-live="polite">
            {estado === 'ok' && '¡Reserva enviada! Te contactamos pronto.'}
            {estado === 'fallback' &&
              'No pudimos enviar la reserva directo — te abrimos WhatsApp con el mensaje listo, solo dale enviar.'}
          </div>
        </form>
      </div>
    </section>
  )
}
