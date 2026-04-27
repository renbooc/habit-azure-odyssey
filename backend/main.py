import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

# 打印环境变量加载情况 (不打印完整 Key，只检查存不存在)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

from api import achievements, auth, stats, store, tasks, trust, users

app = FastAPI(
    title="Azure Odyssey API", description="家庭任务管理与积分系统 API", version="1.0.0"
)

# 配置 CORS，允许前端进行跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(auth.router, prefix="/api/auth", tags=["用户认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
app.include_router(store.router, prefix="/api/store", tags=["积分商城"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计数据"])
app.include_router(achievements.router, tags=["成就徽章"])
app.include_router(trust.router, prefix="/api/trust", tags=["信任指数"])

# 如果 dist 目录存在（生产环境下），则挂载静态文件服务
if os.path.exists("../dist"):
    app.mount("/", StaticFiles(directory="../dist", html=True), name="static")
elif os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == "__main__":
    # 使用 8000 作为本地默认端口，Hugging Face 会自动传递 PORT 环境变量
    port = int(os.getenv("PORT", 8000))
    print(f"Starting server... port: {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
