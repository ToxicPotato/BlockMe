import json

class Palette:
    def __init__(self, blocks_file, blocktypes_file, settings, palettes_file=None):
        with open(blocks_file, "r", encoding="utf-8") as f:
            self.all_blocks = json.load(f)

        with open(blocktypes_file, "r", encoding="utf-8") as f:
            self.blocktypes = json.load(f)

        # Load predefined palettes if file exists
        self.predefined_palettes = {}
        if palettes_file:
            try:
                with open(palettes_file, "r", encoding="utf-8") as f:
                    self.predefined_palettes = json.load(f)
            except FileNotFoundError:
                raise FileNotFoundError(f"Palette file not found: {palettes_file}")


        self.settings = settings
        self.blocks = self.all_blocks.copy()
        self.apply_settings(settings)

    def filter_blocks_by_palette(self, palette_blocks):
        """Filter blocks to only include those in the palette list"""
        if not palette_blocks:
            return self.all_blocks.copy()
        
        palette_set = set(palette_blocks)
        filtered = [b for b in self.all_blocks if b["block"] in palette_set]
        
        return filtered if filtered else self.all_blocks.copy()

    def apply_settings(self, settings):
        disabled = set()

        # Disable specific block types
        for key, enabled in settings.get("blocks_enabled", {}).items():
            if not enabled:
                disabled.update(self.blocktypes.get(key, []))

        # Check for custom palette or theme palette
        theme = settings.get("theme", "none")
        
        # Priority: custom_palette > predefined palette for theme > all blocks
        if "custom_palette" in settings and settings["custom_palette"]:
            # User provided custom palette in settings
            self.blocks = self.filter_blocks_by_palette(settings["custom_palette"])
        elif theme != "none" and theme in self.predefined_palettes:
            # Use predefined palette for the theme
            self.blocks = self.filter_blocks_by_palette(self.predefined_palettes[theme])
        else:
            # Use all blocks
            self.blocks = self.all_blocks.copy()
        
        # Remove disabled blocks
        self.blocks = [
            b for b in self.blocks
            if b["block"] not in disabled
        ]

    def get_falling_blocks(self):
        """Return list of falling block names"""
        return self.blocktypes.get("falling_blocks", [])

    def color_distance(self, c1, c2):
        return sum(abs(c1[i] - c2[i]) for i in range(4))

    def find_block(self, rgba, exclude_falling=False):
        """Find best matching block, optionally excluding falling blocks"""
        best = None
        best_diff = float("inf")
        
        falling_blocks = set(self.get_falling_blocks()) if exclude_falling else set()

        for b in self.blocks:
            # Skip falling blocks if requested
            if exclude_falling and b["block"] in falling_blocks:
                continue
                
            diff = self.color_distance(rgba, b["color"])
            if diff < best_diff:
                best = b["block"]
                best_diff = diff

        return best