# 博物馆文物3D展示系统 - 部署指南

## 部署架构

- **前端**: Vercel (免费)
- **后端**: Render + Docker (免费)

---

## 第一步：部署后端到 Render（Docker 方式）

### 1. 注册 Render 账号
1. 访问 [https://render.com](https://render.com)
2. 使用 GitHub 账号登录

### 2. 创建 Web Service
1. 进入 Render Dashboard
2. 点击 "New" → "Web Service"
3. 选择 **"Deploy an existing image from a registry"** → 不对，选 **"Build and deploy from a Git repository"**
4. 选择你的 GitHub 仓库

### 3. 配置服务
- **Name**: `museum-backend`
- **Region**: `Singapore`
- **Branch**: `main`
- **Runtime**: 选择 **Docker**
- **Dockerfile Path**: `./Dockerfile`

### 4. 环境变量
添加以下环境变量：
```
PORT=10000
CORS_ORIGINS=*
```

### 5. 创建并部署
点击 "Create Web Service"，Render 会自动构建 Docker 镜像并部署。

---

## 第二步：部署前端到 Vercel

### 1. 注册 Vercel 账号
访问 [vercel.com](https://vercel.com)，用 GitHub 登录

### 2. 导入项目
1. 点击 "Add New Project"
2. 选择你的仓库
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### 3. 环境变量
```
VITE_API_BASE_URL=https://museum-backend.onrender.com
VITE_WS_BASE_URL=https://museum-backend.onrender.com
```

### 4. 部署
点击 "Deploy"

---

## 本地测试 Docker

```bash
# 构建镜像
docker build -t museum-backend .

# 运行容器
docker run -p 10000:10000 -e PORT=10000 museum-backend

# 测试
http://localhost:10000/api/health
```

---

## 注意事项

- Render 免费版 15 分钟无访问会休眠
- 首次访问需要等待 30-60 秒唤醒
- 每月 750 小时免费额度
