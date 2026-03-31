from repository.supabase_client import supabase
from schema.tasks import TaskCreate, TaskUpdate
from typing import List, Dict, Any
from datetime import datetime

class TaskService:
    @staticmethod
    def get_tasks() -> List[Dict[str, Any]]:
        response = supabase.table("tasks").select("*").order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def get_task(task_id: str) -> Dict[str, Any]:
        response = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if response.data:
            return response.data[0]
        return None

    @staticmethod
    def create_task(task: TaskCreate) -> Dict[str, Any]:
        data = {}
        for k, v in task.model_dump().items():
            if v is not None:
                if isinstance(v, datetime):
                    data[k] = v.isoformat()
                else:
                    data[k] = v
        
        response = supabase.table("tasks").insert(data).execute()
        if response.data:
            return response.data[0]
        return {}

    @staticmethod
    def update_task(task_id: str, task: TaskUpdate) -> Dict[str, Any]:
        update_data = {}
        for k, v in task.model_dump().items():
            if v is not None:
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
        response = supabase.table("tasks").delete().eq("id", task_id).execute()
        return len(response.data) > 0
