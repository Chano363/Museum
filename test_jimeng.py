import requests
import json
import os
import base64
import hashlib
import hmac
import time
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv('backend/.env')

JIMENG_ACCESS_KEY = os.getenv('JIMENG_ACCESS_KEY', '')
JIMENG_SECRET_KEY = os.getenv('JIMENG_SECRET_KEY', '')

print(f"JIMENG_ACCESS_KEY: {JIMENG_ACCESS_KEY[:10]}..." if JIMENG_ACCESS_KEY else "No Access Key!")
print(f"JIMENG_SECRET_KEY: {JIMENG_SECRET_KEY[:10]}..." if JIMENG_SECRET_KEY else "No Secret Key!")

if not JIMENG_ACCESS_KEY or not JIMENG_SECRET_KEY:
    print("\nERROR: 请先配置 JIMENG_ACCESS_KEY 和 JIMENG_SECRET_KEY")
    exit(1)

# 创建测试图像
img = Image.new('RGB', (256, 256), color='brown')
buf = io.BytesIO()
img.save(buf, format='PNG')
test_image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

# 生成签名
timestamp = str(int(time.time()))
sign_content = f'timestamp={timestamp}'
signature = hmac.new(
    JIMENG_SECRET_KEY.encode('utf-8'),
    sign_content.encode('utf-8'),
    digestmod=hashlib.sha256
).hexdigest()

auth_info = {
    "accessKey": JIMENG_ACCESS_KEY,
    "signContent": sign_content,
    "signature": signature
}

headers = {
    'Content-Type': 'application/json',
    'Authorization': json.dumps(auth_info)
}

# 图生图请求
payload = {
    "req_key": "jimeng_high_aes_i2i",
    "prompt": "ancient Chinese bronze ding vessel, taotie pattern, Shang Dynasty style, masterpiece",
    "image": test_image_base64,
    "strength": 0.7,
    "width": 512,
    "height": 512,
    "use_prompt": True
}

url = "https://api.volcengine.com/api/v3/contents/generation/image"

print(f"\n=== Testing Jimeng API ===")
print(f"URL: {url}")
print(f"Timestamp: {timestamp}")

try:
    response = requests.post(url, headers=headers, json=payload, timeout=120)
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        
        if 'data' in result:
            print(f"Data keys: {list(result['data'].keys())}")
            if 'image_url' in result['data']:
                print(f"\n✅ SUCCESS! Image URL: {result['data']['image_url'][:80]}...")
            elif 'image' in result['data']:
                print(f"\n✅ SUCCESS! Got base64 image data")
        elif 'image_url' in result:
            print(f"\n✅ SUCCESS! Image URL: {result['image_url'][:80]}...")
        else:
            print(f"\nResponse: {json.dumps(result, indent=2, ensure_ascii=False)[:500]}")
    else:
        print(f"\n❌ FAILED!")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"\n❌ Exception: {e}")
