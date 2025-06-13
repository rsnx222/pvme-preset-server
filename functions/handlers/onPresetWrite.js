// functions/functions/onPresetWrite.js

const { renderAndSaveImage } = require('../lib/render');

async function onPresetWriteHandler(change, ctx) {
  const id = ctx.params.presetId;
  if (!change.after.exists) {
    // optional: delete old image
    return;
  }
  await renderAndSaveImage(id, false);
}

module.exports = { onPresetWriteHandler };
