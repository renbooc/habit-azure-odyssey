from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from schema.store import StoreItem
from service.store_service import StoreService
from repository.supabase_client import supabase

router = APIRouter()

@router.get("/items", response_model=List[StoreItem])
def get_store_items():
    return StoreService.get_items()

class AddItemRequest(BaseModel):
    name: str
    price: int
    icon: str

@router.post("/items")
def add_store_item(req: AddItemRequest):
    try:
        res = supabase.table("store_items").insert({
            "name": req.name,
            "price": req.price,
            "icon": req.icon
        }).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/items/{item_id}")
def delete_store_item(item_id: str):
    try:
        res = supabase.table("store_items").delete().eq("id", item_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PurchaseRequest(BaseModel):
    item_id: str
    price: int
    family_id: str
    username: str

@router.post("/purchase")
def purchase_item(req: PurchaseRequest):
    try:
        res = supabase.table("store_purchases").insert({
            "item_id": req.item_id,
            "price": req.price,
            "family_id": req.family_id,
            "username": req.username
        }).execute()
        if res.data:
            return {"status": "success", "message": "兑换成功！"}
        raise Exception("写入记录失败")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
