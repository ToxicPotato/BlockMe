from io import BytesIO

import requests
from PIL import Image

from blockme.constants import (
    ASHCON_API_BASE_URL,
    REQUEST_TIMEOUT,
    EXPECTED_SKIN_WIDTH,
    EXPECTED_SKIN_HEIGHT,
    IMAGE_MODE_RGBA
)
from blockme.logger import logger


def get_skin_image_from_username(username):
    """
    Fetch a Minecraft player's skin image from the Ashcon API.

    Args:
        username: Minecraft player username

    Returns:
        PIL.Image: Skin image in RGBA format (64x64)

    Raises:
        ValueError: If username is invalid, player not found, or skin dimensions invalid
        requests.RequestException: If network request fails
        KeyError: If API response is missing expected data
    """
    if not username or not username.strip():
        logger.error("Empty username provided")
        raise ValueError("Username cannot be empty")

    username = username.strip()
    logger.info(f"Fetching skin for user: {username}")
    full_url = ASHCON_API_BASE_URL + username

    try:
        # Fetch player data from Ashcon API
        logger.debug(f"Requesting player data from: {full_url}")
        r = requests.get(full_url, timeout=REQUEST_TIMEOUT)

        if r.status_code == 404:
            logger.warning(f"Player not found: {username}")
            raise ValueError(f"Player not found: {username}")
        elif r.status_code != 200:
            logger.error(f"API returned HTTP {r.status_code} for user: {username}")
            raise requests.RequestException(
                f"Failed to fetch skin data (HTTP {r.status_code}): {username}"
            )

        data = r.json()

        # Extract skin URL from response
        if "textures" not in data or "skin" not in data["textures"]:
            logger.error(f"No skin data in API response for user: {username}")
            raise KeyError(f"No skin data available for player: {username}")

        skin_url = data["textures"]["skin"]["url"]
        logger.debug(f"Downloading skin from: {skin_url}")

        # Download skin image
        img_response = requests.get(skin_url, timeout=REQUEST_TIMEOUT)
        img_response.raise_for_status()

        # Convert to PIL Image
        skin_img = Image.open(BytesIO(img_response.content)).convert(IMAGE_MODE_RGBA)

        # Validate dimensions
        width, height = skin_img.size
        if width != EXPECTED_SKIN_WIDTH or height != EXPECTED_SKIN_HEIGHT:
            logger.error(
                f"Invalid skin dimensions: {width}x{height}, expected {EXPECTED_SKIN_WIDTH}x{EXPECTED_SKIN_HEIGHT}"
            )
            raise ValueError(
                f"Invalid skin dimensions: {width}x{height}. "
                f"Expected {EXPECTED_SKIN_WIDTH}x{EXPECTED_SKIN_HEIGHT}"
            )

        logger.info(f"Successfully fetched skin for user: {username}")
        return skin_img

    except requests.Timeout:
        logger.error(f"Request timed out while fetching skin for: {username}")
        raise requests.RequestException(f"Request timed out while fetching skin for: {username}")
    except requests.RequestException as e:
        # Don't re-wrap if already a RequestException from above
        if "Failed to fetch skin data" in str(e) or "timed out" in str(e):
            raise
        logger.error(f"Network error fetching skin: {e}")
        raise requests.RequestException(f"Network error fetching skin: {e}")