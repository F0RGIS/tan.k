// Renders the app icons (PNG) from the game's own sprite code using headless Chromium.
// Usage: node tools/make-icons.js   (needs the `playwright` package)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const www = path.join(__dirname, '..', 'www');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');
  for (const f of ['font.js', 'sprites.js']) await page.addScriptTag({ path: path.join(www, 'js', f) });
  const out = await page.evaluate(() => {
    function icon(size, maskable) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = maskable ? '#000' : '#737373'; g.fillRect(0, 0, size, size);
      const pad = maskable ? size * 0.2 : size * 0.06;
      g.fillStyle = '#000'; g.fillRect(pad, pad, size - 2 * pad, size - 2 * pad);
      const s = Math.floor((size - 2 * pad) / 20);
      const t = Sprites.tank('p1', 'yellow', 0, 0);
      g.drawImage(t, (size - 16 * s) / 2, (size - 16 * s) / 2 - s, 16 * s, 16 * s);
      return c.toDataURL('image/png').split(',')[1];
    }
    return { a: icon(192, false), b: icon(512, false), c: icon(512, true), d: icon(1024, false) };
  });
  const dir = path.join(www, 'icons');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'icon-192.png'), Buffer.from(out.a, 'base64'));
  fs.writeFileSync(path.join(dir, 'icon-512.png'), Buffer.from(out.b, 'base64'));
  fs.writeFileSync(path.join(dir, 'icon-maskable-512.png'), Buffer.from(out.c, 'base64'));
  // Source icon for Windows (electron-builder) and Android (@capacitor/assets).
  const assets = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, 'icon-only.png'), Buffer.from(out.d, 'base64'));
  await browser.close();
  console.log('icons written to', dir);
})();
