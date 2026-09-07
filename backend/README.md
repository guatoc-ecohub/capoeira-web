# backend — reservas tattoo.guatoc.co

Servicio HTTP minimo (Node stdlib puro: `http`, `fs`, `path`, `os` — sin
frameworks, sin dependencias npm) que atiende el formulario de reservas del
sitio.

## Que hace

`POST /api/reserva` con JSON `{ nombre, tatuador, tipo, fecha, contacto, idea }`:

1. Valida que `nombre` y `contacto` no vengan vacios (400 si faltan).
2. Appendea la reserva como una linea JSON a `backend/reservas.jsonl`
   (fuente de verdad durable, timestamp del request si viene, si no el del
   server).
3. Reenvia un aviso legible al Telegram del operador (bot en
   `~/.config/telegram-attach-bot-token`, chat `208512105`). Es
   **best-effort**: si Telegram falla (red, token, rate-limit), la reserva
   YA quedo guardada en el paso 2 y el request igual responde `{ok:true}` —
   no se pierde la reserva por un hipo de Telegram. El fallo queda logeado
   en stdout/journal.
4. Responde `{ok:true}` en exito o `{ok:false, error}` en fallo (400/404/405/500).
5. CORS lockeado a `Access-Control-Allow-Origin: https://tattoo.guatoc.co`
   (nunca `*`), maneja el preflight `OPTIONS`.

No hay analytics, no hay llamadas a terceros salvo la API de Telegram.

## Correrlo

```bash
cd backend
node server.js            # PORT default 8793, escucha SOLO en 127.0.0.1
PORT=9001 node server.js  # puerto alternativo (pruebas)
```

Sin dependencias que instalar (`npm install` no hace nada, no hay
`node_modules`).

## Wiring del ingress (nginx)

El server escucha en loopback (`127.0.0.1:8793`), nunca expuesto directo.
nginx (el mismo que sirve el frontend estatico de tattoo.guatoc.co) debe
proxear la ruta de la API hacia el puerto:

```nginx
location /api/reserva {
    proxy_pass http://127.0.0.1:8793/api/reserva;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

El resto de rutas (`/`, `/assets/...`) las sirve el estatico del frontend
como siempre; solo `/api/reserva` se redirige a este proceso.

## Correrlo como servicio (systemd --user)

Ver `reserva.service` (unit de ejemplo) — instrucciones de instalacion en
los comentarios del archivo mismo.

## Datos

`reservas.jsonl` se crea/appendea en `backend/` al primer POST exitoso. Es
PII de contacto real de clientes — **no se versiona** (ver `.gitignore`).
Formato: una linea JSON por reserva:

```json
{"nombre":"...","tatuador":"...","tipo":"flash","fecha":"...","contacto":"...","idea":"...","timestamp":"2026-08-20T..."}
```

## Pruebas hechas

Ver el reporte de la sesion que construyo este backend: se arranco en un
puerto de prueba, se probo el POST feliz (200 + `{ok:true}` + linea nueva en
`reservas.jsonl`), el envio real a Telegram (chat `208512105`), y el rechazo
400 por falta de `nombre`/`contacto`. CORS y preflight `OPTIONS` tambien se
verificaron con `curl -i -X OPTIONS`.
