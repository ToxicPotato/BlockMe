import json
from blockme.logger import logger


class Palette:
    """
    Manages block color palettes and finds best matching blocks for given colors.

    Supports filtering blocks by type, custom palettes, and theme-based palettes.
    """

    def __init__(self, blocks_file, blocktypes_file, settings, palettes_file=None):
        """
        Initialize the palette with block data and settings.

        Args:
            blocks_file: Path to JSON file containing block color data
            blocktypes_file: Path to JSON file containing block type categories
            settings: Dictionary with palette settings (theme, custom_palette, blocks_enabled)
            palettes_file: Optional path to JSON file with predefined theme palettes

        Raises:
            FileNotFoundError: If palettes_file is specified but doesn't exist
        """
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
        """
        Filter blocks to only include those in the palette list.

        Args:
            palette_blocks: List of block names to allow

        Returns:
            List of block dictionaries matching the palette

        Raises:
            ValueError: If palette is specified but results in no blocks
        """
        if not palette_blocks:
            return self.all_blocks.copy()

        palette_set = set(palette_blocks)
        filtered = [b for b in self.all_blocks if b["block"] in palette_set]

        if not filtered:
            logger.error(f"Palette filter resulted in no blocks. Requested: {palette_blocks[:5]}...")
            raise ValueError(
                f"Palette contains no valid blocks. "
                f"Check that block names in palette match blocks.json"
            )

        logger.debug(f"Filtered palette: {len(filtered)} blocks available")
        return filtered

    def apply_settings(self, settings):
        """
        Apply settings to filter the available block palette.

        Filters blocks based on:
        1. Custom palette (if specified in settings)
        2. Theme-based predefined palette (if theme is set)
        3. Disabled block types (from blocks_enabled settings)

        Args:
            settings: Dictionary with keys:
                - custom_palette: List of block names to allow
                - theme: Theme name to use predefined palette
                - blocks_enabled: Dict of block types and their enabled status
        """
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
            logger.info(f"Using custom palette with {len(settings['custom_palette'])} blocks")
            self.blocks = self.filter_blocks_by_palette(settings["custom_palette"])
        elif theme != "none" and theme in self.predefined_palettes:
            # Use predefined palette for the theme
            logger.info(f"Using predefined palette for theme: {theme}")
            self.blocks = self.filter_blocks_by_palette(self.predefined_palettes[theme])
        elif theme != "none":
            # Theme specified but not found - warn and use all blocks
            logger.warning(
                f"Theme '{theme}' not found in predefined palettes. "
                f"Available themes: {list(self.predefined_palettes.keys())}. "
                f"Using all blocks."
            )
            self.blocks = self.all_blocks.copy()
        else:
            # Use all blocks
            logger.info("Using all available blocks (no theme specified)")
            self.blocks = self.all_blocks.copy()
        
        # Remove disabled blocks
        initial_count = len(self.blocks)
        self.blocks = [
            b for b in self.blocks
            if b["block"] not in disabled
        ]
        if disabled:
            removed_count = initial_count - len(self.blocks)
            logger.info(f"Disabled {removed_count} blocks based on blocks_enabled settings")

        if not self.blocks:
            logger.error("No blocks available after applying filters!")
            raise ValueError(
                "No blocks available after applying palette and filters. "
                "Check your theme, custom_palette, and blocks_enabled settings."
            )

    def get_falling_blocks(self):
        """Return list of falling block names"""
        return self.blocktypes.get("falling_blocks", [])

    def color_distance(self, c1, c2):
        """
        Calculate the Manhattan distance between two RGBA colors.

        Args:
            c1: First color as (R, G, B, A) tuple (0-255 each)
            c2: Second color as (R, G, B, A) tuple (0-255 each)

        Returns:
            int: Sum of absolute differences across all channels (lower = more similar)
        """
        return sum(abs(c1[i] - c2[i]) for i in range(4))

    def find_block(self, rgba, exclude_falling=False):
        """
        Find best matching block for a given color, optionally excluding falling blocks.

        Args:
            rgba: Color tuple (R, G, B, A) with values 0-255
            exclude_falling: If True, exclude falling blocks from matching

        Returns:
            str: Block name, or None if no blocks available
        """
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

        if best is None:
            logger.warning(
                f"No matching block found for color {rgba} "
                f"(exclude_falling={exclude_falling}, available blocks={len(self.blocks)})"
            )

        return best