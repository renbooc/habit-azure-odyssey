import hashlib
import random
import string
from datetime import datetime, timezone

from repository.supabase_client import supabase
from schema.auth import LoginRequest, RegisterRequest


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
            existing_user = (
                supabase.table("users")
                .select("*")
                .ilike("username", data.username)
                .execute()
            )
            if existing_user.data and len(existing_user.data) > 0:
                raise Exception("注册失败：该用户名已被占用")

            # 2. 核心业务校验：一个 family_id 只能有一个家长
            if data.role == "parent":
                existing_parent = (
                    supabase.table("users")
                    .select("*")
                    .eq("family_id", data.family_id)
                    .eq("role", "parent")
                    .execute()
                )
                if existing_parent.data and len(existing_parent.data) > 0:
                    raise Exception(
                        f"注册失败：家庭 ID '{data.family_id}' 下已存在家长角色"
                    )

            # 3. 开启写入（parent 和 child 共用同一段插入逻辑）
            res = (
                supabase.table("users")
                .insert(
                    {
                        "username": data.username,
                        "password": hashed_password,
                        "role": data.role,
                        "family_id": data.family_id,
                        "created_at": str(datetime.now()),
                        "trust_score": 50,
                        "trust_history": [],
                    }
                )
                .execute()
            )

            if res.data:
                user = res.data[0]
                return {
                    "id": str(user.get("id")),
                    "username": user.get("username"),
                    "role": user.get("role"),
                    "family_id": user.get("family_id"),
                    "avatar": user.get("avatar"),
                    "token": "simulated_token_" + str(user.get("id")),
                }
            raise Exception("注册失败，请稍后再试")
        except Exception as e:
            if "注册失败" in str(e):
                raise e
            raise Exception(f"注册遇到错误，请确认数据库状态")

    @staticmethod
    def login(data: LoginRequest) -> dict:
        """登录校验：带回所属家庭 ID"""
        hashed_password = AuthService._hash_password(data.password)
        try:
            res = (
                supabase.table("users")
                .select("*")
                .ilike("username", data.username)
                .eq("role", data.role)
                .execute()
            )
            if res.data and len(res.data) > 0:
                user = res.data[0]
                if user.get("password") == hashed_password:
                    return {
                        "id": str(user.get("id")),
                        "username": user.get("username"),
                        "role": user.get("role"),
                        "family_id": user.get("family_id"),
                        "avatar": user.get("avatar"),
                        "token": "simulated_token_" + str(user.get("id")),
                    }
            raise Exception("账号或密码错误，请检查后再试")
        except Exception as e:
            if str(e).startswith("账号或密码"):
                raise e
            raise Exception("登录时遇到系统错误，请重试")

    @staticmethod
    def forgot_password(data) -> dict:
        """忘记密码：验证用户是否存在，生成重置码并存入数据库"""
        username = data.username.strip()
        role = data.role

        try:
            # 查找用户
            res = (
                supabase.table("users")
                .select("id, username, family_id, role")
                .ilike("username", username)
                .eq("role", role)
                .execute()
            )
            if not res.data or len(res.data) == 0:
                raise Exception("未找到该账号，请检查用户名和角色是否正确")

            user = res.data[0]
            family_id = user.get("family_id", "")

            # 生成 6 位数字重置码
            reset_code = "".join(random.choices(string.digits, k=6))
            expires_at = datetime.now(timezone.utc).isoformat()

            # 写入重置码到数据库（使用单独表或 users 表的额外字段）
            # 这里用 users 表的 reset_code 和 reset_expires_at 字段
            try:
                supabase.table("users").update(
                    {
                        "reset_code": reset_code,
                        "reset_expires_at": expires_at,
                    }
                ).eq("id", user["id"]).execute()
            except Exception:
                # 如果字段不存在，尝试用 store_purchases 作为重置码记录表
                supabase.table("store_purchases").insert(
                    {
                        "family_id": family_id,
                        "username": username,
                        "item_id": f"重置码_{reset_code}",
                        "price": 0,
                        "created_at": expires_at,
                    }
                ).execute()

            return {
                "msg": "ok",
                "username": username,
                "family_id": family_id,
                "reset_code": reset_code,
                "hint": f"已生成重置码，请联系家庭管理员获取",
            }
        except Exception as e:
            if str(e).startswith("未找到"):
                raise e
            raise Exception("系统错误，请稍后再试")

    @staticmethod
    def reset_password(data) -> dict:
        """重置密码：验证重置码并更新密码"""
        username = data.username.strip()
        reset_code = data.reset_code.strip()
        new_password = data.new_password

        if len(new_password) < 6:
            raise Exception("新密码长度至少为 6 位")

        hashed_password = AuthService._hash_password(new_password)

        try:
            # 从 store_purchases 查找重置码（主方案，兼容无 reset_code 列的情况）
            purchases_res = (
                supabase.table("store_purchases")
                .select("id, item_id, created_at")
                .eq("username", username)
                .ilike("item_id", f"重置码_{reset_code}")
                .execute()
            )
            if purchases_res.data and len(purchases_res.data) > 0:
                # 验证通过，更新密码
                supabase.table("users").update({"password": hashed_password}).ilike(
                    "username", username
                ).execute()

                # 清除已使用的重置码记录
                for p in purchases_res.data:
                    supabase.table("store_purchases").delete().eq(
                        "id", p["id"]
                    ).execute()

                return {
                    "msg": "ok",
                    "message": "密码重置成功，请使用新密码登录",
                }

            # 兜底：从 users 表 reset_code 字段验证
            res = (
                supabase.table("users")
                .select("id, reset_code")
                .ilike("username", username)
                .execute()
            )
            if res.data and len(res.data) > 0:
                user = res.data[0]
                stored_code = user.get("reset_code", "")
                if stored_code and stored_code == reset_code:
                    supabase.table("users").update(
                        {
                            "password": hashed_password,
                            "reset_code": None,
                            "reset_expires_at": None,
                        }
                    ).eq("id", user["id"]).execute()
                    return {
                        "msg": "ok",
                        "message": "密码重置成功，请使用新密码登录",
                    }

            raise Exception("重置码无效或已过期，请重新申请")
        except Exception as e:
            if str(e).startswith("重置码"):
                raise e
            raise Exception("系统错误，请稍后再试")

    @staticmethod
    def get_family_reset_codes(family_id: str) -> list:
        """获取家庭内所有待处理的重置码（家长端使用）"""
        try:
            # 从 store_purchases 查找以"重置码_"开头的记录
            res = (
                supabase.table("store_purchases")
                .select("username, item_id, created_at")
                .eq("family_id", family_id)
                .ilike("item_id", "重置码_%")
                .execute()
            )
            if not res.data:
                return []

            codes = []
            for p in res.data:
                item_id = p.get("item_id", "")
                code = item_id.replace("重置码_", "") if item_id else ""
                codes.append(
                    {
                        "username": p.get("username", ""),
                        "reset_code": code,
                        "created_at": p.get("created_at", ""),
                    }
                )
            return codes
        except Exception:
            return []
