// functions/config.js
module.exports = {
  REGION: process.env.FUNCTION_REGION || 'us-central1',
  BUCKET_NAME: 'pvme-images',
  PRESET_COLLECTION: 'presets',
  WEB_CLIENT_URL: 'https://pvme.io/preset-maker',
  // OG cache TTL (seconds):
  EMBED_CACHE_SECONDS: 86400,
};
