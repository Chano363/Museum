# API接口文档

## 概述

后端API基于Flask框架构建，提供RESTful接口服务。默认运行在端口5000。

**基础URL:** `http://localhost:5000`

**代理配置:** 前端通过Vite代理 `/api` 到后端服务

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

## 接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/recognize | 手势识别 |
| POST | /api/hand-tracking | 手部追踪 |

---

## POST /api/recognize

手势识别接口，接收图像数据并返回检测到的手势信息。

### 请求

**URL:** `/api/recognize`

**Method:** `POST`

**Content-Type:** `application/json`

**请求体:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| image | string | 是 | Base64编码的图像数据，包含data URI前缀 |

### 响应

**成功响应 (200 OK):**

```json
{
  "detections": [
    {
      "bbox": {
        "x1": 100,
        "y1": 150,
        "x2": 200,
        "y2": 300,
        "confidence": 0.85
      },
      "gesture": 27,
      "gestureName": "like"
    }
  ]
}
```

**响应字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| detections | array | 检测结果数组 |
| detections[].bbox | object | 边界框信息 |
| detections[].bbox.x1 | number | 左上角X坐标 |
| detections[].bbox.y1 | number | 左上角Y坐标 |
| detections[].bbox.x2 | number | 右下角X坐标 |
| detections[].bbox.y2 | number | 右下角Y坐标 |
| detections[].bbox.confidence | number | 检测置信度 (0-1) |
| detections[].gesture | number | 手势ID (0-44) |
| detections[].gestureName | string | 手势名称 |

**无检测结果:**

```json
{
  "detections": []
}
```

**错误响应:**

```json
{
  "error": "Failed to decode image"
}
```

**服务器错误 (500):**

```json
{
  "error": "错误信息",
  "traceback": "详细堆栈信息"
}
```

### 处理流程

```
1. 接收Base64图像数据
2. 解码图像为OpenCV格式
3. 执行手部检测 (YOLOv10n)
4. 执行手势分类 (crops_classifier)
5. 过滤低置信度结果 (threshold=0.6)
6. 返回检测结果
```

### 示例

**JavaScript (fetch):**

```javascript
async function recognizeGesture(imageData) {
  const response = await fetch('/api/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: imageData
    })
  })
  
  const result = await response.json()
  return result.detections
}
```

**JavaScript (axios):**

```javascript
import axios from 'axios'

async function recognizeGesture(imageData) {
  const response = await axios.post('/api/recognize', {
    image: imageData
  })
  return response.data.detections
}
```

---

## POST /api/hand-tracking

手部追踪接口，返回手部关键点位置信息。

### 请求

**URL:** `/api/hand-tracking`

**Method:** `POST`

**Content-Type:** `application/json`

**请求体:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 响应

**成功响应 (200 OK):**

```json
{
  "success": true,
  "position": {
    "x": 320,
    "y": 240,
    "z": 0.5
  },
  "landmarks": [
    {"x": 100, "y": 200, "z": 0.1},
    {"x": 105, "y": 195, "z": 0.12},
    // ... 共21个关键点
  ]
}
```

**响应字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 是否成功检测到手部 |
| position | object | 食指指尖位置 |
| position.x | number | X坐标 (像素) |
| position.y | number | Y坐标 (像素) |
| position.z | number | Z坐标 (深度，相对值) |
| landmarks | array | 21个手部关键点 |
| landmarks[].x | number | X坐标 (像素) |
| landmarks[].y | number | Y坐标 (像素) |
| landmarks[].z | number | Z坐标 (深度) |

**未检测到手部:**

```json
{
  "success": false,
  "message": "No hands detected"
}
```

**ONNX回退响应:**

当MediaPipe不可用时，使用ONNX模型回退：

```json
{
  "success": true,
  "position": {
    "x": 320,
    "y": 240,
    "z": 0.0
  },
  "landmarks": []
}
```

### 处理流程

