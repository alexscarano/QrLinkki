/**
 * Pequeno utilitário para gerar PNGs de ícone e splash a partir de SVGs usando o sharp.
 *
 * Uso:
 *   npm install sharp --save-dev
 *   node scripts/generate-icons.js
 *
 * Gera/atualiza `assets/images/icon.png` (1024x1024) e
 * `assets/images/splash-icon.png` (2732x2732) a partir de `assets/images/qr-icon.svg`
 * e `assets/images/qr-splash.svg` (se não existir, usa qr-icon.svg como fallback).
 */

const path = require('path');
const fs = require('fs');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp is required. Run: npm install sharp --save-dev');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'assets', 'images');
const srcIcon = path.join(assetsDir, 'qr-icon.svg');
const srcSplash = path.join(assetsDir, 'qr-splash.svg');
const outIcon = path.join(assetsDir, 'icon.png');
const outSplash = path.join(assetsDir, 'splash-icon.png');

async function render() {
  if (!fs.existsSync(srcIcon)) {
    console.error('Missing', srcIcon);
    process.exit(1);
  }

  // ícone 1024x1024
  await sharp(srcIcon).resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(outIcon);
  console.log('Wrote', outIcon);

  // splash grande quadrado (mantenha grande; o Expo redimensiona). Use srcSplash se existir.
  const splashSrc = fs.existsSync(srcSplash) ? srcSplash : srcIcon;
  await sharp(splashSrc).resize(2732, 2732, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(outSplash);
  console.log('Wrote', outSplash);
}

render().catch((err) => {
  console.error(err);
  process.exit(1);
});
