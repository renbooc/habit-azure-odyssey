import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api import auth, tasks, store, stats

app = FastAPI(title="Azure Odyssey API", description="家庭任务管理与积分系统 API", version="1.0.0")

# 配置 CORS，允许前端进行跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 线上环境应该指定具体的前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(auth.router, prefix="/api/auth", tags=["用户认证"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
app.include_router(store.router, prefix="/api/store", tags=["积分商城"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计数据"])
from api import users, achievements
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(achievements.router, tags=["成就徽章"])

@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
