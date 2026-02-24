FROM python:3.13-slim

WORKDIR /app

# 安装系统依赖（OpenCV 和 ONNX 需要）
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY backend/ ./backend/
COPY dynamic_gestures/ ./dynamic_gestures/
COPY models/ ./models/
COPY public/ ./public/

# 暴露端口
EXPOSE 10000

# 启动命令
CMD ["python", "backend/app.py"]
