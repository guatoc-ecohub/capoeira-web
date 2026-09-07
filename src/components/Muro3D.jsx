import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { DragControls } from 'three/addons/controls/DragControls.js'

const ROTATE_SPEED = 0.42
const MAX_PIXEL_RATIO = 1.75
const CARD_MAX_WIDTH = 2.45
const CARD_MAX_HEIGHT = 2.1

function getGalleryItems(tatuadores) {
  return tatuadores.flatMap((tatuador) => {
    const imagenes = [...new Set([tatuador.retrato || tatuador.imagen, ...tatuador.trabajos])].filter(Boolean)
    return imagenes.map((src, index) => ({
      id: `${tatuador.id || tatuador.nombre}-${index}-${src}`,
      nombre: tatuador.nombre,
      src,
    }))
  })
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

function cardSize(aspect = 1) {
  if (aspect >= CARD_MAX_WIDTH / CARD_MAX_HEIGHT) {
    return { width: CARD_MAX_WIDTH, height: CARD_MAX_WIDTH / aspect }
  }
  return { width: CARD_MAX_HEIGHT * aspect, height: CARD_MAX_HEIGHT }
}

function GalleryFallback({ items }) {
  return (
    <div className="muro3d__fallback" aria-label="Galería de trabajos">
      {items.map((item) => (
        <figure className="muro3d__fallback-card" key={item.id}>
          <img src={item.src} alt={`Trabajo de ${item.nombre}`} loading="lazy" decoding="async" />
          <figcaption>{item.nombre}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function Scene({ items, onReady, onUnavailable }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let renderer
    let labelRenderer
    let controls
    let observer
    let resizeObserver
    let frameId = 0
    let visible = false
    let disposed = false
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    const cards = []
    const resources = []
    const cleanup = () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer?.disconnect()
      resizeObserver?.disconnect()
      controls?.dispose()
      resources.forEach((resource) => resource.dispose?.())
      scene.clear()
      renderer?.dispose()
      renderer?.domElement.remove()
      labelRenderer?.domElement.remove()
    }

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.className = 'muro3d__canvas'
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      labelRenderer = new CSS2DRenderer()
      labelRenderer.domElement.className = 'muro3d__labels'
      labelRenderer.domElement.style.pointerEvents = 'none'
      labelRenderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(labelRenderer.domElement)

      camera.position.set(0, 0, 17)
      scene.add(new THREE.AmbientLight(0xf4ead2, 1.6))
      const keyLight = new THREE.DirectionalLight(0xd8e6bf, 1.25)
      keyLight.position.set(-4, 6, 9)
      scene.add(keyLight)

      const columns = window.innerWidth < 900 ? 4 : 5
      const xGap = 3.1
      const yGap = 2.8
      const rows = Math.ceil(items.length / columns)

      items.forEach((item, index) => {
        const photoMaterial = new THREE.MeshBasicMaterial({ color: 0x9ec594 })
        const group = new THREE.Mesh(new THREE.PlaneGeometry(CARD_MAX_WIDTH, CARD_MAX_HEIGHT), photoMaterial)
        const column = index % columns
        const row = Math.floor(index / columns)
        group.position.set((column - (columns - 1) / 2) * xGap, ((rows - 1) / 2 - row) * yGap, (index % 3) * -0.35)
        group.rotation.z = ((index % 5) - 2) * 0.018
        group.userData.aspect = 1
        group.userData.lastX = group.position.x
        group.userData.loaded = false

        const size = cardSize()
        const frameMaterial = new THREE.MeshBasicMaterial({ color: 0xe8ddc4 })
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(size.width + 0.12, size.height + 0.12), frameMaterial)
        frame.position.z = -0.02
        frame.renderOrder = 1
        group.renderOrder = 2
        group.add(frame)
        resources.push(group.geometry, group.material, frame.geometry, frameMaterial, photoMaterial)

        const label = document.createElement('span')
        label.className = 'muro3d__label'
        label.textContent = item.nombre
        const labelObject = new CSS2DObject(label)
        labelObject.position.set(0, -size.height / 2 - 0.16, 0.06)
        group.add(labelObject)
        scene.add(group)
        cards.push(group)

        const loader = new THREE.TextureLoader()
        loader.load(
          item.src,
          (texture) => {
            if (disposed) {
              texture.dispose()
              return
            }
            texture.colorSpace = THREE.SRGBColorSpace
            const image = texture.image
            const aspect = image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : 1
            const nextSize = cardSize(aspect)
            group.geometry.dispose()
            frame.geometry.dispose()
            group.geometry = new THREE.PlaneGeometry(nextSize.width, nextSize.height)
            frame.geometry = new THREE.PlaneGeometry(nextSize.width + 0.12, nextSize.height + 0.12)
            resources.push(group.geometry, frame.geometry)
            photoMaterial.map = texture
            photoMaterial.color.set(0xffffff)
            photoMaterial.needsUpdate = true
            labelObject.position.y = -nextSize.height / 2 - 0.16
            group.userData.aspect = aspect
            group.userData.loaded = true
            resources.push(texture)
          },
          undefined,
          () => {
            // El marco sigue siendo una tarjeta legible si una foto no carga.
          },
        )
      })

      controls = new DragControls(cards, camera, renderer.domElement)
      controls.recursive = false
      controls.rotateSpeed = ROTATE_SPEED
      controls.addEventListener('dragstart', ({ object }) => {
        object.userData.lastX = object.position.x
        renderer.domElement.classList.add('is-dragging')
      })
      controls.addEventListener('drag', ({ object }) => {
        const deltaX = object.position.x - object.userData.lastX
        object.rotation.z -= deltaX * ROTATE_SPEED
        object.userData.lastX = object.position.x
      })
      controls.addEventListener('dragend', () => {
        renderer.domElement.classList.remove('is-dragging')
      })

      const resize = () => {
        if (disposed) return
        const width = Math.max(host.clientWidth, 1)
        const height = Math.max(host.clientHeight, 1)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        labelRenderer.setSize(width, height)
      }
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)

      const render = () => {
        if (disposed) return
        if (visible) {
          scene.rotation.y = Math.sin(performance.now() * 0.00018) * 0.012
          renderer.render(scene, camera)
          labelRenderer.render(scene, camera)
        }
        frameId = requestAnimationFrame(render)
      }

      observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
      }, { rootMargin: '120px 0px' })
      observer.observe(host)
      onReady()
      render()
    } catch {
      onUnavailable()
      return cleanup
    }

    return cleanup
  }, [items, onReady, onUnavailable])

  return <div ref={hostRef} className="muro3d__scene" role="img" aria-label="Muro 3D de trabajos de tatuaje" />
}

