# 动态手势识别模型使用文档

## 概述

本文档详细说明了动态手势识别系统中使用的各个深度学习模型的功能、输入输出格式、技术规格以及在前端项目中的集成方式。该系统采用多模型协作的方式，实现从手部检测到手势识别的完整流程。

---

## 模型架构总览

系统包含两个核心模型：

1. **手部检测模型** (Hand Detection Model)
   - 文件名：`hand_detector.onnx` 或 `YOLOv10n_hands.onnx`
   - 功能：检测图像中的手部位置和边界框

2. **手势分类模型** (Hand Classification Model)
   - 文件名：`crops_classifier.onnx` 或 `MobileNetV3_large.onnx`
   - 功能：识别手部的具体手势类型

---

## 模型1：手部检测模型 (Hand Detection Model)

### 基本信息

| 属性 | 值 |
|------|-----|
| 模型类型 | 目标检测模型 (YOLOv10n) |
| 模型文件 | `hand_detector.onnx` / `YOLOv10n_hands.onnx` |
| 输入尺寸 | 320×256 像素 |
| 输入格式 | RGB图像 (BGR转RGB) |
| 输出格式 | 边界框坐标 + 置信度分数 |
| 推理框架 | ONNX Runtime |

### 功能描述

手部检测模型负责在输入图像中检测所有手部的位置，输出每个手部的边界框坐标和置信度分数。该模型是整个系统的第一步，为后续的手势分类提供感兴趣区域。

### 输入规格

#### 输入张量
- **名称**: `images` (具体名称取决于模型导出时的设置)
- **形状**: `[1, 3, 256, 320]` (Batch, Channels, Height, Width)
- **数据类型**: `float32`
- **数值范围**: 归一化后的数值 (经过均值和标准差归一化)
- **通道顺序**: RGB

#### 预处理步骤

```python
def preprocess(frame):
    # 1. 颜色空间转换：BGR → RGB
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # 2. 尺寸调整：调整到模型输入尺寸
    image = cv2.resize(image, (320, 256))
    
    # 3. 归一化：减去均值，除以标准差
    mean = np.array([127, 127, 127], dtype=np.float32)
    std = np.array([128, 128, 128], dtype=np.float32)
    image = (image - mean) / std
    
    # 4. 维度调整：HWC → CHW
    image = np.transpose(image, [2, 0, 1])
    
    # 5. 添加批次维度
    image = np.expand_dims(image, axis=0)
    
    return image
```

#### 原始图像要求
- **格式**: BGR格式 (OpenCV默认格式)
- **尺寸**: 任意尺寸 (会被自动调整)
- **颜色空间**: 8位无符号整数 (0-255)
- **通道数**: 3 (RGB)

### 输出规格

#### 输出张量
- **名称**: `output` (具体名称取决于模型导出时的设置)
- **形状**: `[1, N, 6]` (Batch, Detections, 6)
  - N: 检测到的最大手部数量
  - 6: [x1, y1, x2, y2, confidence, class]
- **数据类型**: `float32`

#### 输出字段说明

| 字段 | 名称 | 说明 | 范围 |
|------|------|------|------|
| x1 | 左上角X坐标 | 边界框左上角的X坐标 | 0-320 (归一化坐标) |
| y1 | 左上角Y坐标 | 边界框左上角的Y坐标 | 0-256 (归一化坐标) |
| x2 | 右下角X坐标 | 边界框右下角的X坐标 | 0-320 (归一化坐标) |
| y2 | 右下角Y坐标 | 边界框右下角的Y坐标 | 0-256 (归一化坐标) |
| confidence | 置信度分数 | 检测置信度 | 0.0-1.0 |
| class | 类别标签 | 手部类别 (通常为0) | 整数 |

#### 后处理步骤

