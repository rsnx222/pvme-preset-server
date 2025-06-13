// functions/lib/canvas.js

const { loadImage } = require('canvas');
const itemData      = require('../data/sorted_items.json');
const itemMap       = new Map(itemData.map(i => [i.label, i]));

/**
 * Draw an image at its natural size, centered in a slot.
 */
function drawCentered(ctx, img, x, y, slotW, slotH) {
  const offsetX = x + (slotW - img.width) / 2;
  const offsetY = y + (slotH - img.height) / 2;
  ctx.drawImage(img, offsetX, offsetY);
}

/**
 * Draw an image scaled down to fit within a slot, preserving aspect ratio.
 */
function drawFitted(ctx, img, x, y, slotW, slotH) {
  const scale = Math.min(slotW / img.width, slotH / img.height);
  const w     = img.width * scale;
  const h     = img.height * scale;
  const offsetX = x + (slotW - w) / 2;
  const offsetY = y + (slotH - h) / 2;
  ctx.drawImage(img, offsetX, offsetY, w, h);
}

/**
 * For a flat array of items, queue up loadImage() promises
 * that resolve to { img, x, y, w, h }.  If loading fails,
 * falls back to the “404item” image from sorted_items.json.
 *
 * @param {Array} itemsArray  — array of { image: string, ... } or null
 * @param {number} cols       — number of columns in this grid
 * @param {number} slotW      — slot width
 * @param {number} slotH      — slot height
 * @param {number} startX     — x-offset of the first slot
 * @param {number} startY     — y-offset of the first slot
 * @param {number} gapX       — horizontal gap between slots
 * @param {number} gapY       — vertical gap between slots
 * @returns {Promise<{img:Image,x:number,y:number,w:number,h:number}>[]}
 */
function queueSection(itemsArray, cols, slotW, slotH, startX, startY, gapX, gapY) {
  return itemsArray
    .map((it, i) => {
      if (!it || !it.image) return null;

      const x = startX + (i % cols) * (slotW + gapX);
      const y = startY + Math.floor(i / cols) * (slotH + gapY);

      // try primary image…
      return loadImage(it.image)
        .then(img => ({ img, x, y, w: slotW, h: slotH }))
        .catch(() => {
          // fallback to 404item if available
          const fallback = itemMap.get('404item');
          if (!fallback || !fallback.image) return null;
          return loadImage(fallback.image)
            .then(img => ({ img, x, y, w: slotW, h: slotH }))
            .catch(() => null);
        });
    })
    .filter(task => task !== null);
}

module.exports = {
  drawCentered,
  drawFitted,
  queueSection,
};
