const { getImageUrl } = require('../lib/getImageUrl');
const { ensurePresetId, upsertJsonFile, getFileContent } = require('../lib/github');

async function uploadPresetHandler(req, res) {
  try {
    const body     = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    const rawId    = req.query.id;
    const presetId = ensurePresetId(rawId);
    const filePath = `presets/${presetId}.json`;

    const presetName = body.presetName ?? 'Unnamed preset';
    const commitMessage = `Save preset: ${presetName}`;

    await upsertJsonFile(filePath, body, presetId, commitMessage);

    // 🔁 Update the preset-index.json
    const indexPath = 'presets/preset-index.json';
    let index = [];

    try {
      const indexContent = await getFileContent(indexPath);
      index = JSON.parse(indexContent);
      // Remove existing entry if it exists
      index = index.filter(p => p.presetId !== presetId);
    } catch (err) {
      // If 404 or corrupt, start fresh
      index = [];
    }

    index.push({ presetId, presetName });
    await upsertJsonFile(indexPath, index, 'preset-index');

    // ✅ Return final metadata
    return res.status(200).send({
      id: presetId,
      imageUrl: getImageUrl(presetId),
    });

  } catch (err) {
    console.error('uploadPreset error', err);
    return res.status(500).send(err.toString());
  }
}

module.exports = { uploadPresetHandler };
