// start-dev.js (at project root)

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  // 1) Ensure the local “bucket” directory exists
  const imagesDir = path.join(
    '.firebase',
    'emulator',
    'storage',
    'pvme-images',
    'images'
  );
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`✅ Ensured emulator storage path: ${imagesDir}`);

  // 2) Start the emulators
  console.log('🏃 Starting Firebase emulators (functions, firestore, storage)...');
  const emu = spawn(
    'firebase',
    ['emulators:start', '--only', 'functions,firestore,storage'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  // 3) Wait a few seconds for Firestore to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 4) Sync live presets into the Firestore emulator
  console.log('🔄 Syncing presets into Firestore emulator...');
  const sync = spawn(
    'node',
    ['functions/scripts/syncPresets.js'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  sync.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Presets sync complete — your local dev stack is ready!');
    } else {
      console.error(`❌ syncPresets exited with code ${code}`);
    }
  });

  // 5) Clean up on Ctrl+C
  process.on('SIGINT', () => {
    emu.kill('SIGINT');
    process.exit();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
