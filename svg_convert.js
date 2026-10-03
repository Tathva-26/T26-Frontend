const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactsDir = 'C:\\Users\\noelr\\.gemini\\antigravity-ide\\brain\\5f8b63d8-1561-47af-a21d-76ac182d2494';
const outputDir = path.join(__dirname, 'public', 'images', 'artist');

const images = [
  'media__1791056745462.jpg',
  'media__1791056746054.jpg',
  'media__1791056746293.jpg',
  'media__1791056746516.png'
];

async function convertToSvg() {
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const inputPath = path.join(artifactsDir, file);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`Processing ${file}...`);

    // Compress first
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Make sure we reduce size so base64 + svg is < 1MB
    const resized = image.resize({ width: 800, withoutEnlargement: true });
    let buffer, mimeType;

    if (file.endsWith('.png')) {
      buffer = await resized.png({ quality: 60, compressionLevel: 9 }).toBuffer();
      mimeType = 'image/png';
    } else {
      buffer = await resized.jpeg({ quality: 60 }).toBuffer();
      mimeType = 'image/jpeg';
    }

    const { width, height } = await sharp(buffer).metadata();
    const base64 = buffer.toString('base64');

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <image href="data:${mimeType};base64,${base64}" width="${width}" height="${height}" />
</svg>`;

    const outName = `day2_anim_${i + 1}.svg`;
    const outPath = path.join(outputDir, outName);
    fs.writeFileSync(outPath, svgStr);

    const size = fs.statSync(outPath).size;
    console.log(`Saved ${outName} - ${(size / 1024).toFixed(2)} KB`);
  }
}

convertToSvg().catch(console.error);
