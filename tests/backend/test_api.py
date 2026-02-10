import pytest
import requests
import base64
from PIL import Image
import io
import json

# 测试服务器地址
BASE_URL = 'http://localhost:5000'

# 创建测试图像
def create_test_image():
    img = Image.new('RGB', (100, 100), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f'data:image/jpeg;base64,{base64_image}'

class TestGestureRecognitionAPI:
    """测试手势识别API"""
    
    def test_recognize_gesture_basic(self):
        """测试基本的手势识别功能"""
        image_data = create_test_image()
        payload = {'image': image_data}
        
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'detections' in data
        assert isinstance(data['detections'], list)
    
    def test_recognize_gesture_invalid_image(self):
        """测试无效图像数据的处理"""
        # 测试空图像数据
        payload = {'image': ''}
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        assert response.status_code == 400 or response.status_code == 500
        
        # 测试无效的base64数据
        payload = {'image': 'invalid-base64'}
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        assert response.status_code == 400 or response.status_code == 500
    
    def test_recognize_gesture_missing_image(self):
        """测试缺少图像数据的处理"""
        payload = {}
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        assert response.status_code == 500
    
    def test_recognize_gesture_empty_detection(self):
        """测试空检测结果的处理"""
        # 创建一个不太可能包含手的图像
        img = Image.new('RGB', (100, 100), color='black')
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')
        image_data = f'data:image/jpeg;base64,{base64_image}'
        
        payload = {'image': image_data}
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'detections' in data
        assert isinstance(data['detections'], list)
    
    def test_recognize_gesture_performance(self):
        """测试API的性能和响应时间"""
        import time
        
        image_data = create_test_image()
        payload = {'image': image_data}
        
        start_time = time.time()
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        end_time = time.time()
        
        response_time = end_time - start_time
        print(f"API响应时间: {response_time:.2f}秒")
        
        assert response.status_code == 200
        # 响应时间应该在合理范围内（例如，小于5秒）
        assert response_time < 5

if __name__ == '__main__':
    pytest.main(['-v', __file__])
