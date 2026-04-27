from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from repository.supabase_client import supabase
from schema.trust import TrustHistoryItem, TrustResponse
from service import trust_service

router = APIRouter()


class ChangeTrustRequest(BaseModel):
    username: str
    delta: int
    reason: str = ""
    triggered_by: str = "parent"


class TrustStatusResponse(BaseModel):
    trust_score: int
    trust_level: str
    trust_level_title: str
    multiplier: float
    updated_at: Optional[str] = None
    trust_history: List[dict] = []


class TrustModifyResponse(BaseModel):
    trust_score: int
    trust_level: str
    trust_level_title: str
    multiplier: float
    updated_at: str
    delta: int
    score_before: int


@router.post("/score/change", response_model=TrustModifyResponse)
def change_trust(req: ChangeTrustRequest):
    """手动调整用户的信任分（家长操作 / 系统操作）"""
    if req.delta == 0:
        raise HTTPException(status_code=400, detail="变动值不能为 0")
    # 允许家长一次性调整到任何值，clamp 逻辑保证最终结果在 0-100 范围内

    reason = req.reason or (
        "家长手动调整" if req.triggered_by == "parent" else "系统调整"
    )
    try:
        result = trust_service.change_trust_score(
            username=req.username,
            delta=req.delta,
            reason=reason,
            triggered_by=req.triggered_by,
        )
        return TrustModifyResponse(
            trust_score=result["trust_score"],
            trust_level=result["trust_level"],
            trust_level_title=result["trust_level_title"],
            multiplier=result["multiplier"],
            updated_at=result["updated_at"],
            delta=result["delta"],
            score_before=result["score_before"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{username}", response_model=TrustStatusResponse)
def get_trust_status(username: str):
    """获取用户的信任指数状态（含等级、倍率、历史流水）"""
    try:
        info = trust_service.get_trust_info(username)
        return TrustStatusResponse(
            trust_score=info["trust_score"],
            trust_level=info["trust_level"],
            trust_level_title=info["trust_level_title"],
            multiplier=info["multiplier"],
            updated_at=info.get("updated_at"),
            trust_history=info.get("trust_history", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{username}/multiplier")
def get_points_multiplier(username: str):
    """获取用户的积分倍率（供前端计算实际获得积分）"""
    try:
        multiplier = trust_service.get_points_multiplier(username)
        return {"username": username, "multiplier": multiplier}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{username}/can-purchase")
def check_purchase_permission(username: str):
    """检查用户是否可以直接购买（无需家长审批）"""
    try:
        can_purchase = trust_service.can_purchase_directly(username)
        score = trust_service.get_trust_score(username)
        return {
            "username": username,
            "trust_score": score,
            "can_purchase_directly": can_purchase,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BatchChildTrustResponse(BaseModel):
    children: List[TrustStatusResponse] = []


@router.get("/family/{family_id}", response_model=BatchChildTrustResponse)
def get_family_trust_scores(family_id: str):
    """获取家庭内所有孩子的信任分一览（家长端使用）"""
    try:
        res = (
            supabase.table("users")
            .select("username")
            .eq("family_id", family_id)
            .eq("role", "child")
            .execute()
        )
        children = []
        for row in res.data or []:
            username = row.get("username")
            if username:
                info = trust_service.get_trust_info(username)
                children.append(
                    TrustStatusResponse(
                        trust_score=info["trust_score"],
                        trust_level=info["trust_level"],
                        trust_level_title=info["trust_level_title"],
                        multiplier=info["multiplier"],
                        updated_at=info.get("updated_at"),
                        trust_history=info.get("trust_history", []),
                    )
                )
        return BatchChildTrustResponse(children=children)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
