// functions/functions/renderPresetImage.js

const admin                  = require('firebase-admin');
const { Storage }            = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { BUCKET_NAME, PRESET_COLLECTION } = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function renderPresetRedirectHandler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing preset ID');

  const gcsPath = `images/${id}.png`;
  const file    = bucket.file(gcsPath);

  try {
    const [exists] = await file.exists();
    if (exists) {
      return res.redirect(`https://storage.googleapis.com/${BUCKET_NAME}/${gcsPath}?v=${Date.now()}`);
    }

    // ensure preset JSON exists
    const doc = await admin.firestore().collection(PRESET_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return res.status(404).send('Preset not found');
    }

    // first‐time render
    await renderAndSaveImage(id, false);
    return res.redirect(`https://storage.googleapis.com/${BUCKET_NAME}/${gcsPath}?v=${Date.now()}`);

  } catch (err) {
    console.error('renderPresetImage error:', err);
    return res.status(500).send(err.toString());
  }
}

module.exports = { renderPresetRedirectHandler };
