import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Regla dura del contrato: base SIEMPRE en raíz. Nunca un prefijo tipo '/tattoo/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
