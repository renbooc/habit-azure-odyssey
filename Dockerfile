# 第一阶段：打包前端 (Node.js)
FROM node:18 AS frontend-build
WORKDIR /app
# 只拷贝 package.json，不拷贝 package-lock.json，强制全新解析 Linux 下的二进制包
COPY package.json ./
RUN npm install
COPY . .
# 设置构建所需的环境变量 (让前端知道请求同域名的 /api)
ENV VITE_API_BASE=/api
RUN npm run build

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