```python
def postprocess(output, original_frame_shape, confidence_threshold=0.5):
    # 1. 提取检测结果
    detections = output[0]  # 移除批次维度
    
    # 2. 根据置信度阈值过滤
    valid_detections = detections[detections[:, 4] > confidence_threshold]
    
    # 3. 提取边界框和置信度
    boxes = valid_detections[:, :4]  # [x1, y1, x2, y2]
    probs = valid_detections[:, 4]   # 置信度分数
    
    # 4. 将归一化坐标映射回原始图像尺寸
    height, width = original_frame_shape[:2]
    scale_x = width / 320
    scale_y = height / 256
    
    boxes[:, 0] *= scale_x  # x1
    boxes[:, 1] *= scale_y  # y1
    boxes[:, 2] *= scale_x  # x2
    boxes[:, 3] *= scale_y  # y2
    
    # 5. 转换为整数坐标
    boxes = boxes.astype(np.int32)
    
    return boxes, probs
```

### 使用示例

```python
import cv2
import numpy as np
from onnx_models import HandDetection

# 初始化检测模型
detection_model = HandDetection(
    model_path="models/hand_detector.onnx",
    image_size=(320, 256),
    confidence_threshold=0.5
)

# 读取图像
frame = cv2.imread("test_image.jpg")

# 执行检测
boxes, probs = detection_model(frame)

# 输出结果
for i, (box, prob) in enumerate(zip(boxes, probs)):
    x1, y1, x2, y2 = box
    print(f"手部 {i+1}: 坐标=({x1}, {y1}, {x2}, {y2}), 置信度={prob:.3f}")
```

### 性能指标

| 指标 | 值 |
|------|-----|
| 推理速度 (CPU) | ~30-50 FPS (取决于硬件) |
| 推理速度 (GPU) | ~100+ FPS (取决于硬件) |
| 模型大小 | ~5-10 MB |
| 检测精度 | mAP@0.5: ~0.85-0.90 |
| 最小手部尺寸 | ~32×32 像素 |

---

## 模型2：手势分类模型 (Hand Classification Model)

### 基本信息

| 属性 | 值 |
|------|-----|
| 模型类型 | 图像分类模型 (MobileNetV3 Large) |
| 模型文件 | `crops_classifier.onnx` / `MobileNetV3_large.onnx` |
| 输入尺寸 | 128×128 像素 |
| 输入格式 | RGB图像 (BGR转RGB) |
| 输出格式 | 手势类别标签 (0-121) |
| 类别数量 | 122种手势类型 |
| 推理框架 | ONNX Runtime |

### 功能描述

手势分类模型负责识别手部图像的具体手势类型。该模型接收从手部检测模型输出的边界框裁剪出的手部图像，然后将其分类为122种预定义手势类型中的一种。

### 输入规格

#### 输入张量
- **名称**: `input` (具体名称取决于模型导出时的设置)
- **形状**: `[N, 3, 128, 128]` (Batch, Channels, Height, Width)
  - N: 批次大小 (同时处理多个手部)
- **数据类型**: `float32`
- **数值范围**: 归一化后的数值 (经过均值和标准差归一化)
- **通道顺序**: RGB

#### 预处理步骤

```python
def preprocess_hand_crop(crop):
    # 1. 颜色空间转换：BGR → RGB
    image = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    
    # 2. 尺寸调整：调整到模型输入尺寸
    image = cv2.resize(image, (128, 128))
    
    # 3. 归一化：减去均值，除以标准差
    mean = np.array([127, 127, 127], dtype=np.float32)
    std = np.array([128, 128, 128], dtype=np.float32)
    image = (image - mean) / std
    
    # 4. 维度调整：HWC → CHW
    image = np.transpose(image, [2, 0, 1])
    
    # 5. 添加批次维度
    image = np.expand_dims(image, axis=0)
    
    return image
```

#### 手部裁剪处理

```python
def get_square_crop(box, image):
    """
    将边界框转换为正方形裁剪区域
    """
    height, width, _ = image.shape
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    
    # 调整为正方形
    if h < w:
        y0 = y0 - int((w - h) / 2)
        y1 = y0 + w
    if h > w:
        x0 = x0 - int((h - w) / 2)
        x1 = x0 + h
    
    # 确保坐标在图像范围内
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(width - 1, x1)
    y1 = min(height - 1, y1)
    
    return x0, y0, x1, y1

def extract_hand_crops(frame, bboxes):
    """
    从原始图像中提取手部裁剪
    """
    crops = []
    for bbox in bboxes:
        x0, y0, x1, y1 = get_square_crop(bbox, frame)
        crop = frame[y0:y1, x0:x1]
        crops.append(crop)
    return crops
```

### 输出规格

