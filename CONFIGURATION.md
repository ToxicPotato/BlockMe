# Configuration Guide

## Settings File (`data/settings.json`)

### Required Settings

#### `version`
The Minecraft version to use when saving the schematic.

**Example:**
```json
{
  "version": "JE_1_21_1"
}
```

**Valid versions:** Check `mcschematic.Version` for all available versions (e.g., `JE_1_20_4`, `JE_1_21_1`, etc.)

---

## Optional Settings

### `theme`
Select a predefined block palette theme.

**Default:** `"none"` (use all available blocks)

**Available themes:**
- `stone` - Light gray blocks only (smooth stone, andesite, polished andesite, etc.)
- `wood` - Various wood types
- `colorful` - Concrete and terracotta blocks
- `wool` - All wool colors
- `terracotta` - Terracotta variants
- `natural` - Natural blocks (grass, dirt, logs, stone, etc.)
- `nether` - Nether-themed blocks (netherrack, nether bricks, etc.)
- `ores` - Ore blocks (iron, gold, diamond, etc.)
- `quartz` - Quartz variants
- `ocean` - Ocean-themed blocks (prismarine, ice, sea lantern, etc.)
- `none` - Use all available blocks

**Example:**
```json
{
  "version": "JE_1_21_1",
  "theme": "stone"
}
```

---

### `blocks_enabled`
Enable or disable specific block categories.

**Default:** All categories enabled (except `unobtainable_survival` which defaults to disabled)

**Available categories:**

#### `expensive_blocks`
Valuable blocks that are costly to obtain in survival mode.
- **Includes:** diamond_block, netherite_block, emerald_block, gold_block, iron_block, etc.
- **Use case:** Disable if you want an affordable build

#### `rare_blocks`
Blocks that are difficult to obtain but not necessarily expensive.
- **Includes:** ancient_debris, beacon, sea_lantern, prismarine, end_stone, purpur_block, sculk variants, etc.
- **Use case:** Disable if you want commonly available blocks only

#### `unobtainable_survival`
Blocks that cannot be obtained in survival mode.
- **Includes:** bedrock, barrier, command_block, structure_void, spawner, reinforced_deepslate, etc.
- **Use case:** Keep disabled (default) unless you're building in creative mode

**Example - Budget-Friendly Build:**
```json
{
  "version": "JE_1_21_1",
  "theme": "none",
  "blocks_enabled": {
    "expensive_blocks": false,
    "rare_blocks": false,
    "unobtainable_survival": false
  }
}
```

**Example - Creative Mode (All Blocks):**
```json
{
  "version": "JE_1_21_1",
  "theme": "none",
  "blocks_enabled": {
    "expensive_blocks": true,
    "rare_blocks": true,
    "unobtainable_survival": true
  }
}
```

**Example - Survival-Friendly with Common Blocks:**
```json
{
  "version": "JE_1_21_1",
  "theme": "colorful",
  "blocks_enabled": {
    "expensive_blocks": true,
    "rare_blocks": false,
    "unobtainable_survival": false
  }
}
```

---

### `save_location`
Custom output directory for generated files.

**Default:** `"out"`

**Example:**
```json
{
  "version": "JE_1_21_1",
  "save_location": "C:/Users/YourName/Desktop/Schematics"
}
```

---

## Complete Configuration Examples

### Example 1: Default Settings
```json
{
  "version": "JE_1_21_1",
  "theme": "none",
  "blocks_enabled": {
    "expensive_blocks": true,
    "rare_blocks": true,
    "unobtainable_survival": false
  },
  "save_location": "out"
}
```

### Example 2: Budget Survival Build
```json
{
  "version": "JE_1_20_4",
  "theme": "colorful",
  "blocks_enabled": {
    "expensive_blocks": false,
    "rare_blocks": false,
    "unobtainable_survival": false
  },
  "save_location": "out"
}
```

### Example 3: Stone Theme, No Rare Blocks
```json
{
  "version": "JE_1_21_1",
  "theme": "stone",
  "blocks_enabled": {
    "expensive_blocks": true,
    "rare_blocks": false,
    "unobtainable_survival": false
  },
  "save_location": "out/stone_builds"
}
```

### Example 4: Creative Mode, All Blocks
```json
{
  "version": "JE_1_21_1",
  "theme": "none",
  "blocks_enabled": {
    "expensive_blocks": true,
    "rare_blocks": true,
    "unobtainable_survival": true
  },
  "save_location": "out"
}
```

---

## Block Categories Reference

### `expensive_blocks`
- diamond_block
- netherite_block
- emerald_block
- gold_block
- lapis_block
- redstone_block
- iron_block
- coal_block
- copper_block (and variants)

### `rare_blocks`
- ancient_debris
- beacon
- sea_lantern
- prismarine (and variants)
- end_stone
- purpur_block, purpur_pillar
- chorus_plant, chorus_flower
- dragon_egg
- sponge, wet_sponge
- slime_block, honey_block
- sculk (all variants)

### `unobtainable_survival`
- bedrock
- barrier
- command_block (all types)
- structure_void
- structure_block
- jigsaw
- light
- spawner
- reinforced_deepslate

See `data/blocktypes.json` for the complete list of blocks in each category.
