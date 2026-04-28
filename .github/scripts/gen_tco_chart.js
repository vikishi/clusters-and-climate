// Generates tco-carbon-aware.png — TCO comparison chart for the article
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1100, H = 680;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, W, H);

// Title
ctx.font = 'bold 26px sans-serif';
ctx.fillStyle = '#f1f5f9';
ctx.textAlign = 'center';
ctx.fillText('Total Cost of Ownership: Cost-Only vs Carbon-Aware', W/2, 48);

ctx.font = '15px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.45)';
ctx.fillText('Illustrative 3-year projection — mid-sized engineering org, 200 instances', W/2, 75);

// Chart area
const chartL = 90, chartT = 110, chartR = W - 60, chartB = H - 130;
const chartW = chartR - chartL, chartH = chartB - chartT;

// Grid
const maxVal = 140; // $k
const gridLines = [0, 20, 40, 60, 80, 100, 120, 140];

ctx.strokeStyle = 'rgba(255,255,255,0.08)';
ctx.lineWidth = 1;
ctx.font = '13px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.4)';
ctx.textAlign = 'right';

gridLines.forEach(v => {
  const y = chartB - (v / maxVal) * chartH;
  ctx.beginPath(); ctx.moveTo(chartL, y); ctx.lineTo(chartR, y); ctx.stroke();
  ctx.fillText(`$${v}k`, chartL - 8, y + 4);
});

// Axes
ctx.strokeStyle = 'rgba(255,255,255,0.3)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(chartL, chartT); ctx.lineTo(chartL, chartB); ctx.lineTo(chartR, chartB);
ctx.stroke();

// Data
const categories = [
  'Direct\nCompute',
  'Regulatory\nCompliance',
  'Carbon\nOffsets',
  'Opportunity\nCost',
  'Architecture\nEvolution',
  'TOTAL\nTCO',
];

// Values in $k — cost-only | carbon-aware
const data = [
  [75, 88],   // Direct compute: carbon-aware is 15-17% more
  [8, 2],     // Regulatory compliance: carbon-aware has lower risk
  [21, 4],    // Offsets needed: cost-only needs more
  [18, 5],    // Opportunity cost: lost contracts
  [14, 6],    // Architecture evolution later vs now
  [136, 105], // Total TCO
];

const colorCostOnly = '#f87171';    // red-ish
const colorCarbonAware = '#34d399'; // green
const groupW = chartW / categories.length;
const barW = groupW * 0.28;
const gap = groupW * 0.06;

categories.forEach((label, i) => {
  const isTotal = i === categories.length - 1;
  const cx = chartL + groupW * i + groupW / 2;
  const x1 = cx - barW - gap / 2;
  const x2 = cx + gap / 2;

  [0, 1].forEach(side => {
    const val = data[i][side];
    const barH = (val / maxVal) * chartH;
    const x = side === 0 ? x1 : x2;
    const y = chartB - barH;

    // Glow for total
    if (isTotal) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = side === 0 ? colorCostOnly : colorCarbonAware;
    }

    ctx.fillStyle = side === 0 ? colorCostOnly : colorCarbonAware;
    if (isTotal) {
      ctx.globalAlpha = 0.95;
    }
    // Rounded top
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, chartB);
    ctx.lineTo(x, chartB);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Value label above bar
    ctx.font = isTotal ? 'bold 14px sans-serif' : '13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`$${val}k`, x + barW / 2, y - 7);
  });

  // Saving callout for total
  if (isTotal) {
    const saving = data[i][0] - data[i][1];
    const savY = chartB - (data[i][1] / maxVal) * chartH - 35;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(`↓ $${saving}k saved`, cx + barW / 2 + gap, savY - 12);
  }

  // Category label
  const labelLines = label.split('\n');
  const labelY = chartB + 22;
  ctx.font = isTotal ? 'bold 14px sans-serif' : '13px sans-serif';
  ctx.fillStyle = isTotal ? '#fbbf24' : 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'center';
  labelLines.forEach((line, li) => ctx.fillText(line, cx, labelY + li * 17));
});

// Legend
const legY = H - 40;
const legendItems = [
  { color: colorCostOnly, label: 'Cost-Optimized Only' },
  { color: colorCarbonAware, label: 'Carbon-Aware' },
];
legendItems.forEach(({ color, label }, i) => {
  const lx = W / 2 - 180 + i * 220;
  ctx.fillStyle = color;
  ctx.fillRect(lx, legY - 12, 18, 14);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'left';
  ctx.fillText(label, lx + 24, legY);
});

// Footer
ctx.font = '13px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.25)';
ctx.textAlign = 'center';
ctx.fillText('clustersandclimate.com', W/2, H - 10);

const outPath = path.join(__dirname, '../../assets/images/tech/tco-carbon-aware.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('Wrote', outPath);
