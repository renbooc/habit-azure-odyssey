from fastapi import APIRouter
from repository.supabase_client import supabase
from typing import Dict, Any, List

router = APIRouter()

@router.get("/child")
def get_child_stats(username: str):
    """获取指定用户的孩子端面板数据"""
    try:
        # 只获取当前用户的任务
        tasks_res = supabase.table("tasks").select("*").eq("username", username).execute()
        tasks_data = tasks_res.data or []
        
        # 积分逻辑：统计该用户的完成情况
        completed_tasks = [t for t in tasks_data if t.get("completed")]
        gross_points = 0
        for t in completed_tasks:
            p_val = t.get("points")
            gross_points += int(p_val) if p_val is not None else 10
        
        # 统计该用户的购买消耗
        purchases_res = supabase.table("store_purchases").select("price").eq("username", username).execute()
        spent_points = sum(p.get("price", 0) for p in (purchases_res.data or []))
        
        points = max(0, gross_points - spent_points)
        
        # 获取该用户的未完成任务作为推荐
        uncompleted_tasks = [t for t in tasks_data if not t.get("completed")]
        quick_tasks = uncompleted_tasks[:2]
        
        return {
            "level": points // 100 + 1,
            "streak_days": 1, # 新用户默认为 1
            "plants_count": len(completed_tasks),
            "water_drops": points,
            "points": points,
            "quick_tasks": quick_tasks
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/parent")
def get_parent_stats(username: str):
    """获取指定家长的聚合数据"""
    try:
        # 1. 该用户最近完成的任务
        recent_res = supabase.table("tasks")\
            .select("*")\
            .filter("completed", "eq", True)\
            .eq("username", username)\
            .order("created_at", desc=True)\
            .limit(5)\
            .execute()
        
        # 2. 该用户本周任务概况
        all_tasks = supabase.table("tasks").select("completed").eq("username", username).execute()
        total = len(all_tasks.data) if all_tasks.data else 0
        completed = len([t for t in all_tasks.data if t.get("completed")]) if all_tasks.data else 0
        rate = int((completed / total * 100)) if total > 0 else 0
        
        # 3. 统计过去 7 天每天的完成量 (这里暂保持简单逻辑)
        weekly_data = [{"name": "周一", "value": 0}, {"name": "周二", "value": 0}, {"name": "周三", "value": 0}, {"name": "周四", "value": 0}, {"name": "周五", "value": 0}, {"name": "周六", "value": 0}, {"name": "周日", "value": 0}]
            
        return {
            "completed_tasks": completed,
            "completion_rate": rate,
            "weekly_data": weekly_data,
            "recent_tasks": recent_res.data or []
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/history")
def get_stats_history(username: str):
    """获取指定用户过去 7 天的专注时长与完成量统计"""
    from datetime import datetime, timedelta
    try:
        # 只获取当前用户的任务
        days_ago = datetime.now() - timedelta(days=7)
        tasks_res = supabase.table("tasks")\
            .select("completed_at, target_duration, task_type")\
            .eq("completed", True)\
            .eq("username", username)\
            .gte("completed_at", days_ago.isoformat())\
            .execute()
        
        raw_data = tasks_res.data or []
        
        # 初始化过去 7 天的容器
        history_map = {}
        for i in range(6, -1, -1):
            d_str = (datetime.now() - timedelta(days=i)).strftime("%m-%d")
            history_map[d_str] = {"date": d_str, "minutes": 0, "count": 0}
            
        for t in raw_data:
            if not t.get("completed_at"):
                continue
            try:
                dt = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00"))
                date_key = dt.strftime("%m-%d")
                if date_key in history_map:
                    history_map[date_key]["count"] += 1
                    if t.get("task_type") == "timer":
                        history_map[date_key]["minutes"] += t.get("target_duration", 0)
            except:
                continue
        
        return list(history_map.values())
    except Exception as e:
        return {"error": str(e)}
