import json
import mcschematic
from blockme.skin_fetch import getSkinImageFromUsername
from blockme.mapping import load_mapping_positions
from blockme.palette import Palette
from blockme.convert import convert_to_schematic_from_positions
from blockme.image_modes import grayscale
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
ASSETS = ROOT / "assets"
OUT_DIR = ROOT / "out"


def format_stacks(n):
    stacks = n // 64
    rest = n % 64
    if stacks == 0:
        return f"{rest}"
    if rest == 0:
        return f"{stacks}x64"
    return f"{stacks}x64 + {rest}"


with open(DATA / "settings.json", encoding="utf-8") as f:
    settings = json.load(f)

username = input("Minecraft username: ")

try:
    skin = getSkinImageFromUsername(username)
except Exception as e:
    print("Not able to fetch skin:", e)
    exit(1)

if settings.get("grayscale"):
    skin = grayscale(skin)

mapping = load_mapping_positions(ASSETS / "mapping_4px.png")

palette = Palette(DATA / "blocks.json", DATA / "blocktypes.json", settings)

schem, counts = convert_to_schematic_from_positions(skin, mapping, palette)

save_loc = Path(settings.get("save_location") or OUT_DIR)
save_loc.mkdir(parents=True, exist_ok=True)

schem.save(str(save_loc), username, mcschematic.Version[settings["version"]])
print(f"Schematic saved to {save_loc}/{username}.schematic")

with open(f"{save_loc}/{username}_materials.txt", "w", encoding="utf-8") as f:
    for block, amount in counts.most_common():
        f.write(f"{block}: {amount} ({format_stacks(amount)})\n")
print(f"Material list saved to {save_loc}/{username}_materials.txt")
