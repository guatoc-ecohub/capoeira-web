import { useState } from 'react'

const enlaces = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#evento', label: 'El evento' },
  { href: '#tatuadores', label: 'Tatuadores' },
  { href: '#galeria', label: 'Galería' },
  { href: '#flash-sesiones', label: 'Flash / sesiones' },
  { href: '#reserva', label: 'Reservar' },
  { href: '#ubicacion', label: 'Ubicación' },
]

export default function Nav() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="nav">
      <div className="nav__bar">
        <a className="nav__marca" href="#inicio" onClick={() => setAbierto(false)}>
          Tatuaje <span>Guatoc</span>
        </a>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={abierto}
          aria-controls="nav-menu"
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="sr-only">Abrir menú</span>
          <span aria-hidden="true">{abierto ? '✕' : '☰'}</span>
        </button>
        <nav id="nav-menu" className={`nav__menu ${abierto ? 'nav__menu--abierto' : ''}`}>
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setAbierto(false)}>
              {e.label}
            </a>
          ))}
          <a className="nav__cta" href="#reserva" onClick={() => setAbierto(false)}>
            Reservar mi cupo
          </a>
        </nav>
      </div>
    </header>
  )
}
