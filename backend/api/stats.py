from fastapi import APIRouter
from repository.supabase_client import supabase
from typing import Dict, Any, List, Optional

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
    """获取指定家庭中特定用户的子端面板数据 (注入动态称号与实时连击)"""
    from datetime import datetime, timedelta, timezone
    tz_plus8 = timezone(timedelta(hours=8))
    now_local = datetime.now(tz_plus8)
    
    # 鲁棒性：去除用户名可能存在的首尾空格
    username = username.strip()
    
    try:
        tasks_res = supabase.table("tasks").select("*").eq("family_id", family_id).eq("username", username).execute()
        tasks_data = tasks_res.data or []
        completed_tasks = [t for t in tasks_data if t.get("completed")]
        
        def safe_int(val):
            try:
                if not val: return 0
                return int(float(val))
            except:
                return 0

        # 1. 经验与等级计算
        base_xp = sum(safe_int(t.get("points")) for t in completed_tasks)
        purchases_res = supabase.table("store_purchases").select("item_id, price").eq("family_id", family_id).eq("username", username).execute()
        purchases = purchases_res.data or []
        
        # 惩罚类直接削弱总阅历(历史经验值)
        penalty_spent = sum(safe_int(p.get("price")) for p in purchases if str(p.get("item_id", "")).startswith("罚单_"))
        total_xp = max(0, base_xp - penalty_spent)
        
        # 花费(包含惩罚与正常兑换) 扣除全部积分余额
        total_spent = sum(safe_int(p.get("price")) for p in purchases)
        points = max(0, base_xp - total_spent)
        
        # 诊断日志
        # print(f"DEBUG [stats/child]: user={username}, base_xp={base_xp}, spent={total_spent}, final={points}")
        
        lvl_info = get_level_data(total_xp)
        
        # 2. 实时连击天数计算 (基于本地 +8 时区)
        completed_dates = set()
        for t in completed_tasks:
            if t.get("completed_at"):
                try:
                    # 转换 UTC 到本地，兼容可能的不规范日期后缀
                    time_str = str(t["completed_at"])
                    if time_str.endswith("Z"):
                        time_str = time_str[:-1] + "+00:00"
                    
                    dt_utc = datetime.fromisoformat(time_str)
                    dt_local = dt_utc.astimezone(tz_plus8)
                    completed_dates.add(dt_local.date())
                except Exception as e:
                    # 容忍单条任务的异形时间数据，不中断全局运算
                    import traceback
                    traceback.print_exc()
        
        streak = 0
        check_date = now_local.date()
        # 如果今天没打卡，从昨天开始算（允许今天还没来得及打卡）
        if check_date not in completed_dates:
            check_date -= timedelta(days=1)
            
        while check_date in completed_dates:
            streak += 1
            check_date -= timedelta(days=1)
            
        uncompleted = [t for t in tasks_data if not t.get("completed")]
        return {
            "level": lvl_info["level"],
            "level_title": lvl_info["title"],
            "level_emoji": lvl_info["emoji"],
            "total_xp": total_xp,
            "points": points,
            "streak_days": streak, 
            "plants_count": len(completed_tasks),
            "water_drops": total_xp, # 修正：水滴代表累计阅历，不应随消费减少
            "quick_tasks": uncompleted[:2]
        }
    except Exception as e:
        import traceback
        trace_str = traceback.format_exc()
        print(trace_str)
        with open("error_log.txt", "a", encoding="utf-8") as f:
            f.write(f"Error in child stats: {str(e)}\n{trace_str}\n")
        return {"error": str(e), "traceback": trace_str}

