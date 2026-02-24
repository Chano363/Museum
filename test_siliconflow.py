import requests
import json
import os
import base64
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv('backend/.env')

API_KEY = os.getenv('SILICONFLOW_API_KEY', '')
print(f"API Key: {API_KEY[:15]}..." if API_KEY else "No API Key!")

url = "https://api.siliconflow.cn/v1/images/generations"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 创建测试图像
img = Image.new('RGB', (256, 256), color='brown')
buf = io.BytesIO()
img.save(buf, format='PNG')
test_image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

payload = {
    "model": "Kwai-Kolors/Kolors",
    "prompt": "ancient Chinese bronze ding vessel, taotie pattern, Shang Dynasty style, masterpiece",
    "negative_prompt": "blurry, low quality, distorted, watermark",
    "image": f"data:image/png;base64,{test_image_base64}",
    "image_size": "512x512",
    "num_inference_steps": 20,
    "guidance_scale": 7.5
}

print(f"\nCalling: {url}")
print(f"Model: {payload['model']}")
print(f"Image provided: Yes")

try:
    response = requests.post(url, headers=headers, json=payload, timeout=120)
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Keys: {list(result.keys())}")
        
        if 'images' in result:
            img_item = result['images'][0]
            if isinstance(img_item, dict) and 'url' in img_item:
                print(f"Image URL: {img_item['url'][:80]}...")
            else:
                print(f"Image data type: {type(img_item)}")
    else:
        print(f"Error: {response.text[:500]}")
        
except Exception as e:
    print(f"Exception: {e}")
