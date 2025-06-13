// functions/config.js
module.exports = {
  REGION: process.env.FUNCTION_REGION || 'us-central1',
  BUCKET_NAME: process.env.BUCKET_NAME || 'pvme-images',
  PRESET_COLLECTION: process.env.PRESET_COLLECTION || 'presets',
  WEB_CLIENT_URL: process.env.WEB_CLIENT_URL || 'https://pvme.io/preset-maker',
  DEV_CLIENT_URL: process.env.DEV_CLIENT_URL || 'http://localhost:3000/preset-maker',
  EMBED_CACHE_SECONDS: parseInt(process.env.EMBED_CACHE_SECONDS, 10) || 86400,
};
