from PIL import Image

def grayscale(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    gray = Image.merge("RGB", (r, g, b)).convert("L")
    gray_rgb = Image.merge("RGB", (gray, gray, gray))
    return Image.merge("RGBA", (*gray_rgb.split(), a))
