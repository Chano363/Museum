# 更新日志

本文档记录项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

### 优化 - 2026-02-28

#### 跨平台兼容性改进

**问题描述:**
项目中存在硬编码的 Windows 路径，导致无法在 Linux 服务器上部署。

**解决方案:**
移除硬编码路径，使用环境变量和动态检测替代。

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `scripts/start.js` | 移除硬编码 Conda 路径，改用环境变量和动态检测 |
| `museum.spec` | 移除硬编码 mediapipe DLL 路径，动态查找库文件 |
| `backend/requirements.txt` | 新增：Python 依赖列表，用于 Linux 部署 |

**具体修改:**

1. **scripts/start.js** - Python 路径检测逻辑
   ```javascript
   function getPythonPath() {
     // 优先使用环境变量
     if (process.env.PYTHON_PATH) {
       return process.env.PYTHON_PATH
     }
     // Windows 下检测 Conda 环境
     if (isWindows) {
       const condaPath = process.env.CONDA_PREFIX || 'D:\\Anaconda\\envs\\dynamic'
       // ...
     }
     // Linux 默认使用 python3
     return isWindows ? 'python' : 'python3'
   }
   ```

2. **museum.spec** - 动态查找 mediapipe 库
   ```python
   def find_mediapipe_dll():
       import mediapipe
       mp_path = os.path.dirname(mediapipe.__file__)
       dll_name = 'libmediapipe.dll' if sys.platform == 'win32' else 'libmediapipe.so'
       # ...
   ```

3. **新增 requirements.txt**
   - flask, flask-socketio, flask-cors
   - opencv-python, numpy, pillow
   - mediapipe, onnxruntime, scipy
   - requests, python-dotenv

---

#### 精简后端AI生图代码

**问题描述:**
后端代码包含多个AI生图服务商（Siliconflow、SD WebUI）的实现，但实际只使用即梦API，造成代码冗余。

**解决方案:**
移除未使用的Siliconflow和SD WebUI相关代码，只保留即梦API实现。

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `backend/sketch_api.py` | 移除：call_siliconflow_api函数、call_sd_webui函数、相关配置变量 |

**具体修改:**

1. **移除的配置变量**
   - `AI_PROVIDER`
   - `SILICONFLOW_API_KEY`
   - `SILICONFLOW_API_URL`
   - `SD_WEBUI_URL`
   - `DEFAULT_NEGATIVE_PROMPT`
   - `BRONZE_QUALITY_PROMPT`

2. **移除的函数**
   - `call_siliconflow_api()` - Siliconflow API调用
   - `call_sd_webui()` - SD WebUI API调用

3. **简化的函数**
   - `generate_image()` - 直接调用即梦API，移除provider切换逻辑
   - `get_config()` - 只返回即梦相关配置
   - `set_config()` - 只支持即梦相关配置

---

### 新增 - 2026-02-27

#### 保存3D模型截图功能

**功能描述:**
用户保存作品时，自动截取带纹理的3D模型截图作为作品缩略图，在排行榜和博物馆中展示。

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `src/components/SketchGenerator/VasePreview.vue` | 新增：captureScreenshot方法，使用model-viewer的toBlob API截图 |
| `src/components/SketchGenerator/SketchGenerator.vue` | 修改：保存时先截图上传，再保存作品信息 |
| `backend/sketch_api.py` | 新增：/api/gallery/upload接口，接收base64图片并保存 |
| `backend/gallery_db.py` | 修改：新增texture_path字段，区分截图和纹理图 |

**具体修改:**

1. **截图功能**
   ```typescript
   async function captureScreenshot(): Promise<string | null> {
     const blob = await modelViewer.toBlob({ mimeType: 'image/png', quality: 1 })
     return new Promise((resolve) => {
       const reader = new FileReader()
       reader.onloadend = () => resolve(reader.result as string)
       reader.readAsDataURL(blob)
     })
   }
   ```

2. **数据库字段**
   - `image_path`: 3D模型截图（用于展示）
   - `texture_path`: 纹理图片（用于贴图）

3. **保存流程**
   ```
   用户点击保存 → 截取3D模型截图 → 上传截图 → 保存作品信息到数据库
   ```

---

### 重构 - 2026-02-27

#### AI生图功能重构为模型纹理创作系统

