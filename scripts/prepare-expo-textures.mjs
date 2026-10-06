import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { read, write } from '../node_modules/three/examples/jsm/libs/ktx-parse.module.js'

const root = fileURLToPath(new URL('../public/images/expo/crystal/', import.meta.url))
// Promote the existing first mip to the base level. ETC1S codebooks and all
// remaining compressed slices stay intact; no lossy recompression is required.
for (const name of ['shell-normal', 'shell-roughness']) {
  const source = read(await fs.readFile(path.join(root, `${name}.ktx2`)))
  if (source.faceCount !== 1 || source.layerCount > 1 || source.pixelDepth || source.levelCount < 2 || source.supercompressionScheme !== 1) {
    throw new Error(`Unsupported Expo texture layout: ${name}`)
  }
  source.pixelWidth = Math.max(1, source.pixelWidth >> 1)
  source.pixelHeight = Math.max(1, source.pixelHeight >> 1)
  source.levels = source.levels.slice(1)
  source.levelCount = source.levels.length
  source.globalData.imageDescs = source.globalData.imageDescs.slice(1)
  await fs.writeFile(path.join(root, `${name}-mobile.ktx2`), write(source))
}

// A repeatable lattice replaces sin/hash calculations at every cloud pixel.
const size = 256
const pixels = Buffer.alloc(size * size)
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    pixels[y * size + x] = Math.round((value - Math.floor(value)) * 255)
  }
}
await sharp(pixels, { raw: { width: size, height: size, channels: 1 } }).toColourspace('b-w').png().toFile(path.join(root, 'cloud-noise.png'))
console.log('Prepared mobile compressed maps and the Expo cloud noise lattice.')
