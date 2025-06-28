// functions/lib/getImageUrl.js

const { Storage } = require('@google-cloud/storage');
const fetch = require('node-fetch');
const { BUCKET_NAME } = require('../config');

const storage = new Storage();
const EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

/**
 * Checks if an image exists. If missing, triggers render.
 */
async function getImageUrl(presetId) {
  const cacheBust = Date.now();
  const imagePath = `images/${presetId}.png`;
  const file = storage.bucket(BUCKET_NAME).file(imagePath);

  const [exists] = await file.exists();
  if (!exists) {
    const renderUrl = `https://${PROJECT_ID}.web.app/renderPresetImage?id=${presetId}`;
    const response = await fetch(renderUrl);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Rendering failed: ${response.status} ${body}`);
    }
  }

  if (EMULATOR_HOST) {
    const host = EMULATOR_HOST.startsWith('http')
      ? EMULATOR_HOST
      : `http://${EMULATOR_HOST}`;
    const objectPath = encodeURIComponent(imagePath);
    return `${host}/v0/b/${BUCKET_NAME}/o/${objectPath}?alt=media&cacheBust=${cacheBust}`;
  }

  return `https://storage.googleapis.com/${BUCKET_NAME}/${imagePath}?v=${cacheBust}`;
}

module.exports = { getImageUrl };