**功能描述:**
将原有的青铜器纹理生成功能重构为模型纹理创作系统，支持三种预设3D模型，用户绘制草图后通过AI生成纹理图案，生成的作品可添加到博物馆中与手势交互。

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `src/constants/vaseConstants.ts` | 新增：定义三种预设模型（瓷器花瓶、簋、爵）和六种提示词模板 |
| `src/components/SketchGenerator/VasePreview.vue` | 新增：3D模型预览组件，支持纹理贴图 |
| `src/components/SketchGenerator/GeneratePanel.vue` | 重写：模型选择、风格选择、自定义提示词功能 |
| `src/components/SketchGenerator/SketchGenerator.vue` | 重写：三栏布局（画布/预览/控制），SVG图标替代emoji |
| `src/components/SketchGenerator/LeaderboardPanel.vue` | 修改：移除emoji改用SVG图标，bronze_type改为base_model |
| `src/components/SketchGenerator/GalleryPanel.vue` | 修改：axios改为fetch API |
| `src/components/SketchView.vue` | 简化：包装SketchGenerator组件 |
| `src/App.vue` | 新增：handleSaveToGallery方法，将生成作品添加到artifacts |
| `src/services/sketchGenerator.ts` | 修改：更新GenerateConfig接口 |
| `backend/sketch_api.py` | 修改：bronze_type改为base_model，更新提示词模板 |
| `backend/gallery_db.py` | 修改：数据库字段bronze_type改为base_model，新增custom_prompt |

**具体修改:**

1. **预设模型定义**
   ```typescript
   export const BASE_MODELS: BaseModel[] = [
     { id: 'vase', name: '瓷器花瓶', modelPath: '/3Dmodels/瓷器花瓶/...' },
     { id: 'gui', name: '簋（食器）', modelPath: '/3Dmodels/簋（食器）/...' },
     { id: 'jue', name: '爵（饮酒器）', modelPath: '/3Dmodels/爵（饮酒器）/...' }
   ]
   ```

2. **提示词模板**
   ```typescript
   export const PROMPT_TEMPLATES: PromptTemplate[] = [
     { id: 'floral', name: '花卉图案', prompt: '中国传统花卉图案...' },
     { id: 'landscape', name: '山水图案', prompt: '中国山水画风格...' },
     { id: 'geometric', name: '几何图案', prompt: '中国传统几何纹样...' },
     { id: 'dragon', name: '龙凤图案', prompt: '龙凤纹样...' },
     { id: 'bird', name: '花鸟图案', prompt: '花鸟画风格...' },
     { id: 'custom', name: '自定义', prompt: '' }
   ]
   ```

