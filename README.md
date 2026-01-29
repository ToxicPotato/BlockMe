# BlockMe

Convert Minecraft player skins into 3D block statues that can be imported into Minecraft!

BlockMe downloads a player's skin, converts it pixel-by-pixel into colored blocks, and exports it as a `.schem` file compatible with WorldEdit and Litematica. A materials list is also generated showing exactly which blocks you need and in what quantities.

---

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/ToxicPotato/BlockMe.git
   cd BlockMe
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up configuration**

   ```bash
   cp data/settings.default.json data/settings.json
   ```

   Edit `data/settings.json` to set your Minecraft version and preferences.

4. **Run the program**
   ```bash
   python main.py
   ```

---

## Usage

When you run the program, you'll be prompted to enter a Minecraft username:

```bash
$ python main.py
Minecraft username: Notch
2026-01-29 12:00:00 - blockme - INFO - Fetching skin for user: Notch
2026-01-29 12:00:01 - blockme - INFO - Successfully fetched skin for user: Notch
2026-01-29 12:00:01 - blockme - INFO - Converting skin to schematic...
2026-01-29 12:00:02 - blockme - INFO - Schematic saved to out/Notch.schematic
```

The program will:

1. Download the player's skin from Mojang servers
2. Convert it to a 3D block statue
3. Generate files in the `out/` directory:
   - `<username>.schem` - The 3D structure
   - `<username>_materials.txt` - List of required blocks

---

## Configuration

### Block Palettes (Themes)

You can use predefined block palettes by setting the `theme` in `settings.json`:

```json
{
  "version": "JE_1_20_4",
  "theme": "stone"
}
```

**Available themes:**

- `stone` - Light gray blocks only (smooth stone, andesite, etc.)
- `wood` - Various wood types
- `colorful` - Concrete and terracotta blocks
- `wool` - All wool colors
- `terracotta` - Terracotta variants
- `natural` - Natural blocks (grass, dirt, logs, etc.)
- `nether` - Nether-themed blocks
- `ores` - Ore blocks
- `quartz` - Quartz variants
- `ocean` - Ocean-themed blocks (prismarine, ice, etc.)
- `none` - Use all available blocks (default)

### Settings Reference

**Required:**

- `version` - Minecraft version (e.g., `"JE_1_20_4"`)

**Optional:**

- `theme` - Block palette theme (default: `"none"`)
- `blocks_enabled` - Enable/disable specific block categories
- `save_location` - Custom output directory (default: `"out/"`)

---

## Features

- ✅ Automatic skin downloading from Minecraft username
- ✅ Customizable block palettes (10 predefined themes)
- ✅ Falling block detection and automatic replacement
- ✅ Material list with Minecraft stack notation (e.g., "3x64 + 12")
- ✅ Support for multiple Minecraft versions

---

## How It Works

1. The user provides a Minecraft username
2. The skin is downloaded via the Ashcon API
3. The skin is processed pixel by pixel
4. A mapping file (`mapping_4px.png`) translates 2D pixels into 3D coordinates
5. Each pixel color is matched to the closest available block color
6. Falling blocks are replaced with non-falling alternatives when unsupported
7. The result is exported as:
   - A `.schem` file
   - A materials list (`_materials.txt`)

---

## Project Structure

```
BlockMe/
├── main.py                 # Entry point
├── blockme/                # Core package
│   ├── __init__.py        # Package exports
│   ├── constants.py       # Global constants
│   ├── logger.py          # Logging configuration
│   ├── utils.py           # Utility functions
│   ├── skin_fetch.py      # Skin downloading
│   ├── mapping.py         # Coordinate mapping
│   ├── palette.py         # Block color matching
│   └── convert.py         # Schematic generation
├── data/
│   ├── settings.json      # User configuration
│   ├── settings.default.json
│   ├── blocks.json        # Block color definitions
│   ├── blocktypes.json    # Block categories
│   └── palettes.json      # Theme definitions
├── assets/
│   └── mapping_4px.png    # 3D coordinate mapping
├── out/                   # Output directory
├── requirements.txt       # Dependencies
└── pyproject.toml         # Package metadata
```

### Key Modules

#### `main.py`

Entry point that orchestrates the entire conversion process. Handles user input, loads configuration, coordinates modules, and manages the conversion workflow.

#### `blockme/convert.py`

Core conversion logic that transforms skin images into block structures. Handles pixel iteration, 3D positioning, color matching, falling block replacement, and material tracking.

#### `blockme/palette.py`

Manages block color palettes and color matching. Loads block data, supports theme-based filtering, computes color distances using Manhattan distance, and finds the best matching blocks.

#### `blockme/skin_fetch.py`

Downloads Minecraft skins via the Ashcon API. Validates skin dimensions (64x64), handles API errors, and returns PIL Image objects.

#### `blockme/mapping.py`

Interprets the mapping image that encodes 2D-to-3D coordinate transformations. Reads PNG files where RGB values represent (x, y, z) coordinates.

#### `blockme/logger.py`

Centralized logging with configurable levels, console output, optional file logging, and formatted timestamps.

#### `blockme/constants.py`

Global constants including Minecraft parameters (stack size, block names), image processing values, API configuration, and default settings.

#### `blockme/utils.py`

Utility functions like `format_stacks()` which converts block counts to Minecraft stack notation.

---

## Output Files

### `<username>.schematic`

The 3D block structure that can be imported into Minecraft using:

- **WorldEdit** - `/schem load <username>`
- **Litematica** - Load through the schematic browser

### `<username>_materials.txt`

A sorted list of required blocks with quantities in stack notation:

```
minecraft:stone: 256 (4x64)
minecraft:oak_planks: 128 (2x64)
minecraft:glass: 42 (42)
```

---

## Limitations and Notes

- Transparent skin pixels are ignored and not converted to blocks
- Color matching uses Manhattan distance (RGBA) rather than perceptual color space
- Falling blocks (sand, gravel, concrete powder) are automatically replaced with similar non-falling blocks when they lack support
- The `mapping_4px.png` file completely defines the statue geometry and shape
- Skin format must be 64x64 pixels (standard Minecraft format)

---

## Dependencies

- **mcschematic** (11.4.3) - Minecraft schematic file generation
- **Pillow** (10.1.0) - Image processing and manipulation
- **requests** (2.31.0) - HTTP requests for skin downloading

See `requirements.txt` for complete dependency list.

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## Credits

This project is based on and extended from [`AxoSpyeyes/skin2sta2`](https://github.com/AxoSpyeyes/skin2sta2).

---

## License

MIT License - See LICENSE file for details.
