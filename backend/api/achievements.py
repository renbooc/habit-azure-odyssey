from fastapi import APIRouter
from repository.supabase_client import supabase

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

@router.get("/child")
def get_child_achievements(family_id: str, username: str = None):
    query = supabase.table("tasks").select("*").eq("completed", True).eq("family_id", family_id)
    if username:
        query = query.eq("username", username)
    
    try:
        res = query.execute()
        completed_tasks = res.data or []
    except Exception as e:
        completed_tasks = []
    
    total_completed = len(completed_tasks)
    
    # 统计各个类别（通过 icon 来区分）的完成次数
    task_counts = {}
    last_completion_date = "未知时间"
    if completed_tasks:
        # 简单取最新完成的任务时间（假设为今天或者按时间排序）
        import datetime
        last_completion_date = datetime.datetime.now().strftime("%Y年%m月%d日")

    for t in completed_tasks:
        icon = t.get("icon", "")
        task_counts[icon] = task_counts.get(icon, 0) + 1
        
    badges = [
        {
            "id": "first_flight",
            "title": "初次飞行",
            "sub": "完成首个习惯",
            "icon": "Rocket",
            "unlocked": total_completed >= 1
        },
        {
            "id": "night_owl",
            "title": "夜猫子",
            "sub": "就寝达标：2 次", # 降低阈值方便快速演示
            "icon": "Moon",
            "unlocked": task_counts.get("Bed", 0) >= 2
        },
        {
            "id": "ocean_heart",
            "title": "海洋之心",
            "sub": "补水大师",
            "icon": "Droplets",
            "unlocked": task_counts.get("Coffee", 0) >= 1,
            "active": True if task_counts.get("Coffee", 0) >= 1 else False
        },
        {
            "id": "book_worm",
            "title": "书虫",
            "sub": "阅读星人",
            "icon": "BookOpen",
            "unlocked": task_counts.get("BookOpen", 0) >= 1
        },
        {
            "id": "mindfulness",
            "title": "正念活力",
            "sub": "完成任意运动",
            "icon": "Star",
            "unlocked": task_counts.get("Star", 0) >= 1
        },
        {
            "id": "nature_scout",
            "title": "家务小能手",
            "sub": "完成整理任务",
            "icon": "Puzzle",
            "unlocked": task_counts.get("Puzzle", 0) >= 1
        },
        {
            "id": "foodie",
            "title": "蔬菜王者",
            "sub": "多吃蔬菜",
            "icon": "TreePine",
            "unlocked": task_counts.get("Utensils", 0) >= 1
        },
        {
            "id": "supernova",
            "title": "超新星",
            "sub": "总完成 10 个任务",
            "icon": "Lock",
            "unlocked": total_completed >= 10
        }
    ]
    
    # 统一附上获得时间
    for b in badges:
        if b["unlocked"]:
            b["earned_at"] = last_completion_date
        else:
            b["earned_at"] = None

    unlocked_count = sum(1 for b in badges if b["unlocked"])
    total_badges = len(badges)
    progress_percent = int((unlocked_count / total_badges) * 100) if total_badges > 0 else 0
    
    return {
        "unlocked_count": unlocked_count,
        "total_badges": total_badges,
        "progress_percent": progress_percent,
        "badges": badges
    }
