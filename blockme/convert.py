import mcschematic
from collections import Counter

def convert_to_schematic_from_positions(skin_img, mapping_positions, palette):
    schem = mcschematic.MCSchematic()
    counts = Counter()

    image_val = list(skin_img.getdata())
    
    # Get list of falling blocks from palette
    falling_blocks = set(palette.get_falling_blocks())

    for idx, (x, y, z) in mapping_positions:
        rgba = image_val[idx]
        if rgba[3] == 0:
            continue

        block = palette.find_block(rgba)
        
        # Check if this is a falling block
        if block in falling_blocks:
            # Check if there's a block below to support it
            try:
                block_below = schem.getBlockAt((x, y - 1, z))
                # If no block below (returns "minecraft:air" or None), find non-falling alternative
                if block_below is None or block_below == "minecraft:air":
                    # Get a similar colored non-falling block
                    block = palette.find_block(rgba, exclude_falling=True)
            except:
                # If we can't check below, play it safe and use non-falling block
                block = palette.find_block(rgba, exclude_falling=True)
        
        schem.setBlock((x, y, z), block)
        counts[block] += 1

    return schem, counts