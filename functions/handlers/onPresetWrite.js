// functions/handlers/onPresetWrite.js

const { Storage }            = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { BUCKET_NAME }        = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function onPresetWriteHandler(event) {
  console.log('[Trigger Fired]', {
    params: event.params,
    hasBefore: Boolean(event.data.before),
    hasAfter:  Boolean(event.data.after),
  });

  const { before, after } = event.data;         // Firestore change
  const id = event.params.presetId;              // from "presets/{presetId}"

  if (!id) {
    console.error('[Error] missing presetId in event.params', event.params);
    throw new Error('Missing presetId in event.params');
  }

  // Deleted
  if (!after.exists) {
    console.log(`[Delete] removing image for preset: ${id}`);
    try {
      await bucket.file(`images/${id}.png`).delete({ ignoreNotFound: true });
      console.log(`Deleted image for preset ${id}`);
    } catch (err) {
      console.error(`Failed to delete image for preset ${id}:`, err);
    }
    return;
  }

  // Created or updated
  console.log(`[Write] re-rendering image for preset: ${id}`);
  try {
    await renderAndSaveImage(id, false);
    console.log(`[Success] rendered image for ${id}`);
  } catch (err) {
    console.error(`[Error] renderAndSaveImage failed for ${id}:`, err);
    throw err;
  }
}

module.exports = { onPresetWriteHandler };
