import json
import sys
from pathlib import Path

import mcschematic
import requests

from blockme.constants import REQUIRED_SETTINGS_KEYS, DEFAULT_SETTINGS
from blockme.convert import convert_to_schematic_from_positions
from blockme.logger import logger
from blockme.mapping import load_mapping_positions
from blockme.palette import Palette
from blockme.skin_fetch import get_skin_image_from_username
from blockme.utils import format_stacks

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
ASSETS = ROOT / "assets"
OUT_DIR = ROOT / "out"


def load_and_validate_settings(settings_path):
    """
    Load and validate settings.json with required keys.

    Args:
        settings_path: Path to settings.json file

    Returns:
        dict: Validated settings with defaults applied

    Raises:
        FileNotFoundError: If settings file doesn't exist
        ValueError: If settings are invalid or missing required keys
    """
    if not settings_path.exists():
        logger.error(f"Settings file not found: {settings_path}")
        raise FileNotFoundError(
            f"Settings file not found: {settings_path}\n"
            f"Please create a settings.json file or copy from settings.default.json"
        )

    try:
        with open(settings_path, encoding="utf-8") as f:
            settings = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in settings file: {e}")
        raise ValueError(f"Invalid JSON in settings file: {e}")

    # Validate required keys
    missing_keys = [key for key in REQUIRED_SETTINGS_KEYS if key not in settings]
    if missing_keys:
        logger.error(f"Missing required settings keys: {missing_keys}")
        raise ValueError(f"Missing required settings keys: {missing_keys}")

    # Apply defaults for optional keys
    for key, default_value in DEFAULT_SETTINGS.items():
        if key not in settings:
            settings[key] = default_value
            logger.debug(f"Using default value for '{key}': {default_value}")

    # Validate version
    try:
        mcschematic.Version[settings["version"]]
    except KeyError:
        valid_versions = list(mcschematic.Version.__members__.keys())
        logger.error(f"Invalid Minecraft version: {settings['version']}")
        raise ValueError(
            f"Invalid Minecraft version: {settings['version']}. "
            f"Valid versions: {', '.join(valid_versions)}"
        )

    logger.info("Settings loaded and validated successfully")
    return settings


# Load and validate settings
try:
    settings = load_and_validate_settings(DATA / "settings.json")
except (FileNotFoundError, ValueError) as e:
    logger.critical(f"Failed to load settings: {e}")
    sys.exit(1)

username = input("Minecraft username: ")

# Fetch skin with specific error handling
try:
    skin = get_skin_image_from_username(username)
except ValueError as e:
    # User-related errors (invalid username, player not found, empty input, invalid dimensions)
    logger.error(f"User error: {e}")
    sys.exit(1)
except requests.RequestException as e:
    # Network-related errors (timeout, connection error, API down)
    logger.error(f"Network error: {e}. Please check your internet connection and try again.")
    sys.exit(1)
except KeyError as e:
    # API response format errors
    logger.error(f"Unexpected API response format: {e}")
    sys.exit(1)
except Exception as e:
    # Unexpected errors
    logger.exception(f"Unexpected error fetching skin: {e}")
    sys.exit(1)

# Display theme info if specified
theme = settings.get("theme")
if theme and theme != "none":
    logger.info(f"Using '{theme}' block palette")

# Load mapping and palette
try:
    mapping = load_mapping_positions(ASSETS / "mapping_4px.png")
    palette = Palette(
        DATA / "blocks.json",
        DATA / "blocktypes.json",
        settings,
        DATA / "palettes.json"
    )
except FileNotFoundError as e:
    logger.error(f"Required file not found: {e}")
    sys.exit(1)
except Exception as e:
    logger.exception(f"Error loading resources: {e}")
    sys.exit(1)

# Convert to schematic
try:
    schem, counts = convert_to_schematic_from_positions(skin, mapping, palette)
except ValueError as e:
    logger.error(f"Conversion error: {e}")
    sys.exit(1)
except Exception as e:
    logger.exception(f"Unexpected error during conversion: {e}")
    sys.exit(1)

# Save output files
try:
    save_loc = Path(settings.get("save_location") or OUT_DIR)
    save_loc.mkdir(parents=True, exist_ok=True)

    schem.save(str(save_loc), username, mcschematic.Version[settings["version"]])
    logger.info(f"Schematic saved to {save_loc}/{username}.schematic")

    materials_file = save_loc / f"{username}_materials.txt"
    with open(materials_file, "w", encoding="utf-8") as f:
        for block, amount in counts.most_common():
            f.write(f"{block}: {amount} ({format_stacks(amount)})\n")
    logger.info(f"Material list saved to {materials_file}")

    logger.info("Conversion completed successfully")
except Exception as e:
    logger.exception(f"Error saving output files: {e}")
    sys.exit(1)