@router.get("/parent")
def get_parent_stats(family_id: str):
    """获取指定家庭的家长端聚合数据"""
    from datetime import datetime, timedelta, timezone
    tz_plus8 = timezone(timedelta(hours=8))
    now_local = datetime.now(tz_plus8)
    
    try:
        tasks_res = supabase.table("tasks")\
            .select("completed, completed_at")\
            .eq("family_id", family_id)\
            .execute()
            
        all_tasks = tasks_res.data or []
        total_tasks = len(all_tasks)
        completed_tasks_total = len([t for t in all_tasks if t.get("completed")])
        rate = int((completed_tasks_total / total_tasks * 100)) if total_tasks > 0 else 0
        
        weekly_map = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0} # 0:周一, 6:周日
        
        # 计算本周（自周一起）每天完成的任务数，区分家庭成员
        today = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        monday_of_this_week = today - timedelta(days=today.weekday())

        week_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekly_data = [{"name": name} for name in week_names]
        active_members = set()

        for t in all_tasks:
            if t.get("completed") and t.get("completed_at"):
                uname = t.get("username", "未知")
                try:
                    time_str = t["completed_at"]
                    if time_str.endswith("Z"):
                        time_str = time_str[:-1] + "+00:00"
                    
                    dt_utc = datetime.fromisoformat(time_str)
                    dt_local = dt_utc.astimezone(tz_plus8)
                    
                    # 只统计本周（周一到现在）的数据
                    if dt_local >= monday_of_this_week:
                        day_idx = dt_local.weekday()
                        weekly_data[day_idx][uname] = weekly_data[day_idx].get(uname, 0) + 1
                        active_members.add(uname)
                except:
                    pass
            
        return {
            "completed_tasks": completed_tasks_total,
            "completion_rate": rate,
            "weekly_data": weekly_data,
            "active_members": list(active_members),
            "recent_tasks": []
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/history")
def get_stats_history(family_id: str, username: str):
    """获取指定用户过去 7 天的统计 (修复时区漂移)"""
    from datetime import datetime, timedelta, timezone
    tz_plus8 = timezone(timedelta(hours=8))
    now_local = datetime.now(tz_plus8)
    
    try:
        # 获取 7 天前的时间点 (UTC)
        days_ago_utc = (now_local - timedelta(days=7)).astimezone(timezone.utc)
        
        tasks_res = supabase.table("tasks")\
            .select("completed_at, target_duration, task_type")\
            .eq("completed", True)\
            .eq("family_id", family_id)\
            .eq("username", username)\
            .gte("completed_at", days_ago_utc.isoformat())\
            .execute()
        
        raw_data = tasks_res.data or []
        history_map = {}
        # 生成本地日期的 7 天坐标
        for i in range(6, -1, -1):
            d_str = (now_local - timedelta(days=i)).strftime("%m-%d")
            history_map[d_str] = {"date": d_str, "minutes": 0, "count": 0}
            
        for t in raw_data:
            if not t.get("completed_at"): continue
            try:
                # 转换 UTC 时间到 本地时区 进行归类
                dt_utc = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00"))
                dt_local = dt_utc.astimezone(tz_plus8)
                date_key = dt_local.strftime("%m-%d")
                
                if date_key in history_map:
                    history_map[date_key]["count"] += 1
                    if t.get("task_type") == "timer":
                        history_map[date_key]["minutes"] += t.get("target_duration", 0)
            except: continue
        
        return list(history_map.values())
    except Exception as e:
        import traceback
        traceback.print_exc()
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
            purchases_res = supabase.table("store_purchases").select("item_id, price").eq("family_id", family_id).eq("username", uname).execute()
            
            # 使用基础经验减去任何惩处罚单，得出真实的排名总阅历
            base_xp = sum(int(t.get("points") or 10) for t in (tasks_res.data or []))
            purchases = purchases_res.data or []
            
            # 花费(包含惩罚与正常兑换) 扣除全部积分余额
            total_spent = sum(int(p.get("price") or 0) for p in purchases)
            points = max(0, base_xp - total_spent)
            
            # 总阅历仍用于计算等级
            penalty_spent = sum(int(p.get("price") or 0) for p in purchases if str(p.get("item_id", "")).startswith("罚单_"))
            total_xp = max(0, base_xp - penalty_spent)
            
            # 使用统一等级算法
            lvl_info = get_level_data(total_xp)
            
            leaderboard.append({
                "username": uname,
                "role": user["role"],
                "avatar": user.get("avatar"),
                "total_xp": total_xp,
                "points": points,
                "level": lvl_info["level"],
                "level_title": lvl_info["title"]
            })
            
        # 按【当前可用积分】进行全家排行
        leaderboard.sort(key=lambda x: x["points"], reverse=True)
        return leaderboard
    except Exception as e:
        return {"error": str(e)}

@router.get("/transactions")
def get_transactions(family_id: str, username: str):
    """获取积分变动流水记录"""
    try:
        # 获取积分增加记录 (已完成的任务)
        tasks_res = supabase.table("tasks")\
            .select("title, points, completed_at")\
            .eq("completed", True)\
            .eq("family_id", family_id)\
            .eq("username", username)\
            .execute()
            
        # 获取积分消耗记录 (商城购买 / 处分)
        purchases_res = supabase.table("store_purchases")\
            .select("item_id, price, created_at")\
            .eq("family_id", family_id)\
            .eq("username", username)\
            .execute()
            
        # 获取所有 store_items 用于将 UUID 映射为商品名称
        items_res = supabase.table("store_items").select("id, name").execute()
        item_dict = {item["id"]: item["name"] for item in (items_res.data or [])}
            
        transactions = []
        
        def safe_int(val):
            try:
                if not val: return 0
                return int(float(val))
            except:
                return 0

        for t in (tasks_res.data or []):
            if t.get("completed_at"):
                transactions.append({
                    "title": t.get("title", "完成任务"),
                    "amount": safe_int(t.get("points")),
                    "type": "earn",
                    "time": t.get("completed_at")
                })
                
        for p in (purchases_res.data or []):
            if p.get("created_at"):
                raw_item_id = p.get("item_id", "商城兑换")
                # 尝试通过 UUID 获取真实商品名称，若找不到（比如罚单直接存的是文本），则兜底使用 raw_item_id
                display_title = item_dict.get(raw_item_id, raw_item_id)
                
                transactions.append({
                    "title": display_title,
                    "amount": -safe_int(p.get("price")),
                    "type": "spend",
                    "time": p.get("created_at")
                })
                
        # 按时间倒序排序 (最新的流水在最前面)
        transactions.sort(key=lambda x: x["time"], reverse=True)
        
        return transactions
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/history/weeks")
def get_stats_weeks(family_id: str, username: Optional[str] = None):
    """获取过去 4 周的周度聚合统计"""
    from datetime import datetime, timedelta, timezone
    tz_plus8 = timezone(timedelta(hours=8))
    now_local = datetime.now(tz_plus8)
    
    try:
        # 追溯 4 周前 (28天)
        days_ago_utc = (now_local - timedelta(days=28)).astimezone(timezone.utc)
        
        query = supabase.table("tasks").select("completed_at, points").eq("completed", True).eq("family_id", family_id)
        if username:
            query = query.eq("username", username)
        
        res = query.gte("completed_at", days_ago_utc.isoformat()).execute()
        raw_data = res.data or []
        
        # 按周聚合 (0: 本周, 1: 上周 ...)
        week_stats = []
        for i in range(3, -1, -1):
            start_of_period = now_local - timedelta(days=(i+1)*7)
            end_of_period = now_local - timedelta(days=i*7)
            label = "本周" if i == 0 else f"{i}周前"
            week_stats.append({"name": label, "count": 0, "points": 0})
            
            for t in raw_data:
                dt_utc = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00"))
                dt_local = dt_utc.astimezone(tz_plus8)
                if start_of_period <= dt_local < end_of_period:
                    week_stats[-1]["count"] += 1
                    week_stats[-1]["points"] += int(t.get("points") or 0)
        
        return week_stats
    except Exception as e:
        return {"error": str(e)}

@router.get("/history/months")
def get_stats_months(family_id: str, username: Optional[str] = None):
    """获取过去 6 个月的月度趋势统计"""
    from datetime import datetime, timedelta, timezone
    from dateutil.relativedelta import relativedelta
    tz_plus8 = timezone(timedelta(hours=8))
    now_local = datetime.now(tz_plus8)
    
    try:
        # 追溯 6 个月前
        months_ago_utc = (now_local - relativedelta(months=6)).astimezone(timezone.utc)
        
        query = supabase.table("tasks").select("completed_at, points").eq("completed", True).eq("family_id", family_id)
        if username:
            query = query.eq("username", username)
            
        res = query.gte("completed_at", months_ago_utc.isoformat()).execute()
        raw_data = res.data or []
        
        month_stats = []
        for i in range(5, -1, -1):
            target_date = now_local - relativedelta(months=i)
            month_label = target_date.strftime("%Y-%m")
            month_stats.append({"name": month_label, "count": 0, "points": 0})
            
            for t in raw_data:
                dt_utc = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00"))
                dt_local = dt_utc.astimezone(tz_plus8)
                if dt_local.strftime("%Y-%m") == month_label:
                    month_stats[-1]["count"] += 1
                    month_stats[-1]["points"] += int(t.get("points") or 0)
                    
        return month_stats
    except Exception as e:
        return {"error": str(e)}
