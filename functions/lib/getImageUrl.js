// functions/lib/getImageUrl.js

const { BUCKET_NAME } = require('../config');

// The emulator (started by `firebase emulators:start`) will set this env var:
const EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST;

function getImageUrl(presetId) {
  const cacheBust = Date.now();
  if (EMULATOR_HOST) {
    // Emulator REST API serves objects under v0/b/<bucket>/o/<object>?alt=media
    const host = EMULATOR_HOST.startsWith('http')
      ? EMULATOR_HOST
      : `http://${EMULATOR_HOST}`;
    const objectPath = encodeURIComponent(`images/${presetId}.png`);
    return `${host}/v0/b/${BUCKET_NAME}/o/${objectPath}?alt=media&cacheBust=${cacheBust}`;
  }

  // Production
  return `https://storage.googleapis.com/${BUCKET_NAME}/images/${presetId}.png?v=${cacheBust}`;
}

module.exports = { getImageUrl };