#### 输出张量
- **名称**: `output` (具体名称取决于模型导出时的设置)
- **形状**: `[N, 122]` (Batch, Classes)
  - N: 批次大小
  - 122: 手势类别数量
- **数据类型**: `float32`

#### 输出说明

输出是每个手部图像对应122个手势类别的概率分布。通过取最大概率的索引，可以得到最终的手势类别标签。

#### 后处理步骤

```python
def postprocess_classification(output):
    """
    将模型输出转换为手势类别标签
    """
    # 取最大概率的索引作为预测类别
    labels = np.argmax(output, axis=1)
    return labels.tolist()
```

### 手势类别列表

系统支持122种手势类型，以下是完整的手势类别列表：

| ID | 手势名称 | 描述 |
|----|----------|------|
| 0 | hand_down | 手向下 |
| 1 | hand_right | 手向右 |
| 2 | hand_left | 手向左 |
| 3 | thumb_index | 拇指食指 |
| 4 | thumb_left | 拇指左 |
| 5 | thumb_right | 拇指右 |
| 6 | thumb_down | 拇指下 |
| 7 | half_up | 半向上 |
| 8 | half_left | 半向左 |
| 9 | half_right | 半向右 |
| 10 | half_down | 半向下 |
| 11 | part_hand_heart | 部分手心 |
| 12 | part_hand_heart2 | 部分手心2 |
| 13 | fist_inverted | 反向拳头 |
| 14 | two_left | 二左 |
| 15 | two_right | 二右 |
| 16 | two_down | 二下 |
| 17 | grabbing | 抓取 |
| 18 | grip | 握紧 |
| 19 | point | 指点 |
| 20 | call | 呼叫 |
| 21 | three3 | 三3 |
| 22 | little_finger | 小指 |
| 23 | middle_finger | 中指 |
| 24 | dislike | 不喜欢 |
| 25 | fist | 拳头 |
| 26 | four | 四 |
| 27 | like | 喜欢 |
| 28 | mute | 静音 |
| 29 | ok | OK |
| 30 | one | 一 |
| 31 | palm | 手掌 |
| 32 | peace | 和平 |
| 33 | peace_inverted | 反向和平 |
| 34 | rock | 摇滚 |
| 35 | stop | 停止 |
| 36 | stop_inverted | 反向停止 |
| 37 | three | 三 |
| 38 | three2 | 三2 |
| 39 | two_up | 二上 |
| 40 | two_up_inverted | 反向二上 |
| 41 | three_gun | 三枪 |
| 42 | one_left | 一左 |
| 43 | one_right | 一右 |
| 44 | one_down | 一下 |

*(注：完整列表包含122种手势，以上为主要手势类型)*

### 使用示例

```python
import cv2
import numpy as np
from onnx_models import HandDetection, HandClassification

# 初始化模型
detection_model = HandDetection("models/hand_detector.onnx", (320, 256), 0.5)
classification_model = HandClassification("models/crops_classifier.onnx", (128, 128))

# 读取图像
frame = cv2.imread("test_image.jpg")

# 步骤1：手部检测
boxes, probs = detection_model(frame)

# 步骤2：手势分类
if len(boxes) > 0:
    labels = classification_model(frame, boxes)
    
    # 输出结果
    gesture_names = ['hand_down', 'hand_right', 'hand_left', 'thumb_index', ...]
    for i, (box, label) in enumerate(zip(boxes, labels)):
        x1, y1, x2, y2 = box
        gesture_name = gesture_names[label]
        print(f"手部 {i+1}: 坐标=({x1}, {y1}, {x2}, {y2}), 手势={gesture_name}")
```

### 性能指标

| 指标 | 值 |
|------|-----|
| 推理速度 (CPU) | ~50-80 FPS (单个手部) |
| 推理速度 (GPU) | ~200+ FPS (单个手部) |
| 模型大小 | ~2-5 MB |
| 分类准确率 | Top-1: ~0.92-0.96 |
| 批处理能力 | 支持多手部同时分类 |

---

## 系统工作流程

### 完整处理流程

