# 第一阶段：打包前端 (使用 Node 20 提高兼容性)
FROM node:20 AS frontend-build
WORKDIR /app
# 强制不使用缓存并全新解析
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
# 设置构建所需的环境变量
ENV VITE_API_BASE=/api
ENV NODE_ENV=production
# 使用 npx 运行并跳过所有潜在的外部类型检查干扰
RUN npx vite build

# 第二阶段：运行后端 (Python)
FROM python:3.10-slim
WORKDIR /app/backend

# 设置系统时间为北京时间 (对习惯养成应用很重要)
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 安装后端依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制打包好的前端代码
COPY --from=frontend-build /app/dist /app/dist

# 复制后端业务代码
COPY backend/ .

# 设置环境变量 (HF Space 会在运行时注入 Secrets，这里设置默认值)
ENV PORT=7860

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
