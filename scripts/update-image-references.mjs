/**
 * Updates /img/ and provider image paths in src from .png/.jpg/.jpeg/.gif to .webp.
 * Run after convert-images-to-webp.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')
const EXT_RE = /\.(png|jpe?g|gif)\b/gi

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) files.push(...(await walk(full)))
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) files.push(full)
  }
  return files
}

let updated = 0
for (const file of await walk(srcDir)) {
  const text = await fs.readFile(file, 'utf8')
  const next = text.replace(EXT_RE, '.webp')
  if (next !== text) {
    await fs.writeFile(file, next)
    updated++
  }
}
console.log(`Updated ${updated} source files.`)
