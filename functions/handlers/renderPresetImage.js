// functions/handlers/renderPresetImage.js

const { Storage }            = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { getFileContent }     = require('../lib/github');
const { BUCKET_NAME }        = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

/**
 * HTTP handler: /renderPresetImage?id=<presetId>&debug=<true|false>
 * Reads the preset JSON from GitHub, re-renders the image, and returns its URL.
 */
async function renderPresetImageHandler(req, res) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Missing preset ID');
  }

  let presetJson;
  try {
    // Fetch preset JSON from GitHub
    const content = await getFileContent(`presets/${id}.json`);
    presetJson = JSON.parse(content);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).send('Preset not found');
    }
    console.error(`Error loading preset ${id}:`, err);
    return res.status(500).send(err.toString());
  }

  // 2) Always re-render the image
  try {
    await renderAndSaveImage(id, Boolean(req.query.debug));
  } catch (err) {
    console.error(`Error re-rendering preset ${id}:`, err);
    return res.status(500).send(err.message || err.toString());
  }

  // 3) Return the fresh PNG URL in JSON (with cache‐bust)
  const { getImageUrl } = require('../lib/getImageUrl');
  const imageUrl = getImageUrl(id);
  return res.status(200).json({ imageUrl });
}

module.exports = { renderPresetImageHandler };
