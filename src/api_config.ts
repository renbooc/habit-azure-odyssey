// 动态探测 API 地址
export const getApiBase = () => {
    // 1. 如果是 Hugging Face 或 Vercel 部署环境，直接返回相对路径 /api，不带端口号
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return "/api";
    }

    // 2. 本地开发环境逻辑：默认连 8000 端口
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000/api`;
};

export const API_URL = getApiBase();
