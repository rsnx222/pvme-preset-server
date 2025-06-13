// functions/functions/presetEmbed.js

const admin   = require('firebase-admin');
const { BUCKET_NAME, PRESET_COLLECTION, WEB_CLIENT_URL, EMBED_CACHE_SECONDS } = require('../config');

async function presetEmbedHandler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing preset ID');

  const doc  = await admin.firestore().collection(PRESET_COLLECTION).doc(id).get();
  if (!doc.exists) return res.status(404).send('Preset not found');

  const data = doc.data();
  const desc = `View my PVME preset: ${data.presetName || id}`;
  const v    = doc.updateTime.toMillis();
  const img  = `https://storage.googleapis.com/${BUCKET_NAME}/images/${id}.png?v=${v}`;
  const url  = `${WEB_CLIENT_URL}/#/${id}`;

  const html = `<!doctype html>
<html><head>
  <meta property="og:title"       content="PVME Preset: ${data.presetName||id}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${img}" />
  <meta property="og:url"         content="${url}" />
  <meta property="og:type"        content="website" />
  <meta name="twitter:card"       content="summary_large_image" />
  <meta http-equiv="refresh"      content="0;url=${url}" />
</head><body>Redirecting…</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', `public, max-age=${EMBED_CACHE_SECONDS}`);
  return res.status(200).send(html);
}

module.exports = { presetEmbedHandler };
