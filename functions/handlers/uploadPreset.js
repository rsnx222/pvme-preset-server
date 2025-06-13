// functions/functions/uploadPreset.js

const admin     = require('firebase-admin');
const { BUCKET_NAME, PRESET_COLLECTION } = require('../config');
const { getImageUrl } = require('../lib/getImageUrl');

async function uploadPresetHandler(req, res) {
  try {
    const body     = typeof req.body==='object' ? req.body : JSON.parse(req.body);
    const presetId = req.query.id;
    const col      = admin.firestore().collection(PRESET_COLLECTION);

    // 1) Save JSON to Firestore
    const idToUse = presetId
      ? (await col.doc(presetId).set(body) && presetId)
      : (await col.add(body)).id;

      const imageUrl = getImageUrl(presetId);
      return res.status(200).send(imageUrl);

  } catch (err) {
    console.error('uploadPreset error', err);
    return res.status(500).send(err.toString());
  }
}

module.exports = { uploadPresetHandler };
