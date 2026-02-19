/**
 * nbtParser.ts
 * ─────────────────────────────────────────────────────────────
 * Pure-TypeScript NBT reader + schematic converter.
 *
 * Supports:
 *  • Classic   .schematic  (Alpha/MCEdit format)
 *  • Modern    .schem      (Sponge Schematic v2/v3)
 *  • Litematica .litematic (Litematica mod format)
 *
 * All formats are gzip-compressed NBT. We decompress with `pako`
 * and then walk the binary with a hand-rolled parser so we have
 * zero opaque dependencies.
 * ─────────────────────────────────────────────────────────────
 */

import { inflate } from 'pako'
import type { ParsedSchematic, BlockEntry, NbtCompound, NbtValue } from '../types/schematic'

// ─── Low-level binary helpers ────────────────────────────────

class NbtReader {
  private view: DataView
  private pos = 0

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
  }

  get offset() { return this.pos }

  readByte()   { return this.view.getInt8(this.pos++) }
  readUByte()  { return this.view.getUint8(this.pos++) }
  readShort()  { const v = this.view.getInt16(this.pos, false); this.pos += 2; return v }
  readInt()    { const v = this.view.getInt32(this.pos, false); this.pos += 4; return v }
  readLong()   {
    const hi = this.view.getInt32(this.pos, false)
    const lo = this.view.getUint32(this.pos + 4, false)
    this.pos += 8
    // Return as BigInt to avoid precision loss (we rarely need the value)
    return (BigInt(hi) << 32n) | BigInt(lo)
  }
  readFloat()  { const v = this.view.getFloat32(this.pos, false); this.pos += 4; return v }
  readDouble() { const v = this.view.getFloat64(this.pos, false); this.pos += 8; return v }

  readString() {
    const len = this.readShort()   // always unsigned in practice; use abs
    const bytes = new Uint8Array(this.view.buffer, this.pos, Math.abs(len))
    this.pos += Math.abs(len)
    return new TextDecoder().decode(bytes)
  }

  readByteArray(length: number) {
    const arr = new Int8Array(this.view.buffer, this.pos, length)
    this.pos += length
    return arr
  }

  readIntArray(length: number) {
    const arr = new Int32Array(length)
    for (let i = 0; i < length; i++) arr[i] = this.readInt()
    return arr
  }

  readLongArray(length: number) {
    const arr = new BigInt64Array(length)
    for (let i = 0; i < length; i++) arr[i] = this.readLong()
    return arr
  }
}

// ─── NBT tag ids ─────────────────────────────────────────────

const TAG = {
  END: 0, BYTE: 1, SHORT: 2, INT: 3, LONG: 4,
  FLOAT: 5, DOUBLE: 6, BYTE_ARRAY: 7, STRING: 8,
  LIST: 9, COMPOUND: 10, INT_ARRAY: 11, LONG_ARRAY: 12,
} as const

// ─── Recursive NBT reader ─────────────────────────────────────

function readPayload(r: NbtReader, tagId: number): NbtValue {
  switch (tagId) {
    case TAG.BYTE:       return { type: 'byte',      value: r.readByte() }
    case TAG.SHORT:      return { type: 'short',     value: r.readShort() }
    case TAG.INT:        return { type: 'int',       value: r.readInt() }
    case TAG.LONG:       return { type: 'long',      value: r.readLong() }
    case TAG.FLOAT:      return { type: 'float',     value: r.readFloat() }
    case TAG.DOUBLE:     return { type: 'double',    value: r.readDouble() }
    case TAG.STRING:     return { type: 'string',    value: r.readString() }
    case TAG.BYTE_ARRAY: {
      const len = r.readInt()
      return { type: 'byteArray', value: r.readByteArray(len) }
    }
    case TAG.INT_ARRAY: {
      const len = r.readInt()
      return { type: 'intArray', value: r.readIntArray(len) }
    }
    case TAG.LONG_ARRAY: {
      const len = r.readInt()
      return { type: 'longArray', value: r.readLongArray(len) }
    }
    case TAG.LIST: {
      const elemId  = r.readUByte()
      const elemCnt = r.readInt()
      const items: NbtValue[] = []
      for (let i = 0; i < elemCnt; i++) items.push(readPayload(r, elemId))
      return { type: 'list', value: items }
    }
    case TAG.COMPOUND: {
      return { type: 'compound', value: readCompound(r) }
    }
    default:
      throw new Error(`Unknown NBT tag id: ${tagId}`)
  }
}

