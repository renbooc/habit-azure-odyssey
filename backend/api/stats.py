from fastapi import APIRouter
from repository.supabase_client import supabase
from typing import Dict, Any, List

router = APIRouter()

@router.get("/child")
def get_child_stats():
    """获取孩子端面板数据"""
    try:
        # Get all tasks for both points calculation and quick-start recommendations
        tasks_res = supabase.table("tasks").select("*").execute()
        tasks_data = tasks_res.data or []
        
        # 积分逻辑：显式累加，确保 null 值被替换为默认 10 分
        completed_tasks = [t for t in tasks_data if t.get("completed")]
        gross_points = 0
        for t in completed_tasks:
            try:
                # Force points to integer, handle None and string cases
                p_val = t.get("points")
                if p_val is None:
                    gross_points += 10
                else:
                    gross_points += int(p_val)
            except (ValueError, TypeError):
                gross_points += 10 # Fallback 
        
        # 计算已被消耗的积分
        purchases_res = supabase.table("store_purchases").select("price").execute()
        spent_points = sum(p.get("price", 0) for p in (purchases_res.data or []))
        
        points = max(0, gross_points - spent_points)
        
        # 获取未完成的任务作为快速开始推荐
        uncompleted_tasks = [t for t in tasks_data if not t.get("completed")]
        quick_tasks = uncompleted_tasks[:2]
        
        return {
            "level": points // 100 + 1,
            "streak_days": 12, # 暂模拟连续天数
            "plants_count": len(completed_tasks),
            "water_drops": points,
            "points": points,
            "quick_tasks": quick_tasks
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/parent")
def get_parent_stats():
    """获取家长端聚合数据"""
    from datetime import datetime, timedelta
    try:
        # 1. 最近完成的任务
        recent_res = supabase.table("tasks")\
            .select("*")\
            .filter("completed", "eq", True)\
            .order("created_at", desc=True)\
            .limit(5)\
            .execute()
        
        # 2. 本周任务概况
        all_tasks = supabase.table("tasks").select("completed").execute()
        total = len(all_tasks.data) if all_tasks.data else 0
        completed = len([t for t in all_tasks.data if t.get("completed")]) if all_tasks.data else 0
        rate = int((completed / total * 100)) if total > 0 else 0
        
        # 3. 模拟周数据 (可与 history 逻辑整合)
        weekly_data = []
        days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        for d in days:
            import random
            weekly_data.append({"name": d, "value": random.randint(1, 10)})
            
        return {
            "completed_tasks": completed,
            "completion_rate": rate,
            "weekly_data": weekly_data,
            "recent_tasks": recent_res.data or []
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/history")
def get_stats_history():
    """获取过去 7 天的专注时长与完成量统计"""
    from datetime import datetime, timedelta
    try:
        # 获取过去 7 天的任务
        days_ago = datetime.now() - timedelta(days=7)
        # 过滤已完成且有完成时间的项目
        tasks_res = supabase.table("tasks")\
            .select("completed_at, target_duration, task_type")\
            .eq("completed", True)\
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
            # 处理 Supabase 返回的时间字符串
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
