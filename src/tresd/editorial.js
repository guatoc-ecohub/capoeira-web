// La capa editorial: revelados y el punto activo del rail.
//
// Deliberadamente aparte de la escena. Nada de aca toca el mundo, el rig ni el
// bucle de dibujo — solo LEE la posicion del scroll, asi que no puede ser la
// razon de que un cuadro salga distinto entre dos corridas.
//
// Y degrada a «visible y quieto»: la clase `js` es lo unico que arma los
// revelados, asi que si este archivo falla la pagina esta toda ahi igual.
//
// LEER TODO PRIMERO, ESCRIBIR DESPUES. Cada medida se cachea y solo se refresca
// al cambiar el tamano; cada cuadro lee unicamente window.scrollY antes de
// escribir. Cero layout en el camino del scroll.

export function arrancarEditorial() {
  if (typeof window === 'undefined') return () => {}

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const tramos = Array.from(document.querySelectorAll('[data-beat]'))
  const puntos = Array.from(document.querySelectorAll('[data-rail]'))
  if (tramos.length === 0) return () => {}

  const medidas = { topes: [], alto: 0 }
  function medir() {
    const arriba = window.scrollY
    medidas.alto = window.innerHeight
    medidas.topes = tramos.map((tramo) => tramo.getBoundingClientRect().top + arriba)
  }

  let observador = null
  if ('IntersectionObserver' in window && !quieto) {
    document.documentElement.classList.add('js')
    observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          entrada.target.classList.add('is-in')
          observador.unobserve(entrada.target)
        }
      },
      { rootMargin: '-6% 0px -10%', threshold: 0.01 },
    )
    for (const nodo of document.querySelectorAll('.reveal')) observador.observe(nodo)
  }

  let encolado = false
  let activo = -1

  function pintar() {
    encolado = false
    const y = window.scrollY
    const medio = y + medidas.alto * 0.5
    let tramo = 0
    for (let i = 0; i < medidas.topes.length; i += 1) {
      if (medidas.topes[i] <= medio) tramo = i
    }
    if (tramo === activo) return
    activo = tramo
    for (const punto of puntos) {
      const suyo = Number(punto.dataset.rail) === tramo
      punto.classList.toggle('is-active', suyo)
      if (suyo) punto.setAttribute('aria-current', 'true')
      else punto.removeAttribute('aria-current')
    }
  }

  function encolar() {
    if (encolado) return
    encolado = true
    requestAnimationFrame(pintar)
  }

  function alRedimensionar() {
    medir()
    activo = -1
    encolar()
  }

  window.addEventListener('scroll', encolar, { passive: true })
  window.addEventListener('resize', alRedimensionar, { passive: true })
  medir()
  pintar()

  return () => {
    window.removeEventListener('scroll', encolar)
    window.removeEventListener('resize', alRedimensionar)
    if (observador) observador.disconnect()
    document.documentElement.classList.remove('js')
  }
}