function readCompound(r: NbtReader): NbtCompound {
  const result: NbtCompound = {}
  for (;;) {
    const tagId = r.readUByte()
    if (tagId === TAG.END) break
    const name = r.readString()
    result[name] = readPayload(r, tagId)
  }
  return result
}

/** Parse a raw (already-decompressed) NBT buffer and return the root compound. */
function parseNbt(buffer: ArrayBuffer): NbtCompound {
  const r = new NbtReader(buffer)
  const rootTagId = r.readUByte()
  if (rootTagId !== TAG.COMPOUND) throw new Error('Root NBT tag is not a Compound')
  r.readString() // root name (usually empty)
  return readCompound(r)
}

// ─── Typed helpers ────────────────────────────────────────────

function getInt(c: NbtCompound, key: string): number {
  const v = c[key]
  if (!v) throw new Error(`Missing NBT key: ${key}`)
  return v.value as number
}

function getShort(c: NbtCompound, key: string): number {
  return getInt(c, key) // short is stored as number too
}

function getCompound(c: NbtCompound, key: string): NbtCompound {
  const v = c[key]
  if (!v || v.type !== 'compound') throw new Error(`Missing compound: ${key}`)
  return v.value as NbtCompound
}


// ─── Classic .schematic (MCEdit / Alpha) ─────────────────────
//
// Structure:
//   Schematic {
//     Width:  TAG_Short
//     Height: TAG_Short
//     Length: TAG_Short
//     Blocks: TAG_Byte_Array   (Width × Height × Length, YZX order)
//     Data:   TAG_Byte_Array   (metadata, same size)
//   }
//
// Block ids are legacy numeric ids (0=air, 1=stone, etc.)
// We map them to namespaced ids via LEGACY_BLOCK_MAP below.

function parseClassicSchematic(root: NbtCompound): ParsedSchematic {
  const schematic = getCompound(root, 'Schematic')
  const width  = getShort(schematic, 'Width')
  const height = getShort(schematic, 'Height')
  const length = getShort(schematic, 'Length')

  const blocksRaw = schematic['Blocks']?.value as Int8Array
  if (!blocksRaw) throw new Error('Missing Blocks array in schematic')

  const blocks: BlockEntry[] = []

  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * length + z) * width + x
        const id  = blocksRaw[idx] & 0xff    // unsigned
        if (id === 0) continue               // skip air
        blocks.push({ x, y, z, blockId: legacyIdToNamespaced(id) })
      }
    }
  }

  return { width, height, length, blocks }
}

// ─── Modern .schem (Sponge v2 / v3) ──────────────────────────
//
// Structure (v2):
//   Schematic {
//     Width:  TAG_Short
//     Height: TAG_Short
//     Length: TAG_Short
//     Palette: TAG_Compound  { "minecraft:stone": TAG_Int(0), ... }
//     BlockData: TAG_Byte_Array  (varint-encoded palette indices, XZY)
//   }
//
// v3 wraps everything inside a "Schematic" sub-compound but is
// otherwise identical in structure for block data.

