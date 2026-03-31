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
        """注册用户"""
        hashed_password = AuthService._hash_password(data.password)
        try:
            res = supabase.table("users").insert({
                "username": data.username,
                "password": hashed_password,
                "role": data.role,
                "created_at": str(datetime.now())
            }).execute()
            if res.data:
                user = res.data[0]
                return {
                    "id": str(user.get("id")),
                    "username": user.get("username"),
                    "role": user.get("role"),
                    "avatar": user.get("avatar"),
                    "token": "simulated_token_" + str(user.get("id"))
                }
            raise Exception("注册失败，该用户名可能已被占用")
        except Exception as e:
            # 如果是自定义抛出的异常，直接抛出，否则统一报中文错误
            if str(e).startswith("注册失败"):
                raise e
            raise Exception(f"注册遇到错误，请换一个用户名尝试")

    @staticmethod
    def login(data: LoginRequest) -> dict:
        """登录校验"""
        hashed_password = AuthService._hash_password(data.password)
        try:
            res = supabase.table("users").select("*").eq("username", data.username).eq("role", data.role).execute()
            if res.data and len(res.data) > 0:
                user = res.data[0]
                if user.get("password") == hashed_password:
                    return {
                        "id": str(user.get("id")),
                        "username": user.get("username"),
                        "role": user.get("role"),
                        "avatar": user.get("avatar"),
                        "token": "simulated_token_" + str(user.get("id"))
                    }
            raise Exception("账号或密码错误，请检查后再试")
        except Exception as e:
            if str(e).startswith("账号或密码"):
                raise e
            raise Exception("登录时遇到系统错误，请重试")
