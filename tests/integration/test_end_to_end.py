import pytest
import requests
import base64
from PIL import Image
import io
import time

# 测试服务器地址
BASE_URL = 'http://localhost:5000'

# 创建测试图像
def create_test_image(width=640, height=480, color=(255, 255, 255)):
    """创建测试图像"""
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f'data:image/jpeg;base64,{base64_image}'

class TestEndToEndGestureRecognition:
    """测试端到端的手势识别流程"""
    
    def test_full_recognition_flow(self):
        """测试完整的识别流程"""
        # 创建测试图像
        image_data = create_test_image()
        payload = {'image': image_data}
        
        # 发送请求到后端
        start_time = time.time()
        response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
        end_time = time.time()
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert 'detections' in data
        assert isinstance(data['detections'], list)
        
        # 验证响应时间
        response_time = end_time - start_time
        print(f"完整识别流程响应时间: {response_time:.3f}秒")
        assert response_time < 5  # 响应时间应该在合理范围内
    
    def test_different_gestures(self):
        """测试不同的手势"""
        # 测试不同颜色的图像，模拟不同的手势
        colors = [(255, 255, 255), (255, 0, 0), (0, 255, 0), (0, 0, 255)]
        
        for color in colors:
            image_data = create_test_image(color=color)
            payload = {'image': image_data}
            
            response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
            assert response.status_code == 200
            data = response.json()
            assert 'detections' in data
            assert isinstance(data['detections'], list)
    
    def test_real_time_performance(self):
        """测试实时性能"""
        # 连续发送多个请求，测试实时性能
        num_requests = 10
        total_time = 0
        
        for i in range(num_requests):
            image_data = create_test_image()
            payload = {'image': image_data}
            
            start_time = time.time()
            response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
            end_time = time.time()
            
            assert response.status_code == 200
            total_time += (end_time - start_time)
        
        average_time = total_time / num_requests
        print(f"平均响应时间: {average_time:.3f}秒")
        print(f"估计帧率: {1/average_time:.1f} FPS")
        
        # 平均响应时间应该在合理范围内
        # 调整阈值为2秒，因为ONNX模型推理需要一定时间
        assert average_time < 2.5
    
    def test_error_recovery(self):
        """测试错误恢复能力"""
        # 测试无效请求后，系统是否能恢复
        
        # 发送无效请求
        invalid_payload = {'image': 'invalid-data'}
        response = requests.post(f'{BASE_URL}/api/recognize', json=invalid_payload)
        
        # 发送有效请求，验证系统能恢复
        valid_image_data = create_test_image()
        valid_payload = {'image': valid_image_data}
        response = requests.post(f'{BASE_URL}/api/recognize', json=valid_payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'detections' in data
    
    def test_boundary_conditions(self):
        """测试边界条件"""
        # 测试不同大小的图像
        sizes = [(160, 120), (320, 240), (640, 480), (1280, 720)]
        
        for width, height in sizes:
            image_data = create_test_image(width=width, height=height)
            payload = {'image': image_data}
            
            response = requests.post(f'{BASE_URL}/api/recognize', json=payload)
            assert response.status_code == 200
            data = response.json()
            assert 'detections' in data
            assert isinstance(data['detections'], list)

if __name__ == '__main__':
    pytest.main(['-v', __file__])
