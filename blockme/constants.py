"""
Global constants for the BlockMe application.
"""

# Minecraft constants
MINECRAFT_STACK_SIZE = 64
MINECRAFT_AIR_BLOCK = "minecraft:air"

# Image processing constants
ALPHA_CHANNEL_INDEX = 3
TRANSPARENT_ALPHA = 0
IMAGE_MODE_RGBA = "RGBA"
EXPECTED_SKIN_WIDTH = 64
EXPECTED_SKIN_HEIGHT = 64

# API constants
ASHCON_API_BASE_URL = "https://api.ashcon.app/mojang/v2/user/"
REQUEST_TIMEOUT = 10  # seconds

# Coordinate system
SUPPORT_CHECK_OFFSET = -1  # Y-axis offset for checking block below

# Required settings keys
REQUIRED_SETTINGS_KEYS = ["version"]
DEFAULT_SETTINGS = {
    "theme": "none",
    "blocks_enabled": {},
    "save_location": None
}
