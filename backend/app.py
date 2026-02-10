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
detection_model = HandDetection(os.path.join(model_dir, 'YOLOv10n_hands.onnx'), image_size=(640, 640), confidence_threshold=0.5)
classification_model = HandClassification(os.path.join(model_dir, 'crops_classifier.onnx'))

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
        for i, (box, prob) in enumerate(zip(boxes, probs)):
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

