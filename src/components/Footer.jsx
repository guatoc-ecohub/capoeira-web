import { contenido } from '../data/contenido.js'

export default function Footer() {
  const { footer } = contenido

  return (
    <footer className="pie">
      <div className="contenedor">
        <p className="pie__marca">{footer.marca}</p>
        <p>{footer.detalle}</p>
        <p className="pie__nota">{footer.lema}</p>
      </div>
    </footer>
  )
}
