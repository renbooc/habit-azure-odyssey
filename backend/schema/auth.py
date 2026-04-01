from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str
    family_id: str

class AuthResponse(BaseModel):
    id: str
    username: str
    role: str
    family_id: Optional[str] = None
    avatar: Optional[str] = None
    token: str