3. **生成作品添加到博物馆**
   ```typescript
   handleSaveToGallery(data) {
     const newArtifact = {
       id: this.generatedArtifactIdCounter++,
       name: `创作作品 #${data.id}`,
       modelPath: baseModel.modelPath,
       iconPath: data.textureUrl,
       isGenerated: true,
       textureUrl: data.textureUrl
     }
     this.artifacts.push(newArtifact)
   }
   ```

4. **UI图标改用SVG**
   - 移除所有emoji图标（🏆、🥇、🥈、🥉等）
   - 使用内联SVG替代，保持视觉一致性

**功能特性:**
- 三种预设3D模型供用户选择
- 六种提示词模板 + 自定义提示词
- 生成的纹理实时预览在3D模型上
- 作品保存后自动添加到博物馆展品列表
- 支持手势交互查看生成的作品
- 排行榜功能保持不变

---

### 新增 - 2026-02-26

#### AI生图调试信息显示功能

**功能描述:**
在AI生图功能中添加调试信息显示，包括生图时间和提示词，仅在开发模式(dev)下显示，方便调试和性能分析。

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `src/services/sketchGenerator.ts` | 添加 `generationTime` 字段，使用 `performance.now()` 计算耗时 |
| `src/components/SketchGenerator/SketchGenerator.vue` | 添加 `generationTime` 和 `prompt` 传递给子组件 |
| `src/components/SketchGenerator/TextureResult.vue` | 在dev模式下显示生图耗时和提示词 |
| `.env` | 禁用后端自动打开浏览器 (`OPEN_BROWSER=false`) |

**具体修改:**

1. **服务层时间计算**
   ```typescript
   const startTime = performance.now()
   // ... API请求
   const endTime = performance.now()
   generationTime: Math.round(endTime - startTime)
   ```

2. **组件层传递数据**
   ```vue
   <TextureResult :generation-time="generationTime" :prompt="lastPrompt" />
   ```

3. **UI层条件显示**
   ```vue
   <div v-if="showDevInfo && (generationTime || prompt)" class="dev-info-panel">
     <div class="dev-info-header">
       <span class="dev-badge">DEV</span>
       <span>调试信息</span>
     </div>
     <div class="dev-info-row">
       <span>生图耗时:</span>
       <span>{{ generationTime }}ms</span>
     </div>
     <div class="dev-info-row">
       <span>提示词:</span>
       <span>{{ prompt }}</span>
     </div>
   </div>
   ```

**UI效果:**
- 在生成的纹理图片下方显示调试信息面板
- 包含生图耗时（毫秒）和完整提示词
- 仅在开发模式 (`npm run dev`) 下显示
- 生产构建后不显示

---

### 优化 - 2025-02-12

#### 改用WebSocket减少网络延迟

**问题描述:**
HTTP每次请求都有连接建立开销，导致手指追踪响应延迟

**解决方案:**
改用WebSocket长连接，消除连接建立开销

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `backend/app.py` | 添加Socket.IO支持，同时保留HTTP API作为备用 |
| `src/services/backendGestureRecognition.ts` | 改用Socket.IO客户端，建立长连接 |
| `package.json` | 添加 `socket.io-client` 依赖 |

**具体修改:**

1. **后端WebSocket支持**
   ```python
   # 使用Socket.IO
   sio = socketio.Server(cors_allowed_origins='*')
   
   @sio.on('frame')
   def handle_frame(sid, data):
       result = process_frame(data['image'])
       sio.emit('result', result, to=sid)
   ```

2. **前端WebSocket客户端**
   ```typescript
   // 建立长连接
   this.socket = io('http://localhost:5000', {
     transports: ['websocket'],
     reconnection: true
   })
   
   // 发送帧数据
   this.socket.emit('frame', { image: base64Image })
   
   // 接收结果
   this.socket.on('result', (result) => { ... })
   ```

**性能提升:**
- 消除HTTP连接建立开销
- 减少网络往返延迟
- 支持自动重连

**新增依赖:**
- 前端: `socket.io-client`
- 后端: `python-socketio`, `eventlet`

---

### 优化 - 2025-02-12 (早些时候)

#### 合并API减少网络延迟

**问题描述:**
手指追踪需要两次HTTP请求（手势识别+手指追踪），导致响应延迟

**解决方案:**
将两个API合并为一个，一次请求返回手势识别和手指追踪结果

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `backend/app.py` | 合并 `/api/recognize` 和 `/api/hand-tracking`，一次返回所有结果 |
| `src/services/backendGestureRecognition.ts` | 更新返回类型，包含 `fingerPosition` 和 `landmarks` |
| `src/components/GestureControl.vue` | 使用合并后的API，移除单独的手指追踪请求 |

**具体修改:**

1. **后端API合并**
   ```python
   # 修改前: 两个独立API
   POST /api/recognize    -> { detections: [...] }
   POST /api/hand-tracking -> { position: {...} }
   
   # 修改后: 合并为一个API
   POST /api/recognize -> {
     detections: [...],
     fingerPosition: { x, y, z },
     landmarks: [...]
   }
   ```

2. **前端服务更新**
   ```typescript
   interface ProcessFrameResult {
     detections: HandDetection[]
     fingerPosition: { x: number; y: number; z: number } | null
     landmarks: Array<{ x: number; y: number; z: number }>
   }
   ```

**性能提升:**
- HTTP请求次数减少50%（每帧从2次变为1次）
- 消除了两次请求之间的等待时间
- 减少了网络往返延迟

---

### 修复 - 2025-02-12 (早些时候)

#### 手指追踪和模型旋转问题修复

**问题描述:**
1. 小白点和手指移动方向水平翻转
2. 小白点移动缓慢，响应延迟明显
3. 3D模型不跟随小白点旋转

**根本原因:**
1. 摄像头画面使用 `scaleX(-1)` 镜像翻转，但小白点坐标未对应翻转
2. 请求间隔设置为100ms（10fps），对于实时追踪太慢
3. 模型旋转灵敏度设置过低（0.3）

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `src/components/GestureControl.vue` | 翻转x坐标以匹配镜像画面 |
| `src/components/MainView.vue` | 提高旋转灵敏度至1.5 |
| `src/constants/gestureConstants.ts` | 请求间隔从100ms降至33ms（约30fps） |

**具体修改:**

1. **小白点坐标翻转** - 匹配镜像摄像头画面
   ```typescript
   // 摄像头画面是镜像的(scaleX(-1))，需要翻转x坐标
   const mirroredX = 640 - x
   ```

2. **提高请求频率** - 改善响应延迟
   ```typescript
   // 修改前: 100ms间隔，约10fps
   MIN_REQUEST_INTERVAL: 100
   
   // 修改后: 33ms间隔，约30fps
   MIN_REQUEST_INTERVAL: 33
   ```

3. **提高旋转灵敏度** - 确保模型明显响应
   ```typescript
   // 修改前
   const sensitivity = 0.3
   
   // 修改后
   const sensitivity = 1.5
   ```

---

### 修复 - 2025-02-12 (早些时候)

#### 手势识别响应问题修复

**问题描述:**
1. SWIPE动作误触发频繁，用户做非预期手势时也会触发模型切换
2. 点赞/点踩手势反应慢，无法正常触发放大/缩小
3. 旋转手势小白点卡顿，模型不跟随手指移动

**根本原因:**
1. 后端返回的静态手势ID (0-18) 被错误地映射为SWIPE动作
   - 手势ID 0 = hand_down (手向下) → 错误映射为 switch_next
   - 手势ID 1 = hand_right (手向右) → 错误映射为 switch_prev
   - 实际上这些是静态手势分类，不是动态SWIPE事件
2. 投票机制阈值过高 (需要5帧历史+60%稳定性)
3. `processFrame` 和 `getHandTracking` 共享同一个 `isProcessing` 锁，导致请求冲突

**修改文件:**

| 文件 | 修改内容 |
|------|----------|
| `src/services/actionRecognition.ts` | 移除错误的SWIPE映射，简化手势映射表 |
| `src/constants/gestureConstants.ts` | 降低投票阈值，更新手势映射配置 |
| `src/services/backendGestureRecognition.ts` | 分离API锁，重构代码消除重复定义 |
| `src/components/GestureControl.vue` | 移除SWIPE相关处理逻辑 |

**具体修改:**

1. **手势映射修正** - 移除错误的SWIPE映射
   ```typescript
   // 修改前: 静态手势ID被错误映射为SWIPE
   0: 'switch_next',   // hand_down - 错误!
   1: 'switch_prev',   // hand_right - 错误!
   
   // 修改后: 只保留正确的手势映射
   27: 'zoom_in',      // 点赞 → 放大
   24: 'zoom_out',     // 点踩 → 缩小
   19: 'rotate',       // 指向 → 旋转
   // ...
   ```

2. **投票机制优化** - 降低阈值提高响应速度
   ```typescript
   // 修改前
   MIN_HISTORY_LENGTH_STATIC: 5
   STABILITY_THRESHOLD_STATIC: 0.6
   
   // 修改后
   MIN_HISTORY_LENGTH_STATIC: 3
   STABILITY_THRESHOLD_STATIC: 0.5
   ```

3. **API锁分离** - 解决旋转卡顿问题
   ```typescript
   // 修改前: 共享锁导致冲突
   private isProcessing = false
   
   // 修改后: 分离锁
   private isProcessingGesture = false
   private isProcessingTracking = false
   private lastGestureRequestTime = 0
   private lastTrackingRequestTime = 0
   ```

**当前支持的手势:**

| 手势ID | 名称 | 动作 |
|--------|------|------|
| 27 | 点赞 (like) | 放大模型 |
| 39 | 二指向上 (two_up) | 放大模型 |
| 24 | 点踩 (dislike) | 缩小模型 |
| 19 | 指向 (point) | 旋转模型 |
| 30 | 一指 (one) | 旋转模型 |
| 31 | 手掌 (palm) | 旋转模型 |
| 35 | 停止 (stop) | 旋转模型 |
| 36 | 反停止 (stop_inverted) | 旋转模型 |
| 29 | OK (ok) | 旋转模型 |

---

## 版本历史

### [0.0.0] - 初始版本

- 博物馆文物3D交互展示系统初始版本
- 支持45种手势识别
- 支持手势控制3D模型旋转、缩放
- 支持7件文物展品展示
