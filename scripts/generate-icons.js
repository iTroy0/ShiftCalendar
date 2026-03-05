const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// App colors
const BG = '#0F0F0F';
const SURFACE = '#1A1A2E';
const MORNING = '#F59E0B';   // amber
const AFTERNOON = '#3B82F6'; // blue
const NIGHT = '#8B5CF6';     // purple
const OFF = '#6B7280';       // gray
const GRID = '#333348';
const HEADER_BG = '#6366F1'; // indigo / primary

function drawCalendarIcon(ctx, size, padding) {
  const s = size;
  const p = padding;
  const w = s - p * 2;
  const cornerR = w * 0.14;

  // Calendar body
  const bodyTop = p + w * 0.18;
  const bodyH = w - w * 0.18;
  roundRect(ctx, p, bodyTop, w, bodyH, cornerR, BG);

  // Calendar header bar
  const headerH = w * 0.22;
  roundRectTop(ctx, p, bodyTop, w, headerH, cornerR, HEADER_BG);

  // Two hanging tabs
  const tabW = w * 0.06;
  const tabH = w * 0.12;
  const tabR = tabW / 2;
  const tab1X = p + w * 0.28;
  const tab2X = p + w * 0.72 - tabW;
  const tabY = bodyTop - tabH * 0.45;
  roundRect(ctx, tab1X, tabY, tabW, tabH, tabR, '#E0E0E0');
  roundRect(ctx, tab2X, tabY, tabW, tabH, tabR, '#E0E0E0');

  // Grid area
  const gridTop = bodyTop + headerH + w * 0.06;
  const gridLeft = p + w * 0.1;
  const gridW = w * 0.8;
  const gridH = w * 0.48;
  const cols = 4;
  const rows = 3;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const dotR = Math.min(cellW, cellH) * 0.28;

  // Shift dot colors for a 4x3 grid
  const dots = [
    [MORNING, AFTERNOON, NIGHT, OFF],
    [MORNING, MORNING, AFTERNOON, NIGHT],
    [OFF, NIGHT, AFTERNOON, MORNING],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = gridLeft + c * cellW + cellW / 2;
      const cy = gridTop + r * cellH + cellH / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = dots[r][c];
      ctx.fill();
    }
  }
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRectTop(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// --- Generate all icon sizes ---

// 1) icon.png – 1024x1024 main icon
function generateMainIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  roundRect(ctx, 0, 0, size, size, size * 0.2, BG);

  drawCalendarIcon(ctx, size, size * 0.15);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'icon.png'), buf);
  console.log('  icon.png (1024x1024)');
}

// 2) Android adaptive icon – foreground (with safe zone padding)
function generateAdaptiveForeground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background – only foreground content
  drawCalendarIcon(ctx, size, size * 0.22);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'android-icon-foreground.png'), buf);
  console.log('  android-icon-foreground.png (1024x1024)');
}

// 3) Android adaptive icon – background (solid dark)
function generateAdaptiveBackground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'android-icon-background.png'), buf);
  console.log('  android-icon-background.png (1024x1024)');
}

// 4) Monochrome icon (white on transparent)
function generateMonochrome() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw same calendar but all white
  const p = size * 0.22;
  const w = size - p * 2;
  const cornerR = w * 0.14;
  const bodyTop = p + w * 0.18;
  const bodyH = w - w * 0.18;

  roundRect(ctx, p, bodyTop, w, bodyH, cornerR, '#FFFFFF');
  roundRectTop(ctx, p, bodyTop, w, w * 0.22, cornerR, '#FFFFFF');

  // Tabs
  const tabW = w * 0.06;
  const tabH = w * 0.12;
  const tabR = tabW / 2;
  roundRect(ctx, p + w * 0.28, bodyTop - tabH * 0.45, tabW, tabH, tabR, '#FFFFFF');
  roundRect(ctx, p + w * 0.72 - tabW, bodyTop - tabH * 0.45, tabW, tabH, tabR, '#FFFFFF');

  // Grid dots
  const gridTop = bodyTop + w * 0.22 + w * 0.06;
  const gridLeft = p + w * 0.1;
  const gridW = w * 0.8;
  const gridH = w * 0.48;
  const cellW = gridW / 4;
  const cellH = gridH / 3;
  const dotR = Math.min(cellW, cellH) * 0.28;

  // Cut out circles from the white body (make them transparent)
  ctx.globalCompositeOperation = 'destination-out';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const cx = gridLeft + c * cellW + cellW / 2;
      const cy = gridTop + r * cellH + cellH / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    }
  }

  // Re-draw dots as white circles (smaller, so they appear as rings)
  ctx.globalCompositeOperation = 'source-over';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const cx = gridLeft + c * cellW + cellW / 2;
      const cy = gridTop + r * cellH + cellH / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'android-icon-monochrome.png'), buf);
  console.log('  android-icon-monochrome.png (1024x1024)');
}

// 5) Splash icon
function generateSplashIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawCalendarIcon(ctx, size, size * 0.12);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'splash-icon.png'), buf);
  console.log('  splash-icon.png (512x512)');
}

// 6) Favicon
function generateFavicon() {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  roundRect(ctx, 0, 0, size, size, 8, BG);
  drawCalendarIcon(ctx, size, size * 0.1);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, 'favicon.png'), buf);
  console.log('  favicon.png (48x48)');
}

console.log('Generating ShiftCalendar icons...');
generateMainIcon();
generateAdaptiveForeground();
generateAdaptiveBackground();
generateMonochrome();
generateSplashIcon();
generateFavicon();
console.log('Done!');
