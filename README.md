# PVME Preset Server

A set of Firebase Cloud Functions to store, render, and embed **presets** for PVME. These functions allow you to:

* **Upload** preset data (JSON) into Firestore DB
* **Render Image** and save a composite PNG of a preset using node-canvas
* **Serve** an OG-embed-ready endpoint which redirects back to Preset Maker

---

## Features

* **Upload**: Save or update preset data into Firestore via an HTTP request.
* **Render Image**: Dynamically compose inventory, equipment, relics, and familiar sprites onto a single canvas, save to GCS, and return a public URL.
* **OG Embed**: Serve a minimal HTML page with dynamic Open Graph meta tags (including true image dimensions) and redirect to the PVME client.

---

## Prerequisites

* Node.js v14+ (or compatible LTS)
* Firebase CLI (`npm install -g firebase-tools`)
* A Firebase project with Firestore and Cloud Functions enabled
* A Google Cloud Storage bucket (configured for public read access)

---

## Project Structure

```text
pvme-embed-function/
├── functions/                # Cloud Functions source
│   ├── assets/               # Font files & slot background
│   ├── data/                 # JSON metadata (`sorted_items.json`)
│   ├── index.js              # Entry point (all functions)
│   ├── package.json          # Dependencies for functions
│   └── firebase-debug.log    # (ignored) debug logs
├── .firebaserc               # Firebase project aliases
├── firebase.json             # Firebase hosting & functions config
└── README.md                 # (this file)
```

---

## Installation & Deployment

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/pvme-embed-function.git
   cd pvme-embed-function/functions
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   ```bash
   firebase use --add               # choose your project
   ```

4. **Deploy functions**

   ```bash
   firebase deploy --only functions
   ```

After deployment, you’ll see three HTTPS URLs in your console output:

* `uploadPreset` → save/update preset JSON
* `presetEmbed` → OG embed + redirect
* `renderPresetImage` → dynamic PNG render

---

## Testing Locally

You can run and test each function on your local machine using the Firebase Emulator Suite:

1. **Install Emulator** (if not already):

   ```bash
   npm install -g firebase-tools
   firebase setup:emulators:firestore
   firebase setup:emulators:functions
   ```

2. **Start Emulators**:

   ```bash
   firebase emulators:start --only firestore,functions
   ```

3. **Invoke Endpoints**:

   * **uploadPreset**:

     ```bash
     curl -X POST "http://localhost:5001/<PROJECT>/us-central1/uploadPreset?id=test123" \
          -H "Content-Type: application/json" \
          -d '{ "presetName": "Test", "inventorySlots": [] }'
     ```
   * **presetEmbed**:

     ```bash
     open "http://localhost:5001/<PROJECT>/us-central1/presetEmbed?id=test123"
     ```
   * **renderPresetImage**:

     ```bash
     open "http://localhost:5001/<PROJECT>/us-central1/renderPresetImage?id=test123"
     ```

Emulator logs will appear in your terminal, and Firestore data is stored locally under `./firebase-debug.log`.

---

## Available Functions

### uploadPreset

```http
POST https://<REGION>-<PROJECT>.cloudfunctions.net/uploadPreset?id={optionalPresetId}
Content-Type: application/json

{ /* preset JSON body */ }
```

* If `?id=` is provided, calls `presets/{id}.set(...)`
* Otherwise creates a new document and returns its auto-generated ID
* **Response:** HTTP 200 with preset ID, or HTTP 500 on error

### presetEmbed

```http
GET https://<REGION>-<PROJECT>.cloudfunctions.net/presetEmbed?id={presetId}
```

* Reads Firestore for metadata (name/description)
* Loads the cached PNG from GCS to determine its true `width`/`height`
* Serves an HTML page with Open Graph meta tags:

  * `og:image`, `og:image:width`, `og:image:height`, `og:title`, `og:description`
* Includes a `<meta http-equiv="refresh">` to redirect immediately to your front-end
* **Response:** HTML (cacheable for 1 hour)

### renderPresetImage

```http
GET https://<REGION>-<PROJECT>.cloudfunctions.net/renderPresetImage?id={presetId}[&debug=true]
```

* Fetches preset data from Firestore
* Loads UI assets + item/familiar/relic sprites
* Lays out a canvas with inventory, equipment, relics, familiar slots
* Renders text labels and optional debug outlines
* Saves the PNG to `gs://{BUCKET_NAME}/images/{presetId}.png`
* Redirects the caller to the public GCS URL of the generated image
* **Response:** HTTP 302 redirect → `https://storage.googleapis.com/...` or HTTP 500 on error

---

## Helper Modules

* **Font registration** (`canvas.registerFont`) for Roboto at weights 400, 700, 800
* **Image drawing**:

  * `drawCentered(ctx, img, x, y, slotW, slotH)`
  * `drawFitted(ctx, img, x, y, slotW, slotH)`
* **Data loader**: `getPresetData(presetId)` fetches Firestore docs and remaps slot arrays
* **Batch loader**: `queueSection(...)` returns promises to `loadImage()` + target coordinates

---

## Folder Layout

```text
functions/
├── assets/
│   ├── Roboto-Medium.ttf
│   ├── Roboto-Bold.ttf
│   └── Roboto-ExtraBold.ttf
├── data/
│   └── sorted_items.json
├── index.js
├── package.json
└── package-lock.json
```

* **assets/**: custom fonts & local slot background image
* **data/**: your `sorted_items.json` mapping labels to image URLs and metadata
* **index.js**: main implementation of all three HTTP Cloud Functions

---

## License

This project is released under the [MIT License](LICENSE).
