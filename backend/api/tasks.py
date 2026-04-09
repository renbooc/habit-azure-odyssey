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
def get_all_tasks(family_id: str, username: Optional[str] = None, all_family: bool = False):
    """获取指定家庭的任务列表（支持当日挑战自动生成）"""
    try:
        # 1. 如果明确指定了 username，则触发该用户的当日挑战生成
        # 不论是孩子还是家长，进入大厅都应该有自己的任务副本
        if username:
            import datetime
            # 使用 UTC 零点作为判重的日期基准 (与 supabase 存储一致)
            today_str = datetime.datetime.now().strftime("%Y-%m-%d")
            # 获取需要生成的每日挑战模板
            dailies = supabase.table("task_templates").select("*").eq("is_daily", True).execute()
            
            if dailies.data:
                # 检查该特定用户今天是否已经领过这些任务
                existing_today = supabase.table("tasks")\
                    .select("template_id")\
                    .eq("family_id", family_id)\
                    .eq("username", username)\
                    .not_.is_("template_id", "null")\
                    .gte("created_at", f"{today_str}T00:00:00Z")\
                    .execute()
                    
                existing_ids = {t["template_id"] for t in existing_today.data if t.get("template_id")} if existing_today.data else set()
     
                to_insert = []
                for tmpl in dailies.data:
                    if tmpl["id"] not in existing_ids:
                        to_insert.append({
                            "family_id": family_id,
                            "username": username, # 绑定到当前用户
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
                
        # 2. 调用服务层：如果 all_family 为 True (通常是家长视图)，则忽略 username 过滤，返回全家任务
        # 否则 (孩子视图)，如果传了 username 则只返回该用户的
        filter_username = None if all_family else username
        return TaskService.get_tasks(family_id, filter_username)
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