```
1. 接收Base64图像数据
2. 解码图像为OpenCV格式
3. 转换为RGB格式
4. 尝试MediaPipe手部追踪
   ├── 成功: 提取21个关键点
   └── 失败: 使用ONNX回退
5. 返回追踪结果
```

### 手部关键点索引

```
索引  关键点
0     手腕 WRIST
1     拇指CMC
2     拇指MCP
3     拇指IP
4     拇指TIP
5     食指MCP
6     食指PIP
7     食指DIP
8     食指TIP ★ (用于手指追踪)
9     中指MCP
10    中指PIP
11    中指DIP
12    中指TIP
13    无名指MCP
14    无名指PIP
15    无名指DIP
16    无名指TIP
17    小指MCP
18    小指PIP
19    小指DIP
20    小指TIP
```

### 示例

**JavaScript:**

```javascript
async function trackHand(imageData) {
  const response = await fetch('/api/hand-tracking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: imageData
    })
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log('食指位置:', result.position)
    console.log('所有关键点:', result.landmarks)
  }
  
  return result
}
```

---

## 错误处理

### HTTP状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "error": "错误描述",
  "traceback": "详细堆栈信息 (仅开发环境)"
}
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| Failed to decode image | 图像解码失败 | 检查Base64编码是否正确 |
| No hands detected | 未检测到手部 | 确保图像中有清晰的手部 |
| Error in hand tracking | 追踪过程出错 | 检查后端日志 |

---

## 前端服务封装

### BackendGestureRecognitionService

```typescript
class BackendGestureRecognitionService {
  private readonly config = {
    CONNECTION_TIMEOUT: 3000,
    MAX_RETRIES: 1,
    MIN_REQUEST_INTERVAL: 100,
    IMAGE_WIDTH: 320,
    IMAGE_HEIGHT: 240,
    IMAGE_QUALITY: 0.7
  }
  
  async processFrame(imageData: ImageData): Promise<HandDetection[]> {
    // 1. 降分辨率
    const resizedImage = this.resizeImage(imageData)
    
    // 2. 转换为Base64
    const base64Image = this.imageDataToBase64(resizedImage)
    
    // 3. 发送请求
    const response = await this.sendRequest(base64Image)
    
    // 4. 解析响应
    return this.parseResponse(response)
  }
}
```

### 请求节流

```typescript
// 最小请求间隔100ms
if (now - this.lastRequestTime < this.config.MIN_REQUEST_INTERVAL) {
  return this.lastResult
}
```

### 连接超时

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => {
  controller.abort()
}, this.config.CONNECTION_TIMEOUT)

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  })
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('请求超时')
  }
}
```

---

## 性能优化建议

### 前端优化

1. **降分辨率传输**
   ```typescript
   IMAGE_WIDTH: 320
   IMAGE_HEIGHT: 240
   ```

2. **请求节流**
   ```typescript
   MIN_REQUEST_INTERVAL: 100  // 最小100ms间隔
   ```

3. **JPEG压缩**
   ```typescript
   IMAGE_QUALITY: 0.7  // 70%质量
   ```

### 后端优化

1. **批量推理**
   ```python
   concatenated_crops = np.concatenate(valid_processed_crops, axis=0)
   outputs = self.sess.run(None, {input_name: concatenated_crops})
   ```

2. **GPU加速**
   ```python
   providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
   ```

3. **内存优化**
   ```python
   options.enable_mem_pattern = False
   options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
   ```

---

## CORS配置

后端已启用CORS，支持跨域请求：

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

---

## 测试接口

### 使用curl测试

```bash
# 手势识别
curl -X POST http://localhost:5000/api/recognize \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'

# 手部追踪
curl -X POST http://localhost:5000/api/hand-tracking \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

### 使用Postman测试

1. 创建POST请求
2. 设置URL为 `http://localhost:5000/api/recognize`
3. 设置Header: `Content-Type: application/json`
4. 设置Body为raw JSON格式
5. 发送请求
