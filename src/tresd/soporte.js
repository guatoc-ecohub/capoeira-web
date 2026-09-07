// Deteccion de soporte grafico. Este modulo NO importa three: corre antes de
// bajar la libreria para que el fallback 2D no pague el costo del bundle 3D.

const NOMBRES_LENTOS = ['swiftshader', 'llvmpipe', 'software', 'basic render', 'microsoft basic']

export const RAZONES = {
  'sin-ventana': 'No hay navegador.',
  'sin-webgl': 'Este navegador no trae WebGL.',
  'sin-contexto': 'El navegador no pudo abrir un contexto 3D.',
  contexto: 'El navegador rechazo el contexto 3D.',
  'gpu-software': 'La tarjeta grafica trabaja por software y no daria los cuadros.',
  'gpu-limitada': 'La tarjeta grafica de este equipo se queda corta.',
  'ahorro-datos': 'El equipo esta en modo de ahorro de datos.',
  'memoria-baja': 'El equipo tiene poca memoria.',
  carga: 'No se pudo cargar el motor 3D.',
  demora: 'El motor 3D se demoro demasiado.',
  rendimiento: 'El recorrido no alcanzaba los cuadros minimos en este equipo.',
  'contexto-perdido': 'El navegador cerro el contexto 3D.',
  arranque: 'El recorrido no pudo arrancar.',
}

export function prefiereMenosMovimiento() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function soltarContexto(gl) {
  try {
    const perdida = gl.getExtension('WEBGL_lose_context')
    if (perdida) perdida.loseContext()
  } catch {
    // si el navegador no deja soltarlo, el canvas de prueba se recoge solo
  }
}

// Devuelve { ok: true } o { ok: false, razon }. Barata: se puede llamar en render.
export function evaluarSoporte() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ok: false, razon: 'sin-ventana' }
  }
  if (typeof window.WebGLRenderingContext !== 'function') {
    return { ok: false, razon: 'sin-webgl' }
  }

  const nav = window.navigator || {}
  const conexion = nav.connection || nav.mozConnection || nav.webkitConnection
  if (conexion && conexion.saveData === true) return { ok: false, razon: 'ahorro-datos' }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory < 1) {
    return { ok: false, razon: 'memoria-baja' }
  }

  let gl = null
  try {
    const lienzo = document.createElement('canvas')
    // failIfMajorPerformanceCaveat descarta de una los renderizadores por software.
    const atributos = { failIfMajorPerformanceCaveat: true, powerPreference: 'high-performance', antialias: false, depth: true }
    gl = lienzo.getContext('webgl2', atributos) || lienzo.getContext('webgl', atributos)
  } catch {
    return { ok: false, razon: 'contexto' }
  }
  if (!gl) return { ok: false, razon: 'sin-contexto' }

  let razon = null
  try {
    const maxTextura = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    if (typeof maxTextura === 'number' && maxTextura > 0 && maxTextura < 2048) razon = 'gpu-limitada'
    if (!razon) {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      if (info) {
        const nombre = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '').toLowerCase()
        if (nombre && NOMBRES_LENTOS.some((lento) => nombre.includes(lento))) razon = 'gpu-software'
      }
    }
  } catch {
    // consultar el renderizador es opcional; si falla seguimos con lo que hay
  }

  soltarContexto(gl)
  return razon ? { ok: false, razon } : { ok: true }
}

export function soportaBerimbau() {
  return evaluarSoporte().ok
}

export function textoRazon(razon) {
  return RAZONES[razon] || RAZONES.arranque
}
