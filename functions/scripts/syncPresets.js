// scripts/syncPresets.js
const admin = require('firebase-admin');
const path = require('path');

// === Load Credentials ===
const serviceAccount = require(path.resolve(__dirname, '../../prod-sa.json'));

// === Init Prod App ===
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
}, 'prodApp');

const prodDb = prodApp.firestore();

// === Init Emulator Target ===
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const localApp = admin.initializeApp({
  projectId: serviceAccount.project_id
}, 'localApp');

const localDb = localApp.firestore();

async function syncPresetsCollection() {
  console.log('✅ Connected to:', serviceAccount.project_id);
  console.log('📦 Firestore emulator host:', process.env.FIRESTORE_EMULATOR_HOST);

  const collectionName = 'presets';
  console.log(`📁 Fetching documents from collection: "${collectionName}"`);

  const snap = await prodDb.collection(collectionName).get();

  if (snap.empty) {
    console.warn(`⚠️  No documents found in "${collectionName}"`);
    return;
  }

  const batch = localDb.batch();
  snap.forEach(doc => {
    console.log(`📄 Copying doc: ${doc.id}`);
    batch.set(localDb.collection(collectionName).doc(doc.id), doc.data());
  });

  await batch.commit();
  console.log(`✅ Copied ${snap.size} documents to local emulator`);
}

syncPresetsCollection().catch(err => {
  console.error('❌ Sync error:', err.message);
  process.exit(1);
});
