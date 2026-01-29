from pathlib import Path

from PIL import Image

from blockme.constants import IMAGE_MODE_RGBA, TRANSPARENT_ALPHA
from blockme.logger import logger


def load_mapping_positions(path):
    """
    Load pixel-to-3D-coordinate mappings from a mapping image file.

    The mapping file uses RGB values to encode 3D coordinates where:
    - R = X coordinate
    - G = Y coordinate
    - B = Z coordinate
    - Alpha = 0 means skip this pixel

    Args:
        path: File path to the mapping image (PNG with RGBA format, str or Path)

    Returns:
        List of tuples: (pixel_index, (x, y, z)) for each non-transparent pixel

    Raises:
        FileNotFoundError: If the mapping file doesn't exist
    """
    logger.info(f"Loading mapping positions from: {path}")

    path = Path(path)
    if not path.exists():
        logger.error(f"Mapping file not found: {path}")
        raise FileNotFoundError(f"Mapping file not found: {path}")

    img = Image.open(path).convert(IMAGE_MODE_RGBA)
    map_val = list(img.getdata())

    logger.debug(f"Mapping image size: {img.size}, total pixels: {len(map_val)}")

    positions = []
    for idx, (r, g, b, a) in enumerate(map_val):
        if a == TRANSPARENT_ALPHA:
            continue
        positions.append((idx, (r, g, b)))

    logger.info(f"Loaded {len(positions)} mapping positions")
    return positions
