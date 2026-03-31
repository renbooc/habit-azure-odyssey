from fastapi import APIRouter, HTTPException
from repository.supabase_client import supabase
from schema.user import AvatarUpdate

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
