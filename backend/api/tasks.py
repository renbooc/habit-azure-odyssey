from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from schema.tasks import TaskCreate, TaskUpdate, TaskResponse
from service.task_service import TaskService
from repository.supabase_client import supabase

router = APIRouter()

class TemplateCreate(BaseModel):
    title: str
    points: int
    icon: str
    is_daily: bool = False
    task_type: str = "checkbox"
    target_duration: int = 0

@router.get("/templates", response_model=List[dict])
def get_task_templates():
    try:
        res = supabase.table("task_templates").select("*").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates", response_model=dict)
def create_task_template(template: TemplateCreate):
    try:
        res = supabase.table("task_templates").insert({
            "title": template.title,
            "points": template.points,
            "icon": template.icon,
            "is_daily": template.is_daily,
            "task_type": template.task_type,
            "target_duration": template.target_duration
        }).execute()
        if not res.data:
            raise Exception("Failed to sync template")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/templates/{template_id}")
def delete_task_template(template_id: str):
    try:
        res = supabase.table("task_templates").delete().eq("id", template_id).execute()
        return {"msg": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[TaskResponse])
def get_all_tasks():
    """获取所有任务列表"""
    try:
        # Lazy spawn daily missions
        import datetime
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        dailies = supabase.table("task_templates").select("*").eq("is_daily", True).execute()
        if dailies.data:
            existing_today = supabase.table("tasks").select("template_id").not_.is_("template_id", "null").gte("created_at", f"{today_str}T00:00:00Z").execute()
            existing_ids = set()
            if existing_today.data:
                existing_ids = {t["template_id"] for t in existing_today.data if t.get("template_id")}

            to_insert = []
            for tmpl in dailies.data:
                if tmpl["id"] not in existing_ids:
                    to_insert.append({
                        "title": tmpl["title"],
                        "points": tmpl["points"],
                        "icon": tmpl["icon"],
                        "completed": False,
                        "template_id": tmpl["id"],
                        "task_type": tmpl.get("task_type", "checkbox"),
                        "target_duration": tmpl.get("target_duration", 0)
                    })
            if to_insert:
                supabase.table("tasks").insert(to_insert).execute()
                
        return TaskService.get_tasks()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    """获取单个任务详情"""
    try:
        task = TaskService.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate):
    """创建新任务"""
    try:
        return TaskService.create_task(task)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_status(task_id: str, task: TaskUpdate):
    """更新任务状态或信息"""
    try:
        # If completing, set completed_at
        if task.completed is True:
            from datetime import datetime, timezone
            task.completed_at = datetime.now(timezone.utc)
            
        updated = TaskService.update_task(task_id, task)
        if not updated:
            raise HTTPException(status_code=404, detail="Task not found")
        return updated
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{task_id}")
def delete_task(task_id: str):
    """删除指定任务"""
    try:
        success = TaskService.delete_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"msg": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
