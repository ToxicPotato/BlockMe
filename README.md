# BlockMe

## Project Description

BlockMe is a Python-based tool that converts a Minecraft skin into a three-dimensional block statue and exports the result as a `.schem` file. This file can then be imported into Minecraft using tools such as WorldEdit or litmatica. In addition, a materials list is generated showing which blocks are used and in what quantities.

The project is intended as an experimental and practical utility for visualizing Minecraft skins in block form. It focuses on simple configuration, reusable palettes, and a clear separation between data, logic, and the conversion pipeline.

---

## Overall Workflow

1. The user provides a Minecraft username
2. The skin is downloaded via an external API
3. The skin is processed pixel by pixel
4. A mapping file translates 2D pixels into 3D coordinates
5. Each pixel color is matched to the closest available block color
6. The result is exported as:
   - a `.schem` file
   - a materials list (`_materials.txt`)

---

## Project Structure and Files

### Root Directory

#### `main.py`

The main entry point of the program. Responsible for:

- Reading user input (Minecraft username)
- Loading configuration from `settings.json`
- Initializing and running the conversion process
- Coordinating the interaction between modules

#### `convert.py`

Contains the core logic for converting image data into a block structure.

- Iterates over skin pixels
- Uses mapping data to determine 3D positions
- Matches colors to blocks
- Builds the schematic structure
- Tracks and logs material usage

---

### `data/`

Contains configuration files and block metadata.

#### `settings.json`

Active configuration file used at runtime.
Typical options include:

- Minecraft version used when saving the schematic
- Enabled or disabled block type categories
- Output directory

#### `settings.default.json`

Default configuration template. Intended as a reference or fallback.

#### `blocks.json`

Defines available Minecraft blocks along with their RGBA color values.
Used during color matching to find the closest block color.

#### `blocktypes.json`

Defines block categories (for example falling blocks).
These categories can be enabled or disabled via `settings.json`.

---

### `assets/`

#### `mapping_4px.png`

A specially designed mapping image that translates 2D skin pixels into 3D coordinates.

- Transparent pixels are ignored
- RGB values encode a position in 3D space
- The pixel index determines which part of the skin is used

This file fully defines the geometric structure of the generated statue.

---

### Additional Modules

#### `palette.py`

Handles block color palettes.

- Loads block colors from `blocks.json`
- Computes color differences
- Returns the closest matching block

#### `mapping.py`

Loads and interprets the mapping image.

- Reads pixel data
- Converts encoded RGB values into coordinates

#### `image_modes.py`

Provides image processing utilities.

- Grayscale conversion
- Extension point for alternative image modes

#### `skin_fetch.py`

Responsible for downloading Minecraft skins.

- Uses an external API based on username
- Returns a processed image object

---

## Output

After execution, the following files are generated:

- `<username>.schematic`
- `<username>_materials.txt`

The materials list is sorted by most-used blocks and formats counts into stack-based notation (64-stacks).

---

## Dependencies

See `requirements.txt`. The project primarily relies on:

- Pillow (image processing)
- requests (HTTP / API access)
- mcschematic (schematic generation)

---

## Limitations and Notes

- Transparent skin pixels are ignored
- Color matching uses a simple RGBA distance (not perceptual)
- Falling blocks may collapse in survival mode
- The mapping image completely defines the statue geometry

---

## Possible Improvements

- Command-line arguments instead of `input()`
- Multiple mapping files (different resolutions or styles)
- Improved color matching (LAB / perceptual distance)
- Support for multiple Minecraft versions

---

## Credits

This project is based on and extended from `AxoSpyeyes/skin2sta2`.
