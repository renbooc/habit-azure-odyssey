from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    points: int
    username: Optional[str] = None
    icon: Optional[str] = "Star"
    completed: bool = False
    template_id: Optional[str] = None
    task_type: str = "checkbox"
    target_duration: int = 0
    completed_at: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    points: Optional[int] = None
    icon: Optional[str] = None
    completed: Optional[bool] = None
    task_type: Optional[str] = None
    target_duration: Optional[int] = None
    completed_at: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
