# Entrega frontend

## Hecho

- Reemplacé la base de tatuaje por el sitio del Campamento de Capoeira en `src/App.jsx`.
- Centralicé copy, agenda, instructores, técnica, precios, cupos, reserva y footer en `src/data/contenido.js`.
- Creé `Agenda.jsx`, `Instructores.jsx`, `Tecnica.jsx` y `Precios.jsx`; adapté `Hero.jsx`, `Nav.jsx`, `Reserva.jsx` y `Footer.jsx`.
- Reescribí `src/index.css` con la paleta y el lenguaje visual del brief, responsive mobile-first, estados de foco y HTML semántico.
- Eliminé componentes heredados de tatuaje (`Muro3D`, `Evento`, `Ubicacion` y `Botanicos`) y retiré `three` de las dependencias.
- Actualicé `index.html`, `package.json`/`package-lock.json` y agregué `public/fonts/big-shoulders-latin.woff2`.
- La reserva valida nombre y correo en el navegador, acepta celular opcional y no llama todavía a ninguna API.

## Pendiente

- Agregar las fotografías definitivas de C.m. Vermelho y Profesor Capeta.
- Solicitar y agregar la foto original de C.m. Águila.
- Conectar el formulario al backend cuando se defina ese contrato.
- Confirmar el valor de la cuota restante y actualizar las cohortes early-bird si cambian.

## Verificación

`npm run build` compila correctamente. La instalación desde el registro npm quedó limitada por la red del entorno; el build se verificó con las dependencias locales disponibles.
