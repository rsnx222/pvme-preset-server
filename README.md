# PVME Preset Server

A set of Firebase Cloud Functions to store, render, and embed **presets** for PVME. These functions use a GitHub repo as the JSON store (`https://github.com/rsnx222/pvme-preset-store`), and render images via node-canvas and Google Cloud Storage.

---

## 1. About This Repo

### Features

- **Upload**: Save or update preset data (JSON) to GitHub via HTTP
- **Render Image**: Compose a canvas of items, relics, familiars, and save to GCS
- **OG Embed**: Serve dynamic Open Graph tags + redirect to front-end
- **GitHub Webhook**: Automatically regenerate PNG whenever a `presets/*.json` file changes in the repo

### Project Structure

```text
pvme-preset-server/
├── functions/
│   ├── assets/               # Fonts & local images (.png, .ttf)
│   ├── data/                 # JSON metadata (`sorted_items.json`)
│   ├── config.js             # Shared constants (bucket, URLs)
│   ├── lib/                  # Canvas & GitHub helper modules
│   ├── handlers/             # One file per function
│   ├── index.js              # Entry point (exports)
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
- A Firebase project with Cloud Functions and Cloud Storage enabled
- Java 11+ installed for emulators
- A **GitHub personal access token** in `GITHUB_TOKEN` env var
- `GITHUB_OWNER`, `GITHUB_REPO` (just the repo name), and `GITHUB_BRANCH` set in `.env.development`

### Emulator Configuration

```jsonc
// firebase.json
{
  "functions": { "source": "functions" },
  "emulators": {
    "functions":  { "port": 5001 },
    "storage":    { "port": 9199, "host": "127.0.0.1" }
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

4. **GitHub Webhook**
   - Push changes to `presets/*.json` in your GitHub repo
   - The `onPresetWrite` HTTP handler handles `push` events, re-renders and uploads the image

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
- `onPresetWrite` (webhook endpoint)

---

### Available Functions

#### uploadPreset

```http
POST https://<REGION>-<PROJECT_ID>.cloudfunctions.net/uploadPreset?id={optionalPresetId}
Content-Type: application/json

{ /* preset JSON */ }
```

Creates or updates `presets/{id}.json` in the GitHub repo. Responds with 200 and the image URL.

#### presetEmbed

```http
GET https://<REGION>-<PROJECT_ID>.cloudfunctions.net/presetEmbed?id={presetId}
```

Reads JSON from GitHub, builds OG meta tags + HTML redirect to front-end, and returns that HTML.

#### renderPresetImage

```http
GET https://<REGION>-<PROJECT_ID>.cloudfunctions.net/renderPresetImage?id={presetId}[&debug=true]
```

Reads JSON from GitHub, re-renders the canvas image, uploads to GCS, and returns `{ imageUrl }` in JSON.

#### onPresetWrite (Webhook)

```js
// GitHub webhook configured on the repo's Settings -> Webhooks
POST /onPresetWrite
Headers: X-Hub-Signature-256, X-GitHub-Event: push
Body: GitHub push payload
```

Processes added/modified/deleted `presets/*.json`, rendering or deleting images accordingly.

---

## License

Released under the [MIT License](LICENSE).
