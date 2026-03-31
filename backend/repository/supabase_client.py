import os
from supabase import create_client, Client

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    """获取 Supabase 客户端实例"""
    if not url or not key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY is missing. API calls will fail.")
    return create_client(url, key)

supabase: Client = get_supabase_client()
