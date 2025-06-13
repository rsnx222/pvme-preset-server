// functions/index.js

// 1) Initialize Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();

// 2) Pull in the v2 trigger factories
const { onRequest }            = require("firebase-functions/v2/https");
const { onDocumentWritten }    = require("firebase-functions/v2/firestore");

// 3) Config & handlers
const { REGION, PRESET_COLLECTION } = require("./config");
const { uploadPresetHandler }       = require("./handlers/uploadPreset");
const { presetEmbedHandler }        = require("./handlers/presetEmbed");
const { renderPresetRedirectHandler } = require("./handlers/renderPresetImage");
const { onPresetWriteHandler }      = require("./handlers/onPresetWrite");

// 4) Exports

// — HTTP endpoints
exports.uploadPreset = onRequest(
  { region: REGION },
  uploadPresetHandler
);

exports.presetEmbed = onRequest(
  { region: REGION },
  presetEmbedHandler
);

exports.renderPresetImage = onRequest(
  { region: REGION },
  renderPresetRedirectHandler
);

// — Firestore on‐write trigger (pre-renders on edits)
exports.onPresetWrite = onDocumentWritten(
  {
    region: REGION,
    document: `${PRESET_COLLECTION}/{presetId}`
  },
  onPresetWriteHandler
);