```
原始图像 (BGR, H×W×3)
    ↓
[手部检测模型]
    ↓
手部边界框 + 置信度
    ↓
[手部裁剪提取]
    ↓
手部图像 (正方形裁剪)
    ↓
[手势分类模型]
    ↓
手势类别标签 (0-121)
    ↓
[手势跟踪与动作识别]
    ↓
动作事件 (SWIPE_LEFT, DRAG, etc.)
    ↓
[操作执行]
    ↓
键盘按键 / 图片显示
```

### 详细步骤说明

#### 步骤1：手部检测
- 输入：原始摄像头图像帧
- 处理：使用手部检测模型检测所有手部
- 输出：手部边界框坐标和置信度分数

#### 步骤2：手部裁剪
- 输入：原始图像和手部边界框
- 处理：从原始图像中裁剪出手部区域，并调整为正方形
- 输出：手部裁剪图像

#### 步骤3：手势分类
- 输入：手部裁剪图像
- 处理：使用手势分类模型识别手势类型
- 输出：手势类别标签

#### 步骤4：手势跟踪
- 输入：连续帧的手势检测结果
- 处理：使用卡尔曼滤波器跟踪手部运动轨迹
- 输出：稳定的手部轨迹和手势序列

#### 步骤5：动作识别
- 输入：手势位置序列
- 处理：根据手势位置变化识别动作类型
- 输出：动作事件 (如SWIPE_LEFT, DRAG等)

#### 步骤6：操作执行
- 输入：动作事件
- 处理：触发对应的操作 (键盘按键、图片显示等)
- 输出：实际的用户界面响应

---

## 前端项目集成指南

### 环境要求

#### 硬件要求
- **CPU**: Intel i5 或更高 (推荐 i7)
- **GPU**: NVIDIA GPU (可选，用于加速推理)
- **内存**: 最低 4GB，推荐 8GB+
- **摄像头**: 支持USB摄像头或内置摄像头

#### 软件要求
- **操作系统**: Windows 10/11, Linux, macOS
- **Python**: 3.8 或更高版本
- **ONNX Runtime**: 1.12.0 或更高版本
- **OpenCV**: 4.5.0 或更高版本

### 依赖安装

```bash
pip install onnxruntime opencv-python numpy scipy
```

如果需要GPU加速：
```bash
pip install onnxruntime-gpu
```

### 模型文件部署

#### 目录结构
```
your_project/
├── models/
│   ├── hand_detector.onnx       # 手部检测模型
│   └── crops_classifier.onnx    # 手势分类模型
├── src/
│   ├── gesture_detection.py     # 手势检测模块
│   ├── gesture_classification.py # 手势分类模块
│   └── main_controller.py       # 主控制器
└── main.py                      # 主程序入口
```

#### 模型加载代码

