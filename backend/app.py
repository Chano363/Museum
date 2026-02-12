from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import sys
import os
import json
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dynamic_gestures.onnx_models import HandDetection, HandClassification

model_dir = os.path.join(os.path.dirname(__file__), '..', 'dynamic_gestures', 'models')
detection_model = HandDetection(os.path.join(model_dir, 'YOLOv10n_hands.onnx'), image_size=(640, 640), confidence_threshold=0.4)
classification_model = HandClassification(os.path.join(model_dir, 'crops_classifier.onnx'))

import mediapipe as mp

try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    from mediapipe import Image, ImageFormat
    import urllib.request
    
    model_url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'hand_landmarker.task')
    
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    if not os.path.exists(model_path):
        print(f'正在下载模型文件到: {model_path}')
        urllib.request.urlretrieve(model_url, model_path)
        print('模型文件下载完成')
    else:
        print(f'模型文件已存在: {model_path}')
    
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

frame_count = 0

def get_gesture_name(gesture_id):
    gesture_names = {
        0: 'hand_down', 1: 'hand_right', 2: 'hand_left', 3: 'thumb_index',
        4: 'thumb_left', 5: 'thumb_right', 6: 'thumb_down', 7: 'half_up',
        8: 'half_left', 9: 'half_right', 10: 'half_down', 11: 'part_hand_heart',
        12: 'part_hand_heart2', 13: 'fist_inverted', 14: 'two_left', 15: 'two_right',
        16: 'two_down', 17: 'grabbing', 18: 'grip', 19: 'point', 20: 'call',
        21: 'three3', 22: 'little_finger', 23: 'middle_finger', 24: 'dislike',
        25: 'fist', 26: 'four', 27: 'like', 28: 'mute', 29: 'ok', 30: 'one',
        31: 'palm', 32: 'peace', 33: 'peace_inverted', 34: 'rock', 35: 'stop',
        36: 'stop_inverted', 37: 'three', 38: 'three2', 39: 'two_up',
        40: 'two_up_inverted', 41: 'three_gun', 42: 'one_left', 43: 'one_right',
        44: 'one_down'
    }
    return gesture_names.get(gesture_id, 'unknown')

def process_frame(image_data):
    global frame_count
    frame_count += 1
    start_time = time.time()
    
    try:
        image_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {'error': 'Failed to decode image'}
        
        h, w, _ = frame.shape
        
        boxes, probs = detection_model(frame)
        labels = classification_model(frame, boxes)
        
        detections = []
        CONFIDENCE_THRESHOLD = 0.6
        
        for i, (box, prob) in enumerate(zip(boxes, probs)):
            if prob < CONFIDENCE_THRESHOLD:
                continue
            
            x1, y1, x2, y2 = box
            gesture = labels[i] if labels and i < len(labels) else 0
            gesture_name = get_gesture_name(gesture)
            
            detections.append({
                'bbox': {
                    'x1': int(x1), 'y1': int(y1), 'x2': int(x2), 'y2': int(y2),
                    'confidence': float(prob)
                },
                'gesture': int(gesture),
                'gestureName': gesture_name
            })
        
        finger_position = None
        landmarks = []
        
        if mediapipe_available:
            try:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = Image(image_format=ImageFormat.SRGB, data=frame_rgb)
                results = hands.detect(mp_image)
                
                if results.hand_landmarks:
                    for hand_landmarks in results.hand_landmarks:
                        index_finger_tip = hand_landmarks[8]
                        finger_position = {
                            'x': int(index_finger_tip.x * w),
                            'y': int(index_finger_tip.y * h),
                            'z': index_finger_tip.z
                        }
                        
                        for landmark in hand_landmarks:
                            landmarks.append({
                                'x': int(landmark.x * w),
                                'y': int(landmark.y * h),
                                'z': landmark.z
                            })
                        break
            except Exception as e:
                print(f'[帧#{frame_count}] Mediapipe失败: {e}')
        
        elapsed = (time.time() - start_time) * 1000
        if frame_count % 10 == 0:
            gesture_info = ', '.join([f'{d["gestureName"]}({d["gesture"]})' for d in detections]) if detections else '无'
            print(f'[帧#{frame_count}] 处理时间: {elapsed:.1f}ms, 手势: {gesture_info}, 手指: {"有" if finger_position else "无"}')
        
        return {
            'detections': detections,
            'fingerPosition': finger_position,
            'landmarks': landmarks
        }
    except Exception as e:
        import traceback
        print(f'[帧#{frame_count}] 处理错误: {e}')
        print(traceback.format_exc())
        return {'error': str(e)}

flask_app = Flask(__name__)
CORS(flask_app)

@flask_app.route('/api/recognize', methods=['POST'])
def recognize_gesture():
    data = request.json
    result = process_frame(data['image'])
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result)

def run_servers():
    import socketio
    import eventlet
    from eventlet import wsgi
    
    sio = socketio.Server(cors_allowed_origins='*', async_mode='eventlet')
    app = socketio.WSGIApp(sio, flask_app)
    
    @sio.on('connect')
    def connect(sid, environ):
        print(f'[WebSocket] 客户端连接: {sid}')
    
    @sio.on('disconnect')
    def disconnect(sid):
        print(f'[WebSocket] 客户端断开: {sid}')
    
    @sio.on('frame')
    def handle_frame(sid, data):
        if 'image' in data:
            result = process_frame(data['image'])
            sio.emit('result', result, to=sid)
    
    print('=' * 50)
    print('服务器启动在端口 5000')
    print('HTTP端点: http://localhost:5000/api/recognize')
    print('WebSocket端点: ws://localhost:5000/socket.io')
    print('=' * 50)
    
    wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)

if __name__ == '__main__':
    run_servers()
