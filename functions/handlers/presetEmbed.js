// functions/functions/presetEmbed.js

const { getFileContent } = require('../lib/github');
const {
  WEB_CLIENT_URL,
  DEV_CLIENT_URL,
  EMBED_CACHE_SECONDS
} = require('../config');
const { getImageUrl } = require('../lib/getImageUrl');

/**
 * HTTP handler: /embedPreset?id=<presetId>
 * Reads the preset JSON from GitHub, constructs OG meta tags, and redirects.
 */
async function presetEmbedHandler(req, res) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Missing preset ID');
  }

  let data;
  try {
    const json = await getFileContent(`presets/${id}.json`);
    data = JSON.parse(json);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).send('Preset not found');
    }
    console.error('presetEmbed error:', err);
    return res.status(500).send('Error loading preset');
  }

  const title = `PVME Preset: ${data.presetName || id}`;
  const desc  = `View my PVME preset: ${data.presetName || id}`;
  const v     = Date.now();
  const img   = await getImageUrl(id);

  // choose front-end root based on environment
  const isDev = process.env.NODE_ENV === 'development';
  const clientRoot = isDev ? DEV_CLIENT_URL : WEB_CLIENT_URL;
  const url = `${clientRoot}/#/${id}`;

  const html = `<!doctype html>
<html>
  <head>
    <meta property="og:title"       content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image"       content="${img}?v=${v}" />
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