```python
import onnxruntime as ort
import cv2
import numpy as np

class GestureRecognitionSystem:
    def __init__(self, detector_path, classifier_path):
        """
        初始化手势识别系统
        
        参数:
            detector_path: 手部检测模型路径
            classifier_path: 手势分类模型路径
        """
        # 加载手部检测模型
        self.detection_session = ort.InferenceSession(detector_path)
        self.detection_input_name = self.detection_session.get_inputs()[0].name
        self.detection_output_names = [output.name for output in self.detection_session.get_outputs()]
        
        # 加载手势分类模型
        self.classification_session = ort.InferenceSession(classifier_path)
        self.classification_input_name = self.classification_session.get_inputs()[0].name
        self.classification_output_names = [output.name for output in self.classification_session.get_outputs()]
        
        # 预处理参数
        self.detector_size = (320, 256)
        self.classifier_size = (128, 128)
        self.mean = np.array([127, 127, 127], dtype=np.float32)
        self.std = np.array([128, 128, 128], dtype=np.float32)
        
        # 手势类别名称
        self.gesture_names = [
            'hand_down', 'hand_right', 'hand_left', 'thumb_index', 'thumb_left',
            'thumb_right', 'thumb_down', 'half_up', 'half_left', 'half_right',
            # ... 完整列表
        ]
    
    def preprocess_for_detection(self, frame):
        """预处理图像用于手部检测"""
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, self.detector_size)
        image = (image - self.mean) / self.std
        image = np.transpose(image, [2, 0, 1])
        image = np.expand_dims(image, axis=0)
        return image.astype(np.float32)
    
    def preprocess_for_classification(self, crop):
        """预处理手部裁剪用于手势分类"""
        image = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, self.classifier_size)
        image = (image - self.mean) / self.std
        image = np.transpose(image, [2, 0, 1])
        image = np.expand_dims(image, axis=0)
        return image.astype(np.float32)
    
    def detect_hands(self, frame, confidence_threshold=0.5):
        """
        检测图像中的手部
        
        参数:
            frame: 输入图像 (BGR格式)
            confidence_threshold: 置信度阈值
            
        返回:
            boxes: 手部边界框 [[x1, y1, x2, y2], ...]
            probs: 置信度分数 [prob1, prob2, ...]
        """
        # 预处理
        input_tensor = self.preprocess_for_detection(frame)
        
        # 推理
        outputs = self.detection_session.run(
            self.detection_output_names,
            {self.detection_input_name: input_tensor}
        )
        
        # 后处理
        detections = outputs[0][0]
        valid_detections = detections[detections[:, 4] > confidence_threshold]
        
        boxes = valid_detections[:, :4]
        probs = valid_detections[:, 4]
        
        # 坐标映射回原始图像尺寸
        height, width = frame.shape[:2]
        scale_x = width / self.detector_size[0]
        scale_y = height / self.detector_size[1]
        
        boxes[:, 0] *= scale_x
        boxes[:, 1] *= scale_y
        boxes[:, 2] *= scale_x
        boxes[:, 3] *= scale_y
        
        return boxes.astype(np.int32), probs
    
    def classify_gestures(self, frame, boxes):
        """
        分类手部手势
        
        参数:
            frame: 原始图像
            boxes: 手部边界框
            
        返回:
            labels: 手势类别标签 [label1, label2, ...]
        """
        if len(boxes) == 0:
            return []
        
        # 提取手部裁剪
        crops = self.extract_hand_crops(frame, boxes)
        
        # 预处理所有裁剪
        processed_crops = []
        for crop in crops:
            if crop is not None and crop.size > 0:
                processed_crop = self.preprocess_for_classification(crop)
                processed_crops.append(processed_crop)
        
        if not processed_crops:
            return []
        
        # 批量推理
        concatenated_crops = np.concatenate(processed_crops, axis=0)
        outputs = self.classification_session.run(
            self.classification_output_names,
            {self.classification_input_name: concatenated_crops}
        )[0]
        
        # 获取预测类别
        labels = np.argmax(outputs, axis=1)
        return labels.tolist()
    
    def extract_hand_crops(self, frame, boxes):
        """从图像中提取手部裁剪"""
        crops = []
        for bbox in boxes:
            x0, y0, x1, y1 = self.get_square_crop(bbox, frame)
            crop = frame[y0:y1, x0:x1]
            crops.append(crop)
        return crops
    
    def get_square_crop(self, box, image):
        """将边界框转换为正方形裁剪"""
        height, width, _ = image.shape
        x0, y0, x1, y1 = box
        w, h = x1 - x0, y1 - y0
        
        if h < w:
            y0 = y0 - int((w - h) / 2)
            y1 = y0 + w
        if h > w:
            x0 = x0 - int((h - w) / 2)
            x1 = x0 + h
        
        x0 = max(0, x0)
        y0 = max(0, y0)
        x1 = min(width - 1, x1)
        y1 = min(height - 1, y1)
        
        return x0, y0, x1, y1
    
    def process_frame(self, frame):
        """
        处理单帧图像
        
        参数:
            frame: 输入图像帧 (BGR格式)
            
        返回:
            boxes: 手部边界框
            labels: 手势类别标签
            gesture_names: 手势名称
        """
        # 手部检测
        boxes, probs = self.detect_hands(frame)
        
        # 手势分类
        labels = self.classify_gestures(frame, boxes)
        
        # 获取手势名称
        gesture_names = [self.gesture_names[label] if label < len(self.gesture_names) else "unknown" 
                         for label in labels]
        
        return boxes, labels, gesture_names


# 使用示例
if __name__ == "__main__":
    # 初始化系统
    system = GestureRecognitionSystem(
        detector_path="models/hand_detector.onnx",
        classifier_path="models/crops_classifier.onnx"
    )
    
    # 打开摄像头
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # 水平翻转
        frame = cv2.flip(frame, 1)
        
        # 处理帧
        boxes, labels, gesture_names = system.process_frame(frame)
        
        # 可视化结果
        for i, (box, gesture_name) in enumerate(zip(boxes, gesture_names)):
            x1, y1, x2, y2 = box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, gesture_name, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        cv2.imshow("Gesture Recognition", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
```

