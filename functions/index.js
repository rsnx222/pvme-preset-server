const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const { registerFont, createCanvas, loadImage } = require("canvas");
const path = require("path");

// Regular = 400
registerFont(
  path.resolve(__dirname, "assets/Roboto-Medium.ttf"),
  { family: "Roboto", weight: "400", style: "normal" }
);

// Bold = 700
registerFont(
  path.resolve(__dirname, "assets/Roboto-Bold.ttf"),
  { family: "Roboto", weight: "700", style: "normal" }
);

// ExtraBold = 800
registerFont(
  path.resolve(__dirname, "assets/Roboto-ExtraBold.ttf"),
  { family: "Roboto", weight: "800", style: "normal" }
);

// Initialize Firebase Admin
admin.initializeApp();
const storage = new Storage();
const BUCKET_NAME = "pvme-images";

// Load item metadata
const itemData = require("./data/sorted_items.json");
const itemMap = new Map(itemData.map(i => [i.label, i]));

// Draw an image at its natural size, centered in a slot (no scaling)
function drawCentered(ctx, img, x, y, slotW, slotH) {
  const offsetX = x + (slotW - img.width) / 2;
  const offsetY = y + (slotH - img.height) / 2;
  ctx.drawImage(img, offsetX, offsetY);
}

// Draw a sprite scaled down to fit within a slot, preserving aspect ratio
function drawFitted(ctx, img, x, y, slotW, slotH) {
  const scale = Math.min(slotW / img.width, slotH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const offsetX = x + (slotW - w) / 2;
  const offsetY = y + (slotH - h) / 2;
  ctx.drawImage(img, offsetX, offsetY, w, h);
};

// Helper: fetch and unpack preset from Firestore
async function getPresetData(presetId) {
  const doc = await admin
    .firestore()
    .collection("presets")
    .doc(presetId)
    .get();
  if (!doc.exists) throw new Error("Preset not found");
  const stored = doc.data();

  // map array of slots to item objects for inventory/equipment
  const mapSlots = (slots = []) =>
    slots.map(slot => {
      if (!slot || !slot.label) return null;
      const item = itemMap.get(slot.label) || itemMap.get("404item");
      if (slot.breakdownNotes) item.breakdownNotes = slot.breakdownNotes;
      return item;
    });

  return {
    presetName: stored.presetName,
    presetNotes: stored.presetNotes,

    // inventory / equipment unchanged
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

    // *directly* use your Firestore relics / familiars arrays, no itemMap lookup
    relics: {
      primary:     stored.relics?.primaryRelics      || [],
      alternative: stored.relics?.alternativeRelics  || []
    },
    familiars: {
      primary:     stored.familiars?.primaryFamiliars      || [],
      alternative: stored.familiars?.alternativeFamiliars  || []
    }
  };
}

// Helper: queue up loadImage tasks for a grid of slots
function queueSection(itemsArray, cols, slotW, slotH, startX, startY, gapX, gapY) {
  return itemsArray.map((it, i) => {
    if (!it || !it.image) return null;
    const x = startX + (i % cols) * (slotW + gapX);
    const y = startY + Math.floor(i / cols) * (slotH + gapY);
    return loadImage(it.image)
      .then(img => ({ img, x, y, w: slotW, h: slotH }))
      .catch(() => {
        // Fallback: only draw on labels if 404 fallback provided
        const fallback = itemMap.get("404item");
        return loadImage(fallback.image)
          .then(img => ({ img, x, y, w: slotW, h: slotH }))
          .catch(() => null);
      });
  }).filter(task => task !== null);
}

// --------- Function: Upload Preset JSON ---------
exports.uploadPreset = functions.https.onRequest(async (req, res) => {
  try {
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    const presetId = req.query.id;
    if (presetId) {
      await admin.firestore().collection('presets').doc(presetId).set(body);
      res.status(200).send(presetId);
    } else {
      const ref = await admin.firestore().collection('presets').add(body);
      res.status(200).send(ref.id);
    }
  } catch (err) {
    console.error('uploadPreset error:', err);
    res.status(500).send(err.message);
  }
});

// --------- Function: Serve OG Embed HTML ---------
exports.presetEmbed = functions.https.onRequest(async (req, res) => {
  try {
    const presetId = req.query.id;
    if (!presetId) {
      return res.status(400).send("Missing preset ID");
    }

    // Build URLs
    const imageUrl    = `https://storage.googleapis.com/${BUCKET_NAME}/images/${presetId}.png?cacheBust=${Date.now()}`;
    const redirectUrl = `https://pvme.io/preset-maker/#/${presetId}`;

    // Fetch preset metadata for title/description
    const doc  = await admin.firestore().collection('presets').doc(presetId).get();
    const data = doc.exists ? doc.data() : {};
    const desc = `Click to open the full preset in Preset Maker`;

    // **NEW**: load the image to get real dimensions
    const img = await loadImage(imageUrl);
    const width  = img.width;
    const height = img.height;

    // Build the OG HTML with dynamic width/height
    const html = `<!doctype html>
<html>
  <head>
    <meta property="og:title"         content="PVME Preset: ${data.presetName || presetId}" />
    <meta property="og:description"   content="${desc}" />
    <meta property="og:image"         content="${imageUrl}" />
    <meta property="og:image:width"   content="${width}" />
    <meta property="og:image:height"  content="${height}" />
    <meta property="og:url"           content="${redirectUrl}" />
    <meta property="og:type"          content="website" />
    <meta name="twitter:card"         content="summary_large_image" />
    <meta http-equiv="refresh"        content="0;url=${redirectUrl}" />
  </head>
  <body>
    <p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a></p>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control','public,max-age=3600');
    res.status(200).send(html);

  } catch (err) {
    console.error('presetEmbed error:', err);
    res.status(500).send(typeof err === 'string' ? err : err.message || err.toString());
  }
});

// --------- Function: Render & Cache Preset Image using node-canvas ---------
exports.renderPresetImage = functions.https.onRequest(async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).send("Missing preset ID");
    const debug = req.query.debug==='true';
    const preset = await getPresetData(id);

    // Filter out empty alternative slots (relics/familiars)
    const altRelics = (preset.relics.alternative || []).filter(s => s && (s.label || s.image));
    const altFam   = (preset.familiars.alternative || []).filter(s => s && (s.label || s.image));
    const hasAlt = altRelics.length > 0;

    // Load UI assets
    const [bgInventAndEquipment,bgMain,slotBg,relicIcon,famIcon] = await Promise.all([
      loadImage("https://img.pvme.io/images/O7VznNO.png"),
      loadImage("https://img.pvme.io/images/HSATCDr.png"),
      loadImage(path.resolve(__dirname,"assets/bg.png")),
      loadImage(path.resolve(__dirname,"assets/relic.png")),
      loadImage(path.resolve(__dirname,"assets/familiar.png"))
    ]);

    // Layout
    const gutter       = 15;
    const totalWidth   = 510 + (gutter*2);
    const headerHeight = 50;
    const bottomColWidth = (totalWidth - 3 * gutter) / 2;

    const inventory = {
      cols:7, rows:4, w:36, h:32,
      sx: gutter + 10,
      sy: headerHeight + 8,
      gx:7, gy:4
    };

    const equipment = {
      cols:4, rows:4, w:32, h:32,
      sx: 345,
      sy: headerHeight + 8,
      gx: 14, gy:6
    };

    const relics = {
      cols:1, rows:3, w: bottomColWidth, h:32,
      sx: gutter,
      sy: headerHeight + bgInventAndEquipment.height + gutter,
      gx:0, gy:10
    };
    const familiars = {
      cols:1, rows:1, w: bottomColWidth, h:32,
      sx: gutter + bottomColWidth + gutter,
      sy: relics.sy,
      gx:0, gy:10
    };

    // Setup fonts
    const fontTitle = '800 18px Roboto, Arial, sans-serif'
    const fontAlternativesHeading = '400 14px Roboto, Arial, sans-serif'
    const fontRelicsFamiliars = '700 14px Roboto, Arial, sans-serif'


    // calculate bottoms
    const invBottom = inventory.sy + inventory.h * inventory.rows + inventory.gy * (inventory.rows-1);
    const eqBottom  = equipment.sy + equipment.h * equipment.rows + equipment.gy * (equipment.rows-1);

    const relicsPrimBottom = relics.sy + relics.h * relics.rows + relics.gy * (relics.rows - 1);
    const relicsAltBottom  = altRelics.length
      ? relicsPrimBottom + 30 + gutter + altRelics.length * (relics.h + relics.gy)
      : relicsPrimBottom;

    const famPrimBottom = familiars.sy + familiars.h * familiars.rows + familiars.gy * (familiars.rows - 1);
    const famAltBottom  = altFam.length
      ? famPrimBottom + 30 + gutter + altFam.length * (familiars.h + familiars.gy)
      : famPrimBottom;

    // final canvas height
    const contentBottom = Math.max(invBottom, eqBottom, relicsAltBottom, famAltBottom);
    const canvas = createCanvas(totalWidth, contentBottom + gutter);
    const ctx    = canvas.getContext('2d');

    // rpeat the main background down the full canvas
    const bgH = bgMain.height;
    for (let y = 0; y < canvas.height; y += bgH) {
      ctx.drawImage(bgMain, 0, y);
    }

    // draw the preset overlay under the header
    ctx.drawImage(
      bgInventAndEquipment,
      gutter,
      headerHeight,
      bgInventAndEquipment.width,
      bgInventAndEquipment.height
    );

    // Draw the preset title, centered in the header area
    ctx.font       = fontTitle;
    ctx.fillStyle  = 'white';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(preset.presetName, totalWidth/2, headerHeight/2);

    ctx.textAlign  = 'left';
    ctx.textBaseline = 'alphabetic';

    // Inventory sprites
    const inv = queueSection(preset.inventorySlots,inventory.cols,inventory.w,inventory.h,inventory.sx,inventory.sy,inventory.gx,inventory.gy);
    (await Promise.all(inv)).forEach(({img,x,y,w,h})=>drawCentered(ctx,img,x,y,w,h));

    // Equipment
    const eq=queueSection(preset.equipmentSlots,equipment.cols,equipment.w,equipment.h,equipment.sx,equipment.sy,equipment.gx,equipment.gy);
    (await Promise.all(eq)).forEach(({img,x,y,w,h})=>{ctx.drawImage(slotBg,x,y,w,h);drawCentered(ctx,img,x,y,w,h)});

    // Hide headings
    // ctx.font='800 18px Roboto, Arial, sans-serif';
    // ctx.fillStyle="white";
    // ctx.textAlign="left";

    // const rx=relics.sx+100, ry=relics.sy-20;
    // ctx.drawImage(relicIcon,rx,ry-17,25,25);
    // ctx.fillText("Relics",rx+32,ry);

    // const fx=familiars.sx+30, fy=familiars.sy - 20;
    // ctx.drawImage(famIcon, fx, fy - 17, 25, 25);
    // ctx.fillText("Familiar", fx + 32, fy);

    // Relics sprites using queueSection like inventory
    const relicTasks = queueSection(
      preset.relics.primary,
      1, relics.w, relics.h,
      relics.sx, relics.sy,
      relics.gx, relics.gy
    );
    (await Promise.all(relicTasks)).forEach(({ img, x, y, w, h }) => {
      ctx.strokeStyle = '#485968'; ctx.lineWidth = 0.75;
      ctx.strokeRect(x, y, w, h);
      drawFitted(ctx, img, x + 4, y + 4, 24, 24);
      const slot = preset.relics.primary[ (y - relics.sy) / (relics.h + relics.gy) ];
      ctx.fillStyle = 'white'; ctx.font = fontRelicsFamiliars;
      ctx.fillText(slot.name || slot.label, x + 36, y + h/2 + 5);
    });
    // Alternative relics
    if (altRelics.length) {
      const altY = relicsPrimBottom + 37;
      const altX = gutter + (bottomColWidth / 2);
      ctx.textAlign  = 'center';
      ctx.font = fontAlternativesHeading; ctx.fillStyle = 'white';
      ctx.fillText('Alternatives', altX, altY);
      ctx.textAlign  = 'left';
      const altTasks = queueSection(
        altRelics,
        1, relics.w, relics.h,
        relics.sx, altY + 15,
        relics.gx, relics.gy
      );
      (await Promise.all(altTasks)).forEach(({ img, x, y, w, h }, i) => {
        ctx.strokeStyle = '#485968'; ctx.lineWidth = 0.75;
        ctx.strokeRect(x, y, w, h);
        drawFitted(ctx, img, x + 4, y + 4, 24, 24);
        const slot = altRelics[i];
        ctx.fillStyle = 'white'; ctx.font = fontRelicsFamiliars;
        ctx.fillText(slot.name || slot.label, x + 36, y + h/2 + 5);
      });
    }

    // Familiars using queueSection
    const famTasks = queueSection(
      preset.familiars.primary,
      1, familiars.w, familiars.h,
      familiars.sx, familiars.sy,
      familiars.gx, familiars.gy
    );
    (await Promise.all(famTasks)).forEach(({ img, x, y, w, h }) => {
      ctx.strokeStyle = '#485968'; ctx.lineWidth = 0.75;
      ctx.strokeRect(x, y, w, h);
      drawFitted(ctx, img, x + 4, y + 4, 24, 24);
      const slot = preset.familiars.primary[0];
      ctx.fillStyle = 'white'; ctx.font = fontRelicsFamiliars;
      ctx.fillText(slot.name || slot.label, x + 36, y + h/2 + 5);
    });
    // Alternative familiar
    if (altFam.length) {
      const altFY = famPrimBottom + 37;
      const altFX = (gutter * 2) + bottomColWidth + (bottomColWidth / 2)
      ctx.textAlign  = 'center';
      ctx.font = fontAlternativesHeading; ctx.fillStyle = 'white';
      ctx.fillText('Alternatives', altFX, altFY);
      ctx.textAlign  = 'left';
      const famAltTasks = queueSection(
        altFam,
        1, familiars.w, familiars.h,
        familiars.sx, altFY + 15,
        familiars.gx, familiars.gy
      );
      (await Promise.all(famAltTasks)).forEach(({ img, x, y, w, h }, i) => {
        ctx.strokeStyle = '#485968'; ctx.lineWidth = 0.75;
        ctx.strokeRect(x, y, w, h);
        drawFitted(ctx, img, x + 4, y + 4, 24, 24);
        const slot = altFam[i];
        ctx.fillStyle = 'white'; ctx.font = fontRelicsFamiliars;
        ctx.fillText(slot.name || slot.label, x + 36, y + h/2 + 5);
      });
    }

    // Debug

    if(debug){ctx.strokeStyle='red';ctx.lineWidth=2;
      preset.inventorySlots.forEach((_,i)=>{const x=inventory.sx+(i%inventory.cols)*(inventory.w+inventory.gx);const y=inventory.sy+Math.floor(i/inventory.cols)*(inventory.h+inventory.gy);ctx.strokeRect(x,y,inventory.w,inventory.h);});
      preset.equipmentSlots.forEach((_,i)=>{const x=equipment.sx+(i%equipment.cols)*(equipment.w+equipment.gx);const y=equipment.sy+Math.floor(i/equipment.cols)*(equipment.h+equipment.gy);ctx.strokeRect(x,y,equipment.w,equipment.h);});
      for(let r=0;r<relics.rows;r++){ctx.strokeRect(relics.sx,relics.sy+r*(relics.h+relics.gy),relics.w,relics.h);}      if(altRelics.length){const ay=relics.sy+relics.rows*(relics.h+relics.gy)+gutter+24;ctx.strokeRect(relics.sx,ay,relics.w,relics.h);}      ctx.strokeRect(familiars.sx,familiars.sy,familiars.w,familiars.h);
    }

    // Save & respond
    const buf=canvas.toBuffer('image/png');
    const file=storage.bucket(BUCKET_NAME).file(`images/${id}.png`);
    await file.save(buf,{contentType:'image/png',metadata:{cacheControl:'public,max-age=0,no-cache'}});
    res.redirect(`https://storage.googleapis.com/${BUCKET_NAME}/images/${id}.png?cacheBust=${Date.now()}`);

  } catch(err) {
    console.error('renderPresetImage error:',err);
    res.status(500).send(err.message);
  }
});
