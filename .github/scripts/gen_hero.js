// Generates carbon-aware-cost.png — hero image for the article
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background: split left (dark/grey) → right (green)
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#1a1a2e');
bg.addColorStop(0.45, '#16213e');
bg.addColorStop(1, '#0d4f3c');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Subtle grid lines
ctx.strokeStyle = 'rgba(255,255,255,0.04)';
ctx.lineWidth = 1;
for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

// Vertical divider glow
const dvd = ctx.createLinearGradient(W/2 - 2, 0, W/2 + 2, 0);
dvd.addColorStop(0, 'rgba(52,211,153,0)');
dvd.addColorStop(0.5, 'rgba(52,211,153,0.6)');
dvd.addColorStop(1, 'rgba(52,211,153,0)');
ctx.fillStyle = dvd;
ctx.fillRect(W/2 - 1, 60, 2, H - 120);

// --- Left panel: cost indicator ---
// Dollar sign circle
ctx.beginPath();
ctx.arc(200, 240, 80, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(251,191,36,0.15)';
ctx.fill();
ctx.strokeStyle = '#fbbf24';
ctx.lineWidth = 3;
ctx.stroke();

ctx.font = 'bold 90px sans-serif';
ctx.fillStyle = '#fbbf24';
ctx.textAlign = 'center';
ctx.fillText('$', 200, 270);

ctx.font = 'bold 22px sans-serif';
ctx.fillStyle = '#fbbf24';
ctx.fillText('HIGHER', 200, 360);
ctx.font = '18px sans-serif';
ctx.fillStyle = 'rgba(251,191,36,0.7)';
ctx.fillText('DIRECT COST', 200, 385);

// Upward arrow on left
ctx.strokeStyle = '#fbbf24';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(200, 420); ctx.lineTo(200, 460);
ctx.moveTo(185, 430); ctx.lineTo(200, 415); ctx.lineTo(215, 430);
ctx.stroke();

// --- Right panel: carbon/value indicator ---
ctx.beginPath();
ctx.arc(1000, 240, 80, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(52,211,153,0.15)';
ctx.fill();
ctx.strokeStyle = '#34d399';
ctx.lineWidth = 3;
ctx.stroke();

// Leaf icon (simple)
ctx.beginPath();
ctx.fillStyle = '#34d399';
ctx.arc(1000, 240, 45, Math.PI * 1.1, Math.PI * 0.1);
ctx.arc(1000, 210, 35, Math.PI * 0.4, Math.PI * 1.6);
ctx.fill();

ctx.font = 'bold 22px sans-serif';
ctx.fillStyle = '#34d399';
ctx.textAlign = 'center';
ctx.fillText('LOWER TCO', 1000, 360);
ctx.font = '18px sans-serif';
ctx.fillStyle = 'rgba(52,211,153,0.7)';
ctx.fillText('TOTAL COST OF OWNERSHIP', 1000, 385);

ctx.strokeStyle = '#34d399';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(1000, 420); ctx.lineTo(1000, 460);
ctx.moveTo(985, 450); ctx.lineTo(1000, 465); ctx.lineTo(1015, 450);
ctx.stroke();

// --- Center headline ---
ctx.textAlign = 'center';

// "WHY" top
ctx.font = 'bold 28px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.fillText('WHY', W/2, 100);

// Main headline
ctx.font = 'bold 52px sans-serif';
ctx.fillStyle = '#ffffff';

const line1 = 'CARBON-AWARE SYSTEMS';
const line2 = 'CAN COST MORE';
ctx.fillText(line1, W/2, 175);
ctx.fillText(line2, W/2, 235);

// "AND STILL BE" — accent
ctx.font = 'bold 40px sans-serif';
ctx.fillStyle = '#34d399';
ctx.fillText('AND STILL BE', W/2, 295);

// "THE RIGHT CHOICE"
ctx.font = 'bold 52px sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('THE RIGHT CHOICE', W/2, 355);

// Divider line
ctx.strokeStyle = 'rgba(255,255,255,0.2)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W/2 - 200, 385); ctx.lineTo(W/2 + 200, 385);
ctx.stroke();

// Subtitle
ctx.font = '20px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.65)';
ctx.fillText('Regulatory risk · Carbon debt · Architecture resilience', W/2, 420);

// Footer tag
ctx.font = '16px sans-serif';
ctx.fillStyle = 'rgba(52,211,153,0.6)';
ctx.fillText('clustersandclimate.com  ·  Green Cloud Series', W/2, 590);

const outPath = path.join(__dirname, '../../assets/images/tech/carbon-aware-cost.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('Wrote', outPath);
