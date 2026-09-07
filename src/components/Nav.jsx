import { useState } from 'react'
import { contenido } from '../data/contenido.js'

export default function Nav() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="nav">
      <div className="contenedor nav__bar">
        <a className="nav__marca" href="#inicio" onClick={() => setAbierto(false)}>
          {contenido.navegacionMarca}
        </a>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={abierto}
          aria-controls="nav-menu"
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="sr-only">{abierto ? contenido.menu.cerrar : contenido.menu.abrir}</span>
          <span aria-hidden="true">{abierto ? '✕' : '☰'}</span>
        </button>
        <nav id="nav-menu" className={`nav__menu ${abierto ? 'nav__menu--abierto' : ''}`} aria-label={contenido.navegacionAria}>
          {contenido.navegacion.map((enlace) => (
            <a key={enlace.href} href={enlace.href} onClick={() => setAbierto(false)}>
              {enlace.label}
            </a>
          ))}
          <a className="nav__cta" href="#reserva" onClick={() => setAbierto(false)}>
            {contenido.navegacionCta}
          </a>
        </nav>
      </div>
    </header>
  )
}
