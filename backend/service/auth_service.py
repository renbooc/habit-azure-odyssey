from repository.supabase_client import supabase
from schema.auth import LoginRequest, RegisterRequest
import hashlib
from datetime import datetime

class AuthService:
    @staticmethod
    def _hash_password(password: str) -> str:
        # 简单模拟加密，实际项目应当使用 passlib (bcrypt)
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def register(data: RegisterRequest) -> dict:
        """注册用户：支持独立用户名 + 统一家庭 ID"""
        hashed_password = AuthService._hash_password(data.password)
        try:
            # 1. 首先检查用户名冲突 (全局唯一用户名)
            existing_user = supabase.table("users").select("*").ilike("username", data.username).execute()
            if existing_user.data and len(existing_user.data) > 0:
                raise Exception("注册失败：该用户名已被占用")

            # 2. 核心业务校验：一个 family_id 只能有一个家长
            if data.role == 'parent':
                existing_parent = supabase.table("users").select("*").eq("family_id", data.family_id).eq("role", "parent").execute()
                if existing_parent.data and len(existing_parent.data) > 0:
                    raise Exception(f"注册失败：家庭 ID '{data.family_id}' 下已存在家长角色")
            
            # 3. 开启写入
            res = supabase.table("users").insert({
                "username": data.username,
                "password": hashed_password,
                "role": data.role,
                "family_id": data.family_id,
                "created_at": str(datetime.now())
            }).execute()
            
            if res.data:
                user = res.data[0]
                return {
                    "id": str(user.get("id")),
                    "username": user.get("username"),
                    "role": user.get("role"),
                    "family_id": user.get("family_id"),
                    "avatar": user.get("avatar"),
                    "token": "simulated_token_" + str(user.get("id"))
                }
            raise Exception("注册失败，请稍后再试")
        except Exception as e:
            if "注册失败" in str(e): raise e
            raise Exception(f"注册遇到错误，请确认数据库状态")

    @staticmethod
    def login(data: LoginRequest) -> dict:
        """登录校验：带回所属家庭 ID"""
        hashed_password = AuthService._hash_password(data.password)
        try:
            res = supabase.table("users").select("*").ilike("username", data.username).eq("role", data.role).execute()
            if res.data and len(res.data) > 0:
                user = res.data[0]
                if user.get("password") == hashed_password:
                    return {
                        "id": str(user.get("id")),
                        "username": user.get("username"),
                        "role": user.get("role"),
                        "family_id": user.get("family_id"),
                        "avatar": user.get("avatar"),
                        "token": "simulated_token_" + str(user.get("id"))
                    }
            raise Exception("账号或密码错误，请检查后再试")
        except Exception as e:
            if str(e).startswith("账号或密码"):
                raise e
            raise Exception("登录时遇到系统错误，请重试")
