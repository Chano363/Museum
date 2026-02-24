# 博物馆文物3D展示系统 - 部署指南

## 部署架构

- **前端**: Vercel (免费)
- **后端**: Render (免费)

---

## 第一步：部署后端到 Render

### 1. 注册账号
访问 [render.com](https://render.com)，用 GitHub 登录

### 2. 创建 Web Service
1. 点击 "New" → "Web Service"
2. 选择 "Build and deploy from a Git repository"
3. 选择你的 GitHub 仓库

### 3. 配置服务
| 配置项 | 值 |
|--------|-----|
| **Name** | `museum-backend` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python backend/app.py` |
| **Instance Type** | `Free` |

### 4. 环境变量
点击 "Advanced" 展开，添加：
```
CORS_ORIGINS=*
PORT=10000
```

### 5. 部署
点击 "Create Web Service"

---

## 第二步：部署前端到 Vercel

### 1. 注册账号
访问 [vercel.com](https://vercel.com)，用 GitHub 登录

### 2. 创建项目
1. 点击 "Add New Project"
2. 选择你的仓库

### 3. 配置
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. 环境变量
```
VITE_API_BASE_URL=https://museum-backend.onrender.com
VITE_WS_BASE_URL=https://museum-backend.onrender.com
```

### 5. 部署
点击 "Deploy"

---

## 注意事项

- Render 免费版 15 分钟无访问会休眠
- 首次访问需等待 30-60 秒唤醒
