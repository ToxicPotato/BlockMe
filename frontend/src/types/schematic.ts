// ─────────────────────────────────────────────────────────────
// Shared types used across the schematic viewer
// ─────────────────────────────────────────────────────────────

/** A single placed block with its grid coordinates and block-state id */
export interface BlockEntry {
  x: number
  y: number
  z: number
  /** Namespaced block id, e.g. "minecraft:stone" */
  blockId: string
}

/** Parsed result returned by the NBT parser or skin API */
export interface ParsedSchematic {
  /** Width  (X axis) */
  width: number
  /** Height (Y axis) */
  height: number
  /** Length (Z axis) */
  length: number
  /** All non-air blocks */
  blocks: BlockEntry[]
}

/** One row in the material list – aggregated block counts */
export interface MaterialEntry {
  blockId:     string   // "minecraft:stone"
  displayName: string   // "Stone"
  count:       number   // 142
  category:    string   // "building"
}

/** Which source loaded the active schematic */
export type SchematicSource = 'file' | 'player'

/** Full view-filter settings applied in the 3D scene */
export interface ViewSettings {
  yMin:              number
  yMax:              number
  hiddenCategories:  Set<string>
  hiddenBlocks:      Set<string>
  whitelistMode:     boolean
  whitelistedBlocks: Set<string>
}

export function defaultViewSettings(): ViewSettings {
  return {
    yMin:              0,
    yMax:              319,
    hiddenCategories:  new Set(),
    hiddenBlocks:      new Set(),
    whitelistMode:     false,
    whitelistedBlocks: new Set(),
  }
}

// ─────────────────────────────────────────────────────────────
// Raw NBT tag shapes (minimal – only what we actually use)
// ─────────────────────────────────────────────────────────────

export type NbtTagType =
  | 'byte' | 'short' | 'int' | 'long'
  | 'float' | 'double'
  | 'byteArray' | 'intArray' | 'longArray'
  | 'string' | 'list' | 'compound'

export interface NbtValue<T = unknown> {
  type: NbtTagType
  value: T
}

export type NbtCompound = Record<string, NbtValue>
