/**
 * Converts raster images under public/ to WebP and removes originals.
 * Run: node scripts/convert-images-to-webp.mjs
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const RASTER = /\.(png|jpe?g|gif|bmp)$/i

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) files.push(...(await walk(full)))
    else if (RASTER.test(ent.name)) files.push(full)
  }
  return files
}

async function readRasterBuffer(filePath) {
  try {
    return await fs.readFile(filePath)
  } catch {
    throw new Error(`cannot read ${filePath}`)
  }
}

/** Some provider assets are ICO data saved with a .png extension. */
async function bufferForSharp(filePath) {
  const input = await readRasterBuffer(filePath)
  try {
    await sharp(input).metadata()
    return input
  } catch {
    const tmp = path.join(os.tmpdir(), `baji-webp-${path.basename(filePath)}.png`)
    execSync(`sips -s format png "${filePath}" --out "${tmp}"`, { stdio: 'pipe' })
    const png = await fs.readFile(tmp)
    await fs.unlink(tmp).catch(() => {})
    return png
  }
}

async function convertFile(filePath) {
  const ext = path.extname(filePath)
  const outPath = filePath.slice(0, -ext.length) + '.webp'
  const input = await bufferForSharp(filePath)
  const isGif = ext.toLowerCase() === '.gif'

  if (isGif) {
    await sharp(input, { animated: true }).webp({ quality: 85 }).toFile(outPath)
  } else {
    await sharp(input).webp({ quality: 85 }).toFile(outPath)
  }

  await fs.unlink(filePath)
}

const files = await walk(publicDir)
console.log(`Converting ${files.length} images…`)

let ok = 0
const failed = []
for (const file of files) {
  const rel = path.relative(root, file)
  const outPath = file.slice(0, -path.extname(file).length) + '.webp'
  if (await fs.stat(outPath).then(() => true).catch(() => false)) {
    await fs.unlink(file).catch(() => {})
    continue
  }
  try {
    await convertFile(file)
    ok++
    if (ok % 50 === 0) console.log(`  ${ok}/${files.length}…`)
  } catch (err) {
    failed.push({ file: rel, message: err.message })
    console.warn(`SKIP ${rel}: ${err.message}`)
  }
}
console.log(`Done. Converted ${ok} files to WebP.`)
if (failed.length) {
  console.warn(`Failed (${failed.length}):`)
  failed.forEach(({ file, message }) => console.warn(`  ${file}: ${message}`))
  process.exitCode = 1
}
