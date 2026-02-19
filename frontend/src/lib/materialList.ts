/**
 * materialList.ts
 * ─────────────────────────────────────────────────────────────
 * Aggregates a blocks[] array into a sorted MaterialEntry list.
 * Works identically for both file schematics and skin schematics.
 * ─────────────────────────────────────────────────────────────
 */

import type { BlockEntry, MaterialEntry } from '../types/schematic'

// ─── Display names ────────────────────────────────────────────
// Key = block id without "minecraft:" prefix
// Value = human-readable name

const DISPLAY_NAMES: Record<string, string> = {
  stone:               'Stone',
  granite:             'Granite',
  polished_granite:    'Polished Granite',
  diorite:             'Diorite',
  polished_diorite:    'Polished Diorite',
  andesite:            'Andesite',
  polished_andesite:   'Polished Andesite',
  grass_block:         'Grass Block',
  dirt:                'Dirt',
  coarse_dirt:         'Coarse Dirt',
  podzol:              'Podzol',
  cobblestone:         'Cobblestone',
  oak_planks:          'Oak Planks',
  spruce_planks:       'Spruce Planks',
  birch_planks:        'Birch Planks',
  jungle_planks:       'Jungle Planks',
  acacia_planks:       'Acacia Planks',
  dark_oak_planks:     'Dark Oak Planks',
  mangrove_planks:     'Mangrove Planks',
  cherry_planks:       'Cherry Planks',
  bedrock:             'Bedrock',
  sand:                'Sand',
  red_sand:            'Red Sand',
  gravel:              'Gravel',
  gold_ore:            'Gold Ore',
  deepslate_gold_ore:  'Deepslate Gold Ore',
  iron_ore:            'Iron Ore',
  deepslate_iron_ore:  'Deepslate Iron Ore',
  coal_ore:            'Coal Ore',
  deepslate_coal_ore:  'Deepslate Coal Ore',
  oak_log:             'Oak Log',
  spruce_log:          'Spruce Log',
  birch_log:           'Birch Log',
  jungle_log:          'Jungle Log',
  acacia_log:          'Acacia Log',
  dark_oak_log:        'Dark Oak Log',
  mangrove_log:        'Mangrove Log',
  cherry_log:          'Cherry Log',
  oak_leaves:          'Oak Leaves',
  spruce_leaves:       'Spruce Leaves',
  birch_leaves:        'Birch Leaves',
  jungle_leaves:       'Jungle Leaves',
  acacia_leaves:       'Acacia Leaves',
  dark_oak_leaves:     'Dark Oak Leaves',
  sponge:              'Sponge',
  wet_sponge:          'Wet Sponge',
  glass:               'Glass',
  lapis_ore:           'Lapis Ore',
  lapis_block:         'Lapis Block',
  sandstone:           'Sandstone',
  chiseled_sandstone:  'Chiseled Sandstone',
  cut_sandstone:       'Cut Sandstone',
  white_wool:          'White Wool',
  orange_wool:         'Orange Wool',
  magenta_wool:        'Magenta Wool',
  light_blue_wool:     'Light Blue Wool',
  yellow_wool:         'Yellow Wool',
  lime_wool:           'Lime Wool',
  pink_wool:           'Pink Wool',
  gray_wool:           'Gray Wool',
  light_gray_wool:     'Light Gray Wool',
  cyan_wool:           'Cyan Wool',
  purple_wool:         'Purple Wool',
  blue_wool:           'Blue Wool',
  brown_wool:          'Brown Wool',
  green_wool:          'Green Wool',
  red_wool:            'Red Wool',
  black_wool:          'Black Wool',
  gold_block:          'Gold Block',
  iron_block:          'Iron Block',
  bricks:              'Bricks',
  tnt:                 'TNT',
  bookshelf:           'Bookshelf',
  mossy_cobblestone:   'Mossy Cobblestone',
  obsidian:            'Obsidian',
  diamond_ore:         'Diamond Ore',
  diamond_block:       'Diamond Block',
  crafting_table:      'Crafting Table',
  furnace:             'Furnace',
  ice:                 'Ice',
  snow_block:          'Snow Block',
  clay:                'Clay',
  netherrack:          'Netherrack',
  soul_sand:           'Soul Sand',
  glowstone:           'Glowstone',
  stone_bricks:        'Stone Bricks',
  mossy_stone_bricks:  'Mossy Stone Bricks',
  cracked_stone_bricks:'Cracked Stone Bricks',
  nether_bricks:       'Nether Bricks',
  end_stone:           'End Stone',
  emerald_ore:         'Emerald Ore',
  emerald_block:       'Emerald Block',
  quartz_block:        'Quartz Block',
  terracotta:          'Terracotta',
  white_terracotta:    'White Terracotta',
  orange_terracotta:   'Orange Terracotta',
  magenta_terracotta:  'Magenta Terracotta',
  light_blue_terracotta: 'Light Blue Terracotta',
  yellow_terracotta:   'Yellow Terracotta',
  lime_terracotta:     'Lime Terracotta',
  pink_terracotta:     'Pink Terracotta',
  gray_terracotta:     'Gray Terracotta',
  light_gray_terracotta: 'Light Gray Terracotta',
  cyan_terracotta:     'Cyan Terracotta',
  purple_terracotta:   'Purple Terracotta',
  blue_terracotta:     'Blue Terracotta',
  brown_terracotta:    'Brown Terracotta',
  green_terracotta:    'Green Terracotta',
  red_terracotta:      'Red Terracotta',
  black_terracotta:    'Black Terracotta',
  prismarine:          'Prismarine',
  prismarine_bricks:   'Prismarine Bricks',
  dark_prismarine:     'Dark Prismarine',
  sea_lantern:         'Sea Lantern',
  hay_block:           'Hay Block',
  coal_block:          'Coal Block',
  packed_ice:          'Packed Ice',
  blue_ice:            'Blue Ice',
  magma_block:         'Magma Block',
  nether_wart_block:   'Nether Wart Block',
  bone_block:          'Bone Block',
  white_concrete:      'White Concrete',
  orange_concrete:     'Orange Concrete',
  magenta_concrete:    'Magenta Concrete',
  light_blue_concrete: 'Light Blue Concrete',
  yellow_concrete:     'Yellow Concrete',
  lime_concrete:       'Lime Concrete',
  pink_concrete:       'Pink Concrete',
  gray_concrete:       'Gray Concrete',
  light_gray_concrete: 'Light Gray Concrete',
  cyan_concrete:       'Cyan Concrete',
  purple_concrete:     'Purple Concrete',
  blue_concrete:       'Blue Concrete',
  brown_concrete:      'Brown Concrete',
  green_concrete:      'Green Concrete',
  red_concrete:        'Red Concrete',
  black_concrete:      'Black Concrete',
  deepslate:           'Deepslate',
  cobbled_deepslate:   'Cobbled Deepslate',
  polished_deepslate:  'Polished Deepslate',
  deepslate_bricks:    'Deepslate Bricks',
  deepslate_tiles:     'Deepslate Tiles',
}

