import requests
import base64
from PIL import Image
import io
import json

# 创建一个简单的测试图像
img = Image.new('RGB', (100, 100), color='red')
buf = io.BytesIO()
img.save(buf, format='JPEG')
base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')
image_data = f'data:image/jpeg;base64,{base64_image}'

# 构建请求数据
payload = {
    'image': image_data
}

# 发送请求
try:
    response = requests.post('http://localhost:5000/api/recognize', json=payload)
    print(f'Status Code: {response.status_code}')
    print(f'Response: {response.json()}')
    if response.status_code == 200:
        print('后端服务测试成功！')
    else:
        print('后端服务测试失败！')
except Exception as e:
    print(f'测试失败: {e}')
