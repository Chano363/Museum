# 博物馆文物3D展示系统 - 部署指南

## 部署架构

- **前端**: Vercel (免费)
- **后端**: Render (免费)

---

## 第一步：部署后端到 Render

### 1. 注册 Render 账号
1. 访问 [https://render.com](https://render.com)
2. 使用 GitHub 账号登录

### 2. 创建 Web Service
1. 登录后进入 Render Dashboard
2. 点击右上角的 "New" 按钮
3. 选择 "Web Service"
4. 选择 "Build and deploy from a Git repository"
5. 点击 "Next"
6. 找到并选择你的博物馆项目 GitHub 仓库
7. 点击 "Connect"

### 3. 配置服务详情
在创建表单中填写以下信息：

#### 基础配置
- **Name**: `museum-backend` (或你喜欢的名称，会成为域名的一部分)
- **Region**: 选择 `Singapore` (亚洲地区，国内访问较快)
- **Branch**: `main` (或你的主分支名称)
- **Runtime**: 选择 `Python 3`

#### 构建和启动命令
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  python backend/app.py
  ```

#### 实例类型
- 选择 **Free** 实例类型（免费）

### 4. 配置环境变量
向下滚动到 "Advanced" 区域，点击展开：

1. 点击 "Add Environment Variable" 按钮
2. 添加以下环境变量：

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.13.0` |
| `CORS_ORIGINS` | `*` |
| `PORT` | `10000` |

> **说明**:
> - `PYTHON_VERSION`: 指定 Python 版本
> - `CORS_ORIGINS`: 允许跨域访问，`*` 表示允许所有域名（部署后可改为前端域名）
> - `PORT`: Render 默认使用 10000 端口

### 5. 创建服务
1. 点击页面底部的 "Create Web Service" 按钮
2. Render 会开始构建和部署
3. 在 "Events" 标签页查看部署进度
4. 等待显示 "Your service is live" 表示部署成功

### 6. 获取后端地址
部署完成后：
1. 在 Render Dashboard 中，你的服务页面顶部会显示 URL
2. 格式类似于：
   ```
   https://museum-backend.onrender.com
   ```
3. 点击 URL 可以测试访问
4. 测试健康检查接口：
   ```
   https://museum-backend.onrender.com/api/health
   ```
   如果返回 JSON 数据 `{"status": "healthy", ...}` 表示后端运行正常

**记住这个地址，前端部署时需要用到！**

### 7. 查看日志（如有问题）
如果部署失败或服务异常：
1. 进入 Render Dashboard → 你的服务
2. 点击 "Logs" 标签
3. 查看错误信息，常见问题：
   - `ModuleNotFoundError`: 依赖未安装，检查 Build Command 是否正确
   - `Address already in use`: 端口冲突，检查 PORT 环境变量
   - `No module named 'xxx'`: 缺少依赖，添加到 requirements.txt

---

## 第二步：部署前端到 Vercel

### 1. 注册 Vercel 账号
1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 "Sign Up" 注册账号
3. 选择 "Continue with GitHub" 使用 GitHub 账号登录
4. 授权 Vercel 访问你的 GitHub 仓库

### 2. 导入项目
1. 登录后进入 Vercel Dashboard
2. 点击右上角的 "Add New..." 按钮，选择 "Project"
3. 在 "Import Git Repository" 页面找到你的博物馆项目仓库
4. 点击仓库右侧的 "Import" 按钮

### 3. 配置项目
在 "Configure Project" 页面进行以下配置：

#### 基础配置
- **Project Name**: `museum-exhibition` (可自定义，会成为域名的一部分)
- **Framework Preset**: 选择 `Vite`
- **Root Directory**: 保持默认 `./` (如果项目就在仓库根目录)

#### 构建配置（通常会自动识别）
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 环境变量配置
点击 "Environment Variables" 展开配置区域，添加以下变量：

**变量 1 - API 基础地址**
- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://your-backend-url.onrender.com` (替换为你的 Render 后端地址)

**变量 2 - WebSocket 基础地址**
- **Name**: `VITE_WS_BASE_URL`
- **Value**: `https://your-backend-url.onrender.com` (与上面相同)

> **注意**: 
> - 将 `your-backend-url` 替换为你在 Render 上获得的实际域名
> - 地址格式必须是 `https://` 开头，不要加末尾的斜杠
> - 示例: `https://museum-backend.onrender.com`

### 4. 部署项目
1. 确认所有配置无误后，点击 "Deploy" 按钮
2. 等待构建完成（通常需要 1-3 分钟）
3. 构建成功后，Vercel 会显示 "Congratulations!" 页面
4. 点击 "Continue to Dashboard" 查看项目详情

### 5. 获取前端域名
1. 在 Project Dashboard 页面，找到 "Domains" 区域
2. 默认会分配一个 `.vercel.app` 域名，例如：
   ```
   https://museum-exhibition-xxx.vercel.app
   ```
3. 这个域名就是你的前端访问地址，可以分享给团队成员

### 6. 验证部署
1. 打开浏览器，访问你的 Vercel 域名
2. 检查页面是否正常加载
3. 打开浏览器开发者工具 (F12) → Network 标签
4. 检查 API 请求是否成功发送到 Render 后端

### 7. 重新部署（后续更新代码）
当你推送代码到 GitHub 主分支时，Vercel 会自动重新部署：
1. 本地修改代码并提交到 GitHub
2. Vercel 会自动检测到变更并开始构建
3. 在 Vercel Dashboard → Deployments 中查看部署状态

也可以手动触发重新部署：
1. 进入 Vercel Dashboard → 你的项目
2. 点击 "Deployments" 标签
3. 选择最新的部署，点击右侧的三个点
4. 选择 "Redeploy"

---

## 第三步：更新 Render CORS 配置（可选但推荐）

前端部署完成后，获取 Vercel 的域名（例如 `https://museum-frontend.vercel.app`），然后更新 Render 的环境变量：

```
CORS_ORIGINS=https://museum-frontend.vercel.app
```

这样可以只允许你的前端域名访问后端，提高安全性。

---

## 注意事项

### Render 免费版限制
- **休眠机制**: 15分钟无访问会自动休眠，首次访问需要等待 30-60 秒唤醒
- **每月限额**: 750 小时运行时间（足够一个服务全月运行）

### Vercel 免费版限制
- **构建次数**: 每日有限制，但个人项目通常够用
- **带宽**: 100GB/月（足够展示用途）

### 文件上传限制
Render 免费版的磁盘空间有限，如果需要上传大量文物模型文件，建议：
1. 使用云存储（如 AWS S3、阿里云 OSS）
2. 或者将模型文件放在前端 public 目录，随前端一起部署

---

## 故障排查

### 前端无法连接后端
1. 检查 Vercel 环境变量 `VITE_API_BASE_URL` 是否正确
   - 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
   - 确认 `VITE_API_BASE_URL` 的值是你的 Render 后端地址（如 `https://museum-backend.onrender.com`）
   - 确认没有多余的斜杠或空格
   
2. 检查 Render 环境变量 `CORS_ORIGINS` 是否包含前端域名
   - 进入 Render Dashboard → 你的服务 → Environment
   - 如果 `CORS_ORIGINS` 是 `*`，应该允许所有域名
   - 如果设置了特定域名，确保包含你的 Vercel 域名（如 `https://museum-exhibition.vercel.app`）
   
3. 查看浏览器控制台的网络请求错误
   - 按 F12 打开开发者工具
   - 切换到 Console 标签查看错误信息
   - 切换到 Network 标签，找到失败的请求，查看详情
   
4. 常见错误及解决方法
   - **CORS 错误**: 更新 Render 的 `CORS_ORIGINS` 环境变量
   - **404 错误**: 检查 API 地址是否正确
   - **502/503 错误**: Render 服务可能在休眠，等待 30-60 秒后刷新

### 后端部署失败
1. 检查 `requirements.txt` 是否包含所有依赖
   - 确认根目录下有 `requirements.txt` 文件
   - 确认所有 Python 包都列在其中
   
2. 查看 Render 的部署日志
   - 进入 Render Dashboard → 你的服务
   - 点击 "Logs" 标签查看详细错误
   - 常见问题：
     - 缺少依赖：在 `requirements.txt` 中添加
     - Python 版本不兼容：调整 `PYTHON_VERSION` 环境变量
     - 内存不足：免费版有 512MB 内存限制

### 模型加载失败
1. 确保模型文件已提交到 GitHub
   - 检查 `.gitignore` 是否排除了 `.onnx` 文件
   - 如果模型文件太大（>100MB），需要使用 Git LFS
   
2. 检查 `dynamic_gestures/models/` 目录是否存在
   - 确认目录结构正确
   - 确认模型文件名与代码中一致

---

## 本地开发

```bash
# 安装依赖
npm install
pip install -r requirements.txt

# 启动开发服务器
npm run start
```

前端: http://localhost:3002  
后端: http://localhost:5000
