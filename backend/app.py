from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dynamic_gestures.onnx_models import HandDetection, HandClassification

app = Flask(__name__)
CORS(app)

# 初始化模型
model_dir = os.path.join(os.path.dirname(__file__), '..', 'dynamic_gestures', 'models')
detection_model = HandDetection(os.path.join(model_dir, 'YOLOv10n_hands.onnx'), image_size=(640, 640), confidence_threshold=0.4)  # 调整为0.4以减少误识别
classification_model = HandClassification(os.path.join(model_dir, 'crops_classifier.onnx'))

# 导入必要的库
import mediapipe as mp
import cv2
import numpy as np

# 尝试使用基于任务的 API
try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    from mediapipe import Image, ImageFormat
    import os
    import urllib.request
    
    # 使用 MediaPipe 提供的在线模型文件
    model_url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'hand_landmarker.task')
    
    # 确保模型目录存在
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # 下载模型文件到本地
    if not os.path.exists(model_path):
        print(f'正在下载模型文件到: {model_path}')
        urllib.request.urlretrieve(model_url, model_path)
        print('模型文件下载完成')
    else:
        print(f'模型文件已存在: {model_path}')
    
    # 创建手部追踪器
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    hands = vision.HandLandmarker.create_from_options(options)
    mediapipe_available = True
    print('Mediapipe 初始化成功 (使用 tasks API)')
except Exception as e:
    print(f'Mediapipe 初始化失败: {e}')
    mediapipe_available = False

print(f'系统初始化完成 - Mediapipe: {mediapipe_available}, ONNX 模型: 已就绪')


@app.route('/api/recognize', methods=['POST'])
def recognize_gesture():
    try:
        # 从请求中获取图像数据
        data = request.json
        image_data = data['image']
        
        # 解码 base64 图像数据
        image_data = image_data.split(',')[1]  # 移除 'data:image/jpeg;base64,' 前缀
        image_bytes = base64.b64decode(image_data)
        
        # 将图像数据转换为 OpenCV 格式
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # 执行手部检测
        boxes, probs = detection_model(frame)
        
        # 执行手势分类
        labels = classification_model(frame, boxes)
        
        # 构建检测结果
        detections = []
        # 设置置信度阈值，过滤掉低置信度的检测结果
        CONFIDENCE_THRESHOLD = 0.6
        
        for i, (box, prob) in enumerate(zip(boxes, probs)):
            # 过滤掉低置信度的检测结果
            if prob < CONFIDENCE_THRESHOLD:
                continue
                
            x1, y1, x2, y2 = box
            # 确保labels不为空且索引有效
            gesture = labels[i] if labels and i < len(labels) else 0
            gesture_name = get_gesture_name(gesture)
            
            detections.append({
                'bbox': {
                    'x1': int(x1),
                    'y1': int(y1),
                    'x2': int(x2),
                    'y2': int(y2),
                    'confidence': float(prob)
                },
                'gesture': int(gesture),
                'gestureName': gesture_name
            })
        
        # 如果没有检测结果，返回空数组
        if not detections:
            return jsonify({'detections': []})
        
        return jsonify({'detections': detections})
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'Error: {e}')
        print(f'Traceback: {error_trace}')
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

def get_gesture_name(gesture_id):
    # 手势名称映射
    gesture_names = {
        0: 'hand_down',
        1: 'hand_right',
        2: 'hand_left',
        3: 'thumb_index',
        4: 'thumb_left',
        5: 'thumb_right',
        6: 'thumb_down',
        7: 'half_up',
        8: 'half_left',
        9: 'half_right',
        10: 'half_down',
        11: 'part_hand_heart',
        12: 'part_hand_heart2',
        13: 'fist_inverted',
        14: 'two_left',
        15: 'two_right',
        16: 'two_down',
        17: 'grabbing',
        18: 'grip',
        19: 'point',
        20: 'call',
        21: 'three3',
        22: 'little_finger',
        23: 'middle_finger',
        24: 'dislike',
        25: 'fist',
        26: 'four',
        27: 'like',
        28: 'mute',
        29: 'ok',
        30: 'one',
        31: 'palm',
        32: 'peace',
        33: 'peace_inverted',
        34: 'rock',
        35: 'stop',
        36: 'stop_inverted',
        37: 'three',
        38: 'three2',
        39: 'two_up',
        40: 'two_up_inverted',
        41: 'three_gun',
        42: 'one_left',
        43: 'one_right',
        44: 'one_down'
    }
    return gesture_names.get(gesture_id, 'unknown')

@app.route('/api/hand-tracking', methods=['POST'])
def hand_tracking():
    try:
        # 从请求中获取图像数据
        data = request.json
        image_data = data['image']
        
        # 解码 base64 图像数据
        image_data = image_data.split(',')[1]  # 移除 'data:image/jpeg;base64,' 前缀
        image_bytes = base64.b64decode(image_data)
        
        # 将图像数据转换为 OpenCV 格式
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        h, w, _ = frame.shape
        
        # 首先尝试使用 Mediapipe 进行手部追踪
        if mediapipe_available:
            try:
                # 转换为 RGB 格式（Mediapipe 需要 RGB）
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # 尝试使用基于任务的 API
                # 转换为 Mediapipe Image
                mp_image = Image(image_format=ImageFormat.SRGB, data=frame_rgb)
                
                # 执行手部追踪
                results = hands.detect(mp_image)
                
                # 构建响应
                if results.hand_landmarks:
                    for hand_landmarks in results.hand_landmarks:
                        # 获取食指指尖（索引 8）的坐标
                        index_finger_tip = hand_landmarks[8]
                        
                        # 将归一化坐标转换为像素坐标
                        x = int(index_finger_tip.x * w)
                        y = int(index_finger_tip.y * h)
                        z = index_finger_tip.z
                        
                        # 获取所有手部关键点
                        landmarks = []
                        for landmark in hand_landmarks:
                            landmarks.append({
                                'x': int(landmark.x * w),
                                'y': int(landmark.y * h),
                                'z': landmark.z
                            })
                        
                        return jsonify({
                            'success': True,
                            'position': {
                                'x': x,
                                'y': y,
                                'z': z
                            },
                            'landmarks': landmarks
                        })
            except Exception as e:
                print(f'Mediapipe 手部追踪失败: {e}')
                # 继续执行，使用 ONNX 模型作为回退
        
        # 使用 ONNX 模型作为回退
        return hand_tracking_fallback(frame, h, w)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'Error in hand_tracking: {e}')
        print(f'Traceback: {error_trace}')
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

def hand_tracking_fallback(frame, h, w):
    """回退方法：使用 ONNX 模型进行手部检测和关键点估计"""
    try:
        # 执行手部检测
        boxes, probs = detection_model(frame)
        
        # 检查boxes是否有效且不为空
        if boxes is None or not hasattr(boxes, 'size') or boxes.size == 0:
            return jsonify({
                'success': False,
                'message': 'No hands detected'
            })
        
        # 取第一个检测到的手
        box = boxes[0]
        x1, y1, x2, y2 = box
        
        # 计算手部中心点作为食指指尖位置（简化处理）
        center_x = int((x1 + x2) / 2)
        center_y = int((y1 + y2) / 2)
        
        # 构建响应
        return jsonify({
            'success': True,
            'position': {
                'x': center_x,
                'y': center_y,
                'z': 0.0
            },
            'landmarks': []
        })
    except Exception as e:
        print(f'Error in hand_tracking_fallback: {e}')
        return jsonify({
            'success': False,
            'message': 'Error in hand tracking fallback'
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

