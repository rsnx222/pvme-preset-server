// functions/lib/firestore.js

const admin = require('firebase-admin');
const itemData = require('../data/sorted_items.json');
const itemMap  = new Map(itemData.map(i => [i.label, i]));

// Helper to fetch & unpack a preset from Firestore
async function getPresetData(presetId) {
  const doc = await admin
    .firestore()
    .collection('presets')
    .doc(presetId)
    .get();
  if (!doc.exists) throw new Error('Preset not found');
  const stored = doc.data();

  const mapSlots = (slots = []) =>
    slots.map(slot => {
      if (!slot || !slot.label) return null;
      const item = itemMap.get(slot.label) || itemMap.get('404item');
      if (slot.breakdownNotes) item.breakdownNotes = slot.breakdownNotes;
      return item;
    });

  return {
    presetName: stored.presetName,
    presetNotes: stored.presetNotes,

    inventorySlots: Array(28)
      .fill(null)
      .map((_, i) =>
        (stored.inventorySlots || [])[i] ? mapSlots(stored.inventorySlots)[i] : null
      ),

    equipmentSlots: Array(13)
      .fill(null)
      .map((_, i) =>
        (stored.equipmentSlots || [])[i] ? mapSlots(stored.equipmentSlots)[i] : null
      ),

    relics: {
      primary:     stored.relics?.primaryRelics     || [],
      alternative: stored.relics?.alternativeRelics || []
    },

    familiars: {
      primary:     stored.familiars?.primaryFamiliars     || [],
      alternative: stored.familiars?.alternativeFamiliars || []
    }
  };
}

module.exports = { getPresetData };
