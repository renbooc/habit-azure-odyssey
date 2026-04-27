"""信任指数业务逻辑层"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from repository.supabase_client import supabase

# ─── 信任等级配置 ─────────────────────────────────────────────

TRUST_LEVELS = [
    {"min": 0, "max": 20, "level": "vigilance", "title": "⚠️ 待观察", "multiplier": 0.5},
    {
        "min": 21,
        "max": 40,
        "level": "sprouting",
        "title": "🌱 萌芽期",
        "multiplier": 0.8,
    },
    {"min": 41, "max": 60, "level": "stable", "title": "🌊 稳定期", "multiplier": 1.0},
    {
        "min": 61,
        "max": 80,
        "level": "trustworthy",
        "title": "💎 可信赖",
        "multiplier": 1.2,
    },
    {
        "min": 81,
        "max": 100,
        "level": "star_messenger",
        "title": "🌟 星辰信使",
        "multiplier": 1.5,
    },
]

DEFAULT_TRUST_SCORE = 50


def get_trust_level(score: int) -> Dict[str, Any]:
    """根据信任分获取对应的信任等级信息"""
    clamped = max(0, min(100, score))
    for level in TRUST_LEVELS:
        if level["min"] <= clamped <= level["max"]:
            return {
                "trust_score": clamped,
                "trust_level": level["level"],
                "trust_level_title": level["title"],
                "multiplier": level["multiplier"],
            }
    # fallback（兜底）
    return {
        "trust_score": clamped,
        "trust_level": "stable",
        "trust_level_title": "🌊 稳定期",
        "multiplier": 1.0,
    }


def _now_iso() -> str:
    """返回 UTC ISO 格式时间戳"""
    return datetime.now(timezone.utc).isoformat()


def _clamp_score(score: int) -> int:
    """将信任分限制在 0-100 之间"""
    return max(0, min(100, score))


# ─── 信任分读写 ───────────────────────────────────────────────


def get_trust_score(username: str) -> int:
    """读取用户当前的信任分，如果不存在则初始化"""
    try:
        res = (
            supabase.table("users")
            .select("trust_score")
            .eq("username", username)
            .execute()
        )
        if res.data and res.data[0].get("trust_score") is not None:
            return _clamp_score(int(res.data[0]["trust_score"]))
    except Exception:
        pass
    return DEFAULT_TRUST_SCORE


def _update_trust_score_in_db(username: str, new_score: int):
    """将信任分写入数据库"""
    now = _now_iso()
    supabase.table("users").update(
        {
            "trust_score": new_score,
            "trust_updated_at": now,
        }
    ).eq("username", username).execute()


def _append_trust_history(username: str, entry: Dict[str, Any]):
    """追加一条信任变动流水到 trust_history jsonb 字段"""
    try:
        # 读取现有历史
        res = (
            supabase.table("users")
            .select("trust_history")
            .eq("username", username)
            .execute()
        )
        history = []
        if res.data and res.data[0].get("trust_history"):
            history = list(res.data[0]["trust_history"])
        history.append(entry)
        supabase.table("users").update({"trust_history": history}).eq(
            "username", username
        ).execute()
    except Exception as e:
        print(f"[TrustService] 追加历史流水失败: {e}")


# ─── 核心 API ─────────────────────────────────────────────────


def change_trust_score(
    username: str, delta: int, reason: str, triggered_by: str = "system"
) -> Dict[str, Any]:
    """修改用户的信任分并返回最新信任状态"""
    old_score = get_trust_score(username)
    new_score = _clamp_score(old_score + delta)
    actual_delta = new_score - old_score  # 如果被 clamp 了，实际变动可能小于 delta

    # 写入数据库
    _update_trust_score_in_db(username, new_score)

    # 记录流水
    entry = {
        "delta": actual_delta,
        "score_before": old_score,
        "score_after": new_score,
        "reason": reason,
        "triggered_by": triggered_by,
        "timestamp": _now_iso(),
    }
    _append_trust_history(username, entry)

    level_info = get_trust_level(new_score)
    level_info["updated_at"] = _now_iso()
    level_info["delta"] = actual_delta
    level_info["score_before"] = old_score
    return level_info


def get_trust_info(username: str) -> Dict[str, Any]:
    """获取用户的信任分完整信息（含等级、流水）"""
    score = get_trust_score(username)
    info = get_trust_level(score)
    info["updated_at"] = None

    # 读取流水
    try:
        res = (
            supabase.table("users")
            .select("trust_history, trust_updated_at")
            .eq("username", username)
            .execute()
        )
        if res.data:
            info["trust_history"] = res.data[0].get("trust_history") or []
            info["updated_at"] = res.data[0].get("trust_updated_at")
        else:
            info["trust_history"] = []
    except Exception:
        info["trust_history"] = []

    return info


def get_points_multiplier(username: str) -> float:
    """获取积分倍率（由信任等级决定）"""
    score = get_trust_score(username)
    level_info = get_trust_level(score)
    return level_info["multiplier"]


def can_purchase_directly(username: str) -> bool:
    """检查用户是否可以直接购买（无需家长审批）"""
    score = get_trust_score(username)
    return score >= 41  # 稳定期及以上可以直接购买


# ─── 自动化事件触发器 ──────────────────────────────────────────


def on_task_completed(username: str, family_id: str) -> Optional[Dict[str, Any]]:
    """任务完成时触发的信任分变动逻辑"""
    from datetime import datetime, timezone

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        # 查询当天该用户是否还有其他已完成任务
        res = (
            supabase.table("tasks")
            .select("id, completed_at")
            .eq("username", username)
            .eq("family_id", family_id)
            .eq("completed", True)
            .gte("completed_at", f"{today}T00:00:00Z")
            .execute()
        )
        today_completed_count = len(res.data) if res.data else 0

        if today_completed_count == 1:
            # 当天第一个完成的任务：准时完成奖励
            return change_trust_score(username, 1, "✅ 准时完成任务", "system")
    except Exception as e:
        print(f"[TrustService] on_task_completed 检查失败: {e}")

    return None


def on_task_expired(username: str, title: str) -> Optional[Dict[str, Any]]:
    """任务过期未完成时触发信任分扣减"""
    return change_trust_score(username, -3, f"⏰ 任务「{title}」过期未完成", "system")


def on_streak_milestone(username: str, streak_days: int) -> Optional[Dict[str, Any]]:
    """连续完成任务里程碑奖励"""
    if streak_days > 0 and streak_days % 3 == 0:
        return change_trust_score(
            username, 2, f"🔥 连续完成任务 {streak_days} 天", "system"
        )
    if streak_days > 0 and streak_days % 7 == 0:
        return change_trust_score(
            username, 5, f"🏆 连续完成任务 {streak_days} 天（周里程碑）", "system"
        )
    return None


def on_parent_penalize(username: str, amount: int) -> Optional[Dict[str, Any]]:
    """家长处罚时触发信任分扣减"""
    return change_trust_score(
        username, -5, f"📋 因违规被家长处罚 (-{amount} 积分)", "parent"
    )


def on_parent_revert_penalty(username: str) -> Optional[Dict[str, Any]]:
    """家长撤销处罚时恢复部分信任分"""
    return change_trust_score(username, 3, "🔄 家长撤销了处罚记录", "parent")


def on_store_purchase_approved(username: str) -> Optional[Dict[str, Any]]:
    """积分兑换前征求同意 → 信任奖励"""
    return change_trust_score(username, 3, "🎁 兑换前主动征求家长同意", "child")
