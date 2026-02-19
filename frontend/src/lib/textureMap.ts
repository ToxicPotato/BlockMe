/**
 * textureMap.ts
 * ─────────────────────────────────────────────────────────────
 * Maps namespaced block ids → texture file paths.
 *
 * Convention:
 *   /textures/blocks/<name>.png
 *
 * Drop vanilla (or custom) 16×16 PNGs into
 *   frontend/public/textures/blocks/
 * and they will be served at runtime.
 *
 * If a block has no entry here, it falls back to a solid colour
 * defined in BLOCK_COLOR_FALLBACK (used by BlockMeshes.tsx).
 * ─────────────────────────────────────────────────────────────
 */

/** Base path served by Vite from the `public/` folder */
const BASE = '/textures/blocks'

/**
 * Returns the texture URL for a block id, or null if unmapped.
 * Callers should fall back to BLOCK_COLOR_FALLBACK when null.
 */
export function getTextureUrl(blockId: string): string | null {
  const name = blockId.replace('minecraft:', '')
  const mapped = TEXTURE_MAP[name]
  if (!mapped) return null
  return `${BASE}/${mapped}`
}

/**
 * Fallback solid colour per block id (used when no PNG is present).
 * Hex string, e.g. '#7d7d7d'.
 */
export function getFallbackColor(blockId: string): string {
  const name = blockId.replace('minecraft:', '')
  return BLOCK_COLOR_FALLBACK[name] ?? '#888888'
}

// ─── Texture filename map ─────────────────────────────────────
// Key   = block name without "minecraft:" prefix
// Value = PNG filename under public/textures/blocks/

const TEXTURE_MAP: Record<string, string> = {
  stone:               'stone.png',
  grass_block:         'grass_block_top.png',
  dirt:                'dirt.png',
  cobblestone:         'cobblestone.png',
  oak_planks:          'oak_planks.png',
  bedrock:             'bedrock.png',
  sand:                'sand.png',
  gravel:              'gravel.png',
  gold_ore:            'gold_ore.png',
  iron_ore:            'iron_ore.png',
  coal_ore:            'coal_ore.png',
  oak_log:             'oak_log_top.png',
  oak_leaves:          'oak_leaves.png',
  glass:               'glass.png',
  lapis_ore:           'lapis_ore.png',
  lapis_block:         'lapis_block.png',
  sandstone:           'sandstone_top.png',
  white_wool:          'white_wool.png',
  gold_block:          'gold_block.png',
  iron_block:          'iron_block.png',
  bricks:              'bricks.png',
  obsidian:            'obsidian.png',
  diamond_ore:         'diamond_ore.png',
  diamond_block:       'diamond_block.png',
  crafting_table:      'crafting_table_top.png',
  furnace:             'furnace_front.png',
  ice:                 'ice.png',
  snow_block:          'snow.png',
  clay:                'clay.png',
  netherrack:          'netherrack.png',
  soul_sand:           'soul_sand.png',
  glowstone:           'glowstone.png',
  stone_bricks:        'stone_bricks.png',
  nether_bricks:       'nether_bricks.png',
  end_stone:           'end_stone.png',
  emerald_ore:         'emerald_ore.png',
  emerald_block:       'emerald_block.png',
  quartz_block:        'quartz_block_top.png',
  terracotta:          'terracotta.png',
  prismarine:          'prismarine.png',
  sea_lantern:         'sea_lantern.png',
  hay_block:           'hay_block_top.png',
  coal_block:          'coal_block.png',
  packed_ice:          'packed_ice.png',
  magma_block:         'magma.png',
  nether_wart_block:   'nether_wart_block.png',
  bone_block:          'bone_block_top.png',
  bookshelf:           'bookshelf.png',
  tnt:                 'tnt_top.png',
  sponge:              'sponge.png',
  mossy_cobblestone:   'mossy_cobblestone.png',
  red_sandstone:       'red_sandstone_top.png',
  pumpkin:             'pumpkin_top.png',
  melon:               'melon_top.png',
}

// ─── Colour fallbacks ─────────────────────────────────────────

const BLOCK_COLOR_FALLBACK: Record<string, string> = {
  stone:               '#7d7d7d',
  grass_block:         '#5a8a3c',
  dirt:                '#8b5e3c',
  cobblestone:         '#6b6b6b',
  oak_planks:          '#c49a44',
  bedrock:             '#3d3d3d',
  sand:                '#e0d49a',
  gravel:              '#8f8f8f',
  gold_ore:            '#9f8c2e',
  iron_ore:            '#a08060',
  coal_ore:            '#3a3a3a',
  oak_log:             '#7a5c2e',
  oak_leaves:          '#3a6b2a',
  glass:               '#a8d4e8',
  lapis_ore:           '#2e4a8a',
  lapis_block:         '#1e3a7a',
  sandstone:           '#d4c484',
  white_wool:          '#e8e8e8',
  gold_block:          '#f0d030',
  iron_block:          '#d0d0d0',
  bricks:              '#8b3a2a',
  obsidian:            '#1a0a2a',
  diamond_ore:         '#4a9aaf',
  diamond_block:       '#3ac4d4',
  crafting_table:      '#7a5c3a',
  furnace:             '#5a5a5a',
  ice:                 '#b0d4f0',
  snow_block:          '#f0f4f8',
  clay:                '#9daabb',
  netherrack:          '#7a2a2a',
  soul_sand:           '#4a3a2a',
  glowstone:           '#f0c050',
  stone_bricks:        '#6a6a6a',
  nether_bricks:       '#3a1a1a',
  end_stone:           '#d4d4a0',
  emerald_ore:         '#2a8a4a',
  emerald_block:       '#1a9a4a',
  quartz_block:        '#f0ece4',
  terracotta:          '#9a5a3a',
  prismarine:          '#2a7a6a',
  sea_lantern:         '#b0d8c8',
  hay_block:           '#d4b030',
  coal_block:          '#2a2a2a',
  packed_ice:          '#90c0e0',
  magma_block:         '#a04020',
  nether_wart_block:   '#8a1a1a',
  bone_block:          '#e0dcc8',
  bookshelf:           '#a08040',
  tnt:                 '#b03020',
  sponge:              '#c8c040',
  mossy_cobblestone:   '#5a7a4a',
  red_sandstone:       '#b05030',
  pumpkin:             '#d07020',
  melon:               '#5a9a30',
  water:               '#2060c0',
  lava:                '#d05010',
}
