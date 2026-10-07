import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { read } from '../node_modules/three/examples/jsm/libs/ktx-parse.module.js'

const decoderRoot = new URL('../node_modules/three/examples/jsm/libs/basis/', import.meta.url)
const decoder = await fs.readFile(new URL('basis_transcoder.js', decoderRoot), 'utf8')
const decoderModule = { exports: {} }
const factory = new Function('module', 'exports', 'require', '__dirname', `${decoder}\nreturn module.exports;`)(
  decoderModule, decoderModule.exports, createRequire(import.meta.url), fileURLToPath(decoderRoot),
)
const basis = await factory({ wasmBinary: await fs.readFile(new URL('basis_transcoder.wasm', decoderRoot)) })
basis.initializeBasis()

for (const name of ['shell-normal', 'shell-roughness']) {
  const root = new URL('../public/images/expo/crystal/', import.meta.url)
  const originalBytes = await fs.readFile(new URL(`${name}.ktx2`, root))
  const mobileBytes = await fs.readFile(new URL(`${name}-mobile.ktx2`, root))
  const original = new basis.KTX2File(originalBytes)
  const mobile = new basis.KTX2File(mobileBytes)
  try {
    assert.ok(original.isValid() && mobile.isValid(), 'Basis must accept both containers')
    assert.equal(mobile.getWidth(), original.getWidth() / 2)
    assert.equal(mobile.getHeight(), original.getHeight() / 2)
    assert.equal(mobile.getLevels(), original.getLevels() - 1)
    assert.ok(original.startTranscoding() && mobile.startTranscoding())
    for (let level = 0; level < mobile.getLevels(); level++) {
      // RGBA32 works independently of the GPU compression format available.
      const a = new Uint8Array(original.getImageTranscodedSizeInBytes(level + 1, 0, 0, 13))
      const b = new Uint8Array(mobile.getImageTranscodedSizeInBytes(level, 0, 0, 13))
      assert.ok(original.transcodeImage(a, level + 1, 0, 0, 13, 0, -1, -1))
      assert.ok(mobile.transcodeImage(b, level, 0, 0, 13, 0, -1, -1))
      assert.deepEqual(b, a, `Preserve ${name} mip ${level + 1} exactly`)
    }
    assert.equal(read(mobileBytes).levelCount, mobile.getLevels())
  } finally {
    original.close(); original.delete(); mobile.close(); mobile.delete()
  }
}
console.log('Expo mobile textures: valid Basis containers, correct dimensions and identical retained mip pixels.')
