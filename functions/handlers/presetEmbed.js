// functions/functions/presetEmbed.js

const admin   = require('firebase-admin');
const {
  PRESET_COLLECTION,
  WEB_CLIENT_URL,
  DEV_CLIENT_URL,
  EMBED_CACHE_SECONDS
} = require('../config');
const { getImageUrl } = require('../lib/getImageUrl');

async function presetEmbedHandler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing preset ID');

  const doc = await admin
    .firestore()
    .collection(PRESET_COLLECTION)
    .doc(id)
    .get();

  if (!doc.exists) {
    return res.status(404).send('Preset not found');
  }

  const data = doc.data();
  const title = `PVME Preset: ${data.presetName || id}`;
  const desc  = `View my PVME preset: ${data.presetName || id}`;
  // Use the Firestore updateTime for cache‐bust
  const v     = doc.updateTime.toMillis();
  const img = getImageUrl(id);

  // switch front‐end redirect based on emulator vs prod
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const clientRoot = isEmulator ? DEV_CLIENT_URL : WEB_CLIENT_URL;
  const url        = `${clientRoot}/#/${id}`;

  const html = `<!doctype html>
<html>
  <head>
    <meta property="og:title"       content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image"       content="${img}" />
    <meta property="og:url"         content="${url}" />
    <meta property="og:type"        content="website" />
    <meta name="twitter:card"       content="summary_large_image" />
    <meta http-equiv="refresh"      content="0;url=${url}" />
  </head>
  <body>Redirecting…</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader(
    'Cache-Control',
    `public, max-age=${EMBED_CACHE_SECONDS}`
  );
  return res.status(200).send(html);
}

module.exports = { presetEmbedHandler };
