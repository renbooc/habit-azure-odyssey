from repository.supabase_client import supabase

class StoreService:
    @staticmethod
    def get_items() -> list:
        # 简单模拟返回数据，如果表存在也可以从数据库读取返回
        try:
            res = supabase.table("store_items").select("*").execute()
            if res.data:
                return res.data
        except Exception:
            pass
        return [
            {"id": "1", "name": "看动画片 30 分钟", "price": 50, "icon": "Tv"},
            {"id": "2", "name": "买个新玩具", "price": 200, "icon": "Gamepad2"}
        ]
