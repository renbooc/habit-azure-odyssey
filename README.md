---
title: Habit Odyssey
emoji: 🌌
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🌌 Azure Odyssey - 家庭任务管理与积分系统

Azure Odyssey 是一款专为家庭协作设计的**任务奖励与习惯养成系统**。通过寓教于乐的方式，帮助孩子在完成任务的过程中积累积分，并在“积分商城”兑换奖励，培养良好的生活习惯与时间管理能力。

## ✨ 功能亮点

- 📅 **智能任务管理**: 灵活创建每日挑战、长期目标，支持 AI 辅助生成的任务库。
- 💰 **积分奖励体系**: 完成任务即获积分，支持动态倍数奖励机制。
- 🏪 **积分商城**: 孩子可以用积蓄兑换自定义的“愿望单”奖励（如看电视时间、小零食等）。
- 🏅 **成就勋章系统**: 持续养成习惯可解锁独特的荣誉徽章，增强成就感。
- 📊 **成长周报**: 自动生成每周任务完成率统计，帮助家长洞察孩子的进步趋势。
- 🛡️ **分角色入口**: 区分家长管理端与孩子视角，确保管理权限与用户体验的平衡。

## 🛠️ 技术栈

- **前端**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) (Ant Design 风格 UI)
- **后端**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **数据库**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **部署**: [Hugging Face Spaces](https://huggingface.co/spaces) (Docker 容器化)

## 🚀 快速开始

### 1. 环境变量配置
在项目根目录或部署平台的 Secrets 中设置以下变量：
- `SUPABASE_URL`: 你的 Supabase 项目 API 地址。
- `SUPABASE_KEY`: 你的 Supabase Anon/Service Key。

### 2. 本地开发
```bash
# 安装依赖
npm install

# 运行前端开发服务器
npm run dev

# 启动后端 (进入 backend 目录)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

## 📦 部署到 Hugging Face

1. 在 Hugging Face 创建一个 **Docker SDK** 的 Space。
2. 将本项目所有代码上传（排除 `node_modules`）。
3. 在 Settings 中添加对应的 `SUPABASE_URL` 和 `SUPABASE_KEY`。
4. 等待构建完成，点击 App 标签页即可预览。

---
*Created with ❤️ by Antigravity*
