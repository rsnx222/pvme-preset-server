// functions/functions/uploadPreset.js

const admin     = require('firebase-admin');
const { PRESET_COLLECTION } = require('../config');

async function uploadPresetHandler(req, res) {
  try {
    const body     = typeof req.body==='object' ? req.body : JSON.parse(req.body);
    const presetId = req.query.id;
    const col      = admin.firestore().collection(PRESET_COLLECTION);

    if (presetId) {
      await col.doc(presetId).set(body, { merge: true });
      return res.status(200).send(presetId);
    } else {
      const ref = await col.add(body);
      return res.status(200).send(ref.id);
    }
  } catch (err) {
    console.error('uploadPreset error', err);
    return res.status(500).send(err.toString());
  }
}

module.exports = { uploadPresetHandler };
