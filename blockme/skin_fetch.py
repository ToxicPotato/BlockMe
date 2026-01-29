import requests
from PIL import Image
from io import BytesIO

url = "https://api.ashcon.app/mojang/v2/user/"

def getSkinImageFromUsername(Username):
    fullUrl = url + Username

    r = requests.get(fullUrl)
    if r.status_code != 200:
        raise Exception("Error fetching skin data for user: " + Username)
    
    skin_url = r.json()["textures"]["skin"]["url"]

    img_data = requests.get(skin_url).content

    skin_img = Image.open(BytesIO(img_data)).convert("RGBA")

    return skin_img