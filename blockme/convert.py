from collections import Counter

import mcschematic

from blockme.constants import (
    ALPHA_CHANNEL_INDEX,
    TRANSPARENT_ALPHA,
    SUPPORT_CHECK_OFFSET,
    MINECRAFT_AIR_BLOCK
)
from blockme.logger import logger


def convert_to_schematic_from_positions(skin_img, mapping_positions, palette):
    """
    Convert a skin image to a Minecraft schematic using position mappings.

    Args:
        skin_img: PIL Image in RGBA format containing the Minecraft skin
        mapping_positions: List of tuples (pixel_index, (x, y, z)) mapping pixels to 3D coordinates
        palette: Palette instance for color-to-block matching

    Returns:
        tuple: (MCSchematic object, Counter of block usage)

    Raises:
        ValueError: If no blocks are available in the palette or array bounds exceeded
        IndexError: If mapping index is out of bounds for the skin image
    """
    schem = mcschematic.MCSchematic()
    counts = Counter()

    image_val = list(skin_img.getdata())
    image_size = len(image_val)

    logger.info(f"Converting skin to schematic: {len(mapping_positions)} positions to process")
    logger.debug(f"Image has {image_size} pixels")

    # Get list of falling blocks from palette
    falling_blocks = set(palette.get_falling_blocks())

    processed = 0
    skipped_transparent = 0
    skipped_oob = 0

    for idx, (x, y, z) in mapping_positions:
        # Validate array bounds
        if idx < 0 or idx >= image_size:
            logger.warning(
                f"Mapping index {idx} out of bounds (image has {image_size} pixels). "
                f"Position ({x}, {y}, {z}) will be skipped."
            )
            skipped_oob += 1
            continue

        rgba = image_val[idx]
        # Skip transparent pixels
        if rgba[ALPHA_CHANNEL_INDEX] == TRANSPARENT_ALPHA:
            skipped_transparent += 1
            continue

        block = palette.find_block(rgba)

        # Ensure we got a valid block
        if block is None:
            logger.error(f"No blocks available in palette for color {rgba}")
            raise ValueError(f"No blocks available in palette for color {rgba}")

        # Check if this is a falling block
        if block in falling_blocks:
            # Check if there's a block below to support it
            try:
                block_below = schem.getBlockStateAt((x, y + SUPPORT_CHECK_OFFSET, z))
                # If no block below (returns "minecraft:air" or None), find non-falling alternative
                if block_below is None or block_below == MINECRAFT_AIR_BLOCK:
                    # Get a similar colored non-falling block
                    block = palette.find_block(rgba, exclude_falling=True)
                    if block is None:
                        logger.error(f"No non-falling blocks available for color {rgba}")
                        raise ValueError(f"No non-falling blocks available for color {rgba}")
            except (IndexError, KeyError, AttributeError) as e:
                # If we can't check below (out of bounds or schematic error), use non-falling block
                logger.debug(f"Cannot check block below at ({x}, {y}, {z}): {e}")
                block = palette.find_block(rgba, exclude_falling=True)
                if block is None:
                    logger.error(f"No non-falling blocks available for color {rgba}")
                    raise ValueError(f"No non-falling blocks available for color {rgba}")

        schem.setBlock((x, y, z), block)
        counts[block] += 1
        processed += 1

    logger.info(
        f"Conversion complete: {processed} blocks placed, "
        f"{skipped_transparent} transparent pixels skipped, "
        f"{skipped_oob} out-of-bounds positions skipped"
    )

    return schem, counts