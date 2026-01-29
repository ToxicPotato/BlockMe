import requests
from PIL import Image
from io import BytesIO

url = "https://api.ashcon.app/mojang/v2/user/"

def get_skin_image_from_username(username):
    full_url = url + username

    r = requests.get(full_url)
    if r.status_code != 200:
        raise Exception("Error fetching skin data for user: " + username)
    
    skin_url = r.json()["textures"]["skin"]["url"]

    img_data = requests.get(skin_url).content

    skin_img = Image.open(BytesIO(img_data)).convert("RGBA")

    return skin_img