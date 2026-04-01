from fastapi import APIRouter
from repository.supabase_client import supabase
from typing import Dict, Any, List

router = APIRouter()

def get_level_data(points: int) -> Dict[str, Any]:
    """核心等级与称号联动算法"""
    if points < 100:
        return {"level": 1, "title": "海滩拾贝新手", "emoji": "🐚"}
    elif points < 500:
        return {"level": 2, "title": "浅海乘风船员", "emoji": "🚣"}
    elif points < 1000:
        return {"level": 3, "title": "深蓝潜航精英", "emoji": "🤿"}
    elif points < 2000:
        return {"level": 4, "title": "巨浪勇士先锋", "emoji": "🔱"}
    elif points < 5000:
        return {"level": 5, "title": "海洋荣耀提督", "emoji": "🚢"}
    else:
        return {"level": 6, "title": "永恒蔚蓝领主", "emoji": "👑"}

@router.get("/child")
def get_child_stats(family_id: str, username: str):
    """获取指定家庭中特定用户的子端面板数据 (注入动态称号)"""
    try:
        tasks_res = supabase.table("tasks").select("*").eq("family_id", family_id).eq("username", username).execute()
        tasks_data = tasks_res.data or []
        completed_tasks = [t for t in tasks_data if t.get("completed")]
        
        gross = sum(int(t.get("points", 10)) for t in completed_tasks)
        purchases_res = supabase.table("store_purchases").select("price").eq("family_id", family_id).eq("username", username).execute()
        spent = sum(p.get("price", 0) for p in (purchases_res.data or []))
        points = max(0, gross - spent)
        
        # 应用动态等级系统 (基于永不降低的总阅历 gross)
        lvl_info = get_level_data(gross)
        
        uncompleted = [t for t in tasks_data if not t.get("completed")]
        return {
            "level": lvl_info["level"],
            "level_title": lvl_info["title"],
            "level_emoji": lvl_info["emoji"],
            "total_xp": gross,
            "points": points, # 这里依然是余额，用于商城购买
            "streak_days": 1, 
            "plants_count": len(completed_tasks),
            "water_drops": points,
            "quick_tasks": uncompleted[:2]
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/parent")
def get_parent_stats(family_id: str):
    """获取指定家庭的家长端聚合数据"""
    try:
        # 1. 家族最近完成的任务 (按完成时间排序)
        recent_res = supabase.table("tasks")\
            .select("*")\
            .eq("completed", True)\
            .eq("family_id", family_id)\
            .order("completed_at", desc=True)\
            .limit(5)\
            .execute()
        
        # 2. 家族本周任务概况
        all_tasks = supabase.table("tasks").select("completed").eq("family_id", family_id).execute()
        total = len(all_tasks.data) if all_tasks.data else 0
        completed = len([t for t in all_tasks.data if t.get("completed")]) if all_tasks.data else 0
        rate = int((completed / total * 100)) if total > 0 else 0
        
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
def get_stats_history(family_id: str, username: str):
    """获取指定用户过去 7 天的统计 (隔离模式)"""
    from datetime import datetime, timedelta
    try:
        days_ago = datetime.now() - timedelta(days=7)
        tasks_res = supabase.table("tasks")\
            .select("completed_at, target_duration, task_type")\
            .eq("completed", True)\
            .eq("family_id", family_id)\
            .eq("username", username)\
            .gte("completed_at", days_ago.isoformat())\
            .execute()
        
        raw_data = tasks_res.data or []
        history_map = {}
        for i in range(6, -1, -1):
            d_str = (datetime.now() - timedelta(days=i)).strftime("%m-%d")
            history_map[d_str] = {"date": d_str, "minutes": 0, "count": 0}
            
        for t in raw_data:
            if not t.get("completed_at"): continue
            try:
                dt = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00"))
                date_key = dt.strftime("%m-%d")
                if date_key in history_map:
                    history_map[date_key]["count"] += 1
                    if t.get("task_type") == "timer":
                        history_map[date_key]["minutes"] += t.get("target_duration", 0)
            except: continue
        
        return list(history_map.values())
    except Exception as e:
        return {"error": str(e)}

@router.get("/leaderboard")
def get_family_leaderboard(family_id: str):
    """获取排行榜 (按总阅历排序，展示荣誉)"""
    try:
        users_res = supabase.table("users").select("username, role, avatar").eq("family_id", family_id).execute()
        all_users = users_res.data or []
        leaderboard = []
        for user in all_users:
            uname = user["username"]
            tasks_res = supabase.table("tasks").select("points").eq("family_id", family_id).eq("username", uname).eq("completed", True).execute()
            
            # 使用总阅历进行排名
            total_xp = sum(int(t.get("points", 10)) for t in (tasks_res.data or []))
            
            # 使用统一等级算法
            lvl_info = get_level_data(total_xp)
            
            leaderboard.append({
                "username": uname,
                "role": user["role"],
                "avatar": user.get("avatar"),
                "total_xp": total_xp,
                "level": lvl_info["level"],
                "level_title": lvl_info["title"]
            })
            
        # 按【总阅历】从高到低排序，确立家庭地位
        leaderboard.sort(key=lambda x: x["total_xp"], reverse=True)
        return leaderboard
    except Exception as e:
        return {"error": str(e)}
