// functions/handlers/uploadPreset.js

const { getImageUrl } = require('../lib/getImageUrl');
const { ensurePresetId, upsertJsonFile, getFileContent } = require('../lib/github');
const { getSecret } = require('../lib/secrets');

// Only public origins go here
const ALLOWED_ORIGINS = ['https://pvme.io', 'https://rsnx222.github.io'];

async function uploadPresetHandler(req, res) {
  const origin = req.get('origin');
  const allowOrigin = await resolveAllowedOrigin(origin, req);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req, res, allowOrigin);
  }

  if (!allowOrigin) {
    console.warn(`Blocked upload request from disallowed origin: ${origin}`);
    res.set('Access-Control-Allow-Origin', 'null');
    return res.status(403).send('Forbidden');
  }

  res.set('Access-Control-Allow-Origin', allowOrigin);

  try {
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    const rawId = req.query.id;
    const presetId = ensurePresetId(rawId);
    const filePath = `presets/${presetId}.json`;

    const presetName = body.presetName ?? 'Unnamed preset';
    const commitMessage = `Save preset: ${presetName}`;

    await upsertJsonFile(filePath, body, presetId, commitMessage);

    const indexPath = 'presets/preset-index.json';
    let index = [];

    try {
      const indexContent = await getFileContent(indexPath);
      index = JSON.parse(indexContent).filter(p => p.presetId !== presetId);
    } catch {
      index = [];
    }

    index.push({ presetId, presetName });
    await upsertJsonFile(indexPath, index, 'preset-index');

    return res.status(200).send({
      id: presetId,
      imageUrl: getImageUrl(presetId),
    });

  } catch (err) {
    console.error('uploadPreset error', err);
    res.set('Access-Control-Allow-Origin', allowOrigin);
    return res.status(500).send(err.toString());
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
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', requestedHeaders);

  return res.status(204).send('');
}

module.exports = { uploadPresetHandler };
