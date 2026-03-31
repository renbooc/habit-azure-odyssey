from pydantic import BaseModel

class StoreItem(BaseModel):
    id: str
    name: str
    price: int
    icon: str
