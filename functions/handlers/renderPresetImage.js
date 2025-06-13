// functions/handlers/renderPresetImage.js

const admin                  = require('firebase-admin');
const { Storage }            = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { BUCKET_NAME, PRESET_COLLECTION } = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function renderPresetRedirectHandler(req, res) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Missing preset ID');
  }

  // 1) Ensure the preset exists
  const doc = await admin
    .firestore()
    .collection(PRESET_COLLECTION)
    .doc(id)
    .get();
  if (!doc.exists) {
    return res.status(404).send('Preset not found');
  }

  // 2) Always re-render the image
  try {
    await renderAndSaveImage(id, /* debug */ req.query.debug === 'true');
  } catch (err) {
    console.error(`Error re-rendering preset ${id}:`, err);
    return res.status(500).send('Render failed');
  }

  // 3) Redirect to the fresh PNG (with cache‐bust)
  const url = `https://storage.googleapis.com/${BUCKET_NAME}/images/${id}.png?v=${Date.now()}`;
  return res.redirect(url);
}

module.exports = { renderPresetRedirectHandler };
