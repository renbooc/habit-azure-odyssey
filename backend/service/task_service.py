from repository.supabase_client import supabase
from schema.tasks import TaskCreate, TaskUpdate
from typing import List, Dict, Any, Optional
from datetime import datetime

class TaskService:
    @staticmethod
    def get_tasks(family_id: str, username: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取任务列表：强制个人隐私隔离，且只看当天的任务"""
        from datetime import datetime
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        query = supabase.table("tasks")\
            .select("*")\
            .eq("family_id", family_id)\
            .gte("created_at", f"{today_str}T00:00:00Z") # 仅过滤今日任务 (UTC 逻辑参考 api/tasks.py)
        
        if username:
            # 无论家长还是孩子，只要在个人大厅，都只看自己的
            query = query.eq("username", username)
            
        response = query.order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def get_task(task_id: str) -> Dict[str, Any]:
        response = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if response.data:
            return response.data[0]
        return None

    @staticmethod
    def create_task(task: TaskCreate) -> Dict[str, Any]:
        """创建并全员分发任务：确保每个人都有一份属于自己的平行副本"""
        # 1. 查找家庭全员
        members_res = supabase.table("users").select("username").eq("family_id", task.family_id).execute()
        
        if members_res.data:
            to_insert = []
            for member in members_res.data:
                data = task.model_dump()
                data["username"] = member["username"] # 分发给包括家长在内的所有人
                # 转换 datetime 为 iso 格式
                for k, v in data.items():
                    if isinstance(v, datetime): data[k] = v.isoformat()
                to_insert.append(data)
            res = supabase.table("tasks").insert(to_insert).execute()
            return res.data[0] if res.data else {}
        else:
            # 保底逻辑
            data = task.model_dump()
            for k,v in data.items():
                if isinstance(v, datetime): data[k]=v.isoformat()
            res = supabase.table("tasks").insert(data).execute()
            return res.data[0] if res.data else {}

    @staticmethod
    def update_task(task_id: str, task: TaskUpdate) -> Dict[str, Any]:
        """更新任务状态：禁止修改归属 (username/family_id)"""
        update_data = {}
        for k, v in task.model_dump().items():
            if v is not None and k not in ['username', 'family_id']:
                if isinstance(v, datetime):
                    update_data[k] = v.isoformat()
                else:
                    update_data[k] = v
        
        response = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        if response.data:
            return response.data[0]
        return {}

    @staticmethod
    def delete_task(task_id: str) -> bool:
        # 使用 select() 后接 delete() 有时能保证返回数据，或者直接执行 delete
        # 为了兼容性，我们执行删除并检查是否有数据返回
        response = supabase.table("tasks").delete().eq("id", task_id).execute()
        # 即使返回数据为空，但在 Supabase 中没报错通常意味着任务不存在或已删除
        # 我们这里通过 data 是否存在来判定
        return response.data is not None
