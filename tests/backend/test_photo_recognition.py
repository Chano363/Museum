import os
import base64
import requests
import json
import time

# 测试照片目录
PHOTOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'photos')
# 后端API地址
API_URL = 'http://localhost:5000/api/recognize'

# 测试照片与预期手势的映射
TEST_CASES = [
    {'file': 'like.jpg', 'expected_gesture': 'like', 'description': '点赞手势'},
    {'file': 'ok.jpg', 'expected_gesture': 'ok', 'description': 'OK手势'},
    {'file': 'palm.jpg', 'expected_gesture': 'palm', 'description': '手掌手势'},
    {'file': 'point.jpg', 'expected_gesture': 'point', 'description': '手指指向手势'}
]

def encode_image_to_base64(image_path):
    """将图像编码为base64格式"""
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    return f'data:image/jpeg;base64,{base64_image}'

def test_photo_recognition():
    """测试照片手势识别"""
    print("开始测试照片手势识别...")
    print(f"测试目录: {PHOTOS_DIR}")
    print(f"后端API: {API_URL}")
    print("=" * 60)
    
    results = []
    total_time = 0
    correct_count = 0
    
    for test_case in TEST_CASES:
        print(f"测试: {test_case['description']}")
        print(f"文件: {test_case['file']}")
        print(f"预期手势: {test_case['expected_gesture']}")
        
        # 构建图像路径
        image_path = os.path.join(PHOTOS_DIR, test_case['file'])
        
        if not os.path.exists(image_path):
            print(f"错误: 图像文件不存在 - {image_path}")
            print("-" * 60)
            continue
        
        # 编码图像
        base64_image = encode_image_to_base64(image_path)
        
        # 构建请求数据
        payload = {'image': base64_image}
        
        # 发送请求并计时
        start_time = time.time()
        try:
            response = requests.post(API_URL, json=payload)
            end_time = time.time()
            process_time = (end_time - start_time) * 1000  # 转换为毫秒
            total_time += process_time
            
            print(f"处理时间: {process_time:.2f} ms")
            
            if response.status_code == 200:
                data = response.json()
                detections = data.get('detections', [])
                
                if detections:
                    # 取置信度最高的检测结果
                    best_detection = max(detections, key=lambda x: x['bbox']['confidence'])
                    detected_gesture = best_detection['gestureName']
                    confidence = best_detection['bbox']['confidence']
                    
                    print(f"检测到手势: {detected_gesture}")
                    print(f"置信度: {confidence:.2f}")
                    
                    # 验证是否正确识别
                    is_correct = test_case['expected_gesture'] in detected_gesture.lower()
                    if is_correct:
                        correct_count += 1
                        print("✓ 识别正确")
                    else:
                        print("✗ 识别错误")
                    
                    results.append({
                        'file': test_case['file'],
                        'description': test_case['description'],
                        'expected': test_case['expected_gesture'],
                        'detected': detected_gesture,
                        'confidence': confidence,
                        'correct': is_correct,
                        'process_time': process_time
                    })
                else:
                    print("✗ 未检测到手势")
                    results.append({
                        'file': test_case['file'],
                        'description': test_case['description'],
                        'expected': test_case['expected_gesture'],
                        'detected': 'none',
                        'confidence': 0,
                        'correct': False,
                        'process_time': process_time
                    })
            else:
                print(f"✗ API错误: {response.status_code}")
                print(f"错误信息: {response.text}")
                results.append({
                    'file': test_case['file'],
                    'description': test_case['description'],
                    'expected': test_case['expected_gesture'],
                    'detected': 'error',
                    'confidence': 0,
                    'correct': False,
                    'process_time': process_time
                })
        except Exception as e:
            end_time = time.time()
            process_time = (end_time - start_time) * 1000
            print(f"✗ 请求失败: {str(e)}")
            results.append({
                'file': test_case['file'],
                'description': test_case['description'],
                'expected': test_case['expected_gesture'],
                'detected': 'exception',
                'confidence': 0,
                'correct': False,
                'process_time': process_time
            })
        
        print("-" * 60)
    
    # 生成测试报告
    print("\n测试报告")
    print("=" * 60)
    print(f"测试总数: {len(results)}")
    print(f"正确识别: {correct_count}")
    print(f"识别率: {(correct_count / len(results) * 100):.2f}%")
    print(f"平均处理时间: {(total_time / len(results)):.2f} ms")
    print("=" * 60)
    
    # 输出详细结果
    print("\n详细结果:")
    print("文件\t\t预期手势\t检测手势\t置信度\t\t处理时间(ms)\t结果")
    print("-" * 100)
    
    for result in results:
        status = "✓" if result['correct'] else "✗"
        print(f"{result['file']}\t{result['expected']}\t\t{result['detected']}\t\t{result['confidence']:.2f}\t\t{result['process_time']:.2f}\t\t{status}")
    
    return results

if __name__ == '__main__':
    test_photo_recognition()
