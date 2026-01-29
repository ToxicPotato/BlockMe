import mcschematic
from collections import Counter

def convert_to_schematic_from_positions(skin_img, mapping_positions, palette):
    schem = mcschematic.MCSchematic()
    counts = Counter()

    image_val = list(skin_img.getdata())

    for idx, (x, y, z) in mapping_positions:
        rgba = image_val[idx]
        if rgba[3] == 0:
            continue

        block = palette.find_block(rgba)
        schem.setBlock((x, y, z), block)
        counts[block] += 1

    return schem, counts
