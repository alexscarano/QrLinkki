const path = require('path');
const fs = require('fs');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp is required. Run: npm install sharp --save-dev');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'Splash-4096x4096.png');
const out = path.join(root, 'assets', 'splash-2732.png');

(async () => {
  if (!fs.existsSync(src)) {
    console.error('Source splash not found:', src);
    process.exit(1);
  }
  try {
    await sharp(src)
      .resize(2732, 2732, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(out);
    console.log('Wrote', out);
  } catch (err) {
    console.error('Failed to resize splash:', err);
    process.exit(1);
  }
})();
