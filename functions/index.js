// functions/index.js
require('dotenv').config();

// 1) Initialize Admin SDK
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}

// 2) Pull in the HTTP trigger factory
const { onRequest } = require("firebase-functions/v2/https");

// 3) Config & handlers
const {
  REGION,
  WEB_CLIENT_URL,
  DEV_CLIENT_URL
} = require("./config");

const { uploadPresetHandler } = require("./handlers/uploadPreset");
const { presetEmbedHandler } = require("./handlers/presetEmbed");
const { renderPresetImageHandler } = require("./handlers/renderPresetImage");
const { onPresetWriteHandler } = require("./handlers/onPresetWrite");
const { getPresetHandler } = require("./handlers/getPreset");

// 4) Exports

// — HTTP endpoints
exports.uploadPreset = onRequest({ region: REGION }, uploadPresetHandler);
exports.getPreset = onRequest({ region: REGION }, getPresetHandler);
exports.presetEmbed = onRequest({ region: REGION }, presetEmbedHandler);
exports.renderPresetImage = onRequest({ region: REGION }, renderPresetImageHandler);

// — GitHub webhook: re-render images on GitHub preset updates
exports.onPresetWrite = onRequest(
  {
    region: REGION,
    bodyParser: false
  },
  onPresetWriteHandler
);
