# 更新日志

本文档记录项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

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
