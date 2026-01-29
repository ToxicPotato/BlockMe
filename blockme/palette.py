import json

class Palette:
    def __init__(self, blocks_file, blocktypes_file, settings):
        with open(blocks_file, "r", encoding="utf-8") as f:
            self.blocks = json.load(f)

        with open(blocktypes_file, "r", encoding="utf-8") as f:
            self.blocktypes = json.load(f)

        self.apply_settings(settings)

    def apply_settings(self, settings):
        disabled = set()

        for key, enabled in settings["blocks_enabled"].items():
            if not enabled:
                disabled.update(self.blocktypes.get(key, []))

        self.blocks = [
            b for b in self.blocks
            if b["block"] not in disabled
        ]

    def colordiff(self, c1, c2):
        return sum(abs(c1[i] - c2[i]) for i in range(4))

    def find_block(self, rgba):
        best = None
        best_diff = float("inf")

        for b in self.blocks:
            diff = self.colordiff(rgba, b["color"])
            if diff < best_diff:
                best = b["block"]
                best_diff = diff

        return best
