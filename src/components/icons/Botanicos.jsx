// Íconos de línea fina — fusión biodiversidad Guatoc + trazo de tatuaje.
// Trazo único, stroke="currentColor", sin relleno: estética botánica/tinta.
// Simplificación decorativa (no ilustración científica) para el MVP.

const base = {
  viewBox: '0 0 100 100',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconColibri({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M18 58 C16 44 24 30 36 24 C33 33 35 40 42 44 C36 47 32 54 34 62 C27 63 21 63 18 58 Z" />
      <path d="M36 24 C40 30 41 37 42 44" />
      <path d="M42 44 C58 40 70 44 78 36" />
      <path d="M78 36 C71 38 64 40 60 46" />
      <circle cx="30" cy="30" r="1.6" fill="currentColor" stroke="none" />
      <path d="M34 62 C30 70 24 74 16 74" />
      <path d="M34 62 C32 72 28 78 20 82" />
    </svg>
  )
}

export function IconJaguar({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M22 40 C20 30 28 20 40 20 C44 14 52 14 56 20 C68 20 76 30 74 40 C78 46 78 56 72 62 C74 70 68 78 58 78 C52 82 44 82 38 78 C28 78 22 70 24 62 C18 56 18 46 22 40 Z" />
      <path d="M38 20 L34 10" />
      <path d="M56 20 L60 10" />
      <circle cx="40" cy="42" r="2" fill="currentColor" stroke="none" />
      <circle cx="58" cy="42" r="2" fill="currentColor" stroke="none" />
      <path d="M46 50 C48 52 50 52 52 50" />
      <circle cx="30" cy="48" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="66" cy="48" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="34" cy="60" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="64" cy="60" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="48" cy="66" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconFrailejon({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M50 88 L50 46" />
      <path d="M50 50 C40 48 28 40 20 24" />
      <path d="M50 48 C42 44 34 34 30 18" />
      <path d="M50 46 C46 38 44 26 46 12" />
      <path d="M50 46 C54 38 56 26 54 12" />
      <path d="M50 48 C58 44 66 34 70 18" />
      <path d="M50 50 C60 48 72 40 80 24" />
      <path d="M20 24 C24 26 28 26 30 18" />
      <path d="M80 24 C76 26 72 26 70 18" />
    </svg>
  )
}

export function IconRana({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M30 46 C30 34 39 26 50 26 C61 26 70 34 70 46 C70 58 61 64 50 64 C39 64 30 58 30 46 Z" />
      <circle cx="38" cy="30" r="6" />
      <circle cx="62" cy="30" r="6" />
      <circle cx="38" cy="30" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="62" cy="30" r="1.6" fill="currentColor" stroke="none" />
      <path d="M34 62 C26 66 20 74 22 82" />
      <path d="M22 82 C26 80 30 80 33 76" />
      <path d="M66 62 C74 66 80 74 78 82" />
      <path d="M78 82 C74 80 70 80 67 76" />
      <path d="M40 54 C46 58 54 58 60 54" />
    </svg>
  )
}

export function IconOrquidea({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M50 52 C50 40 42 34 32 36 C34 44 40 50 50 52 Z" />
      <path d="M50 52 C50 40 58 34 68 36 C66 44 60 50 50 52 Z" />
      <path d="M50 52 C46 42 48 30 50 22 C52 30 54 42 50 52 Z" />
      <path d="M50 52 C44 54 40 62 42 70 C48 66 50 60 50 52 Z" />
      <path d="M50 52 C56 54 60 62 58 70 C52 66 50 60 50 52 Z" />
      <circle cx="50" cy="52" r="4" />
      <path d="M50 86 L50 60" />
      <path d="M50 76 C44 76 40 80 40 84" />
      <path d="M50 70 C56 70 60 74 60 78" />
    </svg>
  )
}

export function IconHoja({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M20 80 C20 40 40 16 78 12 C74 50 50 76 20 80 Z" />
      <path d="M22 78 C42 60 58 40 76 14" />
      <path d="M34 62 C40 58 46 54 50 48" />
      <path d="M44 46 C50 42 54 38 58 32" />
    </svg>
  )
}

export function IconAguja({ className }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M24 76 L68 32" />
      <path d="M60 24 L76 40" />
      <path d="M68 32 L76 40 L80 36 L72 28 Z" fill="currentColor" stroke="none" />
      <circle cx="24" cy="76" r="3" fill="currentColor" stroke="none" />
      <path d="M24 76 C18 78 14 82 12 88" strokeDasharray="1 5" />
    </svg>
  )
}