### Web前端集成

#### 使用WebAssembly (ONNX Runtime Web)

```html
<!DOCTYPE html>
<html>
<head>
    <title>手势识别Web应用</title>
    <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort.min.js"></script>
</head>
<body>
    <video id="video" width="640" height="480" autoplay></video>
    <canvas id="canvas" width="640" height="480"></canvas>
    <div id="output"></div>

    <script>
        // 初始化ONNX Runtime
        const detectionSession = await ort.InferenceSession.create('models/hand_detector.onnx');
        const classificationSession = await ort.InferenceSession.create('models/crops_classifier.onnx');

        // 获取视频流
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const output = document.getElementById('output');

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                video.play();
            });

        // 处理每一帧
        async function processFrame() {
            ctx.drawImage(video, 0, 0, 640, 480);
            const imageData = ctx.getImageData(0, 0, 640, 480);
            
            // 预处理
            const inputTensor = preprocessForDetection(imageData);
            
            // 手部检测
            const detectionResults = await detectionSession.run({ 'images': inputTensor });
            const detections = detectionResults['output'].data;
            
            // 提取手部裁剪
            const crops = extractHandCrops(imageData, detections);
            
            // 手势分类
            for (const crop of crops) {
                const cropTensor = preprocessForClassification(crop);
                const classificationResults = await classificationSession.run({ 'input': cropTensor });
                const gestureLabel = classificationResults['output'].data.indexOf(Math.max(...classificationResults['output'].data));
                
                output.innerHTML += `手势: ${gestureLabel}<br>`;
            }
            
            requestAnimationFrame(processFrame);
        }

        processFrame();
    </script>
</body>
</html>
```

### 移动端集成

#### React Native集成

```javascript
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import ort from 'onnxruntime-react-native';

const GestureRecognitionScreen = () => {
    const cameraRef = useRef(null);
    const detectionSessionRef = useRef(null);
    const classificationSessionRef = useRef(null);

    useEffect(() => {
        async function initModels() {
            // 加载手部检测模型
            detectionSessionRef.current = await ort.InferenceSession.create(
                'models/hand_detector.onnx'
            );

            // 加载手势分类模型
            classificationSessionRef.current = await ort.InferenceSession.create(
                'models/crops_classifier.onnx'
            );
        }

        initModels();
    }, []);

    const processFrame = async (frame) => {
        // 预处理
        const inputTensor = preprocessForDetection(frame);

        // 手部检测
        const detectionResults = await detectionSessionRef.current.run({
            'images': inputTensor
        });

        // 手势分类
        // ... 分类逻辑

        return detectionResults;
    };

    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                style={styles.camera}
                onFrame={processFrame}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
});

export default GestureRecognitionScreen;
```

---

## 性能优化建议

### 1. 模型量化

```python
# 使用量化模型减少内存占用和提高推理速度
quantized_detector = "models/hand_detector_quantized.onnx"
quantized_classifier = "models/crops_classifier_quantized.onnx"
```

### 2. 批处理

```python
# 同时处理多个手部裁剪
def batch_classify(crops):
    processed_crops = [preprocess_for_classification(crop) for crop in crops]
    batch_tensor = np.concatenate(processed_crops, axis=0)
    outputs = classification_session.run(None, {'input': batch_tensor})[0]
    return np.argmax(outputs, axis=1)
```

### 3. 多线程处理

```python
import threading
from queue import Queue

class AsyncGestureRecognition:
    def __init__(self, detector_path, classifier_path):
        self.frame_queue = Queue(maxsize=2)
        self.result_queue = Queue()
        
        # 在单独的线程中初始化模型
        self.init_thread = threading.Thread(target=self._init_models, args=(detector_path, classifier_path))
        self.init_thread.start()
        
        # 启动处理线程
        self.process_thread = threading.Thread(target=self._process_frames)
        self.process_thread.start()
    
    def _init_models(self, detector_path, classifier_path):
        self.detection_session = ort.InferenceSession(detector_path)
        self.classification_session = ort.InferenceSession(classifier_path)
    
    def _process_frames(self):
        while True:
            frame = self.frame_queue.get()
            results = self.process_frame(frame)
            self.result_queue.put(results)
    
    def async_process(self, frame):
        self.frame_queue.put(frame)
    
    def get_results(self):
        if not self.result_queue.empty():
            return self.result_queue.get()
        return None
```

