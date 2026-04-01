// 动态探测 API 地址：生产环境下从环境变量读取，开发环境下默认连本地 8000
export const getApiBase = () => {
    // 如果环境变量中定义了 VITE_API_BASE (Vercel 部署时设置)，则使用它
    const envApiBase = (import.meta as any).env.VITE_API_BASE;
    if (envApiBase) {
        return envApiBase;
    }

    // 本地开发环境逻辑
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000/api`;
};

export const API_URL = getApiBase();
