// functions/handlers/renderPresetImage.js

const admin                  = require('firebase-admin');
const { Storage }            = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { BUCKET_NAME } = require('../config');
const { getImageUrl } = require('../lib/getImageUrl');

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
    return res.status(500).send(err.message || err.toString());
  }


  // 3) Return the fresh PNG URL in JSON (with cache‐bust)
  const imageUrl = getImageUrl(id);
  return res.status(200).json({ imageUrl: url });
}

module.exports = { renderPresetRedirectHandler };