function parseSpongeSchematic(root: NbtCompound): ParsedSchematic {
  // v3 nests inside "Schematic", v2 may be at root
  const top = root['Schematic'] ? getCompound(root, 'Schematic') : root

  const width  = getShort(top, 'Width')
  const height = getShort(top, 'Height')
  const length = getShort(top, 'Length')

  // Build reverse-palette: index → namespaced id
  const paletteRaw = getCompound(top, 'Palette')
  const palette: Record<number, string> = {}
  for (const [name, tag] of Object.entries(paletteRaw)) {
    palette[tag.value as number] = name
  }

  const blockDataRaw = top['BlockData']?.value as Int8Array
  if (!blockDataRaw) throw new Error('Missing BlockData in .schem')

  // Decode packed varints
  const indices = decodeVarints(blockDataRaw)

  const blocks: BlockEntry[] = []

  for (let i = 0; i < indices.length; i++) {
    const paletteIdx = indices[i]
    const blockId    = palette[paletteIdx] ?? 'minecraft:air'
    if (blockId === 'minecraft:air') continue

    // XZY order
    const x = i % width
    const z = Math.floor(i / width) % length
    const y = Math.floor(i / (width * length))

    blocks.push({ x, y, z, blockId: stripBlockState(blockId) })
  }

  return { width, height, length, blocks }
}

/** Strip block-state suffix, e.g. "minecraft:oak_log[axis=y]" → "minecraft:oak_log" */
function stripBlockState(id: string): string {
  const bracket = id.indexOf('[')
  return bracket === -1 ? id : id.slice(0, bracket)
}

/** Decode a byte array of packed varints (used by Sponge .schem). */
function decodeVarints(data: Int8Array): number[] {
  const result: number[] = []
  let value = 0
  let bits  = 0
  for (let i = 0; i < data.length; i++) {
    const b = data[i] & 0xff
    value |= (b & 0x7f) << bits
    bits  += 7
    if ((b & 0x80) === 0) {
      result.push(value)
      value = 0
      bits  = 0
    }
  }
  return result
}

// ─── Litematic (.litematic – Litematica mod) ──────────────────
//
// Structure:
//   root {
//     MinecraftDataVersion: TAG_Int
//     Version:              TAG_Int
//     Metadata: {
//       Name, Author, Description, ...
//       EnclosingSize: { x, y, z }
//     }
//     Regions: {
//       "<name>": {
//         Position:    { x:Int, y:Int, z:Int }
//         Size:        { x:Int, y:Int, z:Int }
//         BlockStatePalette: TAG_List<TAG_Compound>
//           each entry: { Name: TAG_String, Properties: TAG_Compound (optional) }
//         BlockStates:  TAG_Long_Array  ← bit-packed palette indices
//       }
//     }
//   }
//
// Bit-packing:
//   bitsPerBlock = max(2, ceil(log2(paletteSize)))
//   Blocks are indexed in XZY order (X fastest, Y slowest).
//   Indices are packed consecutively into the long array.
//   An index NEVER spans two longs – each long is padded independently.
//
// Coordinate ordering (XZY, 0-based within region):
//   index = y * (|sizeX| * |sizeZ|) + z * |sizeX| + x

