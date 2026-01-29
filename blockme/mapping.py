from PIL import Image
import os

def load_mapping_positions(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Fant ikke mapping: {path}")

    img = Image.open(path).convert("RGBA")
    map_val = list(img.getdata())

    positions = []
    for idx, (r, g, b, a) in enumerate(map_val):
        if a == 0:
            continue
        positions.append((idx, (r, g, b)))

    return positions
