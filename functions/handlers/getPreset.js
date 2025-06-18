// functions/handlers/getPreset.js

const { getFileContent } = require('../lib/github');

/**
 * HTTP GET handler: /getPreset?id=<presetId>
 * Reads the preset JSON from the GitHub repo under presets/{id}.json
 * and returns it (including the presetId) to the client.
 */
async function getPresetHandler(req, res) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Missing preset ID');
  }

  const filePath = `presets/${id}.json`;
  try {
    // Fetch base64 content from GitHub
    const content = await getFileContent(filePath);
    // Parse JSON
    const data = JSON.parse(content);
    return res.json({ presetId: id, ...data });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).send('Preset not found');
    }
    console.error('getPreset error', err);
    return res.status(500).send(err.toString());
  }
}

module.exports = { getPresetHandler };
