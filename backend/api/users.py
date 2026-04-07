from fastapi import APIRouter, HTTPException
from repository.supabase_client import supabase
from schema.user import AvatarUpdate
from pydantic import BaseModel

router = APIRouter()

@router.patch("/{username}/avatar")
def update_avatar(username: str, req: AvatarUpdate):
    try:
        res = supabase.table("users").update({"avatar": req.avatar}).eq("username", username).execute()
        if res.data:
            return {"msg": "ok", "avatar": req.avatar}
        raise Exception("更新失败，未找到该用户")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PenalizeRequest(BaseModel):
    family_id: str
    penalty_name: str
    amount: int
    reason: str = ""

@router.post("/{username}/penalize")
def penalize_user(username: str, req: PenalizeRequest):
    try:
        # Instead of tasks, we use store_purchases to deduct points cleanly 
        # without reducing their lifetime gross xp (points = gross - spent)
        item_label = f"罚单_{req.penalty_name}"
        if req.reason:
            item_label += f" - {req.reason}"
            
        res = supabase.table("store_purchases").insert({
            "item_id": item_label,
            "price": req.amount,
            "family_id": req.family_id,
            "username": username
        }).execute()
        
        if res.data:
            return {"msg": "ok", "penalty": req.penalty_name, "deducted": req.amount}
        raise Exception("惩处记录失败")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