export default function Muro3D({ tatuadores }) {
  const items = useMemo(() => getGalleryItems(tatuadores), [tatuadores])
  const [modo3D, setModo3D] = useState('comprobando')
  const [puede3D, setPuede3D] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 639px)')
    const updateMode = () => {
      const eligible = !motionQuery.matches && !mobileQuery.matches && supportsWebGL()
      setPuede3D(eligible)
      setModo3D(eligible ? '3d' : 'fallback')
    }
    updateMode()
    motionQuery.addEventListener?.('change', updateMode)
    mobileQuery.addEventListener?.('change', updateMode)
    return () => {
      motionQuery.removeEventListener?.('change', updateMode)
      mobileQuery.removeEventListener?.('change', updateMode)
    }
  }, [])

  const onUnavailable = useCallback(() => {
    setPuede3D(false)
    setModo3D('fallback')
  }, [])
  const onReady = useCallback(() => setModo3D((current) => (current === 'comprobando' ? '3d' : current)), [])

  return (
    <section id="galeria" className="muro3d" aria-labelledby="galeria-titulo">
      <div className="contenedor">
        <div className="muro3d__encabezado">
          <div>
            <p className="muro3d__eyebrow">Galería</p>
            <h2 id="galeria-titulo" className="titulo-seccion">Un muro para explorar</h2>
            <p className="muro3d__intro">
              Arrastra las tarjetas para acercarte a cada trabajo. Al moverlas también giran suavemente.
            </p>
          </div>
          {puede3D && modo3D !== 'comprobando' && (
            <button
              type="button"
              className="boton boton--galeria"
              onClick={() => setModo3D((current) => (current === '3d' ? 'fallback' : '3d'))}
              aria-pressed={modo3D === '3d'}
            >
              {modo3D === '3d' ? 'Ver cuadrícula 2D' : 'Abrir muro 3D'}
            </button>
          )}
        </div>

        <div className="muro3d__viewport">
          {modo3D === '3d' && <Scene items={items} onReady={onReady} onUnavailable={onUnavailable} />}
          {modo3D === 'fallback' && <GalleryFallback items={items} />}
          {modo3D === 'comprobando' && <p className="muro3d__estado">Cargando la galería…</p>}
        </div>
        <p className="muro3d__nota">La vista 2D queda disponible en equipos táctiles, con movimiento reducido o sin WebGL.</p>
      </div>
    </section>
  )
}