function parseLitematic(root: NbtCompound): ParsedSchematic {
  const regionsTag = root['Regions']
  if (!regionsTag || regionsTag.type !== 'compound') {
    throw new Error('Not a valid .litematic file: missing Regions compound')
  }
  const regions = regionsTag.value as NbtCompound

  // Accumulate blocks from all regions with global offset per region
  const allBlocks: BlockEntry[] = []
  let totalWidth  = 0
  let totalHeight = 0
  let totalLength = 0

  for (const regionName of Object.keys(regions)) {
    const regionVal = regions[regionName]
    if (regionVal.type !== 'compound') continue
    const region = regionVal.value as NbtCompound

    // ── Dimensions (Size values can be negative – use abs) ──
    const sizeTag = region['Size']
    if (!sizeTag || sizeTag.type !== 'compound') continue
    const size = sizeTag.value as NbtCompound

    const sizeX = Math.abs(getInt(size, 'x'))
    const sizeY = Math.abs(getInt(size, 'y'))
    const sizeZ = Math.abs(getInt(size, 'z'))

    // ── Region world position ──────────────────────────────
    const posTag = region['Position']
    let offX = 0, offY = 0, offZ = 0
    if (posTag && posTag.type === 'compound') {
      const pos = posTag.value as NbtCompound
      offX = getInt(pos, 'x')
      offY = getInt(pos, 'y')
      offZ = getInt(pos, 'z')
    }

    // ── Palette: List<Compound> ────────────────────────────
    const paletteTag = region['BlockStatePalette']
    if (!paletteTag || paletteTag.type !== 'list') continue
    const paletteList = paletteTag.value as NbtValue[]

    const palette: string[] = paletteList.map((entry) => {
      if (entry.type !== 'compound') return 'minecraft:air'
      const compound = entry.value as NbtCompound
      const nameTag  = compound['Name']
      return nameTag ? (nameTag.value as string) : 'minecraft:air'
    })

    // ── Bit-packed long array ──────────────────────────────
    const blockStatesTag = region['BlockStates']
    if (!blockStatesTag || blockStatesTag.type !== 'longArray') continue
    const longs = blockStatesTag.value as BigInt64Array

    const paletteSize  = palette.length
    const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(paletteSize || 2)))
    const mask         = BigInt((1 << bitsPerBlock) - 1)
    // How many block indices fit inside one 64-bit long (no cross-long spanning)
    const blocksPerLong = Math.floor(64 / bitsPerBlock)

    // ── Decode each position ───────────────────────────────
    const volume = sizeX * sizeY * sizeZ
    for (let i = 0; i < volume; i++) {
      const longIdx    = Math.floor(i / blocksPerLong)
      const bitOffset  = BigInt((i % blocksPerLong) * bitsPerBlock)
      const longVal    = longs[longIdx] ?? 0n
      const paletteIdx = Number((longVal >> bitOffset) & mask)

      const blockId = palette[paletteIdx] ?? 'minecraft:air'
      if (blockId === 'minecraft:air') continue

      // XZY coordinate order
      const lx = i % sizeX
      const lz = Math.floor(i / sizeX) % sizeZ
      const ly = Math.floor(i / (sizeX * sizeZ))

      allBlocks.push({
        x: offX + lx,
        y: offY + ly,
        z: offZ + lz,
        blockId: stripBlockState(blockId),
      })
    }

    totalWidth  = Math.max(totalWidth,  offX + sizeX)
    totalHeight = Math.max(totalHeight, offY + sizeY)
    totalLength = Math.max(totalLength, offZ + sizeZ)
  }

  // Shift all blocks so minimum coordinate is 0
  const minX = allBlocks.reduce((m, b) => Math.min(m, b.x), 0)
  const minY = allBlocks.reduce((m, b) => Math.min(m, b.y), 0)
  const minZ = allBlocks.reduce((m, b) => Math.min(m, b.z), 0)
  if (minX < 0 || minY < 0 || minZ < 0) {
    for (const b of allBlocks) {
      b.x -= minX
      b.y -= minY
      b.z -= minZ
    }
    totalWidth  -= minX
    totalHeight -= minY
    totalLength -= minZ
  }

  return {
    width:  totalWidth  || 1,
    height: totalHeight || 1,
    length: totalLength || 1,
    blocks: allBlocks,
  }
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Read an ArrayBuffer coming from a File input,
 * auto-detect the schematic format and return a ParsedSchematic.
 *
 * Supported formats (all gzip-compressed NBT):
 *  .schematic  – Classic MCEdit / Alpha format
 *  .schem      – Sponge Schematic v2 / v3
 *  .litematic  – Litematica mod format
 */
export async function parseSchematicBuffer(buffer: ArrayBuffer): Promise<ParsedSchematic> {
  // All formats are gzip-compressed → decompress first
  const decompressed = inflate(new Uint8Array(buffer)).buffer

  const root = parseNbt(decompressed)

  // ── Format detection ────────────────────────────────────────
  //
  // Litematic:  root has "Regions" (compound) + "Version" (int)
  // Classic:    root has "Schematic" compound → "Blocks" (byteArray)
  // Sponge v2:  root has "Blocks" / "Palette" / "Width" etc. directly
  // Sponge v3:  root has "Schematic" compound → "Palette" (compound)

  if (root['Regions']?.type === 'compound') {
    return parseLitematic(root)
  }

  const inner = root['Schematic']?.value as NbtCompound | undefined

  const isClassic =
    inner?.['Blocks']?.type === 'byteArray' ||
    root['Blocks']?.type === 'byteArray'

  if (isClassic) return parseClassicSchematic(root)
  return parseSpongeSchematic(root)
}

