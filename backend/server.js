'use strict';

// Backend minimo del formulario de reservas de tattoo.guatoc.co.
// Node puro (http/fs/path/os stdlib) - sin frameworks, sin dependencias npm.
//
// POST /api/reserva { nombre, tatuador, tipo, fecha, contacto, idea }
//   -> valida nombre + contacto
//   -> appendea la reserva a reservas.jsonl (fuente de verdad durable)
//   -> reenvia un aviso a Telegram (best-effort: si Telegram falla, la
//      reserva ya quedo guardada, no se pierde)
//   -> responde { ok: true } | { ok: false, error }
//
// Escucha SOLO en 127.0.0.1 - el ingress (nginx) hace el proxy hacia afuera.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8793;
const HOST = '127.0.0.1';

const ALLOWED_ORIGIN = 'https://tattoo.guatoc.co';
const TELEGRAM_CHAT_ID = '208512105';
const TELEGRAM_TOKEN_PATH = path.join(os.homedir(), '.config', 'telegram-attach-bot-token');
const RESERVAS_PATH = path.join(__dirname, 'reservas.jsonl');
const MAX_BODY_BYTES = 64 * 1024;

// ---- utilidades -----------------------------------------------------------

function leerTokenTelegram() {
  try {
    const raw = fs.readFileSync(TELEGRAM_TOKEN_PATH, 'utf8');
    // equivalente a `tr -d ' '` pero cubre cualquier whitespace (espacios,
    // tabs, saltos de linea al final del archivo)
    const token = raw.replace(/\s/g, '');
    return token || null;
  } catch (err) {
    console.error(`[reserva] no pude leer el token de Telegram en ${TELEGRAM_TOKEN_PATH}:`, err.message);
    return null;
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('cuerpo demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function campoTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function formatearMensaje(reserva) {
  const idea = reserva.idea || '(sin idea)';
  const tatuador = reserva.tatuador || '(sin tatuador)';
  const tipo = reserva.tipo || '(sin tipo)';
  const fecha = reserva.fecha || '(sin fecha)';
  return (
    `🖋️ Nueva reserva tattoo Guatoc — ${reserva.nombre} · ${tatuador} · ` +
    `${tipo} · ${fecha} · ${reserva.contacto} · idea: ${idea}`
  );
}

async function enviarTelegram(reserva) {
  const token = leerTokenTelegram();
  if (!token) {
    return { ok: false, error: 'token de telegram no disponible' };
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const texto = formatearMensaje(reserva);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: texto }),
    });
    let data = {};
    try {
      data = await resp.json();
    } catch (_) {
      // respuesta no-JSON, seguimos con el status HTTP
    }
    if (!resp.ok || data.ok === false) {
      const detalle = data.description || `http ${resp.status}`;
      console.error('[reserva] telegram respondio error:', detalle);
      return { ok: false, error: detalle };
    }
    return { ok: true };
  } catch (err) {
    console.error('[reserva] fallo la llamada a telegram:', err.message);
    return { ok: false, error: err.message };
  }
}

function appendReserva(reserva) {
  fs.appendFileSync(RESERVAS_PATH, JSON.stringify(reserva) + '\n', 'utf8');
}

// ---- handler ----------------------------------------------------------

async function manejarReserva(req, res) {
  let raw;
  try {
    raw = await readBody(req);
  } catch (err) {
    sendJson(res, 400, { ok: false, error: 'body invalido: ' + err.message });
    return;
  }

  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {
    sendJson(res, 400, { ok: false, error: 'JSON invalido' });
    return;
  }

  const nombre = campoTexto(data.nombre);
  const contacto = campoTexto(data.contacto);

  if (!nombre || !contacto) {
    sendJson(res, 400, { ok: false, error: 'faltan campos obligatorios: nombre y contacto' });
    return;
  }

  const reserva = {
    nombre,
    tatuador: campoTexto(data.tatuador),
    tipo: campoTexto(data.tipo),
    fecha: campoTexto(data.fecha),
    contacto,
    idea: campoTexto(data.idea),
    timestamp: campoTexto(data.timestamp) || new Date().toISOString(),
  };

  try {
    appendReserva(reserva);
  } catch (err) {
    console.error('[reserva] no pude escribir reservas.jsonl:', err.message);
    sendJson(res, 500, { ok: false, error: 'no se pudo guardar la reserva' });
    return;
  }

  // La reserva ya quedo persistida (fuente de verdad). El aviso a Telegram
  // es best-effort: si falla, no se pierde la reserva, solo se logea.
  const telegramResult = await enviarTelegram(reserva);
  if (!telegramResult.ok) {
    console.error('[reserva] reserva guardada, pero fallo el aviso a Telegram:', telegramResult.error);
  }

  sendJson(res, 200, { ok: true });
}

const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || HOST}`);

  if (url.pathname !== '/api/reserva') {
    sendJson(res, 404, { ok: false, error: 'no encontrado' });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'metodo no permitido' });
    return;
  }

  manejarReserva(req, res).catch((err) => {
    console.error('[reserva] error inesperado:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: 'error interno' });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[reserva] escuchando en http://${HOST}:${PORT} (reservas -> ${RESERVAS_PATH})`);
});

module.exports = server;