### 4. GPU加速

```python
# 使用GPU执行提供程序
import onnxruntime as ort

providers = [
    'CUDAExecutionProvider',  # NVIDIA GPU
    'DmlExecutionProvider',  # DirectML (Windows)
    'CPUExecutionProvider'    # CPU fallback
]

session = ort.InferenceSession(
    model_path,
    providers=providers
)
```

---

## 故障排除

### 常见问题

#### 1. 模型加载失败
**问题**: `onnxruntime.capi.onnxruntime_pybind11_state.InvalidGraph`

**解决方案**:
- 检查ONNX模型文件是否损坏
- 确认ONNX Runtime版本与模型兼容
- 重新导出ONNX模型

#### 2. 推理速度慢
**问题**: FPS低于预期

**解决方案**:
- 使用GPU加速
- 使用量化模型
- 减少输入图像尺寸
- 启用批处理

#### 3. 检测准确率低
**问题**: 手部检测漏检或误检

**解决方案**:
- 调整置信度阈值
- 改善光照条件
- 确保手部在摄像头视野内
- 使用更高分辨率的输入图像

#### 4. 分类错误
**问题**: 手势分类不准确

**解决方案**:
- 确保手部裁剪质量
- 调整预处理参数
- 使用更大的训练数据集重新训练模型

---

## 技术支持

如有问题或需要技术支持，请联系：
- 项目仓库: [GitHub链接]
- 文档: [文档链接]
- 邮箱: [联系邮箱]

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本 |

---

## 许可证

本项目采用 Apache 2.0 许可证。详见 [LICENSE-2.0.txt](license/LICENSE-2.0.txt) 文件。

---

## 附录

### A. 完整手势类别列表

```python
targets = [
    'hand_down', 'hand_right', 'hand_left', 'thumb_index', 'thumb_left',
    'thumb_right', 'thumb_down', 'half_up', 'half_left', 'half_right',
    'half_down', 'part_hand_heart', 'part_hand_heart2', 'fist_inverted',
    'two_left', 'two_right', 'two_down', 'grabbing', 'grip', 'point',
    'call', 'three3', 'little_finger', 'middle_finger', 'dislike',
    'fist', 'four', 'like', 'mute', 'ok', 'one', 'palm', 'peace',
    'peace_inverted', 'rock', 'stop', 'stop_inverted', 'three',
    'three2', 'two_up', 'two_up_inverted', 'three_gun', 'one_left',
    'one_right', 'one_down'
]
```

### B. 动作事件列表

```python
class Event(Enum):
    UNKNOWN = -1
    SWIPE_RIGHT = 0
    SWIPE_LEFT = 1
    SWIPE_UP = 2
    SWIPE_DOWN = 3
    DRAG = 4
    DROP = 5
    FAST_SWIPE_DOWN = 6
    FAST_SWIPE_UP = 7
    ZOOM_IN = 8
    ZOOM_OUT = 9
    SWIPE_RIGHT2 = 10
    SWIPE_LEFT2 = 11
    SWIPE_UP2 = 12
    SWIPE_DOWN2 = 13
    DOUBLE_TAP = 14
    SWIPE_RIGHT3 = 15
    SWIPE_LEFT3 = 16
    SWIPE_UP3 = 17
    SWIPE_DOWN3 = 18
    DRAG2 = 19
    DROP2 = 20
    DRAG3 = 21
    DROP3 = 22
    TAP = 23
    COUNTERCLOCK = 24
    CLOCKWISE = 25
    FIST = 26
```

### C. 参考文献和资源

- ONNX Runtime文档: https://onnxruntime.ai/docs/
- YOLOv10论文: [链接]
- MobileNetV3论文: [链接]
- OpenCV文档: https://docs.opencv.org/

---

**文档结束**