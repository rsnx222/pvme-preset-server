# PVME Preset Server

A set of Firebase Cloud Functions to store, render, and embed **presets** for PVME. These functions allow you to:

- **Upload** preset data (JSON) into Firestore
- **Render Image** of a preset using node-canvas, saved to Cloud Storage
- **Embed** via an OG-HTML endpoint that redirects to the PVME front-end
- **Pre-render** images on every Firestore write

---

## 1. About This Repo

### Features

- **Upload**: Save or update preset data into Firestore via HTTP
- **Render Image**: Compose a canvas of items, relics, familiars, and save to GCS
- **OG Embed**: Serve dynamic Open Graph tags (with actual image dimensions) + redirect
- **On-Write Trigger**: Automatically regenerate PNG whenever a preset document changes

### Project Structure

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
├── start-dev.js              # Local development startup
└── README.md                 # (this file)
```

---

## 2. How to Develop & Test Locally

### Prerequisites

- Node.js v14+ (or compatible LTS)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore, Cloud Functions, and Cloud Storage enabled
- Java 11+ installed and in your system PATH (for Firestore emulator)

### Emulator Configuration

```jsonc
// firebase.json
{
  "functions": { "source": "functions" },
  "emulators": {
    "functions":  { "port": 5001 },
    "firestore":  { "port": 8080 },
    "storage":    { "port": 9199 }
  }
}
```

### Local Usage

1. **Install dependencies**
   ```bash
   cd functions
   npm install
   ```

2. **Start emulators**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Invoke endpoints**

   - `uploadPreset`  
     ```bash
     curl -X POST "http://localhost:5001/<PROJECT_ID>/us-central1/uploadPreset?id=test123" \
          -H "Content-Type: application/json" \
          -d '{"presetName":"Test","inventorySlots":[]}'
     ```

   - `presetEmbed`  
     ```bash
     open "http://localhost:5001/<PROJECT_ID>/us-central1/presetEmbed?id=test123"
     ```

   - `renderPresetImage`  
     ```bash
     open "http://localhost:5001/<PROJECT_ID>/us-central1/renderPresetImage?id=test123"
     ```

4. Firestore writes to `presets/{presetId}` will automatically trigger the `onPresetWrite` function.

### Sync Production Firestore → Local Emulator

#### Prerequisites

- `gcloud` CLI authenticated
- Service account with Firestore access
- Firestore emulator running
- `prod-sa.json` key (keep this in `.gitignore`)

#### 1. Create the key

```bash
gcloud iam service-accounts keys create prod-sa.json \
  --iam-account=firestore-sync@<PROJECT_ID>.iam.gserviceaccount.com
```

#### 2. Start emulator

```bash
firebase emulators:start --only firestore
```

#### 3. Run sync script

```bash
node scripts/syncPresets.js
```

Should output:

```text
Copied 42 docs from "presets"
```

---

## 3. Live Usage & Deployment

### Deploy Functions

```bash
firebase deploy --only functions
```

You will see URLs for:

- `uploadPreset`
- `presetEmbed`
- `renderPresetImage`

The `onPresetWrite` Firestore trigger runs automatically when any document is created/updated in `presets/`.

---

### Available Functions

#### uploadPreset

```http
POST https://<REGION>-<PROJECT_ID>.cloudfunctions.net/uploadPreset?id={optionalPresetId}
Content-Type: application/json

{ /* preset JSON */ }
```

Creates or updates `presets/{id}`. Responds with 200 and the ID.

#### presetEmbed

```http
GET https://<REGION>-<PROJECT_ID>.cloudfunctions.net/presetEmbed?id={presetId}
```

Reads Firestore and image metadata, then returns an HTML page with Open Graph tags + immediate redirect.  
**Cache-Control:** public, max-age=3600

#### renderPresetImage

```http
GET https://<REGION>-<PROJECT_ID>.cloudfunctions.net/renderPresetImage?id={presetId}[&debug=true]
```

- Redirects to existing image if found
- Otherwise renders canvas and uploads PNG to GCS
- Always returns a 302 to the public PNG URL

#### onPresetWrite (Trigger)

```js
onDocumentWritten({ document: 'presets/{presetId}' }, onPresetWriteHandler)
```

Automatically re-renders the preset PNG when the preset data changes in Firestore.

---

### Helper Modules

- **config.js** — Central constants (`BUCKET_NAME`, collection name, client URL)
- **lib/firestore.js** — `getPresetData(presetId)` → Firestore lookup + item mapping
- **lib/canvas.js**
  - `drawCentered(ctx, img, x, y, slotW, slotH)`
  - `drawFitted(ctx, img, x, y, slotW, slotH)`
  - `queueSection(...)` for batching `loadImage()` tasks

---

### Usage vs Free-Tier Limits

| Resource            | Free-Tier Limit                                   | Expected Usage                            | Calculation                                                                                                         |
|---------------------|---------------------------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **Cloud Functions** | 2,000,000 invocations/month<br>400,000 GB-s/month | ~12,000 invocations<br>~300 GB-s/month     | 1,000 uploads + 10,000 embeds + 1,000 renders = 12,000 × 0.05s × 0.5 GB = 300 GB-s                                  |
| **Firestore**       | 50,000 reads/day<br>20,000 writes/day             | ~2,000 reads/day<br>~1,000 writes/day      | 1,000 edits × 2 reads/edit = 2,000 reads/day<br>1,000 writes = 1,000 writes/day                                    |
| **Cloud Storage**   | 5 GiB storage<br>100 GiB egress/month             | ~0.5 GiB storage<br>~2 GiB egress/month    | 5,000 PNGs × 0.1 MiB = 500 MiB<br>20,000 views × 0.1 MiB = 2,000 MiB (2 GiB)                                       |

---

## License

Released under the [MIT License](LICENSE).
