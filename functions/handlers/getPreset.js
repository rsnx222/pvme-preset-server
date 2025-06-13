// functions/handlers/getPreset.js
const admin = require("firebase-admin");
const { PRESET_COLLECTION } = require("../config");

/**
 * HTTP GET handler: /getPreset?id=<presetId>
 * Returns the raw preset JSON (including the ID) for your front-end to consume.
 */
async function getPresetHandler(req, res) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send("Missing preset ID");
  }

  const doc = await admin
    .firestore()
    .collection(PRESET_COLLECTION)
    .doc(id)
    .get();

  if (!doc.exists) {
    return res.status(404).send("Preset not found");
  }

  const data = doc.data();
  // include the ID so your front-end can set state.url = `/${presetId}`
  return res.json({ presetId: id, ...data });
}

module.exports = { getPresetHandler };
