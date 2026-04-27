from typing import Optional

from pydantic import BaseModel


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


class ForgotPasswordRequest(BaseModel):
    username: str
    role: str


class ResetPasswordRequest(BaseModel):
    username: str
    reset_code: str
    new_password: str
