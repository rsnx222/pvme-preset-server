# PVME Preset Server

A set of Firebase Cloud Functions to store, render, and embed **presets** for PVME. These functions allow you to:

- **Upload** preset data (JSON) into Firestore
- **Render Image** of a preset using node-canvas, saved to Cloud Storage
- **Embed** via an OG-HTML endpoint that redirects to the PVME front-end
- **Pre-render** images on every Firestore write

---

## Features

- **Upload**: Save or update preset data into Firestore via HTTP
- **Render Image**: Compose a canvas of items, relics, familiars, and save to GCS
- **OG Embed**: Serve dynamic Open Graph tags (with actual image dimensions) + redirect
- **On-Write Trigger**: Automatically regenerate PNG whenever a preset document changes

---

## Prerequisites

- Node.js v14+ (or compatible LTS)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore, Cloud Functions, and Cloud Storage enabled
- A publicly-readable GCS bucket for images

Additionally, you will need the following to test locally:
- **Java 11+** JRE or JDK on your PATH (required by the Firestore emulator)

---

## Project Structure

```text
pvme-preset-server/
├── functions/
│   ├── assets/               # Fonts & local images (.png, .ttf)
│   ├── data/                 # JSON metadata (`sorted_items.json`)
│   ├── config.js             # Shared constants (bucket, collection, URLs)
│   ├── lib/                  # Canvas & Firestore helper modules
│   ├── handlers/             # One file per function
│   ├── index.js              # Entry point (Admin init + exports)
│   └── package.json          # Dependencies, scripts
├── firebase.json             # Emulator & functions config
├── .firebaserc               # Project aliases
└── README.md                 # (this file)
```

---

## Installation & Deployment

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-org/pvme-preset-server.git
   cd pvme-preset-server/functions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Select your Firebase project**
   ```bash
   firebase use --add
   ```

4. **Deploy functions**
   ```bash
   firebase deploy --only functions
   ```

You will see URLs for:

- `uploadPreset`
- `presetEmbed`
- `renderPresetImage`

(And the `onPresetWrite` Firestore trigger runs automatically on writes.)

---

## Testing Locally

1. **Verify Java**
   ```bash
   java -version
   ```
      Should report Java 11+.

2. **Start emulators**
   ```bash
   firebase emulators:start --only functions,firestore
   ```

3. **Invoke endpoints**

   - **uploadPreset**
     ```bash
     curl -X POST "http://localhost:5001/<PROJECT>/us-central1/uploadPreset?id=test123"        -H "Content-Type: application/json"        -d '{"presetName":"Test","inventorySlots":[]}'
     ```
   - **presetEmbed**
     ```bash
     open "http://localhost:5001/<PROJECT>/us-central1/presetEmbed?id=test123"
     ```
   - **renderPresetImage**
     ```bash
     open "http://localhost:5001/<PROJECT>/us-central1/renderPresetImage?id=test123"
     ```

The `onPresetWrite` trigger will fire whenever you add/update a document under `presets/{presetId}` in the Firestore emulator.

---

## Available Functions

### uploadPreset

```http
POST https://<REGION>-<PROJECT>.cloudfunctions.net/uploadPreset?id={optionalPresetId}
Content-Type: application/json

{ /* preset JSON */ }
```
- Creates or updates `presets/{id}`.
- Responds `200` with the preset ID.

### presetEmbed

```http
GET https://<REGION>-<PROJECT>.cloudfunctions.net/presetEmbed?id={presetId}
```
- Reads Firestore metadata.
- Determines true image dimensions.
- Returns an HTML page with OG tags and an immediate redirect.
- **Cache-Control:** public, max-age=3600

### renderPresetImage

```http
GET https://<REGION>-<PROJECT>.cloudfunctions.net/renderPresetImage?id={presetId}[&debug=true]
```
- Checks GCS for an existing PNG → redirects if found.
- If missing, verifies Firestore doc → 404 if not found.
- Otherwise, renders via node-canvas, saves to GCS, then redirects.
- Responds `302` to the public GCS URL.

### onPresetWrite

```js
// Firestore trigger:
onDocumentWritten({ document: 'presets/{presetId}' }, onPresetWriteHandler)
```
- Automatically calls rendering logic on every write to `presets/{presetId}`.
- Ensures every edit immediately updates the stored PNG.

---

## Helper Modules

- **config.js** — Central constants (`BUCKET_NAME`, collection name, client URL)
- **lib/firestore.js** — `getPresetData(presetId)` → Firestore lookup + item mapping
- **lib/canvas.js**
  - `drawCentered(ctx, img, x, y, slotW, slotH)`
  - `drawFitted(ctx, img, x, y, slotW, slotH)`
  - `queueSection(...)` for batching `loadImage()` tasks
  - **handlers/** — Plain functions (`uploadPresetHandler`, etc.)

---

## Emulator Configuration

```jsonc
// firebase.json
{
  "functions": { "source": "functions" },
  "emulators": {
    "functions": { "port": 5001 },
    "firestore":  { "port": 8080 }
  }
}
```

---

## License

Released under the [MIT License](LICENSE).
