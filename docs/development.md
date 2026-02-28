# 开发环境配置指南

本文档介绍 Museum 项目的开发环境配置方法，帮助新成员快速搭建开发环境。

## 1. 环境要求

### 操作系统

- Windows 10/11

### 软件版本要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Python | 3.13.5 | 后端运行环境 |
| Node.js | 20.19.5 | 前端构建工具 |
| npm | 10.8.2 | 包管理器 |
| Conda | 最新版 | Python 环境管理（推荐） |

### 硬件要求

- **内存**: 最低 8GB，推荐 16GB 以上
- **存储**: 至少 5GB 可用空间（包含模型文件）
- **显卡**: 支持 WebGL 的显卡（用于 3D 渲染）
- **摄像头**: 用于手势识别功能测试

---

## 2. 安装步骤

### 2.1 Python 安装

使用 Anaconda/Miniconda 安装 Python：

1. **下载 Miniconda**

   访问 https://docs.conda.io/en/latest/miniconda.html 下载 Windows 版本

2. **安装 Miniconda**

   双击下载的安装包，按提示完成安装

3. **验证安装**

   打开 PowerShell 或 CMD，执行：

   ```bash
   conda --version
   ```

### 2.2 Node.js 安装

1. **下载 Node.js**

   访问 https://nodejs.org/ 下载 v20.19.5 LTS 版本

2. **安装 Node.js**

   双击下载的安装包，按提示完成安装

3. **验证安装**

   ```bash
   node --version
   npm --version
   ```

### 2.3 创建 Conda 虚拟环境

```bash
# 创建名为 dynamic 的环境，Python 版本 3.13
conda create -n dynamic python=3.13

# 激活环境
conda activate dynamic
```

### 2.4 安装项目依赖

#### 前端依赖安装

```bash
# 在项目根目录执行
npm install
```

#### 后端依赖安装

```bash
# 激活 Conda 环境后执行
pip install -r backend/requirements.txt
```

### 2.5 下载模型文件

模型文件需要放置在以下位置：

```
dynamic_gestures/models/
├── YOLOv10n_hands.onnx      # 手部检测模型
├── crops_classifier.onnx     # 手势分类模型
└── MobileNetV3_large.onnx    # 图像分类模型

models/
└── hand_landmarker.task      # MediaPipe 手部关键点模型（首次运行自动下载）
```

---

## 3. 环境变量配置

### 3.1 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 复制示例文件
copy .env.example .env
```

### 3.2 配置即梦 AI

即梦 AI 是本项目的 AI 生图服务提供商。

> **注意**: 即梦账号需要自己注册，注册后会赠送 200 次生图次数。
> 注册地址: https://console.volcengine.com/ark

在 `.env` 文件中配置：

```env
# AI 生图配置
AI_PROVIDER=jimeng
ARK_API_KEY=你的API密钥
JIMENG_MODEL=doubao-seedream-4-5-251128
```

### 3.3 主要环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `AI_PROVIDER` | 是 | jimeng | AI 生图提供商 |
| `ARK_API_KEY` | 是 | - | 火山引擎 Ark API Key |
| `JIMENG_MODEL` | 否 | doubao-seedream-4-5-251128 | 即梦 AI 模型名称 |
| `PORT` | 否 | 5000 | 后端服务端口 |
| `CORS_ORIGINS` | 否 | * | CORS 允许的源 |

---

## 4. 项目启动

### 4.1 同时启动前后端

```bash
# 确保已激活 Conda 环境
conda activate dynamic

# 启动项目
npm run start
```

此命令会同时启动：
- 前端开发服务器（端口 3002）
- 后端 API 服务器（端口 5000）

### 4.2 单独启动（可选）

**启动前端**

```bash
npm run dev
```

前端服务运行在 http://localhost:3002

**启动后端**

```bash
# 激活环境后
conda activate dynamic
python backend/app.py
```

后端服务运行在 http://localhost:5000

### 4.3 验证服务状态

| 服务 | 地址 | 验证方式 |
|------|------|---------|
| 前端 | http://localhost:3002 | 浏览器访问显示欢迎页面 |
| 后端 | http://localhost:5000/api/health | 健康检查接口 |

---

## 5. 常见问题

### 5.1 端口被占用

**问题描述**

启动时报错：`Error: listen EADDRINUSE: address already in use`

**解决方案**

```bash
# 查找占用端口的进程
netstat -ano | findstr :3002
netstat -ano | findstr :5000

# 终止进程（PID 为上一步查到的进程ID）
taskkill /PID <PID> /F
```

### 5.2 Python 环境问题

**问题描述**

- `ModuleNotFoundError: No module named 'xxx'`
- Python 版本不兼容

**解决方案**

```bash
# 检查当前 Python 版本
python --version

# 确保使用正确的 Conda 环境
conda activate dynamic

# 重新安装依赖
pip install -r backend/requirements.txt
```

**问题描述**

Conda 环境激活失败

**解决方案**

```bash
# 初始化 Conda（首次使用）
conda init powershell

# 重启 PowerShell 后激活环境
conda activate dynamic
```

### 5.3 依赖安装失败

**问题描述**

npm install 报错网络超时或权限问题

**解决方案**

```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com

# 清除缓存后重新安装
npm cache clean --force
npm install
```

**问题描述**

pip install 报错

**解决方案**

```bash
# 使用国内镜像源
pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 5.4 模型加载失败

**问题描述**

- `Failed to load ONNX model`
- `Model file not found`

**解决方案**

1. 检查模型文件是否存在：

```bash
dir dynamic_gestures\models\
dir models\
```

2. 确认模型文件完整性（文件大小应大于 1MB）

### 5.5 摄像头无法使用

**问题描述**

浏览器提示摄像头权限被拒绝或无法访问

**解决方案**

1. 确保使用 HTTPS 或 localhost（浏览器安全策略要求）
2. 检查浏览器摄像头权限设置
3. 关闭其他占用摄像头的应用程序
4. Chrome 地址栏输入 `chrome://settings/content/camera` 检查权限

### 5.6 手势识别不准确

**问题描述**

手势识别响应慢或识别错误

**解决方案**

1. 确保光照充足，避免逆光
2. 保持手部在画面中央
3. 检查后端服务是否正常运行

---

## 6. 开发工具推荐

### IDE/编辑器

- **VS Code**（推荐）
  - 插件：Vue - Official、Python、ESLint、Prettier

### 浏览器扩展

- **Vue.js devtools** - Vue 组件调试

### 命令行工具

- **Windows Terminal**（Windows）

---

## 7. 相关文档

- [项目概述](./01-项目概述.md)
- [前端架构](./02-前端架构.md)
- [后端架构](./03-后端架构.md)
- [开发指南](./06-开发指南.md)
- [更新日志](./CHANGELOG.md)
