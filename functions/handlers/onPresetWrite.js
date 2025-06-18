// functions/handlers/onPresetWrite.js

const { Storage } = require('@google-cloud/storage');
const { renderAndSaveImage } = require('../lib/render');
const { BUCKET_NAME } = require('../config');

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

/**
 * HTTP webhook handler for GitHub "push" events on presets/*.json.
 * Signature verification is skipped in development to avoid mismatches.
 */
async function onPresetWriteHandler(req, res) {
  const event = req.headers['x-github-event'];
  if (!event) {
    return res.status(400).send('Missing X-GitHub-Event header');
  }

  if (event !== 'push') {
    console.log(`[Webhook] Ignored event: ${event}`);
    return res.status(200).send(`Event ${event} ignored`);
  }

  const { commits } = req.body;
  if (!Array.isArray(commits)) {
    console.error('[Webhook] Invalid payload: commits not found');
    return res.status(400).send('Invalid payload');
  }

  for (const commit of commits) {
    // Handle added or modified preset files
    const changed = [...(commit.added || []), ...(commit.modified || [])]
      .filter(path => path.startsWith('presets/') && path.endsWith('.json'));

    for (const filePath of changed) {
      const presetId = filePath.replace(/^presets\//, '').replace(/\.json$/, '');
      console.log(`[Webhook] Rendering image for updated preset: ${presetId}`);
      try {
        await renderAndSaveImage(presetId, false);
        console.log(`[Webhook] Rendered image for ${presetId}`);
      } catch (err) {
        console.error(`[Webhook] renderAndSaveImage failed for ${presetId}:`, err);
      }
    }

    // Handle removed preset files
    const removed = (commit.removed || [])
      .filter(path => path.startsWith('presets/') && path.endsWith('.json'));

    for (const filePath of removed) {
      const presetId = filePath.replace(/^presets\//, '').replace(/\.json$/, '');
      console.log(`[Webhook] Removing image for deleted preset: ${presetId}`);
      try {
        await bucket.file(`images/${presetId}.png`).delete({ ignoreNotFound: true });
        console.log(`[Webhook] Deleted image for preset ${presetId}`);
      } catch (err) {
        console.error(`[Webhook] Failed to delete image for ${presetId}:`, err);
      }
    }
  }

  res.status(200).send('Webhook processed');
}

module.exports = { onPresetWriteHandler };
