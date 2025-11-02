import sharp from 'sharp';

export type ProcessOptions = {
  brandColorHex?: string; // background or tint
  styleInstructions?: string;
  watermarkText?: string;
  logoBuffer?: Buffer | null;
};

function hexToRgb(hex?: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const m = hex.replace('#','');
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0,2), 16);
  const g = parseInt(m.slice(2,4), 16);
  const b = parseInt(m.slice(4,6), 16);
  return { r, g, b };
}

function computeAdjustments(style: string | undefined) {
  const s = (style || '').toLowerCase();
  let saturation = 1.0;
  let brightness = 1.0;
  let contrast = 1.0;
  let tint: { r:number; g:number; b:number } | null = null;
  let vignette = /vignette|focus|spotlight/.test(s);
  if (/vintage|retro|film|grain/.test(s)) { saturation = 0.9; brightness = 1.02; contrast = 1.05; }
  if (/vibrant|pop|bold/.test(s)) { saturation = 1.15; brightness = 1.03; }
  if (/cool|teal|aqua/.test(s)) { tint = { r: 10, g: 30, b: 35 }; }
  if (/warm|gold|sun/.test(s)) { tint = { r: 35, g: 20, b: 10 }; }
  return { saturation, brightness, contrast, tint, vignette };
}

export async function processImageToInstagramSquare(
  input: Buffer,
  options: ProcessOptions
): Promise<Buffer> {
  const { brandColorHex, styleInstructions, watermarkText, logoBuffer } = options;
  const target = { width: 1080, height: 1080 };
  const bg = hexToRgb(brandColorHex || '#0b1118') || { r: 11, g: 17, b: 24 };

  const base = sharp(input, { failOnError: false }).rotate();
  const metadata = await base.metadata();

  // Fit the image within a square canvas with brand background
  const resized = await base
    .resize({ width: target.width, height: target.height, fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  let canvas = sharp({ create: { width: target.width, height: target.height, channels: 3, background: { r: bg.r, g: bg.g, b: bg.b } } });
  // Center place the image
  const composite: sharp.OverlayOptions[] = [ { input: resized, gravity: 'center' } ];

  // Apply tint overlay if suggested by style
  const adj = computeAdjustments(styleInstructions);
  if (adj.tint) {
    const svg = Buffer.from(
      `<svg width="${target.width}" height="${target.height}">
        <rect width="100%" height="100%" fill="rgb(${adj.tint.r},${adj.tint.g},${adj.tint.b})" opacity="0.18" />
      </svg>`
    );
    const tintOverlay = await sharp(svg).png().toBuffer();
    composite.push({ input: tintOverlay, blend: 'overlay' });
  }

  // Build the composed base
  let composed = await canvas.composite(composite).toBuffer();

  // Apply color adjustments using re-encode pipeline
  let img = sharp(composed).modulate({ saturation: adj.saturation, brightness: adj.brightness });
  if (adj.contrast !== 1.0) {
    // Simulate contrast via linear
    const a = adj.contrast; // slope
    const b = 128 * (1 - a); // intercept; sharp linear expects normalized, so use appropriate values
    img = img.linear(a, b);
  }

  // Add subtle vignette by radial gradient mask
  if (adj.vignette) {
    const vignette = Buffer.from(
      `<svg width="${target.width}" height="${target.height}">
        <defs>
          <radialGradient id="g" cx="50%" cy="50%" r="65%">
            <stop offset="60%" stop-color="black" stop-opacity="0" />
            <stop offset="100%" stop-color="black" stop-opacity="0.35" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>`
    );
    const vignettePng = await sharp(vignette).png().toBuffer();
    composed = await img.composite([{ input: vignettePng, blend: 'multiply' }]).toBuffer();
    img = sharp(composed);
  }

  // Add watermark text if provided
  if (watermarkText && watermarkText.trim()) {
    const svg = Buffer.from(
      `<svg width="${target.width}" height="${target.height}">
        <style>
          @font-face { font-family: 'Inter'; }
        </style>
        <text x="${target.width - 24}" y="${target.height - 24}" text-anchor="end"
          font-family="Inter, Arial, sans-serif" font-size="36" fill="white" opacity="0.75">
          ${escapeHtml(watermarkText.trim())}
        </text>
      </svg>`
    );
    const overlay = await sharp(svg).png().toBuffer();
    img = img.composite([{ input: overlay }]);
  }

  // Add logo if provided
  if (logoBuffer) {
    const logo = await sharp(logoBuffer).resize({ width: 160, height: 160, fit: 'inside' }).png().toBuffer();
    img = img.composite([{ input: logo, gravity: 'southeast', blend: 'over' }]);
  }

  // Final JPEG output for Instagram
  return img.jpeg({ quality: 85, chromaSubsampling: '4:4:4' }).toBuffer();
}

function escapeHtml(text: string) {
  return text.replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c] as string));
}
