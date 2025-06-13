// functions/lib/render.js
const path            = require('path');
const { createCanvas } = require('canvas');
const { Storage }     = require('@google-cloud/storage');
const { getPresetData } = require('./firestore');
const { drawCentered, drawFitted, queueSection } = require('./canvas');
const { BUCKET_NAME } = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function renderAndSaveImage(id, debug = false) {
  // 1) fetch data
  const preset = await getPresetData(id);

  // 2) load ALL assets once per invocation
  //    these are local files in /assets
  const [ bgInvEq, bgMain, slotBg, relicIcon, famIcon ] =
    await Promise.all([
      loadLocal('bgInventAndEquipment.png'),
      loadLocal('bgMain.png'),
      loadLocal('bg.png'),
      loadLocal('relic.png'),
      loadLocal('familiar.png'),
    ]);

  // 3) layout calculations (same as before) …
  //    → createCanvas, draw tile background + header + title
  //    → queueSection for inventory, equipment, relics, familiars
  //    → drawCentered / drawFitted
  //    → optional debug outlines

  // 4) write to GCS
  const buf  = canvas.toBuffer('image/png');
  const file = bucket.file(`images/${id}.png`);
  await file.save(buf, {
    contentType: 'image/png',
    metadata: { cacheControl: 'public, max-age=0, no-cache' },
  });
}

// helper to load from your local assets folder
async function loadLocal(name) {
  return loadImage(path.resolve(__dirname, '..', 'assets', name));
}

module.exports = { renderAndSaveImage };
