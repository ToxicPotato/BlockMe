import json
import mcschematic
from blockme.skin_fetch import get_skin_image_from_username
from blockme.mapping import load_mapping_positions
from blockme.palette import Palette
from blockme.convert import convert_to_schematic_from_positions
from blockme.utils import format_stacks
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
ASSETS = ROOT / "assets"
OUT_DIR = ROOT / "out"

with open(DATA / "settings.json", encoding="utf-8") as f:
    settings = json.load(f)

username = input("Minecraft username: ")

try:
    skin = get_skin_image_from_username(username)
except Exception as e:
    print("Not able to fetch skin:", e)
    exit(1)

# Display theme info if specified
theme = settings.get("theme")
if theme and theme != "none":
    print(f"Using '{theme}' block palette...")

mapping = load_mapping_positions(ASSETS / "mapping_4px.png")

palette = Palette(
    DATA / "blocks.json", 
    DATA / "blocktypes.json", 
    settings,
    DATA / "palettes.json"
)

schem, counts = convert_to_schematic_from_positions(skin, mapping, palette)

save_loc = Path(settings.get("save_location") or OUT_DIR)
save_loc.mkdir(parents=True, exist_ok=True)

schem.save(str(save_loc), username, mcschematic.Version[settings["version"]])
print(f"Schematic saved to {save_loc}/{username}.schematic")

with open(f"{save_loc}/{username}_materials.txt", "w", encoding="utf-8") as f:
    for block, amount in counts.most_common():
        f.write(f"{block}: {amount} ({format_stacks(amount)})\n")
print(f"Material list saved to {save_loc}/{username}_materials.txt")