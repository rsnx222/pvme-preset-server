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

  // 2) Start the emulators (functions + storage only)
  console.log('🏃 Starting Firebase emulators (functions, storage)...');
  const emu = spawn(
    'firebase',
    ['emulators:start', '--only', 'functions,storage'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  // 3) Clean up on Ctrl+C
  process.on('SIGINT', () => {
    emu.kill('SIGINT');
    process.exit();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