// ─── Categories ───────────────────────────────────────────────

const CATEGORIES: Record<string, string> = {
  stone: 'natural', granite: 'natural', diorite: 'natural',
  andesite: 'natural', grass_block: 'natural', dirt: 'natural',
  coarse_dirt: 'natural', podzol: 'natural', sand: 'natural',
  red_sand: 'natural', gravel: 'natural', clay: 'natural',
  cobblestone: 'building', mossy_cobblestone: 'building',
  oak_planks: 'wood', spruce_planks: 'wood', birch_planks: 'wood',
  jungle_planks: 'wood', acacia_planks: 'wood', dark_oak_planks: 'wood',
  mangrove_planks: 'wood', cherry_planks: 'wood',
  oak_log: 'wood', spruce_log: 'wood', birch_log: 'wood',
  jungle_log: 'wood', acacia_log: 'wood', dark_oak_log: 'wood',
  oak_leaves: 'leaves', spruce_leaves: 'leaves', birch_leaves: 'leaves',
  jungle_leaves: 'leaves', acacia_leaves: 'leaves', dark_oak_leaves: 'leaves',
  gold_ore: 'ore', iron_ore: 'ore', coal_ore: 'ore', diamond_ore: 'ore',
  emerald_ore: 'ore', lapis_ore: 'ore', deepslate_gold_ore: 'ore',
  deepslate_iron_ore: 'ore', deepslate_coal_ore: 'ore',
  gold_block: 'ore_block', iron_block: 'ore_block', diamond_block: 'ore_block',
  emerald_block: 'ore_block', lapis_block: 'ore_block', coal_block: 'ore_block',
  white_wool: 'wool', orange_wool: 'wool', magenta_wool: 'wool',
  light_blue_wool: 'wool', yellow_wool: 'wool', lime_wool: 'wool',
  pink_wool: 'wool', gray_wool: 'wool', light_gray_wool: 'wool',
  cyan_wool: 'wool', purple_wool: 'wool', blue_wool: 'wool',
  brown_wool: 'wool', green_wool: 'wool', red_wool: 'wool', black_wool: 'wool',
  white_terracotta: 'terracotta', orange_terracotta: 'terracotta',
  magenta_terracotta: 'terracotta', light_blue_terracotta: 'terracotta',
  yellow_terracotta: 'terracotta', lime_terracotta: 'terracotta',
  pink_terracotta: 'terracotta', gray_terracotta: 'terracotta',
  light_gray_terracotta: 'terracotta', cyan_terracotta: 'terracotta',
  purple_terracotta: 'terracotta', blue_terracotta: 'terracotta',
  brown_terracotta: 'terracotta', green_terracotta: 'terracotta',
  red_terracotta: 'terracotta', black_terracotta: 'terracotta',
  terracotta: 'terracotta',
  white_concrete: 'concrete', orange_concrete: 'concrete',
  magenta_concrete: 'concrete', light_blue_concrete: 'concrete',
  yellow_concrete: 'concrete', lime_concrete: 'concrete',
  pink_concrete: 'concrete', gray_concrete: 'concrete',
  light_gray_concrete: 'concrete', cyan_concrete: 'concrete',
  purple_concrete: 'concrete', blue_concrete: 'concrete',
  brown_concrete: 'concrete', green_concrete: 'concrete',
  red_concrete: 'concrete', black_concrete: 'concrete',
  stone_bricks: 'building', mossy_stone_bricks: 'building',
  cracked_stone_bricks: 'building', sandstone: 'building',
  bricks: 'building', nether_bricks: 'building',
  deepslate: 'building', cobbled_deepslate: 'building',
  polished_deepslate: 'building', deepslate_bricks: 'building',
  deepslate_tiles: 'building',
  glowstone: 'light', sea_lantern: 'light', magma_block: 'light',
  glass: 'transparent', ice: 'transparent', packed_ice: 'transparent',
  blue_ice: 'transparent',
  netherrack: 'nether', soul_sand: 'nether', nether_wart_block: 'nether',
  end_stone: 'end',
  bedrock: 'special', tnt: 'special', obsidian: 'special',
  crafting_table: 'utility', furnace: 'utility', bookshelf: 'utility',
}

function getCategory(blockId: string): string {
  const name = blockId.replace('minecraft:', '')
  return CATEGORIES[name] ?? 'other'
}

function getDisplayName(blockId: string): string {
  const name = blockId.replace('minecraft:', '')
  if (DISPLAY_NAMES[name]) return DISPLAY_NAMES[name]
  // Auto-format: "oak_planks" → "Oak Planks"
  return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Aggregate blocks[] into a sorted MaterialEntry[].
 * Sorted by count descending.
 */
export function buildMaterialList(blocks: BlockEntry[]): MaterialEntry[] {
  const counts = new Map<string, number>()
  for (const b of blocks) {
    counts.set(b.blockId, (counts.get(b.blockId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([blockId, count]) => ({
      blockId,
      displayName: getDisplayName(blockId),
      count,
      category: getCategory(blockId),
    }))
    .sort((a, b) => b.count - a.count)
}

/** All unique categories present in a material list */
export function getCategories(list: MaterialEntry[]): string[] {
  return [...new Set(list.map(e => e.category))].sort()
}
