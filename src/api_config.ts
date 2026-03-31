// 动态探测 API 地址：前端访问哪个 host，后端就去连哪个 host 的 8000 端口
// (解决了局域网手机访问 localhost:8000 无法连通的问题)
export const getApiBase = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000/api`;
};

export const API_URL = getApiBase();
