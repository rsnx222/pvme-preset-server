// functions/lib/render.js
const path                  = require('path');
const { createCanvas, loadImage } = require('canvas');
const { Storage }           = require('@google-cloud/storage');
const { getPresetData }     = require('./firestore');
const { drawCentered, drawFitted, queueSection } = require('./canvas');
const { BUCKET_NAME }       = require('../config');

const storage = new Storage();
const bucket  = storage.bucket(BUCKET_NAME);

async function renderAndSaveImage(id, debug = false) {
  // 1) fetch data
  const preset = await getPresetData(id);

  // 2) load ALL assets
  const [ bgInvEq, bgMain, slotBg, relicIcon, famIcon ] = await Promise.all([
    loadLocal('bgInventAndEquipment.png'),
    loadLocal('bgMain.png'),
    loadLocal('bg.png'),
    loadLocal('relic.png'),
    loadLocal('familiar.png'),
  ]);

  // 3) layout config
  const gutter       = 15;
  const totalWidth   = 510 + gutter * 2;
  const headerHeight = 50;
  const bottomColWidth = (totalWidth - 3 * gutter) / 2;

  const inventory = { cols:7, rows:4, w:36, h:32,
    sx: gutter + 10, sy: headerHeight + 8, gx:7, gy:4 };

  const equipment = { cols:4, rows:4, w:32, h:32,
    sx: 345, sy: headerHeight + 8, gx:14, gy:6 };

  const relics = { cols:1, rows:3, w: bottomColWidth, h:32,
    sx: gutter, sy: headerHeight + bgInvEq.height + gutter, gx:0, gy:10 };

  const familiars = { cols:1, rows:1, w: bottomColWidth, h:32,
    sx: gutter + bottomColWidth + gutter, sy: relics.sy, gx:0, gy:10 };

  // 4) compute bottoms
  const invBottom = inventory.sy + inventory.h * inventory.rows + inventory.gy * (inventory.rows - 1);
  const eqBottom  = equipment.sy + equipment.h * equipment.rows + equipment.gy * (equipment.rows - 1);

  const relicsPrimBottom = relics.sy + relics.h * relics.rows + relics.gy * (relics.rows - 1);
  const altRelics = (preset.relics.alternative || []).filter(s => s && (s.label || s.image));
  const relicsAltBottom = altRelics.length
    ? relicsPrimBottom + 30 + gutter + altRelics.length * (relics.h + relics.gy)
    : relicsPrimBottom;

  const famPrimBottom = familiars.sy + familiars.h * familiars.rows + familiars.gy * (familiars.rows - 1);
  const altFam = (preset.familiars.alternative || []).filter(s => s && (s.label || s.image));
  const famAltBottom = altFam.length
    ? famPrimBottom + 30 + gutter + altFam.length * (familiars.h + familiars.gy)
    : famPrimBottom;

  // 5) final canvas size
  const contentBottom = Math.max(invBottom, eqBottom, relicsAltBottom, famAltBottom);
  const canvas = createCanvas(totalWidth, contentBottom + gutter);
  const ctx    = canvas.getContext('2d');

  // 6) draw backgrounds & header
  for (let y = 0; y < canvas.height; y += bgMain.height) ctx.drawImage(bgMain, 0, y);
  ctx.drawImage(bgInvEq, gutter, headerHeight, bgInvEq.width, bgInvEq.height);

  ctx.font = '800 18px Roboto, Arial, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preset.presetName, totalWidth/2, headerHeight/2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 7) inventory & equipment
  const invTasks = queueSection(preset.inventorySlots, inventory.cols, inventory.w, inventory.h,
    inventory.sx, inventory.sy, inventory.gx, inventory.gy);
  (await Promise.all(invTasks)).forEach(({img,x,y,w,h}) => drawCentered(ctx, img, x, y, w, h));

  const eqTasks = queueSection(preset.equipmentSlots, equipment.cols, equipment.w, equipment.h,
    equipment.sx, equipment.sy, equipment.gx, equipment.gy);
  (await Promise.all(eqTasks)).forEach(({img,x,y,w,h}) => {
    ctx.drawImage(slotBg, x, y, w, h);
    drawCentered(ctx, img, x, y, w, h);
  });

  // 8) primary relics
  const relicTasks = queueSection(preset.relics.primary, 1, relics.w, relics.h,
    relics.sx, relics.sy, relics.gx, relics.gy);
  (await Promise.all(relicTasks)).forEach(({img,x,y,w,h}) => {
    ctx.strokeStyle = '#485968'; ctx.lineWidth = 0.75; ctx.strokeRect(x,y,w,h);
    drawFitted(ctx, img, x+4, y+4, 24, 24);
    const slot = preset.relics.primary[(y - relics.sy)/(relics.h+relics.gy)];
    ctx.fillStyle = 'white'; ctx.font = '700 14px Roboto, Arial, sans-serif';
    ctx.fillText(slot.name||slot.label, x+36, y+h/2+5);
  });

  // 9) alternative relics
  if (altRelics.length) {
    const altY = relicsPrimBottom + 37;
    const altX = gutter + bottomColWidth/2;
    ctx.textAlign='center'; ctx.font='400 14px Roboto, Arial, sans-serif'; ctx.fillStyle='white';
    ctx.fillText('Alternatives', altX, altY);
    ctx.textAlign='left';
    const altTasks = queueSection(altRelics,1,relics.w,relics.h,
      relics.sx,altY+15,relics.gx,relics.gy);
    (await Promise.all(altTasks)).forEach(({img,x,y,w,h},i) => {
      ctx.strokeStyle='#485968'; ctx.lineWidth=0.75; ctx.strokeRect(x,y,w,h);
      drawFitted(ctx,img,x+4,y+4,24,24);
      const slot = altRelics[i];
      ctx.fillStyle='white'; ctx.font='700 14px Roboto, Arial, sans-serif';
      ctx.fillText(slot.name||slot.label,x+36,y+h/2+5);
    });
  }

  // 10) primary familiars
  const famTasks = queueSection(preset.familiars.primary, 1, familiars.w, familiars.h,
    familiars.sx, familiars.sy, familiars.gx, familiars.gy);
  (await Promise.all(famTasks)).forEach(({img,x,y,w,h}) => {
    ctx.strokeStyle='#485968'; ctx.lineWidth=0.75; ctx.strokeRect(x,y,w,h);
    drawFitted(ctx,img,x+4,y+4,24,24);
    const slot = preset.familiars.primary[0];
    ctx.fillStyle='white'; ctx.font='700 14px Roboto, Arial, sans-serif';
    ctx.fillText(slot.name||slot.label,x+36,y+h/2+5);
  });

  // 11) alternative familiars
  if (altFam.length) {
    const altFY = famPrimBottom + 37;
    const altFX = gutter*2 + bottomColWidth + bottomColWidth/2;
    ctx.textAlign='center'; ctx.font='400 14px Roboto, Arial, sans-serif'; ctx.fillStyle='white';
    ctx.fillText('Alternatives', altFX, altFY);
    ctx.textAlign='left';
    const famAltTasks = queueSection(altFam,1,familiars.w,familiars.h,
      familiars.sx,altFY+15,familiars.gx,familiars.gy);
    (await Promise.all(famAltTasks)).forEach(({img,x,y,w,h},i) => {
      ctx.strokeStyle='#485968'; ctx.lineWidth=0.75; ctx.strokeRect(x,y,w,h);
      drawFitted(ctx,img,x+4,y+4,24,24);
      const slot = altFam[i];
      ctx.fillStyle='white'; ctx.font='700 14px Roboto, Arial, sans-serif';
      ctx.fillText(slot.name||slot.label,x+36,y+h/2+5);
    });
  }

  // 12) optional debug
  if (debug) {
    // ... your grid outline code ...
  }

  // 13) save to GCS
  const buffer = canvas.toBuffer('image/png');
  await bucket.file(`images/${id}.png`).save(buffer, {
    contentType: 'image/png',
    metadata: { cacheControl:'public,max-age=0,no-cache' }
  });
}

// helper to load from assets
async function loadLocal(name) {
  return loadImage(path.resolve(__dirname,'..','assets',name));
}

module.exports = { renderAndSaveImage };
