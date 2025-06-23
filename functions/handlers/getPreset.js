// functions/handlers/getPreset.js

const { getFileContent } = require('../lib/github');
const { getSecret } = require('../lib/secrets');

// Only public origins go here
const ALLOWED_ORIGINS = ['https://pvme.io', 'https://rsnx222.github.io'];

async function getPresetHandler(req, res) {
  const origin = req.get('origin');
  const allowOrigin = await resolveAllowedOrigin(origin, req);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req, res, allowOrigin);
  }

  if (!allowOrigin) {
    console.warn(`Blocked request from disallowed origin: ${origin}`);
    res.set('Access-Control-Allow-Origin', 'null');
    return res.status(403).send('Forbidden');
  }

  res.set('Access-Control-Allow-Origin', allowOrigin);

  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Missing preset ID');
  }

  try {
    const content = await getFileContent(`presets/${id}.json`);
    const data = JSON.parse(content);
    return res.json({ presetId: id, ...data });
  } catch (err) {
    console.error('getPreset error', err);
    return res.status(err.status === 404 ? 404 : 500).send(err.toString());
  }
}

async function resolveAllowedOrigin(origin, req) {
  console.log('resolveAllowedOrigin: origin =', origin);

  if (!origin) return null;

  if (ALLOWED_ORIGINS.includes(origin)) {
    console.log('resolveAllowedOrigin: allowed public origin');
    return origin;
  }

  if (origin === 'http://localhost:3000') {
    if (req.method === 'OPTIONS') {
      return origin;
    }
    const expectedSecret = await getSecret('vite-dev-secret');
    const providedSecret = req.get('X-Dev-Secret');
    if (providedSecret === expectedSecret) {
      return origin;
    }
  }

  console.warn(`resolveAllowedOrigin: blocked origin ${origin}`);
  return null;
}


function handlePreflight(req, res, allowOrigin) {
  if (!allowOrigin) {
    return res.status(403).send('Forbidden');
  }

  const requestedHeaders = req.get('Access-Control-Request-Headers') || 'Content-Type';

  res.set('Access-Control-Allow-Origin', allowOrigin);
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', requestedHeaders);
  return res.status(204).send('');
}

module.exports = { getPresetHandler };
