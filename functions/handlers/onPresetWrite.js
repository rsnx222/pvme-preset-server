// functions/handlers/onPresetWrite.js

const { Storage }           = require('@google-cloud/storage');
const { renderAndSaveImage }= require('../lib/render');
const { BUCKET_NAME }       = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function onPresetWriteHandler(change, ctx) {
  const id = ctx.params.presetId;

  // 1) If the Firestore doc was deleted, remove its PNG from GCS
  if (!change.after.exists) {
    const file = bucket.file(`images/${id}.png`);
    try {
      await file.delete({ ignoreNotFound: true });
      console.log(`Deleted image for removed preset ${id}`);
    } catch (err) {
      console.error(`Failed to delete image for preset ${id}:`, err);
    }
    return;
  }

  // 2) Otherwise (create or update), re‐render the image
  await renderAndSaveImage(id, false);
}

module.exports = { onPresetWriteHandler };