// ─── Legacy numeric → namespaced id map (common blocks) ───────

function legacyIdToNamespaced(id: number): string {
  return LEGACY_BLOCK_MAP[id] ?? `minecraft:unknown_${id}`
}

const LEGACY_BLOCK_MAP: Record<number, string> = {
  1:  'minecraft:stone',
  2:  'minecraft:grass_block',
  3:  'minecraft:dirt',
  4:  'minecraft:cobblestone',
  5:  'minecraft:oak_planks',
  6:  'minecraft:oak_sapling',
  7:  'minecraft:bedrock',
  8:  'minecraft:water',
  9:  'minecraft:water',
  10: 'minecraft:lava',
  11: 'minecraft:lava',
  12: 'minecraft:sand',
  13: 'minecraft:gravel',
  14: 'minecraft:gold_ore',
  15: 'minecraft:iron_ore',
  16: 'minecraft:coal_ore',
  17: 'minecraft:oak_log',
  18: 'minecraft:oak_leaves',
  19: 'minecraft:sponge',
  20: 'minecraft:glass',
  21: 'minecraft:lapis_ore',
  22: 'minecraft:lapis_block',
  24: 'minecraft:sandstone',
  26: 'minecraft:red_bed',
  31: 'minecraft:grass',
  35: 'minecraft:white_wool',
  41: 'minecraft:gold_block',
  42: 'minecraft:iron_block',
  43: 'minecraft:stone_slab',
  45: 'minecraft:bricks',
  46: 'minecraft:tnt',
  47: 'minecraft:bookshelf',
  48: 'minecraft:mossy_cobblestone',
  49: 'minecraft:obsidian',
  50: 'minecraft:torch',
  52: 'minecraft:spawner',
  53: 'minecraft:oak_stairs',
  54: 'minecraft:chest',
  56: 'minecraft:diamond_ore',
  57: 'minecraft:diamond_block',
  58: 'minecraft:crafting_table',
  61: 'minecraft:furnace',
  67: 'minecraft:cobblestone_stairs',
  73: 'minecraft:redstone_ore',
  78: 'minecraft:snow',
  79: 'minecraft:ice',
  80: 'minecraft:snow_block',
  81: 'minecraft:cactus',
  82: 'minecraft:clay',
  86: 'minecraft:pumpkin',
  87: 'minecraft:netherrack',
  88: 'minecraft:soul_sand',
  89: 'minecraft:glowstone',
  91: 'minecraft:jack_o_lantern',
  95: 'minecraft:glass',
  98: 'minecraft:stone_bricks',
  102: 'minecraft:glass',
  103: 'minecraft:melon',
  108: 'minecraft:brick_stairs',
  109: 'minecraft:stone_brick_stairs',
  112: 'minecraft:nether_bricks',
  121: 'minecraft:end_stone',
  123: 'minecraft:redstone_lamp',
  125: 'minecraft:oak_planks',
  128: 'minecraft:sandstone_stairs',
  129: 'minecraft:emerald_ore',
  133: 'minecraft:emerald_block',
  155: 'minecraft:quartz_block',
  156: 'minecraft:quartz_stairs',
  159: 'minecraft:terracotta',
  161: 'minecraft:oak_leaves',
  162: 'minecraft:oak_log',
  163: 'minecraft:acacia_stairs',
  164: 'minecraft:dark_oak_stairs',
  168: 'minecraft:prismarine',
  169: 'minecraft:sea_lantern',
  170: 'minecraft:hay_block',
  171: 'minecraft:white_carpet',
  172: 'minecraft:terracotta',
  173: 'minecraft:coal_block',
  174: 'minecraft:packed_ice',
  179: 'minecraft:red_sandstone',
  181: 'minecraft:red_sandstone_slab',
  206: 'minecraft:end_stone_bricks',
  208: 'minecraft:grass_path',
  214: 'minecraft:magma_block',
  215: 'minecraft:nether_wart_block',
  216: 'minecraft:bone_block',
}
