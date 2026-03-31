from pydantic import BaseModel

class AvatarUpdate(BaseModel):
    avatar: str
